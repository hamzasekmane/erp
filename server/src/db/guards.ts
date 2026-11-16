import { sql } from "drizzle-orm";
import { getDb } from "./client";

/**
 * Boot-time guards for conditions that are silent at runtime.
 *
 * Each of these checks something that produces no error when it is wrong — only
 * wrong results — which is precisely the class of defect an operator cannot
 * notice until a user reports it.
 */

type GuardResult = { ok: boolean; reason: string };

/**
 * Verifies that Arabic text actually produces trigrams in this database.
 *
 * WHY THIS CAN FAIL
 * -----------------
 * `pg_trgm` decides what a "word character" is from the database ctype
 * (`t_isalnum`, which short-circuits to `isalnum()` on the raw bytes when the
 * database is in the `C` locale). In a `C` database every Arabic letter is a
 * separator, so:
 *
 *     show_trgm('دراجة')            -> {}          (no trigrams)
 *     similarity('دراجة','دراجة')   -> 0           (even for identical text)
 *
 * Search then compiles, runs and returns nothing — no error anywhere. Measured on
 * PostgreSQL 16.2 with the same pg_trgm build:
 *
 *     C         database -> 0
 *     C.UTF-8   database -> 0.5294118
 *
 * The whole Arabic normalisation layer (migration 0014, ADR-0007) is built on
 * top of this, and it is useless without a UTF-8 ctype.
 */
export async function assertArabicSearchWorks(): Promise<GuardResult> {
  const rows = await getDb().execute(sql`
    select
      (select datctype from pg_database where datname = current_database()) as datctype,
      (select count(*) from pg_extension where extname = 'pg_trgm') as has_trgm,
      case
        when (select count(*) from pg_extension where extname = 'pg_trgm') = 0 then null
        else similarity('دراجة هوائية', 'دراجه هوائيه')
      end as arabic_similarity,
      case
        when (select count(*) from pg_extension where extname = 'pg_trgm') = 0 then null
        else array_length(show_trgm('دراجة'), 1)
      end as arabic_trigrams
  `);

  const row = firstRow(rows);
  if (!row) return { ok: false, reason: "could not read database search settings" };

  if (Number(row.has_trgm) === 0) {
    return { ok: false, reason: "the pg_trgm extension is not installed (run migrations)" };
  }

  // Not an error, but worth stating: no trigrams at all means the ctype is not
  // classifying Arabic as word characters.
  if (row.arabic_trigrams === null || Number(row.arabic_trigrams) === 0) {
    return {
      ok: false,
      reason:
        `pg_trgm produces no trigrams for Arabic text (database ctype: ${String(row.datctype)}). ` +
        "This database was created with the C collation; recreate it with C.UTF-8",
    };
  }

  const similarity = Number(row.arabic_similarity ?? 0);
  if (!(similarity > 0.4)) {
    return {
      ok: false,
      reason: `Arabic similarity is ${similarity} for a known-near pair (expected ~0.53); ctype is ${String(row.datctype)}`,
    };
  }

  return {
    ok: true,
    reason: `Arabic trigram search is functional (ctype ${String(row.datctype)}, similarity ${similarity.toFixed(3)})`,
  };
}

function firstRow(result: unknown): Record<string, unknown> | null {
  const rows = Array.isArray(result)
    ? result
    : ((result as { rows?: unknown[] })?.rows ?? []);
  return (rows[0] as Record<string, unknown>) ?? null;
}
