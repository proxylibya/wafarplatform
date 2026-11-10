# Contract — Authentication HTTP API

**Feature**: `001-identity-foundation` | **Date**: 2026-10-29 | **Plan**: [plan.md](../plan.md) | **Data model**: [data-model.md](../data-model.md)

The public HTTP surface of the `auth` module. Every route below is R1's own
route under `/api/v1`; the authentication library's HTTP handler is **not
mounted**, so no client can reach the library's endpoints and bypass the rate
limits, the honeypot, the refusal order, the lock, or the uniform response
(research R-01). The module calls `auth.api.*` server-side and forwards the
session cookie the library issues.

Page copy is **not** in this contract. A response carries a stable machine code;
the web maps each code to one Arabic string recorded in
[`ui-contracts.md`](./ui-contracts.md). One code therefore has exactly one text,
which is what makes "the same case receives the same text" true by construction
(FR-008, FR-009, FR-029, FR-034, FR-035).

## 1. Conventions

| Concern | Rule |
|---|---|
| Base path | `/api/v1` (the health check is `/health`, unversioned) |
| Media type | `application/json; charset=utf-8` on every request and response with a body |
| Field naming | `camelCase` in JSON; `snake_case` in the database (data-model §3) |
| Identifiers | Opaque strings; a client never parses one |
| Dates | RFC 3339 with milliseconds and `Z` |
| Success body | The resource object itself; no wrapper |
| Error body | `{ "error": { "code", "retryable", "field"?, "retryAfterSeconds"?, "details"? } }` — see §3 |
| Cache | `Cache-Control: no-store` on every `/api/v1` response |
| Correlation | `X-Request-Id` echoed when supplied and generated otherwise; it is the only identifier a log line and a response share |
| Body size | 16 KB per request; larger → `413 PAYLOAD_TOO_LARGE` |
| Unknown route / method | `404 NOT_FOUND` / `405 METHOD_NOT_ALLOWED`, both outside FR-051's order |
| Encoding | UTF-8 throughout; Arabic text in a request is NFC-normalized before length checks |

The Zod schemas live in `packages/shared/src/contracts/auth.ts` and are imported
by both the web client and the API, so a request shape is defined once
(Principle II).

## 2. Transport guards

### 2.1 Request forgery (FR-044)

- `GET /api/v1/auth/csrf` sets the `wafar.csrf` cookie and returns its value.
- Every **state-changing** request (`POST`, `PUT`, `PATCH`, `DELETE`) must send
  `X-Wafar-CSRF` equal to the `wafar.csrf` cookie, compared with
  `crypto.timingSafeEqual`, and an `Origin` header equal to the configured web
  origin. The allowlist holds one origin in R1 and is read from the environment;
  an absent, malformed, or unlisted `Origin` is refused.
- A request that fails either check is `403 CSRF_FAILED` and reaches no service
  code. CSRF precedes FR-051's step (1) because it decides whether the request is
  the person's at all; it carries no account signal and is outside SC-004's
  comparison.
- `GET`/`HEAD` are exempt. `GET /api/v1/auth/session` with the activity header is
  covered by §2.3.

The configuration is asserted by an automated test that fails when the
middleware is removed, and by a second test that removes only the token check
(FR-044).

### 2.2 Cookies

| Cookie | Value | Attributes | Lifetime |
|---|---|---|---|
| `wafar.session` | The library's opaque session token | `HttpOnly; Secure` (production); `SameSite=Lax; Path=/` | `Max-Age=43200` (12 h) |
| `wafar.csrf` | 32 random bytes, base64url | **Not** `HttpOnly`; `Secure` (production); `SameSite=Lax; Path=/` | `Max-Age=43200` |
| `wafar.pending` | `<requestId>.<resumeToken>` (32 random bytes) | `HttpOnly; Secure` (production); `SameSite=Lax; Path=/api/v1/auth` | `Max-Age=300`, refreshed by every accepted dispatch; cleared on completion |

No domain attribute is set (host-only). Rotating the CSRF token invalidates the
previous one. A session cookie is set only by `sign-in`, `sign-up/verify`, and
`signInAdministrator` (the last has no HTTP route); every revocation route
clears it with `Max-Age=0`.

### 2.3 Activity signal (FR-032)

`X-Wafar-Activity: 1` on any authenticated request records a
merchant-initiated action. It is honoured only when the request also carries a
valid `X-Wafar-CSRF` and an allowed `Origin`; otherwise it is **ignored** and the
request proceeds unchanged — a missing token never breaks a page load, and a
cross-site caller cannot keep a session alive. At most one write per session per
60 seconds. Background requests (TanStack Query refetches, prefetches, polling)
never carry the header; the web sets it only from a user-initiated event handler
(pointer, key, submit). The timeout and absolute-lifetime numbers are CMV row 4.

### 2.4 Security headers (FR-046)

Set by the API on every response and by the Nitro render hook on every page:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-<per-response>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`script-src` carries a per-response nonce and no wildcard, no `'unsafe-inline'`,
and no eval-permitting source (`'unsafe-eval'` included); the nonce is injected
into Nuxt's inline scripts by `apps/web/server/plugins/csp.ts`. `style-src`
keeps `'unsafe-inline'` because a style declaration is not script execution. The
automated test asserts all six headers on a page response and on an API
response, reads the policy's script sources, and fails when the middleware is
removed or any of the three allowances appears.

### 2.5 Client origin and the rate-limit key (FR-033)

The origin key is derived once, in the transport layer:

- When the peer's address is in the configured trusted-proxy list, the origin is
  the `X-Real-IP` value that proxy set. The list is read from the environment and
  holds only the reverse proxy's addresses; when it is unset, no header is trusted
  and the peer's own address is the origin — a deployment that has not named its
  proxy is coarse, never spoofable.
- Otherwise the origin is the peer's own address, and any `X-Real-IP` the request
  carries is ignored — a client that is not the proxy can never choose its origin
  key.

The key stored is `<operation>:origin:<address>` (`data-model.md` §9). The
`Origin` header of §2.1 is a different value: it names the allowlisted site, not
the client, and is never the rate-limit key. An integration test sends
`X-Real-IP` from an untrusted peer and asserts that the peer address is keyed.

### 2.6 The mobile number outside the body (FR-037, FR-038)

On the HTTP surface the number's only carrier is a body. No route accepts or
returns it in a URL, and no response places it in a header, a cookie, or a
`Location`.

| Surface | Rule |
|---|---|
| Request | `phone` travels in the JSON body of sign-up (§5.2), sign-in (§5.5), and the recovery request (§5.8). No path segment, query parameter, or request header carries it. |
| Response | The canonical `+218…` is returned in the body of the 202 (§5.2, §5.8) and of the resume read (§5.3.1). No `Set-Cookie`, other header, or redirect `Location` carries it. |
| URL and history | The three page routes (`/auth/sign-up`, `/auth/sign-in`, `/auth/forgot-password`) carry no number. The resume read's `{requestId}` is an opaque identifier: it is not the number and does not encode it. |
| Referrer | No URL carries the number, so no `Referer` can. The pages load no third-party subresource — `connect-src 'self'`, `img-src 'self' data:`, `font-src 'self'` — and responses set `Referrer-Policy: strict-origin-when-cross-origin`. |
| Client storage | `wafar.session` and `wafar.pending` are `HttpOnly`, and the three cookies carry an opaque token, a random token, and `<requestId>.<resumeToken>`; `wafar.csrf` is script-readable but random. None is or encodes the number, and no `localStorage`, `sessionStorage`, `IndexedDB`, or `Cache Storage` entry carries it. |

- **The tie** is the pending request's identifier: the code step and the
  new-password step are keyed on `<requestId>.<resumeToken>` in `wafar.pending`
  (§2.2), never on the number. The number the code step shows for reading is a
  `phone` field a response returned in its body — the 202 of §5.2 or §5.8, or
  the resume read of §5.3.1 — and is held in the page while it is open, not
  written to storage.
- **The tie on a submission**: while the page still shows the code step it
  started, its next sign-up or recovery submission carries
  `X-Wafar-Pending: <requestId>`, and the server answers that request as it
  stands without a second dispatch (§5.2, §5.8). The control that returns the
  page to its first step drops the tie, so the next submission carries no such
  header and is a fresh request that replaces the pending one (FR-034, FR-038).
- **Verification**: an integration test asserts that no request line, response
  header, `Set-Cookie` value, or redirect `Location` carries the canonical
  number, and the end-to-end journeys assert that no address, history entry,
  referrer, or stored value does.

## 3. Error envelope

```json
{
  "error": {
    "code": "INVALID_FULL_NAME",
    "reason": "emoji",
    "retryable": false,
    "field": "fullName",
    "details": [
      { "code": "INVALID_FULL_NAME", "reason": "emoji", "field": "fullName" },
      { "code": "PASSWORD_TOO_SHORT", "field": "password" }
    ]
  }
}
```

- `code` is stable and is the primary refusal; `field` names the control that
  carries it when the refusal is about one value.
- `reason` qualifies a code that carries more than one text in
  `ui-contracts.md` §6 — `empty`, `too_long`, or `emoji` on
  `INVALID_FULL_NAME`, and `too_long` or `emoji` on `INVALID_SHOP_NAME` — and is
  absent when the code has one text; the page selects the Arabic message by the
  pair (`code`, `reason`) and composes none of its own.
- `retryable` is the specification's one property (Refusal catalogue): it is true
  when the response invites another attempt that may succeed without correcting a
  value it reports, and the page offers that attempt; a response a limit produces
  sets no interval of its own, and the limit's window alone decides when a repeat
  is accepted (FR-033, FR-034, FR-040).
- `retryAfterSeconds` is present on `RATE_LIMITED` and on `OTP_RESEND_LIMIT`:
  on the first it equals the number of seconds until the current 15-minute
  window ends, and on the second the number of seconds until the pending
  request's own boundary (`request_expires_at`), which is also the
  `Retry-After` header's value.
- `details` lists every value failure when more than one applies (FR-051 allows
  several within step 4); `code` equals the first entry, and each entry carries
  its own `reason` where its code has one.
- No `message` field: the Arabic text is the web's, from one mapping
  (ui-contracts §6). This is what keeps a uniform refusal uniform.

### 3.1 Codes

| Code | Status | Retryable | Meaning | Source |
|---|---|---|---|---|
| `CSRF_FAILED` | 403 | no | Missing/wrong token or unlisted origin | FR-044 |
| `RATE_LIMITED` | 429 | yes | The operation's budget (origin or number key) is spent | FR-029, FR-033 |
| `FORM_TOO_FAST` | 400 | yes | Submitted sooner than the minimum time-to-submit, or without a valid platform-issued form stamp | FR-029 |
| `PAYLOAD_TOO_LARGE` | 413 | no | Body above 16 KB | transport |
| `INVALID_PHONE` | 400 | no | Not a Libyan mobile number on +218 | FR-003, FR-042 |
| `INVALID_FULL_NAME` | 400 | no | Empty or spaces only (`empty`), over 100 characters (`too_long`), or carrying an emoji (`emoji`) | FR-001, FR-026 |
| `INVALID_SHOP_NAME` | 400 | no | Over 100 characters (`too_long`), or carrying an emoji (`emoji`) | FR-001, FR-026 |
| `CITY_NOT_IN_LIST` | 400 | no | Not an entry of the fixed list | FR-005 |
| `PASSWORD_TOO_SHORT` | 400 | no | Fewer than 12 characters | FR-035 |
| `PASSWORD_TOO_LONG` | 400 | no | More than 128 characters | FR-035 |
| `PASSWORD_TOO_COMMON` | 400 | no | In the vendored breached list | FR-035 |
| `PASSWORD_UNCHANGED` | 400 | no | The forced first change repeats the initial password | FR-028 |
| `AUTH_INVALID_CREDENTIALS` | 401 | no | The uniform failed-sign-in refusal (all five cases) | FR-008, FR-009, FR-017, FR-027 |
| `OTP_INCORRECT` | 400 | no | A wrong value for the live code; the bound is not yet reached | FR-034 |
| `OTP_EXPIRED` | 400 | yes | The code expired, was superseded, or the request is unknown | FR-034 |
| `OTP_REQUEST_ENDED` | 400 | yes | The fifth incorrect entry ended the request — a notice, not a refusal | FR-034 |
| `OTP_RESEND_LIMIT` | 400 | yes | Three new codes already requested for this pending request | FR-034 |
| `OTP_SEND_FAILED` | 502 | yes | The channel refused or the 750 ms wait elapsed | FR-034, SC-009 |
| `RECOVERY_EXPIRED` | 400 | yes | The verified state ended before the new password was set | FR-014 |
| `SESSION_ENDED` | 401 | no | The session ended for any reason other than a block | FR-032, FR-049 |
| `ACCOUNT_BLOCKED` | 401 | no | The session's account is blocked (blocked variant) | FR-017, FR-019, FR-049 |
| `PASSWORD_CHANGE_REQUIRED` | 403 | no | A restricted administrator session attempted an ordinary action | FR-028 |
| `ACCOUNT_CREATION_FAILED` | 500 | yes | The account+session transaction failed; request and code stay live | FR-034, FR-040 |
| `INTERNAL_ERROR` | 500 | yes | Any other unexpected failure; nothing was written | FR-040 |
| `NOT_FOUND` | 404 | no | Unknown route, or a merchant-scoped row that does not exist or lies outside the caller's scope; the two are answered identically | FR-053 |
| `METHOD_NOT_ALLOWED` | 405 | no | Transport | — |

`OTP_REQUEST_ENDED` is a **notice**, not a refusal (specification, Refusal
catalogue): it reports that the verification request ended at the bound on
incorrect entries, so the page replaces the code step with the flow's first step,
keeps the values, and announces the message as a status (polite) rather than as an
alert. `OTP_EXPIRED` carries a refusal while the code is stale or superseded on a
request that is still live, and the same notice when the request itself is
unknown or has ended; `RECOVERY_EXPIRED` carries the notice, because the verified
state it names has ended. The situation decides the class, and the page learns it
from the response and the resume read (§5.3.1). No seventh exception to SC-004 is
introduced.

`ACCOUNT_BLOCKED` is reachable only from a cookie whose session row exists and
is revoked with reason `blocked`, or whose account is blocked while the row is
live; a caller who never held a session always receives `SESSION_ENDED` at most,
which is the guest state (FR-049, research R-04).

The account's status is read once per request, at the shared entry point, so the
block reaches the session's next request: a request already past that point when
the block is recorded is not interrupted and is decided on the state it met,
while every request that arrives afterwards is refused `ACCOUNT_BLOCKED`,
including one issued from a page that was already open, and the row is
tombstoned with `blocked` as that request is refused. The block waits for no
refresh, cache, or token lifetime, and a request already in flight neither
creates, extends, nor renews a session (FR-019).

A merchant-scoped row outside the caller's scope is answered with the same
`404 NOT_FOUND` status, body, and headers a row that does not exist receives, so
the answer never tells the caller that the row exists elsewhere and the scope
cannot be probed for another merchant's identifiers (FR-053).

`OTP_SEND_FAILED` is outside SC-004's enumeration comparison at both placements
— the fresh request's submission and the re-request's code step: it states the
messaging channel's response at acceptance, is produced identically whether or
not the number has an account, and is therefore not read as an account leak
(FR-034, SC-004).

The emoji test behind `INVALID_FULL_NAME` and `INVALID_SHOP_NAME` is the
predicate FR-026 fixes: a code point with the Unicode property
`Extended_Pictographic`, the variation selector U+FE0F, or the combining
encloser keycap U+20E3. It is one exported function in
`packages/shared/src/normalize/emoji.ts`, imported by the web form and
re-applied by the API before any write, so both surfaces refuse the same
characters (FR-026, FR-001; Clarifications 2026-11-01). The cause is carried in
`reason`, so the two field codes select their text by the pair (`code`,
`reason`) and the emoji refusal has its own row in `ui-contracts.md` §6
(Clarifications 2026-11-02). The three password codes
are the three refusal reasons FR-035 fixes — shorter than the minimum, longer
than the maximum, and common or breached — and the API returns the one that
applies, with `details` listing every value failure when more than one does
(§3).

## 4. Refusal order (FR-051)

The order is observable, identical on every page, and asserted by an integration
test that stacks two applicable refusals and asserts the earlier one.

| Step | Check | Applies to | Code |
|---|---|---|---|
| 0 | CSRF token + origin | every mutation | `CSRF_FAILED` |
| 1 | The operation's rate limit, decided for the request that **starts** the operation | sign-up form, sign-in, recovery request | `RATE_LIMITED` |
| 2 | Honeypot | sign-up only | *silent success* |
| 3 | Minimum time-to-submit (3 s, measured on the server clock from the form stamp) | sign-up only | `FORM_TOO_FAST` |
| 4 | Value rules — phone format, full name, shop name, city, password policy | sign-up, sign-in, recovery | `INVALID_*`, `CITY_NOT_IN_LIST`, `PASSWORD_*` |
| 5 | Account-existence comparison | sign-in, and sign-up/recovery only after the code | `AUTH_INVALID_CREDENTIALS`, or the stated outcome |

Within step 4 the API may report several failures in `details`; no
account-existence comparison runs until every value rule has passed. A later
step of the same page — the code entry, the new-password submission, the resend
control — is **not** decided by step 1 and is bounded by `OTP_*` and
`RECOVERY_EXPIRED` alone (FR-033, FR-034). A step once refused is never replaced
by a later one.

## 5. Routes

Unless a route says otherwise it requires the CSRF pair (§2.1). "Session:
allows restricted" means the route works for an administrator whose
`must_change_password` is still set; every other authenticated route requires an
unrestricted session and refuses `PASSWORD_CHANGE_REQUIRED` otherwise (FR-028).

### 5.1 `GET /api/v1/auth/csrf`

The render bootstrap: the one read a bare page makes before its first mutation.
No session required; no side effect beyond setting the cookie.

- **200** `{ "csrfToken": "<base64url>", "formStamp": "<base64url>" }` +
  `Set-Cookie: wafar.csrf=…`.
- `formStamp` is the value FR-029 measures the minimum time-to-submit from: an
  opaque, signed payload carrying only the server's issuance time and the
  destination `sign_up_form`. It is signed with HMAC-SHA256 under a key derived
  from the platform's authentication secret with the `form_stamp` context, so no
  second secret and no new environment key is introduced; the API verifies the
  signature and reads the issuance time against its own clock, so no part of the
  interval comes from the client.
- Idempotent; a second call may rotate and invalidates the previous token.
  Rotation does not invalidate a `formStamp` already issued — the stamp's own
  validity window bounds it, not the token generation.
- A `formStamp` is never stored server-side and is not consumed by a submission:
  the same stamp may accompany more than one submission inside its window, and
  the account-creation budget (§4 step 1) is what bounds how many follow one
  stamp.
- Refusals: none (transport errors only).

### 5.2 `POST /api/v1/auth/sign-up`

Starts an account-creation request and dispatches the code (FR-001 … FR-006,
FR-029, FR-033, FR-035).

**Request** — `SignUpRequest`

```json
{
  "fullName": "…",
  "phone": "0912345678",
  "password": "…",
  "city": "…",
  "shopName": "…",
  "website": "",
  "formStamp": "…"
}
```

`shopName` is optional; `website` is the honeypot (must be the empty string);
`formStamp` is the value §5.1 returned when the page rendered, submitted
unchanged. The request carries no time value: the interval FR-029 measures is
read from the stamp's own issuance time, on the server's clock. It carries
`X-Wafar-Pending: <requestId>` only while the page is still tied to a live
request (§2.2); without that header the submission starts a fresh request.

- **202** `{ "requestId", "phone": "+218912345678", "codeExpiresAt", "expiresAt" }` + `Set-Cookie: wafar.pending=…`
- **Refusals**: `RATE_LIMITED`, `FORM_TOO_FAST`, `INVALID_PHONE`, `INVALID_FULL_NAME`, `INVALID_SHOP_NAME`, `CITY_NOT_IN_LIST`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`, `OTP_SEND_FAILED`.
- **Order**: §4 steps 1 → 2 → 3 → 4. Step 5 does not exist here: no account is
  consulted, and the response is the same whether or not the number has one.
- **Honeypot (step 2)**: a non-empty `website` receives the same status, the same
  headers, the same field set and types as a success, with a generated but
  unstored `requestId` and resume token; no row is written, no message is sent,
  no code step is reachable, and no security event is emitted. The page's next
  step is chosen by the resume read (§5.3.1), not by this 202: the unstored id
  answers `OTP_EXPIRED` there, so the page stays on its first step. Only the
  random values differ between the two responses (FR-029). Its duration is held
  to the same one-sided tolerance a successful submission's 202 is measured
  against — median ≤ 50 ms and p95 ≤ 150 ms — so the refusal is not observably
  faster and a sender cannot detect it by its speed (`plan.md` §Verification
  Notes; Clarifications 2026-11-02).
- **Minimum time (step 3)**: the submission must arrive at least 3 s and at most
  30 min after the `formStamp`'s issuance time, both read on the server's clock.
  A missing, malformed, unsigned, forged, wrong-destination, too-young, or
  older-than-30-minutes stamp is `FORM_TOO_FAST`, with `formStamp` as its field;
  a time value the submitter supplies in its place is never read, so no request
  can shorten the interval. The budget of step 1 is already consumed, whether the
  submission is refused at step 2 or step 3 (FR-029).
- **Side effects**: origin counter, and the number counter when the value
  normalizes; a pending row (or its replacement) written **only after the
  channel accepts**; the structured event on a dispatch failure (FR-037).
- **Session**: none created.

### 5.3 `POST /api/v1/auth/sign-up/verify`

Consumes the code and creates the account and its session in one transaction
(FR-004, FR-006, FR-031, FR-034).

**Request** — `VerifyCodeRequest`: `{ "requestId": "…", "code": "123456" }` +
the pending cookie, whose `requestId` must match and whose token hash must match.

- **200** `{ "outcome": "created" }` + `Set-Cookie: wafar.session=…`; the pending
  cookie is cleared.
- **200** `{ "outcome": "existing_account" }`, `{ "outcome": "blocked_account" }`,
  or `{ "outcome": "administrator_account" }` — no session; the pending row is
  deleted; the page states the outcome and offers the links FR-006 fixes.
- **Refusals**: `OTP_EXPIRED` (unknown request, cookie mismatch, expired, or
  superseded), `OTP_INCORRECT`, `ACCOUNT_CREATION_FAILED`; **notice**:
  `OTP_REQUEST_ENDED` (the fifth incorrect entry ends the request, and the page
  returns to the flow's first step).
- **Order**: no operation rate limit (the request already started the operation);
  cookie → live code → code match → outcome.
- **Transaction**: `users.createAccount(tx)` + `accounts` credential insert +
  `sessions` insert + `phone_verifications` delete. Any failure rolls back all
  four, leaves the row and the code usable, and returns
  `ACCOUNT_CREATION_FAILED` (retryable), which is neither an incorrect entry nor
  a consumed re-request (FR-034).
- **Uniqueness**: the `users.phone_number` unique index decides; a conflict
  raised at insert is caught, the existing row's role and status are read, and
  the matching outcome is returned, so two simultaneous attempts produce one
  account and one outcome (FR-031, FR-006).
- **Events**: `auth.sign_up.verified` on success; no failed-sign-in record
  originates here.

### 5.3.1 `GET /api/v1/auth/verifications/{requestId}`

The resume read: what the code step and the new-password step need after a reload
or a fresh opening (FR-038, FR-014). Authenticated by the pending cookie alone;
no CSRF (a safe GET), no side effect.

**200**

```json
{
  "requestId": "…",
  "purpose": "sign_up",
  "state": "pending",
  "phone": "+218912345678",
  "codeExpiresAt": "…",
  "expiresAt": "…",
  "remainingReRequests": 2,
  "payload": { "fullName": "…", "city": "…", "shopName": "…" }
}
```

- `payload` is present for `purpose: "sign_up"` only. A recovery request answers
  `purpose`, `state`, `phone`, both expiries, and `remainingReRequests` — never a
  name, city, or shop name (FR-038, FR-015).
- `state: "verified"` tells the page to show the new-password step again (FR-014).
- `remainingReRequests` is `3 − re_requests`, so the page can disable the resend
  control without guessing (FR-034).
- **Refusals**: `OTP_EXPIRED` when the id is unknown, the cookie is absent, the
  token hash does not match, or the row has expired. A deleted row answers the
  same way, so the page returns to its first step with the expiry notice.
- The body is what this browser submitted, plus the canonical number; it never
  reflects an account lookup, so it cannot disclose whether an account exists.

### 5.4 `POST /api/v1/auth/verifications/resend`

Requests a new code for the live pending request (sign-up or recovery)
(FR-034, FR-040).

**Request** — `{ "requestId": "…" }` + the pending cookie.

- **202** `{ "codeExpiresAt", "expiresAt", "remainingReRequests" }`.
- **Refusals**: `OTP_EXPIRED`, `OTP_RESEND_LIMIT`, `OTP_SEND_FAILED`.
- **Order**: cookie → live request → `re_requests < 3` → channel.
- **Side effects**: the channel is called; only on `accepted` are the code hash
  replaced, `re_requests` incremented, and both expiries restarted. A `refused`
  or `timed_out` send changes nothing — the previous code stays the valid one,
  the request stays live, and no allowance is spent (FR-034).
- **Not rate-limited** by the operation budgets; the per-request allowance is its
  own bound.

### 5.5 `POST /api/v1/auth/sign-in`

Creates a session for an active merchant with the correct password (FR-007 …
FR-009, FR-017, FR-027, FR-033).

**Request** — `{ "phone": "…", "password": "…" }`

- **200** `{ "outcome": "signed_in" }` + `Set-Cookie: wafar.session=…`.
- **Refusals**: `RATE_LIMITED`, `INVALID_PHONE`, `AUTH_INVALID_CREDENTIALS`.
- **Order**: §4 steps 1 → 4 → 5, then the fixed verification sequence in §5.5.1.
- **Side effects**: both counters; on success a session row, `failed_sign_in_count`
  cleared to zero, and the success event; on a wrong password against an active
  merchant account, an atomic increment, the lock at five, the lock event; on a
  status or role refusal, the event, no increment, no lock extension.

#### 5.5.1 The uniform transcript (SC-004, research R-05)

Every non-successful sign-in attempt that reaches step 5 returns exactly:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Content-Type-Options: nosniff
… (the header set of §2.4)
X-Request-Id: <per request>

{"error":{"code":"AUTH_INVALID_CREDENTIALS","retryable":false}}
```

for all five cases — unknown number, wrong password, locked account, blocked
account, administrator account. No `Set-Cookie`, no `Retry-After`, no
`WWW-Authenticate`, no field name, no varying header.

The work is identical by construction:

1. Normalize the number (or refuse `INVALID_PHONE` before this sequence).
2. Read the account by number; when absent, use the decoy hash — a constant
   scrypt encoding of a random 32-byte value with the CMV 2 parameters,
   generated once at boot.
3. Perform exactly one scrypt verification with the CMV 2 profile.
4. If the account exists and is locked, refuse (no increment, no extension).
5. If it is blocked, refuse (no increment).
6. If it holds the administrator role, refuse (no increment).
7. If the password did not verify: for an existing active merchant account,
   increment atomically; at five, set `locked_until = now() + 15 min` and emit
   the lock event; refuse.
8. Otherwise create the session and answer 200.

The enumeration test samples 200 requests per case after a 20-request warm-up,
drops the top and bottom 5% of durations, and asserts (a) byte-identical bodies,
(b) the same status, (c) the same header set excluding `Date` and `X-Request-Id`,
(d) median duration difference ≤ 50 ms and p95 difference ≤ 150 ms against the
unknown-number case. `INVALID_PHONE` and `RATE_LIMITED` are excluded from the
comparison, as SC-004 provides.

### 5.6 `POST /api/v1/auth/sign-out`

Ends the current session (FR-010). Session: allows restricted.

- **Request**: no body.
- **204** always, once CSRF passes: a live session is revoked with `sign_out`; an
  ended session or an unknown cookie leaves nothing to do; the cookie is cleared
  in every case. Sign-out is therefore idempotent and never fails on a session
  that already ended.
- **Side effects**: `revoked_at`/`revoked_reason`, the revocation event when a row
  changed. No SMS (FR-043).
- **Refusals**: `CSRF_FAILED` only.

### 5.7 `POST /api/v1/auth/sign-out-all`

Ends every session of the account (FR-011, FR-043). Session: allows restricted.

- **Request**: no body.
- **204**: every live session of the account is revoked with `sign_out_all`
  (including the current one); the cookie is cleared. Idempotent for an ended
  session whose row still exists: the account is resolved from the tombstone and
  the remaining live sessions are revoked; an unknown cookie answers 204 with
  nothing done.
- **Side effect**: one notice is dispatched best-effort to the registered number;
  a failed dispatch is recorded and changes nothing (FR-043).
- **Refusals**: `CSRF_FAILED` only.

### 5.8 `POST /api/v1/auth/password/forgot`

Starts a recovery request and dispatches the code (FR-014, FR-015, FR-033).

**Request** — `{ "phone": "…" }` + the pending cookie and, only while the page
is still tied to a live request, `X-Wafar-Pending: <requestId>` (§2.2).

- **202** `{ "requestId", "phone": "+218…", "codeExpiresAt", "expiresAt" }` + the
  pending cookie.
- **Refusals**: `RATE_LIMITED`, `INVALID_PHONE`, `OTP_SEND_FAILED`.
- **Order**: §4 steps 1 → 4. No account lookup happens before the code is
  verified; the response is the same whether or not the number has an account,
  holds the administrator role, or is blocked (FR-015).
- **Side effects**: both counters; a `recovery` row on accepted dispatch; SMS.

### 5.9 `POST /api/v1/auth/password/forgot/verify`

Verifies the recovery code (FR-014, FR-015, FR-027).

**Request** — `{ "requestId": "…", "code": "…" }` + the pending cookie.

- **200** `{ "outcome": "verified" }` — the row moves to `verified`; the cookie is
  kept; the page shows the new-password step (and shows it again after a reload).
- **200** `{ "outcome": "no_account" }` or `{ "outcome": "administrator_account" }`
  — the row is deleted, no password is set, no session is created, and the code
  step is replaced in place by the terminal message. The role decides before the
  status: a blocked administrator answers `administrator_account` (FR-014,
  FR-027).
- **Refusals**: `OTP_EXPIRED`, `OTP_INCORRECT`; **notice**: `OTP_REQUEST_ENDED`
  (the fifth incorrect entry ends the request, and the page returns to the flow's
  first step).
- **Note**: the verified state lasts no longer than `request_expires_at`; the
  response is the last point at which the code could be verified.

### 5.10 `POST /api/v1/auth/password/reset`

Sets the new password for a verified recovery request (FR-013, FR-014, FR-035,
FR-043).

**Request** — `{ "requestId": "…", "newPassword": "…" }` + the pending cookie.

- **200** `{ "outcome": "reset" }` for an account that is not blocked, or
  `{ "outcome": "reset_blocked" }` when the reset completed while the block
  stands (the confirmation states both facts).
- **Refusals**: `RECOVERY_EXPIRED` (the row is gone, expired, never verified, or
  deleted by a concurrent password change), `PASSWORD_TOO_SHORT`,
  `PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`.
- **Side effects**, one transaction: rewrite the credential; revoke every session
  with `password_change`; delete the pending row; clear the pending cookie. Then
  one notice is dispatched best-effort. The credential write is conditional on
  the `verified` row still existing in that transaction, so a change that
  committed first makes this request write nothing and answer `RECOVERY_EXPIRED`
  (FR-013, FR-014). The lock is **not** lifted and the consecutive-failure count
  is **not** reset (FR-009).
- **Order**: value rules before any write.

### 5.11 `POST /api/v1/auth/password/change`

The account's own change action — behaviour only, no page (FR-013, FR-028,
FR-035, FR-044). Session: allows restricted.

**Request** — `{ "currentPassword": "…", "newPassword": "…" }`

- **200** `{ "outcome": "changed" }`; every session of the account is revoked with
  `password_change`, including the one the change was made from; the cookie is
  cleared; the page (when R7 adds it) returns to sign-in.
- **Refusals**: `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`, `PASSWORD_UNCHANGED`
  (only when `must_change_password` is set and the new value verifies against the
  stored hash), `AUTH_INVALID_CREDENTIALS` (wrong current password **or** the
  account is locked — one code, one text, no lock hint; FR-009), and
  `SESSION_ENDED`/`ACCOUNT_BLOCKED`.
- **Order**: value rules (policy, then the forced-change difference check) → lock
  → current-password verification → write. A submission refused by a value rule
  does not increment the count; a failed current-password check does, and five
  lock the account exactly as five failed sign-ins do. The failed check emits
  `auth.password.current_check_failed` with its `path`; a value-rule refusal and
  a lock refusal emit no security event.
- **Side effects**: credential rewrite; `must_change_password = false`; every
  session revoked; any pending recovery row for the number deleted (FR-014); one
  notice. The credential write is conditional on the session still being live in
  that transaction, so a reset that committed first makes this request write
  nothing and answer `SESSION_ENDED` (FR-013, FR-014). A correct current password
  clears the consecutive-failure count but does not lift a running lock (FR-009).

### 5.12 `GET /api/v1/auth/session`

The frame's read at R2 and the integration suite's session check; the three bare
pages never call it (FR-041).

- **200** `{ "authenticated": false }` — no cookie, or a token matching no row.
- **200** `{ "authenticated": true, "user": { "fullName": "…" }, "session": { "expiresAt", "lastActivityAt", "restricted": false } }`.
- **401** `SESSION_ENDED` / **401** `ACCOUNT_BLOCKED` — the cookie maps to a
  tombstone, or the live session was ended by a clock or a block on this request.
- No CSRF requirement; a request with `X-Wafar-Activity` is covered by §2.3.
- The body carries the caller's name only: no phone, city, shop name, role,
  status, or identifier.

### 5.13 `GET /health`

- **200** `{ "status": "ok", "database": "ok" }` when a `SELECT 1` succeeds;
  **503** `{ "status": "degraded", "database": "error" }` otherwise.
- No authentication, no PII, no dependency beyond PostgreSQL. The deployment
  slice adds the other dependencies it introduces.

## 6. Security events (FR-037)

One JSON record per event, emitted by the API's structured logger with a
correlation id. The list is closed for R1:

| Event | When | Carries |
|---|---|---|
| `auth.sign_in.failed` | Every attempt that reaches step 5 and fails (wrong password, unknown number, locked, blocked, administrator) | `reason` |
| `auth.sign_in.succeeded` | A session is created at sign-in | — |
| `auth.sign_up.verified` | The verification that creates an account | — |
| `auth.lock.applied` | The fifth consecutive failure sets the lock | — |
| `auth.password.changed` | The account's own change completes | — |
| `auth.password.current_check_failed` | A submission that passes every value rule reaches the current-password check of a password change — the account's own change action or the administrator's forced first change — and the current password is wrong | `path` (`change` / `forced_change`) |
| `auth.password.reset` | A recovery reset completes (blocked or not) | `blocked` boolean |
| `auth.session.revoked` | An explicit end: sign-out, sign-out-all, platform revocation | `reason`, `sessionCount` |
| `auth.otp.dispatch_failed` | The channel refused or timed out | `kind` (`sign_up`/`recovery`), `channel` |
| `auth.notice.dispatch_failed` | A security notice failed | `kind` |
| `auth.administrator.provisioned` | The CLI creates an administrator | — |

Every record carries `event`, `level`, `timestamp`, `requestId` (or the CLI's
process id), `outcome` (`success` or `failure`), and `reason` where the table
names one; a record produced for an existing account also carries `accountId`,
the internal identifier alone, and a record produced for a number with no
account carries none. **No** phone
number, full name, city, shop name, token, session id, code, hash, IP address,
or request body appears in any record. A format refusal and a rate-limit refusal
emit no `sign_in.failed` record, because neither reached an account comparison.
A value-rule refusal of a password change and a lock refusal emit no
`password.current_check_failed` record, because neither reached a password
verification.

## 7. Non-HTTP surfaces

### 7.1 SMS transport port

```ts
type SmsKind = 'otp_sign_up' | 'otp_recovery' | 'notice_password_changed' | 'notice_signed_out_all'
type SmsResult = 'accepted' | 'refused' | 'timed_out'

interface SmsTransport {
  send(input: { to: string; body: string; kind: SmsKind }): Promise<SmsResult>
}
```

- `to` is always E.164; `body` is one of the fixed Arabic templates in
  ui-contracts §7 (Latin digits, no emoji).
- The Twilio adapter uses the REST API through the `twilio` SDK with a 750 ms
  timeout, no in-request retry, and no fallback provider. A timeout is
  `timed_out` and is treated exactly as `refused` (FR-034, SC-009).
- The fake adapter (`SMS_TRANSPORT=fake`, tests and CI) records
  `{ to, body, kind, at }` in memory, returns `accepted` by default, and can be
  told to return `refused`/`timed_out` or to fail the next N sends. Its
  acceptance duration is `SMS_FAKE_ACCEPT_MS` — 0 to 750 ms, `0` by default — so
  a suite or the load run that must measure the wait sets it, and the wait sits
  inside the measured request exactly where the adapter's provider call sits
  (`plan.md` → Technical Context).
- The fake also writes one structured `sms.fake.dispatched` line at
  `info` level so a developer running `pnpm dev` reads the code from the API
  console. Production logs never carry a code.

### 7.2 `provision-administrator` (FR-028)

`node apps/api/dist/cli/provision-administrator.js` (and the `pnpm` script in
development).

- Prompts on the TTY for full name, mobile number, city, and the initial password;
  the password is read with echo disabled, or from `--password-stdin`. There is
  **no** `--password` flag (shell history and process list).
- Applies FR-001, FR-003, FR-005, FR-031, and FR-035 exactly as sign-up does;
  a failing value is refused with a message and no account is created.
- Creates `User` (`role = administrator`, `status = active`,
  `must_change_password = true`, `phone_number_verified = true` — the flag records
  the operator's out-of-band confirmation of the number, and no code is sent) and
  its credential in one transaction, with the reserved sentinel
  `218912345678@phone.invalid` for `+218912345678` (the canonical number without
  `+`, then `@phone.invalid`; never displayed or messaged).
- Repeatable; a number that already has an account is reported as a conflict and
  creates nothing.
- Emits `auth.administrator.provisioned`; writes no audit-log row and no SMS.
- Exit codes: `0` created, `1` refused (invalid value or conflict), `2`
  unexpected failure.

### 7.3 `revoke-session` (FR-012)

`node apps/api/dist/cli/revoke-session.js --session <id>` or
`--user <+218…>`; the reason is always `platform_revocation`.

- Sets `revoked_at`/`revoked_reason = platform_revocation` on the matching live
  sessions; the next request bearing the token is refused `SESSION_ENDED`.
- Emits `auth.session.revoked` with `reason` and `sessionCount`; no SMS.
- Exit codes: `0` at least one row revoked, `1` nothing matched, `2` unexpected
  failure.

### 7.4 What the API does not expose

No `/api/auth/*` (the library's handler is not mounted); no email endpoint; no
sign-up or sign-in by email; no administrator route (the administrator's first
sign-in is `auth.service.signInAdministrator`, a service function with no HTTP
route); no user update, delete, block, or quota route; no city or prefix
endpoint (the datasets are bundled); no session listing; no audit endpoint.
