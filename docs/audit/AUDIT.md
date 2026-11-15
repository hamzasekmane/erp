# Architecture & Security Audit — ERP Platform

**Repository:** `hamzasekmane/erp`
**Commit audited:** `92e74c38a2d82d5fc778e60875799f32ac96a0d6` (`main`)
**Branch:** `arena/ba1a76db-erp`
**Date:** 2026-11-15
**Author:** Principal Software Architect (Phase 1 audit)

---

## 0. Document control

| Item | Value |
| --- | --- |
| Scope | Whole repository: Next.js frontend (`app/`), NestJS API (`server/`), DB schema/migrations, Docker, CI, i18n, docs |
| Method | Static reading of every top-level config file, all `server/src/**` shared infrastructure and all 20 service modules, schema + all 6 migrations, plus **executed** quality gates (see §2) |
| Code volume | Frontend: 307 files / 61,179 LOC. Backend: 116 files / 13,675 LOC |
| Out of scope | Runtime load testing against production data, penetration testing, Debian/OS-level hardening |
| Verdict | **Not production-ready.** Foundations are above average, but there are **3 Critical** and **8 High** blocking defects. |

> **Important framing.** This repository is *not* a `create-next-app` skeleton. A previous phase already built a full-stack ERP: a NestJS + Drizzle API with 102 OpenAPI paths, 61 passing tests, RBAC, multi-tenancy, MFA, an outbox and audit logging. The README (§`.README.md`) is the only artefact still at template state. Consequently this audit is **not** a greenfield design exercise; it is an audit of a system that is roughly 60 % complete, and the highest-value work is fixing the gaps that make it unsafe and un-deployable — not rewriting foundations that already work.

---

## 1. Executive summary

### 1.1 What is genuinely good (keep it)

These are real assets and must not be thrown away in a refactor:

1. **Runtime env validation with fail-fast production guards** — `server/src/config/env.ts:117-160`. Rejects a dev JWT secret, missing `DATABASE_URL`, wildcard CORS and mismatched Chargily key modes at boot.
2. **Money as integer minor units** — `server/src/shared/money.ts`; schema helper `money()` = `bigint` in `server/src/db/schema.ts:32`. No floats in the money path.
3. **DB-level invariants** — `invoices_due_chk` (`due = total - paid`), amount non-negativity, status enums and partial unique indexes (`server/src/db/schema.ts:508-514`). This is rare and valuable.
4. **Gapless per-tenant document numbering** via atomic upsert — `server/src/shared/numbering.ts:22-35`.
5. **Transactional outbox with claim-then-process, backoff and stuck-job recovery** — `server/src/modules/outbox/outbox.service.ts:31-80`.
6. **Secret encryption at rest (AES-256-GCM, versioned envelope)** — `server/src/shared/security/secrets.ts:33-49`.
7. **TOTP MFA implemented to RFC 6238** with replay protection, plus a separate 5-minute MFA challenge token — `server/src/shared/security/totp.ts`, `tokens.ts:57-72`.
8. **Refresh-token rotation with hashed storage and family tracking** — `server/src/db/schema.ts:133-152`, `shared/security/tokens.ts:44-55`.
9. **Multi-stage, non-root, standalone-output Dockerfiles with healthchecks** — `Dockerfile:19-34`, `server/Dockerfile:13-30`.
10. **A real DB-backed integration suite** using embedded PGlite — 41 tests in `server/src/test/api.e2e.test.ts` covering auth, refresh rotation, **tenant isolation** and RBAC.

### 1.2 What blocks production

| # | Blocking defect | Severity |
| --- | --- | --- |
| C1 | Invoice lines store `discount_bp` ×100 of what is computed — every discounted invoice persists wrong money | **Critical** |
| C2 | `docker compose up` cannot work: required `env_file` is absent (and ungitignore-exempted), so a clean clone fails | **Critical** |
| C3 | Inventory stock levels are read-modify-write without row locking → lost updates and negative stock under concurrency | **Critical** |
| H1 | Concurrent payments on one invoice: no optimistic lock → overpayment / corrupted `paid_minor` | High |
| H2 | No idempotency enforcement on any mutating endpoint (`idempotency_keys` table exists, zero code uses it) | High |
| H3 | Frontend Docker web image build fails (`COPY /app/public` but `public/` is not in the repo) | High |
| H4 | `i18n/request.ts` is not a next-intl config; next-intl is imported by zero files; 3 locales have 5–15 keys; RTL is hardcoded off (`dir="ltr"` ×7) | High |
| H5 | No CSP / security headers in Next.js; client-side `xlsx@0.18.5` has an unfixed high CVE | High |
| H6 | Auth is a 7-day cookie holding a 1-hour access token with **no refresh** — users are forced to re-login hourly, and session revocation is ineffective | High |
| H7 | Money/rounding logic duplicated: `shared/money.ts` is dead code; the invoice service re-implements it differently | High |
| H8 | 6 dashboard pages ship mock data as if real (payroll, pivot, SMS, email, and others) — false functionality in production paths | High |

### 1.3 Health scorecard

| Area | Grade | One-line justification |
| --- | --- | --- |
| Backend layering | B | Clean module/controller/service split; but `Ctx` type duplicated in ~12 services (§3.2) |
| Next.js usage | C− | Working, but proxy overlaps an orphan middleware, no error/not-found boundaries, `dir="ltr"` hardcoded |
| Security | C | Strong auth primitives; weak on headers, CSRF story, idempotency, concurrency locks |
| Data layer | B | Excellent constraint work; weak on locking, dead helpers, forward-only migrations |
| DevOps | D | Compose is broken from a clean clone; no healthchecks on `api`/`web`; CI builds images but never runs them |
| Quality gates | D | ESLint: **475 errors**; API lint not in CI; no frontend tests at all; no coverage tooling |
| i18n / RTL | F | Effectively non-existent despite the requirement |
| Performance | C | Standalone output + rewrites good; 327 KB+271 KB chunks; `markOverdue` write on every list read |

---

## 2. Quality gates — measured, not assumed

All commands were run in this workspace. Reproduce with the listed command.

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| API typecheck | `cd server && npx tsc --noEmit` | ✅ **PASS** (0 errors) | exit 0 |
| API tests | `cd server && npm test` | ✅ **PASS** — 4 files, **61 tests**, 8.0 s | `src/test/api.e2e.test.ts` (41), antivirus (9), totp (7), chargily (4) |
| Frontend typecheck | `npx tsc --noEmit` | ✅ **PASS** (0 errors) | exit 0 |
| Frontend build | `npm run build` | ✅ **PASS** — standalone emitted | `ƒ Proxy (Middleware)` present in route table |
| ESLint (whole repo) | `npx eslint .` | ❌ **FAIL — 475 errors**, 704 warnings | breakdown in §7.1 |
| `npm audit` (web) | `npm audit` | ❌ **1 high, 10 moderate** | `xlsx` high — **no fix available** |
| `npm audit` (api) | `cd server && npm audit` | ❌ **2 critical, 1 high, 5 moderate** | `tinypool`/`vitest` critical (dev), `drizzle-orm` high (runtime) |
| Coverage tooling | `npx vitest run --coverage` | ❌ **BROKEN** — `Cannot find dependency '@vitest/coverage-v8'` | not installed, so no coverage number can be produced at all |
| Frontend tests | — | ❌ **N/A** — `package.json` scripts are only `dev/build/start/lint` | no unit, no component, no Playwright |
| Docker build/compose | `docker compose config` | ⚠️ **Not verifiable here** — Docker is not installed in the audit sandbox | Risk stated, not measured; see C2/H3 for the defects that are statically provable |

> **Note on the previously reported "41 tests".** `server/src/test/api.e2e.test.ts` genuinely covers the critical auth and tenancy flows. But the *whole* repository therefore runs on 61 tests over ~13.7 k LOC of backend and **zero** tests over 61 k LOC of frontend. The number is real; the coverage does not exist.

---

## 3. Project structure

### 3.1 Layout as built

```
app/                     Next.js App Router (307 files)
  actions/               24 server actions -> thin HTTP clients for the API
  components/            ~120 components, organised by domain
  services/              HTTP client layer (axios/fetch wrappers)
  dashboard/             40+ route segments, one folder per ERP module
server/src/              NestJS API (116 files)
  modules/               20 feature modules (controller/service/dto)
  shared/                cross-cutting: money, audit, errors, security, outbox
  db/                    schema (1049 lines), client, migrate, seed, bootstrap
i18n/request.ts          NOT a next-intl config (see H4)
messages/{ar,en,fr}.json 5, 10, 15 keys — no locale is complete
proxy.ts                 Next.js middleware (Next 16 renamed it "proxy")
```

### 3.2 Findings

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| S-1 | Medium | **Two competing middleware files.** `proxy.ts` is the file Next.js 16 actually runs (`ƒ Proxy (Middleware)` in the build output); `i18n/request.ts` also exports a `middleware()` + `config.matcher` but is never referenced. Dead code that looks authoritative and is what a newcomer will edit by mistake. | `proxy.ts:1-27`, `i18n/request.ts:1-29` |
| S-2 | Medium | **`Ctx` type is copy-pasted in nearly every service** instead of a shared type. | e.g. `server/src/modules/invoices/invoices.service.ts:24`, `payments/payments.service.ts`, `catalog/catalog.service.ts`, `uploads/uploads.service.ts:17` |
| S-3 | Medium | **Duplicated components/services with divergent behaviour**: `components/StatCard.tsx` vs `dashboard/StatCard.tsx`; `components/Navbar.tsx` vs `components/layout/Navbar.tsx` (5.4 KB vs 10.3 KB); `services/api.ts` vs `services/api.service.ts`; `invoices/Pagination.tsx` vs `payments/Pagination.tsx`. | file sizes/locations as listed |
| S-4 | Low | **Dead code in the backend**: `shared/money.ts` (`invoiceTotals`, `lineTotalMinor`) has **zero** consumers — the invoice service re-implements the maths; `errorHandler` in `shared/http.ts` is never used (Nest filter is used instead); `zodPipe` never used; `assertSecretsReadyForProduction` never called. | `grep` returns only the definition site for each |
| S-5 | Low | **`tsconfig.tsbuildinfo` is committed** — a build artefact in version control. | `git ls-files` |
| S-6 | Low | **No domain/infrastructure boundary inside modules.** Services speak Drizzle directly and also format HTTP responses, so business rules cannot be unit-tested without a database. | `invoices.service.ts` both queries and `serialize()`s |
| S-7 | Low | Naming inconsistency: `products.Service.ts`, `productsAction.ts`, `products/productsFrom.tsx` (typo), `actionsNotifications.ts` vs `analytics.actions.ts` vs `categoryActions.ts` (three naming conventions in one folder). | `app/services/`, `app/actions/`, `app/components/products/` |

### 3.3 Circular dependencies

None detected between backend modules: every module imports only `shared/*`, `db/*` and (for `invoices`) `PaymentsService` via Nest DI (`invoices.module.ts`). The `invoices -> payments` edge is one-directional at the module level. **No action required.**

---

## 4. Next.js correctness

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| N-1 | High | **Proxy auth is cosmetic and the cookie/API lifetimes disagree.** `proxy.ts:8` checks only *presence* of a `token` cookie. That cookie is issued with `maxAge: 60*60*24*7` (`app/actions/loginAction.ts:24`) while the token inside it expires in `ACCESS_TOKEN_TTL_SECONDS = 3600` (`server/src/config/env.ts`). After one hour the cookie still exists, the middleware lets the user through, the API returns 401, and `serverApi()` swallows the error and returns `null`. The result is a dashboard that silently renders empty, and the user is only bounced when the *layout* also fails. | `proxy.ts:8-18`, `loginAction.ts:20-26`, `app/lib/serverApi.ts:12-20` |
| N-2 | High | **No refresh flow exists in the frontend.** `/auth/refresh` and rotation are fully implemented server-side (`auth.controller.ts:53-57`, `auth.service.ts` refresh) but **nothing in `app/` ever calls it** (`grep` for `auth/refresh`/`refreshToken` in `app/` → 0 hits). A 1-hour access token with no refresh and no interceptor is a production defect, not a preference. | as stated |
| N-3 | High | **No global error boundary.** `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` and `app/loading.tsx` all **do not exist**. Only `app/dashboard/error.tsx` and per-route `loading.tsx` files exist. Any render error outside `/dashboard` produces Next's default error page. | `ls` returns "No such file or directory" for all four |
| N-4 | Medium | `serverApi()` returns `null` on *any* failure (network, 401, 500) and pages cannot distinguish "no data" from "auth expired" from "server down". This is the mechanism that converts N-1 into a silent-empty-dashboard. | `app/lib/serverApi.ts:12-20` |
| N-5 | Medium | **`dir="ltr"` is hardcoded on the root layout and inside the dashboard shell**, so every page is LTR regardless of locale. | `app/layout.tsx:32`, `app/dashboard/layout.tsx:27` |
| N-6 | Medium | Every page fetches with `cache: "no-store"` (`apiFetch`) and dynamic rendering, so there is **no caching strategy at all** — no `revalidate`, no tag-based invalidation except two notification actions. | `app/lib/apiFetch.ts:33`; only `actionsNotifications.ts` uses `revalidateTag` |
| N-7 | Medium | **Rendering strategy is client-heavy**: 142 of 240 `.tsx` files are `"use client"`, and several large pages (payroll 638 lines, pivot 460, SMS 497) are client components that then call `setTimeout` to fake latency (see F-1). | counts computed over `app/**/*.tsx` |
| N-8 | Low | Route handlers vs server actions: the project uses server actions exclusively (24 files) and no `app/api/*` route handlers, which is a defensible choice. But 21 of 24 action files perform **no Zod validation** before forwarding payloads. | per-file `safeParse` count: 0 in 21 files, 1 in `loginAction`/`registerAction`, 2 in `apiKeysActions` |

---

## 5. Security

### 5.1 Authentication & authorisation

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| SEC-1 | High | **Session revocation is architecturally ineffective.** `users.tokenVersion` is correctly embedded in the JWT and checked by the guard — but the frontend never refreshes, so a rotated `tokenVersion` cannot invalidate a live cookie until the 1-hour expiry, and the cookie itself survives 7 days. Ties to N-1/N-2. | `auth.guard.ts:44`, `loginAction.ts:22` |
| SEC-2 | Medium | **API keys can be created and hashed but never authenticate anything.** The guard only accepts `Authorization: Bearer <jwt>` (`auth.guard.ts:28-33`); nothing anywhere reads an API key header. `apiKeys` are therefore write-only decorations. | `grep` for `x-api-key`/`apikey` in `server/src` → 0 |
| SEC-3 | Medium | **RBAC is static and coarse.** Four fixed roles, a hardcoded permission matrix, no per-tenant role customisation and no ABAC. Acceptable for v1, but it must be documented as a deliberate limit, and it means a `manager` can never be granted `payments:refund` without a code change. | `shared/security/permissions.ts:46-96` |
| SEC-4 | Low | Guard does a **database round-trip on every request** to re-read the user (correct for revocation, but it is the hot path). Needs a short-TTL cache keyed by `(userId, tokenVersion)`. | `auth.guard.ts:35-49` |
| SEC-5 | Low | Password policy is 8 chars + letter + digit (`password.ts:34-39`); scrypt N=16384 is sound, but the deviation from Argon2id is only documented in code comments and `docs/03`, not in an ADR. | `password.ts:4-12` |

### 5.2 Multi-tenancy isolation

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| TEN-1 | High | **Isolation is convention-only.** It is enforced by every developer remembering `eq(table.tenantId, ctx.tenantId)` in every query. There is **no Row-Level Security**: `grep` for `row level security` / `CREATE POLICY` across all 6 migrations returns **0** matches. One forgotten predicate is a cross-tenant data leak, and nothing in the type system prevents it. Mitigation exists (`api.e2e.test.ts` has explicit tenant-isolation tests), but tests only cover the paths that were written. | `server/drizzle/*.sql` |

### 5.3 Input validation, injection, XSS, CSRF

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| INJ-1 | Low | **No SQL injection found.** All dynamic SQL uses Drizzle's parameterised builder; the 7 hand-written `sql` template usages (e.g. `numbering.ts:22-33`) interpolate bound parameters, not strings. Sort columns are resolved through a `switch` allow-list (`invoices.service.ts:688`). This is a genuine strength. | as cited |
| INJ-2 | Low | `drizzle-orm ^0.44.7` is flagged **high** by `npm audit` for improper identifier escaping (`GHSA-gpj5-g38j-94v9`). The codebase does not pass user input as identifiers, so exploitability today is low — but the fix (`0.45.4`) must be taken. | `npm audit` in `server/` |
| XSS-1 | Low | **No XSS sinks found**: zero `dangerouslySetInnerHTML`, zero `innerHTML`. React escaping applies everywhere. | `grep` → 0 |
| CSRF-1 | Medium | Cookies are `httpOnly` + `sameSite: "strict"` (`loginAction.ts:20-25`), which blocks classic CSRF on the Next origin. However the **API itself** accepts `credentials: true` CORS with an explicit allow-list, and the cookie is a bearer credential that the Next server replays to the API — so the effective CSRF boundary is undocumented and untested. No CSRF token exists for the 24 server actions. | `main.ts:38-48` |
| VAL-1 | Medium | **Query-string parameters are validated ad hoc**, not with Zod: e.g. `typeof query.status === "string" ? query.status : undefined` repeated 12 times in one controller method. Numeric bounds in `parsePagination` are sane, but free-text filters go straight into `ilike`. | `invoices.controller.ts:32-46`, `shared/http.ts:17-21` |

### 5.4 Secrets, headers, dependencies

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| SEC-6 | High | **No HTTP security headers on the web tier.** `next.config.ts` defines `images` and `rewrites` only — no `headers()`, so no CSP, HSTS, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy`. The API sets `helmet` but explicitly **disables CSP** (`main.ts:31`). | `next.config.ts:15-24`, `main.ts:31` |
| SEC-7 | High | **Client-side `xlsx@0.18.5` has two unfixed advisories** (prototype pollution + ReDoS) and is used in two interactive export buttons, meaning the vulnerable parser runs in end users' browsers on data they may not trust. `npm audit` reports **no fix available**; the maintained distribution moved off npm. | `app/components/payments/ExportExcelButton.tsx:3`, `reports/ExportReportsButton.tsx:3`, `npm audit` |
| SEC-8 | Medium | `server/.env.production.example` is committed (good), but **`docker-compose.yml` requires `./server/.env.production` which does not exist**, and `.gitignore` ignores `.env.*` with only `.example` exemptions. See C2. | `docker-compose.yml:28-29`, `.gitignore:6-9` |
| SEC-9 | Medium | **Seed ships default credentials** `admin@erp.local / ChangeMe123!` and `demo@erp.local / Demo1234!`. There *is* a production guard that refuses to seed without an explicit `SEED_ADMIN_PASSWORD` (`seed.ts:374-377`) — good — but the demo tenant is not covered by any such guard. | `seed.ts:35-37, 374-377` |
| SEC-10 | Low | No secrets found in tracked files. `grep` for `secret|password|token` with 16+ char literals returned exactly one hit, a well-known RFC test vector in `totp.test.ts:50`. **Clean.** | as cited |

### 5.5 Rate limiting & audit

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| RATE-1 | Medium | The global limiter is a **fixed-window counter in process memory** (`Map`) — trivially bypassed with parallel replicas and unfair at window edges. Auth endpoints add per-IP+email throttles (login 8/15 min, forgot 5/15 min, MFA 8/10 min), which are the important ones and do work single-instance. | `rate-limit.middleware.ts:12-52`, `shared/security/throttle.ts:10-20`, `auth.service.ts:171-172, 309, 550` |
| RATE-2 | Low | Throttle maps are never swept in `throttle.ts` (unbounded growth for attackers rotating emails); the middleware version does sweep. | `throttle.ts:8-20` |
| AUD-1 | Medium | **The audit trail is bypassable by design.** `audit()` is a separate `INSERT` after the business transaction commits (`audit.ts:26-45`, called at e.g. `invoices.service.ts:497`). A crash between commit and audit loses the record, and audit writes are not enforced by the DB. 60 call sites is good coverage; atomicity is the gap. | as cited |
| AUD-2 | Low | `audit_logs` is append-only by convention only — no `REVOKE UPDATE/DELETE`, no trigger. A compromised app role can rewrite history. | `schema.ts:770-792` |

---

## 6. Data layer

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| DB-1 | **Critical** | **Currency bug: `discount_bp` is multiplied by 100 before storage.** `computeLines` already computes the *minor-unit* discount correctly, but the persisted row writes `discountBp: Math.round(line.input.discount * 100)` where `input.discount` is already a percentage (0–100). A 10 % line discount is therefore stored as **1000 bp (10 %)**… and simultaneously the same value is used as a basis-point field elsewhere. Any consumer that reads `discount_bp` as basis points (the schema's stated convention, `schema.ts:24`) will apply **100× the intended discount**. Two code paths write it identically (`invoices.service.ts:329`, `:400`), so the bug is consistent and silent. | `schema.ts:516-538` (`discount_bp` documented as bp), `invoices.service.ts:65-80, 329, 400` |
| DB-2 | **Critical** | **Lost updates on stock.** `applyStock` reads the level, computes `next` in JS, then writes the absolute value — no `SELECT ... FOR UPDATE`, no atomic `quantity = quantity + ?`, no version predicate. Two concurrent sales both read 5, both write 3, and stock is overstated by 2. The negative-stock check is also TOCTOU. | `catalog.service.ts:394-416` |
| DB-3 | High | **Overpayment under concurrency.** `payments.create` reads the invoice, validates `amount <= due`, then updates `paid_minor` with `where(eq(invoices.id, ...))` — **no `AND paid_minor = <observed value>`** guard. Two simultaneous payments both pass validation and the second overwrites the first's accumulator. | `payments.service.ts:146-170, 196` |
| DB-4 | High | **`shared/money.ts` is dead code and diverges from the live implementation.** The "documented" rounding contract (`lineTotalMinor`, `invoiceTotals`, rounding per line then summing) is not what the invoice service does. Two sources of truth for money = a guaranteed future defect. | `shared/money.ts:1-60` (no consumers), `invoices.service.ts:65-80` |
| DB-5 | Medium | **Migrations are forward-only and untested in reverse.** `migrate.ts` explicitly documents "Forward-only migrator"; there are no `down` files and no rollback guide. Requirement 5 of Phase 5 says migrations must be reversible. | `migrate.ts:8-11` |
| DB-6 | Medium | `publicView` (invoice public page) filters on **`id` only** — no public token, no expiry, no revocation — even though a fully-designed `invoice_public_tokens` table exists with `tokenHash`/`expiresAt`/`revokedAt`. Any leaked invoice URL exposes client name, email, phone, line items and totals indefinitely. IDs are UUIDv4 so guessing is infeasible, but "unguessable URL" is not the same as "revocable, expiring link". | `invoices.service.ts:181-210`, `schema.ts:556-573` |
| DB-7 | Medium | **`idempotency_keys` table is defined and never used.** Zero references outside `schema.ts`. All 40+ mutating endpoints are replay-unsafe. | `schema.ts:810-827`, `grep` → 0 |
| DB-8 | Medium | **N+1 and write-on-read.** `list()` calls `markOverdue()` — an `UPDATE` — on *every* invoice listing (`invoices.service.ts:91, 131`), so a read endpoint takes write locks and is not cacheable. `payments.service.ts:431-436` awaits one `INSERT` per gateway secret inside a loop. | as cited |
| DB-9 | Low | Money columns are `bigint` **in `mode: "number"`**, i.e. JS doubles above 2^53 lose precision. Fine for DZD amounts in practice, but it contradicts the "no floats" intent and should be `mode: "bigint"` or `numeric` for absolute safety. | `schema.ts:32` |
| DB-10 | Low | `stockLevels.quantity` and `minStock` are `numeric(18,3)` but are read into JS `Number` and compared in SQL against product price for "stock value", mixing unit-cost semantics with sale price. | `catalog.service.ts:247-249` |
| DB-11 | Low | Indexing is generally strong (composite, partial and functional indexes throughout). Gaps: `payments_tenant_status_idx` does not cover `invoice_id` lookups; `audit_logs` lacks a plain `(tenant_id, id)` for keyset pagination. | `schema.ts:594-600, 770-792` |

---

## 7. DevOps

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| OPS-1 | **Critical** | **`docker compose up` fails on a clean clone.** `api.env_file` lists `./server/.env.production`, which is not in the repo; `.gitignore:6-8` ignores `.env.*` and only exempts `*.example`. Compose refuses to start with a missing `env_file`. Requirement 5 ("`docker compose up` works from a clean clone") is therefore **not met**. | `docker-compose.yml:28-29`, `.gitignore:6-9` |
| OPS-2 | High | **The web Docker image cannot be built.** `Dockerfile:27` runs `COPY --from=build /app/public ./public`, but `public/` **does not exist in the repository** (`git ls-files public/` → 0). The `COPY` fails at build time. `next.config.ts:30` also sets `images.unoptimized = true`, so there is no public asset pipeline at all. | as cited |
| OPS-3 | High | **No healthcheck on `api` or `web` in compose**, despite both Dockerfiles defining `HEALTHCHECK`. Compose `depends_on` therefore uses start-order only (`web` waits for `api` to *exist*, not to be ready). | `docker-compose.yml:13` is the only `healthcheck` (db) |
| OPS-4 | Medium | **API lint is absent from CI.** The `api` job runs typecheck/test/build/OpenAPI-drift but **never ESLint**, so 475 errors accumulate invisibly. It also never runs `npm audit`. | `.github/workflows/ci.yml:12-46` |
| OPS-5 | Medium | **CI builds the API image but never the web image**, and never scans either. Requirement 5 asks for container scan and a deploy stage; neither exists. | `.github/workflows/ci.yml:48-62` |
| OPS-6 | Medium | CI has no `lint` → `typecheck` → `test` → `build` **ordering guarantee** for the web job: it builds *before* typechecking. | `.github/workflows/ci.yml:68-77` |
| OPS-7 | Low | Base images are pinned only by minor tag (`node:22-alpine`, `postgres:16-alpine`), not by digest. Compose `api` publishes `4000` to the host directly, bypassing the intended same-origin proxy. | `Dockerfile:3`, `docker-compose.yml:41-42` |
| OPS-8 | Low | `RUN_MIGRATIONS_ON_BOOT` defaults to **true**, so every replica races the migrator at boot. The advisory lock makes it safe-ish, but "migrate on boot" is an anti-pattern for zero-downtime deploys. | `env.ts:52-55`, `main.ts:16` |

---

## 8. Quality

### 8.1 ESLint — 475 errors (fail)

| Rule | Count | Nature |
| --- | --- | --- |
| `react-hooks/error-boundaries` | **273** | Awaited promises inside components without an error boundary — directly explains N-3 and correlates with the silent-empty-dashboard symptom |
| `react/no-unescaped-entities` | 156 | Cosmetic, auto-fixable |
| `react-hooks/set-state-in-effect` | 20 | Unsafe effect patterns |
| `react-hooks/immutability` | 10 | Prop/state mutation |
| `react-hooks/static-components` | 4 | Components redefined per render |
| `react-hooks/purity` | 4 | Impure render |
| `@typescript-eslint/no-require-imports` | 4 | `require()` in `tailwind.config.mjs:351-356` |
| `react-hooks/preserve-manual-memoization` | 2 | Stale memo deps |
| other | 2 | `jsx-no-comment-textnodes`, `prefer-const` |

`eslint.config.mjs:13` explicitly sets `@typescript-eslint/no-explicit-any: "off"`; there are **301** `any` usages.

### 8.2 TypeScript

`strict: true` in both `tsconfig.json:11` and `server/tsconfig.json:7` — correct. **`noUncheckedIndexedAccess` is absent from both**, which is what lets `rows[0].next_value`-style access (`numbering.ts:32`) compile silently. `exactOptionalPropertyTypes` also absent.

### 8.3 Tests

| Layer | Status |
| --- | --- |
| Algorithm / unit | 20 tests (totp 7, antivirus 9, chargily 4) — all security helpers. **No business-logic unit tests.** |
| Integration (DB) | 41 tests, PGlite-backed, genuinely good (auth, refresh rotation, tenant isolation, invoice→payment→refund, uploads, outbox) |
| Frontend unit/component | **None** — no runner installed |
| E2E (Playwright) | **None** — no config, no dependency |
| Coverage | **Unmeasurable** — `@vitest/coverage-v8` not installed |

### 8.4 Accessibility

No automated a11y tooling. Manual signals are weak: 10 `aria-label`s across 240 files, 4 `<img>` of which 2 have `alt`, only 2 uses of `next/image`.

### 8.5 i18n & RTL — the weakest area

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| I18N-1 | High | **`i18n/request.ts` is not a next-intl request config.** next-intl requires `getRequestConfig`; the file exports a `middleware()` that duplicates `proxy.ts`. The package is therefore non-functional. | `i18n/request.ts` (no `getRequestConfig`) |
| I18N-2 | High | **next-intl is not wired at all**: no plugin in `next.config.ts`, no `NextIntlClientProvider` in `app/layout.tsx`, and **0** `useTranslations` calls across 240 components. | `grep` → 0 |
| I18N-3 | High | **Locale files are stubs**: `ar=15`, `en=10`, `fr=5` keys. There is no locale routing segment (`app/[locale]/` does not exist). | key counts |
| I18N-4 | High | **Strings are hardcoded and mixed-language**: French UI copy and API messages are literal strings in source (`errors.ts:9-45` is entirely French), and `loginAction.ts:30-33`/`registerAction.ts` return **Arabic** messages to a French UI. | as cited |
| I18N-5 | High | **RTL is unsupported**: `dir="ltr"` hardcoded at `app/layout.tsx:32` and `app/dashboard/layout.tsx:27`; **0** Tailwind `rtl:` variants and **0** logical utilities (`ms-`/`me-`/`ps-`/`pe-`) across the whole frontend, so every margin/padding is physically left/right. | counts |

---

## 9. Performance

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| PERF-1 | Medium | **Largest client chunks are 327 KB, 272 KB, 224 KB** uncompressed — almost certainly `recharts` + `framer-motion` + `xlsx`. No `next/dynamic` splitting on the heaviest dashboard routes. | `.next/static/chunks` sizes |
| PERF-2 | Medium | `xlsx` (large) is imported statically into two components rather than lazily on click. | `ExportExcelButton.tsx:3` |
| PERF-3 | Medium | **Writes on a read path**: `list()`/`overdue()` both `UPDATE ... markOverdue` before reading. | `invoices.service.ts:91, 131` |
| PERF-4 | Medium | Count queries duplicate the entire `WHERE` + `JOIN` of the data query (`invoices.service.ts:109-112`, `catalog.service.ts:97-104`). Correct, but doubles cost on large tables; `count(*)` over a filtered join is the top query cost. | as cited |
| PERF-5 | Low | No caching layer anywhere (no Redis, no `unstable_cache`, no HTTP cache headers on the API). | — |
| PERF-6 | Low | `next.config.ts:30` `images.unoptimized: true` disables optimisation globally. | as cited |

---

## 10. Dead code, mock data and unimplemented features

| ID | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| F-1 | High | **Mock data shipped in user-facing pages.** `dashboard/analytics/pivot` contains a literal `// Mock pivot data` block and fakes a 1 s API call with `setTimeout`; `dashboard/services/sms` fakes send/receive with `setTimeout(1000/1500)`; payroll renders from a locally-built array. These are reachable routes presented as working features. | `pivot/page.tsx:91,140`, `sms/page.tsx:65,82`, `hr/payroll/page.tsx:79` |
| F-2 | Medium | **Frontend calls endpoints the API does not implement**: `POST /invoices/:id/pay/public` (referenced at `app/invoices/[id]/view/page.tsx:74`) has no route in `server/src`. Public invoice payment is therefore broken at runtime. | grep |
| F-3 | Medium | **Designed-but-unused schema**: `idempotency_keys` (DB-7), `invoice_public_tokens` (DB-6), `legacy_id` columns on 8 tables, `paymentGatewaySecrets` used, `files` table unused. | `schema.ts` |
| F-4 | Low | **Zero supply-chain/business algorithms exist**: no chart of accounts, no ledger/journal, no FIFO/weighted-average valuation (grep for `fifo|valuation|lifo` → 0), no BOM/MRP, no closure table, no trie/fuzzy search, no interval tree, no LRU/TTL cache, no forecasting beyond simple aggregates. Phase 3 is entirely unstarted. | greps |
| F-5 | Low | README is the untouched `create-next-app` template (2 occurrences of the template text). | `README.md` |

---

## 11. Findings register — summary

| Severity | Count | IDs |
| --- | --- | --- |
| **Critical** | 3 | C1/DB-1, C2/OPS-1, C3/DB-2 |
| **High** | 12 | H1/DB-3, H2/DB-7, H3/OPS-2, H4/I18N-1..5, H5/SEC-6/7, H6/N-1/SEC-1, H7/DB-4, H8/F-1, N-3, TEN-1, OPS-3 |
| **Medium** | 24 | S-1..S-3, N-4..N-7, SEC-2/3/6/8/9, CSRF-1, VAL-1, RATE-1, AUD-1, DB-5/6/8, OPS-4..6, PERF-1..4, I18N-1, F-2, F-3 |
| **Low** | 17 | S-4..S-7, N-8, SEC-4/5, INJ-1/2, XSS-1, RATE-2, AUD-2, DB-9/10/11, OPS-7/8, PERF-5/6, F-4, F-5 |

---

## 12. Prioritized remediation roadmap

Effort is engineering days for one senior engineer, including tests. Order is deliberately chosen so each step unblocks the next.

### Sprint 0 — stop the bleeding (≈ 3.5 days) — must land before any new feature

| # | Task | Fixes | Effort |
| --- | --- | --- | --- |
| 0.1 | Correct `discount_bp` persistence, add a data-repair migration for existing rows, and add a DB check constraint `discount_bp between 0 and 10000` (already present) plus a regression test asserting stored bp == input % × 100 only once | C1/DB-1 | 1 d |
| 0.2 | Make `applyStock` atomic: single conditional `UPDATE ... SET quantity = quantity + $delta WHERE ... AND quantity + $delta >= 0 RETURNING`, with 409 on zero rows; same for `stockLevels` upsert | C3/DB-2 | 0.75 d |
| 0.3 | Optimistic concurrency on invoice settlement: `UPDATE invoices SET paid_minor = $new WHERE id = $id AND paid_minor = $observed`, retry ×3 then 409 `CONCURRENT_MODIFICATION` | H1/DB-3 | 0.5 d |
| 0.4 | Fix the compose/CI breakage: commit `server/.env.production.example`, make compose use `env_file` with `required: false` + `.env` interpolation, create `public/.gitkeep` (or drop the `COPY`), add `healthcheck` to `api`/`web` | C2/OPS-1, H3/OPS-2, OPS-3 | 0.5 d |
| 0.5 | Replace the dead `shared/money.ts` contract with the one actually used, or make the invoice service consume it. One source of truth. | H7/DB-4 | 0.5 d |
| 0.6 | Delete `i18n/request.ts`'s duplicate middleware; make `proxy.ts` the single middleware | S-1 | 0.25 d |

### Sprint 1 — security & correctness hardening (≈ 6 days)

| # | Task | Fixes | Effort |
| --- | --- | --- | --- |
| 1.1 | Idempotency middleware backed by `idempotency_keys` for all `POST/PUT/PATCH`: `Idempotency-Key` header, request hash, replay of stored response, 24 h TTL | H2/DB-7 | 1.5 d |
| 1.2 | Real session lifecycle: refresh-token cookie (httpOnly, path-scoped), a Next route handler that proxies `/api/auth/refresh`, automatic retry-on-401 in `apiFetch`, and revoke-on-logout. Kill the 7-day static token cookie | H6/N-1, N-2, SEC-1 | 1.5 d |
| 1.3 | Add `headers()` to `next.config.ts`: CSP (nonce-based, `report-only` first), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; enable a real helmet CSP on the API | H5/SEC-6 | 0.75 d |
| 1.4 | Replace client-side `xlsx` with a server-side export endpoint (`/exports/…` returning a streamed file) and drop the dependency | H5/SEC-7, PERF-2 | 1 d |
| 1.5 | Enable Postgres RLS on every `tenant_id` table, with a `SET LOCAL app.tenant_id` per request in the DB client; keep the app-level predicates as defence in depth | TEN-1 | 1.5 d |
| 1.6 | Make the audit row atomic with the business transaction (`audit(tx, …)`) and revoke `UPDATE/DELETE` on `audit_logs` for the app role | AUD-1, AUD-2 | 0.5 d |

### Sprint 2 — runtime robustness & Next.js correctness (≈ 5 days)

| # | Task | Fixes | Effort |
| --- | --- | --- | --- |
| 2.1 | Add `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx`; make `serverApi` return a discriminated result (`ok | unauthenticated | unavailable`) instead of `null` | N-3, N-4 | 1 d |
| 2.2 | Drive `dir`/`lang` from a locale source of truth; add logical Tailwind utilities; fix the 7 hardcoded `dir="ltr"` | I18N-5 | 1 d |
| 2.3 | Wire next-intl for real: `next-intl/plugin` in `next.config.ts`, `getRequestConfig` in `i18n/request.ts`, `NextIntlClientProvider`, `app/[locale]/` routing with `ar` as an RTL locale | H4/I18N-1..3 | 2 d |
| 2.4 | Remove or clearly gate the 6 mock-data pages behind a `COMING_SOON` flag rendered as an explicit "not yet available" state | H8/F-1 | 0.5 d |
| 2.5 | Zod-validate query strings with shared schemas; replace the 12 `typeof === "string"` chains | VAL-1 | 0.5 d |

### Sprint 3 — quality gates & DevOps (≈ 4 days)

| # | Task | Fixes | Effort |
| --- | --- | --- | --- |
| 3.1 | Fix all 475 ESLint errors (273 `error-boundaries` are resolved by 2.1; 156 `no-unescaped-entities` auto-fix); turn `no-explicit-any` back on as `warn` and burn down the 301 | §8.1 | 1.5 d |
| 3.2 | Add `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, fix fallout | §8.2 | 1 d |
| 3.3 | Install `@vitest/coverage-v8` and a frontend test runner (vitest + RTL) + Playwright; enforce a coverage floor in CI | §8.3 | 1 d |
| 3.4 | CI: add ESLint + `npm audit --audit-level=high` to both jobs, build the **web** image, add Trivy scanning, pin images by digest | OPS-4..7 | 0.5 d |

### Sprint 4 — Phase 2/3 foundations & algorithms (≈ 15+ days)

Then, and only then, the architecture and algorithmic work requested in Phases 2–5: extraction of a framework-agnostic `server/lib/algorithms` package (closure table, double-entry ledger, FIFO/weighted average, trie + Arabic-aware normalisation, interval tree, LRU/TTL, bin packing, forecasting, reconciliation), the accounting/inventory/sales/purchasing modules that consume it, ADRs, and the i18n-complete UI.

**Recommended sequencing rationale:** C1–C3 are silent financial-correctness bugs — every day they ship, the database accumulates wrong money and wrong stock, and the repair cost grows linearly. They must be fixed before any new feature writes more data. H6/N-1 means *no user can stay logged in for a working day*, which is a launch blocker regardless of everything else. TEN-1 (no RLS) is the difference between "a bug" and "a cross-tenant data breach".

---

## 13. What I deliberately did **not** change in Phase 1

Per the brief, Phase 1 is audit-only. Additionally I recommend **not** changing the following, because they are already better than a rewrite would be:

1. **NestJS + Drizzle** — the DI structure, migration runner and PGlite dev story are sound.
2. **Integer minor units for money** — correct; only the `bigint mode: "number"` detail needs revisiting.
3. **The transactional outbox** — the claim/backoff/recovery design is production-grade.
4. **Server-actions-only frontend** — a valid architecture; it needs validation and refresh, not replacement.
5. **`docs/01`–`docs/04`** — these are comprehensive (3,036 lines). They will be preserved and cross-referenced from the new `docs/adr/`, not replaced.

## 14. Assumptions made (explicit, per operating rule 5)

1. **Docker could not be executed** in this audit sandbox (`docker: command not found`). C2/OPS-1, H3/OPS-2 and OPS-3 are derived from static inspection and are stated as such. I flag them as Critical/High because the failure mode is deterministic, but they are **unverified by execution** and must be confirmed by running `docker compose config` on a clean clone.
2. **`discount_bp` interpretation (C1).** I read `input.discount` as a *percentage* (0–100) because `computeLines` divides by 100 and the DTO/UI pass percentage values; the schema documents basis points. Two readings are possible, and **either way there is a 100× inconsistency** between the computation and the stored column. Sprint 0.1 must settle the contract and add a test that pins it.
3. Target market is **Algeria** (DZD, NIF/NIS/RC, Arabic+French, Africa/Algiers timezone), inferred from `tenantSettings.defaultVatBp = 1900`, `currency = "DZD"` and Chargily Pay. The i18n/RTL work is therefore scoped to `fr`+`ar`+, not `fr`+`en`.
4. Effort estimates assume one senior engineer and exclude review time.

---

## 15. Open questions that block Sprint 2+

1. **Accounting scope:** the system currently has invoices and payments but **no double-entry ledger**. Algerian fiscal practice generally requires it. Is a real ledger in scope for Phase 3, or is invoice-level accounting sufficient? This decision changes the Sprint 4 plan substantially.
2. **`discount_bp` contract:** confirm percentage-in, basis-points-stored as the intended contract (assumption 2).
3. **Multi-tenant isolation level:** is RLS required for compliance, or is application-level filtering acceptable for the target customers?
4. **Locale set:** confirm `fr` + `ar` only, or add `en` (the stub exists)?
