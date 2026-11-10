#!/usr/bin/env bash
# Restores a sealed base backup into a clean PostgreSQL 16 environment. The
# restored state is the archive's point in time; a write inside the 15-minute
# window may be absent and is read as absent (FR-055).
set -euo pipefail

: "${BACKUP_KEY_ENCRYPTION_KEY:?BACKUP_KEY_ENCRYPTION_KEY is required}"
archive="${1:?usage: restore.sh <base-*.tar.gz.sealed> <target-pgdata>}"
target="${2:?target PGDATA is required}"

tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

node "$(dirname "$0")/seal.mjs" open "${archive}" "${tmp}/payload.tar.gz"
tar -C "${tmp}" -xzf "${tmp}/payload.tar.gz"

rm -rf "${target:?refusing to clear an empty path}"
install -d -m 700 "${target}"
cp -a "${tmp}/base/." "${target}/"
touch "${target}/recovery.signal"
echo "Restored into ${target}. Start PostgreSQL with the WAL archive as restore_command."
