import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors";

/** Maps every thrown error to the frozen API error envelope (docs §9.2). */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId;

    if (exception instanceof AppError) {
      res.status(exception.status).json({
        success: false,
        error_code: exception.code,
        message: exception.message,
        ...(exception.errors ? { errors: exception.errors } : {}),
        ...(exception.data !== undefined ? { data: exception.data } : {}),
        request_id: requestId,
      });
      return;
    }

    if (exception instanceof ZodError) {
      res.status(400).json({
        success: false,
        error_code: "VALIDATION_ERROR",
        message: "Données invalides",
        errors: exception.issues.map((issue) => ({
          field: issue.path.join(".") || "_root",
          message: issue.message,
        })),
        request_id: requestId,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
      res.status(status).json({
        success: false,
        error_code: status === 404 ? "NOT_FOUND" : status === 401 ? "UNAUTHORIZED" : "HTTP_ERROR",
        message: Array.isArray(message) ? message.join(", ") : message,
        request_id: requestId,
      });
      return;
    }

    console.error(`[${requestId}] unhandled error`, exception);
    res.status(500).json({
      success: false,
      error_code: "INTERNAL_ERROR",
      message: "Une erreur interne est survenue",
      request_id: requestId,
    });
  }
}
