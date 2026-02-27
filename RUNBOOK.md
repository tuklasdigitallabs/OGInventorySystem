# OG Inventory Production Runbook

## 1) Domain Cutover (When Transfer Completes)

1. Point DNS `A` record for `inventory.your-domain.com` to VPS IPv4.
2. Wait for DNS propagation, then verify:
   - `nslookup inventory.your-domain.com`
3. Update VPS app envs:
   - `apps/api/.env.prod` -> `ALLOWED_ORIGINS=https://inventory.your-domain.com`
   - `apps/web/.env.prod` -> `NEXT_PUBLIC_API_BASE_URL=https://inventory.your-domain.com/api`
4. Install TLS certs in `infra/nginx/certs`:
   - `fullchain.pem`
   - `privkey.pem`
5. Redeploy:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml up --build -d`
6. Verify:
   - `curl -I https://inventory.your-domain.com`
   - Auth login endpoint returns `201`.

## 2) Deploy

Primary path:
- GitHub Actions `CD Deploy` workflow on `main`.

Manual fallback on VPS:
- `cd /opt/og-inventory`
- `git pull --ff-only origin main`
- `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml up --build -d`
- `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml exec -T api sh -lc "npx prisma migrate deploy && npm run prisma:seed"`

## 3) Rollback

1. On VPS:
   - `cd /opt/og-inventory`
   - `git log --oneline -n 20`
2. Checkout previous known-good commit:
   - `git checkout <GOOD_COMMIT_SHA>`
3. Rebuild/restart:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml up --build -d`
4. Verify login endpoint.
5. After incident, create a fix commit and return branch to `main`.

## 4) Backups

Daily backup script:
- `infra/scripts/backup-postgres.sh`

Install:
- `install -m 755 infra/scripts/backup-postgres.sh /usr/local/bin/backup-og-postgres.sh`

Retention:
- deletes backups older than 14 days.

## 5) Backup Restore Test

Install restore-test script:
- `install -m 755 infra/scripts/restore-test-postgres.sh /usr/local/bin/restore-test-og-postgres.sh`

Run test against latest backup:
- `BACKUP_DIR=/var/backups/og-inventory /usr/local/bin/restore-test-og-postgres.sh`

Expected outcome:
- creates temporary DB
- restores backup
- validates critical tables
- drops temporary DB

## 6) Incident Quick Checks

1. Container health:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml ps`
2. API logs:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml logs --tail=200 api`
3. Nginx logs:
   - `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml logs --tail=200 nginx`
