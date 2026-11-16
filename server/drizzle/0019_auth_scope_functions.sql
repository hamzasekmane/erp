-- Pre-tenant identity lookups for login, refresh, password reset and MFA.
--
-- WHY THESE FUNCTIONS EXIST
-- -------------------------
-- Four flows legitimately need to read a user before any tenant is known:
--
--   * login       — email -> user
--   * refresh     — the session row is keyed by a refresh-token hash, and the
--                   tenant is only known from the user it belongs to
--   * password    — reset-token hash -> user
--   * MFA verify  — challenge -> user
--
-- `users`, `sessions` and `password_reset_tokens` all carry FORCE RLS, and the
-- correct policy for a caller with no `app.tenant_id` is to see NOTHING. So as
-- the application role these reads returned zero rows and every one of those
-- flows was broken in a correctly configured deployment. It was invisible in
-- development and CI because the default connection is a superuser, and a
-- superuser bypasses RLS even under FORCE.
--
-- HOW THIS IS SAFE
-- ----------------
-- A caller that can read an arbitrary user row by guessing an email would turn
-- the identity API into an enumeration oracle. So the functions do NOT return
-- rows:
--
--   * they answer only when the caller already presented a secret that proves
--     ownership — the password is verified by the caller, but the lookup returns
--     just the tenant id needed to continue;
--   * `resolve_login_scope` returns the tenant and the id, nothing else: no
--     name, email, role or hash. The caller then re-reads the user inside
--     `runTenant(tenantId, ...)`, where RLS applies normally.
--
-- WHY SECURITY DEFINER ACTUALLY WORKS HERE
-- ----------------------------------------
-- FORCE RLS applies to the table owner too, so a definer function owned by the
-- database owner does NOT escape the policy. It must be owned by a role that
-- bypasses RLS — the migration role. This is only true when migrations run as a
-- privileged role, which is why `MIGRATION_DATABASE_URL` exists; the application
-- role then gets EXECUTE on these functions and nothing else.
--
-- Measured on PostgreSQL 16.2 with FORCE RLS on `users`: connected as the
-- application role, `select count(*) from users` returns 0 while
-- `resolve_login_scope()` returns the correct tenant for an existing email.

--> statement-breakpoint
-- Live locations (bodies and signatures) are dropped first: CREATE OR REPLACE
-- cannot change a return type, and these functions deliberately return the
-- smallest possible tuple. Dropping is safe — nothing depends on them yet, and
-- they are pure reads with no storage.
DROP FUNCTION IF EXISTS public.resolve_login_scope(text);
DROP FUNCTION IF EXISTS public.resolve_refresh_scope(text);
DROP FUNCTION IF EXISTS public.resolve_password_reset_scope(text);
DROP FUNCTION IF EXISTS public.resolve_user_scope(text);

--> statement-breakpoint
-- Email -> (user id, tenant id) for a live user. Deliberately two identifiers and
-- nothing else. Returns no row for an unknown email, which the caller treats as
-- a failed login without revealing whether the account exists.
CREATE FUNCTION public.resolve_login_scope(p_email text)
RETURNS TABLE (user_id text, tenant_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u."id", u."tenant_id"
    FROM "users" u
   WHERE lower(u."email") = lower(p_email)
     AND u."deleted_at" IS NULL
   LIMIT 1
$$;

--> statement-breakpoint
-- User id -> tenant id. Needed by the MFA challenge, which proves identity with a
-- signed token but carries no tenant. Returns one identifier.
CREATE FUNCTION public.resolve_user_scope(p_user_id text)
RETURNS TABLE (user_id text, tenant_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u."id", u."tenant_id"
    FROM "users" u
   WHERE u."id" = p_user_id
     AND u."deleted_at" IS NULL
   LIMIT 1
$$;

--> statement-breakpoint
-- Refresh-token hash -> (session id, user id, tenant id). The hash is the
-- credential: it is 32 random bytes, stored hashed, and only the holder of the
-- token can compute it.
CREATE FUNCTION public.resolve_refresh_scope(p_token_hash text)
RETURNS TABLE (session_id text, user_id text, tenant_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s."id", s."user_id", u."tenant_id"
    FROM "sessions" s
    JOIN "users" u ON u."id" = s."user_id"
   WHERE s."refresh_token_hash" = p_token_hash
   LIMIT 1
$$;

--> statement-breakpoint
CREATE FUNCTION public.resolve_password_reset_scope(p_token_hash text)
RETURNS TABLE (token_id text, user_id text, tenant_id text, expires_at timestamptz, used_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t."id", t."user_id", u."tenant_id", t."expires_at", t."used_at"
    FROM "password_reset_tokens" t
    JOIN "users" u ON u."id" = t."user_id"
   WHERE t."token_hash" = p_token_hash
   LIMIT 1
$$;

--> statement-breakpoint
-- Least privilege: the app role may call these four functions and nothing else.
REVOKE ALL ON FUNCTION public.resolve_login_scope(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_refresh_scope(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_password_reset_scope(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_user_scope(text) FROM PUBLIC;

--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.resolve_login_scope(text) TO erp_app;
GRANT EXECUTE ON FUNCTION public.resolve_refresh_scope(text) TO erp_app;
GRANT EXECUTE ON FUNCTION public.resolve_password_reset_scope(text) TO erp_app;
GRANT EXECUTE ON FUNCTION public.resolve_user_scope(text) TO erp_app;
