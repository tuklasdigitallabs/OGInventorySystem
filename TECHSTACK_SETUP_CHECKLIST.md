# Tech Stack Setup Checklist

## Source Control And Quality Gates

- [x] GitHub repo connected
- [x] CI workflow added
- [x] Branch protection enabled on `main`

## VPS Provisioning And Base Security

- [ ] Provision Hostinger KVM 2 with `Ubuntu 24.04 LTS`
- [ ] Create non-root sudo user and disable root password SSH
- [ ] Configure SSH keys and basic firewall (`ufw`: 22, 80, 443)
- [ ] Install Docker Engine + Docker Compose plugin
- [ ] Clone repo on VPS to `/opt/og-inventory`

## Production Configuration

- [ ] Set production env files on VPS only
- [ ] `apps/api/.env.prod`
- [ ] `apps/web/.env.prod`
- [ ] `.env.prod.compose`
- [ ] Rotate any previously exposed secrets (DB password, JWT secrets)

## Networking And TLS

- [ ] Point domain/subdomain DNS to VPS IP
- [ ] Install TLS certs (`fullchain.pem`, `privkey.pem`) in `infra/nginx/certs`

## Deployment And Verification

- [ ] Deploy stack with `docker compose --env-file .env.prod.compose -f docker-compose.prod.yml up --build -d`
- [ ] Run Prisma migration + seed in production container
- [ ] Verify health endpoints and login flow from public domain

## Reliability And Operations

- [ ] Configure daily PostgreSQL backups + retention policy
- [ ] Add restore test procedure (verify backups are usable)
- [ ] Add basic monitoring and alerts (uptime, CPU/RAM/disk, container health)
- [ ] Set log strategy (Docker log rotation + app logs)

## CI/CD Automation

- [ ] Add CD workflow (GitHub Actions deploy over SSH)
- [ ] Add required GitHub secrets for deploy (`VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`)
- [ ] Test full CI -> merge -> deploy pipeline on staging/production

## Final Hardening And Documentation

- [ ] Final hardening pass (fail2ban, unattended security updates, least-privilege)
- [ ] Document runbook (deploy, rollback, backup restore, incident steps)
