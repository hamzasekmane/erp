# ADR 0005 — Inventory cost-flow valuation

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Product owner, Principal Architect
- **Related:** `server/lib/algorithms/valuation.ts`, `server/src/modules/catalog/stock-valuation.service.ts`, audit finding F-4

---

## Context

Stock was valued with one SQL expression:

```sql
coalesce(sum(coalesce(sl.quantity, 0) * p.cost_minor), 0)
-- catalog.service.ts:247
```

`products.cost_minor` is a single mutable column. This has three consequences,
all of them silent:

1. **Editing a product's cost retroactively revalues inventory that was bought
   months ago.** The stock report stops agreeing with what was actually paid,
   and nothing warns anyone.
2. **There is no cost of goods sold.** Issuing stock has no cost attached
   beyond that same number, so margin at the point of sale cannot be computed
   from history — only from whatever the cost column says today.
3. **It cannot express a physical cost-flow assumption.** FIFO, LIFO, weighted
   average and FEFO are not variations of one number; they are different
   answers to "which units left the warehouse".

Meanwhile the data to do this properly was already being written:
`stock_movements.unit_cost_minor` records the cost of every receipt, and the
movements are ordered by timestamp. Nothing read it for valuation.

## Decision

**Value inventory from the movement history using an explicit cost-flow
method, with the method chosen per request, and keep the static figure visible
next to it while the change beds in.**

The arithmetic is a framework-agnostic module,
`server/lib/algorithms/valuation.ts` (no Nest, no Drizzle, no I/O), so it is
property-tested and reusable. `StockValuationService` only does I/O: it
reconstructs layers from movements and delegates every calculation.

### Implemented methods

| Method | Ordering | Notes |
| --- | --- | --- |
| FIFO | ascending receipt sequence | the default, and the common Algerian practice |
| LIFO | descending receipt sequence | useful for comparison; prohibited under some frameworks |
| WAC | running average of value on hand | see the rounding rule below |
| FEFO | earliest expiry, then sequence | layers without an expiry sort **last**, never first |

### The rounding rule, which is where these libraries usually go wrong

Every amount is an integer in minor units (ADR-0002). Two divisions cannot be
avoided, and both are handled explicitly:

- **Issuing under WAC** allocates value pro rata: `cost = round(value * qty /
  onHand)`, and the final issue takes the remainder. Multiplying a *rounded
  average* instead loses up to half a minor unit per issue, and those losses
  compound — a warehouse drifts to being worth less than it cost after a few
  hundred movements. A property test asserts that, for 400 random layer sets
  and every method, `issued + remaining == starting value` **exactly**.
- **Value of remaining stock under WAC** is carried forward in
  `remainingValueMinor` rather than re-derived as `quantity * unitCostMinor`.
  The per-unit average is generally not an integer, so re-deriving it drifts by
  construction. This is a real API constraint and is documented on the type.

FIFO/LIFO/FEFO need no rounding: each issue consumes whole or partial layers at
their exact recorded cost.

### Refusals

The library rejects rather than guesses: fractional quantities, negative costs,
zero-quantity layers, duplicate layer ids, out-of-order sequences, and any issue
larger than what is on hand. An oversell is a data error; presenting it as a
zero-cost remainder would hide the inconsistency in the accounts.

### One bad product must not break the report

`valueAll` catches per-product valuation failures and reports them in
`problems` while still valuing every other product. A single oversold history
would otherwise make the stock dashboard unrenderable for the whole catalogue,
which is the worst possible failure mode for an exception-only view. The bad
product is named, not hidden.

## Consequences

### Positive

- Stock value follows what was actually paid. Editing a product's cost no longer
  changes the value of inventory bought earlier — asserted by a test that edits
  the cost to an absurd number and checks the valuation is unchanged.
- COGS becomes derivable per issue, which unblocks margin reporting.
- The static figure is still returned, as `staticCostAmount`, alongside
  `differenceMinor`, so the drift between the two bases is visible instead of
  being silently swapped.

### Negative / accepted costs

- **Valuation is O(m log m) in movement count and is recomputed on read.** At
  200 000 movements and 2 000 products it takes ~2.5 s on PGlite. The SQL
  aggregate it replaces takes 336 ms — but it is wrong. A materialised
  per-product value updated on each movement is the obvious next step if this
  becomes a dashboard-path problem.
- **`quantity` must be integral in the valuation path.** `stock_levels` allows
  3 decimals; layers cannot represent fractional units, so such a movement
  raises `FRACTIONAL_QUANTITY` rather than being truncated.
- **Two sources of truth exist during the transition.** Both are returned to
  make that explicit rather than to paper over it.

### Residual risks

1. **`adjustment` and `transfer` movements are skipped.** Neither carries a
   recoverable cost basis here. Skipping is honest but means an adjusted
   product's layers do not reflect the adjustment — the next real receipt
   anchors it. Recording a cost on adjustments, or a separate write-down table,
   is the fix.
2. **No expiry data.** `stock_movements` has no expiry column, so FEFO cannot
   be exercised end to end and `expiring()` returns an empty list. The method is
   implemented and tested at the library level, waiting for the column.
3. **`stock_levels` is not derived from movements.** The two can disagree if a
   write path bypasses `applyStock`; the summary surfaces the difference but
   nothing reconciles it automatically.
4. **Valuation is per request, not stored.** There is no `inventory_value`
   snapshot table, so reports cannot show "value at month end" without
   replaying to that date.
5. **LIFO is available but may not be permitted** under the tenant's accounting
   framework; that is a policy decision the product owner must make, and the
   endpoint accepts the method rather than enforcing one.

## Verification

- `lib/algorithms/valuation.test.ts` — 32 tests: FIFO/LIFO/FEFO/WAC ordering,
  partial and whole-layer issues, the rounding rule, every refusal, layer
  merging only on matching cost **and** expiry, expiry windows, plus property
  tests over 400 random layer sets covering value conservation, issue-count
  fidelity, FIFO≡LIFO at uniform cost, and receive/issue neutrality.
- `src/test/stock-valuation.e2e.test.ts` — 12 integration tests against the real
  schema with RLS on: value follows recorded cost, differs by method, is
  unaffected by a later product-cost edit, empties to exactly zero, refuses an
  oversold history, one bad product does not break the catalogue, and tenants
  cannot see each other's layers.
- `npm run bench:valuation` — 2 000 products / 200 000 movements:

| Method | Products valued | Units | Value (minor) | Time |
| --- | --- | --- | --- | --- |
| FIFO | 2 000 | 1 010 000 | 814 000 000 | 2 522 ms |
| LIFO | 2 000 | 1 010 000 | 805 000 000 | 2 510 ms |
| WAC | 2 000 | 1 010 000 | 808 866 000 | 2 478 ms |
| static cost basis (replaced) | — | — | 707 000 000 | 336 ms |

The three methods disagree, which is the point: they are different answers, not
three implementations of one. The static basis is 15 % below FIFO here because
it uses today's cost for units bought at older prices.
