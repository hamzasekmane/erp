# Phase 3 — Implémentation du backend

> Suite directe de [`01-frontend-audit.md`](./01-frontend-audit.md) et [`02-architecture.md`](./02-architecture.md).
> Décisions validées : **tous les modules** au périmètre, **devise par tenant** (DZD par défaut),
> **PostgreSQL mono-schéma partagé** avec `tenant_id` obligatoire.

## 1. Livré dans cette phase

| Domaine | Contenu |
| --- | --- |
| Fondations | env validé (Zod), client PostgreSQL/PGlite, migrations Drizzle, migrator, seed idempotent |
| Schéma | 35+ tables : tenants, users/sessions, plans/abonnements, clients & groupes & notes, catalogue/stock, factures, paiements/allocations/remboursements, notifications, clés API, audit, outbox, RH, support, archives |
| Auth | inscription (crée tenant + admin + abonnement d'essai), login, refresh avec rotation, logout, mot de passe oublié/réinitialisé, `me` |
| RBAC | 4 rôles, matrice de permissions `domaine:action`, garde globale (JWT + `tokenVersion` + statut + tenant) |
| Tenancy | espace courant, préférences, sécurité, abonnement, changement/suspension de formule, `/subscriptions/*` (format frontend) |
| Utilisateurs | CRUD + quotas par formule, profil, changement de mot de passe, reset admin, catalogue de rôles |
| Clients | CRUD, unicité code/email, stats, factures du client, notes, groupes, import CSV (valider/importer/modèle/historique) |
| Catalogue | produits (+statut, stock, historique de mouvements), catégories, taxes, stats de stock |
| Facturation | création/édition, totaux calculés serveur (remise ligne %, remise globale, livraison, TVA), numérotation atomique `FA-AAAA-0001`, machine à états, duplication, envoi (outbox), PDF, vue publique, stats, balance âgée |
| Paiements | encaissement avec allocation, refus du surpaiement, remboursement, rapprochement, stats (méthodes + série quotidienne), moyens/passerelles |
| Pilotage | dashboard (stats, quick-stats, graphiques, dernières factures/paiements, stock bas), rapports ventes/paiements/clients/produits/balance âgée + export CSV |
| Modules complémentaires | notifications (+diffusion, nettoyage), clés API (création/révocation/rotation), admin plateforme (tenants, utilisateurs, métriques), RH (départements, employés, contrats, congés, pointage, paie), support (tickets + messages), archives (documents) |
| Contrat | OpenAPI 3.1 généré depuis Zod (`docs/openapi.json`, 78 chemins), `/api/openapi.json`, `/api/docs` (Redoc) |
| Tests | 19 tests e2e Vitest/supertest (auth, rotation de refresh, isolation tenant, RBAC, facture→paiement→remboursement, validation) |

## 2. Compatibilité avec le frontend

- Les formes de réponse suivent les services existants (`invoiceNumber`, `paidAmount`, `balance`, `clientId` peuplé, `_id` + `id`, montants majeurs).
- Enveloppes `{ success, data, pagination }` sauf endpoints qui consomment le JSON brut (`/auth/login|register`, `check-code`, `/client-groups`, `/subscriptions/*`).
- Alias de routes pour les doublons constatés : `/invoices/:id/pay` **et** `/invoices/:id/payment`, `/users/change-password` **et** `/users/profile/password`, `/invoices/:id/pdf` **et** `/invoices/:id/export/pdf`.
- `NEXT_PUBLIC_API_URL` se termine par `/api` : le serveur expose `/api` **et** `/api/v1` (middleware d'alias).

## 3. Écarts assumés vs architecture (à valider)

| Sujet | Architecture (doc 02) | Implémentation | Raison |
| --- | --- | --- | --- |
| ORM | Prisma | **Drizzle** | fonctionne avec PGlite (dev sans PostgreSQL natif), migrations SQL lisibles |
| Hash mot de passe | Argon2id | **scrypt** | aucune dépendance native à compiler |
| TTL access token | 15 min | **60 min** (configurable) | éviter les déconnexions sans intercepteur de refresh côté frontend |
| Politique mot de passe | 10 caractères | **8 caractères** + lettre + chiffre | les formulaires existants valident 6–8 |
| Versionnage | `/api/v1` uniquement | `/api` + `/api/v1` | compatibilité avec l'URL configurée côté Next.js |

## 4. Risques et points ouverts

1. **Frontend corrompu** : plusieurs littéraux d'URL sont remplacés par `/n` (`clientGroupService`, `apiKeysActions`, `analytics.api`), les fichiers `analytics/*` importent `'.n.api'`. Le backend expose `/client-groups`, `/api-keys`, `/reports/*` ; ces écrans resteront cassés tant que le frontend n'est pas corrigé (cf. audit).
2. **Emails** : aucun SMTP ; envoi de facture = événement outbox. Prévoir un worker.
3. **Uploads** : logo tenant et pièces jointes archives attendent un stockage objet (S3/FS) + `FileInterceptor`.
4. **Paiements en ligne** : tables prêtes, aucune intégration PSP ni chiffrement des secrets (à faire avant activation).
5. **PGlite en dev** : arrêter le serveur avec SIGTERM (déjà géré) ; un kill brutal peut corrompre `.data/pglite` (recréer via `db:seed`).
6. **Superadmin** : authentifié sur un tenant « platform » ; une vraie séparation console plateforme reste à concevoir (MFA, IP allowlist).
7. **Modules RH/Support/Archives** : les pages correspondantes du frontend n'appellent pas encore l'API (données statiques) ; contrats fournis, à raccorder lors de la phase 4.
8. **Pages statiques** (services, support/documentation, analytics) : aucun besoin backend identifié au-delà des rapports déjà exposés.

## 5. Vérifications exécutées

```bash
cd server
npx tsc --noEmit         # 0 erreur
npm test                 # 19/19
npx tsx src/db/seed.ts   # migrations 0000+0001, plans, admin plateforme, tenant démo
curl /api/health         # { status: "ok", database: "ok" }
curl /api/invoices/:id/pdf  # PDF 200 (facture démo)
npm run openapi          # 78 chemins
```

Parcours manuels validés : inscription → login → `me` → client → produit → facture (remise/TVA/livraison) → paiement partiel → refus de surpaiement → remboursement → dashboard/rapports → import CSV → RH/paie → support → archives → clés API → OpenAPI.

## 6. Suite proposée (phase 4)

1. Corriger les littéraux corrompus côté frontend et brancher les écrans restants sur l'API.
2. Worker outbox (emails, webhooks) + SMTP.
3. Stockage fichiers (logo, pièces jointes) et PDF d'abonnement.
4. Console superadmin séparée + MFA.
5. Jobs planifiés : marquage des retards, relances, quotas, purge des sessions.
6. Observabilité : logs structurés, métriques, traces, healthchecks base.
