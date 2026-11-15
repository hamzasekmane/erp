# ADR 0003 — Row-Level Security for tenant isolation

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Product owner, Principal Architect
- **Related:** `server/drizzle/0007_rls.sql`, `server/src/db/client.ts`, `docs/RLS.md`, audit finding TEN-1

---

## Context

The platform is a single-database, single-schema multi-tenant ERP with a
`tenant_id` column on every business table. Isolation was enforced entirely by
the application: each service built its own `where` clause, e.g.

```ts
.where(and(eq(invoices.tenantId, ctx.tenantId), isNull(invoices.deletedAt)))
```

An audit counted ~120 such predicates across 20 modules and found **no**
PostgreSQL `ROW LEVEL SECURITY` and no `CREATE POLICY` anywhere in the six
migrations. The guarantee therefore rested on every future contributor
remembering the predicate. The test suite covered tenant isolation for the paths
that had been written, but tests only prove the absence of leaks on paths they
exercise.

Three specific hazards made this pressing:

1. **The blast radius is unbounded.** A missing predicate on a list endpoint
   returns another company's invoices to an authenticated user. There is no
   error, no log and no test failure.
2. **The codebase is growing.** Each new module is another opportunity to forget.
3. **A public, unauthenticated read already existed** (`/invoices/:id/view`),
   which is the pattern most likely to end up with no tenant predicate at all.

### What was verified before deciding

RLS behaviour was established empirically rather than assumed:

| Question | Result |
| --- | --- |
| Does PGlite (used for dev and CI) enforce RLS? | Yes — policies, roles, `WITH CHECK`, fail-closed all behave as in PostgreSQL 17 |
| Does a superuser bypass RLS? | Yes |
| Does a table owner bypass RLS? | Yes, unless `FORCE ROW LEVEL SECURITY` is set |
| Is a missing setting fail-closed? | Yes — `current_setting(..., true)` is `NULL`, policies match nothing |
| Is `SET LOCAL` transaction-scoped? | Yes — cleared on commit, rollback and after a failed transaction |
| Is `SET LOCAL` outside a transaction discarded? | **Yes** — a silent trap; a helper that sets it outside a transaction enforces nothing |
| Does an RLS-protected parent protect its children? | **No** — a tenant could read another's `invoice_items` and attach rows to another's invoice |
| Do `ON DELETE CASCADE`s still fire under a policy? | Yes |

## Decision

**Enforce tenant isolation in the database, with the application opting in per
request rather than opting out per query.**

1. **`ENABLE` + `FORCE ROW LEVEL SECURITY` on all 43 tenant-scoped tables**, with
   a generated policy set (`npm run db:generate-rls`). 33 tables use their own
   `tenant_id`; `tenants` uses its `id`; 9 child tables inherit via `EXISTS`
   against their parent. `plans` is deliberately excluded as global reference
   data.
2. **The setting is applied transaction-scoped only.** `runTenant(tenantId, fn)`
   opens a transaction, sets `app.tenant_id` with a parameterised
   `set_config(..., true)`, runs `SET LOCAL ROLE erp_app`, then executes the
   callback. `SET LOCAL` cannot leak across a pooled connection.
3. **Fail closed.** No setting means no rows. A request that bypasses the scope
   returns empty data, not everyone's data.
4. **The application connects as a non-owner, non-superuser role.** Migrations
   and seeds use a separate owner credential (`MIGRATION_DATABASE_URL`).
5. **Tenant-less paths are named in code.** Authentication, public token
   resolution, background workers and platform-admin routes call `runGlobal`
   explicitly. The only read that bypasses RLS is a `SECURITY DEFINER` function
   that returns two identifiers, never row data.
6. **The policy set is generated, not hand-written.** 43 policies maintained by
   hand is exactly the kind of bookkeeping that rots silently.

### Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Database per tenant | Operationally heavy at this scale, and migrations become N-per-deploy. Revisit only if a customer requires physical separation. |
| Schema per tenant | Same migration problem, plus connection-pool management complexity. |
| Keep application-level predicates, add a lint rule | Cannot catch dynamically built filter lists, and cannot protect a raw `sql` escape hatch. |
| Enforce via a repository layer that always injects the predicate | Helps, but the guarantee still lives in application code. RLS makes the database the last line of defence, which is where it belongs. |
| Roll out table by table via a flag | Rejected in favour of a single migration. A partially protected schema is harder to reason about than either state, and a runtime flag that disables isolation is a foot-gun that will eventually be set in production. |

## Consequences

### Positive

- A forgotten predicate returns zero rows instead of another tenant's data. The
  failure mode changed from *silent data breach* to *visible empty screen*.
- Isolation is verified by 51 adversarial tests that attempt cross-tenant read,
  update, delete and insert on all 42 protected tables.
- The services were not rewritten: `getDb()` returns the scoped transaction, so
  the ~20 existing modules kept working unchanged.

### Negative / accepted costs

- **A new failure mode: empty results.** Code that reads tenant data outside
  `runTenant` now silently returns nothing. This is better than leaking, but it
  is a debugging cost, and it is why the interceptor wraps the whole request
  rather than individual queries.
- **Every request pays a transaction.** Reads that previously ran on a pooled
  connection now run inside `BEGIN`/`COMMIT` with two extra statements. Acceptable
  at current volume; measured cost is not yet benchmarked.
- **Two credentials to manage.** A misconfigured deployment that points
  `DATABASE_URL` at the owner role would run with RLS silently ineffective. The
  docs call this out; a startup assertion is a follow-up.
- **`FORCE` applies to the owner**, so a future admin running ad-hoc SQL will be
  surprised that they cannot see all rows without `BYPASSRLS`.

### Residual risks

1. **The test suite runs as a superuser** and becomes a tenant by
   `SET LOCAL ROLE`. It asserts that an unscoped superuser read returns more
   rows, proving the scope is real — but a production-like CI job running as a
   genuine non-superuser login would be stronger.
2. **RLS scopes tenants, not users.** Within a tenant, RBAC remains responsible.
3. **`plans` has no policy** and is readable by any app credential. It holds no
   tenant data.
4. **A startup check that the connected role is neither superuser nor table
   owner** is not yet implemented. Until it is, a misconfiguration is possible.

## Verification

- `server/src/test/rls.e2e.test.ts` — 51 cases: 43-table policy presence, app
  role flags, fail-closed with no setting, sequential scopes not leaking, per
  table cross-tenant read/update/delete returning zero, per child table
  inheritance, cross-tenant insert rejected by `WITH CHECK`, own-row insert
  allowed, and public token resolution without a scope.
- `npm test` — 165 tests pass with RLS enforced.
- Regeneration is deterministic: `npm run db:generate-rls` produces byte-identical
  output.
