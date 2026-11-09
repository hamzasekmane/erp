import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors";

export type Pagination = { total: number; page: number; limit: number; pages: number };

export function ok<T>(data: T, message?: string) {
  return message === undefined ? { success: true as const, data } : { success: true as const, data, message };
}

export function okList<T>(items: T[], pagination: Pagination) {
  return { success: true as const, data: items, pagination };
}

export function parsePagination(query: Record<string, unknown>, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(query.page) || 1);
  const requested = Number(query.limit) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requested));
  return { page, limit, offset: (page - 1) * limit };
}

export function paginate(total: number, page: number, limit: number): Pagination {
  return { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
  (req as Request & { requestId: string }).requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}

function zodToFieldErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "_root",
    message: issue.message,
  }));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId;

  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      error_code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      ...(error.data !== undefined ? { data: error.data } : {}),
      request_id: requestId,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error_code: "VALIDATION_ERROR",
      message: "Données invalides",
      errors: zodToFieldErrors(error),
      request_id: requestId,
    });
    return;
  }

  const anyError = error as { status?: number; message?: string; type?: string };
  if (typeof anyError?.status === "number" && anyError.status < 500) {
    res.status(anyError.status).json({
      success: false,
      error_code: "BAD_REQUEST",
      message: anyError.message ?? "Requête invalide",
      request_id: requestId,
    });
    return;
  }

  console.error(`[${requestId}] unhandled error`, error);
  res.status(500).json({
    success: false,
    error_code: "INTERNAL_ERROR",
    message: "Une erreur interne est survenue.",
    request_id: requestId,
  });
}
