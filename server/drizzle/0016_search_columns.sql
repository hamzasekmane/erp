-- Search columns for the remaining searchable tables.
--
-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run db:generate-search
--
-- Depends on migration 0014, which creates search_normalize(), pg_trgm and the
-- columns on products and clients. The normalization rules live in
-- lib/algorithms/search.ts and are mirrored by that SQL function;
-- src/test/search.e2e.test.ts asserts the two agree.
--
-- Why a derived column plus a trigger rather than an expression index:
--   the fold has to run on the QUERY too, so both sides need one canonical
--   form; a stored column is also readable in a report without repeating the
--   function call, and the trigger keeps it correct for writes that never went
--   through the application.

--> statement-breakpoint
ALTER TABLE "client_notes" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION client_notes_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.content IS NOT DISTINCT FROM OLD.content THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "client_notes_search_text_trg" ON "client_notes";
--> statement-breakpoint
CREATE TRIGGER "client_notes_search_text_trg"
  BEFORE INSERT OR UPDATE OF "title", "content" ON "client_notes"
  FOR EACH ROW EXECUTE FUNCTION client_notes_search_text_refresh();
--> statement-breakpoint
UPDATE "client_notes" SET "search_text" = search_normalize(coalesce("title", '') || ' ' || coalesce("content", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_notes_search_trgm_idx" ON "client_notes" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION support_tickets_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.subject IS NOT DISTINCT FROM OLD.subject
     AND NEW.description IS NOT DISTINCT FROM OLD.description THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.subject, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "support_tickets_search_text_trg" ON "support_tickets";
--> statement-breakpoint
CREATE TRIGGER "support_tickets_search_text_trg"
  BEFORE INSERT OR UPDATE OF "subject", "description" ON "support_tickets"
  FOR EACH ROW EXECUTE FUNCTION support_tickets_search_text_refresh();
--> statement-breakpoint
UPDATE "support_tickets" SET "search_text" = search_normalize(coalesce("subject", '') || ' ' || coalesce("description", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_search_trgm_idx" ON "support_tickets" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "archive_documents" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION archive_documents_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.name IS NOT DISTINCT FROM OLD.name
     AND NEW.description IS NOT DISTINCT FROM OLD.description THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "archive_documents_search_text_trg" ON "archive_documents";
--> statement-breakpoint
CREATE TRIGGER "archive_documents_search_text_trg"
  BEFORE INSERT OR UPDATE OF "name", "description" ON "archive_documents"
  FOR EACH ROW EXECUTE FUNCTION archive_documents_search_text_refresh();
--> statement-breakpoint
UPDATE "archive_documents" SET "search_text" = search_normalize(coalesce("name", '') || ' ' || coalesce("description", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "archive_documents_search_trgm_idx" ON "archive_documents" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION users_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.name IS NOT DISTINCT FROM OLD.name
     AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.name, '') || ' ' || coalesce(NEW.email, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "users_search_text_trg" ON "users";
--> statement-breakpoint
CREATE TRIGGER "users_search_text_trg"
  BEFORE INSERT OR UPDATE OF "name", "email" ON "users"
  FOR EACH ROW EXECUTE FUNCTION users_search_text_refresh();
--> statement-breakpoint
UPDATE "users" SET "search_text" = search_normalize(coalesce("name", '') || ' ' || coalesce("email", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_search_trgm_idx" ON "users" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION employees_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.first_name IS NOT DISTINCT FROM OLD.first_name
     AND NEW.last_name IS NOT DISTINCT FROM OLD.last_name
     AND NEW.code IS NOT DISTINCT FROM OLD.code
     AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, '') || ' ' || coalesce(NEW.code, '') || ' ' || coalesce(NEW.email, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "employees_search_text_trg" ON "employees";
--> statement-breakpoint
CREATE TRIGGER "employees_search_text_trg"
  BEFORE INSERT OR UPDATE OF "first_name", "last_name", "code", "email" ON "employees"
  FOR EACH ROW EXECUTE FUNCTION employees_search_text_refresh();
--> statement-breakpoint
UPDATE "employees" SET "search_text" = search_normalize(coalesce("first_name", '') || ' ' || coalesce("last_name", '') || ' ' || coalesce("code", '') || ' ' || coalesce("email", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_search_trgm_idx" ON "employees" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION invoices_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.number IS NOT DISTINCT FROM OLD.number THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.number, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "invoices_search_text_trg" ON "invoices";
--> statement-breakpoint
CREATE TRIGGER "invoices_search_text_trg"
  BEFORE INSERT OR UPDATE OF "number" ON "invoices"
  FOR EACH ROW EXECUTE FUNCTION invoices_search_text_refresh();
--> statement-breakpoint
UPDATE "invoices" SET "search_text" = search_normalize(coalesce("number", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_search_trgm_idx" ON "invoices" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION payments_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.number IS NOT DISTINCT FROM OLD.number
     AND NEW.reference IS NOT DISTINCT FROM OLD.reference THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.number, '') || ' ' || coalesce(NEW.reference, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "payments_search_text_trg" ON "payments";
--> statement-breakpoint
CREATE TRIGGER "payments_search_text_trg"
  BEFORE INSERT OR UPDATE OF "number", "reference" ON "payments"
  FOR EACH ROW EXECUTE FUNCTION payments_search_text_refresh();
--> statement-breakpoint
UPDATE "payments" SET "search_text" = search_normalize(coalesce("number", '') || ' ' || coalesce("reference", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_search_trgm_idx" ON "payments" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "search_text" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION tenants_search_text_refresh() RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Recompute only when a source column actually changed. The guard belongs in
  -- the body: a trigger with both INSERT and UPDATE events may not reference
  -- OLD in a WHEN clause, and may not reference TG_OP at all.
  IF TG_OP = 'UPDATE'
     AND NEW.name IS NOT DISTINCT FROM OLD.name
     AND NEW.email IS NOT DISTINCT FROM OLD.email
     AND NEW.subdomain IS NOT DISTINCT FROM OLD.subdomain THEN
    RETURN NEW;
  END IF;
  NEW.search_text := search_normalize(coalesce(NEW.name, '') || ' ' || coalesce(NEW.email, '') || ' ' || coalesce(NEW.subdomain, ''));
  RETURN NEW;
END;
$fn$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "tenants_search_text_trg" ON "tenants";
--> statement-breakpoint
CREATE TRIGGER "tenants_search_text_trg"
  BEFORE INSERT OR UPDATE OF "name", "email", "subdomain" ON "tenants"
  FOR EACH ROW EXECUTE FUNCTION tenants_search_text_refresh();
--> statement-breakpoint
UPDATE "tenants" SET "search_text" = search_normalize(coalesce("name", '') || ' ' || coalesce("email", '') || ' ' || coalesce("subdomain", ''));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenants_search_trgm_idx" ON "tenants" USING gin ("search_text" gin_trgm_ops);
