#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/var/backups/og-inventory}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/og_inventory_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose -f /opt/og-inventory/docker-compose.prod.yml exec -T postgres \
  pg_dump -U og_user -d og_inventory | gzip > "$FILE"

find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "Backup completed: $FILE"

