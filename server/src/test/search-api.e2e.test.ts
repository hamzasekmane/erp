import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";
import { CatalogService } from "../modules/catalog/catalog.service";
import { ClientsService } from "../modules/clients/clients.service";
import { buildSearchFilter, escapeLike } from "../shared/search-filter";

/**
 * Search as the API actually runs it.
 *
 * `search.e2e.test.ts` proves the normalization agrees across SQL and JS.
 * This file proves the wiring: that the list endpoints now find a row whose
 * spelling differs from the query, which is the user-visible bug, and that a
 * literal `%` in a query is treated as a character rather than a wildcard.
 */

const TENANT = "search-api-tenant";
const ctx = { tenantId: TENANT };

const catalog = new CatalogService({ summary: async () => ({}) } as never);
const clients = new ClientsService();

async function listProducts(search: string | undefined) {
  return catalog.listProducts(ctx, { page: 1, limit: 50, offset: 0, search });
}

async function listClients(search: string | undefined) {
  return clients.list(ctx, { page: 1, limit: 50, offset: 0, search });
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(async () => {
    await getDb().delete(schema.tenants).where(inArray(schema.tenants.id, [TENANT]));
    await getDb().insert(schema.tenants).values({ id: TENANT, name: "Search API", subdomain: "sapi", email: "s@sapi.dz" });
  });
  await runTenant(TENANT, async () => {
    await getDb().insert(schema.products).values([
      { id: "pr-ahmed", tenantId: TENANT, code: "AH-1", name: "أحمد للدراجات", priceMinor: 1000 },
      { id: "pr-laptop", tenantId: TENANT, code: "LP-1", name: "حاسوب محمول", priceMinor: 1000 },
      { id: "pr-percent", tenantId: TENANT, code: "PC-1", name: "Remise 50% spéciale", priceMinor: 1000 },
      { id: "pr-underscore", tenantId: TENANT, code: "US-1", name: "Modèle a_b", priceMinor: 1000 },
    ]);
    await getDb().insert(schema.clients).values([
      { id: "cl-mostafa", tenantId: TENANT, code: "CL-1", name: "مؤسسة المصطفى", email: "mostafa@example.dz" },
      { id: "cl-other", tenantId: TENANT, code: "CL-2", name: "Société Générale", email: "contact@sg.dz" },
    ]);
  });
});

afterAll(async () => {
  await closeDb();
});

describe("product search finds the same name written differently", () => {
  it("matches without the hamza the record carries", async () => {
    const result = await listProducts("احمد");
    expect(result.items.map((item) => item.id)).toContain("pr-ahmed");
  });

  it("matches with the hamza when the record does not have it", async () => {
    // The reverse direction matters just as much; a fold that only works one way
    // is a fold that half works.
    await runTenant(TENANT, async () => {
      await getDb().insert(schema.products).values({
        id: "pr-plain",
        tenantId: TENANT,
        code: "PL-1",
        name: "احمد للنقل",
        priceMinor: 1000,
      });
    });
    const result = await listProducts("أحمد");
    expect(result.items.map((item) => item.id)).toEqual(expect.arrayContaining(["pr-ahmed", "pr-plain"]));
  });

  it("matches through diacritics", async () => {
    const result = await listProducts("أَحْمَد");
    expect(result.items.map((item) => item.id)).toContain("pr-ahmed");
  });

  it("matches on the code as well as the name", async () => {
    const result = await listProducts("LP-1");
    expect(result.items.map((item) => item.id)).toContain("pr-laptop");
  });

  it("treats a literal % as a character, not a wildcard", async () => {
    // Before: the term was interpolated into a LIKE pattern, so searching "50%"
    // matched every row. Now it matches exactly the one product.
    const percent = await listProducts("50%");
    expect(percent.items.map((item) => item.id)).toEqual(["pr-percent"]);

    // And a lone % finds nothing rather than everything.
    const every = await listProducts("%");
    expect(every.items.every((item) => item.name.includes("%") || item.code.includes("%"))).toBe(true);
  });

  it("treats a literal _ as a character", async () => {
    const result = await listProducts("a_b");
    expect(result.items.map((item) => item.id)).toEqual(["pr-underscore"]);
    // "a_b" must NOT match "axb"-style names, which is what _ would do raw.
    const wildcard = await listProducts("a-b");
    expect(wildcard.items.map((item) => item.id)).not.toContain("pr-underscore");
  });

  it("returns everything for an empty search rather than filtering", async () => {
    const all = await listProducts(undefined);
    expect(all.items.length).toBeGreaterThanOrEqual(4);
    expect((await listProducts("   ")).items.length).toBe(all.items.length);
  });

  it("requires every word of a multi-word query", async () => {
    const both = await listProducts("حاسوب محمول");
    expect(both.items.map((item) => item.id)).toEqual(["pr-laptop"]);
    // A word that is not there must exclude the row, not be ignored.
    expect((await listProducts("حاسوب طائرة")).items).toEqual([]);
  });
});

describe("client search", () => {
  it("matches a name written with alef maqsura", async () => {
    // Stored المصطفى, searched with the yaa spelling.
    const result = await listClients("المصطفي");
    expect(result.items.map((item) => item.id)).toContain("cl-mostafa");
    expect((await listClients("المصطفى")).items.map((item) => item.id)).toContain("cl-mostafa");
  });

  it("still matches on email", async () => {
    const result = await listClients("mostafa@example.dz");
    expect(result.items.map((item) => item.id)).toEqual(["cl-mostafa"]);
  });

  it("matches a Latin name that carries an accent", async () => {
    const result = await listClients("societe generale");
    expect(result.items.map((item) => item.id)).toEqual(["cl-other"]);
  });
});

describe("buildSearchFilter", () => {
  it("escapes LIKE metacharacters", () => {
    expect(escapeLike("50%")).toBe("50\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("c:\\path")).toBe("c:\\\\path");
  });

  it("returns undefined for an empty query so no filter is added", () => {
    const column = schema.products.searchText;
    expect(buildSearchFilter(undefined, column)).toBeUndefined();
    expect(buildSearchFilter("", column)).toBeUndefined();
    expect(buildSearchFilter("   ", column)).toBeUndefined();
  });

  it("binds both tokens as parameters rather than splicing them into the SQL", async () => {
    // Rendered through a real query builder rather than by inspecting internals,
    // so this asserts the thing that matters: the values are parameters.
    const { PgDialect } = await import("drizzle-orm/pg-core");
    const dialect = new PgDialect();
    const filter = buildSearchFilter("دراجة هوائية", schema.products.searchText)!;
    const query = dialect.sqlToQuery(filter);
    // Normalized tokens, escaped, as bound parameters — never in the SQL text.
    expect(query.params).toEqual(["%دراجه%", "%هواييه%"]);
    expect(query.sql).not.toContain("دراجة");
    expect(query.sql.toLowerCase()).toContain(" and ");
  });
});
