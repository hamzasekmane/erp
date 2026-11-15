# ADR 0004 — Double-entry ledger

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Product owner, Principal Architect
- **Related:** `server/src/modules/ledger/`, `server/drizzle/0008_ledger.sql`, `0009_ledger_guards.sql`, `0010_rls_ledger.sql`

---

## Context

The platform recorded money in exactly one place: columns on business rows
(`invoices.total_minor`, `invoices.paid_minor`, `payments.amount_minor`). Those
columns answer "what does this invoice say" but cannot answer any of the
questions a business actually asks of its books:

- What is the total receivable at a date?
- Why did revenue change between two months?
- Which account does cash sit in, and does it reconcile?
- What was the VAT position for a period?

They also cannot express a correction. If a payment is recorded against the
wrong invoice, the "fix" is to edit the payment row — which silently rewrites
history and destroys the audit trail.

The audit (finding ACC-1) recommended a real ledger. The brief added the
constraints that shaped the design: no hardcoded accounts, a chart derived from
a replaceable Algerian SCF-compatible template, immutable journals with
debits = credits enforced in **both** the database and the domain, reversals
rather than deletes, posting inside the same transaction as the business write,
and a trial balance.

### What was established before designing

Verified empirically against PostgreSQL 17.5 (the PGlite engine used by dev and
CI), not assumed:

| Question | Result |
| --- | --- |
| Can a `DEFERRABLE INITIALLY DEFERRED` constraint trigger enforce per-entry balance? | Yes — fires at COMMIT, so multi-statement posting works |
| Does it still fire when the work happened inside a savepoint (nested Drizzle transaction)? | Yes |
| Is an unbalanced entry rejected at COMMIT, leaving no rows? | Yes |
| Do `BEFORE UPDATE`/`BEFORE DELETE` triggers block mutation? | Yes, with a custom message and `restrict_violation` |
| Do closure-table recursive queries work? | Yes |

## Decision

**Every money movement posts a balanced journal entry, and the ledger is
append-only.**

### 1. Schema

| Table | Purpose |
| --- | --- |
| `accounts` | Tenant-owned chart. `code` is the tenant's own numbering; `system_role` marks the accounts posting resolves |
| `account_closure` | `(ancestor, descendant, depth)` — the hierarchy, so subtree queries are one join |
| `journal_entries` | The posting unit. Immutable. `reverses_entry_id` / `reversed_by_entry_id` link corrections |
| `journal_lines` | Debits and credits as **separate non-negative columns** |
| `accounting_periods` | Opt-in period locks |

`journal_lines` deliberately does **not** use one signed `amount` column. With a
signed amount, "debits = credits" becomes a tautology that cannot be violated —
hiding exactly the error worth catching. Two columns plus a `CHECK` that a line
is exactly one of them makes the constraint real.

### 2. Balance enforced twice, on purpose

- **Domain** (`ledger.domain.ts`): `validatePosting` rejects fewer than two
  lines, a line that is both or neither side, non-integer amounts, negative
  amounts, and any imbalance. It runs *before* any write, so a bad posting never
  touches the database and the caller gets a precise message.
- **Database** (`0009_ledger_guards.sql`): a `DEFERRABLE INITIALLY DEFERRED`
  constraint trigger re-checks at COMMIT, plus check constraints on every line.

The duplication is the point. The domain check gives an actionable error; the
database check is the guarantee that survives a future bug, a raw SQL
migration, or a service that forgets to call the validator.

### 3. Immutability by trigger, not by convention

`journal_entries` and `journal_lines` reject `UPDATE` and `DELETE` with a
trigger that raises `restrict_violation` and tells the caller to post a reversal.
A correction is a new entry, linked both ways.

This is what makes the trial balance reproducible: recomputing last month gives
last month's answer, forever.

### 4. Posting inside the caller's transaction

`postInTx(tx, input)` takes the transaction handle the business write already
uses. Invoice creation and payment settlement call it inside their existing
`db.transaction`, so there is no window where an invoice exists without its
entry. The invoice-creation test asserts the rollback half of this explicitly:
if posting fails (e.g. a locked period), **no invoice row is written either**.

No outbox, no "post later", no retry queue for postings. An asynchronous posting
path would make "the books are wrong and we don't know since when" a supported
state.

### 5. Accounts resolved by role, never by code

Posting looks up `system_role` (`receivable`, `revenue`, `vat_output`,
`discount_allowed`, `cash`, `bank`, `payable`, `vat_input`). A partial unique
index guarantees at most one active account per role per tenant.

This is what makes the chart replaceable: the shipped Algerian SCF template is
**data** (`chart-of-accounts.template.ts`), seeded into the tenant's own tables
at registration. A tenant may renumber, rename, add or deactivate anything; as
long as the roles are filled, posting keeps working. Nothing in the application
refers to `"411"` or `"701"`.

A missing role is a hard failure (`LEDGER_ACCOUNT_MISSING`, 422), never a
silently skipped posting.

### 6. Closure table for the hierarchy

`account_closure` stores every `(ancestor, descendant, depth)` pair, including
self-rows at depth 0. Chosen over a parent pointer because every report
aggregates over **subtrees**: with a closure table "balance of class 4" is one
indexed join; with a parent pointer it is a recursive CTE per query.

Cycles are structurally impossible to represent, and `buildClosure` rejects
them explicitly rather than looping. Measured cost: 200 ms to compute a subtree
balance over 1 000 000 lines (see below).

### 7. Invoice posting shape

```
  Receivable               total
    Revenue                       subtotal + shipping.  (gross)
    VAT output                              tax
  Discount allowed          discount      (contra-revenue, debit)
```

Revenue is posted **gross** with the discount as a separate contra-revenue
debit, so "how much did we give away" stays answerable from the ledger alone.
The invariant `AR = revenue + VAT − discount` is asserted per invoice in tests.

> **This bug found itself.** The first implementation debited receivable *and*
> debited the discount while crediting **net** revenue, and omitted shipping.
> The domain balance check rejected it immediately with
> `Unbalanced entry: debits 23325 != credits 20825` — off by exactly
> `discount + shipping`. The guarantee caught the very code that implements it,
> which is the strongest evidence available that it works.

### 8. Drafts are not posted

A draft invoice has not been billed, so it has no accounting consequence. It is
posted when it becomes `sent`. Tested.

## Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Single signed `amount` column per line | Makes the balance invariant unrepresentable, so it cannot be violated — and cannot be checked |
| Update-in-place corrections | Destroys history; makes the trial balance unreproducible |
| Application-only enforcement | The one class of bug the ledger exists to prevent (a code path that writes lines without balancing) is precisely the one application checks miss |
| Post asynchronously via the outbox | Books that silently lag reality, with no way to tell when they diverged |
| Hardcoded SCF account codes | Breaks the moment a tenant renumbers; the brief explicitly forbids it |
| Nested-set or materialised path for the hierarchy | Closure table has simpler invariants, O(1) subtree queries and no rebalancing on insert |
| Net revenue instead of gross + contra-revenue | Balances with fewer lines but destroys the discount information permanently |

## Consequences

### Positive

- The books are provable: 1 000 002 lines, 0 unbalanced entries, trial balance
  balanced globally and per account.
- Corrections are auditable — a reversal is a visible, linked entry.
- The chart is genuinely replaceable per tenant.
- Posting cannot be forgotten: it is inside the business transaction.

### Negative / accepted costs

- **Every invoice and payment write is now a larger transaction** (validations,
  entry, two or more lines, triggers). Measured at 131 ms per posting with
  500 000 entries present on WASM; on real PostgreSQL this is far lower.
- **A missing system role breaks invoicing** (422) rather than degrading. This is
  intended, but it means seeding a chart is a hard prerequisite — handled by
  seeding at registration inside the same transaction.
- **Two more migrations to keep in step.** Mitigated by the RLS generator's
  drift guard, which refuses to run when a table has no policy.
- **Depreciation, payroll and stock postings are not implemented.** The ledger is
  minimal as specified: chart, journals, trial balance, reversals, period locks.

### Residual risks

1. **Payments post to `cash` or `bank` by a method-name heuristic**
   (`method === "CASH"`). That is a guess about business intent, not a fact the
   schema knows. A tenant-specific method→account mapping is the real fix.
2. **Shipping is credited to `revenue`.** SCF would typically use a separate
   `707` produits accessoires. Acceptable for a minimal ledger; must be split
   before the chart is used for statutory reporting.
3. **VAT is not settled.** `vat_output` accumulates; there is no declaration or
   settlement entry against `vat_input`. Out of scope, but it means the VAT
   accounts are not the filing numbers yet.
4. **Period locking is per calendar date range, not per fiscal year**, and there
   is no year-end close that moves `revenue`/`expense` to `12` Résultat.
5. **Bulk loading must disable triggers** (`session_replication_role = replica`),
   which needs a superuser. That is standard for data loads, but it means the
   benchmark's 1M-line fixture is *not* proof that per-entry enforcement scales
   to 500 000 postings — only that the invariants hold afterwards.

## Performance evidence

`npm run bench:ledger` — 500 000 balanced entries, **1 000 002 journal lines**,
PGlite (PostgreSQL 17.5, single-threaded WASM, no parallel query, sandbox
hardware). These are a floor: real PostgreSQL on the same schema will be
faster.

| Operation | Time |
| --- | --- |
| Seed 500 000 entries | 13 437 ms |
| Seed 500 000 debit lines | 8 358 ms |
| Seed 500 000 credit lines | 9 220 ms |
| **Trial balance** (whole tenant, 1M lines) | **1 399 ms** |
| **Subtree balance via closure** (class 4) | **212 ms** |
| Account statement (one account, one month, LIMIT 1000) | 395 ms |
| Entry lookup by source, limit 20 | 313 ms |
| **Post one balanced entry** (2 lines, all triggers) | **131 ms** |
| **Trial balance, small tenant** (isolation) | **1 ms** |

The last row is the RLS payoff: a tenant with 2 lines queries its books in 1 ms
regardless of another tenant holding a million rows.

**The benchmark found a real performance bug.** The first numbering trigger used
`max(regexp_replace(number, ...))` over every matching row — a full scan of
500 000 rows. Posting took **1 070 ms**. Rewritten as an `ORDER BY number DESC
LIMIT 1` index-only scan: **131 ms**, an 8× improvement, and now O(log n)
instead of O(n) in the number of entries.

## Verification

- `server/src/modules/ledger/ledger.domain.test.ts` — 22 tests: rejection cases,
  **2 000 randomly generated balanced entries** (property-based, deterministic
  seed) plus 200 reversal round-trips that must net to zero; cycle, self-parent,
  dangling-parent and duplicate detection in `buildClosure`.
- `server/src/test/ledger.e2e.test.ts` — 24 integration tests against the real
  schema with RLS on: chart seeded at registration, closure built, idempotent
  re-seed, invoice posting shape and the `AR = revenue + VAT − discount`
  invariant, drafts not posted, **rollback when posting fails**, payment posting,
  database-level rejection of `UPDATE`/`DELETE`, reversal round-trip, reversal of
  a reversal refused, trial balance balanced globally and per account,
  unbalanced insert rejected at COMMIT outside the service, sequential
  numbering, and cross-tenant invisibility of accounts and entries.
- `server/src/test/rls.e2e.test.ts` — the 5 ledger tables are covered by the
  same cross-tenant leak tests as every other table.
- `npm test` — **217 tests pass**.
