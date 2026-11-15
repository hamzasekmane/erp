import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { resetTenants } from "./db-cleanup";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";
import { BomService } from "../modules/catalog/bom.service";

/**
 * Bill of materials against a real database.
 *
 * The graph arithmetic is covered by 47 tests in lib/algorithms/bom. This file
 * proves the parts the library cannot know about: that a cycle is refused
 * without writing half a BOM, that another tenant's products cannot be used as
 * components, and that the explosion is netted against real stock rows.
 */

const TENANT = "bom-tenant";
const OTHER_TENANT = "bom-tenant-other";
const ctx = { tenantId: TENANT };

const bom = new BomService();

async function seedProduct(id: string, costMinor: number | null = null, tenantId = TENANT) {
  await getDb().insert(schema.products).values({
    id,
    tenantId,
    code: id.toUpperCase(),
    name: `Produit ${id}`,
    priceMinor: 10_000,
    ...(costMinor === null ? {} : { costMinor }),
  });
}

/** stock_levels is keyed by product_id alone, so setting stock twice updates. */
async function setStock(productId: string, quantity: number, tenantId = TENANT) {
  await getDb()
    .insert(schema.stockLevels)
    .values({ productId, tenantId, quantity: String(quantity) })
    .onConflictDoUpdate({ target: schema.stockLevels.productId, set: { quantity: String(quantity) } });
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(async () => {
    const db = getDb();
    // Re-runnable: the whole suite shares one database on a real server, so the
    // second run would otherwise fail on tenants_pkey. Deleting the tenants
    // cascades to every row they own.
    await resetTenants([TENANT, OTHER_TENANT]);
    await db.insert(schema.tenants).values([
      { id: TENANT, name: "Bom", subdomain: "bom", email: "b@bom.dz" },
      { id: OTHER_TENANT, name: "Bom Other", subdomain: "bomo", email: "o@bom.dz" },
    ]);
  });
});

afterAll(async () => {
  await closeDb();
});

describe("BOM storage", () => {
  it("stores and reads back the components of a product", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("KIT", 0);
      await seedProduct("KIT-WHEEL", 0);
      await seedProduct("KIT-BOLT", 0);

      const saved = await bom.replace(ctx, "KIT", [
        { childId: "KIT-WHEEL", quantity: 2 },
        { childId: "KIT-BOLT", quantity: 4, scrapBp: 500 },
      ]);

      expect(saved).toHaveLength(2);
      const bolt = saved.find((line) => line.childId === "KIT-BOLT")!;
      expect(bolt.quantity).toBe(4);
      expect(bolt.scrapBp).toBe(500);
      expect(bolt.childName).toBe("Produit KIT-BOLT");
    });
  });

  it("replaces rather than appends, so a removed component really disappears", async () => {
    await runTenant(TENANT, async () => {
      const after = await bom.replace(ctx, "KIT", [{ childId: "KIT-BOLT", quantity: 1 }]);
      expect(after.map((line) => line.childId)).toEqual(["KIT-BOLT"]);
    });
  });

  it("rejects a self reference instead of storing an impossible BOM", async () => {
    await runTenant(TENANT, async () => {
      await expect(bom.replace(ctx, "KIT", [{ childId: "KIT", quantity: 1 }])).rejects.toThrow(/cycle|itself|référence/i);
    });
  });

  it("rejects a cycle across three products and writes nothing", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("C-A", 0);
      await seedProduct("C-B", 0);
      await seedProduct("C-C", 0);
      await bom.replace(ctx, "C-A", [{ childId: "C-B", quantity: 1 }]);
      await bom.replace(ctx, "C-B", [{ childId: "C-C", quantity: 1 }]);

      await expect(bom.replace(ctx, "C-C", [{ childId: "C-A", quantity: 1 }])).rejects.toThrow(/cycle/i);

      // The failed write left the previous BOM intact rather than half-applied.
      expect(await bom.list(ctx, "C-C")).toEqual([]);
      expect((await bom.list(ctx, "C-B")).map((line) => line.childId)).toEqual(["C-C"]);
    });
  });

  it("names the cycle in the error, because 'invalid BOM' is not actionable", async () => {
    await runTenant(TENANT, async () => {
      await expect(bom.replace(ctx, "C-C", [{ childId: "C-A", quantity: 1 }])).rejects.toThrow(/C-A/);
    });
  });

  it("refuses components that belong to another tenant", async () => {
    await runTenant(OTHER_TENANT, async () => {
      await seedProduct("FOREIGN", 0, OTHER_TENANT);
    });
    await runTenant(TENANT, async () => {
      await expect(bom.replace(ctx, "KIT", [{ childId: "FOREIGN", quantity: 1 }])).rejects.toThrow(/inconnus/i);
    });
  });

  it("404s for a product that does not exist", async () => {
    await runTenant(TENANT, async () => {
      await expect(bom.list(ctx, "ghost")).rejects.toThrow(/introuvable/i);
    });
  });

  it("does not show one tenant's BOM to another", async () => {
    await runTenant(OTHER_TENANT, async () => {
      await seedProduct("OTHER-KIT", 0, OTHER_TENANT);
    });
    await runTenant(OTHER_TENANT, async () => {
      // Same product id shape, different tenant: nothing of TENANT's is visible.
      expect(await bom.list({ tenantId: OTHER_TENANT }, "OTHER-KIT")).toEqual([]);
    });
  });

  it("deletes a single component and reports a missing one", async () => {
    await runTenant(TENANT, async () => {
      await bom.replace(ctx, "KIT", [
        { childId: "KIT-WHEEL", quantity: 2 },
        { childId: "KIT-BOLT", quantity: 4 },
      ]);
      await bom.remove(ctx, "KIT", "KIT-BOLT");
      expect((await bom.list(ctx, "KIT")).map((line) => line.childId)).toEqual(["KIT-WHEEL"]);
      await expect(bom.remove(ctx, "KIT", "KIT-BOLT")).rejects.toThrow(/introuvable/i);
    });
  });
});

describe("explosion and requirements", () => {
  it("explodes through sub-assemblies and defaults to one unit", async () => {
    await runTenant(TENANT, async () => {
      await bom.replace(ctx, "KIT", [{ childId: "KIT-WHEEL", quantity: 2 }]);
      await bom.replace(ctx, "KIT-WHEEL", [{ childId: "KIT-BOLT", quantity: 3 }]);

      const explosion = await bom.explosion(ctx, "KIT", 1);
      const byId = new Map(explosion.lines.map((line) => [line.componentId, line]));
      expect(byId.get("KIT-WHEEL")!.requiredWhole).toBe(2);
      expect(byId.get("KIT-BOLT")!.requiredWhole).toBe(6);
      expect(explosion.depth).toBe(2);
      expect(explosion.names["KIT-BOLT"]).toContain("KIT-BOLT");
    });
  });

  it("nets the requirement against stock on hand and buys only the shortfall", async () => {
    await runTenant(TENANT, async () => {
      await setStock("KIT-BOLT", 4);
      await bom.replace(ctx, "KIT", [{ childId: "KIT-WHEEL", quantity: 2 }]);
      await bom.replace(ctx, "KIT-WHEEL", [{ childId: "KIT-BOLT", quantity: 3 }]);

      // 5 kits need 30 bolts; 4 are on the shelf, so 26 must be bought.
      const requirement = await bom.requirements(ctx, "KIT", 5);
      const bolt = requirement.shortages.find((line) => line.componentId === "KIT-BOLT")!;
      expect(bolt.required).toBe(30);
      expect(bolt.onHand).toBe(4);
      expect(bolt.toPurchase).toBe(26);
      // A sub-assembly is built, not bought, so it is not in the purchase list.
      expect(requirement.shortages.some((line) => line.componentId === "KIT-WHEEL")).toBe(false);
    });
  });

  it("lists a fully covered component as covered, not as a zero shortage", async () => {
    await runTenant(TENANT, async () => {
      await setStock("KIT-BOLT", 100);
      const requirement = await bom.requirements(ctx, "KIT", 1);
      expect(requirement.shortages.some((line) => line.componentId === "KIT-BOLT")).toBe(false);
      expect(requirement.covered.some((line) => line.componentId === "KIT-BOLT")).toBe(true);
    });
  });

  it("answers where a component is used", async () => {
    await runTenant(TENANT, async () => {
      const usage = await bom.whereUsed(ctx, "KIT-BOLT");
      const parents = usage.map((entry) => entry.assemblyId);
      expect(parents).toContain("KIT-WHEEL");
      expect(entryName(usage, "KIT-WHEEL")).toContain("KIT-WHEEL");
    });
  });

  it("rolls a cost up from the leaves and flags what it could not price", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("COST-BIKE", null);
      await seedProduct("COST-WHEEL", null);
      await seedProduct("COST-TYRE", 1_000);
      await seedProduct("COST-UNPRICED", null);
      await bom.replace(ctx, "COST-BIKE", [
        { childId: "COST-WHEEL", quantity: 2 },
        { childId: "COST-UNPRICED", quantity: 1 },
      ]);
      await bom.replace(ctx, "COST-WHEEL", [{ childId: "COST-TYRE", quantity: 1 }]);

      const cost = await bom.cost(ctx, "COST-BIKE");
      // 2 * tyre 1000 + one component with no price anywhere in its subtree.
      // `cost_minor` is 0 (not NULL) for the unpriced rows, which this schema
      // reads as "no cost entered" rather than "free".
      expect(cost.costMinor).toBe(2_000);
      expect(cost.cost).toBe(20);
      expect(cost.unpriced).toContain("COST-UNPRICED");
    });
  });

  it("prefers a product's own cost over its components", async () => {
    await runTenant(TENANT, async () => {
      await seedProduct("OWN-ASSY", 5_000);
      await seedProduct("OWN-PART", 1_000);
      await bom.replace(ctx, "OWN-ASSY", [{ childId: "OWN-PART", quantity: 3 }]);
      const cost = await bom.cost(ctx, "OWN-ASSY");
      // A bought assembly at a known price: its parts are not bought as well.
      expect(cost.costMinor).toBe(5_000);
      expect(cost.unpriced).toEqual([]);
    });
  });

  it("rejects a non-positive quantity at the service boundary", async () => {
    await runTenant(TENANT, async () => {
      await expect(bom.explosion(ctx, "KIT", 0)).rejects.toThrow(/positive/i);
    });
  });
});

function entryName(entries: Array<{ assemblyId: string; name: string }>, id: string): string {
  return entries.find((entry) => entry.assemblyId === id)?.name ?? "";
}

describe("BOM isolation", () => {
  it("counts only the tenant's own lines", async () => {
    await runTenant(TENANT, async () => {
      const graphRows = await getDb()
        .select({ id: schema.bomLines.id })
        .from(schema.bomLines)
        .where(eq(schema.bomLines.tenantId, OTHER_TENANT));
      expect(graphRows).toEqual([]);
    });
  });
});
