import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { env, isProd } from "./config/env";
import { ensureBaselinePlans } from "./db/bootstrap";
import { assertArabicSearchWorks } from "./db/guards";
import { assertPreTenantFunctionsUsable, assertRlsEffective, closeDb, initDb } from "./db/client";
import { migrate } from "./db/migrate";
import { ApiExceptionFilter } from "./shared/exception.filter";
import { TenantScopeInterceptor } from "./shared/security/tenant-scope.interceptor";
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
  // Wraps each authenticated request in its tenant's RLS scope.
  app.useGlobalInterceptors(new TenantScopeInterceptor());

  const rls = await assertRlsEffective().catch((error: unknown) => ({
    enforced: false,
    reason: `RLS check failed: ${error instanceof Error ? error.message : String(error)}`,
  }));
  if (!rls.enforced) {
    Logger.warn(
      `[security] Row-Level Security is NOT effective: ${rls.reason}. Tenant isolation relies on application predicates only.`,
      "Bootstrap",
    );
  } else {
    Logger.log(`[security] ${rls.reason}`, "Bootstrap");
  }

  // The pre-tenant lookups (login, refresh, password reset, public invoice
  // token) are SECURITY DEFINER functions. They only see rows past FORCE RLS if
  // the role that OWNS them bypasses RLS — otherwise every login fails with 401
  // and nothing else looks wrong. The migration role is therefore required to be
  // a superuser or BYPASSRLS; asserted here because the mistake is silent.
  {
    const preTenant = await assertPreTenantFunctionsUsable().catch((error: unknown) => ({
      usable: false,
      reason: `check failed: ${error instanceof Error ? error.message : String(error)}`,
    }));
    if (!preTenant.usable) {
      Logger.warn(`[security] Pre-tenant auth lookups may fail: ${preTenant.reason}`, "Bootstrap");
    }
  }

  // Arabic search correctness, checked at boot rather than discovered by users.
  //
  // pg_trgm builds trigrams from WORD characters, and it decides what a word
  // character is via the database's ctype. In a database created with the `C`
  // collation it falls back to isalnum() on the raw UTF-8 bytes, so every Arabic
  // letter is classified as a separator: `show_trgm('دراجة')` is EMPTY and
  // `similarity()` always returns 0. The failure is silent — no error, no empty
  // index, just search that never matches — which is why it is asserted here.
  //
  // Reproduced on PostgreSQL 16.2: the same build and the same extension give
  // 0.529 for ('دراجة هوائية', 'دراجه هوائيه') on a C.UTF-8 database and 0 on a
  // C one.
  const arabicSearch = await assertArabicSearchWorks().catch((error: unknown) => ({
    ok: false,
    reason: `check failed: ${error instanceof Error ? error.message : String(error)}`,
  }));
  if (!arabicSearch.ok) {
    Logger.warn(
      `[search] Arabic search will return no results: ${arabicSearch.reason}. ` +
        "Create the database with LC_COLLATE/LC_CTYPE = C.UTF-8 (or a UTF-8 locale) " +
        "and re-run migrations.",
      "Bootstrap",
    );
  } else {
    Logger.log(`[search] ${arabicSearch.reason}`, "Bootstrap");
  }

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
