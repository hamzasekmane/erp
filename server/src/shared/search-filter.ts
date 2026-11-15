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
   * Extra, non-normalized columns to match with a plain LIKE, e.g. phone or a
   * JOINed table's name.
   *
   * Two kinds appear here and they are not interchangeable:
   *
   * - `normalized` columns belong to a table that has a `search_text` column.
   *   They must be put in their own AND-ed alternative, because the column
   *   holds its whole row's text: comparing it against a single token would
   *   match any row containing any of the words.
   * - `raw` columns (email, phone, reference, a JOINed client name) have no
   *   normalized form, so the query is normalized and compared directly. Some
   *   loss is unavoidable and is listed in ADR-0008: a phone number stored in
   *   Arabic-Indic digits will not match an ASCII query through this path.
   */
  extras?: SQL[];
  /**
   * Whole-row search columns from other tables that already have their own
   * `search_text`. For invoices and payments that is the client's name; it is
   * searched as its own unit rather than per token, for the reason above.
   */
  normalizedExtras?: Array<Column | SQL>;
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
  const normalizedExtras = options.normalizedExtras ?? [];
  const phrase = tokens.join(" ");

  // A row matches if its own columns satisfy every token, or if one of its
  // related tables contains all of them in one field. The second branch is a
  // single group, not a per-token one: see the note on `normalizedExtras`.
  const perToken = tokens.map((token) => {
    const pattern = `%${escapeLike(token)}%`;
    const parts: SQL[] = [sql`${normalizedColumn} like ${pattern}`];
    for (const extra of extras) parts.push(sql`${extra} like ${pattern}`);
    return parts.length === 1 ? parts[0]! : sql`(${sql.join(parts, sql` or `)})`;
  });

  const branches: SQL[] = [sql`(${sql.join(perToken, sql` and `)})`];
  if (normalizedExtras.length > 0) {
    const pattern = `%${escapeLike(phrase)}%`;
    const related = normalizedExtras.map((extra) => sql`${extra} like ${pattern}`);
    branches.push(related.length === 1 ? related[0]! : sql`(${sql.join(related, sql` or `)})`);
  }

  return branches.length === 1 ? branches[0]! : sql`(${sql.join(branches, sql` or `)})`;
}
