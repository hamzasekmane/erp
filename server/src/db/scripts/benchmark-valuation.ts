/**
 * Inventory valuation benchmark.
 *
 * Measures the cost of valuing a catalogue from movement history, which is the
 * operation that replaced `sum(quantity * product.cost)`. That SQL aggregate is
 * instant and wrong; this tells you what correct costs.
 *
 * Run: npm run bench:valuation
 * Optional: BENCH_MOVEMENTS=50000 BENCH_PRODUCTS=200 npm run bench:valuation
 */
import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb, runGlobal } from "../client";
import { migrate } from "../migrate";
import { useEmbeddedDb } from "../../config/env";
import { StockValuationService } from "../../modules/catalog/stock-valuation.service";

const MOVEMENTS = Number(process.env.BENCH_MOVEMENTS ?? 200_000);
const PRODUCTS = Number(process.env.BENCH_PRODUCTS ?? 2_000);
const TENANT = "bench-val-tenant";
const BATCH = 5_000;

function rowsOf(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

async function main(): Promise<void> {
  console.log(`valuation benchmark — ${PRODUCTS.toLocaleString()} products, ${MOVEMENTS.toLocaleString()} movements`);
  console.log(`engine: ${useEmbeddedDb ? "PGlite (WASM, single connection)" : "PostgreSQL"}\n`);

  await initDb();
  await migrate();

  await runGlobal(async () => {
    const db = getDb();
    await db.execute(sql`insert into tenants (id, name, subdomain, email) values (${TENANT}, 'Bench', 'bv', 'bv@x.dz')`);

    console.log("loading…");
    const start = process.hrtime.bigint();

    let created = 0;
    while (created < PRODUCTS) {
      const size = Math.min(BATCH, PRODUCTS - created);
      const values: string[] = [];
      for (let i = 0; i < size; i += 1) {
        const index = created + i;
        // A non-zero static cost, so the legacy comparison is meaningful.
        values.push(`('vp-${index}','${TENANT}','VP${index}','Produit ${index}',10000,700)`);
      }
      await db.execute(sql.raw(`insert into products (id, tenant_id, code, name, price_minor, cost_minor) values ${values.join(",")}`));
      created += size;
    }

    // Each product gets an alternating in/out history with varying costs, so
    // layers actually build and unwind rather than trivially emptying.
    let movements = 0;
    while (movements < MOVEMENTS) {
      const size = Math.min(BATCH, MOVEMENTS - movements);
      const values: string[] = [];
      for (let i = 0; i < size; i += 1) {
        const index = movements + i;
        // Each product gets its OWN in,in,out cycle. Interleaving by product
        // matters: a global index that happens to start a product's history
        // with an issue produces an oversell that is correctly reported as
        // inconsistent, which is not what this benchmark is measuring.
        const row = Math.floor(index / PRODUCTS);
        const product = index % PRODUCTS;
        const step = row % 3;
        const isIn = step !== 2;
        const quantity = isIn ? 10 : 5;
        const unitCost = isIn ? 500 + (row % 7) * 100 : 0;
        // MONOTONIC timestamps. An "out" that sorts before its "in" looks like
        // an oversell and is reported as inconsistent history — which is how
        // this fixture first failed, and a useful reminder that valuation is
        // only as trustworthy as the movement ordering.
        const when = new Date(Date.UTC(2024, 0, 1, 0, 0, 0) + index * 60_000).toISOString();
        values.push(
          `('vm-${index}','${TENANT}','vp-${product}','${isIn ? "in" : "out"}',${isIn ? quantity : -quantity},${unitCost},'${when}')`,
        );
      }
      await db.execute(
        sql.raw(
          `insert into stock_movements (id, tenant_id, product_id, type, quantity, unit_cost_minor, created_at) values ${values.join(",")}`,
        ),
      );
      movements += size;
      if (movements % 50_000 === 0 || movements === MOVEMENTS) {
        process.stdout.write(`\r  ${movements.toLocaleString()} / ${MOVEMENTS.toLocaleString()} movements`);
      }
    }
    process.stdout.write("\n");
    const loadMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`  load ${loadMs.toFixed(0)} ms\n`);
  });

  const valuation = new StockValuationService();

  // Must run inside a tenant scope: the service queries tenant-scoped tables.
  const { runTenant } = await import("../client");

  for (const method of ["fifo", "lifo", "wac"] as const) {
    await runTenant(TENANT, async () => {
      const started = process.hrtime.bigint();
      const result = await valuation.valueAll({ tenantId: TENANT }, method);
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      console.log(
        `  ${method.toUpperCase()}: ${result.products.length.toLocaleString()} products, ` +
          `${result.totalQuantity.toLocaleString()} units, value ${result.totalValueMinor.toLocaleString()} minor — ${ms.toFixed(0)} ms`,
      );
      if (result.problems.length > 0) {
        console.log(`    ${result.problems.length} product(s) with inconsistent history (reported, excluded)`);
      }
    });
  }

  await runGlobal(async () => {
    // The query this replaced, for comparison.
    const started = process.hrtime.bigint();
    // stock_levels is maintained by applyStock in production; the benchmark
    // seeds no levels, so it is populated here to compare like with like.
    await getDb().execute(sql`
      insert into stock_levels (product_id, tenant_id, quantity)
      select m.product_id, ${TENANT}, sum(m.quantity)
        from stock_movements m
       where m.tenant_id = ${TENANT}
       group by m.product_id
    `);
    const legacy = await getDb().execute(sql`
      select coalesce(sum(coalesce(sl.quantity, 0) * p.cost_minor), 0) as total
        from products p
        left join stock_levels sl on sl.product_id = p.id and sl.tenant_id = p.tenant_id
       where p.tenant_id = ${TENANT}
    `);
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(`\n  static cost basis (the old query): ${Number(rowsOf(legacy)[0]?.total ?? 0).toLocaleString()} minor — ${ms.toFixed(1)} ms`);
    console.log("  ^ fast and wrong: it revalues history whenever a product cost is edited.");
  });

  if (useEmbeddedDb) {
    console.log("\nNB: PGlite is single-threaded WASM with no parallel query. A real PostgreSQL server is faster.");
  }
  await closeDb();
}

main().catch((error) => {
  console.error("benchmark failed:", error);
  process.exit(1);
});
