# ADR-0008 — Extending normalized search to the remaining modules

- **Status:** accepted
- **Date:** 2026-11-15
- **Related:** ADR-0007 (search normalization, which this completes)
- **Supersedes:** the "nine modules still on the old path" gap in ADR-0007

## Context

ADR-0007 migrated `products` and `clients` and left nine services on
`lower(col) like '%term%'`. Every one of them carried both original bugs: no
index, and no Arabic folding — so `احمد` returned nothing for a user stored as
`أحمد`.

They were not uniform, which is what made this worth a second ADR rather than a
mechanical sweep. Three shapes existed:

1. **Single-table, one or two columns** — `client_notes`, `support_tickets`,
   `archive_documents`, `users`.
2. **Single-table, four columns** — `employees` (first name, last name, code,
   email). Splitting the name across columns is why the old code needed four
   separate `like` clauses.
3. **Across a JOIN** — `invoices` and `payments` search their own number *plus*
   `clients.name` and `clients.email` from another table.

`tenants` is a fourth case: global reference data, searched administratively by
a superadmin, not tenant-scoped.

## Decision

**One declared table of searchable sources, one generator, one column per
table — and the JOINed columns stay out of the derived column.**

`src/db/scripts/generate-search.ts` declares, per table, exactly which columns
feed `search_text`. `npm run db:generate-search` emits migration `0016` from it.
This mirrors `generate-rls.ts`, for the same reason: eight nearly identical
blocks typed by hand is eight chances to drift from the rule set in
`lib/algorithms/search.ts`, and that drift is invisible until someone searches
without a hamza.

### Why the generator, not eight hand-written blocks

Each block is five statements (column, function, trigger, backfill, index) and
they must be identical in shape. The declaration is now the contract: adding a
searchable table is one entry, and the generator refuses to run if the entry has
no matching `searchText` column in `schema.ts` — verified by deleting one and
watching it fail with `tables declared searchable but missing a searchText
column in schema.ts: users`.

### Why invoices and payments search the client through the JOIN

`invoices.search_text` holds only the invoice number. The client's name is
matched through `clients.search_text`, in the query:

```ts
buildSearchFilter(query.search, invoices.searchText, {
  normalizedExtras: [clients.searchText],
  extras: [sql`lower(coalesce(${clients.email}, ''))`],
})
```

Copying the client's name into the invoice's derived column would be
**wrong**, not merely redundant: renaming a client would leave every invoice's
search text stale, and keeping it fresh would require a trigger on `clients`
that rewrites rows in `invoices` — a cross-table write on the hot path of a
rename.

The consequence is a semantic difference that is deliberate and tested: a token
from the invoice and a token from the client cannot be AND-ed together. The
branches are "the invoice's own text matches every token" OR "the client's text
matches the whole phrase". `دراجة` does not match an invoice whose client is
`المصطفى`, and there is a test for exactly that.

### Why `normalizedExtras` is a separate option from `extras`

A column with a `search_text` holds its whole row, so it must be compared
against the **whole phrase** in its own branch. Comparing it per token would
mean `nvidia quadro` matched a client whose text contains `nvidia` anywhere and
`quadro` anywhere else in unrelated words. Columns without a normalized form
(`clients.email`, `invoices.number` as reached from `payments`) are compared per
token, as before.

## Consequences

**Good.** All ten searchable entity tables now fold Arabic spellings and use a
trigram index. A query written once cannot drift between modules. Multi-column
sources are exercised in both benchmark and tests: searching `employees` by the
*second* column (last name) returns 400 rows, which is what proves the whole row
is indexed rather than only its first field.

**Costs / residual risks.**

- **Raw columns still cannot fold.** `clients.email`, `clients.phone` and the
  invoice number as reached from `payments` are compared with the normalized
  query against the original column. A phone number stored in Arabic-Indic digits
  will not match an ASCII query. The fix is to fold those columns too — which
  means deciding that an email's local part may be folded, a decision nobody has
  made.
- **`search_text` is derived, and only the trigger writes it.** Same risk as
  ADR-0007: a table recreated without its trigger degrades silently.
- **Two migrations were renumbered.** `0012_rls_bom` became `0013_rls_bom`
  because `0012` was already taken by drizzle-kit's `0011` successor, so two
  files shared an ordinal and applied in the wrong order — reproduced as
  `column "search_text" of relation "clients" already exists`. Search
  normalization moved to `0014`. Environments that applied the old `0012`/`0013`
  names need `_migrations` reconciled; deployments here had not run them yet.
- **`db:generate` cannot see hand-written migrations.** It re-emits the same
  `ADD COLUMN`s from `schema.ts`. `0016` therefore uses `ADD COLUMN IF NOT
  EXISTS`, `0017` exists only to carry a snapshot for those columns, and both
  facts are commented where they live. This is a standing hazard for every
  hand-written migration in this repository, not just search.
- **Search is still substring, not ranked.** Ordering is the caller's `sortBy`.

## Verification

| Gate | Result |
| --- | --- |
| Tables with `search_text` + trigram index | 10 (asserted individually) |
| `src/test/search-all.e2e.test.ts` | 20 tests, incl. both JOIN cases and the negative |
| Generator self-check | fails when a declared table lacks the column (reproduced) |
| Migration chain from empty DB | applies cleanly, 398 → 418 tests pass |
| `npm run db:generate` after the snapshot | "No schema changes, nothing to migrate" |
| Benchmark, employees | last name (2nd column) 400 rows, first name 200 rows |
| `npx tsc --noEmit` | clean |
| `npm test` | 418/418, 19 files |
| `npm run openapi` | 112 paths, no drift |
