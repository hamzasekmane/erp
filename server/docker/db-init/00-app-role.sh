#!/bin/sh
# Creates the application login role before the API starts.
#
# Why this exists
# ---------------
# Row-Level Security only does anything if the API connects as a role that is
# *not* the table owner and not a superuser. The default PostgreSQL image creates
# exactly one role (`POSTGRES_USER`) and it is a superuser, so pointing the API at
# it silently makes every policy decorative — `assertRlsEffective()` would warn
# about it at boot, and nothing else would complain.
#
# So the stack uses two credentials:
#   * $POSTGRES_USER  (owner)   — runs migrations, owns every object;
#   * $ERP_APP_ROLE   (erp_app) — the API at runtime: LOGIN, NOSUPERUSER,
#                                 NOBYPASSRLS, and deliberately not the owner.
#
# Migration 0007 declares `erp_app` as NOLOGIN (tests assume it with SET ROLE).
# Creating it here first, with LOGIN, means that DO block becomes a no-op and the
# role can also be used directly as a login role in production — which is the
# documented deployment shape in docs/RLS.md §7.
#
# Idempotent: safe on every container start, and safe if the data volume already
# has the role (a re-created stack keeps working).
set -eu

: "${ERP_APP_ROLE:=erp_app}"
: "${ERP_APP_PASSWORD:?ERP_APP_PASSWORD is required (the API's database password)}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set app_role="$ERP_APP_ROLE" --set app_password="$ERP_APP_PASSWORD" <<'SQL'
-- Create the role if it is missing. format(%I/%L) quotes both, so neither the
-- role name nor the password can break out of the statement.
SELECT format(
         'CREATE ROLE %I LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD %L',
         :'app_role', :'app_password')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- Keep the attributes correct even when the role predates this script: a role
-- that drifted to NOLOGIN (or, worse, SUPERUSER) must not stay that way.
SELECT format('ALTER ROLE %I LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD %L',
              :'app_role', :'app_password')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_role')
\gexec
SQL

echo "db-init: role \"$ERP_APP_ROLE\" is ready (LOGIN, NOSUPERUSER, NOBYPASSRLS)"
