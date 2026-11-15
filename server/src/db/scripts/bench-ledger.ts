/**
 * Ledger benchmark: 1M journal lines.
 *
 * Contract: docs/adr/0004-ledger.md (performance evidence)
 *
 * Seeds 500 000 balanced two-line entries = 1 000 000 journal lines, then times
 * the queries the application actually issues:
 *
 *   1. trial balance for a tenant (the report a user opens)
 *   2. subtree total through the closure table (what the closure is for)
 *   3. account statement over a date range
 *   4. posting one new entry (write latency, including triggers)
 *
 * Seeding is set-based on purpose: a row-by-row loop in WASM would dominate the
 * run and would measure the generator rather than the schema.
 *
 * Measured against the SAME PGlite engine used by dev and CI, so these numbers
 * describe this project's harness, not production PostgreSQL. PGlite is
 * single-threaded WASM with no parallel query, so real PostgreSQL on the same
 * schema is faster. Treat these as a floor.
 *
 * Run: npm run bench:ledger
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../client";
import { migrate } from "../migrate";

const ENTRIES = 500_000;
const TENANT = "bench-tenant";
const OTHER = "bench-tenant-2";

type Timing = { label: string; ms: number; detail: string };

async function timed<T>(timings: Timing[], label: string, fn: () => Promise<T>, describe: (value: T) => string): Promise<T> {
  const start = performance.now();
  const value = await fn();
  timings.push({ label, ms: Math.round(performance.now() - start), detail: describe(value) });
  return value;
}

async function rows(statement: ReturnType<typeof sql>): Promise<Array<Record<string, unknown>>> {
  const result = (await getDb().execute(statement)) as unknown as
    | { rows?: Array<Record<string, unknown>> }
    | Array<Record<string, unknown>>;
  return Array.isArray(result) ? (result as Array<Record<string, unknown>>) : (result.rows ?? []);
}

async function main(): Promise<void> {
  await initDb();
  const schemaStart = performance.now();
  await migrate();
  console.log(`schema ready in ${Math.round(performance.now() - schemaStart)} ms`);

  const timings: Timing[] = [];

  await runGlobal(async () => {
    await getDb().execute(sql`
      insert into tenants (id, name, subdomain, email)
      values (${TENANT}, 'Bench', 'bench', 'b@t.dz'), (${OTHER}, 'Bench 2', 'bench2', 'b2@t.dz')
    `);
    // A realistic small chart: class 4 with one child, plus revenue/VAT/cash.
    await getDb().execute(sql`
      insert into accounts (id, tenant_id, code, name, type, normal_balance, parent_id, is_postable)
      values ('bench-root', ${TENANT}, '4', 'Tiers', 'asset', 'debit', null, false),
             ('bench-ar',   ${TENANT}, '411', 'Clients', 'asset', 'debit', 'bench-root', true),
             ('bench-rev',  ${TENANT}, '701', 'Ventes', 'revenue', 'credit', null, true),
             ('bench-vat',  ${TENANT}, '4457', 'TVA collectée', 'liability', 'credit', null, true),
             ('bench-cash', ${TENANT}, '53', 'Caisse', 'asset', 'debit', null, true)
    `);
    await getDb().execute(sql`
      insert into account_closure (tenant_id, ancestor_id, descendant_id, depth)
      values (${TENANT}, 'bench-root', 'bench-root', 0),
             (${TENANT}, 'bench-ar', 'bench-ar', 0),
             (${TENANT}, 'bench-root', 'bench-ar', 1),
             (${TENANT}, 'bench-rev', 'bench-rev', 0),
             (${TENANT}, 'bench-vat', 'bench-vat', 0),
             (${TENANT}, 'bench-cash', 'bench-cash', 0)
    `);
  });

  // ---------------- seed 500k entries / 1M lines -------------------------
  console.log(`seeding ${ENTRIES.toLocaleString()} entries (${(ENTRIES * 2).toLocaleString()} lines)...`);

  // Bulk load runs with triggers disabled (session_replication_role = replica),
  // which is the standard technique for a data load and is available only to a
  // superuser. It is safe here for one reason: the generator produces entries
  // that are balanced BY CONSTRUCTION, and a global check below proves it. The
  // per-entry trigger would otherwise run 500 000 times at COMMIT, measuring
  // the trigger rather than the schema - and it CANNOT fire at all, because the
  // lines of an entry arrive in a later statement than the entry itself.
  await runGlobal(async () => {
    await getDb().execute(sql.raw("set session_replication_role = replica"));
  });

  await runGlobal(async () => {
    await timed(
      timings,
      `seed ${ENTRIES.toLocaleString()} journal entries`,
      () =>
        getDb().execute(sql`
          insert into journal_entries (id, tenant_id, number, entry_date, status, source_type, posted_at)
          select 'bench-je-' || g,
                 ${TENANT},
                 'JE-2026-' || lpad(g::text, 6, '0'),
                 date '2026-01-01' + ((g % 365) || ' days')::interval,
                 'posted',
                 'invoice',
                 now()
            from generate_series(1, ${sql.raw(String(ENTRIES))}) g
        `),
      () => "insert-select",
    );

    // Debit side: 500k lines.
    await timed(
      timings,
      `seed ${ENTRIES.toLocaleString()} debit lines`,
      () =>
        getDb().execute(sql`
          insert into journal_lines (id, tenant_id, entry_id, line_number, account_id, debit_minor, credit_minor)
          select 'bench-d-' || g, ${TENANT}, 'bench-je-' || g, 1, 'bench-ar', 10000, 0
            from generate_series(1, ${sql.raw(String(ENTRIES))}) g
        `),
      () => "insert-select",
    );

    // Credit side: 500k lines. Each entry is now balanced (10000 = 10000).
    await timed(
      timings,
      `seed ${ENTRIES.toLocaleString()} credit lines`,
      () =>
        getDb().execute(sql`
          insert into journal_lines (id, tenant_id, entry_id, line_number, account_id, debit_minor, credit_minor)
          select 'bench-c-' || g, ${TENANT}, 'bench-je-' || g, 2, 'bench-rev', 0, 10000
            from generate_series(1, ${sql.raw(String(ENTRIES))}) g
        `),
      () => "insert-select",
    );

    // A second tenant with a small ledger, so isolation is measured against real data.
    await getDb().execute(sql`
      insert into journal_entries (id, tenant_id, number, entry_date, status, source_type)
      values ('bench2-je', ${OTHER}, 'JE-2026-000001', '2026-03-01', 'posted', 'manual')
    `);
    await getDb().execute(sql`
      insert into journal_lines (id, tenant_id, entry_id, line_number, account_id, debit_minor, credit_minor)
      values ('bench2-d', ${OTHER}, 'bench2-je', 1, 'bench-ar', 500, 0),
             ('bench2-c', ${OTHER}, 'bench2-je', 2, 'bench-rev', 0, 500)
    `);
  });

  await runGlobal(async () => {
    await getDb().execute(sql.raw("set session_replication_role = origin"));
  });

  const counts = await rows(sql`select count(*)::int as n from journal_lines`);
  console.log(`journal_lines rows: ${Number(counts[0]?.n).toLocaleString()}`);

  // Prove the bulk-loaded data obeys the invariant the triggers enforce.
  const unbalanced = await rows(sql`
    select count(*)::int as n from (
      select entry_id
        from journal_lines
       group by entry_id
      having sum(debit_minor) <> sum(credit_minor)
    ) bad
  `);
  console.log(`unbalanced entries in seeded data: ${Number(unbalanced[0]?.n)} (must be 0)`);
  if (Number(unbalanced[0]?.n) !== 0) throw new Error("seeded data is unbalanced");

  // ---------------- read benchmarks --------------------------------------
  await runTenant(TENANT, async () => {
    await timed(
      timings,
      "trial balance (whole tenant)",
      () =>
        rows(sql`
          select a.code,
                 sum(l.debit_minor)::bigint  as debit,
                 sum(l.credit_minor)::bigint as credit
            from journal_lines l
            join accounts a on a.id = l.account_id
           group by a.code
           order by a.code
        `),
      (result) => `${result.length} accounts, ${result.reduce((sum, row) => sum + Number(row.debit), 0).toLocaleString()} debit total`,
    );

    await timed(
      timings,
      "subtree balance via closure (class 4)",
      () =>
        rows(sql`
          select sum(l.debit_minor)::bigint as debit, sum(l.credit_minor)::bigint as credit
            from account_closure cl
            join journal_lines l on l.account_id = cl.descendant_id
           where cl.ancestor_id = 'bench-root'
        `),
      (result) => `debit ${Number(result[0]?.debit).toLocaleString()}`,
    );

    // LIMIT 1000: the point is index usage, not serialising 100k rows over
    // the wire, which would measure the driver rather than the schema.
    await timed(
      timings,
      "account statement (one account, one month, LIMIT 1000)",
      () =>
        rows(sql`
          select l.id, l.debit_minor, l.credit_minor
            from journal_lines l
            join journal_entries e on e.id = l.entry_id
           where l.account_id = 'bench-ar'
             and e.entry_date between date '2026-03-01' and date '2026-03-31'
           limit 1000
        `),
      (result) => `${result.length} rows`,
    );

    await timed(
      timings,
      "entry lookup by source (the 'show me the posting' query)",
      () =>
        rows(sql`
          select id, number, entry_date
            from journal_entries
           where tenant_id = ${TENANT} and source_type = 'invoice'
           order by entry_date desc
           limit 20
        `),
      (result) => `${result.length} rows`,
    );
  });

  // ---------------- write benchmark --------------------------------------
  const writeStart = performance.now();
  await runTenant(TENANT, async () => {
    await getDb().transaction(async (tx) => {
      const entryId = `bench-live-${Date.now()}`;
      await tx.execute(sql`
        insert into journal_entries (id, tenant_id, number, entry_date, status, source_type, posted_at)
        values (${entryId}, ${TENANT}, '', '2026-06-15', 'posted', 'manual', now())
      `);
      await tx.execute(sql`
        insert into journal_lines (id, tenant_id, entry_id, line_number, account_id, debit_minor, credit_minor)
        values (${`${entryId}-1`}, ${TENANT}, ${entryId}, 1, 'bench-cash', 2500, 0),
               (${`${entryId}-2`}, ${TENANT}, ${entryId}, 2, 'bench-rev', 0, 2500)
      `);
    });
  });
  timings.push({
    label: "post one balanced entry (2 lines, triggers included)",
    ms: Math.round(performance.now() - writeStart),
    detail: "number assigned by trigger",
  });

  // Isolation check must not scan the other tenant's million lines.
  await runTenant(OTHER, async () => {
    await timed(
      timings,
      "trial balance for the SMALL tenant (isolation)",
      () =>
        rows(sql`
          select a.code, sum(l.debit_minor)::bigint as debit
            from journal_lines l join accounts a on a.id = l.account_id
           group by a.code
        `),
      (result) => `${result.length} accounts only`,
    );
  });

  // ---------------- report ------------------------------------------------
  console.log("\n=== Ledger benchmark ===");
  for (const timing of timings) {
    console.log(`${String(timing.ms).padStart(7)} ms  ${timing.label}  [${timing.detail}]`);
  }

  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
