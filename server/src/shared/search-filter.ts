import { sql, type Column, type SQL } from "drizzle-orm";
import { normalizeSearchText } from "../../lib/algorithms/search";

/**
 * Turns a user's search box into one or more SQL conditions against a
 * normalized `search_text` column.
 *
 * Why this is centralized
 * -----------------------
 * Eleven modules duplicated `const term = \`%${search.toLowerCase()}%\`` and a
 * hand-written list of `lower(col) like term`. That has three consequences, and
 * only the first is about speed:
 *
 * 1. **No index.** A leading `%` defeats a btree, so every search was a
 *    sequential scan.
 * 2. **Arabic spellings did not match.** `أحمد` and `احمد` are the same person;
 *    `lower()` does not know that. The normalized column does, and the fold has
 *    to be applied to the *query* with the same rules as the column — which is
 *    the one thing a copy-pasted `toLowerCase()` gets wrong.
 * 3. **Injection-adjacent sloppiness.** Interpolating a user string into a LIKE
 *    pattern means `%` and `_` in the input act as wildcards. A user searching
 *    for "50%" matched everything; that is a correctness bug, not a nicety.
 *
 * The `search_text` column is maintained by a database trigger (migration 0013),
 * so callers only pass the columns they want searched and this builds the
 * condition.
 */

/** Escapes LIKE metacharacters so user input is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type SearchOptions = {
  /**
   * Extra, non-normalized columns to match with a plain LIKE, e.g. email or
   * phone. These are compared raw on purpose: normalizing a phone number
   * converts its Arabic-Indic digits, which is right, but normalizing an email
   * would also strip accents from a local part where they may be significant.
   * They are also lowercased when `lowercaseExtras` is set.
   */
  extras?: SQL[];
};

/**
 * Builds the search condition for one query string.
 *
 * A multi-word query is an AND across tokens: "دراجة هوائية" must match a row
 * containing both words, in any order. Matching the whole phrase as one LIKE
 * would only find that exact sequence, which is not how people search.
 *
 * Returns `undefined` for an empty/whitespace query so callers can simply not
 * add a filter — and so an empty search never becomes `like '%%'`, which looks
 * harmless but forces a full scan and makes "no filter" and "match everything"
 * indistinguishable in query plans.
 */
export function buildSearchFilter(
  search: string | undefined,
  normalizedColumn: Column | SQL,
  options: SearchOptions = {},
): SQL | undefined {
  if (!search) return undefined;
  const tokens = normalizeSearchText(search).split(" ").filter((token) => token.length > 0);
  if (tokens.length === 0) return undefined;

  const extras = options.extras ?? [];
  const conditions = tokens.map((token) => {
    const pattern = `%${escapeLike(token)}%`;
    const parts: SQL[] = [sql`${normalizedColumn} like ${pattern}`];
    for (const extra of extras) parts.push(sql`${extra} like ${pattern}`);
    // Every token must appear somewhere in the row.
    return parts.length === 1 ? parts[0]! : sql`(${sql.join(parts, sql` or `)})`;
  });

  return conditions.length === 1 ? conditions[0]! : sql`(${sql.join(conditions, sql` and `)})`;
}
