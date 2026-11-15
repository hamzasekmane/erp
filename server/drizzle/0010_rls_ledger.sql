-- Row-Level Security for tables introduced after 0007.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-rls
--
-- Why a second migration: 0007 is already applied in environments and must not
-- be edited. Granting nothing to "erp_app" on a new table is not "fail
-- closed" - it is "permission denied", a 500 on every request that touches it.
-- Policies plus grants must therefore be added in the same wave that adds the
-- table.

/* ------------------------------------------------------------------ */
/* Policies                                                            */
/* ------------------------------------------------------------------ */


-- accounts
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_tenant_isolation" ON "accounts";
CREATE POLICY "accounts_tenant_isolation" ON "accounts"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- account_closure
ALTER TABLE "account_closure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account_closure" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "account_closure_tenant_isolation" ON "account_closure";
CREATE POLICY "account_closure_tenant_isolation" ON "account_closure"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- journal_entries
ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_entries" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_entries_tenant_isolation" ON "journal_entries";
CREATE POLICY "journal_entries_tenant_isolation" ON "journal_entries"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- journal_lines
ALTER TABLE "journal_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_lines" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_lines_tenant_isolation" ON "journal_lines";
CREATE POLICY "journal_lines_tenant_isolation" ON "journal_lines"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- accounting_periods
ALTER TABLE "accounting_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounting_periods" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounting_periods_tenant_isolation" ON "accounting_periods";
CREATE POLICY "accounting_periods_tenant_isolation" ON "accounting_periods"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

/* ------------------------------------------------------------------ */
/* Privileges                                                          */
/* ------------------------------------------------------------------ */
GRANT SELECT, INSERT, UPDATE, DELETE ON "accounts" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "account_closure" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "journal_entries" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "journal_lines" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "accounting_periods" TO erp_app;

