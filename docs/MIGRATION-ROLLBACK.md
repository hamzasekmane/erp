# Migration and rollback guide

Applies to `server/drizzle/*.sql`. Read this before deploying any release that
contains a new migration.

---

## 1. How migrations run

- Files in `server/drizzle/` are applied in lexicographic order by
  `server/src/db/migrate.ts`.
- Each file runs **inside a transaction on a single pinned connection**.
- A file is claimed with `INSERT … ON CONFLICT DO NOTHING` into `_migrations`,
  so two instances booting simultaneously cannot apply it twice. On PostgreSQL
  a transaction-scoped advisory lock serialises the whole run.
- The migrator is **forward-only**: there are no generated `down` files. Every
  migration in this repository therefore ships with a hand-written rollback
  statement recorded below and in the migration's own header comment.

## 2. Applying

```bash
# on boot (default): RUN_MIGRATIONS_ON_BOOT unset or "true"
# explicitly, during a deployment window (preferred for production):
cd server
DATABASE_URL=postgres://… npm run db:migrate
```

Recommended for production: set `RUN_MIGRATIONS_ON_BOOT=false` so that every
replica does not race the migrator, and run `db:migrate` as a separate release
step before rolling new pods.

## 3. Verifying before applying

Always rehearse against a copy of production data first:

```bash
pg_dump "$PROD_DATABASE_URL" | psql "$STAGING_DATABASE_URL"
cd server && DATABASE_URL="$STAGING_DATABASE_URL" npm run db:migrate
DATABASE_URL="$STAGING_DATABASE_URL" npm run db:inspect-discounts   # read-only
```

## 4. Rollback procedure (generic)

Because the migrator is forward-only, rollback is an explicit reverse
statement, not a command. The procedure is:

1. **Stop writing.** Scale the API down to zero, or put it in maintenance mode,
   so no partial writes land during the rollback.
2. **Take a snapshot.** `pg_dump -Fc "$DATABASE_URL" > pre-rollback.dump`.
3. **Apply the reverse statement** for the migration(s) being reverted (table
   below).
4. **Delete the `_migrations` row** for each reverted file, so a later deploy
   can re-apply it:

   ```sql
   DELETE FROM _migrations WHERE name = '0006_stock_guards.sql';
   ```

5. **Deploy the previous application image.** Migrations and code ship
   together, so reverting one without the other leaves the app inconsistent.
6. **Verify.** `select * from _migrations order by name;` and run the health
   probe: `curl -fsS http://localhost:4000/api/health/ready`.

## 5. Per-migration rollback reference

| Migration | Change | Reverse statement |
| --- | --- | --- |
| `0000_init.sql` | Baseline schema, 35+ tables | Destructive: drop all tables. Only acceptable on a disposable database. Restore from snapshot instead. |
| `0001_ops.sql` | HR, support, archive tables | `DROP TABLE`, in FK-safe reverse order (`support_messages`, `support_tickets`, `attendance_records`, `leave_requests`, `employee_contracts`, `employees`, `departments`, `archive_documents`). |
| `0002_platform.sql` | Platform/admin tables | `DROP TABLE` in FK-safe order. |
| `0003_cloudy_black_widow.sql` | Additive columns | `ALTER TABLE … DROP COLUMN …;` |
| `0004_clumsy_arachne.sql` | Additive columns | `ALTER TABLE … DROP COLUMN …;` |
| `0005_normal_havok.sql` | `uploads` scan columns + check | `ALTER TABLE "uploads" DROP CONSTRAINT IF EXISTS "uploads_scan_status_chk";` then drop `scan_status, scan_engine, scan_signature, scanned_at`. |
| `0006_stock_guards.sql` | `CHECK (quantity >= 0)` on `stock_levels` | `ALTER TABLE "stock_levels" DROP CONSTRAINT IF EXISTS "stock_levels_quantity_chk";` |
| `0007_rls.sql` | RLS on 43 tables, `erp_app` role, grants, `resolve_public_token()` | See below. |

### Notes specific to `0006_stock_guards`

The constraint is additive and cannot fail on existing data **unless** rows
with negative `stock_levels.quantity` already exist. Check first:

```sql
SELECT count(*) FROM stock_levels WHERE quantity < 0;
```

If non-zero, do **not** silently delete rows. Inspect them
(`SELECT product_id, tenant_id, quantity FROM stock_levels WHERE quantity < 0;`)
and correct them with an `adjustment` stock movement through the application so
that the movement history stays reconcilable. The check is `NOT VALID`-free by
design: we want it enforced immediately, because a negative stock level is
already corrupt.

### Notes specific to `0007_rls.sql`

This migration is the most consequential to revert because it changes *who can
see what*, not just a shape.

```sql
-- 1. Turn the policies off, table by table (generated list is in the file).
--    Disabling RLS without this next step leaves the app role unable to read.
ALTER TABLE "invoices"   DISABLE ROW LEVEL SECURITY;
ALTER TABLE "payments"   DISABLE ROW LEVEL SECURITY;
-- ... repeat for every table in drizzle/0007_rls.sql

-- 2. Restore the app role's ability to read without a tenant setting is NOT
--    possible while policies remain. Do not "fix" it by granting BYPASSRLS:
--    that removes the isolation AND hides the fact.

-- 3. Remove the security-definer helper so no caller can rely on it.
DROP FUNCTION IF EXISTS public.resolve_public_token(text);

-- 4. Drop the role only after revoking its privileges.
DROP OWNED BY erp_app;
DROP ROLE IF EXISTS erp_app;
```

**Deploy the previous application image in the same step.** Code that calls
`runTenant()` sets `app.tenant_id`, which is harmless when no policy exists but
`SET LOCAL ROLE erp_app` will fail if the role has been dropped.

**Do not roll back RLS to work around an empty result set.** An empty screen
after this migration means a code path reads tenant data outside `runTenant`.
Wrap that path. Disabling isolation to make it pass reintroduces the exact defect
the migration exists to remove.

## 6. Data-repair runbook (money)

No migration rewrote historical invoices when the VAT base was corrected
(`docs/adr/0002-money-and-discount-contract.md`). Issued documents keep their
stored figures; corrections must be issued as credit notes.

To find rows whose stored money does not match a recomputation from their own
stored basis points:

```bash
cd server && npm run db:inspect-discounts
```

Exit codes: `0` clean, `1` suspect rows (samples printed), `2` could not run.
The script is read-only.

## 7. Rollback checklist

- [ ] API scaled to zero / maintenance mode on
- [ ] Snapshot taken and its size verified
- [ ] Reverse statements applied and confirmed without error
- [ ] `_migrations` rows deleted for reverted files
- [ ] Previous application image deployed
- [ ] `/api/health/ready` returns 200 with `checks.database === "ok"`
- [ ] Spot-check one invoice total, one payment balance and one stock level
- [ ] `npm run db:inspect-discounts` exits 0
