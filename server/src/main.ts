import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { env, isProd } from "./config/env";
import { ensureBaselinePlans } from "./db/bootstrap";
import { closeDb, initDb } from "./db/client";
import { migrate } from "./db/migrate";
import { ApiExceptionFilter } from "./shared/exception.filter";
import { requestIdMiddleware } from "./shared/http";
import { rateLimitMiddleware } from "./shared/security/rate-limit.middleware";

async function bootstrap() {
  await initDb();
  if (env.RUN_MIGRATIONS_ON_BOOT) await migrate();
  await ensureBaselinePlans();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: isProd ? ["error", "warn", "log"] : ["error", "warn", "log", "debug"],
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", env.TRUST_PROXY ? env.TRUST_PROXY_HOPS : false);
  expressApp.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  // Keep the raw payload: payment webhooks are signed over the exact bytes.
  app.use(express.json({ limit: "1mb", verify: (req, _res, buf) => { (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf); } }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.setGlobalPrefix("api");
  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);

  const allowedOrigins = env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    maxAge: 86_400,
    exposedHeaders: ["X-Request-Id", "Retry-After", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  });

  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.PORT, "0.0.0.0");
  Logger.log(
    `API listening on http://0.0.0.0:${env.PORT}/api (alias /api/v1, env=${env.NODE_ENV}, db=${env.DATABASE_URL ? "postgres" : "pglite"})`,
    "Bootstrap",
  );

  const shutdown = async (signal: string) => {
    Logger.log(`${signal} received, shutting down`, "Bootstrap");
    try {
      await app.close();
    } finally {
      await closeDb();
      process.exit(0);
    }
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  Logger.error(error, undefined, "Bootstrap");
  process.exit(1);
});
