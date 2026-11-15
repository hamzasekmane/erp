-- Platform-level audit events, and app-role access to the search trigger function.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- An earlier draft of this migration also added an INSERT policy to `tenants`
-- for self-service registration. That turned out to be unnecessary, and it was
-- removed rather than kept "for safety": the existing
-- `tenants_tenant_isolation` policy already permits the insert as soon as the
-- new tenant's own id is set as the RLS context, and a redundant permissive
-- policy widens the surface for nothing.
--
-- The actual registration fix is in `AuthService.register`, which sets
-- `app.tenant_id` to the new tenant's id at the start of the transaction that
-- creates it. Without that, every INSERT during signup was rejected:
--
--   ERROR: new row violates row-level security policy for table "tenants"
--
-- Invisible on the development/CI connection, which is a superuser and bypasses
-- RLS even under FORCE; reproduced against PostgreSQL 16 as a NOSUPERUSER
-- NOBYPASSRLS role. Self-service signup returned 500 in any correctly configured
-- deployment.
--
-- Related finding, recorded here because it shaped the fix: a SECURITY DEFINER
-- function does NOT escape this. FORCE ROW LEVEL SECURITY applies to the table
-- owner as well, so a definer function owned by the database owner is still
-- subject to the policy. Only a superuser or BYPASSRLS is exempt. Any "check the
-- whole table for uniqueness" helper written on that assumption silently sees
-- zero rows.

--> statement-breakpoint
-- audit_logs: platform-level events have no tenant.
--
-- `audit()` writes `tenant_id = null` for events that happen before a tenant is
-- known: a failed login, a password-reset request, an invalid public token. The
-- isolation policy compares `tenant_id = current_setting('app.tenant_id')`,
-- which is NULL for those rows, so the comparison is never true and the INSERT
-- was rejected:
--
--   ERROR: new row violates row-level security policy for table "audit_logs"
--
-- Reproduced against a real server as the application role. In production this
-- meant security events were silently NOT recorded — the opposite of what an
-- audit trail is for, and invisible anywhere except a non-superuser database.
--
-- The policy is permissive and OR-ed with the isolation policy, so it only ADDS
-- the ability to append a row that belongs to no tenant. It deliberately does not
-- touch SELECT, UPDATE or DELETE: such a row is readable by nobody through the
-- application role, only by an operator querying as a privileged role. That is
-- the correct visibility for "someone tried to log in as a user that does not
-- exist".
DROP POLICY IF EXISTS "audit_logs_platform_events" ON "audit_logs";

--> statement-breakpoint
CREATE POLICY "audit_logs_platform_events" ON "audit_logs"
  FOR INSERT
  WITH CHECK ("tenant_id" IS NULL);

--> statement-breakpoint
COMMENT ON POLICY "audit_logs_platform_events" ON "audit_logs" IS
  'Permits appending platform-level events (no tenant); reads stay restricted to the tenant''s own rows.';

--> statement-breakpoint
-- The generated search_text triggers call search_normalize() as the invoker. The
-- application role therefore needs EXECUTE on it, or every INSERT into a searched
-- table fails with "permission denied for function search_normalize" — which is
-- exactly what happened once the suite ran as a non-superuser role.
GRANT EXECUTE ON FUNCTION search_normalize(text) TO erp_app;
