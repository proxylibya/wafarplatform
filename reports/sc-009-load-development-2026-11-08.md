# SC-009 development check — 2026-11-08

**Criterion**: SC-009 (plan.md → The SC-009 load profile)
**Verdict**: **FAIL** — development check, not the registered verdict
**Reports**: `sc-009-load-development-2026-11-08.json` (run 1),
`sc-009-load-development-2026-11-08-clean.json` (run 2)

## Environment

The documented Docker composition could not be used on this host: Docker Engine,
Docker Compose, WSL distributions, and PgDog are not installed. The run used the
native PostgreSQL already present on the machine, with the same database and
schema the composition provides.

| Item | Value |
|---|---|
| Host | Windows 10.0.19045, Intel Core i7-4790 (4 cores / 8 logical), 21 GB RAM |
| Node.js | v22.23.4 |
| PostgreSQL | 17.11, native Windows service, `127.0.0.1:5432` |
| Database | `postgres://wafar:wafar@127.0.0.1:5432/wafar` |
| PgDog | not available (no Docker); CI's own load job also uses PostgreSQL directly on 5432 |
| `UV_THREADPOOL_SIZE` | 8 (the Node default of 4 saturates earlier; 8 measured best: 8.6 scrypt/s, 12 → 7.2/s, 16 → 5.9/s) |
| `SMS_FAKE_ACCEPT_MS` | 50, set by the script for the API it starts |
| `NODE_ENV` | test for the runner; the spawned API ran `development` for this check. T240 now spawns it with `test` and writes the environment into the report, so CI's load job records the fixed class (the registered measurement, still to run on `ubuntu-24.04`) |

The schema was already migrated. The fixture was seeded with `pnpm load:seed`
(10,000 accounts, 300 sessions) and the run re-seeds it. No source file was
modified.

## Commands

```powershell
$env:DATABASE_URL='postgres://wafar:wafar@127.0.0.1:5432/wafar'
$env:WEB_ORIGIN='http://127.0.0.1:3000'
$env:UV_THREADPOOL_SIZE='8'
$env:LOAD_REPORT='reports/sc-009-load-development-2026-11-08.json'
pnpm load:auth
```

## Results

Run 1 (600/600 accepted; limiter probe passed):

| Operation | Accepted | p50 ms | p95 ms | work-only p95 ms |
|---|---|---|---|---|
| account_creation | 200/200 | 3773.1 | 4727.7 | 4677.7 |
| sign_in | 200/200 | 1804.3 | 2437.9 | 2437.9 |
| recovery | 200/200 | 1901.5 | 2395.6 | 2345.6 |
| aggregate | 600/600 | 2045.5 | 4292.8 | 4242.8 |

Run 2 (599/600 accepted; 1 `TIMEOUT` on account creation):

| Operation | Accepted | p50 ms | p95 ms | work-only p95 ms |
|---|---|---|---|---|
| account_creation | 199/200 | 4365.1 | 6284.3 | 6234.3 |
| sign_in | 200/200 | 2126.6 | 3309.8 | 3309.8 |
| recovery | 200/200 | 2302.2 | 3309.9 | 3259.9 |
| aggregate | 599/600 | 2530.7 | 5389.4 | 5339.4 |

Both runs passed the limiter probe (`20/21` accepted, the 21st `429
RATE_LIMITED` with `Retry-After`) and read back 702 counter keys / 1282 spent,
so the limiter was live and was not bypassed.

## Why the verdict fails on this host

The profile performs 800 scrypt operations in the 60-second window: two per
account-creation submission (the pending password and the one-time code), one per
sign-in, and one per recovery request — 13.3 hashes/second, with the fixed CMV
row 2 cost (N = 32768, r = 8, p = 3).

On this CPU one hash takes ~0.40–0.44 s. With the best thread-pool setting the
host sustains ~8.6 hashes/second, below the 13.3 the profile demands, so a queue
builds for the whole window; the p50 settles in seconds. Independently of
throughput, a single sign-in verification alone exceeds the plan's **p50 ≤ 150
ms** and **work-only p95 ≤ 250 ms** bounds. No environment variable can lower
this cost without changing the scrypt profile, and no runner-side tuning adds
physical cores.

`pg_stat_statements` could not be created by the `wafar` role (no superuser), so
the report carries the script's note instead of the slowest statement.

## Session baseline note

The development database held 13 live sessions from earlier manual work, so the
script observed 313 → 513 rather than the fresh-database 300 → 500 it asserts.
The delta is exactly the 200 sessions the run's sign-ins create; on CI's fresh
PostgreSQL service the baseline is 300 and the ceiling is 500.

## Conclusion

SC-009 still has no successful verdict. This host cannot produce one: the
registered measurement is the `load` job on `ubuntu-24.04` in
`.github/workflows/ci.yml` (plan.md → The SC-009 load profile, "The measurement
host is Linux"). Closing the finding needs that CI run, or a governing
(speckit) change to the scrypt profile or the p50 bound if the target class of
host cannot meet both. A code-only change cannot make a ~0.4 s hash fit a 150 ms
p50.
