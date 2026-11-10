# Wafar (وفر)

An Arabic-first (RTL) platform that turns supplier parts catalogs (Excel, PDF,
Word) into one searchable catalog for Libyan merchants. It is a catalog: it does
not sell, buy, process payment, or host user-to-user chat.

**Status**: R1 (Identity and Foundation) is implemented. The workspace, the UI
layer, the three bare identity pages, the API's identity surface, and the
continuous-integration gate exist and run; later slices build on them.

## Documentation map

| Document | Purpose |
|---|---|
| `.specify/memory/constitution.md` | Engineering law, product scope, and limits. Supersedes every other document. |
| `Core-Project.txt` | Product definition: roles, permissions, pages, file processing, acceptance criteria. |
| `Project-Technologies.txt` | Mirror of the approved technology register. The register itself is `.specify/memory/constitution.md` → Technology Standards. |
| `docs/CHANGELOG-mirror.md` | The mirror's historical amendment blocks, split out of `Project-Technologies.txt` (ADR-075). History, not a source of rules. |
| `docs/architecture.md` | Repository layout, API module map, data flow. |
| `docs/domain-model.md` | The data model: entities, relationships, cardinality, invariants, and the module that owns each. |
| `docs/capacity-model.md` | The six-month load and ingestion envelope, the quota model, the deployment shape, and the verification plan (ADR-117, ADR-119, ADR-121, ADR-122). Planning authority; the constitution wins on every conflict. |
| `docs/pdf-sample-analysis.md` | The preliminary 19-file PDF sample evidence: size, pages, text-layer quality, rows per page, OCR benchmark, and extraction problems (ADR-119). Evidence, not a source of rules. |
| `docs/design/` | The Precision design contract's slice map and reference screenshots: 17 slices and 28 pages, with the 11 administrator pages marked as composed from the contract (ADR-128, ADR-129); the adopted departures — part-family cards, the retention trigger, and the shell's scroll-hide bar — are ADR-130, ADR-131, and ADR-132; the outline icon cut and the light default are ADR-137. Reference, not a visual baseline. |
| `docs/DECISIONS.md` | The decision register's index and reading protocol (ADR-001 … ADR-161); the records with their alternatives and rationale live in `docs/decisions/volume-NN.md`. |
| `ROADMAP.md` | The MVP slice order. Names and orders slices; does not design them. |
| `AGENTS.md` | Operating instructions for agent assistants. |
| `governance-drift-check.mjs` | The committed read-only drift check: the two version sources, every live ADR range string, the decision-register volumes and their caps, the upstream manifest hashes, the two integrations, the structural counts the governance text states in prose, the design evidence's registration and citation, the template load map, the ADR index's constitution-version column, and the absence of the removed stylesheet and its constitution section. Runs on commit via `.githooks/pre-commit`; run it directly with `node governance-drift-check.mjs`. |

## Prerequisites

- Node.js — the version `.nvmrc` pins (Node 22 LTS) — and pnpm (the monorepo is
  pnpm workspaces + Turborepo).
- The Spec Kit CLI (`specify`), which drives the specification workflow.
- Docker is optional and used only for staging parity.

## Development workflow

This repository is driven by Spec Kit. With `.specify/` present and the
`specify` CLI installed:

1. `/speckit.constitution` — amend or ratify the project constitution.
2. **Automatic: `/speckit.git.feature`** — the `git` extension's mandatory
   `before_specify` hook creates a sequentially numbered feature branch
   (`001-feature-name`, matching `feature_numbering: sequential` in
   `init-options.json` at `.specify/init-options.json` and ADR-015) and switches
   to it before specification.
   **Optional:** `speckit.assess.intake` (the `assess` extension) may prompt
   before specification to normalize a raw idea into an intake note.
3. `/speckit.specify` — write the feature specification (technology-agnostic).
4. `/speckit.clarify` — resolve ambiguities in the specification.
5. `/speckit.plan` — produce the technical plan, research, data model, and contracts.
6. `/speckit.checklist` — review the feature's requirements checklist.
7. `/speckit.tasks` — generate the ordered task list.
8. `/speckit.analyze` — run the cross-artifact consistency check.
9. `/speckit.implement` — execute the tasks.
10. `/speckit.converge` — verify the implementation against the artifacts;
    repeat steps 9–10 until it reports Converged (see ADR-013).

Templates resolve from `.specify/templates/overrides/` first; those overrides are
the project's binding templates and must not be replaced with the core ones.

**Governance drift check.** `node governance-drift-check.mjs` (repository root)
verifies the invariants the governance set cannot verify by discipline: the two
version sources including the amended date, every live `ADR-001 … ADR-161` range
string (in the required files, in the top-level `docs/` files, in the two Arabic
mirrors, in the template overrides, and in the feature specifications), every ADR
index row's anchor against its heading in the volume that holds it and every
heading against the index, every volume's ADR continuity and the volume and index
size caps, every `ADR-NNN` reference against the index, the ADR list in
`Project-Technologies.txt`'s header, the upstream manifest hashes in both
directions, the two integrations' byte-identity (their command directories, and
each integration manifest against the tree it records and that integration's whole
command directory), the absence of the removed stylesheet and its constitution
section, the integration topology across `integration.json`, `init-options.json`, the
integration directories and the bundled workflow, the
structural counts the governance text states in prose, the ADR index's
constitution-version column against the footer's version, every ADR enumeration
against the one the check's own header carries, the contiguity of
`Project-Technologies.txt`'s header list, the Constitution Mandated Values count,
every entity's owning module across the register and the domain model, and every
specification's `FR-###` / `AC-###` / `SC-###` integrity. It is read-only, adds no
dependency, and exits non-zero on
drift (ADR-071, ADR-072, ADR-073, ADR-074, ADR-075, ADR-080, ADR-082, ADR-083, ADR-086, ADR-088, ADR-092, ADR-093, ADR-096, ADR-097, ADR-098, ADR-099, ADR-100, ADR-101, ADR-102, ADR-103, ADR-104, ADR-105, ADR-106, ADR-125, ADR-133, ADR-136, ADR-140).
It runs on commit through the committed `.githooks/pre-commit` hook; enable it per
clone with `git config core.hooksPath .githooks`.

**Project-level knowledge is not a feature.** The constitution, the
architecture, the data model, the technology stack, the UI foundation rule, the
product definition, and the accepted decisions live outside the feature
sequence and never take a feature number. See `AGENTS.md` §2 and
`docs/DECISIONS.md` → ADR-007.

**The data model has one authority.** `docs/domain-model.md` holds the logical
model — entities, relationships, invariants, owning module. The constitution's
Product Register maps it. Column types and the physical schema are not in
either: they are the owning module's `packages/db/schema/<module>.ts` and the
owning feature's `specs/[###-feature]/data-model.md`. A feature that adds an
entity, a relationship, or an invariant amends the register and records an ADR;
a feature that adds a column owns it in its own data model and migration.

## Setup, testing, and deployment

### Setup

- Node.js 22 LTS (the version `.nvmrc` pins) and pnpm 10.18.3
  (`packageManager` in `package.json`).
- `pnpm install --frozen-lockfile` — the only step that uses the network.
- Copy `.env.example` to `.env` and fill `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `WEB_ORIGIN`. The SMS transport
  defaults to `fake` with `SMS_FAKE_ACCEPT_MS=0`; Twilio is selected only when
  its credentials are set.
- PostgreSQL 16: a local server, or `pnpm db:up` where Docker is available.
  Apply the migrations with `pnpm db:migrate`; `pnpm db:reset` and
  `pnpm db:seed` are the development helpers.
- `pnpm dev` starts the API (`apps/api`) and the web app (`apps/web`) through
  Turborepo.

### Testing

| Command | What it runs |
|---|---|
| `pnpm test` | every unit and layer project |
| `pnpm test:integration` | the API integration suites against `DATABASE_URL` — one database, files serialized |
| `pnpm test:enumeration` | the timing suites, coverage off and serial, on the committed fixed fixture |
| `pnpm test:e2e` | Playwright on the production build: the journey, accessibility, and visual projects against the fake transport and the local database |
| `pnpm test:a11y` / `pnpm test:visual` | axe over the 32 delivered states (128 scans) and the committed 128 baselines plus three reflow captures, on the same production build |
| `pnpm test:coverage` | the combined V8 run that feeds the 80% changed-line gate |
| `pnpm load:seed` / `pnpm load:auth` | the SC-009 load fixture and the load run; the registered verdict is the `load` CI job on `ubuntu-24.04`, and a run anywhere else is a development check |
| `pnpm lint` / `pnpm typecheck` | ESLint, the module-header check, the test-environment check, the dependency budget, and `vue-tsc` |

The three Playwright classes serve the production artifacts — `apps/web/.output`
and `apps/api/dist` — and never a development server, so run `pnpm build` after
any change to the API or the web app before `pnpm test:e2e`, `pnpm test:a11y`,
or `pnpm test:visual`. Each class starts and stops its own servers; the visual
suite writes a new baseline only with `--update-snapshots`.

Integration suites read `DATABASE_URL` and skip with a warning when it is
missing, rather than passing silently. `NETWORK_TESTS=1` opts in a `@network`
suite and CI never sets it; `pnpm install --frozen-lockfile` stays the only
networked step. `ENUMERATION_SAMPLES` shortens the enumeration run locally; the
verdict run uses the fixed 200 samples.

The SC-009 verdict is the `load` CI job's run on `ubuntu-24.04`, which writes
`reports/sc-009-load.json` and attaches it to the run as `sc-009-load`. A run on
another host is a development check, not the verdict:
`reports/sc-009-load-development.json` records the 2026-11-07 Windows run, which
verified the 10,000-account fixture, the 300 → 500 session ceiling, the planned
rate-limit counters, and the limiter probe, but not the latency budget — one
scrypt verification (CMV 2) takes about 364 ms on that four-thread host, above
the 150 ms p50 target before any queueing.

### The coverage gate (T155)

A change fails when fewer than **80% of the measurable changed production
lines** are covered, measured against the revision the branch was created from
(`COVERAGE_BASE`, or `git merge-base HEAD origin/main`). A measurable line is an
added line that carries a `DA` record in the V8 lcov report; comments, blank
lines, type-only declarations, and files the coverage configuration does not
instrument are not measurable. Files with no coverage record (tests, tooling,
configuration, and the generator's inputs) are listed under `excluded` with
their reason, not priced at 0%. A measured file with `DA` records and no hits
stays in the denominator at 0%. Generated code, migrations, and snapshots are
excluded as classes; the frame's page-level runtime is excluded only by
`EX-007`. A run with no changed `.ts`/`.vue` files reports "nothing to measure";
if uncommitted source exists, the gate fails rather than reporting a 0/0 pass.
`scripts/check/coverage-gate.mjs` writes `coverage/changed-lines.json` — the
diff baseline, the physical changed-line count outside the class exclusions,
the measurable changed-line count, the covered count, the percentage, the
unmeasured-line counts, and every excluded path with its reason and exception
row — and the `coverage` CI job attaches that report and `coverage/` to the
run.

**R1's acceptance MUST NOT be recorded while this gate fails.** The threshold
has an enforcement moment and an artifact, not only a measurement: the gate
blocks the change, and the attached report is the evidence the acceptance
review reads.

### Checkpoint A→B (T029, ADR-139)

Recorded and green before any identity scenario ran: the workspace, the UI
layer, the shared scaffolding (the bare layout, the step state machine, the
message mapping, the shared code step, and the password-change service), the
tooling (including the OpenAPI generator and the data-access layer — the Drizzle
client, the unit of work, and the migrator command), and the CI gate are
accepted. The checkpoint accepts no table and no migration: the six tables and
the first migration are B1's (T030–T032). No identity requirement is verified
before it passes.

### Quickstart §3 scenarios (T123)

Each scenario `specs/001-identity-foundation/quickstart.md` §3 lists, closed by
§7 at Scenarios 1–15, was run against the implemented workspace on 2026-11-07;
Scenario 1's SQL checks read the five tables and the account row as the
document records them. Every assertion is held by the suite beside it, and all
of them pass locally:

| Scenario | Verified by |
|---|---|
| 1 — Sign-up, verification, and the in-place confirmation | `apps/api/test/integration/auth/sign-up.spec.ts` (the five-table counts and the account row) |
| 2 — The number already has an account | `apps/api/test/integration/auth/sign-up.spec.ts` |
| 3 — Blocked and administrator numbers at sign-up | `apps/api/test/integration/auth/sign-up.spec.ts`, `administrator-refusal.spec.ts` |
| 4 — Format and normalization | `packages/shared/src/normalize/__tests__/`, `sign-up.spec.ts` |
| 5 — Password policy | `apps/api/src/modules/auth/service/__tests__/password-policy.spec.ts`, `refusal-order.spec.ts` |
| 6 — The honeypot and the minimum time | `apps/api/test/integration/auth/sign-up-abuse.spec.ts` |
| 7 — Rate limits | `apps/api/test/integration/auth/rate-limits.spec.ts` |
| 8 — Sign-in and the uniform refusal | `sign-in.spec.ts`, `enumeration.spec.ts` |
| 9 — Ending sessions | `sessions.spec.ts`, `revoke-session.spec.ts` |
| 10 — Recovery | `recovery.spec.ts` |
| 11 — One-time-code rules | `repeated-requests.spec.ts`, `refusal-race.spec.ts`, `clock-bounds.spec.ts` |
| 12 — Forgery, headers, and encoding | `transport-refusals.spec.ts`, `security.spec.ts` |
| 13 — Merchant scope | `apps/api/test/integration/http/isolation.spec.ts` |
| 14 — The frame's composition | `packages/ui/tests/shell/**` |
| 15 — The copy, as recorded | `apps/web/tests/unit/user-facing-strings.spec.ts` |

### Deployment

`pnpm build` produces the API and web artifacts through Turborepo, and
`pnpm sbom` writes the CycloneDX inventory. The continuous-integration pipeline
runs the governance check, lint and type-check, the unit and integration suites,
the enumeration protocol, the coverage gate, the SC-009 load run,
the end-to-end, accessibility, and visual suites, Lighthouse CI, the SBOM, and
the security scan. A release applies
the committed migrations before the listener opens — the boot-time schema guard
refuses an unmigrated database — and `/health` answers 200 once the database is
reachable. Backups and the restore drill are `docs/runbooks/backup-restore.md`.

