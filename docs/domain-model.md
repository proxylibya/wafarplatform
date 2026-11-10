# Domain Model — Wafar

This document is the single authority for Wafar's **logical** data model: the
entities the product reasons about, the relationships between them, their
cardinality, their invariants, and the module that owns each one. It is the
source the constitution's Product Register maps.

Its authority is `.specify/memory/constitution.md` (current version: its footer
or `.specify/memory/version.json`); where this
document and the constitution disagree, the constitution wins and this document
is corrected. Its amendment procedure is the constitution's: a change here is a
change to a registered product fact and MUST be recorded as an ADR in the
decision register.

## What this document is, and what it is not

The distinction is the whole point of this document, so it is stated first.

| Concern | Lives in | Written by |
|---|---|---|
| **Domain model** — entities, relationships, cardinality, invariants, ownership | **this document** | project level, ratified here |
| **Data model / schema** — tables, columns, types, indexes, constraints | `packages/db/schema/<module>.ts` and `packages/db/migrations/` | the feature that owns the module, in its plan Phase 1 |
| **Feature data model** — the columns one feature introduces, and the API contracts it exposes | `specs/[###-feature]/data-model.md` and `specs/[###-feature]/contracts/` | `/speckit.plan` Phase 1 |
| **Data dictionary** — the meaning, type, and constraint of every column | the feature's `data-model.md`, which is the only place a column is introduced | `/speckit.plan` Phase 1 |

**No column type, no SQL, and no table definition appears in this document.**
The constitution forbids a table definition inside the constitution
(Single-Reference Sufficiency: "a UI value, a token, a class, a line of
code, or a table definition MUST NOT be copied"), and the same reasoning
applies here: a column list copied into a document is a second source that will
disagree with the migration.

A field *name* appears occasionally, and each one is a reference rather than a
definition — it names a value the constitution or the product already fixes, so
that the rule below can be stated in business terms:

- `first_page_metadata_incomplete` is named in the constitution's File
  Processing Overview and Glossary; `expires_at` is named in the constitution's
  Unresolved product facts table, and the Glossary names the catalog's printed
  expiry date.
- `name`, `phone`, and `body` are the contact form's fields, fixed by the
  constitution's Product Fact Clarifications.
- The four catalog status values are fixed by the constitution's File Processing
  Rules.

This document introduces no field, and it defines no type, length, nullability,
default, or index. A field that the constitution does not fix is either already
registered in Unresolved facts below with the slice that owns it, or it does not
exist yet.

This is not a workaround for missing work. The *product-level* shape of a part
was **Catalog data shape**, a deferred area of the constitution, and it was
discharged on 2026-10-05: the Glossary now fixes a part's canonical columns and
the role of the original number, and the invariants over them are stated below
(ADR-040). What remains is the shape below the product — column types, lengths,
nullability, defaults, and indexes — which is the owning module's schema file
and the owning feature's `data-model.md`, plus whether a part persists the page
and row it came from, which is open fact #10 owned by R3. R3 remains the first
slice to implement any of it, and its plan's Constitution Check MUST record which
rules are still missing and how they will be ratified, no later than R3's
acceptance. Writing the *types* here would still be the defect the paragraph
above exists to prevent.

The entity names, their relationships, and their invariants below are **not**
deferred: the product already fixes them in `Core-Project.txt` and the
constitution's Product Register, and the slice order depends on them — R1
through R17 all read this document before planning.

## Entity map

Twelve entities, each owned by exactly one module. Ownership is binding: the
owning module is the only one that may read or write the entity's storage, and
every other module reaches it through that module's service, which is
exposed via the shared package — never through a direct import.

| Entity | Owning module | What it represents | Cardinality |
|---|---|---|---|
| `User` | `users` | A registered merchant whose identity is a full name, a Libyan mobile number (E.164, unique, always +218), a city, an optional shop name, the role that separates a merchant from an administrator, a status that is `active` or `blocked`, and optional per-user upload-quota overrides (monthly and active). No email address exists, and no dial-code selector is offered. | One account has many catalogs, bookmarks, notifications, sessions, and at most one conversation. |
| `Supplier` | `suppliers` | The company named on a catalog's first page, from which the parts originate. | One supplier appears in many catalogs. |
| `Catalog` | `catalogs` | An uploaded supplier file with its metadata, its processing status, and a pointer to its stored bytes. | One catalog belongs to one uploading user and to at most one supplier, and contains many parts. |
| `Part` | `parts` | A single row extracted from a catalog, representing one car part, carrying the amount or the two amounts its own catalog printed. | One part belongs to exactly one catalog. |
| `Bookmark` | `bookmarks` | One entry in a merchant's cart: a link from a user to a part. | One user has at most 99 bookmarks; a bookmark links exactly one user and one part. |
| `Notification` | `notifications` | A message delivered to a user in the notification list, from a processing outcome, from the administrator, or from an administrator reply. | Many per user; no upper bound is fixed. |
| `Conversation` | `messages` | The single thread between a merchant and the administrator. Whether it carries an administrator reference, and whether every administrator account reads the same thread, is unresolved fact #2 below, owned by R10. | A user has at most one conversation. |
| `Message` | `messages` | One message inside a conversation. | Many per conversation. |
| `ContactMessage` | `support` | A message from the public contact form: name, phone, body. | Independent of any account; it reaches the administrator without a conversation. The phone is for contact only, never an account identifier. |
| `AuditLog` | `admin` | The append-only record of every administrator operation. | Append-only: never updated, never deleted. The administrator is a party the record names, and the administrator is a `User` holding the administrator role (see `User`). |
| `Session` | `auth` | One server-side session for an account, which proves the caller is signed in and is revocable on its own or all at once ("sign out everywhere"). | Many per user; each belongs to exactly one account. |
| `PlatformSetting` | `admin` | The administrator-editable platform settings the Settings page reads and writes; the contact details shown on the Contact page are the first of them. | Platform-wide: one set for the platform, owned by no single merchant. |

## Relationships

```text
User 1 ──< Catalog >── 1 Supplier
User 1 ──< Bookmark >── 1 Part >── 1 Catalog
User 1 ──< Notification
User 1 ──< Session
User 1 ── 1 Conversation 1 ──< Message
ContactMessage                 (no user; the submitter may be a guest)
PlatformSetting                (platform-wide; no user)
```

`AuditLog` is deliberately absent from this diagram. The register makes an
administrator a role on `User` (ADR-067), and the audit record's administrator
party follows from that role decision, so it carries no separate open fact and
drawing it would add nothing. The administrator side of `Conversation` is a
different case: whether it carries a reference, a role, or nothing is
unresolved fact #2 below, owned by **R10**, so the administrator side of that
edge is not drawn.

A dashed line is not used, because "related but undecided" is not a relationship
the schema can express, and drawing one would read as a decision.

Two relationships carry a rule that the product fixes and that no entity field
expresses:

- **A part is reachable through its catalog, never around it.** Filtering by
  catalog file (`?file=<id>`) and the Catalog page both traverse
  `Part → Catalog → User`. No query path may return a part without resolving its
  catalog.
- **A guest contributes no user row.** A `ContactMessage` is the only entity a
  visitor without an account creates, and it carries the submitter's name and
  phone rather than a foreign key.

## Invariants

Each invariant below is a product rule that the schema, the service layer, and
the tests must all enforce. The constitution's Schema and Migration Control
requires uniqueness, referential integrity, and permitted value ranges to be
expressed as schema constraints rather than only in application code; the
service layer re-checks the ones a constraint cannot express.

### Merchant ownership (the scoping invariant)

- **A tenant is a merchant account.** There is no `Tenant` entity. The scoping
  column is `user_id`, referencing `User`, and it appears on every
  merchant-owned table: `Catalog`, `Bookmark`, `Notification`, `Conversation`,
  `Message`, and `Session`. The constitution's Schema and Migration
  Control names this scoping; ADR-051 is its record, and ADR-053 corrects the one
  entry in it that this document contradicted.
- **`Supplier`, `AuditLog`, `ContactMessage`, `PlatformSetting`, and `Part`
  carry no `user_id`.** `Supplier` is platform-wide — one company can appear in
  many merchants' catalogs — and `AuditLog` records administrator operations,
  which have no merchant owner. `ContactMessage` is a public intake: the
  submitter may be a guest who holds no row, the fields the product fixes for it
  are the name and phone it carries *instead of* a foreign key, and its only read
  path is the administrator's "Contact messages" page. `PlatformSetting` is one
  set for the whole platform. **`Part` is platform-wide-readable for a product
  reason**: the public Parts table shows every part to every merchant and to a
  guest, so a merchant-scoped `parts` read would contradict Product Scope; the
  merchant scope of a part is carried by its `Catalog`, and the isolation test
  does not treat the parts read path as merchant-scoped (ADR-070). None of the
  five is merchant-scoped, and no isolation test covers any of them.
- **`User` is the tenant root, named so the classification is complete.** It is
  the row a `user_id` references, so it carries no `user_id` of its own and its
  own row is scoped by its identifier rather than by a foreign key to itself; it
  is neither merchant-scoped nor platform-wide (ADR-070).
- **Every index serving a merchant-scoped query leads with `user_id`.** An
  index that does not lead with the scoping column cannot serve the scoped read
  without a filter the planner has to apply after the fact.
- **A query path reachable from a merchant session MUST NOT return another
  merchant's rows**, and the test that proves it fails the build. R1 owns that
  test: it creates the single shared entry point through which merchant scoping
  passes, with `Session` as its first caller, and the test fails when the scope
  is removed from that path (ADR-139). `Session` is merchant-scoped, so R1 is the
  first slice whose merchant-scoped path reads merchant-owned rows; every later
  slice adds its merchant-scoped paths to the same entry point and the same test
  rather than writing a second one (FR-053).

### Catalog

- **Status is a closed four-value enum**: `uploaded`, `processing`,
  `completed`, `failed`. Any other value is a defect, not a new state
  (File Processing Rules). The status is not a lifecycle the user drives; the
  pipeline drives it.
- **`first_page_metadata_incomplete` is a boolean flag, never a status value.**
  It is set when the file's first page yields neither the supplier's name nor
  the issue date. It was absent from the constitution's entity register while
  the File Processing Overview required it; the register now carries it. A first
  page may print more than one issue date that matches the supplier's name; all
  of them are displayed with the result. Displaying them stores no field, and a
  later slice that must *store* several dates records that as its own open fact.
- **The content hash is unique across catalogs.** A duplicate upload is
  rejected by hash and is neither stored, queued, nor processed. A merchant who
  uploads the same supplier file twice receives a message naming the original
  (with the original's upload date and a link that opens it), not a second
  catalog.
- **`expires_at` semantics are undecided.** It is either the retention deadline
  or the supplier's printed expiry date. This is a recorded unresolved product
  fact owned by R15; until R15 decides it, no feature may give the field a
  meaning.
- **Retention is 90 days, enforced by R15.** The search index is a projection,
  and its lifecycle policy (OpenSearch Index State Management) deletes whole
  indices by index age, so per-catalog expiry is the retention job's work and not
  the index's. The period is counted from the catalog file's upload timestamp
  (ADR-131); no feature may count it from extraction, the last update, or the
  first search.
- **Upload quotas are 50 files per calendar month and 300 active stored files per
  user, with no lifetime cap**, enforced server-side by the `catalogs` module
  service (R2). The monthly count counts upload events in the calendar month and
  is not restored by deletion. The active count counts files whose bytes, parts,
  bookmarks, and search-index entries are present; a merchant delete, an
  administrator delete, or the 90-day retention job releases an active slot.
  Quota checks are atomic. The administrator may set a per-user monthly or active
  quota up to the ceilings of 500 per month and 1,500 active; a change above a
  ceiling requires a constitutional amendment.

### Part

- **A part belongs to exactly one catalog.** There is no part without a
  catalog, and no shared part across catalogs.
- **A merchant never edits or deletes a part.** Only the administrator does
  (Authorization and Access Control). The write path exists on the
  administrator application only.
- **Deduplication happens by file, by page, and by row** (File Processing
  Overview, step 6; Product Features #5). That is a rule about what the
  extraction pipeline compares, and it binds the pipeline regardless of what a
  part stores.
- **A part's canonical columns are fixed by the constitution's Glossary**, and
  this document does not repeat them (`Glossary` → `Part`). No feature may add a
  canonical column without amending that Glossary, and a specification MUST NOT
  restate the list (Single-Reference Sufficiency). Three consequences bind the
  model rather than the list:
  - **Brand, country of origin, and manufacturing grade are one column.** A
    supplier prints them together, so the platform stores them together as free
    text and does not enumerate them against a fixed list.
  - **There is no description column.** It is neither extracted nor stored, so
    no feature may read, index, filter, or display one.
  - **The original number carries no uniqueness constraint.** Suppliers repeat a
    number inside one file, and rival suppliers print the same number, so a
    unique index would reject real data. Deduplication remains the pipeline's
    rule (by file, page, row), not a constraint on this column.
- **Every extracted value is assigned to a canonical column automatically, and
  the canonical set is complete for a parts table.** The assignment is the
  extraction pipeline's own work; no manual mapping step sits between upload and
  processing, and a merchant is never asked to map columns (File Processing
  Rules). A value that belongs to no canonical column is part of no stored
  column and is not stored. There is no "unassigned" class of value and no
  counter for one.
- **A part carries a derived family, and the set is fixed.** `Part.family` holds
  one of six values — `brakes`, `filters`, `batteries`, `cooling`, `engine`,
  `suspension` — registered as reference data by ADR-130. It is a classification
  the pipeline assigns, not a canonical column and not an extracted value: the
  Glossary's six columns and the parts table's columns are unchanged. R3 fills
  it; a part whose family cannot be determined carries none, stays out of the
  Home cards, and remains in the unfiltered parts list. The set changes only by
  amending ADR-130.
- **The price is the amount or amounts of this part's own catalog, in Libyan
  Dinar.** The period and the comma in a printed price are decimal separators, so
  `123.000` is 123 dinar. A printed price carrying more than one separator, or a
  file that separates thousands instead, is a recorded unresolved fact owned by
  R3.
- **The price column carries one amount or two, each with its printed label.**
  The label is stored as part of the price cell and is not a seventh canonical
  value. The primary amount is the amount the parts table sorts and filters on
  (Glossary → `Price`); the second is displayed only. A file that prints more
  than two amounts stores the primary and the first of the remaining amounts; a
  third is not stored, counted, or flagged.
- **The original number identifies without merging.** Two parts whose original
  numbers are equal are the same part offered by different suppliers. The
  platform identifies that sameness and shows the parts side by side in one
  table; it performs no merge, introduces no equivalence entity, withdraws no
  row, and joins no two catalogs (ADR-040).
- **A guest never receives a price.** Every read path a guest can reach projects
  the part without its price column and without either amount, through an
  allowlist of its own. Redaction belongs to the projection, not to the
  presentation layer hiding a column afterwards.
- **A part's price is never edited by a merchant.** Only the administrator edits
  either amount, on the same path as any other part edit (Authorization and
  Access Control).
- **Whether a part persists its page and row of origin is undecided.** It is
  beyond the canonical column set the Glossary fixes, so it is a recorded
  unresolved fact owned by R3. Until R3 decides it, a feature MUST NOT treat
  page or row as a part field, and MUST NOT depend on either being present.

### Bookmark (the cart)

- **The cart is a bookmark list, not a purchase.** It carries no price, no
  quantity, and no checkout state, and it MUST NOT be described in
  user-facing text as a purchase (Principle VI). The price lives on the part and
  its catalog; the cart shows none of it, and the cart's own projection MUST NOT
  carry the price even though the parts it links to have one.
- **Maximum 99 parts per user, enforced server-side.** On reaching the cap the
  user is shown a full-cart notice. A client-side check does not satisfy the
  limit.
- **A user and a part pair at most once.** Re-adding a bookmarked part is a
  no-op, not a second entry — which is why the add action is idempotent and the
  `+` control toggles to the cart icon.

### Notification

- **A notification has a read state and an unread count.** The count in the
  header's notifications control is the number of the user's unread
  notifications (ADR-102).
- **Retention is undecided** and is recorded as an unresolved product fact
  owned by R9.

### Conversation and Message

- **At most one conversation per user.** A second thread is not created.
- **A conversation has exactly two parties**: one merchant and the
  administrator. There is no user-to-user messaging (Principle VI).
- **The sender of a message is either a merchant or an administrator, never
  both and never neither.** How that is represented is an unresolved product
  fact owned by R10; see below.

### ContactMessage

- **The submitted fields are exactly `name`, `phone`, and `body`** (Product
  Fact Clarifications). A fourth field is a product change.
- **A contact message reaches the administrator on the dedicated "Contact
  messages" administrator page** (ADR-028, 2026-10-03). Whether the
  administrator's response is recorded on it stays an unresolved fact owned
  by R11.

### AuditLog

- **Append-only.** No update, no delete, and no cascade from the entity it
  describes.
- **Every administrator operation writes one record**, at the moment the
  operation happens, naming the administrator, the action, the target, and the
  details.
- **The target is namespaced** in the `type:id` form the Product Register fixes,
  so one target is unambiguous across the modules. Only a module that owns a
  registered entity can appear as a target type; `auth` qualifies because it owns
  `Session`.

### Session

- **A session belongs to exactly one account**, and is revoked on its own or all
  at once ("sign out everywhere").
- **A session is server-side and revocable**, and is never persisted in browser
  storage in recoverable form (Identity, Authentication, and Session Policy).
- **Changing the password revokes the account's browser tokens**, and a session
  is withdrawn when its account is blocked or soft-deleted.

### PlatformSetting

- **Platform-wide.** One set for the platform, owned by no single merchant, so it
  carries no `user_id`.
- **It never carries a Usage Limit.** The Usage Limits are constitutional and
  change only by amending the constitution, never from the Settings page.
- **Admin-writable only; publicly readable where the product requires it.** No
  merchant-reachable path writes it, and the public Contact page reads the
  contact details it holds through a projection of its own (Product Register;
  Product Scope → Contact).

### User

- **The mobile number is the sole account identifier.** It is stored in E.164
  form (+218…), normalized before comparison, and unique per account
  (ADR-030). No email address exists anywhere in the platform: no sign-up
  email, no login email, no transactional email.
- **OTP verification is required at sign-up.** Sign-in of a verified account
  requires no OTP (Product Scope; ADR-030).
- **The role is the only authority for what a user may do.** No one becomes an
  administrator through the public registration flow. An administrator is a
  `User` holding the administrator role; there is no separate administrator
  entity.
- **The status is `active` or `blocked`, a closed two-value set.** A blocked
  account keeps every row and its public contributions; blocking only sets the
  status and withdraws the account's access. It is not deletion, and nothing
  cascades.
- **No user deletes their own account.** The Product Register forbids it and
  the Profile page offers no such control.
- **A user may delete a catalog they uploaded.** The cascade to that catalog's
  parts, to its bookmarks, and to its index entries is part of the delete, not
  a later cleanup.
- **Blocking a merchant does not remove their public contributions.** Their
  catalogs and the parts extracted from them stay visible, because the catalog
  is public and other merchants search it.
- **The account may carry two upload-quota overrides, monthly and active.** A
  missing value means the constitutional default of 50 uploads per calendar month
  or 300 active stored files. The administrator sets each override per user,
  within the ceilings of 500 per month and 1,500 active; a value above a ceiling
  requires a constitutional amendment. The `users` module owns the fields, the
  `catalogs` module enforces the effective quota atomically, and the `admin`
  module records every change in the audit log. Lowering a quota never deletes a
  file and only blocks new uploads until the account is under the new limit;
  raising a quota takes effect immediately. A blocked account cannot upload, and
  blocking never deletes its files.
- **The account carries three sign-in state fields, and each is a field the
  Product Register names.** They are the consecutive failed sign-in attempt
  count, the sign-in lock's expiry, and the requirement to change the password
  at first sign-in. R1 adds them; the register's `User` row names them, so they
  are registered fields rather than schema inventions. The count's registered
  name is the register's label for one counter; what it counts is a **failed
  password verification** — a password check that runs against an existing,
  active account and does not match — on exactly three paths: sign-in, the
  account's own change-password action, and the administrator's forced first
  change.
  - **The count is consecutive, and one set increments it.** A failed password
    verification on any of the three paths adds one, and nothing else does: a
    refusal produced by a rate limit, by a value that is not a valid Libyan
    mobile number, by a blocked account, by an administrator account on the
    merchant sign-in surface, by a value rule before the check runs, or by the
    lock MUST NOT increment it, because none of them is a counted failed password
    verification: the refusals never reach a password check against an active
    account, and the lock withholds the count from the check it refuses.
  - **A success on any of the three paths clears the count to zero**, and the
    lock's expiry clears it too. A password reset through the recovery flow
    clears neither the count nor the lock.
  - **The lock is a time bound alone.** It is applied after five consecutive
    failed password verifications, runs for fifteen minutes, ends nothing else,
    and at its expiry the count clears. A refusal made while the lock is in force
    is not counted as a further failed password verification and never extends
    the lock; the lock withholds acceptance on the three paths and ends no
    session.
  - **The forced-password-change requirement is cleared by that change and by no
    other path.** The change must set a value different from the initial
    password and must supply the current password — the initial password the
    operator supplied — exactly as any other password change does; a submission
    without it or with a wrong one is refused, clears nothing, and leaves the
    account restricted, and the failed check is a failed password verification.
    The change ends every existing session, including the restricted one it was
    made from, and sends the security notice, exactly as any other password
    change does. An account that carries the requirement is restricted to the
    password change and the ending of its session; the sign-in that reveals it is
    accepted, never refused.
- **Deletion is soft** for users and catalogs; see Soft deletion below.

## Transient verification state (not an entity)

The one-time codes and the pending sign-up or password-reset request are
**transient verification state, not an entity**. They carry a per-number
identity, an expiry, a replacement rule, a count of the new codes the live
request has asked for, and a bound on incorrect entries, and
they live in an expiring store outside the entity register rather than as a
thirteenth entity. The `users` module owns the store.

- **One pending request is live per mobile number.** A new sign-up or recovery
  request for a number that already has a live pending request replaces it, and
  the previous code stops being valid at once. The replacement reaches every
  state of the pending request, including the recovery flow's verified state:
  that state ends at once and can no longer set a password, so two authorities
  never coexist for one number.
- **The re-request limit is counted per pending request.** A fresh sign-up or
  recovery request for the same number begins a new verification with a full
  allowance of new-code requests, because the operation's own rate limit bounds
  how often a fresh request can start; the spent allowance is not carried across
  requests, and the store carries the live request's re-request count alongside
  its expiry and its incorrect-entry count.
- **Exactly one code is valid at any moment.** A new code replaces the previous
  one only when the messaging channel accepts its message; a refusal at
  acceptance leaves the previous code valid, the request live, and the
  re-request limit untouched. A message the channel accepts is a successful
  send from the platform's side even if it is never delivered; a later delivery
  failure is outside the platform's observation and is not a send failure.
  A replacement never resets the count of incorrect entries, and that count
  records only a wrong value for the live code: an expired code and a code a
  replacement has superseded are refused without incrementing it.
- **The pending request ends when the bound on incorrect entries is reached**,
  and the person starts a fresh request, which begins a new verification with
  the count at zero.
- **The pending sign-up request holds the form's details in protected form.**
  It carries what the form collected, so the account can be created when the
  correct code is entered; the password among them is irreversibly protected at
  submission, in the same form a stored password has, and the request holds that
  value rather than the plaintext. Replacing or ending the request discards it.
  The one-time code is held the same way: the store carries the irreversibly
  protected value computed when the code is dispatched, an entered code is
  verified through that form alone, and a replacement's protected value replaces
  the previous one at the accepted dispatch, so the store never holds a usable
  code in plaintext.
- **A pending request expires.** The expiry, the re-request limit, and the
  incorrect-entry bound are numbers the plan records under Constitution
  Mandated Values; this section fixes the rules, not the numbers. A dispatch the
  messaging channel accepts restarts the request's expiry, so the replacement
  code carries a full period rather than the remainder of the request it
  replaced, and a dispatch the channel refuses changes neither the code nor the
  expiry. (ADR-124.)
- **The recovery flow's new-password step is carried by a verified state.**
  When the correct code is entered in the password-recovery flow, the code stops
  being usable at once and the pending request moves to a verified state that
  carries the new-password step alone, lasts no longer than the pending
  request's own lifetime, and ends when the new password is set, when a new
  request replaces the pending request, or when the account's password changes
  by another path — the account's own change action or the administrator's
  forced first change — so the same
  code cannot authorise a second reset and a reset authority created before a
  password change never survives it. A successful sign-in alone does not end the
  request, because it does not change the credential. A reload while the state
  lives shows the new-password step again; once the password is set the page
  returns to its first step. (ADR-111, ADR-115; decided 2026-10-29,
  Clarifications.)
- **Nothing here is an account.** No `User` row exists until the correct code is
  entered, so `User.status` stays the closed two-value set and the register's
  twelve entities stay twelve. The store's rows carry no merchant identity and
  are read by the `users` module alone.

## Soft deletion

`Core-Project.txt` states that deletion is soft for files and users, and that
deleting a file withdraws its parts and its index entries. Four slices depend
on it — R4 (a merchant deletes a file they uploaded), R13 (an administrator
blocks or soft-deletes an account), R16 (an administrator deletes a file), and
R15 (automatic deletion after 90 days) — and
none of them could state the rule without it. It was absent from the
constitution's Product Register, which meant the rule existed in the product
mirror and nowhere a feature could be held to. The register now carries it, and
this section is its statement.

Blocking is a separate operation and is **not** deletion. A blocked merchant
keeps every row; blocking only sets `User.status` to `blocked` and withdraws the
account's access. Nothing cascades when an account is blocked, because nothing is
removed.

- **A soft-deleted row is retained, not erased.** It carries a deletion
  timestamp, and every read path filters it out.
- **A hard delete is not a merchant capability.** Only the retention job and an
  administrator operation remove rows for good.
- **Soft deletion is not a substitute for a cascade.** Deleting a catalog still
  withdraws its parts, their bookmarks, and their search-index entries; a
  soft-deleted part that remains searchable is a defect.

## Unresolved facts this model does not decide

Recorded rather than silently resolved, per the constitution's Unresolved
product facts rule. Each names the slice that must decide it and record the
answer in the decision register. A slice MUST NOT decide one on its own.

**Read this table before planning.** Rows 1–4 are also carried in the
constitution's Unresolved product facts table, so a slice reading either document
sees the same questions with the same owners. Row 12 joined them there on
2026-10-05 with the price column. The remaining rows exist only in this table and
in `ROADMAP.md` → Open data-model questions; they are open field-level facts that
were never registered anywhere else. Rows 5, 6, 7, 8, and 13 were resolved —
row 5 on 2026-10-03 by ADR-028, and rows 6, 7, 8, and 13 on 2026-10-07 by
ADR-067 — and are kept struck-through for traceability.

Rows 9–11 name no field that `Core-Project.txt` or the constitution currently
registers. Row 12 names no field at all: it is a reading rule for a value the
pipeline reads. The identifiers that appeared in earlier drafts of this table
(`Catalog.size`, `Catalog.mime_type`, `Part.page`, `Part.row`,
`ContactMessage.status`, `ContactMessage.admin_note`) were never added to the
product mirror; any use of them is a reference to this table, not to the mirror.
(`User.status` was one of them; ADR-067 has since registered it on `User`.)

| # | Unresolved fact | Why it is not decided here | Decided in |
|---|---|---|---|
| 1 | How a message's sender is represented when the sender may be either a merchant or an administrator. | The register names one sender on a message, but the two roles are different principals and the representation is a schema decision, not a conceptual one. | R10 |
| 2 | Whether `Conversation` carries an administrator reference when every administrator account sees the same thread. | The thread is single and shared; whether the administrator side is a reference, a role, or absent is a schema decision. | R10 |
| 3 | Whether `expires_at` is the retention deadline or the supplier's printed expiry date. The point the 90-day retention is counted from is settled: the catalog file's upload timestamp (ADR-131). | Two product sources disagree on the field; the trigger point, once part of this row, is now fixed. | R15 |
| 4 | Notification retention. | The product statement defers it. | R9 |
| 5 | ~~Whether a contact message becomes a conversation or is read in its own inbox.~~ Resolved 2026-10-03 by ADR-028: a dedicated administrator "Contact messages" page. | — | ADR-028 (owning slice: R17) |
| 6 | ~~Whether an administrator is a distinct entity or a role on `User`.~~ Resolved 2026-10-07 by ADR-067: the administrator is a **role on `User`**, not a distinct entity. | — | ADR-067 |
| 7 | ~~What state an account carries, and whether a blocked merchant is a state or a separate flag.~~ Resolved 2026-10-07 by ADR-067: `User.status` is a closed two-value set, `active` or `blocked` — a state, not a separate flag. | — | ADR-067 |
| 8 | ~~Whether the `auth` module owns any stored entity of its own.~~ Resolved 2026-10-07 by ADR-067: `auth` owns `Session`, the server-side revocable session store; the account's identity and profile belong to `users`. | — | ADR-067 |
| 9 | The stored byte count and content type a catalog carries. No fields are registered for them today. | Both would be validation facts (File Processing Overview step 1) as much as stored ones, so the slice that enforces validation is the slice that settles them. | R2 |
| 10 | Whether a part stores the page and the row it came from. No such fields are registered today. | Beyond the Glossary's list of a part's fields, so **Catalog data shape**. Deduplication compares file, page, and row whatever a part stores, so nothing in the pipeline forces the answer either way. | R3 |
| 11 | The state a contact message moves through, and whether the administrator's response to one is recorded on it. No such fields are registered today. | The contact form is the only way a visitor reaches the administrator, and nothing registers what happens to the message afterwards. | R11 |
| 12 | How a printed price carrying more than one separator is read (for example `1.250.000`), and how a file that separates thousands rather than decimals is read. | The product fixes the currency and the single-separator rule (Libyan Dinar, decimal separator, so `123.000` is 123 dinar), but real supplier files are not uniform, and only R3 can settle the multi-separator form from samples. No feature may settle it on its own. | R3 |
| 13 | ~~Where the administrator's platform settings live.~~ Resolved 2026-10-07 by ADR-067: `PlatformSetting`, owned by `admin`, a platform-wide entity that carries no `user_id`. | — | ADR-067 |

Rows 9 through 11 are field-level questions, not conceptual ones: the entity and
its owner are not in doubt, only what the entity carries. Row 12 is a reading
rule rather than a field, and binds the extraction pipeline the same way. Row 12
is also carried by the constitution's Unresolved product facts table, so its
answer amends that table. Rows 9 through 11 add one or more fields to an entity
the register already carries: the answer is recorded as an ADR and as a change to
this document and to the owning feature's `data-model.md` and schema, and the
register is amended only where a field's existence is itself a product decision
the entity's one-line meaning must name.

**Rows 1 and 2 are schema decisions rather than registered product facts, and
the distinction matters when the slice that owns them records its answer.** A
registered product fact is one the constitution's Product Register states — an
entity, a relationship, an invariant, a role, a page, a feature, or a usage
limit — and changing one requires a constitution amendment to the register
besides the ADR and this document. Rows 1 and 2 are not of that kind: the
concepts are already fixed, and only their **representation** is open. The
register describes a `Conversation` as the single thread between a merchant and
the administrator, and it states no sender on a `Message`; what is undecided is
whether that sender is a role, a reference, or a discriminated column, and
whether the administrator side of the thread is
carried as a reference, a role, or nothing at all. Neither answer changes what
the product does, so neither requires the constitution's register to be amended.
R10 therefore records each answer as an ADR and as a change to this document,
and the slice's `data-model.md` states the shape it chose. A slice that finds
that either answer needs a product fact the register does not carry must amend the
register in the same change, as the register's own rule requires.

The same distinction separates rows 1 and 2 from rows 3 and 4, which **are**
registered facts: a retention period and the point it is counted from are
product facts the register states or reserves, and resolving either amends the
register in the same change. Rows 9 through 11 are a third kind: fields added to
an entity the register already carries. The constitution's Data entities rule
changes an entity's shape only through this document and an ADR — `Catalog`'s
row registers neither a byte count nor a content type, because prose is not a
field list — so resolving one records the answer as an ADR and a change to this
document, states the fields in the owning feature's `data-model.md` and schema,
and amends the register only where a field's existence is itself a product
decision the one-line meaning must name.

## What this document deliberately does not contain

- Column names, types, lengths, nullability, defaults, or indexes. Those are
  the owning module's schema file and the feature's `data-model.md`.
- API request and response shapes. Those are the feature's `contracts/`.
- Extraction, column-matching, and deduplication algorithms. Those are
  **Extraction algorithm**, a separate deferred area owned by R3. The canonical
  columns those algorithms target are fixed by the constitution's Glossary, so an
  algorithm chooses among fixed targets rather than inventing them.
- Search ranking and result ordering. Those are **Retrieval interface**, owned
  by R5.
- Permission resolution within a role. Those are **Authorization model**, owned
  by the first slice that implements it.
- Naming rules for tables, columns, files, and identifiers. Those are the
  constitution's Schema and Migration Control, and they are restated nowhere
  else.

## Change discipline

- A change to an entity, a relationship, or an invariant is a change to a
  registered product fact: it requires a constitution amendment to the Product
  Register, an ADR in the decision register, and this document updated in the
  same change.
- A change to a column type or a constraint is a feature's business: it is
  recorded in that feature's `data-model.md` and applied by a migration under
  the constitution's Schema and Migration Control.
- The two MUST NOT be confused. The first is governance and is versioned; the
  second is implementation and is reviewed per feature.
