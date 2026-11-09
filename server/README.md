# ERP API — serveur NestJS

Backend du ERP (facturation, clients, catalogue, paiements, tableaux de bord, RH, support, archives).
Conception détaillée : [`../docs/02-architecture.md`](../docs/02-architecture.md) ·
Journal d'implémentation : [`../docs/03-backend-implementation.md`](../docs/03-backend-implementation.md) ·
Contrat OpenAPI : [`../docs/openapi.json`](../docs/openapi.json) (ou `GET /api/openapi.json`).

## Stack

| Sujet | Choix |
| --- | --- |
| Runtime | Node.js 22, TypeScript strict (CommonJS) |
| Framework | NestJS 11 (`@nestjs/platform-express`) |
| Base | PostgreSQL (prod, `pg`) · PGlite embarqué (dev/test, même dialecte) |
| ORM / migrations | Drizzle ORM + drizzle-kit (`drizzle/*.sql`, migrator maison) |
| Validation | Zod 4 (`ZodValidationPipe`) |
| Auth | JWT HS256 (`jose`) + refresh opaque haché SHA-256, rotation par famille |
| Mots de passe | scrypt (N=16384, r=8, p=1) |
| PDF | pdfkit |
| Tests | Vitest + `@nestjs/testing` + supertest |

## Démarrage

```bash
npm install
cp .env.example .env          # optionnel en dev : PGlite est utilisé sans DATABASE_URL
npm run db:seed               # migrations + plans + admin plateforme + tenant démo
npm run dev                   # http://localhost:4000/api  (alias /api/v1)
npm test                      # 19 tests e2e (PGlite isolé par run)
```

Comptes créés par `db:seed` (surchargeables via `SEED_*` dans l'environnement) :

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| superadmin (plateforme) | `admin@erp.local` | `ChangeMe123!` |
| tenant_admin (démo) | `demo@erp.local` | `Demo1234!` |

> **Avant toute mise en production** : changer `JWT_SECRET`, les mots de passe de seed, brancher
> `DATABASE_URL` sur PostgreSQL et exécuter `npm run db:migrate`.

## Scripts

| Script | Effet |
| --- | --- |
| `npm run dev` | serveur avec `@swc-node/register` (métadonnées de décorateurs requises pour Nest) |
| `npm run build` / `npm start` | compilation `tsc` puis exécution de `dist/main.js` |
| `npm run db:generate` | génère une migration Drizzle après modification de `src/db/schema.ts` |
| `npm run db:migrate` | applique les migrations en attente (idempotent) |
| `npm run db:seed` | migrations + données de démonstration (idempotent) |
| `npm run openapi` | régénère `../docs/openapi.json` |
| `npm test` | suite Vitest (PGlite jetable) |

## Conventions d'API

- Base URL : `/api` (configuration frontend) **et** `/api/v1` (contrat documenté) — même routes.
- Succès : `{ "success": true, "data": ..., "pagination"?: ... }`.
- Listes : `data` = tableau, `pagination` = `{ total, page, limit, pages }`.
- Erreurs : `{ "success": false, "error_code": "...", "message": "...", "errors"?: [{ field, message }], "request_id": "..." }`.
- Argent : **unités mineures entières** en base ; l'API expose des montants majeurs (`123.45`) pour coller au frontend.
- Multi-tenant : chaque requête authentifiée porte un `tenant_id` issu du JWT ; toutes les requêtes filtrent dessus.
- Exceptions volontaires au format enveloppe (consommées telles quelles par le frontend) : `POST /auth/login|register`, `GET /clients/check-*`, `GET /client-groups*`, `GET /subscriptions/*`, `GET /payments/settings/*`.

## Structure

```
src/
  config/env.ts            variables d'environnement validées par Zod
  db/                      schema Drizzle, client (PGlite/pg), migrations, seed
  shared/                  erreurs, enveloppe HTTP, filtre d'exceptions, argent, audit,
                           permissions, garde d'authentification, numérotation, sérialiseurs
  modules/
    auth  tenancy(+subscriptions)  users  admin  clients(+import)
    catalog  invoices  payments  dashboard  reports
    client-groups  client-notes  notifications  api-keys
    hr  support  archives  health  docs
  openapi/                 registre Zod → OpenAPI 3.1
  test/                    application de test + suite e2e
```

## Sécurité

- Mots de passe scrypt, politique 8 caractères minimum + lettre + chiffre (compromis de compatibilité avec les formulaires existants).
- Access token 1 h, refresh 30 j haché, rotation + détection de réutilisation (révocation de famille).
- `tokenVersion` incrémenté à chaque changement de mot de passe / désactivation → invalide les JWT en cours.
- RBAC 4 rôles (`superadmin`, `tenant_admin`, `manager`, `user`) + permissions `domaine:action`, appliquées par `AuthGuard`.
- Throttling mémoire sur login / mot de passe oublié, CORS configurable, `request-id` sur chaque réponse.
- Journal d'audit append-only alimenté par les écritures sensibles.

## Limites connues (voir docs/03 §Risques)

- Aucun fournisseur SMTP → `POST /invoices/:id/send` met un événement en file (`outbox_events`) et retourne `delivery: "queued"`.
- Upload de fichiers (logo tenant, pièces jointes) non implémenté : `archives` enregistre des métadonnées + URL.
- Paiements en ligne : tables `payment_gateways` et secrets prêts, aucune intégration PSP.
- Sous-domaines par tenant : non routés, le tenant est porté par le JWT.
