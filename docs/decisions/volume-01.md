## ADR-001 — Monorepo with a Modular Monolith API

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** One product with three surfaces (public site, merchant area,
separate administrator application) plus a file-processing worker; the
frontend and backend must share validation schemas so the two contracts
cannot drift (Principle II). The team is small. A future extraction into
microservices should be mechanical rather than a rewrite (Principle X
rationale).

**Decision.** A single repository, managed with pnpm workspaces and
Turborepo, holding `apps/web`, `apps/admin`, `apps/api`, `apps/worker` and
`packages/shared`, `packages/db`, `packages/search`, `packages/config`. The
API is one deployable server divided into ten modules (`auth`, `users`,
`catalogs`, `parts`, `suppliers`, `bookmarks`, `notifications`, `messages`,
`support`, `admin`), each with its own routes, service, and repository;
communication between modules goes through the shared package only.

**Alternatives considered.**
- *Polyrepo (one repository per app).* Rejected: shared schemas would have to
  be published and versioned across repositories, which reintroduces exactly
  the frontend/backend drift that the shared-schema rule exists to prevent;
  cross-repo coordination also adds process with no scale benefit today.
- *Microservices from day one.* Rejected: independent deployment and scaling
  are not needed at the current scale; the operational surface (service
  discovery, per-service observability, distributed failure modes) is
  unjustified, and a modular monolith keeps extraction available later.

**Consequences.** Import boundaries must be enforced mechanically
(enforcement configuration committed with the codebase); each feature
registers its owned directories in its plan's ownership map; shared code is
promoted only after a second consumer exists. Replacing this architecture
would require a constitutional amendment (Principle X / Technology Standards).

---

## ADR-002 — Hono for the API framework

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** The API is a Modular Monolith that must serve the catalog, the
merchant area, and the administrator application; the API contract must be
documented and must not drift from the code.

**Decision.** Hono (4.13.5 per `Project-Technologies.txt`) as the API
framework, with OpenAPI documentation generated from the same code.

**Rationale.** Hono is lightweight with very high throughput on Node.js
(88,525 requests/second in the 2026 benchmarks recorded in
`Project-Technologies.txt`), first-class TypeScript support, and it keeps the
runtime portable (Node.js, Bun, Deno, and edge runtimes). Generating OpenAPI
from the same code removes the drift between hand-written documentation and
the implementation.

**Alternatives considered.**
- *Express.* Rejected: the largest ecosystem, but slower and with weaker
  built-in typing; OpenAPI support requires add-on layers that add dependency
  surface without adding product value.
- *Fastify.* Rejected: fast and schema-oriented, but the plugin ecosystem and
  third-party OpenAPI bindings broaden the dependency surface; switching
  would also require a constitutional amendment, since Technology Standards
  binds Hono.

**Consequences.** Validation stays in shared Zod schemas rather than in
framework-specific schema objects; the framework boundary is kept thin so the
choice remains replaceable in principle — but only through an amendment.

**Annotation (2026-10-04).** ADR-033 replaced the precise benchmark figure in
`Project-Technologies.txt` with neutral wording, so the "88,525
requests/second" recorded in this decision's Rationale is now historical and
is no longer reproduced in the mirror.

---

## ADR-003 — OpenSearch for the search engine

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Arabic root-aware search is a core product requirement
(طرمبة → طرمبات — Principle V): a search that matches only surface forms does
not satisfy the rule. The index lifetime must align with the 90-day automatic
deletion rule, and every dependency shipped to merchants must pass the
licence test in Dependency Governance.

**Decision.** OpenSearch with its built-in Arabic analyzer (plus
`icu_analyzer` for normalization) and Index Lifecycle Management, with the
client and index mappings owned by `packages/search`.

**Rationale.** The Arabic analyzer ships with OpenSearch — no external plugin
to maintain; ILM expresses the 90-day index lifecycle natively; and the
licence is Apache 2.0, which imposes no disclosure, licensing, or relicensing
obligation on the merchant's own data or source.

**Alternatives considered.**
- *Elasticsearch.* Rejected: same lineage of technology, but the Elastic
  Licence and SSPL are on the Dependency Governance list that MUST NOT be
  introduced into a module shipped to a merchant.
- *PostgreSQL full-text search alone.* Rejected for the search surface: it
  has no root-aware Arabic analyzer, so it cannot satisfy the root-resolution
  rule without building custom analysis work that OpenSearch already ships.
- *Meilisearch / Typesense.* Rejected: simpler operations, but less control
  over Arabic analysis quality, and neither is part of the defined stack.

**Consequences.** The search index is a projection of the system of record
and is maintained by the worker; PostgreSQL remains authoritative. Search
ranking beyond the sortable columns remains a deferred area (retrieval
interface) whose ratification is recorded by the first feature that needs it.

**Annotation (2026-10-08, ADR-072 item 9 / ADR-073 item 3).** This record's
Decision and Rationale name "Index Lifecycle Management" as the feature the
index lifetime relies on. Two halves of that naming are superseded. First, the
feature OpenSearch actually ships is Index State Management (ISM); ILM is
Elasticsearch's name for its own policy, and the technology register,
`docs/architecture.md`, and `docs/domain-model.md` name ISM (ADR-072 item 9),
with the technology mirror corrected to match (ADR-073 item 3). Second, the
Rationale's claim that the lifecycle feature "expresses the 90-day index
lifecycle natively" overstates what it does: ISM deletes whole indices by
index age, so the per-catalog 90-day deletion is the retention job's work
(R15), not the index lifecycle's alone. The decision this record made —
OpenSearch with its built-in Arabic analyzer — is unchanged by both; only the
lifecycle feature's name and reach are annotated.

---

## ADR-004 — better-auth without the `scim` and `sso` modules

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Authentication MUST use the designated proven library, and
custom authentication code is prohibited. The optional `scim` and `sso`
modules carry tracked advisories: CVE-2026-67330 in `@better-auth/scim`
(authorization bypass) and CVE-2026-80192 in `@better-auth/sso`
(`Project-Technologies.txt`, better-auth 1.6.14). The product's users are
Libyan merchants who sign in with a mobile number and password (email removed by ADR-030); enterprise SSO and
directory provisioning are not product requirements.

**Decision.** better-auth, core modules only. The `scim` and `sso` modules
are NOT enabled — the constitution requires that they MUST NOT be enabled
while the CVEs are tracked.

**Alternatives considered.**
- *Enabling `scim`/`sso` anyway.* Rejected: exploitable authorization
  surface with zero current product need.
- *Custom authentication.* Rejected: prohibited by the constitution, and a
  security-critical surface the project should not own.
- *Deferring the decision.* Rejected: the first feature that exposes an
  authentication endpoint must already enforce rate limits and secure
  sessions, so the library decision precedes the first feature.

**Consequences.** Authentication features record, under Constitution
Mandated Values: the password hashing cost factor (Argon2id, bcrypt, or
scrypt); the authentication rate limits; and the session timeout and token
lifetime. CSRF protection, output encoding, and security-header tests are due
no later than the first browser-facing feature.

---

## ADR-005 — SeaweedFS for object storage

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Uploaded supplier catalogs must be stored as objects: typically
1–4 MB, large files 10–15 MB, exceptionally up to 20 MB, hard maximum 100 MB,
up to 100 files per user, deleted automatically after 90 days. The store must
pass the Dependency Governance licence test and have an active upstream.

**Decision.** SeaweedFS (v4.48 per `Project-Technologies.txt`), Apache 2.0,
as the object store for catalog files.

**Rationale.** SeaweedFS handles very large numbers of small files
efficiently — exactly the product's workload — carries the Apache 2.0 licence
with no data-disclosure obligation, and remains actively developed. MinIO
development was discontinued in April 2026, and its licence is AGPLv3, which
the Dependency Governance list forbids in a module shipped to a merchant.

**Alternatives considered.**
- *MinIO.* Rejected on both counts: discontinued upstream (April 2026) and
  AGPLv3 — a licence obligation the constitution's list excludes from
  merchant-shipped modules.
- *Plain filesystem volume on the application host.* Rejected: it weakens the
  backup/restore and staging-parity obligations (Deployment and
  Observability) and removes the storage boundary that keeps file bytes out
  of the database path.

**Consequences.** The file-ingestion internals — exact content-type
validation, object-storage layout, and cross-merchant isolation — remain a
deferred area; the first feature that implements ingestion records the
missing rules and their ratification in its plan's Constitution Check.

---

## ADR-006 — Dark mode by default

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** The design system is one file, `wafar.single.css`, composed of
fourteen modules, and it is the only permitted source of design values.
Principle IX fixes the default mode, the palette, and the toggle's location.

**Decision.** Every page renders in dark mode by default; light mode is used
only when the user has explicitly chosen it; the mode toggle sits in the
header, adjacent to the notifications icon. All colours, spacing, motion, and
elevation values come from the design system tokens (`--brand-600`,
`--accent-500`, dark background `#0a0a0a`, surface `#121416`, primary text
`#fafafa`).

**Rationale.** Dark-first is the product's visual identity and is what the
design system's contrast scales were built and verified against; a single
default prevents the two-token drift that appears when both modes are treated
as equal first-class outputs. AA contrast holds in both modes per the design
system's accessibility rules.

**Alternatives considered.**
- *Light mode as default.* Rejected: contradicts Principle IX and the design
  system's dark-first tuning.
- *Following the operating system's preference automatically.* Rejected: the
  rule is an explicit user choice; the system default is dark, not "whatever
  the device prefers".
- *No toggle at all.* Rejected: users must be able to choose light
  explicitly, and the toggle's position is specified in the design
  requirements.

**Consequences.** Every page must default to dark on first render; the
mechanism that remembers the explicit choice is decided by the implementing
feature's plan and must stay inside the design system's rules.

**Annotation (2026-10-21, ADR-098 and ADR-102).** Two provisions above are
superseded, and neither is rewritten:

1. **The default is light, not dark.** ADR-098 (2026-10-21) fixed the default
   appearance as light and recorded it as a Wafar UI layer value; the dark-first
   rationale this record gives is not the platform's visual direction, which is
   the marine/sand palette ADR-098 fixed. The mechanism that remembers the
   explicit choice is still the implementing slice's, and the choice is still the
   user's explicit act rather than the device's preference.
2. **The toggle's place is the header, beside the notifications control.**
   ADR-099 (2026-10-21) moved the toggle into the sidebar; ADR-102 (2026-10-21)
   moved it back to the header, immediately beside the notifications control,
   with the crescent glyph of the registered IconPark set. The Decision's
   placement sentence therefore reads as the header's rule again.

The decision this record made — that the appearance is the user's explicit
choice and that both modes exist — is unchanged.

---

## ADR-007 — Project-level knowledge lives outside the feature sequence

**Status**: Accepted — 2026-10-01
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Spec Kit's core workflow loads only two things into a feature cycle:
the feature specification and `.specify/memory/constitution.md`. The knowledge
that is true for the whole product — repository and module layout, the technology
stack, the design system, the product definition, and the accepted decisions — is
not loaded by the core workflow. In a previous project this knowledge was
classified as an ordinary numbered feature (a design system appearing as feature
020). That classification makes the agent treat a project-wide rule as a piece of
work, so later features re-invent what already exists and the rules drift.

**Decision.** Project-level knowledge is recorded once, outside the feature
sequence, and is referenced by name from every feature artifact:

| Concern | Location |
|---|---|
| Engineering law, product scope, limits | `.specify/memory/constitution.md` |
| Repository and module layout | `docs/architecture.md` |
| Technology stack | `Project-Technologies.txt` |
| Design system (tokens and components) | `wafar.single.css` |
| Product definition (roles, pages, acceptance criteria) | `Core-Project.txt` |
| Accepted decisions | `docs/DECISIONS.md` |
| Slice order for the MVP | `ROADMAP.md` |

No project-level concern receives a feature number. Enforcement uses the layers
Spec Kit actually guarantees, without amending the constitution:

1. `.specify/memory/constitution.md` is loaded by every core command — the core
   workflow reads it in specify, plan, tasks, implement, analyze, clarify,
   checklist, and converge.
2. The three feature templates in `.specify/templates/overrides/` carry the
   binding "Project Context Sources" that name these files. The override stack
   resolves them as the top layer with `strategy: replace`, and the setup scripts
   materialize them into every feature (`create-new-feature.ps1`,
   `setup-plan.ps1`, `setup-tasks.ps1`), so each specification, plan, and task
   list is written against them.
3. `AGENTS.md` states the same duty to the agent outside the feature cycle.

   **Annotation (2026-10-05, ADR-048).** This item originally named
   `.clinerules/project-context.md` alongside `AGENTS.md`. That directory was
   retired with the Cline integration in ADR-048 and no longer exists; the duty
   is carried by `AGENTS.md` alone. The item is annotated rather than rewritten,
   because a decision record is a history.

**Alternatives considered.**
- *Amend the constitution to add a "read these files" MUST.* Rejected: the
  constitution is loaded already, but a rule there would put file-reading
  mechanics into the document that governs principles, and would require an
  amendment for every change to the source list. The override templates are the
  artifact-level layer for exactly this.
- *Register an `optional: false` extension hook per command.* Rejected: a hook
  executes a command; it does not itself load files, and a hook naming a command
  no installed extension provides would be broken. The general hooks in
  `.specify/extensions.yml` are therefore left empty.
- *Restate the stack, architecture, and design rules inside each feature plan.*
  Rejected: this is the repetition the decision exists to remove; it is what
  produced the drift already observed between the artifacts' pinned versions.

**Consequences.** A feature named after a project-level concern is a
classification error and MUST NOT be created. The specification template binds
product-level sources only, because naming technical sources in a specification
would breach Principle VII; the plan template binds every source. When the
constitution is amended, `docs/architecture.md` and the override templates MUST
be updated in the same change — they name its version, and a stale reference is a
drift defect.

---

## ADR-008 — Project-level registers live in the constitution; the detail stays in the sources

**Status**: Accepted — 2026-10-02
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Spec Kit's plan command loads exactly two documents into a feature
cycle: the feature specification and the constitution. The project's technology
stack, design-system structure, and product facts lived only in files that no
command reads (`Project-Technologies.txt`, `wafar.single.css`, `Core-Project.txt`),
so every plan restated them and the restatements drifted. ADR-007 accepted that
arrangement and explicitly rejected both amending the constitution to add a "read
these files" rule and restating the stack, architecture, and design rules inside
each feature plan.

**Decision.** The constitution carries the *register* of each project-level
concern, and the referenced source keeps the *detail*:

- `Technology Standards` is the register of the approved stack, plus the
  repository topology, the internal layout, the MAJOR/MINOR version rule, the gaps
  a slice MUST close with a named owning slice, and the infrastructure licence
  treatment. `Project-Technologies.txt` becomes its mirror.
- `Design System Standards` is the register of the design system: the fourteen
  module map, the token families, the breakpoints, the component inventory, the
  state map, the components the product needs and the system lacks, the
  invariants, the fonts and framework bridge, the extension procedure, and the
  honoured media states. `wafar.single.css` remains the only source of design
  values, and no value is copied into the constitution.
- `Product Register` (new) carries roles, pages, features, entities, and the
  conflicts found between the sources.
- `Single-Reference Sufficiency` (new) makes the rule explicit: a feature MUST NOT
  need a source outside the constitution for any rule it must obey.

**Alternatives considered.**
- *Copy both source files verbatim into the constitution.* Rejected. Measured: the
  constitution is 57 KB, `wafar.single.css` alone is 128 KB and holds 415 tokens,
  290 class names, and 30 keyframes. The copy would load ~198 KB into every
  command, and every design value would have two sources — the drift this record
  exists to prevent.
- *Edit the command instructions so they load the files.* Rejected as the primary
  mechanism: Spec Kit materializes command files at install time, so a hand-edited
  command is reverted by an upgrade or a preset install. The supported layers for
  that change are a preset (`commands/`) or a project-local override
  (`templates/`), resolved before the core layer.
- *Keep ADR-007's arrangement and rely on `AGENTS.md` and the template
  overrides.* Rejected: `AGENTS.md` is not in any command's load list, and the plan
  command's load list is the specification plus the constitution only. Nothing
  enforced the reading, which is why the repetition occurred.

**Consequences.** A register is a map and MUST NOT become a copy; duplicating a
source into the constitution is a drift defect. A register gap is recorded with a
named owning slice rather than closed by naming an unvetted library. Register
changes require an amendment, which is the intended cost of a single reference.
`.specify/templates/overrides/constitution-template.md` pins this document's
structure so a constitution run cannot collapse it. ADR-007 stands for its
remaining part: a project-level concern never receives a feature number.

**Follow-up (deferred, recorded rather than silent).** Converting the plan and
spec templates' HTML-comment instruction block into a normative Markdown section
is deferred: a comment-scoped instruction block is the upstream idiom (the core
templates use "ACTION REQUIRED" comments for their own instructions), and the
block is now marked NORMATIVE in place.

---

## ADR-009 — The design system's own decisions, recorded out of its source comments

**Status**: Accepted — 2026-10-02
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** The header of `wafar.single.css` says the design system is documented
in `docs/DECISIONS.md`, but its decisive choices live in its own source comments
instead: the neutral ladder decision (not the `gray` ladder), `gray` and `zinc`
re-pointed at that ladder, `accent` defined as the sky ladder, `info` defined as a
synonym of `brand`, the radius ladder aligned to Tailwind with `xl` = 1rem and
`2xl` = 1.5rem, the choice of the lighter shadow values, the z-index decision to
adopt 80..170 and drop the 1000..1080 ladder, and the reduction to six loader
designs. The file also declares eight `--screen-*` tokens that no media query
consumes, and its header points at `specs/001-wafar-design-system/spec.md` and
`node scripts/bundle.mjs`, neither of which exists in this repository.

**Decision.** The decisions above are recorded here, and `Design System Standards`
in the constitution carries the register of the system. The design system keeps a
single implementation file, and it is not re-created as a numbered feature.

**Alternatives considered.**
- *Re-create the design system as a numbered feature.* Rejected: the file is the
  implementation, not a piece of work. Numbering it would make the agent treat a
  project-wide rule as a deliverable, which is the classification error ADR-007
  names.
- *Leave the decisions in the source comments.* Rejected: a decision whose
  rationale appears only in a comment is not recorded, and the file's own header
  already points here for them.

**Consequences.** The header of `wafar.single.css` MUST name this record and MUST
remove the references to the non-existent specification and bundle script, and it
MUST declare the design system's own version. The eight declared-but-unused
`--screen-*` tokens MUST be consumed or removed under Project Structure and Debt
Control before the first surface relies on a breakpoint.

---
## ADR-010 — Constitution 2.7.1: the amendment's durable record, and the review-fix set

**Status**: Accepted — 2026-10-02
**Owning directory**: `docs/`
**Owning feature**: none yet — repository bootstrap (pre-feature record); the first feature whose plan depends on it MUST name this ADR in its Constitution Check

**Context.** Amendment 2.7.0 was reviewed and seven defects were confirmed:

1. The sync impact report block was committed although its own text names it
   scratch material to be removed, and it restated four MUSTs the document
   already states, which the analyze command extracts into the rule set.
2. Product Register called `Core-Project.txt` the product's "full definition"
   while also calling it a mirror and giving the register precedence.
3. References described three files as "complete" while the sections call them
   mirrors, and described `Project-Technologies.txt` as "the complete technology
   stack" after that file had been reduced to a pointer.
4. The Breakpoints paragraph named only `--screen-xs` as unconsumed, when the
   stylesheet contains no `var(--screen-*)` reference at all: the whole
   eight-token ladder is declared and unused.
5. The design-system version was mandated twice, in Constitution Mandated Values
   and in the design-system extension procedure.
6. "flagged" in File Processing had no representation and conflicted with the
   closed four-value status enum.
7. One normative sentence was duplicated verbatim in Principle IX and in the
   design-system state map.

The technology detail (exact versions, per-technology notes, repository trees)
had also become readable only through git history, because the file had been
reduced to a pointer.

**Decision.**
- The sync impact report MUST NOT be committed. The amendment procedure in
  Governance now states this, and the durable record of an amendment is an entry
  in this file. This PATCH therefore records its own clarifications here rather
  than in a comment block.
- `Project-Technologies.txt` is restored as the **detail** of the register:
  exact versions, per-technology notes, and repository trees. It carries no rule;
  the register keeps the gaps, the version-change rule, and the licence
  treatment. Completeness without a second source of rules.
- The seven defects are corrected in place. `wafar.single.css` is untouched: its
  4294 lines, fourteen modules, 415 unique tokens, 290 classes, and 30 keyframes
  are unchanged; only its header changed, in 2.7.0.

**Alternatives considered.**
- *Leave the sync impact report in place.* Rejected: it contradicts its own text
  and injects duplicate MUSTs into the rule set analyze extracts.
- *Keep `Project-Technologies.txt` as a pointer.* Rejected by the requirement
  that the technology detail stay complete and readable in the working tree; a
  pointer preserves recoverability but not readability.
- *Restore the technology detail into the constitution instead of the mirror.*
  Rejected: it would re-inflate the document every command loads (measured: 76 KB
  today against a 128 KB source) and give the version facts two homes.

**Consequences.** A future amendment records itself as an ADR rather than as a
comment block, so the document opens with its title. The mirror's rule is
enforceable by review: it MUST NOT name a technology the register does not name,
and MUST NOT restate a rule. The `--screen-*` ladder now carries a binding
mapping table, and the first surface that wires a token must delete the tokens it
leaves unused.

**Annotation (2026-10-04).** The counts above (4294 lines, 415 unique tokens,
290 classes, 30 keyframes) were measured on design-system v1.0.0. After
ADR-012's v1.0.1 edits the file is 4291 lines and still carries fourteen
modules and 30 keyframes. The historical figures remain here as the v1.0.0
record.

---
## ADR-011 — Mirror files confirmed as valid UTF-8

**Status**: Accepted - 2026-10-02
**Owning directory**: `docs/`
**Owning feature**: none yet - repository bootstrap (pre-feature record)

**Context.** During a constitution audit, the mirror files `Core-Project.txt`
and `Project-Technologies.txt` appeared garbled when inspected through a
Windows console with a non-UTF-8 code page. The suspicion was that they were
mis-encoded.

**Decision.** A byte-level inspection confirmed both files are valid UTF-8
with correct Arabic content (`\u0600-\u06FF` decodable, Arabic substrings
present). No re-encoding was performed. The garbled output was a console
display artifact, not a file defect. Both files, `docs/DECISIONS.md`, and the
constitution itself remain UTF-8; any future tooling that reads them MUST
decode as UTF-8.

**Consequences.** No change to file contents. The mirror-precedence rule
(constitution wins over `Core-Project.txt` and `Project-Technologies.txt`)
is unchanged.

---

## ADR-012 — Design system 1.0.1: font stack and Arabic letter-spacing

**Status**: Accepted - 2026-10-02
**Owning directory**: `wafar.single.css` (root) · register: constitution Principle IX and Design System Standards
**Owning feature**: none yet - repository bootstrap (pre-feature record)

**Context.** The audit found two drifts between `wafar.single.css` and the
constitution: the font stacks carried `Inter`, `Poppins`, and `Fira Code`
as fallbacks (the constitution permits only Tajawal, Noto Sans Arabic, and
JetBrains Mono), and Arabic body text carried positive letter-spacing
(`--text-body-letter-spacing: 0.01em`, `--tracking-wide: 0.01em`, and a
`0.005em` rule on `.dark body`), which Principle V prohibits for Arabic text.

**Decision.** `wafar.single.css` version 1.0.1:
- Font stacks reduced to the permitted families; `Inter`, `Poppins`, and
  `Fira Code` removed from the stacks.
- Body letter-spacing set to `0` for both the token and the dark-mode rule.
- The positive tracking tokens kept only where the comment scopes them to
  Latin/caps labels (`--tracking-caps`, `--tracking-brand`, `--tracking-display`),
  never applied to Arabic text.
- ROADMAP updated: R4 owns the Home four-cards question from the unresolved-facts
  table, so the conflict has an owning slice.

**Consequences.** Any future positive letter-spacing on an Arabic surface is a
Principle V/IX violation, not a preference. The version bump is recorded here as
required by the extension procedure.

**Identifier note.** The slice identifier in the decision above ("R4") is
historical and does not match ADR-015's renumbering table, whose old `R4` row is
the Catalog page (now R6). The question this record assigns — who owns the Home
four-cards decision — is now owned by **R5**, the parts-search slice, as
`ROADMAP.md` → Notes and the constitution's Product Register record. The
decision itself is unchanged; only the identifier moved.

---

## ADR-013 — Converge stays a separate command, not a workflow step

**Status**: Accepted - 2026-10-02
**Owning directory**: `.specify/workflows/`
**Owning feature**: none yet - repository bootstrap (pre-feature record)

**Context.** Spec Kit v1.0.13 ships the SDD workflow
(`workflows/speckit/workflow.yml`) as specify → review gate → plan → review gate →
tasks → implement. The `/speckit.converge` command exists in core and is documented
as a separate, append-only step run after `/speckit.implement`, repeated until it
reports Converged. An audit asked whether converge should be added to
`.specify/workflows/speckit/workflow.yml`.

**Decision.** Converge is a separate command in the binding cycle, never a step
in the engine's fixed list. `/speckit.implement` and `/speckit.converge`
are repeated as a loop (implement ↻ converge ↻ implement ↻ .) until convergence.
Converge is inherently conditional — it needs the current `tasks.md` state, not a
fixed input — so it does not fit a static step list, and encoding a conditional
step as a fixed one would make the workflow file claim to converge when it
cannot.

   **Annotation (2026-10-05, audit follow-up).** This Decision originally read
   "keeps converge outside the workflow file, matching upstream v1.0.13
   exactly". Both halves were inaccurate. The pin moved to v1.1.0 in ADR-021,
   and the workflow file *does* carry converge: `.specify/workflows/speckit/workflow.yml:139-140`
   declares `converge` as a step, annotated at line 145 as repeating with
   `implement`. The separation that was decided still holds — `converge` remains a
   distinct command and a distinct step, not a phase merged into `implement` — but
   "outside the workflow file" was never true of the file this record names as its
   Owning directory. The sentence is corrected rather than annotated, because the
   claim was the defect.

**Annotation (2026-10-03).** The pinned Spec Kit install has since moved to v1.1.0 (ADR-021); "matching upstream v1.0.13 exactly" is historical. The shape this record fixed -- converge as a separate CLI command outside the workflow engine's step list -- is unchanged: `/speckit.converge` remains a separate command, and `.specify/workflows/speckit/workflow.yml` (v1.1.0) lists it in the cycle only so the binding order reads as one sequence.

**Consequences.** Project docs that list the loop (AGENTS.md workflow note,
README) MUST show implement → converge as a repeatable pair. Any future desire
to make converge a workflow step requires a new ADR revisiting this one.

---

## ADR-014 — Constitution 2.8.0: artifact traceability and product fact clarifications

**Status**: Accepted - 2026-10-02
**Owning directory**: `.specify/memory/`
**Owning feature**: none yet - repository bootstrap (pre-feature record)

**Context.** A project audit found workflow rules and product facts present in
templates, roadmap notes, ADRs, and `Core-Project.txt` but not yet bound by the
constitution itself. Those rules were therefore visible to humans but not
reliably enforced by Constitution Check, `/speckit.analyze`, or `/speckit.converge`.

**Decision.** Add binding, additive-only material to
`.specify/memory/constitution.md` as v2.8.0: stable `SC-###` identifiers, the cap
on `NEEDS CLARIFICATION`, test-first when requested, reference tails on tasks,
repeat Constitution Check after Phase 1, the implement/converge loop, ADR
reaffirmation, UTF-8 artifact handling, one index mapping owner, sub-spec
`Input` convention, and product fact clarifications for contact fields, free
merchant use, full-cart notice, messaging visibility, and header controls.

**Consequences.** No existing principle is removed or redefined. Templates,
README, ROADMAP, AGENTS.md, and architecture notes must point to the
constitution as the authoritative source for these rules and carry v2.8.0 /
ADR-001 … ADR-014 references.

---

## ADR-015 — The slice order becomes fifteen slices, and a slice identifier equals its specification number

**Status**: Accepted - 2026-10-03
**Owning directory**: `docs/`
**Owning feature**: none - governance decision; ratified by the repository owner

**Context.** The thirteen-slice roadmap left five things without an owner, and
two ordering rules it did satisfy. The My Files page (`Core-Project.txt:91`) had
no slice: the file-intake slice's scope boundary excluded it explicitly, and the
page carries the open action toward the file-filtered Parts page and the retry action for
a failed file, which the extraction slice creates. The application shell —
header, sidebar, theme toggle, fonts, and the Tailwind-to-token bridge — had no
owner, so every browser-facing slice would have rebuilt it, and two constitution
conflicts were assigned to "the first surface that lays out a page" and "the
first slice that introduces the test runner", which no slice satisfied. Six
register gaps were assigned to "the first deploying slice" and to "the slice that
introduces persistent storage". The administrator slice did not depend on the
extraction slice whose output it administers, and it preceded the audit-log
slice while Authorization and Access Control requires every administrator
operation to be recorded.

The identifiers and the specification directories had never been reconciled: the
roadmap's `Sub-spec` column was empty for all thirteen rows, `specs/` did not
exist, and no feature branch had ever been created, so there was no historical
traceability to protect. Eight lines outside `ROADMAP.md` carried slice
identifiers — seven in the constitution's unresolved-facts and register-gaps
tables, one in ADR-012.

**Decision.** The roadmap becomes fifteen slices, renumbered so that a slice
identifier equals its specification number:

| Was | Now | Slice |
|---|---|---|
| R1 | R1 | Identity — now carries the foundation duties named above |
| — | R2 | File intake |
| R2 | R3 | Catalog extraction |
| — | R4 | My Files |
| R3 | R5 | Parts search |
| R4 | R6 | Catalog page |
| R10 | R7 | Profile |
| R5 | R8 | Cart (bookmarks) |
| R6 | R9 | Notifications |
| R7 | R10 | Messaging |
| R8 | R11 | Support surfaces |
| — | R12 | Delivery and operations |
| R9 | R13 | Admin application |
| R11 | R14 | Audit log |
| R12 | R15 | Retention |

The foundation duties are folded into the identity slice rather than given a
slice of their own: Principle VIII requires every user story to deliver
observable value and the P1 set to be a shippable MVP, a slice whose only story
is a contributor setup story cannot satisfy that, and `docs/architecture.md`
directs that a directory is created by the first feature that owns it, so
`apps/admin` and `apps/worker` are created by their own slices rather than as
empty scaffolding. Recording every administrator operation is part of the
administrator slice itself, not the later audit-log slice. The constitution is
amended to v2.9.0 with the identifier changes above and with each "first slice"
gap given a named owner. `ROADMAP.md` carries a defects table naming, for each of
the sixteen defects found, the slice that closes it.

**Alternatives considered.**
- *Keep the identity slice first and let it absorb the foundation.* Rejected as
  the identity slice's own scope; the foundation duties are large enough that
  hiding them inside authentication makes the slice's boundary unreviewable.
  (Annotated 2026-10-29, ADR-139: this sentence states the risk the decision
  accepted, not a rejected option — the decision below folds the foundation into
  identity. The foundation phase and its hard checkpoint are the mitigation, and
  the boundary is reviewed at that checkpoint. The record is annotated, not
  rewritten.)
- *A separate foundation slice with contributor stories.* Rejected: a story
  about running the project is not observable product value, and Principle VIII
  makes that a violation rather than a preference.
- *Append slices as R14, R15, R16 and leave the old numbering.* Rejected: every
  reference would then need the `Sub-spec` column to resolve, which is the
  cognitive load the alignment removes.
- *Merge My Files into file intake.* Rejected: the scope boundary excludes the
  page, and the retry action does not exist until extraction lands.
- *Keep the audit-log slice after the administrator slice and record operations
  there.* Rejected: that leaves a window in which administrator operations are
  unrecorded, which Authorization and Access Control does not permit.

**Consequences.** A reference to a slice now resolves without a lookup table.
`constitution.md`, `ROADMAP.md`, and the identifiers in ADR-012 move together;
the ADR-012 text is annotated rather than rewritten, because a decision record is
history. Each slice's specification opens with `**Input**: Parent roadmap:
ROADMAP.md → R#.`, which the binding specification template now carries. A
synonym file such as `SLICE-MAP.md` MUST NOT be created: `ROADMAP.md` is the
slice order, and a second copy is a drift defect.

---

## ADR-016 — The icon set and the shell belong to the foundation duties of R1

**Status**: Accepted - 2026-10-03
**Owning directory**: `wafar.single.css` · register: constitution Principle IX and Design System Standards
**Owning feature**: none - governance decision; ratified by the repository owner

**Context.** Three design-system obligations had no slice able to discharge them.
The icon set was assigned to the parts-search slice, but the header's account,
notifications, and theme-toggle controls are needed by the first surface the
project lays out, so the shell would either ship without icons or violate the
register. The theme toggle is listed among the components the product requires and
the stylesheet does not provide. ADR-009 requires the eight declared-but-
unconsumed `--screen-*` tokens to be consumed or removed before the first surface
relies on a breakpoint, and no slice owned that.

**Decision.** The icon set and the theme toggle are owned by the shell duties in
R1, and the constitution's register-gap row for the icon set names R1.
`wafar.single.css` moves to 1.1.0 in R1's change: the self-hosted Tajawal and
JetBrains Mono delivery, the icon set, the theme toggle, and the disposal of every
`--screen-*` token the new shell does not wire to a media query.

**Alternatives considered.**
- *Leave the icon set with the parts-search slice and ship an iconless shell.*
  Rejected: the header controls are inoperable without it, and the product fact
  clarifications require them on every page header.
- *Wire all eight `--screen-*` tokens in R1.* Rejected: a token is wired only
  where the shell changes at that breakpoint; the remainder are deleted, as
  ADR-009's "consumed or removed" requires.

**Consequences.** Every later slice composes the shell rather than rebuilding it.
A component genuinely missing later is still added to `wafar.single.css` by the
slice that first needs it, and the module map is updated in the same change.

**Annotation (2026-10-21, ADR-099).** The theme toggle remains an R1 shell duty,
but its place is the sidebar; the header no longer carries it. The icon-set duty
is unchanged.

**Annotation (2026-10-21, ADR-102).** The theme toggle remains an R1 shell duty,
and its place is the header once more: ADR-102 moved it out of the sidebar and
into the header, immediately beside the notifications control, drawn with the
crescent glyph of the registered IconPark set. The icon-set duty is unchanged.


---

## ADR-017 — Shell scope and the sidebar conflict

**Status**: Accepted - 2026-10-03
**Owning directory**: `.specify/memory/constitution.md` (Principle IX, Product Register), `Core-Project.txt`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** Principle IX and the design-system tokens required a sidebar that is fixed and always visible on desktop, and a header that was described differently in Core-Project.txt; Core-Project.txt had no sidebar at all. The product image for the desired shell shows auth-free chrome: the logo in the sidebar header, account/notifications/theme/collapse in the header. Sidebar items outside the product scope (compare, search history, subscriptions, payments) appeared in that image.

**Decision.** The application shell (header plus sidebar) renders on the public pages and the authenticated merchant area only. Auth pages (sign-in, sign-up, forgot-password), 404, static policy/FAQ/contact pages use a bare layout with no header and no sidebar; the administrator application has its own independent shell. The sidebar is 19rem wide on desktop and never hides or slides off-screen; the header's collapse control narrows it to an icon rail on desktop, and on mobile it becomes a drawer that the same control opens and closes. The sidebar header carries the platform logo; the header carries account, notifications, theme toggle, and the sidebar collapse control.

   **Annotation (2026-10-05, audit follow-up).** The Decision originally read "the
   sidebar is 19rem fixed on desktop". ADR-037 later narrowed "fixed" to mean
   "always on screen, never slid away", because Principle IX now requires the
   collapse control to narrow it to an icon rail; the constitution states this at
   its Sidebar decision values. The scoping decision this record made is unchanged:
   which surfaces carry the shell, and that the sidebar is always present on
   desktop rather than collapsible away. Sidebar navigation is limited to the in-scope pages per role; out-of-scope items are removed from the specification. R1 is the visual reference implementation for the shell.

   **Annotation (2026-10-21, ADR-099).** The shell's control composition changed:
   the logo sits in the header, which carries only the logo/home and account
   controls, and the theme switch and the sidebar-collapse control sit in the
   sidebar. The scoping decision — which surfaces carry the shell, and that the
   sidebar is always present on desktop — is unchanged.

   **Annotation (2026-10-21, ADR-102).** The header's control composition
   changed again: it now carries the notifications control and the theme switch
   beside it, in addition to the logo/home control and the account control, so
   the header carries the theme toggle this record's Decision named. The
   sidebar-collapse control stays in the sidebar, where ADR-099 put it and where
   it belongs beside the thing it collapses. The scoping decision — which
   surfaces carry the shell, and that the sidebar is always present on desktop —
   is unchanged.

**Consequences.** Every browser-facing slice composes this shell; none rebuilds it, and none places it on auth or admin screens. R1 implements the shell and the auth pages without it.

---

## ADR-018 — Structure registers closed the gaps left by Principle X and ADR-017

**Status**: Accepted - 2026-10-03
**Owning directory**: `docs/architecture.md`, `Project-Technologies.txt`, `.specify/memory/constitution.md`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** Principle X fixes the API module list, and Technology Standards fixes the internal layout, but the registers did not yet cover: the web layouts that ADR-017 requires (shell vs bare auth), the admin frontend layout, the file-level ownership of `packages/db/schema`, and `packages/search` was missing from the Monorepo row of the mirror. `docs/architecture.md` also labelled its module map "proposed", which invited drift.

**Decision.** Constitution 2.9.2: (a) `apps/web` and `apps/admin` include `layouts`; (b) `apps/admin/{pages,components,composables,stores,layouts}` is the fixed location of the admin frontend; (c) `packages/db/schema/<module>.ts` — one file per module, the table it declares belongs to that module; (d) `docs/architecture.md` module map is binding, not proposed; (e) `Project-Technologies.txt` mirror lists `packages/search` in the Monorepo row.

**Consequences.** Every later slice's plan Ownership Map must match these fixed locations. R1 is the first to create the workspace and must follow them exactly; a documentation-drift check on paths/module names belongs to R1/R2.

---

## ADR-019 — One domain model, one authority, and the register defect it closes

**Status**: Accepted - 2026-10-03
**Owning directory**: `docs/domain-model.md`, `.specify/memory/constitution.md` (Product Register, Single-Reference Sufficiency, Design System Standards), `Core-Project.txt`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** A review of the governing layer against the standard set of naming-reference documents found the data model held in three places at once, and the three had already diverged:

1. `.specify/memory/constitution.md` → Product Register → Data entities: ten entities, 51 fields, no types.
2. `Core-Project.txt` §8: ten entities, roughly 66 fields, plus soft deletion, plus the `AuditLog.target` format, plus a polymorphic `Message.sender_id`.
3. `specs/[###-feature]/data-model.md`: the per-feature output of `/speckit.plan` Phase 1, which no slice has produced yet.

Nothing said which was authoritative for the logical model. Seven facts existed only in the Arabic mirror — `User.status`, `Catalog.size`, `Catalog.mime_type`, `Part.page`, `Part.row`, `ContactMessage.status`, `ContactMessage.admin_note` — and by the Product Register's own rule ("a fact absent from this register MUST NOT be built without amending it") they were unbuildable, while R13's "block user" had no field to write. Three conflicts were invisible because nobody compared the copies: how a message's sender is represented when it may be a merchant or an administrator; whether `Conversation` carries an administrator reference when every administrator sees the same thread; and whether an administrator is a role on `User` or a distinct principal that `Conversation` and `AuditLog` refer to.

The same review found the register itself violating its own rule in two further ways. The constitution required a boolean `first_page_metadata_incomplete` on the catalog record in File Processing Overview step 4 and defined it in the Glossary, while the entity list that R3 would implement did not carry it. And Design System Standards named a shadow `brand` among the named shadows, while `wafar.single.css` — the only permitted source of design values — defines no `--shadow-brand`, only the `--shadow-brand-sm/md/lg` tints.

**Alternatives considered.**

- *Keep all three copies and reconcile them field by field.* Rejected: reconciliation is a one-time fix and the copies re-diverge on the next slice that adds a field. Single-Reference Sufficiency already names this failure — "a register that duplicates its source is a drift defect, because the two copies will disagree" — so keeping them would have left a standing violation, not a resolved question.
- *Make the constitution's entity list the single authority and reduce the mirror.* Rejected on the same rule, read from the other side: the constitution already forbids a table definition inside itself, and 51 fields is a table definition. The register that must stay small cannot also be the detail.
- *Write a project-level Data Dictionary with every column's type and constraint.* Rejected: columns are **Catalog data shape**, a deferred area whose ratification belongs to R3. Fixing the columns here would ratify a deferred area before the slice that owns it, which the constitution's Deferred areas clause forbids.
- *Promote one of the existing copies to authority by fiat.* Rejected: the copies disagree on facts, so promoting one would silently decide three product questions that the governance requires a named slice to decide.

**Decision.** Constitution 2.10.0:

1. `docs/domain-model.md` is the source of truth for the **logical** model — entities, relationships, cardinality, invariants, and the owning module of each. It carries no column type and no SQL.
2. The constitution's Data entities section becomes a map: entity, owning module, one-line meaning. It names `docs/domain-model.md` as its source, and states that an entity absent from the map MUST NOT be introduced without amending the register.
3. `first_page_metadata_incomplete` is registered as a binding cross-entity fact on `Catalog`; **soft deletion** for `User` and `Catalog` is registered alongside it; and the `AuditLog` target's `type:id` form is registered, because removing `Core-Project.txt` §8 removed the only place it was written and a format no register names is a format no feature can be held to. All three were previously required by another section or by the product mirror while being absent from the register.
4. The three sender and administrator conflicts are recorded in Unresolved product facts and assigned to R10 (sender representation; the conversation's administrator reference) and R13 (whether an administrator is a distinct entity), rather than decided here.
5. Single-Reference Sufficiency gains the symmetric half of its register rule: a register row MUST name a value its source actually defines, and a row naming a token or field the source lacks is corrected by amending the register, not by inventing the value. This is the clause that would have caught `--shadow-brand`.
6. The shadow register is corrected to the tokens `wafar.single.css` actually defines, and states that a single `brand` shadow does not exist.
7. `docs/domain-model.md` is added to References, and the constitution's preamble now distinguishes what it governs about the data model (which entities exist, which module owns each, which rules bind) from what it defers (columns, types, constraints).
8. `Core-Project.txt` §8 points at `docs/domain-model.md` instead of holding a third field list.

**What deliberately did not change.** No column, type, index, or constraint was written; the seven facts that exist only in the mirror are not added to the register, because each belongs to the slice that must decide it (R1 for `User.status`, R2 for `Catalog.size` and `Catalog.mime_type`, R3 for `Part.page` and `Part.row`, R11 for `ContactMessage.status` and `ContactMessage.admin_note`). Each is carried as a numbered unresolved fact in `docs/domain-model.md`, named by its original identifier so a slice can map its question back to this record. Two further questions were surfaced while writing that document and are recorded the same way rather than answered here: whether the `auth` module owns any stored entity, given that Technology Standards fixes `packages/db/schema/auth.ts` while no registered entity is owned by `auth` (R1); and whether an administrator is a distinct entity or a role on `User` (R13).

The glossary stays inside the constitution: it is already the declared naming authority for `spec-template.md`, and moving it would break that binding reference to buy nothing. Its `Part` and `Catalog` definitions continue to list a part's fields and a catalog's metadata, which is a register holding a partial list rather than a pure map. That is retained deliberately, because the **Catalog data shape** deferred area is defined *relative to* the Glossary's list — "the fields a part carries beyond those listed in the Glossary" — so emptying it would leave that deferred area with nothing to point at. Reducing the glossary to pure pointers is therefore a later amendment, not part of this one.

No exception was granted; the exception register stays empty.

**Corrections made before ratification.** This record was written against constitution 2.10.0, which had not been committed, so its errors were corrected in place rather than by a version bump. Four were found by a second review of the amendment against its own rules: the Context paragraph said "six facts" while listing seven, and the "deliberately did not change" paragraph named only five of them; and `docs/domain-model.md`, while claiming to decide nothing deferred, stated a part's page and row of origin as an invariant and drew `User → AuditLog` in its relationship diagram — the first settling a question this record assigns to R3, the second settling one it assigns to R13. Both were removed, the second by leaving `AuditLog` out of the diagram with a note saying why. The version stays 2.10.0 because 2.10.0 has no committed predecessor to bump from.

**Consequences.** A slice that changes an entity, a relationship, or an invariant now changes a registered product fact and MUST amend the register, record an ADR, and update `docs/domain-model.md` in the same change. A slice that introduces a column owns it in its own `data-model.md` and its migration; the two are no longer confused. R1, R2, R3, R11 and R13 each carry an open data-model question by name, so none of them can pass its Constitution Check by silently choosing.

**Annotation (2026-10-05, audit follow-up).** The Context's statement that seven facts "existed only in the Arabic mirror" is corrected by ADR-034: the field identifiers named there (`User.status`, `Catalog.size`, `Catalog.mime_type`, `Part.page`, `Part.row`, `ContactMessage.status`, `ContactMessage.admin_note`) appeared in earlier drafts of the unresolved-facts table, not in `Core-Project.txt`. The current `docs/domain-model.md` carries rows 7–11 alone and attributes none of the identifiers to the product mirror. The decision this record made is unchanged; only the provenance sentence is superseded.

**Annotation (2026-10-08, ADR-074).** Item 4 above and the Consequences paragraph assign three of those facts to slices that no longer decide them: the administrator-representation question (#6) to R13, and `User.status` (#7) and the `auth` module's stored entity (#8) to R1. ADR-067 resolved all three on 2026-10-07 — the administrator is a role on `User`, `User.status` is `active` or `blocked`, and `auth` owns `Session` — so the sentence "R1, R2, R3, R11 and R13 each carry an open data-model question by name" now holds for R2, R3, and R11 only. The decision this record made is unchanged; only its assignment of those three facts is superseded.

---

## ADR-020 — Constitution register restored to its own rules

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.10.1.

**Owning directory**: `.specify/memory/`, `.specify/templates/overrides/`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Provenance (2026-10-03).** This record was reconstructed from review material
after the uncommitted working-tree copy of this file was reverted by mistake. The
decision, its date, and its constitution version are unchanged; the wording is a
faithful summary rather than the original text. A reviewer holding the original
copy should replace this record with it.

**Context.** An audit of the 2.10.0 constitution found register rows whose
mandatory values lived in a different section than the constitution rules
naming them, and a few rules that repeated another section verbatim instead of
referencing it.

**Decision.** The constitution's registers were restored to consistency with
the rules that govern them. No rule was removed; overlapping sentences were
relocated or replaced by a reference to the section that owns them. No deferred
area was ratified, and no principle was added, removed, or redefined. The
version bump to 2.10.1 is PATCH: clarifications and non-semantic refinements
only.

**What deliberately did not change.** No principle text, module map, ownership
decision, or usage limit. The sync impact report produced during the amendment
was treated as review material and not committed, as the Governance section
requires.

**Consequences.** The version stamps in `architecture.md`, `domain-model.md`,
and `ROADMAP.md` moved to 2.10.1.

---

## ADR-021 — Spec Kit 1.1.0 and Node 22 LTS pin

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.10.1
(unchanged; this is a tooling pin, not a governance amendment).

**Owning directory**: `.specify/`, `docs/`, `Project-Technologies.txt`
**Owning feature**: none — governance decision; ratified by the repository owner

**Provenance (2026-10-03).** Reconstructed from review material after the
uncommitted working-tree copy of this file was reverted by mistake; the decision
and its version are unchanged, the wording is a faithful summary. A reviewer
holding the original copy should replace this record with it.

**Context.** The local Spec Kit install was `1.0.13`; upstream `v1.1.0` was
available. The install was upgraded, and the pinned runtime was swept for the
CI provider and the Node LTS line.

**Decision.** Pin Spec Kit to `>=1.1.0` and Node to the 22 LTS line. `/speckit.analyze`
is binding only where the cycle is invoked by hand; the bundled engine workflow
does not run it. ADR-013's statement "matching upstream v1.0.13 exactly" still
holds in shape for the pinned engine, and the command surface was re-verified.
Integration manifests and the mirror were regenerated, not hand-edited.

**Consequences.** None for governance content; the register is unchanged.

**Annotation (2026-10-05, ADR-049).** The Decision's statement about
`/speckit.analyze` was true when the record was made and is superseded on one
point only. ADR-033 item 6 amended the constitution's Artifact Workflow wording
to "by the engine workflow or by hand", and the bundled workflow at
`.specify/workflows/speckit/workflow.yml` runs `speckit.analyze` as a numbered
step, as `AGENTS.md` and `README.md` state. `/speckit.analyze` is therefore
binding in both invocation paths. The Spec Kit and Node pins in the same
Decision are unaffected and stand.

**Annotation (2026-10-08, ADR-081).** The local Spec Kit install was upgraded
from 1.1.0 to 1.1.2. The pin's floor (`>=1.1.0`) still holds and the Node 22 LTS
line is unaffected, so the Decision stands; only the installed version moved. The
project's scaffold — its `.specify/` templates, scripts, manifests,
`init-options.json`, `integration.json`, and `workflow.yml` — was left at 1.1.0,
the version that created it; re-scaffolding is a separate decision (ADR-081).

---

## ADR-022 — Constitution 2.10.2 (audit fixes)

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.10.2.

**Owning directory**: `.specify/memory/`, `.specify/templates/overrides/`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Provenance (2026-10-03).** Reconstructed from review material after the
uncommitted working-tree copy of this file was reverted by mistake; the decision
and its version are unchanged, the wording is a faithful summary. A reviewer
holding the original copy should replace this record with it.

**Context.** A second audit pass over the amendment material found stale
statements left by the same working session that produced 2.10.1:
references to the old Spec Kit version, an uncommitted Sync Impact Report
reference, and mirror files whose version stamp had not moved.

**Decision.** Constitution 2.10.2 records the audit corrections: version
stamps moved to 2.10.2, the Spec Kit pin re-stated, and the artifact workflow
references brought into line. No rule was removed; the bump is PATCH and
records clarifications only.

**What deliberately did not change.** No principle, module map, or ownership
decision was altered. The bump is PATCH under the versioning policy.

**Consequences.** `architecture.md`, `domain-model.md`, and `ROADMAP.md` move
to 2.10.2. Manifest hashes for the edited override template were re-recorded
in `.specify/integrations/speckit.manifest.json`.

---

## ADR-023 — Constitution 2.11.0 (security hardening, anti-spam, static design enforcement, ops controls)

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.11.0.

**Owning directory**: `.specify/memory/`, `.specify/templates/overrides/`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** A deep review of the constitution found gaps in file-intake
security (uploads are ZIP-based Word/Excel/PDF, un-scanned), account
enumeration, brute-force lockout, unauthenticated anti-spam without CAPTCHA,
worker durability (BullMQ retries, DLQ, temp-file cleanup), large-upload
transport (100 MB buffering), session revocation, tenant-isolation test
obligations, staging data anonymisation, API versioning/deprecation, SBOM and
SAST, supported-browser and Lighthouse budgets, and static enforcement of
RTL/design tokens.

**Decision.** Constitution 2.11.0 records the following binding controls:

1. **Content safety** (File Processing Rules): magic-byte validation, ClamAV,
   a decoded-size cap recorded under Constitution Mandated Values, and macro
   stripping before extraction; rejected files are not stored.
2. **Account enumeration, lockout, and anti-spam** (Identity): uniform
   responses, a five-attempt / fifteen-minute lockout, honeypot
   fields, a minimum time-to-submit, and per-client rate limits; CAPTCHA is
   NOT used. Administrator bootstrap is a seeded CLI command with a forced
   password change.
3. **Upload transport**: presigned multipart uploads stream to object storage;
   the API MUST NOT buffer a 100 MB file in memory.
4. **Worker durability**: bounded retries with exponential backoff, a
   dead-letter queue, a per-worker concurrency cap, and a temp-file sweep;
   exhausted jobs surface `failed` with a retry action that does not
   re-upload bytes.
5. **Session revocation**, **tenant-isolation query-path test**, **staging
   data anonymisation**, **monitoring and alerting** (p95 latency, search
   p95, processing success rate, queue depth), **API versioning and
   deprecation** (`/api/v1`, one-release notice), and **supply-chain
   controls** (per-build SBOM, vulnerability/SAST scan).
6. **Design-token static enforcement**: Stylelint and ESLint fail the build on
   physical direction properties and non-token colour/radius/shadow/duration/
   z-index values.
7. **Performance budget**: a Lighthouse budget (LCP, INP, CLS) enforced by
   Lighthouse CI on at least the public Parts and Home pages.
8. **Product scope clarifications**: PWA and CAPTCHA are explicitly out of
   scope; anti-abuse is honeypot + time-to-submit + rate limit only.

**What deliberately did not change.** No principle, module map, ownership
decision, or usage limit was removed or redefined; CAPTCHA was prohibited and
PWA was not added. The bump is MINOR because new binding guidance was
added without removing or redefining a principle.

**Consequences.** The version stamps in `docs/architecture.md`,
`docs/domain-model.md`, `ROADMAP.md`, and `Project-Technologies.txt`, together
with the binding-block version strings in the `spec-template.md` and
`plan-template.md` overrides and the footer of the `constitution-template.md`
override, move to 2.11.0; `Project-Technologies.txt` and `docs/architecture.md`
also record ClamAV, Stylelint, Semgrep/osv-scanner, Lighthouse CI, pg_anonymize,
BullMQ DLQ/backoff, and presigned SeaweedFS multipart uploads. New product
capabilities (public part detail pages, saved-search alerts, email notification)
are deferred: each requires a separate MAJOR constitution amendment before a
slice may implement it.

---

## ADR-024 — Constitution 2.11.1: Stylelint named in Technology Standards

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.11.1.

**Owning directory**: `.specify/memory/`, `.specify/templates/overrides/`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** An audit found that Design System Standards (Static enforcement)
and ADR-023 already mandated Stylelint as a build gate, but Technology
Standards' Repository topology row for `packages/config` and the Approved
register's Quality row named only ESLint and Prettier. A register must name
the tooling it governs; otherwise the gate has no register owner.

**Decision.** Add Stylelint to the `packages/config` row and to the Quality
row in Technology Standards. The bump is PATCH: a clarification that names
tooling already made binding elsewhere, with no principle, module map,
ownership decision, or usage limit changed.

**What deliberately did not change.** No principle text, no scope, no limits.
The durable record of this amendment being committed is this entry; the
Sync Impact Report produced during `/speckit.constitution` is review material
and is not committed.

**Consequences.** Design System Standards' existing mandate now has a named
owner in Technology Standards. The following move to 2.11.1 in the same change:
the version footer of `.specify/memory/constitution.md`; the binding-block
version strings in the `spec-template.md` and `plan-template.md` overrides and
the footer of the `constitution-template.md` override; the version stamps in
`docs/architecture.md`, `docs/domain-model.md`, and `ROADMAP.md`; and
`Project-Technologies.txt`, which gains a `Constitution 2.11.1 additions`
section. The constitution-template override also records the same-change sync
rule these moves follow. The three integration manifests under
`.specify/integrations/` have the hashes of every edited file re-recorded, as
ADR-022 established for the previous template edits.

---

## ADR-025 — The Segoe UI fallback leaves the Tajawal font stack

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.11.1
(unchanged; this is a design-value correction, not a governance amendment).

**Owning directory**: `wafar.single.css`, `.specify/memory/`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** `wafar.single.css` carried `"Segoe UI"` in `--font-sans` and
`--font-display`. Principle IX and Design System Standards' Invariants permit
only Tajawal, Noto Sans Arabic (as the fallback the stylesheet itself declares),
and JetBrains Mono; any other typeface is prohibited without exception. ADR-012
removed `Inter`, `Poppins`, and `Fira Code` from these stacks for the same
reason and did not list Segoe UI, so the name survived that pass. A named
typeface in a font stack is a design value, and an unregistered one is a
Principle IX violation regardless of which font the client actually resolves.

**Decision.** Remove `"Segoe UI"` from `--font-sans` and `--font-display`. The
stacks become `"Tajawal", "Noto Sans Arabic", system-ui, sans-serif` and
`"JetBrains Mono", ui-monospace, monospace`, which is the state ADR-012's
decision describes.

**Version handling.** `wafar.single.css` stays at its declared `1.0.1` for this
correction because ADR-016 reserves `1.0.2` for the font delivery, icon set,
theme toggle, and `--screen-*` disposal that belong to R1's shell change; a
compliance correction that restores the already-decided stack is not a new
extension of the system and must not consume that version.

**Annotation (2026-10-05, audit follow-up).** The reference above to "ADR-016
reserves `1.0.2`" is imprecise: ADR-016 reserves `1.1.0` for R1's shell change,
and `1.0.2` was in fact consumed by ADR-038's removal of the undeclared
`--sidebar-width-collapsed` token. R1's shell change records its own
`wafar.single.css` version under Constitution Mandated Values; the constitution
stays open on the exact number, and neither `1.0.2` nor `1.1.0` is a settled
constant.

**What deliberately did not change.** No module map entry, no token value, no
typeface outside the three permitted families. The generic keywords
`system-ui`, `sans-serif`, `ui-monospace`, and `monospace` are retained: they
name no typeface and are what keeps Arabic text rendering when the self-hosted
webfont has not loaded. ADR-012 fixed the font stacks and named no icon set or
theme toggle; this record does not widen it.

**Consequences.** The declaration now matches the register it is governed by, so
a Stylelint or ESLint gate needs no exception for the stacks. R1 records the
stylesheet's version under Constitution Mandated Values when it performs its
shell change; the number is not `1.0.2` (consumed by ADR-038) and is open, as
the annotation above states.

---

## ADR-026 — Git Branching Workflow Extension adopted; mandatory feature branches

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.11.1
(unchanged; this records an extension adoption, not a governance amendment).

**Owning directory**: `.specify/`, `docs/`, `.specify/extensions/git/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** The bundled Spec Kit extension `git` (v1.0.1, MIT) was installed.
Its `before_specify` hook (`speckit.git.feature`, optional: false) makes
feature branch creation **mandatory and automatic** before every `/speckit.specify`.
The extension is bundled, requires no network install, and operates purely
locally — no credentials or network access are needed. The `auto_commit`
feature is disabled by default in `git-config.yml`; no automatic commits occur.

**Decision.** Adopt the `git` extension as a permanent part of the Wafar
development workflow. The mandatory `before_specify` hook (`speckit.git.feature`)
ensures every feature specification is developed on its own sequentially
numbered branch (`001-feature-name`, matching `feature_numbering: sequential`
in `init-options.json` and ADR-015's `specs/007-<name>` convention). The
`before_constitution` hook (`speckit.git.initialize`, optional: false) is a
no-op on an existing repository. The 15 auto-commit hooks are registered but
remain disabled by default in `git-config.yml` (`auto_commit.default: false`);
no automatic commits occur unless explicitly enabled in `git-config.yml`.

**What deliberately did not change.** No auto-commit behavior is enabled.
The `commit_style: fixed` default would produce commit messages without the
required `FR-###`/`AC-###` references (Principle I); enabling auto-commit
would require `commit_style: conventional` with agent-generated messages that
include the required identifiers, or a custom message template that includes
them. The `git add .` in auto-commit stages all changes; enabling it would
risk committing unrelated changes in a governance repository. No principle,
module map, ownership decision, or usage limit is altered.

**Consequences.** The binding cycle now effectively begins with an automatic
feature branch creation before specification. The following documents are
updated in this change to reflect the new cycle: `AGENTS.md` §5, `README.md`
Development workflow, and
`.specify/workflows/speckit/workflow.yml`. The constitution version remains
2.11.1. The extension is recorded in `.specify/extensions.yml` and
`.specify/extensions/.registry`; its manifest hashes are recorded in the
three integration manifests per ADR-022 practice.

**Annotation (2026-10-06, ADR-060).** This record names `git-config.yml` as
where the `auto_commit` default and the commit-hook states live. No such file
exists in this repository: `.specify/extensions.yml` is the hook-state source,
and every `speckit.git.commit` hook is `enabled: false` there, which is the
state this record describes. The claim about the default was right and the
claim about the file was wrong; the text above is left as it was written,
because a decision record is a history.

---

## ADR-027 — Audit fix set: ADR stamps, workflow version, hook state, cline registration, CSS token

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.11.1
(unchanged; this is a documentation/config consistency fix set, not a
governance amendment).

**Owning directory**: `.specify/`, `.specify/memory/`, `.specify/templates/overrides/`, `docs/`, `wafar.single.css`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** A deep audit (2026-10-03) found register drift that the
constitution's own Single-Reference Sufficiency rule treats as a defect:
four files still stamped `ADR-001 … ADR-024` after ADR-026 landed; the
workflow registry disagreed with the workflow file on the version; ADR-026
described the `git.commit` hooks as disabled while `extensions.yml`
registered them `enabled: true`; the `cline` integration lacked the git
command files and was not registered for `assess`/`bug`/`git` in the
registry; the roadmap added a quota nuance absent from the constitution;
and `wafar.single.css` hardcoded a duration on the `body` transition.

**Decision.**

1. `AGENTS.md`, `README.md`, `ROADMAP.md`, and `docs/architecture.md` are
   restamped to `ADR-001 … ADR-026`.
2. `.specify/workflows/workflow-registry.json` is aligned to the workflow
   file's own version, `1.1.0`.
3. Every `speckit.git.commit` hook in `.specify/extensions.yml` is set to
   `enabled: false`, making the registered state match ADR-026 and
   `git-config.yml` (`auto_commit.default: false`). Re-enabling requires
   editing both files, by design.

    **Annotation (2026-10-06, ADR-060).** No `git-config.yml` exists in this
    repository; `.specify/extensions.yml` is the hook-state source, and this
    item's outcome is exactly as recorded there. The file named in the text
    above never existed here, and "editing both files" therefore reduces to
    editing the one. The text is left unrewritten for the reason ADR-058 set
    out.
4. The `cline` integration gains the git command files under
   `.clinerules/workflows/` (frontmatter `name: speckit-git-*`, mirroring
   the opencode copies), the `cline.manifest.json` is rebuilt to cover all
   registered workflow files, and `.registry` now lists `cline` under the
   `git` extension's `registered_commands`.

   **Annotation (2026-10-05, ADR-048).** The `cline` integration and the
   `.clinerules/` tree were retired by ADR-048. This item records what the
   extension registered at the time; neither path exists today.
5. `ROADMAP.md`'s upload-quota note is aligned to the constitution: the
   limits are `50 files per calendar month, 100 files in total`, with no
   deleted-files exception. Any such exception requires a constitution
   amendment first.
6. The `body` transition in `wafar.single.css` now uses
   `var(--duration-slow)` instead of a hardcoded `400ms`, so the static
   token-enforcement gate has a real target.

**What deliberately did not change.** No constitution text, no module map,
no principle, no ownership decision, no usage limit, and no design token
value. The stagger ladder `.ds-delay-*` (100/200/300/400/500ms) is kept:
it is a defined animation-delay scale, not a motion-duration token.

**Consequences.** The registers agree with their sources again; cline
reproduces the same command surface as opencode; and the next audit pass
should find no stamp drift.

---

## ADR-028 — Constitution 2.12.0: quota window and contact-message path

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.12.0.

**Owning directory**: `.specify/memory/`, `docs/`, `Core-Project.txt`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** A deep audit of `ROADMAP.md` against the constitution found two
facts the constitution underdetermined: the window semantics of the monthly
upload limit ("50 files / month" while ADR-027 recorded "50 files per calendar
month"), and the path by which a `ContactMessage` reaches the administrator
(unresolved product fact #5, deferred to R11, with no administrator surface
registered for it).

**Decision.** Constitution 2.12.0, two changes:

1. **Usage Limits.** The monthly upload limit is stated as "50 files per
   calendar month", aligning the constitution with ADR-027 and `ROADMAP.md`.
2. **Contact-message path.** A `ContactMessage` reaches the administrator
   through a dedicated administrator page, "Contact messages", added to
   Product Scope's Administrator's Application table. The unresolved-facts row
   is removed from the constitution's Product Register and re-recorded as a
   resolved conflict. The page count moves from twenty-five to twenty-six, and
   R13 (which already depends on R11) owns its surface.

**What deliberately did not change.** No principle, module, entity, budget,
limit, or register gap was added, removed, or redefined. The bump is MINOR
because Product Scope gained a page.

**Consequences.** ADR-029 closes roadmap defect #6 and marks open question #5
resolved in `ROADMAP.md` and `docs/domain-model.md`. The constitution's version
stamps in `docs/architecture.md`, `docs/domain-model.md`, `ROADMAP.md`,
`Project-Technologies.txt`, and the template-override binding blocks move to
2.12.0 in the same change. `AGENTS.md` and `README.md` do not carry a
constitution version stamp (the Governance amendment procedure names only the
constitution footer, the template overrides, the constitution-template
scaffold, `docs/architecture.md`, `docs/domain-model.md`, `ROADMAP.md`, and
`Project-Technologies.txt`). `Core-Project.txt` mirrors the new admin page row.

---

## ADR-029 — Roadmap dependency and ownership corrections

**Status**: Accepted. **Date**: 2026-10-03. **Constitution version**: 2.12.0
(unchanged; governance documents only).

**Owning directory**: `ROADMAP.md`, `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** The same audit found roadmap defects: the `suppliers` module had
no owning slice; R10's "notification on reply" required the notifications
module that R9 introduces; R15's deletion path must withdraw bookmarks (R8);
R5's Home cards depend on R1/R2 counters; the presigned multipart upload
transport was assigned to R3 although the upload endpoint belongs to R2;
`/api/v1` versioning was assigned to R2 although the first HTTP surface is R1;
R2's file-ingestion internals ownership was missing from the deferred-areas
note; and defect #16's phrasing read as a typo.

**Decision.** `ROADMAP.md` is corrected:

1. R3 creates the `suppliers` module during first-page supplier extraction;
   R13 administers it.
2. R10 depends on R1 **and R9**.
3. R15 depends on R3 **and R8**; index lifecycle note unchanged.
4. R5 depends on R1, R2, **and** R3 (Home counters need accounts, files,
   parts, and the search event counter R5 must define).
5. The Home "searches" counter's storage is decided by R5 and recorded as an
   ADR; no entity owns it today.
6. The presigned multipart upload transport belongs to R2 (the upload surface).
7. `/api/v1` versioning belongs to R1 (the first HTTP surface).
8. The deferred-areas note names R2 for file ingestion internals.
9. Defect #16 rephrased to "R10 (مرتين)، R13"; defect #6 closed by ADR-028.
10. Open question #5 is marked resolved; questions #1–#4 and #6–#11 stay open.

**What deliberately did not change.** No slice is added, reordered, or merged;
no scope boundary is widened beyond the ownership corrections above.

**Consequences.** Every slice's `Depends on` now matches the modules and
entities its scope names. The consistency gate can verify ownership without
cross-reading data-model notes.
