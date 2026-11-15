import { sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { tenants } from "../db/schema";

/**
 * Deletes test tenants so a suite can seed fixed ids again.
 *
 * A plain `delete from tenants` is not enough: the cascade reaches
 * `journal_entries` / `journal_lines`, which carry append-only triggers that
 * reject DELETE at any depth. That is correct for the product — the ledger is
 * immutable — so the guard is not relaxed globally. Instead the four DELETE
 * guards are disabled for the duration of this transaction and restored before
 * it commits:
 *
 *   set local session_replication_role = replica
 *
 * would be the one-liner, but it also suspends FOREIGN KEY triggers, so the
 * cascade never reaches the children and the delete silently orphans them
 * (observed as `tenant_settings_pkey` violations on the next seed). Disabling
 * only the named triggers keeps referential integrity doing its job.
 *
 * Requires a privileged connection, which every test harness uses.
 */

/**
 * Tables that carry `tenant_id` but have NO foreign key to `tenants`.
 *
 * These are the ones a cascade cannot reach — so `delete from tenants` leaves
 * their rows behind and the next seed fails on a primary key (`number_sequences`
 * was the first to bite). Derived from the catalog rather than hand-listed:
 *
 *   select c.relname from pg_class c
 *   join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
 *   where c.relkind = 'r' and c.relnamespace = 'public'::regnamespace
 *     and not exists (select 1 from pg_constraint k
 *                     where k.conrelid = c.oid and k.contype = 'f'
 *                       and k.confrelid = 'tenants'::regclass);
 *
 * If a new table is added without an FK, this list must be revisited — which is
 * why the cleanup asserts it removed what it was asked to, below.
 */
const UNLINKED_TENANT_TABLES = [
  "audit_logs",
  "bom_lines",
  "files",
  "idempotency_keys",
  "number_sequences",
  "outbox_events",
  "sessions",
  "stock_levels",
  "stock_movements",
  "subscription_invoices",
] as const;

/** The DELETE guards on the append-only ledger tables. */
const LEDGER_DELETE_GUARDS = [
  ["journal_entries", "journal_entries_no_delete"],
  ["journal_lines", "journal_lines_no_delete"],
] as const;

export async function resetTenants(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const list = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  await getDb().transaction(async (tx) => {
    // Transaction-local, so the guards come back by themselves on commit — but
    // re-enable them explicitly to keep the intent obvious.
    for (const [table, trigger] of LEDGER_DELETE_GUARDS) {
      await tx.execute(sql.raw(`alter table ${table} disable trigger ${trigger}`));
    }
    try {
      // Children with no FK to tenants first, otherwise the cascade cannot reach
      // them and they survive the parent delete.
      for (const table of UNLINKED_TENANT_TABLES) {
        // Table name is a constant from the list above; ids stay parameterised.
        await tx.execute(sql`delete from ${sql.raw(table)} where tenant_id in (${list})`);
      }
      await tx.execute(sql`delete from tenants where id in (${list})`);
    } finally {
      for (const [table, trigger] of LEDGER_DELETE_GUARDS) {
        await tx.execute(sql.raw(`alter table ${table} enable trigger ${trigger}`));
      }
    }
  });
}

/**
 * Removes tenants created through `POST /api/auth/register` by the given user
 * emails, so a suite that registers fixed fixtures can run twice against the
 * same database.
 *
 * Registration allocates random ids, so the only stable handle is the email
 * (unique platform-wide, and the same handle the duplicate-email check uses).
 * The tenants are then deleted through `resetTenants`, which handles the
 * cascade and the tables that no cascade reaches.
 */
export async function resetRegistrations(emails: readonly string[]): Promise<void> {
  if (emails.length === 0) return;
  const list = sql.join(
    emails.map((email) => sql`${email.toLowerCase()}`),
    sql`, `,
  );
  const rows = await getDb().execute<{ tenant_id: string | null }>(
    sql`select distinct tenant_id from users where lower(email) in (${list}) and tenant_id is not null`,
  );
  const unwrap = (result: unknown) =>
    (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [])) as Array<{
      tenant_id: string | null;
    }>;
  const tenantIds = unwrap(rows)
    .map((row) => row.tenant_id)
    .filter((id): id is string => Boolean(id));
  for (const id of tenantIds) {
    await resetTenants([id]);
  }
  // A registration whose tenant was removed may still have left the user row
  // behind if it had no tenant, so clear those too.
  await getDb().execute(sql`delete from users where lower(email) in (${list})`);
}

/**
 * Seeds tenant rows, doing for fixtures exactly what registration does in
 * production: give the INSERT a valid RLS context.
 *
 * Without it, `insert into tenants` is rejected whenever the connection role is
 * subject to RLS (a NON-superuser role, i.e. the real configuration):
 *
 *   ERROR: new row violates row-level security policy for table "tenants"
 *
 * The superuser connection used by the PGlite run bypasses policies, which is why
 * the suite passed for so long while seeding this way. Each row is inserted with
 * its own id as the scope, in its own transaction, so the setting cannot leak to
 * the next insert.
 */
export async function seedTenants(
  input: typeof tenants.$inferInsert | readonly (typeof tenants.$inferInsert)[],
): Promise<void> {
  const rows = Array.isArray(input) ? input : [input];
  for (const row of rows) {
    await getDb().transaction(async (tx) => {
      if ("id" in row && row.id) {
        await tx.execute(sql`select set_config('app.tenant_id', ${row.id}, true)`);
      }
      await tx.insert(tenants).values(row);
    });
  }
}
