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


-- bom_lines
ALTER TABLE "bom_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bom_lines" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bom_lines_tenant_isolation" ON "bom_lines";
CREATE POLICY "bom_lines_tenant_isolation" ON "bom_lines"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

/* ------------------------------------------------------------------ */
/* Privileges                                                          */
/* ------------------------------------------------------------------ */
GRANT SELECT, INSERT, UPDATE, DELETE ON "bom_lines" TO erp_app;

