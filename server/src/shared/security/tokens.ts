import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../../config/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type AccessClaims = {
  sub: string;
  tid: string;
  role: string;
  ver: number;
  typ: "access";
};

export async function signAccessToken(claims: Omit<AccessClaims, "typ">): Promise<string> {
  return new SignJWT({ ...claims, typ: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setJti(randomBytes(12).toString("base64url"))
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (payload.typ !== "access" || typeof payload.sub !== "string" || typeof payload.tid !== "string") {
    throw new Error("Invalid access token payload");
  }
  return {
    sub: payload.sub,
    tid: payload.tid,
    role: String(payload.role ?? "user"),
    ver: Number(payload.ver ?? 0),
    typ: "access",
  };
}

export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Short-lived ticket issued after a correct password when MFA is enabled. */
export async function signMfaChallenge(userId: string): Promise<string> {
  return new SignJWT({ typ: "mfa" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setJti(randomBytes(12).toString("base64url"))
    .setExpirationTime("5m")
    .sign(secret);
}

export async function verifyMfaChallenge(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (payload.typ !== "mfa" || typeof payload.sub !== "string") throw new Error("Invalid MFA challenge");
  return { sub: payload.sub };
}
