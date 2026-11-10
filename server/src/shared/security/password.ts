import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt (memory-hard, available in Node core).
 * Format: scrypt$N$r$p$<salt-b64>$<hash-b64>
 * Documented deviation from Argon2id to avoid native build dependencies;
 * parameters are tuned to ~50–80 ms on the target hardware.
 */
const N = 16_384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Le mot de passe doit contenir au moins 8 caractères");
  if (!/[A-Za-z]/.test(password)) issues.push("Le mot de passe doit contenir une lettre");
  if (!/[0-9]/.test(password)) issues.push("Le mot de passe doit contenir un chiffre");
  return issues;
}
