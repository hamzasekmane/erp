import { getDb } from "../db/client";
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

/** Append-only audit trail. Must be awaited inside the business transaction. */
export async function audit(input: AuditInput): Promise<void> {
  await getDb()
    .insert(auditLogs)
    .values({
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
    });
}
