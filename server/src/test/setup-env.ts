import { randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-value-at-least-24-chars-long";
process.env.PGLITE_DATA_DIR = `.data/test-${randomUUID()}`;
process.env.ACCESS_TOKEN_TTL_SECONDS = "3600";
process.env.REFRESH_TOKEN_TTL_DAYS = "30";
