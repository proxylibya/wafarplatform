# Wafar Platform Constitution

<!--
Sync Impact Report (review material; MUST NOT be committed — Governance →
amendment procedure)
==============================================================================
Version change: 6.3.1 -> 6.3.2 (PATCH)

Rationale for PATCH: the amendment registers one term in the Glossary — the
product's shared page composition — and names the second word already in use for
it as an accepted synonym rather than a second term. It fixes a name, not a
rule: no principle is added, removed, or redefined, no section is added or
removed, and no behaviour changes, so the bump is neither MAJOR nor MINOR.

Modified principles: none. Titles and rules are unchanged.

Modified sections:
  - Glossary -> a new row, **Shell**, placed before **Wafar UI layer**: it
    defines the composition (header, sidebar, footer band, and the narrow-screen
    bottom navigation bar), fixes **Shell** as the approved term, records
    **Frame** as an accepted synonym confined to text that already carries it,
    and requires new text to use **Shell**.

Added sections: none
Removed sections: none
Templates: none — the resolved scaffold's headings and their order are kept;
no versioned template layer is written.

Supersedes: nothing. No record is rewritten; ADR-127's title and the R1
specification's existing "frame" occurrences stay as written, because the new
row accepts them as the synonym rather than as a second term. ADR-148 records
this amendment.

Follow-up TODOs: none. No placeholder token is left unresolved.

Note for the reviewer: this report is scratch material and MUST be deleted
before the amended constitution is committed.
-->

This project turns parts catalogs supplied as PDF, Excel, or Word files into a
structured, searchable catalog for Libyan merchants who currently catalog them
by hand. A merchant registers, opens an account, uploads supplier catalogs, and
browses, searches, and filters the result. A separate administrator operates
the platform. The platform is a catalog: it does not sell, does not buy, and
does not process payment. A registered user's "cart" is a personal bookmark
list, not a purchase.

This constitution governs engineering practice and product boundaries. It
deliberately does not govern the shape of the product's data model, its
extraction behaviour, or its retrieval interface, because those decisions are
not yet made. It does govern which entities exist, which module owns each, and
which product rules bind across them (Product Register → Data entities); it does
not govern their columns, types, or constraints. It also governs how a schema
change is made, and how repository structure is laid out, regardless of those
shapes. See Deferred areas.

**Contents.**

- Core Principles
- Product Scope
- Product Register
- File Processing Overview
- Single-Reference Sufficiency
- Query Safety and Secrets
- Schema and Migration Control
- Identity, Authentication, and Session Policy
- Authorization and Access Control
- Performance Budgets and Verification
- Dependency Governance
- Module Discipline and Development Workflow
- Project Structure and Debt Control
- Documentation
- Deployment and Observability
- Technology Standards
- Glossary
- References
- Artifact Workflow and Traceability
- Product Fact Clarifications
- Governance

**Reading protocol.** This document is large, and no feature command needs all
of it. It MUST NOT be read end to end for a feature command. Read the sections
the command in hand names, and only those, mirroring `AGENTS.md` §3:
`/speckit.specify` reads Product Scope, Product Register, the Usage Limits
table in Performance Budgets and Verification, and Glossary; `/speckit.plan` reads Technology Standards and Product Register;
`/speckit.tasks` reads Product Register, Single-Reference
Sufficiency, and Artifact Workflow and Traceability; `/speckit.checklist` reads
Product Scope, Product Register, and the binding sections its checklist names;
`/speckit.implement` reads the sections its plan's Constitution Check cites;
`/speckit.analyze` and `/speckit.converge` read the sections the artifacts under
review cite. A per-command read SHOULD stay within the context budget its plan
records. Reading the whole document is reserved to an amendment (Governance →
amendment procedure) and to a full review (Review trigger).

## Core Principles

### I. Evident, Traceable Change (NON-NEGOTIABLE)

Every change MUST be traceable from requirement to task to commit.

- Every requirement MUST carry a stable identifier.
- Every task that implements a feature MUST reference at least one requirement
  or acceptance criterion, and every requirement MUST have at least one task.
- Every acceptance criterion MUST carry a stable identifier of the form
  `AC-###`, assigned in the specification. An unnumbered acceptance criterion
  cannot be referenced by a task.
- A task reference MUST be carried in the task description, because the task
  format has no field reserved for it. The description ends with the
  identifiers it satisfies — for example, "... in src/auth/session.ts
  (implements FR-004, AC-002)". A reference that exists only in a reviewer's
  memory, or only in a commit message, does not satisfy this rule.
- Work that implements no requirement — a refactor, a dependency or tooling
  change, a security fix, or a spike — MUST be recorded in the plan's
  Complexity Tracking table with its rationale. It MUST NOT be linked to a
  fabricated requirement.
- Every change MUST reference its spec and task identifiers in the commit or
  pull request description.
- A deviation from the agreed specification MUST be recorded as an amendment
  to the specification, never left implicit in the code.
- Every automated test SHOULD be traceable to a requirement, a business rule,
  or a documented defect.

**Rationale:** The consistency and convergence gates can only reason about
artifacts that reference each other. Without identifiers they produce no
findings, and the process degrades into unverified generation. An untracked
change is not made reviewable by inventing a requirement for it; it is made
reviewable by recording it where a reviewer will read it. A task format that
reserves no field for a reference does not remove the obligation; it moves
the obligation into the description text, where a reviewer and a gate can
both read it.

### II. Strict Type Safety

- TypeScript strict mode MUST be enabled in every TypeScript project in this
  repository, together with the index-access, optional-property, override,
  and unused-symbol checks that plain strict mode does not include.
- The `any` type is prohibited in application code. A value whose type is not
  known MUST be typed as `unknown` and narrowed explicitly with type guards.
- Type-suppression directives and double assertions such as
  `as unknown as T` are prohibited in application code. A double assertion
  satisfies a lint rule while destroying the type guarantee the rule exists
  to provide. A suppression or double assertion in test fixtures, code
  generators, and build tooling MUST carry a comment naming the upstream
  defect it works around, and the count of such occurrences MUST NOT grow
  between releases.
- Validation schemas MUST be shared between the frontend and the backend,
  co-located in the designated shared package, so that the two contracts
  cannot drift.

**Rationale:** Strict mode without a ban on `any` is half a guarantee, and a
ban without a ban on double assertions is satisfied in form while producing a
lie. A prohibition with no permitted exception is a prohibition that gets
worked around silently, which is why the exceptions are narrow, named, and
counted. Shared schemas make the frontend and backend agree by construction
rather than by discipline.

### III. Measured Test Coverage

- New and changed production code MUST maintain at least 80% automated test
  coverage, measured as coverage of the changed lines.
- A feature specification MUST request its test tasks explicitly. Task
  generation treats tests as opt-in and reads that request from the
  specification rather than from the plan, so a feature that leaves coverage
  to be inferred yields a task list with no tests, and the coverage rule
  above then has nothing to measure.
- The coverage gate MUST be enforced by continuous integration no later than
  the first feature that introduces the test runner. Until that gate exists
  the requirement is reviewed manually; it is neither waived nor silently
  ignored.
- Unit tests MUST cover business rules, integration tests MUST cover module
  contracts, and end-to-end tests MUST cover user journeys. Generated code,
  migrations, and snapshots are exempt.
- A coverage threshold MUST NOT be satisfied by tests that assert nothing. A
  test that makes no assertion or that asserts only on its own setup MUST NOT
  count toward the threshold.
- A test MUST NOT be skipped, focused, or marked pending in order to make a
  gate pass. A skipped test MUST reference a tracked issue and a review date.

**Rationale:** A percentage with no measurement definition and no enforcement
point is a wish, not a gate.

### IV. Accessible User Interfaces

- All user-facing surfaces MUST meet WCAG 2.2 AA. WCAG 2.1 AA is the floor
  and MUST NOT be treated as the conformance target.
- Every interactive element MUST be reachable and operable by keyboard. No
  interaction may require a dragging movement or a pointer alone.
- A change of state that a sighted user would perceive MUST be announced to
  assistive technology, and focus MUST NOT be left on a removed element.
- Focus indication MUST be provided via `:focus-visible` on every interactive
  element and MUST meet the WCAG 2.2 focus-appearance contrast requirement.
- Touch targets MUST be at least 44px on any coarse-pointer input device, at
  any viewport width. A narrow screen alone does not establish the requirement,
  and a wide screen alone does not remove it.
- Every interactive surface MUST expose its state to assistive technology
  (loading, empty, error, success, disabled), not only its success state.
- Verification MUST include an automated accessibility scan and a manual
  keyboard-only pass.

**Rationale:** Accessibility written as an abstract principle is not
implemented. These are the failure modes that recur most often in practice.

### V. Arabic-First and RTL Interfaces (NON-NEGOTIABLE)

Wafar is an Arabic-language platform for Libyan merchants. Arabic is the only
user-facing language, and the document direction is right-to-left in every
surface.

- All user-facing text MUST be Arabic with a right-to-left-first layout, using
  the document direction attribute and logical CSS properties rather than
  physical left and right properties.
- `<html dir="rtl" lang="ar">` MUST be set on every page, without exception.
- Code identifiers, code comments, and governance documents MUST be English.
  Technical names that do not translate (PDF, Excel, OEM, SKU) MAY appear in
  user-facing text. Two exceptions are named here so that the rule is read with
  them rather than against them: the two mirrors `Core-Project.txt` and
  `Project-Technologies.txt` are Arabic documents. Their identifiers, rules,
  and structure are English; the prose a reader reads is Arabic. An
  Arabic string quoted as the subject of a rule — an Arabic-Indic numeral, an
  Arabic search example — is an illustration of that rule, not a violation of
  it.
- Numerals rendered to the user MUST be Latin (1234567890), not
  Arabic-Indic (٠١٢٣٤٥٦٧٨٩), applied through the designated numeric utility
  with `direction: ltr; unicode-bidi: isolate`.
- Emoji MUST NOT appear in any text a person reads inside the platform: a page
  title, a button label, a table cell, an empty-state description, a
  notification body, a message body, a screen in the administrator application,
  and the body of an SMS the platform sends. An icon MUST be an SVG from the
  approved icon source (Technology Standards -> Register gaps a slice MUST close); an emoji glyph
  is not an icon and MUST NOT stand in for one. The ban covers every surface a
  user or an administrator reads and nothing else: governance documents, code
  identifiers, and code comments are outside it.
- Arabic text MUST NOT carry positive `letter-spacing`. Negative tracking is
  permitted only on large headings and only within the type scale recorded by
  the Wafar UI layer.
- The typeface MUST be an Arabic-first family, self-hosted, and used under a
  recorded licence. The family is recorded by the Wafar UI layer; a typeface
  outside that record MUST NOT be used.
- Search MUST resolve Arabic word roots (طرمبة → طرمبات) through the
  designated Arabic analyzer. A search that matches only surface forms does
  not satisfy this rule.
- Physical direction is prohibited in **both** forms, and the two forms are
  named together because a surface can be made physical either way and a rule
  that named only the first left the second unenforced.
  - The **property form** is a physical direction property or its Tailwind
    utility: `margin-left`, `padding-right`, `border-left`, `float: right`,
    `text-align: left`, the `left` and `right` inset properties, and the `ml-`,
    `mr-`, `pl-`, `pr-`, `left-`, and `right-` utility prefixes. Logical
    equivalents (`margin-inline-start`, `margin-inline-end`, `padding-inline`,
    `inset-inline`, `border-inline-end`) are required in its place.
  - The **value form** is a physical direction keyword or gradient direction
    inside a property that has a logical or angular equivalent: `left` and
    `right` in `background-position`, `object-position`, `mask-position`, and
    `perspective-origin`; and the `to left` and `to right` directions in
    `linear-gradient(…)`, `radial-gradient(…)`, and `conic-gradient(…)`.
- **The test that separates a permitted direction from a prohibited one is
  whether the direction is derived from the writing mode, not whether the
  property has a logical equivalent.** A direction that *is* the writing mode —
  a disclosure caret, a select chevron, a progress or loading fill, an arrow, a
  text-direction indicator, a gradient that stands for a reading direction —
  MUST be expressed logically: the `start` and `end` keywords, the
  `inline-start`, `inline-end`, `block-start`, and `block-end` position
  keywords, or the `inset-inline-start` and `inset-inline-end` properties. CSS
  defines no logical gradient direction — `linear-gradient` accepts only
  `to left`, `to right`, `to top`, `to bottom`, or an angle — so a gradient
  whose direction follows the writing mode MUST state the explicit angle that
  the document's single writing mode fixes (`dir="rtl"`, whose line end is the
  left edge, so the angle is `270deg`), and MUST NOT use a `to <side>` keyword.
  A direction that is *not* derived from
  the writing mode — a sheen, a vignette, a scanline, a surface highlight, a
  decorative wash — MUST state an explicit angle in degrees (`90deg`), MUST
  NOT be flipped to match a logical neighbour, and MUST NOT be read as an
  indicator. An explicit angle is not a physical direction under this rule,
  because it fixes the design instead of reading the writing mode, and that is
  what separates a permitted fixed design from a defect.
- A moving element whose travel follows the reading mode — a loading sweep, a
  progress fill, a marquee — MUST travel from the inline-start edge to the
  inline-end edge, and MUST express the RTL direction logically: through the
  `inline-start` and `inline-end` position keywords, or through a signed token
  pair derived from the writing mode. It MUST NOT hard-code a physical
  direction, and it MUST NOT be read as an indicator when it is decorative.

**Rationale:** The audience is Libyan merchants. A broken RTL layout or an
Arabic-Indic numeral in a table is not a cosmetic defect; it is a loss of
trust in the platform, and it is the class of defect that a reviewer who
reads only English will not catch.

### VI. Catalog-Only Scope (NON-NEGOTIABLE)

Wafar is a search-and-display catalog. It does not sell, does not buy, does
not process payment, and does not host direct user-to-user chat.

- Any feature that implements payment, purchase, order placement, request
  for quotation (RFQ), or electronic wallet is prohibited within the current
  scope.
- The "cart" is a personal bookmark list. It MUST NOT carry price,
  quantity, or checkout state. It MUST NOT be described in user-facing text
  as a purchase.
- **Displayed price.** A part carries the price or prices printed in its own
  source catalog, so a merchant can see what each supplier charges. A catalog
  that prints two price columns, or one column carrying two labelled amounts,
  stores both amounts, each with the column name the supplier printed; a catalog
  that prints one stores one. The **primary price** is the amount the parts table
  sorts and filters on, fixed by the rule in **Price**; the second amount is
  displayed and is neither sortable nor filterable. The price is a catalog
  attribute, not an offer: it carries no quantity, no discount, no currency
  conversion, and no checkout state, and the cart renders none of it. A merchant
  never edits a price; only the administrator does, and the administrator edits
  both amounts. Neither amount is visible to a guest and neither MUST reach a
  guest through any surface, response, index projection, or export: a guest's
  read path projects the part through its own allowlist without the price column,
  which is a different projection and not a hidden column (Query Safety and
  Secrets). Every amount is rendered with a decimal point and exactly three
  decimal places, the dinar's own subdivision, and with no thousands separator,
  so ten dinar reads `10.000` (and fifteen dinar reads `15.000`); the
  denomination is named once in the column header rather than repeated in every
  cell. A printed label is rendered with its amount only when it is Arabic; a
  label in another script, or no label, leaves the amount unlabelled. A part
  whose catalog prints no price reads «بدون سعر» rather than a blank or a zero,
  and the price filter accepts a minimum and a maximum.
- Messaging is limited to a single conversation thread between a user and
  the administrator. Direct user-to-user messaging is prohibited.
- Sale and purchase are deferred. Enabling them requires an amendment to
  this constitution, as a MAJOR change.
- **Cart page name.** The cart's user-facing Arabic name is «سلة المشتريات».
  Despite the purchase-sounding label it is a personal bookmark list only: it
  carries no price, no quantity, and no checkout state (Principle VI).
- **Reports scope.** "Reports" are limited to the statistics and summaries
  the administrator Dashboard shows over entities already in this scope.
  Advanced reporting is out of scope and MUST NOT be built without a
  specification that records the addition.

**Rationale:** The product solves one problem — searching supplier catalogs
that are currently searched by hand. Adding commerce expands the legal,
financial, and operational surface before the core problem is validated.

### VII. Specification-First and Documentation Separation (NON-NEGOTIABLE)

Every feature begins with a complete specification that is technology
agnostic, describing what and why before how.

- `spec.md` MUST remain technology agnostic. Frameworks, libraries,
  architectural patterns, and implementation details are prohibited in it.
  User stories, requirements, acceptance criteria, and success criteria
  belong there.
- `plan.md` MUST contain every technical detail: frameworks, libraries,
  architectural patterns, and implementation context.
- A review of `spec.md` MUST confirm the absence of technical detail. A
  technical detail in `spec.md` is a blocking defect, not a stylistic one.
- Deviations from the agreed specification MUST be handled as Principle I
  requires: recorded as an amendment to the specification, never left
  implicit in the code.

**Rationale:** The strict separation keeps business intent reviewable by a
non-implementer, and keeps the specification stable when the technology
changes beneath it.

### VIII. User Story Independence (NON-NEGOTIABLE)

Every user story MUST be independently implementable, testable, and
deliverable as an increment of value.

- Every user story MUST carry a priority (P1, P2, P3, ...).
- Every user story MUST be testable in isolation, without requiring another
  story to be complete.
- Every user story MUST deliver observable value on its own.
- The set of P1 stories MUST constitute a shippable MVP.
- Circular dependencies between stories are prohibited.
- Integration between stories is permitted, but it MUST NOT break the
  testability of any individual story.

**Rationale:** Independence enables incremental delivery, parallel
development, and shipping a partial MVP without waiting for the full scope.

### IX. UI Foundation Fidelity (NON-NEGOTIABLE)

The product uses one component foundation and one project-specific UI layer; a
parallel design system is prohibited.

- **Component source.** Nuxt UI v4 is the only UI component library. A second
  component library MUST NOT be introduced.
- **Project values.** Project-specific UI values, theme configuration, wrappers,
  and patterns live in the Wafar UI layer at `packages/ui`, whose path is fixed
  by ADR-097 and `docs/architecture.md`; R1 builds it through SpecKit and its plan
  consumes that path. This constitution does not restate those values and does
  not create a package.
- **Existing components first.** A new interface MUST use the existing Nuxt UI
  components and the Wafar UI layer. A missing component is added to that layer
  in the same change, never created ad hoc inside a feature.
- **No parallel design system.** A second component CSS library, token file, or
  component inventory MUST NOT be added outside the Wafar UI layer.
- **State completeness and motion.** Every interactive surface MUST render every
  applicable state: loading, empty, error, success, and disabled.
  `prefers-reduced-motion` MUST be honoured.
- **No raw values.** Raw Tailwind colours, `#hex` or `rgb()` values outside the
  Wafar UI layer, direct `z-10`/`z-20`/`z-50` values, and arbitrary spacing,
  radius, shadow, or duration values MUST NOT appear in application code.
- **Conformance gate.** Every interface slice MUST prove its conformance with the
  Wafar UI layer's recorded values (ADR-128) and its recorded appearance
  (ADR-137) through a committed automated gate:
  a contract test that asserts the recorded values, and a visual baseline for
  each page state the slice ships (ADR-129). A slice without that gate is not
  Converged.
- **RTL and accessibility.** Responsive behaviour, RTL construction, and
  accessibility remain required by Principles IV and V.

**Rationale:** One component source and one project layer prevent the drift and
maintenance cost a second design system creates. The values themselves are
implementation detail and belong to the layer, not to this constitution.

### X. Modular Monolith Architecture

The API is a single deployable server, divided into independent modules.
Each module has one responsibility and no direct call into another module.

- Each module has its own routes, service, and repository.
- Communication between modules goes through the designated shared package,
  never by a direct import from one module to another.
- The modules are: `auth`, `users`, `catalogs`, `parts`, `suppliers`,
  `bookmarks`, `notifications`, `messages`, `support`, `admin`.
- A production source file SHOULD NOT exceed 500 non-empty lines. The binding
  rule is that a module has exactly one responsibility: a long file holding
  one responsibility is acceptable, and a short file holding several is not.
  The line limit is advisory: an exception MUST be recorded in the plan's
  Complexity Tracking table with its rationale and a review date, and a
  SHOULD MUST NOT be reported as a critical finding.
- Business logic MUST NOT be duplicated across modules or layers. Every
  business rule MUST have exactly one owning module, circular imports are
  prohibited, and a general-purpose utility collection MUST NOT be used to
  avoid deciding an owner.

**Rationale:** Modular Monolith combines the deployment simplicity of a
single server with the isolation of separate modules, making a future
extraction into microservices a mechanical refactor rather than a rewrite.

## Product Scope

Wafar is a single product served by three surfaces: the public site, the
merchant's authenticated area, and the administrator's separate application.
The pages below are the complete set required by the current scope. Adding a
page outside this list requires both an amendment to the Product Register
(below) and a specification that records the addition under the plan's
Complexity Tracking table.

The product's shared shell is a header, a sidebar, the footer band that carries
the links to the static pages (ADR-096), and, on a narrow screen, a bottom
navigation bar (ADR-127). It appears on the public site and the merchant's
authenticated area; the authentication pages, the 404 page, and the static
policy/FAQ/contact pages are bare, with no header, no sidebar, no bottom
navigation bar, and no footer; the administrator application carries its own
shell.
The sidebar is full on a wide screen, collapses to an icon-only rail, and becomes
a drawer on a narrow screen; it carries the platform's navigation item list and
the sidebar-collapse control, and it sits at the inline-start
edge, which the RTL direction resolves to the right edge of the page. The header
carries the platform's logo/home control at its inline-start edge and, at its
inline-end edge, the notifications control, the theme switch, and the account
control, so that the theme switch sits immediately beside the notifications
control; it carries no page-navigation link. The notifications control carries
the unread count, and no other surface carries it.
The account control opens a menu carrying «حسابي»، «إعدادات»، and «تسجيل الخروج»;
the sign-out item asks for a yes-or-no confirmation before the session ends. A
guest sees a sign-in action in place of the account control and the
notifications control. The default
appearance is not fixed by this constitution; the Wafar UI layer records it. The
theme switch itself is part of the frame.

Below 1024px the frame's fourth surface is a bottom navigation bar with five
slots: Home, Upload Catalog, a raised search action to the Parts page, My Files,
and «المزيد»; from 1024px up the bar is absent. «المزيد» opens the sidebar
drawer, which carries the nine registered destinations — Home, Parts, Catalog,
Upload Catalog, My Files, Cart, Notifications, Messages, and Profile — and the
header carries no drawer control. On that screen the footer band is not
rendered, and its four static-page links sit at the bottom of the drawer.

Every data view is a table; the only exception is the Home page, whose blocks —
the statistical cards, the destination cards, the part-family cards, and the
latest-file cards — are composed as cards. No other page composes a data view
outside a table.

### Public Site (Guest Accessible)

| Page | Content |
|---|---|
| Home | Platform name, a quick search field with suggestions over part name, part number, and original number, four statistical cards (accounts, files, parts, searches), nine destination cards — one per registered destination — and the three most recently updated catalog files with a «كل الملفات» action to the Catalog page. It carries six part-family cards — brakes, filters, batteries, cooling, engine, and suspension — each with a real count and each opening the Parts page filtered by that family (ADR-130). |
| Parts («بحث وفر») | A search field covering part name, part number, and original number (partial match), multi-select filters (car model, type, catalog file, supplier, in which no selection means every value of that filter), a price filter taking a minimum and a maximum over the primary price, a parts table showing every column at all times — part number, name, car model, original number, type, price, the supplier's name, and the cart control — pagination (20/50/100), and column sorting on every column except type; the price column renders the primary amount and, when the file prints one, the second amount with its printed label, and the filter and the sort act on the primary price only. Accepts `?file=<id>` to filter by a catalog. The price column, and any filter or sort over it, are rendered for a registered merchant only; a guest receives the same table and the same filters without them. |
| Catalog | Table of every uploaded catalog file. |
| Contact | Contact information and a form (name, phone, body) that reaches the administrator. |
| Log In | Mobile number and password. |
| Sign Up | Full name, Libyan mobile number (entered without a dial-code selector, always +218), password, city (a searchable fixed dropdown of all Libyan cities, governorates, and areas), and an optional shop name. |
| Forgot Password | Password reset via an OTP sent by SMS to the registered mobile number; a uniform response that does not reveal account existence. |
| 404 | Error page. |
| Privacy Policy | Static content. |
| Terms of Use | Static content. |
| FAQ | Frequently asked questions. |

OTP verification is REQUIRED at sign-up; sign-in of a verified account
requires no OTP.

The platform is Libyan. Every account is a Libyan mobile number on +218:
sign-up offers no dial-code selector, and a number outside +218 MUST be
rejected. The number is still stored in E.164 form. Opening registration to
another country is an amendment to this section, not a configuration change
(Product Fact Clarifications -> Libya-only registration; ADR-041).

### Merchant's Authenticated Area

| Page | Content |
|---|---|
| My Files | The merchant's uploaded files, processing status, the delete and retry actions for those files, and the way to the Upload Catalog page. |
| Upload Catalog | One supplier catalog uploaded by the merchant (Excel, PDF, or Word up to 100 MB), the merchant's monthly and active quota state, and a duplicate rejected by hash naming the original; the catalog record it creates lives with My Files. |
| Cart | Bookmarked parts, remove action. No price, no quantity, no checkout: the price lives on the part and the cart shows none of it. |
| Notifications | Full list, mark as read. |
| Messages | Single conversation thread with the administrator. |
| Profile | Edit account details, change password, end every session of the account at once. |

### Administrator's Application (Separate Login)

| Page | Content |
|---|---|
| Log In | Mobile number and password. |
| Dashboard | Statistics and reports. |
| Users | View, block, edit, set upload quota. |
| Files | Review, delete, reprocess. |
| Suppliers | Manage. |
| Parts | Edit and add manually. |
| Messages | Reply to users. |
| Notifications | Broadcast. |
| Settings | Platform settings. |
| Contact messages | Review contact-form messages. |
| Audit Log | Every administrator operation. |

### Page Flow

The following transitions are required by the product and MUST be supported:

- Home → search → Parts
- Home → Catalog (the latest-files block's «كل الملفات» action)
- Catalog → click a file → Parts (filtered by that file)
- My Files → click a file → Parts (filtered by that file)
- My Files → Upload Catalog (the way to the intake)
- Upload Catalog → My Files (the record the intake creates)
- Parts → `+` button → Cart (bookmark added)
- Parts → `?file=<id>` → Parts (filtered by that file)

### Product Features

The following features are in scope for the current MVP. Each MUST be
implemented through a specification that references this list.

| # | Feature | Summary |
|---|---|---|
| 1 | File Upload | Excel, PDF, or Word up to 100 MB. |
| 2 | Automated Extraction | From file tables. |
| 3 | Supplier and Date Extraction | From the first page of the file. |
| 4 | Column Normalisation | Across sources, including the merged and overlapping source columns some suppliers print. Every extracted value is assigned to the canonical column the Glossary fixes for a part, and the six canonical columns are the whole of a part: no description is extracted or stored. |
| 5 | Deduplication | By file, by page, by row. |
| 6 | Arabic Search | Root-aware (طرمبة → طرمبات). |
| 7 | Multi-Filter Search | Part name, part number, and original number through the search field, plus multi-select filters over car model, type, catalog file, and supplier, in which no selection means every value of that filter, and a price range. |
| 8 | Tables | Every data view. |
| 9 | Pagination | 20 / 50 / 100. |
| 10 | Column Sorting | By clicking the header, on every column of the parts table except `type`, which is free text whose alphabetical order carries no meaning. |
| 11 | Cart | Personal bookmark list. |
| 12 | Notifications | Processing results and administrative messages. |
| 13 | Messaging | Single thread with the administrator. |
| 14 | Admin Application | Full platform management. |
| 15 | Audit Log | Every administrator operation. |
| 16 | Automatic Deletion | After 90 days, counted from the catalog file's upload timestamp (ADR-131). |

## Product Register

This section is the register of the product the constitution governs. The
product's detail is `Core-Project.txt`, which mirrors this register; on conflict
this section wins. A page, a role, a feature, or a fact
absent from this register MUST NOT be built without amending it.

### Roles

| Role | Can | Cannot |
|---|---|---|
| Guest | Search, browse, filter, and view the catalog and every extracted part except its price. | Use a cart, upload, message, or see a price. |
| Merchant (registered) | Upload files, delete the files they uploaded, use the cart, see the price of every part, message the administrator, edit their own account. | Edit or delete a part, edit a price; delete the account; reach the administrator application. |
| Administrator | Operate the separate application with its own login and full platform privileges. | Be created through the public registration flow. |

Every administrator operation MUST be recorded in the audit log.

### Pages

Twenty-eight pages are in scope, and they are listed in Product Scope. The
transitions in Product Scope are the required navigation. A screen that is not
one of the twenty-eight MUST NOT be added without amending this register; Product
Scope names the rest of that route, and both halves are read together.

### Features

The sixteen product features are listed in Product Scope and MUST NOT be
restated here. Each MUST be implemented through a specification that references
that list. The product limits are the Usage Limits table in Performance Budgets
and Verification and MUST NOT be restated here either.

### Data entities

Twelve entities are in scope, and `docs/domain-model.md` is their source of truth:
it carries the relationships, the cardinality, the invariants, and the owning
module for each. This section maps them; it does not restate them, because a
field list held here would be a second source that drifts from the one.

**The one-line meaning column names a field only where the field's existence is
itself part of the product decision.** `User` does, and every field it names is
registered by that row. A phrase that describes a group — `Catalog`'s "its
metadata, its status, and its stored bytes" — registers no field identifier, so
`Catalog`'s row registers neither a byte count nor a content type, and whether
either is stored is a field-level question for `docs/domain-model.md` to carry.
The column is therefore read at the level it is written: a named field is
registered, and prose is not a field list.

| Entity | Owning module | One-line meaning |
|---|---|---|
| `User` | `users` | A registered merchant: full name, Libyan mobile number (E.164, unique, always +218), city, optional shop name, role, status (`active` or `blocked`), the consecutive failed sign-in attempt count, the sign-in lock's expiry, the requirement to change the password at first sign-in, and optional per-user upload-quota overrides (monthly and active). |
| `Supplier` | `suppliers` | The company named on a catalog's first page. |
| `Catalog` | `catalogs` | An uploaded supplier file, its metadata, its status, and its stored bytes. |
| `Part` | `parts` | One row extracted from a catalog, representing one car part. |
| `Bookmark` | `bookmarks` | One entry in a merchant's cart. |
| `Notification` | `notifications` | A processing outcome, an administrative message, or an administrator's reply delivered to a user. |
| `Conversation` | `messages` | The single thread between a merchant and the administrator. |
| `Message` | `messages` | One message inside a conversation. |
| `ContactMessage` | `support` | A message from the public contact form; its phone is for contact only, never an account identifier. |
| `AuditLog` | `admin` | The append-only record of every administrator operation. |
| `Session` | `auth` | One server-side session for an account, revocable on its own or all at once ("sign out everywhere"). |
| `PlatformSetting` | `admin` | The administrator-editable platform settings the Settings page reads and writes. |

An entity absent from this table MUST NOT be introduced without amending this
register, and an entity's shape is changed only through
`docs/domain-model.md` and an ADR.

The facts below bind across entities and are stated here because the feature
map depends on them:

- **`first_page_metadata_incomplete`** is a boolean on `Catalog`, set when the
  file's first page yields neither the supplier's name nor the issue date
  (File Processing Overview, step 4). It is a flag, never a status value.
- **Deletion is soft** for `User` and `Catalog`. A soft-deleted row is retained
  and filtered out of every read path; only the retention job and an
  administrator operation remove a row for good. Soft deletion is not a
  substitute for a cascade: deleting a catalog still withdraws its parts, their
  bookmarks, and their search-index entries. Blocking a merchant does not remove
  their public catalogs or the parts extracted from them, and blocking is not
  deletion.
- **An `AuditLog` target is namespaced** in a `type:id` form, so one target
  column is unambiguous across every module an administrator can act on. The
  `type` is the entity the action was performed on.
- **A part's price is the price of its own catalog.** A part belongs to exactly
  one catalog, so the same part offered by five suppliers is five parts in five
  catalogs, each carrying the amount or the two amounts its own file printed.
  Two parts whose original numbers are equal are the same part offered by
  different suppliers.
  The platform identifies that sameness and shows the parts side by side in one
  table, which is what a merchant comparing suppliers needs. It does not merge
  them: no equivalence entity is introduced, no row is withdrawn, and no two
  catalogs are joined by it (ADR-040).
- **The price is a registered-merchant-only projection.** Every read path a
  guest can reach projects the part without its price column and without either
  amount, through an allowlist of its own (Query Safety and Secrets). Redaction
  is a property of the projection, not a rule the presentation layer applies
  after the fact.

The entity shape beyond what `docs/domain-model.md` states is a deferred area
(Catalog data shape). Column types, constraints, and the physical schema are not
governed here at all: they are the owning module's
`packages/db/schema/<module>.ts` and the owning feature's `data-model.md`.
Schema and Migration Control governs how any shape changes.

### Unresolved product facts (binding)

The conflicts and ambiguities below were found between the sources, or inside
the sources' own data. They are recorded rather than silently resolved. The
slice named in the last column MUST resolve each one and record the answer in
the decision register (the index in `docs/DECISIONS.md` and the volume that
holds the record); until then a slice MUST NOT decide one on its own:

**A reserved decision is reserved everywhere, not only in the deciding slice.**
A source that states an answer this table has not given is itself the defect,
and the fix is a correction to that source — not an annotation of it, and not
the treating of the answer as decided. `Core-Project.txt`, `ROADMAP.md`,
`docs/domain-model.md`, `docs/capacity-model.md`, and
`Project-Technologies.txt` are therefore bound: while a row below is open, none
of them may assert the answer it reserves, in any wording, and a plan that finds
such an assertion MUST record it in its Constitution Check as a defect to
correct in the same change. A source may state the question, name the owning
slice, and restate the constraint that bounds the answer; that is not an
assertion of the answer.

| Conflict | Sources | Resolve in |
|---|---|---|
| `expires_at` is the retention deadline or the supplier's printed expiry date | Usage Limits and Product Features #16 (the 90-day period) against the Glossary (the supplier's printed expiry date) | R15 |
| Notification retention is undetermined | The product statement defers it ("to be determined later") | R9 |
| A message's sender is either a merchant or an administrator, and no source fixes how that sender is represented | Authorization and Access Control (the administrator is a separate principal with a separate login); no register row states a sender field, because a one-line meaning registers a field only where the field's existence is itself a product decision | R10 |
| The administrator's side of a `Conversation` is unrepresented, yet every administrator account sees the same single thread | `Core-Project.txt` (one administrator account type, all administrators see the same conversations); no source fixes whether that side is a reference, a role, or absent | R10 |
| How a printed price that carries more than one separator is read (for example `1.250.000`), and how a file that separates thousands rather than decimals is read | File Processing Rules (price denomination); the price examples in `Core-Project.txt`; the source files themselves | R3 |

**Resolved conflict (2026-10-03).** The sidebar conflict is resolved: the
sidebar is required on desktop and must not hide or slide (Product Scope);
`Core-Project.txt` now defines the shell including the sidebar; authentication,
404, static, and administrator pages are exempt from the shell. Recorded in
`docs/DECISIONS.md` (ADR-017).

**Resolved conflict (2026-10-03).** Support reaches the administrator through a
dedicated administrator page ("Contact messages"), not through the merchant
conversation thread and not through user-to-user chat. Recorded in
`docs/DECISIONS.md` (ADR-028).

**Resolved conflict (2026-10-03).** Home carries four statistical cards
(accounts, files, parts, searches) across Product Scope and the mirror. The
Home composition, including those cards, is fixed in Product Scope; it gained
the nine destination cards and the latest-file cards on 2026-10-27 (ADR-127).

## File Processing Overview

This section governs the shape of the ingestion pipeline. It does not govern
the extraction algorithm; see Deferred areas for the algorithm's open
questions.

Every uploaded file follows the pipeline below. The pipeline MUST be
implemented as a single sequence; a shortcut that skips a step is a defect.

1. **Upload and validation.** The user submits the file from the Upload Catalog
   page, whose way in is carried by My Files. The file is validated against the
   file-size and content-type rules, and a file that fails MUST NOT be stored
   (File Processing Rules).
2. **Content safety and storage.** The file passes, in order, magic-byte
   validation against its declared content type, a ClamAV scan, the decoded-size
   cap that rejects a zip-bomb archive, and macro stripping; a file failing any
   step MUST NOT be stored or processed (File Processing Rules). The file is
   then stored in object storage, and a content hash is computed over its bytes.
3. **Duplicate check.** The hash is compared against hashes of files already
   recorded. A match is reported to the user, the bytes step 2 stored are
   withdrawn so that no duplicate is retained, and the file is not processed
   again.
4. **First-page extraction.** The supplier's company name and the file's issue
   date are read from the first page, and any additional issue dates the first
   page prints that match the supplier's name are read with them and displayed
   with the result. A file whose first page yields neither the supplier's name
   nor the issue date is processed and marked: the catalog record carries a
   boolean `first_page_metadata_incomplete` flag. The flag is not a status
   value; the status enum below stays closed to its four values.
5. **Queue.** A job is enqueued for the worker.
6. **Worker pipeline.**
   - Extract parts from the file's tables.
   - Normalise columns to the catalog's canonical columns.
   - Deduplicate within the file: by file, by page, by row.
   - Index the parts in the search engine.
7. **Status update.** The catalog record's status is updated to `completed`
   or `failed`.
8. **Notification.** The user is notified of the outcome. A failed file
   presents a retry action.

### File Processing Rules

- A file MUST be validated against the file size and content-type rules
  before storage. A file that fails validation MUST NOT be stored.
- A duplicate file MUST be rejected with a message naming the original, stating
  the original's upload date, and carrying a link that opens it. No
  catalog is created for it, the bytes step 2 stored are withdrawn, and it MUST
  NOT be queued or processed. The duplicate check runs after storage (File
  Processing Overview, steps 2-3), so "not stored" means "not retained", not
  "never written": the upload transport puts the bytes in object storage before
  a hash exists to compare, and the check is what removes them.
- **Content safety.** Every uploaded file MUST pass, in order: magic-byte
  validation against its declared content type; ClamAV antivirus scanning; a
  decoded-size cap recorded under Constitution Mandated Values that rejects
  zip-bomb archives (Office documents are ZIP containers); and macro stripping
  before extraction. A file failing any step MUST be rejected and MUST NOT be
  stored or processed.
- **Canonical column assignment.** Every value the pipeline extracts MUST be
  assigned to the canonical column it belongs to, and the canonical set is the
  one the Glossary fixes for a part. The assignment is made by the extraction
  pipeline itself: no manual column-mapping step sits between the upload and
  the processing, and a merchant is never asked to map columns. The canonical
  set is complete for a parts table: every value in a supplier's parts table
  has its column, and a value that belongs to no canonical column is part of no
  stored column, so it is simply not stored rather than counted or flagged.
  There is no "unassigned" class of value and no counter for one. The free
  text of the `type` column is what absorbs the variety a table prints in a
  type/country cell rather than a gap waiting for a review. A merged or
  overlapping source column is a case of this rule, not an exception to it:
  its values are separated into the columns they belong to.
- **Supplier name normalisation.** A supplier name read from a first page is
  normalised before it is stored or before it is compared with another name:
  whitespace is collapsed, leading and trailing punctuation is dropped, and a
  legal-form word such as `شركة` or `مؤسسة`, or a trailing purpose word such as
  `للبيع`, is removed. Normalisation makes two spellings of one name compare
  equal. It MUST NOT merge two suppliers, and only the administrator can merge
  them.
- **Price denomination.** A part's price is the amount or amounts printed in
  its own catalog, denominated in the Libyan Dinar. The period and the comma in
  a printed price are decimal separators, not thousands separators, so `123.000`
  denotes 123 dinar. A printed price carrying more than one separator, or a file
  that separates thousands instead, is a recorded unresolved product fact owned
  by R3; no feature may settle it on its own. A parts table may print two price
  columns, or one column carrying two labelled amounts: both amounts are read
  with the column name printed above each, and at most two are stored. When a
  file prints more than two, the stored pair is the primary amount **Price**
  defines and the first of the remaining amounts in the table's reading order; a
  third amount is not stored even though it belongs to the price column, and it
  is not counted or flagged. When two printed columns carry the same label, the
  first in reading order is stored and the second is not. A printed «مصرف» and a
  printed «مصرفي» are one label and are stored as «مصرفي». A price printed in
  another currency is not converted and not stored; when the second amount is in
  another currency it is not stored either, and a part with no storable amount
  reads «بدون سعر», because a converted figure the platform cannot stand behind
  is worse than an honest gap.
- **Retry vs reprocess.** A retry re-enqueues a failed file's processing job
  over its stored bytes, without re-uploading anything. A reprocess is the
  administrator's re-run of the same pipeline over a catalog's stored bytes,
  from the admin Files page; see the Glossary. Both keep the catalog record
  and its extracted parts until the new run settles.
- Processing MUST complete within the budget stated in Performance Budgets
  and Verification.
- A failed file MUST be retryable without re-uploading the bytes.
- The catalog record's status field MUST take exactly one of: `uploaded`,
  `processing`, `completed`, `failed`. Any other value is a defect.

The sections below are binding with the same force as the principles above.
A MUST in them is resolved, reviewed, and excepted by the same procedure.

## Single-Reference Sufficiency

A feature MUST NOT need a source outside this constitution for any rule it must
obey. Every project-level source is named in References, and this constitution
carries the register of each: the repository's structure and the approved stack
in Technology Standards, the product's roles, pages, and facts in Product Scope
and Product Register, and the data model's entities and their ownership in the
Data entities table. UI values are implementation detail and live in the Wafar
UI layer, not in a constitutional register.

- Detail lives in the referenced sources; the register lives here. A rule that
  cannot be discharged without reading a referenced source MUST name that source
  where the rule is stated.
- A value a referenced source leaves open, or defers, MUST be given a binding
  value under Constitution Mandated Values by the first plan that needs it, and
  the choice MUST be recorded in the decision register as an ADR.
- A technology, component, page, feature, role, or entity that is absent
  from the registers above is not approved. Finding it in a referenced source
  does not approve it; the register MUST be amended first.
- A register is a map, not a copy: a UI value, a token, a class, a line of code,
  or a table definition MUST NOT be copied into this constitution. A register
  that duplicates its source is a drift defect, because the two copies will
  disagree. The accessibility values named in Principle IV are the only values
  restated here.
- A register row MUST name a value its source actually defines. A register that
  names a token, entity, or field the source does not contain is the same
  defect read in the other direction, and it is corrected by amending the
  register rather than by inventing the value.
- The feature templates' binding block MUST stay in step with this constitution:
  a register added here, renamed here, or renumbered here MUST be reflected there
  in the same change. The templates carry a pointer to this constitution rather
  than a copied version string, so the current version is read from the footer
  above or from `.specify/memory/version.json`, never restated.

## Query Safety and Secrets

- All queries MUST use parameterized statements. Building a statement by
  concatenating input is prohibited, including for dynamically built filters.
- The columns available for sorting, filtering, projection, and search MUST
  come from an explicit allowlist mapped to real columns, because sort and
  projection clauses cannot be parameterized.
- Every query MUST have a timeout, and any request-supplied limit MUST have a
  server-side maximum that the client cannot exceed.
- Secrets MUST NOT appear in source, logs, error messages, analytics, or
  client bundles. Secrets MUST come from a secret manager or environment
  injection only, and pre-commit plus CI scanning MUST enforce this.
- Performance budgets MUST be stated numerically in each feature's plan under
  Constitution Mandated Values and in spec Success Criteria. A budget left
  unspecified is a defect.

**Rationale:** Sort and projection parameters are the one place where a query
cannot be parameterized, and therefore the one place where injection survives a
careful review. A blank budget produces a slow product that no gate can catch.

## Schema and Migration Control

This section governs how a schema change is made. It does not govern what the
schema should contain; see Deferred areas.

- Every schema change MUST be expressed as a migration written for the single
  migration tool named under Constitution Mandated Values. A second migration
  mechanism MUST NOT be introduced, and migrations MUST NOT be applied by
  hand.
- Every migration MUST be a single reversible step with both directions
  defined, and MUST NOT combine unrelated schema changes. Two migrations that
  must be deployed together are two changes and MUST be two features or two
  plans.
- A migration MUST NOT run outside the migration runner, and the application
  MUST NOT start when its expected schema version is absent.
- A destructive change — dropping or renaming a column, narrowing a type,
  removing a constraint that existing rows rely on, or adding a uniqueness
  rule over data that already contains duplicates — MUST NOT reach
  production. It MUST be split into an expand step, a backfill whose affected
  row count is verified, and a contract step, deployed across at least two
  releases.
- Every foreign key MUST have an index on the referencing column. Every
  column used to filter, sort, or join MUST have an index once the table
  holds more rows than the volume stated in the plan's Scale/Scope.
- Every table MUST carry an immutable creation timestamp, and every table
  whose rows are user-visible MUST also carry an update timestamp.
- Table and column names MUST be lowercase snake_case and plural, MUST NOT
  collide with a reserved word, and MUST NOT be renamed after first
  deployment. A rename is a new table plus a migration of every reference
  to it.
- Uniqueness, referential integrity, and permitted value ranges MUST be
  expressed as schema constraints rather than only in application code,
  because a constraint is enforced identically in every environment and
  reported through one code path. Business rules MUST NOT be implemented as
  database triggers, generated columns, or stored procedures.
- **A tenant is a merchant account.** A tenant identifier IS the `User` identifier;
  there is no separate tenant entity, and a table that holds merchant-owned data
  MUST carry `user_id` as a foreign key to `User`, and that column MUST be part of
  every index serving a merchant-scoped query. A session belongs to one account,
  so `Session` is merchant-scoped and carries `user_id`. Tables holding
  platform-wide data that belongs to no single merchant — `Supplier`, `AuditLog`,
  `PlatformSetting` — carry no tenant identifier, and a query against them is not
  tenant-scoped. `ContactMessage` is in the same category and for the same
  reason: it is a public intake whose submitter may hold no account at all, its
  only read path is the administrator's, and no query reaches it from a merchant
  session, so a scoping column on it could never be used as a scoping key
  (ADR-053). `Part` is in the same category for a product reason rather than an
  intake one: a part is read by every merchant and by a guest through the public
  Parts table, so a merchant-scoped `parts` read would contradict Product Scope.
  `Part` therefore carries no `user_id`; the merchant scope of a part is carried
  by the `Catalog` it belongs to, and the isolation rule below does not treat the
  parts read path as a merchant-scoped path. `User` is a third case, named so the
  classification covers every entity: it is the tenant root, the row a `user_id`
  points at, so it carries no `user_id` of its own and its own row is scoped by
  its identifier rather than by a foreign key to itself (ADR-070).
- Every read and write of merchant-owned data MUST be merchant-scoped, and the
  scoping MUST be applied at a single shared entry point rather than repeated
  at each call site. A query path reachable from a merchant session MUST NOT
  be able to return rows belonging to another merchant, and that invariant MUST
  be covered by a test that fails when it is broken.

**Rationale:** A tenant scope that is missing is not a defect, it is a breach,
and a rule repeated at every call site is a rule that will be forgotten at one
of them. Destructive changes are the one schema operation that destroys data
rather than merely inconvenience, so they are the one that gets a rollback that
is actually exercised rather than merely written down.

## Identity, Authentication, and Session Policy

This section governs how a user proves who they are and how that proof is held.
It does not govern what a user is permitted to do; see Authorization and Access
Control for the distinct Guest, Merchant, and Administrator capabilities, and
Deferred areas for the permission-resolution mechanism that is not yet
ratified.

- Authentication MUST be implemented with the designated proven library.
  Custom authentication code is prohibited. The `scim` and `sso` modules of
  that library MUST NOT be enabled, due to the tracked CVEs.
- Passwords MUST be hashed with Argon2id, bcrypt, or scrypt using a cost
  factor recorded under Constitution Mandated Values. Plaintext passwords
  MUST NOT be stored, logged, cached, or included in an error message.
  Verification MUST be a review checklist item at the constitution check
  gate, and automated detection of weak hashing SHOULD exist no later than
  the first release.
- All data in transit MUST use TLS 1.2 or higher, and TLS 1.3 MUST be used
  for the browser-facing surface. Certificates MUST be managed outside
  application configuration. The transport requirement MUST be verified by
  review until a scanner is configured.
- Rate limiting MUST be applied to authentication endpoints and to any
  operation the plan identifies as resource-intensive. Limits MUST be stated
  numerically under Constitution Mandated Values. The enforcement point MUST
  exist no later than the first feature that exposes an authentication
  endpoint.
- **Account enumeration, lockout, and anti-spam.** Sign-in, registration, and
  password-recovery responses MUST NOT reveal whether an account exists. After
  five consecutive failed sign-in attempts the account MUST be locked for
  fifteen minutes. Registration and contact forms MUST be protected by a
  honeypot field, a minimum time-to-submit, and a rate limit per client
  identifier. CAPTCHA MUST NOT be used. The administrator account MUST be
  created by a seeded CLI command with a forced password change at first
  sign-in, never through the public registration flow.
- CSRF protection MUST be enabled for every state-changing request issued by
  a browser session. The configuration MUST be covered by an automated test
  no later than the first browser-facing feature.
- All user-supplied content MUST be encoded for its output context before it
  is rendered. A framework default MUST NOT be treated as satisfying this
  rule without a test that fails when the encoding is removed, and that test
  MUST exist no later than the first browser-facing feature.
- Session tokens MUST expire, MUST be revocable server-side, and MUST NOT be
  persisted in browser storage in recoverable form. Session timeout and
  token lifetime MUST be stated numerically under Constitution Mandated
  Values. Revocation MUST NOT be deferred to cache expiry alone.
- Security headers MUST be configured: a Content-Security-Policy that does
  not rely on wildcards for script sources, HSTS, X-Content-Type-Options,
  and a frame-ancestors restriction. Their presence MUST be asserted by an
  automated test no later than the first browser-facing feature.

**Rationale:** Authentication defects are cheapest to prevent before the first
request and most expensive to unwind after the first breach. Each rule names a
control a review can actually observe, because a control nobody can check is the
same as no control.

## Authorization and Access Control

- **Guest**: search, browse, filter, and view the catalog. No cart, no
  upload, no messaging. Sees every file and every extracted part.
- **Registered user (Merchant)**: uploads files, deletes files they uploaded,
  uses the cart, messages the administrator, edits their account. Does NOT
  edit or delete parts; only the administrator does.
- **Administrator**: operates a separate admin application with a separate
  login. No one becomes an administrator through the public registration
  flow. Full platform privileges.
- Every administrator operation MUST be recorded in the audit log.
- Once the authorization model is ratified, every request path MUST resolve
  the caller's permissions from that model at a single shared entry point,
  the same one Schema and Migration Control names for merchant scoping. Until
then, the first feature that implements a deferred area MUST record, per
Deferred areas, which rules in this section are still missing and when they
will be ratified.

## Performance Budgets and Verification

Query Safety and Secrets already requires that budgets be stated numerically,
and the Usage Limits table below fixes the product-level budgets. This section
adds what a stated budget is measured against. It does not repeat that
requirement.

- Every feature plan MUST state its performance budget as a latency
  percentile, not a single figure: p50 and p95 for the request path, plus
  the maximum execution time of any individual database query the feature
  introduces. A budget stated only as an average is not a budget. The budget
  belongs under Constitution Mandated Values, and this MUST be a review
  checklist item at the constitution check gate.
- **Lightweight performance budget.** Each web surface MUST carry a Lighthouse
  budget for Largest Contentful Paint, Interaction to Next Paint, and
  Cumulative Layout Shift, asserted by Lighthouse CI on at least the public
  Parts and Home pages.
- No database query introduced or modified by a feature SHOULD exceed the
  maximum stated above at p95 under the load named in the plan's Scale/Scope.
  An exception MUST name the query, the measured time, and the reason, and
  MUST be recorded in the plan's Complexity Tracking table.
- N+1 query patterns are prohibited. Every data-fetching path introduced by a
  feature MUST be inspected for N+1 behaviour before acceptance, and the
  inspection MUST be recorded in the plan. A framework or datastore that
  makes the inspection impractical MUST be named in the plan together with
  the substitute evidence that satisfies it; the framework's convenience is
  not itself a justification. The query count of a representative request
  SHOULD be asserted by an automated test no later than the first feature
  that introduces a data-fetching path.
- **Search results MUST return in under one second at p95**, the percentile the
  Usage Limits table fixes.
- **Adding to the cart MUST complete in under 200 milliseconds at p95.**
- **Processing a file (Excel, PDF, or Word, up to 100 MB) MUST complete in
  under five minutes at p95**: 95% of the files a merchant uploads finish
  inside that budget, and the remainder are visible as `processing` until they
  finish or fail.
- Filters MUST apply without a page reload.
- Pagination MUST offer 20, 50, and 100 rows per page.
- A read whose result changes less frequently than it is read SHOULD be
  cached, with the TTL and the invalidation trigger stated in the plan. A
  cache without a stated invalidation rule MUST NOT be introduced.
- Load testing MUST be performed before the first public release, and its
  results MUST be compared against the stated budgets. It MUST NOT be
  required for an internal release whose plan states its expected load
  instead.
- A measured regression above 10% against the budget of the version the
  feature branched from is a defect and MUST block release until it is
  explained in the plan's Complexity Tracking table and either fixed or
  accepted with a review date.

### Usage Limits

The following limits are binding. A feature MUST enforce each limit
server-side; a client-side check is not sufficient. Changing a limit requires
an amendment to this constitution.

| Limit | Value |
|---|---|
| Maximum file size | 100 MB |
| Typical file size | 1 – 4 MB |
| Large files (rare) | 10 – 15 MB |
| Very large files in practice (exceptional) | up to 20 MB (the binding ceiling stays 100 MB) |
| Monthly upload limit per user | 50 files per calendar month |
| Active stored files per user | 300 files |
| Lifetime upload total | none; no lifetime cap |
| Administrator-granted monthly ceiling | 500 files per calendar month, per user, exception only |
| Administrator-granted active ceiling | 1,500 files per user, exception only |
| Maximum cart size | 99 parts |
| Automatic file deletion | after 90 days, counted from the catalog file's upload timestamp (ADR-131) |
| Search latency budget | p95 < 1 s |
| Cart-add latency budget | p95 < 200 ms |
| File processing budget | p95 < 5 min |

**Quota semantics.** The monthly limit counts upload events in the calendar month;
deleting a file does not restore it. The active limit counts files whose bytes,
parts, bookmarks, and search-index entries are present; a merchant delete, an
administrator delete, or the 90-day retention job releases an active slot, and a
soft-deleted catalog row does not count. The administrator may set a per-user
monthly or active quota up to the ceilings above; the change is audited and never
deletes a file. A quota above a ceiling requires an amendment to this table. The
50-per-month and 300-active values are the defaults a user receives without an
override.

**Rationale:** A budget without a percentile and a measurement point is a number
in a document that nothing checks. These rules exist so that performance is
argued with data at acceptance rather than discovered in production.

## Dependency Governance

Project Structure and Debt Control already sets the dependency budget, and
Module Discipline and Development Workflow already requires a license check and
a vulnerability scan for a new runtime dependency. This section adds only the
update-side rules those sections do not cover.

- Dependency versions MUST be pinned, and the lockfile MUST be committed. A
  lockfile MUST be regenerated only by the dependency update process or by an
  explicit plan, never incidentally by a local install.
- The following licences MUST NOT be introduced into a module shipped to a
  merchant: GPL, AGPL, LGPL, SSPL, BUSL, Elastic Licence, and any licence
  whose terms require the disclosure, licensing, or relicensing of a
  merchant's own data or source. The test is the obligation the licence
  imposes, not the label it carries: a licence absent from that list MUST NOT
  be introduced into such a module unless the plan records the obligation it
  imposes and a reviewer has accepted that obligation. The license check
  required by Module Discipline and Development Workflow MUST report the
  licence name and that obligation, not a general approved flag, so the
  reason for a rejection stays visible.
- A dependency with a known critical or high-severity vulnerability MUST NOT
  be added. A dependency already in use with a critical vulnerability MUST
  be updated, replaced, or explicitly excepted within 30 days of the
  advisory, and the date MUST be recorded in the plan's Complexity Tracking
  table.
- An automated dependency update process — Dependabot, Renovate, or
  equivalent — MUST be configured before the first public release. Until it
  exists, the vulnerability scan in continuous integration is the only
  detection point and MUST run on every merge rather than on a schedule.

**Rationale:** The budget stops a project from growing new dependencies and does
nothing about the ones it already has. Update cadence and the license test are
the two ways a dependency base rots without a decision ever being made.

## Module Discipline and Development Workflow

- File size, single-responsibility, no-duplicated-logic, owning-module, and
  no-circular-import rules are defined once by Principle X and apply here
  without repeating.
- Every schema migration MUST include a rollback plan and MUST be backward
  compatible with the currently deployed application version, as required by
  Schema and Migration Control.
- A new runtime dependency MUST be justified by a demonstrated requirement
  recorded in the spec or plan, MUST pass a license check, and MUST pass a
  dependency vulnerability scan.
- Every MUST that names an automated check MUST state the point at which that
  check MUST exist. A MUST whose automation does not yet exist is reviewed
  manually until its stated automation date.
- Every MUST that names a value the plan MUST record names it in one place:
  the plan's Technical Context, under a `Constitution Mandated Values`
  heading. The values are: the single migration tool; the password hashing
  cost factor; the authentication rate limits; the session timeout and token
  lifetime; the dependency budget; the performance budget percentiles and
  the maximum query execution time; the Recovery Time Objective and Recovery
  Point Objective; the runtime version; the icon set;
  the extraction libraries; the transactional SMS transport; the
  continuous-integration provider; the decoded-size cap that rejects a
  zip-bomb upload; the supported-browser statement; the password policy
  parameters (the minimum length and the common-or-breached-password source);
  the one-time-code lifetime, its re-request limit, and the incorrect-entry
  bound; and the profile field maximum lengths (the full name and the shop
  name). A value written in the
  body of the plan but not
  under that heading does not satisfy the rule that names it, and a plan
  with no such heading has not discharged any of them. The list is closed: a
  MUST that names a value adds it here first, in the same change, and the
  plan template's table gains the matching row.
- The consistency gate MUST report no unresolved critical findings before
  implementation begins, and checklist items MUST be reviewed and marked
  before implementation begins.
- When continuous integration is introduced, it MUST run without network
  access by default. Any test requiring the network MUST be explicitly opted
  in, time-bounded, and isolated.
- Agent-generated code MUST satisfy the same gates as human-written code and
  MUST NOT be accepted on the basis of having been generated.

**Rationale:** Each gate exists because its absence produces a class of defect
that is expensive to detect late. Together they are the minimum that stops an
agent-driven workflow from degrading quality silently between reviews.

## Project Structure and Debt Control

- Every directory containing production code MUST have exactly one owning
  feature named in the plan that created it, and MUST NOT be written by two
  features at once. The ownership map MUST be recorded in the plan's Project
  Structure section.
- Import boundaries MUST be enforced mechanically rather than by review
  alone. The enforcement configuration MUST be committed with the codebase. A
  module MUST NOT import from a layer above it or from another feature's
  private directory.
- A presentation layer MUST NOT import a migration, a connection string, or a
  database client, and no module outside the one owning a table MAY access
  that table directly.
- Shared code MUST be promoted out of a feature only after a second consumer
  exists. Code with one consumer MUST live with that consumer.
- The count of direct runtime dependencies MUST stay at or below the budget
  recorded under Constitution Mandated Values. Exceeding the budget MUST be
  recorded in the plan's Complexity Tracking table with the rationale and the
  date by which the budget will be restored.
- An abstraction MUST NOT be introduced before a second concrete use exists,
  except where the plan names the abstraction as a boundary it is creating.
- Dead code MUST be deleted. A flag, comment, or feature toggle that
  permanently bypasses a rule in this constitution is a violation, not a
  workaround.
- Every TODO, FIXME, suppressed warning, skipped test, and known workaround
  MUST reference a tracked issue. An unreferenced marker MUST NOT be merged.
- A known defect or limitation accepted during implementation MUST be
  recorded in the plan's Complexity Tracking table with an owner and a review
  date before the change is accepted.
- A debt item that reaches its review date unresolved MUST be escalated in
  the plan's Complexity Tracking table. Debt MUST NOT be carried silently
  across more than one release.

**Rationale:** Bloat and debt do not arrive as a decision, they arrive as a
series of individually reasonable additions. The only defence that holds is a
rule that forces the cost to be written down at the moment it is incurred, and a
boundary that fails a build instead of relying on a reviewer to notice.

## Documentation

Principle V already requires Arabic user-facing text and English code and
governance text. This section covers the artifacts that make a change reviewable
after the author has moved on.

- Architecture Decision Records MUST be written for every non-trivial
  technical decision, recording the alternatives considered and why the
  chosen one won. The field reaches a technical decision — a product or
  engineering choice. A governance record, whose subject is this
  constitution's own text, a register, the process, or the governance tooling
  rather than a product or engineering choice, is not a technical decision and
  is outside the field's reach; a section is not written for such a record
  after the fact, because that would be reconstruction rather than a record
  (ADR-090). A decision whose rationale lives only in a commit message
  or a conversation is not recorded. The record MUST be committed under the
  directory that owns the decision, and the owning feature MUST be named in
  the record.

**The decision register.** The register is `docs/DECISIONS.md` (the reading
protocol and the index) together with the volumes under `docs/decisions/` that
hold the records. A new record is appended to the last volume. A non-last
volume MUST NOT exceed the byte cap the drift check carries; the last volume
MUST NOT cross that cap except by the single record that crosses it, and a
volume holding exactly one record is exempt. When the next record would cross
the cap, the next volume is opened in the same change and the index row points
to the volume that holds the record. The index MUST NOT exceed the index byte
cap the drift check carries. The values live only in the check; this paragraph
names the rule, not the number.

- The readme MUST document setup, development, testing, and deployment. A new
  contributor MUST be able to run the project locally and run its full test
  suite from the readme alone, without asking a person. This MUST be verified
  by following the readme on a clean checkout before a release.
- Every public interface MUST be documented from the same source as its
  implementation, by generation or by a test that fails when the two diverge.
  Documentation written separately from the code MUST NOT be the only record
  of a public interface. That generation or drift test MUST exist no later
  than the first feature that exposes a public interface.
- Every production module MUST carry a header naming its single
  responsibility. The owning feature is not repeated in that header: Project
  Structure and Debt Control already records it once, in the plan's ownership
  map, and a header that restates it is a second place for the same fact to
  go stale.

**Rationale:** The failure mode is not missing documentation, it is
documentation that drifts from the code while still reading as authoritative.
Each rule ties the document to something that fails when it goes stale.

## Deployment and Observability

- The project MUST have three environments: development, staging, and
  production. Staging MUST run the same application version, the same
  configuration values, and the same migration state as production. Scale is
  the only dimension on which staging is permitted to differ: dataset size,
  instance count, and provisioned throughput MAY be reduced, and no other
  difference is permitted. A configuration value or a migration state present
  in production and absent in staging is a staging-parity defect and MUST be
  recorded in the plan's Complexity Tracking table.
- No change MUST reach production without passing through staging first. A
  production change with no staging run MUST be recorded in the plan's
  Complexity Tracking table with the reason and a review date.
- A migration MUST be applied to staging and its rollback exercised there
  before the migration is needed in production, not merely written down.
- Every deployed service MUST expose a health check that verifies the
  dependencies the service actually uses, and a health check MUST NOT report
  healthy while a required dependency is unreachable.
- Logging MUST be structured, and every request MUST carry a correlation
  identifier through the log records it produces. Logs MUST NOT contain
  secrets, session tokens, or personal data, consistent with Query Safety and
  Secrets.
- Unhandled errors MUST be captured by an error tracker with enough context
  to reproduce them, before the first public release. The tracker MUST NOT be
  fed raw user input that is not already sanitized.
- Backups MUST be automated, encrypted, and restored into a clean environment
  at least once per quarter to verify they restore. A backup that has never
  been restored is untested.
- Every plan MUST state a Recovery Time Objective and a Recovery Point
  Objective numerically under Constitution Mandated Values. A plan that
  introduces persistent storage MUST state them before acceptance; a plan
  that does not is exempt.
- **Upload transport.** Large uploads MUST use presigned multipart uploads
  streamed to object storage; the API MUST NOT buffer a 100 MB file in memory.
- **Worker durability.** File-processing jobs MUST have bounded retries with
  exponential backoff, a dead-letter queue, a per-worker concurrency cap, and
  a periodic sweep that removes temporary workspace files. A job that
  exhausts retries MUST surface `failed` to the catalog and to the user with a
  retry action that does not re-upload bytes.
- **Session revocation.** Every authenticated session MUST be revocable
  server-side, including a "sign out everywhere" operation, and browser-stored
  tokens MUST be revocable on password change.
- **Anti-spam enforcement.** The honeypot, time-to-submit, and rate-limit
  controls named in Identity, Authentication, and Session Policy MUST be
  verified by automated tests. CAPTCHA MUST NOT be introduced.
- **Merchant isolation verification.** A query-path test MUST fail the build if
  any merchant-reachable path can return another merchant's rows.
- **Staging data anonymisation.** Staging MUST NOT contain production personal
  data; seeded or anonymised datasets only (pg_anonymize or an equivalent tool).
- **Monitoring and alerting.** Metrics MUST be collected for p95 request
  latency, search p95, processing success rate, and queue depth, with alerts
  when a budget is breached, using Prometheus + Grafana or an equivalent
  metrics collection stack. Structured logs MUST carry a correlation
  identifier end to end.
- **API versioning and deprecation.** Public HTTP APIs MUST be versioned in
  the path (`/api/v1`); a deprecation MUST announce removal at least one
  release ahead and MUST be recorded as an ADR.
- **Supply-chain controls.** Each build MUST produce an SBOM and run a
  vulnerability/SAST scan (Semgrep OSS or equivalent) plus a dependency
  vulnerability scan (osv-scanner or equivalent) whose failures block
  release; results are review material, not secrets.

**Rationale:** Deployment rules are the only ones with no feedback loop until
something fails, which is why they are written as staging gates and restore
exercises rather than as intentions. The RTO and RPO requirement is what turns
"we would restore" into a number a team can be held to.

## Technology Standards

This section is the register of the approved stack and the map of the
repository. `Project-Technologies.txt` is a readable mirror of this register;
where the two disagree, this section wins. The mirror carries the exact version
of each technology, the per-technology notes, and the repository trees at file
granularity; it MUST NOT introduce a technology this register does not name, and
MUST NOT restate a rule. A technology absent from this
register MUST NOT be used, except a gap listed under "Register gaps a slice MUST
close" while that section's process is followed. A technology named here MUST NOT
be substituted without an amendment to this constitution.

### Repository topology

| Path | What it is |
|---|---|
| `apps/web` | Public site and the merchant's authenticated area. |
| `apps/admin` | The administrator's separate application, with a separate login. |
| `apps/api` | The API server (Modular Monolith). |
| `apps/worker` | The file-processing worker. The only writer of the search projection. |
| `packages/shared` | Validation schemas, types, and contracts shared by frontend and backend. |
| `packages/db` | Database schema and migrations — the single migration mechanism. |
| `packages/search` | Search client and index mappings. |
| `packages/config` | ESLint, Prettier, Stylelint, and TypeScript configuration shared by every workspace. |
| `pnpm-workspace.yaml`, `turbo.json`, `package.json` | Workspace definition and task graph; versions pinned, lockfile committed. |

`docs/architecture.md` is the source of truth for layout, the API module map,
and data flow, and a plan's Ownership Map MUST match it. An application MUST NOT
be added to `apps/`, and a package MUST NOT be added to `packages/`, without an
amendment to this section. The Wafar UI layer is the one exception to the
package-row rule: its path is fixed by ADR-097 and `docs/architecture.md` under
Principle IX, it is not a row of this topology, and no other package may be
added without an amendment to this section. No feature may create a parallel UI
layer.

### Internal layout

| Concern | Fixed location |
|---|---|
| API module | `apps/api/src/modules/<module>/{routes,service,repository}` — one directory per module named in Principle X. |
| Worker | `apps/worker/src/processors/{extract-parts,normalize,deduplicate,index-parts}.ts`, `apps/worker/src/queues/file-processing.ts`. |
| Database | `packages/db/schema/<module>.ts`, `packages/db/migrations/`. |
| Search | `packages/search/client.ts`, `packages/search/mappings/`. |
| Frontend | `apps/web/app/{pages,components,composables,stores,layouts,assets}`, `apps/web/app/app.config.ts`, `apps/web/app/app.vue`; `apps/web/public/` and `apps/web/shared/` at the app root. |
| Web server routes | `apps/web/server/` — optional Nitro server routes (Nitro is part of Nuxt 4; it is named here in Internal layout and is deliberately not a row of the Approved register); created only by the feature that declares them in its Ownership Map. |
| Administrator frontend | `apps/admin/app/{pages,components,composables,stores,layouts,assets}`, `apps/admin/app/app.config.ts`, `apps/admin/app/app.vue`; `apps/admin/public/` and `apps/admin/shared/` at the app root. |
| Administrator server routes | `apps/admin/server/` — optional Nitro server routes; created only by the feature that declares them in its Ownership Map. |
| Validation | `packages/shared` only; a second local schema MUST NOT be created. |
| Database ownership | `packages/db/schema/<module>.ts` — one file per module named in Principle X; the table it declares belongs to that module. |

A feature MUST NOT create a parallel location for an artifact whose location is
fixed above. The Wafar UI layer's path is fixed by ADR-097 and
`docs/architecture.md` under Principle IX; it is not a row of this table and
this section does not create its package. A feature MUST NOT create a parallel
UI layer.

### Approved register

| Layer | Technology | Version floor or note |
|---|---|---|
| Repository | Monorepo, pnpm (with Catalogs), Turborepo | Turborepo v2; lockfile committed |
| Runtime | Node.js | pinned under Constitution Mandated Values, with an ADR recording the choice |
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4, Nuxt UI v4, Pinia, TanStack Query | TypeScript strict mode is mandatory (Principle II) |
| Backend | Hono, OpenAPI, Modular Monolith | the module list is Principle X |
| Validation | Zod | one schema set, shared by frontend and backend |
| Database | PostgreSQL 16+, Drizzle ORM, PgDog | PgDog is pre-1.0: a plan using it MUST name a fallback and a review date |
| Search | OpenSearch, the Arabic analyzer, Index State Management (ISM) | the index is a projection; ISM deletes whole indices by index age, so the per-catalog 90-day deletion, counted from the upload (ADR-131), is enforced by the retention job (R15), not by the index lifecycle alone |
| Files | SeaweedFS, BullMQ, Redis | Redis >= 5.0.0 (the BullMQ requirement) |
| Auth | better-auth | `scim` and `sso` MUST stay disabled (CVE-2026-67330, CVE-2026-80192); better-auth MUST be used with its phone-number extension, or an ADR-recorded alternative |
| Testing | Vitest, Playwright | unit and integration in Vitest, end-to-end in Playwright |
| Quality | ESLint, Prettier, Stylelint | `any` and double assertions are rejected |
| Delivery | VPS (Hetzner or equivalent), Nginx or HAProxy, Docker (optional) | Docker is used only for staging parity |
| Security | ClamAV | File-upload antivirus scan (File Processing Rules); a scanner, not a runtime dependency — exception `EX-001` in `.specify/templates/exception-register.md` |
| Quality | Lighthouse CI | LCP/INP/CLS budget assertion (Performance Budgets and Verification); a CI gate, not a runtime dependency — exception `EX-002` in `.specify/templates/exception-register.md` |
| Observability | Prometheus + Grafana | The metrics collection stack named by Deployment and Observability's monitoring rule; an operations service, not a runtime dependency — exception `EX-003` in `.specify/templates/exception-register.md` |
| Quality | Semgrep OSS | SAST scan whose failures block release (Deployment and Observability's supply-chain rule); a CI gate, not a runtime dependency — exception `EX-004` in `.specify/templates/exception-register.md` |
| Quality | osv-scanner | Dependency vulnerability scan whose failures block release (Deployment and Observability's supply-chain rule); a CI gate, not a runtime dependency — exception `EX-005` in `.specify/templates/exception-register.md` |
| Quality | pg_anonymize | Staging data anonymisation (Deployment and Observability); a staging tool, not a runtime dependency — exception `EX-006` in `.specify/templates/exception-register.md` |
| Messaging | Twilio Programmable Messaging | One-way transactional SMS only: sign-up verification, the password-recovery code, and the two security notices; `To` is always a +218 E.164 number, no inbound path, no email fallback; provider call timeout 750 ms; no floor beyond the exact lockfile pin (ADR-141) |
| Database | `pg_basebackup` + WAL archiving | PostgreSQL 16+ tooling, the database row's floor; a nightly base backup, a WAL archive interval of 60 s or less, and `pg_restore` for the drill; every archive is encrypted before it leaves the host; no third-party backup product (ADR-142) |
| Delivery | GitHub Actions | The continuous-integration provider; jobs run offline against local services and the fake SMS transport, and the dependency-install step is the only networked step; every action, first-party included, is pinned by commit SHA (ADR-143) |
| Quality | `@cyclonedx/cyclonedx-npm` | A CycloneDX JSON SBOM per build, attached to the release; Apache-2.0, build-time only and never shipped; no floor beyond the exact lockfile pin (ADR-144) |
| Quality | `@axe-core/playwright` | The automated accessibility gate, run over every page state at 320 and 1280 CSS px and supplemented by a recorded keyboard-only pass; MPL-2.0, dev-only and never shipped; no floor beyond the exact lockfile pin (ADR-145) |

The six rows from ClamAV to pg_anonymize are the named implementations of rules
the constitution already stated, and they close a register gap rather than open
one: the register named no implementation, and the technology mirror named these
six anyway. The six are not uniform in the rule they serve. Four — Prometheus +
Grafana, Semgrep OSS, osv-scanner, and pg_anonymize — implement a rule in
Deployment and Observability
whose own body says "or an equivalent"; the other two implement a rule that names
its tool directly and allows no equivalent: ClamAV is File Processing Rules'
content-safety step, and Lighthouse CI is Performance Budgets and Verification's
Lighthouse budget. Each of the six is a scanner, a CI gate, a metrics service, or
a staging tool — never imported into an application image and never shipped to a
merchant's browser — so the treatment is uniform even though the two groups are
not. Substituting a different tool for one of the four rows whose rule says "or
an equivalent" is an amendment to this register, not a local choice; substituting
one for ClamAV or Lighthouse CI is the same, because their rules name them.

The five rows from Twilio Programmable Messaging to `@axe-core/playwright` are
R1's register gaps, closed at R1's acceptance (ADR-146). Each was a pending
choice whose slice owned the record, and each carries that record: ADR-141 for
the transactional SMS transport, ADR-142 for the backup and restore tooling,
ADR-143 for the continuous-integration provider, ADR-144 for the SBOM generator,
and ADR-145 for the automated accessibility checker. The version floor is the
one R1's plan fixes and no more: `pg_basebackup` carries the database row's
PostgreSQL 16 floor, and the three npm tools and GitHub Actions fix no minimum
because the committed lockfile and the SHA-pinned actions are the versions of
record. Two of the five are build- or test-time gates — the SBOM generator and
the accessibility checker — and are never shipped; Twilio is an outbound channel
and the backup tooling runs on the database host. Substituting one of the five
is an amendment to this register, not a local choice.

The frontend row's libraries split their roles and MUST NOT overlap: Nuxt UI
v4 provides the UI components; Pinia holds client-side stores; TanStack Query
owns server-state fetching, caching, and invalidation. Server state copied
into a Pinia store, or a UI component built around a query, is a defect.

### Version-change rule

A change to the MAJOR version of a technology in this register is a substitution
and requires an amendment to this constitution. A MINOR or patch upgrade follows
Dependency Governance and MUST be recorded in the plan that performs it, even
when the automated update process performs it.

### Register gaps a slice MUST close

No technology is approved by this register yet for the following, and each is
required by a rule or by Product Scope. Where a gap's choice is one of the values
Module Discipline and Development Workflow lists in its closed Constitution
Mandated Values set, the plan MUST record it in that table; every other gap's
choice belongs in the plan's Complexity Tracking table. Either way the plan MUST
record the choice together with an ADR, a licence-obligation record, and a
vulnerability scan. The technology MUST NOT be used before that record exists.
After it exists, the owning slice may use the technology, and this register MUST
be amended to add it no later than that slice's acceptance. Until the record
exists the choice is open, and naming a specific library in this register is
prohibited, because an unvetted name would fail Dependency Governance.

Where both tables apply, the Constitution Mandated Values table is where the
value is stated, and the Complexity Tracking row is where the ADR, the licence
obligation, and the vulnerability scan are recorded; neither row is a substitute
for the other:

| Gap | Recorded in | Also in Complexity Tracking |
|---|---|---|
| Excel, PDF, and Word extraction; content-type validation | Constitution Mandated Values (extraction libraries) | Yes |
| Redis client library | Complexity Tracking | — |
| OpenSearch client library | Complexity Tracking | — |
| Arabic analyzer configuration and verification | Complexity Tracking | — |
| Error tracker | Complexity Tracking | — |
| Secret manager, plus pre-commit and CI secret scanning | Complexity Tracking | — |
| TLS certificate management | Complexity Tracking | — |
| Log pipeline | Complexity Tracking | — |
| Load-test tool | Complexity Tracking | — |

| Gap | Required by | Owning slice |
|---|---|---|
| Excel, PDF, and Word extraction; content-type validation | File Processing Overview; Usage Limits | R3 (validation: R2) |
| Error tracker | Deployment and Observability | R12 (the first deploying slice) |
| Secret manager, plus pre-commit and CI secret scanning | Query Safety and Secrets | R12 (the first deploying slice) |
| TLS certificate management | Identity, Authentication, and Session Policy | R12 (the first deploying slice) |
| Log pipeline | Deployment and Observability | R12 (the first deploying slice) |
| Redis client library | Files register row (BullMQ, Redis); Deployment and Observability's worker-durability rules | R3 |
| OpenSearch client library | Search register row; `packages/search`; the worker's index-write path (R3 indexes the parts, so R3 is the first slice to need the client) | R3 |
| Arabic analyzer configuration and verification | Principle V's root-aware search; Search register row | R5 |
| Load-test tool | Performance Budgets and Verification (load testing before the first public release) | R12 |

The seven rows R1 owned are closed, and none of them is a gap any more.
Transactional SMS, the continuous-integration provider, the automated
accessibility checker, the SBOM generator, and the backup and restore tooling are
rows of the Approved register above, each with the record that decided it
(ADR-141 to ADR-145) and the amendment that added it (ADR-146). The icon set and
the typeface are assets of the Wafar UI layer, not rows of the Approved register:
the layer records the family and the cut it consumes, ADR-098 records both
choices, ADR-137 fixes the consumed cut, and the mirror names the exact family
and cuts. This register therefore carries neither row and does not restate them.
A closed row is not reopened by a later slice: changing one of the seven is an
amendment to this section, not a fresh gap.

### Licence treatment for infrastructure services

Dependency Governance's licence prohibition applies to code shipped to, or
linked into, a merchant's browser or device. A network service consumed over a
connection (Redis, PgDog) is not shipped code; a plan using one MUST
nevertheless record the obligation its licence imposes, the operational coupling
it creates, and a review date.

## Glossary

The terms below are fixed, and a feature MUST use a term as defined rather than
a synonym for it.

**A definition states what a term is and, only where the term's own composition
is a product decision, what it is made of — never a column list.** A part's six
canonical columns and a catalog's named metadata are therefore registered by
this section, while a definition that says only "identity and shop details", as
`User` does, registers no field and defers to the Data entities table. Where a
definition and that table differ in level, neither corrects the other: the table
maps the entities and their owning modules, this section fixes the terms, and
`docs/domain-model.md` carries the fields. Naming a term's parts here is what
makes them registered, so an item absent from these definitions is not a field,
however obviously the concept belongs to the entity.

| Term | Definition |
|---|---|
| **Catalog** | An uploaded supplier file, together with its extracted parts, its processing status, and its metadata (supplier name, issue date, upload date, expiry date). A catalog is owned by the merchant who uploaded it. |
| **Part** | A single row extracted from a catalog, representing one car part. Its six canonical columns are the whole of it: part number, name, car model, original number, type, price. The car model is separated out of the name when a supplier prints it inside the name; a printed year range (for example `2018-2020`) that rides inside the name is NOT extracted into its own column and stays part of the part name, while the car model itself is still separated out; `type` is one free-text column carrying what suppliers print as a single type/country column — brand, country of origin, and manufacturing grade together — and is therefore not sortable; the price column carries one amount or two, each with the column name the supplier printed; the label is stored as part of the price cell and is not a seventh canonical value, and the primary amount is the amount the parts table sorts and filters on, fixed by the rule in **Price**. A part has no description column: it is neither extracted nor stored. A part belongs to exactly one catalog. |
| **Original number** | The supplier-independent identifier a manufacturer prints for a part, which is what tells the platform that the same part appears in two suppliers' files. It is a canonical column, is indexed, and is searched by partial match; it carries no uniqueness constraint, because suppliers repeat a number within their own file and rival suppliers print the same one. It identifies a part across catalogs and merges nothing. |
| **Canonical column** | One of the fixed columns a part is made of (see **Part**). Extraction assigns each value to a canonical column and never invents one. |
| **Price** | The amount or amounts a supplier's own file prints for a part, in Libyan Dinar, shown so a merchant can compare suppliers. A part carries one amount, or two when the file prints two price columns or one column carrying two labelled amounts; each amount carries the column name the supplier printed, and the label is stored as part of the price cell and is not a seventh canonical value. «نقدي» is payment in cash and «مصرفي» is payment by card; a printed «مصرف» is stored as «مصرفي». The **primary amount** is the amount the parts table sorts and filters on: the amount printed under «نقدي» when the file prints it, otherwise the amount printed under «قطعة», otherwise the only printed amount, otherwise the first amount in the table's reading order, which is right to left in an RTL table. The second amount is displayed only. The price belongs to the part and its catalog; it is not an offer, and the cart carries none. It renders with a decimal point and three decimal places and no thousands separator, so ten dinar reads `10.000` and fifteen dinar reads `15.000`; a label is rendered with its amount only when it is Arabic, and a part with no price reads «بدون سعر». |
| **Supplier** | The company named on the first page of an uploaded catalog, from which the parts originate, stored in its normalised form. A supplier may appear in many catalogs. Normalisation makes two spellings of one name compare equal; it does not merge two suppliers, and only the administrator merges. |
| **Cart** | A merchant's personal bookmark list of parts. It is not a purchase order. It carries no price and no quantity: the price lives on the part, and the cart shows none of it. See Principle VI. Its user-facing Arabic name is «سلة المشتريات». |
| **Bookmark** | A single entry in the cart, linking a user to a part. |
| **Notification** | A message delivered to a user in the notification list, either because a processing job completed or failed, an administrator sent an administrative message, or an administrator replied to the user's message. |
| **Conversation** | The single thread between a merchant and the administrator. A user has at most one conversation. |
| **Audit Log** | The append-only record of every administrator operation. |
| **Processing** | The automated pipeline that turns an uploaded file into extracted, indexed parts. See File Processing Overview. |
| **Deduplication** | The removal of identical parts within the same file (by file, page, row), or the rejection of a file whose content hash matches a file already uploaded. |
| **First-page metadata flag** | A boolean on a catalog record (`first_page_metadata_incomplete`), set when the file's first page yields neither the supplier's name nor the issue date. It is not a status value: the status enum stays `uploaded`, `processing`, `completed`, `failed`. |
| **Arabic Analyzer** | The search-engine component that resolves Arabic word roots and strips stop words. |
| **Guest** | A visitor who has not signed in. See Authorization and Access Control. |
| **Merchant** | A registered user who uploads catalogs. |
| **Administrator** | The operator of the platform, who uses a separate application with a separate login. |
| **User** | A registered merchant account: identity and shop details. See the Data entities table. |
| **Mobile number** | The account identifier, stored in E.164 form (+218…), normalized before comparison. |
| **Message** | One message inside a `Conversation`. See `docs/domain-model.md`. |
| **ContactMessage** | A message from the public contact form. See `docs/domain-model.md`. |
| **Deferred Area** | A decision area explicitly not governed by a principle yet. See Governance. |
| **ClamAV** | An open-source antivirus scanner used on uploaded files. |
| **ZIP bomb** | A small archive that expands to disproportionate bytes on decompression; rejected by the decoded-size cap. |
| **Macro stripping** | Removing executable document macros before extraction. |
| **DLQ** | Dead-letter queue for jobs that exhaust retries. |
| **Reprocess** | The administrator's re-run of the file-processing pipeline over a catalog's stored bytes, from the admin Files page (for example after an extraction fix). Distinct from a retry, which the merchant triggers for a failed job. |
| **Retry** | The merchant's re-enqueue of a failed file's processing job, without re-uploading the bytes. |
| **Wafar** | The platform's trade name, written «Wafar» (وفر). The Arabic form carries no diacritics, and the Latin «Wafar» carries none either. The wordmark and the page titles read «منصة وفر»; the trade name itself is «وفر». |
| **SBOM** | Software Bill of Materials produced per build. |
| **Presigned multipart upload** | Direct-to-object-storage upload in parts, avoiding buffering through the API. |
| **Merchant isolation** | A tenant is a merchant account. A merchant-reachable query path MUST NOT return another merchant's rows. |
| **Shell** | The product's shared page composition: the header, the sidebar, the footer band that carries the static-page links, and, on a narrow screen, the bottom navigation bar (ADR-096, ADR-127). It is present on the public site and the merchant's authenticated area; the authentication pages, the 404 page, and the static pages are bare, and the administrator application carries its own shell. **Frame** is an accepted synonym for this composition, not a second term: it stays in the text that already carries it (Product Scope, Product Fact Clarifications, ADR-127, and `specs/001-identity-foundation/`), and new text — a specification, a plan, a task, or a decision record — MUST use **Shell**, because a feature MUST use a term as defined rather than a synonym for it. The code that builds the composition carries the same name, `packages/ui/app/components/shell/` and `apps/web/app/layouts/shell.vue`, so the term and the tree agree (ADR-148). |
| **Wafar UI layer** | The project's single interface layer at `packages/ui`: the design tokens, the theme configuration, the icon set, the Arabic typeface, and the shared primitives every interface consumes. Its path is fixed by ADR-097; it is not a row of the Technology Standards topology, and no parallel layer or token file outside it may be created (Principle IX). |
| **Token** | A named UI value — a colour, a type size, a spacing, a radius, a shadow, or a duration — recorded once by the Wafar UI layer and consumed by name. A raw value outside the layer is not a token, and a token file outside the layer is prohibited (Principle IX, ADR-128). |
| **Technical Context** | The per-feature block in `plan.md` that records the stack, version pins, and constraints for this feature. |
| **Complexity Tracking** | The per-plan table that records justified deviations from a binding rule, each with an owner and a review date. |
| **Ownership Map** | The per-plan table that assigns every file, route, migration, and test to the plan that introduces it. |
| **Constitution Mandated Values** | The closed list of cross-slice values (tools, libraries, pins, limits) a feature plan MUST record before it is drafted. |
| **Success Criteria** | The per-spec testable outcomes a feature promises, including its performance budgets. |
| **Scale/Scope** | The per-feature row stating the target volume, concurrency, and user counts the plan assumes rather than guessing. |
| **Test Coverage Request** | The per-spec section declaring which tests the feature requests and the coverage target the coverage gate asserts. |

## References

| Document | Purpose | Location |
|---|---|---|
| `Project-Technologies.txt` | The technology register's detail: exact versions, per-technology notes, and the repository trees. Mirrors Technology Standards, which wins on conflict. | Repository root. |
| `docs/CHANGELOG-mirror.md` | The mirror's historical "Constitution X additions" blocks, split out of `Project-Technologies.txt` (ADR-075). History, not a source of rules. | `docs/`. |
| `Core-Project.txt` | The product's detail: pages, roles, and the acceptance criteria the product already states. Mirrors Product Register and Product Scope, which win on conflict. | Repository root. |
| `docs/domain-model.md` | The data model's source of truth: entities, relationships, cardinality, invariants, and the owning module of each. Mirrors the Data entities table, which holds the map. | `docs/`. |
| `docs/DECISIONS.md` | The decision register's index and reading protocol: the entry point to the ADR volumes under `docs/decisions/` (ADR-125). | `docs/`. |
| `docs/architecture.md` | The repository layout, module map, and data-flow descriptions. | `docs/`. |
| `docs/capacity-model.md` | The capacity and load envelope: the six-month plan, the ingestion envelope, and the starting point a plan's Scale/Scope records. The planning authority for the envelope only; this constitution wins on every conflict (ADR-117, ADR-119, ADR-121, ADR-122). | `docs/`. |
| `docs/pdf-sample-analysis.md` | The measured sample evidence behind the capacity model's baseline (the 19-file sample of 2026-10-23). Evidence, not a source of rules (ADR-119, ADR-122). | `docs/`. |
| `docs/design/` | The design contract's reference evidence: the slice map for the seventeen slices and twenty-eight pages, and the reference screenshots it names. Reference, not a visual baseline; the contract is ADR-128, the conformance gate is ADR-129, and the appearance authority is ADR-137. Evidence, not a source of rules (ADR-128, ADR-129, ADR-137). | `docs/`. |
| `.specify/templates/exception-register.md` | The exception register required by Governance. | `.specify/templates/`. |
| `.specify/templates/overrides/` | Template overrides required by Single-Reference Sufficiency and by Governance. | `.specify/templates/overrides/`. |
| `.specify/memory/constitution.md` | This document. | `.specify/memory/`. |
| `.specify/memory/version.json` | The machine-readable constitution version, whose `constitution_version` field MUST equal the footer's (Governance → amendment procedure). | `.specify/memory/`. |
| `ROADMAP.md` | The MVP slice order. Names and orders slices; does not design them. | Repository root. |
| `AGENTS.md` | Operating instructions for agent assistants. | Repository root. |
| `.specify/extensions.yml` | The installed extensions and the hook registry every Spec Kit command reads before and after it runs. | `.specify/`. |
| `.specify/workflows/speckit/workflow.yml` | The bundled workflow that runs the binding cycle in order, with its human review gates. | `.specify/workflows/speckit/`. |
| `README.md` | The contributor entry point: documentation map, workflow, and prerequisites. | Repository root. |
| `governance-drift-check.mjs` | The committed read-only drift check (ADR-071, ADR-072, ADR-073, ADR-074, ADR-075, ADR-080, ADR-082, ADR-083, ADR-086, ADR-088, ADR-092, ADR-093, ADR-096, ADR-097, ADR-098, ADR-099, ADR-100, ADR-101, ADR-102, ADR-103, ADR-104, ADR-105, ADR-106, ADR-125, ADR-133, ADR-136, ADR-140): the two version sources including the amended date, every live ADR range string (in the required files, in the top-level `docs/` files, in the two Arabic mirrors, in the template overrides, and in the feature specifications), every ADR index row's anchor against its heading in the volume that holds it and every heading against the index, every volume's ADR continuity and the volume and index size caps (ADR-125), every `ADR-NNN` reference against the index, the ADR list in `Project-Technologies.txt`'s header and its contiguity, every ADR enumeration in the governance set against the canonical one the check's own header carries, the upstream manifest hashes in both directions, the two integrations' byte-identity (their command directories, and each integration manifest against the tree it records and that integration's whole command directory), the integration topology across `integration.json`, `init-options.json`, the integration directories and the bundled workflow's nesting, the structural counts the governance text states in prose, the Constitution Mandated Values count the plan template states, every entity's owning module in `docs/domain-model.md` against the Data entities table above, the design evidence's registration and citation, the template load map, the ADR index's constitution-version column against the footer's version, and the absence of the removed stylesheet and its constitution section. Read-only and dependency-free; exits non-zero on drift, and runs on commit through the committed `pre-commit` hook. | Repository root. |

## Artifact Workflow and Traceability

These rules govern the shape of the Spec Kit artifacts. They are binding with
the same force as the principles above.

- Every specification MUST use stable identifiers: `FR-###`, `AC-###`, and
  `SC-###`. Identifiers MUST NOT be renumbered or reused; an item is withdrawn
  only by keeping its identifier and marking it withdrawn.
- A specification MUST carry at most three unresolved `NEEDS CLARIFICATION`
  items. More than three means the feature is not ready for planning.
- Tests, when requested by the specification's Test Coverage Request, MUST be
  written before implementation and MUST fail before implementation changes.
- Every task MUST end with `(implements FR-###, AC-###)`, or, when no
  requirement genuinely applies, `(implements Complexity Tracking: <row>)`.
  A convergence task appended by `/speckit.converge` carries its traceability in
  that command's own form, `per <source-ref> (<gap-type>)` (for example
  `per FR-003 (missing)`, `per US1/AC2 (partial)`, `per Constitution II
  (contradicts)`), which names the same identifiers and satisfies this rule for a
  task that repairs an existing obligation rather than introducing one.
- Every task MUST end in a commit; commits MUST reference the spec, plan, and
  task identifiers.
- `plan.md` Constitution Check MUST be evaluated before Phase 0 and
  re-evaluated after Phase 1 design.
- `/speckit.analyze` runs the consistency gate after `/speckit.tasks` and before implementation begins — by the engine workflow or by hand; its findings MUST be resolved before
  `/speckit.implement` starts (see Module Discipline and Development Workflow).
- `/speckit.implement` and `/speckit.converge` MUST repeat until Converged; a
  feature reports Converged only when converge reports Converged.
- The binding cycle runs in full order: specify → clarify → plan → checklist
  → tasks → analyze → implement → converge, repeated (implement ↔ converge)
  until converge reports Converged.
- Every ADR first named by a plan MUST be reaffirmed in that plan's
  Constitution Check.
- All artifacts and tools that read or write them MUST use UTF-8. A file that merely decodes as UTF-8 but was written after a UTF-8-as-Windows-1252 mis-encoding (mojibake) is a defect of the same kind: decodability does not prove the characters are correct, and Arabic content MUST be visually verified legible.
- Every search index MUST have exactly one mapping owner.
- Every sub-spec MUST begin with `**Input**: Parent roadmap: ROADMAP.md → R#`.

## Product Fact Clarifications

- Contact form fields are exactly `name`, `phone`, and `body`.
- The platform's trade name is «Wafar» (وفر); the Arabic form carries no
  diacritics, and the Latin «Wafar» carries none.
- "Reports" means the statistics and summaries the administrator Dashboard
  shows over entities already in scope. Advanced reports
  (تقارير متقدمة) are out of scope until specified.
- The cart page's Arabic name is «سلة المشتريات». It is a personal bookmark
  list only: it carries no price, no quantity, and no checkout state, even
  though the label is a purchase metaphor the product scope does not honour.
- **No emoji in anything a person reads.** See Principle V. Every screen of the
  public site, the merchant area, and the administrator application, and the
  body of every SMS the platform sends. Governance documents, code identifiers,
  and code comments are not covered.
- **Libya-only registration.** Every account is a Libyan mobile number on +218.
  Sign-up carries no dial-code selector, and a number outside +218 is rejected.
  The number is stored in E.164 form, and the account's city comes from the
  Libyan city list.
- **The price is in Libyan Dinar, and its separator is decimal.** `123.000` is
  123 dinar, not 123,000. The price is the amount or amounts printed in the
  part's own catalog, shown for comparison; it is not an offer, and it never
  enters the cart.
- **Registered merchants see the price; guests do not.** The price column and
  any filter or sort over it are rendered for a registered merchant only, and a
  guest's read path projects the part without them. A part with no price reads
  «بدون سعر»; a price in another currency is never converted and never stored.
- **A part may print two prices, and both are shown.** The column keeps one
  header that names the denomination once — «السعر (د.ل)» — and no cell repeats
  a currency; its cell renders the primary amount and, when the file prints one,
  the second amount, each with the label the supplier printed. The filter and
  the sort act on the primary price only, as **Price** defines it. A guest
  receives neither amount.
- **The parts table shows every column, and hides none.** Part number, name, car
  model, original number, type, price, the supplier's name, and the cart
  control. Every column is sortable except `type`. Part name, part number, and
  original number are searched through the search field rather than chosen from
  a list, because a list of every name or part number in the platform is the
  size of the table itself; every other filter is a multi-select over its
  distinct values.
- No email address exists anywhere in the platform: no sign-up email, no
  login email, no transactional email. The mobile number in E.164 form is
  the sole account identifier.
- The platform is free to merchants: uploading and searching MUST NOT charge
  the merchant.
- When the cart reaches 99 parts, the user MUST be shown a full-cart notice.
- A message sent by a merchant is visible to the sender immediately; the
  administrator's reply is visible after a page refresh unless a live-update
  mechanism has been specified.
- CAPTCHA MUST NOT be introduced; anti-abuse for every public form is
  honeypot fields, a minimum time-to-submit, and a rate limit.
- A PWA (installable app, service worker, offline surface) MUST NOT be
  shipped. The platform is a browser catalog only.
- The shared shell's header MUST carry the platform's logo/home control at its
  inline-start edge and, at its inline-end edge, the notifications control, the
  theme switch, and the account control, so that the theme switch sits
  immediately beside the notifications control, and it MUST carry no
  page-navigation link. The notifications control MUST carry the unread count,
  and no other surface MUST carry it. The account control MUST open a menu
  carrying «حسابي»، «إعدادات»، and «تسجيل الخروج»; «تسجيل الخروج» MUST show a
  yes-or-no confirmation before the session ends. A guest MUST see a login
  action in place of the account control and the notifications control, and MUST
  keep the theme switch. The sidebar-collapse control sits in the sidebar, not
  the header; it narrows the sidebar to its icon rail on desktop and closes the
  drawer on mobile, which «المزيد» opens; the sidebar itself sits at the
  inline-start edge (the right edge under the RTL direction), and the navigation
  item list and that control both sit inside it. The platform logo sits at the
  header's inline-start edge, and the quick search field lives on the Home page
  (see Product Scope). Pages without the product's shared shell —
  authentication, 404, and static pages — carry no header; the administrator
  application carries its own shell and header, and that header carries the
  platform's logo and an account control whose menu offers sign-out only,
  because the administrator application has no profile page and no merchant
  settings page. The four bare-layout static
  pages — Contact, Privacy Policy, Terms of Use, and FAQ — are reached the same
  way: by a direct link or by an action on a page that carries one, and none of
  them is a sidebar item. The surface that carries those links is the footer band
  inside the frame (ADR-096). On a narrow screen the band is not rendered, and
  the same four links sit at the bottom of the drawer. The reachability
  requirement is binding, and an in-scope static page that no in-scope page
  links to is a defect.
- Every data table's default order is newest first, taken from the record's
  immutable creation timestamp (Schema and Migration Control). Any other order
  beyond the table's own sortable columns is a deferred area (Retrieval
  interface), owned by R5.
- A data table's page size defaults to 20 rows, and its control offers 20, 50,
  and 100; changing the page size returns to the first page (ADR-137).
- The Libyan city list is one dataset, named once. Sign Up selects from it:
  every Libyan governorate, city, and area, searchable, with Libya (+218) as
  the default country. R1 records the list once as reference data of the
  `users` module and names the record in the decision register; every later
  slice reads that record instead of writing a list of its own, and changing
  the list is an amendment to that record rather than an edit made inside a
  feature.

## Governance

**Authority.** This constitution supersedes ad-hoc convention and any other
written project instruction where they conflict. Precedence is: this
constitution, then agent instruction files, then the readme, then any other
guidance. Every principle and every MUST in the sections above is binding with
the same force, and is resolved, reviewed, and excepted by exactly the same
procedure. That procedure is the one every binding section above shares, and
it is named in this paragraph rather than restated by each section: Query
Safety and Secrets, Schema and Migration Control,
Identity, Authentication, and Session Policy, Authorization and Access Control,
Performance Budgets and Verification, Dependency Governance, Module Discipline
and Development Workflow, Project Structure and Debt Control, Documentation,
Deployment and Observability, Technology Standards,
Glossary, Product Scope, Product Register, Single-Reference Sufficiency, File
Processing Overview, Artifact Workflow and Traceability, and Product Fact
Clarifications. The adjudication spans all ten principles as well — I.
Evident, Traceable Change; II. Strict Type Safety; III. Measured Test
Coverage; IV. Accessible User Interfaces; V. Arabic-First and RTL Interfaces;
VI. Catalog-Only Scope; VII. Specification-First and Documentation
Separation; VIII. User Story Independence; IX. UI Foundation Fidelity; X.
Modular Monolith Architecture — and every binding section named above. A SHOULD
is advisory and MUST NOT
be reported as a critical
finding; an unmet SHOULD MUST still be recorded in the plan's Complexity
Tracking table with its reason.

Binding status is a statement about the cost of a deviation, not about when
its automation exists: a rule that names an automated check the repository
does not yet have remains binding and is reviewed manually until the
milestone it states, as Module Discipline and Development Workflow requires.

Governance's own MUSTs — the amendment procedure, the versioning policy, the
exception register, and the review trigger — bind this document rather than a
feature. A plan cannot comply with or breach them by changing its own
content, so they are not evaluated by a feature's Constitution Check gate.
They are discharged by the amendment process and by the review trigger below,
and an unmet Governance MUST is escalated as an amendment, never recorded as
a plan violation.

The planning phase MUST evaluate its constitution check gate against every
binding rule above other than Governance's own, and MUST record justified
violations in the plan's Complexity Tracking table. The consistency gate
treats a conflict with a binding rule as critical; violations are resolved by
changing the specification, plan, or tasks, never by diluting or
reinterpreting a rule. A rule that must change is amended here first, as a
separate and explicit change.

**Amendment procedure.** An amendment requires a written proposal stating the
rationale, the affected principles, and the impact on features already in
flight. The amendment MUST be explicitly ratified, MUST bump the version per
the policy below, and MUST record the change durably. The sync impact report the
constitution command produces is review material for the person ratifying the
amendment: it MUST NOT be committed, because it describes the document rather
than governing it, and it restates MUSTs the document already states. The
durable record of an amendment is an entry in the decision register — the index
row in `docs/DECISIONS.md` and the ADR in the volume that holds it — naming the
version, what changed, and what deliberately did not.

On every amendment the version lives in exactly three places, which MUST agree,
and the amendment is recorded once:

1. `.specify/memory/constitution.md` — the version footer, the human-readable
   authority for the current version.
2. `.specify/memory/version.json` — the machine-readable value, whose
   `constitution_version` field MUST equal the footer's version.
3. the decision register — the ADR index row in `docs/DECISIONS.md` and the ADR
   in the volume that holds it, which are the durable record of what changed.
   The index row's constitution version column names the version this ADR
   produced, so the version is recorded in that column as well as in the two
   sources above.

This paragraph is the single authority for those sources; no other document may
restate them, and a document that carries a copy is corrected from here rather
than edited in its own words.

A document that needs to name the governing constitution names
`.specify/memory/constitution.md` and reads the version from one of the two
version sources above; it MUST NOT hard-code a version string of its own,
because a copied version is a second source that drifts from the first. The
feature templates' binding blocks, `docs/architecture.md`, `docs/domain-model.md`,
`ROADMAP.md`, and `Project-Technologies.txt` therefore carry a pointer rather
than a literal version.

A stamp site that does not exist yet is not a gap; when one is added it enters
this list in the same change that creates it.

The constitution command edits only this document, so `version.json` is moved
by the amendment's own change rather than by that command, and an amendment that
leaves it behind is incomplete. Precedence decides the overlap: where a
command's scope guard and this paragraph conflict, this paragraph wins, because
Governance opens by superseding any other written project instruction.

A MAJOR amendment MUST additionally include a migration or backfill plan for
artifacts produced under the previous version.

**Versioning policy.** MAJOR for a backward-incompatible governance change or
the removal or redefinition of a principle. MINOR for a new principle or
section, or a material expansion of guidance. PATCH for clarifications,
wording, and non-semantic refinements.

**Compliance review.** Every review MUST verify compliance with these
principles. Every deviation MUST be justified within the change itself, and
MUST be recorded in the plan's Complexity Tracking table when the deviation
belongs to a plan. An unjustified violation MUST be resolved before the
change is accepted. Compliance of in-flight features MUST be re-evaluated
whenever a MAJOR amendment lands.

**Exception register.** Every exception MUST be recorded with the principle,
the exact scope, the rationale, the approver, and a review date. An exception
without a review date is an undocumented violation, not an exception. The
register MUST NOT be satisfied by a comment in code. The register is
maintained at `.specify/templates/exception-register.md`. Unless an amendment
names another, the approver is the repository owner.

**Review trigger.** This constitution MUST be reviewed whenever a project-wide
engineering principle changes, at minimum once per quarter while the project
is in active development, and whenever a new subsystem reaches implementation.

### Deferred areas

The following aspects are deliberately not governed by
principles specific to them, because those decisions are not yet made. A
deferred aspect remains governed by every principle above that does not name
the deferred decision, in particular by Query Safety and Secrets and by
Schema and Migration Control:

- **Extraction algorithm**: how parts are identified within supplier document
  tables, how a source column is recognised as one canonical column, and how
  extraction correctness is verified. The canonical columns themselves are fixed
  by the Glossary, so the algorithm chooses among fixed targets rather than
  inventing them, and File Processing Rules binds what it may do with a value it
  cannot place.
- **Catalog data shape**: discharged in 2.18.0. The Glossary now fixes a part's
  canonical columns and the role of the original number, and `docs/domain-model.md`
  states the invariants over them. What remains is not deferred product scope but
  the shape below the product: column types, lengths, nullability, defaults, and
  indexes, which are the owning module's schema file and the owning feature's
  `data-model.md`, plus whether a part persists the page and row it came from,
  which is a recorded unresolved fact owned by R3.
- **File ingestion internals**: the exact rules for content-type validation,
  the object-storage layout, and the isolation between one merchant's files
  and another's.
- **Authorization model**: the granularity of permissions within each role,
  the session policy beyond the rules in Identity, Authentication, and
  Session Policy, and the mechanism by which permissions are resolved.
- **Retrieval interface**: the exact search ranking, the ordering of results
  beyond the sortable columns, and the presentation of parts in the table
  beyond the columns listed in Product Scope.

The first feature that implements a deferred area MUST record, in its plan's
Constitution Check, which principles are still missing for that area and how
they will be ratified. That ratification MUST land no later than the feature's
acceptance, and never after the area is in production. A feature is not
blocked by the absence of those principles, and it MUST NOT invent principles
in place of them or leave the gap unrecorded.

---

**Version**: 6.3.2 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-11-04
