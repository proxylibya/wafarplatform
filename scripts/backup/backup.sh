#!/usr/bin/env bash
# Nightly base backup plus continuous WAL archiving (CMV 8, CMV 9). Every
# archive is sealed before it leaves the host; the key is never stored beside it.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_KEY_ENCRYPTION_KEY:?BACKUP_KEY_ENCRYPTION_KEY is required}"
: "${BACKUP_DIR:=/var/backups/wafar}"
: "${PGDATA:=/var/lib/postgresql/data/pgdata}"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
work="${BACKUP_DIR}/work-${stamp}"
mkdir -p "${work}" "${BACKUP_DIR}/wal"

pg_basebackup \
  --pgdata="${work}/base" \
  --wal-method=stream \
  --checkpoint=fast \
  --label="wafar-${stamp}" \
  --no-password

tar -C "${work}" -czf "${work}/base.tar.gz" base
node "$(dirname "$0")/seal.mjs" seal "${work}/base.tar.gz" "${BACKUP_DIR}/base-${stamp}.tar.gz.sealed"
rm -rf "${work}"

# WAL segments are sealed as they arrive; archive_timeout = 60 bounds the RPO.
for segment in "${PGDATA}/pg_wal"/*; do
  [ -f "${segment}" ] || continue
  name="$(basename "${segment}")"
  [ -f "${BACKUP_DIR}/wal/${name}.sealed" ] && continue
  node "$(dirname "$0")/seal.mjs" seal "${segment}" "${BACKUP_DIR}/wal/${name}.sealed"
done

echo "Backup complete: ${BACKUP_DIR}/base-${stamp}.tar.gz.sealed"
