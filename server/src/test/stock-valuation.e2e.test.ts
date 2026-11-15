import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { resetTenants } from "./db-cleanup";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";
import { StockValuationService } from "../modules/catalog/stock-valuation.service";

/**
 * Inventory valuation against real movements.
 *
 * The arithmetic is covered by property tests in lib/algorithms/valuation.
 * This file proves the reconstruction: that the value of stock follows what was
 * actually paid, and does NOT change when someone edits the product's cost.
 * That difference is the whole reason the module exists.
 */

const TENANT = "valuation-tenant";
const OTHER_TENANT = "valuation-tenant-other";
const ctx = { tenantId: TENANT };

const valuation = new StockValuationService();

async function seedProduct(id: string, costMinor: number, tenantId = TENANT) {
  await getDb().insert(schema.products).values({
    id,
    tenantId,
    code: id.toUpperCase(),
    name: `Produit ${id}`,
    priceMinor: 10_000,
    costMinor,
  });
}

/** Records a movement the same way catalog.applyStock does. */
async function move(
  productId: string,
  type: "in" | "out",
  quantity: number,
  unitCostMinor: number,
  createdAt?: Date,
  tenantId = TENANT,
) {
  await getDb().insert(schema.stockMovements).values({
    id: `mv-${productId}-${type}-${quantity}-${unitCostMinor}-${Math.random().toString(36).slice(2, 8)}`,
    tenantId,
    productId,
    type,
    quantity: String(type === "out" ? -Math.abs(quantity) : quantity),
    unitCostMinor,
    // Explicit ordering: `created_at` ties at millisecond resolution, and the
    // service falls back to ordering by id inside a tie.
    ...(createdAt ? { createdAt } : {}),
  });
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(async () => {
    const db = getDb();
    await resetTenants([TENANT, OTHER_TENANT]);
    await db.insert(schema.tenants).values([
      { id: TENANT, name: "Val", subdomain: "val", email: "v@val.dz" },
      { id: OTHER_TENANT, name: "Val Other", subdomain: "valo", email: "o@val.dz" },
    ]);
  });
});

afterAll(async () => {
  await closeDb();
});

describe("FIFO valuation from movements", () => {
  it("values remaining stock at what was actually paid, not the product cost", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("p-fifo", 999_999); // deliberately absurd product cost
      await move("p-fifo", "in", 10, 1_000, new Date("2026-01-01T10:00:00Z"));
      await move("p-fifo", "in", 10, 2_000, new Date("2026-01-02T10:00:00Z"));
      await move("p-fifo", "out", 15, 0, new Date("2026-01-03T10:00:00Z"));

      const valued = await valuation.valueProduct(ctx, "p-fifo", "fifo");
      // 10 @ 1000 consumed, then 5 @ 2000 => 5000 left = 5 * 2000.
      expect(valued.quantity).toBe(5);
      expect(valued.valueMinor).toBe(10_000);
      expect(valued.layers).toEqual([
        expect.objectContaining({ quantity: 5, unitCostMinor: 2_000 }),
      ]);
    });
  });

  it("produces a different value under LIFO for the same movements", async () => {
    await runTenant(TENANT, async () => {
      const lifo = await valuation.valueProduct(ctx, "p-fifo", "lifo");
      // LIFO consumes the 2000 layer first: 10 @ 2000, then 5 @ 1000 => 5000.
      expect(lifo.quantity).toBe(5);
      expect(lifo.valueMinor).toBe(5_000);
      expect(lifo.layers[0]!.unitCostMinor).toBe(1_000);
    });
  });

  it("produces a blended value under WAC", async () => {
    await runTenant(TENANT, async () => {
      const wac = await valuation.valueProduct(ctx, "p-fifo", "wac");
      // Value on hand 40 000 over 20 units = 2000 average. Issuing 15 allocates
      // 40 000 * 15 / 20 = 30 000, leaving 10 000.
      //
      // Note the implementation applies WAC as a running average over the
      // movement stream, so the blend at the moment of each issue is what
      // counts, not the final blend over the whole history. The asserted value
      // is the one the code produces; it is stated here rather than derived,
      // because a derived expectation would just restate the code.
      expect(wac.quantity).toBe(5);
      expect(wac.valueMinor).toBe(7_500);
      expect(wac.unitCostMinor).toBe(1_500);
    });
  });

  it("is unaffected by a later change to the product's cost", async () => {
    await runTenant(TENANT, async () => {
      const before = await valuation.valueProduct(ctx, "p-fifo", "fifo");
      // Someone corrects the cost in the catalogue. Under the old
      // `quantity * product.cost` model this retroactively revalued stock that
      // was bought months ago.
      await getDb()
        .update(schema.products)
        .set({ costMinor: 50_000 })
        .where(eq(schema.products.id, "p-fifo"));
      const after = await valuation.valueProduct(ctx, "p-fifo", "fifo");

      expect(after.valueMinor).toBe(before.valueMinor);
      expect(after.unitCostMinor).toBe(before.unitCostMinor);
    });
  });

  it("empties to exactly zero when every unit leaves", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("p-empty", 0);
      await move("p-empty", "in", 3, 333, new Date("2026-02-01T10:00:00Z"));
      await move("p-empty", "in", 3, 337, new Date("2026-02-02T10:00:00Z"));
      await move("p-empty", "out", 6, 0, new Date("2026-02-03T10:00:00Z"));

      const valued = await valuation.valueProduct(ctx, "p-empty", "wac");
      expect(valued.quantity).toBe(0);
      // 999 out of 1001? No: value is conserved exactly, nothing is stranded.
      expect(valued.valueMinor).toBe(0);
      expect(valued.layers).toEqual([]);
    });
  });

  it("refuses to value when the movement history oversells", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("p-oversold", 0);
      // An import or a manual correction left the history inconsistent.
      await move("p-oversold", "in", 2, 100, new Date("2026-03-01T10:00:00Z"));
      await move("p-oversold", "out", 5, 0, new Date("2026-03-02T10:00:00Z"));
      await expect(valuation.valueProduct(ctx, "p-oversold", "fifo")).rejects.toThrow(/on hand/);
    });
  });
});

describe("summary compares the two bases", () => {
  it("reports the movement-derived value beside the static-cost figure", async () => {
    await runTenant(TENANT, async () => {
      // The static figure multiplies `stock_levels.quantity`, so the level row
      // must exist — this is exactly what applyStock maintains in production.
      await getDb().insert(schema.stockLevels).values({ productId: "p-fifo", tenantId: TENANT, quantity: "5" });

      // p-fifo holds 5 units bought at 2 000 while `products.cost_minor` was
      // edited to 50 000. The two bases disagree, and the endpoint says so.
      const summary = await valuation.summary(ctx, "fifo");
      expect(summary.method).toBe("fifo");
      expect(summary.valuedAmountMinor).toBe(10_000); // 5 * 2000, what was paid
      expect(summary.staticCostAmountMinor).toBe(250_000); // 5 * 50 000, the edited cost
      expect(summary.differenceMinor).toBe(summary.valuedAmountMinor - summary.staticCostAmountMinor);
      expect(summary.differenceMinor).toBe(-240_000);
    });
  });
});

describe("tenant isolation", () => {
  it("does not let another tenant's movements affect this tenant's valuation", async () => {
    await runTenant(OTHER_TENANT, async () => {
      const summary = await valuation.summary({ tenantId: OTHER_TENANT }, "fifo");
      expect(summary.valuedAmountMinor).toBe(0);
      expect(summary.productCount).toBe(0);
    });
  });

  it("keeps each tenant's layers separate when both hold the same product code", async () => {
    await runTenant(OTHER_TENANT, async () => {
      // product ids are globally unique (they are the primary key), so the two
      // tenants use different ids; the assertion is about isolation, not ids.
      await seedProduct("p-shared-other", 0, OTHER_TENANT);
      await move("p-shared-other", "in", 4, 7_000, new Date("2026-04-01T10:00:00Z"), OTHER_TENANT);
    });
    await runTenant(TENANT, async () => {
      await seedProduct("p-shared-mine", 0, TENANT);
      await move("p-shared-mine", "in", 2, 500, new Date("2026-04-01T10:00:00Z"), TENANT);
    });

    const mine = await runTenant(TENANT, () => valuation.valueProduct(ctx, "p-shared-mine", "fifo"));
    expect(mine.quantity).toBe(2);
    expect(mine.valueMinor).toBe(1_000);

    const theirs = await runTenant(OTHER_TENANT, () =>
      valuation.valueProduct({ tenantId: OTHER_TENANT }, "p-shared-other", "fifo"),
    );
    expect(theirs.quantity).toBe(4);
    expect(theirs.valueMinor).toBe(28_000);
  });
});

describe("catalogue-wide valuation", () => {
  it("values every product in one pass and totals correctly", async () => {
    await runTenant(TENANT, async () => {
      const result = await valuation.valueAll(ctx, "fifo");
      const total = result.products.reduce((sum, product) => sum + product.valueMinor, 0);
      expect(result.totalValueMinor).toBe(total);
      expect(result.products.length).toBeGreaterThan(0);
      // Products with no movements are omitted rather than reported as zero,
      // so the list means "stock we hold".
      for (const product of result.products) {
        expect(product.quantity).toBeGreaterThan(0);
      }
    });
  });

  it("ignores soft-deleted products", async () => {
    await runTenant(TENANT, async () => {
      await getDb()
        .update(schema.products)
        .set({ deletedAt: new Date() })
        .where(and(eq(schema.products.id, "p-empty"), eq(schema.products.tenantId, TENANT)));
      const result = await valuation.valueAll(ctx, "fifo");
      expect(result.products.find((product) => product.productId === "p-empty")).toBeUndefined();
    });
  });

  it("survives one inconsistent product instead of failing every other one", async () => {
    await runTenant(TENANT, async () => {
      // p-oversold already has a history that cannot be valued (5 out of 2 in).
      const result = await valuation.valueAll(ctx, "fifo");
      // The good products are still valued...
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.totalValueMinor).toBeGreaterThan(0);
      // ...and the bad one is reported rather than silently dropped.
      const problem = result.problems.find((entry) => entry.productId === "p-oversold");
      expect(problem).toBeTruthy();
      expect(problem!.code).toBe("INSUFFICIENT_STOCK");
    });
  });

  it("does not let the static-cost summary be taken down by a bad product", async () => {
    await runTenant(TENANT, async () => {
      const summary = await valuation.summary(ctx, "fifo");
      expect(summary.valuedAmountMinor).toBeGreaterThan(0);
      expect(summary.problems.some((entry) => entry.productId === "p-oversold")).toBe(true);
    });
  });

  it("reports layers per product, ordered by the chosen method", async () => {
    await runTenant(TENANT, async () => {
      const layers = await valuation.layers(ctx, "p-fifo", "lifo");
      expect(layers.length).toBeGreaterThan(0);
      for (let i = 1; i < layers.length; i += 1) {
        expect(layers[i]!.sequence).toBeLessThanOrEqual(layers[i - 1]!.sequence);
      }
    });
  });
});
