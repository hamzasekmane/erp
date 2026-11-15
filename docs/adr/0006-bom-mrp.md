# ADR-0006 — Bill of materials as a DAG, exploded level by level

- **Status:** accepted
- **Date:** 2026-11-15
- **Supersedes:** nothing
- **Related:** ADR-0005 (inventory valuation)

## Context

The catalogue knows products and their stock, but not that one product is built
from others. Without that, an ERP cannot answer either question that actually
drives purchasing:

1. *What does one bike need?* — the component list, at every level.
2. *What do I have to buy to build fifty bikes?* — the same, netted against
   what is already on the shelf.

Both are graph problems, and the naive implementation of the second is wrong in
a way that is easy to miss: a **diamond**. If a bolt is needed by both the wheel
and the frame, a depth-first walk that stops at the first sighting of the bolt
reports the wheel's bolts *or* the frame's, never both. For one bike that is 20
or 40 bolts instead of the correct 60, and the error only appears on BOMs that
share a component — which is most real ones.

There is also a correctness trap in the other direction: a cycle (A needs B, B
needs A) turns a naive explosion into an infinite loop or a stack overflow, and
a stack overflow on a customer's data is a 500, not an explanation.

## Decision

**The BOM is a directed acyclic graph stored one edge per row, and it is
exploded breadth-first by level with the arithmetic in a framework-free
library.**

`lib/algorithms/bom.ts` holds all of it: validation, cycle detection,
topological order, explosion, net requirement, where-used, rolled-up cost. It
has no NestJS, no Drizzle, no database handle — so it is testable as pure
functions (47 tests, 6 of them property-based over random DAGs) and reusable
from a background worker.

Stored as `bom_lines (tenant_id, parent_id, child_id, quantity, scrap_bp)`.
Quantities are `numeric(18,3)`, matching `stock_levels`, so a BOM may call for
2.5 m of cable.

### Specific rules, and why

- **Level-by-level accumulation, not DFS.** Each level's requirements are
  computed *before* descending, so a shared component is summed across every
  path exactly once per path. `sources` records which parents contributed, so
  the number can be explained rather than just returned.
- **Round up once, at the end.** `requiredMilli` is exact; `requiredWhole` is a
  single ceiling of the exact total. Ceiling at every level compounds: three
  levels needing 1.001 units each give 2 per level and 8 overall, when the truth
  is 2.
- **Duplicate `parent → child` pairs are rejected, not summed.** "A needs 2
  bolts" and "A needs 3 bolts" has two plausible readings, and silently choosing
  one makes the BOM depend on insertion order. The DB enforces `UNIQUE
  (tenant_id, parent_id, child_id)`; a self-reference is a CHECK constraint; a
  cycle is caught in application code because the database cannot express it.
- **`replace` semantics for the whole component list.** A BOM is read as a
  sentence ("a bike is two wheels and a frame"). Patching it line by line leaves
  room for a deletion the caller forgot, so `PUT /products/:id/bom` replaces the
  set. The proposed graph is validated *before* anything is written, and the
  write is one transaction: a cycle is refused without half a BOM landing.
- **A cycle error names the cycle.** `C-A — … -> C-B — … -> C-C — … -> C-A`,
  because "invalid BOM" tells a user nothing they can act on.
- **Net requirement lists leaves only, by default.** A sub-assembly is built,
  not bought, so listing it as a purchase orders it twice. `includeAssemblies`
  is opt-in for the cases where an assembly genuinely is purchased.
- **Rolled-up cost treats a product's own `cost_minor` as authoritative.** If
  the frame is bought at a known price, adding its bolts on top double-counts
  the material. Components with no price anywhere in their subtree are returned
  in `unpriced[]` rather than silently costed at zero.
- **A non-positive root quantity is a 400, not an empty plan.** Exploding "0
  bikes" produces a plausible-looking empty list that hides the bug at the call
  site.

### Tenant isolation

`bom_lines` carries `tenant_id` and is covered by a forced RLS policy in
`0013_rls_bom.sql`. That is a **new wave**, not an edit to `0007_rls.sql`: 0007
is already applied in every environment and editing it would apply to nobody.
The generator, the RLS test's table list and the `products` FK check all belong
in the same commit as the table, or the guards fail on the next run.

## Consequences

**Good.** Purchasing has a defensible number, and it is explainable: every line
carries the parents that pulled it in, and a plan never silently drops a shared
component. Cycles fail with a message that names the products. The arithmetic is
covered by property tests, so a rewrite that double-counts a diamond fails a
test rather than a customer's order.

**Costs / residual risks.**

- `products.cost_minor` is `NOT NULL DEFAULT 0`, so the schema **cannot
  distinguish "no cost entered" from "this item is free"**. The service treats
  `0` as missing, which means a genuinely free component is reported as
  `unpriced`. Fixing this properly means a nullable `cost_minor` or an explicit
  `cost_source` column — a migration, not a service change; out of scope here.
- The whole tenant's graph is loaded per request and validated per write. That
  is O(V + E) and fine for catalogue-sized BOMs, but it is recomputed each time;
  a very large manufacturer would want a cached graph or a materialised closure.
- Explosion is per-product and does not consider lot sizes, lead times, capacity
  or calendars. It answers "what does this take", not "when can I build it".
- Where-used is depth-limited by the graph size and does not report the quantity
  used per parent; that is a join away if a report needs it.
- `PUT /products/:id/bom` replaces the list wholesale, so two concurrent editors
  race: last write wins. Optimistic concurrency (`updated_at` precondition) is
  the fix if multi-user editing of the same BOM becomes real.

## Verification

| Gate | Result |
| --- | --- |
| `lib/algorithms/bom.test.ts` | 47 tests incl. 6 seeded property suites |
| Diamond (batch of 10) | BOLT = 60 (20×1 from wheels + 10×4 from frames), not 20 or 40 |
| Scrap rounding | 1.001³ rounds to 2, not 8 |
| `src/test/bom.e2e.test.ts` | 17 tests against a real database |
| Cycle refusal | 400, previous BOM intact, error names the path |
| Cross-tenant | foreign component rejected; other tenant's BOM invisible |
| `npx tsc --noEmit` | clean |
| `npm test` | 328/328, 15 files |
| `npm run openapi` | 112 paths (106 + 6) |
| `npm audit --omit=dev` | 0 vulnerabilities |
