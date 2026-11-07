#!/usr/bin/env bash
# Nightly PostgreSQL backup with 14-day retention.
#
# Install on the server:
#   sudo cp deploy/backup.sh /etc/cron.daily/saas-backup && sudo chmod +x /etc/cron.daily/saas-backup
#
# Customize the connection below or source it from the app's .env:
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/saas-starter/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/saas-starter}"
RETENTION_DAYS=14

# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && export $(grep -E '^DATABASE_URL=' "$ENV_FILE" | xargs)
: "${DATABASE_URL:?DATABASE_URL not set}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/db-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$FILE"
echo "Wrote $FILE"

# Prune old backups
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

# Optional: copy off-box (uncomment and configure — a backup on the same
# machine is not a backup).
# rclone copy "$FILE" remote:saas-backups/
