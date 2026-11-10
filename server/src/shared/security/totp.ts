import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Minimal RFC 4648 base32 (no padding) + RFC 6238 TOTP implementation.
 * Authenticator apps (Google Authenticator, Authy, 1Password, FreeOTP) all
 * speak this, so no third-party dependency is needed.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** 20 random bytes → 32 base32 characters (160-bit secret, the RFC default). */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/** HOTP value for an explicit counter (RFC 4226). */
export function hotp(secret: string, counter: number, digits = 6): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buffer.writeUInt32BE(counter % 2 ** 32, 4);
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totpCode(secret: string, timestampMs = Date.now(), stepSeconds = 30, digits = 6): string {
  return hotp(secret, Math.floor(timestampMs / 1000 / stepSeconds), digits);
}

export type VerifyOptions = {
  window?: number;
  stepSeconds?: number;
  digits?: number;
  now?: number;
};

/**
 * Verifies a 6-digit code, accepting `window` steps of clock drift on each side
 * (±1 step = ±30s by default). Comparison is constant-time.
 */
export function verifyTotp(secret: string, code: string, options: VerifyOptions = {}): boolean {
  const { window = 1, stepSeconds = 30, digits = 6, now = Date.now() } = options;
  const normalized = String(code ?? "").replace(/\s+/g, "");
  if (!new RegExp(`^\\d{${digits}}$`).test(normalized)) return false;
  const counter = Math.floor(now / 1000 / stepSeconds);
  const provided = Buffer.from(normalized, "utf8");
  let valid = false;
  for (let offset = -window; offset <= window; offset += 1) {
    let expected: Buffer;
    try {
      expected = Buffer.from(hotp(secret, counter + offset, digits), "utf8");
    } catch {
      return false; // undecodable secret: never authenticate
    }
    if (expected.length === provided.length && timingSafeEqual(expected, provided)) valid = true;
  }
  return valid;
}

/** `otpauth://totp/...` URI rendered as a QR code by the frontend. */
export function otpauthUrl(params: { secret: string; account: string; issuer: string; digits?: number; period?: number }): string {
  const { secret, account, issuer, digits = 6, period = 30 } = params;
  const label = encodeURIComponent(`${issuer}:${account}`);
  const query = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(digits),
    period: String(period),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
