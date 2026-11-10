## ADR-118 — The upload-quota amendment: 50/300, no lifetime total, and the administrator ceiling

**Status**: Accepted — 2026-10-23
**Owning directory**: `.specify/memory/`, `docs/`, `ROADMAP.md`,
`Core-Project.txt`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** ADR-117 adopted the capacity envelope and recorded the target quota
model, but the constitution still bound 50 uploads per calendar month and 100
files in total. A merchant uploading 30–50 files a month reaches the 100-file
total in two or three months and then cannot upload again, while the product's
six-month plan assumes monthly uploads continue. The product also needs an
administrator per-user quota override; `PlatformSetting` cannot carry it because
ADR-067 excludes Usage Limits from that entity. The amendment must remove the
lifetime cliff, define the active quota and its deletion semantics, and authorize
the administrator ceiling without turning the Settings page into a second source
of Usage Limits. The repository has no application code, no schema, and no
production data; R1 is in specification, and R2/R13 are planned.

**Decision.** The constitution is amended to **4.0.0** — a MAJOR amendment,
because a binding Usage Limit is removed and another is redefined.

1. **Usage Limits become:**
   - 50 uploads per calendar month per user.
   - 300 active stored files per user.
   - No lifetime upload total.
   - Administrator-granted monthly ceiling: 500 files per calendar month, per
     user, exception only.
   - Administrator-granted active ceiling: 1,500 files per user, exception only.
   - A quota above either ceiling requires a further amendment.
2. **The quota semantics are explicit.** The monthly count counts upload events
   in the calendar month and is not restored by deletion. The active count counts
   files whose bytes, parts, bookmarks, and search-index entries are present; a
   merchant delete, an administrator delete, or the 90-day retention job releases
   an active slot, and a soft-deleted catalog row does not count. Quota checks are
   server-side and atomic. Lowering a quota never deletes a file and only blocks
   new uploads until the account is under the new limit; raising a quota takes
   effect immediately.
3. **The per-user quota is carried by `User`, not by a new entity.** The
   constitution's `User` row gains optional monthly and active overrides, and the
   domain model records the null-means-default rule, the ceilings, the ownership,
   the enforcement point, and the audit. The `users` module owns the fields; the
   `catalogs` module (R2) enforces the effective quota atomically; the `admin`
   module (R13) sets it; the audit log records every change with the old value,
   the new value, the reason, and the timestamp. The register stays at twelve
   entities.
4. **The administrator surface changes.** The Product Scope's administrator
   Users page moves from "View, block, edit." to "View, block, edit, set upload
   quota." The administrator application still has its own login and its own
   shell; the quota control lives on the Users page, not on the Settings page.
5. **The downstream documents move with the amendment.** `docs/domain-model.md`
   records the quota invariant and the `User` fields; `ROADMAP.md` R2, R13, and
   R15 name the new enforcement, the Users-page control, and the active-slot
   release; `Core-Project.txt` mirror carries the Arabic limits, the admin page,
   the `User` fields, and the note that the global limits are not edited from the
   Settings page; `docs/capacity-model.md` records the ratified values.
6. **The capacity model is not reopened.** The envelope in ADR-117 (10,000
   accounts in six months, 50,000 capacity, 50,000–100,000 visits/day,
   3,000–5,000 concurrent online, 300–600 concurrent uploads, 350,000/500,000
   uploads per month) stands. The model is re-run when the assumptions in
   `docs/capacity-model.md` §11.3 change.

**What deliberately did not change.** The 100 MB maximum file size, the 90-day
retention period, the 99-part cart cap, the p95 budgets (search under one second,
cart-add under 200 ms, processing under five minutes), the product scope, the
page count, the module list, the roles, and the slice order are unchanged. No new
entity is introduced. No R1 `plan.md` or `tasks.md` is created, and no application
code, package, schema, API, or migration is built. The 90-day trigger point
remains R15's open fact.

**Alternatives considered.**

- *Keep the 100-file lifetime total and lower the monthly limit.* Rejected: it
  would stop every active merchant sooner, not later, and would contradict the
  capacity envelope.
- *Make 300 a lifetime total.* Rejected: the same cliff moves to month six, and
  the six-month horizon is a planning horizon, not an account lifetime.
- *Create a separate `UserQuota` entity.* Rejected: the override is two nullable
  per-account values with no independent lifecycle, the audit log already records
  changes, and a new entity would add a join and a register count for no product
  fact. Fields on `User` keep one owner and one read path.
- *Put the quota on `PlatformSetting`.* Rejected: ADR-067 forbids a Usage Limit
  in that entity, and the value is per user, not platform-wide.
- *Let the administrator grant unlimited quota.* Rejected: the capacity model
  would be unbounded and the constitutional limit would lose its meaning.
- *Amend only the total and leave the administrator ceiling out.* Rejected: the
  product requirement names a per-user override, and an unbounded override would
  make the capacity model unenforceable.

**Consequences and migration/backfill.** The constitution moves to 4.0.0; the
footer, `.specify/memory/version.json`, and the ADR index row record the same
version and date. The live `ADR-001 … ADR-117` range strings move to
`ADR-001 … ADR-118`, and `Project-Technologies.txt`'s header list gains 118
contiguously. The migration is documentation-only: there is no production data
and no schema, so no backfill runs; R2 and R13, when specified, read the new
limits, the `User` fields, and the audit rule. The current R1 specification does
not name the upload quota, so its identifiers and acceptance criteria do not
change. Review date: 2026-11-23, and again at R12's load test. This entry is the
durable record.

---

## ADR-119 — The first PDF sample calibration and the two-scenario capacity model

**Status**: Accepted — 2026-10-23
**Owning directory**: `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner.
R3 consumes the evidence; no slice specification is created by this record.

**Context.** ADR-117 adopted the capacity envelope with three pre-sample
assumptions: a 7.8 MB weighted average file, 100 pages per file, and 10 rows per
page. The first real sample (19 PDFs, 1,525 pages, inspected locally on
2026-10-23) measured a different shape: 18 text PDFs and one scan; 2.28 MB
average; 80.3 pages per file; 31.7 rows per page; 5.3% of files scanned; and
48.3% of the bytes in the single scan. Eight of the 18 text PDFs also carry
corrupted characters or unreadable headers, so a text layer is not a guarantee of
clean extraction. The sample is small and comes from one folder, so it cannot
replace the envelope outright; it is enough to calibrate the planning baseline
and preserve the pre-sample envelope as a stress case. The alternative — leaving
the 10-row figure as the only planning number — would understate the parts
projection by about 2.5 times.

**Decision.**

1. **`docs/pdf-sample-analysis.md` is added as preliminary evidence.** It records
   the 19-file sample, its method, its aggregate measurements, its limits, and
   the extraction problems it exposed. It is not a feature, a specification, or a
   source of product rules. It carries no raw merchant data.
2. **The capacity model uses two scenarios.** The measured baseline is 2.28 MB
   average, 80.3 pages per file, 31.7 rows per page, and 5.3% scanned files. The
   scanned-heavy envelope retains 7.8 MB average and 100 pages per file as the
   stress case. Both use 350,000/500,000 uploads per month, 20% deduplication, and
   the 90-day active set.
3. **The measured parts projection is about 2.14 billion active parts at design
   and 3.06 billion at stress**, after 20% deduplication. The scanned-heavy
   envelope is about 2.66 billion at design and 3.80 billion at stress. These are
   planning figures, not a measured production index. PostgreSQL partitioning and
   OpenSearch sharding are the capacity risk.
4. **The measured storage projection is about 6.3 TB at design and 8.9 TB at
   stress**, replicated and including 30% derived data. The scanned-heavy
   envelope remains 21 TB and 30 TB. The measured upload ingress is 11–46 MB/s
   at 300–600 concurrent uploads; the scanned-heavy ingress remains 39–156 MB/s.
5. **The canonical columns do not change.** The six `Part` columns and the
   supplier display remain exactly as ADR-040 and the Glossary fix them. The
   sample does not justify a new column. Four rules remain for R3: which price
   wins when a file prints two; when a row-level company is `type` and when it is
   the supplier; whether a missing original number is null or derived; and how
   the car model and type are separated from a long Arabic name. A new canonical
   column would be a Glossary amendment, not an R3 choice.
6. **Text-layer quality becomes an extraction gate.** R3 must measure whether a
   text PDF's extracted Arabic and header survive extraction, and fall back to
   another extractor or OCR when they do not. The sample's corrupted text layers
   make "text PDF means no OCR" unsafe. No OCR or table-extraction technology is
   selected by this record; the Technology Standards gap process still owns that
   choice.
7. **The sample remains preliminary.** A broader sample of 50–100 files across
   5–10 suppliers, including Excel, Word, text PDF, and scanned PDF, is required
   before the measured baseline is treated as final. The 20% deduplication figure
   is still an assumption. The 90-day trigger remains R15's decision; the
   sample's old issue dates support the upload-date recommendation already
   recorded in the capacity model, but this record does not decide it.

**What deliberately did not change.** No constitutional text, Usage Limit,
canonical column, entity, page, role, module, slice order, or dependency edge
changes. The quota model of ADR-118 stands. No R1 `plan.md` or `tasks.md` is
created, no slice specification is created, and no application code, package,
schema, API, or migration is built. No OCR technology is chosen.

**Alternatives considered.**

- *Keep 7.8 MB and 10 rows per page as the only model.* Rejected: the sample
  contradicts both the file-size and row-count assumptions, and the 10-row figure
  understates active parts by about 2.5 times.
- *Replace the envelope entirely with 2.28 MB and 31.7 rows.* Rejected: 19 files
  from one folder are not a population, and the scanned-heavy case must remain
  visible for merchants who photograph documents.
- *Add separate description, currency, brand, or country columns.* Rejected: the
  sample does not prove the need, and the Glossary fixes the six; a new column is
  a constitutional amendment.
- *Choose an OCR or document-AI vendor now.* Rejected: the register gap belongs
  to R3, and the sample is a five-page lower-bound benchmark, not a product
  selection.
- *Treat the sample as a feature or a slice.* Rejected: it is project-level
  evidence, and ADR-007 prohibits a feature for a project-level concern.

**Consequences and migration/backfill.** `docs/capacity-model.md` now carries the
measured baseline and the scanned-heavy stress case; its old 10-row figure is
retained only as a sensitivity row. The live `ADR-001 … ADR-118` range strings
move to `ADR-001 … ADR-119`, and `Project-Technologies.txt`'s header list gains
119 contiguously. The change is documentation-only: there is no production data,
no schema, and no code, so no backfill runs. R3, when planned, reads the sample
report, the two scenarios, and the open rules. Review date: 2026-11-23, and again
after the broader sample. This entry is the durable record.

**Annotation (2026-10-24, ADR-120).** The first of the four R3 rules in item 5
— which price wins when a file prints two — is decided by ADR-120. The other
three remain R3's.

---

## ADR-120 — The two-price column: one price cell, two printed amounts, and the primary price

**Status**: Accepted — 2026-10-24
**Owning directory**: `.specify/memory/`, `docs/`, `Core-Project.txt`,
`ROADMAP.md`
**Owning feature**: none — governance decision; ratified by the repository
owner. R3 reads the extraction rule; R5 renders the cell.

**Context.** The constitution registered one price per part. The first real
sample (19 PDFs, 1,525 pages, 2026-10-23) contains files that print two price
columns: «نقدي» and «مصرفي», «سعر القطعة» and «سعر الجملة», «سعر البيع», and
«سعر الخاص». The sample report recorded the two-price pattern and left the
precedence rule to R3. Storing one amount would silently drop a printed price
and force a schema migration later. Adding a second canonical column would
break the six-column composition, the eight displayed columns, and the rule
that every column is always shown. Adding a `PartPrice` entity would make
thirteen entities, break the twelve-entity register, and put a join in every
read of the parts table. The product decision is to keep one price column and
let it carry one amount or two.

**Decision.**

1. **The price column carries one amount or two.** A parts table that prints
   two price columns, or one column carrying two labelled amounts, stores both;
   a table that prints one stores one. Each amount carries the column name the
   supplier printed, stored as part of the price cell; the label is not a
   seventh canonical value. The six canonical columns and the eight displayed
   columns are unchanged.
2. **The primary amount is the sort and filter key.** It is the amount the
   parts table sorts and filters on: «نقدي» when the file prints it, otherwise
   «قطعة», otherwise the only printed amount, otherwise the first amount in the
   table's reading order, which is right to left in an RTL table. The second
   amount is displayed only and is neither sortable nor filterable.
3. **Labels.** «نقدي» is payment in cash and «مصرفي» is payment by card; a
   printed «مصرف» is stored as «مصرفي». A label is rendered with its amount
   only when it is Arabic; a label in another script, or no label, leaves the
   amount unlabelled.
4. **Storage cap.** At most two amounts are stored. When a file prints more
   than two, the stored pair is the primary amount and the first of the
   remaining amounts in reading order; a third amount is not stored even though
   it belongs to the price column, and it is not counted or flagged. When two
   printed columns carry the same label, the first in reading order is stored
   and the second is not.
5. **The guest projection excludes both amounts.** A guest's read path projects
   the part without its price column and without either amount, through its own
   allowlist. The administrator edits both amounts; a merchant edits neither.
6. **The other-currency rule is unchanged.** A price in another currency is not
   converted and not stored; when the second amount is in another currency it is
   not stored either, and a part with no storable amount reads «بدون سعر».
7. **The constitution moves to 4.1.0 (MINOR).** The change is a material
   expansion of registered price guidance; nothing is removed or redefined
   incompatibly, and a one-price part remains valid.

**What deliberately did not change.** The six canonical columns, the eight
displayed columns, the twelve entities, the twenty-seven pages, the sixteen
features, the Usage Limits table, the Technology Standards register, the cart's
prohibition on price, and the guest redaction. No entity, canonical column,
displayed column, page, limit, or technology is added. No OCR vendor is named
and no capacity number enters the constitution. R1's specification does not
name the price, so its identifiers and acceptance criteria do not change. R3
and R5 read the amended rule when they are specified.

**Alternatives considered.**

- *Store one amount and drop the second.* Rejected: it silently discards a
  printed price and forces a migration once a merchant asks where the card
  price went.
- *Add a second canonical column.* Rejected: it breaks the six-column
  composition, the eight displayed columns, and the rule that every column is
  always shown; it would be a MAJOR amendment.
- *Introduce a `PartPrice` entity.* Rejected: it makes thirteen entities,
  breaks the twelve-entity register, and adds a join to every read of the parts
  table.
- *Leave the precedence rule to R3.* Rejected: the rule decides what the
  merchant sees first and what the price filter means, so it is a product fact,
  not an extraction detail.
- *A closed label enumeration.* Rejected: the label is the supplier's printed
  column name, and suppliers vary; the two meanings that matter — cash and card
  — are registered, and the rest is stored as printed.

**Consequences and migration/backfill.** The constitution's Principle VI,
Product Scope, Product Register, File Processing Rules, Glossary, and Product
Fact Clarifications move in this change; `docs/domain-model.md`,
`Core-Project.txt`, `docs/architecture.md`, `ROADMAP.md`, and
`docs/pdf-sample-analysis.md` follow in the same commit. ADR-040 and ADR-119
carry annotations. The live `ADR-001 … ADR-119` range strings move to
`ADR-001 … ADR-120`, and `Project-Technologies.txt`'s header list gains 120
contiguously. The change is documentation-only: there is no production data,
no schema, and no code, so no backfill runs. Review date: 2026-11-23, and again
when R3's extraction benchmark lands.

---

## ADR-121 — The accepted parts envelope and the partitioning constraint

**Status**: Accepted — 2026-10-24
**Owning directory**: `docs/`, `.specify/templates/overrides/`
**Owning feature**: none — governance decision; ratified by the repository
owner. R3 and R12 consume it.

**Context.** ADR-119 calibrated the six-month envelope from the first 19-file
sample and left two physical questions open: `docs/capacity-model.md` said
PostgreSQL "needs a partitioning and archival decision before the 2–3 billion
range", and OpenSearch "needs a shard plan sized to the measured index, not to a
guess". The owner accepted the 2–3 billion range as the planning envelope.
Leaving the partition key to R3's plan is not safe: in PostgreSQL a partitioned
table's unique constraint must include the partition key, so the key decides the
part's primary key and every reference to it, including `bookmarks`. Discovering
that in R3 would force a redesign of the module's schema and its read paths. The
plan template's binding block also did not name the capacity model, so a plan
could satisfy its binding sources without reading the envelope. The sample
report repeated the capacity table, creating a second source for numbers that
`docs/capacity-model.md` owns.

**Decision.**

1. **The 2–3 billion range is accepted as the planning envelope.** 2.14 billion
   active parts at design and 3.06 billion at stress, after 20% deduplication,
   from the measured 31.7 rows/page; the scanned-heavy 100-page case reaches
   2.66/3.80 billion. These are planning figures, not a measured production
   index.
2. **`parts` is partitioned by the catalog's upload time.** The 90-day retention
   is a partition drop, not a row-by-row delete. Because PostgreSQL requires
   every unique constraint on a partitioned table to include the partition key,
   the part's identity and every reference to it must accommodate the partition
   key. R3's plan chooses the mechanism; it does not choose whether to
   partition.
3. **OpenSearch uses time-based indices behind an alias.** ISM deletes a whole
   index by age; a per-catalog delete is a delete-by-query on the alias. The
   shard count is derived from the modelled index size.
4. **R12's load test measures the corpus, not only the request rate.** The test
   includes 2–3 billion parts present, so the search p95 is measured at the
   modelled index size.
5. **The two levers are measured, not assumed.** The cross-merchant unique-file
   rate (the content-hash check rejects an identical file before processing) and
   the deduplication rate are the two figures that change the parts projection.
   Both are unmeasured; a change in either is a re-sizing trigger.
6. **The plan template binds the capacity model.** `docs/capacity-model.md` joins
   the binding Project Context Sources, so a plan cannot omit the envelope.
7. **The sample report points to the capacity model.** Its duplicate capacity
   table is removed; `docs/capacity-model.md` is the single source for the
   numbers.

**What deliberately did not change.** No constitutional text, Usage Limit,
entity, canonical column, displayed column, page, role, module, or slice order
changes. The quota model of ADR-118 stands. The six-month horizon stands. No
technology is named, and the OCR choice remains the register gap R3 closes. No
R1 `plan.md` or `tasks.md` is created, no slice specification is created, and no
application code, package, schema, API, or migration is built.

**Alternatives considered.**

- *Leave the partition key to R3.* Rejected: the key determines the primary key
  and every reference, so discovering it in R3 forces a schema and read-path
  redesign.
- *Partition by `catalog_id`.* Rejected: the dominant deletion is the 90-day
  sweep, which is time-based; only a time key makes retention a partition drop.
- *Keep the capacity numbers in both documents.* Rejected: two sources drift, and
  the report is evidence rather than the envelope's owner.
- *Lower the envelope until the levers are measured.* Rejected: the owner
  accepted the range; the correct response is to measure the levers and re-size
  on a trigger, not to plan for a smaller corpus silently.
- *Put the partitioning rule in the constitution.* Rejected: the constitution
  excludes the physical schema, and this is a physical constraint.

**Consequences and migration/backfill.** `docs/capacity-model.md` §8.2, §9, §10,
§11, and §12 carry the accepted envelope and the two constraints;
`docs/architecture.md` §3 and §4 carry the time-based index; `plan-template.md`
binds the capacity model; `docs/pdf-sample-analysis.md` loses its duplicate table
and fixes the daily OCR arithmetic. The live `ADR-001 … ADR-120` range strings
move to `ADR-001 … ADR-121`, and `Project-Technologies.txt`'s header list gains
121 contiguously. The change is documentation-only: there is no production data,
no schema, and no code, so no backfill runs. Review date: 2026-11-23, and again
at R12's load test.

---

## ADR-122 — Local-first OCR and the extraction evidence gap

**Status**: Accepted — 2026-10-24
**Owning directory**: `docs/`
**Owning feature**: none — governance decision; ratified by the repository
owner. R3 consumes it.

**Context.** The sample measured the local Windows Arabic OCR engine at 1.3–2.6
seconds per page on five pages of the scanned file, but the engine returned about
20 text lines for a table of about 30 rows and merged columns and prices. The
Technology Standards register has an open gap for Excel, PDF, and Word
extraction, owned by R3, and naming a library before the gap is closed is
prohibited. The owner's decision is that OCR runs locally first; a cloud
document-AI service is a later option only after the local path proves it cannot
meet the extraction gate, and only with the owner's approval. The reason is not
cost alone: supplier price files are the product's data, and sending them to a
third party adds a data-terms and retention surface the product does not need if
the local path works.

**Decision.**

1. **OCR and table extraction run on the platform's own infrastructure first.**
   The local path is the default: a self-hosted OCR engine and table-structure
   extraction on the worker or a GPU pool the platform operates.
2. **A cloud document-AI service is a later, approved option.** It may be
   evaluated only after the local benchmark fails the extraction gate, and only
   with the owner's explicit approval. No provider is named by this record.
3. **The benchmark is the gate, not the vendor.** R3 measures Arabic accuracy,
   table structure, per-column precision and recall, time per 100 pages, and
   cost per 1,000 pages on 20–50 hand-labelled pages. The local path is measured
   first.
4. **The register gap stays open.** No OCR or table-extraction technology is
   added to the Technology Standards register by this record; R3 closes the gap
   through the gap process, with an ADR, a licence record, and a vulnerability
   scan.
5. **Data terms are recorded before any cloud use.** If a cloud path is later
   approved, its data terms and retention are recorded before the first page is
   sent.

**What deliberately did not change.** No constitutional text, Usage Limit,
entity, column, page, role, module, or slice order changes. No OCR vendor,
library, or service is named. The capacity envelope of ADR-121 stands; the OCR
worker row is a deployment note, not a new sizing decision. No R1 plan or tasks,
no slice specification, and no code are created.

**Alternatives considered.**

- *Choose a cloud document-AI vendor now.* Rejected: the register gap belongs to
  R3, the sample is a five-page lower-bound benchmark, and the data-terms surface
  is avoidable if the local path works.
- *Choose a local library now.* Rejected: naming a library before the gap's ADR,
  licence record, and vulnerability scan would violate the register-gap rule.
- *Leave the choice entirely to R3 with no policy.* Rejected: without a policy, a
  plan could default to a cloud service and add a data-processing surface the
  owner did not approve.
- *Run both paths in parallel now.* Rejected: it doubles the benchmark and the
  cost before the local path has been measured.

**Consequences and migration/backfill.** `docs/capacity-model.md` §9 and §11.1
carry the local-first note and the benchmark order; the register gap remains
R3's. The live `ADR-001 … ADR-121` range strings move to `ADR-001 … ADR-122`, and
`Project-Technologies.txt`'s header list gains 122 contiguously. The change is
documentation-only: there is no production data, no schema, and no code, so no
backfill runs. Review date: 2026-11-23, and again when R3's benchmark lands.

---

## ADR-123 — The 4.2.0 audit fix set: References, the exception register, and four document corrections

**Status**: Accepted — 2026-10-24
**Owning directory**: `.specify/memory/`, `.specify/templates/`, `docs/`, `AGENTS.md`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** A deep audit of constitution 4.1.0 checked the document against its
own rules rather than against its prose. Two register defects, one stale
rationale, and one inaccurate scope sentence survived, because
`governance-drift-check.mjs` verifies counts, version sources, ADR identifiers,
manifest hashes, and integration topology, but not whether References names every
project-level source, whether the paragraph binding sources to a reserved
decision lists the sources that exist, or whether a scope sentence describes the
point at which its tool runs.

`docs/capacity-model.md` and `docs/pdf-sample-analysis.md` are project-level
documents. The first is named by `AGENTS.md`'s source table, is the planning
authority for the load envelope, and is the document a plan's `Scale/Scope`
starts from (`plan-template.md` → Technical Context). The constitution named
neither. Single-Reference Sufficiency states that a feature MUST NOT need a
source outside this constitution, and that "every project-level source is named
in References" — so a plan was obliged to read a document the register did not
carry. The same omission left `docs/capacity-model.md` outside the closed list of
sources bound by an open reserved decision, because that list was written before
the capacity model existed (2026-10-23, ADR-117). The model currently honours the
reservation on its own (§7 and §11.2 leave the 90-day trigger point to R15), so
the gap is latent rather than breached.

The exception register's EX-001 and EX-002 justified their exceptions on the
premise that "the rule prohibits a dependency absent from the Approved register".
Since 2.19.0 both ClamAV and Lighthouse CI are rows of that register, and the
constitution's own note says those six rows "close a register gap rather than
open one". EX-003 to EX-006 already state the operative reason; EX-001 and EX-002
still argued from an absence that no longer holds, so their recorded rationale no
longer described the rule they except; EX-001's scope sentence separately
described a build-time and CI dependency for a scan the intake path runs at
upload time.

The same audit found four document defects: `docs/domain-model.md` lists rows 9
through 11 as registered facts although the constitution's Data entities rule
puts a field outside the register; `AGENTS.md` still describes the icon set as
unchosen and unregistered although ADR-098 chose it; `docs/pdf-sample-analysis.md`
still counts four undecided rules after ADR-120 decided one; and
`docs/capacity-model.md` states a storage figure drawn from the scanned-heavy
average without naming that average. None of the four changes a rule; each is
corrected so a reader meets the governing text.

**Decision.**

1. `References` gains two rows: `docs/capacity-model.md` as the planning
   authority for the load envelope, and `docs/pdf-sample-analysis.md` as the
   measured evidence behind its baseline, explicitly not a source of rules.
2. The reserved-decision paragraph's closed list of bound sources gains
   `docs/capacity-model.md`, so a future revision of the model cannot assert an
   answer a row below still reserves.
3. EX-001 and EX-002 are reworded to state the character of their Approved
   register rows rather than their absence from the register, and EX-001's scope
   sentence is corrected from a build-time and CI dependency to the separate
   scanning process the intake path invokes at upload time. The scope's boundary,
   approver, and review date are unchanged.
4. Four documents are corrected so each agrees with the authority it cites:
   `docs/domain-model.md`'s two statements that a field on a registered entity is
   a register fact (rows 9 through 11 are field-level, and the register is amended
   only where a field's existence is itself a product decision);
   `AGENTS.md` §4's description of the icon set as unchosen and unregistered
   (ADR-098 chose IconPark, while the register row stays open for R1);
   `docs/pdf-sample-analysis.md`'s count of four undecided rules (ADR-120 decided
   one, three remain); and `docs/capacity-model.md`'s 117 TB figure, which now
   names the 7.8 MB scanned-heavy average it is computed from.

**Deliberately not changed.** No principle, product scope, register count, usage
limit, entity, page, feature, module, or technology moved. The four open deferred
areas (extraction algorithm, file ingestion internals, authorization model,
retrieval interface) are untouched, and Catalog data shape stays discharged
(ADR-040). The icon-set register gap stays open and is not pre-empted here; R1
closes it through the gap process. No constitution rule was reworded to fit the
finding.

**Alternatives considered.**

- *Leave `docs/capacity-model.md` out of References and cite it only from the
  plan template.* Rejected: Single-Reference Sufficiency makes References the
  register of project-level sources, and a template is not a register. The rule
  would then be discharged by a document the constitution never names.
- *Treat the capacity model as detail of Technology Standards.* Rejected: it is
  a planning envelope, not a technology, and the register does not own load.
- *Delete EX-001 and EX-002 now that the register names both tools.* Rejected:
  each exception still carries an obligation — that the row is a scanner or a CI
  gate and never a runtime import — and deleting it would drop the record the
  reader needs. Governance requires an exception to carry its rationale; the
  rationale is corrected, not removed.
- *Do nothing because the drift check is green.* Rejected: a green check means
  the checked invariants hold. These fell outside its coverage, which is why
  the amendment records them here.

**Consequences and migration/backfill.** Constitution 4.2.0 (MINOR: the
references register gained two rows and a closed list of bound sources gained
one — materially expanded guidance rather than wording). The footer,
`.specify/memory/version.json`, and this index row agree at 4.2.0 / 2026-10-24.
Every live `ADR-001 … ADR-122` range string moves to `ADR-001 … ADR-123`, and
`Project-Technologies.txt`'s header list gains 123 contiguously. No principle is
affected, so no in-flight feature is re-evaluated against a changed principle;
`specs/001-identity-foundation/spec.md` changes only in the ADR range string its
references block carries. The four corrections in item 4 change no register,
count, identifier, or version source. The change is documentation-only: no
production data, no schema, and no code, so no backfill runs. The constitution's
sync impact report is review material and is not committed (Governance →
amendment procedure). Review date: 2026-11-24.

## ADR-124 — The blocked recovery confirmation, the replacement code's full period, the single security notice, and the journey criteria's delivery boundary

**Status**: Accepted - 2026-10-24
**Owning directory**: `specs/001-identity-foundation/`, `docs/`
**Owning feature**: none - product clarification ratified by the repository owner; R1 binds the rules and verifies them.

**Context.** A clarification session on 2026-10-24, after ADR-123, settled four
points the R1 specification still left open, each of which changed an observable
rule rather than a wording. The first was the recovery flow's confirmation for a
blocked account: FR-014 let the reset complete while the block stood, and
AC-016's confirmation told the merchant to sign in with the new password — a
sign-in the block makes impossible. The second was the pending request's
lifetime: FR-034 made a replacement take effect only when the messaging channel
accepted the new message, but never said whether that accepted dispatch restarts
the request's expiry, so a code requested near the end of a request's life could
be delivered already dead. The third was the notice count: FR-013 ends every
session when the password changes, and FR-043 requires a notice on a password
change and on a sign-out of every device, so one action appeared to produce two
SMS. The fourth was the journey criteria: SC-001 and SC-003 fix a three-minute
journey while the Assumptions exclude SMS delivery from "the response-time
criteria", leaving it unstated whether the wait for a code counts.

**Decision.**

1. **The blocked recovery confirmation states both outcomes.** When the
   recovery flow resets the password of a blocked account, the in-place
   confirmation states that the password was changed and that the account is
   blocked, and says plainly that sign-in stays refused until an administrator
   returns the account to active. The block is disclosed only after the code is
   verified, so FR-015's uniformity is untouched, and the page never promises a
   sign-in that cannot succeed.
2. **An accepted dispatch restarts the pending request's lifetime.** The
   request and the replacement code get the full period Constitution Mandated
   Values fixes, so a new code is never delivered with only the remainder of the
   request it replaced. The limit on requesting a new code bounds repeated
   extension, and a dispatch the channel refuses changes neither the code nor the
   expiry.
3. **One action produces one notice.** A password change sends a single notice
   that reports the change and the sessions it ended; those session endings are
   the change's own consequence rather than a second sign-out of every device,
   and the sign-out-of-every-device notice is sent when the merchant performs
   that action.
4. **SC-001 and SC-003 exclude the code's delivery after acceptance.** Both
   criteria measure the person's own actions and the platform's responses; the
   time a code spends in delivery after the messaging channel accepts it is
   excluded, the same boundary SC-009 already draws between the request and the
   delivery.

**What deliberately did not change.** No page, entity, role, product feature,
usage limit, security rule, technology, module, or constitution version changed
by this record; the constitution stays at 4.2.0 and the Constitution Mandated
Values set stays closed at its seventeen values. The Product Register's
twenty-seven pages, twelve entities, sixteen product features, and three roles
are untouched. The identifier set does not grow: no functional requirement,
acceptance criterion, or success criterion is added, renumbered, reused, or
withdrawn, so the counts stay 51 FR, 55 AC, and 9 SC. `docs/domain-model.md` is
corrected in the same change where decision 2 binds its
transient-verification-state expiry invariant. No application code, package,
CSS, or font file was created.

**Alternatives considered.**

- *Leaving the blocked account's confirmation generic.* Rejected: it would
  instruct the merchant to sign in with a password the block refuses, so the
  page would promise an outcome the platform cannot deliver; the person has
  proved ownership of the number and is no longer an unknown caller, exactly as
  FR-049 already treats a session holder.
- *Disclosing the block before the code is verified.* Rejected: it would reveal
  that the number has an account, breaching FR-015 and SC-004 for a person who
  has proved nothing yet.
- *Keeping the original expiry when a replacement is dispatched.* Rejected: a
  code sent late in a request's life would carry only the remainder of that
  life, so a legitimate person could receive a code that is already dead; the
  replacement is a new send and must carry a full period.
- *Capping the extension with an absolute maximum for the pending request.*
  Rejected: it adds an eighteenth value to a closed Constitution Mandated Values
  set, and the limit on requesting a new code already bounds how often the
  lifetime can be extended.
- *Sending two notices when a password change ends every session.* Rejected:
  two SMS for one action, and a consequence counted as a second event; the
  owner learns the same fact from one notice.
- *Counting SMS delivery inside SC-001 and SC-003.* Rejected: delivery is
  outside the platform's control, so the criterion would fail through no fault
  of the platform and could not be verified objectively; SC-009 already excludes
  it and the journey criteria now use the same boundary.

**Consequences and migration/backfill.** The R1 specification's FR-014, FR-034,
FR-043, SC-001, SC-003, the Key Entities note, the Assumptions, and the Test
Coverage Request carry the rules; AC-016, AC-036, and AC-047 assert them,
together with the edge cases the four answers touch. `docs/domain-model.md`
carries the expiry-restart invariant. The live `ADR-001 … ADR-123` range strings
become `ADR-001 … ADR-124` in the same change, and `Project-Technologies.txt`'s
header list gains 124 contiguously. The specification checklist is re-validated
and all twenty-two items still pass. No migration or backfill is required: the
change is specification prose, one decision record, one model correction, the
copied range strings, and a checklist re-validation. Review date: 2026-11-21.
This entry is the durable record.

---

## ADR-125 — The decision register split into an index and eight volumes

**Status**: Accepted — 2026-10-24. **Constitution version**: 5.0.0

**Owning directory**: `docs/`
**Owning feature**: none — governance decision; ratified by the repository owner

**Context.** The decision register had grown to 663,427 bytes, 9,862 lines, and
124 records — about 166,000 tokens. No reader could load it in one pass, and the
reading protocol that told readers not to (ADR-071) was not enforced by anything
the repository runs. A manual count found that slightly less than half of the
volume was meta-governance: 31 constitution-amendment records and 24 audit/fix
rounds, against 69 product and engineering decisions. The register's own growth
rule was "append one record per amendment", so the file grew with the governance
process rather than with the product.

**Decision.** The register is the index and reading protocol in
`docs/DECISIONS.md` plus eight chronological volumes under `docs/decisions/`,
`volume-01.md` to `volume-08.md`, holding ADR-001 to ADR-124 as contiguous
ranges. Records are byte-identical to their previous text; only the file that
holds them changed. A new record is appended to the last volume; when it would
push that volume past the byte cap the drift check carries, the next volume is
opened in the same change, and the index row points to the volume that holds the
record. `governance-drift-check.mjs` gains section M: volume continuity, one
record per ADR number, index hrefs that resolve to the volume holding the
heading, a volume cap, and an index cap. The numbers live only in the check.

**Alternatives considered.**
- *Keep one file.* Rejected: unbounded, and already unreadable by any model in
  one pass; the protocol was discipline, not enforcement.
- *Index plus four volumes (~162 KB each).* Rejected: still above a comfortable
  single read, and the largest would keep growing.
- *One file per ADR (125 files).* Rejected: best atomicity, worst browsing,
  review, and diff noise for a register this size.
- *Split by kind (governance versus product).* Rejected: every amendment needs a
  classification decision, and the governance half grows fastest.
- *Generate `docs/DECISIONS.md` from the volumes.* Rejected: it preserves the
  648 KB artifact as the read target and adds a build step before R1 owns a test
  runner.

**Consequences.** A reader loads the index (about 29 KB) and one volume (at most
100 KB). The index is capped at 120 KB; passing it fails the check and forces a
second-level index decision instead of silent re-inflation. No live link outside
the index pointed at an `#adr-` anchor (measured: zero), so no external
reference broke. The original history stays reachable through `docs/DECISIONS.md`
and `git log -S`; `--follow` on a volume does not cross the split, because the
records were copied into new files while the index kept its own path. The churn
that filled the register is unchanged; reducing it is a separate decision.

**Migration (MAJOR).** The move is byte-preserving: every record was hashed
before and after with SHA-256, 124 of 124 matched. The hash comparison was a
one-time migration check; the committed drift check verifies structure, not
record text. The drift check's B, J, and reference passes were updated in the
same change; M was added. Acceptance tests
covered continuity, caps, href targets, and six negative mutations; rollback is
a revert of this commit and restores the single file with no manual
reconstruction. R1's specification carries
the live range string `ADR-001 … ADR-125`; no `FR`, `AC`, or `SC` identifier
changed, so R1's Constitution Check is unaffected.

---

## ADR-126 — The Upload Catalog page: the twenty-eighth page and the ninth sidebar destination

**Status**: Accepted — 2026-10-25. **Constitution version**: 5.1.0

**Owning directory**: `.specify/memory/` (Product Register), `Core-Project.txt`, `ROADMAP.md`
**Owning feature**: R2, File intake (tracked in ROADMAP.md; the slice's sub-spec is open)

**Context.** The merchant's upload lives today as the upload action inside the
My Files page (Product Register → Merchant's Authenticated Area), while the
intake channel itself — validation, content safety, storage, the content hash,
the duplicate rule, and the per-user quotas of 50 files per calendar month and
300 active stored files (ADR-118) — is slice R2. The operator decided the
upload deserves a standalone surface: the quota state is only visible where
the upload begins, the intake is a single-purpose flow, and the merchant
reaches it from the navigation directly rather than through the table of his
own files.

**Decision.** The Product Register gains the Upload Catalog page as the
twenty-eighth page: a merchant-only page on the product's shared shell whose
content is the upload of one supplier catalog (Excel, PDF, or Word up to
100 MB, the Usage Limits table's first row), the display of the merchant's
monthly and active quota state, upload progress, and the duplicate-by-hash
outcome — a duplicate names the original with its upload date and links to the
part numbers that came from it, and no duplicate is stored, queued, or
processed. The record the upload creates is a `Catalog` whose processing
status lives in My Files, so the page creates no entity and adds no product
feature — File Upload remains the first of the sixteen features. The sidebar's
navigation item list carries the page as its ninth destination, ordered
between Catalog and My Files; the list is still shown identically to a guest
and to a signed-in merchant, so a guest pressing the item is taken to the
sign-in page (the ADR-100 pattern). The page ships at the route `/upload`,
fixed here, and My Files keeps its own actions — the table, the processing
status, delete with confirmation, and retry for a failed file — and links to
the page instead of embedding the upload. Slice R2 delivers the page alongside
the channel it exists for; slice R4 keeps everything after the intake.

**Alternatives considered.**
- *Keep the upload as a My Files action (no page).* Rejected: the quota state
  and the intake flow would inherit a page whose centre is a table, and the
  navigation would carry a destination the register could not name.
- *Name the page «كتالوج جديد» (noun-first).* Rejected: the page is an action
  (an intake), not a catalog list; the catalogue noun already owns the public
  Catalog page.
- *Name the page «رفع ملف».* Rejected: the merchant uploads a supplier
  catalog, not a generic file; «رفع كتالوج» carries that model into the
  product's Arabic.
- *Deliver the page with R4's table.* Rejected: R2 owns the intake and depends
  only on R1, so the page would wait on reading surfaces R5 owns while its own
  backend (R2) already exists.

**What this decision does not change.** The twelve data entities (`Catalog`
already owns the intake data), the sixteen product features, the
administrator application's eleven pages, the roles table, the
identical-list rule for guests and merchants, the four bare-layout static
pages, and the route discipline the frame's decision record fixed.

**Consequences and migration/backfill.** The constitution is amended in the
same change — the Product Register (the merchant table and the Pages prose at
twenty-eight pages), the Page Flow (the My Files → Upload Catalog and
Upload Catalog → My Files transitions), and the File Processing Overview's
first step, which now submits from the page;
`Core-Project.txt` mirrors the register, the nine-item sidebar list, and the
two transitions; the R1 specification's FR-039 and AC-042 carry the nine-item
list; `ROADMAP.md` moves the page to R2 and rewords R4's upload action to a
link. The live `ADR-001 … ADR-125` range strings become `ADR-001 … ADR-126`
in the same change. No migration or backfill is required: the change is the
register prose, this decision record, the mirrors, the specification
revisions, the roadmap, and the drift check's structural page count
(G8 27 → 28). Review date: 2026-11-25. This entry is the durable record.

---

## ADR-127 — The frame's fourth surface: the narrow-screen bottom navigation bar

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.0.0

**Owning directory**: `.specify/memory/`, `Core-Project.txt`, `ROADMAP.md`, `packages/ui` (planned by R1)
**Owning feature**: R1, Identity and foundation (the frame is built and verified structurally in R1; R4 verifies its runtime behaviour)

**Context.** The shared shell had three surfaces: the header, the sidebar, and the footer band. On a narrow screen the sidebar becomes a drawer, and the header carries no drawer control, so nothing in the frame opened the drawer or carried the merchant's most-used destinations. The constitution's 6.0.0 amendment names the fourth surface and fixes its five slots; the design lab built and measured it. R1 builds the frame but ships no page that renders it, so the surface is verified structurally in R1 and behaviourally by the first slice that ships a page carrying the frame (R4).

**Decision.** Below 1024px the frame carries a bottom navigation bar with five slots: Home, Upload Catalog, a raised search action that opens the Parts page, My Files, and «المزيد». From 1024px up the bar is absent. «المزيد» opens the sidebar drawer and is not its close control; the collapse control inside the drawer closes it, and the header carries neither. The bar is one composition shown identically to a guest and to a signed-in merchant: a guest who activates Upload Catalog or My Files is taken to the sign-in page, and the slot stays present and enabled. On that screen the footer band is not rendered, and its four static-page links sit at the bottom of the drawer. The bar is always visible; the page reserves its height so the bar never covers content, and it does not hide on scroll. The bar is part of the frame's composition, so it is absent from every page that carries no frame. Its labels, measurements, and icon treatment are design values (ADR-128), not product settings; this record fixes the five slots and their behaviour only.

**Alternatives considered.**
- *A menu button in the header.* Rejected: it would give the drawer two controls for one open, and the header is already at its fixed composition.
- *A bar whose slots vary by role.* Rejected: the register requires one list shown identically to a guest and a merchant, and a role-varying bar would make the guest's frame a different frame.
- *A fixed bar with no reserved space.* Rejected: it covers the last row of every table and the end of every form.
- *A bar that hides on scroll.* Rejected: it adds a state the register does not require, hides the destinations while the merchant is reading, and complicates focus and reduced-motion behaviour. The lab's slide-away gesture is a lab behaviour, not a product rule.

**What this decision does not change.** The nine registered destinations, the twenty-eight pages, the twelve data entities, the sixteen product features, and the fifteen slices. It adds no page, no entity, and no feature: the bar is a frame surface, and the five slots are existing destinations.

**Consequences and migration/backfill.** The constitution is amended in the same change (Product Scope, the shell paragraph, and the Product Fact Clarifications); `Core-Project.txt` mirrors the shell paragraph, the narrow-screen rule, and the guest behaviour; `ROADMAP.md` adds the surface to R1's first obligations; the R1 specification's FR-022, FR-024, and FR-052 carry it; and the Wafar UI layer builds it. No migration or backfill is required because no page renders the frame yet and no code exists. The live `ADR-001 … ADR-126` range strings become `ADR-001 … ADR-129` in the same change that records ADR-127, ADR-128, and ADR-129. Review date: 2026-12-01. This entry is the durable record.

**Annotation (2026-10-29).** The first slice that ships a page carrying the frame is R2, not R4: ADR-126 moved Upload Catalog to R2, and ADR-139 decision 3 moved the frame's runtime verification with it. R1 verifies the composition and the presence of its controls structurally (exception `EX-007`), and R2 verifies the runtime, the accessibility scan, and the keyboard-only pass on a rendered page, which ends the exception. The owning-feature line and the Context's reference to R4 are read with this annotation; R4 consumes a frame R2 has already proved and verifies nothing of the frame that R2 has not.

---

## ADR-128 — The Precision design contract: palette, type, shape, density, and rendering rules

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.0.0

**Owning directory**: `packages/ui` (planned by R1), `.specify/memory/`, `docs/design/`
**Owning feature**: R1, Identity and foundation (the Wafar UI layer); every interface slice consumes the contract

**Context.** The design lab compared six token sets on one composition. The operator adopted «الدقة» / Precision. The lab's own statement is the premise of this record: the frame does not move; what changes between models is colour, type, shape, density, surface, and the icon language. The six models therefore share one composition, and the product's choice is a token set and a set of rendering rules, not a page composition. ADR-098 fixed IconPark, IBM Plex Sans Arabic, the light default, and the marine/sand palette. Precision replaces the palette and the icon treatment; the typeface and the light default remain.

**Decision.** The product adopts Precision as its only token set and rendering contract. The five other models are evidence that the composition is independent of the tokens; they are not shipped and no model switcher exists in the product. The contract is:

1. **Composition is not part of this record.** The pages, their blocks, their order, and their states belong to the specification and to the slice map. This record fixes only the visual values and the rendering rules that apply to whatever composition a slice ships.
2. **Palette.** The primary ramp is the orange ramp (50–950) the layer records; the light primary is orange-700, `oklch(55.3% 0.195 38.402)`, approximately `#C2410C`, and the dark primary is orange-400, `oklch(75% 0.183 55.934)`. The neutral ramp is gray; the secondary ramp is slate. The light surfaces are `#ffffff`, `#f6f7f8`, `#eef0f3`, and `#101418`; the light borders are `#e4e7eb`, `#f1f3f5`, and `#c3c9d1`; the dark surfaces are `#0e1114`, `#161b20`, `#1e252c`, and `#2a333c`; the dark borders are `#2a333c`, `#1f272f`, and `#3b4650`. The sidebar's active bar is `#c2410c` in light and `#fb923c` in dark; its active surface is `#fff7ed` in light and `#2a1a10` in dark. Token names are the authority; the layer records the full values. Contrast targets are 4.5:1 for text and 3:1 for interface boundaries.
3. **Type.** IBM Plex Sans Arabic at weights 400, 500, 600, and 700; IBM Plex Mono for numerals. Rendered numerals are Latin. The layer records the size scale and the baseline.
4. **Shape.** Corner radius is 2px (`0.125rem`); the table grid is 1px; row padding is 8px vertically and 12px horizontally.
5. **Density and measurements.** Header 3.5rem; sidebar 15rem, rail 4.25rem; content maximum 88rem; footer 3.5rem; bottom bar 60px plus the safe-area inset; raised action 56px, lifted clear of the bar; icons 20px.
6. **Motion.** The layer records the state and surface durations; `prefers-reduced-motion` is honoured; a moving element whose travel follows the reading mode uses logical direction tokens.
7. **Focus.** One 2px focus ring; its contrast meets 3:1 against the adjacent surface.
8. **Tables.** Fixed geometry; a declared width for every column; the header sticks vertically only; no column is pinned horizontally; a drag hint where the table scrolls horizontally; a persistent scrollbar; a minimum height for the toolbar row.
9. **Loading.** Two systems: a skeleton for content regions and a bar for in-place refresh; the indicator appears after 120ms and stays for at least 300ms; the skeleton's geometry equals the content's geometry; one Arabic sentence per region; the shimmer colour is derived from the ink token; the RTL shimmer direction is a token, not a hard-coded angle.
10. **Filters.** A collapsed filter button; the panel opens inside the page, not as a modal; rows or a grid; chips for active filters; a count badge; a live count in Arabic number format; the price field is «السعر (د.ل)» with «من» and «إلى».
11. **Cards.** The Home rhythm: centered rows, 20px and 24px gaps, and a container query so the cards reflow by their own width, not the viewport's.
12. **Upload.** A drag area on a fine pointer; a 56px action on a coarse pointer; progress, duplicate, and success states.
13. **Bare layout.** The layer records the bare layout's type, focus ring, and touch floor; its composition — logo, title, content, the way back, and the auth pages' cross-links — belongs to the specification; the 404 page branches on the status code.
14. **File name.** The Latin extension is isolated inside an Arabic name with bidirectional isolation, so the extension renders in reading order.
15. **Touch floor.** 44px on any coarse pointer, at any viewport width.
16. **Appearance.** Light and dark; the default is light (ADR-098 decision 4; ADR-102 decision 5); no flash; one control; its state is carried by name and `aria-pressed`.
17. **Language.** Interface text is Arabic; the root carries `dir="rtl" lang="ar"`.
18. **What the layer records.** Token names and values, the component inventory, and the conformance gate.
19. **What this record does not change.** The twenty-eight pages, the twelve entities, the sixteen features, and the fifteen slices.
20. **Not adopted.** Category tiles (the register has no category model), page size 10, any email address, the 90-day period counted from upload, account deletion by the merchant, the five other models as product, the model switcher, `useDesign`, `?design=`, and the lab's tools.

**Correction (2026-10-27).** Decision 8's drag hint is horizontal table scrolling, not column resizing: the layer fixes every column's width, and the lab records that sorting, paging, filtering, or a new page of rows cannot resize a column (DESIGN-DECISIONS row 46; `docs/design/slice-map.md` R5). Decision 9's timing is the lab's: the indicator appears after 120ms and stays for at least 300ms (the lab's `useWfLoading`; DESIGN-DECISIONS row 29), not the reverse. Decision 13 states only the bare layout's type, focus ring, and touch floor; the composition belongs to the specification, and the four static-page links belong to the frame's footer/drawer (ADR-096; ADR-127; FR-036).

**Correction (2026-10-29).** Decision 5's values govern, and the lab's rendered reference diverges from one of them: the lab's footer band measures 51–53px rather than the fixed 3.5rem (56px); its expanded sidebar measures 240px and agrees with the fixed 15rem. An earlier 254px reading measured to the viewport's right edge and included the 15px page scrollbar; it is withdrawn. The footer's divergence amends nothing: the product's baseline is generated from the layer and is not diffed against the lab (ADR-129), so the recorded values govern and no slice copies the lab's measurements. The lab's header measures 56px and agrees with the contract. Decision 3's numeral face is recorded with its licence and format — IBM Plex Mono, OFL, self-hosted WOFF2 — in the technology mirror, and R1 records it in the layer's inventory, so the typeface record Principle V requires covers both families.

**Annotation (2026-10-29, ADR-140).** Decision 19 records fifteen slices, the count at ratification. ADR-140 split the administrator block into four slices (R13, R14, R16, R17), so the product carries seventeen; the constitution's References row and the slice map name the current count, and the pages, the entities, and the features decision 19 names are unchanged.

**Annotation to ADR-098.** This record annotates ADR-098 and changes two of its decisions. Decision 2 (the colour set is the default and the outline set serves dense tables and the dark theme) is replaced: the product consumes the outline cut, and the colour cut is vendored but not consumed. Decision 5 (the marine/petrol primary and the warm sand neutral) is replaced by the Precision palette above. Decision 1 (IconPark, both cuts vendored and pinned), decision 3 (IBM Plex Sans Arabic, extended by decision 3 above with IBM Plex Mono for numerals), and decision 4 (light default, no flash) remain in force. `ROADMAP.md` and `docs/architecture.md` are corrected in the same change so no live text still describes the marine/sand direction or a colour-icon default.

**Alternatives considered.**
- *Ship the lab's six models with a switcher.* Rejected: the product has one appearance contract; a switcher is a lab tool, and shipping six palettes would multiply the conformance surface by six.
- *Keep ADR-098's marine/sand palette and treat Precision as a variant.* Rejected: the operator adopted Precision; a variant would leave two authorities for the same token.
- *Record the README's `#B54708` label instead of the token.* Rejected: the token is the authority, the label is a rounded description, and the lab itself uses `#c2410c` for the active bar.
- *Put the page composition in this record.* Rejected: composition belongs to the specification and the slice map; a record that fixed it would become a second specification.

**Consequences and migration/backfill.** The Wafar UI layer records the token names and values and consumes the outline cut; R1's plan records the contract and the conformance gate; each interface slice records the states it ships and the baseline set it generates in CI. The visual evidence under `docs/design/` is a reference, not a baseline. No migration or backfill is required because no code exists. Review date: 2026-12-01. This entry is the durable record.

---

## ADR-129 — The design conformance gate and the baseline chain

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.0.0

**Owning directory**: `packages/ui` (planned by R1), `docs/design/`, `.specify/templates/overrides/`
**Owning feature**: R1, Identity and foundation (the first interface slice); every interface slice consumes the gate

**Context.** Principle IX requires a contract test and a visual baseline for every page state an interface slice ships. The design lab is a reference built outside the repository; its screenshots are evidence of the adopted contract, not a baseline the product can diff against. Without a chain, each slice would invent its own check, and the layer's tokens would drift from the pages that consume them.

**Decision.** The conformance chain is: ADR-128 (the contract) → the Wafar UI layer (token names and values, component inventory) → the slice's specification (the states it ships) → the slice's plan (the baseline set and the gate) → the baseline generated in CI with the same browser and fonts → a slice without the gate is not Converged (Principle IX). The baseline is generated inside the project, never copied from the lab. The target is conformance to the recorded contract, not pixel identity with the lab: pixel identity outside a pinned container is not achievable and is not the requirement. A slice that changes a token or a rendering rule amends ADR-128 first; a slice that adds a page state adds its baseline in the same change.

**Alternatives considered.**
- *Copy the lab's screenshots as the baseline.* Rejected: the lab carries lab-only content and behaviour, and its environment is not the product's.
- *No gate; rely on review.* Rejected: Principle IX makes the gate binding, and review without a baseline cannot see a one-pixel drift.
- *A per-slice ad hoc check.* Rejected: it would let each slice define conformance differently and would not catch a token change that breaks an earlier page.

**Consequences and migration/backfill.** R1's plan records the gate and the first baseline set; each interface slice records its own states and baselines; `docs/design/` carries the reference screenshots and the slice map, clearly marked as reference. No migration or backfill is required because no code exists. Review date: 2026-12-01. This entry is the durable record.

---

## ADR-130 — Part families and the Home category cards

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.1.0

**Owning directory**: `.specify/memory/`, `docs/`, `ROADMAP.md`,
`Core-Project.txt`
**Owning feature**: R5, Home (the cards); R3, catalog extraction (fills the
field)

**Context.** The Home row of the Product Register states that the page carries
no category tiles, because a part-category model is not registered and adding
one requires its own amendment. The design lab's Home composes six category
tiles, and the operator adopted them. The lab's tiles are decorative: each
carries a sample count and none of them leads anywhere. A sample count is a
fabricated number, which the project forbids.

**Decision.**
1. `Part.family` is a field whose value is one of six fixed values — `brakes`,
   `filters`, `batteries`, `cooling`, `engine`, `suspension` — registered as
   reference data owned by the parts module. Changing the set is an amendment
   to this record.
2. Home carries six family cards, each showing a real count and each opening
   `/parts?family=<value>`. No page is added and no entity is added: the
   register's twenty-eight pages and twelve data entities are unchanged.
3. R3 fills `family` during extraction. A part whose family is unknown is
   excluded from the cards and remains in the unfiltered parts list; no card
   carries a sample count and none is invented.
4. The six counts are one indexed aggregate query, not six queries.
5. **Annotation to ADR-128.** Decision 20's "Not adopted" list loses "category
   tiles"; the composition section is unchanged.

**Alternatives considered.**
- *A `PartFamily` entity.* Rejected: a thirteenth entity holding six rows, when
  the set is reference data and the register's entity count is fixed.
- *Decorative tiles carrying sample counts.* Rejected: fabricated numbers, and
  a tile that leads nowhere.
- *No tiles.* Rejected: the operator adopted them.

**Consequences and migration/backfill.** The constitution's Home row is
amended, and so is the sentence that lists Home's card blocks (the family cards
join the statistical, destination, and latest-file cards); `docs/domain-model.md`
gains the field and its invariant; `docs/capacity-model.md` records the single
aggregate query; `ROADMAP.md`'s R5 row and the slice map's R5 entry carry the
cards; R5's specification adds them when it is written. No migration or backfill
is required because no code or data exists. Review date: 2026-12-01.

---

## ADR-131 — The 90-day period counted from the upload

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.1.0

**Owning directory**: `.specify/memory/`, `docs/`, `Core-Project.txt`
**Owning feature**: R15, retention (the job); R11, the privacy text

**Context.** Usage limit 16 fixes automatic deletion at 90 days and reserves the
point the period is counted from to R15, and the Unresolved product facts table
records that reservation. While it is open no source may assert the answer, so
R15 would have had to choose it and R11 could not write the privacy text. The
design lab's privacy page says the period runs from the upload, and the operator
settled the question now.

**Decision.**
1. The period is counted from the catalog file's upload timestamp — not from
   extraction, not from the last update, and not from the first search.
2. The retention job deletes the file and its parts at upload + 90 days; the
   search index is aligned to the same window.
3. The privacy text says "90 days from upload". A claim that deleting the
   account deletes the data stays out.
4. **Annotation to ADR-128.** Decision 20's "Not adopted" list loses "the
   90-day period counted from upload".

**Alternatives considered.**
- *From extraction.* Rejected: the upload is the merchant's act; extraction time
  is the system's, and a failed extraction would restart the clock.
- *From the last update.* Rejected: a file refreshed daily would never expire,
  which turns a retention limit into an unbounded one.
- *Leave it to R15.* Rejected: the operator settled it now, and the reservation
  blocks every source from asserting the answer until it is settled.

**Consequences and migration/backfill.** Usage limit 16, the Unresolved product
facts table, and the deletion table are amended; the Index State Management row
is aligned so the retention job, not the index lifecycle, enforces the
per-catalog window; `docs/capacity-model.md` §7 carries the trigger; the slice
map's R11 and R15 entries and the privacy screenshot note carry it; R11's
specification states the text and R15's plan the job. No migration or backfill
is required because no code or data exists. Review date: 2026-12-01.

---

## ADR-132 — The shell and appearance: scroll-hide, colour icons, and the system default

**Status**: Accepted — 2026-10-27. **Constitution version**: 6.1.0

**Owning directory**: `.specify/memory/`, `docs/`, `ROADMAP.md`,
`Core-Project.txt`, `packages/ui` (planned by R1)
**Owning feature**: R1, Identity and foundation (the frame and the layer)

**Context.** ADR-127 fixed the frame's bottom bar as always visible and not
hiding on scroll. ADR-128 fixed the appearance at light by default with a stored
preference, and fixed the outline icon cut after ADR-098. The operator adopted
three lab behaviours: the bar hides on scroll and returns, the product consumes
the colour cut, and a first visit follows the device preference.

**Decision.**
1. **Bottom bar.** It hides after 32px of cumulative downward scroll and returns
   on the first 16px upward scroll or within 56px of the top; the transition is
   220ms with no fade; `prefers-reduced-motion` stops the slide and keeps it
   visible; scrolling inside the drawer is not counted; the page does not
   reserve the bar's height while it is hidden; the raised action travels with
   the bar. **Annotation to ADR-127.** This replaces "always visible… does not
   hide on scroll".
2. **Icons.** The product consumes the `icon-park` colour cut; the outline cut
   stays withdrawn; the layer records coverage and contrast; a missing icon is
   added by a decision record, never substituted. **Annotation to ADR-128.**
   Decision 2 is replaced once more; ADR-098 decision 2 is amended.
3. **The `system` default.** A first visit follows `prefers-color-scheme`; a
   stored preference wins; the preference is per device; there is no flash (an
   inline script before the first paint). **Annotation to ADR-098 decision 4,
   ADR-102 decision 5, ADR-128 decision 16.**
4. **The gate.** The baseline fixes the appearance: a light set and a dark set,
   with `prefers-color-scheme` pinned in CI. **Annotation to ADR-129.**

**No clause changes.** The constitution does not fix the layer's default
appearance, does not name an icon cut, and does not state the bar's visibility,
so this record amends no constitutional clause.

**Alternatives considered.**
- *Keep the bar always visible.* Rejected: the operator adopted the lab's
  scroll behaviour, and the bar returns on the first upward scroll.
- *The bold icon cut.* Rejected: the operator chose colour.
- *Light by default.* Rejected: the operator chose `system`.
- *The lab's six-model switcher.* Rejected: one contract, not six.

**Consequences and migration/backfill.** FR-052 is amended through the
operator's clarification session; FR-025 stays; the slice map's R1 entry, the
scroll screenshot, and the colour-icon reference gap carry it; R1's plan records
the coverage check, the pinned `prefers-color-scheme`, and the two baseline
sets. No migration or backfill is required because no code exists. Review date:
2026-12-01.

---

## ADR-133 — The design evidence registered: `docs/design` in References and ADR-128/129 in Principle IX

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.0

**Owning directory**: `.specify/memory/`, `docs/`, `AGENTS.md`,
`.specify/templates/overrides/`, `governance-drift-check.mjs`
**Owning feature**: none — governance decision; ratified by the repository owner.
R1, Identity and foundation, consumes it.

**Context.** Principle IX made the conformance gate non-negotiable — a contract
test that asserts the recorded values, and a visual baseline for each page state
a slice ships — but named no source for the recorded values or for the baseline
chain. `docs/design/` carried the slice map and the reference screenshots without
being registered in References, and ADR-128 and ADR-129 were absent from the
constitution. Single-Reference Sufficiency requires every project-level source to
be named in References, and a rule that cannot be discharged without reading a
referenced source to name that source where the rule is stated. `/speckit.plan`
reads the specification and the constitution, and neither named the evidence, so
a plan could be written without the contract or the gate.

**Decision.**
1. **References.** `docs/design/` is registered as the design contract's
   reference evidence: the slice map for the fifteen slices and twenty-eight
   pages, and the reference screenshots it names. Reference, not a visual
   baseline; evidence, not a source of rules.
2. **Principle IX.** The "Conformance gate" bullet names ADR-128 for the
   recorded values and ADR-129 for the baseline chain.
3. **The operational wiring.** `/speckit.plan` loads the slice's map entry and
   its reference images; the plan template's Gate 1 row for Principle IX carries
   the gate, and the plan records the states the slice ships, the baseline set
   it generates in CI, and the gate; `governance-drift-check.mjs` asserts that
   the References row and the two ADR names remain.

**What deliberately did not change.** No principle is removed or redefined; no
page, entity, role, feature, or limit is added; the UI values stay in
`packages/ui` and are not copied into the constitution.

**Alternatives considered.**
- *Copy the tokens and the baseline values into the constitution.* Rejected: a
  register is a map, not a copy, and the values live in the Wafar UI layer.
- *Register `docs/design/` in `AGENTS.md` alone.* Rejected: no command reads
  `AGENTS.md`, and its precedence is below the constitution's.
- *Leave the gate as it stands.* Rejected: a non-negotiable gate that no
  artifact is asked to discharge is unenforceable.

**Consequences and migration/backfill.** The constitution moves to 6.2.0;
`version.json`, the footer, the ADR range strings, `Project-Technologies.txt`'s
header list, and the index row move in the same change. R1's plan records the
contract, the gate, and the first baseline set. No migration or backfill is
required because no code exists. Review date: 2026-12-01. This entry is the
durable record.

---

## ADR-134 — The slice map and the roadmap reach the commands that need them

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.0 (unchanged)

**Owning directory**: `AGENTS.md`, `.specify/templates/overrides/`
**Owning feature**: none — governance decision; ratified by the repository owner.
Every slice consumes it.

**Context.** ADR-133 registered `docs/design/` in References and named ADR-128
and ADR-129 in Principle IX, and wired the slice map and its reference images
into `/speckit.plan`. An audit of the nine commands found three holes it did not
close: `/speckit.specify` did not read the slice map although
`docs/design/README.md` names the map as "the reference material a specification
and a plan read" and `slice-map.md` carries "the open questions a specification
must answer"; `AGENTS.md` §3 carried no `/speckit.clarify` entry at all; and no
command read `ROADMAP.md`, so a slice's scope, dependencies, and exclusions were
reached only through the description a person typed.

**Decision.**
1. **`/speckit.specify`.** It loads `docs/design/slice-map.md` (the slice's
   entry: composition, states, copy, and the open questions the specification
   must answer) and `ROADMAP.md` (the slice's scope, dependencies, and what the
   slice does not do).
2. **`/speckit.clarify`.** `AGENTS.md` §3 gains its entry: `spec.md`, the
   constitution sections the spec cites, and the slice map's open questions.
3. **`/speckit.plan` and `/speckit.analyze`.** Both load `ROADMAP.md` — the
   slice's dependencies and deferred items for the plan, its scope boundary for
   the consistency pass.
4. **`/speckit.checklist`.** It loads the slice map's states and copy, because
   the requirements-quality items it writes are grounded in them.
5. **The template.** The spec template's binding block names
   `docs/design/slice-map.md` among the sources a specification reads, so the
   duty reaches the command even when `AGENTS.md` is not loaded.

**What deliberately did not change.** No constitutional clause, page, entity,
role, limit, or feature changes, so the constitution stays at 6.2.0. The slice
map remains a reference and not a source of rules; the binding version of every
page stays the slice's specification. `/speckit.tasks`, `/speckit.implement`,
and `/speckit.converge` are untouched: they work from the plan, which already
carries the states and the baseline set.

**Alternatives considered.**
- *Read the slice map in every command.* Rejected: the plan carries the states
  and the baseline set forward, and repeating the map at tasks and implement
  adds a second copy that drifts.
- *Leave `AGENTS.md` as it was.* Rejected: `clarify` had no load map, and the
  map reached the plan alone.
- *Rewrite ADR-133.* Rejected: a ratified record is annotated by a later one,
  never rewritten.

**Consequences and migration/backfill.** `AGENTS.md` §3 and the spec template
move in this change; the live ADR range strings move to ADR-134 and
`Project-Technologies.txt`'s header list gains 134. The constitution, its footer,
and `version.json` stay at 6.2.0, because no clause changed. No migration or
backfill is required because no code exists. (Annotated 2026-10-29, ADR-139: the
"no backfill" line was read as "no command regeneration and no data migration",
not as "no specification edit". R1's binding block was written before this change
and carried four sources; it now carries the six the template names, because a
template that gains a source does not reach a specification already written.)
Review date: 2026-12-01. This entry is the durable record.

---

## ADR-135 — The post-6.2.0 audit fix set: ten document corrections

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.0 (unchanged)

**Owning directory**: `docs/`, `docs/design/`, `Core-Project.txt`,
`Project-Technologies.txt`, `ROADMAP.md`, `specs/001-identity-foundation/`,
repository root
**Owning feature**: none — governance and documentation correction; requested
and approved by the repository owner on 2026-10-28

**Context.** A whole-set audit was carried out after 6.2.0 and before R1's plan.
It read the constitution, the two mirrors, the roadmap, the design evidence, the
capacity model, the sample analysis, the single specification and its checklist,
the eight volumes, and the governance tooling, and it compared every source with
the constitution and with every other source. Ten defects were reproduced
against the working tree. Each is invisible to `governance-drift-check.mjs`:
nine are semantic, and the tenth is a Markdown table break the check reads past
because it matches index rows line by line.

Four of the ten share one failure: a decision landed in one place and its
consequences were not carried to every source. ADR-131 fixed the retention
trigger and ADR-132 the icon cut, and four of the ten are statements those two
records left behind. The remainder are one stale index structure, one mirror
rule that over-generalised, one role enumeration that lost a duty, one wording
defect, one stale status note, and one diagram label that reads against the
rule it illustrates.

**Decision.**
1. **The decision index is a table again.** The design-system note and its `---`
   separator moved below the last row, so the records after the split are rows of
   the one table rather than bare lines after a horizontal rule.
2. **`docs/capacity-model.md` §12 stops reserving a decided point.** The sizing
   assumption now names the upload timestamp as both the assumption and the
   trigger (ADR-131), matching §7 in the same file.
3. **R1's checklist stops counting a resolved fact.** The 90-day trigger leaves
   the enumeration of the constitution's open rows; `expires_at` remains the R15
   row it always was.
4. **`docs/pdf-sample-analysis.md` §2.9 records the decision.** The sample's
   finding is the decided answer, not a reservation R15 still owns.
5. **`Core-Project.txt`'s table rule names what the register grants.** The
   blanket "dropdown" filter and the unconditional search field become a
   multi-select filter and a search field "where the register grants it". That
   removes the conflict with the slice map's in-page filter panel and the
   unowned filter obligation on My Files and the administrator tables.
6. **R13's scope carries account deletion.** The Users page soft-deletes an
   account (the merchant cannot delete their own), which `docs/domain-model.md`
   already assigned to R13 and the mirror already implied.
7. **`Project-Technologies.txt` records the icon cut.** The IconPark row names
   the colour cut as consumed and the outline cut as withdrawn (ADR-132), as
   `docs/architecture.md` and the roadmap already do.
8. **The slice map's handoff is current.** It no longer describes three records
   as pending when they landed, and it names the records that registered the
   evidence with the commands that read it.
9. **The administrator seed command reads as Arabic.** «مُبذر» becomes «بذر»,
   the noun the method is named for.
10. **The architecture diagram stops naming a 90-day index lifecycle.** The
    database-to-search note says ISM deletes whole indices by age, which is the
    rule the paragraph below the diagram and Technology Standards already state.

**Alternatives considered.**
- *Annotate the stale statements instead of correcting them.* Rejected: Product
  Fact Clarifications states that a source asserting a decided answer is itself
  the defect, and that the fix is a correction, not an annotation.
- *Correct only the ADR-131 and ADR-132 leftovers.* Rejected: the audit found
  six further defects, and a partial set leaves the next reader with the same
  cost.
- *Amend the constitution.* Rejected: no clause changed. The constitution's own
  Home-card sentence and its resolved-conflict note are consistent with the
  2026-10-27 amendment that wrote them.
- *One record per correction.* Rejected: ADR-075's form — one audited fix set
  with every item reproduced — keeps the trail in one place.

**Consequences and migration/backfill.** The files named by the decisions above
move in this change, together with the range-string sites this change advances.
The live ADR range strings move to ADR-135 and `Project-Technologies.txt`'s
header list gains 135. The constitution, its footer, and `version.json` stay at
6.2.0, because no clause changed. No migration or backfill is required because
no code exists. Review date: 2026-12-01. This entry is the durable record.

---

## ADR-136 — The post-6.2.0 audit fix set II: the icon cut, the template load map, and the check's self-description

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.0 (unchanged)
**Owning directory**: `.specify/templates/overrides/`, `AGENTS.md`, `README.md`,
`docs/`, `governance-drift-check.mjs`, `Project-Technologies.txt`, `ROADMAP.md`,
`specs/001-identity-foundation/`
**Owning feature**: none — governance correction; ratified by the repository owner.

**Context.** A deep audit after 6.2.0 read the whole governance set and ran the
committed drift check, which reported clean at 6.2.0. It found three live-text
defects the check cannot see, the class ADR-074 describes: a statement that
contradicts another statement, and a source that is named in a load map but not
in the binding text a command reads. The plan template's Constitution Mandated
Values row 11 and its Gate 1 row for Principle IX still described IconPark as
"colour + outline", although ADR-132 decision 2 withdrew the outline cut and
ADR-128 decision 2 had been replaced once already. `AGENTS.md` §3 said the
template overrides carry each command's load map as binding text, but the plan
template named neither `docs/design/` nor `ROADMAP.md`, and the checklist
template did not name the slice map. The check's own ADR list and its header
description stopped before section N, which ADR-133 added.

**Decision.**
1. **The icon cut.** The plan template's row 11 and Gate 1 row IX, and
   `AGENTS.md`'s icon paragraph, state the live rule: the product consumes the
   `icon-park` colour cut; the outline cut is withdrawn; both cuts are vendored
   and pinned (ADR-098, annotated by ADR-128 and ADR-132). No accepted record is
   reopened; the historical records keep the superseded wording.
2. **The template load map.** The plan template's binding block names
   `docs/design/` (the slice's map entry and its reference images; reference
   evidence, not a visual baseline) and `ROADMAP.md` (the slice's scope,
   dependencies, and what the slice does not do). The checklist template's
   binding block names `docs/design/slice-map.md` (the slice's states and copy).
   The spec template's binding block names `ROADMAP.md`. This carries ADR-134
   decisions 1–4 into the template layer and makes `AGENTS.md` §3's sentence
   true.
3. **The check's self-description.** The five ADR enumerations (the check's
   header and banner, the constitution's References row, `README.md`, and
   `AGENTS.md`) gain ADR-133 and ADR-136. The check's header comment describes
   checks N and O, and the constitution's and `README.md`'s descriptions name
   the design-evidence check.
4. **The check O.** The drift check gains a text-presence check: the plan
   template's binding block names `docs/design/` and `ROADMAP.md`, the checklist
   template's names the slice map, and the spec template's names the slice map
   and `ROADMAP.md`. A later edit that removes a source fails the check.
5. **No clause changes.** No principle, page, entity, role, limit, feature,
   `FR`, `AC`, or `SC` changes. The constitution, its footer, and `version.json`
   stay at 6.2.0.

**Alternatives considered.**
- *Leave the templates as they are and rely on `AGENTS.md`.* Rejected: the
  templates are the binding text a command copies, `AGENTS.md` is below the
  constitution, and ADR-133's premise was that a plan could be written without
  the evidence.
- *Rewrite ADR-132, ADR-133, or ADR-134.* Rejected: a ratified record is
  annotated by a later one, never rewritten.
- *Add no check.* Rejected: the three defects would return silently on the next
  edit, which is the failure ADR-071 exists to prevent.
- *Copy the icon wording from the historical records.* Rejected: the records
  preserve the superseded decision; the live rule is ADR-132.

**Consequences and migration/backfill.** The files named above move in this
change. The live ADR range strings move to ADR-136 and
`Project-Technologies.txt`'s header list gains 136. The check reports twenty-six
ADRs and checks N and O. The constitution, its footer, and `version.json` stay
at 6.2.0, because no clause changed. No migration or backfill is required
because no code exists. Review date: 2026-12-01. This entry is the durable
record.

---

## ADR-137 — The appearance authority: the outline icon cut, the light default, the focus line, and the page-size default

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.0 (unchanged)
**Owning directory**: `packages/ui` (planned by R1), `docs/`, `.specify/templates/overrides/`, `AGENTS.md`, `ROADMAP.md`, `Core-Project.txt`, `specs/001-identity-foundation/`
**Owning feature**: R1, Identity and foundation (the Wafar UI layer and the frame); every interface slice consumes the contract

**Context.** The design lab's Precision model is the appearance the operator
adopted: it renders IconPark's outline cut at 20px and a light first visit with
a two-state switch. ADR-132 had replaced ADR-128's outline cut with the colour
cut and the light default with `system`, so the adopted record and the adopted
appearance disagreed. The operator has now settled the appearance: outline
icons, a light default with dark available, a 20-row default with 20/50/100, and
the lab's rendering of the focus line. The constitution does not fix the
default appearance — it states that the Wafar UI layer records it — and it does
not name an icon cut; it fixes pagination at 20, 50, and 100 rows.

**Decision.**
1. **Reference.** The lab's Precision model is the visual authority for the
   composition and for the rendering rules; the five other models remain
   evidence that composition is independent of the token set; no model
   switcher, `useDesign`, or `?design` ships.
2. **Icons.** The product consumes `icon-park-outline` (the outline cut) at
   20px. Both cuts are vendored and pinned under `packages/ui/vendor` (ADR-098
   decision 1); the colour cut is vendored but not consumed; the derived bold
   cut is lab-only. A missing icon is added by a decision record, never
   substituted. **Annotation to ADR-132** decision 2 (replaced) and to ADR-136
   decision 1 (its live statement is superseded; the historical record keeps
   its wording). **Restores ADR-128** decision 2.
3. **Appearance.** Two appearances, light and dark. A first visit is light; a
   stored choice wins over it; the choice is per device; the switch is a
   two-state control whose state is carried by name and `aria-pressed`; the
   appearance is applied before the first paint so neither appearance flashes;
   no `system` option exists; no appearance is stored on the account.
   **Annotation to ADR-132** decision 3 (replaced). **Restores ADR-098**
   decision 4, **ADR-102** decision 5, and **ADR-128** decision 16.
4. **Gate.** The baseline captures both appearances; the default is light;
   `prefers-color-scheme` is not read. **Annotation to ADR-132** decision 4.
   ADR-129 is otherwise unchanged.
5. **Focus.** One 2px line: an outer ring with a 2px offset on controls and
   links, and an inset ring on fields so the ring is not clipped by the field's
   own boundary; its contrast meets 3:1 against the adjacent surface.
   **Completes ADR-128** decision 7; the layer records the measurement.
6. **Page size.** The default is 20; the control offers 20, 50, and 100;
   changing it returns to page 1; the lab's 10 is withdrawn. The constitution's
   clause (20, 50, 100) is unchanged; the binding home of the default is the
   Parts specification (R5).
7. **Scope.** No page, entity, limit, role, feature, or slice count changes. The
   lab's sample content, tools, and sample values are not transferred.

**Annotations.** ADR-098 decisions 2 and 4; ADR-102 decision 5; ADR-128
decisions 2, 7, and 16; ADR-129; ADR-132 decisions 2, 3, and 4; ADR-136
decision 1.

**Alternatives considered.**
- *Keep ADR-132 (colour cut and `system`).* Rejected: the operator chose the
  lab's appearance, and the lab renders the outline cut and a light default.
- *Make the lab a source of rules.* Rejected: it is outside the repository, and
  Single-Reference Sufficiency requires a registered source; the rules live in
  this record and the screenshots stay evidence (ADR-133).
- *Adopt page size 10.* Rejected: it is a sample value, and adopting it would
  amend the constitution for a non-visual number.
- *Copy the lab's stylesheet as the contract.* Rejected: no code is transferred;
  the layer records the values (Principle IX).

**Consequences and migration/backfill.** The layer records the outline mapping,
the light default, the focus line, and 20/50/100. The live texts in `AGENTS.md`,
`Project-Technologies.txt`, `Core-Project.txt`, `README.md`,
`docs/architecture.md`, `ROADMAP.md`, the plan template, the spec and checklist
templates' live range strings, the R1 specification, the requirements checklist,
the slice map, and `docs/design/README.md` are corrected in the same change; the
manifest's footer note is corrected. No code or data exists, so no migration or
backfill is required. Review date: 2026-12-01.

---

## ADR-138 — The 6.2.1 clarifications: the typeface, two terms, and the appearance citation

**Status**: Accepted — 2026-10-28. **Constitution version**: 6.2.1
**Owning directory**: `.specify/memory/`, `docs/`, `docs/decisions/`,
`.specify/templates/overrides/`, `AGENTS.md`, `README.md`, `ROADMAP.md`,
`Project-Technologies.txt`, `specs/001-identity-foundation/`
**Owning feature**: none — governance decision; ratified by the repository owner.

**Context.** After ADR-137 settled the appearance, a deep read of the constitution
found four registration gaps rather than product defects. The mirror names IBM
Plex Sans Arabic, but the Technology Standards register neither approved the
typeface nor listed it under "Register gaps a slice MUST close", so the mirror
named a technology the register did not carry. Principle IX requires project
values to live in "the Wafar UI layer" and forbids a "token file" outside it,
but the Glossary defined neither term. The References row for `docs/design/`
and the Principle IX conformance gate named ADR-128 and ADR-129 but not ADR-137,
the record that filled the appearance the constitution delegates to the layer.
The pagination clause named 20, 50, and 100 rows but not the default 20 that
ADR-137 fixed.

**Affected principles and in-flight work.** Principle IX gains the ADR-137
citation in its conformance gate; no other principle changes. The only in-flight
feature is R1, whose specification is untouched except for its live range line;
its plan is not blocked, and no artifact already produced is invalidated.

**Decision.**
1. **Layer assets.** The typeface and the icon set are assets of the Wafar UI
   layer, not rows of the Approved register. The register's gap table gains a
   generic "typeface used by the interface" row, recorded in Complexity
   Tracking, required by Principle V's Arabic-first interfaces and the layer,
   and owned by R1; the icon set's existing gap row is unchanged. A paragraph
   after the gap tables states both are layer assets, that ADR-098 records both
   choices and ADR-137 fixes the consumed cut, and that R1 closes both gaps at
   its acceptance. Naming the exact family and cuts stays in the mirror and in
   those records.
2. **Two terms.** The Glossary defines **Wafar UI layer** (the single layer at
   `packages/ui`, its contents, its fixed path, and the prohibition on a
   parallel layer and on a token file outside it) and **Token** (a named UI
   value recorded once by the layer and consumed by name; a raw value outside
   the layer is not a token). No value is restated.
3. **The appearance citation.** The References row for `docs/design/` names
   ADR-137 as the appearance authority, and the Principle IX conformance gate
   requires conformance with the recorded values (ADR-128) and the recorded
   appearance (ADR-137). ADR-128 and ADR-129 keep their places.
4. **The page-size default.** Product Fact Clarifications records that a data
   table's page size defaults to 20 rows, that the control offers 20, 50, and
   100, and that changing it returns to the first page (ADR-137). The
   Pagination clause is unchanged. **Annotation to ADR-137** decision 6: the
   constitution now records the default for every data table; the phrase "the
   binding home of the default is the Parts specification (R5)" is superseded
   as the binding home, and R5 remains the implementation owner of the Parts
   table.
5. **Scope and version.** This is a PATCH: clarifications and wording, no new
   principle, section, page, entity, role, limit, feature, slice, `FR`, `AC`, or
   `SC`. The constitution moves to 6.2.1 and `version.json` moves with it. No
   code exists and no migration or backfill is required.

**Consequences and migration/backfill.** The constitution's footer and
`version.json` read 6.2.1. The live range strings in `AGENTS.md`, `README.md`,
`ROADMAP.md`, `docs/architecture.md`, the spec and checklist template
overrides, and the R1 specification move to ADR-138, and
`Project-Technologies.txt`'s header list gains 138. The index gains this row.
`AGENTS.md`'s debt entry counts thirty-two records without an alternatives
section, because this governance record carries none. The drift check reports
clean. No migration or backfill is required because no code or data exists.
Review date: 2026-12-01. This entry is the durable record.
