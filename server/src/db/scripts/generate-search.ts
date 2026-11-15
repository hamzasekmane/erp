/**
 * Generates the search-column migration.
 *
 * Exists as a script for the same reason `generate-rls.ts` does: the work is
 * mechanical and must stay in lockstep with `lib/algorithms/search.ts`. Eight
 * tables need an identical `search_text` column, a trigger and a trigram index;
 * hand-typing eight copies invites the one that drifts from the normalization
 * rules, and that drift would be invisible until someone searches without a
 * hamza and gets nothing.
 *
 * The declaration below IS the contract: which columns feed `search_text`, and
 * whether they are folded like Arabic text or compared raw. Adding a searchable
 * table means adding one entry here, not editing SQL.
 *
 * Run: npm run db:generate-search
 * Output: drizzle/0016_search_columns.sql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** `name` and `code`: the columns most often present on an entity table. */
type SearchableTable = {
  table: string;
  /** Columns concatenated into `search_text`, in order. */
  columns: string[];
};

/**
 * Tables whose search should become normalization-aware.
 *
 * `clients` and `products` are absent on purpose: migration 0013 already gave
 * them the column, and re-declaring them here would emit a duplicate ALTER.
 */
const TABLES: SearchableTable[] = [
  { table: "client_notes", columns: ["title", "content"] },
  { table: "support_tickets", columns: ["subject", "description"] },
  { table: "archive_documents", columns: ["name", "description"] },
  { table: "users", columns: ["name", "email"] },
  { table: "employees", columns: ["first_name", "last_name", "code", "email"] },
  // invoices and payments search their own number plus a JOINed client name.
  // Only the own-table part goes in the column (0021 handles the rest): a
  // derived column that mirrored another table's data would go stale the moment
  // a client is renamed, and would need a cross-table trigger to stay honest.
  { table: "invoices", columns: ["number"] },
  { table: "payments", columns: ["number", "reference"] },
];

/** Tenants is global reference data administratively searched; folded too. */
const GLOBAL_TABLES: SearchableTable[] = [{ table: "tenants", columns: ["name", "email", "subdomain"] }];

function triggerFunction(entry: SearchableTable, qualify = ""): string {
  const setters = entry.columns.map((column) => `coalesce(NEW.${column}, '')`).join(" || ' ' || ");
  const unchanged = entry.columns.map((column) => `NEW.${column} IS NOT DISTINCT FROM OLD.${column}`).join("\n     AND ");
  return `CREATE OR REPLACE FUNCTION ${qualify}${entry.table}_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND ${unchanged} THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(${setters});
  RETURN NEW;
END;
$fn$;`;
}

function trigger(entry: SearchableTable): string {
  const columns = entry.columns.map((column) => `"${column}"`).join(", ");
  return `DROP TRIGGER IF EXISTS "${entry.table}_search_text_trg" ON "${entry.table}";
--> statement-breakpoint
CREATE TRIGGER "${entry.table}_search_text_trg"
  BEFORE INSERT OR UPDATE OF ${columns} ON "${entry.table}"
  FOR EACH ROW EXECUTE FUNCTION ${entry.table}_search_text_refresh();`;
}

function backfill(entry: SearchableTable): string {
  const setters = entry.columns.map((column) => `coalesce("${column}", '')`).join(" || ' ' || ");
  return `UPDATE "${entry.table}" SET "search_text" = search_normalize(${setters});`;
}

function blocks(entry: SearchableTable): string[] {
  return [
    // IF NOT EXISTS is not cosmetic. drizzle-kit's snapshot chain does not
    // include this hand-generated migration, so a future `db:generate` sees the
    // searchText columns in schema.ts as new and emits an `ADD COLUMN` for them.
    // That statement is harmless when it is idempotent, and fatal when it is
    // not — this exact collision was reproduced before the guard was added.
    `ALTER TABLE "${entry.table}" ADD COLUMN IF NOT EXISTS "search_text" text;`,
    triggerFunction(entry),
    trigger(entry),
    backfill(entry),
    `CREATE INDEX IF NOT EXISTS "${entry.table}_search_trgm_idx" ON "${entry.table}" USING gin ("search_text" gin_trgm_ops);`,
  ];
}

const all = [...TABLES, ...GLOBAL_TABLES];

const sql = `-- Search columns for the remaining searchable tables.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-search
--
-- Depends on migration 0014, which creates search_normalize(), pg_trgm and the
-- columns on products and clients. The normalization rules live in
-- lib/algorithms/search.ts and are mirrored by that SQL function;
-- src/test/search.e2e.test.ts asserts the two agree.
--
-- Why a derived column plus a trigger rather than an expression index:
--   the fold has to run on the QUERY too, so both sides need one canonical
--   form; a stored column is also readable in a report without repeating the
--   function call, and the trigger keeps it correct for writes that never went
--   through the application.

--> statement-breakpoint
${all.map((entry) => blocks(entry).join("\n--> statement-breakpoint\n")).join("\n--> statement-breakpoint\n")}
`;

/*
 * Self-check: every declared table must have a `searchText` column in
 * schema.ts. Without this the generator happily emits a migration for a column
 * Drizzle cannot select, which is only discovered when a query fails at
 * runtime — the same class of mistake as the RLS table list drifting.
 */
const schemaSource = readFileSync(join(process.cwd(), "src", "db", "schema.ts"), "utf8");
const missing = all.filter((entry) => {
  // Crude but sufficient: the table's own block must mention searchText before
  // the next `pgTable` declaration begins.
  const start = schemaSource.indexOf(`"${entry.table}"`);
  if (start === -1) return true;
  const nextTable = schemaSource.indexOf("pgTable(", start + 1);
  const block = schemaSource.slice(start, nextTable === -1 ? undefined : nextTable);
  return !block.includes("searchText");
});
if (missing.length > 0) {
  console.error(
    `tables declared searchable but missing a searchText column in schema.ts: ${missing.map((entry) => entry.table).join(", ")}`,
  );
  process.exit(1);
}

const out = join(process.cwd(), "drizzle", "0016_search_columns.sql");
writeFileSync(out, `${sql.trimEnd()}\n`, "utf8");
console.log(`wrote ${out}`);
console.log(`tables covered: ${all.length} (${TABLES.length} tenant, ${GLOBAL_TABLES.length} global)`);
console.log(`statements: ${all.length * 5}`);
