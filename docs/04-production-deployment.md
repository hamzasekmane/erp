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
- Certains écrans (RH, support, archives, analytics) tournent encore sur des données statiques et ne
  consomment pas les endpoints correspondants.
- Les littéraux d'URL corrompus relevés dans l'audit initial ont été vérifiés : les services actuels
  pointent bien vers `/client-groups`, `/api-keys` et `/reports/*`.

## 13. Limites connues avant une ouverture publique large

- Aucune intégration PSP réelle (encaissement en ligne) : les passerelles sont configurables mais inactives.
- Superadmin authentifié sur le tenant « platform » : MFA et séparation réseau restent à ajouter.
- Pas d'antivirus sur les uploads, pas de quota de stockage par formule.
- Limiteur de débit en mémoire (par instance) et outbox mono-worker.
