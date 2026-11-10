# Backup, restore, and the quarterly drill

**Scope.** PostgreSQL 16's built-in `pg_basebackup` plus continuous WAL
archiving (ADR-142, CMV 8–9). RTO 4 hours for the identity surface; RPO 15
minutes, with `archive_timeout = 60` bounding the archive interval.

## The routine

1. `scripts/backup/backup.sh` runs nightly. It takes one base backup and seals
   every archive — the base backup and each WAL segment — with AES-256-GCM under
   a random data key, itself wrapped by `BACKUP_KEY_ENCRYPTION_KEY`.
2. The key is injected from the environment and is **never** stored beside the
   archive. It is the restore's one unrebuildable input.
3. `scripts/backup/verify.sh <archive>` opens an archive and reads its tar
   stream. The nightly job runs it once per archive.

## The drill (quarterly)

1. Take a fresh archive from production or staging.
2. Restore it into a clean environment with `scripts/backup/restore.sh`.
3. Start PostgreSQL with the sealed WAL archive as `restore_command`, reading
   each segment through `seal.mjs open`.
4. Assert the restored state: the account and session counts of the runbook's
   recorded point, the last `auth.sign_in.succeeded` record's timestamp, and
   `GET /health` answering `200 {"status":"ok","database":"ok"}`.
5. A write inside the 15-minute window may be absent; it is read as absent, not
   as corruption (FR-055).
6. Record the drill's date, the archive's stamp, the key's custody holder, and
   the measured restore duration in the operations log.

## The drill record — 2026-11-09

**Host.** Windows 10 (10.0.19045), Node v22.23.4, local PostgreSQL 17. The
production drill runs on Linux against `pg_basebackup` and the WAL archive. This
host has no Docker and no Linux cluster, so the drill exercises the same
encryption, clean restore, API boot, state assertions, and RTO/RPO reading
through a point-in-time logical dump (`pg_dump`) restored into a clean database.
The departure is recorded here, in the drill's report, and in the plan's
Complexity Tracking (row 38, owner repository owner, review 2026-12-01); it
does not change the production routine above.

**Command.** `DATABASE_URL=<url> node scripts/backup/drill.mjs`. The script
builds a scratch source database, seeds one of each state AC-061 names, seals the
dump, makes writes after the recovery point, restores the sealed archive, and
asserts the restored state before it starts the API. It writes
`reports/t129-restore-drill.json` and leaves no scratch database behind.

**Result: PASS.** Schema version `df0bab0bae8d:2` (two applied steps). Sealed
archive 19,594 bytes (plaintext 19,497 bytes); restored and served in 6,698 ms;
RTO 4 hours, measured 6.8 seconds; RPO 15 minutes, the logical dump being its own
recovery point.

| State at the recovery point | Restored reading | After-point write that is absent |
|---|---|---|
| a live session | `revoked_at` null, `expires_at` in the future; `GET /api/v1/auth/session` answers 200 `authenticated: true` for the account | the source revoked it |
| a lock and its count | `failed_sign_in_count` 5, `locked_until` in the future | the source lifted it |
| a pending request | `state` pending, `verified_at` null | the source verified it |
| a spent rate-limit window | `count` 2 in the window that held it | the source raised it to 3 |

`GET /health` answered 200 `{"status":"ok","database":"ok"}`. The SMS port's
rolling acceptance estimate is process memory (`AcceptanceEstimate`), never a
row: the fresh API starts with an empty window, and the estimator's empty-window
case is asserted by `apps/api/src/modules/auth/sms/__tests__/acceptance-estimate.spec.ts`.

**What the 2026-11-07 drill found.** `scripts/backup/seal.mjs` could not run or open an
archive as committed: a TypeScript type annotation in the `.mjs` file stopped
Node from loading it, and `open` read 48 bytes for the wrapped data key where
`seal` writes 32, misaligning every field. Both defects are fixed with this
record; the round trip now decrypts, and a changed ciphertext byte fails the GCM
authenticity check. The nightly backup and the quarterly drill both depend on
this path, so the fix is part of the drill's result.

## Key custody

The key-encryption key lives in the environment-injected secret store. Losing it
means losing every archive; rotating it requires re-sealing the retained set.
