#!/usr/bin/env bash
# Production-shape smoke test.
#
# Why this exists
# ---------------
# The unit/e2e suites connect as a SUPERUSER. A superuser bypasses Row-Level
# Security even under FORCE, so every "unscoped read" bug is invisible there:
# they all pass, because the policies never apply. Three real defects shipped
# that way and were only found by running the API the way production runs it:
#
#   1. login read `users` before a tenant was known            -> always 401
#   2. the auth guard read `users` before the tenant scope     -> every
#      authenticated endpoint 401
#   3. the outbox / maintenance workers and the platform-admin console read
#      across tenants on the application role                  -> silent no-ops
#
# This script reproduces the deployment from docs/RLS.md §7 and asserts the
# endpoints a user actually hits. It is the only check that proves RLS is BOTH
# enforced and not in the way.
#
# Requirements: psql on PATH, a reachable PostgreSQL, and `npm ci` already run.
# Env: PG* connection settings for an ADMIN (superuser) role.
#   ADMIN_URL   - e.g. postgres://postgres:postgres@localhost:5432/postgres
#   RUN_DB      - scratch database name (default erp_smoke)
#   API_PORT    - default 4399
set -euo pipefail

ADMIN_URL="${ADMIN_URL:?ADMIN_URL is required (superuser connection string)}"
RUN_DB="${RUN_DB:-erp_smoke}"
PG_PORT="${PG_PORT:-5432}"
API_PORT="${API_PORT:-4399}"
APP_PASSWORD="smoke_app_pw"
OWNER_PASSWORD="smoke_owner_pw"
BASE="http://127.0.0.1:${API_PORT}/api"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
fail() { printf '\033[31mFAIL: %s\033[0m\n' "$*" >&2; exit 1; }

# expect <method> <path> <expected-status> [data] [token]
expect() {
  local method="$1" path="$2" want="$3" data="${4:-}" token="${5:-}"
  local args=(-s -o /tmp/smoke-body.json -w '%{http_code}' -X "$method" "${BASE}${path}")
  [ -n "$data" ] && args+=(-H 'content-type: application/json' -d "$data")
  [ -n "$token" ] && args+=(-H "authorization: Bearer ${token}")
  local got
  got="$(curl "${args[@]}")"
  if [ "$got" != "$want" ]; then
    echo "body: $(head -c 400 /tmp/smoke-body.json)" >&2
    fail "${method} ${path} -> ${got}, expected ${want}"
  fi
  printf '  %-6s %-34s %s\n' "$method" "$path" "$got"
}

json() { python3 -c "import json,sys;print(json.load(open('/tmp/smoke-body.json'))$1)"; }

say "database: two roles, the way production splits them"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -q <<SQL
DROP DATABASE IF EXISTS ${RUN_DB};
-- The previous run granted schema privileges to the owner role, which blocks the
-- DROP; revoke first so repeated runs are clean.
DO \$\$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${RUN_DB}_owner') THEN
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', '${RUN_DB}_owner');
  END IF;
END \$\$;
DROP ROLE IF EXISTS ${RUN_DB}_owner;
CREATE ROLE ${RUN_DB}_owner LOGIN PASSWORD '${OWNER_PASSWORD}' NOSUPERUSER NOBYPASSRLS;
-- THE essential attribute: the SECURITY DEFINER helpers are owned by this role,
-- and they only see through FORCE RLS if the owner bypasses it.
ALTER ROLE ${RUN_DB}_owner BYPASSRLS;
CREATE DATABASE ${RUN_DB} OWNER ${RUN_DB}_owner ENCODING 'UTF8' LOCALE 'C.UTF-8' TEMPLATE template0;
SQL
psql "${ADMIN_URL%/*}/${RUN_DB}" -v ON_ERROR_STOP=1 -q <<SQL
GRANT ALL ON SCHEMA public TO ${RUN_DB}_owner;
GRANT CREATE ON DATABASE ${RUN_DB} TO ${RUN_DB}_owner;
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END \$\$;
ALTER ROLE erp_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${APP_PASSWORD}';
GRANT CONNECT ON DATABASE ${RUN_DB} TO erp_app;
SQL

say "migrate + seed as the OWNER (the helpers must be owned by a privileged role)"
export DATABASE_URL="postgres://erp_app:${APP_PASSWORD}@127.0.0.1:${PG_PORT:-5432}/${RUN_DB}"
export MIGRATION_DATABASE_URL="postgres://${RUN_DB}_owner:${OWNER_PASSWORD}@127.0.0.1:${PG_PORT:-5432}/${RUN_DB}"
export NODE_ENV=production
export JWT_SECRET="smoke-secret-0123456789abcdef0123456789"
export APP_URL="http://localhost:3000"
export CORS_ORIGINS="http://localhost:3000"
export SECRETS_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
export MAINTENANCE_TOKEN="smoke-maintenance-token"
# A stale mailbox would hand the reset test a token from a previous run.
rm -rf /tmp/smoke-mail /tmp/smoke-uploads
export OUTBOX_DISABLED=false MAIL_OUTBOX_DIR=/tmp/smoke-mail
export UPLOAD_DIR=/tmp/smoke-uploads
export PORT="$API_PORT" TRUST_PROXY=true
export RUN_MIGRATIONS_ON_BOOT=true
export SEED_ADMIN_EMAIL="admin@smoke.dz" SEED_ADMIN_PASSWORD="SmokeAdmin123" SEED_DEMO=false
export SEED_ALLOW_PRODUCTION=true

npm run --silent db:migrate
node -r @swc-node/register src/db/seed.ts

say "start the API as the APPLICATION role"
node -r @swc-node/register src/main.ts > /tmp/smoke-api.log 2>&1 &
API_PID=$!
cleanup() {
  kill "$API_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  # The scratch database is dropped on the next run as well, but dropping it now
  # keeps a green run from leaving anything behind.
  psql "$ADMIN_URL" -q -c "DROP DATABASE IF EXISTS ${RUN_DB} WITH (FORCE)" 2>/dev/null || true
}
trap cleanup EXIT
for _ in $(seq 1 60); do
  if curl -sf "${BASE}/health" > /dev/null; then break; fi
  if ! kill -0 $API_PID 2>/dev/null; then tail -40 /tmp/smoke-api.log; fail "API exited during startup"; fi
  sleep 1
done
curl -sf "${BASE}/health" > /dev/null || { tail -40 /tmp/smoke-api.log; fail "API never became healthy"; }

say "the boot log must confirm RLS is enforced, not warn about it"
grep -q 'is subject to RLS' /tmp/smoke-api.log \
  || { tail -40 /tmp/smoke-api.log; fail "boot log does not report enforced RLS"; }
grep -q 'NOT effective' /tmp/smoke-api.log && fail "boot log reports RLS is NOT effective"
printf '  boot log: RLS enforced, pre-tenant helpers usable\n'

say "registration and login (pre-tenant reads through SECURITY DEFINER)"
expect POST /auth/register 201 '{"tenantData":{"name":"Smoke SARL","businessName":"Smoke SARL","contact":{"email":"c@smoke.dz"},"currency":"DZD","language":"fr"},"userData":{"name":"Smoke Admin","email":"owner@smoke.dz","password":"SmokePass123"},"planCode":"starter"}'
expect POST /auth/login 401 '{"email":"owner@smoke.dz","password":"wrong-password"}'
expect POST /auth/login 200 '{"email":"owner@smoke.dz","password":"SmokePass123"}'
TOKEN="$(json "['token']")"
REFRESH="$(json "['refreshToken']")"
[ -n "$TOKEN" ] || fail "no access token"

say "authenticated tenant endpoints (the auth guard runs before the tenant scope)"
for path in /clients /products /invoices /dashboard/stats /reports/sales; do
  expect GET "$path" 200 "" "$TOKEN"
done
expect POST /clients 201 '{"name":"Smoke Client","code":"CLI-SMOKE","email":"client@smoke.dz"}' "$TOKEN"
expect GET /clients 200 "" "$TOKEN"

say "refresh rotation"
expect POST /auth/refresh 200 "{\"refreshToken\":\"${REFRESH}\"}"
REFRESH2="$(json "['refreshToken']")"
expect POST /auth/refresh 401 "{\"refreshToken\":\"${REFRESH}\"}"
expect POST /auth/refresh 200 "{\"refreshToken\":\"${REFRESH2}\"}"

say "cross-tenant isolation, end to end"
expect POST /auth/register 201 '{"tenantData":{"name":"Smoke Beta","businessName":"Smoke Beta","contact":{"email":"c@smoke-beta.dz"},"currency":"DZD","language":"fr"},"userData":{"name":"Beta","email":"beta@smoke.dz","password":"SmokePass123"},"planCode":"starter"}'
expect POST /auth/login 200 '{"email":"beta@smoke.dz","password":"SmokePass123"}'
TOKEN_B="$(json "['token']")"
expect GET /clients 200 "" "$TOKEN_B"
[ "$(json "['pagination']['total']")" = "0" ] || fail "tenant B can see tenant A's clients"

say "password reset end to end"
expect POST /auth/forgot-password 200 '{"email":"owner@smoke.dz"}'
sleep 6
RESET_TOKEN="$(grep -ho 'reset-password?token=[A-Za-z0-9_-]*' /tmp/smoke-mail/* 2>/dev/null | head -1 | cut -d= -f2 || true)"
[ -n "$RESET_TOKEN" ] || fail "reset token was never delivered through the outbox"
expect POST /auth/reset-password 200 "{\"token\":\"${RESET_TOKEN}\",\"password\":\"SmokePass999\"}"
expect POST /auth/login 200 '{"email":"owner@smoke.dz","password":"SmokePass999"}'
expect POST /auth/login 401 '{"email":"owner@smoke.dz","password":"SmokePass123"}'

say "cross-tenant workers and the platform-admin console"
# Without the shared token the cron entry point refuses; with it, the batch runs
# across every tenant, which the application role cannot see by itself.
expect POST /internal/maintenance/run 401
CODE="$(curl -s -o /tmp/smoke-body.json -w '%{http_code}' -X POST "${BASE}/internal/maintenance/run" \
  -H "x-maintenance-token: ${MAINTENANCE_TOKEN}")"
[ "$CODE" = "201" ] || { head -c 300 /tmp/smoke-body.json >&2; fail "maintenance run -> ${CODE}"; }
printf '  %-6s %-34s %s\n' POST /internal/maintenance/run "$CODE"
# It must actually DO something: a run scoped by RLS would report zero work.
[ "$(json "['data']['resetTokensPurged']")" -ge 1 ] \
  || fail "maintenance purged no reset tokens: the batch is being filtered by RLS"
expect POST /auth/login 200 '{"email":"admin@smoke.dz","password":"SmokeAdmin123"}'
ADMIN_TOKEN="$(json "['token']")"
expect GET /admin/tenants 200 "" "$ADMIN_TOKEN"

say "PASS - the API works in its production shape, with RLS actually enforced"
