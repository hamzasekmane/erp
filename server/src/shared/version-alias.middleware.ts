import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/**
 * Serves the documented `/api/v1/...` contract on top of the `/api/...`
 * routes the frontend is configured with (NEXT_PUBLIC_API_URL ends in `/api`).
 */
@Injectable()
export class VersionAliasMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.url.startsWith("/api/v1/")) {
      req.url = `/api/${req.url.slice("/api/v1/".length)}`;
    }
    next();
  }
}
