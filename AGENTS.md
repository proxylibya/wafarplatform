# AGENTS.md — Wafar

Operating instructions for agent assistants working in this repository.

**Authority.** `.specify/memory/constitution.md` supersedes this file. Where the
two conflict, the constitution wins and you MUST report the conflict instead of
following this file. Precedence, from the constitution's Governance section:
constitution → agent instruction files (this file) → README → any other guidance.

## 1. What this repository is

Wafar is an Arabic-first (RTL) parts-catalog platform for Libyan merchants. It is
a search-and-display catalog: no selling, no buying, no payment, and no
user-to-user chat. A merchant's "cart" is a personal bookmark list. The product
scope is fixed by the constitution's Product Scope section; do not extend it.

## 2. Project-level knowledge is not a feature

This knowledge is read **by name**. It is never re-created as a numbered feature,
and a feature artifact references it rather than restating it.

| Concern | Source of truth |
|---|---|
| Engineering law, product scope, limits | `.specify/memory/constitution.md` |
| How the system is built (layout, module map, data flow) | `docs/architecture.md` |
| The data model (entities, relationships, invariants, owning module) | `docs/domain-model.md` |
| Capacity and load envelope (six-month plan, quotas, ingestion, verification) | `docs/capacity-model.md` (ADR-117, ADR-119, ADR-121, ADR-122); sample evidence: `docs/pdf-sample-analysis.md`; the constitution wins on every conflict |
| Approved technology stack — the register | `.specify/memory/constitution.md` (Technology Standards); `Project-Technologies.txt` mirrors it |
| UI foundation — component library and the project layer | `.specify/memory/constitution.md` → Principle IX; ADR-097 fixes the Wafar UI layer's path (`packages/ui`); R1 builds it through its plan and consumes it |
| Product detail (roles, pages, acceptance criteria) — mirror | `Core-Project.txt`; the constitution's Product Register and Product Scope win on conflict |
| Accepted decisions | the decision register: `docs/DECISIONS.md` (the index and reading protocol) and `docs/decisions/volume-NN.md` (the records) |
| Design contract and per-slice visual reference | ADR-128 (the token and rendering contract); ADR-129 (the conformance gate and the baseline chain); ADR-130 (part families and the Home cards); ADR-131 (the retention trigger); ADR-132 (the shell: scroll-hide), annotated by ADR-137 (the outline icon cut and the light default); `docs/design/` (the slice map and the reference screenshots) |
| Slice order for the MVP | `ROADMAP.md` |

**Prohibited:** creating a feature numbered after a project-level concern (for
example "020-ui-foundation" or "019-architecture"). That is a classification
error — it makes the agent treat a project-wide rule as work, and later features
re-invent what already exists. See `docs/DECISIONS.md` → ADR-007.

## 3. Load these before writing any feature artifact

Read only the constitution sections this list names; the constitution's own
Reading protocol mirrors this map, and the constitution MUST NOT be read end to
end for a feature command. Where a list names `docs/DECISIONS.md`, read its index
and the volume that holds the records the command needs (ADR-071, ADR-125).

A source this section names is reachable from the constitution's References
(Single-Reference Sufficiency); a source that is not registered there is not
loaded by any command.

- `/speckit.specify` → the constitution (Product Scope, Product Register, the
  Usage Limits table in Performance Budgets and Verification, Glossary),
  `Core-Project.txt`, `docs/domain-model.md`, `docs/design/slice-map.md` (the
  slice's entry: composition, states, copy, and the open questions this
  specification must answer), `ROADMAP.md` (the slice's scope, dependencies, and
  what this slice does not do), and
  `docs/DECISIONS.md`. **Not** the
  technical sources: a specification stays technology-agnostic (Principle VII).
- `/speckit.clarify` → `spec.md`, the constitution sections the spec cites, and
  `docs/design/slice-map.md` (the slice's entry, whose open questions this
  command resolves).
- `/speckit.plan` → the constitution's registers (Technology Standards,
  Product Register) plus `docs/architecture.md`, `docs/domain-model.md`,
  `docs/capacity-model.md`, `Project-Technologies.txt`, `Core-Project.txt`,
  `docs/design/` (the slice's map entry and its reference images),
  `ROADMAP.md` (the slice's dependencies and deferred items), and
  `docs/DECISIONS.md`. The plan is the only artifact that carries technical
  detail, its `Scale/Scope` starts from the capacity model, and its Ownership
  Map must match `docs/architecture.md`.
- `/speckit.tasks` → `plan.md`, plus the constitution (Product Register,
  Single-Reference Sufficiency, and Artifact Workflow and Traceability),
  `docs/architecture.md`, `docs/domain-model.md`, and `docs/DECISIONS.md`.
  Every path a task touches must appear in the plan's ownership map.
- `/speckit.checklist` → the constitution (Product Scope, Product Register,
  and the binding sections its checklist names), `Core-Project.txt`,
  `docs/domain-model.md`, `docs/design/slice-map.md` (the slice's states and
  copy), and `docs/DECISIONS.md`.
- `/speckit.implement` → `plan.md`, `tasks.md`, and the constitution sections
  its plan's Constitution Check cites.
- `/speckit.analyze` → `spec.md`, `plan.md`, `tasks.md`, `ROADMAP.md` (the
  slice's scope boundary), and the constitution
  sections the artifacts under review cite; it also reads `docs/DECISIONS.md`
  and `docs/domain-model.md` for the consistency pass, because a conflict with
  an accepted ADR or a model invariant is a blocking finding (Artifact Workflow
  and Traceability).
- `/speckit.converge` → `spec.md`, `plan.md`, `tasks.md`, and the constitution
  sections the artifacts under review cite; it appends its convergence tasks to
  `tasks.md` and reports Converged only when the implementation satisfies all
  three artifacts.

The feature templates in `.specify/templates/overrides/` carry this duty as
binding text. They resolve as the top layer with `strategy: replace`; do not
replace them with the core templates.

## 4. Language and layout

- User-facing text: Arabic, `<html dir="rtl" lang="ar">` on every page.
- Code identifiers, code comments, commits, and governance text: English. The
  only exceptions are the two Arabic mirrors (`Core-Project.txt`,
  `Project-Technologies.txt`) and Arabic strings quoted as the subject of a rule
  (for example an Arabic-Indic numeral example).
- Numerals rendered to the user: Latin (1234567890), never Arabic-Indic.
- Conversation with the operator: Arabic. Every question, option, table,
  recommendation, report, and summary the assistant writes into the chat is
  Arabic, including while a `/speckit.*` command is running — a command file
  does not override this rule. Files on disk keep the language the rule above
  gives them (governance English, product text Arabic), and the literal tokens
  a command requires stay exactly as that command spells them: command names,
  paths, file names, identifiers (`FR-###`, `AC-###`, `ADR-###`), technical
  terms with no settled Arabic rendering, code, and the markers a command names
  literally (`EXECUTE_COMMAND:`, `**Question:**`, `**Recommended:**`,
  `**Suggested:**`). Numerals and symbols stay Latin: `1234567890`, `%`, `≤`,
  `/`, `-`, `:`, and the like are never converted to Arabic-Indic or to an
  Arabic look-alike. The user's own language is the one to answer in if it
  differs from this rule.
- Logical CSS properties only (`margin-inline-start`, not `margin-left`).
- No emoji in anything a person reads inside the platform: every screen,
  including the administrator application, and the body of every SMS
  (Principle V). An icon is an SVG from the approved open-source icon set, and
  an emoji glyph is not an icon. The set is **IconPark** (the outline cut is
  consumed; the colour cut is vendored but not consumed), chosen by ADR-098 and
  annotated by ADR-137; both cuts are vendored under `packages/ui/vendor`; the
  set and the typeface are assets of that layer, not rows of the Approved
  register, and ADR-146 records both gap rows closed at R1's acceptance, so no
  other slice may choose a set or a family of its own.
- Registration is Libya only: every account is a +218 number and sign-up offers
  no dial-code selector (ADR-041).

## 5. Workflow

The binding cycle, in order: `/speckit.constitution` → `/speckit.specify` →
`/speckit.clarify` → `/speckit.plan` → `/speckit.checklist` →
`/speckit.tasks` → `/speckit.analyze` → `/speckit.implement`, repeating
`/speckit.implement` ↔ `/speckit.converge` until converge reports Converged
(ADR-013).

Installed extensions: `assess` (idea triage before specifying), `bug` (bug
triage), and `git` (repository initialization and mandatory feature branch
creation). The `git` extension registers a mandatory `before_constitution` hook,
`speckit.git.initialize` (`optional: false`, enabled), which runs before
constitution work, and a mandatory `before_specify` hook,
`speckit.git.feature` (`optional: false`, enabled). The `assess` extension ships
no lifecycle hooks of its own; **this project** registers its optional
`speckit.assess.intake` prompt at `before_specify` in `.specify/extensions.yml` —
prompting to normalize a raw idea into an intake note before specification
(`optional: true`, enabled, `priority: 9` so it precedes the mandatory
`git.feature`). It is a prompt, not a mandatory step of the binding
cycle. Hook states are read from `.specify/extensions.yml`; the `git` commit
hooks are registered but disabled by default.

Two integrations are installed: `opencode` is the default, and `codebuddy`
(WorkBuddy AI) is the second. Each owns a private command directory
(`.codebuddy/commands/`, `.opencode/commands/`) whose files are byte-identical
to each other. Their ten core commands mirror the upstream Spec Kit commands,
while their thirteen extension commands are **derived** from
`.specify/extensions/*/commands/` by placeholder resolution, a provenance
comment, and front-matter normalisation, so they are not byte-identical to that
source (ADR-086). Both read the same
`.specify/` tree (templates, extensions, hooks, scripts, workflow), so either
environment runs the same cycle with the same command spelling (`/speckit.*`).
`.specify/integration.json` lists both and keeps `opencode` as the default.

Templates resolve from `.specify/templates/overrides/` first, then
presets, then extensions, then core. The `speckit.taskstoissues` command is a
reserved optional surface: no product requirement names it today, and adopting
it later requires recording the owner and the requirement it serves.

**The bundled `speckit` workflow mirrors the binding cycle.**
`.specify/workflows/speckit/workflow.yml` runs `constitution → specify →
clarify → plan → checklist → tasks → analyze → implement → converge` with
human review gates. The `git` extension's `before_specify` hook (`speckit.git.feature`,
optional: false) runs automatically before specification, creating a sequentially
numbered feature branch (`001-feature-name`, matching `feature_numbering: sequential`
in `.specify/init-options.json` and ADR-015). Converge remains a separate command by
decision (ADR-013), not a spec-kit engine concern; the workflow file lists it
so the cycle reads as one sequence. Templates and the registry are what a
reader checks, not the engine. `.specify/workflows/speckit/workflow.yml` is a
**project-customised** copy of the bundled workflow (it adds the constitution,
clarify, checklist, analyze, and converge steps and the `codebuddy` integration
key), so a `specify` upgrade may replace it; the project copy is the one to keep,
and its `requires.integrations.any` list must stay correctly nested under
`integrations:` (ADR-072).

**The governance drift check is committed (ADR-071, ADR-072, ADR-073, ADR-074, ADR-075, ADR-080, ADR-082, ADR-083, ADR-086, ADR-088, ADR-092, ADR-093, ADR-096, ADR-097, ADR-098, ADR-099, ADR-100, ADR-101, ADR-102, ADR-103, ADR-104, ADR-105, ADR-106, ADR-125, ADR-133, ADR-136, ADR-140).** `governance-drift-check.mjs`
in the repository root is a read-only, dependency-free Node script that verifies
the invariants the governance set cannot verify by discipline: the constitution
footer's version and amended date against `.specify/memory/version.json`; every
live `ADR-001 … ADR-161` range string — in the required files, in the top-level
`docs/` files, in the two Arabic mirrors, in the template overrides, and in the
feature specifications — against the last row of
`docs/DECISIONS.md`'s index; every ADR index row's anchor against its heading in
the volume that holds it, and every heading against the index; every volume's ADR
continuity and the volume and index size caps; every `ADR-NNN` reference
against the index; the
ADR list in `Project-Technologies.txt`'s header against the same row; every
`speckit.manifest.json` hash for an upstream-owned file against the working tree,
and every upstream-owned file in the tree against the manifest (the project-owned
`templates/overrides/*` files, `.specify/.gitignore`, and
`.specify/templates/exception-register.md` are excluded, because the project
edits them by design); the byte-identity of `.codebuddy/commands/` and
`.opencode/commands/`; each integration manifest against the tree it records and
against that integration's whole command directory; the absence of the removed
stylesheet and its constitution section; the structural counts the governance
text states in prose — slices, exception rows, principles, data entities, binding sections, API modules,
pages, and product features — against the lists that enumerate them, with the
binding-section set derived from the constitution's own headings; the ADR
index's constitution-version column against the footer's version; every
enumeration of five or more ADR numbers against the one the check's own header
carries, so "which ADRs built the check" has one authority instead of a copy per
document; the contiguity of `Project-Technologies.txt`'s header list; the
Constitution Mandated Values count the plan template states against the
constitution's closed list and its own table; every entity's owning module across
the constitution's Data entities table and `docs/domain-model.md`; every
specification's identifier integrity — `FR-###`, `AC-###`, and `SC-###`
contiguous from 001, defined once, never referenced without being defined, and
every functional requirement cited by at least one acceptance criterion; and the
integration topology across `integration.json`, `init-options.json`, the
integration directories in the tree, and the bundled workflow's nesting. Run it
with `node governance-drift-check.mjs`; it exits non-zero on drift. It is wired
into a committed `pre-commit` hook (`.githooks/`, enabled per clone with
`git config core.hooksPath .githooks`), and the slice that introduces the test
runner (R1) wires it into continuous integration.

## 6. Known gaps

- **IconPark's upstream is archived (decided 2026-10-21, ADR-098).** The icon
  set is to be vendored under `packages/ui/vendor` and pinned by the pre-R1
  foundation (ADR-097, ADR-098), and the project will own the copy; the
  Apache-2.0 licence is perpetual. No new upstream icons arrive, so a missing
  icon is added by ADR. This is a maintenance limitation, not an availability
  risk.

- **No standalone `/speckit.constitution-check` command.** The constitution check
  gate is carried inside `plan-template.md` (Gates 1–3), evaluated before Phase 0
  and re-evaluated after Phase 1. That satisfies Artifact Workflow and
  Traceability; a separate command is a convenience, not a requirement. Add one
  only with an ADR, and keep the plan-internal gate authoritative.

- **`.opencode/package.json` is not version-controlled.** It is ignored by
  `.opencode/.gitignore`, so a fresh clone relies on opencode regenerating it.
  The pin is `@opencode-ai/plugin` **1.1.21**; it is recorded here (ADR-071) so a
  fresh clone knows the value, and stays machine-local rather than
  repo-enforced.

- **`.specify/memory/.constitution-template.json` is ignored and untracked (gap
  closed 2026-10-08, ADR-074).** When present, it is the CLI's record of which
  constitution template it scaffolded from — machine state of the same class as
  `memory/.resolved-template.json`, `extensions/.cache/`, and
  `integrations/.cache/`. It was tracked until 2026-10-08, so it was removed from
  the index and added to `.specify/.gitignore` in the same change. Its `source`
  field is not a governance statement: the binding template layer is
  `.specify/templates/overrides/`.

- **Integration state is committed (gap closed 2026-10-08, ADR-069).**
  `.codebuddy/`, `.specify/integrations/codebuddy.manifest.json`, and
  `.specify/memory/version.json` were listed here as untracked while ADR-068 was
  drafted. Commit `26df272` tracked all three, so a fresh clone carries the
  default environment and both version sources. The gap is closed and the entry
  is kept, marked closed, so it is not re-reported as an open gap.

- **`create-new-feature.ps1` is an installed but uncalled script — intentional
  (ADR-071).** Feature numbering and directory creation run inside the specify
  command, so the script in `.specify/scripts/powershell/` is kept for parity
  with upstream rather than used. It is a deliberate parity artifact, not a gap
  to close.

- **`speckit.taskstoissues` is a reserved optional surface (ADR-071).** It ships
  with the integration, but no product requirement names it; adopting it later
  requires recording the owner and the requirement it serves. It is reserved,
  not an open gap.

- **Thirty-two decision records carry no `Alternatives considered` section
  (the twenty-four closed 2026-10-09 by ADR-090, plus eight added since).** The
  Documentation rule now states its own subject: the field reaches a
  non-trivial technical decision, and a governance record — one whose subject is
  the constitution's own text, a register, the process, or the governance
  tooling — is outside its reach. They are governance records, so the field
  never reached them and no section is reconstructed; the debt is closed.
  ADR-092, recorded after ADR-090, is the twenty-fourth; the eight governance
  records added since fall under the same reading, which ADR-090's annotation
  records (ADR-102), and the register's index names them. The entry is kept so
  a reader meets the closure without reading `docs/DECISIONS.md` → ADR-090.

- **The constitution's stamp-site list stays in the constitution (decided
  2026-10-09, ADR-091).** ADR-064 deferred moving it as "a Governance amendment
  in its own right". ADR-091 decided to keep it: the paragraph declares itself
  the single authority for the version sources, so relocating it to a
  lower-precedence document would create a lower-precedence authority governing
  the constitution and contradict Governance's precedence rule. The debt is
  closed by that decision, not by a move.

## 7. Before reporting a change complete

- Every task ends with `(implements FR-###, AC-###)` or, when no requirement
  genuinely applies, `(implements Complexity Tracking: <row>)`.
- Every deviation is recorded in the plan's Complexity Tracking table with an
  owner and a review date.
- Documents affected by the change are updated in the same change.
- Non-trivial decisions are recorded in the decision register as an ADR.
