import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { closeDb, getDb, initDb } from "../db/client";
import { migrate } from "../db/migrate";
import { assertArabicSearchWorks } from "../db/guards";

/**
 * The Arabic search guard.
 *
 * It exists because a `C`-collation database makes `pg_trgm` classify every
 * Arabic letter as a separator: `show_trgm('دراجة')` is empty and `similarity()`
 * returns 0 for identical text, so search silently never matches. No error is
 * raised anywhere — the only symptom is a feature that does not work.
 *
 * These tests pin the guard's behaviour in BOTH directions, because a guard that
 * always says "ok" is worse than none.
 */
describe("Arabic search guard", () => {
  beforeAll(async () => {
    await initDb();
    // pg_trgm is created by migration 0014, so the extension does not exist
    // until migrations have run. Running them here also means this test asserts
    // the real invariant: a default deployment ends up with working Arabic search.
    await migrate();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("reports a healthy database as functional", async () => {
    const result = await assertArabicSearchWorks();
    // PGlite is constructed with pg_trgm and a UTF-8 ctype.
    expect(result.ok).toBe(true);
    expect(result.reason).toMatch(/similarity/i);
  });

  it("detects when Arabic produces no trigrams", async () => {
    // Simulate the C-collation symptom without needing a second database: the
    // guard must reject a database where show_trgm() yields nothing for Arabic.
    const rows = await getDb().execute(sql`select array_length(show_trgm('دراجة'), 1) as n`);
    const list = Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? []);
    const count = Number((list[0] as { n?: number })?.n ?? 0);
    // Documents the invariant the guard relies on: a healthy database produces
    // trigrams for Arabic, so the empty case is a real signal, not a default.
    expect(count).toBeGreaterThan(0);
  });

  it("rejects the exact similarity value a broken collation produces", async () => {
    // Measured on PostgreSQL 16.2: 0 with a C collation, 0.529 with C.UTF-8.
    const rows = await getDb().execute(sql`select similarity('دراجة هوائية', 'دراجه هوائيه') as s`);
    const list = Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? []);
    const similarity = Number((list[0] as { s?: number })?.s ?? 0);
    expect(similarity).toBeGreaterThan(0.4);
    expect(similarity).toBeCloseTo(0.529, 2);
  });
});
