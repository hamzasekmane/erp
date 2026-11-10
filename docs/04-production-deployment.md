# Mise en production

Ce document décrit comment exploiter l'ERP (frontend Next.js + API NestJS + PostgreSQL) en production :
topologie, configuration, déploiement, sauvegardes, supervision et liste de contrôle avant ouverture.

## 1. Topologie cible

```
                 TLS (443)
   Navigateur ──────────────► Reverse proxy (Nginx / Caddy / LB)
                                   │
                 ┌─────────────────┴──────────────────┐
                 ▼                                    ▼
        Next.js (port 3000)                   API NestJS (port 4000)
        - rendu + actions serveur             - /api et /api/v1
        - cookies httpOnly                    - JWT + refresh
                 │                                    │
                 └───────────────┬────────────────────┘
                                 ▼
                    PostgreSQL 16 (privé, port 5432)
                                 │
                    Volume uploads + volume mail/outbox
```

- L'API n'est **jamais** exposée sans TLS : les JWT et les refresh tokens circulent en en-têtes.
- PostgreSQL n'est pas publié ; seul le réseau Docker (ou le VPC) le rend joignable.
- Le frontend et l'API partagent le même domaine (`/api` proxifié) pour éviter les problèmes de CORS et de cookies.

## 2. Prérequis

| Élément | Version / remarque |
| --- | --- |
| Node.js | 22 LTS (image `node:22-alpine`) |
| PostgreSQL | 16 (14+ supporté) |
| Docker | 24+ avec compose v2 (option recommandée) |
| Reverse proxy | Nginx, Caddy, Traefik ou LB cloud |
| Secrets | gestionnaire de secrets (Vault, SSM, Doppler…) — jamais dans Git |

## 3. Variables d'environnement

Voir [`server/.env.production.example`](../server/.env.production.example). Les variables sensibles :

| Variable | Rôle | Exemple |
| --- | --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL | `postgres://erp:…@db:5432/erp` |
| `DATABASE_SSL` | TLS vers la base managée | `true` |
| `JWT_SECRET` | Signature des access tokens (≥ 32 octets aléatoires) | `openssl rand -base64 48` |
| `CORS_ORIGINS` | Origines autorisées (liste explicite, pas de `*`) | `https://app.example.com` |
| `APP_URL` | URL publique, utilisée dans les e-mails | `https://app.example.com` |
| `SMTP_URL` | Livraison des e-mails | `smtps://user:pass@smtp:465` |
| `MAINTENANCE_TOKEN` | Appel du cron externe | `openssl rand -hex 32` |
| `ENABLE_API_DOCS` | Exposer `/api/docs` (désactivé par défaut en prod) | `false` |
| `RUN_MIGRATIONS_ON_BOOT` | Migrer au démarrage (ou via pipeline) | `true` |

**L'API refuse de démarrer en production** si `DATABASE_URL` est vide, si `JWT_SECRET` garde sa valeur de
développement, ou si `CORS_ORIGINS` est vide ou contient `*`.

## 4. Déploiement avec Docker Compose

```bash
cd server && cp .env.production.example .env.production   # renseigner les secrets
cd ..
# .env à la racine pour docker compose (mot de passe PostgreSQL, URL publique de l'API)
cat > .env <<'ENV'
POSTGRES_DB=erp
POSTGRES_USER=erp
POSTGRES_PASSWORD=<mot-de-passe-fort>
NEXT_PUBLIC_API_URL=https://api.example.com/api
ENV

docker compose up -d --build      # db + api + web

# Premier déploiement uniquement : créer la plateforme (pas de tenant de démo).
# Le seed applique les migrations puis crée le compte superadmin.
docker compose run --rm api npx tsx src/db/seed.ts
```

> Le seed de démonstration est désactivé automatiquement en production (`SEED_DEMO=false` par défaut) et le
> script refuse de s'exécuter sans `SEED_ALLOW_PRODUCTION=true`.

Vérification :

```bash
curl -fsS https://api.example.com/api/health/live
curl -fsS https://api.example.com/api/health/ready
```

Mise à jour :

```bash
git pull
docker compose build api
docker compose up -d api          # les migrations s'appliquent au démarrage
```

### Déploiement sans Docker

```bash
cd server
npm ci && npm run build
NODE_ENV=production node dist/main.js           # systemd / pm2 / ECS
# ou via un pipeline : RUN_MIGRATIONS_ON_BOOT=false npm run db:migrate
```

Exemple d'unité `systemd` :

```ini
[Unit]
Description=ERP API
After=network.target

[Service]
WorkingDirectory=/srv/erp/server
EnvironmentFile=/srv/erp/server/.env.production
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30
User=erp
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

## 5. Migrations et retour arrière

- Migrations **forward-only**, appliquées dans une transaction, verrouillées par
  `pg_advisory_xact_lock` + revendication `ON CONFLICT DO NOTHING` : deux instances peuvent démarrer
  simultanément sans double application.
- Chaque fichier est rejouable en cas d'échec : la transaction annule tout, la migration reste à appliquer.
- **Rollback applicatif** : redéployer l'image précédente (`docker compose up -d api:version-N`). Les
  migrations étant additives, l'ancienne version continue de fonctionner. Toute migration destructive doit
  être précédée d'une sauvegarde et découpée en deux releases (expand → contract).

## 6. Sauvegardes

```bash
# Sauvegarde quotidienne (cron), conservation 30 jours
docker compose exec -T db pg_dump -U erp -Fc erp > /backups/erp-$(date +%F).dump

# Restauration
docker compose exec -T db pg_restore -U erp -d erp --clean --if-exists < /backups/erp-2026-01-31.dump
```

- Sauvegarder aussi le volume `uploads` (documents clients, logos).
- Tester la restauration au moins une fois par trimestre.
- Activer les sauvegardes automatiques si la base est managée (PITR recommandé).

## 7. Supervision

| Sonde | Usage |
| --- | --- |
| `GET /api/health/live` | liveness (redémarrage du conteneur) |
| `GET /api/health/ready` | readiness : base joignable + file d'événements non saturée |
| `GET /api/admin/outbox/stats` | volumes `pending`/`failed` (superadmin) |
| `POST /api/admin/outbox/process` | purge manuelle de la file |
| `GET /api/admin/maintenance/status` | dernier passage de maintenance |

- Logs : sortie standard (Nest), à collecter par le driver Docker ou un agent (Loki/CloudWatch).
- Alertes recommandées : `ready` != 200 pendant 3 min, `failed` outbox > 0, échecs SMTP répétés,
  latence p95 > 1 s, disque < 20 %.
- Cron externe possible (sans worker) :
  `curl -fsS -X POST -H "x-maintenance-token: $TOKEN" https://api…/api/internal/maintenance/run`.

## 8. Sécurité — liste de contrôle

- [ ] HTTPS obligatoire, redirection HTTP → HTTPS (HSTS géré par le proxy).
- [ ] `JWT_SECRET` unique par environnement, rotation documentée (déconnecte tous les utilisateurs).
- [ ] `CORS_ORIGINS` limité au(x) domaine(s) du frontend.
- [ ] `ENABLE_API_DOCS=false` (ou documentation protégée par le proxy).
- [ ] PostgreSQL non exposé publiquement, `DATABASE_SSL=true` si base managée.
- [ ] `TRUST_PROXY=true` derrière un proxy, `TRUST_PROXY_HOPS` ajusté.
- [ ] `POSTGRES_PASSWORD` et comptes seed non triviaux ; `SEED_DEMO=false`.
- [ ] SMTP avec SPF/DKIM/DMARC pour éviter le spam.
- [ ] Volume `uploads` sauvegardé et scanné (antivirus) avant exposition publique.
- [ ] Sauvegardes chiffrées et accès restreint.
- [ ] Journal d'audit conservé (table `audit_logs`) selon la politique légale locale.

## 9. Frontend Next.js

```bash
# à la racine du dépôt
npm ci
NEXT_PUBLIC_API_URL=https://app.example.com/api npm run build
npm start                       # ou : node .next/standalone/server.js
```

L'image Docker du frontend est fournie (`Dockerfile` à la racine, sortie `standalone`) et le
`docker-compose.yml` racine orchestre `db`, `api` et `web`. La police Inter est auto-hébergée
(`@fontsource-variable/inter`) : le build ne dépend d'aucun accès à Google Fonts.

- En production, privilégier un proxy same-origin : `location /api/ { proxy_pass http://api:4000/api/; }`
  puis `NEXT_PUBLIC_API_URL=/api` — les cookies et le CORS deviennent inutiles.
- `NEXT_PUBLIC_API_URL` est figée **au build** (variable publique) : choisir l'URL publique de l'API
  (`https://api.example.com/api`) ou `/api` si le reverse proxy route `/api` vers le conteneur `api`.
- `API_PROXY_TARGET` (aussi figée au build) active le proxy same-origin : Next sert `/api/*` en
  relayant vers l'API (`http://api:4000` dans Docker). Combinée à `NEXT_PUBLIC_API_URL=/api`, elle
  supprime le CORS et les appels cross-origin depuis le navigateur.
- Les actions serveur (`app/actions/*`) utilisent la même URL publique ; pour un appel réseau interne
  (plus rapide), prévoir une variable serveur dédiée lors d'une prochaine itération.
- Cookies : `token` en `httpOnly`, `Secure`, `SameSite=Lax`.

## 10. Performance et montée en charge

- Pool PostgreSQL dimensionné par `DATABASE_POOL_MAX` (10 par défaut, ≤ 25 % des connexions du serveur).
- API sans état (hors file d'événements et limiteur de débit en mémoire) : plusieurs réplicas sont possibles
  derrière un LB ; avec plusieurs réplicas :
  - déplacer le limiteur de débit vers Redis ;
  - exécuter un seul worker d'outbox (`OUTBOX_DISABLED=true` sur les autres réplicas) ;
  - exécuter un seul planificateur de maintenance (`MAINTENANCE_DISABLED=true` sur les autres réplicas).
- Fichiers : passer à un stockage objet (S3) au-delà d'un nœud, et servir via URL signée.
- Index déjà en place sur les colonnes de filtrage (`tenant_id`, statuts, échéances).

## 11. Checklist « prêt pour la production »

1. [ ] `.env.production` renseigné, secrets hors Git, `npm run build` vert.
2. [ ] Base PostgreSQL provisionnée, migrations appliquées (`_migrations` à jour).
3. [ ] `seed` exécuté une seule fois (compte plateforme), `SEED_DEMO=false`.
4. [ ] `GET /api/health/ready` → 200 depuis le proxy.
5. [ ] SMTP vérifié : `POST /invoices/:id/send` puis réception réelle de l'e-mail.
6. [ ] Sauvegarde + restauration testées, volumes montés et persistant.
7. [ ] Supervision et alertes branchées.
8. [ ] Frontend déployé, `NEXT_PUBLIC_API_URL` correct, connexion/déconnexion testées.
9. [ ] Tests e2e verts (`cd server && npm test` → 27/27) et CI verte.
10. [ ] Procédure d'incident écrite (rollback image, restauration base, rotation de secret).

## 12. Dette frontend

- **TypeScript : 0 erreur.** `next build` est bloquant en cas d'erreur de type et `tsc --noEmit` est
  exécuté en CI. Les 69 erreurs historiques ont été corrigées (typages des actions, réponses API,
  props de composants, export analytique, notes client).
- **Écrans métier connectés à l'API** (plus de tableaux codés en dur) :
  - RH : employés (liste / création / suppression), congés (liste + décision), présences, paie,
    contrats, départements (liste / création / suppression).
  - Support : tickets récents chargés depuis `/support/tickets`, formulaire de création relié à
    `POST /support/tickets`.
  - Archives : `/archives/stats` + `/archives/documents`, avec filtrage par catégorie
    (`client`, `invoice`, `product`, `contract`).
  - Analytics : les normaliseurs consomment désormais l'enveloppe `{ success, data }` du backend ;
    l'écran d'export produit un vrai CSV via `GET /reports/export?type=…&format=csv`.
- **Correction critique de résolution d'URL** : les services partagés utilisaient
  `NEXT_PUBLIC_API_URL` (valeur relative `/api`) côté serveur, ce qui rendait la totalité du
  dashboard inaccessible en production (`Failed to parse URL`, redirection `/login`). Un helper
  `app/lib/apiBase.ts` résout désormais la base API : `API_INTERNAL_URL`, sinon `API_PROXY_TARGET`,
  sinon l'origine locale. `API_INTERNAL_URL` est optionnel en Docker (`API_PROXY_TARGET` suffit).
- Reste à traiter : les sous-écrans analytics « KPI / prévisions / benchmark / pivot » affichent
  encore des séries de démonstration (le backend n'expose pas encore ces agrégats), et l'export CSV
  du backend ne distingue pas encore tous les types de rapport (seul `clients` diffère de `sales`).
- Les littéraux d'URL corrompus relevés dans l'audit initial ont été vérifiés : les services actuels
  pointent bien vers `/client-groups`, `/api-keys` et `/reports/*`.

## 12 bis. Responsive (mobile / tablette)

- **Navigation** : le tiroir mobile est désormais actif jusqu'à `lg` (avant, la plage 768–1024 px
  n'avait ni sidebar ni bouton menu). Fermeture par `Échap`, clic sur le fond ou changement de route ;
  verrouillage du scroll du body, largeur limitée à `85vw`.
- **Coquille** : hauteur de navbar `h-16` sur mobile, `h-dvh` au lieu de `h-screen` (barres d'URL
  mobiles), padding de page `p-4 → sm:p-6 → lg:p-8` sur l'ensemble du dashboard (90 fichiers).
- **Tables** : 23 tableaux passent en défilement horizontal (`min-w-[640px]` + `overflow-x-auto`) au
  lieu d'écraser les colonnes sur un écran de 360 px.
- **Titres et grilles** : `text-4xl/5xl` deviennent `text-3xl sm:text-4xl` / `text-4xl sm:text-5xl` ;
  les grilles de formulaires (`grid-cols-2`) passent en une colonne sur mobile ; les rangées d'actions
  utilisent `flex-wrap`.
- **Landing & auth** : hero en pile sur mobile (bento 1 → 3 colonnes, hauteurs minimales), CTA
  empilables, cartes de connexion/inscription avec padding réduit et titres adaptatifs.
- Non couvert : aucun test automatisé de rendu visuel (pas de navigateur headless dans l'environnement
  de CI) ; la validation responsive reste manuelle.

## 12 ter. Paiement en ligne — Chargily Pay (CIB / EDAHABIA)

Intégration **pay-v2** de [Chargily](https://dev.chargily.com/pay-v2) pour régler une facture
existante par carte CIB ou carte EDAHABIA (Algérie Poste), en dinars algériens.

**Configuration**

1. `SECRETS_ENCRYPTION_KEY` (openssl rand -hex 32) doit être défini dès qu'une clé de passerelle est
   stockée : les secrets sont chiffrés en **AES-256-GCM** (`server/src/shared/security/secrets.ts`)
   avant insertion dans `payment_gateway_secrets`. Sans clé, l'enregistrement renvoie
   `SECRETS_KEY_MISSING`.
2. Paramètres → Paiement → carte **Chargily Pay** : choisir l'environnement (`test` / `live`) et coller
   la clé secrète (`test_sk_…` ou `live_sk_…`). La carte affiche l'URL de webhook à déclarer dans le
   tableau de bord Chargily : `{APP_PUBLIC_URL}/api/payments/chargily/webhook`.
3. Repli plateforme possible via `CHARGILY_SECRET_KEY` / `CHARGILY_MODE` : une clé de tenant
   enregistrée en base est toujours prioritaire. `CHARGILY_WEBHOOK_URL` force l'`webhook_endpoint`
   sur chaque checkout.

**Flux**

| Étape | Endpoint | Comportement |
| --- | --- | --- |
| Création | `POST /api/payments/chargily/checkouts` `{invoiceId, amount?, method?, locale?}` | Vérifie la facture (brouillon/annulée/soldée refusées), crée le checkout v2, stocke `gateway_checkouts`, renvoie `checkoutUrl` → redirection. |
| Retour client | `GET /dashboard/invoices/{id}?payment=success` | Le serveur appelle `POST /api/payments/chargily/invoices/{id}/refresh` : **revérification du statut auprès de Chargily**, jamais confiance au redirect. |
| Webhook | `POST /api/payments/chargily/webhook` (public) | Signature `signature` = HMAC-SHA256 **hex** du corps brut, comparée en temps constant. Absente → 403, invalide → 403. |
| Suivi | `GET /api/payments/chargily/checkouts`, `GET /api/payments/chargily/status` | Historique et état de configuration (clé présente, mode, source). |

**Règles de règlement**

- Seul `checkout.paid` solde la facture. Les événements `failed|canceled|expired` ne touchent qu'au
  statut du checkout.
- **Idempotence** : un checkout déjà `paid` répond `{alreadySettled: true}` ; le webhook et la
  revérification active peuvent arriver dans n'importe quel ordre.
- **Contrôle de montant** : le montant renvoyé par Chargily doit égaler celui stocké à la création, sinon
  statut `amount_mismatch`, erreur journalisée, aucun paiement créé.
- **Arrondi dinarique** : Chargily n'accepte que des dinars entiers. Le solde est arrondi **au dinar
  supérieur** (786 pour 785,40 DA) pour qu'un paiement complet solde toujours la facture ; le montant
  alloué est plafonné au solde dû et l'écart (≤ 1 DA) est inscrit dans les notes du paiement.
- Le paiement est créé par `PaymentsService.create` (`userId: null`, `userAgent: chargily-webhook`),
  référence = identifiant du checkout, méthode `EDAHABIA`/`CIB`. `INVOICE_ALREADY_PAID` est toléré
  (autre moyen de paiement arrivé avant), les autres échecs passent le checkout en `reconcile_failed`.
- Statuts possibles : `pending | paid | failed | canceled | expired | amount_mismatch | reconcile_failed`.

**Vérifications exécutées** (pglite local, clé `test_sk_demo_secret_123`)

- `GET /api/payments/chargily/status` → `{configured:true, mode:"test", source:"tenant", secretsEncryption:true}`.
- Webhook sans signature → `403 INVALID_SIGNATURE` ; signature erronée → `403`.
- `checkout.paid` signé (1309 DA) → `200 {status:"paid"}` ; facture `FA-2026-0003` passe à `paid`,
  un seul paiement `PAY-2026-0005` (EDAHABIA, réf. `ch_test_0001`).
- Rejeu du même événement → `200 {alreadySettled:true}`, aucun doublon.
- Montant erroné (500 au lieu de 786) → `{status:"amount_mismatch"}`, aucun paiement ; montant correct
  → facture `FA-2026-0002` soldée avec note « arrondi dinarique de 0.6 DZD ».
- `createCheckout` sans réseau sortant (sandbox) → `400 PAYMENT_PROVIDER_ERROR` (échec propre, pas de
  crash) ; facture déjà soldée → `422 INVOICE_ALREADY_PAID`.

## 12 quater. Double authentification (TOTP)

Les comptes peuvent être protégés par un code à 6 chiffres (RFC 6238), compatible Google
Authenticator, Authy, 1Password, FreeOTP. Implémentation interne (`server/src/shared/security/totp.ts`,
HMAC-SHA1, pas de dépendance npm) validée sur les vecteurs de test de la RFC.

**Flux de connexion**

1. `POST /api/auth/login` avec un compte sans MFA → réponse inchangée (`token`, `refreshToken`, …).
2. Compte avec MFA → `200 {mfaRequired: true, challengeToken, expiresIn: 300}` : **aucun jeton de session
   n'est émis**. Le ticket est un JWT signé (`typ: "mfa"`) valable 5 minutes.
3. `POST /api/auth/mfa/verify {challengeToken, code}` → session complète. Code erroné : `401
   INVALID_MFA_CODE` (throttle 8 essais / 10 min par utilisateur) ; ticket expiré ou forgé : `401
   MFA_CHALLENGE_EXPIRED`.
4. Côté Next.js, `app/actions/loginAction.ts` expose `loginAction` puis `mfaVerifyAction` : les cookies
   `token`/`tenantId`/`user_name` ne sont posés qu'après la validation du code.

**Enrôlement / révocation**

| Endpoint | Rôle |
| --- | --- |
| `GET /api/auth/mfa` | `{enabled, pending, required, issuer, storageReady}` |
| `POST /api/auth/mfa/setup` | Génère un secret TOTP (chiffré en base, MFA encore inactive) + `otpauthUrl` pour le QR |
| `POST /api/auth/mfa/enable {code}` | Confirme le premier code et active la MFA |
| `POST /api/auth/mfa/disable {password, code}` | Désactive (mot de passe **et** code exigés) |

- Le secret est chiffré en AES-256-GCM (`SECRETS_ENCRYPTION_KEY`) ; sans clé, `setup` renvoie
  `503 MFA_UNAVAILABLE` et `GET /api/auth/mfa` indique `storageReady: false`.
- `MFA_REQUIRE_SUPERADMIN=true` rend la MFA obligatoire pour le rôle `superadmin` (`required: true`,
  désactivation refusée avec `403 MFA_REQUIRED`) ; la configuration de production exige alors
  `SECRETS_ENCRYPTION_KEY`.
- Chaque étape est auditée : `auth.mfa_challenge`, `auth.mfa_setup_started`, `auth.mfa_enabled`,
  `auth.mfa_login`, `auth.mfa_failed`, `auth.mfa_disabled`.
- UI : page Paramètres → Sécurité, carte « Authentification à deux facteurs » (QR `qrcode.react`, saisie
  manuelle du secret, statut réel, désactivation avec mot de passe + code).

**Vérifications exécutées** (`server/src/test/api.e2e.test.ts`, 9 cas) : statut initial désactivé, génération
du secret, refus d'un code invalide, activation, login sans jeton + challenge, refus du mauvais code puis
succès, ticket forgé rejeté, désactivation protégée par mot de passe et code, retour au login classique.
Tests unitaires TOTP : 7 cas dont les vecteurs RFC 6238 (`94287082`, `07081804`, `69279037`).

## 13. Limites connues avant une ouverture publique large

- Chargily Pay est intégré et vérifié en mode test local (webhook signé + revérification) mais aucun
  aller-retour réel avec le tableau de bord Chargily n'a été exécuté depuis cet environnement (pas de
  sortie réseau) : la recette doit être refaite en staging avec une vraie clé `test_sk_…`.
- Superadmin authentifié sur le tenant « platform » : la MFA est disponible (TOTP) mais son caractère
  obligatoire dépend de `MFA_REQUIRE_SUPERADMIN` ; la séparation réseau reste à faire.
- Pas d'antivirus sur les uploads, pas de quota de stockage par formule.
- Limiteur de débit en mémoire (par instance) et outbox mono-worker.
