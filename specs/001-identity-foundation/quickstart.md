# Quickstart — Run and Validate Identity and Foundation

**Feature**: `001-identity-foundation` | **Date**: 2026-10-29 | **Plan**: [plan.md](./plan.md)

A runnable guide to the slice: bring the stack up, walk the three pages, and
prove each contract with the suite that owns it. It contains no implementation
code — the migrations, services, and tests belong to `tasks.md` and the
implementation phase. Values are referenced, not restated: the plan's
Constitution Mandated Values, [`contracts/auth-api.md`](./contracts/auth-api.md),
[`contracts/ui-contracts.md`](./contracts/ui-contracts.md), and
[`data-model.md`](./data-model.md).

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 22 LTS (`.nvmrc` = `22`, `engines.node` = `>=22 <23`) | ADR-021, CMV row 10 |
| pnpm | 10 through Corepack | The workspace and the committed lockfile |
| Docker Engine | 24 or later with Compose v2 | PostgreSQL 16, PgDog, and the profile-gated services |
| PostgreSQL client | 16 (`psql`, `pg_basebackup`, `pg_restore`) | The backup and restore drill |
| Playwright browsers | Installed by `pnpm exec playwright install` | End-to-end, accessibility, visual |

No Twilio account is needed: tests and development use the fake transport
(`SMS_TRANSPORT=fake`), whose acceptance duration `SMS_FAKE_ACCEPT_MS` defaults
to `0`; the timing suite sets `200` and the load run `50` (§4). No network access
is needed after `pnpm install`.

## 2. First run

```bash
corepack enable
pnpm install
cp .env.example .env          # Windows: copy .env.example .env
pnpm db:up                    # docker compose -f compose.dev.yml up -d
pnpm db:migrate               # the committed migrations (data-model §13)
pnpm dev                      # web :3000, api :3001
```

`pnpm db:up` starts PostgreSQL 16 and PgDog (with the PgBouncer fallback
profile); Redis, SeaweedFS, and OpenSearch start only under their profiles, and
nothing in R1 reads or writes them.

**Expected**: `pnpm db:migrate` applies both committed migrations — six tables
created (`users`, `accounts`, `sessions`, `verifications` — the library's
placeholder, asserted empty — `phone_verifications`, `rate_limit_counters`) and
`phone_verifications.previous_code_hash` added.
`GET
http://localhost:3001/health` answers `{"status":"ok","database":"ok"}`. The
three pages answer 200 at `/auth/sign-up`, `/auth/sign-in`, and
`/auth/forgot-password`.

**Environment** (`.env.example` lists every key; no secret is committed):
`DATABASE_URL` (through PgDog), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`WEB_ORIGIN`, `SMS_TRANSPORT`, `SMS_FAKE_ACCEPT_MS` (the fake's acceptance wait,
`0` by default), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_FROM`, `LOG_LEVEL`. Production values come from the operator's secret
store (R12); development values are placeholders.

### 2.1 Reading a one-time code

With `SMS_TRANSPORT=fake`, the fake adapter writes one structured line per
accepted dispatch to the API console:

```
{"level":"info","event":"sms.fake.dispatched","kind":"otp_sign_up","to":"+218…","body":"رمز التحقق في وفر: 482913. …"}
```

The code is the six Latin digits in the body. Production logs never carry a code.
The body is UCS-2 and is counted in UTF-16 code units after the code is
substituted: a one-time-code body fits one segment (70 code units) and a notice at
most two (134); a template over its class's bound fails the unit suite before it
can be dispatched (`plan.md` → Technical Context).

### 2.2 Resetting a development database

```bash
pnpm db:reset                 # drops and re-creates the dev database, then migrates
pnpm db:seed -- --accounts 10 --sessions 5
```

`pnpm db:seed -- --accounts 10000 --sessions 300` produces the SC-009 load
condition's base: 10,000 accounts and 300 live sessions, which the load run's
200 sign-ins raise to the condition's 500-session ceiling (plan → The SC-009 load
profile). The seeder is a deterministic script with no new dependency; it prints
the credentials it generated for the first account, writes the load-only credential
to a temporary manifest outside the repository (owner-only permissions) and prints
its path, and it refuses to run when `NODE_ENV=production`.

## 3. Walk the three pages

### Scenario 1 — Sign-up, verification, and the in-place confirmation (FR-001 … FR-006)

1. Open `/auth/sign-up`. Enter a full name, `0912345678`, a 12+ character
   password that is not in the breached list, a city, and an optional shop name.
2. Submit. **Expect** the code step in place: the read-only full name, the
   canonical number `+218 91 234 5678`, the city, and the shop name; the code
   field, `تحقق`, `إرسال رمز جديد`, `تعديل البيانات`; the hint
   `تنتهي صلاحية الرمز بعد 5 دقائق.`; focus on the code field.
3. Read the code from the API console (2.1) and submit it. **Expect** the done
   state in place (`تم إنشاء حسابك` / `حسابك جاهز، وأنت مسجل الدخول الآن.`), a
   session cookie, and no navigation.
4. Reload. **Expect** the empty form, no confirmation re-shown.

**Check** (data-model §4, §7):

```sql
SELECT count(*) FROM users;                 -- 1
SELECT count(*) FROM accounts;              -- 1
SELECT count(*) FROM sessions;              -- 1
SELECT count(*) FROM phone_verifications;   -- 0
SELECT count(*) FROM verifications;         -- 0
SELECT phone_number, phone_number_verified, role, status FROM users;
-- +218912345678 | t | merchant | active
```

### Scenario 2 — The number already has an account (FR-006)

Repeat Scenario 1 with the same number and a different password. **Expect** the
same form response, the same code step, and the same dispatch. After the correct
code: `رقمك مسجل مسبقا` with the links to sign-in and recovery, **no second
account**, the password unchanged, and the pending row deleted. Sign in with the
**first** password to prove it.

### Scenario 3 — Blocked and administrator numbers at sign-up (FR-006, FR-027)

Seed or edit an account's `status` to `blocked`; run Scenario 1 for its number.
**Expect** `الحساب موقوف` after the code, and no session. Repeat with a
provisioned administrator's number: **Expect** `الحساب إداري`.

### Scenario 4 — Format and normalization (FR-003, FR-031, FR-042)

- Submit `12345`, then `+20 91 234 5678`. **Expect** the format message
  `أدخل رقم هاتف ليبي صحيحا يبدأ بـ +218.` and no account.
- Submit `٠٩١٢٣٤٥٦٧٨` (Arabic-Indic), then `+218 91 234 5678`, then
  `00218 91 234 5678`. **Expect** one pending request each time, one account, and
  the canonical `+218912345678` stored.
- Submit a number whose prefix is not in the bundled dataset. **Expect** the same
  format message.

### Scenario 5 — Password policy (FR-035, AC-037)

- Submit an 11-character password. **Expect** `كلمة المرور أقصر من 12 حرفا.`
- Submit a 129-character password. **Expect** `كلمة المرور تتجاوز 128 حرفا.`
- Submit `password1234` (in the vendored list). **Expect** `كلمة المرور شائعة أو
  ظهرت في تسريبات سابقة. اختر كلمة أخرى.`
- Repeat all three for a number that has an account. **Expect** byte-identical
  messages: the policy adds no signal.

### Scenario 6 — The honeypot and the minimum time (FR-029)

- Fill the hidden `website` field (browser dev tools), on a submission the
  operation's limit does not refuse first (FR-051; CMV row 3). **Expect** the same
  response as a success — status, headers, fields, and types — no pending row, no
  SMS line in the console, and no step change: the page stays on the form with no
  message, and the resume read for the returned `requestId` answers
  `OTP_EXPIRED`, so the code step is never reached (plan record 15). When the
  account-creation budget is already spent, the same submission receives the
  distinct limit refusal instead, whatever else is wrong with it, a filled hidden
  field included (AC-031, AC-033).
- Submit within 3 s of the form being served. **Expect** `أرسلت النموذج بسرعة أكبر من
  المعتاد. أعد المحاولة.` and no account.
- Remove the `formStamp` the page received from `GET /api/v1/auth/csrf`, alter one
  character of it, or send a past timestamp in its place. **Expect** the same
  refusal and no account: the interval is read from the platform's own value, on
  the platform's own clock, and a time value the submitter supplies is never read
  (FR-029; `contracts/auth-api.md` §5.1, §5.2).
- Both submissions consume the account-creation budget: repeat until the 21st
  submission from one origin and **expect** `RATE_LIMITED` with `Retry-After`.

### Scenario 7 — Rate limits (FR-029, FR-033, FR-051)

- Account creation: 3 submissions for one number from different origins (or with
  the origin key reset) → the fourth is refused for the number, from any origin,
  while another number still succeeds.
- Sign-in: 60 from one origin, 20 for one number; recovery: 20 / 3.
- Exhaust sign-up and then sign in with a valid merchant. **Expect** sign-in to
  succeed: one operation's budget never blocks another.
- Submit a malformed number repeatedly. **Expect** only the origin key to be
  spent; a valid number still succeeds from another origin.
- Assert the order: exhaust the budget, then submit a malformed value. **Expect**
  `RATE_LIMITED`, not `INVALID_PHONE` (FR-051 step 1 before step 4).

### Scenario 8 — Sign-in and the uniform refusal (FR-007 … FR-009, SC-004)

1. Sign in with the correct password. **Expect** `تم تسجيل الدخول` in place, a
   new session, and no OTP.
2. Sign in with a wrong password. **Expect** `رقم الهاتف أو كلمة المرور غير
   صحيحة.` and nothing else.
3. Sign in with an unknown number, then with a blocked account, then with an
   administrator's number. **Expect** the same status (401), the same body
   (`AUTH_INVALID_CREDENTIALS`), the same header set apart from `Date` and
   `X-Request-Id`, and no `Set-Cookie` — the five cases are indistinguishable.
4. Five consecutive wrong passwords. **Expect** the fifth sets `locked_until`
   (`SELECT locked_until, failed_sign_in_count FROM users`), the response is still
   the uniform one, and there is no lock copy on the page.
5. A sixth attempt during the lock. **Expect** the uniform refusal again, no
   change to the count, and no extension of `locked_until`.
6. Move `locked_until` into the past (dev only) and sign in correctly. **Expect**
   success and `failed_sign_in_count = 0`.
7. Fail four times, succeed, then fail once. **Expect** the count to be 1 — a
   success ends the run.

### Scenario 9 — Ending sessions (FR-010 … FR-013, FR-043)

- Sign in from two browser profiles. Sign out in one. **Expect** 204, the cookie
  cleared, and the other session still valid.
- With the remaining session, sign out of every device
  (`POST /auth/sign-out-all`). **Expect** 204, every live session revoked with
  `sign_out_all`, and the next request from either profile refused
  `SESSION_ENDED` and showing the ended-session state.
- **Expect** one SMS notice line in the console (`notice_signed_out_all`), and
  none for an ordinary sign-out. The notice states the change and the sessions it
  ended and sits inside two UCS-2 segments (71 code units; the password-change
  notice is 84), as `plan.md` → Technical Context records.
- Password change (no page): `POST /auth/password/change` with the current and a
  new password. **Expect** 200, every session revoked (`password_change`), the
  pending recovery row for the number deleted, and one
  `notice_password_changed` message. A wrong current password answers
  `AUTH_INVALID_CREDENTIALS` and ends no session; five of them lock the account.
- `POST /auth/sign-out` twice. **Expect** 204 both times: sign-out is idempotent.

### Scenario 10 — Recovery (FR-014, FR-015, FR-027)

1. `/auth/forgot-password` with a number that has an account. **Expect** the code
   step, the canonical number read-only, and nothing about the account.
2. Enter the correct code. **Expect** the new-password step in place. Reload.
   **Expect** the new-password step again (the verified state survives a reload).
3. Set a 12+ character password. **Expect** `تم تعيين كلمة المرور` /
   `انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة.`, every session
   revoked, and one notice.
4. Repeat with a number that has no account. **Expect** `لا يوجد حساب لهذا
   الرقم`, no password set, the pending row deleted, and **no retry control**.
5. Repeat with a blocked account. **Expect** the reset to complete and the
   blocked confirmation: `الحساب موقوف، ويبقى تسجيل الدخول مرفوضا حتى يعيد
   مسؤول الحساب تفعيله.` with no sign-in link.
6. Repeat with an administrator's number. **Expect** `لا يمكن إعادة التعيين من
   هنا` after the code, no password set, no session. Combine with a block:
   **Expect** the role message, never the block.

### Scenario 11 — One-time-code rules (FR-034)

- Before entering a code, inspect the pending row: `SELECT code_hash FROM
  phone_verifications;`. **Expect** a value beginning `$wafar$scrypt$` that is
  not the six digits — the store never holds a usable code in plaintext.
- Enter a wrong six-digit code. **Expect** `الرمز غير صحيح.` and
  `incorrect_entries = 1`; request a new code and enter a wrong one again.
  **Expect** the count to continue (it is not reset by a new code).
- Request a new code while the old one is live. **Expect** the old one to be
  refused as expired once the new dispatch is accepted.
- Make the channel refuse (the fake adapter's test control, which returns
  `refused` for the next send). **Expect** `OTP_SEND_FAILED` on the submission,
  no re-request consumed, the previous code still valid, and the request still
  live.
- Request new codes three times, then a fourth. **Expect** `OTP_RESEND_LIMIT`.
- Enter five wrong codes. **Expect** the request deleted, the page back at the
  first step with `انتهت محاولات التحقق. أدخل رقمك من جديد لطلب رمز جديد.`, and a
  fresh request starting at zero.
- Leave a request for 5 minutes (integration test with an injected clock).
  **Expect** `OTP_EXPIRED` and, while the code step is shown, the page back at
  the first step with the expiry notice at that moment — no next submission is
  needed to reach it; for recovery, `RECOVERY_EXPIRED` on the new-password step
  and the same return.

### Scenario 12 — Forgery, headers, and encoding (FR-044 … FR-046)

- `curl` a sign-in without `X-Wafar-CSRF`. **Expect** `403 CSRF_FAILED`.
- Send a wrong token, then a token with a foreign `Origin`. **Expect** the same.
- Inspect a page response and an API response. **Expect** the headers of the API
  contract §2.4 (HSTS in a production build); `script-src` carries a nonce and no
  wildcard, no `'unsafe-inline'`, and no eval-permitting source.
- Submit `<img src=x onerror=alert(1)>` as the full name and reach the code step.
  **Expect** the literal text, no element, and no dialog.

### Scenario 13 — Merchant scope (FR-053, AC-056)

`Sessions` is the only merchant-scoped table in R1, so the scope is proved where
it lives — the single shared entry point and the `auth` service that reads
sessions.

1. Sign in as A and as B, then call the `auth` service's session read with A's
   context (the integration harness invokes the service directly; there is no HTTP
   route for a session list). **Expect** only A's rows.
2. Send a request with A's cookie and a `userId=B` query parameter or body field.
   **Expect** it to be ignored: no R1 route accepts an account identifier from
   the request, and the context is built from the token alone.
3. Call the same read with A's context and a reference that belongs to B.
   **Expect** the ordinary `404 NOT_FOUND` status, body, and headers — identical
   to the answer a reference that matches no row receives, so the refusal cannot
   tell A that B's row exists.
4. Remove the `where userId = context.userId` clause from the service and run
   `pnpm test:integration`. **Expect** the isolation test to fail — that failure
   is the requirement's evidence, and the clause is restored before merge.

### Scenario 14 — The frame's composition (FR-020 … FR-025, FR-039, FR-047, FR-052)

There is no page to open: the frame is verified structurally.

```bash
pnpm --filter ./packages/ui test
```

**Expect** the ten assertions of `contracts/ui-contracts.md` §8.6: nine items in
order, the collapse control's three names, five bottom slots with the raised
`/parts` action, the four footer links and the drawer's copy of them, the footer
band's absence below 1024 CSS px with its links present in the drawer, the
account menu's three items and its dismissal contract, the guest variant, the
logo and notification targets, the theme switch's `aria-pressed` and names, and
every control's accessible name, role, and keyboard reachability — the header's
four controls included at 320 CSS px, a guest's three controls — the logo/home
control, the theme switch, and the sign-in action — in that same row under the
same rule, none dropped, folded into an overflow menu, or moved, each keeping its
accessible name and its touch target, and the ended-session state's live-region
markup and focusable heading in both variants.

### Scenario 15 — The copy, as recorded (FR-026, AC-028, SC-008)

The copy has one source: `contracts/ui-contracts.md` §2–§8. There is no second
list to compare against, and a capture governs no string. The frame's nine
sidebar and four static-page labels are Scenario 14's assertions; this scenario
covers what the three bare pages and the message bodies render.

1. With the network throttled in devtools, submit each form and **expect** the
   control to show the step's in-progress label in place of its idle label,
   never both: `يجري الإرسال…` on sign-up and recovery, `يجري تسجيل الدخول…` on
   sign-in, `يجري التحقق…` on both code steps, and `يجري الحفظ…` on recovery's
   new-password step. The ellipsis is one U+2026 character; three full stops fail
   the copy test. A control that navigates — the pages' cross-links, the two back
   controls, and the done state's `الانتقال إلى تسجيل الدخول` — carries its name
   and no in-progress label (§2.1).
2. In the city combobox, type a query that matches no entry. **Expect** the one
   row `لا توجد مدينة مطابقة`, which is not selectable and is announced with the
   listbox, while the closed control still shows `اختر المدينة`; submit a value
   outside the list and **expect** `CITY_NOT_IN_LIST` (§3.2, §6).
3. On the code step, request a new code. **Expect** the accepted 202 to announce
   `أرسلنا رمزا جديدا. الرمز السابق لم يعد صالحا.` as a status, and the previous
   code to answer `انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.` on
   `code_error`. Scenario 11
   exercises the step's other endings, and §6's endings table is the one text per
   event: the expired code and the superseded code share one text and one state,
   the request that is no longer live shares the text and ends the step, the fifth
   incorrect entry is the only `OTP_REQUEST_ENDED`, and recovery's verified state
   is `RECOVERY_EXPIRED`.
4. Read an SMS body in the API console (§2.1). **Expect** it to open with an
   Arabic letter, carry no ASCII letter, carry no bidirectional control
   character, and — for a one-time-code body — carry the code as the only maximal
   run of six or more digits, so the code keeps its order and the sentence's full
   stop follows it (§7).
5. Run `pnpm test` and read the copy scan's verdict: every rendered string is the
   text recorded for its state, reason, or cause; `SMS` is one inline `lang="en"`
   run; no template carries a numeral as typed text; and each counted noun still
   matches its value's agreement class (§6, §9, T100).

## 4. The suites

| Command | Runs | Owns |
|---|---|---|
| `pnpm test` | Vitest unit + `@vue/test-utils` component tests under `jsdom` | Password hashing, normalization, code rules, city/prefix datasets, token contracts, the frame's structure |
| `pnpm test:integration` | Vitest against a migrated PostgreSQL | Every HTTP route, the state machines, the transactions, the lock, the isolation test, the enumeration timing test, and the hidden-field pair at the fake's 200 ms |
| `pnpm test:e2e` | Playwright against `pnpm dev` with the fake transport | The three pages end to end, the step changes, focus and announcements, the session surviving a browser restart, CSRF and headers |
| `pnpm test:a11y` | `@axe-core/playwright` | Every delivered state at 320 and 1280, in both appearances |
| `pnpm test:visual` | Playwright screenshots | The baseline set of ui-contracts §10 at 1280 and 375, both appearances, plus the 320 light reflow |
| `pnpm load:auth` | `scripts/load/auth-smoke.mjs` (built-in `http`, one `localAddress` per virtual user) | 600 requests over 60 s at 10/second — 200 per operation — from 20 origin keys and 600 number keys, against 10,000 accounts and 300 seeded sessions; prints p50, p95, the work-only p95, the slowest statement, and the accepted/refused counts |
| `node governance-drift-check.mjs` | The committed governance check | Zero drift; run it before every commit |
| `pnpm build` | Web and API production builds | A clean strict-mode build and the SBOM job's input |
| `pnpm sbom` | `@cyclonedx/cyclonedx-npm` | One CycloneDX SBOM per release |

**Coverage**: `pnpm test -- --coverage` enforces ≥ 80% of changed production
lines (V8 provider). The frame's page-level runtime is excluded per plan →
Complexity Tracking row 2.

**Load acceptance**: `pnpm load:auth` runs the SC-009 profile — 600 requests over
60 s, 200 per operation, from 20 virtual users on `127.0.0.2` … `127.0.0.21` (one
origin key each, one number key per request) against 10,000 accounts and 300
seeded live sessions, which the 200 sign-ins raise to the 500-session ceiling. The
API must run the fake with `SMS_FAKE_ACCEPT_MS=50`, the declared nominal wait, so
every dispatch's duration carries it; the verdict fails a dispatch faster than
that wait, so an API left at the default `0` cannot pass. It prints the
attempted, accepted, and refused counts and the refusal codes per operation and
in total; it fails on any refusal (so a refusal-dominated run cannot pass), on an
accepted count other than 200 for an operation, when the work-only p95 — each
accepted dispatch's duration less the declared wait, a sign-in's duration as it
stands — exceeds 250 ms per operation or in aggregate, or when p50 exceeds
150 ms or p95 exceeds 1,000 ms per operation or in aggregate, computed over
accepted requests. The 250 ms is the share of SC-009's 1,000 ms that leaves the
provider's 750 ms ceiling inside the budget (plan → The SC-009 load profile). It
also prints the slowest `pg_stat_statements` query and
the rate-limit rows the run created, and a post-run probe must be refused: a
fresh origin (`127.0.0.22`) spends its 20-request account-creation budget and the
21st submission answers `RATE_LIMITED` with `Retry-After`, proving the limiter was
live. The measurement host must be Linux (the CI runner or the load host), because
the profile binds loopback aliases. No query may exceed 100 ms p95. A measured
regression above 10% against the branching version blocks release. Attach the
report to the pull request.

## 5. Continuous integration

`.github/workflows/ci.yml` runs the same commands in this order: governance →
lint/typecheck → unit → integration (PostgreSQL service, migrations, the flow
suites) → e2e (Playwright, fake SMS, a11y, visual) → coverage → build + SBOM →
`osv-scanner` + Semgrep. The dependency-install step is the only networked step;
every test runs offline. A red gate blocks merge.

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `pnpm db:migrate` connects but the tables are missing | `DATABASE_URL` points at PostgreSQL instead of PgDog, or at the wrong database | Use the PgDog URL from `.env.example`; check `docker compose -f compose.dev.yml ps` |
| `/health` answers 503 | PostgreSQL not ready or the migration not applied | `pnpm db:up`, wait for the health check, `pnpm db:migrate` |
| The code step never appears | The channel refused or timed out | Read the API console for `auth.otp.dispatch_failed`; `SMS_TRANSPORT=fake` must be set |
| A code is always refused | The request was replaced by a newer submission, or 5 minutes elapsed | Request a new code; the old one is invalid by design |
| The lock never lifts in a manual test | The lock is a 15-minute clock, not an attempt count | Move `locked_until` into the past in dev, or use the integration test's injected clock |
| Visual diffs on the first run | Baselines are generated, not committed from the lab | Run `pnpm test:visual -- --update-snapshots` once, review the images, and commit them |
| Playwright cannot launch | Browsers not installed | `pnpm exec playwright install --with-deps` |

## 7. Done when

- [ ] The three pages render at 320 and 1280 in both appearances — the scan and
      the keyboard pass run there — and at 375 in both appearances for the
      baseline, with the appearance applied before paint.
- [ ] SC-001, SC-002, and SC-003 complete within their 3-minute, 30-second, and
      3-minute bounds, with delivery after the channel accepts a code excluded.
- [ ] Scenarios 1–15 pass, and the SQL checks of Scenario 1 hold.
- [ ] `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:a11y`,
      `pnpm test:visual`, and `pnpm load:auth` pass; the load verdict reports 200
      accepted and 0 refused for each operation, a work-only p95 within 250 ms,
      the probe's 21st submission
      refused, and the report is attached.
- [ ] `node governance-drift-check.mjs` exits 0.
- [ ] The manual keyboard-only pass at 320 and 1280 is recorded in the pull
      request.
- [ ] The frame's structural suite passes and no page renders the frame.

## 8. Not covered here

- The frame's page behaviour, its accessibility scan, and its keyboard pass —
  R2, the first page carrying the frame (`EX-007`, ADR-139); the composition and
  the component-level behaviour are asserted here.
- Deployment, the three environments with staging parity, the error tracker, the
  secret manager, TLS, the log pipeline, the monitoring and alerting set, and
  staging data anonymisation — R12. This slice delivers the configuration
  contract and the backup scripts.
- The administrator's sign-in surface and every administrator operation — R13.
- The static pages, the error page, and the merchant area — later slices.
