import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env, isProd } from "../../config/env";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

/**
 * Derives a 32-byte key from `SECRETS_ENCRYPTION_KEY`.
 * A 64-char hex string or a base64 string is used as-is; any other value is
 * hashed so that a weak/verbose passphrase still yields a valid key.
 */
function encryptionKey(): Buffer {
  const raw = env.SECRETS_ENCRYPTION_KEY.trim();
  if (!raw) {
    throw new Error(
      "SECRETS_ENCRYPTION_KEY is not configured: payment gateway credentials cannot be stored securely.",
    );
  }
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const base64 = Buffer.from(raw, "base64");
  if (base64.length === 32 && base64.toString("base64").replace(/=+$/, "") === raw.replace(/=+$/, "")) return base64;
  return createHash("sha256").update(raw).digest();
}

export function secretsConfigured(): boolean {
  return env.SECRETS_ENCRYPTION_KEY.trim().length > 0;
}

/** Encrypts a secret as `v1:<iv>:<tag>:<payload>` (all base64url). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, ivPart, tagPart, dataPart] = payload.split(":");
  if (version !== VERSION || !ivPart || !tagPart || !dataPart) {
    throw new Error("Unsupported secret payload format");
  }
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}

/**
 * Development fallback so the feature can be exercised without extra setup.
 * Production refuses to fall back (see `assertSecretsReadyForProduction`).
 */
export function assertSecretsReadyForProduction(): void {
  if (isProd && !secretsConfigured()) {
    console.warn("[config] SECRETS_ENCRYPTION_KEY is empty: online payment setup will be rejected.");
  }
}
