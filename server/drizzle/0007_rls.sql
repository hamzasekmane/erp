-- Row-Level Security for tenant isolation.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-rls
--
-- Model: one shared schema, `tenant_id` on every business table, enforced by
-- the database rather than by every developer remembering a predicate.
--
-- Contract:
--   * the application connects as the non-owner role "erp_app";
--   * each transaction sets `app.tenant_id` with SET LOCAL before any query;
--   * if the setting is absent, `current_setting(..., true)` is NULL and every
--     policy evaluates to NULL -> no rows. The system fails CLOSED.
--
-- FORCE is used so the policies also apply to the table owner, not only to
-- other roles. Migrations and seeds therefore run as a superuser (or a role
-- with BYPASSRLS), which is a deliberate, documented privilege boundary.
--
-- Rollback: see docs/MIGRATION-ROLLBACK.md.
--   ALTER TABLE "<table>" DISABLE ROW LEVEL SECURITY;  (per table)
--   DROP OWNED BY erp_app;

/* ------------------------------------------------------------------ */
/* Application role                                                    */
/* ------------------------------------------------------------------ */
-- NOLOGIN: it is assumed via SET ROLE in development/tests and used
-- directly as the login role in production (see docs/RLS.md). It owns no
-- table, so it is subject to FORCE policies.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- tenant_settings
ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_settings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_settings_tenant_isolation" ON "tenant_settings";
CREATE POLICY "tenant_settings_tenant_isolation" ON "tenant_settings"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";
CREATE POLICY "users_tenant_isolation" ON "users"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- sessions
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_tenant_isolation" ON "sessions";
CREATE POLICY "sessions_tenant_isolation" ON "sessions"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- subscriptions
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_tenant_isolation" ON "subscriptions";
CREATE POLICY "subscriptions_tenant_isolation" ON "subscriptions"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- subscription_invoices
ALTER TABLE "subscription_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_invoices_tenant_isolation" ON "subscription_invoices";
CREATE POLICY "subscription_invoices_tenant_isolation" ON "subscription_invoices"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- clients
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_tenant_isolation" ON "clients";
CREATE POLICY "clients_tenant_isolation" ON "clients"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- client_groups
ALTER TABLE "client_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_groups" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_groups_tenant_isolation" ON "client_groups";
CREATE POLICY "client_groups_tenant_isolation" ON "client_groups"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- client_notes
ALTER TABLE "client_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_notes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_notes_tenant_isolation" ON "client_notes";
CREATE POLICY "client_notes_tenant_isolation" ON "client_notes"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- categories
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_tenant_isolation" ON "categories";
CREATE POLICY "categories_tenant_isolation" ON "categories"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- taxes
ALTER TABLE "taxes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "taxes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taxes_tenant_isolation" ON "taxes";
CREATE POLICY "taxes_tenant_isolation" ON "taxes"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- products
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_tenant_isolation" ON "products";
CREATE POLICY "products_tenant_isolation" ON "products"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- stock_levels
ALTER TABLE "stock_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_levels" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_levels_tenant_isolation" ON "stock_levels";
CREATE POLICY "stock_levels_tenant_isolation" ON "stock_levels"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- stock_movements
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_tenant_isolation" ON "stock_movements";
CREATE POLICY "stock_movements_tenant_isolation" ON "stock_movements"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- number_sequences
ALTER TABLE "number_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "number_sequences" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "number_sequences_tenant_isolation" ON "number_sequences";
CREATE POLICY "number_sequences_tenant_isolation" ON "number_sequences"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- invoices
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON "invoices";
CREATE POLICY "invoices_tenant_isolation" ON "invoices"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- payments
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON "payments";
CREATE POLICY "payments_tenant_isolation" ON "payments"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- payment_gateways
ALTER TABLE "payment_gateways" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_gateways" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_gateways_tenant_isolation" ON "payment_gateways";
CREATE POLICY "payment_gateways_tenant_isolation" ON "payment_gateways"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- gateway_checkouts
ALTER TABLE "gateway_checkouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gateway_checkouts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gateway_checkouts_tenant_isolation" ON "gateway_checkouts";
CREATE POLICY "gateway_checkouts_tenant_isolation" ON "gateway_checkouts"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- payment_methods
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_methods" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_methods_tenant_isolation" ON "payment_methods";
CREATE POLICY "payment_methods_tenant_isolation" ON "payment_methods"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_tenant_isolation" ON "notifications";
CREATE POLICY "notifications_tenant_isolation" ON "notifications"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- api_keys
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_keys_tenant_isolation" ON "api_keys";
CREATE POLICY "api_keys_tenant_isolation" ON "api_keys"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- files
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "files_tenant_isolation" ON "files";
CREATE POLICY "files_tenant_isolation" ON "files"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- audit_logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- outbox_events
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "outbox_events_tenant_isolation" ON "outbox_events";
CREATE POLICY "outbox_events_tenant_isolation" ON "outbox_events"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- idempotency_keys
ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "idempotency_keys" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "idempotency_keys_tenant_isolation" ON "idempotency_keys";
CREATE POLICY "idempotency_keys_tenant_isolation" ON "idempotency_keys"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- departments
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_tenant_isolation" ON "departments";
CREATE POLICY "departments_tenant_isolation" ON "departments"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- employees
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_tenant_isolation" ON "employees";
CREATE POLICY "employees_tenant_isolation" ON "employees"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- employee_contracts
ALTER TABLE "employee_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_contracts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_contracts_tenant_isolation" ON "employee_contracts";
CREATE POLICY "employee_contracts_tenant_isolation" ON "employee_contracts"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- leave_requests
ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave_requests_tenant_isolation" ON "leave_requests";
CREATE POLICY "leave_requests_tenant_isolation" ON "leave_requests"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- attendance_records
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_records_tenant_isolation" ON "attendance_records";
CREATE POLICY "attendance_records_tenant_isolation" ON "attendance_records"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- support_tickets
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_tickets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_tickets_tenant_isolation" ON "support_tickets";
CREATE POLICY "support_tickets_tenant_isolation" ON "support_tickets"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- archive_documents
ALTER TABLE "archive_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "archive_documents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "archive_documents_tenant_isolation" ON "archive_documents";
CREATE POLICY "archive_documents_tenant_isolation" ON "archive_documents"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- uploads
ALTER TABLE "uploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uploads" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uploads_tenant_isolation" ON "uploads";
CREATE POLICY "uploads_tenant_isolation" ON "uploads"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

-- tenants: the row IS the tenant. Only the current tenant's own record is visible.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_tenant_isolation" ON "tenants";
CREATE POLICY "tenants_tenant_isolation" ON "tenants"
  USING ("id" = current_setting('app.tenant_id', true))
  WITH CHECK ("id" = current_setting('app.tenant_id', true));

-- client_group_members (tenant inherited from client_groups.group_id)
ALTER TABLE "client_group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_group_members" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_group_members_tenant_isolation" ON "client_group_members";
CREATE POLICY "client_group_members_tenant_isolation" ON "client_group_members"
  USING (EXISTS (
    SELECT 1 FROM "client_groups" p
     WHERE p."id" = "client_group_members"."group_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "client_groups" p
     WHERE p."id" = "client_group_members"."group_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- invoice_items (tenant inherited from invoices.invoice_id)
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_items_tenant_isolation" ON "invoice_items";
CREATE POLICY "invoice_items_tenant_isolation" ON "invoice_items"
  USING (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_items"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_items"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- invoice_status_history (tenant inherited from invoices.invoice_id)
ALTER TABLE "invoice_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_status_history" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_status_history_tenant_isolation" ON "invoice_status_history";
CREATE POLICY "invoice_status_history_tenant_isolation" ON "invoice_status_history"
  USING (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_status_history"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_status_history"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- invoice_public_tokens (tenant inherited from invoices.invoice_id)
ALTER TABLE "invoice_public_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_public_tokens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_public_tokens_tenant_isolation" ON "invoice_public_tokens";
CREATE POLICY "invoice_public_tokens_tenant_isolation" ON "invoice_public_tokens"
  USING (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_public_tokens"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "invoices" p
     WHERE p."id" = "invoice_public_tokens"."invoice_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- payment_allocations (tenant inherited from payments.payment_id)
ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_allocations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_allocations_tenant_isolation" ON "payment_allocations";
CREATE POLICY "payment_allocations_tenant_isolation" ON "payment_allocations"
  USING (EXISTS (
    SELECT 1 FROM "payments" p
     WHERE p."id" = "payment_allocations"."payment_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "payments" p
     WHERE p."id" = "payment_allocations"."payment_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- payment_refunds (tenant inherited from payments.payment_id)
ALTER TABLE "payment_refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_refunds" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_refunds_tenant_isolation" ON "payment_refunds";
CREATE POLICY "payment_refunds_tenant_isolation" ON "payment_refunds"
  USING (EXISTS (
    SELECT 1 FROM "payments" p
     WHERE p."id" = "payment_refunds"."payment_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "payments" p
     WHERE p."id" = "payment_refunds"."payment_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- payment_gateway_secrets (tenant inherited from payment_gateways.gateway_id)
ALTER TABLE "payment_gateway_secrets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_gateway_secrets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_gateway_secrets_tenant_isolation" ON "payment_gateway_secrets";
CREATE POLICY "payment_gateway_secrets_tenant_isolation" ON "payment_gateway_secrets"
  USING (EXISTS (
    SELECT 1 FROM "payment_gateways" p
     WHERE p."id" = "payment_gateway_secrets"."gateway_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "payment_gateways" p
     WHERE p."id" = "payment_gateway_secrets"."gateway_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- support_messages (tenant inherited from support_tickets.ticket_id)
ALTER TABLE "support_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_messages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_messages_tenant_isolation" ON "support_messages";
CREATE POLICY "support_messages_tenant_isolation" ON "support_messages"
  USING (EXISTS (
    SELECT 1 FROM "support_tickets" p
     WHERE p."id" = "support_messages"."ticket_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "support_tickets" p
     WHERE p."id" = "support_messages"."ticket_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

-- password_reset_tokens (tenant inherited from users.user_id)
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_reset_tokens" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "password_reset_tokens_tenant_isolation" ON "password_reset_tokens";
CREATE POLICY "password_reset_tokens_tenant_isolation" ON "password_reset_tokens"
  USING (EXISTS (
    SELECT 1 FROM "users" p
     WHERE p."id" = "password_reset_tokens"."user_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "users" p
     WHERE p."id" = "password_reset_tokens"."user_id"
       AND p."tenant_id" = current_setting('app.tenant_id', true)
  ));

/* ------------------------------------------------------------------ */
/* Global reference data                                               */
/* ------------------------------------------------------------------ */
-- plans is a platform-wide catalogue: every tenant must read all of it, so it
-- is deliberately NOT tenant-scoped and carries no RLS. Writes are restricted
-- to the platform admin surface by the application.
-- plans

/* ------------------------------------------------------------------ */
/* Privileges                                                          */
/* ------------------------------------------------------------------ */
-- DML only; no DDL, no ownership. Tables must remain owned by a different
-- role so that FORCE policies apply and a compromised app cannot alter them.
GRANT USAGE ON SCHEMA public TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "tenant_settings" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "sessions" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "subscriptions" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "subscription_invoices" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "clients" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "client_groups" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "client_notes" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "categories" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "taxes" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "products" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_levels" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_movements" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "number_sequences" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoices" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payments" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_gateways" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "gateway_checkouts" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_methods" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "notifications" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "api_keys" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "files" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "audit_logs" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "outbox_events" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "idempotency_keys" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "departments" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "employees" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "employee_contracts" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "leave_requests" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "attendance_records" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "support_tickets" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "archive_documents" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "uploads" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "tenants" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "client_group_members" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoice_items" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoice_status_history" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoice_public_tokens" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_allocations" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_refunds" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_gateway_secrets" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "support_messages" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "password_reset_tokens" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "plans" TO erp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;

/* ------------------------------------------------------------------ */
/* Public share-token resolution                                       */
/* ------------------------------------------------------------------ */
-- The one read that legitimately happens with NO tenant known: the token is
-- the credential. A SECURITY DEFINER function performs it with the owner's
-- privileges (bypassing RLS inside the function body) but returns ONLY the two
-- identifiers, never row data. The caller then sets app.tenant_id from the
-- result and every subsequent query runs under RLS.
CREATE OR REPLACE FUNCTION public.resolve_public_token(p_token_hash text)
RETURNS TABLE (invoice_id text, tenant_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT i."id", i."tenant_id"
    FROM "invoice_public_tokens" t
    JOIN "invoices" i ON i."id" = t."invoice_id"
   WHERE t."token_hash" = p_token_hash
     AND t."revoked_at" IS NULL
     AND t."expires_at" > now()
     AND i."deleted_at" IS NULL
     AND i."status" <> 'draft'
   LIMIT 1
$$;

-- Owned by the migration role, so it runs with RLS bypassed. EXECUTE is
-- granted to the app role only.
REVOKE ALL ON FUNCTION public.resolve_public_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_token(text) TO erp_app;

