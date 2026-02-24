# One Gourmet PH - Centralized F&B Inventory & Costing System

Production-ready MVP foundation for a centralized, online-first inventory platform with immutable ledger accounting, moving average costing per location, offline branch operations, and queued reporting.

## Stack

- Frontend: Next.js (App Router), TypeScript, TailwindCSS, PWA (Service Worker + IndexedDB queue)
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ
- Infra: Docker, Docker Compose, Nginx reverse proxy (HTTPS-ready)

## Monorepo Structure

- `apps/api` - NestJS API + Prisma
- `apps/web` - Next.js PWA client
- `infra/nginx` - reverse proxy configuration

## Quick Start

1. Copy env files:
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/web/.env.example apps/web/.env.local`
2. Start services:
   - `docker compose up --build`
3. Run Prisma migration (inside `api` container):
   - `npx prisma migrate deploy`
4. Open:
   - Web: `http://localhost`
   - API: `http://localhost/api`

## Staging Or Production Deploy (Hostinger KVM 2)

1. Copy project to VPS:
   - `scp -r ./ "root@YOUR_VPS_IP:/opt/og-inventory"`
2. SSH into VPS and enter project:
   - `ssh root@YOUR_VPS_IP`
   - `cd /opt/og-inventory`
3. Create production env files:
   - `cp apps/api/.env.prod.example apps/api/.env.prod`
   - `cp apps/web/.env.prod.example apps/web/.env.prod`
4. Set strong secrets and passwords:
   - Edit `apps/api/.env.prod` and set:
     - `DATABASE_URL` password
     - `JWT_ACCESS_SECRET`
     - `JWT_REFRESH_SECRET`
     - `ALLOWED_ORIGINS`
   - `cp .env.prod.compose.example .env.prod.compose`
   - Edit `.env.prod.compose` and set `POSTGRES_PASSWORD`
5. Add TLS cert files:
   - `infra/nginx/certs/fullchain.pem`
   - `infra/nginx/certs/privkey.pem`
6. Start production stack:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml up --build -d`
7. Run database migration and seed:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml exec api sh -lc "npx prisma migrate deploy && npm run prisma:seed"`
8. Verify API health via auth login:
   - `curl -X POST "https://inventory.your-domain.com/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@onegourmet.ph","password":"ChangeMe123!"}'`
9. Run automated tests against live API:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml exec api sh -lc "E2E_BASE_URL=http://localhost:4000 npm run test:e2e"`

### Postgres Backup Cron (Daily)

1. Install backup script:
   - `install -m 755 infra/scripts/backup-postgres.sh /usr/local/bin/backup-og-postgres.sh`
2. Add cron entry:
   - `crontab -e`
   - `15 2 * * * BACKUP_DIR=/var/backups/og-inventory /usr/local/bin/backup-og-postgres.sh >> /var/log/og-backup.log 2>&1`

## Security And Tests

- API security:
  - `helmet` headers
  - CORS allowlist via `ALLOWED_ORIGINS`
  - Global rate limit via `THROTTLE_TTL` and `THROTTLE_LIMIT`
  - Request ID propagation with `x-request-id`
- Run tests:
  - `npm --workspace apps/api run test`
  - `npm --workspace apps/api run test:e2e` (requires live API at `http://localhost:4000`)

## Core Guarantees

- Immutable inventory ledger (`ledger_events`) with UUID idempotency
- No editable stock balance fields
- Moving average costing maintained per `item + location`
- Transaction-safe posting logic in dedicated ledger service
- Offline sync endpoint with per-event status responses
- BullMQ-based async reporting jobs
- JWT auth with refresh tokens, RBAC, location scoping, and audit logs

## GitHub Branch Protection (Main)

In GitHub repo settings, configure a branch protection rule for `main`:

- Require a pull request before merging
- Require approvals: `1`
- Require status checks to pass before merging:
  - `Lint, Build, Test`
- Require branches to be up to date before merging
- Restrict force pushes
- Do not allow deletions
