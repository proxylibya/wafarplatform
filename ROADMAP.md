# Roadmap — Wafar MVP

Wafar turns supplier parts catalogs (Excel, PDF, Word) into one searchable
catalog for Libyan merchants. This roadmap orders the MVP scope that is already
fixed in `.specify/memory/constitution.md` (Product Scope) and `Core-Project.txt`
into independently specifiable slices. It names and orders them; it does **not**
design them — the design happens when each slice runs through its own
`/speckit.specify`.

**Constitution**: `.specify/memory/constitution.md` (current version: its footer
or `.specify/memory/version.json`). On any conflict with this file, the
constitution wins.

Convention: the Spec Kit "spec of specs" procedure. A sub-spec opens with
`**Input**: Parent roadmap: ROADMAP.md → R#.` and this table's
`Sub-spec` column is filled in with that slice's directory.

**Slice identifiers equal specification numbers**: slice `R7` is created as
`specs/007-<name>/`, so a reference to a slice resolves without consulting this
table. ADR-015 records the renumbering from the thirteen-slice order this file
previously carried. ADR-139 closes the gap that made the equality a hope rather
than a rule: `feature_numbering` is sequential, so a slice created out of order
takes the next number instead of its `R#`. Each slice is therefore created in
numeric order, or with `GIT_BRANCH_NAME=<R#>-<slug>` set explicitly to the
roadmap's identifier; a specification whose number does not match its slice is a
defect of the order, not a naming preference.

## What is NOT on this roadmap

The following is **project-level knowledge**, not work. It never takes a feature
number, is never specified as a feature, and is referenced by name from every
slice through the binding Project Context Sources carried in the feature
templates.

| Project-level concern | Source of truth |
|---|---|
| Engineering law, product scope, limits | `.specify/memory/constitution.md` |
| How the system is built | `docs/architecture.md` |
| The data model — entities, relationships, invariants | `docs/domain-model.md` |
| Capacity and load envelope | `docs/capacity-model.md` (ADR-117, ADR-119, ADR-121, ADR-122); sample evidence: `docs/pdf-sample-analysis.md`; the constitution wins on every conflict |
| Approved technology stack | `.specify/memory/constitution.md` (Technology Standards); `Project-Technologies.txt` mirrors it |
| UI foundation (component library and project layer) | `.specify/memory/constitution.md` → Principle IX; ADR-097 fixes the Wafar UI layer's path (`packages/ui`); R1 builds it through its plan and consumes it; ADR-098 records the visual foundation, ADR-128 records the Precision contract that annotates it, and ADR-137 fixes the appearance (outline icon cut, light default) |
| Product definition (roles, pages, acceptance criteria) | `Core-Project.txt` |
| Accepted decisions | the decision register: `docs/DECISIONS.md` (index, ADR-001 … ADR-161) and `docs/decisions/` (records) |

A slice named "Architecture", "UI Foundation", "Tech Stack", or "Conventions"
would be a classification error: it would tell the agent that a project-wide
rule is a piece of work, so later slices re-invent what already exists and the
rules drift. It MUST NOT be created. See `docs/DECISIONS.md` → ADR-007.

**Status legend**: planned · in-progress · done

## Slices

| ID | Sub-feature | Intent | Scope boundary | Depends on | Status | Sub-spec |
|----|-------------|--------|----------------|-----------|--------|----------|
| R1 | Identity and foundation | A merchant signs up (full name, OTP-verified Libyan mobile number on +218, with no dial-code selector per ADR-041, password, city, optional shop name per ADR-030), signs in and out, and recovers a password via SMS OTP; sessions, password hashing, and auth rate limits follow the constitution's Identity, Authentication, and Session Policy, and the Libyan city list is fixed here. R1's foundation phase creates the repository workspaces and `packages/ui` (ADR-097); this slice registers the `auth` and `users` modules and consumes the layer and its visual foundation (ADR-098, annotated by ADR-128 and ADR-137). The account's `status` value and the `auth` module's `Session` entity are fixed by ADR-067, so this slice implements them rather than deciding them. | The merchant's account only. The administrator's separate login belongs to R13. The shell and delivery duties are listed under "First obligations" below; R1's foundation phase owns the workspace and the layer scaffold (ADR-097), runs before the identity work, and ends at the checkpoint the note under "First obligations" states — it is a phase of this slice's plan, never a slice of its own (ADR-139). | — | in-progress | `specs/001-identity-foundation/` |
| R2 | File intake | A merchant uploads an Excel, PDF, or Word catalog; size and content-type are validated before storage; bytes are stored in object storage; a content hash is computed; a duplicate is rejected by hash; the catalog record's status is recorded; the per-user upload quotas are enforced server-side (50 files per calendar month, 300 active stored files, no lifetime total; the administrator's per-user ceiling is 500 per month and 1,500 active); the catalog's stored byte count and content type are decided here (open fact #9). This slice also delivers the merchant's Upload Catalog page (ADR-126): the upload control with progress, the monthly and active quota state, the duplicate-hash outcome naming the original, and the `/upload` route the page ships at; My Files (R4) links to the page instead of embedding the upload. This slice also creates the `catalogs` module, which owns the uploaded file, its metadata, and its status; R4 extends that module's service with the delete cascade rather than creating it. | Validation, content safety (magic-byte validation, ClamAV scan, decoded-size cap, macro stripping), storage, hash, duplicate check, status, the upload quota, and the Upload Catalog page itself; extraction is R3. | R1 | planned | — |
| R3 | Catalog extraction | The worker pipeline: extract parts from the file's tables, read the supplier name and issue date from the first page (setting `first_page_metadata_incomplete` when that page yields neither, and displaying any further issue dates that match the supplier's name), normalise columns, deduplicate by file/page/row, index the parts, set status to `completed` or `failed`, and allow retry without re-uploading bytes. This slice also creates the `suppliers` module, stores the supplier name in its normalised form, assigns every extracted value to one of the six canonical columns (including values separated out of a merged or overlapping source column), reads one printed price or two with their printed labels and stores at most two amounts (the primary amount is the sort and filter key), extracts no description, leaves a price printed in another currency without a stored price (which reads «بدون سعر»), and stores no column the constitution's Glossary does not fix. This slice also creates the `parts` module, which owns the extracted rows and their schema. | The pipeline and the `parts` and `suppliers` modules only. Reading and searching parts is R5. The extraction algorithm remains a deferred area ratified in this slice's plan; the canonical columns themselves are fixed by the constitution (ADR-040). Open facts #10 (a part's page and row of origin) and #12 (a multi-separator printed price) are decided here. | R2 | planned | — |
| R4 | My Files | The merchant's page for the files they uploaded: the file table, a link to the Upload Catalog page (R2, ADR-126), the processing status of each file, deleting a file they uploaded, and the retry action for a failed file. Each file row carries the open control of the constitution-required "My Files → Parts (filtered by that file)" transition, wired in R5. The catalog-delete cascade is implemented here in the `catalogs` module service R2 creates: parts and search-index withdrawal now, bookmark withdrawal added by R8 at the same trigger; R16's admin delete and R15's retention job reuse the same routine rather than reimplementing it. This slice also adds the sticky table header the Wafar UI layer does not yet provide, because My Files carries the first table the product renders. | The merchant's own files only. Upload validation and storage are R2; extraction is R3. | R1, R2, R3 | planned | — |
| R5 | Parts search | The public Parts page and the Home page: Arabic root-aware search over part name, part number, and original number by partial match, multi-select filters over car model, type, catalog file, and supplier (no selection meaning every value of that filter), a price range filter over the primary amount, a parts table showing every column at all times — part number, name, car model, original number, type, price, the supplier's name, and the cart control — with the price column rendering the primary amount and, when the file prints one, the second amount with its printed label, each as a decimal point and three decimal places and «بدون سعر» where a catalog prints none, every column sortable except `type`, pagination 20/50/100, and `?file=<id>` filtering, within the p95 < 1 s budget. The price column and its filter and sort are for a registered merchant only: a guest receives the same table through a projection that has no price (ADR-040). Home carries the platform name, the quick search field, the four statistical cards, the nine destination cards, six part-family cards with real counts that open the Parts page filtered by family (ADR-130), and the three most recently updated catalog files with a «كل الملفات» action to the Catalog page. R5 also wires the file-row open control from My Files (R4) to `?file=<id>` filtering, and records the "searches" counter decision as an ADR, amending the Product Register in the same change if a new entity is required. The public table's UI components (pagination, sort indicator, filter bar, the multi-select control, and the price-range control — the sticky header is R4's, whose table is the first the product renders) come from the Wafar UI layer, and this slice adds the ones the layer does not yet provide. | Reading and filtering only. Search ranking beyond the sortable columns is a deferred area. The table's cart control is rendered here, but the action behind it and the `bookmarks` module are R8's, so the window between the two is recorded as a defect below and in this slice's plan (defect 17). | R1, R2, R3, R4 | planned | — |
| R6 | Catalog files page | The public Catalog page: a table of every uploaded catalog file; a row links to R5 filtered by that file. | Read-only listing. Management actions live in R16 and R17. The table lists the supplier named on the first page, extracted by R3. | R1, R2, R3, R5 | planned | — |
| R7 | Profile | A registered user edits the non-identifier account details (full name, city, optional shop name) and changes the password, and ends every session of their account at once from the settings section that the account menu's «إعدادات» item opens (ADR-100). The mobile number is the identifier and is not editable here; the account carries no delete control. | The caller's own account only. The mobile number is not editable, and account deletion is not permitted. | R1 | planned | — |
| R8 | Cart (bookmarks) | A registered user adds and removes a part in a personal bookmark list, maximum 99 parts, add completing within the p95 < 200 ms budget; the `+` control becomes the remove-from-cart control once saved. This slice also creates the `bookmarks` module. When a catalog is deleted, the bookmarks pointing at its parts are withdrawn through the same catalog-delete trigger R4 implements. | A bookmark list only: no price, no quantity, no checkout (Principle VI). The `bookmarks` module this slice creates is what the catalog-delete cascade's third leg withdraws through, so this slice adds that leg to the routine R4 wrote rather than a second routine (defect 18). | R1, R4, R5 | planned | — |
| R9 | Notifications | A notification list with a mark-as-read action, generated by processing outcomes, by administrator messages, and by an administrator's reply to a merchant message (Glossary → Notification, ADR-046). This slice also creates the `notifications` module. The unread counter the header's notifications control carries is a UI element the Wafar UI layer does not yet provide, and this slice adds it; the control itself is R1's (FR-020), it opens the Notifications destination, and the counter rides the control in the header, per ADR-102 (ADR-139). | Delivery to the in-app notification list only; administrator messages and replies become a source once R17 exists. Notification retention is decided here and recorded as an ADR. | R1, R3 | planned | — |
| R10 | Messaging | One conversation thread between a merchant and the administrator; the merchant sends a message and sees the reply after a refresh. This slice also creates the `messages` module and ships the merchant's side of the thread. | The merchant's side of the thread only. User-to-user chat is prohibited (Principle VI). The administrator's reply, and the notification delivered on it, are R17's: every administrator operation MUST be recorded, and the recorder arrives with R13, so no administrator reply may exist before it can be recorded (ADR-106, annotated by ADR-140). `Conversation`'s administrator reference and the message sender's representation are decided here (open facts #1 and #2). | R1, R9 | planned | — |
| R11 | Support surfaces | Contact form (name, phone, body) that reaches the administrator through the "Contact messages" admin page (ADR-028), plus the FAQ, privacy policy (whose retention sentence states 90 days from upload, ADR-131), terms of use, and 404 pages. This slice also creates the `support` module, with the contact form protected by a honeypot field, a minimum time-to-submit, and a per-client rate limit. The Contact page renders the contact details `PlatformSetting` holds (Product Scope → Contact; ADR-072), so this slice also creates that entity — its schema and its public read projection, created inside the `admin` module's directory (the read surface only), seeded with a default — because it is the first surface that reads it; `admin` remains its owning module and R13 extends that same module with the administrator's Settings write surface while R16 and R17 extend it with their operations (ADR-077, annotated by ADR-140). | Static content, the contact form, and the Contact page's read of `PlatformSetting` only. The administrator's Contact-messages surface is R17 and the Settings write surface is R13. A contact message's status and administrator note are decided here (open fact #11). | R1 | planned | — |
| R12 | Delivery and operations | Three environments with staging parity, health checks that verify the dependencies each service uses, the error tracker, secret management with pre-commit and CI scanning, TLS certificate management, the log pipeline, the dependency update process, and the pre-release load test against `docs/capacity-model.md`, plus staging data anonymisation and the monitoring and alerting set. | Running the platform, not building product behaviour. | R1, R2, R3, R5 | planned | — |
| R13 | Admin application foundation | The administrator's separate application with its own login and shell, and the operations that must exist before any other administrator operation can. The administrator signs in with no OTP; the shell's navigation lists only the pages that exist; the Users page views accounts, blocks and unblocks one, soft-deletes one (the merchant cannot delete their own), and sets a per-user upload quota within the constitutional ceiling; the Settings page reads and writes `PlatformSetting`, the entity R11 created for the Contact page's read. Every one of those operations writes one append-only `AuditLog` record in the same operation, and this slice creates the recorder every later administrator slice reuses; it also creates the `AuditLog` table in the `admin` module. This slice ratifies the authorization model on the shared entry point R1 created (ADR-139), which closes the deferred "authorization model" area. The slice forbids blocking or soft-deleting the account holding the administrator role, because no path restores it, and adds no way to create a second administrator. | The administrator's surface only. No file, supplier, part, message, notification, contact-message or dashboard surface: Files, Suppliers and Parts are R16; Messages, Notifications, Contact messages and Dashboard are R17; the Audit Log's read surface is R14. The administrator application's own header carries the platform's logo and an account control whose menu offers sign-out only, because that application has no profile page and no merchant settings page (ADR-100). The navigation carries only shipped pages and grows with R14, R16 and R17; it is never fixed to pages that do not exist (the window defect 19 records for the merchant frame is not reproduced here). The Users page shows the account's status and the two quota overrides and no file usage, so this slice takes no dependency on R2. This slice extends the `admin` module and `packages/db/schema/admin.ts` that R11 created for the `PlatformSetting` read (ADR-077, annotated by ADR-140). | R1, R11 | planned | — |
| R14 | Audit log | The administrator-facing page over the append-only record every administrator operation writes. | Reading only. The recording is part of R13. The action vocabulary is open-ended: the page derives its filter values from the record itself, so R16's and R17's action types need no change to this page, and reading the log is not an administrator operation and writes no record. | R13 | planned | — |
| R15 | Retention | Automatic deletion of a catalog after 90 days, with the search index lifecycle aligned to the same window. The retention job reuses the catalog-delete cascade owned by R4 rather than duplicating it, and it releases an active-file slot without restoring the monthly upload count. | The deletion job and the index lifecycle only; the delete cascades to the catalog's parts, bookmarks, and index entries. `expires_at` semantics are decided here; the point the 90 days are counted from is fixed at the catalog file's upload timestamp (ADR-131), so this slice implements the job against that trigger. | R3, R4, R8 | planned | — |
| R16 | Admin catalog management | The administrator's management of the catalog domain: the Files page reviews a file, deletes one through the catalog-delete cascade R4 wrote, and reprocesses a failed file without a new upload; the Suppliers page manages suppliers and merges two spellings of one name; the Parts page edits a part, edits either printed amount, and adds a part manually, which requires choosing an existing catalog because a part belongs to exactly one catalog. Every action is recorded through the recorder R13 created, every write reuses the owning module's service rather than a second routine, and a supplier merge merges names only. | The catalog domain's administrator surface only. The account, settings, communication, contact-message and dashboard surfaces belong to R13 and R17. The manual add stores only the six canonical columns the Glossary fixes, no description, and a family or none (ADR-130); a part is never stored without a catalog (domain-model, Part). The supplier merge withdraws no part and introduces no equivalence entity (ADR-040). Authorization is R13's model; this slice consumes it and decides nothing new. | R13, R2, R3, R4 | planned | — |
| R17 | Admin communication and oversight | The administrator's communication and oversight surfaces: the Messages page replies in a merchant's thread, using the sender representation and the administrator reference R10 fixed, and delivers the notification for that reply; the Notifications page sends an administrative message (a broadcast) in bounded batches; the Contact messages page reviews the contact-form messages and writes the status and administrator note R11 fixed; the Dashboard shows the platform's statistics — accounts, files, parts and searches — as a table over entities already in scope. Every action is recorded through the recorder R13 created. If R5 records that the searches counter cannot be stored, the Dashboard shows the three remaining statistics. | Communication and oversight only. The merchant's side of the thread is R10's and the notification list is R9's. The Dashboard renders a table, not cards: every data view is a table and only Home composes cards (Product Scope). No entity, page or Usage Limit is added, and the Settings page never carries a Usage Limit. Authorization is R13's model; the reply, the broadcast, and the contact-message status implement R10's, R9's and R11's decisions and decide nothing reserved. | R13, R9, R10, R11, R2, R3, R5 | planned | — |

## First obligations

The constitution assigns several duties to "the first slice" that introduces
something. Those assignments are resolved here so that no duty is left without
an owner.

**The concentration this table creates is a declared risk, not a design
defect, and it is recorded here rather than fixed by a new slice.** The
constitution names a duty by the milestone that first triggers it — the first
slice that creates the workspace, the first that introduces the test runner,
the first that introduces persistent storage, the first that builds a shell
page — and R1 is the slice that triggers most of them at once, so it owns more
than half the rows below. Moving a duty to another slice would break the
milestone the constitution names, and creating a slice for the remainder would
be a classification error of the kind ADR-007 prohibits: the foundation is
project-level work, not a feature. The mitigation is therefore procedural, and
it is the constitution's own: R1's plan sequences the foundation duties in a
foundation phase before the identity work, records the concentration in its
Complexity Tracking table with an owner and a review date, and the review date
is **2026-12-01** — the first review checkpoint after this note was written on
2026-10-21. If R1's plan cannot
sequence the foundation and the identity work without the slice exceeding a
reviewable increment, the remedy is a decision recorded as an ADR, not a
quietly widened slice. **R1's foundation phase** is the workspace,
`packages/config`, `packages/ui`, and the shared tooling: it is the part of R1's
plan that creates the repository the later slices build on. It is not a numbered
slice, it is not a second feature, and the phrase "pre-R1 foundation" is
retired — nothing in this order runs before R1, and two names for one phase were
read as two phases (ADR-139). The phase ends at a hard checkpoint: the
workspace, the layer, the tooling, and the continuous-integration gate are
accepted and recorded before the identity work begins, and no identity
requirement is verified before that checkpoint passes (ADR-139).

| Duty | Owning slice | Constitution reference |
|---|---|---|
| The project's own `LICENSE` file and the licence it carries — no rule and no slice owned it before ADR-086 | **Decided 2026-10-09**: the repository owner chose proprietary, all rights reserved; ADR-087 added the `LICENSE` file at the repository root | No constitutional rule names it; ADR-086 recorded the gap and its owner, ADR-087 records the decision |
| The workspace, `packages/config`, and the shared tooling | R1 | Technology Standards → repository topology; `docs/architecture.md` |
| The eight API modules R1 does not create, each with its `apps/api/src/modules/<module>/` directory: `catalogs` (R2), `parts` and `suppliers` (R3), `bookmarks` (R8), `notifications` (R9), `messages` (R10), `support` (R11), and `admin` (R11 creates its `PlatformSetting` read surface; R13, R16 and R17 extend it) | R2, R3, R8, R9, R10, R11, R13, R16, R17 | Principle X (the module list); Technology Standards → Internal layout; Project Structure and Debt Control (one owning feature per directory) |
| The `packages/db/schema/<module>.ts` file each module first writes — R1 writes `users.ts` and `auth.ts`, R2 `catalogs.ts`, R3 `parts.ts` and `suppliers.ts`, R8 `bookmarks.ts`, R9 `notifications.ts`, R10 `messages.ts`, R11 `support.ts` and `admin.ts`, and R13 extends the `admin` module — with the overlaps named: `packages/db/schema/admin.ts` and the `admin` module's read surface are created by R11 for `PlatformSetting`, while R13 adds the `AuditLog` table and the administrator's write surface, R16 adds the catalog-domain operations and R17 the communication and oversight operations (ADR-077, annotated by ADR-140), and R4 extends the `catalogs` module R2 creates | R1, R2, R3, R8, R9, R10, R11, R13, R16, R17 | Technology Standards → Internal layout (Database ownership); Schema and Migration Control |
| The test runner and the continuous-integration provider that enforces the 80% coverage gate | R1 | Principle III; Register gaps |
| The transactional SMS provider for OTP sign-up verification and password reset (replaces the previous transactional-email gap) | R1 | Technology Standards → Register gaps (ADR-030) |
| Provisioning of PostgreSQL, Redis, SeaweedFS, and OpenSearch for development | R1 | Technology Standards |
| PgDog deployment with named fallback (PgBouncer) and review date (2027-04-06) | R1 | Technology Standards (PgDog is pre-1.0 and MUST name a fallback and a review date) |
| Enabling Dependabot/Renovate so the update process exists from the first merge; the full dependency-update policy is R12's | R1 (enablement), R12 (policy) | Dependency Governance (before the first public release) |
| Backup and restore tooling, and the RTO/RPO numbers | R1 | Deployment and Observability (R1 introduces persistent storage) |
| The typeface register gap: the IBM Plex Sans Arabic and IBM Plex Mono licence-obligation records and vulnerability scans, recorded in Complexity Tracking with ADR-098 and ADR-128 | R1 | Technology Standards → Register gaps; Principle IX |
| The application shell — header (logo/home at inline-start; at inline-end the notifications control, the theme switch, and the account control, the account menu «حسابي / إعدادات / تسجيل الخروج» with a yes-or-no sign-out confirmation), sidebar (full width or an icon rail on desktop, drawer on mobile, at inline-start) carrying the navigation item list and the collapse control, the footer band, the bottom navigation bar (ADR-127), the icon set (an open-source set under a permissive licence, self-hosted SVG, no emoji, per ADR-042), and the product's typography — scoped to public pages and the merchant area, never on auth/404/static pages; the shell's layout values come from the Wafar UI layer; the header and sidebar composition is fixed by ADR-099 and ADR-102, which annotate ADR-016 and ADR-017; the Wafar UI layer is `packages/ui` (ADR-097), and the icon set (IconPark), typeface (IBM Plex Sans Arabic, with IBM Plex Mono for numerals), the light appearance default, and the Precision palette are ADR-098 and ADR-128, annotated by ADR-137; the product consumes IconPark's outline cut, the bottom bar hides on scroll and returns, and a first visit is light (ADR-137) | R1 | Principle IX; ADR-016, ADR-017; ADR-093; ADR-097, ADR-098, ADR-099; ADR-102; ADR-127; ADR-128; ADR-132; ADR-137 |
| The sidebar icon rail's width, fixed at 4.25rem by ADR-128 decision 5, recorded by the Wafar UI layer and consumed by the shell's desktop collapsed state; R1 records and consumes the value and chooses no width of its own | R1 | Principle IX; ADR-017; ADR-093; ADR-128 |
| The link surface that reaches the four bare-layout static pages (Contact, Privacy Policy, Terms of Use, FAQ): the footer band inside the frame (ADR-096), built by R1 with its four routes fixed; the reachability requirement is binding, and the four pages themselves are R11's, so the two slices share their four routes | R1 | Product Fact Clarifications (the shell's per-page reachability; ADR-053); ADR-096; ADR-127 |
| The sticky table header the Wafar UI layer does not yet provide, added to that layer and used by the first table the product renders (My Files, R4) | R4 | Principle IX; ADR-093 |
| The table skeleton whose geometry equals the table's content, added to that layer and used by the first table the product renders (My Files, R4) | R4 | Principle IX; ADR-093; ADR-128 |
| The content skeleton, the in-place loading bar, and the loading-state rule that owns their thresholds, added to that layer and used by every data page (R2, R4, R5, R9) | R1 | Principle IX; ADR-093; ADR-128 |
| The bidirectional file-name surface that isolates a Latin extension inside an Arabic name, added to that layer and used by R2, R4, R5, and R6 | R1 | Principle IX; ADR-093; ADR-128 |
| The Parts table's remaining UI components the Wafar UI layer does not yet provide — pagination, the column sort indicator, the filters toolbar, the multi-select control, the price-range control, the filter chips, the facet rows, and the facet checklist — added to that layer and used by the Parts page | R5 | Principle IX; ADR-093; ADR-128 |
| The upload-with-progress component the Upload Catalog page renders (R2), added to the Wafar UI layer | R2 | Principle IX; ADR-093; ADR-126 |
| The confirmation overlay the file-delete action needs, added to the Wafar UI layer | R4 | Principle IX; ADR-093 |
| The cart add/remove toggle and the toast surface the full-cart notice uses, added to the Wafar UI layer | R8 | Principle IX; Product Fact Clarifications (the 99-part notice); ADR-093 |
| The message-thread surface, added to the Wafar UI layer | R10 | Principle IX; ADR-093 |
| The unread counter the header's notifications control carries, added to the Wafar UI layer when the notification list lands; the control itself is R1's (row above), so this slice adds the counter and not a second control, and the sidebar's Notifications item carries no count, per ADR-102, so the count has one surface (ADR-139) | R9 | Principle IX; ADR-093; ADR-102 |
| The `PlatformSetting` entity the Contact page reads — its schema and public read projection, created inside the `admin` module's directory (the read surface only), seeded with a default — created by the first surface that reads it; `admin` remains the owning module and R13 extends that module with the administrator's Settings write surface | R11 | Product Scope → Contact; Product Register → Data entities (`PlatformSetting`); ADR-067; ADR-072; ADR-077 |
| CSRF, output-encoding, and security-header tests | R1 | Identity, Authentication, and Session Policy (first browser-facing feature) |
| The automated accessibility scan and the manual keyboard-only pass | R1 | Principle IV (interface verification) |
| The resolution of the sidebar conflict | Resolved 2026-10-03 in ADR-017: sidebar required fixed on desktop; auth/404/static pages bare; `Core-Project.txt` now defines the shell | Closed by ADR-017 |
| Setup, testing, and deployment documentation | R1 | Documentation (first feature that creates the workspace) |
| Staging parity, error tracker, secret management, TLS, log pipeline, dependency update process, load test | R12 | Deployment and Observability ("the first deploying slice"); Dependency Governance (dependency update process); Performance Budgets and Verification (load test) |
| The documentation-drift test for the first public interface | R2 | Documentation; Performance Budgets and Verification. R1's public surface is covered by OpenAPI generation from the Hono routes (ADR-002), so the first standalone drift test appears in R2 (ADR-031 item 4). The first N+1 query-count assertion is **R1's**, not R2's: R1 asserts the query count of a sign-in request (T058) and records the SHOULD's status in its plan's Complexity Tracking, as the note below and ADR-139 state; the two obligations are separate and neither discharges the other (ADR-139). |
| The committed Stylelint + ESLint configuration that fails the build on physical direction properties and raw colour/spacing/radius/shadow/duration/z-index values outside the Wafar UI layer | R1 | Principle IX; Technology Standards (Quality) |
| The seeded CLI command that creates the administrator account, the forced password change, and the anti-enumeration/lockout responses | R1 | Identity, Authentication, and Session Policy |
| Automated detection of weak password hashing, and the "sign out everywhere" / browser-token revocation on password change | R1 | Identity, Authentication, and Session Policy |
| Honeypot field, minimum time-to-submit, and rate-limit protection on registration and contact forms, with automated tests | R1 (registration) and R11 (contact form) | Identity, Authentication, and Session Policy (anti-spam enforcement) |
| The merchant-isolation query-path test that fails the build when a merchant-reachable path returns another merchant's rows | R1 | Deployment and Observability (`Session` is a merchant-scoped table created and read by R1, so R1 is the first slice whose merchant-scoped path reads merchant-owned rows; the test fails when the scope is removed — ADR-139) |
| The single shared entry point through which merchant scoping and (later) permission resolution are applied | R1 | Schema and Migration Control; Authorization and Access Control (R1 creates the entry point with `Session` as its first caller; R13 ratifies the permission model on the same entry point — ADR-139) |
| The dependency budget — the numeric cap on direct runtime dependencies, recorded under Constitution Mandated Values | R1 | Project Structure and Debt Control (the CMV list mandates the value but no slice owned it before ADR-033) |
| The content-safety pipeline: magic-byte validation, ClamAV scan, decoded-size cap, and macro stripping before extraction | R2 (validation and content safety) | File Processing Rules; File Processing Overview |
| Presigned multipart upload transport for large files | R2 | Deployment and Observability (Upload transport) |
| Worker durability: bounded retries with exponential backoff, dead-letter queue, per-worker concurrency cap, and temporary-file sweep | R3 | Deployment and Observability (Worker durability) |
| The Lighthouse budget (LCP, INP, CLS) asserted by Lighthouse CI on the public Parts and Home pages | R5 (first public pages) | Performance Budgets and Verification |
| Stating the supported browsers (two latest major versions of Chrome, Edge, Firefox, Safari) in the plan's Constitution Mandated Values | R1 | Constitution Mandated Values (supported-browser statement); Technology Standards |
| Staging data anonymisation (seeded or anonymised datasets only) | R12 | Deployment and Observability |
| The monitoring and alerting set: p95 request latency, search p95, processing success rate, queue depth, and budget-breach alerts | R12 | Deployment and Observability |
| Public API versioning (`/api/v1`) and the deprecation rule (one release of notice, recorded as an ADR) | R1 | Deployment and Observability |
| Per-build SBOM and the vulnerability/SAST scan (Semgrep OSS or equivalent) that blocks release | R1 | Dependency Governance; Deployment and Observability |
| Extraction libraries named in Constitution Mandated Values | R3 | Technology Standards → Register gaps |
| Redis client library: choice recorded in the plan's Complexity Tracking table with an ADR | R3 | Technology Standards → Register gaps |
| OpenSearch client library: choice recorded in the plan's Complexity Tracking table with an ADR (R3 indexes the parts, so R3 is the first slice to need it and makes the choice; R5, which searches, consumes it) | R3 | Technology Standards → Register gaps |
| Arabic analyzer configuration and verification: choice recorded in the plan's Complexity Tracking table with an ADR | R5 | Technology Standards → Register gaps |
| SBOM generator: the tool that produces the per-build SBOM, recorded with an ADR (the scans themselves are already registered) | R1 | Technology Standards → Register gaps; Deployment and Observability (supply-chain controls) |
| Load-test tool: the tool that performs the pre-release load test, recorded with an ADR | R12 | Technology Standards → Register gaps; Performance Budgets and Verification |
| A committed read-only governance drift check that verifies the constitution's version footer and amended date against `.specify/memory/version.json`, every live `ADR-001 … ADR-0NN` range string (including those in the feature specifications), every ADR index row's anchor against its heading and every heading against the index, every `ADR-NNN` reference against the index, the ADR list in `Project-Technologies.txt`'s header (including its contiguity), every enumeration of ADRs in the governance set against the one the check's own header carries, the upstream manifest hashes in both directions, the two integrations' byte-identity (their command directories, and each integration manifest against the tree it records and that integration's whole command directory), the absence of the removed stylesheet and its constitution section, the ADR index's constitution-version column against the footer's version, the structural counts the governance text states in prose, the Constitution Mandated Values count the plan template states, and every entity's owning module in `docs/domain-model.md` against the constitution's Data entities table | R1 - **delivered 2026-10-08 by ADR-071** (`governance-drift-check.mjs`); every later ADR that touched the check is named in its own header line, which is the single authority for that list; R1 only wires it into CI | Governance (version sources, amendment procedure); Documentation (records that drift after the author moves on); ADR-061 |
| The same check names no external tool: it runs from the repository and adds no dependency, and a slice that wants one records the choice with an ADR | R1 | Technology Standards → Register gaps (naming a library before its ADR is prohibited) |

## Defects in the slice order, and the slice that closes each

These were found by auditing the slice order this file has carried across its
history. Defects 1–16 come from the audit of the thirteen-slice order; defects
17 and 18 were added on 2026-10-21 against the fifteen-slice order (ADR-105),
and defects 19 and 20 were added on 2026-10-29 against the same order (ADR-139).
Each names the slice that closes it.

| # | Defect | Closed by |
|---|--------|-----------|
| 1 | The My Files page had no owning slice; the file-intake slice's scope boundary excluded it | R4 |
| 2 | Six register gaps were assigned to "the first deploying slice" or "the first slice that introduces the test runner", which no slice satisfied | R1 (continuous-integration provider) · R12 (error tracker, secret manager, TLS certificate management, log pipeline, load-test tool) |
| 3 | The sidebar conflict was assigned to "the first surface that lays out a page", which no slice satisfied | Closed by ADR-017 (2026-10-03); no slice owns it |
| 4 | The administrator slice did not depend on the extraction slice whose output it administers | R16 |
| 5 | The administrator slice shipped operations before the audit log existed, though every administrator operation must be recorded | R13 records each operation; R14 is the read surface |
| 6 | The contact form reaches the administrator, but no administrator page receives it | Closed 2026-10-03 by ADR-028: a dedicated Contact messages page (owned by R17, decided in ADR-028) |
| 7 | The application shell had no owner, so every browser-facing slice would rebuild it | R1 |
| 8 | The sub-spec `Input` convention was stated in two different forms | Fixed 2026-10-03 in `.specify/templates/overrides/spec-template.md` |
| 9 | The icon set was assigned to the parts-search slice, but the shell needs it first | R1 |
| 10 | The Sync Impact Report was committed into the constitution | Fixed 2026-10-03 |
| 11 | The product mirror listed five catalog status values, and pre-empted two facts the constitution assigns to R9 and R15 | Fixed 2026-10-03 in `Core-Project.txt` |
| 12 | The product mirror carried an unreferenced TODO for a budget the constitution had already fixed | Fixed 2026-10-03 in `Core-Project.txt` |
| 13 | The binding specification template did not carry the sub-spec `Input` line the constitution requires | Fixed 2026-10-03 |
| 14 | The per-user upload quotas (50 files per calendar month, 100 files in total) were binding limits that no slice's scope named, so nothing would have implemented them | Fixed 2026-10-03: R2; the quota model is superseded by ADR-118 (50/300, no lifetime total; administrator ceiling 500/1,500) |
| 15 | The data model existed in three copies that had already diverged, and seven facts were carried by field identifiers that no registered source defined — so they were unbuildable under the Product Register's own rule. The identifiers did not come from the product mirror; they were present in earlier drafts of the unresolved-facts table, as ADR-019's annotation records | Fixed 2026-10-03 by ADR-019: `docs/domain-model.md` is the single authority |
| 16 | Three product conflicts were invisible because nobody compared the copies: how a message's sender is represented, whether a conversation carries an administrator reference, and whether an administrator is a distinct entity | Recorded as unresolved product facts; the administrator question is closed by ADR-067 (a role on `User`); R10 owns the two sender/reference questions |
| 17 | The Parts table renders the cart control, but the cart action and the `bookmarks` module are R8's, so between R5's acceptance and R8's the control has no action behind it | R8 — R5 renders the control and records the window in its plan's Complexity Tracking table; R8 lands the action and the `bookmarks` module, after which the `+` control becomes the remove-from-cart control |
| 18 | The catalog-delete cascade's bookmark leg belongs to a module that does not exist when the cascade is written, so the two halves of one rule live in two slices | R8 — R4 implements the routine over the parts and the search-index entries; R8 adds the bookmark leg to that same routine rather than a second one, and R16's admin delete and R15's retention job reuse the routine as it stands |
| 19 | The frame fixes the nine sidebar destinations, the five bottom-bar slots, and the four static-page links in R1, and Home carries nine destination cards in R5, but the pages behind them ship in R2–R10, so the first frame-carrying page (R2) renders links whose pages do not exist yet | R10 — the last destination (Messages); each slice ships its page and adopts the route R1 fixes, and R2's plan records the window in Complexity Tracking (ADR-139) |
| 20 | R2's duplicate outcome names the original file and links to the parts that came from it, but the Parts page is R5's and R2 depends only on R1, so the link has no page behind it when R2 ships | R5 — R2 fixes the link and its route, R5 ships the Parts page with `?file=<id>` filtering, and R2's plan records the window in Complexity Tracking (ADR-139) |

## Notes

- **Administrator representation.** The administrator is a role on `User`,
  fixed by ADR-067 on 2026-10-07. The question is closed, not deferred, so no
  slice decides it: R1's seeded CLI creates that account, and R13 implements the
  administrator's separate application over the same role. The register, the
  model, and R1's seed already carry the answer. (ADR-074 corrected this note,
  which still assigned the question to R13 after ADR-067 had answered it.)
- **Authorization model.** R4, R7, and R8 enforce ownership and merchant scope in
  their own scopes; the ratified permission granularity remains deferred to
  R13 (the deferred "authorization model" area; see `docs/domain-model.md`).
- **My Files → Parts transition (ADR-031).** R4 renders each file row's open
  control; R5 wires it to `?file=<id>` filtering. The constitution's required
  transition is satisfied across the R4 + R5 pair, not by either slice alone;
  R5's `Depends on` includes R4, so the edge is explicit.
- **R10 depends on R9 by ordering, not by data (ADR-109).** R10 ships the
  merchant's side of the thread and reads no notification; the administrator's
  reply, and the notification delivered on it, are R17's (ADR-106, annotated by
  ADR-140). The edge is
  kept because it orders the thread after the notification list, so the
  merchant's side ships against a list that already exists. It is a sequencing
  choice, not a data dependency, and it is stated here so the cell is not read
  as one.
- **The administrator block is four slices, and the recorder ships first
  (ADR-140).** R13 ships the separate application, its shell, the administrator's
  login, the `AuditLog` recorder, Settings and Users; R14 reads the record; R16
  manages the catalog domain; R17 carries communication and oversight. The order
  is the invariant: every administrator operation MUST be recorded, so the
  recorder exists before the first operation that writes (ADR-106), and R16 and
  R17 reuse it instead of writing a second one. R13 is the smallest of the four
  and the only one the others depend on. If R17's specification projects more than
  60 functional requirements at the end of `/speckit.clarify`, it is split into
  R17 (Messages and Notifications) and R18 (Contact messages and the Dashboard),
  appended after it, and no existing slice is renumbered. Review date:
  **2026-12-01**, the first checkpoint after this note was written (ADR-140).
- **Home page.** The Home page (platform name, quick search field, four
  statistical cards) needs no slice of its own: its search field is R5 and its
  counters depend on R1, R2, R3, and R5. R5 also owns the four-cards question,
  and the product register's four cards (accounts, files, parts, searches)
  stand; R5's plan records the choice in the decision register. The "searches"
  counter (including guest searches) has no entity today; R5 decides where it
  is stored, records the choice as an ADR, and amends the Product Register in
  the same change if a new entity is required. The counter MUST be owned by an
  existing module and an existing entity, or the ADR MUST name the new entity,
  its owning module, and the amendment to Principle X's module list; a counter
  with no owning module is not an option (ADR-139).
- **Query-count assertion (ADR-139).** R1's session lookup is the first public
  data path the product serves, so the N+1 query-count rule reaches R1's plan
  before R2's table does. R1's plan records the assertion's status — met, or an
  unmet SHOULD with its reason and a review date — in Complexity Tracking, and
  R2 owns the first standalone documentation-drift test for the public
  interface (ADR-031 item 4); the two are separate obligations and neither
  discharges the other.
- **Independent verification.** Each slice is independently testable: R1 alone
  yields a working account and the shell's composed frame verified structurally,
  R2 alone yields an accepted and stored file, R5 alone yields a searchable parts
  table.
- **Requirement identifiers.** `FR-###` and `AC-###` are assigned per
  specification during `/speckit.specify` (see
  `.specify/templates/overrides/spec-template.md`); this roadmap orders and
  bounds slices but assigns no requirement identifiers.
- **Structure registers.** R1 creates the workspace; it MUST follow the fixed
  locations in the constitution (current version: its footer) and `docs/architecture.md`, including
  `apps/web/app/layouts` and `apps/admin`, and records the documentation-drift
  check for collection in R2 (R1's public surface is covered by OpenAPI
  generation from the Hono routes; ADR-002).
- **Deferred areas.** R2, R3, R5, and R13 are the first slices to implement the
  deferred areas (file ingestion internals; extraction algorithm; retrieval
  interface; authorization model). Catalog data shape was discharged 2026-10-05
  by ADR-040: the canonical columns are fixed in the constitution's Glossary, and
  the shape below the product is the schema file and the feature's
  `data-model.md`. Per the constitution's
  Governance section, each MUST record in its plan's Constitution Check which
  rules are still missing and how they will be ratified, no later than that
  slice's acceptance.
- **Open data-model questions.** `docs/domain-model.md` → Unresolved facts is
  the full list; this note mirrors it so the owning slice is visible at a
  glance. Rows 1–4 are also binding in the constitution's Product Register
  (Unresolved product facts), and row 12 joined them there on 2026-10-05 with
  the price column; rows 9–11 are open field-level facts carried by the model
  alone — the mirror carries the concepts, never field identifiers:
  1. Sender representation on a message (R10)
  2. `Conversation`'s administrator reference (R10)
  3. `expires_at`: retention deadline or the supplier's printed expiry (R15); the point the 90 days are counted from is fixed at the file's upload timestamp (ADR-131)
  4. Notification retention (R9)
  5. ~~Contact message: conversation or its own inbox~~ — resolved 2026-10-03 by ADR-028: a dedicated Contact messages page owned by R17
  6. ~~Administrator: distinct entity or a role on `User`~~ — resolved 2026-10-07 by ADR-067: a role on `User`
  7. ~~The account's status value, and blocked-merchant as state or flag~~ — resolved 2026-10-07 by ADR-067: `User.status` is `active` or `blocked`
  8. ~~Whether the `auth` module owns any stored entity~~ — resolved 2026-10-07 by ADR-067: `auth` owns `Session`
  9. The catalog's stored byte count and content type (R2)
  10. A part's page and row of origin (R3)
  11. A contact message's status and administrator note (R11)
  12. How a printed price carrying more than one separator is read, and how a file that separates thousands is read (R3)
  13. ~~Where the administrator's platform settings are stored~~ — resolved 2026-10-07 by ADR-067: `PlatformSetting`, owned by `admin`

  Each owning slice MUST decide its question, record the decision in
  the decision register, and amend `docs/domain-model.md` in the same change —
  never silently choose it. Row 12 was added 2026-10-05 with the price column;
  rows 6, 7, 8, and 13 were resolved 2026-10-07 by ADR-067.
- **Release gate.** Several rules (load test, Dependabot/Renovate, SBOM and
  scan gate, TLS/secret management, staging anonymisation, monitoring) name "the
  first public release" without a slice. The release gate is R12's acceptance:
  a production deployment with staging parity, the load test against the stated
  budgets, the dependency-update process configured, SBOM and vulnerability/SAST
  scans blocking, TLS certificate management and secret injection, and backups
  restored once. R15 (retention), the R14 audit-log page, R16 and R17 are
  release-blocking leaves: a slice no other slice depends on still blocks the
  gate. R12's
  `Depends on` column lists only the slices it builds on — the gate itself is
  broader than the import graph and covers every slice.

