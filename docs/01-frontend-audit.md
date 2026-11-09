# Phase 1 — Frontend Audit (Source of Truth for the Backend)

**Repository:** `hamzasekmane/erp` · **Branch:** `arena/3127357b-erp` · **Baseline commit:** `11b5de93475a5d4e992b7b987e40ff407be2aef2`
**Audit date:** 2026-11-09
**Auditor:** Arena agent (Phase 1 of the frontend → backend programme)
**Status:** Complete for Phase 1. No backend code was written in this phase, by instruction.

---

## 0. Document control

| Item | Value |
|---|---|
| Purpose | Establish what the existing Next.js frontend is, what it renders, and **exactly what API surface it already calls and expects**. This document is the binding input for `docs/02-architecture.md`. |
| Method | Static analysis of 299 files under `app/` (60,081 lines of `.ts`/`.tsx`), route enumeration, service/action call-site extraction, response-shape inference, cross-file contract comparison. No runtime execution (no `node_modules`, no backend present). |
| Non-goals | Redesigning the frontend, inventing new features, performance profiling with real data. |
| Rule applied | The frontend is the source of truth. Where the frontend is ambiguous, contradictory, or clearly broken, the conflict is recorded here and deferred to the Open Questions section with a proposed safe default. |
| Confidence | Endpoint paths: **high** (extracted from source). Response shapes: **medium-high** where a normaliser/Zod schema exists, **medium** where inferred from `result.data \|\| result` patterns, **low** where marked `?`. |

---

## 1. Executive summary

The frontend is a **large, feature-rich ERP UI (107 routes) built against an API that no longer exists in this repository**. It is not a clean client: it is an accumulation of at least three generations of data-access code (fetch services, Server Actions, direct route-level `fetch`, plus one Axios client), with divergent envelope conventions and several modules that are pure UI mock-ups.

Key conclusions that drive the backend design:

1. **There is no backend in the repo.** No Express/Nest/Fastify project, no `server/` directory, no Prisma/Mongoose models, no route handlers (`find app -name route.ts` → none). Every URL defaults to `http://localhost:5000/api`.
2. **The consumed API is multi-tenant, JWT-bearer, MongoDB-flavoured.** Every domain object is keyed by `_id` (string), carries `tenantId`, and uses `createdAt`/`updatedAt`. Auth responses must return `{ token, user, tenant }`; login stores `token` + `tenantId` + `user_name` cookies, registration stores `token` + `user` + `tenant` cookies.
3. **The dominant envelope is inconsistent.** Three conventions coexist and the backend must accommodate all three during integration:
   - `{ success: true, data: <T>, pagination?: { total, page, limit, pages } }` (invoices, payments, notifications, reports, admin);
   - bare `<T>` or bare array `[...]` (client groups, `/clients/:id/balance`, `products.Service` on some paths);
   - `{ data: <T> }` with no `success` (clients list, client notes).
4. **A global "subscription expired" contract exists and is load-bearing.** `403` + `{ error_code: "SUBSCRIPTION_EXPIRED", message, data: { expiredSince, daysOverdue } }` is detected in `clientService`, `clientActions`, `clientNoteService` (403 defaults to this code), and rendered by `<SubscriptionExpired />`.
5. **Authorisation is client-side only.** `proxy.ts` checks for the *presence* of a `token` cookie; there is **no role check anywhere** in routing, layouts, pages or Server Actions. `/dashboard/settings/tenants`, `/dashboard/settings/users`, `/dashboard/settings/api` and `/dashboard/hr/*` are reachable by any authenticated user. RBAC must be enforced by the backend.
6. **The httpOnly JWT is systematically re-exposed to the browser.** ~30 call sites pass `token` as a prop into Client Components, and three notification forms embed `<input type="hidden" name="token" value={token}>`. This nullifies the httpOnly cookie protection and must be treated as a security defect (and a design constraint: the backend must support short-lived tokens + rotation, and/or the frontend must be refactored).
7. **Several modules have zero backend contract**: HR (8 pages), Archives (5), Support (4), Services (5), Reports landing + 5 sub-pages, Analytics 5 sub-pages, Subscription create/analytics/history, Payment methods/reconciliation, Invoice templates, Settings/security, API keys page. These are hardcoded arrays or `setTimeout` simulations. **They define no endpoints** and therefore do not constrain Phase 2 — but they create feature expectations that must be explicitly deferred or scoped.
8. **Financial integrity is currently client-computed.** `InvoiceForm` computes `subtotal`, `total` and sends them in the payload alongside line items; a backend must **recompute** totals server-side and treat the client values as hints (safe default: ignore `subtotal`/`total` on write).
9. **Contract names diverge per module** (`/client` vs `/clients`, `/product` vs `/products`, `/invoices/:id/pdf` vs `/invoices/:id/export/pdf`, `/invoices/:id/pay` vs `/invoices/:id/payment`, `/subscription` vs `/subscriptions`, `/reports/*` only partly implemented). These are catalogued as IC-xx conflicts with an explicit resolution per item.
10. **Build safety net is off.** `next.config.ts` sets `typescript.ignoreBuildErrors: true`; `next-intl`, `@tanstack/react-query`, `socket.io-client`, `axios` and `xlsx` are installed but effectively unused (Axios only in `api.service.ts`, which is unused; react-query only imported in `NotificationBell`). The audit therefore cannot rely on "it compiles" as evidence of correctness.

Severity roll-up: **7 blocking issues (P0)**, **18 contract mismatches (P1)**, **22 quality/UX issues (P2)**, plus hygiene items. Details in §14.

---

## 2. Audit scope, method and evidence

### 2.1 Scope inspected

| Area | Files |
|---|---|
| App shell | `app/layout.tsx`, `app/providers.tsx`, `app/globals.css`, `proxy.ts`, `next.config.ts`, `tsconfig.json` |
| Routing | all 107 `app/**/page.tsx`, `app/dashboard/layout.tsx`, 12 `loading.tsx`, `app/dashboard/error.tsx` |
| Mutations | all 19 files in `app/actions/` |
| Data access | all 21 files in `app/services/` (incl. `analytics/`, `dashboard/` sub-services) |
| Utilities | `app/lib/apiFetch.ts`, `app/lib/ApiError.ts`, `app/lib/utils.ts`, `app/lib/zod-schemas.ts` |
| Types | all 14 files in `app/types/` (1,120 lines) |
| UI components | 97 files under `app/components/`, plus co-located client components under `app/dashboard/**` |
| i18n | `messages/{ar,en,fr}.json`, `i18n/request.ts` |
| Config | `package.json`, `package-lock.json`, `.gitignore`, `README.md` |

### 2.2 Method

1. Enumerate routes; classify each page by data source (`fetch`/service/Server Action vs hardcoded array vs `setTimeout`).
2. Extract every network call site programmatically (`fetch(`, `apiClient.*`) and collect the URL template, HTTP method, auth mechanism, query parameters and body.
3. For each resource, reconstruct the **expected response shape** from the consumer code (normalisers, Zod schemas, `result.data || result`, pagination reads).
4. Diff consumers against each other to find contract conflicts (IC-xx).
5. Inspect auth/session, tenant scoping, role gates, token propagation, and error handling.
6. Record defects with file references and severity; record unknowns as open questions with a proposed safe default.

### 2.3 Evidence conventions used in this document

- `path` references are repository-relative, e.g. `app/services/clientService.ts`.
- "WIRED" = reads/writes a real HTTP endpoint on page load or submit.
- "PARTIAL" = wired but with at least one broken call, unimplemented endpoint, or silent mock fallback.
- "STATIC" = no network call at all (hardcoded data or simulated delay).
- Endpoints are written relative to the API base (`NEXT_PUBLIC_API_URL`, default `http://localhost:5000/api`).

---

## 3. Stack and toolchain

### 3.1 Runtime dependencies (from `package.json` + `package-lock.json`)

| Package | Declared | Locked | Actual use |
|---|---|---|---|
| `next` | ^16.4.5 | 16.4.5 | App Router, RSC, Server Actions, `proxy.ts` (Next 16 replacement for `middleware.ts`) |
| `react` / `react-dom` | 19.2.3 | 19.2.3 | `useActionState`, `startTransition`, RSC streaming |
| `typescript` | 5.9.3 | 5.9.3 | `strict: true`, but **build errors ignored** |
| `zod` | ^4.3.6 | 4.6.7 | Validation in actions + response normalisation. Zod **v4** API. |
| `tailwindcss` | ^4.1.18 | 4.x | v4 with `@tailwindcss/postcss`; CSS variables for theming |
| `next-themes` | ^0.4.6 | — | `app/providers.tsx`, dark default, class attribute |
| `lucide-react` | ^0.563 | — | Icon system everywhere |
| `@fortawesome/*` | ^7 | — | Sidebar imports `icon` from fontawesome-svg-core (unused leftover) |
| `framer-motion` | ^12 | — | Auth pages, landing, dashboard animations |
| `recharts` | ^3.7 | — | `DashboardCharts`, payment charts |
| `date-fns` | ^4.1 | — | Invoice date formatting (`fr` locale) |
| `sonner` + `react-hot-toast` | both | — | **Two toast systems**; `sonner` mostly in dashboard, `react-hot-toast` in auth/forgot-password |
| `xlsx` | ^0.18.5 | — | Export buttons (client-side Excel) |
| `@tanstack/react-query` | ^5.95 | — | Imported only in `app/components/Dashboard/NotificationBell.tsx`; **no `QueryClientProvider` anywhere** |
| `axios` | ^1.14 | 1.21.1 | Only `app/services/api.service.ts` (unused, and it reads `localStorage.getItem('token')`) |
| `socket.io-client` | ^4.8 | — | **Unused** |
| `next-intl` | ^4.8 | 4.14.9 | **Unused** (no plugin in `next.config.ts`, no `NextIntlClientProvider`, no `useTranslations`) |
| `next-client-cookies`, `js-cookie` | — | — | Not imported in audited code |
| `use-debounce` | ^10 | — | Search inputs |

### 3.2 Scripts and configuration

```
dev   → next dev
build → next build
start → next start
lint  → eslint
```

- `next.config.ts`: `typescript.ignoreBuildErrors: true`, `images.unoptimized: true`. **No** `output: 'standalone'`, no rewrites/proxy to the backend, no `experimental.serverActions` tuning, no security headers.
- `tsconfig.json`: `strict: true`, `moduleResolution: "bundler"`, path alias `@/* → ./*`, target ES2017.
- `.gitignore` is Next.js standard; **no `.env.example`** exists. The only environment variable referenced anywhere is `NEXT_PUBLIC_API_URL` (and one broken `process.env.API_URL` usage — see D-05).
- `proxy.ts` (root) is the Next 16 middleware; matcher excludes `api`, `_next/*`, `favicon.ico`, `public`.

### 3.3 Naming and product identity (inconsistent)

The product is called **Valora** in root metadata, **Velora** in UI copy (`VELORA • PAYMENT`, "Infrastructure Sécurisée Velora", README-ish text), and package `frontend` v0.1.0. Author metadata says "Velora Team". This is cosmetic but affects emails/PDF branding later (open question Q-19).

### 3.4 Language and direction

- `<html lang="fr" dir="ltr">` in `app/layout.tsx`.
- UI copy is a **mix of French and Arabic**: French labels/headings dominate; error messages, toasts and hint text are frequently Arabic (`"انتهت صلاحية الباقة"`, `"يرجى التحقق من البيانات المدخلة"`). Business logic comments mix FR/AR/EN.
- `messages/{ar,en,fr}.json` exist but are **never loaded**; `i18n/request.ts` does not contain next-intl request config — it contains a **copy of `middleware()`** (dead, wrong, misleading).
- Currency: dashboard formats with `formatDA` and "DA" (Algerian dinar); subscription module formats `EUR`; registration payload sends `currency: "DZD"` and `language: "fr"`; company settings schema defaults `country: "France"`, `currency: "EUR"`, but registration defaults `"Algérie"` / `postalCode: "16000"`. **Two currencies and two countries in the same product** → Q-02.

---

## 4. Repository map and size

```
erp/
├── app/                     299 files, 60,081 lines (.ts/.tsx)
│   ├── (auth)/              3 route-group pages: login, register, forgot-password
│   ├── actions/             19 Server Action modules
│   ├── components/          97 UI files (Client, invoices, payments, products, settings, layout, landing, ui…)
│   ├── config/plans.ts      static plan catalogue used by /checkout
│   ├── dashboard/           ~93 routes, incl. co-located client components and Server Action wrappers
│   ├── hooks/               useAnalyticsData.ts, useToast.ts
│   ├── lib/                 apiFetch.ts, ApiError.ts (duplicate), utils.ts, zod-schemas.ts
│   ├── services/            21 files, incl. analytics/ and dashboard/ sub-packages
│   ├── types/               14 files, 1,120 lines
│   ├── layout.tsx, providers.tsx, globals.css, page.tsx (landing)
│   ├── checkout/, facturation/, stock/, croissance/, inscription/  (thin public pages)
│   └── invoices/[id]/view/  public invoice portal
├── i18n/request.ts          dead file containing middleware logic
├── messages/{ar,en,fr}.json unused translations
├── proxy.ts                 auth-presence proxy
├── next.config.ts, tsconfig.json, postcss.config.js, tailwind.config.mjs, eslint.config.mjs
├── package.json / package-lock.json
└── README.md                unmodified create-next-app boilerplate
```

Route count by module (107 total):

| Module | Routes | Notes |
|---|---|---|
| Auth | 3 | `login`, `register`, `forgot-password` |
| Public/marketing | 7 | `/`, `/checkout`, `/facturation`, `/stock`, `/croissance`, `/inscription`, `/invoices/[id]/view` |
| Dashboard | 1 | main KPI dashboard |
| Clients | 13 | list, detail, edit, create, import, 5 group routes, 3 note routes |
| Invoices | 5 | list, detail, new, edit, templates |
| Products | 6 | list, detail, edit, new, inventory, tax-rates |
| Categories | 4 | list, detail, edit, new |
| Payments | 11 | list, detail, new, gateways (list/new), methods, reports (+periodic), reconcile, reconciliation, stats |
| Analytics | 6 | dashboard + kpi, forecast, benchmark, pivot, export |
| Reports | 6 | landing + financial, tax, clients, products, custom |
| HR | 8 | employees (+new), departments, attendance, leaves, payroll, contracts, notes |
| Archives | 5 | landing + invoices, clients, products, documents |
| Services | 5 | email, pdf, sms, notifications, file/backup |
| Settings | 16 | general, company, security, billing, payment, users (4), tenants (3), api keys (4) |
| Subscription | 5 | overview, create, analytics, history, invoices |
| Support | 4 | documentation, technical, contact, changelog |
| Notifications | 1 | |
| Tenant | 1 | legacy `/dashboard/tenant` (broken env var) |

Special files: 12 `loading.tsx` (clients/invoices only), **1 `error.tsx`** (`app/dashboard/error.tsx`), **0 `not-found.tsx`**, **0 `route.ts`**.

---

## 5. Runtime architecture (as built)

```
Browser
  │  (RSC payload + client components)
  ▼
Next.js 16 App Router (Node runtime)
  ├─ proxy.ts ................ presence-of-token check for /dashboard*, /login, /register
  ├─ Server Components ...... read `token` cookie, call services, render
  ├─ Server Actions ("use server")
  │     ├─ read `token` cookie (most) or `formData.get("token")` (payment, tax, notifications)
  │     ├─ fetch(API_URL + path, { Authorization: Bearer <jwt> })
  │     ├─ revalidatePath(...) and/or redirect(...)
  │     └─ return { success, message, data, errors }
  └─ Client Components
        ├─ receive `token` prop in ~30 places and call the API **directly from the browser**
        ├─ some forms post to non-existent internal routes (`/api/...`)
        └─ optimistic UI, toasts, local state
  ▼
External API (not in repo)
  default base: http://localhost:5000/api
```

Observations:

- **Two data planes.** Some domains are fetched server-side (dashboard, clients, invoices list, payments list, settings), others client-side (analytics refresh, gateways, notifications actions, payment creation, tax modal, invoice PDF button). The same JWT is used in both, but only server-side calls benefit from the httpOnly cookie.
- **No shared HTTP client.** `app/lib/apiFetch.ts` and `app/lib/ApiError.ts` define the *same* `ApiError` class and *two different* `apiFetch` implementations (one unwraps `result.data`, the other returns the whole body and only parses JSON if `content-type` matches). `clientService`, `clientNoteService` and `clientImportService` each embed a *third/fourth/fifth* private copy of an `apiFetch`.
- **No request cancellation, timeout, retry, backoff, or idempotency keys.** Every call is `fetch` + `cache: "no-store"` or `next: { revalidate }` with no `AbortSignal`.
- **Silent fallbacks masquerade as success.** Analytics returns `DEFAULT_*` constants on any failure; `settingsService.getBilling` and `getSystemMetrics` return **fabricated data** (`"156 MB"`, `42` active users, Visa `4242`) even when the response is HTML/404; payment stats return `{ summary: null, methods: [], daily: [] }`. Users cannot distinguish "no data" from "backend down".

---

## 6. Route inventory and wiring status

Legend: **W** = wired to real endpoints · **P** = partial (wired + broken call, or mock fallback) · **S** = static/mock only.

### 6.1 Authentication & public

| Route | Status | Data source / notes |
|---|---|---|
| `/(auth)/login` | W | `loginAction` → `POST /auth/login`; sets `token`, `tenantId`, `user_name` cookies |
| `/(auth)/register` | W | `registerAction` → `POST /auth/register` with `{ tenantData, userData, planCode }`; sets `token`, `user`, `tenant` |
| `/(auth)/forgot-password` | W | `requestPasswordResetAction` → `POST /auth/forgot-password` (client component + `react-hot-toast`) |
| `/` (landing) | S | Lazy sections; `app/config/plans.ts` static catalogue; no API |
| `/checkout` | S | Reads `?plan=&billing=`, static prices, "Payer maintenant" has **no handler** |
| `/facturation`, `/stock`, `/croissance` | S | 25-line marketing stubs |
| `/inscription` | S | 85-line legacy registration stub (not linked to `registerAction`) |
| `/invoices/[id]/view` | W | Public portal: `GET /invoices/:id/view`, `POST /invoices/:id/pay/public`, PDF public download |

### 6.2 Dashboard

| Route | Status | Notes |
|---|---|---|
| `/dashboard` | W | `GET /dashboard/stats` + `GET /dashboard/quick-stats`, `Promise.allSettled`, silent defaults on failure; renders KPIs, monthly sales chart, recent invoices, low stock |

### 6.3 Clients

| Route | Status | Notes |
|---|---|---|
| `/dashboard/clients` | W | `clientService.getAllClients` → `GET /clients?...`; reads `response.data` + `response.pagination.total` |
| `/dashboard/clients/[id]` | W | `getFullDetails` = `GET /clients/:id` + `GET /clients/:id/stats` (`Promise.allSettled`, Zod `ClientSchema`/`ClientStatsSchema`, tolerant fallback), then `GET /clients/:id/invoices` |
| `/dashboard/clients/new` | P | Subscription check is **hardcoded `true`** (`checkSubscription()` returns constant); `ClientForm` → `createClientAction` → `POST /clients` |
| `/dashboard/clients/edit/[id]` | W | Same form, `updateClientAction` → `PUT /clients/:id` |
| `/dashboard/clients/import` | W | `clientImportService` / `clientImportActions`: upload, validate, template, history, cancel |
| `/dashboard/clients/groups` | W | `clientGroupService.getAllGroups` → `GET /client-groups`; service **paginates in memory** after fetching everything |
| `/dashboard/clients/groups/[id]` | W | `GET /client-groups/:id` + `GET /client-groups/:id/clients` |
| `/dashboard/clients/groups/new` | W | `createClientGroupAction` → `POST /client-groups` |
| `/dashboard/clients/groups/edit/[id]` | W | `updateClientGroupAction` → `PUT /client-groups/:id` (+ client-side `fetch` in `EditGroupForm`) |
| `/dashboard/clients/groups/settings/[id]` | P | Add/remove members via actions → `POST\|DELETE /client-groups/:id/clients`; settings page also fetches `GET /client-groups/:id` from the browser |
| `/dashboard/clients/notes` | W | `clientNoteService` → `GET /client-notes` (expects `{ data, pagination }`) |
| `/dashboard/clients/notes/new`, `…/edit/[id]` | W | `createClientNoteAction` / `updateClientNoteAction`; pin via `PUT /client-notes/:id/pin` |

### 6.4 Products, categories, taxes

| Route | Status | Notes |
|---|---|---|
| `/dashboard/products` | W | Parallel `GET /products`, `GET /categories/type/product`, `GET /products/stats`, `GET /taxes`; toggle via `PUT /products/:id` (`status`) |
| `/dashboard/products/new` | W | Server-side fetch of categories + taxes; `createProductAction` → `POST /products` then `redirect` |
| `/dashboard/products/[id]`, `…/edit/[id]` | W | `GET /products/:id`, `updateProductAction` → `PUT /products/:id` |
| `/dashboard/products/inventory` | W | Same list endpoints, inventory framing |
| `/dashboard/products/tax-rates` | W | `taxService` → `GET/POST/PUT/DELETE /taxes`; token passed via hidden form field |
| `/dashboard/categories` | W | `GET /categories/type/product` + `GET /products` (counts computed client-side) |
| `/dashboard/categories/new`, `…/edit/[id]`, `…/[id]` | W | `POST/PUT/DELETE /categories`; detail page fetches category + products |

### 6.5 Invoices

| Route | Status | Notes |
|---|---|---|
| `/dashboard/invoices` | W | `GET /invoices?filters` + `GET /invoices/stats?period=year`; reads `data`, `pagination.pages`, `stats.data.summary`, `stats.data.byStatus[{_id,amount,count}]` |
| `/dashboard/invoices/[id]` | W | `GET /invoices/:id`; status change via `updateInvoiceStatusAction` → `PATCH /invoices/:id/status`; "mark paid" button reuses that action with `status: 'paid'` |
| `/dashboard/invoices/new` | W | Page-level fetch `GET /clients?limit=1000`, `GET /products?limit=1000&active=true`; form → `createInvoiceAction` |
| `/dashboard/invoices/edit` | **P (broken)** | Fetches `GET /client` and `GET /product` (**singular, wrong**), plus `GET /invoices/:id`; route has no `[id]` param in the path template |
| `/dashboard/invoices/templates` | S | Static template gallery, no persistence |

### 6.6 Payments

| Route | Status | Notes |
|---|---|---|
| `/dashboard/payment` | W | `paymentService.getAll` + `getStats`; reads `pagination.pages`, `stats.summary[0]`, `stats.daily[{_id,total}]` |
| `/dashboard/payment/[id]` | W | `GET /payments/:id`; delete + print buttons |
| `/dashboard/payment/new` | **P (broken)** | Reads token from `document.cookie` (httpOnly ⇒ `""`) → unauthenticated `POST /payments`; client list is empty (commented-out fetch) |
| `/dashboard/payment/gateways` | W | `GET /payments/settings/gateways`; toggle/config from client component |
| `/dashboard/payment/gateways/new` | W | `POST /payments/settings/gateways/setup` |
| `/dashboard/payment/methods` | **S** | Hardcoded 5 methods; `getInitialMethods` contains the literal mock array and a comment "will be replaced by real API" |
| `/dashboard/payment/reconcile` | W | `GET /payments?status=completed,paid&limit=100` (**comma-separated status** contract) |
| `/dashboard/payment/reconciliation` | **S** | Hardcoded reconciliation rows |
| `/dashboard/payment/reports`, `…/reports/periodic`, `…/stats` | W | `getStats` with `{period, offset, groupBy, limit}` variants; several defensive defaults |

### 6.7 Settings, tenants, users, API keys

| Route | Status | Notes |
|---|---|---|
| `/dashboard/settings` | S | Hub of cards; no data |
| `/dashboard/settings/company` | W | `GET /tenant` + `GET /admin/metrics`; `updateCompanyAction` → `PUT /tenant`; logo upload `POST /tenant/logo` (multipart) |
| `/dashboard/settings/security` | **S** | 689 lines of static security UI, no endpoints |
| `/dashboard/settings/billing` | P | `settingsService.getBilling` → `GET /subscription`, with **fabricated fallback** (plan "Professionnel", Visa 4242, two fake invoices) |
| `/dashboard/settings/payment` | W | `getGateways` + `getStats`; client-side `PaymentClient` |
| `/dashboard/settings/users` | W | `GET /users` (+ `GET /admin/tenants` for filter) |
| `/dashboard/settings/users/[id]`, `…/edit/[id]` | **P (broken)** | Detail/edit read from `GET /users` list; the edit form posts to **`POST /api/settings/users/update`** — an internal route that does not exist |
| `/dashboard/settings/users/new` | W | `POST /users` (role/status radios) |
| `/dashboard/settings/tenants` | W | `GET /admin/tenants`; maps `isActive → status`, `plan.name/code` |
| `/dashboard/settings/tenants/[id]` | P | `GET /admin/tenants/:id`, users, settings; delete button calls **`DELETE /api/admin/tenants/:id`** (internal route, 404) |
| `/dashboard/settings/tenants/new` | W | `POST /admin/tenants` |
| `/dashboard/settings/api` | **S** | Hardcoded API keys **including plaintext-looking secrets**; copy/delete are simulated (`setTimeout`) |
| `/dashboard/settings/api/new`, `…/[id]`, `…/[id]/edit` | P | Real Server Actions exist (`/api-keys` family) but the pages render static/mock key data |

### 6.8 Subscription

| Route | Status | Notes |
|---|---|---|
| `/dashboard/subscription` | W | `getSubscriptionData()` → `GET /subscriptions/current`, `/plans`, `/invoices?limit=5`, `/payment-method`, `/limits`; billing info is deliberately `null` |
| `/dashboard/subscription/invoices` | W | `GET /subscriptions/invoices?page=&limit=` (page-level `fetch`) |
| `/dashboard/subscription/create` | **S** | Plan builder UI, no API |
| `/dashboard/subscription/analytics` | **S** | Hardcoded subscription analytics |
| `/dashboard/subscription/history` | **S** | 626 lines, hardcoded `historyData` |

### 6.9 Analytics & reports

| Route | Status | Notes |
|---|---|---|
| `/dashboard/analytics` | P | Server-side `/reports/*` + client refresh; KPIs; several **hardcoded deltas** (12.5 %, 8.2 %), `Math.random()` growth, "Délai paiement 32 jours", "Satisfaction 94 %" |
| `/dashboard/analytics/kpi`, `forecast`, `benchmark`, `pivot`, `export` | **S** | Static KPI cards, fake chart data, fake benchmark |
| `/dashboard/report` | **S** | 356 lines of cards with hardcoded "CA: 124 500€", "Bénéfice net 79 300€" |
| `/dashboard/report/financial`, `tax`, `clients`, `products`, `custom` | **S** | Hardcoded arrays (`monthlyRevenue`, `recentInvoices`, `recentTransactions`…) |

### 6.10 HR, archives, services, support, notifications, tenant

| Route group | Status | Notes |
|---|---|---|
| `/dashboard/hr/*` (8) | **S** | Fully hardcoded employees/departments/attendance/leaves/payroll/contracts/notes; `useState<Employee[]>([...])` literals; **zero API calls** |
| `/dashboard/archives/*` (5) | **S** | Hardcoded archived invoices/clients/products/documents; no delete/restore contract |
| `/dashboard/services/*` (5) | **S** | Email/SMS/PDF/notifications/backup panels with `setTimeout` simulation |
| `/dashboard/support/*` (4) | **S** | Docs, tickets (`recentTickets`), contact, changelog |
| `/dashboard/notifications` | W | `GET /dashboard/notifications`; mark-all/cleanup/delete via Server Actions; **token in hidden inputs** |
| `/dashboard/tenant` | **P (broken)** | `fetch(`${process.env.API_URL}/tenant/profile`)` — env var is `undefined` server-side of the client bundle; legacy duplicate of settings/company |

### 6.11 Wiring summary

| Status | Routes | Share |
|---|---|---|
| W — wired | 55 | 51 % |
| P — partial/broken | 13 | 12 % |
| S — static/mock | 39 | 37 % |

**Consequence:** the backend that Phase 2 specifies must cover the **68 wired/partial routes**; the 39 static routes define *aspirational* features (HR, archives, support, advanced analytics, service integrations) that must be explicitly marked as out of scope or scheduled for later phases.

---

## 7. State management

| Mechanism | Where | Assessment |
|---|---|---|
| Server Components + `cookies()` | Most list/detail pages | Primary read path; `token` read from cookie on every request |
| Server Actions (`"use server"`) | 19 modules | Primary mutation path; `revalidatePath` used inconsistently (sometimes missing after create/update) |
| `useActionState` | Login/register, invoice form, product form, tax form, notes, groups, upload | Standard form mutation pattern; error surfaces are ad-hoc (`{ error }` vs `{ message }` vs `{ success, errors }`) |
| `useState` local component state | All client components | Dominant UI state (filters, modals, selections) |
| URL search params | List pages (clients, invoices, payments, products) | Server-side filtering contract; invoice filters map to `fromDate/toDate/dueFrom/dueTo` |
| React Context | Theme only (`next-themes`) | No auth context, no user/permission context, no tenant context |
| React Query | Imported in `NotificationBell` only | **Non-functional**: no provider, no client instance |
| Cookies (client-readable) | `tenantId`, `user_name`, `user`, `tenant` | Not `httpOnly`; parsed nowhere in audited code (Sidebar/Navbar get `user` as a prop) |
| `localStorage` | `api.service.ts` (axios interceptor) + `useAnalyticsData` fallbacks | Dead path; never populated by the auth flow |
| WebSockets | `socket.io-client` dependency | Unused; no realtime contract exists |

**Duplicated user identity**: the user object arrives via `GET /users/profile/me` in the dashboard layout, but login also writes `user_name` (login) and a JSON `user` cookie (register). Profile shape comes from `app/types/user.ts`/`UserSchema`, cookie shape from `loginAction`. No single normaliser.

**No optimistic concurrency**: invoices/products/users are PUT/PATCH with no `updatedAt`/version precondition. Two users editing the same invoice silently overwrite each other (relevant for Phase 2's data-integrity decisions).

---

## 8. API access layer

### 8.1 Five coexisting access patterns

| # | Pattern | Files | Auth | Response handling |
|---|---|---|---|---|
| A | Page-level server `fetch` | `dashboard/invoices/new`, `products/new`, `clients/groups/settings/[id]`, `settings/*`, `invoices/[id]/view`, `tenant` | `Bearer` from cookie | `.json()`, ad-hoc |
| B | Service module (server) | `clientService`, `clientGroupService`, `products.Service`, `taxService`, `invoice.service`, `paymentServices`, `settingsService`, `notification.service`, `clientImportService`, `clientNoteService`, `subscriptionService`, `dashboard/*`, `analytics/*` | `Bearer` from cookie passed as arg | inconsistent: some return `result`, some `result.data`, some `result.data \|\| result` |
| C | Server Actions | `app/actions/*` (19 files) | cookie, or hidden form field | wrap into `{ success, message, data, error }` |
| D | Client-side `fetch` from a Client Component | `InvoiceForm` (client balance), `AddClientsModal`, `EditGroupForm`, `ImportForm`, `TenantActions`, `GatewaysManager`, `NotificationList`, `DeletePaymentButton`, `PaymentMethodsManager` (simulated) | `token` prop | various |
| E | Axios instance | `app/services/api.service.ts` (dead code) | `localStorage` (never set) | none |

### 8.2 Base URL and environment

- Only variable: `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api`).
- Because it is `NEXT_PUBLIC_*`, the browser bundle contains the API origin. Client Components therefore call the API **cross-origin from the browser** — the backend must allow CORS with credentials or accept `Authorization` from that origin (relevant for Phase 2 security design).
- One broken usage: `process.env.API_URL` in `app/dashboard/tenant/page.tsx` (undefined both server and client; produces `undefined/tenant/profile`).
- No `.env.example`, no staging/production URL documentation. **Safe default proposed:** `API_INTERNAL_URL` (server-only) + `NEXT_PUBLIC_API_URL` (browser) — see Q-11.

### 8.3 Envelope conventions actually consumed

| Convention | Where expected | Consequence for backend |
|---|---|---|
| `{ success: boolean, data: T, pagination?: P }` | invoices (list + stats), payments, notifications, reports, admin tenants, `/users`, `/api-keys`, `/tenant`, `/dashboard/*` | Must be the canonical envelope |
| `{ data: T }` (no `success`) | clients list/detail, client notes, categories, products, taxes | Must be tolerated |
| Bare array `T[]` | `client-groups`, `client-groups/:id/clients`, `payments/settings/gateways` (`result.data \|\| result`), `/subscriptions/plans` (via `fetchWithAuth` which unwraps `.data`) | Must be tolerated for groups only; otherwise `{data}` |
| `{ success, message }` mutations | all actions | Message must be human-readable French (surfaced in toasts) |
| `403` + `error_code` | subscription gate | Must be exact |
| `409` on delete | `deleteClientAction` ("client has invoices") | Must return 409 with message |
| `page/limit/total/pages` | every list | `pages` (not `totalPages`); `types/payment.ts#totalPages` is unused |

### 8.4 Error-handling behaviour the backend must satisfy

| Frontend behaviour | Requirement |
|---|---|
| `clientActions` distinguishes `400`, `401`, `403`, `404`, `409` | Use meaningful status codes; never 200 for failures |
| `400` responses sometimes carry `errors: [{field,message}]`, sometimes `errors: { field: [msg] }`, sometimes plain `message` | Canonical `errors: [{ field, message }]`; frontend tolerates both |
| `401` is expected to mean "session expired → redirect to login" | Keep 401 exclusively for auth failures, not permission failures |
| `403` is **always** treated as subscription expiry by `clientNoteService` (defaults `error_code`) | Any non-subscription 403 will render the "subscription expired" screen — backend must use 403 **only** for subscription expiry on client/notes endpoints, or frontend must be patched (recorded as P1) |
| `response.headers.get("content-type").includes("text/html")` is used to detect "endpoint missing" | Serving a Next/HTML 404 page triggers silent mock data. Backend must always return JSON, including for 404/405 |
| Network failure expected as `TypeError` → returns `{ success:false, error:"Erreur réseau" }` | No specific requirement |

### 8.5 Missing cross-cutting concerns (backend must compensate)

- No request IDs, no correlation IDs, no trace headers.
- No retries; no idempotency keys on `POST /invoices`, `POST /payments`, `POST /clients/import` (double-submit risk is real: forms disable buttons via `isPending`, but client-side fetches do not).
- No rate limiting awareness; `api-keys` model includes `rateLimit` and `ipWhitelist` fields, so the concept is expected.
- No pagination guardrails: pages request `limit=1000` (`invoices/new`, `payments getAllForExport`). Backend must cap `limit`.
- No optimistic locking / `If-Match`.
- No soft-delete contract exposed (archives module is static). Deletes are hard `DELETE`.

---

## 9. API contract catalogue (what the frontend already calls)

Notation: **Auth** = `Authorization: Bearer <jwt>` required. **?** marks inferred/low-confidence fields. All paths relative to base. "Consumers" lists the files that must keep working.

### 9.1 Auth — `app/services/api.ts`, `app/actions/loginAction.ts`, `registerAction.ts`

| # | Method & path | Request | Expected response | Consumers |
|---|---|---|---|---|
| 1 | `POST /auth/login` | `{ email, password }` | `{ token: string, user: { name, ... }, tenant?: { id } , message? }` | `loginAction` (reads `result.token`, `result.user.name`, `result.tenant.id`) |
| 2 | `POST /auth/register` | `{ tenantData: { name, businessName, taxNumber, domain, contact:{email,phone}, address:{street,city,postalCode,country}, currency:"DZD", language:"fr" }, userData: { name, email, password, phone, role:"admin" }, planCode }` | `{ token: string, user: {...}, tenant: {...} }` | `registerAction` |
| 3 | `POST /auth/forgot-password` | `{ email }` | `{ success: true }` or `{ error }` | `apiService.requestReset` |
| — | *implied, absent* | — | — | no refresh, logout, verify-email, reset-password-with-token endpoints exist. Logout only deletes cookies. **Q-04** |

Auth semantics implied: single opaque JWT, 7-day cookie lifetime (`maxAge: 60*60*24*7`), `sameSite: "strict"`, `httpOnly` for `token` only. No `expiresAt`, no refresh token, no token version/revocation.

### 9.2 Dashboard — `app/services/dashboard/*`, `notification.service.ts`

| # | Method & path | Query | Expected response (consumed fields) |
|---|---|---|---|
| 4 | `GET /dashboard/stats` | — | `{ success, data: { stats: { invoices:{total,count,paid,due}, payments:{total,count}, clients:{total,totalBalance}, products:{total,lowStock,totalStockValue} }, summary:{total,count,paid,due}, byStatus:[{_id,amount,count}], overview:{recentInvoices:[],recentPayments:[],lowStockProducts:[],overdueInvoices:[]}, charts:{monthlySales:[{name,sales,_id?}],topClients:[]} } }` |
| 5 | `GET /dashboard/quick-stats` | — | `{ success, data: { today:{total,count}, yesterday:{total,count}, overdueCount, draftCount, clientCount, revenue, pending, invoices, lowStock } }` |
| 6 | `GET /users/profile/me` | — | `{ data: { _id, name, email, role, tenantId? , avatar? } }` (validated by `UserSchema`, tolerant) |
| 7 | `GET /dashboard/notifications` | `page,limit,isRead,type` | `{ success, data:{ notifications:[{_id,tenantId,userId,type:'info'\|'success'\|'warning'\|'error',title,message,data?,priority:'low'\|'medium'\|'high',isRead,readAt?,createdAt,expiresAt?}], unreadCount }, pagination:{page,limit,total,pages} }` |
| 8 | `GET /dashboard/notifications/unread/count` | — | `{ success, count }` |
| 9 | `PUT /dashboard/notifications/:id/read` | — | `{ success }` |
| 10 | `PUT /dashboard/notifications/read-all` | — | `{ success }` |
| 11 | `DELETE /dashboard/notifications/:id` | — | `{ success }` |
| 12 | `DELETE /dashboard/notifications` | — | `{ success }` |
| 13 | `POST /dashboard/notifications/system` | `{ title, message, type }` | `{ success }` |
| 14 | `POST /dashboard/notifications/cleanup` | — | `{ success, deleted? }` |
| 15 | `DELETE /dashboard/notifications/batch-delete` | `{ ids: string[] }` | `{ success, deleted? }` |
| 16 | `GET /dashboard/notifications/stats` | — | `{ success, data: {...} }` (shape unconstrained by UI) |

### 9.3 Clients — `clientService`, `clientActions`, `clientImportService`, `clientImportActions`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 17 | `GET /clients` | `page,limit,search,sort?,order?,category?,isActive?` (query forwarded verbatim from URL) | `{ success?, data: Client[], pagination:{total,page,limit,pages} }` |
| 18 | `GET /clients/:id` | — | `{ data: Client }` |
| 19 | `POST /clients` | see §9.3.1 | `{ success, data: Client, message? }` |
| 20 | `PUT /clients/:id` | same as create (partial) | `{ success, data }` |
| 21 | `DELETE /clients/:id` | — | `{ success, message }`; **409** if invoices exist |
| 22 | `GET /clients/:id/stats` | — | `{ data: { totalInvoices?, totalSpent?, totalPaid?, totalDue?, lastInvoiceDate?, averageInvoice? } }` |
| 23 | `GET /clients/:id/invoices` | — | `{ data: Invoice[] }` |
| 24 | `GET /clients/:id/balance` | — | `{ balance: number }` (client-side, used by invoice form) |
| 25 | `GET /clients/check-code` | `code, clientId?` | `{ available: boolean, error?: string }` |
| 26 | `GET /clients/check-email` | `email, clientId?` | `{ available: boolean, error?: string }` |
| 27 | `POST /clients/import` | multipart: `file` + `updateExisting` / `skipDuplicates` / `sendNotifications` (`"true"\|"false"`) | `{ success, message, stats:{total,created,updated,skipped,errors}, errors?:[{row,field,value,message}], data?:[] }` |
| 28 | `GET /clients/import/template` | — | XLSX binary + `Content-Disposition: attachment; filename=...` |
| 29 | `POST /clients/import/validate` | multipart `file` | `{ valid, totalRows, validRows, invalidRows, errors:[{row,field,value,message}], preview?:[] }` |
| 30 | `GET /clients/import/history` | `page,limit` | `{ data: [], pagination }` |
| 31 | `POST /clients/import/:importId/cancel` | — | `{ success, message }` |

#### 9.3.1 Canonical client payload (from `clientActions.createClientAction`)

```jsonc
{
  "code": "CLI-001",              // required, unique per tenant
  "name": "ACME SARL",            // required
  "type": "individual|company",
  "email": "…",                   // optional, unique check available
  "phone": "0212233445",          // normalised to 9–10 digits, leading 0
  "mobile": "0555123456",
  "category": "vip|regular|wholesale|retail",
  "taxNumber": "…",
  "commercialRegistration": "…",
  "contactPerson": "…",
  "notes": "…",
  "address": { "street": "…", "city": "…", "state": "…", "country": "Algeria", "postalCode": "…" },
  "isActive": true
}
```

`createdAt`/`updatedAt` are ISO strings (Zod accepts `string | Date`). `balance`, `creditLimit`, `paymentTerms` (`net_30`) exist in the model but are **not** on the create form — they must be server-defaulted.

### 9.4 Client groups — `clientGroupService`, `clientGroupActions`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 32 | `GET /client-groups` | `page,limit,search,sort,order` | **array** of groups (`apiFetch` unwraps `.data` if present): `{ _id, name, description?, color (tailwind class string), clientCount, totalBalance, discount, groupedBilling, createdAt, updatedAt, createdBy, clients[] }` |
| 33 | `GET /client-groups/:id` | — | same single object |
| 34 | `POST /client-groups` | `{ name, description?, color, discount, groupedBilling }` | `{ success, data }` |
| 35 | `PUT /client-groups/:id` | same, partial | `{ success, data }` |
| 36 | `DELETE /client-groups/:id` | — | `{ success, message }` |
| 37 | `GET /client-groups/:id/clients` | — | **array** of `{ _id, name, email?, phone?, balance, type, code }` |
| 38 | `POST /client-groups/:id/clients` | `{ clientIds: string[] }` | `{ success, data }` |
| 39 | `DELETE /client-groups/:id/clients` | `{ clientIds: string[] }` (body on DELETE) | `{ success }` |
| 40 | `GET /client-groups/stats` | — | `{ totalGroups, totalClients, totalBalance, averageClientsPerGroup, largestGroup?:{name,clientCount} }` |
| 41 | `GET /client-groups/check-name` | `name, groupId?` | `{ available, message? }` |

Notes: the service computes pagination **client-side** (`formatted.length`), so a paginated backend response would produce wrong totals unless the array contains the full set or the service is adjusted. `formatGroup` treats `clients` as an array (or `clientCount` fallback).

### 9.5 Client notes — **conflicting contracts** (`clientNoteService` vs `clientNoteActions`)

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 42 | `GET /client-notes` | `page,limit,search,clientId?,category?,isPinned?` | `{ data: Note[], pagination }` |
| 43 | `GET /client-notes/client/:clientId` | — | `{ data: Note[] }` |
| 44 | `GET /client-notes/:id` | — | `{ data: Note }` |
| 45 | `POST /client-notes` | **A (service):** `{ clientId, content, type: 'general'\|'important'\|'reminder'\|'follow-up' }` · **B (action, used by UI):** `{ title, content, clientId, category: 'general'\|'follow-up'\|'important'\|'reminder', isPinned }` | `{ data: Note }` |
| 46 | `PUT /client-notes/:id` | **A:** partial `{content,type}` · **B:** `{ title?, content?, category?, isPinned? }` | `{ data: Note }` |
| 47 | `DELETE /client-notes/:id` | — | `{ success }` |
| 48 | `PATCH /client-notes/:id/pin` | `{ isPinned: boolean }` | `{ data }` |

`app/types/clientNote.ts` defines `title` + `category` + `isPinned` + populated `clientId`/`createdBy`; `clientNoteService` defines `content` + `type` and no `title`. The **UI path (actions)** is the one that matters; the service is partly dead but still used for list/detail. Backend must support `title` + `category` (+ accept legacy `type`).

**P0 defect:** `notes/edit/[id]/page.tsx` calls `clientNoteService.getNoteById(id, token)` — **this method does not exist** (only `getAllNotes`, `getNotesByClient`, `createNote`, `updateNote`, `deleteNote`). The route throws at runtime.

### 9.6 Products, categories, taxes — `products.Service`, `productsAction`, `categoryActions`, `taxService`, `taxActions`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 49 | `GET /products` | `page,limit,search,categoryId,isActive,sort,order` (query string forwarded) | `{ data: Product[], pagination }` |
| 50 | `GET /products/:id` | — | `{ data: Product }` |
| 51 | `POST /products` | `{ name, code, categoryId, price, stock, minStock, unit: piece\|kg\|meter\|liter\|box\|pack, status: active\|inactive, taxId? }` | any of `{success}`, `{_id}`, `{data:{_id}}` (action accepts all three) |
| 52 | `PUT /products/:id` | same partial | `{ success }` |
| 53 | `PATCH /products/:id/status` | `{ isActive: boolean, status: "active"\|"inactive" }` | `{ success, data }` — **declared but unused** (toggle uses PUT) |
| 54 | `DELETE /products/:id` | — | `{ success }` |
| 55 | `GET /products/stats` | — | `{ data: { summary: { totalProducts, totalStockValue, lowStockCount } } }` |
| 56 | `GET /categories/type/product` | — | `{ data: Category[] }` |
| 57 | `GET /categories/:id` | — | `{ data: Category }` |
| 58 | `POST /categories` | `{ name, description, type:"product", color:"#0891b2", icon:"tag", isActive:true }` | `{ success, data }` |
| 59 | `PUT /categories/:id` | `{ name, description, color }` | `{ success, data }` |
| 60 | `DELETE /categories/:id` | — | `{ success }` |
| 61 | `GET /taxes` | — | `{ data: [{ _id, name, rate }] }` |
| 62 | `POST /taxes` | `{ name, rate }` | `{ success, data }` |
| 63 | `PUT /taxes/:id` | `{ name, rate }` | `{ success, data }` |
| 64 | `DELETE /taxes/:id` | — | `{ success }` |

Product model in `types/products.ts` also carries `description`, `unit`, `stock`, `minStock`, `taxId`, `isActive`; the form sends `status` **and** `isActive` in different code paths → both must be accepted/normalised (IC-09).

### 9.7 Invoices — `invoice.service.ts`, `actions/invoiceActions.ts`, `components/invoices/*`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 65 | `GET /invoices` | `search,status,page,limit,clientId,fromDate,toDate,dueFrom,dueTo,minAmount,maxAmount,sortBy,sortOrder,populate` | `{ success, data: Invoice[], pagination:{page,limit,total,pages}, stats? }` |
| 66 | `GET /invoices/:id` | — | `{ success, data: Invoice }` |
| 67 | `GET /invoices/stats` | `period=day\|week\|month\|year` | `{ data: { summary:{total,paid,due,count}, byStatus:[{_id,amount,count}], topClients?, period? } }` |
| 68 | `GET /invoices/overdue` | `limit` | `{ data: Invoice[] }` |
| 69 | `GET /invoices/client/:clientId` | `status,page` | `{ data: Invoice[] }` |
| 70 | `POST /invoices` | see §9.7.1 | `{ success, data: Invoice, message }` |
| 71 | `PUT /invoices/:id` | same as create | `{ success, data }` |
| 72 | `PATCH /invoices/:id/status` | `{ status: "draft"\|"sent"\|"paid"\|"overdue"\|… }` (lower-cased) | `{ success, data }` |
| 73 | `POST /invoices/:id/duplicate` | — (no body) | `{ success, data }` |
| 74 | `POST /invoices/:id/pay` | `{ amount, method, notes? }` | `{ success, data }` |
| 75 | `POST /invoices/:id/payment` | `{ amount, method, notes? }` | `{ success, data }` — **duplicate of 74, different path** |
| 76 | `POST /invoices/:id/send` | `{ sendEmail: true, message? }` | `{ success, message }` |
| 77 | `GET /invoices/:id/export/pdf` | — | PDF binary |
| 78 | `GET /invoices/:id/pdf` | — | PDF binary — **duplicate of 77** |
| 79 | `GET /invoices/:id/view` | — | **public**, `{ success, data: Invoice }` |
| 80 | `GET /invoices/:id/export/pdf/public` | — | **public** PDF binary |
| 81 | `POST /invoices/:id/pay/public` | `{ amount, method, ... }` | `{ success, ... }` |

#### 9.7.1 Canonical invoice write payload (from `InvoiceForm.handleFormSubmit`)

```jsonc
{
  "invoiceId": "…",                       // only in edit mode
  "clientId": "…",
  "date": "2026-11-09T00:00:00.000Z",     // ISO
  "dueDate": "2026-11-16T00:00:00.000Z",
  "items": [
    { "productId": "…|null", "description": "…", "quantity": 1,
      "unitPrice": 100, "discount": 0, "taxRate": 0 }
  ],
  "discount": 0,          // global, absolute amount (not %)
  "shipping": 0,
  "notes": "",
  "terms": "Paiement à réception",
  "subtotal": 100,        // client-computed
  "total": 100            // client-computed
}
```

Line `discount` is a **percentage** (`itemTotal * discount / 100`), global `discount` is an **absolute amount** (`subtotal - globalDiscount + shipping`). This asymmetry is a data-integrity trap and must be resolved explicitly in Phase 2 (safe default: persist both with explicit names, e.g. `line.discountPercent` vs `invoice.discountAmount`).

Invoice read model consumed in the UI: `_id`, `invoiceNumber` (fallback `number`), `total`/`amount`, `paidAmount`, `balance`/`dueAmount`, `status` (`draft|sent|paid|overdue`), `date`/`issueDate`, `dueDate`, `clientId` **object or string** (`{name,code}`), `clientName`, `items`, `payments`, `notes`, `terms`, `subtotal`, `discount`, `shipping`, `createdAt`, `updatedAt`, `paidDate`.

### 9.8 Payments — `paymentServices`, `paymentActions`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 82 | `GET /payments` | `search,status,method,fromDate,toDate,page,limit` (status may be `"completed,paid"`) | `{ data: Payment[], pagination:{page,limit,total,pages} }` |
| 83 | `GET /payments/:id` | — | `{ data: Payment }` |
| 84 | `POST /payments` | `{ invoiceId, clientId?, amount, method, reference?, notes?, date? }` | `{ success, data, message }` |
| 85 | `PUT /payments/:id` | `{ reference?, notes? }` | `{ success, data }` |
| 86 | `DELETE /payments/:id` | — | `{ success, message }` |
| 87 | `POST /payments/:id/refund` | `{ amount, reason? }` | `{ success, data, message }`, error field `error` |
| 88 | `PATCH /payments/:id/reconcile` | `{ reconciled: true }` | `{ success }` (only `res.ok` checked) |
| 89 | `GET /payments/stats` | `period,offset,groupBy,limit` | `{ data: { summary: [{ total, count, avg }], methods: [], daily: [{_id,total}] } }` |
| 90 | `GET /payments/settings/gateways` | — | `{ data: Gateway[] }` or array; `Gateway = { id\|_id, name, code, isActive, config, logo?, publicKey?, secretKey? }` |
| 91 | `PATCH /payments/settings/gateways/:id/toggle` | `{ status: boolean }` | `{ success, data, message }` |
| 92 | `PUT /payments/settings/gateways/:id` | `{ config }` (arbitrary keys) | `{ success, data }` |
| 93 | `POST /payments/settings/gateways/setup` | `{ code, config, isActive? }` | `{ success, data, message }` |
| 94 | `GET /payments/settings/methods` | — | `{ data: [{ id\|_id, name, code, isActive }] }` |
| 95 | `PATCH /payments/settings/methods/:id/toggle` | `{ isActive }` | `{ success }` |

Payment enums conflict: `types/payment.ts` uses `CREDIT_CARD | BANK_TRANSFER | CASH | CHECK | PAYPAL | WALLET | MOBILE_MONEY` (upper snake) and status `pending|completed|paid|failed|refunded|cancelled`; the payment form sends `method: "Cash"`; reconcile filters `status=completed,paid`. **Backend must normalise case/aliases** (IC-11).

### 9.9 Settings, users, tenants, metrics — `settingsService`, `settingsActions`, `tenantActions`

| # | Method & path | Request/query | Expected response |
|---|---|---|---|
| 96 | `GET /tenant` | — | `{ success, data: Tenant }` |
| 97 | `PUT /tenant` | company settings object (see `updateCompanyAction`) | `{ success, data }` |
| 98 | `POST /tenant/logo` | multipart `file` | `{ success, logo: url }` |
| 99 | `GET /users` | — | `{ data: User[] }` |
| 100 | `POST /users` | `{ name, email, role, ... }` | `{ data: User }` |
| 101 | `PUT /users/change-password` | `{ oldPassword, newPassword }` | `{ success }` |
| 102 | `GET /admin/tenants` | — | `{ success, data: Tenant[] \| { tenants: Tenant[] } }` |
| 103 | `POST /admin/tenants` | `CreateTenantData` (name, subdomain, email, phone?, address?, city?, country?, plan, status?, databaseName?, maxUsers, storageLimit, subscriptionStart?, subscriptionEnd?, settings{theme,language,timezone,currency}) | `{ success, data }` |
| 104 | `GET /admin/tenants/:id` | — | `{ success, data: Tenant }` |
| 105 | `PUT /admin/tenants/:id` | partial tenant | `{ success, data }` |
| 106 | `PUT /admin/tenants/:id/status` | `{ status: "active"\|"inactive"\|"suspended"\|"trial" }` | `{ success, data }` |
| 107 | `DELETE /admin/tenants/:id` | — | `{ success }` |
| 108 | `GET /admin/tenants/:id/users` | — | `{ data: User[] }` |
| 109 | `POST /admin/tenants/:id/users/invite` | `{ email, name, role }` | `{ data: User }` |
| 110 | `PUT /admin/tenants/:id/users/:userId` | partial user (`role`, `status`, …) | `{ success, data }` |
| 111 | `DELETE /admin/tenants/:id/users/:userId` | — | `{ success }` |
| 112 | `PUT /admin/tenants/:id/settings` | arbitrary settings object | `{ success, data }` |
| 113 | `GET /admin/metrics` | — | `{ success, data: { dbSize: string, activeUsers: number, modulesLoaded: number, serverLoad: string, uptime: string } }` |
| 114 | `GET /subscription` | — | `{ data: { plan:{name,code,price,currency,billingCycle,features[]}, status, startDate, endDate, nextBillingDate, paymentMethod:{type,last4,expiryDate}, invoices:[{id,number,date,amount,status}] } }` |
| 115 | `GET /subscription/history` | — | `{ data: [...] }` |

**Tenant model** (`settingsService.Tenant`): `_id, name, subdomain, email, phone?, address?, city?, country?, plan (string), status, databaseName?, maxUsers, storageLimit, storageUsed?, userCount?, daysRemaining?, createdAt, updatedAt, timezone, language, currency, logo?, subscriptionStart?, subscriptionEnd?, settings{theme,language,timezone,currency,dateFormat?,numberFormat?,primaryColor?}, security{twoFactorAuth,sessionTimeout,passwordPolicy,ipWhitelist[],allowedDomains[]}, notifications{emailNotifications,pushNotifications,slackWebhook?,alertOnLogin,weeklyReports}, integrations{stripe,slack,googleDrive,dropbox,zapier}`. **`databaseName` implies database-per-tenant** — a major Phase 2 decision (Q-03).

**User model** (`settingsService.User`): `_id, name, email, role: "admin"|"manager"|"user", status: "active"|"inactive"|"suspended", avatar?, phone?, department?, lastLogin?, createdAt, tenantId?`. Note `types/auth.ts` adds `"viewer"` and a `UserPermissions` matrix — **neither is used** anywhere.

### 9.10 API keys — `actions/apiKeysActions.ts` (pages are still mock)

| # | Method & path | Request | Expected response |
|---|---|---|---|
| 116 | `GET /api-keys` | — | `{ data: ApiKey[] }`, `ApiKey = { id\|_id, name, keyMasked, permissions[], scopes[], lastUsed, expiresAt, isActive, requestsCount, rateLimit, createdAt }` |
| 117 | `POST /api-keys` | `{ name, permissions[], scopes[], expiresInDays, rateLimit, ipWhitelist? }` | `{ data: ApiKey }`, and `data.key`/`newKey` **once** (plaintext) |
| 118 | `GET /api-keys/:id` | — | `{ data: ApiKey }` |
| 119 | `PUT /api-keys/:id` | `{ isActive?, rateLimit? }` | `{ data: ApiKey }` |
| 120 | `DELETE /api-keys/:id` | — | `{ success }` |
| 121 | `POST /api-keys/:id/regenerate` | — | `{ data: { key: "…" } }` |
| 122 | `GET /api-keys/stats` | — | `{ data: {...} }` |

### 9.11 Reports & analytics — `analytics.api.ts`, `api.service.ts`, `analytics.mapper.ts`

| # | Method & path | Query/body | Expected response (mapper contract) |
|---|---|---|---|
| 123 | `GET /reports/sales` | `period=day\|week\|month\|year, startDate, endDate, groupBy=day\|month\|client\|status` | `{ summary:{ total, count, paid, due, avgInvoice }, data:[{ _id: string \| {year,month}, total, count, paid, due }] }` |
| 124 | `GET /reports/payments` | same | `{ summary:{ total, count }, data:[{ _id: method, total, count, monthlyData?:[{year,month,total}] }] }` |
| 125 | `GET /reports/clients` | same + `top` | `{ summary:{ totalClients, activeClients }, data:[{ _id?, client:{_id,name}, totalPurchases, invoiceCount }] }` |
| 126 | `GET /reports/products` | same + `top` | `{ summary:{ totalProducts, lowStock }, data:[{ _id?, product:{_id,name}, totalQuantity, totalRevenue }] }` |
| 127 | `GET /reports/aging` | — | `{ totalOverdue, summary: { current:{amount,invoices[]}, "1-30":{…}, "31-60":{…}, "61-90":{…}, "90+":{…} } }`, each invoice `{ invoice:{_id,dueDate,balance}, client:{name}, daysOverdue }` |
| 128 | `POST /reports/export` | `{ reportType, format: "excel"\|"pdf"\|"csv" }` | `{ downloadUrl }` (then fetched as GET by `analytics.actions`) |
| 129 | `GET /reports/traffic-sources` | `startDate,endDate` | `{ data:[{source,percentage,change,color}], summary:{ total } }` |

### 9.12 Subscription (parallel, canonical) — `subscriptionService.ts`, `actions/subscription.ts`

| # | Method & path | Request | Expected response |
|---|---|---|---|
| 130 | `GET /subscriptions/current` | — | `{ data: { _id, tenantId, planId, planName, status: active\|expired\|cancelled\|pending_payment\|trial, startDate, endDate, billingCycle: monthly\|yearly, autoRenew, paymentMethod, price, limits{users,invoices,storage,clients,products}, features{hasReports,hasApiAccess,hasCustomBranding}, isTrial, trialEndDate?, nextPaymentDate?, daysRemaining, isExpired } }` |
| 131 | `GET /subscriptions/plans` | — | `{ data: [{ _id, name, code, description, price:{monthly,yearly}, currency, features{users,storage,invoices:{monthly},clients,products,hasReports,hasApiAccess,hasCustomBranding}, trialDays, isActive, isPopular, sortOrder }] }` |
| 132 | `GET /subscriptions/invoices` | `limit, page` | `{ data: [{ _id, invoiceNumber, createdAt, amount, currency, status, planName, invoiceUrl }] }` |
| 133 | `GET /subscriptions/payment-method` | — | `{ data: { last4, brand, expMonth, expYear } }` |
| 134 | `PUT /subscriptions/upgrade` | `{ newPlanId }` | `{ data }` |
| 135 | `PUT /subscriptions/downgrade` | `{ newPlanId }` | `{ data }` |
| 136 | `POST /subscriptions/cancel` | `{ cancelAtPeriodEnd, reason? }` | `{ success }` |
| 137 | `GET /subscriptions/limits` | — | `{ data: { currentUsers, usedStorageGB, currentMonthInvoices } }` (mapper also tolerates `users.current`, `storage.usedGB`, `invoices.currentMonth`) |
| 138 | `GET /subscriptions/billing-info` | — | not implemented frontend-side (commented); returns `null` |

### 9.13 Internal routes the frontend calls but the project does not implement

| Called from | URL | Reality |
|---|---|---|
| `components/settings/TenantActions.tsx` | `DELETE /api/admin/tenants/:id` | **404** — no `app/api/**` route exists |
| `dashboard/settings/users/[id]/edit` | `POST /api/settings/users/update` | **404** (form `action=`) |
| `components/invoices/InvoiceBtn.tsx` | `GET /api/proxy/pdf/:invoiceId` | **404** |
| `dashboard/settings/billing/BillingClient.tsx` | `POST /api/subscription/cancel` | commented out |
| `app/dashboard/subscription/page.tsx` | `/api/subscriptions/cancel` | link only |

These are **frontend bugs**, not backend requirements — but they signal that a small BFF layer (`app/api/*`) may be worth adding in Phase 3 rather than exposing the raw API to the browser.

---

## 10. Contract conflicts and incompatible improvements (IC register)

Each item must be resolved before implementation. "Resolution" = the Phase 2 decision proposed now, to be ratified.

| ID | Conflict | Evidence | Impact | Proposed resolution |
|---|---|---|---|---|
| IC-01 | `/client` and `/product` (singular) vs `/clients`, `/products` | `dashboard/invoices/edit/page.tsx` | Invoice edit page loads empty selects | Backend exposes plural only; frontend call fixed in integration |
| IC-02 | PDF: `/invoices/:id/export/pdf` vs `/invoices/:id/pdf`; public variant `/export/pdf/public` | `invoice.service.ts` vs `invoiceActions.downloadPdfAction`; `InvoiceDownloadBtn` | PDF button 404 depending on path | One canonical `GET /invoices/:id/pdf` (+ `?public=1` or token-scoped public route); frontend aligned |
| IC-03 | "Mark invoice paid": `POST /invoices/:id/pay` vs `POST /invoices/:id/payment` vs `PATCH /invoices/:id/status` | `invoiceActions`, `invoice.service`, invoices detail page | Three ways to write the same state; inconsistent side-effects (payment record? balance?) | Keep `POST /invoices/:id/payments` as the **only** way to record money; `PATCH /status` only for non-financial transitions; frontend aligned |
| IC-04 | `/subscription` (settingsService) vs `/subscriptions/*` (subscriptionService) | both services | Billing page and Subscription page describe different worlds (one mocked) | `/api/v1/subscription` (singular, current tenant) + `/api/v1/subscription/plans\|invoices\|usage\|cancel\|change-plan`; migrations map legacy paths |
| IC-05 | Invoice read model `_id` vs `id`; `invoiceNumber` vs `number`; `total` vs `amount`; `balance` vs `dueAmount` | normalisers, action payloads, pages | Silent zero-values when one variant missing | Persist canonical + return aliases? **No** — return canonical only and fix frontend with adapters (avoid permanent alias debt) |
| IC-06 | Client note payload `title/category/isPinned` vs `content/type` | `clientNoteActions` vs `clientNoteService` | Notes created via service would drop `title`, fail validation | Canonical `{title, content, category, isPinned}`; keep `type` as deprecated alias |
| IC-07 | Missing method `clientNoteService.getNoteById` | `notes/edit/[id]/page.tsx` | Page crashes | Frontend fix (use action `getClientNoteByIdAction`) |
| IC-08 | Client groups list expects a bare array; client list expects `{data, pagination}` | `clientGroupService` vs `clientService` | Inconsistent envelope | Backend returns `{data, pagination}` everywhere; frontend `clientGroupService` adjusted in integration |
| IC-09 | Product status: form sends `status: "active"`, toggle sends `{isActive}`, service has `PATCH /status` unused | `productsAction`, `products.Service`, `forms` | Divergent state, possible `isActive`/`status` divergence | Single field `isActive: boolean` persisted; accept `status` as input alias mapped server-side; deprecate |
| IC-10 | Invoice status strings: UI expects `draft\|sent\|paid\|overdue`; `status=recurring`/`drafts` used as filters in the sidebar | `Sidebar`, invoices page | Filters `recurring`/`drafts` have no model | Keep 4 statuses + `recurring` as a **separate boolean/plan**, and `drafts` filter mapped to `status=draft` (frontend fix) |
| IC-11 | Payment method casing/aliases (`Cash` vs `CASH`, `Virement bancaire` vs `BANK_TRANSFER`) and list-status filter `completed,paid` | `payment/new`, `types/payment.ts`, `reconcile` | Filters return nothing; method analytics fragment | Enum `PaymentMethod` + `PaymentStatus`; accept aliases; support comma-separated `status` (documented) |
| IC-12 | `GET /payments/stats` shape: `summary` as **array** (`summary[0]`) vs object in `settings/payment` (`summary.totalAmount`) | `payment/page.tsx`, `settings/payment/page.tsx`, `payment/reports` | One of the two pages always shows zeros | `summary` as **object** `{total,count,avg,successRate,averageAmount}`; frontend payment/page fixed |
| IC-13 | Analytics sales report: `summary.total` vs `totalSales` in mapper interface; `salesData` vs `data` | `analytics.mapper` returns `{totalSales,totalInvoices,averageInvoice,data}` but `useAnalyticsData` reads `salesReport.summary.total`, `salesReport.salesData` | Analytics "Chiffre d'affaires" is always 0 on that path | Canonical `{summary:{total,count,paid,due,avgInvoice}, data:[…]}`; mapper/consumer aligned |
| IC-14 | `clientGroupService.getAllGroups` computes pagination in memory; `getTopGroups` fetches `limit=100` then sorts | service | Wrong totals when >100 groups | Paginated endpoint; frontend stops re-paginating |
| IC-15 | Tenants status: backend `isActive` boolean vs UI `status: active/inactive/suspended/trial` | `getAllTenants` maps `isActive → status` | Suspended tenants collapse to "inactive" | Persist `status` enum; keep `isActive` as derived read alias for backwards compatibility |
| IC-16 | Tenant "plan" is a string in `Tenant` but an object (`{name, code}`) in list payload | `getAllTenants` mapping | `[object Object]` rendering risk | Persist `planId` + return `plan: {id, name, code}`; frontend uses `plan.name` |
| IC-17 | Admin vs tenant-scoped endpoints mixed (`/admin/tenants`, `/tenant`, `/users`) with no role gate | settings services | Any authenticated user can list all tenants/users | Backend enforces `superadmin` role; frontend hides nav |
| IC-18 | Subscription plan model has two shapes: `types/subscription.ts` (`price:number, period, popular, color…`) vs `subscriptionService.Plan` (`price:{monthly,yearly}, features{…}, sortOrder`) | both | Plan cards read fields that may not exist | Canonical = `subscriptionService.Plan`; UI styling fields (`color`, `popular`) become frontend constants |
| IC-19 | Invoice list `populate` accepts `client,items,payments` as CSV, ignored by most calls | `invoice.service` | Unclear whether client is embedded | Always embed `client: {_id, name, code}` summary in list responses (projection), full items only on detail |
| IC-20 | Client `balance` written only by backend (not on create), but displayed as authoritative; invoices/payments must update it | client model, invoice payment flows | Divergence between `balance` and invoice `dueAmount` sums | Treat `client.balance` as a **derived projection** maintained transactionally (Phase 2 §data integrity) |
| IC-21 | `checkSubscription()` in `clients/new` is a constant `true` | page | No real gate | Backend enforces; frontend displays 403 |
| IC-22 | Notifications: `GET /dashboard/notifications` used both by nav bell and page; stats/batch-delete endpoints have no UI consumer | actions | Dead endpoints (still build them? no) | Implement list/mark/delete/cleanup only; `system` broadcast for admin; skip `stats` unless needed |
| IC-23 | `GET /invoices/overdue` vs filtering `status=overdue` | action vs page | Two sources of truth for overdue | Derive `overdue` from `dueDate < now && dueAmount > 0` (computed status), expose `status=overdue` filter; keep `/overdue` as alias for the dashboard widget |
| IC-24 | Tax rate model: tax has `rate`; invoice items send `taxRate: 0` always; products carry `taxId` | `InvoiceForm`, product form | No tax computation in invoices despite tax module existing | Phase 2 decides VAT application point (line-level, snapshot on invoice) |
| IC-25 | Clients import sends booleans as strings; validates via a preview endpoint; template endpoint assumed binary | `clientImportService` | Multipart parsing contract | Accept string/boolean, `Content-Disposition` filename, JSON everywhere else |

---

## 11. Data types and validation

### 11.1 Type inventory

| File | Lines | Content | Used by |
|---|---|---|---|
| `app/types/client.ts` | 95 | Zod `ClientSchema`, `CreateClientSchema`, `UpdateClientSchema`, `ClientStatsSchema`, `ClientFullDetails` | `clientService`, clients pages, import |
| `app/types/clientGroup.types.ts` | 263 | `ClientGroupSchema`, `ClientStats`, query params, `GroupClient` | `clientGroupService`, group pages |
| `app/types/clientNote.ts` | 50 | `ClientNoteSchema` (`title`, `category`, `isPinned`, populated refs) | notes pages (partially) |
| `app/types/dashboard.ts` | 217 | Tolerant Zod schemas (`safeNumber`, `safeArray`, `.passthrough()`), `DashboardData`, `QuickStats`, `InvoiceTableItem`, `Product`, `Payment` | dashboard, mappers |
| `app/types/payment.ts` | 113 | `Payment`, `PaymentStatus`, `PaymentMethod` (UPPER_SNAKE), `Gateway`, `GatewayConfig`, `ConfigField` | payments UI, gateways |
| `app/types/subscription.ts` | 54 | `Subscription`, `Plan` (styling-heavy), `Invoice`, `PaymentMethod`, `BillingInfo` | **duplicates** `subscriptionService.ts` interfaces |
| `app/types/auth.ts` | 40 | `User` (incl. `viewer`), `UserPermissions` matrix, `LoginResponse`, `Session` | **unused** |
| `app/types/products.ts` | 22 | `Product` | products UI |
| `app/types/user.ts` | 22 | `User` | settings UI |
| `app/types/reports.ts` | 70 | `SummaryStat`, `MethodStat`, `DailyStat`, `StatsResponse`, `ExportOptions` | reports |

### 11.2 Model duplication (a real risk for backend alignment)

| Entity | Definitions | Divergence |
|---|---|---|
| User | `types/auth.ts`, `types/user.ts`, `settingsService.User`, `lib/zod-schemas.UserSchema`, dashboard `UserSchema` | role sets differ (`viewer` vs 3 roles), `status` optional vs required, `permissions` only in `auth.ts` |
| Client | `types/client.ts` (Zod), `lib/zod-schemas.clientSchema` (form), dashboard `ClientSchema` (loose) | `clientSchema` requires `type` enum, `category` default; `ClientSchema` requires `code`, `balance`, `paymentTerms`, `creditLimit` |
| Invoice | `services/invoice.service.ts` inline `InvoiceFilters`/`Invoice`, `actions/invoiceActions.ts` inline filters, `types/dashboard.InvoiceSchema`, `zod-schemas.InvoiceSchema` (form), page-local `interface Invoice` | status enum, field names, totals |
| Payment | `types/payment.ts`, `paymentServices` inline types, `types/dashboard.PaymentSchema` | method casing, `summary` shape |
| Plan / Subscription | `types/subscription.ts` vs `subscriptionService.ts` vs `settings/billing` fake object | price shape (`number` vs `{monthly,yearly}`), status enum |
| ApiKey | `types/apiKeysTypes.ts`, `settings/api/page.tsx` inline, `settings/api/[id]` inline | `keyMasked` vs `key`/`lastDigits`, `status` vs `isActive` |

**Implication:** the backend should define **one canonical schema per entity** and the frontend must be refactored to consume generated types (Phase 3). During integration, adapters (mappers) on the frontend are cheaper and safer than aliasing fields on the API forever.

### 11.3 Zod usage

- Schemas live in three places: `app/lib/zod-schemas.ts` (form validation: register/login/client/product/invoice/tenant), `app/types/*` (domain schemas), and inline in actions (`apiKeysActions`, `clientImportService`).
- Zod **v4.6.7** is installed. `error.flatten().fieldErrors` is used in `loginAction`, `registerAction`, `apiKeysActions`; `.format()` in `dashboard.mapper` (dev warnings). Both are deprecated in v4 — verify at build time; the safest path is `z.treeifyError`.
- Parsing is **tolerant** in read paths (`safeParse` + fallback to raw data) and **strict** in write paths. This is the right direction (never crash a page), but it hides contract drift: e.g. `ClientSchema.parse` failing silently returns the raw object.
- Cross-field validation is minimal: invoice `dueDate > date` is client-only; line totals, tax, global discount vs line discount, stock availability, credit limit and payment ≤ balance are **not** validated anywhere.

### 11.4 Semantic gaps the backend must close

| Concern | Current state | Required decision |
|---|---|---|
| Money | `number` floats everywhere; `toFixed(2)` only in UI; DA and EUR both | Integer minor units + `currency` per tenant (Phase 2) |
| Rounding | client `Math.round` for rates; `Number(x.toFixed(2))` | Server-authoritative rounding (half-up), documented |
| Tax | `taxRate: 0` hardcoded in invoice items; `Tax` model exists; product has `taxId` | Snapshot tax rate per line at issuance |
| Dates | ISO strings; `date` vs `issueDate`; timezone from tenant unused | Store UTC, render in tenant TZ |
| IDs | `_id` (Mongo style) and `id` both consumed | Return `id` (string) **and** `_id` alias initially, or refactor frontend |
| Enums | mixed case for payment methods, invoice statuses, plans | Canonical enums + input aliases |
| Soft delete | none; archives UI expects it | `deletedAt` + archive/restore endpoints (deferred?) |
| Tenancy | `tenantId` on every doc, but also `databaseName` on Tenant | Shared schema + `tenantId` (recommended) vs DB-per-tenant |
| Numbering | `settings.invoice.prefix` + `nextNumber` in tenant settings; `invoiceNumber` displayed | Atomic per-tenant sequence (Phase 2 algorithm) |
| Attachments | logo only; "documents" archive is fake | Object storage abstraction |
| Audit | none, though notifications mention system events | Append-only audit log (Phase 2) |

---

## 12. Authentication, session and tenancy

### 12.1 Login flow (as implemented)

1. `components/auth/LoginForm.tsx` → `loginAction(prevState, formData)`.
2. `loginSchema.safeParse({email,password})`; on failure returns `{ success:false, errors, message }` (message in Arabic).
3. `apiService.login` → `POST /auth/login` with JSON.
4. On success (`result.token`), sets cookies:

| Cookie | httpOnly | Contents | Lifetime | Set by |
|---|---|---|---|---|
| `token` | ✅ | raw JWT | 7 d | login + register |
| `tenantId` | ❌ | `result.tenant.id` | 7 d | login only |
| `user_name` | ❌ | `result.user.name` | 7 d | login only |
| `user` | ❌ | JSON `result.user` | 7 d | register only |
| `tenant` | ❌ | JSON `result.tenant` | 7 d | register only |

5. `loginAction` returns `{ success: true }` and `LoginForm` navigates with `router.push('/dashboard')` + `router.refresh()` inside a `useEffect`. `redirect()` is imported in `loginAction` but **never called**, so the action itself never redirects.
6. `registerAction` behaves the same; `RegisterForm` waits a hard-coded 2 s (`setTimeout(..., 2000)`) before pushing `/dashboard` (see D-23).

### 12.2 Session verification

- **Edge**: `proxy.ts` — only checks cookie presence; no signature validation, no expiry check, no role check. Auth pages are reachable when `token` exists (returns `next()` with a comment "Or redirect to /dashboard if you prefer").
- **Layout**: `app/dashboard/layout.tsx` calls `GET /users/profile/me`; on failure → `redirect('/login')`. This is the only real session validation, and it happens **after** the proxy, once per navigation, and only for `/dashboard/*`.
- **Downgrade risk**: `normalizeUserProfile` returns raw data if Zod fails, so a malformed profile still authenticates.
- **No token refresh.** A 7-day JWT means: (a) long-lived bearer tokens, (b) no revocation, (c) a user whose subscription/role changes keeps stale access until expiry. `/users/profile/me` is the only revalidation point.

### 12.3 Token propagation to the browser (P0 security finding)

The token is passed as a prop to Client Components in ~30 places, e.g.:

- `app/dashboard/layout.tsx`: `user = { ...userProfile, token }` → `<Sidebar user={user} />`, `<Navbar user={user} />` (both `"use client"`), and `NavbarProps.token?: string`.
- `analytics/page.tsx` → `AnalyticsDashboardClient token={token}`.
- `payment/gateways/page.tsx`, `payment/methods/page.tsx`, `payment/[id]/page.tsx`, `settings/{company,billing,payment,tenants,users}`, `products/{page,new,[id],edit/[id],inventory,tax-rates}`, `invoices/{page,[id],new,edit}`, `notifications/page.tsx`, `payment/reconcile`.
- `notifications/page.tsx` renders **three** `<input type="hidden" name="token" value={token}>` inside server-action forms.
- Server Actions that accept a token argument: `markAllAsReadAction(token)`, `deleteAllNotificationsAction(token)`, `cleanupNotificationsAction(token)`, `markAsReadAction(id, token)`, `toggleGatewayAction(id, status, token)`, `createTaxAction` (`formData.token`), `createPaymentAction` (`formData.token`), `updatePaymentAction` (`formData.token`).

**Consequences:** any XSS, browser extension, or shared device yields a full 7-day API token; the httpOnly flag provides no protection; tokens appear in RSC payloads and HTML source.

**Backend-side mitigation (must be designed in Phase 2):** bind tokens to `tenantId` + `userId`, keep TTL short (≤ 60 min) with refresh rotation, support server-side revocation, and rate-limit. **Frontend fix (Phase 3):** remove `token` props, route all client mutations through Server Actions or an internal BFF (`/api/*` Route Handlers) that reads the httpOnly cookie.

### 12.4 Subscription gate

Contract: `403` + `{ error_code: "SUBSCRIPTION_EXPIRED", message, data: { expiredSince, daysOverdue } }`.
Detected in: `clientService.apiFetch` (403 + code), `clientActions` (several), `clientNoteService` (**any** 403), `products/new` (`checkSubscriptionExpired`), `new client page` (constant true), `settingsActions.toggleTenantStatus` (expected `error_code` on `settingsService` response — note `settingsService` never returns `error_code`, so that branch is dead).

Rendering: `app/components/SubscriptionExpired.tsx` shows renewal CTA linking `/subscription/renew`, `contact-support`.

Not covered: invoices, payments, products list, settings, reports. So subscription enforcement is **partial at the API level and inconsistent in the UI**.

### 12.5 Multi-tenancy

- `tenantId` is on every entity and every auth response, but the frontend **never sends it**; tenancy must be derived from the JWT server-side.
- `dashboard/tenant/page.tsx` and `settings/company` both target the current tenant (`/tenant/profile` vs `/tenant`), duplicating the concept.
- Admin screens (`/admin/tenants*`) manage *other* tenants from the same UI — meaning the same app serves both tenant users and platform super-admins, with **no role gate**.
- `Tenant.databaseName` suggests database-per-tenant. The backend design must choose; the frontend does not care either way.
- There is no tenant switcher, no "act as tenant", no `X-Tenant-Id` header.

---

## 13. Role-based access control

| Aspect | Finding |
|---|---|
| Role vocabulary | `admin`, `manager`, `user` (settings), plus `viewer` in `types/auth.ts`; `UserPermissions` matrix (8 booleans) defined and unused |
| Enforcement server-side | **None.** No `role` check in `proxy.ts`, `dashboard/layout.tsx`, any page, or any Server Action |
| Enforcement client-side | **None.** Sidebar renders every module for every role; only badges/labels differ |
| Sensitive routes reachable by any authenticated user | `/dashboard/settings/tenants` (list/create/delete tenants), `/dashboard/settings/users` (create users, assign roles), `/dashboard/settings/api` (API keys), `/dashboard/settings/security`, `/dashboard/hr/*`, `/dashboard/settings/billing` |
| Route-level metadata | none (`export const metadata` only) |
| Ownership checks | none in the frontend (e.g. invoice detail by id, client detail by id) → **IDOR risk** entirely dependent on backend |
| Plan-based features | `subscriptionService.Plan.features.hasApiAccess`, `hasCustomBranding`, `hasReports` exist but are never checked in the UI |

**Conclusion:** the backend is the *only* possible authorization boundary. Phase 2 must define a permission model (at minimum `superadmin`, `tenant_admin`, `manager`, `user` + per-resource scopes) and the frontend must later consume a `/me/permissions` payload (new endpoint, flagged Q-06).

---

## 14. Defect register

Severity: **P0** = broken/unsafe in production · **P1** = wrong behaviour or contract mismatch · **P2** = quality/consistency · **P3** = hygiene.

### P0 — must be fixed before/at integration

| ID | File(s) | Symptom | Impact |
|---|---|---|---|
| D-01 | `dashboard/clients/notes/edit/[id]/page.tsx` | calls `clientNoteService.getNoteById` which **does not exist** | Route throws `TypeError`; note editing unusable |
| D-02 | `dashboard/payment/new/page.tsx` | token read from `document.cookie` while cookie is `httpOnly` → `""` | Payment creation is always unauthenticated (401) |
| D-03 | `components/settings/TenantActions.tsx`, `settings/users/[id]/edit/page.tsx`, `components/invoices/InvoiceBtn.tsx` | calls internal routes that do not exist (`/api/admin/tenants/:id`, `/api/settings/users/update`, `/api/proxy/pdf/:id`) | Tenant deletion, user update, invoice PDF all fail |
| D-04 | `dashboard/tenant/page.tsx` | `process.env.API_URL` (undefined) | Page fetches `undefined/tenant/profile` |
| D-05 | `dashboard/invoices/edit/page.tsx` | fetches `/client` and `/product` (singular) | Empty client/product selects on edit |
| D-06 | ~30 call sites + `dashboard/layout.tsx` | JWT passed to Client Components and hidden form inputs | httpOnly protection void; token leakage |
| D-07 | entire app | no RBAC anywhere | Any user can manage tenants/users/API keys if backend is permissive |

### P1 — contract/behaviour mismatches

| ID | File(s) | Symptom |
|---|---|---|
| D-08 | `actions/settingsActions.ts` | `updateTenantStatus(tenantId, newStatus, token)` vs signature `(token, tenantId, status)` → wrong request/headers |
| D-09 | `dashboard/payment/new/page.tsx` | payload `{clientId, invoiceId, amount, method:"Cash", notes, date}` while `createPaymentAction` expects `invoiceId` and `paymentServices.createPayment` types differ; client list is empty |
| D-10 | `dashboard/invoices/new/page.tsx`, `paymentServices.getAllForExport` | `limit=1000` requests; no cap |
| D-11 | `settingsService.getBilling` / `getSystemMetrics` | Fabricated data on error/HTML response, reported as `success: true` |
| D-12 | `hooks/useAnalyticsData.ts`, `dashboard/analytics/*` | Hardcoded `change: 12.5`, `Math.random()` growth, "32 jours", "94 %" |
| D-13 | whole app | `sonner` and `react-hot-toast` both used; inconsistent UX |
| D-14 | `actions/logout.ts` | Deletes `token`,`user`,`tenant` but leaves `tenantId`,`user_name` |
| D-15 | `services/clientNoteService.ts` | Any 403 becomes `SUBSCRIPTION_EXPIRED` → wrong screen |
| D-16 | `dashboard/settings/api/page.tsx` | Mock keys with realistic secrets displayed and copyable |
| D-17 | `components/layout/Sidebar.tsx` | Filters `status=recurring` and `status=drafts` do not exist in the model (`draft` singular) |
| D-18 | `dashboard/payment/page.tsx` | Reads `stats.summary[0]` while `settings/payment` expects `summary.totalAmount`; one is always zero |
| D-19 | `services/settingsService.changePassword` | Signature `(token, data)`; commented caller uses `(data, token)` — latent trap |
| D-20 | `loginAction` vs `registerAction` | Session cookies differ (`tenantId`+`user_name` vs `user`+`tenant`); nothing consumes them consistently |
| D-21 | `next.config.ts` | `ignoreBuildErrors: true` → type drift undetected (e.g. D-01 would have failed the build) |
| D-22 | `app/dashboard/error.tsx` only | No module-level error boundaries; one client crash blanks the whole dashboard shell |

### P2 — quality/UX

| ID | Finding |
|---|---|
| D-23 | Both auth actions return state instead of redirecting (unused `redirect` import), and `RegisterForm` inserts a hard-coded 2 s `setTimeout` before `router.push('/dashboard')`; the success path briefly re-renders the form and any `state` reset flashes the page |
| D-24 | Mixed FR/AR copy in the same screen; Arabic messages shown to French users |
| D-25 | `dir="ltr"` hardcoded; no RTL support despite Arabic content |
| D-26 | Currency confusion: `formatDA`/DA vs `EUR` in subscription/billing; country defaults `France` vs `Algérie`; postal code `16000` vs 5-digit FR regex |
| D-27 | 39 static routes presented as working features (HR, archives, reports, support, services, analytics sub-pages, API keys) |
| D-28 | Branding: "Valora" (metadata/sidebar/login) vs "Velora" (most UI); typo `text-wihte`, invalid class `text-black-400` |
| D-29 | `console.log` of full payloads/PII in actions (`registerAction`, `clientActions`, `clientImportService`, `invoiceActions`) |
| D-30 | No skeleton on many data pages; only 12 `loading.tsx`, all clients/invoices |
| D-31 | Group list paginates in memory; `getTopGroups` sorts client-side (O(n log n) over 100) |
| D-32 | `AddClientsModal` / `InvoiceForm` client-side fetches bypass the service layer and error handling |
| D-33 | Duplicate/incompatible `apiFetch` and `ApiError` (2 files, 5 private copies) |
| D-34 | Unused dependencies (`socket.io-client`, `next-intl`, `@tanstack/react-query`, `axios`, `js-cookie`, `next-client-cookies`, fontawesome) |
| D-35 | Dead files: `i18n/request.ts` (middleware copy), `app/services/api.service.ts`, `app/types/auth.ts`, landing stubs |
| D-36 | Two delete UX patterns: `window.confirm` (TenantActions, GatewaysManager) vs custom modal |
| D-37 | Date input handling `new Date(x).toISOString().split("T")[0]` → timezone off-by-one near midnight |
| D-38 | Invoice `discount` semantics differ between line (%) and global (amount) — see IC / §9.7.1 |
| D-39 | No empty/zero-state distinction between "no data" and "API failure" (silent defaults) |
| D-40 | Sidebar uses a Server Action (`toggleCategoryAction`) for pure UI accordion state — round-trip per click, and `useEffect` fires it on every navigation |
| D-41 | Analytics client receives the token and refreshes all five reports in the browser on range change (5 parallel requests) |
| D-42 | `settings/api` shows `status: "active"` even for expired keys; `expiresAt` in the past (`2024-07-05`) presented as active |
| D-43 | Accessibility: icon-only buttons without `aria-label`, no focus management in modals, color-only status |
| D-44 | No `not-found.tsx`, no `robots`/`sitemap`, default README |

### P3 — hygiene

- No tests (unit, integration, e2e), no CI config, no lint script wired to CI.
- No `.env.example`; no seed data; no OpenAPI/API docs.
- `package.json` name is `frontend`.
- `.gitignore` fine; no secrets committed (env not present).

---

## 15. Mock and dead-code inventory (feature expectations to defer)

| Module | Files | Nature |
|---|---|---|
| HR | `hr/employees`, `employees/new`, `departments`, `attendance`, `leaves`, `payroll`, `contracts`, `notes` (8) | Hardcoded arrays; full CRUD modals that only mutate local state |
| Archives | 5 routes | Hardcoded archived records; no restore/delete API |
| Services | email, pdf, sms, notifications, file/backup (5) | `setTimeout` simulations, fake logs |
| Support | documentation, technical, contact, changelog (4) | Static content, `recentTickets` array |
| Reports | landing + financial, tax, clients, products, custom (6) | Hardcoded financial figures (124 500 €, 79 300 €) |
| Analytics | kpi, forecast, benchmark, pivot, export (5) | Hardcoded KPIs, fake chart data, benchmark against invented peers |
| Subscription | create, analytics, history (3) | Static plan builder and history (626 lines) |
| Payments | methods (1), reconciliation (1) | Mock methods list, mock reconciliation rows |
| Invoices | templates (1) | Static template gallery |
| Settings | security (1), api keys (3 pages) | Static UI; API-key Server Actions exist but unused |
| Public | checkout, facturation, stock, croissance, inscription (5) | Marketing stubs; checkout button has no handler |
| Dead code | `i18n/request.ts`, `services/api.service.ts`, `hooks/useAnalyticsData.ts` (partially used and misleading), `actions/plans.ts` (`setTimeout` fake), `config/plans.ts` | Not wired |

**Backend scope decision:** none of the 39 static routes generates an endpoint requirement. They must be either (a) explicitly out of scope for the first backend release, or (b) scheduled as separate modules (HR and archival are the two largest). This is Q-01.

---

## 16. Module workflows (what the backend must support end-to-end)

### 16.1 Client lifecycle
List (search/paginate) → detail (profile + stats + invoices) → create (code/email uniqueness, phone normalisation, `country` forced to "Algeria") → edit → delete (blocked if invoices exist, 409) → group membership → notes → bulk import (validate → preview → import → history → cancel).

Notable expectations: `code` and `email` availability checks; `balance` derived from invoices/payments; `creditLimit`/`paymentTerms` present in model but never edited; archive not implemented.

### 16.2 Product/inventory lifecycle
List (filters, pagination) → stats (`totalProducts`, `totalStockValue`, `lowStockCount`) → create (category, price, stock, minStock, unit, tax) → edit → activate/deactivate → delete. Stock is a **mutable number** with no movement ledger; invoice issuance does **not** decrement stock anywhere in the frontend, and no endpoint for stock movements is called. Phase 2 must decide whether invoice issuance adjusts inventory (Q-08).

### 16.3 Invoice lifecycle
Create (client + line items + global discount + shipping) → draft → send (email) → paid (partial or full?) → overdue (derived) → PDF → public share link → public payment.

Frontend ambiguities: partial payments represented by `paidAmount`/`balance`, but no UI for partial amounts on the invoice page (payment screen accepts an amount); status transitions either via `PATCH /status` or via payment endpoints; no credit note/refund path for invoices (only payment refunds).

### 16.4 Payment lifecycle
List/stats → create (client + optional invoice + amount + method + date) → detail → update notes/reference → delete → refund → reconcile (boolean PATCH) → reports (periodic, grouped).

Missing: link between payment creation and invoice balance update is implicit; reconcilation has no batch endpoint; no gateway webhook/redirect flow (gateways are configured only).

### 16.5 Client import
`POST /clients/import/validate` → user reviews `{validRows, invalidRows, errors[], preview[]}` → `POST /clients/import` with flags → `{stats{created,updated,skipped,errors}}` → history page → cancel a queued import by id. This implies **long-running jobs** and a job status model (currently no polling: `cancelImport` exists but nothing lists in-flight imports except history).

### 16.6 Settings & tenancy
Company profile (`GET/PUT /tenant`), logo upload (multipart), users (list/create/update/delete/invite), tenants admin (list/create/detail/status/delete, per-tenant users and settings), security page (static), billing (`GET /subscription` + fake fallback), payment gateways, API keys (actions ready, UI mock).

### 16.7 Subscription
Current plan + usage (`/subscriptions/current`, `/limits`), plans catalogue, invoices list, payment method, change plan (upgrade/downgrade by price comparison computed **client-side**), cancel at period end, history (static page).

### 16.8 Notifications
List with unread count, mark one/all read, delete one/all, cleanup expired, system broadcast (admin), batch delete (no UI), stats (no UI). The bell component fetches unread count client-side.

---

## 17. Non-functional observations

| Area | Observation | Implication |
|---|---|---|
| Rendering | Server Components for lists/details; large Client Components for forms and static modules (up to 824 lines) | Backend latency directly visible in TTFB; N+1 avoided by `Promise.all` but no caching |
| Caching | `cache: "no-store"` on most calls; `next: { revalidate: 300 }` only for invoice stats; `next: { tags }` set but no `revalidateTag` anywhere | Every navigation re-fetches; backend must be fast and rate-limit-tolerant |
| Parallelism | `Promise.all` / `allSettled` used in dashboard, clients detail, analytics, invoices list, products, settings/company | Backend should expose **aggregate endpoints** (dashboard, stats) rather than forcing fan-out |
| Payload size | Lists request full documents (`populate` optional), `limit=1000` in two places | Need projections + hard caps |
| Bundle | Recharts, framer-motion, xlsx, two icon sets (lucide + fontawesome) | Client bundle heavy; not a backend concern but affects perceived performance |
| Security headers | None configured (no CSP/HSTS/X-Frame-Options in `next.config.ts`) | Phase 2/3 must add |
| Secrets | None in repo; API keys page shows fake ones | — |
| Logging | `console.log/error` with payloads in production paths | PII leakage in server logs |
| Observability | No tracing, no metrics, no correlation IDs | Backend must own it |
| Accessibility | Icon buttons without labels, modals without focus trap, `dir="ltr"` | Phase 3 |
| i18n | Dead next-intl setup, mixed FR/AR strings, no RTL | Phase 3; backend should store tenant `language`/`timezone`/`currency` |
| Mobile | Sidebar has a mobile drawer (`MobileSidebar`), responsive classes present | — |
| Tests | none | Backend contract tests should compensate (OpenAPI + contract tests) |

---

## 18. Backend requirements implied by this frontend

### 18.1 Must have (to make the 68 wired routes work)

1. **Auth**: login, register (tenant + admin user provisioning), forgot-password; JWT with `tenantId`/`userId` claims; `/users/profile/me`.
2. **Tenant context**: every entity scoped by `tenantId` derived from the token; `/tenant` read/update; logo upload.
3. **Clients**: CRUD + uniqueness checks + stats + invoices + balance + bulk import (validate/import/history/cancel/template).
4. **Client groups**: CRUD + membership add/remove + stats + name check.
5. **Client notes**: CRUD + pin + by-client listing (with `title`/`category`).
6. **Products**: CRUD + status + stats; categories CRUD; taxes CRUD.
7. **Invoices**: CRUD + filters (dates, amounts, status, client, sort) + stats + status transitions + duplicate + send + PDF + public view/public PDF/public payment + payments recording.
8. **Payments**: CRUD + stats (period/offset/groupBy) + refund + reconcile + gateways + methods.
9. **Dashboard**: aggregated stats + quick stats + notifications.
10. **Settings/admin**: users CRUD, tenants admin CRUD, per-tenant users/settings, metrics, subscription read/history.
11. **Subscription**: current, plans, invoices, payment method, usage, change plan, cancel.
12. **Reports**: sales, payments, clients, products, aging, export, traffic sources.
13. **API keys**: CRUD + regenerate + stats (even if the UI is mock, the actions exist).

### 18.2 Must support (robustness)

- Exact `403 SUBSCRIPTION_EXPIRED` contract; `409` on protected deletes; `401` only for auth.
- JSON for every response (never HTML), including 404/405.
- Pagination `{ total, page, limit, pages }`; `limit` cap + validation.
- Accept both `id`/`_id` in paths; return `_id` (and optionally `id`).
- Idempotent-safe writes where the UI can double-submit (payments, imports).
- Case/alias tolerance for payment methods/statuses and comma-separated status filters.
- Multipart for import/logo; XLSX generation for the template; binary PDFs with `Content-Disposition`.
- CORS for browser-origin calls (or a BFF) — see §8.2.

### 18.3 Should have (planned by Phase 2)

Audit log, soft delete/archive, stock movement ledger, per-tenant invoice numbering, tax snapshots, optimistic locking, refresh tokens + revocation, RBAC + permission payload, file storage, import job queue, rate limiting.

### 18.4 Explicitly out of scope for release 1 (proposed)

HR module (8 routes), archives restore (5), support ticketing (4), email/SMS/backup service consoles (5), advanced analytics screens (5), subscription self-service create/analytics/history (3), invoice template persistence (1), security settings (1). These are the 39 static routes — Q-01.

### 18.5 Acceptance criteria for "frontend compatible"

1. Login → dashboard renders real KPIs with no console errors.
2. Every wired list page paginates server-side and honours its query params.
3. Client CRUD + import round-trip works, including template download and validation preview.
4. Invoice create → detail → PDF → public view → public payment works; totals are server-computed and match the UI.
5. Payment create (after D-02 fix) updates invoice `paidAmount`/`balance`/status and client balance atomically.
6. Subscription-expired tenants get the dedicated screen on clients/notes/products and a consistent 403 elsewhere.
7. Admin screens are inaccessible to non-admin roles (verified at the API level).
8. All 39 static routes remain visually functional (mock) and are labelled as such, or are hidden.

---

## 19. Safe defaults proposed (to be ratified in Phase 2)

| # | Decision | Default |
|---|---|---|
| SD-01 | Envelope | `{ success, data, pagination?, message? }`; errors `{ success:false, error_code, message, errors?:[{field,message}], data? }` |
| SD-02 | IDs | Mongo-style `_id` string as primary in responses + `id` alias during transition |
| SD-03 | Money | integer minor units internally, decimal strings in API? → **recommend integer minor units + `currency` ISO code**, with `amount` as integer and `currency` on tenant |
| SD-04 | Invoice totals | server recomputes; ignores client `subtotal`/`total`; returns computed values |
| SD-05 | Discounts | `lineDiscountPercent` (0-100) and `invoiceDiscountAmount` (absolute) explicit in API; legacy `discount` mapped |
| SD-06 | Statuses | invoice `draft\|sent\|paid\|partially_paid\|overdue\|cancelled` (overdue derived); payment `pending\|completed\|failed\|refunded\|cancelled`; tenant `active\|inactive\|suspended\|trial` |
| SD-07 | Subscription routes | singular `/subscription/*` canonical; legacy plural mapped |
| SD-08 | RBAC | `superadmin`, `tenant_admin`, `manager`, `user`; permission list returned by `/auth/me` |
| SD-09 | Tenancy | shared schema + mandatory `tenantId`; no DB-per-tenant in v1 |
| SD-10 | Static modules | out of scope for v1, endpoints not designed |
| SD-11 | Currency/country | tenant-configurable; default `DZD` + `DZ` for new tenants (matches dashboard), while allowing `EUR`/`FR` |
| SD-12 | Token lifetime | access 15–60 min + refresh rotation (frontend currently assumes 7 d — needs Phase 3 change) |

---

## 20. Open questions (blocking = must be answered before Phase 2 is finalised)

| ID | Question | Blocking? | Default if unanswered |
|---|---|---|---|
| Q-01 | Are the 39 static routes (HR, archives, support, services, advanced analytics, subscription self-service, API-key UI, security) in scope for the first backend release? | ✅ | Out of scope; documented as future modules |
| Q-02 | Which currency/country is authoritative: DZD/Algeria (dashboard, registration) or EUR/France (company settings, subscription)? | ✅ | Per-tenant, default DZD/DZ |
| Q-03 | Multi-tenancy model: shared collections with `tenantId`, or database-per-tenant (`Tenant.databaseName`)? | ✅ | Shared schema + `tenantId` |
| Q-04 | Token strategy: 7-day stateless JWT as the frontend assumes, or short access + refresh rotation? | ✅ | Short access + refresh; frontend updated in Phase 3 |
| Q-05 | Roles/permissions: is `viewer` real? Do manager/user permissions differ? Should tenants/users/API keys be superadmin-only? | ✅ | 4 roles; admin screens superadmin/tenant_admin only |
| Q-06 | Should the backend expose `/auth/me` with permissions (new endpoint, not consumed yet)? | ⬜ | Yes, additive |
| Q-07 | Partial payments: allowed (needs `partially_paid` + allocation model) or single full payment per invoice? | ✅ | Allowed, with payment allocations |
| Q-08 | Does invoice issuance decrement stock and create stock movements? Any purchase/receipt module? | ✅ | Yes: stock movements ledger; outbound on issue, inbound via adjustments (no purchase module in v1) |
| Q-09 | VAT: applied at line level with snapshot? Default rate from tenant `settings.tax.defaultVat` (20) or tax table? | ✅ | Line-level snapshot, default from tax table, fallback tenant default |
| Q-10 | Are client groups' `color` values (Tailwind gradient strings) data or presentation? | ⬜ | Presentation; store a semantic color key |
| Q-11 | Deployment topology: is the Next.js app allowed to call the API server-to-server, and should browser calls be proxied through a BFF? | ✅ | BFF route handlers; API not publicly CORS-exposed |
| Q-12 | File storage for logo/PDF/imports: local disk, S3-compatible, or DB? | ✅ | S3-compatible abstraction |
| Q-13 | Import jobs: synchronous request (as the UI assumes) or queued with polling? | ✅ | Queued job + status endpoint (additive), UI polls later |
| Q-14 | Deletion policy: hard delete everywhere, or soft delete + archive endpoints (archives UI expects them)? | ✅ | Soft delete on business documents; hard delete only for drafts |
| Q-15 | Invoice numbering: per-tenant sequence from `settings.invoice.{prefix,nextNumber}` — atomic strategy? | ✅ | DB sequence per tenant with gap-free transaction |
| Q-16 | Notifications: which events generate them, and is there a websocket/push contract (socket.io is installed but unused)? | ⬜ | In-app only in v1; no realtime |
| Q-17 | Payment gateways: real integrations (Stripe/PayPal/Flutterwave config fields exist) or configuration-only in v1? | ✅ | Configuration + manual payments only in v1 |
| Q-18 | Public invoice portal/payment: should public payment create a real payment record and which methods are allowed? | ✅ | Yes, creates pending payment; only manual methods |
| Q-19 | Branding: Valora or Velora (emails, PDFs, receipts)? | ⬜ | "Velora" in product copy, fix metadata later |
| Q-20 | Language strategy: FR only, AR only, or bilingual with RTL? (mixed strings today) | ✅ | FR default + AR/EN message catalogues ready, RTL in Phase 3 |
| Q-21 | Client `code`: user-supplied or server-generated sequence? | ✅ | User-supplied, unique per tenant, optional server sequence fallback |
| Q-22 | Should `client.balance` be stored (denormalised) or computed on read? | ✅ | Stored projection maintained transactionally + reconciliation job |
| Q-23 | Do we keep legacy `/reports/*` aggregations, or move to `/api/v1/analytics/*`? | ⬜ | Keep `/reports/*` in v1 for compatibility, alias later |
| Q-24 | Should admin metrics (`dbSize`, `serverLoad`, `uptime`) be real infrastructure metrics or application counters? | ⬜ | Application counters only (no fake data) |
| Q-25 | Is there an existing production database with data to migrate (MongoDB implied by `_id`), or greenfield? | ✅ | Greenfield; design for Mongo-compatible IDs |

---

## Appendix A — Endpoint index (distinct paths consumed)

```
AUTH
POST /auth/login
POST /auth/register
POST /auth/forgot-password

DASHBOARD / PROFILE / NOTIFICATIONS
GET  /dashboard/stats
GET  /dashboard/quick-stats
GET  /users/profile/me
GET  /dashboard/notifications
GET  /dashboard/notifications/unread/count
GET  /dashboard/notifications/stats
PUT  /dashboard/notifications/:id/read
PUT  /dashboard/notifications/read-all
POST /dashboard/notifications/system
POST /dashboard/notifications/cleanup
DELETE /dashboard/notifications
DELETE /dashboard/notifications/:id
DELETE /dashboard/notifications/batch-delete

CLIENTS
GET    /clients
POST   /clients
GET    /clients/:id
PUT    /clients/:id
DELETE /clients/:id
GET    /clients/:id/stats
GET    /clients/:id/invoices
GET    /clients/:id/balance
GET    /clients/check-code
GET    /clients/check-email
POST   /clients/import
GET    /clients/import/template
POST   /clients/import/validate
GET    /clients/import/history
POST   /clients/import/:importId/cancel

CLIENT GROUPS
GET    /client-groups
POST   /client-groups
GET    /client-groups/stats
GET    /client-groups/check-name
GET    /client-groups/:id
PUT    /client-groups/:id
DELETE /client-groups/:id
GET    /client-groups/:id/clients
POST   /client-groups/:id/clients
DELETE /client-groups/:id/clients

CLIENT NOTES
GET    /client-notes
POST   /client-notes
GET    /client-notes/:id
PUT    /client-notes/:id
DELETE /client-notes/:id
PATCH  /client-notes/:id/pin
GET    /client-notes/client/:clientId

PRODUCTS / CATEGORIES / TAXES
GET    /products
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id
PATCH  /products/:id/status            (declared, unused)
GET    /products/stats
GET    /categories/type/product
GET    /categories/:id
POST   /categories
PUT    /categories/:id
DELETE /categories/:id
GET    /taxes
POST   /taxes
PUT    /taxes/:id
DELETE /taxes/:id

INVOICES
GET    /invoices
POST   /invoices
GET    /invoices/:id
PUT    /invoices/:id
DELETE /invoices/:id
GET    /invoices/stats
GET    /invoices/overdue
GET    /invoices/client/:clientId
PATCH  /invoices/:id/status
POST   /invoices/:id/duplicate
POST   /invoices/:id/pay               (action path)
POST   /invoices/:id/payment           (service path)
POST   /invoices/:id/send
GET    /invoices/:id/pdf               (action path)
GET    /invoices/:id/export/pdf        (service path)
GET    /invoices/:id/view              (public)
GET    /invoices/:id/export/pdf/public (public)
POST   /invoices/:id/pay/public        (public)

PAYMENTS
GET    /payments
POST   /payments
GET    /payments/:id
PUT    /payments/:id
DELETE /payments/:id
POST   /payments/:id/refund
PATCH  /payments/:id/reconcile
GET    /payments/stats
GET    /payments/settings/gateways
PATCH  /payments/settings/gateways/:id/toggle
PUT    /payments/settings/gateways/:id
POST   /payments/settings/gateways/setup
GET    /payments/settings/methods
PATCH  /payments/settings/methods/:id/toggle

TENANT / USERS / ADMIN
GET    /tenant
PUT    /tenant
POST   /tenant/logo
GET    /tenant/profile                 (legacy, broken env var)
GET    /users
POST   /users
PUT    /users/change-password
GET    /admin/tenants
POST   /admin/tenants
GET    /admin/tenants/:id
PUT    /admin/tenants/:id
DELETE /admin/tenants/:id
PUT    /admin/tenants/:id/status
GET    /admin/tenants/:id/users
POST   /admin/tenants/:id/users/invite
PUT    /admin/tenants/:id/users/:userId
DELETE /admin/tenants/:id/users/:userId
PUT    /admin/tenants/:id/settings
GET    /admin/metrics

SUBSCRIPTION
GET    /subscription                   (legacy/billing page)
GET    /subscription/history           (legacy)
GET    /subscriptions/current
GET    /subscriptions/plans
GET    /subscriptions/invoices
GET    /subscriptions/payment-method
GET    /subscriptions/limits
PUT    /subscriptions/upgrade
PUT    /subscriptions/downgrade
POST   /subscriptions/cancel

REPORTS
GET    /reports/sales
GET    /reports/payments
GET    /reports/clients
GET    /reports/products
GET    /reports/aging
POST   /reports/export
GET    /reports/traffic-sources

API KEYS
GET    /api-keys
POST   /api-keys
GET    /api-keys/:id
PUT    /api-keys/:id
DELETE /api-keys/:id
POST   /api-keys/:id/regenerate
GET    /api-keys/stats
```

Total distinct consumed paths: **~120** (including duplicates/aliases to collapse → target ≈ 100 in a clean `/api/v1`).

## Appendix B — Key evidence files

- Auth/session: `proxy.ts`, `app/actions/loginAction.ts`, `app/actions/registerAction.ts`, `app/actions/logout.ts`, `app/dashboard/layout.tsx`, `app/services/api.ts`, `app/lib/zod-schemas.ts`.
- HTTP layer: `app/lib/apiFetch.ts`, `app/lib/ApiError.ts`, `app/services/clientService.ts`, `app/services/clientNoteService.ts`, `app/services/settingsService.ts`, `app/services/api.service.ts`.
- Contracts: `app/services/invoice.service.ts`, `app/actions/invoiceActions.ts`, `app/services/paymentServices.ts`, `app/services/products.Service.ts`, `app/services/taxService.ts`, `app/services/clientGroupService.ts`, `app/services/clientImportService.ts`, `app/services/subscriptionService.ts`, `app/services/notification.service.ts`, `app/services/dashboard/dashboard.api.ts`, `app/services/analytics/analytics.api.ts`.
- Normalisers/validation: `app/services/dashboard/dashboard.mapper.ts`, `app/services/analytics/analytics.mapper.ts`, `app/types/*.ts`, `app/actions/apiKeysActions.ts`.
- UI contracts: `app/components/invoices/InvoiceForm.tsx`, `app/components/Client/ClientForm.tsx`, `app/dashboard/payment/new/page.tsx`, `app/dashboard/invoices/page.tsx`, `app/dashboard/payment/page.tsx`, `app/dashboard/clients/page.tsx`, `app/dashboard/settings/*`.
- Config: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `proxy.ts`.

---

*End of Phase 1 audit. Phase 2 (`docs/02-architecture.md`) consumes §9 (contracts), §10 (conflicts), §11 (data semantics), §12–13 (auth/RBAC/tenancy), §18 (requirements) and §20 (open questions).*
