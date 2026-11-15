# ADR-0007 — Search: normalized columns, trigram index, and the JS/SQL mirror

- **Status:** accepted
- **Date:** 2026-11-15
- **Related:** ADR-0006 (BOM/MRP)

## Context

Every module searched with the same three lines:

```ts
const term = `%${query.search.toLowerCase()}%`;
or(sql`lower(${products.name}) like ${term}`, sql`lower(${products.code}) like ${term}`)
```

Eleven modules, copied. It has three separate problems, and they are worth
keeping distinct because they have different fixes:

1. **It cannot use an index.** A leading `%` defeats a btree, so every search was
   a sequential scan. Measured here: `Seq Scan` on 20 000 rows.
2. **Arabic spellings do not match.** `أحمد` and `احمد` are the same person.
   `lower()` does not know that, and neither does pg_trgm: **measured on this
   database, `similarity('دراجة هوائية', 'دراجه هوائيه')` = 0.53**, not 1,
   because trigrams are computed on raw characters. A user searching without the
   hamza that the record carries got **zero rows** — the row exists, it is simply
   unreachable.
3. **The input was spliced into a LIKE pattern.** Searching for `50%` matched
   every row, because `%` in the *user's* text acted as a wildcard.

## Decision

**Normalize into an indexed column, keep the rule set in one library, and mirror
it exactly in SQL — with a test that proves the two agree.**

- `lib/algorithms/search.ts` — `normalizeSearchText`, `tokenize`,
  `levenshtein`, and a `SearchTrie` with prefix, completion, fuzzy and
  remove/re-insert support. Framework-free, so it is testable as pure functions.
- `search_normalize(text)` in SQL (migration 0014), **`IMMUTABLE`**, mirrored
  rule-for-rule.
- `products.search_text` and `clients.search_text`, maintained by a trigger, with
  a GIN `gin_trgm_ops` index.
- `src/shared/search-filter.ts` — one builder for the query side, so the
  normalization applied to the *query* cannot drift from the one applied to the
  *column*.

### The normalization rules, and why each is there

| Rule | Example | Why |
| --- | --- | --- |
| Strip diacritics | `اَلْحَاسُوب` → `الحاسوب` | Nobody types tashkeel; a column that stores it is unsearchable |
| Fold alef forms | `أ إ آ ٱ` → `ا` | The single most common reason an Arabic search fails |
| Fold hamza carriers | `ئ` → `ي`, `ؤ` → `و` | `هوائية` and `هواييه` are the same word |
| Fold alef maqsura | `ى` → `ي` | `مصطفى` / `مصطفي` |
| Fold taa marbuta | `ة` → `ه` | `مدرسة` / `مدرسه` — a deliberate recall/precision trade |
| Remove tatweel | `مـــدرســـة` | Purely decorative elongation |
| Arabic-Indic digits | `٠٥٥٥` → `0555` | A phone number typed in Arabic digits must match |
| NFKC first | `ﻻ` → `لا` | Presentation forms and ligatures are not separate letters |
| NFKD/NFD accents last | `Café` → `cafe` | Latin names in the same fields |

Order is not cosmetic. **Arabic folds run before any NFD**, because NFD
decomposes the hamza carriers (`أ` → `ا` + U+0654), which would make the alef
rule look like it works by accident, via the diacritic strip. One such accident
was found during development: `هوائية` normalized to `هواييه` through the
accident, and the JS and SQL agreed only because both were wrong in the same
way. Folding the carriers explicitly made the rule visible in both languages.

### Why the JS/SQL mirror, and how the risk is managed

Two implementations of one rule set is the real cost of this decision, and it
should not be pretended away. The alternatives were worse:

- **SQL only**, with the JS library just calling the function: the trie and
  fuzzy matcher would then have no normalization to operate on, and every unit
  test would need a database.
- **JS only**, normalizing at the application boundary: requires rewriting every
  row on every deploy and cannot be enforced against a direct `INSERT`.

So the mirror exists, and **`src/test/search.e2e.test.ts` asserts that
`search_normalize(x)` equals `normalizeSearchText(x)` for 25 real spellings**,
including diacritics, all four alef forms, presentation forms, Arabic-Indic
digits, Latin accents, empty strings and whitespace-only input. It also asserts
idempotence in SQL, matching the JS property test, and that the function is
`IMMUTABLE` — because an index over a function that is not truly immutable is
silently wrong, not merely slow.

`normalize()` with Unicode forms is available in PostgreSQL 17, which is what
makes the SQL a mirror rather than an approximation. On an older server the SQL
side would have had to reimplement NFKC by hand, and this decision would need
revisiting.

### The trie, and why both it and SQL exist

The `products` / `clients` search runs in SQL because that is where the data is.
`SearchTrie` exists for the cases SQL is bad at, and is not dead code:

- **Type-ahead completions** need the distinct tokens under a prefix, which is a
  trie walk; `SELECT DISTINCT` over a trigram index would scan far more.
- **Bounded fuzzy matching** (`kitten` ~ `sitten`) walks the trie with one DP row
  per depth, abandoning a subtree as soon as its row minimum exceeds the bound.
  That prunes almost everything on a typo in the first letter; a Levenshtein
  UDF in SQL would compare the query against every row.

Its correctness is pinned by property tests against brute force: the trie must
never *miss* a document brute force finds, and must never *invent* one beyond the
bound.

## Consequences

**Good.** A search finds the row regardless of which spelling either side used —
in both directions, which the tests assert separately because a fold that works
one way is a fold that half works. The query uses
`Bitmap Index Scan on products_search_trgm_idx` instead of `Seq Scan`
(reproduced in `npm run bench:search`, which prints the plan rather than
asserting the claim in prose). User input is a bound parameter, so `50%` matches
one row instead of every row.

**Costs / residual risks.**

- **The mirror can drift.** Mitigated by the parity test, but a future rule added
  in one language and not the other is a real hazard. Treat that test as the
  contract.
- **`search_text` is written by a trigger only.** If a future migration recreates
  `products` without the trigger, search silently degrades to matching raw
  normalized-at-write text against normalized queries — which still works for
  folds but loses nothing else, because the column itself is the index. The
  trigger guard (`IS DISTINCT FROM`) means an unrelated `UPDATE` cannot clobber
  the column.
- **Taa marbuta folding conflates** genuinely distinct words. Accepted for
  recall; recorded here so it is a decision rather than a surprise.
- **Search is substring, not ranking.** `like '%token%'` has no relevance score,
  so results are ordered by the caller's `sortBy`. pg_trgm's `similarity()` is
  available and used in the tests, but not wired into ordering: doing so without
  measuring it on real query loads would be guessing.
- **Only `products` and `clients` are migrated.** The other nine modules still
  use the old path. They are not broken (they still match exactly-spelled text)
  but they have the same two bugs; migrating them is mechanical and was left out
  to keep this slice reviewable. This is the largest outstanding gap.
- **Email and phone are matched raw**, not through `search_text`, so a phone
  number written in Arabic-Indic digits will not match one stored in ASCII. The
  normalized column does not include them because a client's email can contain
  characters that folding would corrupt.

## Verification

| Gate | Result |
| --- | --- |
| `lib/algorithms/search.test.ts` | 45 tests incl. 4 property suites |
| SQL/JS parity | 25 spellings, identical output, asserted per spelling |
| Idempotence | asserted in JS (incl. 2¹¹ generated strings) and in SQL |
| `search_normalize` volatility | `provolatile = 'i'` (immutable) |
| `src/test/search.e2e.test.ts` | 11 tests |
| `src/test/search-api.e2e.test.ts` | 14 tests, old-bug cases included |
| Plan, 20 000 products | old `Seq Scan` vs new `Bitmap Index Scan on products_search_trgm_idx` |
| Recall (benchmark) | Arabic without hamza: 0 → 667 rows; Latin without accent: 0 → 2 666 |
| Speed (20 000 products) | Arabic 18.2 → 8.3 ms; Latin 13.9 → 8.2 ms |
| `npx tsc --noEmit` | clean |
| `npm test` | 398/398, 18 files |
| `npm run openapi` | 112 paths, no drift |
| `npm audit --omit=dev` | 0 vulnerabilities |
