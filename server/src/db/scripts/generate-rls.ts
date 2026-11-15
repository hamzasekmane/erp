/**
 * Generates the Row-Level Security migration.
 *
 * Exists as a script rather than hand-written SQL because the policy set is
 * mechanical and must stay in lockstep with the schema: 33 tables carry their
 * own `tenant_id`, 8 child tables reach the tenant through a parent, and 2 are
 * global reference data. Hand-typing 42 policies invites the one omission that
 * becomes a data breach.
 *
 * Run: npm run db:generate-rls
 * Output: drizzle/0007_rls.sql (also printed to stdout for review)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../schema";

/** Tables with their own `tenant_id` column. */
const DIRECT = [
  "tenant_settings",
  "users",
  "sessions",
  "subscriptions",
  "subscription_invoices",
  "clients",
  "client_groups",
  "client_notes",
  "categories",
  "taxes",
  "products",
  "stock_levels",
  "stock_movements",
  "number_sequences",
  "invoices",
  "payments",
  "payment_gateways",
  "gateway_checkouts",
  "payment_methods",
  "notifications",
  "api_keys",
  "files",
  "audit_logs",
  "outbox_events",
  "idempotency_keys",
  "departments",
  "employees",
  "employee_contracts",
  "leave_requests",
  "attendance_records",
  "support_tickets",
  "archive_documents",
  "uploads",
] as const;

/**
 * Child tables without `tenant_id`. The policy joins to the parent, so the
 * tenant boundary is inherited. Verified empirically that leaving these
 * unprotected lets one tenant read another's rows and attach rows to another
 * tenant's parent.
 */
const VIA_PARENT: Array<{ table: string; parent: string; fk: string }> = [
  { table: "client_group_members", parent: "client_groups", fk: "group_id" },
  { table: "invoice_items", parent: "invoices", fk: "invoice_id" },
  { table: "invoice_status_history", parent: "invoices", fk: "invoice_id" },
  { table: "invoice_public_tokens", parent: "invoices", fk: "invoice_id" },
  { table: "payment_allocations", parent: "payments", fk: "payment_id" },
  { table: "payment_refunds", parent: "payments", fk: "payment_id" },
  { table: "payment_gateway_secrets", parent: "payment_gateways", fk: "gateway_id" },
  { table: "support_messages", parent: "support_tickets", fk: "ticket_id" },
  { table: "password_reset_tokens", parent: "users", fk: "user_id" },
];

/** Global reference data: readable by every authenticated tenant, never tenant-scoped. */
const GLOBAL = ["plans"] as const;

/**
 * Tables added after 0007. Each batch gets its own generated migration, because
 * 0007 has already run in environments and a migration is immutable once
 * applied. A new table with no policy is silently unprotected, and the drift
 * guard above cannot tell "deliberately excluded" from "forgotten", so every
 * wave is emitted explicitly.
 */
const WAVES: Array<{ tag: string; direct: string[]; viaParent: Array<{ table: string; parent: string; fk: string }> }> = [
  {
    tag: "0010_rls_ledger",
    direct: ["accounts", "account_closure", "journal_entries", "journal_lines", "accounting_periods"],
    viaParent: [],
  },
  {
    // A wave must not edit 0007: it is already applied in every environment.
    tag: "0013_rls_bom",
    direct: ["bom_lines"],
    viaParent: [],
  },
];

const APP_ROLE = "erp_app";
const SETTING = "current_setting('app.tenant_id', true)";

function directPolicy(table: string): string {
  const policy = `${table}_tenant_isolation`;
  return `
-- ${table}
ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "${policy}" ON "${table}";
CREATE POLICY "${policy}" ON "${table}"
  USING ("tenant_id" = ${SETTING})
  WITH CHECK ("tenant_id" = ${SETTING});`;
}

function parentPolicy(table: string, parent: string, fk: string): string {
  const policy = `${table}_tenant_isolation`;
  return `
-- ${table} (tenant inherited from ${parent}.${fk})
ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "${policy}" ON "${table}";
CREATE POLICY "${policy}" ON "${table}"
  USING (EXISTS (
    SELECT 1 FROM "${parent}" p
     WHERE p."id" = "${table}"."${fk}"
       AND p."tenant_id" = ${SETTING}
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "${parent}" p
     WHERE p."id" = "${table}"."${fk}"
       AND p."tenant_id" = ${SETTING}
  ));`;
}

const tables = [...DIRECT, "tenants", ...VIA_PARENT.map((entry) => entry.table), ...GLOBAL];


/**
 * Drift guard.
 *
 * The lists above are the policy contract, but the schema is what actually
 * exists. A table added to `schema.ts` and forgotten here would ship with no
 * policy at all - the exact silent failure this whole mechanism exists to
 * prevent - so the generator refuses to run when the two disagree.
 */
function assertNoDrift(): void {
  const declared = new Set<string>([
    ...DIRECT,
    ...VIA_PARENT.map((entry) => entry.table),
    ...GLOBAL,
    "tenants",
    ...WAVES.flatMap((wave) => [...wave.direct, ...wave.viaParent.map((entry) => entry.table)]),
  ]);
  const actual: string[] = [];
  for (const value of Object.values(schema)) {
    if (is(value, PgTable)) actual.push(getTableName(value));
  }

  const missing = actual.filter((table) => !declared.has(table));
  const unknown = [...declared].filter((table) => !actual.includes(table));
  const problems: string[] = [];
  if (missing.length > 0) {
    problems.push(
      `tables in schema.ts with NO policy (classify each in DIRECT, VIA_PARENT or GLOBAL): ${missing.join(", ")}`,
    );
  }
  if (unknown.length > 0) {
    problems.push(`tables declared here that do not exist in schema.ts: ${unknown.join(", ")}`);
  }
  if (problems.length > 0) {
    throw new Error(`RLS policy list is out of date.\n  - ${problems.join("\n  - ")}`);
  }
}

assertNoDrift();

const lines: string[] = [];
lines.push(`-- Row-Level Security for tenant isolation.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-rls
--
-- Model: one shared schema, \`tenant_id\` on every business table, enforced by
-- the database rather than by every developer remembering a predicate.
--
-- Contract:
--   * the application connects as the non-owner role "${APP_ROLE}";
--   * each transaction sets \`app.tenant_id\` with SET LOCAL before any query;
--   * if the setting is absent, \`current_setting(..., true)\` is NULL and every
--     policy evaluates to NULL -> no rows. The system fails CLOSED.
--
-- FORCE is used so the policies also apply to the table owner, not only to
-- other roles. Migrations and seeds therefore run as a superuser (or a role
-- with BYPASSRLS), which is a deliberate, documented privilege boundary.
--
-- Rollback: see docs/MIGRATION-ROLLBACK.md.
--   ALTER TABLE "<table>" DISABLE ROW LEVEL SECURITY;  (per table)
--   DROP OWNED BY ${APP_ROLE};

/* ------------------------------------------------------------------ */
/* Application role                                                    */
/* ------------------------------------------------------------------ */
-- NOLOGIN: it is assumed via SET ROLE in development/tests and used
-- directly as the login role in production (see docs/RLS.md). It owns no
-- table, so it is subject to FORCE policies.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
    CREATE ROLE ${APP_ROLE} NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;`);

for (const table of DIRECT) lines.push(directPolicy(table));

lines.push(`
-- tenants: the row IS the tenant. Only the current tenant's own record is visible.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_tenant_isolation" ON "tenants";
CREATE POLICY "tenants_tenant_isolation" ON "tenants"
  USING ("id" = ${SETTING})
  WITH CHECK ("id" = ${SETTING});`);

for (const entry of VIA_PARENT) lines.push(parentPolicy(entry.table, entry.parent, entry.fk));

lines.push(`
/* ------------------------------------------------------------------ */
/* Global reference data                                               */
/* ------------------------------------------------------------------ */
-- plans is a platform-wide catalogue: every tenant must read all of it, so it
-- is deliberately NOT tenant-scoped and carries no RLS. Writes are restricted
-- to the platform admin surface by the application.
-- ${GLOBAL.join(", ")}`);

lines.push(`
/* ------------------------------------------------------------------ */
/* Privileges                                                          */
/* ------------------------------------------------------------------ */
-- DML only; no DDL, no ownership. Tables must remain owned by a different
-- role so that FORCE policies apply and a compromised app cannot alter them.
GRANT USAGE ON SCHEMA public TO ${APP_ROLE};
${tables.map((table) => `GRANT SELECT, INSERT, UPDATE, DELETE ON "${table}" TO ${APP_ROLE};`).join("\n")}
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE};

/* ------------------------------------------------------------------ */
/* Public share-token resolution                                       */
/* ------------------------------------------------------------------ */
-- The one read that legitimately happens with NO tenant known: the token is
-- the credential. A SECURITY DEFINER function performs it with the owner's
-- privileges (bypassing RLS inside the function body) but returns ONLY the two
-- identifiers, never row data. The caller then sets app.tenant_id from the
-- result and every subsequent query runs under RLS.
CREATE OR REPLACE FUNCTION public.resolve_public_token(p_token_hash text)
RETURNS TABLE (invoice_id text, tenant_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT i."id", i."tenant_id"
    FROM "invoice_public_tokens" t
    JOIN "invoices" i ON i."id" = t."invoice_id"
   WHERE t."token_hash" = p_token_hash
     AND t."revoked_at" IS NULL
     AND t."expires_at" > now()
     AND i."deleted_at" IS NULL
     AND i."status" <> 'draft'
   LIMIT 1
$$;

-- Owned by the migration role, so it runs with RLS bypassed. EXECUTE is
-- granted to the app role only.
REVOKE ALL ON FUNCTION public.resolve_public_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_token(text) TO ${APP_ROLE};
`);

const sql = `${lines.join("\n")}\n`;
const out = join(process.cwd(), "drizzle", "0007_rls.sql");
writeFileSync(out, sql, "utf8");
console.log(`wrote ${out}`);
console.log(`tables covered: ${DIRECT.length} direct, ${VIA_PARENT.length} via parent, 1 self (tenants), ${GLOBAL.length} global (excluded)`);
console.log(`policy count: ${DIRECT.length + VIA_PARENT.length + 1}`);

/*
 * One migration per wave. The role already exists (0007 creates it), so a wave
 * only needs: policies, and grants (otherwise the app role is denied outright,
 * which is a hard 500 rather than the fail-closed empty result).
 */
for (const wave of WAVES) {
  const waveLines: string[] = [];
  waveLines.push(`-- Row-Level Security for tables introduced after 0007.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-rls
--
-- Why a second migration: 0007 is already applied in environments and must not
-- be edited. Granting nothing to "${APP_ROLE}" on a new table is not "fail
-- closed" - it is "permission denied", a 500 on every request that touches it.
-- Policies plus grants must therefore be added in the same wave that adds the
-- table.

/* ------------------------------------------------------------------ */
/* Policies                                                            */
/* ------------------------------------------------------------------ */
`);

  for (const table of wave.direct) waveLines.push(directPolicy(table));
  for (const entry of wave.viaParent) waveLines.push(parentPolicy(entry.table, entry.parent, entry.fk));

  const waveTables = [...wave.direct, ...wave.viaParent.map((entry) => entry.table)];
  waveLines.push(`
/* ------------------------------------------------------------------ */
/* Privileges                                                          */
/* ------------------------------------------------------------------ */
${waveTables.map((table) => `GRANT SELECT, INSERT, UPDATE, DELETE ON "${table}" TO ${APP_ROLE};`).join("\n")}
`);

  const waveSql = `${waveLines.join("\n")}\n`;
  const waveOut = join(process.cwd(), "drizzle", `${wave.tag}.sql`);
  writeFileSync(waveOut, waveSql, "utf8");
  console.log(`wrote ${waveOut} (${wave.direct.length + wave.viaParent.length} policies, ${waveTables.length} tables granted)`);
}
