/**
 * Search benchmark: the LIKE scan versus the normalized column.
 *
 * The claim this is here to test is narrow and falsifiable: searching a
 * catalogue by a normalized `search_text` is faster than `lower(col) like
 * '%term%'`, and it finds spellings the old query could not.
 *
 * Both measurements run against the same rows, in the same process, on the same
 * engine. `set enable_seqscan` is deliberately NOT touched: the point is the
 * default planner's choice, which is what production gets.
 *
 * Run: npm run bench:search
 * Optional: BENCH_PRODUCTS=20000 npm run bench:search
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb, runGlobal } from "../client";
import { migrate } from "../migrate";
import { useEmbeddedDb } from "../../config/env";
import { normalizeSearchText } from "../../../lib/algorithms/search";

const PRODUCTS = Number(process.env.BENCH_PRODUCTS ?? 20_000);
const TENANT = "bench-search-tenant";
const BATCH = 1_000;

/** Arabic first names, so the folds are exercised on realistic data. */
const NAMES = [
  "أحمد",
  "محمد",
  "فاطمة",
  "زينب",
  "مصطفى",
  "خديجة",
  "عبد الرحمان",
  "يوسف",
  "الزهراء",
  "إسماعيل",
];
const KINDS = ["متجر", "مؤسسة", "شركة", "ورشة", "مخبزة", "مكتبة"];
/** Latin names too, so the benchmark is not Arabic-only. */
const LATIN = ["Café", "Élégant", "Superette", "Boulangerie", "Atelier"];

function rowsOf(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

async function time(label: string, run: () => Promise<number>): Promise<{ label: string; ms: number; matches: number }> {
  const start = process.hrtime.bigint();
  const matches = await run();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  console.log(`  ${label.padEnd(46)} ${ms.toFixed(1).padStart(8)} ms   ${String(matches).padStart(6)} rows`);
  return { label, ms, matches };
}

async function main(): Promise<void> {
  console.log(`search benchmark — ${PRODUCTS.toLocaleString()} products`);
  console.log(`engine: ${useEmbeddedDb ? "PGlite (WASM, single connection)" : "PostgreSQL"}\n`);

  await initDb();
  await migrate();

  await runGlobal(async () => {
    const db = getDb();
    // Re-runnable: a previous run leaves its data behind, and a benchmark that
    // only works on a virgin database is a benchmark nobody runs twice.
    await db.execute(sql`delete from products where tenant_id = ${TENANT}`);
    await db.execute(sql`delete from tenants where id = ${TENANT}`);
    await db.execute(sql`insert into tenants (id, name, subdomain, email) values (${TENANT}, 'Bench', 'bs', 'bs@x.dz')`);

    console.log("loading…");
    let created = 0;
    while (created < PRODUCTS) {
      const size = Math.min(BATCH, PRODUCTS - created);
      const values: string[] = [];
      for (let index = 0; index < size; index += 1) {
        const n = created + index;
        const name =
          n % 3 === 0
            ? `${NAMES[n % NAMES.length]} ${KINDS[n % KINDS.length]}`
            : `${LATIN[n % LATIN.length]} ${KINDS[n % KINDS.length]} ${n}`;
        values.push(`('p-${n}', '${TENANT}', 'CODE-${n}', '${name.replace(/'/g, "''")}', 1000)`);
      }
      await db.execute(
        sql.raw(
          `insert into products (id, tenant_id, code, name, price_minor) values ${values.join(",")}`,
        ),
      );
      created += size;
      if (created % (BATCH * 5) === 0) process.stdout.write(`  ${created.toLocaleString()}\r`);
    }
    console.log(`  ${created.toLocaleString()} products loaded\n`);

    // A second table with a multi-column source, to prove the concatenation
    // covers every declared column rather than only the first.
    await db.execute(sql`delete from employees where tenant_id = ${TENANT}`);
    await db.execute(sql`delete from departments where tenant_id = ${TENANT}`);
    await db.execute(sql`insert into departments (id, tenant_id, name) values ('bd-1', ${TENANT}, 'Production')`);
    const employeeRows: string[] = [];
    for (let index = 0; index < 2_000; index += 1) {
      const first = NAMES[index % NAMES.length];
      const last = index % 5 === 0 ? "بن علي" : "Haddad";
      employeeRows.push(`('be-${index}', '${TENANT}', 'EMP-${index}', '${first}', '${last}', '2026-01-01', 'bd-1')`);
    }
    await db.execute(
      sql.raw(
        `insert into employees (id, tenant_id, code, first_name, last_name, hire_date, department_id) values ${employeeRows.join(",")}`,
      ),
    );

    // The trigger populated search_text on insert; verify rather than assume.
    const nulls = rowsOf(
      await db.execute(sql`select count(*)::int as n from products where search_text is null`),
    )[0]!.n as number;
    console.log(`  search_text populated for every row: ${nulls === 0 ? "yes" : `NO (${nulls} null)`}\n`);
  });

  const oldTerm = "%أحمد%";
  const foldedTerm = `%${normalizeSearchText("احمد")}%`;
  const latinTerm = `%${normalizeSearchText("cafe")}%`;

  console.log("OLD — lower(name) like '%term%' (no index possible)");
  const oldArabic = await time("Arabic, hamza spelling (أحمد)", async () => {
    const result = await getDb().execute(
      sql`select count(*)::int as n from products where lower(name) like ${oldTerm}`,
    );
    return rowsOf(result)[0]!.n as number;
  });
  // The actual bug: the OLD query with the spelling a user types, i.e. without
  // the hamza. This is the case the old code could not serve at all.
  const oldFoldedSpelling = await time("Arabic, typed without the hamza (احمد)", async () => {
    const result = await getDb().execute(
      sql`select count(*)::int as n from products where lower(name) like ${`%${normalizeSearchText("احمد")}%`}`,
    );
    return rowsOf(result)[0]!.n as number;
  });
  const oldLatin = await time("Latin, accented (café)", async () => {
    const result = await getDb().execute(
      sql`select count(*)::int as n from products where lower(name) like ${latinTerm}`,
    );
    return rowsOf(result)[0]!.n as number;
  });

  console.log("\nNEW — search_text like '%normalized%' (trigram-indexed)");
  const newArabic = await time("Arabic, typed without the hamza (احمد)", async () => {
    const result = await getDb().execute(
      sql`select count(*)::int as n from products where search_text like ${foldedTerm}`,
    );
    return rowsOf(result)[0]!.n as number;
  });
  const newLatin = await time("Latin, typed without the accent (cafe)", async () => {
    const result = await getDb().execute(
      sql`select count(*)::int as n from products where search_text like ${latinTerm}`,
    );
    return rowsOf(result)[0]!.n as number;
  });

  console.log("\nrecall — did the query find the rows it should?");
  const line = (label: string, old: number, fresh: number) =>
    console.log(
      `  ${label.padEnd(34)} old ${String(old).padStart(6)}   new ${String(fresh).padStart(6)}   +${fresh - old}`,
    );
  line("Arabic, user omits the hamza", oldFoldedSpelling.matches, newArabic.matches);
  line("Latin, user omits the accent", oldLatin.matches, newLatin.matches);
  line("Arabic, user matches the record", oldArabic.matches, newArabic.matches);
  console.log(
    "\n  The first two lines are the bug: those rows exist in the table and were simply\n" +
      "  unreachable by the spelling a user types. The third line is the control — when the\n" +
      "  user happens to spell it exactly as stored, the old query was fine.",
  );

  // The timings only mean something if the planner really used the index, so
  // read the plan rather than assuming it.
  console.log("\nmulti-column source (employees: first_name + last_name + code + email)");
  const lastNameHit = await time("last name only, which is the 2nd column", async () => {
    const result = await getDb().execute(sql`select count(*)::int as n from employees where search_text like ${`%${normalizeSearchText("بن علي")}%`}`);
    return rowsOf(result)[0]!.n as number;
  });
  const firstInitial = await time("first name only, which is the 1st", async () => {
    const result = await getDb().execute(sql`select count(*)::int as n from employees where search_text like ${`%${normalizeSearchText("مصطفي")}%`}`);
    return rowsOf(result)[0]!.n as number;
  });
  console.log(
    `  Searching the SECOND column finds ${lastNameHit.matches} rows and the first finds ${firstInitial.matches};`,
  );
  console.log(`  both non-zero is the check that the whole row is indexed, not just its first field.`);
  const oldLast = await time("old path, last name (lower(last_name))", async () => {
    const result = await getDb().execute(sql`select count(*)::int as n from employees where lower(last_name) like ${`%${normalizeSearchText("بن علي")}%`}`);
    return rowsOf(result)[0]!.n as number;
  });
  console.log(`  the old path needed a separate lower(last_name) clause to match this at all (${oldLast.matches} rows).`);

  console.log("\nplan — is the index actually used?");
  const planOf = async (label: string, query: string, params: string[]) => {
    const result = await getDb().execute(sql.raw(`explain (analyze, costs off) ${query}`));
    const lines = rowsOf(result).map((row) => String(Object.values(row)[0]));
    const scan = lines.find((line) => /Seq Scan|Index Scan|Bitmap Index Scan|Bitmap Heap Scan/.test(line));
    console.log(`  ${label.padEnd(18)} ${(scan ?? "unknown").trim()}`);
  };
  await getDb().execute(sql`analyze products`);
  await planOf("old", `select count(*) from products where lower(name) like '%${"احمد"}%'`, []);
  await planOf("new", `select count(*) from products where search_text like '%${"احمد"}%'`, []);

  console.log("\nspeed (single run on a warm page cache; treat as an order of magnitude)");
  console.log(`  Arabic: ${oldArabic.ms.toFixed(1)} ms -> ${newArabic.ms.toFixed(1)} ms`);
  console.log(`  Latin:  ${oldLatin.ms.toFixed(1)} ms -> ${newLatin.ms.toFixed(1)} ms`);
  console.log(`  (old path, folded spelling: ${oldFoldedSpelling.ms.toFixed(1)} ms — same scan, fewer rows)`);
  console.log(
    "\n  Note: these are counts over the whole table. A real search returns a page, and the\n" +
      "  index only helps when the planner can use it — an unanchored LIKE on a trigram\n" +
      "  index can, a unanchored LIKE on lower(name) cannot use any index at all.",
  );
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
