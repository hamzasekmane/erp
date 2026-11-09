import { sql } from "drizzle-orm";
import { getDb } from "../db/client";

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in (result as Record<string, unknown>)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

/**
 * Gapless, per-tenant document numbers. The increment is a single atomic
 * upsert, so concurrent requests cannot read the same value.
 * Format: `<PREFIX>-<YYYY>-0001`.
 */
export async function documentNumber(tenantId: string, docType: string, prefix: string): Promise<string> {
  const period = String(new Date().getFullYear());
  const result = await getDb().execute(sql`
    insert into number_sequences (tenant_id, doc_type, period, next_value)
    values (${tenantId}, ${docType}, ${period}, 2)
    on conflict (tenant_id, doc_type, period)
    do update set next_value = number_sequences.next_value + 1
    returning next_value
  `);
  const rows = extractRows(result);
  const value = Number(rows[0]?.next_value ?? 1);
  return `${prefix}-${period}-${String(value).padStart(4, "0")}`;
}
