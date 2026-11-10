# Architecture — Wafar

This document records the repository layout, the API module map, and the data
flow. Its sources of authority are `.specify/memory/constitution.md` (current version: its footer or `.specify/memory/version.json`),
whose Technology Standards section is the register, and
`Project-Technologies.txt`; where this document and the constitution disagree,
the constitution wins. The data model's entities and their owning modules are
stated in `docs/domain-model.md`, which this document does not restate.

**Status**: baseline for a repository where production code does not exist yet.
Directories are created by the first feature that owns them, or by R1's
foundation phase for the workspace and the layer; the phrase "pre-R1 foundation"
is retired (ADR-139). Every directory holding production code is registered in
that plan's Project Structure > Ownership Map (Project Structure and Debt
Control).

## 1. Repository layout (Monorepo)

```text
wafar/
├── apps/
│   ├── web/              # Public site + merchant's authenticated area (Nuxt 4); app/ source, server/, shared/, public/; layouts: shell vs bare (auth, 404, static, and contact pages); the admin app carries its own independent shell
│   ├── admin/            # Administrator's separate application, separate login (Nuxt 4); app/ source, server/, shared/, public/
│   ├── api/              # The API server (Hono, Modular Monolith)
│   └── worker/           # File-processing worker (BullMQ processors)
├── packages/
│   ├── shared/           # Validation schemas + types + contracts (Zod) shared by frontend and backend
│   ├── db/               # Database schema + migrations (Drizzle), single migration mechanism
│   ├── search/           # Search client + index mappings (OpenSearch)
│   ├── ui/               # Wafar UI layer: tokens, theme, IconPark icons, IBM Plex Sans Arabic, IBM Plex Mono, shared primitives (ADR-097, ADR-098, ADR-128)
│   └── config/           # ESLint + Stylelint + Prettier + TypeScript shared configuration
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Binding rules that shape this layout:

- **Monorepo tooling**: pnpm with Turborepo (Technology Standards); shared
  configuration lives in `packages/config`, pinned versions with a committed
  lockfile (Dependency Governance).
- **Shared validation schemas**: frontend and backend use the same schemas
  from `packages/shared`, so the two contracts cannot drift (Principle II).
- **Import boundaries**: enforced mechanically, not by review alone; a module
  MUST NOT import from a layer above it or from another feature's private
  directory; a presentation layer MUST NOT import migrations, connection
  strings, or a database client (Project Structure and Debt Control).
- **Promotion rule**: code is promoted into a shared package only after a
  second consumer exists.

### 1.1 Internal layout

The top-level tree above is the topology. The paths **inside** each workspace
are fixed too, and a plan's Ownership Map MUST record them from this table
rather than inventing them. The register these paths come from is
`.specify/memory/constitution.md` → Technology Standards → Internal layout;
where the two disagree, the constitution wins and this table is corrected,
except for the Wafar UI layer path fixed by ADR-097 and recorded here under
Principle IX (ADR-093 keeps that path out of the constitution's package rows).

| Concern | Fixed location |
|---|---|
| API module | `apps/api/src/modules/<module>/{routes,service,repository}` — one directory per module named in Principle X |
| Worker processors | `apps/worker/src/processors/{extract-parts,normalize,deduplicate,index-parts}.ts` |
| Worker queue | `apps/worker/src/queues/file-processing.ts` |
| Database | `packages/db/schema/<module>.ts`, `packages/db/migrations/` |
| Search | `packages/search/client.ts`, `packages/search/mappings/` |
| Frontend | `apps/web/app/{pages,components,composables,stores,layouts,assets}`, `apps/web/app/app.config.ts`, `apps/web/app/app.vue`; `apps/web/public/` and `apps/web/shared/` at the app root |
| Web server routes | `apps/web/server/` — optional Nitro server routes (Nitro is part of Nuxt 4 and is deliberately not a row of the Approved register); created only by the feature that declares them in its Ownership Map |
| Administrator frontend | `apps/admin/app/{pages,components,composables,stores,layouts,assets}`, `apps/admin/app/app.config.ts`, `apps/admin/app/app.vue`; `apps/admin/public/` and `apps/admin/shared/` at the app root |
| Administrator server routes | `apps/admin/server/` — optional Nitro server routes; created only by the feature that declares them in its Ownership Map |
| Wafar UI layer | `packages/ui/{app/components,app/composables,app/plugins,app/utils,app/assets,app/app.config.ts,nuxt.config.ts}` — fixed by ADR-097 under Principle IX; not a row of the constitution's Internal layout (ADR-093). `app/plugins/` holds a provider only when both frontends need it; `apps/web` installs the TanStack Query provider from there (T268) |
| Validation | `packages/shared` only; a second local schema MUST NOT be created |
| Database ownership | `packages/db/schema/<module>.ts` — one file per module named in Principle X; the table it declares belongs to that module |

A feature MUST NOT create a parallel location for an artifact whose location
is fixed above. The Wafar UI layer is the one path fixed here under Principle IX
by ADR-097; it is not a row of the constitution's Internal layout (ADR-093), and
this table is where a plan's Ownership Map reads it. No feature may create a
parallel UI layer.

## 2. Module map — `apps/api`

`apps/api` is a single deployable server divided into modules (Principle X).
Each module has its own `routes`, `service`, and `repository`. Communication
between modules goes through the owning module's service, exposed via the
shared package — never through a direct import from one module to another.

| Module | Baseline responsibility | Notes |
|---|---|---|
| `auth` | Sign-up, sign-in/out, password recovery, sessions. | Implemented with the designated proven library with `scim` and `sso` disabled (Identity, Authentication, and Session Policy). Password hashing, session timeout, and auth rate limits are recorded per plan in Constitution Mandated Values. Sign-in, registration, and password-recovery responses never reveal whether an account exists; after five consecutive failed sign-in attempts the account locks for fifteen minutes. Every session is revocable server-side, including a "sign out everywhere" operation, and browser-stored tokens are revocable on password change. Registration and contact forms are protected by a honeypot field, a minimum time-to-submit, and a per-client rate limit; CAPTCHA is never used. The administrator account is created by a seeded CLI command with a forced password change at first sign-in. `auth` owns the `Session` entity — the server-side, revocable session store — while the account's identity and profile belong to `users` (ADR-067). |
| `users` | Merchant accounts and profile data; account edits; optional per-user upload-quota overrides. | Only the account's owner edits the profile; the administrator sets a quota override through the admin surface, and every change is audited. No user may delete an account (roles: see Product Register in `.specify/memory/constitution.md`). |
| `catalogs` | Uploaded supplier files: metadata (supplier name, issue date, upload date, expiry date), processing status, the `first_page_metadata_incomplete` flag, retention, and the pointer to the stored bytes. | Status is exactly one of `uploaded`, `processing`, `completed`, `failed`; `first_page_metadata_incomplete` is a boolean flag and never a fifth status; automatic deletion after 90 days; duplicates rejected by content hash (File Processing Overview). |
| `parts` | Extracted part rows: the six canonical columns the constitution's Glossary fixes for a part (`Glossary` → `Part`), including the amount or the two amounts its own catalog printed. The parts table additionally shows the supplier's name, which is read through the `suppliers` module and is not a part column. A part also carries `family`, a derived classification over six fixed values that R3 fills and the Home cards count (ADR-130); it is neither a canonical column nor an extracted value. | A part belongs to exactly one catalog; merchants cannot edit or delete parts, and cannot edit a price — the administrator does, and edits either amount (Authorization and Access Control). The price is per catalog, in Libyan Dinar; the price column carries one amount or two, the primary amount is the sort and filter key, and every guest-reachable read path projects the part without its price column and without either amount. |
| `suppliers` | The supplier named on a catalog's first page, stored in its normalised form, and its associations to catalogs. | One supplier may appear in many catalogs. Normalisation makes two spellings of one name compare equal; it merges nothing, and only the administrator merges (Glossary, File Processing Rules). |
| `bookmarks` | The "cart": a merchant's personal bookmark list of parts. | Carries no price, no quantity, and no checkout state; maximum 99 parts; capacity is enforced server-side (Principle VI, Usage Limits). |
| `notifications` | Processing-completed/failed notices, administrative messages, and an administrator's reply to a merchant message; read state. | Failed processing presents a retry action. |
| `messages` | The conversation thread between a merchant and the administrator: a user has at most one (Product Register). Whether it carries an administrator reference, and whether every administrator account reads the same thread, is unresolved fact #2 in `docs/domain-model.md`, owned by R10 — never user-to-user. | Direct user-to-user messaging is prohibited (Principle VI). |
| `support` | Support content and assistance flows: FAQ, privacy policy, terms of use; contact intake that reaches the administrator. | Public pages from Product Scope. |
| `admin` | Administrator operations: users (view/block/edit/set upload quota), files (review/delete/reprocess), suppliers, parts (edit/add), message replies, broadcasts, settings, contact messages. | Every administrator operation is recorded in the append-only audit log (Authorization and Access Control). The administrator is a `User` holding the administrator role. The Settings page reads and writes `PlatformSetting`, owned by `admin` (ADR-067); it never carries a Usage Limit. The module is created by R11 for the public Contact page's read of `PlatformSetting` (its schema and its public read projection), and R13, R16 and R17 extend it with the administrator's write surface and the remaining operations (ADR-077, annotated by ADR-140). |

Cross-cutting rules for every module:

- Exactly one responsibility per module; business rules MUST NOT be duplicated
  across modules or layers, and circular imports are prohibited.
- Every table is owned by exactly one module; no module outside the owner may
  read or write that table directly.
- Every read and write of merchant-owned data is merchant-scoped at a single
  shared entry point - the same entry point the authorization model will use
  to resolve permissions once ratified (Schema and Migration Control;
  Authorization and Access Control). A tenant is a merchant account: the
  scoping column is `user_id`, there is no separate tenant entity, and
  platform-wide tables carry no such column. The merchant-scoped tables are
  exactly `Catalog`, `Bookmark`, `Notification`, `Conversation`, `Message`, and
  `Session`; `Supplier`, `AuditLog`, `ContactMessage`, `PlatformSetting`, and
  `Part` carry no `user_id` — a part is read globally through the public Parts
  table, so its merchant scope is carried by its `Catalog` and the parts read
  path is not merchant-scoped; `User` is the tenant root, the row `user_id`
  references, so it is neither scoped nor platform-wide (ADR-070). The
  authorization model is a deferred area: the first feature that implements it
  records the missing rules and their ratification in its plan.
- Soft deletion applies to users and catalogs: soft-deleted rows are retained
  with their timestamp and every read path filters them out; deleting a
  catalog also withdraws its parts, bookmarks, and search-index entries,
  while blocking changes nothing in storage (`docs/domain-model.md` → Soft
  deletion).
- A production source file SHOULD NOT exceed 500 non-empty lines; a module
  has one responsibility, and the count does not replace that rule.

## 3. Data flow

The canonical chain is **web → api → PostgreSQL for the system of record; large file bytes go web → SeaweedFS directly (presigned multipart); processing runs api → queue → worker → (the owning modules' services for the system of record, OpenSearch directly for the search projection)**:

```text
┌─────────────────────────────────────────────────────────────┐
│ Surfaces                                                    │
│  apps/web  (public site + merchant area, RTL)               │
│  apps/admin (separate application, separate login)          │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS, schema-validated JSON contracts
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ apps/api — Hono, Modular Monolith                           │
│ auth · users · catalogs · parts · suppliers · bookmarks ·   │
│ notifications · messages · support · admin                  │
└──────┬───────────────────┬─────────────────┬────────────────┘
       │                   │                 │
   system of record     read model        file bytes
       ▼                   ▼                 ▼
 packages/db          packages/search     SeaweedFS
 (PostgreSQL 16+)     (OpenSearch +       (object storage)
       ▲               Arabic analyzer,
       │               ISM by age)
       │                   ▲
       │                   │ index writes
┌──────┴───────────────────┴──────────────────────────────────┐
│ apps/worker — BullMQ processors                             │
│ extract-parts → normalize → deduplicate → index-parts        │
└───────────────────────▲─────────────────────────────────────┘
                        │ jobs
              queue (BullMQ on Redis)
                        ▲ enqueued after upload
                        └── apps/api (catalogs module)
```

The worker reaches the system of record through the owning module's service —
`catalogs` for the status, `parts` for the extracted rows — exposed via the
shared package. The arrow into `packages/db` in the diagram above is that
service path and not a direct table access: the module-ownership rule above,
and Project Structure and Debt Control, forbid reading or writing a table from
outside the module that owns it, and the worker is not that module. The worker
writes the search index directly, because it is the projection's only writer.

1. **web → api.** Every visitor and merchant action becomes an API request
   with a schema-validated contract; the public site and the admin application
   use the same modules.
2. **api → db.** PostgreSQL is the system of record. All writes and every
   authoritative read go through the owning module's repository, merchant-scoped
   at the single shared entry point.
3. **db → search.** The parts listing is served from the search index, which
   mirrors catalog data derived from the system of record. PostgreSQL remains
   authoritative; the index is a projection. The index uses the Arabic
   analyzer (root-aware search) and Index State Management (ISM) on time-based
   indices behind an alias, so a whole index is deleted by age; the per-catalog
   90-day deletion is enforced by the retention job (R15) through a
   delete-by-query on the alias rather than by the index lifecycle alone. The
   shard count is derived from the modelled 2–3 billion index (ADR-121). Search
   results follow the p95 < 1 s budget (Usage Limits). The projection is not one
   shape for everyone: a guest's read path projects a part without its price
   column and without either amount, through an allowlist of its own, so neither
   amount is present in the response rather than hidden by the presentation
   layer (Principle VI, Query Safety and Secrets).
4. **worker → db and search.** The worker is what keeps the projection current: it
   consumes queued jobs, extracts and normalizes parts, then writes the catalog
   status and the extracted parts into the system of record through the owning
   modules' services (`catalogs`, `parts`), and writes the parts into the search
   index.
   Normalisation assigns every extracted value to the canonical column the
   constitution's Glossary fixes, with no manual mapping step and no question put
   to the merchant. The canonical set is complete for a parts table, so a value
   that belongs to no canonical column is part of no stored column and is not
   stored (File Processing Rules).
   The pipeline's canonical step order is binding as a single sequence (File
   Processing Overview): upload → storage and content hash → duplicate check →
   first-page extraction → queue → worker pipeline → status update →
   notification. Content safety runs in order before a file is processed —
   magic-byte validation, ClamAV scan, decoded-size cap, macro stripping — and
   a file failing any of them is rejected and never stored or processed. The
   transport for a large upload is a presigned multipart stream to object
   storage; the API does not buffer the file in memory.
5. **Back to the user.** Status changes and administrative messages surface as
   notifications; a failed file presents a retry action that does not require
   re-uploading bytes.

Worker durability (Deployment and Observability): BullMQ jobs carry bounded
retries with exponential backoff, a dead-letter queue, a per-worker concurrency
cap, and a periodic sweep that removes temporary workspace files. A job that
exhausts its retries surfaces `failed` to the catalog and to the user, which is
the same retry action item 5 describes.

Read/write notes:

- Filters offered by the parts table: a search field over part number and
  original number (partial match), multi-select filters over car model, type,
  catalog file, and supplier (no selection means every value of that filter, so
  an unselected supplier filter means every supplier), and a price range over
  the primary amount (minimum and maximum); pagination 20/50/100; column sorting
  on every column except `type`, with the price column sorting and filtering on
  the primary amount; `?file=<id>` filters by catalog (Product Scope). The
  price column, and any filter or sort over it, are rendered for a registered
  merchant only. Search ranking beyond the sortable columns is a deferred area.
- Sort and projection columns come from the explicit allowlist mapped to real
  columns (Query Safety and Secrets).

## 4. Packages

| Package | Role | Key rules |
|---|---|---|
| `packages/shared` | Validation schemas, types, and contracts shared between frontend and backend. | Single source of the two contracts (Principle II); promoted code only after a second consumer exists. |
| `packages/db` | Database schema and migrations. | One migration tool only; every migration a single reversible step; destructive changes split into expand/backfill/contract (Schema and Migration Control). |
| `packages/search` | Search client and index mappings. | Arabic analyzer; time-based indices behind an alias; OpenSearch Index State Management (ISM) deletes a whole index by age, with the per-catalog 90-day deletion enforced by the retention job (R15); one mapping owner per index; shard count from the modelled index (ADR-121). |
| `packages/ui` | The Wafar UI layer: design tokens, theme, IconPark icons, IBM Plex Sans Arabic, IBM Plex Mono, and shared primitives. | Nuxt UI v4 only; IconPark (outline cut consumed; the colour cut vendored and not consumed; both cuts vendored and pinned, ADR-098 annotated by ADR-128 and ADR-137); IBM Plex Sans Arabic and IBM Plex Mono; no app pages; app-specific components stay in the apps; ADR-097/098/128/137. IconPark is the ADR-098 choice; the icon set and the typeface are assets of this layer, not rows of the Approved register: ADR-098 records both choices, ADR-137 fixes the consumed cut, and ADR-146 records the two gap rows closed at R1's acceptance. |
| `packages/config` | ESLint, Stylelint, Prettier, TypeScript configuration shared by all workspaces. | Dependency and tooling changes follow Dependency Governance. Stylelint + ESLint fail the build on physical direction properties and on any colour, spacing, radius, shadow, duration, or z-index value that is not supplied by the Wafar UI layer — enforced by the committed configuration, not a review comment (Principle IX). |

## 5. Environments and operations

- Three environments: development, staging, production. Staging runs the same
  application version, configuration values, and migration state as
  production; scale is the only permitted difference. A migration is applied
  and its rollback exercised on staging before production needs it.
- Every deployed service exposes a health check that verifies the dependencies
  it actually uses; structured logs carry a correlation identifier; logs never
  contain secrets, session tokens, or personal data.
- RTO and RPO are stated numerically per plan in Constitution Mandated Values;
  backups are automated, encrypted, and restored into a clean environment at
  least once per quarter.
- Staging holds no production personal data: seeded or anonymised datasets
  only (pg_anonymize or equivalent).
- Merchant isolation is verified by a query-path test that fails the build if
  any merchant-reachable path can return another merchant's rows.
- Metrics are collected for p95 request latency, search p95, processing
  success rate, and queue depth, with alerts when a budget is breached; the
  correlation identifier runs end to end.
- Public HTTP APIs are versioned in the path (`/api/v1`); a deprecation
  announces removal at least one release ahead and is recorded as an ADR.
- Each build produces an SBOM and runs a vulnerability/SAST scan (Semgrep OSS
  or equivalent) whose failures block release.
- Each web surface carries a Lighthouse budget (LCP, INP, CLS) asserted by
  Lighthouse CI on at least the public Parts and Home pages. The two latest
  major versions of Chrome, Edge, Firefox, and Safari are supported.

## 6. Governance pointers

- Constitution: `.specify/memory/constitution.md` (current version: its footer or
  `.specify/memory/version.json`) — principles I–X and
  the binding sections (including File Processing Overview, Product Scope, and
  Deferred areas).
- Decisions and their rationale: the decision register — `docs/DECISIONS.md`
  (index and reading protocol) and `docs/decisions/volume-NN.md` (records),
  ADR-001 … ADR-161.
- Data model: `docs/domain-model.md` — the entities, their relationships and
  invariants, and the owning module of each. This document names the modules;
  that document explains what each one owns. Neither repeats the other.
- Capacity and load envelope: `docs/capacity-model.md` — the six-month plan,
  the quota model, the ingestion envelope, the deployment shape, and the
  verification plan (ADR-117, ADR-119, ADR-121, ADR-122); sample evidence:
  `docs/pdf-sample-analysis.md`. The constitution wins on every conflict.
- UI foundation: Nuxt UI v4 is the component library; the Wafar UI layer is
  `packages/ui`, fixed by ADR-097 (Principle IX); R1 builds it through its plan
  and consumes it.
  ADR-098 records IconPark and IBM Plex Sans Arabic; ADR-128 adds IBM Plex Mono
  for numerals and replaces ADR-098's marine/sand palette with the Precision
  contract, and ADR-132 keeps the scroll-hide bar; ADR-137 restores the light
  default and consumes the outline icon cut.
- Technology stack: `Project-Technologies.txt`; product scope and roles:
  `Core-Project.txt`.
- Deferred areas that touch this architecture: extraction algorithm; file
  ingestion internals; authorization model; retrieval interface. Catalog data
  shape was discharged on 2026-10-05 (ADR-040): the canonical columns are fixed,
  and what remains is the shape below the product, which is the schema file and
  the feature's `data-model.md`. The first feature that implements a deferred
  area MUST record, in its plan's Constitution Check, which rules are still
   missing and when they will be ratified. The open product facts that touch this
   architecture — the message sender's representation, the conversation's
   administrator reference, `expires_at`, notification retention, and how a
   multi-separator printed price is read — are listed in
   `docs/domain-model.md` → Unresolved facts, each with
   the slice that must decide it. The contact-message path was resolved
   2026-10-03 by ADR-028 (a dedicated "Contact messages" administrator page), and
   ADR-053 settled which tables are merchant-scoped.

