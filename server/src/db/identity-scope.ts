import { sql } from "drizzle-orm";
import { getDb, runAppRole } from "./client";

/**
 * Pre-tenant identity lookups.
 *
 * Every function here delegates to a SECURITY DEFINER function from migration
 * 0019 and returns IDENTIFIERS ONLY — never a name, email, role or hash. That
 * constraint is deliberate and is the reason these are safe to expose to the
 * application role: the caller learns "which tenant does this credential belong
 * to", then re-reads the row inside `runTenant(tenantId, ...)` where RLS applies
 * normally.
 *
 * Keeping them in one file makes the complete set of reads that bypass RLS
 * auditable at a glance. If a new one is ever needed, it belongs here and needs
 * the same justification.
 *
 * Each function proves ownership with a secret the caller already holds:
 *   - email      (login / password reset request)
 *   - token hash (refresh / password reset)
 *   - signed MFA challenge subject (MFA verify)
 */

type Row = Record<string, unknown>;

/**
 * The helpers are granted to the application role, not to the login role, so the
 * call runs with that role assumed. No tenant is set: if a helper were ever
 * replaced by a plain read, it would return nothing rather than every tenant.
 */
async function one(statement: ReturnType<typeof sql>): Promise<Row | null> {
  const result = await runAppRole(() => getDb().execute(statement));
  const rows = Array.isArray(result)
    ? result
    : ((result as { rows?: unknown[] })?.rows ?? []);
  return (rows[0] as Row) ?? null;
}

export type IdentityScope = { userId: string; tenantId: string };

/** Email -> the tenant of a live user. Null when the account does not exist. */
export async function resolveLoginScope(email: string): Promise<IdentityScope | null> {
  const row = await one(sql`select * from public.resolve_login_scope(${email})`);
  if (!row) return null;
  return { userId: String(row.user_id), tenantId: String(row.tenant_id) };
}

/** User id -> the tenant. Used by the MFA challenge, which carries no tenant. */
export async function resolveLoginScopeById(userId: string): Promise<IdentityScope | null> {
  const row = await one(sql`select * from public.resolve_user_scope(${userId})`);
  if (!row) return null;
  return { userId: String(row.user_id), tenantId: String(row.tenant_id) };
}

export type RefreshScope = { sessionId: string; userId: string; tenantId: string };

/** Refresh-token hash -> the session and its tenant. The hash is the credential. */
export async function resolveRefreshScope(tokenHash: string): Promise<RefreshScope | null> {
  const row = await one(sql`select * from public.resolve_refresh_scope(${tokenHash})`);
  if (!row) return null;
  return {
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    tenantId: String(row.tenant_id),
  };
}

export type PasswordResetScope = {
  tokenId: string;
  userId: string;
  tenantId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

/** Reset-token hash -> the token row's identifiers and expiry. */
export async function resolvePasswordResetScope(tokenHash: string): Promise<PasswordResetScope | null> {
  const row = await one(sql`select * from public.resolve_password_reset_scope(${tokenHash})`);
  if (!row) return null;
  return {
    tokenId: String(row.token_id),
    userId: String(row.user_id),
    tenantId: String(row.tenant_id),
    expiresAt: new Date(String(row.expires_at)),
    usedAt: row.used_at ? new Date(String(row.used_at)) : null,
  };
}
