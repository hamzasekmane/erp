import { sql } from "drizzle-orm";
import { currentTenantId, getDb } from "../db/client";
import { auditLogs } from "../db/schema";
import { newId } from "./ids";

export type AuditInput = {
  tenantId?: string | null;
  actorType?: "user" | "system" | "api_key";
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

/**
 * Append-only audit trail. Must be awaited inside the business transaction.
 *
 * `audit_logs` has FORCE RLS with `tenant_id = current_setting('app.tenant_id')`,
 * so the row's own tenant must be the active scope. Two cases need handling,
 * both found by running against a real non-superuser PostgreSQL server:
 *
 *  * no tenant at all (a failed login, an invalid public token): the setting is
 *    unset, the comparison is never true, and the row was rejected — security
 *    events were being lost. Migration 0018 permits exactly these rows.
 *
 *  * a tenant, but called OUTSIDE a tenant scope — registration is the case that
 *    matters, since its transaction has already committed by the time the event
 *    is written. Here the row is written in its own transaction with the tenant
 *    set transaction-locally, so it commits on its own and cannot leak the
 *    setting to the next request on the pooled connection.
 *
 * Inside a tenant scope `getDb()` already returns the scoped handle, which is
 * itself a transaction, so this nests as a savepoint and still commits with the
 * caller.
 */
export async function audit(input: AuditInput): Promise<void> {
  if (!input.tenantId) {
    await getDb().insert(auditLogs).values(rowOf(input));
    return;
  }
  // Already inside that tenant's scope: the setting is in force for the whole
  // surrounding transaction, so opening another one is both unnecessary and
  // harmful — a nested `begin` on the pinned connection would commit the
  // caller's transaction early, before the business writes are done.
  if (currentTenantId() === input.tenantId) {
    await getDb().insert(auditLogs).values(rowOf(input));
    return;
  }
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${input.tenantId!}, true)`);
    await tx.insert(auditLogs).values(rowOf(input));
  });
}

function rowOf(input: AuditInput) {
  return {
    id: newId(),
    tenantId: input.tenantId ?? null,
    actorType: input.actorType ?? "user",
    actorId: input.actorId ?? null,
    action: input.action,
    entity: input.entity ?? null,
    entityId: input.entityId ?? null,
    before: (input.before ?? null) as never,
    after: (input.after ?? null) as never,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    requestId: input.requestId ?? null,
  };
}
