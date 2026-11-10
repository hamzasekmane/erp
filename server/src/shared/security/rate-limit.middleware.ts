import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const WINDOW_MS = 60_000;
const PUBLIC_PATHS = new Set(["/api/health", "/api/health/live", "/api/health/ready", "/api/v1/health"]);

/**
 * Fixed-window per-IP limiter. Deliberately in-process: with several replicas,
 * move the counter to Redis (same interface) when horizontal scaling is needed.
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (env.RATE_LIMIT_DISABLED) return next();
  if (PUBLIC_PATHS.has(req.path)) return next();

  const now = Date.now();
  if (now - lastSweep > WINDOW_MS) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
    lastSweep = now;
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const key = `${ip}:${req.method === "POST" || req.method === "PUT" || req.method === "PATCH" ? "write" : "read"}`;
  const limit = req.method === "GET" ? env.RATE_LIMIT_PER_MINUTE * 2 : env.RATE_LIMIT_PER_MINUTE;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Remaining", limit - 1);
    return next();
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader("RateLimit-Remaining", remaining);
  res.setHeader("RateLimit-Reset", Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json({
      success: false,
      error_code: "RATE_LIMITED",
      message: "Trop de requêtes, veuillez réessayer plus tard.",
      request_id: (req as Request & { requestId?: string }).requestId,
    });
    return;
  }

  return next();
}
