# Phase 1 Data Model — Identity and Foundation

**Feature**: `001-identity-foundation` | **Date**: 2026-10-29 | **Revised**: 2026-11-02 | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

This document is the storage shape of the plan's Technical Context. It records
columns, types, constraints, indexes, state transitions, and the non-entity
stores; it does not restate the entities' meaning. `docs/domain-model.md` owns
the two entities this slice implements (`User`, `Session`) and their invariants,
and nothing here may contradict it. Where a value is a product rule, the
supplying requirement is cited; where a value is a technical parameter, the plan's
Constitution Mandated Values row (CMV) is cited.

**This document adds no entity.** The register's twelve stand; `User` and
`Session` are the two this feature implements, and the credential row, the
pending-verification store, the rate-limit counters, and the library's
placeholder table are operational state classified in §2. The three
account-level sign-in fields are ADR-105's amendment, implemented here and not
re-amended (plan → Gate 2, Product Register).

## 1. Scope

| Item | This slice |
|---|---|
| PostgreSQL | 16 or later, one database, one `public` schema, six tables |
| Migration tool | Drizzle Kit only; two migrations (`0001_identity_foundation`, `0002_identity_foundation_previous_code`) created by hand-reviewed `drizzle-kit generate` output and applied by `drizzle-orm`'s migrator |
| Owning module schemas | `packages/db/schema/users.ts` (module `users`) and `packages/db/schema/auth.ts` (module `auth`) — one file per module, per `docs/architecture.md` |
| Tables created | `users`, `phone_verifications` (module `users`); `accounts`, `sessions`, `verifications`, `rate_limit_counters` (module `auth`) |
| Tables read or written by this slice | All six; `verifications` is declared for the adapter and written by nothing (§8) |
| Tables this slice does not create | Every catalog, file, search, notification, message, support, audit, and settings table — later slices, each with its own migration |

**One writer per table.** Only the owning module's repository reads or writes a
table (Principle X, plan → Gate 2 → Schema and Migration Control). The
cross-module operations go through the owning module: account and session
creation at verification, and password change with global revocation, run in one
Drizzle transaction opened by the orchestrating `auth` service, each repository
method taking the transaction handle; the sign-in lock's conditional update,
success reset, expiry clear, and the current-password check's lock refusal are
implemented by `apps/api/src/modules/users/repository/user-lock.ts` and called
through the lock port declared in `packages/shared`.
The `auth` service never issues SQL against a `users` table (research R-16).

## 2. Classification

| Store | Kind | Why it is not an entity | Owning module |
|---|---|---|---|
| `users` | **Entity `User`** | Registered in the constitution's Data entities table; ADR-105 registered its sign-in fields | `users` |
| `sessions` | **Entity `Session`** | Registered; ADR-070 fixes its ownership | `auth` |
| `accounts` | Credential row of `User` | Holds the account's password credential and the library's provider bookkeeping. It carries no product field, is never surfaced, and adds no relationship: one account has exactly one credential row per provider. A thirteenth entity would give the register a row nothing in the product can name | `auth` |
| `phone_verifications` | Transient verification state | `docs/domain-model.md` → Transient verification state records it as expiring state outside the register, with its invariants. It carries a per-number identity, an expiry, a replacement rule, a re-request count, and an incorrect-entry bound — not an account | `users` |
| `rate_limit_counters` | Operational counters | Keys and 15-minute windows; no identity, no relationship, no product read | `auth` |
| `verifications` | Library placeholder | The adapter's `verification` model, declared so the schema is complete and the adapter initialises; R1's single store is `phone_verifications`, and no code path writes this table (§8) | `auth` |

**No entity is added, renamed, or re-owned.** In particular the pending request
is not a `Verification` entity, and no column of `users` is an entity of its own.

## 3. Conventions

- **Column names**: `snake_case`. **Drizzle property names**: the authentication
  library's field names (`name`, `emailVerified`, `expiresAt`, …), so the adapter
  needs no field-mapping configuration and the database keeps one naming
  convention. The library property `name` therefore maps to the product's
  `full_name` column; the adapter sees `name`, the database and every query see
  `full_name`.
- **Identifiers**: `text`. The library-owned rows use its 32-character random
  string; `phone_verifications` uses `crypto.randomUUID()`. No serial and no
  client-supplied id.
- **Timestamps**: `timestamptz(3)`, `not null default now()`. Every table carries
  `created_at`; `updated_at` is present where a row is user-visible or is
  rewritten in place (`users`, `accounts`, `sessions`, `phone_verifications`,
  `verifications`). `rate_limit_counters` carries `created_at` only: its `count`
  is a counter, not an edit of a record.
- **Enumerations**: `text` with a `CHECK (col IN (…))` constraint. No PostgreSQL
  `enum` type: a closed set that a later slice extends would need a type
  alteration, and the check is one migration line instead.
- **Foreign keys**: `ON DELETE RESTRICT` for `accounts.user_id` and
  `ON DELETE CASCADE` for `sessions.user_id`. Deletion is soft, as the
  register's cross-entity rule provides, and this slice ships neither the act
  nor its column (the closing bullet of this section): a `User` row is removed
  for good only by an administrator operation (R13) or by the retention job
  (R15), never by a merchant and never by a path this slice ships. On that
  permanent removal the credential is removed explicitly by the operation that
  removes the row, which is what `RESTRICT` keeps honest, while a session is
  meaningless without its account and cascades. FR-018 fixes the effects of a
  removal — every session withdrawn, no stored credential able to sign in — and
  fixes neither the act's timing, its audit record, nor any retention period;
  the retention job's trigger and its period stay with R15.
- **Every foreign key has an index.** Stated per table below; the migration's own
  review asserts it.
- **No dynamic SQL.** Drizzle's parameterized builder only; no identifier is
  interpolated into a statement (plan → Gate 2 → Query Safety and Secrets).
- **Statement budget**: every query is a point lookup or a single-row upsert on a
  unique index; `statement_timeout = 2 s`, query p95 ≤ 100 ms (CMV rows 6–7).
- **No soft-delete column in R1.** Soft deletion is registered and owned by R13
  for accounts; adding `deleted_at` here would ship a state machine no
  requirement of this slice drives. R13 adds the column with its own migration.

## 4. Entity `User` — table `users`

The account. Created only by (a) the sign-up verification, inside the same
transaction that creates its session (FR-004, FR-034), or (b) the operator's
provisioning action, inside the same transaction that creates its `accounts`
credential row (FR-028, AC-030). Either path commits the account together with
the row that makes it usable — the session at sign-up, the credential at
provisioning — so no `users` row can be left that nothing can open.

| Column | Type | Null | Default | Constraint / note |
|---|---|---|---|---|
| `id` | `text` | no | — | Primary key; library-generated |
| `full_name` | `text` | no | — | `btrim(full_name) <> ''` and `char_length(full_name) <= 100` (FR-001, CMV 19). `char_length` counts code points, which is the unit FR-001 states |
| `email` | `text` | no | — | `UNIQUE`. Holds the reserved, non-routable sentinel formed from the canonical number without its leading `+`, followed by `@phone.invalid` — `+218912345678` becomes `218912345678@phone.invalid` (research R-01; Complexity Tracking row 15). ASCII, digits before the `@`, unique because the number is unique. Never displayed, never a sign-in input, never messaged; `email_verified` is always `false` and no transport exists |
| `email_verified` | `boolean` | no | `false` | Library field; nothing reads it |
| `image` | `text` | yes | — | Library field; nothing writes or reads it in R1 |
| `phone_number` | `text` | no | — | `UNIQUE`. Canonical E.164 (`+218` + 9 digits), always written normalized (FR-031) |
| `phone_number_verified` | `boolean` | no | `false` | `true` for every row this slice creates: sign-up sets it at verification, provisioning sets it at creation (FR-004, FR-028). `false` is reachable only if a later slice inserts a row directly, which no requirement allows |
| `city` | `text` | no | — | One entry's Arabic name, exactly as the fixed list spells it (FR-005). Enforced by the service against `packages/shared/src/reference/libyan-cities.json` and asserted by a test; not a database `CHECK`, because a list of ~200 Arabic names in SQL would be a second copy of the dataset |
| `shop_name` | `text` | yes | — | `char_length(shop_name) <= 100` (FR-001, CMV 19); `NULL` when the optional field is absent; the empty-after-trim value is stored as `NULL` |
| `role` | `text` | no | `'merchant'` | `CHECK (role IN ('merchant', 'administrator'))`. Public sign-up always writes `merchant` (FR-027) |
| `status` | `text` | no | `'active'` | `CHECK (status IN ('active', 'blocked'))` (FR-016). No transition is performed in R1 |
| `failed_sign_in_count` | `smallint` | no | `0` | `CHECK (failed_sign_in_count >= 0)`. Consecutive failed password verifications (FR-009, ADR-105) |
| `locked_until` | `timestamptz(3)` | yes | — | The lock's time bound (FR-009, CMV 4); `NULL` when not locked |
| `must_change_password` | `boolean` | no | `false` | The forced first change (FR-028, ADR-105); `true` only on a provisioned administrator |
| `monthly_upload_quota_override` | `integer` | yes | — | `CHECK (… BETWEEN 1 AND 500)`; registered by the `User` row, unused in R1 (a later slice's ceiling) |
| `active_upload_quota_override` | `integer` | yes | — | `CHECK (… BETWEEN 1 AND 1500)`; registered and unused in R1 |
| `created_at` | `timestamptz(3)` | no | `now()` | |
| `updated_at` | `timestamptz(3)` | no | `now()` | Rewritten by the library and by every service mutation |

**Indexes**

| Index | Columns | Kind | Serves |
|---|---|---|---|
| `users_pkey` | `id` | primary key | Session and credential joins |
| `users_phone_number_key` | `phone_number` | unique | Sign-in lookup, uniqueness at creation (FR-031) |
| `users_email_key` | `email` | unique | The adapter's own lookups; also makes the placeholder collision-free because it derives from the unique number |

No index on `status` or `role`: no R1 query filters by either, and the shared
entry point reads the single row it already has by primary key.

**Invariants and where each is enforced**

| Invariant (source) | Enforcement |
|---|---|
| The mobile number is the sole identifier, compared normalized (FR-031) | Normalization in `packages/shared/src/normalize` at the form and at every route; the unique index is the authority, so two concurrent creations produce one row and one conflict |
| No account exists before the code is verified (FR-004, Key Entities) | The sign-up path writes no `users` row until the code is verified; the integration test asserts `count(users)` is unchanged after a form submission |
| Sign-up creates the account and its session together (FR-004) | One transaction; a failure rolls both back and leaves the pending request live and the code usable (FR-034) |
| Provisioning creates the account and its usable credential together (FR-028, AC-030) | One transaction writes the `users` row and its `accounts` row: the credential is written before the commit, and a failure rolls the `users` row back, commits no credential, and reports the failure to the operator, so no provisioned account exists that no password can open. Asserted by the provisioning integration test (T107); §6 pairs the two rows |
| An account is created only by sign-up or provisioning (FR-027, FR-028) | The two call sites are the only writers; `role` is written literally at each, never from a request body |
| Status is a closed two-value set (FR-016) | `CHECK` constraint |
| The attempt count is consecutive and only a failed verification increments it (FR-009) | One conditional `UPDATE` in `apps/api/src/modules/users/repository/user-lock.ts`, called by the sign-in and change-password services through the lock port; the isolation is asserted by the tests named in SC-007 |
| The lock is a time bound alone (FR-009) | `locked_until`; an attempt while it is in force reads and writes neither counter nor bound, and the same `users` repository is the only writer of both columns after account creation |
| The forced change is cleared by that change alone (FR-028) | `must_change_password` is written in exactly one service operation |
| Merchant scope (FR-053) | `sessions.user_id` is the scope key; the shared entry point supplies it; no route takes an account id from the request; a row outside the caller's scope is answered as absent — the same not-found answer a row that does not exist receives |
| No merchant deletes an account (FR-018) | No delete path exists; no role, status, or route offers one |

**Deletion.** No R1 path deletes a `users` row. Blocking leaves every column
untouched except `status` (FR-019, and R13 performs it).

## 5. Entity `Session` — table `sessions`

One server-side session, created at sign-in or at verification. The merchant
holds only the opaque token in an `HttpOnly` cookie; the row is the authority.

| Column | Type | Null | Default | Constraint / note |
|---|---|---|---|---|
| `id` | `text` | no | — | Primary key; library-generated |
| `user_id` | `text` | no | — | `REFERENCES users(id) ON DELETE CASCADE`; indexed |
| `token` | `text` | no | — | `UNIQUE`; `char_length(token) >= 32`. The library's session token (32 random bytes), never logged and never returned in a response body |
| `expires_at` | `timestamptz(3)` | no | — | `created_at + interval '12 hours'` — the absolute maximum lifetime (FR-032, CMV 4). Written once; the library's sliding update is disabled (`update_age` = 12 h, research R-04) |
| `last_activity_at` | `timestamptz(3)` | no | `now()` | The inactivity clock (FR-032, CMV 4). Written at most once per 60 s per session, and only for a merchant-initiated request (§9) |
| `revoked_at` | `timestamptz(3)` | yes | — | Tombstone. Set when the session ends for any reason other than pure expiry |
| `revoked_reason` | `text` | yes | — | `CHECK (revoked_reason IN ('sign_out', 'sign_out_all', 'password_change', 'blocked', 'platform_revocation', 'inactivity'))`; `CHECK ((revoked_at IS NULL) = (revoked_reason IS NULL))` |
| `ip_address` | `text` | yes | — | Library field; the address the session was created from |
| `user_agent` | `text` | yes | — | Library field; truncated to 512 characters by the service |
| `created_at` | `timestamptz(3)` | no | `now()` | |
| `updated_at` | `timestamptz(3)` | no | `now()` | |

**Indexes**

| Index | Columns | Kind | Serves |
|---|---|---|---|
| `sessions_pkey` | `id` | primary key | — |
| `sessions_token_key` | `token` | unique | Every authenticated request |
| `sessions_user_id_idx` | `user_id` | b-tree | Sign-out everywhere, password-change revocation, FR-053's scope |
| `sessions_revoked_at_idx` | `revoked_at` | partial, `WHERE revoked_at IS NOT NULL` | The 24-hour sweep |
| `sessions_expires_at_idx` | `expires_at` | b-tree | The sweep of expired rows |

**State machine**

```
                 sign-in / verification
                            |
                            v
                         +------+
                         | live |
                         +--+---+
        merchant or platform |        absolute lifetime
        action, inactivity,  |        (expires_at, no write)
        block                |                 |
                            v                 v
                     +------------+    +-------------+
                     | revoked    |    | expired     |
                     | (tombstone)|    | (no marker) |
                     +-----+------+    +------+------+
                           | 24 h             | 24 h
                           v                  v
                         deleted           deleted
```

| From | Trigger | To | Written by |
|---|---|---|---|
| — | Successful sign-in (FR-007) | live | `auth.service.signIn` |
| — | Correct code at sign-up, in the account transaction (FR-004) | live | `auth.service.verifySignUp` |
| — | Administrator's first sign-in (FR-028) | live, restricted | `auth.service.signInAdministrator` |
| live | Sign-out (FR-010) | revoked, `sign_out` | `auth.service.signOut` |
| live | Sign-out of every device (FR-011) | revoked, `sign_out_all` | `auth.service.signOutAll` |
| live | Password change or reset (FR-013) | revoked, `password_change` | `auth.service.changePassword` / `resetPassword` |
| live | Platform revocation (FR-012) | revoked, `platform_revocation` | `cli/revoke-session` |
| live | Account blocked and the session is used (FR-019) | revoked, `blocked` | Shared entry point |
| live | Request arrives after `last_activity_at + 30 min` (FR-032) | revoked, `inactivity` | Shared entry point |
| live | Request arrives after `expires_at` | no write; the row is past its absolute lifetime | Shared entry point (read-only refusal) |
| revoked | 24 h after `revoked_at` | deleted | Hourly sweep |
| live | 24 h after `expires_at` | deleted | Hourly sweep |

**Refusal semantics of the entry point** (the order is observable and asserted;
FR-049, FR-053, research R-20)

| Condition | Result |
|---|---|
| No session cookie, or a token that matches no row | No session — the request continues as a guest; `GET /auth/session` answers `{ authenticated: false }` |
| Token matches a revoked row with `blocked` | `401 ACCOUNT_BLOCKED` — the blocked variant of the ended-session state |
| Token matches a revoked row with any other reason | `401 SESSION_ENDED` |
| Row live, the account's `status = 'blocked'` | Row marked `blocked`, `401 ACCOUNT_BLOCKED` |
| Row live, `expires_at <= now()` | `401 SESSION_ENDED` |
| Row live, `last_activity_at + 30 min < now()` | Row marked `inactivity`, `401 SESSION_ENDED` |
| Row live, `must_change_password` and the route requires an unrestricted account | `403 PASSWORD_CHANGE_REQUIRED`; the session stays live |
| Row live, account active, route allowed | Request context carries `userId`, `role`, `restricted`, `sessionId` |

The account's status is read once per request, at the entry point, so a block
reaches the session's next request: a request already past the entry point when
the block is recorded is decided on the state it met and is not interrupted,
while the next request bearing the token finds the account blocked, is refused
`ACCOUNT_BLOCKED`, and tombstones the row with `blocked` — after which every
later request reads the tombstone and receives the same refusal (FR-019).

The blocked variant is reachable only from a token that once denoted a live
session, so it tells nothing to a caller who never held one (FR-049, research
R-04). No message, status, or header distinguishes "never signed in" from
"expired at 12 hours and swept" — both are the guest state. The block is decided
before both clocks, so an ended-session state is never shown for a blocked
account and never offers a sign-in the block would refuse.

## 6. Credential store — table `accounts`

| Column | Type | Null | Default | Constraint / note |
|---|---|---|---|---|
| `id` | `text` | no | — | Primary key |
| `user_id` | `text` | no | — | `REFERENCES users(id) ON DELETE RESTRICT`; indexed |
| `account_id` | `text` | no | — | The subject the provider identifies; for the credential provider, the user id |
| `provider_id` | `text` | no | — | The library's provider identifier. R1 configures the password credential only; the integration test asserts one distinct value across all rows, and a later slice that adds a provider extends that test with its own migration |
| `password` | `text` | yes | — | The scrypt encoding from CMV 2: `$wafar$scrypt$32768$8$3$<salt>$<hash>`. `CHECK (password IS NULL OR password LIKE '$wafar$scrypt$%')`; the credential row is non-null, asserted by the integration test |
| `access_token` / `refresh_token` / `id_token` | `text` | yes | — | Library fields; always `NULL` |
| `access_token_expires_at` / `refresh_token_expires_at` | `timestamptz(3)` | yes | — | Library fields; always `NULL` |
| `scope` | `text` | yes | — | Library field; always `NULL` |
| `created_at` / `updated_at` | `timestamptz(3)` | no | `now()` | |

**Indexes**: `accounts_pkey (id)`; `accounts_provider_account_key (provider_id, account_id)` unique; `accounts_user_id_idx (user_id)`.

**Notes.** The row is created in the same transaction as its `users` row: at
sign-up verification (the pending request's already-protected password is passed
to the library's hook, which recognises the `$wafar$scrypt$` prefix and stores it
unchanged, research R-07), and at provisioning. A password change rewrites this
one column. No row ever holds a second credential for the same account in R1.

## 7. Pending verification store — table `phone_verifications`

One row per normalized number, whatever its purpose or state. Owned by `users`;
written only through `users.repository.phoneVerifications` and the service port
the `auth` module calls.

| Column | Type | Null | Default | Constraint / note |
|---|---|---|---|---|
| `id` | `text` | no | — | Primary key, `crypto.randomUUID()`; also the code's scrypt salt |
| `phone_number` | `text` | no | — | `UNIQUE`. Canonical E.164 (FR-031). The unique index makes "one live request per number" true under concurrency |
| `purpose` | `text` | no | — | `CHECK (purpose IN ('sign_up', 'recovery'))` (FR-034) |
| `state` | `text` | no | `'pending'` | `CHECK (state IN ('pending', 'verified'))`; `CHECK (state <> 'verified' OR purpose = 'recovery')` — only recovery has a new-password step (FR-014, FR-034) |
| `code_hash` | `text` | no | — | scrypt with the request id as salt, encoded like a password hash (FR-034, research R-09). Never a plaintext code |
| `previous_code_hash` | `text` | yes | — | The code an accepted re-request superseded, protected the same way; an entry of it is refused as expired and never increments `incorrect_entries` (FR-034). `CHECK (previous_code_hash IS NULL OR previous_code_hash LIKE '$wafar$scrypt$%')`. Cleared when a new request replaces the row |
| `code_expires_at` | `timestamptz(3)` | no | — | Dispatch time + 300 s (CMV 18) |
| `request_expires_at` | `timestamptz(3)` | no | — | Dispatch time + 300 s; restarted by every accepted dispatch (CMV 18, FR-034). The verified state never outlives it (FR-014) |
| `incorrect_entries` | `smallint` | no | `0` | `CHECK (incorrect_entries BETWEEN 0 AND 5)` (CMV 18) |
| `re_requests` | `smallint` | no | `0` | `CHECK (re_requests BETWEEN 0 AND 3)` (CMV 18) |
| `resume_token_hash` | `text` | no | — | SHA-256 hex of the 32-byte resume token (high entropy, so no slow hash). The cookie carries `<id>.<token>`; the hash is compared with `timingSafeEqual` |
| `full_name` | `text` | yes | — | Sign-up payload; `char_length(full_name) <= 100`. `CHECK (purpose = 'sign_up' OR full_name IS NULL)` |
| `city` | `text` | yes | — | Sign-up payload, an entry of the fixed list. Same check as `full_name` |
| `shop_name` | `text` | yes | — | Sign-up payload, optional, `<= 100` characters |
| `password_hash` | `text` | yes | — | The submitted password, protected at submission by the CMV 2 profile. `CHECK (purpose = 'sign_up' OR password_hash IS NULL)`; `CHECK (password_hash IS NULL OR password_hash LIKE '$wafar$scrypt$%')` |
| `verified_at` | `timestamptz(3)` | yes | — | Set when recovery's code is verified. `CHECK ((state = 'verified') = (verified_at IS NOT NULL))` |
| `created_at` | `timestamptz(3)` | no | `now()` | |
| `updated_at` | `timestamptz(3)` | no | `now()` | |

**Indexes**: `phone_verifications_pkey (id)`; `phone_verifications_phone_number_key (phone_number)` unique; `phone_verifications_request_expires_at_idx (request_expires_at)` for the hourly sweep.

**No foreign key.** A pending sign-up precedes any `User` row by design
(FR-004); a foreign key would make the store impossible. The row carries no
merchant identity and is read by the `users` module alone.

**State machine and every transition** (FR-034, FR-014, FR-038)

| From | Trigger | To | Notes |
|---|---|---|---|
| — | Accepted sign-up submission | `pending` / `sign_up` | The row is written only after the channel accepts the message, and the code is dispatched inside the request that asked for it (§7, send rule) |
| — | Accepted recovery submission | `pending` / `recovery` | Same |
| `pending` | New sign-up or recovery request for the same number | replaced in place | Purpose, payload, code hash, both expiries, counts reset; the previous code stops being valid at once (FR-034) |
| `pending` | Accepted re-request | `pending`, new code | `re_requests + 1`, `code_hash` replaced (the superseded value kept in `previous_code_hash`), both expiries restarted (FR-034, CMV 18) |
| `pending` | Correct code, purpose `recovery` | `verified` | `verified_at = now()`; the code can never be verified again (FR-014) |
| `pending` | Correct code, purpose `sign_up`, number has no account | deleted, with the account and session created | The code is consumed only by the creation (FR-034) |
| `pending` | Correct code, purpose `sign_up`, number already has an account of any role or status | deleted | The outcome is stated on the page; no account is created and the submitted password is discarded (FR-006) |
| `pending` | 5th incorrect entry | deleted | The page returns to step one with the ended notice (FR-034, CMV 18) |
| `pending` | `request_expires_at` or `code_expires_at` passed | logically expired; deleted by the sweep | A late code is refused as expired and does not increment the count (FR-034) |
| `verified` | New password set | deleted | The reset completes in one transaction with the revocation and the notice (FR-014) |
| `pending` (purpose `recovery`) | Password changed by another path | deleted | FR-014; a recovery request that has not reached the verified state is a reset authority too, so it ends with the same act |
| `verified` | Password changed by another path | deleted | FR-014; the `auth` service deletes any recovery row for the number |
| `verified` | New request for the number | deleted, replaced by a `pending` row | Two authorities never coexist (FR-034) |
| `verified` | `request_expires_at` passed | deleted | A submitted password after that moment is refused on the expiry ground (FR-014) |
| `pending` | The account for the number is removed | deleted | FR-018; the row carries no account reference, so the removal deletes it by the normalized number, and no live request or usable code outlives the account |
| `verified` | The account for the number is removed | deleted | FR-018; no reset authority outlives the account |

**Two password writes never both take effect.** A password change and a reset for
one number can arrive together. Each write re-checks its own authority inside
the transaction that writes the credential — the change the live session and the
current password, the reset the `verified` row — and the write that commits first
removes the other's authority in that same transaction: the change deletes the
recovery row, and the reset revokes every session with `password_change`. The
other submission finds its authority gone, writes nothing, and is refused on the
ground its path already has (`RECOVERY_EXPIRED` for the reset, `SESSION_ENDED`
for the change), so the credential the winning write committed is the final one
and no session that existed at that commit survives it (FR-013, FR-014). No
column and no table is added: the row in `phone_verifications` and the
revocation in `sessions` are the authorities the two writes contend on, and
`accounts.password` is written once, by the winning transaction.

**The send rule is transactional with the row.** A row is written only after the
messaging channel accepts the message: the service generates the code and the
protected value, calls the port, and on `accepted` writes (or replaces) the row
and restarts both expiries. On `refused` or `timed_out` it writes nothing — the
previous row, if any, keeps its code and expiry, and neither
`re_requests` nor `incorrect_entries` moves (FR-034). This ordering is what
makes "exactly one valid code at all times" true without a window in which the
store holds a code that was never delivered.

**A failed send after acceptance** is outside the platform's observation and is
not a failure state (FR-034).

**The re-request allowance and the incorrect-entry bound are per row.** A new
row starts both at zero (FR-034).

## 8. Library placeholder — table `verifications`

| Column | Type | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `text` | no | — | Primary key |
| `identifier` | `text` | no | — | Indexed |
| `value` | `text` | no | — | |
| `expires_at` | `timestamptz(3)` | no | — | |
| `created_at` / `updated_at` | `timestamptz(3)` | no | `now()` | |

**Index**: `verifications_identifier_idx (identifier)`; primary key `id`.

**Why it exists, and why it must stay empty.** The adapter's model set includes
`verification`; omitting the table leaves the library's schema incomplete and
invites a second store later. It stays in `0001_identity_foundation` for that
reason rather than being deleted: the table is the adapter's declared model, not
an R1 product store. R1's extension is configured so that no library feature
writes it: the phone-number hooks own both code paths and `emailAndPassword`'s
verification flow is unused. The integration suite asserts
`count(verifications) = 0` after every flow — a non-zero count means a second
verification store appeared, which FR-034 and the domain model forbid. The plan
records the same reason in Gate 2 → Schema and Migration Control and B1/T032.

## 9. Rate-limit counters — table `rate_limit_counters`

| Column | Type | Null | Default | Constraint / note |
|---|---|---|---|---|
| `key` | `text` | no | — | `<operation>:origin:<ip>` or `<operation>:number:<e164>`; `char_length(key) <= 128` |
| `window_start` | `timestamptz(3)` | no | — | Floor of the request time to the 15-minute boundary (CMV 3) |
| `count` | `integer` | no | `0` | `CHECK (count >= 0)` |
| `expires_at` | `timestamptz(3)` | no | `window_start + interval '15 minutes'` | |
| `created_at` | `timestamptz(3)` | no | `now()` | |

**Primary key**: `(key, window_start)` — the atomic increment is
`INSERT … ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
RETURNING count`, one statement, no read-modify-write race. **Index**:
`rate_limit_counters_expires_at_idx (expires_at)` for the sweep.

**Operations and their budgets** (CMV 3; FR-029, FR-033). One budget per
operation, two keys each:

| Operation | Origin key | Number key |
|---|---|---|
| `account_creation` (the sign-up form's own limit; counts every submission, including honeypot and too-fast refusals) | 20 / 15 min | 3 / 15 min |
| `sign_in` | 60 / 15 min | 20 / 15 min |
| `recovery` | 20 / 15 min | 3 / 15 min |

- A malformed or unnormalizable value has no number key: only the origin is
  counted, so a bad value spends no number's budget (FR-033).
- The `origin` in the key is the network origin `contracts/auth-api.md` §2.5
  derives — the trusted proxy's `X-Real-IP`, or the peer's own address when the
  peer is not the proxy — and never the web `Origin` header, which names the
  allowlisted site rather than the client.
- The number key is global to the number: a spent number key refuses that number
  from every origin, while every other number is unaffected (FR-033).
- The code step's entry and its re-request control are not counted against these
  budgets (FR-033, FR-034).
- **The aggregate code-guess ceiling is not a counter.** 30 incorrect code
  entries per number per 15-minute window (CMV 3) is the product of the
  per-request bound (5) and the fresh requests the number key allows (3 account
  creation + 3 recovery), so `rate_limit_counters` gains no `code_entry` key and
  the entry path writes nothing: the seventh fresh request for a number is
  refused by its number key exactly as any other over-budget request, and the
  ceiling resets with that key's window (FR-034).
- **The aggregate one-time-code message ceiling is not a counter.** 24 accepted
  dispatches per number per 15-minute window (CMV 3) is the product of the
  dispatches a pending request allows (1 first dispatch + 3 re-requests) and the
  fresh requests the number keys allow (3 account creation + 3 recovery), so
  `rate_limit_counters` gains no `sms` key and the dispatch path writes nothing
  beyond the two existing keys: the seventh fresh request for a number is refused
  by its number key, the fifth dispatch by the pending request's re-request limit,
  and the ceiling resets with that window (FR-034). A dispatch the channel refuses
  at acceptance sends nothing and is not counted; the FR-043 notices are outside
  the ceiling.
- A refusal is the distinct `RATE_LIMITED` response with `Retry-After` in
  seconds (never a distinct message that names an account), and it is outside
  SC-004's comparison.
- **The form stamp is not stored.** The value FR-029 measures the minimum
  time-to-submit from is a signed payload carrying its own issuance time and the
  destination `sign_up_form` (CMV 3; `contracts/auth-api.md` §5.1–§5.2). No table
  gains a column, no row is written when it is issued, and none is written or
  deleted when a submission presents it, so the sign-up form adds no entity, no
  key, and no lifecycle: its reuse is bounded by its 30-minute window and by the
  account-creation budget's two keys.

**The lock is not a counter here.** `failed_sign_in_count` and `locked_until`
live on `users` because the lock is an account property (FR-009, ADR-105).
Only the `users` module's `user-lock.ts` repository writes them after account
creation, through the lock port declared in `packages/shared` (plan → Gate 1
→ X; §1).

## 10. Relationships

```
users 1 ──────< sessions          (user_id; FR-010 … FR-013, FR-032, FR-053)
users 1 ──────  accounts          (user_id; credential, exactly one per provider in R1)
users 1 ──────< phone_verifications   (by phone_number, not a foreign key; a pending
                                   sign-up exists before any user does)
```

No other relationship is introduced. `User` → catalogs, bookmarks, notifications,
and conversation belong to later slices and are not declared here — a foreign key
to a table that does not exist cannot be created.

## 11. Reference data (files, not tables)

| Dataset | Path | Shape | Rules | Pinning |
|---|---|---|---|---|
| Libyan cities | `packages/shared/src/reference/libyan-cities.json` | Object envelope — `entries` (a flat array of Arabic name strings), `governorateCount`, `entryCount`, `version`, `sha256`, and the `SOURCE` note; no id, no Latin name | Unique and non-empty entries; every one of the **22** governorates present, each with at least one city or area entry; `entryCount` equals `entries.length` and the count in `SOURCE`; stored value is the entry exactly (FR-005) | Source (the Libyan administrative-division reference, the 22 governorates of the 2007 division), version **`2.0.0`** (2026-11-09), the 22-governorate reference count, the file's total entry count, and the SHA-256 digest of `entries` in the package's `SOURCE` note; ADR-152 as amended by ADR-161 records the set |
| Libyan mobile prefixes | `packages/shared/src/reference/libyan-mobile-prefixes.json` | Array of the national significant number's leading `9x` pairs | A number is valid when it normalizes to `+218` + a listed prefix + exactly seven digits (FR-003) | Version and SHA-256 digest in the package's `SOURCE` note; an ADR records the set |
| Breached passwords | `apps/api/src/modules/auth/data/breached-passwords.sha256` (+ `SOURCE`) | One lowercase SHA-256 hex digest per line, 100,000 lines | Membership test only; loaded once at boot into a `Set`; no network call (FR-035, CMV 17) | Version + digest in `SOURCE`; quarterly refresh through the dependency-update process |

The city list and the prefix set are bundled into the web build and read by the
API from the same package, so the two surfaces cannot disagree. Neither is a
database table: a table would let environments diverge and would look like a
thirteenth entity (research R-10). The 22-governorate reference is the city
list's completeness floor: a missing governorate fails the unit test, and a
truncated file fails the entry-count assertion (plan → Verification Notes;
research R-10).

## 12. Normalization and validation

| Rule | Where enforced |
|---|---|
| Mobile number → E.164 (`+218` + 9 digits) | `normalizePhone` in `packages/shared/src/normalize`: strip separators and spaces; map Arabic-Indic and Eastern Arabic-Indic digits to Latin; read a leading national zero as part of the national number; read a leading `+218` or `00218`/`218` once, never doubled; require a listed prefix and exactly nine national digits (FR-003, FR-031, FR-042) |
| One-time code → six Latin digits | `normalizeCode`: the same digit mapping; exactly six digits after trimming. A six-digit value that differs from the live code is a wrong guess and consumes the incorrect-entry bound; a value that is not six digits is malformed, is refused on that ground, and does not consume the bound, because FR-034 counts only "a wrong value entered for the code that is currently valid" (FR-031, FR-034) |
| Arabic search text | `normalizeArabic`: strip diacritics and tatweel; unify alef/hamza forms, ya/alef maqsura, and ta marbuta; lowercase has no effect on Arabic. Used by the city combobox only, never for storage |
| City | Exact membership in the list `§11` records (source, version, 22 governorates, entry count); the stored value is the entry's name |
| Full name / shop name | Trim; presence and `<= 100` code points; accepted as typed within the bound, except that a value carrying an emoji — the predicate FR-026 fixes — is refused with an explicit message naming the reason (FR-001, FR-026, CMV 19) |

Every rule above is also a server-side rule: the web applies the same functions
from `packages/shared` for immediate feedback, and the API re-applies them before
any write, so a client that bypasses the form changes nothing.

## 13. Migration

**Two migrations**, generated by `drizzle-kit generate` from the two schema
files and reviewed by hand. The first,
`packages/db/migrations/0001_identity_foundation.sql`, creates, in this order:

1. `users` (no dependencies)
2. `accounts` (→ `users`)
3. `sessions` (→ `users`)
4. `verifications` (no dependencies; the library's placeholder — §8 — not an R1 product store)
5. `phone_verifications` (no dependencies)
6. `rate_limit_counters` (no dependencies)

then every index and check constraint of §§4–9. The second,
`packages/db/migrations/0002_identity_foundation_previous_code.sql`, adds
`phone_verifications.previous_code_hash` with its form check (§8). There is no
backfill: the schema is new. **Rollback** is the paired down files applied in
reverse order — `0002_identity_foundation_previous_code.down.sql` removes the
column and its check, then `0001_identity_foundation.down.sql` drops the six
tables in reverse dependency order — so the journal returns to zero; no type is
created, so no type is dropped. Destructive future changes follow
expand/backfill/contract; both migrations are additive only.

**Migration control** (plan → Gate 2): no second migration tool; better-auth's
`auth migrate` CLI is disabled; the migrator runs from `packages/db` in the
deployment step and in CI before the integration suite. `drizzle-kit push` is
never used outside a throwaway local database.

## 14. Retention and sweeps

| Store | Retention | Mechanism |
|---|---|---|
| `phone_verifications` | Ends at its own expiry; a row is deleted when replaced or consumed | Hourly idempotent sweep: `DELETE … WHERE request_expires_at < now()` (a verified row shares the same bound) |
| `rate_limit_counters` | The window plus one hour | Hourly sweep: `DELETE … WHERE expires_at < now()` |
| `sessions` | 24 hours after revocation or expiry | Hourly sweep (§5) |
| `verifications` | Nothing to retain | Asserted empty |
| `users`, `accounts` | As long as the account is registered (FR-018) | No R1 deletion; no retention period is asserted |

The three sweeps are single statements with a bounded row count at R1's volume
(≤ 500 sessions, ≤ one pending row per submitting number) and are safe to run
concurrently: the statements are idempotent and take no lock beyond the rows
they delete. They run from the API process's scheduler at the top of each hour,
guarded by a PostgreSQL advisory lock so two instances do not double-run.

## 15. Security and data handling

- **No plaintext secret at rest**: passwords (stored and pending) are scrypt
  encodings; one-time codes are scrypt encodings salted with the request id;
  the resume token is a SHA-256 digest of 32 random bytes. Nothing reversible is
  stored for any of them.
- **Nothing secret in a log**: the phone number, the code, the password, the
  token, the hash, and the resume value never appear in a structured record. The
  security events FR-037 names carry the event name, a correlation id, and
  non-identifying facts (outcome, reason code, latency).
- **No PII in responses beyond the caller's own**: `GET /auth/session` returns the
  caller's name only; the code step's read-only fields come from the resume read
  (§5.3.1), which returns the pending row's own payload and never an account row.
- **Tokens**: the session token lives only in the `HttpOnly` cookie and the
  `sessions` row; no browser storage, no response body, no URL.
- **Timing**: the sign-in path always performs one scrypt verification; the
  decoy hash is a constant with the same parameters, generated once at boot
  (research R-05).
- **Backups**: the database contains the rows above; every archive is sealed
  before it leaves the host (AES-256-GCM, ADR-142), and the keys are the
  operator's (R12's secret manager). The RTO/RPO in CMV rows 8–9 cover this
  schema.

## 16. What this model deliberately does not add

| Not added | Why |
|---|---|
| A thirteenth entity, a `Verification` entity, or a `Credential` entity | Key Entities and the register fix twelve; the states are classified in §2 |
| `deleted_at` on `users` | Soft deletion is R13's act; R1 ships no transition (FR-016, FR-018) |
| An appearance column | The appearance is per device in the browser (ADR-137, Clarifications) |
| An `email` with a routable domain, or an email transport | The product has no email channel; the placeholder is the library's requirement (Complexity Tracking row 15) |
| A `cities` table or a `mobile_prefixes` table | Reference files, one source, bundled (research R-10) |
| A `password_history` table | FR-035 keeps no history; the register provides no entity |
| A `sessions.restricted` column | The restriction is computed from `users.must_change_password` at request time, never copied (research R-20) |
| A second store for codes or counters | FR-034 and research R-02/R-06 fix one of each |
| A stored channel-latency table for the silent refusal's wait | The wait reads one in-memory scalar the dispatch port keeps — no identity, no column, no persistence, reset with the process — so the data model gains no store (FR-029, AC-031; plan record 15) |
| A retention period or a retention job for accounts | FR-018 fixes none; the register states none |
