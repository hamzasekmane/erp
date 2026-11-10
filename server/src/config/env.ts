import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional().default(""),
  DATABASE_SSL: bool,
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  PGLITE_DATA_DIR: z.string().default(".data/pglite"),
  JWT_SECRET: z
    .string()
    .min(24, "JWT_SECRET must be at least 24 characters")
    .default("dev-only-secret-change-me-please-123456"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).default(3600),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  TRUST_PROXY: bool,
  // Production hardening
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  ENABLE_API_DOCS: bool,
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  RATE_LIMIT_DISABLED: bool,
  RUN_MIGRATIONS_ON_BOOT: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => value === undefined || value === "true" || value === "1"),
  // Mail: without SMTP_URL, messages are written to MAIL_OUTBOX_DIR (dev only).
  SMTP_URL: z.string().optional().default(""),
  MAIL_FROM: z.string().default("ERP <no-reply@erp.local>"),
  MAIL_OUTBOX_DIR: z.string().default(".data/mail"),
  OUTBOX_INTERVAL_MS: z.coerce.number().int().min(0).default(5000),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  OUTBOX_DISABLED: bool,
  // Uploads
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).default(10),
  // Antivirus (clamd INSTREAM) + stockage
  CLAMAV_HOST: z.string().optional().default(""),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65535).default(3310),
  // true (défaut): refus de l'upload si clamd est configuré mais injoignable en production
  AV_FAIL_CLOSED: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  DEFAULT_STORAGE_QUOTA_MB: z.coerce.number().int().min(1).default(500),
  // Payments — Chargily Pay (Algeria: EDAHABIA / CIB)
  APP_PUBLIC_URL: z.string().optional().default(""),
  CHARGILY_MODE: z.enum(["test", "live"]).default("test"),
  CHARGILY_SECRET_KEY: z.string().optional().default(""),
  CHARGILY_WEBHOOK_URL: z.string().optional().default(""),
  SECRETS_ENCRYPTION_KEY: z.string().optional().default(""),
  // Multi-factor authentication (TOTP)
  MFA_ISSUER: z.string().default("Velora ERP"),
  MFA_REQUIRE_SUPERADMIN: bool,
  // Scheduled maintenance
  MAINTENANCE_INTERVAL_MS: z.coerce.number().int().min(0).default(6 * 60 * 60 * 1000),
  MAINTENANCE_DISABLED: bool,
  MAINTENANCE_TOKEN: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const useEmbeddedDb = !env.DATABASE_URL;

const productionProblems: string[] = [];
if (isProd) {
  if (env.JWT_SECRET.startsWith("dev-only")) productionProblems.push("JWT_SECRET must be set to a strong random value");
  if (!env.DATABASE_URL) productionProblems.push("DATABASE_URL is required (the embedded PGlite database is for development only)");
  if (env.CORS_ORIGINS.trim() === "" || env.CORS_ORIGINS.includes("*")) productionProblems.push("CORS_ORIGINS must list explicit origins");
  if (env.CHARGILY_SECRET_KEY) {
    if (env.CHARGILY_MODE === "live" && !env.CHARGILY_SECRET_KEY.startsWith("live_")) {
      productionProblems.push("CHARGILY_SECRET_KEY must be a live key when CHARGILY_MODE=live");
    }
    if (env.CHARGILY_MODE === "test" && !env.CHARGILY_SECRET_KEY.startsWith("test_")) {
      productionProblems.push("CHARGILY_SECRET_KEY must be a test key when CHARGILY_MODE=test");
    }
    if (!env.SECRETS_ENCRYPTION_KEY) {
      productionProblems.push("SECRETS_ENCRYPTION_KEY is required to store payment gateway credentials");
    }
  }
  if (env.MFA_REQUIRE_SUPERADMIN && !env.SECRETS_ENCRYPTION_KEY) {
    productionProblems.push("SECRETS_ENCRYPTION_KEY is required to store MFA secrets");
  }
  if (env.SMTP_URL === "" && env.MAIL_OUTBOX_DIR.startsWith(".data")) {
    // Not fatal: the outbox keeps messages until SMTP is configured.
    console.warn("[config] SMTP_URL is empty: e-mails will be queued to MAIL_OUTBOX_DIR instead of being delivered.");
  }
}
if (productionProblems.length > 0) {
  throw new Error(`Invalid production configuration:\n- ${productionProblems.join("\n- ")}`);
}

if (env.RUN_MIGRATIONS_ON_BOOT === false && isProd) {
  console.info("[config] RUN_MIGRATIONS_ON_BOOT=false: run `npm run db:migrate` during deployment.");
}

export const apiDocsEnabled = env.ENABLE_API_DOCS || !isProd;
