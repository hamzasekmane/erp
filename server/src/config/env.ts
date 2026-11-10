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
  PGLITE_DATA_DIR: z.string().default(".data/pglite"),
  JWT_SECRET: z
    .string()
    .min(24, "JWT_SECRET must be at least 24 characters")
    .default("dev-only-secret-change-me-please-123456"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).default(3600),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  TRUST_PROXY: bool,
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

if (isProd && env.JWT_SECRET.startsWith("dev-only")) {
  throw new Error("JWT_SECRET must be configured in production");
}
