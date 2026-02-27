#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/var/backups/og-inventory}"
BACKUP_FILE="${BACKUP_FILE:-$(ls -1t "$BACKUP_DIR"/og_inventory_*.sql.gz 2>/dev/null | head -n 1)}"
TEMP_DB="${TEMP_DB:-og_inventory_restore_test}"
COMPOSE_CMD="docker compose --env-file /opt/og-inventory/.env.prod.compose -f /opt/og-inventory/docker-compose.prod.yml"

if [ -z "${BACKUP_FILE:-}" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found. Set BACKUP_FILE or ensure backups exist in $BACKUP_DIR."
  exit 1
fi

echo "Using backup: $BACKUP_FILE"

# Recreate temp restore database.
$COMPOSE_CMD exec -T postgres psql -v ON_ERROR_STOP=1 -U og_user -d postgres <<SQL
DROP DATABASE IF EXISTS $TEMP_DB;
CREATE DATABASE $TEMP_DB;
SQL

# Restore dump into temp database.
gunzip -c "$BACKUP_FILE" | $COMPOSE_CMD exec -T postgres psql -v ON_ERROR_STOP=1 -U og_user -d "$TEMP_DB" >/dev/null

# Minimal integrity check for critical tables.
USERS_TABLE_PRESENT="$($COMPOSE_CMD exec -T postgres psql -U og_user -d "$TEMP_DB" -tAc "SELECT to_regclass('public.users') IS NOT NULL;")"
PERMISSIONS_TABLE_PRESENT="$($COMPOSE_CMD exec -T postgres psql -U og_user -d "$TEMP_DB" -tAc "SELECT to_regclass('public.permissions') IS NOT NULL;")"

if [ "$USERS_TABLE_PRESENT" != "t" ] || [ "$PERMISSIONS_TABLE_PRESENT" != "t" ]; then
  echo "Restore validation failed: expected tables are missing."
  exit 1
fi

# Cleanup temporary restore database.
$COMPOSE_CMD exec -T postgres psql -v ON_ERROR_STOP=1 -U og_user -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;" >/dev/null

echo "Restore test passed for: $BACKUP_FILE"
