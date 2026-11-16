# Row-Level Security

Multi-tenant isolation enforced by PostgreSQL, not by developer discipline.

- **Policy set:** `server/drizzle/0007_rls.sql` (generated)
- **Regenerate:** `cd server && npm run db:generate-rls`
- **Decision record:** `docs/adr/0003-row-level-security.md`
- **Tests:** `server/src/test/rls.e2e.test.ts` (51 cases)

---

## 1. Why the database and not the application

Before this change, isolation relied on every query remembering
`eq(table.tenantId, ctx.tenantId)`. There were ~120 such predicates across 20
service modules and nothing structural prevented the 121st from being omitted.
One omission is a cross-tenant data leak. RLS turns that omitted predicate from
a leak into an empty result set, because the database applies the filter
whether the query mentions it or not.

## 2. The model

| Group | Count | Policy shape |
| --- | --- | --- |
| Tables with their own `tenant_id` | 33 | `USING (tenant_id = current_setting('app.tenant_id', true))` |
| `tenants` | 1 | `USING (id = current_setting('app.tenant_id', true))` |
| Child tables without `tenant_id` | 9 | `USING (EXISTS (SELECT 1 FROM parent p WHERE p.id = child.fk AND p.tenant_id = current_setting(...)))` |
| `plans` | 1 | **No policy.** Global reference data, readable by all tenants |

Every protected table also has `FORCE ROW LEVEL SECURITY`, so the policies apply
to the table **owner** too. Only a superuser or a role with `BYPASSRLS` escapes
them; that is the migration/seed privilege boundary.

### Child tables are not optional

Verified empirically: an RLS-protected parent does **not** protect its children.
With only `invoices` protected, tenant B could read tenant A's `invoice_items`
and even insert a row pointing at tenant A's invoice. Each child therefore
carries its own `EXISTS` policy. This is why the migration is generated from an
explicit list rather than hand-written.

## 3. How the setting is applied

`runTenant(tenantId, fn)` in `server/src/db/client.ts`:

1. opens a transaction,
2. `select set_config('app.tenant_id', $1, true)` — parameterised, so a tenant id
   can never alter the statement,
3. `SET LOCAL ROLE erp_app`,
4. runs the callback.

**`SET LOCAL` is transaction-scoped.** It is discarded on `COMMIT` and on
`ROLLBACK`, so a pooled connection can never carry one tenant's setting into
another tenant's request. This was verified directly: after commit, rollback and
after a failed transaction, `current_setting('app.tenant_id', true)` is empty.

> **Common trap.** `set_config(..., true)` called *outside* a transaction is
> silently discarded. A helper that sets the value and then issues queries
> outside a transaction appears to work while enforcing nothing. Any new code
> path must go through `runTenant`/`runScoped`.

### Where the tenant comes from

`TenantScopeInterceptor` (`server/src/shared/security/tenant-scope.interceptor.ts`)
wraps each authenticated request in `runTenant`. Guards run before interceptors,
so authentication itself — which happens before a tenant is known — uses
`runGlobal`.

`getDb()` returns the scoped transaction when one is active and the pooled
handle otherwise, so the ~20 existing services needed no changes.

## 4. Failing closed

If `app.tenant_id` is absent, `current_setting('app.tenant_id', true)` returns
`NULL`, every policy comparison yields `NULL`, and **no rows match**. A request
that somehow bypasses the interceptor returns empty data rather than everyone's
data. This is asserted by a test that runs as the app role with no setting and
expects zero rows.

## 5. Paths that legitimately run without a tenant

Each is named explicitly in code rather than being an accident:

| Path | Mechanism | Rationale |
| --- | --- | --- |
| Login / registration | `runGlobal` in the auth guard path | The user's tenant is unknown until the email lookup succeeds |
| Public share-token view | `resolvePublicTokenScope()` → `SECURITY DEFINER` function | The token is the credential; see below |
| Outbox worker, scheduled maintenance | `runGlobal` | Operates across all tenants by design |
| Platform admin (`/api/admin`, `/api/internal`, `/api/plans`) | `runGlobal` via `TenantScopeInterceptor` | Cross-tenant by design; adding an implicit scope would hide that |
| Migrations, seeds | superuser / owner connection | Must read and write every row |

### Public share tokens

`resolvePublicTokenScope` calls `public.resolve_public_token(hash)`, a
`SECURITY DEFINER` SQL function that runs with the owner's privileges (so RLS is
bypassed inside the function body) and returns **only** `(invoice_id, tenant_id)`
— never row data. The caller then enters `runTenant(tenantId, ...)` and every
subsequent query is scoped normally. `search_path` is pinned to
`public, pg_temp` to prevent function-hijacking, and `EXECUTE` is revoked from
`PUBLIC`.

## 6. Rollout

The policy set is a single migration (`0007_rls.sql`). Adopting it is not
gradual by table, because a table outside the policy set is unprotected while
the surrounding tables are — which makes reasoning about blast radius harder,
not easier. Instead:

1. Apply the migration in staging against a copy of production data.
2. Run `npm test` (includes 51 RLS cases).
3. Apply in production. Watch for **empty result sets**, the signature of a code
   path that reads tenant data outside `runTenant`.
4. If a path is found, fix it by wrapping it. Do **not** disable RLS to make it
   pass; `RLS_ENABLED=false` is a documented break-glass option, not a rollout
   mechanism.

## 7. Production connection setup

The application must connect as a **non-owner, non-superuser** role. Use two
credentials:

```sql
-- owner / migration role: has DDL, and MUST bypass RLS.
--
-- The pre-tenant lookups (login by email, refresh by token hash, public invoice
-- token) are SECURITY DEFINER functions owned by this role. A definer function
-- only sees past FORCE RLS if its owner is exempt — and an ordinary role,
-- including the database owner, is NOT exempt. Without BYPASSRLS every login
-- returns 401 while everything else looks correctly configured. The API checks
-- this at boot and logs the exact ALTER ROLE needed.
CREATE ROLE erp_owner LOGIN PASSWORD '...' BYPASSRLS;
GRANT ALL ON DATABASE erp TO erp_owner;

-- application role (DML only, subject to RLS)
-- created by migration 0007 as NOLOGIN; give it a password for direct login.
-- docker/db-init/00-app-role.sh does this automatically for docker compose.
ALTER ROLE erp_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '...';
```

No tenant is set when a helper runs, so a helper that were ever replaced by a
plain read would return nothing rather than every tenant — the failure stays
closed.

```dotenv
# used by the API at runtime
DATABASE_URL=postgres://erp_app:...@db:5432/erp
# used ONLY by `npm run db:migrate` / `db:seed`
MIGRATION_DATABASE_URL=postgres://erp_owner:...@db:5432/erp
```

`RLS_APP_ROLE=erp_app` is the role assumed with `SET LOCAL ROLE`. Because the
table owner is subject to `FORCE` policies, this remains correct even if `erp_app`
is later granted ownership of a table.

### Cross-tenant work

Three things legitimately span tenants and cannot be expressed as a tenant
predicate: the outbox worker, the housekeeping batch, and the platform-admin
console. They run through `runPrivileged()` on the `MIGRATION_DATABASE_URL`
connection. `getDb()` resolves scopes in a fixed order — tenant scope first, then
privileged, then the application role — so a tenant request can never
accidentally escalate; the privileged handle is unreachable from inside
`runTenant()`.

## 8. Verifying an installation

```sql
-- 43 tables protected, forced
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relrowsecurity and c.relforcerowsecurity;

-- the app role must not be able to escape
select rolname, rolsuper, rolbypassrls from pg_roles where rolname = 'erp_app';

-- a tenant sees exactly its own rows
begin;
  select set_config('app.tenant_id', '<tenant-uuid>', true);
  set local role erp_app;
  select count(*) from clients;   -- only this tenant's
rollback;
```

## 9. Known limitations

1. **The suites run as superuser.** They use `SET LOCAL ROLE erp_app` to *become*
   subject to RLS, which is verified by asserting that an unscoped superuser read
   returns more rows than a scoped one. Because a superuser bypasses RLS even
   under FORCE, this hides a whole class of bug: unscoped reads simply work, so
   login, the auth guard, the outbox worker and the admin console were all broken
   in a correctly configured deployment while the suite was green. The coverage
   now comes from two places instead — `scripts/production-smoke.sh` (a CI job
   that runs the API as a genuine `erp_app` login against an `erp_owner`-migrated
   database) and `src/test/auth-rls.e2e.test.ts`.
2. **`plans` is unprotected.** Intentional, but it means a compromised app
   credential can read the plan catalogue. It contains no tenant data.
3. **RLS is not a substitute for application authorisation.** It scopes *which
   tenant*, not *which user within a tenant*. RBAC remains the mechanism for the
   latter.
4. **`SET LOCAL ROLE` is per transaction.** Code that holds a pooled connection
   across transactions (none does today) would need to re-apply it.
