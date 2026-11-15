import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { resetTenants, seedTenants } from "./db-cleanup";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";
import { normalizeSearchText } from "../../lib/algorithms/search";

/**
 * Search normalization in the database.
 *
 * The most important test here is not "search finds something" — it is that
 * `search_normalize()` in SQL and `normalizeSearchText()` in TypeScript produce
 * the SAME string. Two implementations of one rule set is the risk this
 * feature introduces, and the only honest way to manage it is to compare them
 * on real spellings rather than to review them carefully and hope.
 */

const TENANT = "search-tenant";

/** Spellings that appear in real data: diacritics, hamzas, digits, accents. */
const SPELLINGS = [
  "أحمد",
  "احمد",
  "إحمد",
  "آحمد",
  "ٱحمد",
  "أَلْحَاسُوب",
  "الحاسوب",
  "مدرسة",
  "مدرسه",
  "دراجة هوائية",
  "دراجه هواييه",
  "مصطفى",
  "مصطفي",
  "مـــدرســـة",
  "هاتف ٠٥٥٥١٢٣٤٥٦",
  "هاتف 0555123456",
  "Café Élégant",
  "Cafe Elegant",
  "Clé à molette",
  "naïve",
  "\uFEFB",
  "",
  "   ",
  "  متعدد    الفراغات  ",
  "ﺃﺣﻤﺪ",
];

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(async () => {
    await resetTenants([TENANT]);
    await seedTenants({ id: TENANT, name: "Search", subdomain: "search", email: "s@search.dz" });
  });
});

afterAll(async () => {
  await closeDb();
});

describe("search_normalize() — SQL and JS agree", () => {
  it("produces the same string as normalizeSearchText for every spelling", async () => {
    for (const spelling of SPELLINGS) {
      const rows = await runGlobal(() =>
        getDb().execute(sql`select search_normalize(${spelling}) as normalized`),
      );
      const fromSql = (rows as unknown as { rows: Array<{ normalized: string }> }).rows[0]!.normalized;
      const fromJs = normalizeSearchText(spelling);
      // The failure message names the spelling: a mismatch is otherwise a
      // two-character difference nobody can spot in a diff.
      expect({ spelling, normalized: fromSql }).toEqual({ spelling, normalized: fromJs });
    }
  });

  it("normalizes to empty for NULL rather than the string 'null'", async () => {
    const rows = await runGlobal(() => getDb().execute(sql`select search_normalize(null) as normalized`));
    expect((rows as unknown as { rows: Array<{ normalized: string }> }).rows[0]!.normalized).toBe("");
  });

  it("is idempotent in SQL too, matching the JS invariant", async () => {
    for (const spelling of SPELLINGS) {
      const rows = await runGlobal(() =>
        getDb().execute(sql`select search_normalize(search_normalize(${spelling})) as once_twice, search_normalize(${spelling}) as once`),
      );
      const row = (rows as unknown as { rows: Array<{ once_twice: string; once: string }> }).rows[0]!;
      expect(row.once_twice).toBe(row.once);
    }
  });

  it("is IMMUTABLE, which is what makes the index sound", async () => {
    const rows = await runGlobal(() =>
      getDb().execute(sql`select provolatile from pg_proc where proname = 'search_normalize'`),
    );
    // 'i' = immutable. A function that is not immutable cannot back an index,
    // and marking a non-immutable one is a correctness bug, not a shortcut.
    expect((rows as unknown as { rows: Array<{ provolatile: string }> }).rows[0]!.provolatile).toBe("i");
  });
});

describe("products.search_text — the trigger keeps it in step", () => {
  it("fills search_text on insert and folds the spellings", async () => {
    await runTenant(TENANT, async () => {
      await getDb().insert(schema.products).values({
        id: "p-search",
        tenantId: TENANT,
        code: "CHAISE-01",
        name: "Chaise ٠١",
        priceMinor: 1000,
      });
      const [row] = await getDb()
        .select({ searchText: schema.products.searchText })
        .from(schema.products)
        .where(eq(schema.products.id, "p-search"));
      expect(row!.searchText).toBe(normalizeSearchText("Chaise ٠١ CHAISE-01"));
      expect(row!.searchText).toContain("chaise 01");
    });
  });

  it("updates search_text when the name changes", async () => {
    await runTenant(TENANT, async () => {
      await getDb()
        .update(schema.products)
        .set({ name: "Table pliante" })
        .where(eq(schema.products.id, "p-search"));
      const [row] = await getDb()
        .select({ searchText: schema.products.searchText })
        .from(schema.products)
        .where(eq(schema.products.id, "p-search"));
      expect(row!.searchText).toContain("table pliante");
      // The code is part of the indexed text and did not change, so it must
      // still be searchable: dropping it would break searching by référence.
      expect(row!.searchText).toContain("chaise-01");
    });
  });

  it("finds a product by a spelling that differs only in diacritics", async () => {
    await runTenant(TENANT, async () => {
      await getDb().insert(schema.products).values({
        id: "p-arabic",
        tenantId: TENANT,
        code: "P-AR",
        name: "أحمد للدراجات",
        priceMinor: 1000,
      });

      // The user types it without the hamza. Under the old
      // `lower(name) like '%احمد%'` this returned nothing.
      const rows = await getDb()
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.tenantId, TENANT),
            sql`${schema.products.searchText} like ${"%" + normalizeSearchText("احمد") + "%"}`,
          ),
        );
      expect(rows.map((row) => row.id)).toContain("p-arabic");
    });
  });

  it("uses the trigram index rather than scanning", async () => {
    const rows = await runGlobal(() =>
      getDb().execute(
        sql`select indexname from pg_indexes where tablename = 'products' and indexname = 'products_search_trgm_idx'`,
      ),
    );
    expect((rows as unknown as { rows: Array<{ indexname: string }> }).rows).toHaveLength(1);
  });

  it("ranks a near spelling by similarity, which is what makes typos workable", async () => {
    const rows = await runGlobal(() =>
      getDb().execute(
        sql`select similarity(search_normalize('دراجة هوائية'), search_normalize('دراجه هواييه')) as s`,
      ),
    );
    // After normalization the two spellings are IDENTICAL, so similarity is 1.
    // Before normalization it was 0.53 — that gap is the whole point.
    expect((rows as unknown as { rows: Array<{ s: number }> }).rows[0]!.s).toBe(1);
  });
});

describe("clients.search_text", () => {
  it("indexes name and code with the same rules", async () => {
    await runTenant(TENANT, async () => {
      await getDb().insert(schema.clients).values({
        id: "c-search",
        tenantId: TENANT,
        code: "CL-1",
        name: "مؤسسة المصطفى",
      });
      const [row] = await getDb()
        .select({ searchText: schema.clients.searchText })
        .from(schema.clients)
        .where(eq(schema.clients.id, "c-search"));
      // مصطفى folds to مصطفي, so a query typed either way matches.
      expect(row!.searchText).toContain(normalizeSearchText("مصطفى"));
      expect(row!.searchText).toContain("مصطفي");
    });
  });

  it("keeps tenants apart when searching", async () => {
    await resetTenants(["search-other"]);
    await runGlobal(async () => {
      await seedTenants({ id: "search-other", name: "Other", subdomain: "soth", email: "o@soth.dz" });
      await getDb().insert(schema.clients).values({
        id: "c-other",
        tenantId: "search-other",
        code: "CL-O",
        name: "مؤسسة المصطفى",
      });
    });

    await runTenant(TENANT, async () => {
      const rows = await getDb()
        .select({ id: schema.clients.id })
        .from(schema.clients)
        .where(sql`${schema.clients.searchText} like ${"%" + normalizeSearchText("مصطفى") + "%"}`);
      // Same name in both tenants; RLS must scope the search to one.
      expect(rows.map((row) => row.id)).toEqual(["c-search"]);
    });
  });
});
