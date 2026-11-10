import { randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-value-at-least-24-chars-long";
process.env.PGLITE_DATA_DIR = `.data/test-${randomUUID()}`;
process.env.ACCESS_TOKEN_TTL_SECONDS = "3600";
process.env.OUTBOX_DISABLED = "true";
process.env.MAINTENANCE_DISABLED = "true";
process.env.MAIL_OUTBOX_DIR = `${process.env.PGLITE_DATA_DIR}/mail`;
process.env.UPLOAD_DIR = `${process.env.PGLITE_DATA_DIR}/uploads`;
process.env.MAINTENANCE_TOKEN = "test-maintenance-token";
process.env.APP_URL = "http://localhost:3000";
process.env.REFRESH_TOKEN_TTL_DAYS = "30";
process.env.SECRETS_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.MFA_ISSUER = "Velora ERP Test";
