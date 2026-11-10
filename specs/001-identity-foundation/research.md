# Phase 0 Research — Identity and Foundation

**Feature**: `001-identity-foundation` | **Date**: 2026-10-29 | **Plan**: [plan.md](./plan.md)

Every unknown in the Technical Context is resolved below, and every value the
plan records under Constitution Mandated Values has its rationale here. The
specification's Clarifications section is the authority for product behaviour;
this file decides only the technical shape.

## R-01 — The authentication library and the phone-number extension

**Decision**: better-auth 1.6.14 with its `phoneNumber` extension is the
credential and session engine. The extension is configured with:

- `sendOTP({ phoneNumber, code })` — the `auth` module writes (or replaces) the
  single pending request for that number in the `users`-owned store and hands
  the code to the SMS port.
- `verifyOTP({ phoneNumber, code })` — a custom verifier that checks the code
  against the same store (expiry, attempts, replacement, hash) instead of the
  library's `verification` table, so exactly one store exists.
- `signUpOnVerification` — enabled, with `getTempEmail` returning the reserved,
  non-routable sentinel the plan fixes — the canonical number without `+`, then
  `@phone.invalid` (`+218912345678` → `218912345678@phone.invalid`) — and
  `getTempName` returning the submitted full name; this is what lets the library
  create the user only at verification, with no `User` row before it.
- `allowedAttempts: 5` and `expiresIn: 300` are mirrored in our store; the
  library's own counters are never the authority.
- The library's scrypt password hooks are replaced with the profile in CMV row 2
  (see R-07), and the phone-number password sign-in path uses the same hooks.

**The library's HTTP handler is not mounted.** Every public endpoint the pages
call is an R1 route in the `auth` module; the module calls `auth.api.*`
server-side. This keeps the two-key rate limits, the honeypot, the refusal
order, the lock, the status/role checks, and the uniform response under R1's
control, and it prevents a client from reaching the library's own endpoints and
bypassing them. The session cookie the library sets is forwarded by R1's route.

**Rationale**: ADR-030 makes the extension mandatory unless an ADR records an
alternative, and the library must own password hashing, credential verification,
session issuance, and revocation. The extension's `signUpOnVerification` +
`verifyOTP` hooks are the two seams that let the product's invariants (no user
before verification, one pending request, hashed codes, the recovery verified
state) live in our store while the library remains the authentication engine.

**Alternatives considered**:

- *Mount the library's `/api/auth/*` handler and let the pages call it.*
  Rejected: the extension's endpoints would accept sign-up and sign-in requests
  that bypass the rate limits, the honeypot, the refusal order, the lock, and the
  uniform timing work — all of which the specification makes binding.
- *Use the extension's `verification` table as the pending store and add a
  second table for the form details.* Rejected: two stores would break the
  one-live-request-per-number invariant and the replacement rules, and the
  library's table is not specified to hold a hashed code or the form payload.
- *Record an ADR alternative to the extension and keep only the core session
  engine.* Rejected for now: the extension gives the phone credential, the OTP
  hooks, and the phone+password sign-in path as maintained code; the documented
  hooks cover every invariant. If a future upgrade removes a hook, the
  ADR-recorded alternative is the fallback, not a silent fork.

**Consequence recorded**: better-auth's user model requires a unique value in
its `email` column. R1 stores the reserved, non-routable sentinel formed from
the canonical number without its leading `+`, then `@phone.invalid`:
`+218912345678` is stored as `218912345678@phone.invalid`. The
`.invalid` TLD is reserved by RFC 2606 and can never receive mail. The value is
never displayed, never used for sign-in, never used for a message, and no email
transport exists. The deviation, the ADR, and the domain-model note are in
Complexity Tracking row 15.

## R-02 — One transient store for pending requests

**Decision**: `phone_verifications`, owned by `users`, is the single store. One
row per normalized number (unique index), replaced in place by a new sign-up or
recovery request. Columns: identity, purpose, state, code hash, code expiry,
request expiry, incorrect-entry count, re-request count, resume-token hash, and
the sign-up payload (full name, city, shop name, protected password). The
browser's resume reference is an `HttpOnly` cookie carrying `<requestId>.<token>`;
the server compares the token's hash.

**Rationale**: A unique index is the only mechanism that makes "exactly one
pending request per number" true under concurrency; a Redis key with a TTL would
also work but would put the form payload, the replacement rule, and the verified
state in a store with weaker durability and no transactional replacement. Lazy
expiry (`request_expires_at > now()`) plus an hourly idempotent sweep keeps the
table small, and the row's expiry is the only TTL authority.

**Alternatives considered**:

- *Redis with TTL keys.* Rejected: no transactional replace-and-read, no
  durable evidence for the integration tests, and R3 owns the Redis client
  choice (register gap) — R1 must not pre-empt it.
- *A `verification` row per code.* Rejected: replacement and the verified state
  would need a second row and a rule to pick the live one; the unique number is
  the invariant.
- *In-process memory.* Rejected: it breaks on restart and in more than one API
  instance, and the pending request must survive a page reload.

## R-03 — The recovery flow's verified state

**Decision**: A recovery request whose code is verified moves the same row to
`state = 'verified'`, records `verified_at`, and keeps `request_expires_at` as
the upper bound (the verified state never outlives the request). The row's
`purpose` stays `recovery`. A new request for the number replaces the row in any
state; setting the password deletes it; a password change by another path
deletes it. The code cannot be verified a second time.

**Rationale**: The specification requires the code to stop being usable at
verification and the new-password step to survive a reload. Reusing the row is
the smallest state machine that satisfies both, and the "one row per number"
invariant makes "two authorities never coexist" mechanical.

**Alternatives considered**: A separate `verified` table (rejected: two rows for
one number, a replacement rule in two places); a signed token carrying the
verified state (rejected: a stolen token would set a password without the
server-side expiry and replacement rules).

## R-04 — The session policy: two clocks, activity, and tombstones

**Decision**:

- The library's session has `expires_at = created_at + 12 h` and
  `update_age = 12 h`, so it never slides; the absolute maximum lifetime is the
  library's expiry.
- R1 adds `last_activity_at`, `revoked_at`, and `revoked_reason`
  (`sign_out`, `sign_out_all`, `password_change`, `blocked`,
  `platform_revocation`, `inactivity`) to `sessions`.
- The shared entry point calls the library's session lookup, then applies R1's
  policy: the session is refused when `revoked_at` is set, when
  `last_activity_at + 30 min < now()`, or when the account is blocked.
- Activity is recorded only when the request carries the web client's
  `X-Wafar-Activity: 1` header, which the client sets from a user-initiated
  event handler (pointer, key, submit) and throttles to one per 60 seconds; the
  header is covered by the CSRF token and the same-origin policy. Background
  requests never carry it.
- Revocation sets `revoked_at` and the reason instead of deleting the row; a
  sweep deletes revoked rows after 24 hours. A request carrying a token whose
  row is revoked with `blocked` receives the blocked variant of the
  ended-session state; every other ended reason receives the generic variant.

**Rationale**: The specification requires both clocks, requires that only
merchant-initiated actions reset the inactivity clock, requires that a session
survive a browser restart, and requires the blocked variant to be shown only to
a person who held a valid session. A tombstone row is the only way to tell that
person apart from an unknown caller without leaking the status of an account to
someone who never held a token.

**Alternatives considered**: Deleting sessions on revocation (rejected: the
blocked variant becomes impossible without a status lookup that leaks); sliding
the library's expiry on every request (rejected: a background request would keep
the session alive, which the spec forbids); a separate revocation table
(rejected: the session row already identifies the token's holder).

## R-05 — Uniform responses and the timing test

**Decision**: The sign-up and recovery submission paths never look up an
account before the code is verified, so their work is identical by
construction. The sign-in path always performs exactly one password verification
against the account's hash, or against a decoy hash with the same scrypt profile
when no account exists; then it applies the lock, status, and role checks in a
fixed order and returns one of two transcripts:

- the uniform refusal (`401`, `AUTH_INVALID_CREDENTIALS`) for an unknown number,
  a wrong password, a locked account, a blocked account, or an administrator
  account on the merchant surface — same body, same status, same headers;
- the success path (session created) only for an active merchant with the
  correct password.

The enumeration test samples 200 requests per case after a 20-request warm-up,
drops the top and bottom 5% of durations, and asserts: identical body, status and
response path; median difference ≤ 50 ms; p95 difference ≤ 150 ms. It compares
the unknown number against a wrong password, a locked account, a blocked
account, and an administrator account.

**Rationale**: The spec requires the same work, the same text, the same status,
the same path, and the same duration, with a numeric tolerance stated by the
plan. A decoy verification is the only way an unknown number does the same
password work; the tolerance absorbs scheduler noise without letting a
10×-faster no-account path pass.

**Alternatives considered**: A fixed artificial delay (rejected: it hides a
missing verification and is not "the same work"); comparing means (rejected: a
mean hides a tail difference and is not a percentile budget); asserting only the
transcript (rejected: the spec requires duration too).

## R-06 — Rate limiting and the lock, without Redis

**Decision**: Two Postgres tables, both owned by `auth` and both non-entity
operational state:

- `rate_limit_counters(key, window_start, count, expires_at)` with a primary key
  on `(key, window_start)` and an atomic
  `INSERT … ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
  RETURNING count`.
- The lock lives on `users` (`failed_attempt_count`, `locked_until`) and is
  updated with a single conditional statement in the same transaction as the
  failed verification.

A fixed 15-minute window is used for the three authentication operations; keys
are `op:origin:<ip>` and `op:number:<e164>`. A malformed value has no number
key. Rows are removed by the hourly sweep once `expires_at < now()`.

**Rationale**: The volume is at most 10 authentication requests per second, so
Postgres is far below its capacity, and the counters share the transaction and
backup story of the rest of the identity state. It avoids introducing the Redis
client — a register gap R3 owns — before R3 exists, and it keeps R1's dependency
and operational surface to one datastore.

**Alternatives considered**: Redis counters (rejected: a register gap owned by
R3, and a second consistency domain); in-memory counters (rejected: they break
across instances); a token bucket in the API (rejected: same instance problem
and no audit trail).

## R-07 — Password hashing and the protected pending password

**Decision**: scrypt with N = 32768, r = 8, p = 3, dkLen = 64, a 16-byte random
salt, encoded as `$wafar$scrypt$32768$8$3$<salt>$<hash>`; verification uses
`timingSafeEqual`. The same function produces the pending sign-up password at
submission, so the store never holds plaintext. The recovery reset and the
change action use the same function. The library's password hooks call this
function; the sign-up verification passes the already-hashed value through the
hook, which recognises the `$wafar$scrypt$` prefix and returns it unchanged.

**Rationale**: OWASP's scrypt profile at N = 2^15, r = 8, p = 3 is acceptable
and fits a 1 s p95 with a single verification; Node's `crypto.scrypt` is
built-in, adds no dependency, and is the library's supported hook. Carrying the
protected value is the only way to satisfy "no plaintext while the request
lives" and still create the account from the verified request.

**Alternatives considered**: Argon2id (rejected: a native dependency and a
second hashing implementation); bcrypt (rejected: 72-byte input limit and a
native dependency); holding the plaintext in the session (rejected: the spec
forbids it and a session store is not an option for an unauthenticated visitor).

## R-08 — Password policy: the local breached-password source

**Decision**: Minimum 12 characters, maximum 128 — the two values FR-035
delegates to the plan's Constitution Mandated Values row 17 (Clarifications
2026-11-01). The common-or-breached check is a membership test of the password's
lowercase SHA-256 hex digest against
`apps/api/src/modules/auth/data/breached-passwords.sha256`, a vendored list of
the top 100,000 entries of SecLists' `10-million-password-list-top-100000.txt`
(MIT), pinned by version and SHA-256 in a `SOURCE` file beside it and refreshed
quarterly through the dependency-update process. The list is loaded once at
boot into a `Set`; a match refuses with the "common or breached" reason. Three
messages exist: shorter than the minimum, longer than the maximum, and common or
breached, each carried by its contract code (`PASSWORD_TOO_SHORT`,
`PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`) and its row in
`contracts/ui-contracts.md` §6. The form states the requirements before the
field.

**Rationale**: The spec forbids an external service and requires the check to be
always available; a local hash set is deterministic, adds no network, and never
sends password material anywhere. Storing digests, not plaintexts, means the
file does not itself become a password list at rest.

**Alternatives considered**: Have I Been Pwned's k-anonymity API (rejected: an
external service, explicitly excluded); a hand-written common-word list
(rejected: not reproducible and too small); zxcvbn (rejected: a new runtime
dependency with a large model, and it does not answer "breached").

## R-09 — One-time codes

**Decision**: A 6-digit code from `crypto.randomInt(0, 1_000_000)`, zero-padded;
hashed with scrypt using the request id as salt; stored only as the hash. The
code is valid for 300 seconds. An accepted dispatch replaces the hash, restarts
the 300 seconds, and increments the re-request count (maximum 3). A refused or
timed-out dispatch changes nothing and consumes nothing. A wrong live code
increments the incorrect-entry count (maximum 5); an expired or superseded code
does not. At 5 the request is deleted and the page returns to step one. The
generated code is logged only by the SMS port's fake in tests, never in
production logs.

**Rationale**: 6 digits, 5 minutes, 5 attempts and 3 resends give a 5-in-1,000,000
guess chance per request while keeping the resend path usable; hashing the code
means a database read does not hand anyone a live code. The salt binding to the
request id makes a copied hash useless in another request.

**Alternatives considered**: 4 digits (rejected: too small a space with 5
attempts); 8 digits (rejected: harder to type on a feature phone for no material
gain with the attempt bound); TOTP (rejected: no shared secret and a clock-skew
surface the spec does not ask for).

## R-10 — The fixed Libyan city list and mobile-prefix dataset

**Decision**: Two committed JSON files in `packages/shared/src/reference/`:

- `libyan-cities.json` — an object whose `entries` is a flat array of strings,
  each entry one Arabic name (governorate, city, or area), with the qualifying
  governorate or level inside the name where a real name recurs. No Latin name,
  no separate id. Compiled from the Libyan administrative-division reference (the
  22 governorates of the 2007 division, with their cities and areas) and reviewed
  by the operator; version `2.0.0` (2026-11-09), superseding the 66-entry `1.0.0`
  sample. The envelope's `SOURCE` note records the source, the version, the
  reference count of **22 governorates**, the file's total entry count, and the
  SHA-256 digest of `entries`. A test asserts every entry's name is unique and
  non-empty, that every one of the 22 governorates is present with at least one
  city or area entry, that `entryCount` equals `entries.length`, and that the
  digest matches. Search uses `normalizeArabic()` (strip
  diacritics and tatweel; unify alef/hamza forms, ya/alef maqsura, and ta
  marbuta) and a substring match; the stored value is the entry's name exactly.
- `libyan-mobile-prefixes.json` — the valid +218 mobile prefixes (the national
  significant number's leading `9x` pair) with the operator label kept out of
  the product. A number is a Libyan mobile number when it normalizes to
  `+218` followed by a prefix in the set and exactly seven more digits.

The API validates against the same files; the web bundles the city list for the
combobox and never sends a free-typed value the API would reject. The datasets
are versioned by their version and file digest and recorded with an ADR; the
city list's `SOURCE` note carries the source, the version, the 22-governorate
reference count, the total entry count, and the digest.

**Rationale**: The spec fixes one list, one Arabic name per entry, no second
naming source, and no separate identifier; a flat string array is the smallest
shape that satisfies all three, and the envelope carries the count and digest
ADR-152 item 2 fixes (ADR-161). Bundling avoids a runtime dependency on the API
for the form and keeps the list identical in both places because it is one file.

**Alternatives considered**: A `cities` table (rejected: a second source that can
diverge per environment, and it would look like a thirteenth entity); Latin
transliterations (rejected by the spec); a remote dataset (rejected: the list is
fixed and must not change between releases); a completeness check that asserts
only that each governorate appears, without a recorded count (rejected: a
truncated file passes as long as the entries it kept are real places, so the
22-governorate reference and the recorded entry count are both asserted).

## R-11 — The SMS transport

**Decision**: An `SmsTransport` port with one method
(`send({ to, body, kind })` → `accepted | refused | timed_out`). The Twilio
adapter uses the REST API through the `twilio` SDK with a 750 ms timeout, no
in-request retry, and no fallback provider. The fake adapter records messages in
memory and is selected by `SMS_TRANSPORT=fake` in tests and CI. The message
bodies are fixed Arabic templates (see `contracts/ui-contracts.md`): the code
with Latin digits, no emoji. A failed or timed-out send is a refusal at
acceptance and is recorded as a dispatch failure.

**Rationale**: SC-009's 1 s p95 includes the wait for acceptance, so the provider
call must fit inside it; 750 ms leaves room for the rest of the request while
still being a realistic API timeout. The port keeps the provider replaceable and
makes the flows testable without the network.

**Alternatives considered**: Waiting for delivery (rejected: delivery is outside
the platform's observation and excluded from the budget); asynchronous send
(rejected: the spec requires the code step only after acceptance); a second
provider in-request (rejected: it doubles the latency and the failure surface).

## R-12 — The frame's composition and its structural verification

**Decision**: The shell primitives live in `packages/ui/app/components/shell/`:
`WfWordmark`, `WfShellHeader`, `WfShellSidebar`, `WfShellBottomBar`,
`WfShellFooter`, `WfAccountMenu`, `WfThemeSwitch`, `WfNavList`, and
`WfEndedSession`. `apps/web/app/layouts/shell.vue` composes them; no page uses
it in R1. They receive the navigation items, the footer links, and the
appearance variant as props; the route map and the item list come from
`packages/shared/src/routes.ts`. Structural tests mount the components with
`@nuxt/test-utils` and assert: the nine items in order with their hrefs; the
collapse control; the five bottom-bar slots and the raised `/parts` action; the
four footer links and the drawer's copy of them; the account menu's three items,
order, accessible names, roles, and keyboard reachability; the guest variant
(account and notifications replaced by the sign-in action, theme switch kept);
the logo/home target `/`; the notifications target `/notifications`; the theme
switch's `aria-pressed` and accessible name; every control's accessible name.

**Rationale**: The spec requires the composition to be built once and verified
structurally, with the runtime deferred to R2. A component test is the only
surface that renders the frame without shipping a page; props keep the layer
free of product routes, and one route map keeps the frame, the pages, and later
slices consistent.

**Alternatives considered**: A hidden preview route (rejected: it is a page);
Storybook (rejected: a second rendering surface and a dependency); Playwright
against a blank page with injected HTML (rejected: it would not mount the Vue
components or their accessibility semantics).

## R-13 — The route map and the bare pages

**Decision**: The route map in `packages/shared/src/routes.ts`:

| Destination | Route |
|---|---|
| Home | `/` |
| Parts | `/parts` |
| Catalog | `/catalogs` |
| Upload Catalog | `/upload` (ADR-126) |
| My Files | `/my-files` |
| Cart | `/cart` |
| Notifications | `/notifications` |
| Messages | `/messages` |
| Profile | `/profile` |
| Profile settings section | `/profile#settings` |
| Contact | `/contact` |
| Privacy Policy | `/privacy` |
| Terms of Use | `/terms` |
| FAQ | `/faq` |
| Sign up | `/auth/sign-up` |
| Sign in | `/auth/sign-in` |
| Password recovery | `/auth/forgot-password` |
| Guest sign-in action | `/auth/sign-in` |
| Logo/home control | `/` |
| Notifications control | `/notifications` |
| Sign-out | no route |

The three bare pages use `apps/web/app/layouts/bare.vue`: the non-interactive
wordmark above the page title, the title above the card, and the cross-links
(sign-in → sign-up and recovery; sign-up → sign-in; recovery → sign-in). The
pages are SSR-rendered, call no session endpoint, and render identically for a
signed-in person and a guest.

**Rationale**: FR-024 requires one decision record to fix every link the frame
and the bare pages build, so a later slice cannot choose a different route. A
single exported object is the only way both apps and the tests read the same
strings.

**Alternatives considered**: Per-component route literals (rejected: drift);
Nuxt's file-based routes as the only authority (rejected: the frame needs the
hrefs without importing pages, and the test needs the list).

## R-14 — Design conformance and the baseline set

**Decision**: The layer records the Precision tokens (ADR-128) in
`packages/ui/app/assets/css/tokens.css`; a Vitest contract test parses the token
file and asserts every recorded name and value, including the focus line, the
type scale, the measurements, and the appearance defaults. Playwright captures
the baseline for every shipped state in both appearances at 1280 and 375, plus a
320 light reflow capture; it waits for `document.fonts.ready` and uses the
pinned Chromium. Snapshots live under
`apps/web/tests/e2e/__screenshots__/` and are generated, never copied from
`docs/design/`.

**Rationale**: ADR-129 makes the baseline the gate and the lab evidence a
reference. Capturing both appearances follows ADR-137; 320 follows the spec's
reflow floor, and 375 remains the reference evidence width.

**Alternatives considered**: Diffing against the lab (rejected: different
environment and lab-only content); a single width (rejected: the reflow and the
narrow-screen checks are binding); visual review only (rejected: not a gate).

## R-15 — Security controls: CSRF, headers, encoding

**Decision**:

- **CSRF**: a `wafar.csrf` cookie (not `HttpOnly`, `SameSite=Lax`, `Secure` in
  production) is issued by `GET /api/v1/auth/csrf`; every mutation must send
  `X-Wafar-CSRF` equal to it (timing-safe compare) and an allowed `Origin`. A
  missing or wrong token returns `403 CSRF_FAILED`.
- **Headers**: the API middleware and the Nitro render hook set
  `Content-Security-Policy` (`default-src 'self'`; `script-src 'self'
  'nonce-<per-response>'`; no wildcard, no `'unsafe-inline'`, and no
  eval-permitting source; `frame-ancestors 'none'`),
  `Strict-Transport-Security` (production), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`. The nonce is
  injected into Nuxt's own inline scripts by `apps/web/server/plugins/csp.ts`.
- **Output encoding**: Vue's text interpolation is the only rendering path for
  user values; the code step's read-only full name is the test surface. A
  component test renders `<img src=x onerror=alert(1)>` and asserts the DOM
  contains text, not an element; an end-to-end test submits the same value and
  asserts it at the code step.

**Rationale**: The constitution requires all three at the first browser-facing
feature, and each must have a test that fails when the control is removed. The
nonce keeps the CSP strict without `'unsafe-inline'` for scripts.

**Alternatives considered**: `script-src 'self' 'unsafe-inline'` (rejected: it
defeats the policy for injected scripts); a double-submit cookie without the
Origin check (rejected: it does not stop a same-site subdomain attacker);
framework auto-escaping with no test (rejected explicitly by FR-045).

## R-16 — Schema ownership, transactions, and the shared entry point

**Decision**: Tables are declared one file per module (`users.ts`, `auth.ts`) and
only the owner's repository reads or writes them. The few operations that span
both go through the owner: account + credential + session creation at
verification and password change with global revocation run in one Drizzle
transaction opened by the orchestrating `auth` service, and the sign-in lock's
conditional update, success reset, expiry clear, and current-password refusal
are implemented in `apps/api/src/modules/users/repository/user-lock.ts` and
called through the port declared in `packages/shared`.
Each repository method accepts the transaction handle, so no module writes
another's table. The `users` module exposes `createAccount(tx, input)`, the
verification-store port, and the lock port; `auth` calls them through interfaces
in `packages/shared`. The shared
entry point (`apps/api/src/http/context.ts`) is the only place that reads a
session, applies the account status, the role, the restriction, and the merchant
scope, and every route receives its context from it.

**Rationale**: The specification requires account and session creation to be
indivisible, and the module rule requires one writer per table. A
unit-of-work handle is the minimal seam that satisfies both; the entry point is
the one the constitution names and R13 will ratify.

**Alternatives considered**: Compensating deletes after a failed session insert
(rejected: a window in which an account without a session exists, even if
brief); a single `identity` module owning both tables (rejected: it collapses two
responsibilities and contradicts the register's ownership); a `user-lock.ts`
under `auth/repository` (rejected: it makes the `auth` repository a second writer
of `users`, breaking one-writer-per-table and Principle X); cross-module
imports (rejected by Principle X).

## R-17 — Runtime, workspace, and CI

**Decision**: Node.js 22 LTS pinned by `.nvmrc` and `engines`; pnpm 10 with
Corepack and a committed lockfile; Turborepo v2; TypeScript 5.x with the strict
flags in the plan. CI is GitHub Actions with jobs: governance
(`node governance-drift-check.mjs`), lint/typecheck, unit, integration
(PostgreSQL service, migrations, the flow suites), e2e (Playwright, fake SMS,
a11y, visual), coverage (80%), build + SBOM (`@cyclonedx/cyclonedx-npm`), and
the vulnerability/SAST scans (`osv-scanner`, Semgrep). Tests make no network
call; the install step is the only networked job step, and any future
network-requiring test must be explicitly opted in and time-bounded.

**Rationale**: Node 22 is ADR-021; the coverage gate must exist at the first
feature that introduces the runner (Principle III); the governance check must
run on every merge (ADR-071); the supply-chain controls are binding at release.

**Alternatives considered**: GitLab CI (rejected: no repository evidence and
GitHub is the default for this repository); a single job (rejected: a failing
e2e would hide a lint failure and the gates must be independently visible);
networked tests (rejected by Module Discipline).

## R-18 — Backups, RTO, and RPO

**Decision**: PostgreSQL's built-in tooling — a nightly `pg_basebackup`, WAL
archiving with an `archive_command` that ships segments every 60 seconds
(`archive_timeout = 60`), and `pg_restore` for the restore drill. RTO 4 hours,
RPO 15 minutes. `scripts/backup/` wraps `backup`, `verify`, and `restore`; the
runbook `docs/runbooks/backup-restore.md` records the drill and the clean-room
steps. Every archive is sealed before it leaves the host — AES-256-GCM under a
data key wrapped by a key-encryption key injected from the environment — so the
backup target never holds readable bytes; the secret manager is R12's (ADR-142).

**Rationale**: R1 introduces persistent storage, so the constitution requires
numeric RTO/RPO and backup tooling. Built-in tools add no dependency and are
the smallest mechanism that meets a 15-minute RPO.

**Alternatives considered**: `pg_dump` only (rejected: a nightly dump gives a
24-hour RPO); `pgBackRest`/Barman (rejected: a third-party tool and a new
register gap for no requirement this slice has); logical replication (rejected:
a second topology to operate).

## R-19 — Administrator provisioning and the first sign-in

**Decision**: `apps/api/src/cli/provision-administrator.ts` prompts for the full
name, mobile number, city, and an initial password (read from a hidden TTY
prompt or `--password-stdin`; never the credential as a value in argv, an
environment variable, or a stored file), validates every account rule
and the password policy, creates `User` (role `administrator`, status `active`,
`must_change_password = true`) and the credential row in one transaction, and
emits the provisioning security event. The credential is read once, the input is
closed, and it is never echoed, never written to an output, an error, a log, or
the security event — the report names only the account and the outcome — and the
operator hands it to the administrator over a channel the operator controls,
with no page, code message, or notice carrying it. It writes no audit-log row. The
administrator's first sign-in is a service function
`auth.service.signInAdministrator` (no HTTP route) that accepts the credential,
marks the session restricted, and refuses every action except the password
change and ending the session. The forced change requires the current password,
a different new value, ends every session, and sends the security notice.

**Rationale**: The spec delivers the provisioning action and the first sign-in as
behaviour with no page; keeping the function off the HTTP surface prevents the
merchant sign-in route from becoming the administrator's route and keeps
FR-027's uniform refusal intact. A hidden password prompt keeps the credential
out of shell history, and reading it once from standard input keeps it out of
the environment, a stored file, the process list, and every output the action
writes, which the security rules require.

**Alternatives considered**: A CLI option carrying the password as its value
(rejected: shell
history and process list leakage); an HTTP provisioning route (rejected: it
would be an administrator operation without the audit recorder, which R13 owns);
seeding the account in a migration (rejected: a credential in versioned SQL).

## R-20 — The administrator's restricted session and the blocked variant

**Decision**: A session carries a computed `restricted` flag (the account's
`must_change_password` at request time, not a copy). The shared entry point
refuses every route that declares `requiresUnrestricted` with
`403 PASSWORD_CHANGE_REQUIRED`; the change-password route and the sign-out
routes are declared `allowsRestricted`. The ended-session state is a
`401` with `SESSION_ENDED` or `ACCOUNT_BLOCKED`; the latter is returned only for
a token whose session row is revoked with reason `blocked`, or whose account is
blocked while the row is still live (the entry point then marks the row
`blocked` and returns the blocked variant).

**Rationale**: The spec requires the restriction to withhold ordinary actions
but not the password change or ending the session, and it requires the blocked
variant to withhold the sign-in link. A route declaration is the only way the
rule is enforced once rather than in each handler.

**Alternatives considered**: A copy of the flag on the session (rejected: two
sources that drift); a status-specific error message on every route (rejected:
the leak the spec forbids).

## R-21 — The SC-009 load profile and its verdict

**Decision**: The measurement presents 20 origin keys and 600 number keys instead
of one client at 10 requests/second. Twenty concurrent virtual users, each bound
to its own loopback source address (`127.0.0.2` … `127.0.0.21`) and issuing one
request every 2 s, produce the aggregate 10 per second; every request carries a
distinct number — 200 fresh numbers for account creation, 200 seeded accounts for
sign-in, 200 other seeded accounts for recovery — so within the measured window no
origin key is spent more than 10 times against a 20-request budget, and every
number key is spent once against limits of 3, 20, and 3. The limiter is not
bypassed: the API keys an untrusted peer by its address (`contracts/auth-api.md`
§2.5), the script reads `rate_limit_counters` back, and a post-run probe spends one
fresh origin's 20-request account-creation budget and requires the 21st submission
to be refused `RATE_LIMITED`. The verdict reports attempted, accepted, and refused
counts per operation and in total, fails on any refusal, and computes its
percentiles over accepted requests only. Three hundred live sessions are seeded;
the run's 200 sign-ins reach exactly 500, the condition's ceiling, which the script
asserts.

**Rationale**: A single-origin run at 10 requests/second spends an
account-creation origin budget of 20 in two seconds and spends 180 of its 600
requests on `429`; the percentiles of the survivors would then be presented as
the budget's evidence, which is the failure mode this profile exists to prevent.
Spreading the keys keeps the limiter — a path CMV row 3 requires and one of the
queries the budget is meant to cover — inside the measured request. Reporting the
refusal count and failing on any refusal makes a refusal-dominated run
unrepresentable as a pass, and the probe makes a silently disabled limiter a
failed verdict rather than an invisible one.

**Alternatives considered**: A documented limiter bypass scoped to the
measurement (rejected: it removes the counter queries from the measured path,
ships a switch that weakens a security control, and reports the latency of a
configuration no merchant runs); a single origin with sign-in traffic only
(rejected: it measures one of the three operations the condition names and skips
the two dispatches, whose budgets are tightest); forging `X-Real-IP` from the load
host with the load host added to the trusted-proxy list (rejected: it asks the API
to trust a header from a non-proxy, which is the misconfiguration the derivation
rule exists to prevent, while binding the source address needs no trust at all);
seeding 500 sessions and letting the 200 sign-ins exceed the ceiling (rejected:
the run would measure outside its own stated condition).

## R-22 — The copy's measurable bindings: segments, Unicode data, reference, and numerals

**Decision**: Four bindings the copy checklist found unstated are fixed here and
recorded in the plan's Technical Context.

- **The SMS segment bound.** A body is UCS-2 and is counted in UTF-16 code units
  after `{code}` is replaced by its six Latin digits, with no byte-order mark and
  no user-data header. A one-time-code body MUST fit one segment (70 code units)
  and a notice body MUST fit two (134 code units, 2 × 67 with the 6-byte
  concatenation header). A body over its class's bound fails the build; the
  transport never truncates, splits, or appends a signature. The four bodies stand
  at 51, 64, 84, and 71 code units; the recovery body's closing clause was cut to
  «لا تشاركه.» to fit, and the sign-up body carries the same clause.
- **The Unicode data pin.** The emoji predicate reads `Extended_Pictographic` from
  a range table generated from the vendored `emoji-data.txt` at Unicode 18.0.0
  (SHA-256 `80d00f8e616a0ef27fd6b8de3b758c06383b5d917e2977709578e68baf733bf1`, 455
  ranges), never from the runtime's `\p{Extended_Pictographic}`, whose answer
  depends on the ICU build the runtime ships.
- **The copy's authority.** `contracts/ui-contracts.md` is the single record:
  its inventory states the complete set once, the R1 capture set
  (`docs/design/screenshots/R1/`, thirteen images, each with a manifest entry) is
  evidence of composition and appearance only and governs no string, and the SMS
  bodies are the plan's own values because the lab has no messaging surface.
- **The numerals.** `packages/shared/src/limits.ts` holds the six limits the copy
  states (12, 128, 100, 100, 6, 5), the Zod schemas import them, and every
  user-facing numeral is a slot filled from them at render. The counted noun is
  written for the value's agreement class, which the test pins.

**Rationale**: Each binding removes a way the copy could drift from the value that
owns it. The segment bound is the only one a carrier can charge for twice, and a
code split across two segments is a code a person may not receive whole. The
Unicode pin is what makes the emoji refusal testable: the property is versioned
data, and a runtime's property escape silently follows its ICU version, so the same
name would pass on one machine and fail on another. Naming the reference closes the
one copy source a reviewer could not open, and the numeral slots make a CMV change
a rendering change rather than a search-and-replace across Arabic strings.

**Alternatives considered**: Allowing the notices and the code bodies two segments
alike (rejected: the code must not be separated from its sentence, and the notice
is the only body whose two facts and instruction cannot fit 70 code units); cutting
the notices to 70 by dropping the instruction (rejected: the notice's purpose is to
tell the owner what to do about a change they did not make); reading the property
from the runtime (rejected: it pins the predicate to the runtime's ICU, not to a
recorded version); vendoring the whole UCD (rejected: one property is needed, and
the file carries it alone); putting the Unicode pin in CMV (rejected: the
constitution's list is closed and a new value enters it by a constitution
amendment, so the plan records the pin where the rail width is recorded); deriving
the counted noun at render from an Arabic numeral-agreement engine (rejected: it
adds a grammar surface to every message for five fixed values, where the class test
fails the build only when a value crosses a class).

## Open questions

None. Every `NEEDS CLARIFICATION` in the Technical Context is resolved above;
the specification carries zero unresolved clarifications, and the four product
facts this slice could have touched are recorded as untouched in the plan's
Gate 3.
