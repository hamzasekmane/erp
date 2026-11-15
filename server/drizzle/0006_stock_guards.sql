-- Phase 2 Sprint 0 (c): database-level stock guards.
--
-- The application now decrements stock atomically (UPDATE ... SET quantity =
-- quantity + delta WHERE quantity + delta >= 0). These constraints make the
-- invariant unbreakable even if a future code path forgets the predicate.
--
-- Rollback (see docs/MIGRATION-ROLLBACK.md):
--   ALTER TABLE "stock_levels" DROP CONSTRAINT IF EXISTS "stock_levels_quantity_chk";

ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_quantity_chk" CHECK ("quantity" >= 0);
