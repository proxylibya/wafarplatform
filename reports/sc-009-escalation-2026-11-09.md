# SC-009 escalation — 2026-11-09

**Criterion**: SC-009 (plan.md → The SC-009 load profile)
**Status**: Open — the registered verdict has not been produced
**Owner**: repository owner
**Related tasks**: T254, T257, T260, T261, T262, T267, T270, T272
**Related acceptance condition**: R1's acceptance condition 4 (plan.md → R1's acceptance conditions)

## 1. What is blocked

R1's acceptance condition 4 requires the SC-009 load verdict to pass and its report to be attached. The registered measurement host is Linux: `.github/workflows/ci.yml` lines 307–349 define the `load` job on `ubuntu-24.04`, with the PostgreSQL 16 service, the 10,000-account seed, `NODE_ENV=test`, `TZ=UTC`, and the fake transport's 50 ms acceptance wait.

That job has not run. This Windows host cannot substitute for it:

- Docker Engine and Docker Compose are not installed.
- No WSL distribution is installed.
- The repository has no Git remote, so GitHub Actions cannot be dispatched from this working copy.
- The development check ran twice on the native PostgreSQL instance and recorded **Verdict: FAIL — development check, not the registered verdict** (`reports/sc-009-load-development-2026-11-08.md`).

No limit in `scripts/load/auth-smoke.mjs` was lowered, no passing report was fabricated, and T254/T257 remain open. `reports/sc-009-load.json` (the registered report) is absent.

## 2. Evidence

The development check's runs are recorded in `reports/sc-009-load-development-2026-11-08.md` and its two JSON companions. Summary:

| Operation | Run 1 p50 / p95 (ms) | Run 2 p50 / p95 (ms) | Bound p50 / p95 (ms) |
|---|---|---|---|
| account_creation | 3773.1 / 4727.7 | 4365.1 / 6284.3 | ≤ 150 / ≤ 1,000 |
| sign_in | 1804.3 / 2437.9 | 2126.6 / 3309.8 | ≤ 150 / ≤ 1,000 |
| recovery | 1901.5 / 2395.6 | 2302.2 / 3309.9 | ≤ 150 / ≤ 1,000 |
| aggregate | 2045.5 / 4292.8 | 2530.7 / 5389.4 | ≤ 150 / ≤ 1,000 |

- Run 1 accepted 600/600 requests; run 2 accepted 599/600 (one `TIMEOUT` on account creation).
- Both runs passed the limiter probe: the 21st account-creation submission from a fresh origin received `429 RATE_LIMITED` with `Retry-After`.
- The work-only p95 bound is ≤ 250 ms; the development host's sign-in work alone exceeds it.
- The profile performs 800 scrypt operations in the 60-second window (13.3 hashes/second) at CMV row 2's cost (N = 32768, r = 8, p = 3). This CPU sustains about 8.6 hashes/second; one hash takes about 0.40–0.44 s. A single sign-in verification therefore exceeds the p50 bound independently of queueing.

The development host is Windows 10.0.19045, Intel Core i7-4790 (4 cores / 8 logical), 21 GB RAM, Node.js v22.23.4, PostgreSQL 17.11. It is not the registered Linux measurement class.

## 3. Decision requested

The repository owner must choose one of two permitted resolutions.

### Resolution A — provide the registered runner (preferred)

Provide the registered `ubuntu-24.04` runner, or an equivalent Linux host, and run the `load` job (or the same profile on that host). Attach the generated `reports/sc-009-load.json` with:

- 200 accepted requests per operation and zero refusals;
- p50 ≤ 150 ms and p95 ≤ 1,000 ms;
- the work-only p95 ≤ 250 ms;
- the slowest query;
- the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`;
- the run's host, identifier, and environment in the report and the acceptance bundle.

This preserves SC-009's registered measurement, the scrypt profile, and the p50 bound.

### Resolution B — change the governing profile

If the registered runner also cannot meet both bounds, approve a governing change to the scrypt profile or the p50 bound. The change requires its own ADR and corresponding updates to the specification, the plan, and the Constitution Mandated Values before the profile is rerun. It must not be implemented by lowering a limit in `scripts/load/auth-smoke.mjs`.

This is a product and security decision: the scrypt profile is the credential-storage cost, and the p50 bound is a published performance commitment.

## 4. What is explicitly not permitted

- Lowering a limit in `scripts/load/auth-smoke.mjs` or any other measurement script.
- Marking T257 or T254 complete without a passing registered verdict.
- Copying a development report to `reports/sc-009-load.json`.
- Treating the Windows development host as the registered measurement host without a governing record.
- Reporting SC-009 as met while R1's acceptance condition 4 remains open.

## 5. Decision record

To be completed by the repository owner:

- Selected resolution: [X] A — registered runner; [ ] B — governing profile change
- ADR (required for B): not applicable — resolution A was selected, so no profile
  change and no ADR
- Decision date: 2026-11-10
- Owner: repository owner (decision selected in the 2026-11-10 implement session)
- Next action and date: provide the registered `ubuntu-24.04` runner (or an
  equivalent Linux host) and run the `load` job — or the same profile on that
  host — then attach the passing `reports/sc-009-load.json` (200 accepted
  requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the
  work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission
  `RATE_LIMITED` probe with `Retry-After`), recording the run's host,
  identifier, and environment in the report and the acceptance bundle —
  pending at this decision record, owned by the repository owner (entered
  2026-11-10; T272 carries the execution)

## 6. Report trail

- `reports/sc-009-load-development-2026-11-08.md` — the development check and its FAIL verdict.
- `reports/sc-009-load-development-2026-11-08.json` and `reports/sc-009-load-development-2026-11-08-clean.json` — the two runs' data.
- `.github/workflows/ci.yml` lines 307–349 — the registered `load` job on `ubuntu-24.04`.
- `specs/001-identity-foundation/tasks.md` T254, T257, T260, T272.
- `specs/001-identity-foundation/plan.md` → The SC-009 load profile; R1's acceptance condition 4.

## 7. Host re-check — 2026-11-10 implement session

Resolution A's precondition was checked again before any run: `docker` is still
absent from `PATH`, `wsl -l -v` reports "no installed distributions", the
repository still has no Git remote (`.git/config` carries `core` and `user`
only), and `gh` is absent. No registered `ubuntu-24.04` runner and no equivalent
Linux host is reachable from this working copy, so the `load` job cannot be
dispatched and `reports/sc-009-load.json` cannot be produced here.

The hardware bound is independent of the operating system: a single-threaded
`crypto.scryptSync` at CMV row 2's cost (N = 32768, r = 8, p = 3) measured
2.50 hashes/second on this `Intel Core i7-4790`; the development check's best
multi-threaded figure was 8.6 hashes/second against the profile's 13.3 required
in its 60-second window, so even a Linux guest on this CPU could not meet the
p50 bound. A passing verdict needs different hardware, not a different host
image.

T254, T257, T261, T262, T267, T270, and T272 stay open: no limit was lowered, no
development run was promoted to the registered verdict, and no report was
fabricated. The Phase 25 convergence pass re-checked the host and appended T272
with the same blocker, so the decision recorded in §5 stands and its next action
moves to whoever provides the runner.
