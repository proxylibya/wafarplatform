## ADR-139 — The audit repair set: the foundation boundary, the frame, and traceability

**Status**: Accepted — 2026-10-29. **Constitution version**: 6.2.1 (unchanged)
**Owning directory**: `ROADMAP.md`, `docs/`, `docs/decisions/`, `docs/design/`,
`specs/001-identity-foundation/`, `.specify/templates/`, `governance-drift-check.mjs`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** A deep read of the slice order and of R1's specification on
2026-10-29 found nineteen defects that the drift check cannot see, because it
verifies structure and not meaning. They fell into six groups. R1's boundary was
named two ways — "the pre-R1 foundation" and "R1's foundation phase" — so the
same work was read as work before R1 and as a phase of R1 (defect 1). The
mandatory security controls of the first browser-facing feature sat in US7 at
P3, while the P1 set ships that feature (defect 2). US5's frame was verified
structurally only, and its Independent Test says so, which strains Principle
VIII (defect 3). The specification named R4 as the first page carrying the
frame, while the Upload Catalog page of R2 is (defect 4). `Session` is a
merchant-scoped table created and read by R1, but the shared scoping entry point
and the isolation test were assigned to R2 (defect 5). The frame's fixed nine
destinations and R2's duplicate link point at pages that ship later, and neither
window was recorded (defects 6 and 7). The rest were traceability defects: R13's
concentration had no declared risk, the notifications control was owned twice,
the open-questions note still listed a point ADR-131 had fixed, the
specification claimed an amendment ADR-105 had already made, its binding block
omitted the slice map and the roadmap, the checklist predated the last
clarification session, the slice-numbering invariant was unenforced, and the
coverage and scale deviations were unrecorded.

**Affected principles and in-flight work.** Principle VIII is met by exception
`EX-007` rather than by a plan row, because it is NON-NEGOTIABLE. Principle III's
coverage rule and the capacity model's envelope are deviated from in two places,
and the deviations are handed to R1's plan as Complexity Tracking rows. Principle
VII's ban on technical detail in a specification is honoured by removing three
storage phrases. No clause of the constitution changes, so the version stays
6.2.1. R1 is the only in-flight feature; its plan is not blocked.

**Decision.**
1. **One name for R1's foundation work.** The phrase "pre-R1 foundation" is
   retired. The work is **R1's foundation phase**: a phase of R1's plan, never a
   slice, never work that precedes R1. It ends at a hard checkpoint — the
   workspace, `packages/ui`, the tooling, and the continuous-integration gate are
   accepted and recorded before the identity work begins — and no identity
   requirement is verified before that checkpoint passes. ADR-015's alternatives
   list is annotated, not rewritten: its first alternative states the risk the
   decision accepted (that folding the foundation into identity makes the
   boundary unreviewable), and the foundation phase with its checkpoint is the
   mitigation.
2. **US7 is P1.** The rate limit, the hidden field, the minimum time-to-submit,
   request-forgery protection, output encoding, and the security headers are the
   control set the constitution requires of the first browser-facing feature, so
   they gate the P1 checkpoint. The story keeps its position and its identifiers;
   priority, not order, is what changed.
3. **R2 is the first page that carries the frame,** and R1's structural-only
   verification of US5 is recorded as `EX-007`, with the repository owner as
   approver and 2026-12-01 as the review date. The exception ends when R2
   verifies the frame's runtime, its accessibility scan, and its keyboard-only
   pass on a rendered page.
4. **The frame's composition stands as ADR-099 and ADR-102 fixed it.** The nine
   sidebar destinations, the five bottom-bar slots, and the four static-page
   links stay fixed in R1, and so do Home's nine destination cards in R5. The
   window in which those links point at pages that do not exist yet is recorded
   as defect 19 in the roadmap, closed by R10, and R2's duplicate link to the
   Parts page is defect 20, closed by R5. The list is not grown slice by slice:
   one composition with one structural assertion is what the shell's decisions
   describe, and a partial list would move the assertion into every later slice.
5. **`Session` is scoped where it is created.** R1 gains FR-053 and AC-056: every
   merchant-scoped read and write passes through the single shared entry point,
   and an automated test fails when the scope is removed. The two roadmap
   obligations that assigned the entry point and the isolation test to R2 move to
   R1, and R13 ratifies the permission model on the same entry point.
6. **R13's concentration is a declared risk, not a design defect.** Its ten
   administrator pages, the write surface, and the audit record cannot be split
   without leaving a window in which an administrator operation is unrecorded, so
   the roadmap records a procedural mitigation with the repository owner and the
   same 2026-12-01 review date.
7. **The account fields are ADR-105's.** The `User` row and `docs/domain-model.md`
   already carry the failed-attempt count, the lock's expiry, and the
   forced-change requirement. R1 implements them and makes no second amendment,
   and its plan cites ADR-105.
8. **Traceability repairs.** The binding block of a feature specification names
   the slice map and the roadmap, as ADR-134's template already does. R1 owns the
   notifications control and R9 the unread counter. The open-questions note drops
   the point ADR-131 fixed. A slice is created in numeric order or with
   `GIT_BRANCH_NAME=<R#>-<slug>`, so the number cannot drift from the roadmap's
   identifier. The two deviations — the frame's runtime coverage exclusion and
   the 10,000/500/10 measurement ceiling against the capacity model's envelope —
   are stated where the specification states them and handed to R1's plan as
   Complexity Tracking rows.

**Alternatives considered.**
- *Leave the foundation boundary as it was.* Rejected: two names for one phase
  are read as two phases, which is the defect, and a checkpoint is the only
  instrument that makes the phase's end reviewable.
- *A pre-feature bootstrap outside the numbering, then a lean R1.* Rejected: it
  supersedes ADR-015's decision, and it would withdraw a dozen acceptance
  criteria from the only specification that carries the frame's contract.
- *Two numbered features, renumbering R2–R15.* Rejected: ADR-007's prohibition
  and ADR-015's identifier alignment both forbid it.
- *Move US5 to R2.* Rejected for the same reason as the bootstrap: the frame's
  composition is decided in R1 and consumed by every later slice, and splitting
  one decision across two specifications leaves neither the owner of the
  composition nor the proof of its runtime.
- *Grow the navigation list as each page ships.* Rejected: it weakens a testable
  assertion to a moving one and makes every later slice edit the frame.
- *Record the coverage and scale deviations only in the plan.* Rejected: the plan
  does not exist yet, and the specification is where a reviewer meets them.

**Consequences and migration/backfill.** `ROADMAP.md` retires the phrase
"pre-R1 foundation", gains defects 19 and 20, R13's declared risk, the
slice-numbering rule, and the query-count note. R1's specification gains FR-053
and AC-056, raises US7 to P1, cites `EX-007`, names R2 as the first frame page,
cites ADR-105 for the account fields, and carries the two deviations. The slice
map names R2 as the first frame page and its handoff is refreshed. The exception
register gains `EX-007`, so the drift check's exception-row count moves from six
to seven. The live range strings move to ADR-139 and `Project-Technologies.txt`'s
header list gains 139. No code, schema, or migration exists, so no backfill is
required. Review date: 2026-12-01.

---

## ADR-140 — The admin slice split: the gate slice, the recorder, and two consumers

**Status**: Accepted — 2026-10-29. **Constitution version**: 6.2.2
**Owning directory**: `ROADMAP.md`, `docs/`, `docs/decisions/`, `docs/design/`, `.specify/memory/`, `specs/001-identity-foundation/`, `governance-drift-check.mjs`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** R13 carried ten administrator pages, the administrator's write surface over `PlatformSetting`, the audit record every administrator operation writes, and nine dependencies. ADR-139 recorded the concentration as a declared risk with a review date of 2026-12-01. A deep read of the slice order found that the reason ADR-139 gives for keeping the block whole — that no administrator operation may exist before it can be recorded — constrains the ORDER of the work, not its grouping: the recorder must precede the first write, and every later administrator slice may consume it. The same rule the roadmap already applies to the catalog-delete cascade (defect 18) applies here. The read also found that the block's dependency set was inflated by pages that read or write nothing at the gate: the Users page and the Settings page need `users` and `PlatformSetting` only, so a gate slice can ship on R1 and R11 and unblock the rest of the application early. Three latent conflicts surfaced with it: the slice map asked for a Dashboard of cards while the Product Scope admits a table only; the administrator page table offers a manual part add while the domain model says a part belongs to exactly one catalog; and nothing forbids blocking the single administrator account, which has no recovery path. A fourth finding is structural: `volume-08.md` is 103,451 bytes and passes the volume cap only because it is the register's last volume, so no ninth volume can exist until one of its records moves.

**Decision.**
1. **The administrator block is four slices.** R13 is the gate: the separate application, its shell, the administrator's login, the `AuditLog` recorder, the `AuditLog` table in the `admin` module, the Settings write surface and the Users operations (view, block and unblock, soft-delete, per-user quota override). R14 remains the read page over the record. R16 is the catalog domain (Files, Suppliers, Parts). R17 is communication and oversight (Messages, Notifications, Contact messages, Dashboard). R15 is untouched.
2. **Dependencies.** R13 depends on R1 and R11 only; R14 on R13; R16 on R13, R2, R3 and R4; R17 on R13, R9, R10, R11, R2, R3 and R5.
3. **The recorder is written once.** R13 creates it; R16 and R17 reuse it and each proves every write with a recorded row in its acceptance criteria.
4. **Ownership.** The `admin` module and `packages/db/schema/admin.ts` are created by R11 for the `PlatformSetting` read and extended sequentially by R13, R16 and R17; the roadmap's ownership rows name all four.
5. **The administrator cannot lock the platform out.** R13 forbids blocking or soft-deleting the account holding the administrator role, and adds no way to create a second administrator. No page, entity, feature or role is added: the rule forbids an operation the register never grants.
6. **The Dashboard is a table.** Every data view is a table and only Home composes cards; the slice map's "Dashboard cards" is corrected.
7. **The manual part add names an existing catalog.** A part is never stored without one.
8. **Consumers implement reserved decisions.** R16 and R17 implement R10's sender representation and administrator reference, R9's notification retention, and R11's contact-message status and note; they decide no reserved fact.
9. **The register's ninth volume opens with ADR-139.** `volume-08.md` is 103,451 bytes and passes only as the last volume; adding a volume makes it non-last and over the 100,000-byte cap. ADR-139 moves verbatim into `volume-09.md`, its index href moves with it, and ADR-140 follows it. No record is rewritten.
10. **Constitution 6.2.2 (PATCH).** One References row names seventeen slices instead of fifteen. No principle, section, register, page, feature, entity, role or usage limit changes.
11. **Alternatives are recorded** because the slice order is a structural decision, although this record's subject is the process.

**Alternatives considered.**
- *Keep R13 whole and phase it inside one plan.* Rejected: the specification would still carry ten pages and roughly two hundred requirements, its `/speckit.clarify` cost is paid once and in full, and the concentration ADR-139 declared would be managed rather than removed.
- *Renumber R14 and R15 to make the block contiguous.* Rejected: it touches about twenty live references in eight files and forces annotations on historical records; ADR-139 already rejected renumbering.
- *Move the Users page to R16 to keep R13 minimal.* Rejected: eight passages of R1's in-flight specification bind the blocking act and the status transition to R13's Users page, and `Core-Project.txt` names R13 as the slice that grants the quota exception.
- *Keep the Dashboard cards and amend the Product Scope.* Rejected: the table rule is a product-wide constraint, and a card Dashboard sets a second composition precedent for one page.
- *Give R17 no dependency on R5.* Rejected: the Dashboard's fourth statistic has no entity until R5 decides where the counter is stored; the dependency makes the condition explicit instead of leaving a hole.

**Consequences and migration/backfill.** The roadmap gains two rows and loses none; R13, R14 and R11's scope text change; defects 4, 6 and 18 name their new closers; the release gate names four leaves. The slice map carries seventeen slices and twenty-eight pages, with the eleven administrator pages across four entries. The constitution moves to 6.2.2 and `version.json` with it. `docs/domain-model.md` and `docs/capacity-model.md` update their slice references. R1's specification changes one traceability sentence and its range string. The decision register opens `volume-09.md`; `volume-08.md` falls to 95,305 bytes. Every live range string moves to ADR-140, `Project-Technologies.txt`'s header gains 140, and the check's slice constant becomes 17. No code, schema, migration or data exists, so no backfill is required. Review date: 2026-12-01, and the tripwire is R17 above sixty functional requirements, which splits it into R17 and R18 with no renumbering.

**Annotation.** ADR-033 and ADR-109 name "R13's admin delete" as a consumer of the catalog-delete cascade; the consumer is R16, and the rule each states is unchanged. ADR-077 names R13 as the extender of the `admin` module; R13, R16 and R17 extend it, in that order. ADR-106 moves the administrator's reply to R13; the reply is R17's, and the rule that no administrator operation exists before it can be recorded is unchanged and is the reason R13 ships the recorder. ADR-139 decision 6 declares R13's concentration; the block is four slices and the declared risk is discharged by this split, with the same review date.

---

## ADR-141 — The transactional SMS transport: Twilio behind a port

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.2.2 (unchanged)
**Owning directory**: `apps/api`, `packages/shared`, `specs/001-identity-foundation/`
**Owning feature**: `001-identity-foundation`.

**Context.** Product Scope requires a transactional text message for three
purposes and no more: the sign-up verification code, the password-recovery code,
and the two security notices (a password change, and a sign-out of every
device). The
register's "Register gaps a slice MUST close" table assigned the provider choice
to R1 and forbade naming a provider in the register before the choice carried an
ADR, a licence-obligation record, and a vulnerability scan. ADR-030 rejected a
Libyan aggregator and required the authentication model to stay replaceable, so
the choice must sit behind an interface rather than be called from the flow.

**Decision.**

1. **Twilio Programmable Messaging** is the provider, called over its REST API
   through the `twilio` Node SDK (MIT). The `To` value is always E.164 and is
   always a +218 number, because registration is Libya-only and offers no
   dial-code selector (ADR-041).
2. **The channel is one-way and transactional.** Sign-up verification, the
   password-recovery code, and the two security notices are its only senders. It
   has no inbound path, no marketing use, no conversation, and no email
   fallback; the platform has no email channel.
3. **The provider sits behind an `SmsTransport` port.** The port takes
   `{ to, body, kind }` and answers `accepted | refused | timed_out`; the Twilio
   adapter is one implementation of it, in the `auth` module, and the flow calls
   only the port.
4. **The provider call has a 750 ms timeout, and a timeout is a refusal.** The
   sign-up and recovery flows already treat a refused send as a state they
   render, so an outage needs no second failure path. Twilio is an outbound
   channel, not a readiness dependency: `GET /health` probes PostgreSQL alone.
5. **Tests and CI use a deterministic fake transport.** No test reaches Twilio,
   no credential exists in the repository, and the two account values are read
   from the environment (the secret manager is R12's).
6. **Register-gap closure.** Licence obligation: Twilio's terms of service for
   the hosted service, and the SDK's MIT licence. Vulnerability scan:
   `osv-scanner` and `npm audit` over the committed lockfile, and Dependabot for
   the SDK. Review date: 2026-12-01.

**Alternatives considered.**

- *A Libyan SMS aggregator.* Rejected in ADR-030 for coverage and delivery
  evidence; the port keeps a later local provider a substitution rather than a
  rewrite.
- *Raw SMPP against a carrier.* Rejected: it adds a protocol implementation, a
  binding, and an operational relationship for a channel that sends three
  message kinds.
- *Calling the Twilio SDK from the flow.* Rejected: the flow would carry a
  vendor type, and the fake in tests would become a mock of the SDK instead of
  the port.
- *An email fallback.* Rejected: email is not a channel the product has, and a
  second channel widens the account-recovery surface for no requirement.

**Consequences and migration/backfill.** No schema, migration, or data change:
the pending request already carries the code and its state. The register gains
the Twilio row at 6.3.0 (ADR-146) and loses its transactional-SMS gap row. The
provider is replaceable behind the port, and its cost is per message. Review
date: 2026-12-01.

---

## ADR-142 — The backup and restore tooling: `pg_basebackup`, WAL archiving, and the sealed archive

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.2.2 (unchanged)
**Owning directory**: `scripts/backup/`, `docs/runbooks/`, `specs/001-identity-foundation/`
**Owning feature**: `001-identity-foundation`.

**Context.** Deployment and Observability requires a recovery time of four hours
and a recovery point of fifteen minutes, and it requires that a backup be proven
only by a restore. The register's gap table assigned the backup and restore
tooling to R1, the first slice that introduces persistent storage, and forbade
naming a tool before the choice carried an ADR, a licence-obligation record, and
a vulnerability scan.

**Decision.**

1. **PostgreSQL's own tooling.** A nightly `pg_basebackup` base backup plus
   continuous WAL archiving at an interval no longer than 60 s, restored with
   `pg_restore` and PostgreSQL's point-in-time recovery. No third-party backup
   product is introduced.
2. **Every archive is encrypted before it leaves the database host.** The
   wrapper under `scripts/backup/**` uses Node's built-in `crypto` with
   AES-256-GCM and no new dependency: each base backup and each archived WAL
   segment is sealed with a data key, and the data key is wrapped by a
   key-encryption key injected from the environment. The key is never stored
   beside the archive, and the variable is named in `.env.example` with no
   value; the secret manager itself is R12's.
3. **The drill is quarterly and restores into a clean container.** The drill
   proves the ciphertext decrypts, measures the restore against the four-hour
   recovery time and the fifteen-minute recovery point, and records its outcome
   in `docs/runbooks/backup-restore.md`. The drill's record is the evidence for
   the constitutional rule that a backup is tested only when it restores.
4. **Register-gap closure.** Version: the PostgreSQL 16+ tooling the database
   row already fixes; no separate floor. Licence obligation: the PostgreSQL
   Licence, permissive and BSD-style. Vulnerability scan: `osv-scanner` over the
   repository (no new package is added) and the official PostgreSQL 16 image
   pinned by digest and rebuilt on patch releases. Review date: 2027-01-31.

**Alternatives considered.**

- *A nightly `pg_dump`.* Rejected: it gives a recovery point of up to
  twenty-four hours, which is far beyond the constitution's fifteen minutes.
- *`pgBackRest` or Barman.* Rejected: each is a third-party tool with its own
  register gap, licence, and upgrade path, and neither serves a requirement this
  slice has.
- *WAL-G, for its native encryption.* Rejected for the same reason: native
  encryption removes the wrapper but opens a gap the wrapper does not need.
- *An unencrypted archive.* Refused by Deployment and Observability.

**Consequences and migration/backfill.** No schema or migration change. The
register gains the `pg_basebackup` + WAL archiving row at 6.3.0 (ADR-146) and
loses its backup-and-restore gap row. The repository gains `scripts/backup/**`,
the seal and restore wrapper, and a runbook. Review date: 2027-01-31.

---

## ADR-143 — The continuous-integration provider: GitHub Actions, offline by default

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.2.2 (unchanged)
**Owning directory**: `.github/workflows/`, `specs/001-identity-foundation/`
**Owning feature**: `001-identity-foundation`.

**Context.** Principle III's coverage gate and Dependency Governance both name a
CI gate, and Deployment and Observability requires the governance drift check to
run in continuous integration rather than only on commit. The register's gap
table assigned the provider choice to R1, "the slice that introduces the test
runner", and forbade naming one in the register before the choice carried an
ADR, a licence-obligation record, and a vulnerability scan.

**Decision.**

1. **GitHub Actions is the provider**, defined once in
   `.github/workflows/ci.yml`. Jobs: the governance drift check
   (`node governance-drift-check.mjs`); lint and typecheck; unit tests;
   integration tests against a PostgreSQL service with migrations and the flow
   suites; end-to-end tests (Playwright, the fake SMS transport, the
   accessibility scan, the visual baseline); the coverage gate at 80%; the build
   with its SBOM; and the vulnerability and SAST scans (`osv-scanner`, Semgrep
   OSS).
2. **The pipeline is offline by default.** Jobs run against local services and
   the deterministic fake SMS transport. The dependency-install step is the only
   networked step, and a test that needs the network is explicitly opted in and
   time-bounded.
3. **Actions are pinned by commit SHA.** Every action, first-party included, is
   pinned by full SHA rather than by tag, and Dependabot's `github-actions`
   ecosystem moves the pins. First-party actions are MIT; the hosted service is
   governed by GitHub's terms of service.
4. **A failing gate blocks the merge.** No job is allowed to continue on error,
   and a gate that is not yet switched on is recorded as a task, not as a
   `continue-on-error` step.
5. **Register-gap closure.** Licence obligation: GitHub's terms of service for
   the hosted service, with every first-party action used under MIT. Vulnerability
   scan: `osv-scanner` over the lockfile plus Dependabot over the pinned
   actions. Review date: 2027-01-31.

**Alternatives considered.**

- *One job that runs everything.* Rejected: a single job hides one failing gate
  behind another and lengthens the feedback loop.
- *A self-hosted runner.* Rejected: it adds a second service to operate and does
  not remove the dependency on the provider.
- *Another hosted provider.* Not chosen: it would need its own record, licence
  obligation, and scan, and it offers nothing this slice's gates require.

**Consequences and migration/backfill.** No schema or migration change. The
register gains the GitHub Actions row at 6.3.0 (ADR-146) and loses its
continuous-integration-provider gap row. Review date: 2027-01-31.

---

## ADR-144 — The SBOM generator: `@cyclonedx/cyclonedx-npm` per build

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.2.2 (unchanged)
**Owning directory**: `.github/workflows/`, `package.json`, `specs/001-identity-foundation/`
**Owning feature**: `001-identity-foundation`.

**Context.** Deployment and Observability requires each build to produce an
SBOM, and the Glossary fixes what an SBOM is. The register's gap table assigned
the generator to R1, the slice that establishes the release build, and forbade
naming one before the choice carried an ADR, a licence-obligation record, and a
vulnerability scan.

**Decision.**

1. **`@cyclonedx/cyclonedx-npm` generates the SBOM**, in CycloneDX JSON, from
   the committed `pnpm-lock.yaml`. One document is produced per build by the
   `pnpm sbom` script.
2. **The release job consumes it.** The document is attached to the release as
   an artifact and is review material, never a secret.
3. **No floor beyond the lockfile pin.** The tool is a build-time dependency
   pinned exactly in the lockfile; this record fixes no minimum version, and the
   lockfile is the version of record.
4. **Register-gap closure.** Licence obligation: Apache-2.0, a build-time tool
   that is never shipped to a merchant's browser and never imported into an
   application image. Vulnerability scan: `osv-scanner` and `npm audit` over the
   committed lockfile. Review date: 2027-01-31.

**Alternatives considered.**

- *A hand-written SBOM.* Rejected: it is not reproducible from the lockfile and
  drifts on the first dependency update.
- *No SBOM.* Rejected by the supply-chain rule.
- *A generator that reads `node_modules` only.* Rejected: the lockfile is the
  record of what a fresh install resolves, and the SBOM must describe that.

**Consequences and migration/backfill.** No schema or migration change. The
register gains the SBOM-generator row at 6.3.0 (ADR-146) and loses its
SBOM-generator gap row. Review date: 2027-01-31.

---

## ADR-145 — The automated accessibility checker: `@axe-core/playwright`

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.2.2 (unchanged)
**Owning directory**: `apps/web/tests/a11y/`, `specs/001-identity-foundation/`
**Owning feature**: `001-identity-foundation`.

**Context.** Principle IV requires an automated accessibility check, not only a
manual pass, and the register's gap table assigned the checker to R1. The check
must cover every rendered page state at the 320 CSS px reflow floor and at a
wide width, which a single-page audit cannot do.

**Decision.**

1. **`@axe-core/playwright` is the checker**, driven by the Playwright suite that
   already renders every state. It scans every page state at 320 CSS px and at
   1280 CSS px.
2. **The manual pass stays.** A keyboard-only pass is recorded in the pull
   request and kept in `apps/web/tests/a11y/keyboard-pass.md`; the automated scan
   supplements it and does not replace it.
3. **It is a dev-only CI gate and is never shipped.** Nothing from it enters an
   application image or a merchant's browser.
4. **Register-gap closure.** Licence obligation: MPL-2.0. The licence text is
   retained, and the source of any modified file is made available; the tool is
   not modified by this slice. Vulnerability scan: `osv-scanner` and `npm audit`
   over the committed lockfile. Review date: 2026-12-01.

**Alternatives considered.**

- *A manual-only scan.* Rejected: it does not satisfy Principle IV's MUST.
- *Lighthouse's accessibility audit alone.* Rejected: it audits a loaded page,
  not each state the step machine renders.
- *A browser-extension checker.* Rejected: it cannot run unattended in CI or
  fail a build.

**Consequences and migration/backfill.** No schema or migration change. The
register gains the `@axe-core/playwright` row at 6.3.0 (ADR-146) and loses its
automated-accessibility-checker gap row. This record is the one
`specs/001-identity-foundation/tasks.md` → T130 holds, so T130's register duty is
discharged and the task may be ticked when the checker is wired. Review date:
2026-12-01.

---

## ADR-146 — The Technology Standards amendment: R1's seven register gaps closed

**Status**: Accepted — 2026-10-30. **Constitution version**: 6.3.0
**Owning directory**: `.specify/memory/`, `docs/`, `docs/decisions/`,
`Project-Technologies.txt`, `README.md`, `AGENTS.md`, `ROADMAP.md`,
`docs/architecture.md`, `.specify/templates/overrides/`,
`specs/001-identity-foundation/`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** "Register gaps a slice MUST close" states that the owning slice may
use a gap's technology once the record exists, and that the register MUST be
amended to add it no later than that slice's acceptance. R1 owns seven gaps:
the transactional SMS transport, the continuous-integration provider, the icon
set, the typeface, the automated accessibility checker, the SBOM generator, and
the backup and restore tooling. R1's plan fixed all seven choices, and its
acceptance checkpoint is 2026-12-01. Five of the seven are technologies with no
row in the Approved register, so each needed a decision record before this
amendment: ADR-141 (Twilio Programmable Messaging), ADR-142 (`pg_basebackup` +
WAL archiving), ADR-143 (GitHub Actions), ADR-144
(`@cyclonedx/cyclonedx-npm`), and ADR-145 (`@axe-core/playwright`). The
remaining two are assets of the Wafar UI layer rather than register rows, and
ADR-098 and ADR-137 already record them.

**Decision.**

1. **Five rows join the Approved register.** Twilio Programmable Messaging
   (`apps/api`'s transactional channel, one-way only, ADR-141); `pg_basebackup`
   plus WAL archiving (the PostgreSQL 16+ tooling, ADR-142); GitHub Actions (the
   CI provider, first-party actions pinned by SHA, ADR-143);
   `@cyclonedx/cyclonedx-npm` (the build-time SBOM generator, ADR-144); and
   `@axe-core/playwright` (the dev-only accessibility gate, ADR-145).
2. **The version floors are the ones the plan fixes, and nothing beyond them.**
   `pg_basebackup` carries the database row's PostgreSQL 16 floor. Twilio,
   `@cyclonedx/cyclonedx-npm`, and `@axe-core/playwright` fix no minimum in
   R1's plan: each is pinned exactly in the committed lockfile, which is the
   version of record. GitHub Actions has no release to floor; its actions are
   pinned by commit SHA.
3. **Seven gap rows close.** The five technologies become register rows. The
   icon set and the typeface do not: they are assets of the Wafar UI layer
   (ADR-097), the layer records the family and the cut it consumes, and the
   register therefore stops carrying the two rows and points at ADR-098 and
   ADR-137 instead of restating the family or the cut.
4. **Constitution 6.3.0 (MINOR).** Guidance is materially expanded: the
   Approved register gains five rows, the gap table loses seven, and a reader
   can now name the five technologies instead of a pending choice. No principle
   is added, removed, or redefined, so the bump is not MAJOR. No text is merely
   clarified, so it is not PATCH.
5. **Every version site moves with it.** `.specify/memory/version.json` records
   6.3.0 and 2026-10-30; the index gains this row and the five before it; every
   live `ADR-001 … ADR-146` range string moves; `Project-Technologies.txt`'s
   header gains 141–146 and names 2026-10-30; and the mirror's technology rows
   and its stale "the CI provider remains a gap" sentence are corrected.
6. **What deliberately did not change.** No principle, product scope, product
   register, entity, page, feature, role, usage limit, dependency budget,
   exception row, or API module. No other technology is introduced, and the
   nine gaps R1 does not own stay open with their owning slices unchanged.

**Affected principles and sections.** Principle II (the strict typing the CI
gate enforces), Principle III (the coverage gate and the test runner), Principle
IV (the automated accessibility check), Principle V (the icon set and the
typeface), Principle IX (the UI layer's assets), Dependency Governance (the
licence obligations and the vulnerability scans), and Technology Standards (the
register and its gap table). No other section is touched.

**Impact on features already in flight.** R1's specification, plan, and tasks
already name all seven choices, so no requirement, acceptance criterion, or
ownership row changes; T131 is the task that produces this amendment, and T130's
register duty is discharged by ADR-145. R2 to R17 are unaffected: their gap rows
are unchanged, and no technology they were forbidden to use has become
available. `Project-Technologies.txt` and the range strings move in the same
change, so no feature artifact is left citing a stale range.

**Alternatives considered.**

- *Leave the gaps open until a later amendment.* Rejected: the register requires
  the amendment no later than the owning slice's acceptance, and R1's
  acceptance would then carry seven open gaps.
- *Add the five rows without their records.* Rejected by Dependency Governance
  and by the gap table's own process, which requires the ADR, the licence
  obligation, and the vulnerability scan before the technology may be used.
- *Make the icon set and the typeface register rows too.* Rejected: ADR-097 puts
  both in the Wafar UI layer, and a register row would create a second place
  that names the family and the cut.
- *A MAJOR bump.* Rejected: no principle is removed or redefined, so MAJOR would
  misstate the change and would force a re-evaluation of every in-flight feature.
- *A PATCH bump.* Rejected: five new approved technologies and seven closed gap
  rows are a material expansion of guidance, not a clarification.

**Consequences and migration/backfill.** The constitution moves to 6.3.0 and
`version.json` with it; `Project-Technologies.txt`'s header ends at 146; the
index's constitution-version column carries 6.2.2 (unchanged) for ADR-141 to
ADR-145 and 6.3.0 for this row. No code, schema, migration, or data exists, so
no backfill is required. Review date: 2026-12-01; the tripwire is a later slice
proposing a sixth row that R1's plan did not fix, which is a new gap row rather
than an annotation of this one.

---

## ADR-147 — The trade name's Arabic form: no diacritics

**Status**: Accepted — 2026-11-02. **Constitution version**: 6.3.1
**Owning directory**: `.specify/memory/`, `docs/`, `Core-Project.txt`,
`Project-Technologies.txt`, `specs/001-identity-foundation/`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** ADR-045 (constitution 2.18.2) made the diacritics of the Arabic
trade name mandatory: the Glossary read «وَفَّر» and said the wordmark and page
titles read «منصة وَفَّر». The design reference the R1 contract follows writes
the name «وفر» without diacritics, and the contract, the specification, the
quickstart, and the four SMS templates all carry that form.
`checklists/copy.md` CHK010 records the resulting conflict: one document imposes
a form the other artifacts refuse. The repository owner has decided the Arabic
form carries no diacritics, so the constitution is corrected rather than the
copy.

**Decision.**

1. **The Arabic trade name is «وفر».** The Glossary's Wafar row and the Product
   Fact Clarifications bullet state that the Arabic form carries no diacritics,
   and that the Latin «Wafar» carries none either. The wordmark and the page
   titles read «منصة وفر»; the trade name itself is «وفر».
2. **The rule is one form, in every context.** The wordmark, the page titles,
   the brand line, the sidebar's «بحث وفر» item, and the four SMS bodies carry
   the same unvocalised form; the mark differs from the in-sentence name only by
   the word «منصة», never by its diacritics.
3. **The amendment is PATCH.** The change corrects the written form of one
   product fact; no principle is added, removed, or redefined, and no guidance is
   expanded.
4. **Every version site moves with it.** `.specify/memory/version.json` records
   6.3.1 and 2026-11-02; the index gains this row; every live
   `ADR-001 … ADR-147` range string moves; `Project-Technologies.txt`'s header
   gains 147 and names 2026-11-02; and `Core-Project.txt`'s «اسم «وَفَّر»» is
   corrected to «اسم «وفر»».
5. **What deliberately did not change.** No principle, product scope, product
   register, entity, page, feature, role, usage limit, dependency, exception row,
   or API module. ADR-045 is kept as history and is not rewritten; its diacritics
   clause is superseded by this record. The contract's existing «وفر»
   occurrences are not edited, because they already carry the decided form.

**Affected principles and sections.** Glossary (the Wafar row) and Product Fact
Clarifications (the trade-name bullet). No other section is touched.

**Impact on features already in flight.** R1's specification, plan, tasks, and
contract already carry «وفر» throughout, so no requirement, acceptance
criterion, task, or ownership row changes; CHK010 in `checklists/copy.md` is
resolved by the amendment, and the specification's Clarifications record the
decision. R2 to R17 are unaffected.

**Consequences and migration/backfill.** The constitution moves to 6.3.1 and
`version.json` with it; `Project-Technologies.txt`'s header ends at 147; the
index's constitution-version column carries 6.3.1 for this row. No code, schema,
migration, or data exists, so no backfill is required. Review date: 2026-12-01;
the tripwire is a later document that reintroduces a diacritics rule for the
trade name, which is a new record rather than an annotation of this one.

---

## ADR-148 — The shared shell's name: one term, and `frame` as its accepted synonym

**Status**: Accepted — 2026-11-04. **Constitution version**: 6.3.2
**Owning directory**: `.specify/memory/`, `docs/`, `docs/decisions/`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** One concept carried two names. Product Scope introduces it as "the
product's shared shell" in the sentence that enumerates the header, the sidebar,
the footer band, and, below 1024px, the bottom navigation bar, and then calls the
same composition "the frame" twice in that section and once in Product Fact
Clarifications; ADR-127's title calls it "the frame"; R1's specification names it
"the frame" in FR-020 and through the shared-page-frame block (FR-020 to FR-025)
and the criteria that carry it; and the code R1's plan fixes names it `shell`
(`packages/ui/app/components/shell/`, `apps/web/app/layouts/shell.vue`,
`WfShellSidebar`). The Glossary's opening rule — a feature MUST use a term as
defined rather than a synonym for it — had no registered term to point at, so it
could not decide between the two words, and every new artifact was free to pick
either.

**Decision.**

1. **Shell is the approved term.** The Glossary gains one row defining the
   product's shared page composition and fixing **Shell** as its name. The row
   states the composition (the header, the sidebar, the footer band, and the
   narrow-screen bottom navigation bar) and where it is present and absent, and
   nothing else: the per-surface controls, the destinations, and the measurements
   stay where they already are (Product Scope, Product Fact Clarifications,
   ADR-099, ADR-102, ADR-127, ADR-128).
2. **Frame is an accepted synonym, not a second term.** The row names **Frame**
   as the same concept under a second word, confined to the text that already
   carries it — Product Scope, Product Fact Clarifications, ADR-127, and
   `specs/001-identity-foundation/` — and states that new text (a specification,
   a plan, a task, or a decision record) MUST use **Shell**. A synonym that may be
   introduced at will is a second term by another route, so the acceptance is
   bounded to existing text.
3. **The term follows the tree.** The code identifiers R1's plan fixes already
   read `shell`, so the approved term is the word a reader finds in the tree
   rather than the one they would have to translate. No path, component name, or
   route changes.
4. **Nothing else changes.** The amendment adds one Glossary row and moves the
   version. No principle, product-scope sentence, product-register row, entity,
   page, feature, role, usage limit, dependency, exception row, template heading,
   or API module is touched. Product Scope's "frame" sentences, Product Fact
   Clarifications' one, ADR-127's title, and the R1 specification are not
   rewritten: the synonym clause accepts them as written, and rewriting every
   occurrence to satisfy a name would edit artifacts the operator has already
   ratified for no product gain.
5. **The amendment is PATCH.** It registers a name for a concept the
   constitution already defines and records the synonym; it adds no principle and
   no section and expands no guidance. ADR-138 added two Glossary rows and moved
   6.2.0 to 6.2.1 on the same reading.

**Affected principles and sections.** Glossary only (one row, placed before
**Wafar UI layer**). No principle and no other section is touched.

**Impact on features already in flight.** R1's specification, plan, tasks,
contracts, and checklists keep every "frame" occurrence and gain no requirement,
acceptance criterion, task, or ownership row; the synonym clause is what keeps
them compliant. R2 to R17 are unaffected, and a new artifact that writes "frame"
is corrected to "shell" rather than amended.

**Consequences and migration/backfill.** The constitution moves to 6.3.2 and
`version.json` with it; the index gains this row with 6.3.2 in its
constitution-version column; every live `ADR-001 … ADR-148` range string moves in
the same change; and `Project-Technologies.txt`'s header ends at 148 and names
2026-11-04. No code, schema, migration, or data exists, so no backfill is
required. Review date: 2026-12-01. The tripwire is a new artifact that introduces
"frame" as if it were the term, or a proposal to rename the code paths to match
the synonym; either is a new record rather than an annotation of this one.

---

## ADR-149 — The silent hidden-field refusal: the unstored 202 and the resume read

**Status**: Accepted — 2026-11-05. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `apps/api/src/modules/auth/`, `apps/api/src/modules/users/`,
`apps/web/app/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** FR-029 requires the hidden `website` field's refusal to be silent:
a submission that fills it must receive the response a successful submission
receives, and must not learn from the answer that the platform noticed. A
refusal that is identical in text and status but faster, or that reveals the
detection by choosing a different page step, still tells the sender what
happened. The plan therefore fixed two separate mechanisms — an answer that
chooses no step, and a duration bound — and left their exact form to the
implementation record (plan, records 15 and 16; T142).

**Decision.**

1. **The answer is an accepted submission's 202, with an unstored identity.**
   A filled hidden field receives `202` with a generated `requestId`, a
   generated resume token, and the same expiry fields an accepted dispatch
   returns. Nothing is written: no `phone_verifications` row, no code hash, no
   counter, and no message is sent.
2. **The page's step is decided by the resume read, never by the 202.** The page
   remembers the identifier and calls
   `GET /api/v1/auth/verifications/{requestId}`. A live row answers `200` and
   the page enters the code step; an unstored identifier answers `OTP_EXPIRED`,
   the page stays on `form`, renders no message, and never reaches the code
   step. The 202 alone chooses no step, so the silent refusal and a real
   submission are indistinguishable in the response.
3. **The refusal performs the same pre-dispatch work on a discarded copy.** The
   hidden-field path runs the code generation and the scrypt hash an accepted
   request performs, against a value that is discarded, so the work before the
   channel call matches. It then waits the channel's current acceptance
   duration — the median of the last sixteen accepted dispatches, capped at the
   adapter's 750 ms timeout — and only then answers.
4. **The bound is measured one-sided.** A timing comparison of the refusal
   against an accepted submission must satisfy median ≤ 50 ms and p95 ≤ 150 ms
   after a 20-request warm-up, so the sixteen-sample estimate has converged
   before measurement. The bound is an upper bound on the refusal's extra time,
   not an equality requirement on any single request.
5. **No state exists to observe.** The unstored identifier is not a pending
   request: a later read cannot revive it, a later submission replaces nothing,
   and no rate-limit or resend budget is spent by the refusal beyond the
   operation's ordinary spend, which runs before the hidden-field branch.
6. **Both halves are verified where they live.** The API half is T073's
   integration suite; the page half is T081's end-to-end suite; AC-031 carries
   the page clause, and T040 and T055 keep the in-progress and transition rules
   they already own.

**Affected principles and sections.** Principle III (the verification the bound
and the suites carry), Principle V (the SMS port and its acceptance estimate),
and FR-029, FR-031, FR-033, FR-038, and AC-031 in R1's specification. No
principle is added or redefined.

**Impact on features already in flight.** No requirement, acceptance criterion,
entity, page, API module, or ownership row changes. R1's suites gain the
executable form of the mechanism; R2 to R17 are unaffected because the guard is
the sign-up form's alone. The record adds no schema, route, or product surface.

**Alternatives considered.**

- *Answer with a different status or text.* Rejected: it reveals the detection
  the field exists to hide.
- *Store the unstored request so the page can enter the code step.* Rejected:
  that creates a pending request for a submission the platform refused, and the
  state becomes observable.
- *Skip the pre-dispatch work and the wait.* Rejected: the refusal would be
  measurably faster, and the silence would be broken by timing.
- *Wait a fixed duration.* Rejected: the channel's acceptance duration varies,
  and a fixed wait is either too short or adds latency the accepted path does
  not carry.
- *Let the 202 choose the code step directly.* Rejected: the page would enter a
  step for an unstored request, and the resume read's `OTP_EXPIRED` would then
  contradict the step.

**Consequences and migration/backfill.** No schema, migration, or data change.
The timing bound is evidence at R1's acceptance and a baseline for later
slices. Review date: 2026-12-01; the tripwire is a change to the silent path's
response shape, its pre-dispatch work, or its wait that is not measured against
this bound, which is a new record rather than an annotation of this one.

---

## ADR-150 — The copy's authority and its measurable bindings

**Status**: Accepted — 2026-11-05. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/shared/src/`, `packages/ui/`, `apps/web/app/`,
`apps/api/src/modules/auth/sms/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** R1's copy is fixed by `contracts/ui-contracts.md` §6 and by the
design reference, and three of its properties are measurable rather than
editorial: the SMS segment bound, the emoji predicate, and the numerals. Without
one recorded authority, a later edit could restate a number in a second place, a
runtime Unicode table could change a verdict silently, or a long template could
be truncated at the channel. The plan fixed the bindings and left their exact
form to this record (plan, records 16; T143).

**Decision.**

1. **The contract is the single record of the copy.** `contracts/ui-contracts.md`
   §6 holds the message table; the reference captures under `docs/design/` are
   evidence of composition and appearance only, never a second text source. The
   inventory is stated once in the contract, and a page renders a row rather
   than composing a sentence of its own.
2. **The SMS bound is a build failure, not a truncation.** A one-time-code body
   is UCS-2 and fits one segment: 70 UTF-16 code units after the code is
   substituted. A notice fits at most two: 134 code units. A template over its
   class's bound fails the unit suite before it can be dispatched; nothing is
   truncated, split, or sent in a second segment.
3. **The emoji predicate is pinned to Unicode 18.0.0.** The vendored
   `emoji-data.txt` (its SHA-256 recorded beside it) generates the range table
   the predicate reads; the runtime reads no Unicode table of its own, so a
   platform update cannot change a verdict. An upgrade that changes a verdict is
   the specification's amendment, not a dependency bump.
4. **The numerals have one source.** `packages/shared/src/limits.ts` supplies
   every number the copy slots; the contract marks each slot and its agreement
   class, and the copy check (`apps/web/tests/unit/copy-values.spec.ts`) and the
   rendered-string check (`apps/web/tests/unit/user-facing-strings.spec.ts`)
   hold the two directions. A number typed into a template or a test instead of
   slotted fails the check.
5. **The refusal catalogue and the copy stay closed.** The message table's rows
   are bound to the closed error-code union by T175's check, and SC-008's scan
   covers the static strings and the generated numerals. A new code or a new
   string is a contract change, not a page-local addition.
6. **No new surface.** The record adds no page, route, component, entity, or
   product feature; it records the bindings the existing copy already carries.

**Affected principles and sections.** Principle V (Arabic copy, no emoji, the
icon set), Principle VII (the specification stays technology-agnostic while the
contract carries the copy), and FR-026, FR-035, FR-038, FR-043, AC-028, AC-046,
and AC-047 in R1's specification. No principle is added or redefined.

**Impact on features already in flight.** No requirement, acceptance criterion,
page, entity, or ownership row changes. T143, T174, and T175 gain the executable
form of the bindings; R2 to R17 inherit the same contract and the same checks.
The record adds no dependency, no route, and no product surface.

**Alternatives considered.**

- *Restate the numbers in each template.* Rejected: two sources drift, and the
  copy check exists to prevent the second.
- *Read the runtime's Unicode tables.* Rejected: a platform update would change
  a verdict without a code change or a review.
- *Truncate a long SMS at the segment boundary.* Rejected: a truncated code or
  notice is worse than a build failure, and the bound is known before dispatch.
- *Treat the design captures as the text authority.* Rejected: a screenshot
  records appearance, and a change to the contract would be invisible in it.
- *Let each page compose its own refusal text.* Rejected: the catalogue's
  identity and the uniformity of the failure texts depend on one table.

**Consequences and migration/backfill.** No schema, migration, or data change.
The contract, the vendored data, and the two checks are the evidence at R1's
acceptance. Review date: 2026-12-01; the tripwire is a second text source, a
runtime Unicode read, a truncating dispatch, or a number typed outside
`limits.ts`, each a new record rather than an annotation of this one.

## ADR-151 — The identity flow's technical shape: better-auth's phone-number extension behind the auth module

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `apps/api/src/modules/auth/`, `apps/api/src/modules/users/`,
`packages/db/schema/`, `packages/shared/src/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 1 fixes the technical shape the identity flow is
built on. better-auth 1.6.14 is the credential and session engine, and the
constitution makes its phone-number extension mandatory unless an ADR records an
alternative. The shape has to keep the product's invariants — no account before
verification, one live pending request per number, the lock on the `users` row,
and the uniform refusal — while leaving password hashing, credential
verification, session issuance, and revocation in the library. It also fixes the
two modules' directory layout in R1, which deviates from `docs/architecture.md`
§1.1 and §2 and from Principle X's "Each module has its own routes, service, and
repository"; Complexity Tracking row 26 records that deviation.

**Decision.**
1. **The library is the engine, the module is the orchestrator.** better-auth's
   `phoneNumber` extension supplies the phone credential and the OTP hooks; the
   `auth` module's routes and services call `auth.api.*` server-side and enforce
   the product rules the library does not carry: the uniform refusal, the lock,
   the two-key rate limits, the transient code store, and the refusal order.
2. **One transient store.** `phone_verifications`, owned by `users`, is the only
   pending-request store: one row per normalized number, replaced in place,
   carrying the hashed code, the request expiry, the counters, the resume-token
   hash, and the sign-up payload. The library's `verification` table is created
   because its model set requires it and is asserted empty; no R1 path writes it.
3. **The reserved `email` placeholder.** better-auth's user model requires a
   unique `email`; R1 stores the canonical number without `+` followed by
   `@phone.invalid` (for example `218912345678@phone.invalid`), a reserved,
   non-routable value that is never displayed, never used for sign-in, never sent
   a message, and has no transport.
4. **The lock lives on `users`.** `failed_sign_in_count` and `locked_until` are
   written by `apps/api/src/modules/users/repository/user-lock.ts` through the
   port declared in `packages/shared`; the `auth` sign-in and password-change
   services call the port.
5. **The library's public HTTP routes are not mounted.** The extension's
   endpoints would bypass the rate limits, the honeypot, the refusal order, the
   lock, and the uniform timing work, so every public endpoint the pages call is
   an R1 route; the session cookie the library sets is forwarded by R1's route.
6. **The module layout.** `auth` ships `routes/` and `service/` with the
   library's adapter as its persistence; `users` ships `service/` and
   `repository/` and no HTTP route until the merchant profile surface (R7). The
   deviation from Principle X is recorded in Complexity Tracking row 26.

**Alternatives considered.**
- *Mount the library's `/api/auth/*` handler.* Rejected: the extension's
  endpoints would accept sign-up and sign-in requests that bypass the rate
  limits, the honeypot, the refusal order, the lock, and the uniform timing work,
  all of which the specification makes binding.
- *Use the library's `verification` table as the pending store and add a second
  table for the form details.* Rejected: two stores break the
  one-live-request-per-number invariant and the replacement rules, and the
  library's table is not specified to hold a hashed code or the form payload.
- *Record an alternative to the extension and keep only the core session
  engine.* Rejected: the extension provides the phone credential, the OTP hooks,
  and the phone+password sign-in path as maintained code, and the documented
  hooks cover every invariant; a future upgrade that removes a hook is the
  fallback trigger, not a silent fork.
- *A hand-written `auth/repository` and an empty `users/routes/`.* Rejected: the
  adapter already writes `accounts` and `sessions`, and an empty route directory
  is a public surface no requirement names.

**Consequences and migration/backfill.** No schema or data change beyond the
first migration. The library's `verification` table stays empty and is asserted
so. Review date: 2026-12-01; the tripwire is a mounted library route, a second
pending store, a displayed placeholder, or a second writer of the lock.

## ADR-152 — The city list and the mobile-prefix dataset: two committed reference files

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/shared/src/reference/`,
`apps/web/app/components/auth/`, `apps/api/src/modules/auth/service/`,
`specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 2 fixes the provenance, shape, uniqueness,
normalization, test, and build-time failure mode of the two reference datasets.
FR-005 fixes one searchable city list with one Arabic name per entry and no
second naming source; FR-001 and FR-002 fix the +218 mobile number. The datasets
must be identical in the API and the web form, and a missing, unparsable, or
truncated file must fail the build that imports it rather than degrade at
runtime.

**Decision.**
1. `packages/shared/src/reference/libyan-cities.json` is a flat array of
   strings, each one Arabic name (governorate, city, or area), with the
   qualifying governorate or level inside the name where a real name recurs; no
   Latin name and no separate identifier. It is compiled from the Libyan
   administrative-division reference (the 22 governorates of the 2007 division,
   with their cities and areas), reviewed by the operator, version `1.0.0`
   (2026-11-01).
2. The `SOURCE` note beside it records the source, the version, the
   22-governorate reference count, the total entry count, and the SHA-256 digest.
3. `packages/shared/src/reference/libyan-mobile-prefixes.json` carries the valid
   +218 mobile prefixes (the national significant number's leading `9x` pair); a
   number is a Libyan mobile number when it normalizes to `+218` followed by a
   prefix in the set and exactly seven more digits.
4. Search uses `normalizeArabic()` (strip diacritics and tatweel; unify
   alef/hamza forms, ya/alef maqsura, and ta marbuta) and a substring match; the
   stored value is the entry's name exactly.
5. A test asserts every entry's name is unique and non-empty, that every one of
   the 22 governorates is present with at least one city or area entry, and that
   the file's entry count equals the count in `SOURCE`.
6. A missing, unparsable, or truncated file fails the build that imports it; no
   runtime path reads either file.

**Alternatives considered.**
- *A `cities` table.* Rejected: a second source that can diverge per
  environment, and it would look like a thirteenth entity.
- *Latin transliterations.* Rejected by FR-005's one-Arabic-name rule.
- *A remote dataset.* Rejected: the list is fixed and must not change between
  releases.
- *A completeness check that asserts only that each governorate appears.*
  Rejected: a truncated file passes as long as the entries it kept are real
  places, so the 22-governorate reference and the recorded entry count are both
  asserted.

**Consequences and migration/backfill.** No schema, migration, or data change;
the two files are committed reference data. Review date: 2026-12-01; the tripwire
is a changed entry count, a missing governorate, a second naming source, or a
runtime read.

## ADR-153 — The password policy's local source: SecLists' top 100,000, verified at boot

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `apps/api/src/modules/auth/data/`,
`apps/api/src/modules/auth/service/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** FR-035 requires a common-or-breached refusal, and the plan's record
3 fixes the local source, the membership test, the refresh cadence, the licence,
the boot-time check, and the stale-list rule. The list must be available
offline, must not add a runtime dependency, and a missing or altered file must
stop startup rather than silently weaken the policy.

**Decision.**
1. The source is the top 100,000 entries of SecLists'
   `10-million-password-list-top-100000.txt` (MIT), vendored at
   `apps/api/src/modules/auth/data/breached-passwords.sha256`; the
   `breached-passwords.source.json` record beside it carries the source, the
   version, the entry count, the SHA-256 digest, and the licence.
2. The check is a membership test of the password's lowercase SHA-256 hex digest
   against the vendored set; a match refuses with `PASSWORD_TOO_COMMON`.
3. The list is loaded once at boot into a `Set`; the boot sequence verifies the
   line count and SHA-256 digest and exits non-zero on a missing, truncated, or
   altered file.
4. The refresh cadence is quarterly through the dependency-update process; the
   licence and the vulnerability scan are recorded with the vendored file.
5. The stale-list rule: the list stays in use when a refresh is late; staleness
   is a maintenance finding with a review date, not a reason to disable the
   check or fail startup.

**Alternatives considered.**
- *A remote breach API (for example HIBP).* Rejected: a runtime dependency, a
  network path in the authentication flow, and a privacy question the product
  does not need.
- *A Bloom filter or a compressed set.* Rejected: the 100,000-entry set is small
  enough to load once, and the digest membership is exact and simple.
- *Checking the list only at deploy time.* Rejected: an altered file on the host
  would silently weaken the policy; the boot check is the enforcement point.
- *Failing startup when the list is stale.* Rejected: a late refresh would take
  the platform down for a maintenance condition; the stale-list rule keeps the
  list in use and records the finding.

**Consequences and migration/backfill.** No schema or data change. The vendored
list and its `SOURCE` record are the evidence at R1's acceptance. Review date:
2026-12-01; the tripwire is a changed digest, a second source, a runtime
download, or a policy path that reads the list without the boot check.

## ADR-154 — The session policy: two clocks, an activity signal, and tombstones

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/db/schema/`, `apps/api/src/modules/auth/service/`,
`apps/api/src/http/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 5 fixes the session policy: the two clocks, the
activity signal, the tombstone rows, and the ended-session reasons. FR-010,
FR-011, FR-012, FR-013, FR-049, and AC-053 depend on one policy that can tell a
person who held a valid session from an unknown caller without leaking an
account's status.

**Decision.**
1. The library's session carries `expires_at = created_at + 12 h` and
   `update_age = 12 h`, so it never slides; the absolute maximum lifetime is the
   library's expiry.
2. R1 adds `last_activity_at`, `revoked_at`, and `revoked_reason` to `sessions`;
   the reason is one of `sign_out`, `sign_out_all`, `password_change`, `blocked`,
   `platform_revocation`, or `inactivity`.
3. The shared entry point calls the library's session lookup, then applies R1's
   policy: the session is refused when `revoked_at` is set, when
   `last_activity_at + 30 min < now()`, or when the account is blocked.
4. Activity is recorded only when the request carries the web client's
   `X-Wafar-Activity: 1` header, which the client sets from a user-initiated
   event handler (pointer, key, submit) and throttles to one per 60 seconds; the
   header is covered by the CSRF token and the same-origin policy. Background
   requests never carry it.
5. Revocation sets `revoked_at` and the reason instead of deleting the row; the
   hourly sweep deletes revoked rows after 24 hours. A request carrying a token
   whose row is revoked with `blocked` receives the blocked variant of the
   ended-session state; every other ended reason receives the generic variant.

**Alternatives considered.**
- *Deleting sessions on revocation.* Rejected: the blocked variant becomes
  impossible without a status lookup that leaks.
- *Sliding the library's expiry on every request.* Rejected: a background
  request would keep the session alive, which the specification forbids.
- *A separate revocation table.* Rejected: the session row already identifies
  the token's holder.
- *A client-side idle timer as the inactivity authority.* Rejected: a client
  clock is not the server's, and the server must refuse a session the client
  still believes live.

**Consequences and migration/backfill.** The first migration adds the three
columns and the reason enum; no backfill is needed because R1 creates the table.
Review date: 2026-12-01; the tripwire is a sliding expiry, a session deleted
without a tombstone, an activity write from a background request, or a second
ended-session reason vocabulary.

## ADR-155 — The rate-limit and transient-store locations: Postgres tables, swept hourly

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/db/schema/`, `packages/db/sweeps.ts`,
`apps/api/src/modules/auth/service/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 6 fixes where the rate-limit counters and the
transient request state live in R1, the window and sweep rules, each row's time
bound, and the hourly idempotent sweep that enforces it. FR-033 and AC-033 fix
the two-key limits; FR-034 and AC-036 fix the pending-request bounds. R1 must
not introduce the Redis client — a register gap R3 owns — before R3 exists.

**Decision.**
1. Two Postgres tables, both owned by `auth` and both non-entity operational
   state: `phone_verifications` for the pending request and
   `rate_limit_counters(key, window_start, count, expires_at)` with a primary
   key on `(key, window_start)`.
2. The counter is incremented with one atomic
   `INSERT … ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
   RETURNING count`; the fixed window is 15 minutes, and the keys are
   `op:origin:<ip>` and `op:number:<e164>`. A malformed value has no number key.
3. The lock lives on `users` (`failed_sign_in_count`, `locked_until`) and is
   updated with a single conditional statement in the same transaction as the
   failed verification; it is not a counter table.
4. Each row's bound: a session row is deleted 24 hours after its revocation or
   expiry; a pending request is deleted when `request_expires_at` passes (at
   most five minutes after the last dispatch, and one row per normalized
   number); a counter is deleted one hour after its window ends, so a key
   carries at most five rows.
5. The bound is enforced by the hourly idempotent sweep: one statement per
   table, each `DELETE … WHERE <the bound> < now()`, run from the API process's
   scheduler at the top of the hour under a PostgreSQL advisory lock so two
   instances never double-run. A missed, failed, or skipped run is absorbed by
   the next, because the predicate is the bound itself.
6. No R1 path and no sweep deletes a `users` or `accounts` row (FR-018); neither
   table is swept.

**Alternatives considered.**
- *Redis counters with TTL keys.* Rejected: a register gap owned by R3, and a
  second consistency domain.
- *In-memory counters.* Rejected: they break across instances and on restart.
- *A token bucket in the API.* Rejected: the same instance problem and no audit
  trail.
- *A row cap instead of a time bound.* Rejected: a cap deletes a live row under
  load or lets an old row outlive its window; the bound is the row's own time.

**Consequences and migration/backfill.** The first migration creates both
tables and their indexes; the sweep is idempotent and needs no backfill. Review
date: 2026-12-01; the tripwire is a second counter store, a row without a time
bound, a sweep that deletes a `users` or `accounts` row, or a scheduler that
runs outside the advisory lock.

## ADR-156 — The frame's route map: one exported map for every link

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/shared/src/routes.ts`,
`packages/ui/app/components/shell/`, `apps/web/app/layouts/`,
`specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 7 fixes the frame's route map: the nine
destinations, the four static routes, the three bare routes, the guest sign-in
target, and the Profile settings anchor. FR-024 requires one record to fix every
link the frame and the bare pages build, so a later slice cannot choose a
different route; the frame is built in R1 and rendered from R2.

**Decision.**
1. The route map lives in `packages/shared/src/routes.ts` and is the single
   source both the applications and the structural tests read.
2. The nine sidebar destinations are Home `/`, Parts `/parts`, Catalog
   `/catalogs`, Upload Catalog `/upload`, My Files `/my-files`, Cart `/cart`,
   Notifications `/notifications`, Messages `/messages`, and Profile `/profile`.
3. The four static routes are Contact `/contact`, Privacy Policy `/privacy`,
   Terms of Use `/terms`, and FAQ `/faq`.
4. The three bare routes are Sign up `/auth/sign-up`, Sign in `/auth/sign-in`,
   and Password recovery `/auth/forgot-password`.
5. The guest sign-in action targets `/auth/sign-in`; the Profile settings
   section targets `/profile#settings`; the logo/home control targets `/`; the
   notifications control targets `/notifications`; sign-out has no route.
6. The three bare pages use `apps/web/app/layouts/bare.vue`: the non-interactive
   wordmark above the page title, the title above the card, and the cross-links
   (sign-in → sign-up and recovery; sign-up → sign-in; recovery → sign-in). The
   pages are SSR-rendered, call no session endpoint, and render identically for a
   signed-in person and a guest.

**Alternatives considered.**
- *Per-component route literals.* Rejected: drift between the frame, the pages,
  and the tests.
- *Nuxt's file-based routes as the only authority.* Rejected: the frame needs the
  hrefs without importing pages, and the structural test needs the list.
- *A route map per application.* Rejected: two maps would let the web and the API
  disagree about the guest target or the settings anchor.

**Consequences and migration/backfill.** No schema, migration, or data change.
The map is asserted structurally by `packages/ui/tests/shell/**`; runtime
navigation is R2's under `EX-007`. Review date: 2026-12-01; the tripwire is a
route literal outside the map, a destination without a name, or a bare page that
imports the frame.

## ADR-157 — The provisioning boundary, the initial password, and the audit log

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `apps/api/src/cli/`, `apps/api/src/modules/auth/service/`,
`apps/api/src/observability/`, `specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 12 fixes the provisioning boundary, the initial
password's handling, and the audit record. FR-028 delivers the provisioning
action and the administrator's first sign-in as behaviour with no page; the
constitution's audit rule governs administrator operations, and R13 owns the
audit recorder. The record must explain why this operator-run action is not an
administrator operation and which record takes its place.

**Decision.**
1. The action is `apps/api/src/cli/provision-administrator.ts`. It prompts for
   the full name, mobile number, city, and an initial password; the password is
   read from a hidden TTY prompt or `--password-stdin`, never as a value in
   argv, an environment variable, or a stored file.
2. It validates every account rule and the password policy, creates `User`
   (role `administrator`, status `active`, `must_change_password = true`) and
   the credential row in one transaction, and emits the FR-037 structured
   security event `auth.administrator.provisioned`. It writes no audit-log row:
   the action is run by the operator, not by an administrator through the
   platform, so the constitution's audit rule does not reach it; the security
   event is its durable record instead.
3. The event carries FR-037's six-field floor and its per-event fields, and is
   emitted before the action's report. A failed emit turns the report into a
   failure that names the account identifier and exits non-zero; the account is
   not rolled back, because the credential already exists and the failure is in
   the record rather than in the creation.
4. The credential is read once, the input is closed, and it is never echoed,
   never written to an output, an error, a log, or the security event. The
   report names only the account and the outcome. The operator hands the
   credential to the administrator over a channel the operator controls; no
   page, code message, or notice carries it.
5. The administrator's first sign-in is `auth.service.signInAdministrator`, a
   service function with no HTTP route. It accepts the credential, marks the
   session restricted, and refuses every action except the password change and
   ending the session. The forced change requires the current password, a
   different new value, ends every session, and sends the security notice.

**Alternatives considered.**
- *A CLI option carrying the password as its value.* Rejected: shell history and
  process-list leakage.
- *An HTTP provisioning route.* Rejected: it would be an administrator operation
  without the audit recorder, which R13 owns, and it would widen the public
  surface beyond the merchant sign-in route.
- *Seeding the account in a migration.* Rejected: a credential in versioned SQL.
- *Writing an audit-log row from the action.* Rejected: the audit recorder is
  R13's, and a second writer would create two audit authorities; the security
  event is the record R1 owns.

**Consequences and migration/backfill.** No schema change beyond the first
migration. The CLI, the security event, and the first-sign-in service are the
evidence at R1's acceptance. Review date: 2026-12-01; the tripwire is a password
in argv or the environment, a credential in an output, an audit row written
outside R13's recorder, or a second provisioning surface.

## ADR-158 — Public API versioning and the deprecation rule

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `apps/api/src/app.ts`, `packages/shared/src/contracts/`,
`specs/001-identity-foundation/`, `docs/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 13 fixes the public API's versioning and
deprecation rule. R1 exposes the first HTTP surface, so the rule has to be fixed
before a later slice can choose a different versioning scheme. ADR-029 already
assigned `/api/v1` versioning to R1; this record states the rule itself.

**Decision.**
1. Every public route carries the `/api/v1` path segment. The version is part of
   the path, not a header or a query parameter.
2. `GET /health` is the unversioned operational probe outside the versioned
   surface; it reports the database dependency and is not a product route.
3. A removal requires a notice of at least one release. The notice names the
   route, the replacement when one exists, and the release in which the removal
   lands.
4. Each deprecation is recorded in the decision register as an ADR. R1 ships
   version 1 with no deprecated route, so this record fixes the rule later
   slices follow and announces no removal.
5. The version is not raised for an additive change; a breaking change raises
   the segment and leaves the previous version in place for its notice period.

**Alternatives considered.**
- *An unversioned API.* Rejected: the first breaking change would have no safe
  migration path, and a later slice would choose the scheme under pressure.
- *Header-based versioning.* Rejected: it is invisible in a URL, harder to
  cache and to document, and the contract is generated from the route table.
- *Date-based versioning.* Rejected: it does not state compatibility, and a
  date is not a promise about a route's shape.
- *Versioning only the routes that change.* Rejected: two shapes on one surface
  would make the contract's single source ambiguous.

**Consequences and migration/backfill.** No schema or data change. The OpenAPI
document generated from the route table carries the versioned paths, and
`GET /health` stays outside it. Review date: 2026-12-01; the tripwire is a public
route without the segment, a versioned `/health`, a removal without a notice, or
a deprecation without an ADR.

## ADR-159 — The SC-009 load profile and its verdict

**Status**: Accepted — 2026-11-08. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `scripts/load/`, `apps/api/test/`,
`specs/001-identity-foundation/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** The plan's record 14 fixes the SC-009 load profile and its verdict.
SC-009 measures the authentication surface at 10 requests per second with 500
concurrent sessions; the rate limiter is a binding control, so the measurement
must not buy a lower percentile by bypassing it. The record binds R12's load
test as well as R1's.

**Decision.**
1. The condition is measured as 20 origin keys and 600 number keys, never as one
   client at 10 requests per second. Twenty concurrent virtual users, each bound
   to its own loopback source address (`127.0.0.2` … `127.0.0.21`) and issuing
   one request every 2 s, produce the aggregate 10 per second.
2. Every request carries a distinct number: 200 fresh numbers for account
   creation, 200 seeded accounts for sign-in, and 200 other seeded accounts for
   recovery. Within the measured window no origin key is spent more than 10
   times against a 20-request budget, and every number key is spent once against
   limits of 3, 20, and 3.
3. The limiter is never disabled, raised, or skipped for a measurement. The API
   keys an untrusted peer by its address, the script reads `rate_limit_counters`
   back, and a post-run probe spends one fresh origin's 20-request
   account-creation budget and requires the 21st submission to be refused
   `RATE_LIMITED`.
4. The verdict reports attempted, accepted, and refused counts per operation and
   in total, fails on any refusal, and computes its percentiles over accepted
   requests only.
5. Three hundred live sessions are seeded; the run's 200 sign-ins reach exactly
   500, the condition's ceiling, which the script asserts.
6. The channel's acceptance wait is a declared nominal: the fake's
   `SMS_FAKE_ACCEPT_MS` is **50 ms** inside every dispatch, and a run fails when
   a dispatch is faster than it. The work-alone p95 is held to **250 ms**, the
   share of SC-009's 1,000 ms that leaves the provider's 750 ms ceiling inside
   the budget.

**Alternatives considered.**
- *A documented limiter bypass scoped to the measurement.* Rejected: it removes
  the counter queries from the measured path, ships a switch that weakens a
  security control, and reports the latency of a configuration no merchant runs.
- *A single origin with sign-in traffic only.* Rejected: it measures one of the
  three operations the condition names and skips the two dispatches, whose
  budgets are tightest.
- *Forging `X-Real-IP` from the load host with the load host added to the
  trusted-proxy list.* Rejected: it asks the API to trust a header from a
  non-proxy, which is the misconfiguration the trusted-proxy rule exists to
  prevent; binding the source address needs no trust at all.
- *Seeding 500 sessions and letting the 200 sign-ins exceed the ceiling.*
  Rejected: the run would measure outside its own stated condition.

**Consequences and migration/backfill.** No schema, migration, or data change.
The load script, its verdict, and the post-run probe are the evidence at R1's
acceptance; R12 reuses the profile for the release load test. The live
`ADR-001 … ADR-150` range strings move to `ADR-001 … ADR-159` in the same
change, and `Project-Technologies.txt`'s header list gains 151 through 159.
Review date: 2026-12-01; the tripwire is a limiter bypass, a single-origin run,
a verdict that reports a refusal as a pass, or a percentile computed over
refused requests.

---

## ADR-160 — Spec Kit scaffold refreshed to 1.3.2; the reserved command and extension set retained

**Status**: Accepted — 2026-11-08
**Owning directory**: `.specify/`, `docs/`, `AGENTS.md`, `README.md`, `ROADMAP.md`, `.specify/templates/overrides/`, `Project-Technologies.txt`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** The installed CLI is 1.3.2 (released 2026-11-06). ADR-021 pinned
Spec Kit to `>=1.1.0`, and ADR-081 upgraded the CLI to 1.1.2 while deliberately
leaving the project's scaffold at 1.1.0; its item 2 says a scaffold refresh is a
separate decision with its own ADR. The upgrade guide's project-file path is
`specify integration upgrade <key>`, not a re-run of `init --force`.

The manifest-aware upgrade changed four things in this repository. It refreshed
the shared scripts. It replaced `speckit.specify` with the 1.3.2 command, which
resolves the active template through `resolve-template.ps1 ... -Json` and writes
the composed `TEMPLATE_CONTENT` instead of copying a file. It removed each
integration's thirteen extension commands and the `speckit.taskstoissues`
command as stale, because 1.3.2 records extension commands outside the
integration manifests and upstream 1.3.0 removed taskstoissues from core. And
it rewrote the manifests with only the nine core command files.

Four project decisions constrain the result. The five core templates carry the
fallback banners of ADR-039 and the registration-neutral examples of ADR-053,
and upstream made no other change to them between 1.1.0 and 1.3.2. The two
integration command directories must stay byte-identical and each manifest must
cover the whole directory (ADR-086). Project-owned files keep their CLI
baseline hashes so a refresh cannot mistake them for unmodified (ADR-072).
`.gitattributes` fixes LF for Markdown and JSON and CRLF for PowerShell
(ADR-039), so manifest hashes must be computed over those working-tree bytes,
not over whatever the installer wrote.

**Decision.**

1. The scaffold records **1.3.2** in `.specify/init-options.json`,
   `.specify/integration.json`, and the three integration manifests. The refresh
   is the manifest-aware `specify integration upgrade` path; `init --here
   --force` is not used.
2. The shared scripts take the 1.3.2 content: `check-prerequisites.ps1`,
   `common.ps1`, `setup-plan.ps1`, and `setup-tasks.ps1` gain the
   `-LiteralPath` handling and the empty-plan/absent-template guards.
   `create-new-feature.ps1` and `resolve-template.ps1` are byte-identical
   upstream and are unchanged.
3. `speckit.specify` takes the 1.3.2 command, including the resolver-based
   template composition. `speckit.converge` keeps its project description
   because upstream changed only that frontmatter line; its body is unchanged.
   The other core commands are unchanged.
4. The five core templates keep their project bytes — the ADR-039 banners and
   the ADR-053 examples — because upstream 1.3.2 changed nothing else in them.
   Their `speckit.manifest.json` hashes stay at those bytes.
5. `speckit.taskstoissues` is retained at its 1.1.0 content in both integration
   directories. Upstream 1.3.0 removed it from core, but this project still
   reserves it under ADR-071; no owner or requirement exists to adopt it or to
   retire the reservation. The command therefore remains available rather than
   silently disappearing.
6. The thirteen extension commands are restored byte-for-byte at their installed
   versions: bug 1.0.0, assess 1.0.1, and git 1.0.1. The extensions are not
   updated in this change. Both integration manifests are extended from the
   nine core files back to the whole twenty-three-file command directory, so
   ADR-086's coverage check still holds. A future extension update is an
   independent change.
7. The five override templates, `.specify/.gitignore`, and
   `.specify/templates/exception-register.md` are untouched, and their manifest
   hashes remain at the CLI baseline. `specify integration status` therefore
   continues to report seven modified managed files by design.
8. PowerShell files are normalised to CRLF and Markdown/JSON files to LF before
   the manifests are hashed, so the drift check is stable across a fresh
   checkout.
9. Every live `ADR-001 … ADR-160` range string moves to **ADR-160**, and
   `Project-Technologies.txt`'s header list gains 160.

**What deliberately did not change.** The constitution stays **6.3.2**: no
principle, register entry, entity, page, product feature, module, slice, or
Usage Limit changes. `workflow.yml` keeps its project customisation. No
override template, extension version, source file, specification, or product
artifact changes. No scaffold file is regenerated by `specify init --here
--force`.

**Alternatives considered.**
- *Re-run `specify init --here --force`.* Rejected: it overwrites the binding
  overrides and the customised workflow, which is exactly why ADR-081 deferred
  the refresh (ADR-072).
- *Leave the scaffold at 1.1.0.* Rejected: the installed 1.3.2 CLI's
  `speckit.specify` resolves composed templates and the refreshed scripts carry
  the empty-plan and literal-path fixes; ADR-081 deferred the refresh, it did
  not forbid it.
- *Accept upstream's removal of `speckit.taskstoissues`.* Rejected: ADR-071 and
  `AGENTS.md` reserve the surface, and no requirement or owner exists to either
  adopt it or retire it. Removing the file would make the reservation statement
  false without a decision.
- *Accept the upstream core templates and drop the project banners.* Rejected:
  the banners are a decision item of ADR-039 and the examples are ADR-053's
  correction; upstream made no competing change to those files.
- *Update the extensions in the same change.* Deferred: extension versions are
  independent of the CLI, and updating them rewrites thirteen command bodies
  and both registry registrations. That deserves its own review and diff.
- *Re-record the hashes of the project-owned files so the status is clean.*
  Rejected: ADR-072 item 3 keeps those hashes at the CLI baseline so the drift
  stays visible and a refresh cannot overwrite them silently.
- *Record no ADR.* Rejected: ADR-081 item 2 requires a scaffold refresh to be
  its own decision.

**Consequences.** The scaffold and the installed CLI now both read 1.3.2, and
`speckit.specify` composes the overrides through the shared resolver instead of
copying a fallback file. The governance drift check reports clean, with the
index ending at ADR-160. The `specify integration status` warning remains at
seven files by design. A later `specify integration upgrade` will again remove
the thirteen extension commands and `speckit.taskstoissues` and rewrite the two
integration manifests with only the core files; the restoration is mechanical —
restore the fourteen files from version control, re-extend both manifests to
twenty-three entries, and re-normalise line endings per ADR-039. Review date:
the next Spec Kit upgrade.

## ADR-161 — The city list's object envelope and version 2.0.0

**Status**: Accepted — 2026-11-09. **Constitution version**: 6.3.2 (unchanged)
**Owning directory**: `packages/shared/src/reference/`, `specs/001-identity-foundation/`, `docs/`
**Owning feature**: R1 — the identity foundation (`specs/001-identity-foundation/`).

**Context.** ADR-152 item 1 fixed
`packages/shared/src/reference/libyan-cities.json` as a flat array of Arabic name
strings at version `1.0.0` (2026-11-01), and item 2 fixed a `SOURCE` note beside
it recording the source, the version, the 22-governorate reference count, the
total entry count, and the SHA-256 digest. T225 replaced the 66-entry sample with
the reviewed 138-entry dataset and needed those four values beside the names; a
bare array has nowhere to carry them, so the file became an object whose
`entries` is ADR-152's array. The shape departed from ADR-152 without a record,
and `plan.md`, `data-model.md`, and `research.md` still described the flat array
at `1.0.0`.

**Decision.**

1. `packages/shared/src/reference/libyan-cities.json` is an object with
   `$comment` (the `SOURCE` note), `version`, `updated`, `source`,
   `governorateCount`, `entryCount`, `sha256`, and `entries`.
2. `entries` is the value ADR-152 fixed: one flat array of unique Arabic names
   (governorate, city, or area), with the qualifier inside the name where a real
   name recurs, and no Latin name or separate identifier.
3. The dataset is version `2.0.0` (2026-11-09): the reviewed 138-entry list
   covering the 22 governorates of the 2007 division, superseding the 66-entry
   `1.0.0` sample. `governorateCount` is 22; `entryCount` equals
   `entries.length`.
4. `sha256` is the SHA-256 of `JSON.stringify(entries)`;
   `scripts/gen/reference-digests.mjs` restamps it and the unit test fails when
   an edit is not restamped.
5. ADR-152 items 3-6 stand unchanged: the mobile-prefix dataset,
   `normalizeArabic()` and substring search, the uniqueness and coverage test,
   and the build-time failure mode.
6. The unit test cites this record and asserts the envelope's fields, the 22
   governorates, the reviewed count, a representative set of cities and areas,
   uniqueness, the Arabic-only rule, and the digest.

**Alternatives considered.**
- *Keep the flat array and move the count and digest into the test.* Rejected:
  the count becomes a second copy of the dataset, and the build-time failure
  mode cannot see a digest the file does not carry.
- *A flat array with a sibling metadata file.* Rejected: two files must be kept
  in sync, and a copy that drifts is exactly what ADR-152 item 5 fails the build
  to prevent.
- *Keep ADR-152 unamended and treat the object as an implementation detail.*
  Rejected: the shape is a binding decision item, and `plan.md`,
  `data-model.md`, and `research.md` read it; an unrecorded departure makes the
  register false.

**Consequences.** FR-005's single list is unchanged in kind; the envelope is now
a recorded decision, and the plan, the data model, and the research note read
version `2.0.0` and the object. Every live `ADR-001 … ADR-161` range string
moves to ADR-161, and `Project-Technologies.txt`'s header list gains 161. The
constitution stays **6.3.2**: no principle, register entry, entity, page,
feature, module, or Usage Limit changes. A future change to the names or the
envelope is an amendment to this record rather than an edit inside a feature.
