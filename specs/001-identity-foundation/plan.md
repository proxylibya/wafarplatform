# Implementation Plan: Identity and Foundation

**Branch**: `001-identity-foundation` | **Date**: 2026-10-29 | **Re-evaluated**: 2026-10-30, 2026-10-31, 2026-11-01, 2026-11-02, 2026-11-03, 2026-11-04, 2026-11-05 | **Gap-filled**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-identity-foundation/spec.md`

## Summary

R1 delivers the merchant identity lifecycle and the foundation every later slice
consumes. A visitor creates a merchant account with a full name, a Libyan mobile
number on +218 (no dial-code selector), a password, a city from the fixed Libyan
list, and an optional shop name; the number is confirmed by a one-time code
before any `User` row exists, and verification creates the account and its
session together. A verified merchant signs in without a code, signs out, signs
out of every device, recovers a forgotten password by one-time code, and is
subject to a fifteen-minute lock after five consecutive failed attempts. The
slice also builds the shared frame's composition (header, sidebar, footer band,
and — on a narrow screen — the bottom bar, the frame's fourth region) without
shipping a page that renders it, and it establishes the repository, the Wafar UI
layer, the test runner, the CI gate, the public-interface documentation gate, the
SMS port, the encrypted backup and restore tooling, and the single shared
merchant-scoping entry point.

The technical approach: a pnpm + Turborepo monorepo; Nuxt 4 for `apps/web` and
the Wafar UI layer at `packages/ui`; a Hono modular-monolith API with the `auth`
and `users` modules; better-auth 1.7.18 with its phone-number extension as the
credential and session engine; PostgreSQL 16 through Drizzle ORM as the system
of record, including the transient verification store and the rate-limit
counters, with a boot-time schema-version guard that refuses to listen when the
expected migration is absent; Twilio Programmable Messaging behind an SMS port;
an OpenAPI 3.1 document generated from the Zod contract schemas, whose
generation is R1's public-interface documentation gate — the first standalone
documentation-drift test is R2's (ADR-031 item 4); Vitest, Playwright,
axe-core, and Lighthouse CI as the test, accessibility, and performance gates;
GitHub Actions as the continuous-integration provider.

## Technical Context

**Reading rule for numbers.** Every number in this section is either a value a
Constitution Mandated Values row states, a plan value recorded in the section
itself (the rail width, the Unicode pin, the SC-009 file), or a value
`Project-Technologies.txt` and the lockfile carry; a restatement names its
source and is never a second authority.

**Language/Version**: TypeScript 5.x with strict mode mandatory (Principle II) — every workspace enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, and `noUnusedParameters`. Runtime: Node.js 22 LTS (`.nvmrc` = `22`, ADR-021).

**Primary Dependencies**: The constitution's Technology Standards register in `.specify/memory/constitution.md`, whose current version is read from `.specify/memory/version.json` and never restated here (Governance), carries these bounds rather than exact versions: Nuxt 4, Vue 3, Nuxt UI v4, Tailwind CSS v4, TanStack Query, Zod, Hono, better-auth (phone-number extension; `scim` and `sso` disabled), Drizzle ORM, PostgreSQL 16+, PgDog (fallback PgBouncer), and Lighthouse CI. Every exact version R1 consumes — Nuxt 4.6.4, Nuxt UI 4.11.2, Tailwind CSS 4.3.4, TanStack Query 5, Zod 4, Hono 4.13.17, and better-auth 1.7.18 — is a value `Project-Technologies.txt` and the committed lockfile carry, not a value the constitution fixes. The 2026-11-09 dependency update moved Nuxt to 4.6.4, Tailwind CSS to 4.3.4, Hono to 4.13.17, and better-auth to 1.7.18; Complexity Tracking rows 39–41 record the movements and their dispositions, and the historical ADR-151 and research R-01 text stays as the record of the versions the decisions were made against. The five register-gap choices that clear Dependency Governance are now rows of that register (ADR-146): **Twilio Programmable Messaging** (transactional SMS transport, ADR-141), **GitHub Actions** (continuous-integration provider, ADR-143), **`@cyclonedx/cyclonedx-npm`** (SBOM generator, ADR-144), **PostgreSQL's built-in `pg_basebackup` + WAL archiving** (backup and restore tooling, ADR-142), and **`@axe-core/playwright`** (the automated accessibility checker, ADR-145); each carries a licence obligation, a vulnerability scan, and a review date (Complexity Tracking). The icon set and the typeface stay assets of the Wafar UI layer (ADR-098, ADR-137, ADR-138) rather than register rows. Pinia is *not* introduced by R1: the only client state is the appearance (owned by `@nuxtjs/color-mode` through Nuxt UI) and per-page step state, so no client store is needed. TanStack Query owns the session resource; the city list and the mobile-prefix set
are bundled reference modules in `packages/shared`, not network resources.

**Storage**: PostgreSQL 16+ through `packages/db` (Drizzle). R1 creates the two module schemas (`packages/db/schema/{users,auth}.ts`) and their six tables (see `data-model.md`). OpenSearch and SeaweedFS are provisioned for development by the foundation phase but no R1 code reads or writes them. PgDog sits between the API and PostgreSQL in every environment; PgBouncer is the named fallback the Technology Standards register requires, and the obligation its AGPL-3.0 licence imposes, the coupling the pre-1.0 hop creates, and the review date are Complexity Tracking row 7.

**Schema version guard**: the build embeds the expected schema version — the SHA-256 of `packages/db/migrations/meta/_journal.json` together with the applied-step count — in `packages/db/schema-version.ts`. `apps/api/src/index.ts` reads the applied-migration rows (`drizzle.__drizzle_migrations`) from PostgreSQL at boot and compares their count and hashes with that value before the listener opens; an absent or different version stops startup with a non-zero exit, so no instance serves traffic against an unmigrated database (Schema and Migration Control). An integration test starts the API against an unmigrated database and asserts the refusal; a second starts it at the expected version and asserts readiness.

**Health probe**: `GET /health` (unversioned, unauthenticated) runs `SELECT 1` on PostgreSQL at every call and answers 200 `{ "status": "ok", "database": "ok" }`, or 503 `{ "status": "degraded", "database": "error" }` when the database is unreachable (`contracts/auth-api.md` §5.13). PostgreSQL is the only dependency it probes because it is the only dependency whose absence leaves the service unable to serve: Twilio is an outbound channel whose timeout is already a refusal the flow handles (CMV row 13), so an SMS-provider outage does not report the API unhealthy. The test suite stops the database and asserts the 503.

**Testing**: Vitest for unit and integration, including the unit specs under `apps/web/tests/unit` (jsdom + `@vue/test-utils` for component tests; Complexity Tracking row 36), Playwright for end-to-end and the visual baseline, `@axe-core/playwright` for the automated accessibility scan, Lighthouse CI (`@lhci/cli`, Apache-2.0) for the LCP/INP/CLS budget, with the INP user flow under `apps/web/tests/perf/`. The public HTTP contract is generated from the same source as the implementation: `apps/api/src/http/openapi.ts` emits OpenAPI 3.1 from the Zod schemas in `packages/shared/src/contracts/**` using Zod v4's built-in `z.toJSONSchema()` (no new dependency) plus the route table, and the emitted `apps/api/openapi.json` is the published record; the first standalone documentation-drift test — comparing that document, the routes the app registers, and `contracts/auth-api.md` §5 — is R2's (ADR-031 item 4), so R1 adds no second check of the same records. The SMS port is replaced by a deterministic fake in tests and in CI.

**The fake transport's acceptance duration (FR-029, AC-031, SC-009)**: `SMS_TRANSPORT=fake` selects the port's fake, and `SMS_FAKE_ACCEPT_MS` fixes its acceptance duration — a whole number of milliseconds between **0** and **750** (the adapter's timeout is the upper bound, because a longer wait is a timeout rather than an acceptance), `0` by default, named in `.env.example` as a non-secret, and read once at boot through the validated environment schema, so a value outside the range stops startup. The delay runs inside the transport call, before the fake answers `accepted`, exactly where the adapter's provider wait sits, so it is inside the request's measured duration; the fake stays deterministic — the same configured delay on every dispatch — records each message in memory, and writes the one console line `quickstart.md` §2.1 reads. The default `0` makes the port's rolling estimate `0`, so the silent refusal waits `0`: correct for an instant channel, and no evidence that the wait exists. The estimate is the median of the **last sixteen accepted dispatch durations** — in memory, never keyed by number or client, capped at the provider's 750 ms timeout, and reset with the process — and it has its own unit test beside it (`apps/api/src/modules/auth/sms/acceptance-estimate.ts` and `apps/api/src/modules/auth/sms/__tests__/acceptance-estimate.spec.ts`), which pins the empty window at `0`, one sample, an even and an odd window, the eviction of the oldest sample when the seventeenth arrives, the cap, and the reset. Sixteen is smaller than the **20-request warm-up** the timing protocol runs, so every measured sample is taken after the estimate has converged; a run that sets the key to `V` measures a success 202 that waits `V` and a refusal whose wait converges on `V`. The timing suite sets `200` and the load run `50` (the two conditions are fixed in the Verification Notes and in **The SC-009 load profile**).

**Target Platform**: Linux VPS (deployment, the three environments with staging parity, and the monitoring and alerting set are R12's; R1 delivers the configuration contract they consume — Complexity Tracking row 25), modern browsers — the two latest major versions of Chrome, Edge, Firefox, and Safari.

**Project Type**: Monorepo — `apps/` (web, api; admin and worker belong to later slices) + `packages/` (shared, db, ui, config; search belongs to R3). See `docs/architecture.md`.

**Performance Goals**: p50 ≤ 150 ms and p95 ≤ 1,000 ms for every authentication request path, measured under the load condition below, with the wait for the messaging channel's acceptance inside the budget (SC-009). No authentication query exceeds 100 ms at p95. The three bare pages carry a Lighthouse budget — **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1** on the mobile preset — asserted by the `lighthouse` job in `.github/workflows/ci.yml`; SC-009 bounds a request's server-side completion alone, so this rendering budget is separate from it and neither is read as covering the other (Clarifications 2026-11-05); the public Parts and Home pages join the assertion set when R2 and R4 ship them.

**Constraints**: (readings of CMV rows 3, 4, and 18, which are the authority; a value changes there first) The SC-009 measurement condition — up to 10,000 registered accounts, up to 500 concurrent sessions, and a peak of no more than 10 authentication requests per second across the three authentication operations. The measurement is the aggregate of 20 origin keys at 0.5 requests/second each, never one key at 10, under the key plan in **The SC-009 load profile** below; no limit is disabled, raised, or skipped for it. The three figures are a measurement condition, not a service limit: no request is refused for reaching them, and above them FR-033's per-key budgets still decide each request exactly as they do below the ceiling, while a request the platform cannot serve is FR-040's unnamed failure, rendered on the page that made it (Clarifications 2026-11-05). The Usage Limits table's file, cart, and search budgets do not apply (no upload, cart, or search surface). Session timeout 30 minutes of merchant-initiated inactivity; absolute maximum lifetime 12 hours; one-time-code lifetime 5 minutes; re-request limit 3 per pending request; incorrect-entry bound 5; sign-in lock 15 minutes after 5 consecutive failures; sign-up minimum time-to-submit 3 seconds, measured from a signed form stamp valid for 30 minutes.

**Scale/Scope**: The starting point is `docs/capacity-model.md` → §3.1 (10,000 registered accounts in six months, 50,000 without a new architectural decision, 3,000–5,000 concurrent online, 300 RPS at design). R1's own load is a small fraction of that envelope: identity traffic is at most 10 requests/second at peak, the live session population is bounded by 500 in the measurement condition, and the transient request store holds at most one live row per submitting number. The deviation from the capacity model's concurrent and RPS envelope is recorded in Complexity Tracking.

**Design value FR-022 delegates (the collapsed rail)**: the icon-only rail is
**4.25rem** wide — 68 px at a 16 px root. It is the one design value FR-022
leaves to this plan, and the row `ROADMAP.md`'s First obligations table assigns
to R1, which records and consumes it and chooses no width of its own. It is not a
width this slice invents: ADR-128 decision 5 fixes it, the Wafar UI layer records
it as its rail-width token, and `WfShellSidebar` consumes that token in its
`collapsed` state, so the expanded sidebar, the rail, and the drawer share one
width ladder and no page restates the number. It is recorded here rather than
under Constitution Mandated Values because the constitution's list is closed and
the value is not open — ADR-128 fixes it — so the plan records the slice's
binding value and the layer owns the token (ADR-017; ADR-093; ADR-128).

**Supplied-value validation (FR-026)**: The emoji predicate is fixed by the
specification, once, in FR-026 — a code point with the Unicode property
`Extended_Pictographic`, the variation selector U+FE0F, or the combining
encloser keycap U+20E3. R1 implements that predicate once, as a function in
`packages/shared/src/normalize/emoji.ts`, imported by the sign-up form and
re-applied by the API before any write, so a full name or shop name is refused
on the same characters at the form and at the route, among the value rules and
before account existence is consulted. The refusal's Arabic text is a row of
`contracts/ui-contracts.md` §6 under the existing `INVALID_FULL_NAME` /
`INVALID_SHOP_NAME` codes, keyed on the code and the `reason` the refusal
carries: the table's five cause rows are the full name's `empty`, `too_long`,
and `emoji` and the shop name's `too_long` and `emoji`, so the emoji refusal has
its own text rather than sharing the length message; T054 builds the mapping
from that table and no error code is added (FR-001, FR-026; Clarifications
2026-11-01 and 2026-11-02).

**The silent hidden-field refusal (FR-029, AC-031)**: the mechanism FR-029
delegates to this plan is the resume read, not the 202. A submission that fills
the hidden `website` field — one the operation's limit does not refuse first
(FR-051; CMV row 3) — receives the same 202 a successful submission receives —
the same status, headers, field set, and types — carrying a generated but
unstored `requestId` and resume token, with no row written, no code dispatched,
and no security event emitted (`contracts/auth-api.md` §5.2). A submission whose
account-creation budget is already spent is decided by the limit first and
receives the distinct, explicit limit refusal whatever else is wrong with it, a
filled hidden field included (AC-031; AC-033). The
page does not derive its next step from that response: after any 202 the sign-up
form reads its request back through
`GET /api/v1/auth/verifications/{requestId}` with the pending cookie, and it
enters `code` only when that read answers 200. The unstored id answers
`OTP_EXPIRED` (unknown request), so the page stays on `form`, unchanged and with
no message; the read is the transition out of `submitting`, before any code step
was shown, so the expiry message that belongs to `code` is never rendered. The
response therefore carries no next-step content — no field names the step or the
outcome, and the `requestId` and the two expiries are the same shape in both
responses — as AC-031 requires, while the same response leads a successful
submission to the code step.
`contracts/ui-contracts.md` §3.1 and `quickstart.md` Scenario 6 state the same
mechanism. Record 15 fixes it, and T142 in `tasks.md` appends that record.
Four refusals are decided before FR-051's step (1) and stand outside its
five-step order — the request's forgery and origin check (FR-044), its body-size
bound, its method, and an unknown route — so no page rule in the order runs on a
request any of them refuses (Clarifications 2026-11-05;
`contracts/auth-api.md` §2.1 and §4).

**The refusal's duration (FR-029, AC-031)**: a successful 202 waits for the
messaging channel's acceptance (FR-034), and the silent refusal dispatches
nothing, so the plan does not pad the refusal to a constant and does not promise
an identical wait — a constant long enough to cover the channel's tail would make
the refusal the slower of the two, and one short enough to sit at the channel's
median would leave it faster whenever the channel was slow. The refusal instead
performs the same pre-dispatch work the success path performs — normalization,
the value rules, and the pending password's hashing — on a discarded copy, so the
work component is equal, and then waits for the channel's own current acceptance
duration: a single scalar the dispatch port keeps as the rolling median of its
last sixteen accepted dispatches, in memory, never keyed by number or client,
capped at the provider's 750 ms timeout and reset with the process. The two durations
therefore differ by the gap between that estimate and the individual channel wait
alone, and T073 measures the pair one-sided against the same tolerance the
enumeration test uses — median ≤ 50 ms and p95 ≤ 150 ms over 200 samples per case
after a 20-request warm-up with the top and bottom 5% dropped — so a refusal
returned at once or padded to a constant fails it. The estimate is one scalar
rather than a cache: it carries no request, number, or response, is not read by
any rule but this wait, and its inflation by an attacker is bounded by the
number-keyed budgets that price real dispatches.

**The SMS segment bound (CHK013)**: A body is sent as **UCS-2** — GSM-7 cannot
carry Arabic — so the counting unit is the UTF-16 code unit of the rendered body,
after `{code}` is replaced by its six Latin digits, with no byte-order mark and no
user-data header. The bound is fixed by class: a one-time-code body MUST fit **one
segment, 70 code units**, and a notice body MUST fit **two segments, 134 code
units** (2 × 67, the 6-byte concatenation header included). The transport sends
the body as one request and never truncates, splits, or appends a signature: a body
inside its class is sent whole, and where a notice uses its second segment the
carrier's own concatenation is the carrier's. The
four bodies stand at **51** (`otp_sign_up`), **64** (`otp_recovery`), **84**
(`notice_password_changed`), and **71** (`notice_signed_out_all`) code units: both
code bodies sit inside one segment and both notices inside two. The recovery body
was reworded to fit — «لا تشاركه مع أحد» became «لا تشاركه», the closing clause
the sign-up body now carries as well, so the two state the instruction the same
way — and `contracts/ui-contracts.md` §7 records the four. A body that exceeds its
class's bound is a **build failure, not a runtime branch**: the template is
reworded, or a class's bound is raised only by a recorded decision, and no body is
ever cut to fit. T026's unit test renders each template with a six-digit code and
asserts its length against its class's bound, and T100's scan then applies FR-026's
rules to the same rendered strings. The notice's two-segment allowance is
deliberate: its two facts — the change and the sessions it ended — and the
instruction to act on them cannot be stated in 70 code units, and the notice is
sent only on the two security events FR-043 names, so the second segment is a cost
the copy accepts rather than a length the copy is cut to.

**The emoji predicate's Unicode data (CHK025)**: FR-026 fixes the predicate — a code
point with the property `Extended_Pictographic`, the variation selector U+FE0F, or
the keycap U+20E3 — but not the release the property is read from, so a new Unicode
version could change a value's verdict with no decision. The plan pins it:
**Unicode 18.0.0**, `https://www.unicode.org/Public/18.0.0/ucd/emoji/emoji-data.txt`
(dated 2026-01-30), SHA-256
`80d00f8e616a0ef27fd6b8de3b758c06383b5d917e2977709578e68baf733bf1`, carrying **455**
`Extended_Pictographic` ranges. The file is vendored at
`packages/shared/vendor/unicode/18.0.0/emoji-data.txt`; `scripts/gen/emoji-data.mjs`
(dependency-free Node, like the drift check) reads it and emits
`packages/shared/src/normalize/generated/emoji-data.ts` as a sorted range table whose header
carries the version, the URL, the SHA-256, and the range count. The generated file
is committed, and a test regenerates it from the vendored file and fails on any
difference, so the two cannot drift. `hasEmoji` tests membership against that table
and the two named code points; it never calls the runtime's
`\p{Extended_Pictographic}`, because that answers from the ICU build the runtime
ships — Node 22's is older than 18.0.0 — so the same value would be refused on one
runtime and accepted on another. The pin is recorded here rather than under
Constitution Mandated Values because that list is closed at its nineteen values
and a new value is added there by a constitution amendment, not by a plan; this is
the reading the rail-width paragraph above records for the one design value FR-022
delegates. **Upgrading it** moves the vendored file, the generated table, and the
recorded SHA-256 together in one dependency-update change, with an ADR that names
the old and new versions and lists every code point whose verdict changes; the
predicate's boundary cases are re-run and the regeneration test proves the table. A
release that changes no verdict is a data refresh recorded in the plan of the slice
that performs it. A release that changes one is a change to FR-026's predicate,
which the specification owns, so it needs that specification's amendment in the
same change and cannot ship as an upgrade alone. Nothing else reads the version:
the predicate is its only consumer, and no product rule depends on the Unicode
release beyond it.

**The copy's authority (CHK036, CHK002)**: `contracts/ui-contracts.md` is the
single authority for the slice's literal Arabic text, and its opening "The
inventory" paragraph states the complete set once; every user-facing string is
in that set and a string outside it is not delivered. The R1 capture set under
`docs/design/screenshots/R1/` — thirteen images, each with an entry in
`docs/design/screenshots/manifest.json` (`kind: reference`, source "design lab,
Precision model", captured 2026-10-27) — is evidence of the reference
composition and appearance only: it governs no string, and where a capture and
the contract differ the contract wins (the diacritics rule and the lab's
lockout alert are the recorded differences). The capture set does not show the
code step, an in-progress state, a refusal, the two status notices, or a message
body; the contract records those strings, and the four SMS bodies are the plan's
own values because the lab has no messaging surface. This change adds no
planning or contract artifact reference to `spec.md`: FR-026 states the copy's
rules and its identity, and AC-028 asserts that every rendered string is the text
recorded for its state, reason, or cause.

**The numerals in copy (CHK004)**: The copy states **100** characters for the full
name and the shop name (CMV 19), **12** and **128** for the password (CMV 17), and
**6** digits for the code with **5** minutes for its lifetime (CMV 18); a recorded
value's change must not leave a message stating the old number. The binding is
mechanical. `packages/shared/src/limits.ts` is the single source of the slice's
numeric limits — `passwordMinLength` 12, `passwordMaxLength` 128,
`fullNameMaxLength` 100, `shopNameMaxLength` 100, `otpLength` 6,
`otpLifetimeMinutes` 5 — each annotated with its CMV row, and the Zod schemas in
`packages/shared/src/contracts/**` import the same constants, so the form's rule,
the route's rule, and the message cannot disagree. Every user-facing string that
carries one of them is a template whose numeral is a slot —
`{passwordMinLength}`, `{passwordMaxLength}`, `{fullNameMaxLength}`,
`{shopNameMaxLength}`, `{otpLength}`, `{otpLifetimeMinutes}` — filled at render
from that module: `apps/web/app/composables/auth/useAuthMessages.ts` for §6, the
three pages' copy for §3.4, §4.2, and §5.2, and `apps/api/src/modules/auth/sms/`
for §7. No template carries a numeral as typed text; the only digit sequences a
string may carry literally are the `+218` prefix the mobile number always
carries and the phone field's placeholder `91 000 0000`, and neither is a CMV
value: the placeholder is a prompt in the empty field, not a display form of a
number, and the one display form the platform renders is `+218 91 234 5678`
(FR-038; Clarifications 2026-11-02, session 41). The contract records the binding
beside the text: §6 carries the numeral-bearing rows with their slot and their
source, and §3.2 and §7 point at it. Two checks hold it:
`apps/web/tests/unit/copy-values.spec.ts` and T026's template test assert that
every slot resolves from `limits.ts`, that each rendered string carries its slot's
value, and that it carries no other numeral, so a CMV change either updates the
message automatically or fails the test; and T100's scan asserts that no template
carries a numeral literal, so the derivation cannot be bypassed by typing the
number into a new string. The counted noun is part of the template rather than derived, and it is
written for the value's agreement class, which the last two digits select: `00`,
`01`, and `02` singular («100 حرف»), `03`–`10` plural genitive («6 أرقام»،
«5 دقائق»), and `11`–`99` singular accusative («12 حرفا»، «128 حرفا»). The same
test asserts that each value still falls in the class its string declares, so a
change inside a class renders correctly with no copy edit and a change across one
fails the test and forces the noun form's revision in the same change — the numeral
follows its source and the sentence stays grammatical.

**The copy's closures (CHK006, CHK007, CHK014–CHK020, CHK028–CHK032, CHK035)**:
`contracts/ui-contracts.md` now states the slice's copy completely, and the
bindings a reader checks are these. The nine sidebar labels and the four
static-page labels are recorded values of the one record — the English names in
the specification and in §1 are destination identifiers, not a second text — and
the four sit in a table of their own beside the nine. Each act carries one label
and each step one in-progress label, the ellipsis is U+2026, and the recovery
form's first-step submit now reads `إرسال رمز التحقق`, the same label the sign-up
form carries, because both request the same code; the two back controls keep
`تعديل البيانات` and `تغيير الرقم` because they return to different forms, and the
table records why. One control shows one label: the sign-in row names the form
that makes the request and the two controls that carry the same name and
navigate, so a navigation shows no in-progress label, and recovery's code step
reads its field label, its digit hint, and its expiry hint as §3.4's and §3.3's
one string each rather than as second texts. The expired code, the superseded
code, the request that is no longer live, the request that ended at its bound,
and recovery's verified state are one table of events: the first two share a
text and a state, the third shares
the text and ends the step, the fourth is the only `OTP_REQUEST_ENDED`, and the
fifth is `RECOVERY_EXPIRED`. The resend's accepted 202 now carries the status its
state tables promised —
`أرسلنا رمزا جديدا. الرمز السابق لم يعد صالحا.` — so a success the code step
announces is a recorded string rather than an unstated one. The
city combobox's empty state is the no-match row, an empty bundled list is a build
failure, and a submitted value outside the list is `CITY_NOT_IN_LIST`. The
templates have one failure text — `OTP_SEND_FAILED` — a render without its six
digits is a build failure, and no body is cut, padded, or signed. Every numeral
is a slot whose counted noun is fixed for its agreement class (`حرف`، `أرقام`،
`دقائق`، `حرفا`), and no count is composed at runtime; R1 renders no generated
count. The Latin token `SMS` is one inline `lang="en"` run, the digits of the
prefix, the number, and the code carry no `lang`, and a supplied value carries
none because its language is unknown; no component sets a base language. A
message body carries no bidi control: it opens with Arabic, the code is one
maximal six-digit run between the colon's space and the closing full stop, and
the bidirectional algorithm keeps it in order (rule N1). `CSRF_FAILED` keeps the
refusal catalogue's `none` placement, so the contract states no page text for
it, and the two terminal states that showed a link without recorded text
(`existing`'s two, recovery's `done`) now carry them. Tasks are not edited by
this plan pass: T026 gains the bidi and render-failure limbs, T052 and T133 gain
the supplied-value `lang` absence, T099 gains the `SMS` wrapper and the two
terminal links, and T094 and T096 read the nine sidebar and four footer labels
from §8.3's tables. `quickstart.md` Scenario 15 walks the recorded copy — the
in-progress labels, the city combobox's no-match row, the resend's accepted
status, the step's endings, the body's direction properties, and the copy scan —
so each closure is runnable rather than only asserted in prose. These are record
16's measurable bindings — the copy's authority and its checks — so the record
T143 appends carries them, T175 binds the message table to the closed 26-code
union beside T143 (copy CHK018, refusals CHK019), and no new decision record is
introduced.

**The operational record's content and emission (CHK008, CHK009)**: The record
FR-037 requires has one schema, fixed by `contracts/auth-api.md` §6 and bound
here. Every record carries `event` (the closed list's name), `level`,
`timestamp` (the event's instant in UTC, RFC 3339 with milliseconds, read from
the one injected clock the rules read — never the database's `now()`),
`requestId` (the `X-Request-Id` the response echoes; the CLI's process
identifier where no request exists), `outcome` (`success` or `failure`), and
`reason` where the table names one; `accountId` is added only where an account
exists and is the internal identifier alone, never the number; and the
per-event fields the table names — `path`, `blocked`, `sessionCount`, `kind`,
`channel` — are the only others. The schema is closed:
`apps/api/src/modules/auth/service/events.ts` (T069) declares it once and
`apps/api/src/observability/logger.ts` (T018) writes it, so a new event is a row
of the contract and a change to the schema, never an ad-hoc line. The record is
emitted inside the request that produced the event and before that request's
response is written: the service awaits the emit, the emit writes one line to
the process's structured stream, and only then does the handler write the
response, so a client that has received a response can rely on the record having
been handed to the stream. A refusal's record is written before the refusal; a
completed action's record is written after its transaction commits and before
its response; the provisioning action writes its record before its success
report. The record is evidence of the action and not a condition of it: if the
stream cannot take the line, the emitter's failure is caught at the request
boundary, the action's outcome is unchanged — a committed change stays
committed, a refusal stays a refusal, and the response is the one the action
reached — one `error` line carrying the `requestId` and the event name is
written to stderr, and nothing is retried, queued, or sent to a second sink,
because delivery, retention, and alerting are R12's pipeline and R1 keeps no
store of its own (record 12). The provisioning action is the one exception,
because its record is the audit log's stand-in under record 12: a failed emit
turns its report into a failure that names the account identifier and states
that the account exists and its record did not reach the stream, and the CLI
exits non-zero, so a privileged creation is never reported as recorded when it
is not. T018's logger and T107's provisioning path are the implementations;
T145's logger test adds the throwing-stream case, T060 asserts every field and
the no-PII set, and T154 asserts the provisioning failure path.

**The operational rows' bound (CHK018)**: The three operational tables are
bounded by time rather than by a row cap, and each row's bound is stated. A
session row lives while it is live and is deleted 24 hours after its revocation
or its expiry, so no session row outlives its 12-hour absolute lifetime by more
than a day. A pending request is deleted when its `request_expires_at` passes —
a bound every accepted dispatch restarts and that is at most five minutes after
the last dispatch — and one row exists per normalized number. A rate-limit
counter is deleted one hour after its window ends, so a key carries at most five
rows: the four windows an hour holds plus the hour's grace. The bound is
enforced by the hourly idempotent sweep `data-model.md` §14 fixes: one statement
per table, each `DELETE … WHERE <the bound> < now()`, run from the API process's
scheduler at the top of the hour under a PostgreSQL advisory lock so two
instances never double-run. The predicate is the bound itself, so a run that is
missed, fails, or is skipped because another instance holds the lock is absorbed
by the next without a row being lost or deleted twice. The statement reads the
index on the bound column (`sessions_revoked_at_idx`, `sessions_expires_at_idx`,
`phone_verifications_request_expires_at_idx`,
`rate_limit_counters_expires_at_idx`), and its row count at R1's measurement
ceiling is bounded by the condition: at most the 500 live sessions plus the
sessions ended in the last 24 hours, at most one pending row per number that
submitted in the last 65 minutes, and at most two counter rows per request in
the last 75 minutes. The sweep is not an account-retention policy: no R1 path
and no sweep deletes a `users` or `accounts` row (FR-018), and neither table is
swept. T032 builds the sweeps, and T153 is the integration case: it inserts a
row past each bound and a row inside it, runs the sweep, asserts exactly the
past-bound rows are gone, runs it again and asserts it deletes nothing, and
holds the advisory lock from a second connection to assert the skip. The load
run's before-and-after session read already asserts the live population it seeds
and creates, and the run's own sign-ups and requests create the pending rows and
counters, so the measurement ceiling is exercised with the operational rows
present.

**The fixed datasets at startup (CHK012)**: Each of the three fixed datasets has
a stated failure mode and a stated currency. The city list and the mobile-prefix
set are build-time modules under `packages/shared/src/reference/**`: the build
imports the two JSON files, so a missing, unparsable, or empty file fails
typecheck or the build before any artifact exists, and T007 authors them while
T034 asserts the city list's 22 governorates, the entry count its `SOURCE` note
records, and unique non-empty Arabic names, and the same test asserts the prefix
set's entries against its own `SOURCE`; both notes carry the file's SHA-256. A
truncated file therefore
fails the build rather than shrinking the list at runtime, and no runtime path
reads either file, so there is no startup state in which the form offers an
empty city list or accepts an unlisted prefix. The breach list is the one
dataset read at runtime:
`apps/api/src/modules/auth/data/breached-passwords.sha256` is loaded once at
boot (T140), and the loader verifies its line count and SHA-256 against the
constants recorded with it before the listener opens; a missing, truncated, or
altered file stops startup with a non-zero exit, because a shortened list would
silently weaken FR-035's policy, and the refusal is the same class as the
schema-version guard's: no instance serves a policy it cannot keep. The list's
currency is recorded rather than inferred: its `SOURCE` names SecLists, its
version and SHA-256 are the constants, and CMV row 17 fixes a quarterly refresh
through the dependency-update process. A list that is due for refresh stays in
use — the check is always available because the list is local — and the
staleness is a maintenance finding with a review date, never a runtime refusal,
so no sign-up or password change fails for want of it. The refresh replaces the
file, its constants, and its digest in one dependency-update change, and the
boot check and the membership test (T035) are re-run on the new file; the
source, version, and digest are record 3's, and the two bundled datasets' are
record 2's. No dataset is fetched at runtime, so no outage, timeout, or external
service can make one unavailable.

**The recovery guarantee's authority (CHK011)**: CMV rows 8–9 are the slice's
single authority for recovery, and ADR-142 is the arrangement they govern: RTO
**4 hours** for the identity surface — the PostgreSQL restore plus the API's
start, with R12's procedure owning detection and the decision inside that window
— and RPO **15 minutes** through continuous
WAL archiving at an interval of 60 s or less plus a nightly base backup. FR-055
states what the store means at the restore point and fixes the state semantics;
it promises no continuity across the event, and no success criterion in this
slice measures either number, because the measurement is R12's and the quarterly
drill is the evidence that the arrangement restores. The plan does not restate
the values as a second authority: the two rows are where they live, the drill's
record cites them, and a change to either is a constitution amendment with
ADR-142's annotation, not a plan edit. The RPO is the maximum loss, so a restore
never loses more than fifteen minutes of committed writes, and a write inside
that window may be absent at the restored point and is read as absent (FR-055).

**The messaging provider's outage (CHK014)**: Twilio is the slice's accepted
single point of failure (ADR-141; the specification's Assumption), and its
outage has one scope. The two code dispatches stop: a sign-up verification or a
recovery request whose send is refused or times out receives the existing
explicit, retryable `OTP_SEND_FAILED` refusal with its Arabic text; no pending
row is written, because the row is written only after the channel accepts; no
code exists; and the five-minute window starts at no dispatch, so the person may
retry at once and the retry is a new request, whose acceptance the operation's
budget decides. That request consumes the
operation's budget — the account-creation or recovery key — but not the
re-request allowance, which counts only accepted dispatches (CMV 18). The two
notices are skipped: a password change or a sign-out of every device completes,
the action is not undone, and the failure is recorded as
`auth.notice.dispatch_failed` with its `kind` (FR-043). Sign-in, sign-out, the
sign-out of every device, the session's reads and ends, the password change and
reset, the forced first change, and provisioning continue, because none needs a
message. The platform does not report itself unhealthy: `/health` stays 200,
because PostgreSQL is the only readiness dependency and the provider is an
outbound channel whose refusal the flow already handles; the outage is visible
in the dispatch-failure records, and R12's monitoring and alerting own the alert.
The adapter makes one attempt with a 750 ms timeout, no in-request retry, and no
fallback provider (`contracts/auth-api.md` §7.1); when the provider returns, the
next attempt is a new request and nothing is queued, replayed, or stored, so the
platform never sends a message twice. `docs/runbooks/sms-provider.md` is the
operator's procedure — confirm the outage with the provider's status, tell a
merchant to retry, change no configuration, and record the incident — and a
replacement provider is a decision record and an adapter, not a configuration
switch, because the port is the boundary.

**The post-disaster restore (FR-055)**: A disaster — the loss of the database
host or of the whole environment — is the same recovery arrangement at its
largest: the restore is onto a new host from the latest base backup plus the
archived WAL segments, to the last segment inside the fifteen-minute recovery
point, and the identity surface serves again inside the four-hour recovery time
(CMV rows 8–9; ADR-142). The state after it is FR-055's, read at the restore
point and not reconciled: sessions, locks and counts, pending requests, and
rate-limit windows are as they stood at that moment, so a session created after
it ends and its holder signs in again, a lock applied after it is gone, a
pending request started after it does not exist, and a window spent after it is
unspent; a block applied after the point is undone and a row removed for good
after it returns, bounded by the recovery point and re-applied or removed again
by R13's or R15's act (Complexity Tracking row 35). One piece of state is
rebuilt rather than restored: the SMS port's rolling acceptance estimate is in
memory, so it resets to empty and the silent refusal waits `0` until sixteen
accepted dispatches refill it — harmless, because the estimate only paces that
refusal and never decides an action. The backup key is the one thing the restore
cannot rebuild: every archive is sealed under a data key wrapped by a
key-encryption key injected from the environment, so the key must be available
on the new host or the archives are unreadable; its custody is R12's secret
manager, the drill proves the path with a key from the environment, and a lost
key is a lost backup — the reason the key is never stored beside the archive
(Complexity Tracking row 17). R1 provides the wrappers, the archive format, the
key contract, the runbook, and the drill; R12 owns the procedure, the new host,
the DNS and secret delivery, and the measurement of both numbers.

**The schema rollback (FR-055, CHK019)**: The release is two ordered reversible
steps with both directions defined —
`packages/db/migrations/0001_identity_foundation.sql` and its paired
`0001_identity_foundation.down.sql` (T032), then
`0002_identity_foundation_previous_code.sql` and its paired
`0002_identity_foundation_previous_code.down.sql`, which adds
`phone_verifications.previous_code_hash`. Each down is the exact inverse of its
up: `0002`'s removes the column and its check, `0001`'s drops the six tables in
the reverse of the order `data-model.md` §13 fixes, and the applied-step count
the boot guard reads returns to zero only after both have run in that order. R1
owns the migrations and their reversibility, and the rollback is exercised
before it is needed: the integration suite applies the ups to a scratch
database, seeds a representative row set — an account with its credential and a
session, a pending request, a counter, and the empty `verifications` placeholder
— applies the downs in reverse order, asserts the six tables are gone and the
applied count is zero, and re-applies the ups, so the set is proven both ways in
CI and in staging before production (Deployment and Observability). The boot
guard makes the rollback safe to run: an instance whose expected version is absent or different refuses
to listen, so no release serves against the down state, and while the rollback
runs the platform serves nothing, exactly as a deployment (FR-054, FR-055). The
state consequence is FR-055's and is stated rather than reconciled: a rollback
returns the store to the earlier version, so state written under the version
being rolled back is lost with it — a session created after the migration ends,
a lock and its count applied after it are gone, a pending request started after
it ends, and a window spent after it is unspent. For R1 the down target is the
empty pre-R1 schema, because the first migration is the first schema; rolling it
back is therefore a destructive act that removes every account, session, and
pending request, and it is used in production only to withdraw the release, with
the forward migration re-applied before service resumes and the data loss
accepted as the rollback's cost (FR-055). A later slice's migration follows the
same rule — one reversible step, both directions defined, the rollback exercised
in staging, R12 running the production rollback — and the guard's version, not a
second mechanism, is what refuses to serve across it.

### Constitution Mandated Values

| # | Value | This plan records |
|---|-------|-------------------|
| 1 | Migration tool (the single one) | **Drizzle Kit** (`drizzle-kit`) generating SQL migrations from `packages/db/schema/`, applied by `drizzle-orm`'s migrator. better-auth's own `auth migrate` CLI is disabled; the library's tables are declared in `packages/db/schema/{users,auth}.ts` and migrated by the same tool. |
| 2 | Password hashing cost factor | **scrypt** through better-auth's `emailAndPassword.password.hash`/`verify` hooks, using Node's built-in `crypto.scrypt`: N = 32768 (2^15), r = 8, p = 3, derived key 64 bytes, 16-byte random salt, encoded as `$wafar$scrypt$32768$8$3$<salt>$<hash>`; comparison with `timingSafeEqual`. The same profile protects the pending sign-up password and the one-time code (the code is hashed with the request id as salt). |
| 3 | Authentication rate limits | Per client (network origin, `X-Real-IP` from the trusted proxy) and per normalized number, in a 15-minute fixed window: **account creation** 20 per origin / 3 per number; **sign-in** 60 per origin / 20 per number; **password recovery** 20 per origin / 3 per number. The sign-up form's honeypot and minimum-time refusals consume the account-creation budget. **Minimum time-to-submit: 3 s, with a form-stamp validity window of 30 minutes.** The interval is measured on the server's clock from a signed form stamp the render bootstrap (`GET /api/v1/auth/csrf`) issues with the form's rendering: the stamp carries only its issuance time and the destination `sign_up_form`, is HMAC-SHA256-signed under a key derived from the platform's authentication secret with the `form_stamp` context (no new environment key), is never stored, and is not consumed by a submission, so reuse inside the window is bounded by the account-creation budget rather than by a stored record (FR-029; `contracts/auth-api.md` §5.1–§5.2). The request that starts an operation is the only one that consumes or is refused by that operation's budget: the code entry and the new-password step neither count against it nor are refused by it, and are bounded by the code's own limits. One-time-code re-request: 3 per pending request. Incorrect code entries: 5 per pending request. **Aggregate code-guess ceiling: 30 incorrect code entries per normalized number per 15-minute window** — 5 per request × 6 fresh requests (3 account creation + 3 recovery) — produced by those two limits rather than by a third counter, so the code entry stays outside every operation budget; the fresh request that would exceed it is refused by the number key, and the ceiling resets at the window boundary with the budgets that produce it (FR-034, FR-033). **Aggregate one-time-code message ceiling: 24 accepted dispatches per normalized number per 15-minute window** — (1 first dispatch + 3 re-requests) × 6 fresh requests (3 account creation + 3 recovery) — produced by those two limits rather than by a third counter, so `rate_limit_counters` gains no message key and the twenty-fifth message is impossible rather than refused: the seventh fresh request is refused by the number key and the fifth dispatch by the pending request's re-request limit. It counts the dispatches the messaging channel accepted, because an accepted message is the platform's own notion of a send; a dispatch the channel refuses at acceptance, the request timeout included, sends nothing from the platform's side and does not count, and the FR-043 notices are outside the ceiling (FR-034, FR-033). A refusal names the limit and carries `Retry-After`; the lock carries no distinct refusal. **A limit is never disabled, raised, or skipped — the load measurement included**: no environment variable, flag, or build may exempt a request from a budget, and the SC-009 run presents distinct keys instead (**The SC-009 load profile**). |
| 4 | Session timeout and session-token lifetime | Inactivity timeout **30 minutes** (only a merchant-initiated action resets it); absolute maximum lifetime **12 hours** from creation, however active the merchant is. The session cookie is `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`, `Max-Age` = 12 hours, so it survives closing and reopening the browser. The session token is 32 random bytes, stored server-side; no session token is recoverable from browser storage beyond the opaque cookie. |
| 5 | Dependency budget (direct runtime dependencies) | **≤ 30 per workspace and ≤ 60 repository-wide**, counting `dependencies` only (workspace packages and `devDependencies` excluded). R1's estimate is 7 (web), 7 (api), 2 (ui), 1 (shared), 2 (db). |
| 6 | Performance budget percentiles (p50 / p95) | **p50 ≤ 150 ms, p95 ≤ 1,000 ms** for every authentication request path, measured at 10 authentication requests/second under the Scale/Scope condition; the messaging channel's acceptance wait is inside the budget. SC-009 fixes the bound and this row restates it. |
| 7 | Maximum query execution time | **100 ms at p95** for any single query R1 introduces; connection `statement_timeout` = 2 s as the hard ceiling. |
| 8 | Recovery Time Objective (RTO) | **4 hours** for the identity surface (PostgreSQL restore plus API start) — the slice's single recovery authority (CHK011); FR-055 states the state at the restore point and no success criterion measures the value. |
| 9 | Recovery Point Objective (RPO) | **15 minutes**, via continuous WAL archiving (archive interval ≤ 60 s) plus a nightly base backup — the same authority; a write inside the window may be absent at the restored point and is read as absent (FR-055). |
| 10 | Runtime version | **Node.js 22 LTS**: `.nvmrc` = `22`, `engines.node` = `>=22 <23`, the CI image fixes the exact 22.x patch, and the lockfile records every package version. ADR-021. |
| 11 | Icon set | **IconPark**, Apache-2.0, **outline cut consumed** at 20px; the colour cut is vendored and not consumed; both cuts are vendored under `packages/ui/vendor` and pinned by SHA-256 (2,658 icons each); no emoji; the NPM consumer is `@iconify-json/icon-park-outline` with no runtime Iconify API. Register-gap closure: ADR-098, annotated by ADR-128 and ADR-137, with its gap row closed by ADR-146 (the set stays an asset of the layer, not a register row); licence record and vulnerability scan recorded in Complexity Tracking. |
| 12 | Extraction libraries | **Not introduced — no extraction surface.** R3 owns the gap. |
| 13 | Transactional SMS transport | **Twilio Programmable Messaging** (REST API; `twilio` Node SDK, MIT) for one-way transactional messages only: sign-up verification, password-recovery code, and the two security notices. `To` is always E.164; no inbound path, no marketing, no email fallback. Provider call timeout 750 ms; a timeout is a refusal at acceptance. Register-gap closure: ADR-141 records the choice, the licence obligation (Twilio terms of service; SDK MIT), and the vulnerability scan, and the register row is ADR-146. |
| 14 | Continuous-integration provider | **GitHub Actions**, `.github/workflows/ci.yml`; jobs run offline against local services and the fake SMS transport, and the dependency-install step is the only networked step. Network-requiring tests are explicitly opted in and time-bounded. ADR-143 records the choice, and the register row is ADR-146. |
| 15 | Decoded-size cap that rejects a zip-bomb upload | **Not introduced — no upload surface.** R2 owns the cap. |
| 16 | Supported-browser statement | The **two latest major versions of Chrome, Edge, Firefox, and Safari**, desktop and their mobile variants; the visual baseline is generated with the Playwright-pinned Chromium. |
| 17 | Password policy parameters (minimum and maximum length and the common-or-breached-password source) | Minimum **12 characters**, maximum **128**, fixed here as FR-035 delegates both numeric values. Each of the three refusal reasons carries its own message — shorter than the minimum, longer than the maximum, and common or breached (FR-035; Clarifications 2026-11-01). The common-or-breached check is a local membership test against a vendored, versioned list of the **top 100,000 passwords from SecLists (MIT)**, stored as lowercase SHA-256 hex digests in `apps/api/src/modules/auth/data/breached-passwords.sha256` (about 6.5 MB, server-only, loaded once at boot). No external service is called; the list's source, version, and digest are recorded with an ADR, and it is refreshed quarterly through the dependency-update process. A password equal to the account's mobile number is not refused (not a registered rule). |
| 18 | One-time-code lifetime, re-request limit, and incorrect-entry bound | Lifetime **5 minutes** (300 s); **3** new-code requests per pending request, not counting a send the channel refuses; **5** incorrect entries per pending request, counted over the whole verification and only for a wrong value of the live code. A 6-digit code from `crypto.randomInt`; the pending request is replaced per number, and an accepted dispatch restarts the 5-minute window. |
| 19 | Profile field maximum lengths (full name, shop name) | Full name **100 characters**; shop name **100 characters**; both counted in Unicode code points, trimmed of leading and trailing whitespace before the presence and length checks, and accepted as typed within the bound (no alphabetic-shape rule). |

### Verification Notes *(required where applicable)*

- **N+1 inspection**: Every path R1 introduces is a point lookup on a unique index — pending request by number, user by number, session by session token, credential by user, rate-limit counter by key and window. The city list and the prefix set are build-time modules, not queries. Inspected: yes; result: no N+1 found. The integration suite asserts the query count of a sign-in request (one user read, one credential read, one session insert) so a future eager-load cannot regress it. The measured request, the expected three statements, and the change that makes the claim fail are *The verification contract* → *The N+1 measurement (CHK035)*.
- **Caching**: The city list and the mobile-prefix set are immutable per release and bundled from `packages/shared` (no runtime cache, no invalidation). The only runtime TTL store is the rate-limit table, whose invalidation is the window expiry plus the hourly sweep; no other cache is introduced.
- **Reference data completeness (FR-005)**: The city list's `SOURCE` note records the source (the Libyan administrative-division reference), the dataset version (`2.0.0`, 2026-11-09), the reference count of **22 governorates**, the file's total entry count, and the SHA-256 digest of its `entries`. The unit test asserts every one of the 22 governorates is present, each with at least one city or area entry, that every name is unique and non-empty, and that the file's entry count equals the count in `SOURCE` — so a truncated file fails even when the entries it kept are real places (research R-10; ADR-152 as amended by ADR-161; `data-model.md` §11). The closed failure list is *The verification contract* → *The reference data's failure conditions (CHK034)*.
- **Public-interface documentation (Documentation gate)**: The OpenAPI 3.1 document is generated from the same source as the implementation — the Zod schemas in `packages/shared/src/contracts/**` and the Hono route table — by `apps/api/src/http/openapi.ts`, using Zod v4's built-in `z.toJSONSchema()` so no dependency is added, and emitted to `apps/api/openapi.json`. That generation is R1's documentation gate: it satisfies the constitution's "generation or drift test" rule at the first feature that exposes a public interface, and the generated document is the published interface, so the prose contract is the explanation and never the only record. The **first standalone documentation-drift test** belongs to **R2** (ADR-031 item 4; the query-count assertion is a separate obligation and neither discharges the other, ADR-139): R1's public surface is covered by generation from the Hono routes (ADR-002), so the three-record comparison against `contracts/auth-api.md` §5 is not introduced here. R2 owns that test and its CI entry blocks every later change from then on.
- **Module responsibility headers (Documentation gate)**: Every production module file opens with a header naming its single responsibility, as a one-line statement of what the module does. The header never repeats the owning feature: the Ownership Map is the one place that fact lives, so it cannot go stale in a second place. The header is written with the file's first commit, starting at A1, and `scripts/check/module-headers.mjs` (dependency-free Node, like `governance-drift-check.mjs`) walks every workspace's production source, fails on a missing or empty header, and runs in the CI gate from A5.
- **Accessibility verification**: `@axe-core/playwright` on every page state at 320 CSS px and at 1280 CSS px in both appearances — the dark set carries every state the light set carries (FR-025) — plus a manual keyboard-only pass recorded in the pull request; the bare pages assert that the in-progress state, the inline failure message, the in-place confirmation, the notice that a request expired, the notice that the request ended at the bound, and the terminal outcome message are announced and that focus moves to the state now shown. The frame's structural tests assert an accessible name, a role, and keyboard reachability for every control, the header's four controls at 320 CSS px with none dropped, folded into an overflow menu, or moved into the account menu, a guest's three controls — the logo/home control, the theme switch, and the sign-in action — in that row under the same rule, each keeping its accessible name and its touch target, and the ended-session state's live-region markup and focusable heading in both variants, each of the sidebar's nine items keeping its whole label as its accessible name in the full sidebar and in the icon-only rail, and the bar's labels kept at 320 CSS px with a one-line cut at the inline-end where a label does not fit, with the drawer's `aria-expanded` state, its three dismissals and the focus return to «المزيد», the sign-out confirmation's markup, and the bar's rendered and visible state under the drawer asserted structurally; the drawer's navigation focus (the destination page's heading), the labels' cut, the overlays' stacking order and outside-activation consumption, the account menu's live open, the drawer's focus containment, the guest's redirection, and the bar's scroll-hide are the page behaviour SC-005 defers and belong to R2 (`EX-007`).
- **Design conformance**: The baseline set is `contracts/ui-contracts.md` §10 in full — `sign-up` (`form`, `submitting`, `form_error`, `code`, `verifying`, `code_error`, `resending`, `expired_notice`, `ended_notice`, `done`, `existing`, `blocked`, `administrator`), `sign-in` (`form`, `submitting`, `form_error`, `done`), and `forgot` (`form`, `submitting`, `form_error`, `code`, `verifying`, `code_error`, `resending`, `new_password`, `setting`, `done`, `done_blocked`, `no_account`, `administrator`, `expired_notice`, `ended_notice`) — each in both appearances at 1280 and 375, plus a 320 light reflow capture per page. Baselines are generated in CI with the Playwright-pinned Chromium and the self-hosted fonts; the contract test asserts the layer's recorded values (ADR-128) — the rail-width token the collapsed sidebar consumes among them — and the gate is ADR-129. The reference set's uncaptured states are recorded in Complexity Tracking.
- **Deployment, health, and backup**: `GET /health` is the readiness probe and verifies PostgreSQL with `SELECT 1` on every call; it answers 503 while the database is unreachable and never reports healthy without it. Every backup archive — each `pg_basebackup` base backup and each archived WAL segment — is encrypted before it leaves the database host: the backup wrapper (`scripts/backup/**`, Node's built-in `crypto`, no new dependency) seals each archive with AES-256-GCM under a data key, and the data key is wrapped by a key-encryption key injected from the environment (the variable is named in `.env.example`, never a value; the secret manager is R12's). The quarterly drill restores the encrypted archive into a clean container, proving the ciphertext decrypts and the RTO/RPO hold; the drill's record is the evidence for the constitutional rule that a backup is tested only when it restores.
- **Operational records, rows, datasets, and recovery (CHK008, CHK009, CHK011, CHK012, CHK018)**: T060 asserts every event of FR-037's closed list carries the six fields and the per-event fields, that no record carries a forbidden value, and that the record reaches the stream before the response is written; T145's logger test replaces the stream with one that throws and asserts the stderr line, the unchanged outcome, and the absence of a retry; T154 asserts the provisioning action's failed-emit report and its non-zero exit. T032 builds the sweeps, and T153's integration case inserts a row past each sweep's bound and a row inside it, asserts one run deletes exactly the past-bound rows, a second deletes nothing, and a second connection holding the advisory lock makes a run skip; the load run asserts the live session population before and after its window, and its own requests create the pending rows and counters, so the ceiling is exercised with the operational rows present. T034 and T035 assert the three datasets' counts, entries, and membership, T007 and T140 author and vendor them with their `SOURCE` and digest, and a boot test replaces the breach list with a truncated copy and asserts the non-zero exit, while a missing city or prefix file fails the build that imports it. The quarterly drill restores the encrypted archive into a clean container, starts the API, and asserts `/health` answers 200 inside the four-hour RTO and the restored state is FR-055's at the recovery point; the migration test applies the downs in reverse order, asserts the six tables are gone and the applied count is zero, and re-applies the ups. No success criterion measures either number: CMV rows 8–9 are the authority, ADR-142 the arrangement, and the drill's record the evidence.
- **The operator's initial password (FR-028)**: The provisioning action takes the credential only from a hidden TTY prompt or from standard input — never a value in argv, an environment variable, or a stored file — so it appears in no command history and in no process list, and the action reads it once and closes the input. It is never echoed, and it never appears in the action's success report, in any error or diagnostic, in a log, or in the `auth.administrator.provisioned` record, which names the account identifier and the outcome alone; the operator hands it to the administrator over a channel the operator controls, and no page, one-time-code message, or security notice carries it. T111 implements the input path and the report, and T107 asserts them — including a run started with the credential on argv, in an environment variable, or in a file, which must refuse and create no account — while T060 asserts the security record carries no credential material.
- **The block's request boundary (FR-019, AC-021)**: The shared entry point
  reads the account's status on every authenticated request, so a block recorded
  while a request is already in flight is observed by the next request rather
  than by that one. T090 asserts both halves with the status written directly
  between the seeded account's entry-point resolution and its next request,
  because R1 ships no act of blocking; the session the next request arrives on is
  tombstoned `blocked` as that request is refused, and the ended-session state's
  rendering stays with the slice that ships the first page carrying the frame
  (R2, `EX-007`).
- **Clock control in tests**: The 15-minute sign-in lock, the 5-minute one-time code and pending-request expiry, the 30-minute inactivity timeout, and the 12-hour absolute session lifetime MUST be exercised through one injected, controllable clock in the unit and integration suites, and no test may sleep for a real interval. The clock the code reads is the platform's own — the API process's `Date.now()`, read through the one clock the composition root injects; a time value the client supplies is never read, and the instant that clock returns is the one every expiry and lock comparison uses, passed to the store as a bound value, so the database's `now()` remains a write default and a retention condition for the hourly sweeps, not the clock any of the four rules reads. The suites replace that clock with their controllable one and set the process time to the same instant, so better-auth's own session-expiry read agrees, then advance that one value explicitly and assert each rule on both sides of its bound — the last instant it still allows and the first it refuses — so the boundary is pinned rather than approximated. The same control covers the lock (`locked_until`), the pending request's expiry (`code_expires_at` and `request_expires_at`), and both session clocks (`last_activity_at` and `expires_at`), so all four are exercised without waiting (FR-009, FR-015, FR-034, FR-032; CMV 4, 18).
- **The acceptance wait is measured, not assumed (FR-029, AC-031)**: The timing pair is taken with `SMS_FAKE_ACCEPT_MS` set to **200 ms** — above both tolerances, so a refusal whose wait is removed falls about 200 ms short of the success 202 and fails the median limb (≤ 50 ms) and the p95 limb (≤ 150 ms), while the default `0` would let the pair pass having proved only that the two paths do the same work. The successful case is measured first and its 20-request warm-up fills the sixteen-sample window, so the estimate has converged on the configured wait before the refusal case's 200 samples begin; the suite restores `0` afterwards so the other suites keep their speed, and its timeout is sized for the pair's 400 samples at that wait. No separate build proves it: the pair is its own negative control — with the wait deleted, the shortfall is the configured wait and both limbs fail. The estimator's own unit test (Technical Context) tests the median directly, so neither check depends on the other. T026 and T073 landed the task side — the configurable delay with the estimator's test, and the 200 ms fixture.
- **Budget check**: `scripts/load/auth-smoke.mjs` (Node's built-in `http` — the client needs a per-request `localAddress`, which `fetch` does not expose, so still no new dependency) drives the three authentication operations at 10 requests/second for 60 seconds — 600 measured requests, 200 per operation — against a database seeded with 10,000 accounts and 300 live sessions, under the key plan in **The SC-009 load profile** below. It runs with the fake's acceptance wait at the declared 50 ms that profile fixes, so the reported percentiles carry the wait, and it reports p50 and p95 per operation and in aggregate, the work-only p95 the same profile defines, the slowest query from `pg_stat_statements`, and the **attempted, accepted, and refused** counts with the refusal codes. The verdict fails the run when any measured request is refused, when an operation's accepted count is not 200, when a measured dispatch is faster than the declared wait, when the work-only p95 exceeds 250 ms, or when p50 exceeds 150 ms or p95 exceeds 1,000 ms at 10 authentication requests/second. Percentiles are computed over accepted requests only, and because any refusal fails the run, a refusal-dominated run cannot pass by reporting the latency of the few successes. A post-run probe — a fresh origin's 21st account-creation submission after its budget is spent — must be refused `RATE_LIMITED` with `Retry-After`, and the rate-limit counter rows the run created are read back, so a silently bypassed limiter fails the verdict. That verdict is the release gate and R1's baseline for later slices (SC-009). The report is attached to the pull request; a measured regression above 10% against the branching version blocks release. R1 is the first feature, so the stated budget is the baseline.
- **Success-criteria coverage**: every criterion's measurement point is fixed once in *The verification contract* → *The measurement-point register (CHK014)*, and the detail below is that table's reading; none is left without evidence: **SC-001** and **SC-003** are the sign-up and recovery end-to-end journeys, timed from the page's first step being served to the terminal confirmation against their **3-minute** bounds and excluding the interval between the channel's acceptance and the code's availability (`apps/web/tests/e2e/sign-up.spec.ts`, `forgot-password.spec.ts`); **SC-002** is the sign-in journey's **30-second** bound (`sign-in.spec.ts`); **SC-004** is the enumeration test with the tolerance above; **SC-005** is the frame's structural scope — its composition asserted in `packages/ui/tests/shell/`, its absence asserted on the three bare pages, and its runtime/accessibility boundary left to R2 (`EX-007`); **SC-006** is the axe scan over every delivered state in both appearances at 320 and 1280 CSS px plus the manual keyboard-only pass at the same widths, with the frame's markup covered structurally; **SC-007** is the lock's unit and integration cases (`sign-in-lock.spec.ts`, `sign-in.spec.ts`); **SC-008** is the user-facing-string scan over the three pages' copy, the frame's copy — its nine sidebar labels, five bar slots, four footer links, brand line, three account-menu items and confirmation, and both ended-session variants — and the four SMS templates, with the direction limb asserted at the document level (`<html dir="rtl" lang="ar">` on the three bare pages and no frame component setting a direction of its own); the same scan judges FR-026's two closed sets — no combining mark in U+064B–U+0652 or U+0670, and no Latin letter sequence beyond the token `SMS` — and counts the mobile number in FR-038's display form `+218 91 234 5678`, and its source scan fails a template that carries a numeral as typed text, so every number a rendered string states comes from `packages/shared/src/limits.ts` (CMV 17–19); **SC-009** is the load script above.
- **Enumeration uniformity (SC-004)**: The enumeration test asserts text, status, header set, and response path for equality, and the response's duration against the plan's tolerance: over **200 samples per case after a 20-request warm-up**, with the top and bottom 5% dropped, the difference between the account-exists and no-account cases MUST have a **median ≤ 50 ms** and a **p95 ≤ 150 ms**. The text is compared after masking the **four** values SC-004 allows to differ, each replaced by a fixed placeholder: the pending request's identifier (`requestId`), the number the response echoes back (`phone`), the moment the code expires (`codeExpiresAt`), and the moment the pending request expires (`expiresAt`). The field names, their types, the header set's names, the response path, and the duration stay compared. `phone` is masked because the 202 a successful sign-up submission or password-recovery request receives carries the number that was submitted and the two cases submit different numbers; **outside the comparison** the test asserts that each response's `phone` equals that case's own submitted number in the canonical form, so the echo is verified rather than left uncompared (Clarifications 2026-11-04). The test runs on one host and one build, with the fake SMS transport and a fixed fixture, so a response that measurably does less work for a number with no account fails it even when the median passes. The tolerance and the sampling are stated in SC-004 and fixed by this test (Clarifications 2026-11-04); the test lives in the three suites that carry it, one per operation: `apps/api/test/integration/auth/sign-in.spec.ts`, `apps/api/test/integration/auth/sign-up.spec.ts`, and `apps/api/test/integration/auth/recovery.spec.ts`, each asserting the same four masked values and the same tolerance. **The hidden-field refusal** is measured on the same protocol, one-sided: the silent 202's duration MUST NOT fall short of a successful submission's by more than the same tolerance — **median ≤ 50 ms** and **p95 ≤ 150 ms** — over the same 200 samples per case, warm-up, and trimming, in `apps/api/test/integration/auth/sign-up-abuse.spec.ts` (T073), so the wait the refusal observes is asserted rather than assumed (FR-029, AC-031; Clarifications 2026-11-02). **The channel-refusal failure is outside the comparison** at both placements — `OTP_SEND_FAILED` on a fresh request's submission and on a re-request's code step: it states the messaging channel's response, is produced identically whether or not the number has an account, and is not an enumeration case (FR-034, SC-004; Clarifications 2026-11-02).
- **Lighthouse budget**: The `lighthouse` job in `.github/workflows/ci.yml` serves the production build and runs Lighthouse CI against `/auth/sign-up`, `/auth/sign-in`, and `/auth/forgot-password` on the mobile form factor with simulated throttling, three runs per URL. LCP ≤ 2.5 s and CLS ≤ 0.1 are asserted on the median of the navigation runs; INP ≤ 200 ms is asserted by the timespan user flow in `apps/web/tests/perf/inp-user-flow.mjs`, which focuses the mobile field, types a number, and submits. The budget is the constitution's lightweight performance budget; it is the pages' rendering budget, while SC-009 bounds a request's server-side completion alone, so neither is read as covering the other (Clarifications 2026-11-05). The public Parts and Home pages join the URL set when R2 and R4 ship them.

### The verification contract

This section is the slice's single verification contract. It fixes the
measurement point of each success criterion, the environment each test class
runs in, the enumeration test's reproducibility, the evidence kept, the
concurrency and clock controls, the messaging channel's failure matrix, the two
substituted states, the negative controls, the reference data's failure
conditions, the N+1 count, US7's priority reading, the copy scan's message set,
the meaning of "at R1's acceptance", and the exception crosswalk. It closes the
verification checklist's **CHK014–CHK018**, **CHK025–CHK027**, and
**CHK029–CHK038**. Where an older sentence in this plan states one of these
things differently, this section is the reading; no requirement, acceptance
criterion, success criterion, or task identifier is added.

#### The measurement-point register (CHK014)

Every success criterion has exactly one measurement point — one per half where
the criterion divides — and that point is the test the task carrying it names.
No criterion is measured in a second place, and none is left without one.

| Criterion | Measurement point (test and task) | Recorded evidence | The bound it decides |
|---|---|---|---|
| SC-001 | `apps/web/tests/e2e/sign-up.spec.ts` (T039) | the Playwright trace and the journey's timing record | 3 minutes, from the page's first step being served to the in-place confirmation, less the channel acceptance → availability interval |
| SC-002 | `apps/web/tests/e2e/sign-in.spec.ts` (T062) | the trace and timing record | 30 seconds on SC-001's clock, with no delivery interval |
| SC-003 | `apps/web/tests/e2e/forgot-password.spec.ts` (T084) | the trace and timing record | 3 minutes on SC-001's clock, with the same subtraction |
| SC-004 | `apps/api/test/integration/auth/sign-up.spec.ts` (T037), `sign-in.spec.ts` (T058), and `recovery.spec.ts` (T082) — one test per operation, one protocol | the per-sample JSON: both cases' durations, medians, p95s, masked-body hashes, and header sets | 200 samples per case after a 20-request warm-up, 5% trimmed, median difference ≤ 50 ms and p95 difference ≤ 150 ms, with text, status, header set, and response path equal |
| SC-005 — R1's half | `packages/ui/tests/shell/**` (T094–T098, T103, T132) and `apps/web/tests/e2e/bare-layout.spec.ts` (T099) | the shell suites' reports and the Playwright trace | the structural assertions and the three bare pages' frame absence |
| SC-005 — R2's half | R2's first page carrying the frame, at R2's acceptance, deferred under `EX-007` | R2's evidence | the seven page behaviours, the frame's scan, and its keyboard pass |
| SC-006 — R1's half | `apps/web/tests/a11y/states.spec.ts` (T115), `apps/web/tests/a11y/keyboard-pass.md` (T124), `apps/web/tests/e2e/__screenshots__/` (T116), and the frame's markup half in the shell suites (T094–T098, T132, T134) | the axe JSON/HTML, the committed keyboard-pass record, the committed baselines, and T134's record | 32 delivered states × 2 appearances × 2 widths = **128 scans**, the pass at both widths, the baseline set, and the frame's accessible name, role, and keyboard reachability |
| SC-006 — R2's half | R2's first page carrying the frame, at R2's acceptance, deferred under `EX-007` | R2's evidence | the frame's rendered scan and keyboard pass |
| SC-007 | `apps/api/src/modules/auth/service/__tests__/sign-in-lock-rules.spec.ts` (T056, T204), `apps/api/test/integration/auth/sign-in-lock.spec.ts` (T056, T204), `sign-in.spec.ts` (T058), and `administrator-first-sign-in.spec.ts` (T108) | the four suites' reports | the increment, clear, and lift rules on the three paths |
| SC-008 | `apps/web/tests/unit/user-facing-strings.spec.ts` (T100 and T174), with T026 (the four bodies and their lengths), T054 (the numerals' source), T099 (the document direction), and T133 (the supplied values) as its limbs | the scan's report and the four length assertions | the four SMS bodies, the frame's copy, the three pages' copy, the numerals the platform generates at runtime — the one-time code as six Latin digits and the mobile number in FR-038's display form `+218 91 234 5678` — the direction limb, and the numerals; R1's notifications control renders no unread badge, so no generated count is in the subject; one failing string fails the test, the run, and the CI job, and the report is the criterion's evidence at R1's acceptance; the only exceptions are a supplied value and the city list's recorded names, each outside the language, numeral, and diacritic limbs and inside the no-emoji limb |
| SC-009 | `scripts/load/auth-smoke.mjs` (T117) | the load report and the post-run limiter probe's record | the profile and the verdict below |

**SC-005 and SC-006 are not reportable as fully met at R1's acceptance.** R1
records its half met and the other half open under `EX-007`; the acceptance
record says in those words that SC-005's R2 half and SC-006's frame half are
open. A two-half criterion is not "measured in two places": each half has one
point, and the deferred half has none here by design. SC-004's three suites are
one point, not three — one protocol, one tolerance, one test per operation —
and SC-006's scan, pass, and baseline are one matrix read by three artifacts.
SC-008's point is T100's scan; the four other tests supply the limbs it reads,
so the criterion is not measured twice.

**SC-006's point** is the accessibility suite's 128 scans (T115) and the
keyboard-pass record (T124), with the visual baseline (T116) reading the same
32-state set; the frame's rendered half is R2's. **SC-008's point** is T100's
scan of the platform's own strings, with T026's four body lengths, T054's
numeral slots, T099's document declaration, and T133's supplied values as the
limbs that decide its clauses; the four bodies are the closed set stated below.

#### The test classes' environments (CHK031)

Each class has one fixed environment. A run outside it is not evidence for its
class.

| Class | Roots | Services and data | Time, transport, locale | Network | Isolation | Evidence |
|---|---|---|---|---|---|---|
| Unit — shared and API | `packages/shared/src/**/__tests__/**`, `apps/api/src/**/__tests__/**` | none; the ports are fakes | the injected clock; no dispatch; `TZ=UTC` | offline | Vitest `forks`, one file per worker, no shared state | JUnit and coverage |
| Unit — web | `apps/web/tests/unit/**` (Vitest, jsdom + `@vue/test-utils`; Complexity Tracking row 36) | none; `fetch` is mocked | a fake clock; no dispatch; `TZ=UTC` | offline | one file per worker | JUnit and coverage |
| Layer | `packages/ui/tests/**` (Vitest + Vue Test Utils, jsdom) | none | a fake clock; `TZ=UTC` | offline | one file per worker | JUnit and coverage |
| Integration | `apps/api/test/**` | PostgreSQL 16 through PgDog in the compose stack; migrations applied once per run; Redis, SeaweedFS, and OpenSearch are provisioned but never read | the injected clock; `SMS_TRANSPORT=fake`, `SMS_FAKE_ACCEPT_MS=0` unless the suite sets it (T073 sets `200` and restores `0`); `TZ=UTC` | offline | one database per run; files serialized; each suite seeds and rolls back its own rows | JUnit, the database log on failure, and SC-004's per-sample JSON |
| End-to-end | `apps/web/tests/e2e/**` | the production build, the local API, PostgreSQL through PgDog, and the fake transport | the real clock; the fake at `0`; `TZ=UTC` | offline | the Playwright-pinned Chromium, `workers: 1`, one context per case | trace, screenshots, and video on failure |
| Accessibility and visual | `apps/web/tests/a11y/**`, `apps/web/tests/e2e/__screenshots__/**` | the production build, the local API, the database, and the self-hosted fonts | the real clock; both appearances | offline | the pinned Chromium, fixed viewport and device-pixel ratio, `workers: 1` | axe JSON/HTML, the committed baselines, and the keyboard-pass record |
| Lighthouse and INP | `lighthouserc.json`, `apps/web/tests/perf/inp-user-flow.mjs` | the production build and a local server | the mobile form factor with simulated throttling; three runs per URL | offline (the pinned browser is a setup download) | one URL at a time | Lighthouse JSON/HTML |
| Load | `scripts/load/**` | 10,000 seeded accounts, 300 live sessions, and the fake at `50 ms` | the real clock; `NODE_ENV=test`; the Linux host's `127.0.0.0/8` | offline | no other job on the host; one run at a time | the load report and its limiter probe |
| Governance | `governance-drift-check.mjs` | none | not applicable | offline | one process | the CI log |

The network rule is one sentence: **the test classes run offline; only the setup
steps reach the network.** `pnpm install --frozen-lockfile`, the pinned
Playwright browser download, and the Semgrep install are the setup steps, and
they install dependencies or tools rather than test inputs. The Twilio adapter is
never called — its unit test stubs the HTTP client, and every other suite runs
`SMS_TRANSPORT=fake`. A test that needs a network is marked `@network`, is
skipped unless `NETWORK_TESTS=1`, and is time-bounded at 120 s; CI never sets the
flag. Every class runs with `TZ=UTC`, and no assertion depends on the host's
locale. Lighthouse keeps its JSON/HTML report locally and uploads to no public
storage. The integration and end-to-end classes reach PostgreSQL through PgDog,
so the pooler the deployment uses is in the path the tests exercise.

#### The enumeration test's reproducibility (CHK032)

A passing run is evidence only when all of the following hold together; a run
that departs from one is marked invalid and records no verdict.

- **One host.** The `ubuntu-24.04` GitHub-hosted runner, one job, the three
  suites serial, and no other job on the same runner. A run on another host
  class, or on a shared runner, is not a verdict.
- **One build.** One commit, one `pnpm install --frozen-lockfile`, and one
  production build; the same artifact and lockfile serve all three suites, and
  nothing is rebuilt between cases.
- **One fixed fixture.** A committed seed creates one active merchant per case,
  one locked account, one blocked account, and one administrator, with fixed
  numbers, a fixed city, and the load-only credential; the no-account case uses
  a number outside the seed. The suite's `beforeAll` creates the fixture, and
  the three suites read the same one. No value is generated per run.
- **One transport and one clock.** `SMS_TRANSPORT=fake` and
  `SMS_FAKE_ACCEPT_MS=0` for the three enumeration suites, because the
  comparison measures work and not the channel; the hidden-field pair in T073
  sets `200 ms` on its own protocol and restores `0`. Durations are read on the
  real clock; the injected clock supplies only the expiry values, which are
  masked.
- **The stated sampling.** A 20-request warm-up, 200 samples per case, the top
  and bottom 5% (10 samples each) dropped, then the median and p95.
- **No coverage instrumentation.** The three enumeration suites run with
  coverage off; the coverage report comes from the non-timing run. A timing run
  with instrumentation on is invalid.
- **No concurrency.** `fileParallelism: false` for the three suites, and no
  migration, seed, or other suite runs during them.
- **One re-run.** A failing run may be repeated once on the same runner class
  and the same build; both reports are kept, and the second is the verdict. A
  second failure is a failure, not a flake to be retried again.
- **One tolerance, three suites.** T037, T058, and T082 each assert the same
  four masked values, the same equality, and the same tolerance, so one
  operation's pass cannot carry another's.

#### The evidence kept (CHK033)

Every criterion's evidence is retained and reviewable, and each artifact has one
owner. The acceptance run's bundle is attached to the `r1-acceptance` release
and is permanent; the CI artifacts cover the review window at 90 days.

| Evidence | Produced by | Where it lives | Retention | Owner |
|---|---|---|---|---|
| Coverage report (the physical and measurable changed-line counts, the covered count, the percentage, and every excluded path with `EX-007`) | T022 and T024 | the CI artifact and the pull request | 90 days in CI; the acceptance run's copy in the `r1-acceptance` release | R1 (repository owner) |
| Enumeration per-sample JSON for the three operations | T037, T058, T082 | the CI artifact and the pull request | 90 days; the acceptance run's copy in the release | R1 |
| Load report, including the refused/accepted counts and the limiter probe | T117 | the CI artifact, the pull request, and the `r1-acceptance` release | permanent for the acceptance copy | R1; R12 after it owns the pipeline |
| axe JSON/HTML for the 128 scans | T115 | the CI artifact and the pull request | 90 days; the acceptance copy in the release | R1 |
| Lighthouse JSON/HTML and the INP flow's result | T024 and T141 | the CI artifact and the pull request | 90 days; the acceptance copy in the release | R1 |
| Visual baselines | T116 | committed under `apps/web/tests/e2e/__screenshots__/` | the life of the repository | R1 |
| The manual keyboard-only pass | T124 | committed as `apps/web/tests/a11y/keyboard-pass.md` | the life of the repository | R1 |
| Playwright traces, screenshots, and videos of failures | T039, T062, T084, and the shell suites | the CI artifact | 90 days | R1 |
| Governance, SBOM, and SARIF outputs | T024, T128 | the CI artifact | 90 days | R1 |
| The acceptance record itself | B8 | the pull request's B8 checklist and this plan's re-evaluation log | the life of the repository | repository owner |

A gate is not overridden for want of an artifact: a missing report fails the
acceptance rather than being re-created from memory, and the pull request links
each artifact beside the criterion it decides.

#### Concurrency: how "together" is produced (CHK025)

The suite's races are deterministic, not probabilistic. The harness is a
test-only decorator over the `UnitOfWork` port, `apps/api/test/support/barrier.ts`,
with `holdAt('beforeCommit')` and `release()`; no production seam is added and
no `setTimeout`, `Promise.race`, or scheduling luck decides an order. Each race
runs **three interleavings, once each**:

1. **A commits first** — A is released and committed before B begins its write.
2. **B commits first** — the same in the other order.
3. **Both at the barrier** — both requests pass their pre-write read and reach
   the barrier before either commits; the barrier releases both.

The first two are serial and deterministic. The third asserts the admissible
outcome set — either A or B may win — and rejects every other state: both rows,
neither row, a partial row, or two sessions. The nine runs cover the three
races: two sign-ups for one number (T038), two entries of one correct code
(T038), and a change and a reset for one number submitted together (T083).

The rule under test in the third interleaving is the conditional write, not the
pre-read: both racers may pass the read, and the write's own condition carries
the authority, so the loser's write affects zero rows and it refuses. The
assertions are stated per race: one account and one session for the two
sign-ups; one account, one session, and no live pending request for the two
code entries; exactly one password write, no session that existed at the winning
write surviving it, and the loser's specified outcome (`RECOVERY_EXPIRED` for
the reset when the change committed first, or the ended session for the change
when the reset committed first). The losing sign-up receives the same 202 any
submission receives, and its resume read states the winning row's own status and
role — `existing_account`, `blocked_account`, or `administrator_account` — not a
generic direction. A run that produces any other state fails.

#### The clocks: no real waiting (CHK026)

The Verification Notes' clock paragraph is the rule; this is how each bound is
decided. One injected clock is the only time control, the suite sets the
process time to the same instant so better-auth's own expiry read agrees, and
`advance(ms)` moves it. Every rule is asserted on both sides of its bound:

| Rule | Field | Before the bound (bound − 1 ms) | At the bound |
|---|---|---|---|
| Sign-in lock | `users.locked_until` | refused; the lock still holds | allowed; the lock lifts |
| One-time code | `code_expires_at` | accepted | `OTP_EXPIRED` |
| Pending request | `request_expires_at` | live | ended, with the expiry notice |
| Inactivity timeout | `sessions.last_activity_at` | live | ended |
| Absolute lifetime | `sessions.expires_at` | live | ended |

No test sleeps for a real interval. The only tests that read real time are the
timing suites (SC-001–SC-004 and SC-009), and they measure durations rather than
wait for a rule. A test that waits on the wall clock is a defect in the test,
not a slow case: the four rules — the lock, the code and its request, the
inactivity timeout, and the absolute lifetime — are exercised through the
helper in T056, T057, T058, and T108, and the persisted effect is read back with
the advanced instant passed as a bound.

#### The messaging channel's failure matrix (CHK027)

The channel has two failure kinds — a refusal at acceptance and a request
timeout — and FR-034 distinguishes two placements, the fresh request and the
re-request. Every cell is asserted; the fake produces the kind, and the
adapter's 750 ms timer is advanced by the fake clock rather than waited on.

| Placement | Refusal at acceptance | Timeout at 750 ms |
|---|---|---|
| Fresh sign-up verification (`sign-up.ts`, T037) | `OTP_SEND_FAILED` on the submission; no pending row, no code, no code step; the account-creation budget spent; the re-request allowance untouched; `auth.otp.dispatch_failed` with `kind: sign_up` | the same |
| Fresh recovery request (`recovery.ts`, T082) | `OTP_SEND_FAILED` on the submission; no pending row, no code, no code step; the recovery budget spent; the allowance untouched; the event with `kind: recovery` | the same |
| Sign-up re-request (`verifications.ts`, T049 and T036) | `OTP_SEND_FAILED` on the code step's resend control; the previous row, code, and both expiries unchanged; the allowance not spent; the event with `kind: sign_up` | the same |
| Recovery re-request (`verifications.ts`, T049 and T036) | the same, with `kind: recovery` | the same |

A failed notice is outside the matrix because it is best-effort: the password
change or the sign-out of every device completes, the action is not undone, and
`auth.notice.dispatch_failed` records it with its `kind` (T070). No cell
dispatches twice, queues a retry, or writes a pending row before acceptance. The
fresh failure is never reported on a code step the person has not reached, and
the re-request failure never invalidates the code already sent.

#### The substituted states (CHK029)

R1 ships no act that blocks an account and no act that removes one, so both
states are inputs to the tests rather than outcomes of a product path, and the
substitution is accepted with its boundary stated.

- **Blocked.** T090 seeds the `users` row with `status = 'blocked'` and a live
  session directly through `packages/db`, then asserts the uniform refusal, its
  equal work and duration (SC-004 includes the blocked case), the retained rows,
  the refused session, and the block's request boundary. The substitute proves
  the state's consequences. It cannot prove the act of blocking, its
  authorization, its audit record, or the operator's surface — those are R13's,
  and this slice has no act to exercise. `EX-008` covers the test's crossing
  with US2's sign-in path.
- **Removed.** T144 seeds the `users` row, its `accounts` credential, a live
  session, and a live pending request, establishes that state first, then
  performs the removal the test owns in the order `data-model.md` §3 fixes —
  credential, pending request, user — and asserts that no session survives (the
  seeded token resolves as the guest), no pending row or usable code survives,
  no credential permits a sign-in, and no `users` row remains. The substitute
  proves the store's post-removal state and the cascade's direction. It cannot
  prove the administrator operation's authorization or audit record (R13), a
  product delete path (R1 has none), a retention trigger (R13 or R15), or the
  operator's surface. T144 opens no other story's surface and adds no product
  delete path.

Both substitutions are bounded to what the criterion asserts — the consequences
of a state the slice does not produce — and neither is read as proof of the act
that will produce it. The slice that ships the act re-verifies the consequence
through it.

#### The negative and temporal invariants (CHK030)

Each invariant carries a passing assertion and a failing case, so a test cannot
pass on the happy path alone or on one observation. The failing case is a
mutation applied in a rolled-back transaction: it must make the assertion fail,
and a test that still passes with the mutation applied is a defect in the test.

| Invariant | Passing assertion | The failing case that must be caught | Test |
|---|---|---|---|
| No email address | every account's credential `email` matches the reserved sentinel `218…@phone.invalid`; no form collects an address, no response shows one, and no path uses one | a submission carrying an `email` field is refused or ignored and stores no address; a seeded real address fails the scan; an email-shaped sign-in identifier receives the format refusal | T037 and T058 |
| No session cap | a sign-in leaves every session the account already holds live: 3 seeded sessions, then a sign-in, and all 4 grant access | a build that revokes on sign-in leaves 1 and fails the assertion; the fixture creates the 3 first, so the count is not vacuous | T059 |
| No account before verification | zero `users` and zero `sessions` after the form, while the pending request is live, after an incorrect code, and after the request's lifetime; one account and one session at the correct code | a partial row seeded at each point — a `users` row without its credential and session — is found by the same detector, so the detector is proved to see a row and not only to count zero | T037 and T038 |
| Row-level creation | the account row and its session appear together, in one transaction, only at the correct code; a second entry creates no second row | a fault injected after the user insert leaves zero rows and zero sessions; a seeded partial row — a `users` row without its session — at the correct-code point is caught by the same detector, so the detector is proved to see a partial row | T037 and T038 |
| The four clocks | each rule on both sides of its bound, as the clock table above states | advancing one millisecond past the bound must flip the verdict; a build that reads a bound it does not enforce fails the case | T056, T057, T058, T108 |

The mutations never commit: each runs in a transaction the suite rolls back, and
the seeded state the later assertions read is established before the mutation,
so a failed mutation cannot be mistaken for the invariant's result.

#### The reference data's failure conditions (CHK034)

The reference data is read at build time or at boot, and its failure conditions
are a closed list. Each one fails; a condition outside the list does not.

1. The city list at `packages/shared/src/reference/libyan-cities.json` is
   missing, unparsable, or empty: the build that imports it fails at typecheck
   or build, before an artifact exists.
2. Any of the **22 governorates** the `SOURCE` note records is absent: T034
   fails.
3. A governorate has no city or area entry: T034 fails.
4. A name is empty, non-Arabic, carries a Latin alternate, or duplicates another
   entry's name without its qualifier: T034 fails.
5. The file's entry count differs from the count the `SOURCE` note records:
   T034 fails. A truncated file therefore fails even when the entries it kept
   are real places.
6. The file's SHA-256 differs from the digest in its `SOURCE` note: T034 fails.
7. The mobile-prefix set is missing or unparsable: the build fails. It is
   empty, carries a duplicate or a non-`+218` prefix, its count differs from its
   `SOURCE`, or its digest differs: T034 fails.
8. The breached-password list is missing, truncated, or altered: the boot
   loader's line-count and SHA-256 checks stop startup with a non-zero exit, and
   the boot test's truncated copy asserts the exit. Its count is 100,000 and its
   source, version, and digest are its `SOURCE` note's.

The city list's `SOURCE` records version `2.0.0` (2026-11-09) and the reference
count of 22; the breach list's records SecLists, its version, and its digest. A
list that is due for its quarterly refresh is **not** a failure: it stays in use,
the check remains available because the list is local, and staleness is a
maintenance finding with a review date, never a runtime refusal.

#### The N+1 measurement (CHK035)

The measured request is `POST /api/v1/auth/sign-in` in T058's suite, with the
connection wrapped in a counting logger. Its expected count is **three
statements**: one `users` read by the normalized number, one `accounts` read by
the user identifier, and one `sessions` insert. The fixture runs the same
request with one live session and with three, and both report three, so the
count is not a function of the session population. The claim fails when a fourth
statement appears — an eager-load, a second user or credential read, a per-
session read, or a status read taken outside the shared entry point — and the
suite fails on the count rather than on a later assertion. That is the count
Complexity Tracking row 19's "met" status records; the status is reviewable
against this test and no other.

#### US7's P1 status (CHK018)

US7 is P1 because the control set is the constitution's requirement for the
first browser-facing feature, not because it ships a surface. It delivers no
page and no route of its own: its six controls live on US1's and US2's surfaces,
and its Independent Test is the five integration cases on those surfaces — T073
(the hidden field's silence and the minimum time), T074 (the two-key limits and
the resend bound), T075 (the refusal order), T076 (forgery, encoding, and the
headers), and T077 (the no-CAPTCHA rule) — read together with US1's and US2's
criteria. That is the P1 checkpoint's pass condition (B8, item 17), and `EX-011`
covers the crossing. The P1 gate therefore does not imply a shippable US7
surface: at R1's acceptance US7 is delivered as controls on other stories'
surfaces, and no page is claimed for it.

#### The copy scan's message set (CHK017)

SC-008's message set is closed at **four** templates, and the scan reads them
from one exported map whose keys are exactly:

`otp_sign_up`, `otp_recovery`, `notice_password_changed`,
`notice_signed_out_all`.

T100 iterates that map, T026 renders each body with six Latin digits and asserts
its length against its class's bound (70 code units for a code body, 134 for a
notice), and a unit assertion compares `Object.keys(SMS_TEMPLATES)` with the
sorted closed list, so a fifth key fails the scan rather than entering it after
the fact. A fifth template requires an amendment to SC-008 and to the map in the
same change; the contract's §7 is the text's authority, and the four bodies are
51, 64, 84, and 71 code units.

#### R1's acceptance (CHK036)

**R1's acceptance is the acceptance commit**: the commit recorded as the B8
verification run, whose CI run satisfies all of the following together and whose
pull request carries the evidence. It is not a calendar date, not the plan's
approval, and not the last task's completion.

1. Every task in `tasks.md` is `[x]`, every acceptance criterion has its
   failing-first test, and every `(implements …)` citation resolves.
2. Every checklist under `checklists/` — the nine files the directory holds,
   `requirements.md` included — carries zero unchecked items.
3. The CI gate is green on that commit: the governance drift check, lint,
   typecheck, unit, integration, end-to-end, the accessibility scan, the visual
   baseline, Lighthouse (LCP/INP/CLS), the ≥ 80% changed-line coverage gate, the
   SBOM, `osv-scanner`, and Semgrep.
4. The SC-009 load verdict passes and its report is attached, including the
   post-run limiter probe's refusal of the 21st submission.
5. The down-migration exercise and the encrypted-backup restore drill have their
   records.
6. The P1 checkpoint passed on the five US7 integration cases and US1's and
   US2's criteria.
7. The six exceptions are dispositioned on that commit: `EX-007` stays Active
   with R2's acceptance as its end, and `EX-008`…`EX-012` close against the
   criteria their rows name, because their tests now run against completed
   stories. A story that is not delivered keeps its row open and the acceptance
   is not recorded.
8. The repository owner signs the acceptance record.

The phrase **"at R1's acceptance"** in the exception register means that commit
and no other moment. R2's acceptance is the same event for R2's slice, defined
by R2's plan on this pattern; `EX-007` closes on that record, not on a date. Its
**2027-01-31** review date is an escalation trigger: if R2 has not been accepted
by then, the row is reviewed and renewed with a new date and a note in R2's
plan, never closed by time.

#### The exception crosswalk (CHK015, CHK037, CHK038)

The register's row and this table are one record. Each exception names the
criteria that close it, the paths its exact scope covers, and the event that
ends it; the matching Complexity Tracking row states the same set, and a change
to either is a change to both in the same change.

| Exception | Complexity Tracking row | Exact scope: the paths and the condition | Closes on | Ends at |
|---|---|---|---|---|
| `EX-007` | row 4, with the coverage exclusion in row 2 | the runtime lines of `packages/ui/app/components/shell/**` and `apps/web/app/layouts/shell.vue` that only a page rendering the frame executes: the focus landing (AC-024); the stacking order (AC-024, AC-042, AC-051); the outside activation's consumption (AC-024, AC-042, AC-051); the drawer's focus containment (AC-024); the menu's live open, runtime dismissal, confirmation's result, and the ended-session state (AC-051, AC-053); the bar's scroll-hide (AC-042); the guest's redirection (AC-024, AC-042, AC-052); the label cut (AC-042); and the frame's scan and keyboard pass (SC-005's R2 half, SC-006's frame half) | AC-024, AC-042, AC-051, AC-052, AC-053, SC-005's R2 half, and SC-006's frame half | R2's acceptance; 2027-01-31 is the escalation date |
| `EX-008` | row 18 | the blocked-account half of `apps/api/test/integration/users/status.spec.ts` over `apps/api/src/modules/auth/service/sign-in.ts`, `apps/api/src/modules/auth/routes/session.ts`, and `apps/api/src/http/context.ts` | AC-019, AC-021 | R1's acceptance |
| `EX-009` | row 20 | `apps/web/tests/e2e/bare-layout.spec.ts` over `/auth/sign-up`, `/auth/sign-in`, and `/auth/forgot-password` | AC-023, AC-044 | R1's acceptance |
| `EX-010` | row 21 | `administrator-first-sign-in.spec.ts` and `administrator-refusal.spec.ts` over `sign-in.ts`, `user-lock.ts`, `recovery.ts`, and `sign-in-administrator.ts` | AC-016, AC-029, AC-030 | R1's acceptance |
| `EX-011` | row 22 | `SignUpForm.vue`, `sign-up.ts`, `session.ts`, `recovery.ts`, `verifications.ts`, `apps/api/src/http/**`, `apps/web/server/**`, `sign-up-abuse.spec.ts`, `rate-limits.spec.ts`, `security.spec.ts`, `no-captcha.spec.ts`, `recovery-rate-limit.spec.ts`, and `code-dispatch-ceiling.spec.ts` — the six controls | AC-031, AC-032, AC-033, AC-034, AC-035, AC-036, AC-048, AC-049, AC-050, AC-055 | R1's acceptance |
| `EX-012` | row 24 | `security-events.spec.ts` over `apps/api/src/modules/auth/service/events.ts`, `apps/api/src/modules/auth/routes/**`, and `apps/api/src/cli/**` | AC-040, AC-047 | R1's acceptance |

The register's rule 6 states the same reading: a row's exact scope names the
paths and the condition under which it stops applying, its closing criteria are
named beside it, and its review date is an escalation trigger rather than an
expiry. A row that names a class of behaviour, a whole story, or no path is not
an exception and is a defect in this plan.

### The SC-009 load profile

The measurement condition is a ceiling, not a configuration: 10 authentication
requests per second under the three per-operation budgets in CMV row 3 would be
refused almost entirely from one origin (account creation allows 20 per origin
per 15 minutes, so 200 submissions from one origin lose 180 to `429`). The run
therefore presents one origin key per virtual user and one number key per
request, and its verdict reports what was accepted and what was refused, so a
refusal-dominated run cannot be reported as a pass. The figures are a
measurement condition and refuse nothing by themselves: above them FR-033's
per-key budgets still decide each request, and a request the platform cannot
serve is FR-040's unnamed failure (Clarifications 2026-11-05). The transport's
acceptance wait is declared beside the condition in row 13 and tunes nothing
the condition fixes: it models the channel whose wait SC-009 puts inside the
budget. The profile is fixed here once and the script follows it:

| # | Item | Value |
|---|---|---|
| 1 | Duration and rate | 60 s at 10 requests/second — **600 measured requests, 200 per operation** |
| 2 | Virtual users | **20 concurrent**, each issuing one request every 2 s, staggered 100 ms apart so the aggregate inter-arrival is a steady 10 per second |
| 3 | Origin key | One loopback source address per virtual user — `127.0.0.2` … `127.0.0.21`; the API keys an untrusted peer by its peer address (`contracts/auth-api.md` §2.5), so each virtual user presents its own origin key and none can forge another's |
| 4 | Per-origin spend | 10 account creations (limit 20; 11 with the warm-up), 10 sign-ins (limit 60), 10 recoveries (limit 20) — no origin reaches 60% of a budget, so a retry does not tip the run into a refusal |
| 5 | Number keys | One distinct number per request, never reused in the run: **200 numbers outside the seed** for account creation, **200 seeded accounts** for sign-in, **200 other seeded accounts** for recovery |
| 6 | Per-number spend | 1 of 3 (account creation), 1 of 20 (sign-in), 1 of 3 (recovery) |
| 7 | Session population | **300 live sessions seeded**; the run's 200 sign-ins bring the live population to exactly **500**, the condition's ceiling, which the script asserts from `sessions` before and after and fails if it is exceeded |
| 8 | Form-level rules | Each sign-up sends `website: ""` and the `formStamp` the warm-up's render-bootstrap read returned; the script waits 3 s after that read before its first sign-up, so the stamp is old enough and, at 30 min, never too old, and neither the honeypot nor the minimum-time rule refuses it (FR-029) |
| 9 | Credentials | Each sign-in presents a seeded account and the seeder's load-only credential, so every attempt verifies, no consecutive-failure count moves, and no lock engages (FR-009) |
| 10 | Transport guards | Each request carries one CSRF token, fetched once in the warm-up, and the allowlisted web `Origin` — that header names the site, not the client, and is never the origin key |
| 11 | Warm-up | One account-creation submission per virtual user before the timed window, excluded from the 600 and reported separately; it spends one unit of each origin's account-creation budget |
| 12 | Bypass | **None.** No environment variable, flag, or build disables, raises, or skips a limit for the measurement; the limiter runs unmodified |
| 13 | Channel acceptance wait | The fake's `SMS_FAKE_ACCEPT_MS` is **50 ms** for the timed window — a declared nominal, not the 750 ms ceiling — applied before the fake answers `accepted`, so every dispatch's measured duration carries it; it sets the transport's behaviour and touches no limit, and the script declares the value and fails a run in which a measured dispatch is faster than it, so an API left at the default `0`, or a delay dropped or ignored, cannot measure as a pass |

**The verdict.** The script prints, per operation and in total, the *attempted*,
*accepted*, and *refused* counts and the refusal codes, where accepted means the
route's documented success status (`202` for the two dispatches, `200` for
sign-in). It fails the run when any measured request is refused, when an
operation's accepted count is not 200 (so a dropped or errored request cannot
pass as fast), when a measured dispatch is faster than the declared 50 ms wait,
when the work-only p95 exceeds 250 ms, or when p50 exceeds 150 ms or p95 exceeds
1,000 ms for an operation or in aggregate. Percentiles are computed over accepted
requests only; because any refusal fails the run, a refusal-dominated run has no
verdict to report at all rather than a p95 drawn from a handful of survivors.

**The wait is inside the number, and the work carries a margin.** Every dispatch
the run measures waits the declared **50 ms** before the fake accepts, so a
dispatch operation's duration is its work plus that wait: its p50 comparison
spends 100 ms of the 150 ms on the work and its p95 comparison 950 ms of the
1,000 ms, with the wait inside the budget and not excluded (SC-009); sign-in
dispatches nothing and is measured whole. The p95 is also read as work alone —
for a dispatch, its measured duration less the declared wait, which is never less
than the work because the fake's timer fires at or after the declared wait, and
for a sign-in, its measured duration as it stands — and the work-only p95 MUST be
**≤ 250 ms**, per operation and in aggregate. 250 is not a second budget: the
provider's ceiling is 750 ms and SC-009's p95 is 1,000 ms, and 250 is the share
of the 1,000 the work may take, so the worst case the nominal run cannot exercise
still fits — 250 + 750 = 1,000 — while the nominal wait alone would leave that
case unstated. Neither bound moves: the run asserts p50 ≤ 150 ms and p95 ≤
1,000 ms on the whole duration, the adapter's 750 ms timeout is unchanged, and
the margin only states what SC-009's p95 leaves the provider.

**The limiter was live.** The profile is keyed, never exempted, so the verdict
proves the limiter ran: after the timed window the script reads back the
`rate_limit_counters` rows the run created — one per key and window, summed
across the windows the run spans, with the counts the profile plans — and a probe
from a fresh origin (`127.0.0.22`) spends that origin's 20-request account-creation
budget and requires the **21st** submission to be refused `RATE_LIMITED` with
`Retry-After`. The probe runs outside the timed window and its refusal is the
expected result, not a measured one; a build or environment with a limiter bypass
fails the probe.

The measurement host is Linux — the CI runner or the load host — because the
profile binds addresses in `127.0.0.0/8`, which Linux assigns to the loopback
interface as a whole; the script refuses to start when its own `NODE_ENV` is
`production`. The registered verdict is the `load` job's run on `ubuntu-24.04`
in `.github/workflows/ci.yml` — CI's fixed PostgreSQL 16 service, the committed
seeder, and the script's own API at the declared `50 ms` — because that is the
one host class the project can reproduce; a run on any other host, including a
developer machine, is a development check and does not replace it.

## Constitution Check

*GATE: evaluated before Phase 0 research; re-evaluated after Phase 1 design. An unjustified violation is an ERROR; a justified one is a Complexity Tracking row.*

**Pre-Phase 0 result: PASS.** **Post-Phase 1 result: PASS** (re-evaluated at the end of this section; no new violation was introduced by the design). **Re-evaluated 2026-10-30: PASS** after the 2026-10-30 clarification session and the `/speckit.analyze` pass; the Documentation, Schema and Migration Control, and Deployment and Observability rows below carry the additions those findings required (C1–C5), and the findings that named a row number, an ownership entry, or the baseline state list are answered in place (I2, I3, I5). **Re-evaluated again 2026-10-30: PASS** after the amendment pass that added records 11 and 12, scheduled the Technology Standards amendment at R1's acceptance, moved the shared page scaffolding into A8, recorded the audit boundary, corrected the test roots and the composables path, narrowed the `docs/architecture.md` claim, and made the load script's thresholds the release gate; no status changed. **Re-evaluated 2026-10-30 (register closure): PASS** after ADR-141 to ADR-146 recorded the five register rows and amended the Technology Standards register to constitution 6.3.0; the record bookkeeping, the Ownership Map, and the Technology Standards row below now state the amendment as recorded rather than scheduled, and no status changed. **Re-evaluated 2026-10-31: PASS** after the 2026-10-31 clarification session and the record of FR-022's delegated rail width; Gate 1 → IV and V and Gate 2 → Single-Reference Sufficiency and Product Fact Clarifications carry the additions, and no status changed. **Re-evaluated again 2026-10-31 (analyze C1): PASS with exceptions `EX-007` and `EX-008`** after the password-change service moved into A8, US4's blocked-account sign-in test was registered as `EX-008`, and Gate 1 → VIII was restated to claim only what the tasks support; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-10-31 (analyze C2): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, and `EX-010`** after the User Stories' Independent Test paragraphs were restated to claim only what each story verifies without another story and to name the registered exception covering its one test over a delivered surface; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-10-31 (analyze F1): PASS** after the first standalone documentation-drift test's ownership was aligned with ADR-031 item 4 — R1 generates the OpenAPI document and R2 owns the drift test — and no status changed. **Re-evaluated again 2026-10-31 (analyze G1): PASS** after the public-API versioning and deprecation rule entered Gate 2 → Deployment and Observability and record 13; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-10-31 (SC-009 measurement validity): PASS** after the load profile, the accepted/refused verdict, and the no-bypass limiter probe were fixed; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-10-31 (analyze C3): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, and `EX-011`** after the shared code step moved into A8, US7's hidden field and refusal order were registered as `EX-011`, and Gate 1 → VIII stopped claiming US7's independence; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-10-31 (plan repair S1, P1, T1, D1, I2): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after the layer's data-page primitives were added to A2, the ownership map, and Complexity Tracking; A2 and B6 were aligned with the US5 tasks; US2's security-events test was registered as `EX-012`; the checklist tree gained `ui.md`; and the N+1 row was aligned with `ROADMAP.md` line 140; no requirement, criterion, or success criterion changed. **Re-evaluated again 2026-11-01 (analyze C1, C2, U2, I4 and clarify I1, U1): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after the lock's persistence moved into the `users` module, the operational boundary and its review date entered Complexity Tracking, the city list's provenance and completeness test were recorded, the `verifications` placeholder's reason entered Gate 2, and the password maximum and emoji predicate the 2026-11-01 clarification fixed reached CMV row 17, `research.md`, and the contracts; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-11-01 (repair C1, D1, E1, F1, G1): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after the silent hidden-field refusal's mechanism was fixed in Technical Context, `contracts/ui-contracts.md` §3.1, and `quickstart.md` Scenario 6 and recorded as record 15 (T142); the guest's three controls at 320 CSS px entered Gate 1 → IV, the 2026-11-01 log, `contracts/ui-contracts.md` §8.6, and `quickstart.md` Scenario 14; the module layout was narrowed to what `tasks.md` builds with Complexity Tracking row 26 and record 1; the documentation tree gained `checklists/data.md`; and Complexity Tracking gained its `#` column with every citation re-read; no requirement, criterion, or success criterion moved. **Re-evaluated again 2026-11-02 (CHK001): PASS** after the threat and control map joined Gate 2 — twenty-two threats across the twenty-three named requirements, the two requirements that are not controls named and explained, and the lock's accepted denial of service cited to Complexity Tracking row 27; no requirement, criterion, success criterion, budget, or task identifier moved. **Re-evaluated again 2026-11-02 (CHK027, CHK039): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after `EX-007`'s scope named each behaviour the frame's deferral carries beside the criterion that closes it — the account menu's live open and sign-out, the drawer's open, close, and focus containment, the bar's scroll-hide, and the guest's redirection — and Complexity Tracking row 4 carries the same list; no requirement, criterion, success criterion, budget, or task identifier moved. **Re-evaluated again 2026-11-02 (copy checklist CHK013, CHK025, CHK036, CHK004): PASS** after the copy's four measurable bindings were recorded — the SMS segment bound by class, the emoji predicate's pinned Unicode data, the copy's named reference, and the numerals' single source — and Gate 2 → Single-Reference Sufficiency now names the two plan values the closed CMV list does not enumerate; no requirement, criterion, success criterion, CMV row, entity, budget, or task identifier moved. **Re-evaluated again 2026-11-03 (EX-007 scope pass): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after the pass kept the frame's deferred set to the page behaviour alone — what only a rendered page can exercise — and returned the component-level drawer, account-menu, and bottom-bar assertions to R1; Gate 1 → VIII was re-read with that boundary, Gate 1's other principles, Gate 2, and Gate 3 were untouched, and no requirement, criterion, success criterion, CMV row, entity, page, dependency, or task identifier moved. **Re-evaluated again 2026-11-03 (H3): PASS with a justified deviation at Gate 1 → X (`Complexity Tracking row 26`)** after the gate's X row stopped reporting PASS and now names the principle the module layout departs from — `auth` without `repository/` and `users` without `routes/` against "Each module has its own routes, service, and repository" — with the same justification (no second writer of the library's tables, and no route surface no requirement names) and the same owner and review date, 2026-12-01; no requirement, criterion, success criterion, CMV row, entity, budget, or task identifier moved. **Re-evaluated again 2026-11-03 (M1): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after Gate 2's Threat and Control Map row T13 named the ten `POST` routes `contracts/auth-api.md` §5.2–§5.11 defines in place of "the seven state-changing actions the slice ships" and its verification cell claimed only the scope T076 tests; FR-044 and AC-048 were not edited, Gate 1, Gate 2's other rows, and Gate 3 were untouched, and no gate's status changed. **Re-evaluated again 2026-11-03 (M2): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after Complexity Tracking row 7 recorded PgDog's AGPL-3.0 obligation and the operational coupling the pre-1.0 hop creates, with Gate 2 → Dependency Governance and Technology Standards citing the row; Gate 1 and Gate 3 were untouched and no gate's status changed. **Re-evaluated again 2026-11-03 (L4): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after Complexity Tracking row 28 recorded the README's clean-checkout verification as the release gate's (R12) and Gate 2 → Documentation cited the deferral; Gate 1 and Gate 3 were untouched and no gate's status changed. **Re-evaluated again 2026-11-03 (A3, C2, I1, I2): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after Gate 2 → Glossary separated the merchant's account from the library's `accounts` credential table, Complexity Tracking rows 29–33 named the five foundation duties that serve named gates and carry no requirement, the Documentation tree listed the eight checklists the directory holds, and the Summary took FR-020's and FR-052's surface order with the bottom bar as the fourth surface; no principle's status changed, Gate 2's other rows and Gate 3 were untouched, and no gate's status changed. **Re-evaluated 2026-11-04 (AC-051): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after AC-051 was narrowed to the menu's composition, its two link targets, and its confirmation markup — its live behaviour stays R2's under `EX-007` — and the menu's destinations and the Profile page's content were recorded as Complexity Tracking row 34, R7's; Gate 1 → VIII and Complexity Tracking row 34 carry the boundary, no principle's status changed, and Gate 2 and Gate 3 were untouched. **Re-evaluated again 2026-11-04 (operations clarify, CHK015, CHK016, CHK017, CHK019, and CHK020): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after FR-054 and FR-055 with AC-059 … AC-062 entered the specification - the restart and release rule, and the restore and rollback rule that reads FR-017 and FR-018 at the restored moment - and a new Assumption recorded the R12, R13, and R15 split; Gate 1 → I now names FR-055 and AC-062, and Complexity Tracking row 35 records the accepted recovery consequence — a restore may undo a block applied after the restore point and bring back a row removed for good after it — with its owners and review date, while the Threat and Control Map rows and the integration tasks that must assert the four criteria are the next plan and tasks pass, because this pass edits no task and adds no map row; no existing requirement, criterion, success criterion, budget, entity, or task identifier moved. **Re-evaluated 2026-11-04 (copy closures, CHK006, CHK007, CHK014–CHK020, CHK028–CHK032, and CHK035): PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`** after the copy contract's fifteen items closed — the nine sidebar and four static-page labels, the act and in-progress labels with the ellipsis, the code step's endings, the city combobox's empty state, the template's render failure, the numeral agreement classes, the `lang` marking, and the message body's direction — and `quickstart.md` Scenario 15 makes them runnable; Gate 1 → V and Gate 2 → Glossary and Single-Reference Sufficiency carry the additions, and no principle's status changed.

### Gate 1 — Core Principles (I–X)

| Principle | Status | Evidence / notes |
|---|---|---|
| I. Evident, Traceable Change *(NON-NEGOTIABLE)* | PASS | FR-001 … FR-055 and AC-001 … AC-062 drive the plan; every task will end with `(implements FR-###, AC-###)`; commits reference spec, plan, and task identifiers. R1's foundation duties that implement no product requirement are recorded in Complexity Tracking row 1 and the named rows 29–33, not linked to a fabricated requirement. |
| II. Strict Type Safety | PASS | Strict mode plus the four extra checks in every workspace; `any` and double assertions are rejected by the committed ESLint configuration; every request, response, and environment value is a Zod schema in `packages/shared`, imported by both web and api. |
| III. Measured Test Coverage | PASS | The spec's Test Coverage Request is answered in the test plan (unit, integration, end-to-end all requested); the CI coverage job enforces ≥ 80% of measurable changed production lines (the added lines with an lcov `DA` record) with Vitest's V8 provider and the unit/integration project split (T022; Complexity Tracking row 32). Because every production line is new in R1, the whole-project threshold equals the measurable changed-line threshold; later slices add a diff-coverage step. The frame's page-level runtime is excluded as Complexity Tracking row 2. |
| IV. Accessible User Interfaces | PASS | WCAG 2.2 AA; the axe scan over every state in both appearances and the keyboard-only pass at 320/1280; every state announced, focus moved to the step now shown; `:focus-visible` with a 2px ring from the layer; touch targets ≥ 44px on coarse pointers; every state (loading, empty, error, success, disabled) rendered on the three pages. The frame's ended-session state is announced ahead of the page's other announcements and takes the focus to its focusable heading, the blocked variant included; a navigation from the open drawer settles the focus on the destination page's heading, while the three dismissals that do not navigate return it to «المزيد»; at 320 CSS px the header keeps all four controls in one row, the three inline-end ones icon-only at the touch floor with their accessible names, and a guest's three controls — the logo/home control, the theme switch, and the sign-in action — remain in that one row under the same rule, none dropped, folded into an overflow menu, or moved, each keeping its accessible name and its touch target (FR-049, FR-022, FR-023; AC-025, SC-006; Clarifications 2026-10-31 and 2026-11-01). |
| V. Arabic-First and RTL Interfaces *(NON-NEGOTIABLE)* | PASS | `<html dir="rtl" lang="ar">` from `apps/web/app/app.vue` on every page; logical CSS only, enforced by Stylelint; Latin numerals through the layer's numeral component with `direction: ltr; unicode-bidi: isolate`; SMS bodies Arabic with Latin digits and no emoji, carrying no bidi control character, with the code's digit run kept in order by the bidirectional algorithm (rule N1); the lone Latin token `SMS` is one inline `lang="en"` run, while no numeral, no code, and no supplied value carries a `lang` and no component sets a base language; IconPark SVG icons only; no positive letter-spacing. The language and numeral rules bind the platform's own text: a full name or shop name keeps the script and the digits it was typed with, is shown as typed, and is never transliterated or re-numeralised, and it renders as one isolated bidirectional run whose direction comes from its own first strong character, so a Latin word inside an Arabic name neither reorders the name nor is reordered by the page (FR-045), while the mobile number and the one-time code render in their canonical Latin-numeral form — the number in FR-038's one display form, `+218 91 234 5678`, in one isolated left-to-right run, with `+218912345678` kept as the stored form. Platform copy carries no diacritics (U+064B–U+0652, U+0670) and no Latin letter sequence beyond the digits, `+218`, and `SMS`; the trade name itself carries none in any context — the wordmark and the page titles read «وفر» and «منصة وفر» (ADR-147, which supersedes ADR-045's diacritics clause) — so the copy's rule and the name are one form. The no-emoji rule reaches every text a person reads, a supplied value included, so a value carrying an emoji is refused at input with an explicit message naming the reason — the predicate FR-026 fixes (`Extended_Pictographic`, U+FE0F, or U+20E3) — a rule on the value's characters, decided among the value rules before account existence is consulted, so the sign-up flow's uniformity gains no signal (FR-001, FR-026, FR-038, FR-045; AC-046; Clarifications 2026-10-31 and 2026-11-01). |
| VI. Catalog-Only Scope *(NON-NEGOTIABLE)* | PASS | No price, cart, order, payment, RFQ, or wallet surface; R1 touches no catalog data. The "cart" is not introduced. |
| VII. Specification-First and Documentation Separation *(NON-NEGOTIABLE)* | PASS | `spec.md` names no language, framework, library, database, or pattern; every technical choice lives in this plan, `research.md`, `data-model.md`, and `contracts/`. |
| VIII. User Story Independence *(NON-NEGOTIABLE)* | PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012` | US1, US2, and US3 have no implementation task in another story's phase — the bare layout, the step state machine and in-progress guard, the code-to-Arabic message mapping, the shared code step, and the password-change service land in A8 before any story begins — so none of them implements another story's rule. US2's route delegates the change to that service, and US6 supplies its administrator branch in its own file, so US6 edits no US2 file. US4's blocked-account sign-in test exercises US2's sign-in path and is the registered exception `EX-008`; its status rule and read land on the shared entry point and the `users` module. US5's frame is composition-verified here and runtime-verified by R2 (ADR-139, exception `EX-007`), and its two destinations with the Profile page's content are R7's under Complexity Tracking row 34; its composition assertions run without another story, while its bare-page end-to-end test opens the three bare pages this slice ships — sign-up (US1), sign-in (US2), and password recovery (US3) — and is the registered exception `EX-009`; its supplied-values test (T133) exercises the A8 shared code step, not US1's code. US6's integration tests exercise the sign-in, change, and recovery behaviour US2 and US3 deliver and are the registered exception `EX-010`, while its provisioning and forced-change assertions run on its own fixtures. US7's abuse and security controls live on surfaces US1, US2, and US3 deliver — the hidden `website` field in `apps/web/app/components/auth/SignUpForm.vue` (T081, US1's file), the honeypot and the minimum time-to-submit (T073), the fixed refusal order applied in `apps/api/src/modules/auth/routes/sign-up.ts` and `session.ts` (T080), the two-key rate limits and the resend bound (T074), the forgery, output-encoding, and security-header middleware (T076), and the no-CAPTCHA rule (T077) — and are the registered exception `EX-011`; US7 ships no form or route of its own, and the recovery route's application and budget exemption are the Polish T137. US2's security-events test (T060) asserts the closed list FR-037 fixes, whose verification, recovery, and provisioning records are produced by US1, US3, and US6 and whose negative assertions open US1's format refusal and US7's limiter; that crossing is the registered exception `EX-012`, while the events US2 owns are asserted without another story and every event is emitted in its own story. The six exceptions are recorded in `.specify/templates/exception-register.md` and in Complexity Tracking rows 4, 18, 20, 21, 22, and 24. Integration tests over delivered surfaces are permitted by the principle's last clause only where an exception names the assertion, and each of the six rows does. |
| IX. UI Foundation Fidelity *(NON-NEGOTIABLE)* | PASS | Nuxt UI v4 is the only component library; the Wafar UI layer is `packages/ui` (ADR-097) and holds design tokens, theme, IconPark, IBM Plex Sans Arabic/Mono, the content skeleton and in-place loading bar with their loading-state rule, the bidirectional file-name surface, and the shell primitives; no raw colours, spacing, radius, shadow, duration, or z-index values outside the layer (Stylelint/ESLint); no emoji; every state the three pages render is present, while the layer's data-page primitives have no R1 page and are recorded in Complexity Tracking row 23; `apps/web/app/` and `apps/admin/app/` paths are in the Ownership Map; the contract test and the visual baseline are the conformance gate (ADR-128, ADR-129, ADR-137). |
| X. Modular Monolith Architecture | PASS with a justified deviation (Complexity Tracking row 26) | Two modules, `auth` and `users`, each with one responsibility: `auth` ships `routes/` and `service/` and persists the credential record and the session store through better-auth's adapter (`apps/api/src/modules/auth/better-auth.ts`), so no hand-written `auth/repository` becomes a second writer of the library's tables; `users` ships `service/` and `repository/` and exposes no HTTP route in R1, because every public route this slice mounts is an authentication route the `auth` module owns and the `users` module is reached through its service port and the shared entry point, its routes arriving with the merchant profile surface (R7). The shape is a deliberate deviation from this principle's "Each module has its own routes, service, and repository": `auth` ships no `repository/` and `users` ships no `routes/` in R1, and the justification — a hand-written `auth/repository` would be a second writer of the library's tables, and an empty `users/routes/` is a route surface no requirement names — is recorded in Complexity Tracking row 26, which names this principle, and in record 1. That is the layout `tasks.md` builds; `docs/architecture.md` §1.1 and §2 keep the canonical `{routes,service,repository}` layout and are not edited. `auth` owns `Session` and the credential record, `users` owns `User` and the transient verification store; cross-module calls go through service ports declared in `packages/shared` and wired at the composition root; no module imports another's repository. The account + credential + session transaction lives in `apps/api/src/modules/auth/service/account-creation.ts`, which opens the unit of work and calls the `users` service port; the sign-in lock is account state, so its conditional update, success reset, expiry clear, and the current-password check's lock refusal are implemented in `apps/api/src/modules/users/repository/user-lock.ts`, the only writer of `users.failed_sign_in_count` and `users.locked_until` after account creation, which implements the lock port declared in `packages/shared` that the `auth` sign-in and password-change services call; `apps/api/src/http/context.ts` reads and writes sessions only through the `auth` service, never through its repository or the `sessions` table (`data-model.md` §1). No file exceeds 500 non-empty lines (advisory; none is expected to). |

### Gate 2 — Binding Sections

| Binding section | Status | Evidence / notes |
|---|---|---|
| Query Safety and Secrets | PASS | Drizzle parameterized statements only; no dynamic SQL; no sort/filter surface in R1 (the city search is an in-memory normalized match); every query has a 2 s `statement_timeout` and the 100 ms p95 budget; secrets come from environment injection (`.env.example` only), never source; `gitleaks`/Semgrep in CI; logs carry no phone number, session token, or password. |
| Schema and Migration Control | PASS | One migration tool (Drizzle Kit); the first migration creates `users`, `accounts`, `sessions`, `verifications` (the library's own `verification` model, created because the adapter's model set requires the table and omitting it would leave the library's schema incomplete and invite a second verification store later; no R1 code path writes it and the integration suite asserts it empty — `data-model.md` §8), `phone_verifications`, and `rate_limit_counters`, is reversible, and is applied by the migrator only; **the application refuses to start when its expected schema version is absent**: the build embeds the version (the SHA-256 of `packages/db/migrations/meta/_journal.json` and the applied-step count) in `packages/db/schema-version.ts`, and `apps/api/src/index.ts` compares it with the applied-migration rows in PostgreSQL (`drizzle.__drizzle_migrations`) before the listener opens, exiting non-zero on absence or mismatch, with the refusal and the ready path both asserted by integration tests; every FK has an index; every table carries `created_at` (and `updated_at` where rows are user-visible); uniqueness, enums, and ranges are schema constraints; merchant scoping is applied at the single shared entry point and asserted by the isolation test (FR-053, AC-056). The schema modules, the first migration, and the expected version are B1's (T030–T032, T126): A3 delivers the Drizzle client, the unit of work, and the migrator command and generates no migration, so the journal and the version it fixes are produced by one increment and no migration is part of the A→B checkpoint; the guard carries no `FR-###`/`AC-###` pair, so Complexity Tracking row 29 records it. The down migrations are the exact inverse - `0002`'s removes the column and its check, `0001`'s drops the six tables in the reverse order, and the applied-step count returns to zero once both have run - and they are exercised in CI and staging before production; the rollback's state consequence is FR-055's, its destructive down target for R1 is stated in Technical Context, and T032 and T245 carry the pair and its exercise. |
| Identity, Authentication, and Session Policy | PASS | better-auth 1.7.18 with the phone-number extension; the library remains the credential and session engine — password hashing, credential verification, session issuance, and revocation — while R1's routes and services only orchestrate it and enforce the product rules it does not carry (uniform refusal, lock, rate limits, the transient code store); that boundary is the reading research.md R-01 records, and it is what keeps the constitution's prohibition of custom authentication code satisfied; `scim`/`sso` disabled (CVE-2026-67330, CVE-2026-80192); scrypt profile in CMV row 2; TLS 1.3 at the browser edge (R12 executes; the configuration contract is R1's); the three per-operation rate limits and the lock; **no environment disables, raises, or skips a limit — the load measurement included, and its probe proves the limiter was live** (`### The SC-009 load profile`); CSRF on every mutation (FR-044); output encoding with a test that fails when it is removed (FR-045); server-side revocable sessions including "sign out everywhere" (FR-010 … FR-013); CSP whose script sources carry no wildcard, no `'unsafe-inline'`, and no eval-permitting source, HSTS, `X-Content-Type-Options`, `frame-ancestors` (FR-046). No CAPTCHA; honeypot, minimum time-to-submit (3 s), and the shared account-creation budget; the honeypot's silent refusal ends the flow on the form through the resume read, never through the 202 alone, and its duration tracks the success 202's channel acceptance wait within a one-sided median ≤ 50 ms and p95 ≤ 150 ms rather than being padded to a constant, measured with the fake's acceptance set to the timing suite's declared 200 ms so a deleted wait fails it (FR-029, FR-051; record 15). |
| Authorization and Access Control | PASS | The role matrix is respected; no administrator operation and no audit-log write in R1 (provisioning is out of band, FR-028), and record 12 carries that bounded reading of the constitution's audit rule into the decision register rather than leaving it asserted only in a clarification: the operator-run provisioning action is not an administrator operation, and FR-037's structured security event records it instead; the shared entry point (`apps/api/src/http/context.ts`) resolves the session, the account status, the role, and the restriction in one place through the `auth` service; the deferred authorization model is recorded in Gate 3 (R13 ratifies it on this entry point). |
| Performance Budgets and Verification | PASS | CMV rows 6–7; N+1 inspected (none); no cache except the immutable reference modules and the rate-limit TTL; a >10% regression against the branching version blocks release; the load script records the measurement; **SC-009's verdict reports attempted, accepted, and refused counts per operation and fails on any refusal**, so a refusal-dominated run cannot pass, and a post-run probe proves the limiter was live (`### The SC-009 load profile`); **the run declares the channel's acceptance wait (50 ms) inside every dispatch, fails a dispatch faster than it, and reads the work alone against the 250 ms margin that leaves the provider's 750 ms ceiling inside SC-009's 1,000 ms**; the SC-004 enumeration tolerance is median ≤ 50 ms and p95 ≤ 150 ms over 200 samples per case; the Lighthouse budget (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) is asserted by the `lighthouse` CI job on the three bare pages, and Parts and Home join it when R2 and R4 ship them. |
| Dependency Governance | PASS | Versions pinned; the lockfile is committed and regenerated only by the update process; every new dependency and every register-gap choice carries its licence and obligation (Twilio SDK MIT + service terms; `@cyclonedx/cyclonedx-npm` Apache-2.0; GitHub Actions service terms with first-party actions MIT; Lighthouse CI `@lhci/cli` Apache-2.0; PostgreSQL built-in backup under the PostgreSQL Licence; `@axe-core/playwright` MPL-2.0 (ADR-145; a dev-only CI gate that is never shipped); SecLists MIT; IconPark Apache-2.0; IBM Plex OFL-1.1); PgDog is the one network service under a copyleft licence, and the prohibition does not reach it because it is never shipped to or linked into a merchant's device, while its AGPL-3.0 obligation is Complexity Tracking row 7; `osv-scanner` (with the six medium/low exceptions recorded in Complexity Tracking row 39, each with an expiry date) and `npm audit` block release; the budget in CMV row 5 is respected; Dependabot is enabled by R1. |
| Module Discipline and Development Workflow | PASS | One owning module per rule — the sign-in lock's persistence belongs to `users` (`user-lock.ts`) and the session's to `auth`; the CMV heading is present with all 19 rows; migrations carry a rollback; CI runs offline by default (the workflow T024 builds; Complexity Tracking row 33); the consistency gate (`/speckit.analyze`) is clean before implementation. |
| Project Structure and Debt Control | PASS | Ownership Map below; import boundaries enforced by ESLint (`no-restricted-imports` + workspace rules); shared code is promoted only after a second consumer; no abstraction before a second use; every TODO/skip carries an issue and a date. The module layout is the one `tasks.md` builds — `auth` with `routes/` and `service/` and the library's adapter as its persistence, `users` with `service/` and `repository/` and no HTTP route in R1 — and the deviation from Principle X's "Each module has its own routes, service, and repository" and from `docs/architecture.md` §1.1 and §2 is Complexity Tracking row 26 and record 1. |
| Documentation | PASS | A decision record is appended for every non-trivial choice (the sixteen records are listed in "Decision records this plan introduces", five of them already recorded as ADR-141 to ADR-145 and the remaining eleven appended at implementation; record 15 is the silent hidden-field refusal's mechanism and T142 appends it, record 16 is the copy's authority and measurable bindings and T143 appends it, and record 1 carries the module-layout deviation Complexity Tracking row 26 records); `docs/domain-model.md`, `README.md`, and the design evidence are updated in the same change, and the README's clean-checkout verification the Documentation rule requires before a release is deferred to the release gate (Complexity Tracking row 28), while `docs/architecture.md` records the canonical layout — `{routes,service,repository}` for each module — and is not edited: R1's layout deviates from Principle X's "Each module has its own routes, service, and repository" and from that document in two registered directories, `auth` shipping `routes/` and `service/` with better-auth's adapter as its persistence and no `repository/`, and `users` shipping `service/` and `repository/` and no `routes/`, and that deviation is Complexity Tracking row 26, which names the principle and record 1 carries; every ADR named here is reaffirmed in "Reaffirmed decision records" below. **Public-interface documentation gate**: the OpenAPI 3.1 document is generated from the same source as the implementation — the Zod schemas in `packages/shared/src/contracts/**` and the Hono route table — by `apps/api/src/http/openapi.ts` using Zod v4's built-in `z.toJSONSchema()` (no new dependency), and emitted to `apps/api/openapi.json`; the generated document is the published interface, so the prose contract is never the only record. R1's public surface is covered by this generation (ADR-002), and the **first standalone documentation-drift test** — the three-record comparison against `contracts/auth-api.md` §5 — is **R2's** (ADR-031 item 4), not R1's; R2 owns it and its CI entry blocks every later change from then on. R1's half of the gate — the generator (T125) and the verification of the committed document (T128) — is Complexity Tracking row 30, because no requirement names it. The query-count assertion is separate (ADR-139). **Module responsibility headers**: every production module carries a header naming its single responsibility and never repeats the owning feature (the Ownership Map records that once), asserted by `scripts/check/module-headers.mjs` in the CI gate (T127; Complexity Tracking row 31). **Exception register**: `EX-008` (US4's blocked-account sign-in test), `EX-009` (US5's bare-page end-to-end test), `EX-010` (US6's tests over US2's and US3's behaviour), `EX-011` (US7's controls on US1's and US2's surfaces; the recovery route's application is the Polish T137), and `EX-012` (US2's security-events test over the closed list's verification, recovery, and provisioning records and the two refusals that emit none) are appended to `.specify/templates/exception-register.md` with their principle, exact scope, rationale, approver, and review date, and the drift check's exception-row count moves from seven to twelve across the 2026-10-31 analyze and plan repairs. |
| Deployment and Observability | PASS | Health check per used dependency: `GET /health` runs `SELECT 1` against PostgreSQL on every probe and answers 503 while the database is unreachable; Twilio is an outbound channel whose refusal the flow already handles, not a readiness dependency, so it is not probed. **API versioning and deprecation**: every public HTTP route is mounted under `/api/v1` (`contracts/auth-api.md` §1; A4), while `/health` stays unversioned as the operational probe and not a product interface; a deprecation announces removal at least one release ahead and is recorded as an ADR — record 13 fixes the rule, and R1 ships version 1 with no deprecated route, so no removal is announced here. Structured JSON logs with a correlation identifier; no PII or secrets in logs; RTO 4 h / RPO 15 min in CMV; backup and restore scripts with a quarterly drill into a clean environment, and every archive encrypted before it leaves the host (AES-256-GCM, key-encryption key injected from the environment, never stored beside the backup); the three environments with staging parity, the error tracker, secret manager, TLS certificate management, log pipeline, and the monitoring and alerting set — the metrics and alerts `ROADMAP.md` assigns to R12 — are R12's, and this feature fixes only the configuration contract and the runtime surfaces they consume (Complexity Tracking row 25). **Operational state**: the structured record's six-field floor, its per-event fields, its emission before the response, and its failure mode are fixed in Technical Context; the three operational tables are swept hourly by a time bound, so no row grows without an end; the city list, the prefix set, and the breach list have stated build-time and boot-time failure modes and a recorded currency; Twilio's outage scope, the post-disaster restore's state, and the schema rollback's state loss are stated there too, with R12 owning the procedure and the measurement (CHK008, CHK009, CHK011, CHK012, CHK018). |
| Technology Standards | PASS | Stack unchanged from the register in `.specify/memory/constitution.md`, whose current version is read from `.specify/memory/version.json` — Governance forbids a document's own literal version; the OpenAPI document is produced by Zod v4's built-in JSON Schema export and Hono's route table — OpenAPI and Zod are both register rows, so the documentation gate adds no technology and no dependency; paths match `docs/architecture.md` and the internal layout; `packages/ui` is the ADR-097 exception, not a new package row; the seven register gaps R1 owns are closed — five by the rows ADR-146 adds (Twilio Programmable Messaging, ADR-141, CMV row 13; GitHub Actions, ADR-143, CMV row 14; `@cyclonedx/cyclonedx-npm`, ADR-144; `pg_basebackup` + WAL archiving, ADR-142; `@axe-core/playwright`, ADR-145) and two by the removal of the icon and typeface rows in favour of the Wafar UI layer's assets (ADR-098, ADR-137, ADR-138); each of the five carries a licence obligation, a vulnerability scan, and a review date; the provisioning boundary adds no technology and no dependency, and record 12 records it. PgDog's pre-1.0 row is discharged by Complexity Tracking row 7, which records its named fallback, its AGPL-3.0 obligation, and the operational coupling the hop creates. The amendment and its `Project-Technologies.txt` mirror are recorded in the same change, so no gap is left open at R1's acceptance and no other technology is introduced. |
| Glossary | PASS | Every term is the Glossary's: `User`, `Session`, merchant, administrator, mobile number, one-time code (the spec's term), Wafar UI layer, design token (the Glossary's `Token`), Ownership Map, CMV. The session's credential is the **session token** throughout; a bare "token" is never used for it, so the Glossary's `Token` (a UI value) stays unambiguous. No entity, field, or page name is invented; a merchant's account is the Glossary's `User`, while the `accounts` table is the library's credential store (`data-model.md` §6) and represents no entity, so the word names no second one. The shared page composition is the Glossary's **Shell**, and **Frame** is its accepted synonym, confined to the text that already carries it — the specification's and this plan's among it — so those occurrences stay as written while new text uses **Shell** (ADR-148). |
| Product Scope | PASS | Three pages only — Log In, Sign Up, Forgot Password — all bare; the frame's composition adds no page; no product feature (the sixteen) is implemented; no page outside the twenty-eight. |
| File Processing Overview | PASS | Not touched — no upload, storage, extraction, or processing surface. |
| Product Register | PASS | Roles: guest, merchant, administrator (role on `User`); 28 pages; 16 features untouched; `User` and `Session` are the two entities R1 implements, with `User`'s three sign-in fields already registered by ADR-105 and its quota overrides present but unused; no entity is added (the pending request, rate-limit counters, and library credential tables are non-entity state, recorded in `data-model.md`); no unresolved product fact is decided (Gate 3). |
| Single-Reference Sufficiency | PASS | Every value a rule names is under CMV, or is recorded in Technical Context as a binding plan value where the constitution's closed list does not enumerate it; no rule is discharged from an unregistered source; no register is copied; no design token, column, or UI value is copied out of its source — the plan references ADR-128 and the layer for values. The one design value FR-022 delegates to this plan, the collapsed rail's width, is recorded in Technical Context from ADR-128 decision 5, which the layer declares as its rail-width token and the collapsed state consumes; the plan records the slice's binding value rather than a second authority, so the value has one destination and no copy. The second is the emoji predicate's Unicode data pin — Unicode 18.0.0, the vendored `emoji-data.txt` with its SHA-256, and the generated range table (Technical Context) — which is a plan value for the same reason: a CMV row is added by a constitution amendment, not by a plan, and the pin is one record with one consumer. The copy's authority is named in the same section as one registered artifact — this plan's `contracts/ui-contracts.md` — and the R1 capture set is evidence of composition and appearance rather than a second source, so the literal text is never discharged from an unnamed source and has one destination. |
| Artifact Workflow and Traceability | PASS | Stable `FR-###`/`AC-###`/`SC-###`; zero `NEEDS CLARIFICATION`; the Test Coverage Request is answered; every ADR named here is reaffirmed; zero unresolved clarifications remain before tasks. |
| Product Fact Clarifications | PASS | Contact-form fields untouched; the platform stays free; no 99-part cart (no cart); no CAPTCHA; no PWA; the shell's per-page controls are built to ADR-099/ADR-102/ADR-127, its footer band renders only at 1024 CSS px and up with its four static-page links in the drawer below that width, and "public pages" means Home, Parts, and Catalog (Clarifications 2026-10-30); a guest activating one of the six merchant-area destinations — Upload Catalog, My Files, Cart, Notifications, Messages, or Profile — is taken to sign-in while the three public destinations open their pages (FR-048, AC-052, Clarifications 2026-10-30); the bottom bar stays rendered and visible while the drawer is open with «المزيد» showing its open state, a navigation from the drawer closes it and settles the focus on the destination page's heading while the three dismissals return it to «المزيد», and at 320 CSS px the header keeps all four controls in one row (FR-022, FR-023, FR-052, AC-024, AC-025, AC-042; Clarifications 2026-10-31); Libya-only registration; no email as a channel; no emoji. |

### Gate 2 — Threat and Control Map (FR-006–FR-009, FR-029–FR-037, FR-044–FR-053)

The rows above judge each binding section on its own terms; this table answers the
other half of the same question: every security control the named requirements
impose sits beside the threat it answers, and no threat the slice answers is left
without its control. It is read in both directions — a row whose threat is empty
would be a control carried for no stated reason, and a named requirement with no
row would be a threat left without a control. The coverage list after the table
closes the second direction requirement by requirement, and the note after it
names the two entries that are deliberately not controls. The table adds no rule:
each control cell restates the requirement it cites, and each verification cell
names the task, suite, or gate that asserts it, so nothing here is a second
authority (Principle VII; Gate 2 → Single-Reference Sufficiency). Where a control
is stated by a requirement outside the named ranges — the session actions
(FR-010–FR-013), the administrator boundary (FR-027, FR-028), and the format
refusal (FR-042) — the row names that requirement as the rule's owner beside the
named requirement that depends on it. CHK001 is closed against this table (review
of 2026-11-02, `checklists/security.md`).

**A cell names the task that asserts its control.** A Verification cell cites
only a task whose description asserts the control; documentation tasks (ADR
append, README, runbook) never appear in this column.

| # | Threat (what the abuse achieves) | Control (what this slice does) | Requirements | Verification (what fails when the control is removed) | Residual exposure |
|---|---|---|---|---|---|
| T01 | An attacker learns whether a submitted number already has an account by watching the sign-up flow | Sign-up continues through the code step identically, dispatches a one-time code either way, and does the same work whether or not an account exists; the outcome is stated only after the correct code proves ownership, no second account is created, and the submitted password is never applied | FR-006; FR-051 step (5) | T037 (no row after the form, one account at verification, the alternate-spelling case, the sign-up half of SC-004); T039; SC-004's sign-up case | Past the correct code the message differs by status and role — FR-006's bounded rule, stated to the owner of the number |
| T02 | An attacker learns whether a number has an account from a sign-in attempt, a locked, blocked, or administrator account included | One uniform refusal for an unknown number, a wrong password, a locked account, a blocked account, and an administrator account on the merchant surface: same text, status, response path, and work, the unknown-number case performing the same verification-shaped computation; a successful sign-in is outside the rule | FR-008; FR-009; FR-037 (the failed attempt is recorded) | T058 (200 samples per case after a 20-request warm-up, 5% trimmed, median ≤ 50 ms and p95 ≤ 150 ms); T061 (format refusal outside the comparison); T109 | The tolerance bounds the difference rather than equalising it; the refusal's Arabic text is a design value in `contracts/ui-contracts.md` §6 |
| T03 | Timing exposes the silent hidden-field refusal, or a no-account case that does measurably less work | The refusal performs the success path's pre-dispatch work on a discarded copy and then waits the channel's own current acceptance duration — one in-memory scalar, the rolling median of recent accepted dispatches, never keyed by number or client, capped at the provider's 750 ms — rather than a padded constant; the shortfall is one-sided median ≤ 50 ms and p95 ≤ 150 ms over the enumeration test's sampling | FR-029; FR-006 and FR-008's timing rule (not extended to the refusal) | T073 (`sign-up-abuse.spec.ts`, the one-sided pair against a successful 202) | The gap between the estimate and the individual channel wait remains observable; the wait is capped and resets with the process |
| T04 | Online password guessing against a known number | Five consecutive failed password verifications lock the account for fifteen minutes; only a real failed verification against an existing, active account increments (on FR-009's three paths), a success on any of them or the lock's expiry clears the count, and a refusal made while the lock runs neither counts nor extends it; the number-keyed sign-in budget (20 per 15 minutes) and the origin's (60) bound the attempt rate, and the lock's refusal is the uniform refusal FR-008 defines | FR-009; FR-033 | T056; T064; T074; T058 | The lock's own consequence is T05 |
| T05 | A caller who knows a merchant's number locks the account deliberately and repeats it | Accepted and bounded per lock episode rather than against repetition: the lock is a time bound alone, a refusal while it runs neither re-arms nor extends it, and a later window's five failures re-lock only after it lifts; the number-keyed budget prices the repetition, and no second lock rule is introduced | FR-009 | T056 (duration, clear, and no-extension cases); T074 (the number budget) | **Accepted risk** — Complexity Tracking row 27 (repository owner, review 2026-12-01) |
| T06 | Guessing a one-time code, or multiplying the per-request bound by starting fresh requests | A 6-digit code from `crypto.randomInt` held only as a hash salted with the request id; five incorrect entries per pending request counted over the whole verification and only for a wrong value of the live code (an expired or superseded code does not count); one live request per number; an aggregate ceiling of 30 incorrect entries per number per 15-minute window (5 × 6), produced by those limits rather than by a third counter and reached only by a fresh request the number's budget then refuses | FR-034; FR-033 | T036 (the incorrect-entry bound and the replacement rule); T137 (the ceiling and the code entry's exemption); `quickstart.md` Scenario 11 (the protected form) | 30 guesses per number per window against 10^6 codes; the ceiling resets at the window boundary with the budgets that produce it |
| T07 | Turning the forms into a way to flood a third party's number with SMS | The hidden-field refusal starts no pending request and dispatches nothing; the re-request limit is three per pending request; the number-keyed ceilings cap accepted dispatches at 24 per number per 15-minute window (4 × 6); a dispatch the channel refuses sends nothing and counts nothing; the security notices sit outside the ceiling because they follow an authenticated action on the account | FR-029; FR-033; FR-034 | T074; T137; T036; T073 (no dispatch on the silent refusal) | An accepted dispatch is counted even if it is never delivered; the notices' volume is bounded by the actions that produce them, not by this ceiling |
| T08 | Bulk automated submission — scripted account creation, list probing, and code-step hammering | A hidden field a person leaves empty, a minimum time-to-submit of 3 s measured on the server's clock from a signed 30-minute form stamp, and a per-origin account-creation budget of 20 per 15 minutes; both form-level refusals consume the budget, the honeypot's refusal is silent and leaves no row, dispatch, or security event, and the minimum-time refusal is explicit and retryable | FR-029; FR-033; FR-051 | T073; T079; T081; T074; T075 | A client that renders the form and waits 3 s passes the form rules; the origin budget is the remaining control, and no CAPTCHA is used (the note below) |
| T09 | Forging the key that resets a budget, or reading a spent budget as an existence oracle | The origin is the network origin read from the trusted peer — an untrusted `X-Real-IP` is ignored in favour of the socket address — and the number key is global to the number and recorded whether or not an account exists; a value that does not normalize carries only the origin key and spends no number's budget | FR-029; FR-033 | T074 (both keys, the malformed value, the ignored header); T117 (the post-run limiter probe) | Clients behind one address share an origin budget — the origin key's intended effect, and the reason the number key is global |
| T10 | Choosing which refusal a submission receives, so the refusal itself reveals what the other checks would have found | One fixed order on every page — the operation's limit, the hidden field, the minimum time-to-submit, the page's value rules, then the account-existence comparison — with a refusal decided by its step alone, no later check run, no earlier refusal replaced, and no existence comparison until every value rule passes; four refusals precede step (1) and stand outside the order — the forgery and origin check, the body-size bound, the method, and an unknown route — so no page rule runs on a request any of them refuses (Clarifications 2026-11-05) | FR-051; FR-033; FR-042 | T075 (two stacked refusals, the earlier one asserted at every step); T080; T137 | The order is observable by design and asserted (AC-055); a later page must adopt it rather than invent one |
| T11 | Session theft or replay, and a browser request that keeps alive a session the merchant has left | A 32-byte opaque token in an `HttpOnly`, `Secure` (production), `SameSite=Lax` cookie, stored server-side and revocable; a 30-minute inactivity clock that only a merchant-initiated action resets and a 12-hour absolute lifetime; tombstones for every revocation; every ending path leads to the one ended-session state and the frame stops requesting for the ended session | FR-032; FR-049 (the actions are FR-010–FR-013) | T057; T059; T065; T072; T097 | The cookie is a bearer credential: script execution would defeat its attributes, which is the ground T14 answers |
| T12 | Unbounded session rows per account through repeated sign-in | No cap on concurrent sessions is a product rule, so issuance is bounded by the number-keyed sign-in budget (20 per 15 minutes) and retention by the two clocks (a 12-hour absolute lifetime); the load profile asserts the live population it seeds and the population after its sign-ins | FR-007; FR-032; FR-033 | T074; T057; T059; T117 | The ceilings are the bound rather than a new session cap, so an account may hold every session its budget and the 12-hour window allow |
| T13 | Cross-site request forgery — a page the person visits makes a state-changing request with their session | A CSRF token on every state-changing request — 10 POST routes in R1: the ten requests AC-048 enumerates — nine actions, the code entry served once per flow — `sign-up`, `sign-up/verify`, `verifications/resend`, `sign-in`, `sign-out`, `sign-out-all`, `password/forgot`, `password/forgot/verify`, `password/reset`, and `password/change` (the change-password request included, though no page offers it) — issued and rotated by `GET /api/v1/auth/csrf`, with `SameSite=Lax` and the allowlisted web `Origin`; a mutation without the token is refused | FR-044 | T019 (the middleware and the rotation); T076 (the middleware against a mutation, the change-password request included); T039, T082 (the flows) | R7's page is covered when it exposes its request, as FR-044 provides; no second middleware is added |
| T14 | Stored script in a supplied value executing in another person's browser | Every supplied value is encoded for its output context before rendering, asserted by a test that fails when the encoding is removed; the CSP's script sources carry no wildcard, no `'unsafe-inline'`, and no eval-permitting source, with the nonce injected per response; the pages load no third-party subresource | FR-045; FR-046 | T076 (the encoding removed, the three script-source allowances); T021 (the nonce) | Values are encoded rather than sanitised, and the no-emoji and length rules bound the alphabet without restricting it |
| T15 | Clickjacking, protocol downgrade, and content-type sniffing | `frame-ancestors` restricts which frames may embed the page, the transport-security declaration binds future requests to the protected transport, and `X-Content-Type-Options: nosniff` stops type guessing; the test reads the header the response carries and fails when one is missing | FR-046 | T076 | TLS 1.3 termination and certificate management are R12's; R1 fixes the configuration contract they consume (Complexity Tracking row 25) |
| T16 | Reading or writing another merchant's row by naming its identifier | Every merchant-scoped read and write passes the single shared entry point, which applies the account's scope; a row belonging to another account receives the ordinary not-found answer — the same status, body, and headers as a row that does not exist — so the scope is not an existence oracle, and the test fails when the scope is removed | FR-053 | T118 (`isolation.spec.ts`, both directions); T020 (the entry point) | Later slices must pass through the same entry point; Gate 3's authorization model (R13) ratifies on it |
| T17 | Becoming an administrator, or reaching administrator authority, through the merchant surface | No one becomes an administrator through the public or merchant surface; the role is set only by the operator-run provisioning action, which takes the credential from a hidden prompt or standard input and records the event without credential material; merchant sign-in refuses an administrator account with the uniform refusal, the administrator outcome is stated only after the code, and no administrator route is exposed before R13; the administrator's first sign-in is delivered as behaviour with no page — `signInAdministrator` returns a session restricted to the forced change, refusing every ordinary action with `PASSWORD_CHANGE_REQUIRED` while the change and the session's end stay available — R13's administrator surface is its only consumer, and this slice ships no administrator surface at all; the administrator shell's account menu offers sign-out alone and keeps it available while the forced change is pending | FR-027; FR-028 (the rule owners); FR-008; FR-037; FR-050 | T107; T109; T108; T060; T111; T110 | The administrator's own sign-in page and the audit log are R13's (Gate 3; record 12) |
| T18 | Credential or personal-data disclosure through records, logs, URLs, browser history, or client storage | A structured record per security-relevant event carries an internal account identifier only where an account exists, and never the number, a secret, or a session token; the number travels in request and response bodies alone — no path segment, query parameter, history entry, referrer, or client storage — and no third-party subresource means no referrer leaves the origin; passwords and codes are held only in their protected forms and never re-displayed | FR-037; FR-035 | T060; T039, T062, T084 (the three journeys); T035; `quickstart.md` Scenario 11 | The log pipeline, retention, and alerting are R12's; R1 emits the record and introduces no audit store |
| T19 | Weak passwords, and a hashing path expensive enough to be a denial-of-service lever | The policy requires 12–128 characters and refuses a common or breached value by a local membership test against the vendored top-100,000 digests, with no external service; storage is scrypt (N = 32768, r = 8, p = 3, 16-byte salt, 64-byte key) compared with `timingSafeEqual`, and the maximum length bounds the hashing cost | FR-035 | T035 (the policy and the scrypt profile); T135 (the same profile on every password-setting path); T088 (the new-password step's policy statement and its three reasons); T111 (the policy on the provisioning path) | The list is a vendored snapshot refreshed quarterly through the dependency process (record 3) |
| T20 | Two accounts for one number through a spelling variant or a race | The number is the unique identifier in one normalized form — separators ignored, a national leading zero read as part of the number, a country code read once, Arabic-Indic digits accepted — and uniqueness is enforced at creation by the database constraint rather than by a pre-check, so two simultaneous attempts still produce at most one account and the other receives the uniform outcome | FR-031; FR-006 | T030 (the unique `phone_number` constraint); T033 (the spellings and the refusal); T037 (the alternate-spelling case); T038 (two simultaneous sign-ups) | None stated: the unique constraint is the authority, and a duplicate cannot be created |
| T21 | An activation passing through an overlay to a control beneath it, a control that cannot succeed staying offered, or a hidden surface keeping focusable controls | The account menu is the topmost surface and an outside activation closes it without activating what it lands on; the drawer's panel ends at the bar's top edge and its scrim covers the bar, so a slot activation closes the surface and does not perform the slot's action; the ended-session state's blocked variant withholds the way to sign in and the frame stops requesting; sign-out keeps its confirmation; a hidden bar and every slot it carries leave the focus order and the accessibility tree together | FR-047; FR-048; FR-049; FR-050; FR-052 | T095; T096; T097; T132; T090 (the block's request boundary) | The page behaviour and the accessibility scan are R2's under `EX-007`; R1 verifies the composition and the component-level behaviour structurally |
| T22 | A public page that varies by session state, or a redirect target an attacker can steer | The three bare pages render identically for a guest and a signed-in person: no redirect is introduced, no signed-in-only surface is shown, the sign-out control stays in the frame's account menu, and the guest rule stores no return target and adds no route | FR-041; FR-048 | T099 (a signed-in person sees the same page as a guest); T062; T106 | Whether a merchant returns to the item they wanted after signing in belongs to the slice that ships the merchant area (R7) |

**Coverage of the named requirements.** Each row below is that requirement's
entry in the map, so a requirement named in this section has at least one threat
beside it and every row above serves at least one requirement.

| Requirement | Rows |
|---|---|
| FR-006 | T01, T03, T20 |
| FR-007 | T12 |
| FR-008 | T02, T03, T17 |
| FR-009 | T02, T04, T05 |
| FR-029 | T03, T07, T08, T09 |
| FR-030 | None — see the note below |
| FR-031 | T20 |
| FR-032 | T11, T12 |
| FR-033 | T04, T06, T07, T08, T09, T10, T12 |
| FR-034 | T06, T07 |
| FR-035 | T18, T19 |
| FR-036 | None — see the note below |
| FR-037 | T02, T17, T18 |
| FR-044 | T13 |
| FR-045 | T14 |
| FR-046 | T14, T15 |
| FR-047 | T21 |
| FR-048 | T21, T22 |
| FR-049 | T11, T21 |
| FR-050 | T17, T21 |
| FR-051 | T01, T08, T10 |
| FR-052 | T21 |
| FR-053 | T16 |

**Two named requirements carry no row, and neither is a control.** FR-030 forbids
a control rather than adding one: the abuse a CAPTCHA would answer is T08's, and
this slice answers it with the hidden field, the minimum time-to-submit, and the
origin budget, so the prohibition is why no row exists and the absence is asserted
by T077 rather than left to a claim. FR-036's cross-links are navigation between
the three bare pages; the harm it prevents is a visitor stranded on one page
rather than an attacker gaining anything, the rule exists because the frame that
would otherwise carry the links is absent here, and T099 asserts the links. Both
are named here so the two-direction reading does not read them as threats left
without a control.

### Gate 3 — Deferred Areas Touched

| Deferred area | What this feature decides | Rules still missing | Ratification plan (owner, deadline ≤ feature acceptance) |
|---|---|---|---|
| Authorization model | The single shared entry point (`apps/api/src/http/context.ts`) is created and resolves the session, account status, role, and forced-change restriction through the `auth` service; `Session` is its first caller. The permission matrix itself is **not** decided here. | The role/permission matrix that R13 ratifies on the same entry point; the way an administrator operation declares its permission. | Repository owner; R13 (ADR-139 decision 5), no later than R13's acceptance. |
| Retrieval interface | Not touched — no search surface. | Ranking and retrieval rules remain open (R5). | Not applicable to R1. |
| Extraction algorithm | Not touched. | — | Not applicable to R1. |
| File ingestion internals | Not touched. | — | Not applicable to R1. |
| Catalog data shape | Closed by ADR-040; not touched. | — | Not applicable to R1. |

| Unresolved product fact (from `docs/domain-model.md`) | Touched by this feature? | How it is resolved here | ADR + domain-model.md amendment recorded? |
|---|---|---|---|
| #1 the message sender's representation | No | Not touched — R10 owns it. | Not applicable |
| #2 `Conversation`'s administrator reference | No | Not touched — R10 owns it. | Not applicable |
| #3 whether `expires_at` is the retention deadline or the printed expiry date | No | Not touched — R15 owns it; R1 asserts no retention period. | Not applicable |
| #4 notification retention | No | Not touched — R9 owns it. | Not applicable |
| #9 a catalog's stored byte count and content type | No | Not touched — R2 owns it. | Not applicable |
| #10 whether a part stores its page and row | No | Not touched — R3 owns it. | Not applicable |
| #11 a contact message's state | No | Not touched — R11 owns it. | Not applicable |
| #12 a multi-separator printed price | No | Not touched — R3 owns it. | Not applicable |

### Reaffirmed decision records

Every ADR this plan names is reaffirmed here, with the provision it supplies:

- **ADR-001** (monorepo + modular monolith), **ADR-002** (Hono), **ADR-004** (better-auth without `scim`/`sso`) — the repository and API shape.
- **ADR-007** (project-level knowledge lives outside the feature sequence) — why the foundation duties stay inside R1 instead of becoming a numbered feature (Complexity Tracking row 1), and **ADR-040** (a part's canonical columns) — the catalog data shape Gate 3 records as closed and untouched.
- **ADR-071** (the committed governance drift check and its tooling pins) — the CI job that runs it on every merge.
- **ADR-015** (a slice identifier equals its specification number) and **ADR-021** (Node 22 LTS) — branch and runtime pins.
- **ADR-016**, **ADR-017**, **ADR-096**, **ADR-099**, **ADR-100**, **ADR-101**, **ADR-102**, **ADR-126**, **ADR-127**, **ADR-132** — the shell's scope, composition, nine destinations, five bottom-bar slots, footer band, drawer opener/closer, account menu, and scroll-hide rule.
- **ADR-030** (phone-only authentication; the extension is mandatory unless an ADR records an alternative) and **ADR-041** (Libya only, no dial-code selector) — the identifier and the three pages.
- **ADR-033** (the dependency budget is R1's to set) and **ADR-051**, **ADR-067**, **ADR-070** — tenancy, the administrator role, `User.status`, and `Session`'s ownership.
- **ADR-093**, **ADR-094**, **ADR-097**, **ADR-098**, **ADR-116**, **ADR-128**, **ADR-129**, **ADR-133**, **ADR-137**, **ADR-138** — the UI foundation, its path, the visual contract, the appearance, the conformance gate, and the typeface's register-gap row.
- **ADR-105** (the three `User` sign-in fields are already registered) — R1 implements, and does not re-amend, them.
- **ADR-107**, **ADR-111**, **ADR-112**, **ADR-113**, **ADR-114**, **ADR-115**, **ADR-124** — the session-activity rule, the policy messages, the code step, the recovery verified state, refusal precedence, and the blocked-recovery confirmation.
- **ADR-117** and the **capacity model** — the Scale/Scope starting point.
- **ADR-125** (the register's index + volumes; the reading protocol) — how the records this plan appends are read.
- **ADR-031** (the first standalone documentation-drift test is R2's, on the ground that R1's public surface is covered by OpenAPI generation from the Hono routes, ADR-002), **ADR-134** (the slice map and roadmap reach the commands that need them), **ADR-139** (the foundation phase, FR-053/AC-056, `EX-007`, R2 as the first frame page), and **ADR-140** (the administrator slice split) — R1's boundary and the duties it assigns.
- **ADR-141**, **ADR-142**, **ADR-143**, **ADR-144**, **ADR-145**, and **ADR-146** — the five register rows (the SMS transport, the backup tooling, the CI provider, the SBOM generator, and the accessibility checker) and the Technology Standards amendment at constitution 6.3.0 that closes R1's seven gap rows, keeping the icon set and the typeface as assets of the Wafar UI layer (ADR-098, ADR-137).
- **ADR-147** (the trade name's Arabic form carries no diacritics) — the wordmark, the page titles, and the brand line read «وفر» and «منصة وفر», the unvocalised form the three pages and the four SMS templates already carry; ADR-045's diacritics clause is superseded and kept as history, so the copy's no-diacritics rule and the name are one form.
- **ADR-148** (the shared composition is the Glossary's **Shell**, with **Frame** as its accepted synonym confined to the text that already carries it; constitution 6.3.2, 2026-11-04) — the approved term for the composition this specification and plan call "the frame", and the reading that keeps those occurrences as written while new text says **Shell**.

### Post-Phase 1 re-evaluation (2026-10-29)

The design artifacts do not change any gate result. Four points were re-checked
after Phase 1 and remain PASS: (a) the transient store and the rate-limit table
are non-entity operational state owned by `users` and `auth`, documented in
`data-model.md` and not added to the register; (b) the library's `email` column
is the only new field-shaped fact, and it is recorded as a deviation with an ADR
and a domain-model note (Complexity Tracking row 15), not as a product field;
(c) the city list, the prefix set, and the breached-password list are reference
data files with one owning feature, not entities; and (d) the two read paths the
design adds beyond the flows — `GET /auth/session` and the pending request's
resume read — return the caller's own state only, resolved by the shared entry
point or by the pending cookie, and never another account's row (FR-053). No
`NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-30 clarifications and the analyze pass (2026-10-30)

The gates were re-evaluated on 2026-10-30 against the four clarifications of that
day and the `/speckit.analyze` findings; every status stays PASS.

- **The email sentinel.** The product-level rule governs: no email address exists
  as a product datum. Where the library requires a value in its `email` column,
  the plan records the exact, non-routable sentinel the specification delegates:
  the canonical E.164 number without its leading `+`, followed by
  `@phone.invalid` — `+218912345678` is stored as
  `218912345678@phone.invalid`. The value is ASCII, carries digits before the
  `@`, and is unique because the canonical number is unique. It is never
  collected from a person, displayed, used to identify or recover an account, or
  sent anything, and its storage deviation remains Complexity Tracking row 15
  with its ADR and domain-model note.
- **The frame's clarifications.** The nine destinations, the definition of
  "public pages" as Home, Parts, and Catalog, and the footer band's presence at
  1024 CSS px and up — its four static-page links moving into the drawer below
  that width — match the shell composition this plan builds and the pages it
  deliberately does not render. No step in R1 renders the band, so the deferred
  reachability requirement (FR-024) is unchanged.
- **Documentation (C1, C5).** The public-interface gate is now stated in the
  Documentation row and in the sequencing: OpenAPI 3.1 generated from the Zod
  contracts and the route table, with the first standalone drift test against
  `contracts/auth-api.md` §5 assigned to R2 (ADR-031 item 4), and the
  module-responsibility header check.
- **Schema and startup (C2).** The boot-time schema-version guard is in Technical
  Context, the Schema and Migration Control row, and the A4/B1/B8 steps: the API
  exits non-zero when the expected migration is absent or different. *(Superseded
  2026-11-01 by the I3 sequencing pass below: A3 no longer carries the first
  migration or `schema-version.ts`; the migration and the expected version are
  B1's — T032 and T126 — and A4 keeps only the listener's boot sequence the guard
  gates.)*
- **Deployment and health (C3, C4).** `GET /health` verifies PostgreSQL with
  `SELECT 1` and answers 503 when it fails; every backup archive is encrypted
  before it leaves the host, and the quarterly restore proves the ciphertext
  decrypts. Both are recorded in the Deployment and Observability row, the
  Verification Notes, and (for the encryption's key custody) Complexity Tracking.
- **Bookkeeping (I2, I3, I5).** The email deviation is Complexity Tracking row 15,
  not 12; the register's `User` row (ADR-105) names the three sign-in state
  fields and `docs/domain-model.md` records them, so R1 implements them without
  re-amending either document; and the design-conformance note lists `contracts/ui-contracts.md` §10's baseline states in full.

Gate 1 is unchanged by these additions: they are documentation, startup, and
deployment controls and introduce no principle violation. Gate 3 is unchanged:
none of them touches the authorization model, retrieval, extraction, ingestion,
or the catalog data shape, and no new deferred area is opened.

No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the amendment pass (2026-10-30)

The amendments were re-checked against Gates 1–3; no status changed and no new
violation was introduced (Gate 1 → VIII remains PASS with `EX-007`).

- **Record bookkeeping.** "Decision records this plan introduces" now lists twelve
  records; the accessibility checker's record (11) and the provisioning boundary's
  record (12) are the two new ones. The Complexity Tracking row and the Dependency
  Governance row for `@axe-core/playwright` cite the checker's record (now
  ADR-145), and the Technology Standards row cites it for the checker and record
  12 for the provisioning boundary, so "each carries an ADR" is true for every
  register gap R1 closes.
- **The register amendment.** The seven gap choices were scheduled into the
  Technology Standards register no later than R1's acceptance (repository owner,
  2026-12-01), and the register and its mirror appeared in the Ownership Map
  with R1 as owner. Scheduling an amendment is not making one: the plan writes
  neither file, and the constitution's Governance procedure governs the edit.
  (Discharged 2026-10-30 by ADR-146: the amendment is recorded, the register
  stands at 6.3.0, and the Ownership Map records both files as written by that
  governance change.)
- **Story independence.** The bare layout, the step state machine and in-progress
  guard, and the code-to-Arabic message mapping moved into A8, before the A→B
  checkpoint; B3 now composes only the three pages' steps, announcements, focus,
  and copy. Gate 1 → VIII stays PASS with `EX-007`, and its evidence states that
  US1, US2, US3, and US7 depend on foundation code only and that no story depends
  on another story's tasks. *(Superseded 2026-10-31 by the analyze pass below:
  the tasks do not support "no story depends on another story's tasks", so the
  claim is withdrawn, the password-change service joins A8, `EX-008` records
  US4's blocked-account test, and `EX-011` records US7's hidden field and refusal
  order on US1's, US2's, and US3's surfaces.)*
- **The audit boundary.** Record 12 carries the bounded reading of the
  constitution's audit rule, and Gate 2 → Authorization and Access Control cites
  it, so the reading rests on a decision record rather than on a clarification
  alone.
- **Test roots and the composables path.** The Structure Decision now names the
  four kinds of test root (integration, end-to-end/accessibility/visual, layer,
  and co-located unit tests), and the tree places the authentication composables
  under `apps/web/app/composables/auth/` with all four composables. No existing
  ownership changed.
- **The architecture document.** The Documentation row no longer claims an
  `docs/architecture.md` edit: that document already records the module, layer,
  and layout paths R1 implements, so the row now claims only what the change
  writes. *(Superseded 2026-11-01 by finding R3 of the surgical repair pass
  below: `docs/architecture.md` records the canonical
  `{routes,service,repository}` planning, and R1's layout deviates from it in
  the two registered directories — Complexity Tracking row 26 and record 1.)*
- **The budget assertion.** The Budget check states the failure thresholds (p50
  above 150 ms or p95 above 1,000 ms at 10 authentication requests/second) and
  makes the script's verdict the release gate and R1's baseline for later slices
  (SC-009). No CMV row and no CMV count changed.

Gate 3 is untouched: none of these amendments opens a deferred area, and none
touches the authorization model, retrieval, extraction, ingestion, or the catalog
data shape. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the register closure (2026-10-30)

ADR-141 to ADR-146 were recorded after the amendment pass, and the Technology
Standards register now carries the five rows at constitution 6.3.0. The gates
were re-read against that state; every status stays PASS.

- **Record bookkeeping.** The five register-gap records exist: item 4 is ADR-141,
  item 8 is ADR-142, item 9 is ADR-143, item 10 is ADR-144, and item 11 is
  ADR-145; ADR-146 records the Technology Standards amendment that consumes them.
  Seven of the twelve records remain to be appended at implementation (items 1,
  2, 3, 5, 6, 7, and 12), so a record is never appended twice. *(Superseded
  2026-10-31 by the G1 pass below: the list now holds thirteen records and eight
  remain — item 13 is the API versioning and deprecation record.)* *(Further
  superseded 2026-10-31 by the SC-009 measurement-validity pass below: fourteen
  records and nine remain — item 14 is the load profile and its verdict.)*
  *(Further superseded 2026-11-01 by the repair pass below: fifteen records and
  ten remain — item 15 is the silent hidden-field refusal's mechanism.)*
- **The register.** The amendment is no longer scheduled: constitution 6.3.0
  carries the five rows, `Project-Technologies.txt` mirrors them, and the icon and
  typeface gap rows are closed against the layer's assets (ADR-098, ADR-137,
  ADR-138). The Ownership Map therefore records both files as written by the
  governance change, not by this feature. Nothing R1 implements changes, and the
  Dependency Governance row still requires a licence, a vulnerability scan, and a
  review date for each choice.
- **No status changed.** Gate 1 is untouched; Gate 2 → Technology Standards and
  Documentation now state the recorded amendment instead of a pending one; Gate 3
  is untouched. No `NEEDS CLARIFICATION` remains.

### Gap-fill after the 2026-10-30 sessions (2026-10-30)

A read-back of the Phase 0 and Phase 1 artifacts against the specification found
six omissions, all repaired in place; no decision, gate status, requirement, or
criterion changed.

- **The sentinel is now exact.** The specification delegates the placeholder's
  literal form to this plan, and the plan previously gave only a pattern. It now
  records the derivation and an example — the canonical number without `+`, then
  `@phone.invalid` (`+218912345678` → `218912345678@phone.invalid`) — in the
  email-sentinel note, Complexity Tracking row 15, `research.md` R-01,
  `data-model.md` §4, and `contracts/auth-api.md` §7.2. The stored value remains
  non-routable, never displayed, and never a sign-in input.
- **The lockfile has an owner.** T001 writes `pnpm-lock.yaml`, but the Ownership
  Map named only `pnpm-workspace.yaml`, `turbo.json`, and the root manifests; the
  row now names the lockfile too, so every path a task touches is recorded.
- **Every success criterion has a measurement point.** The Verification Notes
  gain a coverage map for SC-001 … SC-009, naming the suite or assertion that
  measures each one; previously only SC-004 and SC-009 were cited by identifier.
  The quickstart's done-when list now states SC-001's, SC-002's, and SC-003's
  bounds as validation steps.
- **The quickstart's structural check is complete.** Scenario 14 now names the
  footer band's absence below 1024 CSS px (the fifth of the ten structural
  assertions), and Scenario 11 inspects `phone_verifications.code_hash` to prove
  the one-time code is held only in protected form.
- **The guest rule is stated in the plan.** Gate 2 → Product Fact Clarifications
  now records the 2026-10-30 correction to FR-048 and AC-052: the six
  merchant-area destinations (Upload Catalog, My Files, Cart, Notifications,
  Messages, Profile) take a guest to sign-in, while the three public destinations
  (Home, Parts, Catalog) open their own pages, so the plan and the specification
  read the same rule.
- **The rate-limit boundary is stated.** CMV row 3 now says the request that
  starts an operation is the only one that consumes or is refused by that
  operation's budget; the code entry and the new-password step neither count
  against it nor are refused by it, and are bounded by the code's own limits
  (Clarifications 2026-10-29).

Gate 1, Gate 2, and Gate 3 are unchanged; these are traceability repairs, not
design changes. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 clarifications (2026-10-31)

The six answers of the 2026-10-31 clarify session, plus the analyze pass's answer recorded as Session 2026-10-31 (3), were re-read against Gates 1–3 after
FR-022's delegated design value was recorded; every status stays PASS, and no
requirement, criterion, page, entity, dependency, or Constitution Mandated Value
changed.

- **The rail's width (FR-022).** The requirement delegates the collapsed rail's
  width to this slice, and `ROADMAP.md`'s First obligations table assigns the row
  to R1 with the instruction that R1 chooses no width of its own. The plan now
  records the value once, in Technical Context, from ADR-128 decision 5, and the
  layer declares it as the rail-width token the collapsed state consumes. The CMV
  list is closed and the value is not open, so nothing was added to the
  constitution or to the plan template, and no new decision record is needed
  because ADR-128 already records the value; Gate 2 → Single-Reference
  Sufficiency records the destination, and A2 names the token the layer declares.
- **Supplied values and the platform's text (FR-001, FR-026, FR-038, FR-045).**
  The language and numeral rules bind the platform's own text: a full name or shop
  name keeps the script and digits it was typed with and is never transliterated
  or re-numeralised, and it renders as one isolated bidirectional run whose
  direction comes from its own first strong character, while the mobile number and
  the one-time code render canonically — the number in FR-038's display form
  `+218 91 234 5678`, inside one isolated left-to-right run. Platform copy carries
  no diacritics and no Latin character outside the closed set (digits, `+218`,
  `SMS`), both judged by the string scan. The no-emoji rule reaches every text a
  person reads, so a supplied
  value carrying an emoji is refused at input with a message naming the reason,
  among the value rules and before account existence is consulted, so the sign-up
  flow's uniformity gains no signal. Gate 1 → V carries it; `contracts/auth-api.md`
  §3.1 and `data-model.md` §12 state the limb on the two value rules they already
  carry, and no error code, column, or constraint is added.
- **The drawer and the bottom bar (FR-022, FR-048, FR-052).** Activating an item
  closes the drawer as part of the navigation and settles focus on the destination
  page's heading; the three dismissals that do not navigate keep returning it to
  «المزيد». The bar stays rendered and visible while the drawer is open, with
  «المزيد» showing its open state, and the scroll rule never hides it there. These
  are runtime rules of a frame no page here renders, so they sit inside `EX-007`:
  R1 asserts the composition and the dismissal contract structurally (Complexity
  Tracking row 4) and R2 exercises the navigation, the focus landing, and the
  bar's open state. AC-042 asserts the scroll rule's thresholds and transition and
  records in the same clause that this slice verifies the bar's composition
  structurally while the slice shipping the first frame-carrying page verifies the
  scroll behaviour, which is the boundary SC-005 fixes (FR-052, AC-042).
  `contracts/ui-contracts.md` §8.3 and §8.6 carry the clauses the plan's own
  contract needed.
- **The header at 320 CSS px (FR-023, SC-006, AC-025).** All four controls remain
  in one row — none dropped, folded into an overflow menu, or moved into the
  account menu — the three inline-end controls stay icon-only at the 44 px touch
  floor with their accessible names, the wordmark keeps a shortened form of the
  same mark and never a new image asset, and the row does not scroll
  horizontally. R1 asserts the control set structurally at the floor; the
  wordmark's literal shortened form is a rendering value of the same `WfWordmark`
  in the layer, not a second value this pass decides.
- **The ended-session state (FR-049, AC-053, SC-006).** The state is announced
  when it replaces the page's content, ahead of the page's other announcements,
  and focus moves to its focusable heading; the blocked variant, carrying no
  sign-in control, lands on the same heading. R1 asserts the live-region markup
  and the focusable heading structurally and R2 exercises the live move, on the
  boundary SC-005 fixes.

Gate 1 is unchanged in status: IV and V gain the evidence above and IX is
untouched. Gate 2 is unchanged in status: Single-Reference Sufficiency records
the rail's one destination and Product Fact Clarifications gains the 2026-10-31
facts. Gate 3 is untouched: no deferred area is opened, and the authorization
model, retrieval, extraction, ingestion, and the catalog data shape are
unchanged. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 analyze pass (C1, 2026-10-31)

Finding C1 read Gate 1 → VIII against `tasks.md`'s dependency section and found
the gate claiming more than the tasks support. The repair changes no
requirement, criterion, or success criterion.

- **The password-change service is foundation code (a).** The service that
  carries the forced-first-change rule — the value rules, the current-password
  check, the credential rewrite, the global revocation, the pending recovery
  row's deletion, and the requirement cleared by that change and by no other
  path — moves into A8
  (`apps/api/src/modules/auth/service/password-change.ts`), declares the lock,
  credential, and session collaborators as ports, and exposes the administrator
  branch as `AdministratorPasswordChange`. US2's route delegates to it and clears
  no flag; US6 implements that branch in
  `apps/api/src/modules/auth/service/password-change-administrator.ts`, so US6
  edits no US2 file and the clearing keeps one home.
- **US4's blocked-account test is registered (b).** The blocked-account half of
  `apps/api/test/integration/users/status.spec.ts` exercises US2's sign-in path,
  which Principle VIII's isolation rule does not allow unrecorded. `EX-008` is
  appended to `.specify/templates/exception-register.md` with the repository
  owner as approver and a 2026-12-01 review date, and the governance drift
  check's exception-row count moves from seven to eight. Gate 1 → VIII cites it
  and Complexity Tracking row 18 carries the deviation.
- **The gate claims only what the tasks support (c).** Gate 1 → VIII now states
  which stories are foundation-only (US1, US2, and US3; US7 was added to that
  list here and removed by the C3 repair below), which deviation is
  registered (US4, `EX-008`), and which tests cross a story boundary as
  integration over a delivered surface (US5's bare-page end-to-end test and
  US6's administrator tests), with the frame's runtime still under `EX-007`. It
  no longer asserts that no story depends on another story's tasks.

Gate 1's status after this pass is PASS with exceptions `EX-007` and `EX-008`
(the current set adds `EX-009`, `EX-010`, and `EX-011`; see the C2 and C3
re-evaluations below); Gate 2 and Gate 3 are untouched. No `NEEDS CLARIFICATION`
remains.

### Re-evaluation after the 2026-10-31 analyze pass (C2, 2026-10-31)

Finding C2 read the User Stories' Independent Test paragraphs against Principle
VIII and found three stories claiming full isolation while each carries one test
that necessarily runs on another story's delivered surface. The repair changes no
requirement, criterion, or success criterion.

- **Each paragraph claims only what its story verifies alone.** US4's status
  read, retained data, and delete-path absence are verified without another
  story, while the withdrawn-session assertion is inside `EX-008`'s scope and
  runs through US2's session read; US5's composition is verified structurally;
  US6's provisioning and forced-change behaviour are verified with its own
  fixtures.
- **The three crossings are registered.** `EX-009` covers US5's bare-page
  end-to-end test, which opens the three bare pages this slice ships (US1, US2,
  US3) and covers AC-023, and
  `EX-010` covers US6's tests over US2's sign-in, lock, revocation, and notice
  behaviour and US3's recovery role refusal (AC-029); `EX-008` already covered
  US4's blocked-account half. Both new rows carry the repository owner as
  approver and a 2026-12-01 review date, and the governance drift check's
  exception-row count moves from eight to ten. The C3 pass adds `EX-011` and
  moves it to eleven.
- **The gate and the tasks say the same thing.** Gate 1 → VIII names the four
  exceptions current at this pass (the C3 pass makes it five), instead of
  calling the crossings "integration over delivered surfaces, which the
  principle permits"; `tasks.md`'s dependency and parallel sections name
  `EX-009` and `EX-010`, and Complexity Tracking rows 20 and 21 carry the two
  deviations.

Gate 1's status after this pass is PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, and `EX-010` (the current set adds `EX-011`; see the C3 re-evaluation
below); Gate 2 and Gate 3 are untouched. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 analyze pass (F1, 2026-10-31)

Finding F1 read the Documentation gate and Verification Notes against
`ROADMAP.md` lines 140 and 247 and found R1 claiming the first standalone
documentation-drift test while the roadmap assigns it to R2. ADR-031 item 4 fixes
the owner: R1's public surface is covered by OpenAPI generation from the Hono
routes (ADR-002), so the first standalone drift test is R2's. The Documentation
row and the Verification Notes now state that owner, B8 no longer claims the
test, and `tasks.md` no longer places the drift test in R1; no requirement,
criterion, or success criterion changes.

### Re-evaluation after the 2026-10-31 analyze pass (G1, 2026-10-31)

Finding G1 read `ROADMAP.md` line 155 against Gate 2 and found R1 assigned the
public-API versioning and deprecation rule required by the constitution while
neither the plan nor `tasks.md` carried it. The repair adds the rule and the
record it requires; no requirement, criterion, success criterion, or gate status
changes.

- **The rule is in the gate.** Gate 2 → Deployment and Observability now states
  that every public route is mounted under `/api/v1` (`contracts/auth-api.md`
  §1; A4), that `/health` stays unversioned as the operational probe and not a
  product interface, and that a deprecation announces removal at least one
  release ahead and is recorded as an ADR.
- **The record is in the list.** Record 13 carries the versioning and deprecation
  rule; R1 ships version 1 with no deprecated route, so the record fixes the rule
  later slices follow and announces no removal. Its ADR number is assigned when
  it is appended, and the task that appends it sits beside T120's batch of the
  other remaining records. *(The 2026-10-31 tasks pass names that task T136, so
  the rule has a named task; no decision changes.)*
- **The arithmetic moved.** "Decision records this plan introduces" now lists
  thirteen records, eight of them appended at implementation, and the
  Documentation row states the same count; the 2026-10-30 register-closure note
  is annotated where it carried the earlier arithmetic. *(Superseded 2026-10-31
  by the SC-009 measurement-validity pass below: fourteen records, nine of them
  appended at implementation.)*

Gate 1 and Gate 3 are untouched: the rule is a deployment control and opens no
deferred area. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 SC-009 measurement-validity pass (2026-10-31)

The Budget check and T117 stated the rate — 10 requests/second for 60 seconds —
but not the keys, and the three per-operation budgets in CMV row 3 would have
refused most of the 600 requests from a single origin: an account-creation origin
budget of 20 per 15 minutes cannot fund 200 submissions, so the reported p50 and
p95 would have been the latency of whichever requests happened to be accepted.
The plan now fixes the profile, and no requirement, criterion, or success
criterion changed.

- **The profile is explicit.** `### The SC-009 load profile` states the 20 virtual
  users, their origin keys (`127.0.0.2` … `127.0.0.21`), the one-number-key-per-request
  rule and the three disjoint 200-number blocks, the per-key spend against each
  limit, the form-level and credential conditions that keep the run free of
  refusals, and the warm-up.
- **The verdict reports refusals.** Attempted, accepted, and refused counts per
  operation and in total, with the refusal codes; any refusal fails the run, an
  accepted count other than 200 fails it, and the percentiles are computed over
  accepted requests only — so a refusal-dominated run cannot pass.
- **The limiter is never bypassed.** CMV row 3 now says no environment variable,
  flag, or build may disable, raise, or skip a limit; the run reads its
  `rate_limit_counters` rows back and a post-run probe from a fresh origin must be
  refused on its 21st account-creation submission. The contract gains §2.5, which
  derives the origin key from the peer address when the peer is not the trusted
  proxy, so the profile needs no header trust.
- **The session arithmetic was wrong and is fixed.** Seeding 500 live sessions and
  adding 200 sign-ins would have measured outside the condition's own 500-session
  ceiling; the seed holds 300 and the run's 200 sign-ins reach exactly 500.
- **The record count moved.** Record 14 carries the profile and its no-bypass
  rule; "Decision records this plan introduces" now lists fourteen, nine of them
  appended at implementation, and the Documentation row states the same count.
  *(Superseded 2026-11-01 by the repair pass below: fifteen records, ten of them
  appended at implementation.)*
  `research.md` R-21 holds the rationale and the alternatives (a scoped bypass
  among them), `quickstart.md` states the invocation and the acceptance rule, and
  T117, T074, and T120 carry the task-level changes.

Gate 1 is unchanged: the profile is a measurement rule and touches no principle's
scope. Gate 2 → Performance Budgets and Verification and Identity,
Authentication, and Session Policy gain the evidence above, and Documentation
carries the record count. Gate 3 is untouched. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 analyze pass (F2, 2026-10-31)

Finding F2 read `ROADMAP.md` lines 243–249 against this plan's Complexity
Tracking and found the N+1 query-count assertion's status recorded only in the
Verification Notes, while the roadmap requires the status — met, or an unmet
SHOULD with its reason and a review date — in Complexity Tracking. The status is
**met**: every path R1 introduces is a point lookup on a unique index, and the
integration suite asserts a sign-in request's query count (one user read, one
credential read, one session insert). Complexity Tracking row 19 now records
that status with R1 as owner and the 2026-12-01 review date. The
assertion itself is unchanged; R2's first standalone documentation-drift test
remains a separate obligation (ADR-031 item 4; ADR-139). No requirement,
criterion, success criterion, gate status, or CMV row changes.

### Re-evaluation after the 2026-10-31 analyze pass (O1, 2026-10-31)

Finding O1 read T131 against the Ownership Map and found the task naming
`.specify/memory/version.json` while the map recorded the constitution alone, so a
path the task touches carried no owning feature, no write status, and no
exclusivity. The repair adds the file as a governance-owned row beside the
constitution and its mirror, with this feature as a reader and never a writer;
every other row and T131's own text are unchanged. The task needs no rewording
because it already reads the value only through `governance-drift-check.mjs`,
whose check A compares the machine-readable counterpart with the constitution
footer and fails while they disagree, so the row records the path without
claiming a write. No requirement, criterion, success criterion, gate status, or
CMV row changes.

### Re-evaluation after the 2026-10-31 analyze pass (C3, 2026-10-31)

Finding C3 read the shared code step and US7's controls against the Ownership Map
and Principle VIII and found two crossings the plan had not recorded: US3's
recovery task edited `apps/web/app/components/auth/CodeStep.vue`, a file US1's
task built, and US5's supplied-values test exercised that same US1 component;
US7 added its hidden field to US1's sign-up form and applied its refusal order in
US1's, US2's, and US3's routes. The repair moves the shared code step into A8,
registers `EX-011`, and changes no requirement, criterion, or success criterion.

- **The shared code step is foundation code.** `CodeStep.vue` now lands in A8
  with the list of collected fields it displays, the change-number control, and
  the resend control as its properties, and with its unit and component tests.
  US1 and US3 pass their own values; neither edits the component, and US5's
  supplied-values test (T133) exercises the A8 component rather than US1's code.
  The A→B checkpoint names it.
- **US7's crossing is registered.** `EX-011` covers the hidden `website` field in
  US1's `SignUpForm.vue` (T081), the fixed refusal order's application in
  US1's and US2's `sign-up.ts` and `session.ts` (T080), the two-key rate limits
  (T074), the security middleware (T076), and the no-CAPTCHA rule (T077); the
  recovery route's application and budget exemption are the Polish T137.
  Gate 1 → VIII names the exception instead of claiming US7 has no task
  on another story's surface, and Complexity Tracking row 22 carries it.
- **The arithmetic and the scope moved.** The exception-row count now stands at
  eleven, and `EX-008`'s and row 18's "verified without US2's path" list no longer
  claims the withdrawn session, which `EX-008` itself names inside its scope.

Gate 1's status is PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`,
and `EX-011`; Gate 2 and Gate 3 are untouched. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-10-31 plan repair (S1, P1, T1, D1, I2, 2026-10-31)

The repair reads `ROADMAP.md`, this plan, and `tasks.md` against one another and
closes five gaps. No requirement, criterion, success criterion, CMV row, page,
entity, or dependency changes, and no task is moved or renumbered.

- **S1 — the layer's data-page primitives stay in R1.** `ROADMAP.md` lines 126–127
  assign the content skeleton, the in-place loading bar and the loading-state
  rule that owns their thresholds, and the bidirectional file-name surface to R1.
  The first of the two options is chosen: they stay in R1 and are added to A2,
  the Ownership Map, and Complexity Tracking row 23, with T138–T139 in
  `tasks.md`'s foundational phase. No ADR is recorded, because the obligation is
  the roadmap's and no decision moves; the alternative — an ADR handing them to
  the first data slice — would move a roadmap row and leave the layer incomplete
  at R1's acceptance. Their values are not restated: ADR-128 decision 9 fixes the
  120 ms/300 ms rule, the skeleton geometry, and the RTL shimmer token, and
  decision 14 fixes the file-name isolation, so the layer consumes the recorded
  contract and invents nothing.
- **P1 — A2 and the tasks name one boundary.** A2 previously put the shell
  primitives in the foundational increment while T101–T106 built them in US5 and
  B6 named only their tests. A2 now carries the layer's assets and data-page
  primitives (tokens, appearance, fonts, IconPark, `WfIcon`/`WfNumeral`/
  `WfWordmark`, the skeleton, the loading bar and rule, and the file-name
  surface), and B6 carries the shell primitives — header, sidebar, bottom bar,
  footer band, account menu, theme switch, drawer — with their structural tests,
  the route map, the guest variant, and the bar's five slots. No task moved and
  no identifier changed.
- **T1 — T060 crosses US1, US3, US6, and US7 and is registered.** The security-events
  test asserts FR-037's closed list, and that list includes `auth.sign_up.verified`
  (US1, T045), `auth.password.reset` (US3, T086), both `auth.otp.dispatch_failed`
  kinds (US1's T047 and US3's T085), `auth.administrator.provisioned` (US6,
  T107), and the absence of a record for a format refusal (US1's route) and a
  rate-limit refusal (US7's limiter). `EX-012` is appended to the register with
  that exact scope, Gate 1 → VIII and Complexity Tracking row 24 cite it, and the
  drift check's exception-row count moves to twelve. The emission points stay
  with each story: T045, T047, T085, T086, and T107 emit their own events, and
  T069 builds the shared events module and wires only US2's events, so it edits
  no US1 or US6 file. Splitting the closed-list assertion across four stories was
  rejected because it would give one rule four homes and leave no test that the
  list is closed.
- **D1 — the checklist tree is complete.** `checklists/ui.md` exists and is now
  listed in the Documentation tree beside `requirements.md`, `flows.md`, and
  `security.md`.
- **I2 — the N+1 row and the roadmap agree.** `ROADMAP.md` line 140 still
  assigned "the first N+1 query-count assertion" to R2 while lines 243–249 and
  ADR-139 give it to R1. Line 140 is corrected in the same change — a governance
  edit recorded here and made outside the plan artifact — so the row assigns
  only the documentation-drift test to R2 and names R1's assertion (T058), and
  Complexity Tracking row 19 cites both lines. R2's first standalone
  documentation-drift test remains a separate obligation (ADR-031 item 4), and
  neither discharges the other.

Gate 1's status is PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`,
`EX-011`, and `EX-012`; Gate 2 and Gate 3 are untouched. No `NEEDS
CLARIFICATION` remains.

### Re-evaluation after the 2026-11-01 analyze and clarify pass (C1, C2, U2, I4, I1, U1)

The 2026-11-01 pass read `tasks.md` against this plan, `data-model.md`, the
contracts, and the 2026-11-01 clarification session. The six findings are
answered in place; no requirement, acceptance criterion, or success criterion
moves, and no gate status changes.

- **C1 — the lock's home moved to `users` (blocker).** `failed_sign_in_count` and
  `locked_until` are `users` columns and `users` is their owning module, so
  `apps/api/src/modules/auth/repository/user-lock.ts` would have made the `auth`
  repository a second writer of a `users` table. The lock's conditional update,
  success reset, expiry clear, and the current-password check's lock refusal are
  now implemented in `apps/api/src/modules/users/repository/user-lock.ts`; the
  `auth` sign-in and password-change services call the lock port declared in
  `packages/shared`, and no `auth` file issues SQL against `users`. `data-model.md` §1, §4, and §9,
  the Ownership Map, Gate 1 → X, and `tasks.md` T063, T064, T067, and T069 carry
  the move; T056 remains the US2 unit test of the sign-in service's lock
  behaviour over the port, and T058's query-count assertion is unchanged. No
  exception is needed.
- **C2 — the operational boundary is recorded.** `ROADMAP.md` lines 139 and 154
  assign the three environments with staging parity, the error tracker, the
  secret manager, TLS, the log pipeline, and the monitoring and alerting set to
  R12. Technical Context, Gate 2 → Deployment and Observability, Complexity
  Tracking row 25, and `quickstart.md` §8 now say so, with R12 as owner and
  2027-01-31 as the review date; R1 fixes only the configuration contract, the
  health probe, the structured log record, and the backup/restore contract those
  duties consume.
- **U2 — the city list has provenance and a completeness test.** `data-model.md`
  §11 and `research.md` R-10 record the source (the Libyan administrative-division
  reference), the dataset version (`1.0.0`, 2026-11-01), the reference count (22
  governorates), and the file's total entry count in its `SOURCE` note. T007
  writes that note, and T034 and the Verification Notes assert every one of the
  22 governorates is present, each with at least one city or area entry, and
  that the file's entry count equals the recorded count, so a truncated file
  fails the test even when the entries it kept are all real places.
- **I4 — the `verifications` table's reason is recorded, not deleted.**
  `data-model.md` §8 already explained it; Gate 2 → Schema and Migration
  Control, B1, and T031/T032 now carry the same reason: the adapter's model set
  requires the table, omitting it would leave the library's schema incomplete
  and invite a second verification store later, no R1 code path writes it, and
  the integration suite asserts it empty. Deleting it was rejected for that
  reason; the table remains in `0001` and in §8's placeholder classification.
- **I1 — the password maximum and its message reach the plan.** The 2026-11-01
  clarification made FR-035 state the maximum that CMV row 17 already fixed.
  CMV row 17 now cites FR-035, names the three refusal reasons (shorter than the
  minimum, longer than the maximum, and common or breached), and says each
  carries its own message; `research.md` R-08 carries the same three-message
  rule; `contracts/auth-api.md` §3.1 adds `PASSWORD_TOO_LONG`, and
  `contracts/ui-contracts.md` §3.2 and §6 state and render the
  longer-than-the-maximum requirement and message, and `quickstart.md`
  Scenario 5 asserts all three. No new numeric value is
  introduced: 12 and 128 stay the plan's, as FR-035 delegates them.
- **U1 — the emoji predicate is recorded where it is implemented.** The
  2026-11-01 clarification fixed FR-026's predicate — `Extended_Pictographic`,
  U+FE0F, or U+20E3. Technical Context records it, `contracts/auth-api.md` §3.1
  states it beside the two name codes, and `data-model.md` §12 references it;
  `tasks.md` T006 implements it once in
  `packages/shared/src/normalize/emoji.ts`, T034 and T037 assert it, and T054
  adds the two §6 message rows under the existing codes. The predicate has one
  home in the specification and one implementation in `packages/shared`, so the
  form and the API cannot disagree.
- **The guest's three controls at 320 CSS px (FR-023, AC-025, SC-006).** The
  2026-11-01 clarification states the guest's composition beside the signed-in
  merchant's: at 320 CSS px the logo/home control, the theme switch, and the
  sign-in action remain in the header's one row, none dropped, folded into an
  overflow menu, or moved, each keeping its accessible name and its touch
  target. Gate 1 → IV, `contracts/ui-contracts.md` §8.6 item 10, and
  `quickstart.md` Scenario 14 now state the same clause; the tasks already
  carried it (T095, T098, T102, T134), so no task changed.

Gate 1's status is unchanged: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012`. Gate 1 → X gains the lock's ownership
evidence, and Gate 1 → V cites the 2026-11-01 clarification for the emoji
predicate. Gate 2 → Schema and Migration Control, Deployment and Observability,
and Module Discipline and Development Workflow gain the records above; Gate 3 is
untouched. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-11-01 repair pass (C1, D1, E1, F1, G1)

The pass read `contracts/ui-contracts.md` §3.1 and `quickstart.md` Scenario 6
against FR-029 and AC-031, the 2026-11-01 guest clause against Gate 1 → IV and
the frame's two records, Gate 1 → X and the source tree against `tasks.md`, the
documentation tree against `checklists/`, and every Complexity Tracking citation
against the table. The five findings are answered in place; no requirement,
acceptance criterion, success criterion, CMV row, page, entity, dependency, or
task identifier moves.

- **C1 — the silent refusal has a mechanism.** Technical Context now states how
  the page ends on `form` although the 202 matches a success, the same response
  the account-creation limit may decide first (FR-051): the step is decided
  by the resume read, not by the 202, and the unstored id answers `OTP_EXPIRED`
  so the page stays on `form` with no message. `contracts/ui-contracts.md` §3.1's
  `submitting` row states both exits and adds the mechanism paragraph, and
  `quickstart.md` Scenario 6 expects the unchanged form instead of a code step
  that fails. Record 15 fixes the mechanism and T142 in `tasks.md` appends it;
  T073 asserts the API half — the resume read answers `OTP_EXPIRED` and no code
  step is reachable — and Gate 2 → Documentation and "Decision records this plan
  introduces" now count fifteen records and ten appended at implementation.
  *(Superseded 2026-11-04: sixteen records, eleven appended at implementation —
  record 16 is the copy's measurable bindings, T143.)*
- **D1 — the guest's three controls at 320 CSS px.** Gate 1 → IV, the
  2026-11-01 log above, `contracts/ui-contracts.md` §8.6 item 10, and
  `quickstart.md` Scenario 14 state the same clause: the logo/home control, the
  theme switch, and the sign-in action remain in the header's one row at
  320 CSS px, none dropped, folded into an overflow menu, or moved, each keeping
  its accessible name and its touch target (FR-023, AC-025, SC-006).
- **E1 — the module layout is what the tasks build.** Gate 1 → X and the source
  tree now state the verified layout — `auth` with `routes/` and `service/` and
  better-auth's adapter as its persistence, `users` with `service/` and
  `repository/` and no HTTP route in R1 — instead of claiming all three
  directories per module. The deviation from `docs/architecture.md` §1.1 and §2
  is Complexity Tracking row 26 and record 1; no task was added for a directory
  no requirement fills, and `docs/architecture.md` is not edited.
- **F1 — the documentation tree is complete.** `checklists/data.md` joins
  `requirements.md`, `flows.md`, `security.md`, and `ui.md` in the tree, so the
  tree lists the five files the directory holds.
- **G1 — Complexity Tracking is numbered.** The table gains a `#` column
  numbered 1–26, the new module-layout row is 26 so no existing row moves, and
  every citation was re-read against the numbered table: `plan.md`'s rows 1, 2,
  4, 15, 18, 19, 20, 21, 22, 23, 24, and 25 name the same rows they named
  before, `quickstart.md`'s `Coverage` paragraph is row 2, `research.md` R-01 is row 15, and
  `tasks.md` T141's source paragraph is row 1.

Gate 1's status is unchanged: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012`; IV and X gain the evidence above. Gate 2 is
PASS: Documentation, Identity, Authentication, and Session Policy, and Project
Structure and Debt Control carry the record, the mechanism, and the module
layout the tasks build. Gate 3 is untouched and stays PASS: no deferred area is
opened, and the authorization model, retrieval, extraction, ingestion, and the
catalog data shape are unchanged. No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-11-01 surgical repair pass (R2, R3, R4, R5)

This pass read Gate 2 → Documentation against `docs/architecture.md` §1.1 and §2
and the module layout `tasks.md` builds, the silent hidden-field refusal's
paragraph and `quickstart.md` Scenario 6 against AC-031 and FR-051, and the G1
entry's line citation against `quickstart.md`. It edited `plan.md` and
`quickstart.md` only: no `FR-###`, `AC-###`, or `SC-###` moved, no CMV row
changed, the record bookkeeping still reads fifteen records with five recorded
and ten appended, no task identifier moved, and no gate status changed.
*(Superseded 2026-11-04: sixteen records, five recorded and eleven appended —
record 16 is the copy's measurable bindings, T143.)*

- **R3 — the documentation row states the canonical layout and the deviation.**
  Gate 2 → Documentation no longer says `docs/architecture.md` "records the paths
  R1 implements and needs no edit". The document records the canonical layout —
  `{routes,service,repository}` for each module (`docs/architecture.md` lines 63
  and 85) — and R1's layout deviates from it in two registered directories:
  `auth` ships `routes/` and `service/` with better-auth's adapter as its
  persistence and no `repository/`, and `users` ships `service/` and
  `repository/` and no `routes/`. The deviation stays Complexity Tracking row 26
  and record 1, and `docs/architecture.md` is not edited.
- **R4 — the silent 202 is bounded by AC-031.** The hidden-field paragraph in
  Technical Context and `quickstart.md` Scenario 6 now state the bound AC-031
  fixes: the submission receives that response **when the operation's limit does
  not refuse it first** (FR-051; CMV row 3). The resume read, the response's
  shape, and the message are unchanged; a submission whose account-creation
  budget is already spent is decided by the limit first and receives the
  distinct, explicit limit refusal whatever else is wrong with it, a filled
  hidden field included (AC-031, AC-033).
- **R5 — the G1 line citation is corrected.** G1's entry now cites
  `quickstart.md`'s `Coverage` paragraph, where the `Complexity Tracking row 2`
  citation sits, instead of line 302; the row number stays 2.
- **R2 — the finding ledger closes the log.** The table below ends this
  re-evaluation section, so every "closed" entry is resolvable by its identifier
  rather than by prose alone. Each row names the round, the identifier, and the
  subject and restates no finding's detail; the section that answered it carries
  the evidence.
- **The ledger round (P-01, P-02, P-03, P-04, P-05, P-06, P-07).** With the
  ledger begun, the pass read its own bookkeeping and the contract against it
  and answered in place: the G1 and R5 citations follow the `Coverage`
  paragraph of `quickstart.md` after the line number drifted again (306 → 310),
  this ledger gains the R2–R5 rows and the C2 tasks row states the AC-031 page
  split (the page half in T081; T073 on the API half), the amendment-pass
  architecture-document bullet carries its superseded annotation (P-04),
  `contracts/ui-contracts.md` §3.1 bounds the silent 202 and cites FR-051
  beside the plan's two 202 passages (P-05), §3.1's refusal exits are unified
  on `form_error` (P-06), and the H1 row carries this round with its
  not-a-finding label (P-07). No FR, AC, or SC moved; no CMV row, gate status,
  record count (fifteen, ten appended), Complexity Tracking row (26), exception
  count (twelve), or task identifier changed.

Gate 1's status is unchanged: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012`. Gate 2 is PASS: Documentation states the
canonical layout and the two registered directories, and Identity,
Authentication, and Session Policy states the AC-031 bound on the silent
response. Gate 3 is untouched and stays PASS. No `NEEDS CLARIFICATION` remains.

#### Finding ledger

Every identifier this log has used, by round. The identifier alone repeats across
rounds — `C1`, `C2`, and `C3` each name a different finding in more than one
round — so a row's key is the composite `<round>-<ID>` in the `Key` column: the
round's own label, hyphenated, then the identifier, for example
`2026-10-30-analyze-C1`. The pass name is part of the key where the date alone
would collide, because two 2026-11-01 passes reuse `C1` and `C2`; the
`Round / date` column is unchanged. A row whose identifier names no finding —
`H1` — is marked `N/A` and states why it is kept. A round with no identifier (the
2026-10-30 amendment pass, the 2026-10-30 register closure, the 2026-10-31
clarification session, and the 2026-10-31 SC-009 measurement-validity pass) is
recorded by its section alone and carries no finding to resolve.

| Round / date | Key | Identifier | Subject |
|---|---|---|---|
| 2026-10-30 analyze | 2026-10-30-analyze-C1 | C1 | Public-interface documentation gate (OpenAPI generation; the drift test to R2) |
| 2026-10-30 analyze | 2026-10-30-analyze-C2 | C2 | Boot-time schema-version guard |
| 2026-10-30 analyze | 2026-10-30-analyze-C3 | C3 | `GET /health` probes PostgreSQL |
| 2026-10-30 analyze | 2026-10-30-analyze-C4 | C4 | Encrypted backup archives and the restore drill |
| 2026-10-30 analyze | 2026-10-30-analyze-C5 | C5 | Module-responsibility header check |
| 2026-10-30 analyze | 2026-10-30-analyze-I2 | I2 | The email sentinel's Complexity Tracking row (15, not 12) |
| 2026-10-30 analyze | 2026-10-30-analyze-I3 | I3 | `User`'s three sign-in state fields against the register and the domain model |
| 2026-10-30 analyze | 2026-10-30-analyze-I5 | I5 | The design-conformance note's baseline-state list |
| 2026-10-31 analyze | 2026-10-31-analyze-C1 | C1 | The password-change service moved into A8 |
| 2026-10-31 analyze | 2026-10-31-analyze-C2 | C2 | Story isolation and the registered crossings (`EX-008`, `EX-009`, `EX-010`) |
| 2026-10-31 analyze | 2026-10-31-analyze-C3 | C3 | The shared code step moved into A8; US7's crossing (`EX-011`) |
| 2026-10-31 analyze | 2026-10-31-analyze-F1 | F1 | The documentation-drift test's owner (R2) |
| 2026-10-31 analyze | 2026-10-31-analyze-F2 | F2 | The N+1 status recorded in Complexity Tracking row 19 |
| 2026-10-31 analyze | 2026-10-31-analyze-G1 | G1 | The versioning and deprecation rule (record 13) |
| 2026-10-31 repair | 2026-10-31-repair-D1 | D1 | The checklist tree |
| 2026-10-31 repair | 2026-10-31-repair-I2 | I2 | The N+1 row and `ROADMAP.md` line 140 |
| 2026-10-31 analyze | 2026-10-31-analyze-O1 | O1 | `.specify/memory/version.json` in the Ownership Map |
| 2026-10-31 repair | 2026-10-31-repair-S1 | S1 | The layer's data-page primitives stay in R1 |
| 2026-10-31 repair | 2026-10-31-repair-P1 | P1 | A2 and the tasks name one boundary |
| 2026-10-31 repair | 2026-10-31-repair-T1 | T1 | T060's cross-story scope (`EX-012`) |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-C1 | C1 | The lock's home in `users` (`user-lock.ts`) |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-C2 | C2 | The operational boundary owned by R12 |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-U2 | U2 | The city list's provenance and completeness test |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-I4 | I4 | The `verifications` table's recorded reason |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-I1 | I1 | The password maximum and its own message |
| 2026-11-01 analyze/clarify | 2026-11-01-analyze-clarify-U1 | U1 | The emoji predicate and where it is implemented |
| 2026-11-01 tasks | 2026-11-01-tasks-C2 | C2 | AC-031's page split: the page half moved to T081 in the surgical repair pass; T073 stays on the API half |
| 2026-11-01 tasks | 2026-11-01-tasks-J1 | J1 | T017's tail moved to the Complexity Tracking citation |
| 2026-11-01 repair | 2026-11-01-repair-C1 | C1 | The silent refusal's mechanism (the resume read; record 15) |
| 2026-11-01 repair | 2026-11-01-repair-D1 | D1 | The guest's three controls at 320 CSS px |
| 2026-11-01 repair | 2026-11-01-repair-E1 | E1 | The module layout `tasks.md` builds |
| 2026-11-01 repair | 2026-11-01-repair-F1 | F1 | The documentation tree |
| 2026-11-01 repair | 2026-11-01-repair-G1 | G1 | The `#` column in Complexity Tracking |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-R2 | R2 | The finding ledger closes the log |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-R3 | R3 | The documentation row states the canonical layout and the deviation |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-R4 | R4 | The silent 202 is bounded by AC-031 |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-R5 | R5 | The G1 line citation is corrected |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-H1 | H1 | N/A — not a finding: no artifact defines an H1, so there is nothing to resolve; the row keeps the name from reading as a missing entry (P-07) |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-01 | P-01 | The quickstart citation's line number drifted again; G1 and R5 now cite the `Coverage` paragraph |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-02 | P-02 | This round's missing R2–R5 rows in this ledger |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-03 | P-03 | The C2 tasks row's subject predates the AC-031 page split |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-04 | P-04 | The amendment-pass architecture-document bullet, superseded by R3 |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-05 | P-05 | The silent 202 bound and FR-051 in `contracts/ui-contracts.md` §3.1 and the plan's two 202 passages |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-06 | P-06 | §3.1's refusal exits unified on `form_error` |
| 2026-11-01 surgical repair pass | 2026-11-01-surgical-repair-pass-P-07 | P-07 | The H1 row attributed to this round, marked not a finding |
| 2026-11-01 I3 sequencing pass | 2026-11-01-i3-sequencing-pass-I3 | I3 | The first migration and `schema-version.ts` belong to B1 (T032, T126), not A3 |

### Re-evaluation after the 2026-11-01 I3 sequencing pass (I3)

I3 read the Phase A sequencing against `tasks.md` and found A3 claiming work it
cannot own: the step said `packages/db` carried the first migration and the
generated `schema-version.ts`, while the first migration is B1's, created after
the A→B checkpoint, and `tasks.md` places the migration at T032 and
`schema-version.ts` at T126. The repair moves the claim to the increment that
owns it; no requirement, acceptance criterion, success criterion, CMV row, page,
entity, dependency, exception, Complexity Tracking row, record count, or task
identifier moves.

- **A3 carries data access only.** The step now states the Drizzle client, the
  unit-of-work port, and the migrator command (T016), and nothing else; the
  schema modules, the first migration, and the generated `schema-version.ts` with
  its boot guard are B1's (T030–T032, T126).
- **B1 carries the first migration and the expected version.** The step now
  names the two schema modules (T030, T031), the reversible first migration
  (T032), and the generated `packages/db/schema-version.ts` with the boot-time
  guard and its two integration tests (T126), so the journal and the version
  built from it are produced by one increment.
- **A4 keeps the boot sequence, not the guard's value.** Its guard clause now
  names the listener's boot sequence and leaves the expected version, the guard,
  and its tests with T126, so the mechanism is not claimed by two steps.
- **The checkpoint states the boundary.** **Checkpoint A→B (recorded)** now
  names the data-access layer it accepts (the client, the unit of work, and the
  migrator command) and says it accepts no table and no migration — the schema
  modules and the first migration are B1's — so the paragraph no longer reads as
  if the migration were part of the foundation.
- **Gate 2 → Schema and Migration Control is re-read: PASS.** The control itself
  is unchanged — one migration tool, a reversible first migration, the boot-time
  refusal on an absent or different version, every FK indexed, every table
  timestamped, uniqueness and ranges as constraints, and the scoping assertion —
  and the row now names the increment that delivers the migration and the
  expected version (T030–T032, T126) and says A3 generates no migration, so its
  evidence points at the step that owns it. Gate 1 and Gate 3 are untouched.
- **Nothing else moved.** `tasks.md`'s task identities stay as they are — T016
  for data access, T030–T032 for the schema modules and the first migration, and
  T126 for `schema-version.ts` and the guard — and no `FR-###`, `AC-###`, or
  `SC-###` changed.

No `NEEDS CLARIFICATION` remains.

### Re-evaluation after the 2026-11-02 CHK036 pass (2026-11-02)

The security checklist's CHK036 recorded that FR-029 and AC-031 promised the
hidden-field refusal "the same timing" as a success while the success path waits
for the messaging channel's acceptance (FR-034) and the refusal dispatches
nothing. The pass defines the property and re-reads the rows it touches; no
requirement, criterion, success criterion, CMV row, entity, page, dependency, or
task identifier moves.

- **The property is one-sided and numeric.** FR-029 and AC-031 now state that the
  refusal is not observably faster than the success 202, measured one-sided at a
  median shortfall of no more than 50 ms and a p95 of no more than 150 ms over the
  enumeration test's sampling, and that it performs the same pre-dispatch work on
  a discarded copy. Full equality with the acceptance wait is rejected in the
  record: it is unreachable without the dispatch FR-029 forbids, and a constant
  wait covering the channel's tail would make the refusal the slower of the two
  and breach the response budget.
- **The mechanism is the plan's.** Technical Context states the wait — the
  channel's own rolling acceptance median, one in-memory scalar, never keyed by
  number or client, capped at the 750 ms provider timeout — so the refusal tracks
  the channel instead of imitating it; the Verification Notes add the pair's
  measurement, and record 15 carries both. T073 measures the pair, and T142
  appends the record with the timing clause.
- **Gate 2 → Identity, Authentication, and Session Policy is re-read: PASS.** The
  row now names the duration bound beside the response's text, status, headers,
  and field set, so its evidence covers the whole claim AC-031 makes. Gate 1 and
  Gate 3 are untouched, and `checklists/security.md` marks CHK036 with the review
  recorded there.

### Re-evaluation after the 2026-11-02 CHK001 pass (2026-11-02)

The security checklist's CHK001 recorded that no artifact tied the controls the
specification requires to the threats they answer, so a reviewer could see neither
a control without a threat nor a threat without a control. The pass adds the
threat and control map to Gate 2 and closes the item against it; no requirement,
criterion, success criterion, CMV row, entity, page, dependency, or task
identifier moves, and no control, budget, or mechanism is added.

- **The map is read both ways.** It carries twenty-two threats across the
  twenty-three named requirements, each row citing the requirement it answers and
  the task, suite, or gate that fails when the control is removed, plus a coverage
  list that gives every named requirement its row or rows. The two requirements
  that carry no row — FR-030, a prohibition, and FR-036, navigation — are named
  and explained, so the second direction is closed rather than left to inference.
- **No second authority.** Every control cell restates the requirement it cites,
  and the mechanisms the rows name are the ones this plan already records:
  CMV 3's keys, windows, and ceilings; CMV 17's policy parameters; CMV 2's scrypt
  profile; CMV 18's lifetime, re-request limit, and incorrect-entry bound; CMV 4's
  two clocks and cookie attributes; the
  channel's rolling acceptance median and its 750 ms cap from Technical Context;
  and SC-004's tolerance from the Verification Notes.
- **The one accepted risk is cited, not re-decided.** T05 records the lock's
  denial-of-service consequence against Complexity Tracking row 27, with its
  owner and 2026-12-01 review date, so the map shows the threat the slice does not
  control as plainly as the ones it does.
- **Gate 2 is re-read: PASS.** The binding-section rows above are unchanged and
  the map contradicts none of them; Gate 1 and Gate 3 are untouched, no design
  value is introduced, and `checklists/security.md` marks CHK001 with the review
  recorded there.

### Re-evaluation after the 2026-11-02 CHK027 and CHK039 pass (2026-11-02)

The security checklist's CHK027 recorded that `EX-007` named the verification the
frame's deferral carries — the runtime behaviour, the accessibility scan, and the
keyboard-only pass — but not the behaviours themselves, and the UI checklist's
CHK039 recorded the same gap against the item's own list: the drawer's open and
close, its focus containment and return, the account menu's live open, the bar's
scroll-hide, and the guest's redirection were assigned no closing criterion. The
pass names each behaviour in the exception's exact scope beside the criterion that
closes it and carries the same list into Complexity Tracking row 4; no
requirement, criterion, success criterion, CMV row, entity, page, dependency, or
task identifier moves, and no rule is added.

- **Each behaviour has one closing criterion.** The account menu's live open and
  its «تسجيل الخروج» item — the three dismissals, the consumed outside activation,
  the focus moving to the first item and back to the account control, the
  yes-or-no confirmation, and the ended-session state a confirmation produces —
  close against AC-051 and AC-053; the drawer's open and close, its item
  activation, and its focus containment and return close against AC-024; the
  bottom bar's scroll-hide closes against AC-042; and the guest's redirection
  closes against AC-024, AC-042, and AC-052, one criterion for each surface it
  runs on — the drawer's item, the bar's slot, and the sidebar's item list. AC-052
  joins the four criteria the two checklists name because its own last sentence
  sends the sidebar's redirection to R2.
- **The boundary stays the one ADR-139 fixed.** `EX-007` keeps the repository
  owner as approver and the 2026-12-01 review date, still ends at R2 — the first
  page carrying the frame — and still covers the frame's remaining runtime
  behaviour, its accessibility scan, and its keyboard-only pass. Nothing the row
  already carried is widened: the composition, the controls' presence, and the
  labels' whole text stay R1's structural verification, as T095, T096, T102, T103,
  and T132 build them.
- **Gate 1 → VIII is re-read: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
  `EX-010`, `EX-011`, and `EX-012`.** The row's claim that US5 verifies its
  composition without another story is unchanged, and the exception's scope now
  says which behaviours wait for R2 and which criterion proves each, so the
  exception reads as a boundary rather than as a class of deferred work. Gate 1's
  other principles, Gate 2, and Gate 3 are untouched, and both checklists mark
  their items with the review recorded in them.

### Re-evaluation after the 2026-11-02 CHK045 pass (2026-11-02)

The UI checklist's CHK045 recorded that the Verification Notes' accessibility
sentence still named the header's four controls at 320 CSS px without the
guest's three, while Gate 1 → IV already named both compositions, so the plan
verified the floor's header with the merchant's set in one place and with both
sets in another. The pass adds the guest clause to that sentence; no requirement,
criterion, success criterion, CMV row, entity, page, dependency, task identifier,
or gate status moves, and no rule is added.

- **The sentence and Gate 1 → IV read one composition.** The Accessibility
  verification note now asserts a guest's three controls — the logo/home control,
  the theme switch, and the sign-in action — in the header's 320 CSS px row under
  the same rule as the merchant's four, each keeping its accessible name and its
  touch target, in the words FR-023 and AC-025 fix; the merchant's clause beside
  it is unchanged. The plan's two remaining merchant-only statements — Gate 2 →
  Product Fact Clarifications and the 2026-10-31 clarification section's header
  note — sit in records of the clarification that fixed the merchant's
  composition, which Gate 2 names by date, so neither claims the guest's set,
  and the 2026-11-01 note, Gate 1 → IV, and this sentence carry the guest's
  three (FR-023, AC-025, SC-006).
- **Gate 1 → IV is re-read: PASS.** The row already carried both compositions and
  now points at a sentence that carries them too, so the evidence for the
  principle and the rule it verifies agree; Gate 1's other principles, Gate 2,
  and Gate 3 are untouched. `checklists/ui.md` marks CHK045 with the review
  recorded in it, and the file reads 53 marked, 0 open (53/53).

### Re-evaluation after the 2026-11-02 CHK013, CHK025, CHK036, and CHK004 pass (2026-11-02)

The copy checklist's four open measurability and dependency items were closed
against the plan. CHK013 recorded that "one segment where possible (UCS-2)" fixed
no character bound, no counting method, and no verdict on a body needing two
segments; CHK025 recorded that the emoji predicate named its Unicode property but
not the release the data is read from; CHK036 recorded that "the design reference"
was not an artifact a reviewer could open; and CHK004 recorded that the numerals in
the copy were not bound to the values that own them. The pass states all four; no
requirement, criterion, success criterion, CMV row, entity, page, dependency, or
task identifier moves, and no dependency is added.

- **The segment bound is stated by class.** Technical Context fixes UCS-2 and the
  UTF-16 code unit as the counting method, 70 code units for a one-time-code body
  and 134 for a notice, and the build-failure behaviour of a body over its class's
  bound; it also records the four bodies' lengths and the copy edit the bound
  forced — the recovery body's closing clause, which the sign-up body now carries
  too so both state the instruction the same way. `contracts/ui-contracts.md` §7
  carries the rule and the reworded bodies, and T026's test asserts each length.
- **The Unicode data is pinned and vendored.** Technical Context names Unicode
  18.0.0, the `emoji-data.txt` URL and SHA-256, the vendored path, the generator,
  the committed range table, the regeneration test, the runtime-independence rule,
  and the upgrade rule; T006 builds the table and the predicate against it. The pin
  sits in Technical Context rather than in CMV because the constitution's list is
  closed and a new value enters it by a constitution amendment — the reading the
  rail-width paragraph already records — and Gate 2 → Single-Reference Sufficiency
  now says so.
- **The reference is two openable artifacts.** Technical Context names the R1
  capture set (`docs/design/screenshots/R1/`, thirteen images, each with a manifest
  entry) for the strings a capture shows, and `contracts/ui-contracts.md` §3.2,
  §3.4, §4.2, §5.2, §6, and §7 for the strings it does not — the code step, the
  in-progress states, the refusals, the status notices, and the message bodies —
  and states that the SMS bodies are the plan's own values because the lab has no
  messaging surface. The difference between a capture and the recorded copy is the
  specification's rule winning (the diacritics rule, the untransferred lockout
  alert). (Superseded 2026-11-04, Clarifications: the contract is the single
  authority and the capture set is evidence of composition and appearance only;
  see Technical Context, "The copy's authority (CHK036, CHK002)".)
- **The numerals are slots, not text.** Technical Context names
  `packages/shared/src/limits.ts` as the single source of the six limits, the
  templates that fill them, the contract's binding table in §6, the two checks
  (`copy-values.spec.ts` and T100's no-literal limb), and the agreement classes the
  test pins, so a CMV change either renders correctly or fails the build. T054
  builds the mapping from the slots, and T140's policy and T035's test read the
  same constants.
- **Gate 2 → Single-Reference Sufficiency is re-read: PASS.** The row now names
  the two plan values the closed CMV list does not enumerate — the rail width and
  the Unicode data pin — and the copy's one registered record, so its claim that
  no rule is discharged from an unnamed source holds for the copy as it holds for
  the design values. Gate 1 → V is re-read for the copy's two measurable rules (the
  segment bound and the numerals' source) and stays PASS; Gate 1's other
  principles, Gate 2's other rows, and Gate 3 are untouched, and
  `checklists/copy.md` marks the four items with the review recorded there.

### Re-evaluation after the 2026-11-03 EX-007 scope pass (2026-11-03)

Complexity Tracking row 4 and the register's `EX-007` named the drawer's open and
close with its three dismissals, its `aria-expanded` open state, the focus
returning to «المزيد», the sign-out confirmation, and the bottom bar's rendered and
visible state as work R2 verifies, while T132 already asserts the opener, the
three dismissals, the focus return, the open state, and the bar's rendered state
structurally, and T095 already asserts the account menu's items, their link
targets, and the sign-out confirmation's markup. Row 2 carried the same over-broad claim into the coverage
exclusion. The pass keeps the deferred set to the frame's page behaviour alone —
what only a rendered page can exercise — and returns the component-level
assertions to R1; no requirement, criterion, success criterion, CMV row, entity,
page, dependency, or task identifier moves, and no rule is added.

- **The deferred set is page behaviour only.** `EX-007` now names the focus
  landing on the destination page's heading (AC-024); the overlays' stacking
  order and the consumption of an activation outside them (AC-024, AC-042,
  AC-051); the drawer's focus containment (AC-024); the account menu's live open,
  its runtime dismissal, the sign-out confirmation's result, and the
  ended-session state it produces (AC-051, AC-053); the bar's scroll-hide
  (AC-042); the guest's redirection on a page that carries the frame (AC-024,
  AC-042, AC-052); and the label cut at the inline-end (AC-042). Each stays beside
  the criterion that closes it, and the row's end point is unchanged: R2, the
  first page that renders the frame (ADR-139). Row 2, the coverage exclusion,
  names the five whose lines no test here executes — the focus landing, the
  drawer's focus containment, the stacking order and the consumption, the
  scroll-hide, and the header's runtime behaviour — as the 2026-11-03
  clarifications fix (Session 2026-11-03 (6)); the guest's redirection and the
  label cut stay in the exception because AC-024, AC-052, and AC-042 bind them to
  R2, with the redirect rule and the label's whole text asserted structurally
  here. The drawer's focus containment stays inside `EX-007`'s scope: only its
  coverage line joins row 2's exclusion, and AC-024 remains the criterion that
  closes it at R2.
- **What the structural suite asserts stays in R1.** The account menu's three items and
  the sign-out confirmation's markup (T095, T102); the drawer's opener, its
  `aria-expanded` open state, the collapse control, Escape, and an outside
  activation closing it with the focus returning to «المزيد», the bottom bar
  staying rendered and visible under it, and an item's activation closing it as
  part of the navigation (T132, T101, T103). These are component-level assertions,
  not the rendered page ADR-139 decision 3 names, so the exception no longer
  claims them, and row 2's coverage exclusion now names only the page-level lines
  while the component-level behaviour stays inside the target.
- **The current statements are corrected in place.** The specification's frame
  assumption, the Verification Notes' accessibility sentence,
  `contracts/ui-contracts.md` §8's runtime paragraph, the Gate 2 Threat and
  Control Map row T21 (plan.md line 442), and US5's checkpoint no longer send the
  drawer's open and close, its open state, the confirmation's markup, or the bar's
  visibility under the drawer to R2. The 2026-10-31 and 2026-11-02 sections above
  record the boundary as it was read then; where their lists name those items,
  this note is the reading that governs, and `checklists/security.md` CHK027 and
  `checklists/ui.md` CHK039 stay marked with their recorded reviews, read through
  it.
- **Gate 1 → VIII is re-read: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
  `EX-010`, `EX-011`, and `EX-012`.** US5's composition and its component-level
  behaviour are verified without another story; the page behaviours wait for R2,
  and each has the criterion that closes it. Gate 1's other principles, Gate 2,
  and Gate 3 are untouched.

### Re-evaluation after the 2026-11-03 H3 pass (2026-11-03)

Gate 1 → X reported PASS while the layout it describes carries neither module's
full set of Principle X's three directories: `auth` ships `routes/` and `service/`
and no `repository/`, and `users` ships `service/` and `repository/` and no
`routes/`. The plan already called the shape a deviation, but named only
`docs/architecture.md` §1.1 and §2 as the thing deviated from, and the principle
is the higher authority. The pass reclassifies the gate row as a justified
deviation and makes Principle X the named subject in Complexity Tracking.

- **Gate 1 → X is re-read: PASS with a justified deviation (`Complexity Tracking
  row 26`).** The principle's "Each module has its own routes, service, and
  repository" is the rule the layout departs from; the row states the two absent
  directories, and the justification stands unchanged — a hand-written
  `auth/repository` would be a second writer of the library's tables, and an
  empty `users/routes/` is a route surface no requirement names. The owner
  (`repository owner`) and the review date (2026-12-01) are unchanged.
  `docs/architecture.md` §1.1 and §2 keep the canonical
  `{routes,service,repository}` layout and are not edited.
- **Complexity Tracking row 26 names the principle.** Its type is now
  `Violation (Principle X; module layout)` and its item text quotes the clause the
  layout departs from, so the deviation is classified against the constitution
  rather than against the architecture document alone; the type names what the
  constitution's letter is departed from, while the row's justification is what
  makes the gate pass. The rejected alternatives are unchanged.
- **Gate 2's two references are aligned.** Project Structure and Debt Control and
  Documentation now name Principle X beside `docs/architecture.md` §1.1 and §2;
  their status is unchanged, because the deviation belongs to a principle and is
  carried by Gate 1 → X and row 26.

No requirement, acceptance criterion, success criterion, CMV row, entity, page,
dependency, or task identifier moved, and no other gate's status changed.

### Re-evaluation after the 2026-11-03 M1 pass (2026-11-03)

Gate 2's T13 row bounded the forgery control at "the seven state-changing actions
the slice ships", while `contracts/auth-api.md` §2.1 requires the token on
**every** state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`) and §5.2–§5.11
defines ten `POST` routes in R1. The row now names those ten, so the control cell
states the surface the contract fixes instead of a count that leaves two routes —
`sign-out` and `sign-out-all` — outside it. The pass corrects the plan's
restatement; it changes no requirement.

- **The control cell names the routes the contract defines.** `sign-up`,
  `sign-up/verify`, `verifications/resend`, `sign-in`, `sign-out`, `sign-out-all`,
  `password/forgot`, `password/forgot/verify`, `password/reset`, and
  `password/change`, with the change-password request's existing note kept because
  no page offers it here. The token's issue-and-rotate route, `SameSite=Lax`, the
  allowlisted `Origin`, and the refusal of a mutation without the token are
  unchanged.
- **FR-044 and AC-048 are not edited.** FR-044's normative sentence already reads
  "Every state-changing request issued from a browser session MUST be protected
  against request forgery", so the requirement covers all ten routes as it stands;
  the enumeration it carries, and AC-048's matching one, name actions rather than
  routes — the code entry is one action across `sign-up/verify` and
  `password/forgot/verify`, and the two sign-out requests are the session actions
  FR-010–FR-013 own. The requirement's text, its clarifications, and every
  acceptance criterion stay as they are, and
  `checklists/security.md` CHK013 and CHK038 keep their recorded readings of that
  text. (Superseded 2026-11-03 by the (9) clarification: the two sign-out actions
  now join FR-044's and AC-048's enumerations, because this slice serves both
  requests and each enumeration claims to name every action the slice ships; the
  ten-route control cell, this row's evidence, and every gate status are
  unchanged.)
- **The verification cell claims no count it does not test.** T076 asserts the
  middleware against a mutation and the change-password request, so the row cites
  that scope; T019 stays the middleware and the rotation, and T039 and T082 the
  flows. No task's scope grows, and no identifier moves.

Gate 1, Gate 2's other rows, and Gate 3 are untouched; no requirement, acceptance
criterion, success criterion, CMV row, entity, page, dependency, or task
identifier moved, and no rule is added.

### Re-evaluation after the 2026-11-03 M2 pass (2026-11-03)

Row 7 recorded the PgDog choice, its named fallback, and the review date, but not
the two further records the Licence treatment for infrastructure services
requires of a plan using a network service: the obligation its licence imposes
and the operational coupling it creates. The pass completes the row and points the
gate evidence at it; the owner stays `repository owner` and the review date stays
2027-04-06, as `ROADMAP.md` line 117 fixes it.

- **The licence obligation is recorded.** PgDog is AGPL-3.0 and is consumed over a
  connection, never shipped to or linked into a merchant's browser or device, so
  Dependency Governance's prohibition does not reach it and the
  infrastructure-services treatment applies. The row fixes the reading R1
  follows: the unmodified upstream release, its licence text and notices
  retained, and no modification; a patched image would count as a modification
  and would oblige the platform to offer the modified version's Corresponding
  Source to every user interacting with the service over the network (AGPL-3.0
  §13). The obligation binds the service's source, not the platform's, because
  PgDog is a separate process reached over the PostgreSQL wire protocol.
- **The operational coupling is recorded.** The pre-1.0 hop stands in front of
  PostgreSQL in every environment — the development composition R1 writes and the
  staging and production deployments that consume the same `DATABASE_URL`
  contract (row 25) — so the API, the migrator, and the health probe's `SELECT 1`
  reach the database only through it; a protocol-breaking release, a failed
  upgrade, or an outage in the pooler stops every environment at one point, an
  upgrade is taken across the three together, and the image is pinned by digest
  and moved deliberately.
- **The fallback and the review date are unchanged.** PgBouncer remains the named
  fallback the register requires, reachable by one connection-string change plus
  the development composition's fallback profile; the row's rejected alternative
  states why the slice keeps PgDog and why no pooler at all is not an option at
  the capacity model's 3,000–5,000 concurrent sessions.
- **The gate evidence cites the row.** Gate 2 → Dependency Governance names PgDog
  as the one copyleft network service outside the shipped-code prohibition and
  cites row 7; Gate 2 → Technology Standards records that the register's pre-1.0
  requirement for a named fallback and a review date is discharged there; and the
  Technical Context's Storage line names the three records the row carries.
  Neither gate restates the obligation's terms, so the row stays the single
  record.

Gate 1 and Gate 3 are untouched; no requirement, acceptance criterion, success
criterion, CMV row, entity, page, dependency, or task identifier moved, no gate's
status changed, and no rule is added.

### Re-evaluation after the 2026-11-03 L4 pass (2026-11-03)

The constitution's Documentation rule requires the README's setup, development,
testing, and deployment sections to be verified by following the readme on a
clean checkout before a release. R1 writes the README through T121–T123 and is
not the releasing slice: `ROADMAP.md`'s Release gate fixes the first release at
R12's acceptance. Complexity Tracking row 28 records the deferral with its owner
and review date, and the Documentation gate cites it.

- **The row is the record.** Row 28 names the verification, the rule that
  requires it, the slice that performs it (R12), and the review date
  (2027-01-31), so the obligation is findable rather than implicit in the
  release gate's prose. It is the only record of the deferral; no Verification
  Notes bullet restates it.
- **The authoring stays in R1.** T121 writes the four sections, T122 records the
  governance check's result, and T123 records the quickstart run. That evidence
  is a developer-workspace run against provisioned services, not the
  clean-checkout proof, so the row distinguishes the two rather than counting
  one as the other.
- **The gate cites the row.** Gate 2 → Documentation now states that the
  clean-checkout verification is deferred to the release gate, so the rule is
  judged with the deferral in view and not read as fully discharged at R1's
  acceptance.
- **No decision record accompanies the row.** The rule already times the
  verification before a release and the roadmap already names that release, so
  the row records where the duty falls rather than choosing a new rule; no
  threshold, owner, or slice assignment is invented.

Gate 1 and Gate 3 are untouched; no requirement, acceptance criterion, success
criterion, CMV row, entity, page, dependency, task identifier, or decision-record
count moved, and no gate's status changed.

### Re-evaluation after the 2026-11-03 Row 2 and constitution-version pass (2026-11-03)

Two statements of present fact had fallen behind the records they restate, and both are corrected in place.

- **Row 2's count matches the row.** The coverage exclusion's closing sentence
  named four behaviours while Complexity Tracking row 2 names five, because
  Session 2026-11-03 (6) added the drawer's focus containment to the exclusion.
  The sentence now names all five — the focus landing, the drawer's focus
  containment, the stacking order and the consumption, the scroll-hide, and the
  header's runtime behaviour — and records the clarification session that fixed
  the set. The drawer's focus containment stays inside `EX-007`, where the
  exception's bullet and row 4 already name it with AC-024; only its coverage
  line joins row 2's exclusion, so the two records say the same thing. No
  requirement, criterion, success criterion, CMV row, entity, page, dependency,
  or task identifier moves, and no task's scope changes.
- **The constitution version is read from its sources, not restated.** ADR-147
  moved the constitution on 2026-11-02 to 6.3.1, and the passages that stated a
  version — Technical Context's Primary Dependencies, Gate 2 → Technology
  Standards, and the Ownership Map's `version.json` entry — stated 6.3.1 for
  this pass; they now name `.specify/memory/constitution.md` and read the
  current version from `.specify/memory/version.json`, because Governance
  forbids a document's own literal version. The 6.3.0 attribution stays where
  the subject is the register amendment itself — the register-closure section
  and the re-evaluation entries that
  record ADR-146 — because that amendment happened at 6.3.0. ADR-147 joins
  "Reaffirmed decision records" and Gate 1 → V, where the trade name's
  unvocalised form and the copy's no-diacritics rule are now one statement.
- **No gate status changed.** Gate 1 → X remains PASS with a justified deviation
  (Complexity Tracking row 26), Gate 1 → VIII remains PASS with exceptions
  `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`, and the other
  principles, Gate 2's rows, and Gate 3 are untouched.

### Re-evaluation after the 2026-11-03 A3, C2, I1, and I2 pass (2026-11-03)

The pass read Gate 2's rows against the records they restate, the Complexity
Tracking table against the foundation tasks that carry no requirement, and the
Documentation tree and the Summary against the directory and the frame's
requirements. Three statements had fallen behind the records they restate, and
one duty had no record of its own; each finding is answered in place.

- **A3 — the Glossary row separates the merchant's account from the credential
  table.** The row said "account" was used only as the Glossary's `User`, while
  `data-model.md` §6 defines `accounts` as the library's credential store, so the
  word could be read as a second entity or the table as one. The row now states
  that a merchant's account is the Glossary's `User` and that the `accounts`
  table is the library's credential store, which represents no entity. Gate 2 →
  Glossary's status is unchanged: the terms it judges are still the Glossary's,
  and a table is not a term.
- **C2 — five foundation duties have a row of their own.** The schema-version
  guard (T126), the public-interface documentation gate (T125 and T128), the
  module-responsibility header check (T127), the coverage gate (T022), and the
  continuous-integration pipeline (T024) each serve a named gate and carry no
  `FR-###`/`AC-###` pair; their tasks cite row 1 (T022 cites row 2) as the
  slice's umbrella, which records the shape of the slice rather than the gate
  each duty answers. Rows 29–33 name the task, the gate it serves, and the
  reading that justifies it, and the existing rows keep their numbers. No row
  restates another: row 12 keeps the provider's register-gap closure and licence
  obligation while row 33 records the pipeline's gate duties, and row 2 keeps the
  page-level coverage exclusion while row 32 records the threshold and the
  project split. The gates cite the new rows in place — Gate 1 → III, Schema and
  Migration Control, Documentation (twice), and Module Discipline and Development
  Workflow — and every task identifier and every citation in `tasks.md` is
  unchanged.
- **I1 — the Documentation tree lists the eight checklists the directory
  holds.** `copy.md` and `verification.md` join `requirements.md`, `flows.md`,
  `security.md`, `ui.md`, and `data.md`, and `operations.md` is the eighth, added
  after this pass. The 2026-11-01 F1 bullet above records the tree as it stood
  then, with five files; the directory is the record and this note is the
  reading that governs.
- **I2 — the Summary takes FR-020's surface order.** The Summary listed the
  bottom bar before the footer band, while FR-020 enumerates the header, the
  sidebar, the footer band, and the bottom bar, and FR-052 calls the bottom bar
  the frame's fourth surface. The Summary now follows that order and names the
  bottom bar as the fourth surface, so the plan's opening statement and the
  requirement it restates agree.

Gate 1 is re-read: PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`,
`EX-011`, and `EX-012`, and its only changes are the citations in Gate 1 → I
(rows 29–33) and Gate 1 → III (row 32). Gate 2 is re-read: PASS, with the
Glossary and Documentation rows corrected and Schema and Migration Control,
Documentation, and Module Discipline and Development Workflow citing the new
rows. Gate 3 is untouched. No requirement, acceptance criterion, success
criterion, CMV row, entity, page, dependency, or task identifier moved, and no
rule is added.

### Re-evaluation after the 2026-11-04 frame-boundary pass (2026-11-04)

The specification's boundary between the frame behaviour R1 verifies structurally
and the page behaviour R2 verifies was stated in SC-005 and restated in several
passages; one restatement had drifted, claiming that the scan and the
keyboard-only pass waited for R2 on "the same boundary its two-width behaviour
already observes" while the two-width behaviour is verified structurally here.
The pass makes SC-005 the boundary's single statement and turns every other
passage into a citation of it, without moving a behaviour across the boundary.

- **SC-005 is the single statement.** The criterion keeps the full split and both
  lists as they stand: the sidebar's two-width behaviour, the bottom bar's
  drawer-opening behaviour, and the header's single-row behaviour at 320 CSS px
  are asserted structurally here, and the seven page behaviours it names wait for
  R2 (ADR-139). US5's Independent Test, both frame passages of the Test Coverage
  Request, AC-024, SC-006, the frame Assumption, the Verification Notes'
  accessibility sentence, the phase-0 notes for the drawer and the
  ended-session state, and `EX-007` now cite "the boundary SC-005 fixes" and keep
  only the list each needs for its own claim. No behaviour changes side, and no
  list is reworded or shortened.
- **The accessibility criterion keeps its assertions.** SC-006's false
  comparison is replaced by the citation, and its markup-level coverage — every
  frame control's accessible name, role, and keyboard reachability, the header's
  four controls and the guest's three at 320 CSS px, the ended-session state's
  announcement and focusable heading, and the bare pages' announced state changes
  — is unchanged.
- **The deferred Assumptions pass is done.** Four remaining FR restatements are
  trimmed: the administrator-out-of-band Assumption records the data-model fact
  FR-028 leaves open rather than repeating its role and audit-log rule; the
  icon-set Assumption stops enumerating the duties FR-020 owns; the SMS-delivery
  Assumption cites SC-001, SC-003, and SC-009 instead of restating their
  measurement rule; and the merchant-data Assumption no longer repeats FR-018's
  rule that a merchant cannot delete their own account. Every slice boundary
  stays, because a boundary is not a restated rule.
- **Gate 1 → VIII is re-read: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
  `EX-010`, `EX-011`, and `EX-012`.** `EX-007`'s exact scope, its owner, and its
  2026-12-01 review date are unchanged; the row now cites SC-005 for the split
  its scope applies. Gate 1's other principles, Gate 2, and Gate 3 are
  untouched. No requirement, acceptance criterion, success criterion, CMV row,
  entity, page, dependency, or task identifier moved, and no rule is added.

### Re-evaluation after the 2026-11-04 analyze pass (C1, H2, L1, L2)

Four statements of present fact had fallen behind the records they restate, and
each is corrected in place. ADR-148's amendment moved the constitution after the
passages below were written; the corrections are bookkeeping, and the closing
paragraph records what did not change.

- **C1 — the constitution's version is read, never restated.** Technical
  Context's Primary Dependencies, Gate 2 → Technology Standards, the 2026-11-03
  constitution-version bullet, the Ownership Map's `version.json` entry, and the
  B8 register-closure check no longer name a version of their own: each names
  `.specify/memory/constitution.md` and reads the current value from
  `.specify/memory/version.json`, as Governance requires. The historical
  attributions stay as they are — 6.3.0 where the subject is ADR-146's register
  amendment and 6.3.1 where it is ADR-147's trade-name amendment.
- **H2 — the P1 checkpoint names what its gate tests close.** The checkpoint
  named US1, US2, and US7 and then reached into the Polish phase for T137. It now
  states what T073–T077 each close on the P1 surface, and names T137 explicitly
  as the task that opens AC-035's remaining part on US3's recovery route after
  T085; T137 keeps its place in the Polish phase.
- **L1 — the Documentation tree lists the eight checklists the directory
  holds.** `operations.md` joins the tree's file list, which names it, and the
  count is corrected to eight in the 2026-11-03 I1 bullet and in Gate 1's status
  summary.
- **L2 — the slice carries eight identity increments.** Complexity Tracking
  row 1 said nine while Phase B defines B1 to B8; the count is corrected.

No gate status changed: Gate 1 → X remains PASS with a justified deviation
(Complexity Tracking row 26), Gate 1 → VIII remains PASS with exceptions
`EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`, and the other
principles, Gate 2's rows, and Gate 3 are untouched. No requirement, acceptance
criterion, success criterion, CMV row, entity, page, dependency, or task
identifier moved, and no rule is added.

### Re-evaluation after the 2026-11-04 B8 version-statement pass (2026-11-04)

B8's register-closure check still carried the version chain in an appositive
after `.specify/memory/version.json` — "the register amendment recorded by
ADR-146 at 6.3.0 and moved to 6.3.1 by ADR-147" — so the one passage that reads
its version from `version.json` also pinned a value, and ADR-148 had already
moved it to 6.3.2. The appositive is deleted and the sentence ends at
`version.json`; no version is written in its place. The reading C1 recorded for
this passage — that it names no version of its own — now holds for its whole
text, and the historical attributions stay where the subject is ADR-146's
register amendment and ADR-147's trade-name amendment.

No gate status changed: Gate 1 → X remains PASS with a justified deviation
(Complexity Tracking row 26), Gate 1 → VIII remains PASS with exceptions
`EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`, and every other
principle, Gate 2's rows, and Gate 3 are untouched. No Complexity Tracking row
was added, removed, renumbered, or reworded: the table still carries its
thirty-four rows and each row's owner and review date stand. No requirement,
acceptance criterion, success criterion, CMV row, entity, page, dependency, or
task identifier moved, and no rule is added.

### Re-evaluation after the 2026-11-04 SC-004 clarification and ADR-148 bookkeeping pass (2026-11-04)

Two statements had fallen behind the records they restate. The 2026-11-04
clarification added `phone` to SC-004's masked set and named the assertion that
verifies the echo, and ADR-148 registered the Glossary's **Shell** term with
**Frame** as its accepted synonym. Both corrections are made in place; no rule is
added.

- **The enumeration comparison names all four masked values.** The Verification
  Notes' enumeration paragraph now states that the text is compared after masking
  `requestId`, `phone`, `codeExpiresAt`, and `expiresAt`, each replaced by a fixed
  placeholder, that the field names, their types, the header set's names, the
  response path, and the duration stay compared, and that **outside the
  comparison** the test asserts each response's `phone` equals that case's own
  submitted number in the canonical form, so the echo is verified rather than
  left uncompared (SC-004; Clarifications 2026-11-04). The tolerance, the 200
  samples per case, the 20-request warm-up, and the 5% trimming are unchanged.
- **ADR-148 is reaffirmed and the Glossary row records the synonym.** The record
  joins "Reaffirmed decision records" with the provision it supplies — **Shell**
  is the approved term and **Frame** its accepted synonym, confined to the text
  that already carries it — and Gate 2 → Glossary gains one clause recording that
  reading, so the row's claim that every term is the Glossary's now covers the
  composition too (ADR-148; constitution 6.3.2, 2026-11-04).

Gate 1's status is unchanged: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012`. Gate 2 is re-read: PASS, with the Glossary row
carrying the synonym clause and Documentation's reaffirmation claim now true for
every ADR the plan names. Gate 3 is untouched. No requirement, acceptance
criterion, success criterion, CMV row, entity, page, dependency, or task
identifier moved, and no Complexity Tracking row was added.

### Re-evaluation after the 2026-11-04 verification-notes suite list and L1 wording pass (2026-11-04)

Two sentences named a fact more narrowly than the artifacts they restate, and
each is corrected in place. Both are text corrections; no rule is added.

- **The enumeration comparison names all three suites.** The Verification Notes'
  enumeration paragraph named `apps/api/test/integration/auth/sign-in.spec.ts`
  alone, while T037 and T082 run the same SC-004 comparison — the four masked
  values and the same tolerance (200 samples per case, median ≤ 50 ms, p95 ≤
  150 ms) — in `apps/api/test/integration/auth/sign-up.spec.ts` and
  `apps/api/test/integration/auth/recovery.spec.ts`. The sentence now names the
  three suites, one per operation, each asserting the same masked values and the
  same tolerance the paragraph states.
- **"with the file named" attaches to the tree.** L1 said the count was corrected
  to eight in the 2026-11-03 I1 bullet and in Gate 1's status summary "with the
  file named", but Gate 1's status summary states the corrected count and names
  no file. L1 now attaches the naming to the Documentation tree's file list,
  which carries `operations.md`, and leaves Gate 1's summary stating the count it
  already states.

No gate status changed: Gate 1's status is unchanged — PASS with exceptions
`EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012` — Gate 2 remains
PASS, and Gate 3 is untouched. No Complexity Tracking row was added, removed,
renumbered, or reworded: the table still carries its thirty-four rows. No
requirement, acceptance criterion, success criterion, CMV row, entity, page,
dependency, or task identifier moved, and `tasks.md` keeps its 144 tasks.

### Re-evaluation after the 2026-11-04 C1 and C3 analyze pass (2026-11-04)

The analyze pass found two statements the records had outrun. Both are corrected
in place: no rule is added, and nothing they cite moves.

- **C1 — the unit-suite roots are in the Ownership Map.** The Structure
  Decision placed the unit tests in `__tests__` directories under
  `packages/shared/src/**` and `apps/api/src/**`, while the map carried no row
  for either root. Those are two of the three roots T022 wires into the unit
  project, and they are where T033 and T034 (shared) and T035, T036, T056, and
  T057 (API) write their suites. The map now carries both rows —
  `packages/shared/src/**/__tests__/**` and `apps/api/src/**/__tests__/**`,
  each owned by 001-identity-foundation, written here, and non-exclusive on the
  pattern of the `apps/api/test/**` row, because a later slice adds its own
  suites in the same root. The Structure Decision keeps its `__tests__`
  sentence and now points at those two rows, so each root has one owner in the
  map and the prose no longer stands as their only record.
- **C3 — the boundary is named by the six composition tasks.** A2's clause in
  Implementation Sequencing and B6's closing sentence named "`tasks.md`'s US5
  phase (T101–T106)" and "the US5 tasks (T101–T106)" as the one boundary they
  share, while US5's phase carries fourteen tasks (T094–T099, T132, T133, and
  T101–T106), so the name reached seven tasks the boundary does not cover. Both
  now name the six composition tasks (T101–T106), which are exactly the tasks
  that build the shell primitives. The phase and every task identifier stay as
  `tasks.md` states them.

No gate status changed: Gate 1 → X remains PASS with a justified deviation
(Complexity Tracking row 26), Gate 1 → VIII remains PASS with exceptions
`EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`, and every other
principle, Gate 2's rows, and Gate 3 are untouched. No Complexity Tracking row
was added, removed, renumbered, or reworded: the table still carries its
thirty-four rows. No decision record was added or amended, no CMV row moved, and
no requirement, acceptance criterion, success criterion, entity, page,
dependency, or task identifier changed; `tasks.md` keeps its 144 tasks.

### Re-evaluation after the 2026-11-04 threat-map verification audit (2026-11-04)

Gate 2 → Threat and Control Map's Verification column was written before the
renumbering passes and the record-appending tasks arrived, so several cells named
a task that does not assert the control they sit beside: `T034` stood as a
general container for "the value rules" although its description covers the
sign-up field rules and the city list alone, and `T142` was cited as though it
were a test although it appends record 15. The column is re-derived from each
task's own description in `tasks.md`, and the rule that governs it is now stated
above the table: **a Verification cell cites only a task whose description
asserts the control; documentation tasks (ADR append, README, runbook) never
appear in this column.** Five cells changed; the Control, Requirements, and
Residual exposure cells are untouched, so no control moved.

- **T03 (FR-029, FR-006 and FR-008's timing rule).** The cell cited `T142`,
  which appends record 15 and passes with the refusal's wait removed; a
  documentation task cannot fail with the control. It now names `T073` alone,
  which measures the silent refusal one-sided against a successful 202 — median
  shortfall ≤ 50 ms and p95 ≤ 150 ms over 200 samples per case after a
  20-request warm-up with the top and bottom 5% dropped.
- **T06 (FR-034, FR-033).** The cell cited `T037`, which asserts no row after
  the form, none after an incorrect code, one account at verification, the
  existing/blocked/administrator outcomes, and the alternate spelling — not the
  five-entry bound or the aggregate ceiling. It now names `T036` (the
  incorrect-entry bound counting only a wrong live value, with expiry, the
  verified state's lifetime, and the replacement rule) and `T137` (the ceiling
  the two number keys produce: three account-creation and three recovery
  requests per number each allow five wrong entries, the fourth request on
  either key is refused, and no separate code-entry budget exists), beside
  `quickstart.md` Scenario 11.
- **T14 (FR-045, FR-046).** The cell cited `T034` as "the value rules". That
  suite asserts presence, the 100-code-point bound, the emoji predicate, and the
  city list — an input-alphabet rule that leaves output encoding in place — so
  it verified no part of this control. It now names `T076` (the encoding removed
  and the three script-source allowances) and `T021` (the nonce), and `T034` no
  longer appears in this row.
- **T19 (FR-035).** The cell cited `T034`, which exercises neither the 12–128
  character rule, the vendored digest membership test, nor the scrypt profile.
  It now names `T035` (the policy and the scrypt profile: the three refusal
  reasons, the membership test, a weakened or unrecognised storage form
  refused, and the pending password held as a `$wafar$scrypt$` value), `T135`
  (the same profile on every password-setting path, the change path included),
  `T088` (the new-password step's policy statement and its three reason
  messages), and `T111` (the policy on the provisioning path).
- **T20 (FR-031, FR-006).** The cell cited `T034`, which asserts no uniqueness
  rule at all. It now names `T030` (the unique `phone_number` constraint),
  `T033` (the accepted spellings and the format refusal), `T037` (an alternate
  spelling reaching the existing-account outcome with one `users` row), and
  `T038` (two simultaneous sign-ups and two simultaneous entries of one correct
  code each producing at most one account and one session, with no partial
  account and no live pending request).

The remaining seventeen rows were re-read against `tasks.md` and keep their
cells: each cites a task whose description asserts the control, and no other
documentation task appears in the column. No gate status changed: Gate 1's
status is unchanged — PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012` — Gate 2 remains PASS, and Gate 3 is untouched.
No requirement, acceptance criterion, success criterion, CMV row, entity, page,
dependency, or task identifier moved; `tasks.md` is unchanged and keeps its 144
tasks, and no decision record or Complexity Tracking row was added.

### Re-evaluation after the 2026-11-04 administrator first-sign-in service pass (2026-11-04)

AC-030 delivers the administrator's first sign-in at the behaviour level with no
page, and the plan already carried two of its three pieces — the provisioning CLI
in B2 and the password-change service with its `AdministratorPasswordChange`
branch in A8 — but it did not name the service that accepts the first sign-in,
`signInAdministrator`, in its sequencing, its source tree, or its threat map.
`tasks.md` already carries the pair this pass names: T112 builds the service and
T108 asserts the accepted first sign-in, the restriction, the forced change, and
the session's end. `research.md`, `data-model.md`, and `contracts/auth-api.md`
already name the service, so this pass adds no component and closes only the
plan's own gap.

- **B2 names the service.**
  `apps/api/src/modules/auth/service/sign-in-administrator.ts` (T112, asserted by
  T108) joins the adapter's server-side calls and the provisioning CLI. It
  exposes no public route and is called only from R13's administrator surface,
  which arrives later. It returns a session restricted to the forced change:
  every ordinary action is refused with `PASSWORD_CHANGE_REQUIRED`, while the
  password change and ending the session remain available (FR-028, AC-030).
- **The source tree carries the file.** The `modules/auth/{routes,service}/`
  entry now names `service/sign-in-administrator.ts` beside the account-creation
  and password-change services, so the file the tasks build has a place in the
  planned layout.
- **T17 states the delivery and its consumer.** The administrator boundary row
  now records that the first sign-in is behaviour with no page, that R13's
  surface is its only consumer, and that this slice ships no administrator
  surface at all; T110, the structural test that asserts that absence, joins the
  row's Verification cell. The row's Requirements and Residual exposure cells are
  unchanged.

No `FR-###`, `AC-###`, or `SC-###` changed; no page and no public route was
added, and no gate status moved — Gate 1 remains PASS with exceptions `EX-007`,
`EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`, Gate 2 remains PASS, and
Gate 3 is untouched. `tasks.md` is unchanged and keeps its 144 tasks; no
ownership row, decision record, Complexity Tracking row, or data-model entity was
added, because `apps/api/src/modules/auth/**` already owns the file.

### Re-evaluation after the 2026-11-04 transport-wait measurement pass (2026-11-04)

Two measurements rested on a fake whose acceptance duration the plan never fixed.
`quickstart.md` §1 and §2 state that tests and development run
`SMS_TRANSPORT=fake`, and the fake answered `accepted` immediately, so the port's
rolling estimate was `0`, the silent refusal waited `0`, and the two measurements
that depend on a wait proved nothing about it. The pass fixes the contract, the
two measurement conditions, and the work margin; no requirement, acceptance
criterion, success criterion, CMV row, entity, page, dependency, exception,
Complexity Tracking row, or record count moves.

- **The fake's duration is a declared key.** `SMS_FAKE_ACCEPT_MS` (0 to 750 ms,
  `0` by default, named in `.env.example`, validated at boot) fixes the wait the
  fake takes before it answers `accepted`, inside the transport call — the place
  the adapter's provider wait occupies — so the wait is inside the request and
  inside every duration a suite or the load run measures, and the fake stays
  deterministic with the same configured delay on every dispatch. At the default
  `0` the estimate is `0`, which is right for an instant channel and is no
  evidence that the wait exists.
- **The estimator has a window and a unit test.** The refusal's wait is the
  median of the last sixteen accepted dispatch durations, capped at 750 ms and
  reset with the process. Sixteen is smaller than the 20-request warm-up the
  timing protocol runs, so the estimate has converged before the measured
  samples begin, and its unit test
  (`apps/api/src/modules/auth/sms/__tests__/acceptance-estimate.spec.ts`) pins
  the empty window, one sample, an even and an odd window, eviction, the cap, and
  the reset, so the median is tested directly and not only through a response's
  duration. The source tree names the `sms/` directory that holds it, and the
  test's path is the API unit root the Ownership Map already carries, whose
  writer list now names T026.
- **T073's pair is no longer vacuous.** The suite sets the fake to **200 ms**,
  above both tolerances, so the success 202 waits it, the estimate converges on
  it, and a refusal whose wait is deleted falls about 200 ms short, failing the
  median limb (≤ 50 ms) and the p95 limb (≤ 150 ms). At the default `0` the pair
  passed on equal work alone, which is the hole this pass closes; the suite
  restores `0` afterwards and its timeout is sized for the pair's 400 samples.
- **The load run measures the wait and the work.** `### The SC-009 load profile`
  fixes the fake at a declared nominal **50 ms** inside every dispatch, fails a
  dispatch faster than it, and reads p95 a second time as work alone — a
  dispatch's measured duration less the declared wait, which is never less than
  the work — with the work-only p95 held to **≤ 250 ms** per operation and in
  aggregate. SC-009's p95 stays 1,000 ms and the adapter's timeout stays 750 ms:
  250 is the share of the 1,000 the work may take, so 250 + 750 = 1,000 covers
  the ceiling the nominal run cannot exercise, while the nominal wait alone
  would leave that case unstated. The p50 comparison now spends 100 ms of its
  150 ms on the work, and that is stated rather than discovered at the gate.
- **`tasks.md` carries the task side in the next `/speckit.tasks` pass.** This
  pass edits the plan, the quickstart, and the port's contract line in
  `contracts/auth-api.md` §7.1. T026 gains the configurable delay
  and the estimator's unit test, its tail gaining FR-029 and AC-031; T073 sets
  its fixture to 200 ms and sizes its timeout for the pair. No identifier, phase,
  or count changes, and `tasks.md` keeps its 144 tasks.
- **The records are amended, not added.** Record 14 (the load profile and its
  verdict) carries the declared wait and the work margin, and record 15 (the
  refusal's mechanism) carries the key, the sixteen-sample window, the unit test,
  and the 200 ms condition. The count stays sixteen — five recorded and eleven
  appended — and no ADR is added, because both subjects are already theirs.
- **The gates are re-read.** Gate 2 → Performance Budgets and Verification
  states the declared wait, the dispatch floor, and the work margin, and Gate 2 →
  Identity, Authentication, and Session Policy states the condition T073 measures
  at. Gate 1 and Gate 3 are untouched: no principle's claim changes and no
  deferred area is opened.

Gate 1's status is unchanged: PASS with exceptions `EX-007`, `EX-008`, `EX-009`,
`EX-010`, `EX-011`, and `EX-012`. Gate 2 is PASS with the two rows above; Gate 3
is untouched. No requirement, acceptance criterion, success criterion, CMV row,
entity, page, dependency, or task identifier moved, and `tasks.md` keeps its 144
tasks; the 750 ms adapter timeout and SC-009's 1,000 ms p95 are unchanged, and no
Complexity Tracking row was added, removed, renumbered, or reworded — the table
still carries its thirty-four rows.

### Re-evaluation after the 2026-11-04 operational-record, dataset, and recovery pass (2026-11-04)

Five operations-checklist items asked for a stated failure mode, a bound, or an
authority where the plan had only a value. CHK008 and CHK009 asked what a
structured record contains and when it is
written; CHK012 asked what happens when a fixed dataset is missing, truncated,
or stale; CHK018 asked what bounds the operational rows; and CHK011 asked
whether the RTO and RPO are the recovery authority. The same pass details the
messaging provider's outage, the post-disaster restore, and the schema rollback
that the specification's FR-055 already names. The plan gains seven paragraphs
in Technical Context, one Verification Note, two CMV annotations, two Gate 2
additions, and the sequencing clauses below; `contracts/auth-api.md` §6 gains
`accountId` and the two `outcome` values in the same change, so the record's
shape still has one authority. No requirement, acceptance
criterion, success criterion, entity, page, dependency, exception, Complexity
Tracking row, or decision-record count moves.

- **The record has a schema and an order (CHK008, CHK009).** Every record
  carries `event`, `level`, `timestamp`, `requestId`, `outcome`, and `reason`
  where the contract names one, plus `accountId` only where an account exists
  and the per-event fields the contract's table names; the schema lives in
  T069's `events.ts` and T018's logger writes it. The record is emitted inside
  the request and before the response, so a response implies the record reached
  the process's stream. A stream that cannot take the line changes no outcome:
  the failure is caught at the request boundary, one stderr line carries the
  `requestId` and the event name, and nothing is retried. The provisioning
  action is the exception, because its record is the audit log's stand-in: a
  failed emit turns its report into a failure that names the account identifier
  and exits non-zero.
- **The operational rows have a bound (CHK018).** A session row is deleted 24
  hours after its revocation or expiry; a pending request when its
  `request_expires_at` passes; a rate-limit counter one hour after its window
  ends, so a key carries at most five rows. The hourly idempotent sweep
  `data-model.md` §14 fixes enforces each bound with one statement per table,
  under an advisory lock, and the bound is the predicate, so a missed or failed
  run is absorbed by the next. The statement reads the bound's index, and the
  load run asserts the live session population before and after its window while
  its own requests create the pending rows and counters, so the measurement
  ceiling is exercised with the rows present. No sweep deletes a `users` or
  `accounts` row (FR-018).
- **The fixed datasets fail at build or boot, and their currency is recorded
  (CHK012).** The city list and the prefix set are build-time modules: a
  missing, unparsable, or truncated file fails the build, and no runtime path
  reads either. The breach list is loaded once at boot, and its line count and
  SHA-256 are verified before the listener opens; a missing or altered file
  stops startup with a non-zero exit, because a shortened list would silently
  weaken FR-035's policy. Its currency is the recorded version, digest, and
  quarterly refresh; a stale list stays in use, and staleness is a maintenance
  finding with a review date, never a runtime refusal.
- **The recovery numbers are the authority (CHK011).** CMV rows 8–9 are the
  slice's single authority — RTO 4 hours for the restore plus the API's start,
  with detection and the decision inside that window, and RPO 15 minutes through
  WAL archiving at 60 s or less plus a nightly base backup — and ADR-142 is the
  arrangement they govern. FR-055 states the state
  at the restore point and promises no continuity; no success criterion measures
  either number, the measurement is R12's, and the quarterly drill is the
  evidence.
- **The outage, the disaster, and the rollback have stated state.** The
  provider's outage stops the two code dispatches and the two notices, leaves
  sign-in, the session actions, the password paths, and provisioning running,
  and never makes `/health` report unhealthy; the post-disaster restore returns
  FR-055's state at the restore point, resets the in-memory estimate, and needs
  the key-encryption key on the new host; the down migration is the exact
  inverse of the up, is exercised in CI and staging before production, and its
  R1 target is the empty pre-R1 schema, so it is used only to withdraw the
  release.
- **The gates and the counts are unchanged.** Gate 1's status is unchanged:
  PASS with exceptions `EX-007`, `EX-008`, `EX-009`, `EX-010`, `EX-011`, and
  `EX-012`. Gate 2 is PASS with the two rows above amended in place; Gate 3 is
  untouched. No requirement, acceptance criterion, success criterion, CMV row,
  entity, page, dependency, or task identifier moved, and `tasks.md` keeps its
  144 tasks; the Complexity Tracking table still carries its thirty-five rows
  and the plan still introduces its sixteen records. The task-side changes —
  T018's throwing-stream case, T032's sweep and down-migration cases, T060's
  field assertions, and T107's provisioning failure path — are carried by the
  next `/speckit.tasks` pass, and `quickstart.md` is not edited by this plan pass
  because the new rules are asserted by the task-side cases and the drill, and
  its scope — the three pages and the shell — does not change.

### Re-evaluation after the 2026-11-04 verification-contract pass (CHK014–CHK018, CHK025–CHK027, CHK029–CHK038)

The verification checklist's eighteen open items asked for one contract rather
than eighteen separate statements. The plan gains **The verification contract**,
one section between the Verification Notes and the SC-009 load profile that
fixes the measurement-point register, each test class's environment, the
enumeration test's reproducibility, the evidence kept, the concurrency and clock
controls, the messaging failure matrix, the two substituted states, the negative
controls, the reference data's failure conditions, the N+1 count, US7's priority
reading, the copy scan's message set, the meaning of "at R1's acceptance", and
the exception crosswalk. The exception register gains the closing criteria, the
paths, and the review-date rule its rows lacked. The Documentation tree gains
`checklists/refusals.md`, which the directory already held, so it now lists all
nine checklists and the acceptance condition reads that count rather than the
earlier eight. No requirement, acceptance criterion, success criterion, CMV row,
entity, page, dependency, or task identifier moved.

- **CHK014 — one measurement point per criterion.** The register names, for each
  of SC-001–SC-009, the test and the task that carries it, the evidence it
  leaves, and the bound it decides. SC-005 and SC-006 are read in halves: R1's
  half has one point, R2's half has none here by design, and the acceptance
  record must say both halves' states rather than reporting either criterion as
  fully met. SC-004's three suites are one protocol, not three measurements, and
  SC-008's scan is one point with four limbs.
- **CHK015 — the register and Complexity Tracking state one set.** The crosswalk
  names each exception's CT row, its exact scope, its closing criteria, and the
  event that ends it. CT rows 2, 4, 18, 20, 21, 22, and 24 now carry the same
  set and the same criteria as `EX-007`…`EX-012`; row 2's coverage exclusion is
  exactly `EX-007`'s scope; row 4 no longer says it "does not restate" the set.
  `EX-011`'s and CT row 22's "five controls" is corrected to **six** — the
  hidden field, the honeypot and minimum time, the refusal order, the two-key
  limits, the security middleware, and the no-CAPTCHA rule.
- **CHK016 — `EX-007`'s scope names every deferred behaviour.** The row's exact
  scope now opens with its paths — the runtime lines of
  `packages/ui/app/components/shell/**` and `apps/web/app/layouts/shell.vue`
  that only a rendered page executes — and carries the overlays' stacking order,
  the outside activation's consumption, the guest's redirection, and the label
  cut Session 2026-11-02 (32) assigns to R2, each beside its criterion. CT row
  2's coverage list gains the three it had omitted — the guest's redirection,
  the label cut, and the frame's scan and keyboard pass — so no excluded line
  falls outside the exception.
- **CHK017 — the message set is closed at four and counted once.** The four keys
  are named (`otp_sign_up`, `otp_recovery`, `notice_password_changed`,
  `notice_signed_out_all`); T100 iterates the exported map, T026 asserts each
  body's length against its class's bound, and a unit assertion compares the
  map's key set with the sorted closed list, so a fifth template fails the scan
  and needs SC-008's amendment.
- **CHK018 — US7's P1 status implies no surface.** US7 delivers six controls on
  US1's and US2's surfaces and no page or route of its own; the P1 checkpoint's
  pass condition is the five integration cases T073–T077 read with US1's and
  US2's criteria, and `EX-011` covers the crossing. CT row 22 states the same
  reading, so the gate cannot be read as a shippable US7 surface.
- **CHK025 — concurrency is deterministic.** A test-only `UnitOfWork` decorator
  (`apps/api/test/support/barrier.ts`) produces each race's three interleavings —
  A first, B first, and both at the barrier — once each, with no sleep and no
  `Promise.race`. The first two are serial; the third asserts the admissible
  outcome set and rejects both rows, neither row, a partial row, or two
  sessions. The rule under test is the conditional write, not the pre-read. The
  nine runs cover T038's two races and T083's change/reset race.
- **CHK026 — the clocks are testable without waiting.** One injected clock is
  the only time control, the process time is set to the same instant, and each
  of the five field bounds — the lock at 15 minutes, the code and its pending
  request at 5 minutes, the inactivity timeout at 30 minutes, and the absolute
  lifetime at 12 hours — is asserted at −1 ms and at the bound. No test sleeps;
  the only real-time reads are the timing suites, which measure durations.
- **CHK027 — every messaging failure cell is asserted.** The matrix covers the
  two kinds — a refusal at acceptance and the 750 ms timeout, advanced on the
  fake clock — at both placements, the fresh request and the re-request, on both
  flows: eight cells, each with its state effects and its
  `auth.otp.dispatch_failed` kind. A failed notice stays outside the matrix as
  best-effort, and nothing is retried or queued.
- **CHK029 — the substituted states state what they cannot prove.** The blocked
  state is T090's seeded `status = 'blocked'` over US2's sign-in path
  (`EX-008`); the removed state is T144's seeded row set, established first and
  then removed in `data-model.md` §3's order. Each names its consequences and
  its limits: neither proves the act, its authorization, its audit record, or
  the operator's surface, which are R13's or R15's.
- **CHK030 — each invariant has a failing case.** The no-email, no-session-cap,
  no-account-before-verification, row-level-creation, and four-clock invariants
  each carry a mutation applied in a rolled-back transaction that must make the
  assertion fail; a test that still passes is a defect. The partial-row fixture
  proves the detector sees a row rather than only counting zero.
- **CHK031 — each class has one environment.** The table fixes the unit, layer,
  integration, end-to-end, accessibility/visual, Lighthouse, load, and
  governance environments, with their services, clocks, transports, isolation,
  and evidence. `pnpm install --frozen-lockfile` is the only networked step;
  Twilio is never called; a `@network` test is opted in and time-bounded at
  120 s; every class runs with `TZ=UTC`.
- **CHK032 — the enumeration run is reproducible.** One host class, one commit
  and build, one committed fixture, the fake at `0 ms`, the real clock, no
  coverage instrumentation, no concurrent suite, and one re-run on the same
  runner class. A run that departs from any of them is marked invalid.
- **CHK033 — the evidence is kept and owned.** The table names the coverage,
  enumeration, load, axe, Lighthouse, visual, keyboard-pass, trace, and
  governance artifacts, their producers, their locations, their retention, and
  their owner. The acceptance run's bundle is attached to the `r1-acceptance`
  release; the committed baselines and keyboard pass live with the repository.
- **CHK034 — the reference data's failure conditions are closed.** The eight
  conditions fail — the missing or truncated city file, a missing governorate, a
  governorate with no entry, a duplicate or non-Arabic name, a count that
  disagrees with `SOURCE`, a digest that disagrees, the prefix set's same
  checks, and the breach list's boot checks. The 22 governorates and the count
  are the `SOURCE` note's; a stale list is a maintenance finding, not a failure.
- **CHK035 — the N+1 claim is reviewable.** The measured request is the sign-in
  in T058: three statements, the same three with one session and with three, and
  a fourth statement fails the suite. That is the count CT row 19's "met"
  records, and the change that would make it fail is named.
- **CHK036 — "at R1's acceptance" is a record.** It is the acceptance commit
  whose B8 run satisfies the eight conditions together — every task checked,
  every checklist closed, the CI gate green, the load verdict and the drill
  records, the P1 checkpoint passed, the six exceptions dispositioned, the
  owner's signature. `EX-007` no longer pretends a date closes it: it ends at
  R2's acceptance, and its review date moves to **2027-01-31** as an escalation
  trigger. The register's new rule 6 states the reading for every row.
- **CHK037 — every exception names its closing criteria.** `EX-008` names
  AC-019 and AC-021; `EX-009` AC-023 and AC-044; `EX-010` AC-016, AC-029, and
  AC-030; `EX-011` AC-031–AC-036, AC-048–AC-050, and AC-055; `EX-012` AC-040 and
  AC-047; `EX-007` AC-024, AC-042, AC-051, AC-052, AC-053, and SC-005/SC-006's
  R2/frame halves. No row now names a task or an event without the criterion it
  closes.
- **CHK038 — every scope names a path and an ending condition.** `EX-007` names
  the shell components and the shell layout; `EX-008` the test and the three
  files it exercises; `EX-009` the test and the three routes; `EX-010` the two
  tests and the four files; `EX-011` the form, the four routes, and the six
  suites; `EX-012` the test, the events module, and the emitting routes. Each
  ends at R1's acceptance or R2's, not at a class of behaviour or a whole story,
  and the register's rule 6 makes that the reading of every row.

The gate status is unchanged: Gate 1 remains PASS with exceptions `EX-007`,
`EX-008`, `EX-009`, `EX-010`, `EX-011`, and `EX-012`; Gate 2 and Gate 3 are
untouched. No Complexity Tracking row was added, removed, or renumbered — the
table keeps its thirty-five rows — and no decision record was added: the plan
still introduces its sixteen. `tasks.md` keeps its 144 tasks. The task-side
changes the contract implies — T038 and T083 naming the barrier and the three
interleavings, T115 and T124 naming the 128-scan matrix and the pass at both
widths, T100 asserting the four-key closure, T034 extending its count and digest
checks to the prefix set, T058 asserting the three-statement count with the
one-and-three-session fixture, T049 and T036 naming the four failure placements,
T022 running the enumeration without coverage, and T117 attaching its report to
the `r1-acceptance` release — are carried by the next `/speckit.tasks` pass, so
no task identifier moves here.

### Re-evaluation after the 2026-11-05 Nuxt version-wording pass (2026-11-05)

Technical Context's Primary Dependencies sentence is introduced as the
Technology Standards register's content, and it said "Nuxt 4.5" — a minor
number the register does not carry: the register's frontend row names "Nuxt
4", the major floor only — so the sentence read the mirror's and the
lockfile's pin as a value the constitution fixes. The Summary already keeps
the major-only form, and the two sentences now agree. This is a text
correction; no rule is added.

- **The list leads with the register's floor and attributes the exact pin.**
  The Primary Dependencies list now leads with Nuxt 4 — the floor the
  register fixes — and the exact pin, 4.5, is attributed to the two records
  that carry it: the detail mirror `Project-Technologies.txt`, which states it
  as the current version, and the committed lockfile, which pins it. The
  parenthetical states that the register carries the major floor only, so the
  minor number is not read as a constitutional fixed value. The Summary's
  "Nuxt 4" is unchanged: it already carries the major-only form the register
  fixes.

No gate status changed: Gate 1 remains PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, `EX-010`, `EX-011`, and `EX-012`; Gate 2 and Gate 3 are untouched. No
Complexity Tracking row was added, removed, renumbered, or reworded — the table
keeps its thirty-five rows — and no decision record was added: the plan still
introduces its sixteen. No requirement, acceptance criterion, success criterion,
CMV row, entity, page, dependency, or task identifier moved, and `tasks.md`
keeps its 144 tasks.

### Re-evaluation after the 2026-11-05 phase-name conversion pass (2026-11-05)

A new reader of Implementation Sequencing met A1–A8, B1–B8, the Checkpoint
A→B, and the P1 checkpoint, linked to `tasks.md` only through the task
identifiers cited in the increments and through those two checkpoints; nothing
stated that `tasks.md` names the same work Phase 1–9 plus a Final Phase. One
line now opens the section with that name conversion. It restates the
correspondence `tasks.md`'s *Plan increments* paragraph already fixes — with
B1 in Phase 1–2 and B2–B7 in Phases 3–9 — and adds only where the two
checkpoints close: Checkpoint A→B in Phase 1–2 and the P1 checkpoint in Phase
5 (US7). It is a naming aid, so no increment, phase, or checkpoint moved and
`tasks.md`'s own phase dependencies were not restated here.

No gate status changed: Gate 1 remains PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, `EX-010`, `EX-011`, and `EX-012`; Gate 2 and Gate 3 are untouched. No
Complexity Tracking row was added, removed, renumbered, or reworded — the table
keeps its thirty-five rows — and no decision record was added: the plan still
introduces its sixteen. No requirement, acceptance criterion, success criterion,
CMV row, entity, page, dependency, or task identifier moved, and `tasks.md` is
unchanged.

### Re-evaluation after the 2026-11-05 numbering-note repair (2026-11-05)

The numbering note under Decision records this plan introduces was written in
Arabic and named a number the register has not assigned: the register ends at
ADR-148 (`docs/DECISIONS.md`), and a record's number is assigned when the record
is appended, never in advance. Governance text is English (AGENTS.md §4), so the
note is now one English blockquote line, and it states what the section's own
intro already promised: the eleven unnumbered records listed below take the next
numbers the register assigns at append time, and T120, T136, T142, and T143
append them. The repair is textual only: no rule is added or withdrawn, no gate
status changed — Gate 1 remains PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, `EX-010`, `EX-011`, and `EX-012`, and Gate 2 and Gate 3 are untouched —
no Complexity Tracking row was added, removed, renumbered, or reworded, and no
decision record was added: the plan still introduces its sixteen, and the numbers
the eleven take stay unnamed until the register assigns them. No requirement,
acceptance criterion, success criterion, CMV row, entity, page, dependency, or
task identifier moved, and `spec.md` and `tasks.md` are unchanged.

### Count reconciliation (2026-11-05)

The re-evaluation records above that state `tasks.md` keeps its 144 tasks, or
that the plan introduces fourteen or fifteen records, describe those passes as
they stood; they are historical statements, not the current counts. `tasks.md`
now carries 175 tasks, T001–T175, after T145–T175 were added by the 2026-11-04
and 2026-11-05 passes, and the plan introduces sixteen records — five recorded as
ADR-141 to ADR-145 and eleven appended at implementation, the count the 2026-11-04
pin-attribution pass also states. The 144-task sentences belong to the 2026-11-04
and 2026-11-05 passes; "fourteen records" is the count the 2026-10-31 SC-009
measurement-validity pass introduced, and "fifteen records" the count the
2026-11-01 repair pass introduced, each superseded in turn and each kept where it
was written. No gate status changed, no Complexity Tracking row moved, and no
FR-###, AC-###, or SC-### identifier moved; 175 tasks and sixteen records are
the counts every later statement reads.

### Re-evaluation after the 2026-11-05 pin-attribution pass (2026-11-05)

Technical Context's Primary Dependencies paragraph introduced its list as the
Technology Standards register's content and then carried exact minor versions
inline — Nuxt UI 4.11.2, Tailwind CSS 4.2, TanStack Query v5, Zod v4, Hono
4.13.5, better-auth 1.6.14 — while the Nuxt pin, 4.5, was attributed by a single
parenthetical. Read as a list of register content, each of those numbers could be
taken as a value the constitution fixes, when the register carries bounds only:
it names Nuxt 4, Vue 3, Nuxt UI v4, Tailwind CSS v4, TanStack Query, Zod, Hono,
better-auth, Drizzle ORM, PostgreSQL 16+, PgDog, and Lighthouse CI, and states no
minor or patch for any of them.

- **The two sources are separated once.** The paragraph now opens with the
  register's bounds exactly as the register states them, then attributes every
  exact version R1 consumes — 4.5, 4.11.2, 4.2, 5, 4, 4.13.5, and 1.6.14 — to
  `Project-Technologies.txt` and the committed lockfile in one clause, and states
  that none of them is a value the constitution fixes. The per-item
  parenthetical is gone, so the attribution is read once rather than repeated
  beside each number.
- **No value moved.** The seven exact versions are the ones the paragraph
  already carried, the twelve register bounds are the ones the register names,
  and no dependency was added, removed, or substituted. The nineteen-row
  Constitution Mandated Values table is unchanged, and no CMV value was
  reworded.

No gate status changed: Gate 1 remains PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, `EX-010`, `EX-011`, and `EX-012`; Gate 2 and Gate 3 are untouched. No
Complexity Tracking row was added, removed, renumbered, or reworded — the table
keeps its thirty-five rows — and no decision record was added: the plan still
introduces its sixteen. No requirement, acceptance criterion, success criterion,
CMV row, entity, page, dependency, or task identifier moved, and `tasks.md` is
unchanged and keeps its 175 tasks.

### Re-evaluation after the 2026-11-05 counts-and-readings pass (2026-11-05)

This pass is documentary. It adds no rule and withdraws none; it aligns the
wording of the cells and contracts it touches with the records they cite, and it
states where each number's authority sits.

- **Gate 2 → Identity, Authentication, and Session Policy.** The cell now states
  the boundary research R-01 records: the library remains the credential and
  session engine — password hashing, credential verification, session issuance,
  and revocation — while R1's routes and services only orchestrate it and enforce
  the product rules it does not carry (the uniform refusal, the lock, the rate
  limits, and the transient code store), which is what keeps the constitution's
  prohibition of custom authentication code satisfied. Record 1 states the same
  boundary in record form. The disabled `scim`/`sso` extensions, the two CVE
  references, and every control the cell already carried stand unchanged.
- **`contracts/ui-contracts.md` §8.1.** The paragraph now says the frame occupies
  four regions on screen and defines the two words it uses: a surface is one of
  FR-020's four parts — header, sidebar, footer band, bottom bar — and a region is
  a slot of the layout at a given width. It names the four regions at 1024 px and
  wider and the fourth region below 1024, where the footer band moves into the
  drawer. §8.3's label rule now says "three contexts" rather than "three
  surfaces", because the full sidebar and the drawer are two renderings of the
  sidebar surface and not two of FR-020's parts. No behavioural assertion
  changed: the widths, the footer band's links, the drawer's contents, the label
  rule, and the stacking order read exactly as before, and §8.1 remains a
  composition contract whose runtime verification is R2's under `EX-007`.
- **Summary.** The parenthetical now calls the bottom bar the frame's fourth
  region on a narrow screen, so the plan's opening statement uses the vocabulary
  §8.1 defines. The 2026-11-04 pass's sentence that called it the fourth surface
  stays where it was written, as that pass's historical statement.
- **Technical Context.** A reading rule for numbers now opens the section: every
  number is a value a CMV row states, a plan value recorded in the section itself
  (the rail width, the Unicode pin, the SC-009 file), or a value
  `Project-Technologies.txt` and the lockfile carry, and a restatement names its
  source rather than becoming a second authority. The Constraints line names its
  figures as readings of CMV rows 3, 4, and 18, which remain the authority and
  where a value changes first. No figure changed.
- **Gate 2 → Threat and Control Map, T13.** The control now says its ten POST
  routes are the ten requests AC-048 enumerates — nine actions, the code entry
  served once per flow — so the route list and the criterion are read as one set.
  No route, task, or requirement changed.
- **Count reconciliation.** The section is renamed "Count reconciliation" and now
  covers the record counts as well as the task count: the historically dated
  statements of 144 tasks, fourteen records, and fifteen records are historical,
  and the current counts are 175 tasks and sixteen records.

No gate status changed: Gate 1 remains PASS with exceptions `EX-007`, `EX-008`,
`EX-009`, `EX-010`, `EX-011`, and `EX-012`; Gate 2 remains PASS with its two
edited cells read above, and Gate 3 is untouched. No Complexity Tracking row was
added, removed, renumbered, or reworded — the table keeps its thirty-five rows —
and no decision record was added: the plan still introduces its sixteen. No
requirement, acceptance criterion, success criterion, CMV row, entity, page,
dependency, or task identifier moved, and `spec.md` and `tasks.md` are unchanged.

### Convergence pass (2026-11-08)

T191–T204 (Phase 12), T205–T208 (Phase 13), and T209–T221 (Phase 14), the
2026-11-08 convergence passes, are complete and marked `[X]`. The task list now
carries T001–T221: Phase 10 appended T176–T190, Phase 12 appended T191–T204,
Phase 13 appended T205–T208, and Phase 14 appended T209–T221 after the
2026-11-05 count above, so the 175-task sentences are historical for the same
reason as the 144-task ones. The Complexity Tracking
table now carries thirty-seven rows: row 36 records the web unit class's jsdom
environment (T204) and row 37 the direct PostgreSQL path in CI (T203), both with
owner `repository owner` and review date 2026-12-01. No gate status changed: Gate
1 remains PASS with the six exceptions, Gate 2 remains PASS, and Gate 3 is
untouched; no requirement, acceptance criterion, success criterion, CMV row,
entity, page, dependency, or decision record moved. The coverage run is the
changed-line gate's input, not a second gate: it reports the production source
T155 measures, and the changed-line check remains the blocking moment.

## Project Structure

### Documentation (this feature)

```text
specs/001-identity-foundation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── auth-api.md
│   └── ui-contracts.md
├── checklists/          # /speckit.checklist output
│   ├── requirements.md
│   ├── flows.md
│   ├── security.md
│   ├── ui.md
│   ├── data.md
│   ├── copy.md
│   ├── refusals.md
│   ├── verification.md
│   └── operations.md
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── app/
│   │   ├── pages/auth/          # sign-up, sign-in, forgot-password
│   │   ├── layouts/             # bare.vue, shell.vue
│   │   ├── components/          # page-local components; auth/ holds the shared code step
│   │   ├── composables/auth/    # useAuthStep, useSession, usePendingRequest, useAuthMessages
│   │   ├── stores/              # (none in R1)
│   │   ├── assets/              # CSS entry that imports the layer
│   │   ├── app.config.ts
│   │   └── app.vue
│   ├── server/                  # Nitro security-header/nonce plugin
│   ├── shared/
│   ├── public/
│   └── tests/                   # Playwright e2e, a11y, visual baselines, Lighthouse INP user flow
├── api/
│   ├── src/
│   │   ├── modules/auth/{routes,service,sms}/   # better-auth.ts is the module's persistence (the library's adapter writes accounts and sessions); service/account-creation.ts opens the identity transaction; service/password-change.ts carries the forced-change rule (A8); service/sign-in-administrator.ts carries US6's first sign-in and its restricted session (no HTTP route); sms/ holds the port, the Twilio adapter, the fake with its configured acceptance duration, the rolling-median estimator, and the four templates
│   │   ├── modules/users/{service,repository}/   # no HTTP route in R1: every public route is an auth route, and the profile routes arrive with R7 (Complexity Tracking row 26)
│   │   ├── cli/                 # provision-administrator, revoke-session
│   │   ├── http/                # shared entry point (context.ts), security middleware, OpenAPI generation
│   │   ├── observability/
│   │   ├── app.ts
│   │   └── index.ts             # boot-time schema-version guard, then the listener
│   ├── openapi.json             # generated from the Zod contracts + route table
│   └── test/
└── admin/                       # R13 — not created by R1
    └── app/                     # pages, components, composables, stores, layouts, assets
packages/
├── shared/src/{contracts,reference,normalize,routes.ts,limits.ts}
├── shared/vendor/unicode/       # the pinned emoji-data.txt the predicate's range table is generated from
├── db/{schema,migrations}/      # plus schema-version.ts, the expected version the boot guard reads
├── ui/{app,vendor,nuxt.config.ts}
└── config/
```

### Ownership Map (required)

| Path (directory or file) | Owning feature | Written by this feature? | Exclusive to it? |
|---|---|---|---|
| `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, root `package.json`, `.npmrc`, `.nvmrc`, `osv-scanner.toml` | 001-identity-foundation | yes | yes |
| `packages/config/**` | 001-identity-foundation | yes | yes |
| `packages/ui/**` (design tokens, theme, appearance, fonts and IconPark assets, `WfIcon`/`WfNumeral`/`WfWordmark`, the content skeleton, the in-place loading bar and its loading-state rule, the bidirectional file-name surface, the TanStack Query provider every frontend that extends the layer installs (`packages/ui/app/plugins/vue-query.client.ts`), and the shell components US5 builds in B6) | 001-identity-foundation | yes | no — later slices add components assigned by `ROADMAP.md` (R4, R5, R8, R9, R10, R2) through the layer |
| `packages/ui/vendor/icon-park/**`, `packages/ui/vendor/icon-park-outline/**` | 001-identity-foundation | yes | yes |
| `packages/shared/src/contracts/**` | 001-identity-foundation | yes | no — later slices add their own contract files |
| `packages/shared/src/reference/**` (city list, mobile prefixes) | 001-identity-foundation | yes | yes |
| `packages/shared/src/normalize/**` (the emoji predicate and the range table generated from the vendored Unicode data) | 001-identity-foundation | yes | yes |
| `packages/shared/src/limits.ts` (the slice's numeric limits, each annotated with its CMV row — the one source the Zod schemas and the copy templates read) | 001-identity-foundation | yes | yes |
| `packages/shared/vendor/unicode/18.0.0/**` (the pinned `emoji-data.txt`, Unicode 18.0.0, with its SHA-256) | 001-identity-foundation | yes | yes |
| `packages/shared/src/routes.ts` | 001-identity-foundation | yes | yes |
| `packages/shared/src/**/__tests__/**` (the unit suites co-located with the modules they test — the shared half of T022's unit-project roots, written by T033 and T034) | 001-identity-foundation | yes | no — later slices add their own suites |
| `packages/db/schema/users.ts`, `packages/db/schema/auth.ts` | 001-identity-foundation | yes | yes |
| `packages/db/migrations/**` (the committed migrations) | 001-identity-foundation | yes | no — later slices append migrations |
| `packages/db/{client.ts,index.ts,unit-of-work.ts,schema-version.ts}` | 001-identity-foundation | yes | no — later slices consume it |
| `apps/api/src/modules/auth/**` | 001-identity-foundation | yes | yes |
| `apps/api/src/modules/auth/service/account-creation.ts` (the account + credential + session transaction, opened by the `auth` service — research R-16) | 001-identity-foundation | yes | yes |
| `apps/api/src/modules/auth/service/password-change.ts` (the foundation password-change service and its `AdministratorPasswordChange` port — A8) | 001-identity-foundation | yes | yes |
| `apps/api/src/modules/users/**` | 001-identity-foundation | yes | yes |
| `apps/api/src/modules/users/repository/user-lock.ts` (the lock's conditional update, success reset, expiry clear, and the current-password check's lock refusal — the only writer of `users.failed_sign_in_count` and `users.locked_until` after account creation, implementing the port declared in `packages/shared` that the `auth` sign-in and password-change services call) | 001-identity-foundation | yes | yes |
| `apps/api/src/http/**` (shared entry point, security middleware) | 001-identity-foundation | yes | yes |
| `apps/api/src/http/context.ts` (reads and writes sessions only through the `auth` service — `data-model.md` §1) | 001-identity-foundation | yes | yes |
| `apps/api/src/observability/**` | 001-identity-foundation | yes | yes |
| `apps/api/src/cli/**` | 001-identity-foundation | yes | yes |
| `apps/api/src/{app.ts,index.ts}` | 001-identity-foundation | yes | yes |
| `apps/api/openapi.json` (generated public-interface document) | 001-identity-foundation | yes | no — regenerated when a later slice adds a route |
| `apps/api/src/modules/auth/data/breached-passwords.sha256` | 001-identity-foundation | yes | yes |
| `apps/api/src/**/__tests__/**` (the unit suites co-located with the modules they test — the API half of T022's unit-project roots, written by T026, T035, T036, T056, and T057) | 001-identity-foundation | yes | no — later slices add their own suites |
| `apps/api/test/**` | 001-identity-foundation | yes | no — later slices add their own suites |
| `apps/api/test/integration/auth/sign-up-concurrency.spec.ts` (AC-006's two concurrency races: two sign-ups for one number, and two entries of the same correct code, each leaving at most one account and one session and no live pending request, with the losing attempt answered by the winning row's status and role) | 001-identity-foundation | yes | yes |
| `apps/web/app/pages/auth/**` | 001-identity-foundation | yes | yes |
| `apps/web/app/layouts/bare.vue`, `apps/web/app/layouts/shell.vue` | 001-identity-foundation | yes | yes |
| `apps/web/app/{app.vue,app.config.ts}` | 001-identity-foundation | yes | yes |
| `apps/web/app/{components,composables}/auth/**` | 001-identity-foundation | yes | yes |
| `apps/web/app/assets/main.css` | 001-identity-foundation | yes | no — imports the layer's design tokens only |
| `apps/web/server/**` (Nitro security headers and nonce) | 001-identity-foundation | yes | yes |
| `apps/web/tests/**` (e2e, a11y, visual snapshots, Lighthouse INP user flow, and the unit specs under tests/unit) | 001-identity-foundation | yes | no — later slices add journeys |
| `reports/**` (the retained evidence reports: the SC-009 development and escalation reports, the restore-drill record, and the audit and scanner outputs the acceptance bundle reads) | 001-identity-foundation | yes | no — later slices append their own reports |
| `apps/web/public/**` (ownership only in R1: no favicon is shipped, and the browser's default is Nuxt's transparent fallback; the asset waits for the design contract that fixes its form) | 001-identity-foundation | no | no |
| `apps/admin/app/**` (pages, components, composables, stores, layouts, assets, `app.config.ts`, `app.vue`) | R13 (planned) | no | not applicable |
| `apps/admin/**` | R13 (planned) | no | not applicable |
| `apps/worker/**` | R3 (planned) | no | not applicable |
| `packages/search/**` | R3 (planned) | no | not applicable |
| `.github/workflows/ci.yml`, `.github/dependabot.yml`, root `lighthouserc.json` | 001-identity-foundation | yes | yes |
| `scripts/load/**`, `scripts/fixtures/**`, `scripts/check/**`, `scripts/gen/**` | 001-identity-foundation | yes | yes |
| `scripts/backup/**` | 001-identity-foundation | yes | yes |
| `compose.dev.yml`, `.env.example` | 001-identity-foundation | yes | yes |
| `docs/runbooks/{backup-restore,sms-provider}.md` | 001-identity-foundation | yes | yes |
| `README.md` (setup, development, testing, deployment) | 001-identity-foundation | yes | no — later slices extend its commands |
| `docs/domain-model.md` (the library-placeholder note; the three sign-in state fields ADR-105 registers are already recorded there and R1 adds no section for them) | 001-identity-foundation | yes | no — later slices amend their own sections |
| `.specify/memory/constitution.md` (the Technology Standards register amendment recorded by ADR-146 at 6.3.0) | governance — ADR-146 (repository owner) | no | no — later slices amend their own register rows |
| `Project-Technologies.txt` (the register's mirror, amended by ADR-146 in the same governance change; the 2026-11-09 dependency update aligns its four version rows with the lockfile under T258) | governance — ADR-146 (repository owner) | yes — T258 aligns the mirror's version rows | no — later slices amend their own rows |
| `.specify/memory/version.json` (the constitution footer's machine-readable counterpart and the value this plan reads rather than restates; ADR-146 moved it to 6.3.0 with the register amendment and ADR-147 to 6.3.1 on 2026-11-02, and every later amendment moves it with the footer, ADR-148's included; read-only here — T131 sees its value through `governance-drift-check.mjs` check A, which fails while it and the footer disagree) | governance — ADR-146 (repository owner) | no | no — later slices move it in the same change as their own constitution amendment |
| `docs/DECISIONS.md`, `docs/decisions/volume-09.md` (appended records) | 001-identity-foundation | yes | no — later slices append |

**Structure Decision**: The real paths follow `docs/architecture.md` → §1 and
§2, with the one deviation Complexity Tracking row 26 records and record 1
carries: the
`auth` module's persistence is better-auth's adapter rather than a hand-written
`repository/`, and the `users` module ships no HTTP route in R1, so neither
carries all three of `{routes,service,repository}`. `apps/web` and `apps/api` are
created here because R1 ships the only pages
and the only endpoints; `apps/admin` (R13), `apps/worker` (R3), and
`packages/search` (R3) are deliberately not created, because a directory holding
production code must have exactly one owning feature and an empty shell would
create a second owner later; `apps/admin/app/**` is listed explicitly so the
administrator frontend's fixed location has one owner from the start.
`packages/ui` is the ADR-097 layer, not a new package row of the constitution.
`apps/api/src/http/context.ts` is the single shared entry point: it resolves the
session, the account status, the role, the restriction, the merchant scope, and
the two clocks, and it reads or writes a session only through the `auth`
service's session port — never through `auth/repository` and never with SQL
against `sessions` (`data-model.md` §1). It reads the account's status on every
authenticated request and decides that request on the state it meets, so a block
recorded while a request is already in flight is observed by the next request,
and the in-flight request neither creates, extends, nor renews a session
(FR-019). `apps/api/src/modules/auth/service/account-creation.ts`
is the one transaction that creates the account, its credential, and its session
at verification (research R-16); it opens the unit of work and calls the `users`
service port, so the `users` repository remains the only writer of `users`. The
tests live beside their consumers: integration tests in `apps/*/test`,
end-to-end, accessibility, and visual tests in `apps/web/tests`, layer tests in
`packages/ui/tests`, unit tests co-located in `__tests__` directories under
`packages/shared/src/**` and `apps/api/src/**` (the Ownership Map's two
`__tests__` rows), and the web unit specs under `apps/web/tests/unit`. They are
owned by the slice that writes them, and later slices add files, never a second
root of the same kind.

## Implementation Sequencing

R1 has a hard boundary (ADR-139): the foundation phase is accepted and recorded
before any identity requirement is verified.

**Phase-name conversion (traceability).** `tasks.md` numbers the same work as
Phase 1–9 plus a Final Phase; this plan names its increments A1–A8 and B1–B8:
Phase 1–2 ≈ A1–A8 + Checkpoint A→B + B1; Phases 3–9 ≈ B2–B7 by story (the
P1 checkpoint closes in Phase 5, US7); the Final Phase ≈ B8's completion and
R1's acceptance.

**Phase A — foundation (no identity requirement verified here).**

1. **A1 Workspace.** pnpm workspace, Turborepo v2, `packages/config` (TypeScript,
   ESLint, Stylelint, Prettier), `.nvmrc`, `engines`, lockfile, `.env.example`,
   `compose.dev.yml` (PostgreSQL 16, PgDog with the PgBouncer fallback, Redis,
   SeaweedFS, OpenSearch under profiles), and the README skeleton.
2. **A2 Wafar UI layer — assets and primitives.** `packages/ui` with the
   Precision design tokens (the rail-width token the collapsed sidebar consumes
   included), the light default and the stored appearance, IBM Plex Sans Arabic
   and IBM Plex Mono (self-hosted WOFF2, OFL records), IconPark's two vendored
   cuts pinned by SHA-256 (outline consumed), the numeral component, and the
   wordmark, plus the data-page primitives no R1 page renders — the content
   skeleton, the in-place loading bar with the loading-state rule ADR-128
   decision 9 fixes (the indicator after 120 ms and for at least 300 ms, the
   skeleton's geometry equal to the content's, one Arabic sentence per region,
   and the RTL shimmer token), and the bidirectional file-name surface ADR-128
   decision 14 fixes — which `ROADMAP.md` lines 126–127 assign to R1 and which
   every later data page consumes (Complexity Tracking row 23; T138–T139). The
   contract test and the baseline tooling are wired here. **The shell primitives
   are not built here**: they land with the frame in B6, so A2 and the six
   composition tasks (T101–T106) name one boundary.
3. **A3 Data access.** `packages/db` with the Drizzle client, the unit-of-work
   port, and the migrator command that applies the migrations the journal lists
   (T016).
4. **A4 API skeleton.** Hono app, `/api/v1` (the version segment every public
   route carries; `/health` stays unversioned as the operational probe), the
   shared entry point (`apps/api/src/http/context.ts`), the security middleware
   (CSRF, headers, correlation id, error envelope, structured logs), the
   listener's boot sequence (the schema-version guard that gates it, its
   expected version, and its two integration tests are T126's), `GET /health`
   probing PostgreSQL with `SELECT 1` and answering 503 when it fails, the
   OpenAPI 3.1 generator (`apps/api/src/http/openapi.ts`, emitting
   `apps/api/openapi.json` as routes land) built from the Zod contract schemas
   and the route table, and the CLI composition root.
5. **A5 Test runner and CI.** Vitest, Playwright, axe, the coverage gate, the
   governance drift check, the module-header check
   (`scripts/check/module-headers.mjs`), the boot-guard and health integration
   tests, the SBOM job, the vulnerability and SAST scans, the Lighthouse CI job
   (LCP/CLS navigation runs and the INP user flow), and Dependabot.
6. **A6 SMS port and Twilio adapter.** The `SmsTransport` port, the Twilio
   adapter with the 750 ms timeout, the deterministic fake, and the runbook.
7. **A7 Backup and restore.** `pg_basebackup` + WAL archiving + `pg_restore`
   wrappers, encryption of every archive before it leaves the host (AES-256-GCM
   under a data key wrapped by the environment-injected key-encryption key), the
   RTO/RPO runbook, the quarterly drill checklist that restores the ciphertext
   into a clean environment, and the post-disaster state FR-055 fixes, with the
   key-encryption key named as the restore's one unrebuildable input.
8. **A8 Shared scaffolding.** `apps/web/app/layouts/bare.vue`, the shared step
   state machine and in-progress guard
   (`apps/web/app/composables/auth/useAuthStep.ts`), the code-to-Arabic
   message mapping (`apps/web/app/composables/auth/useAuthMessages.ts`) built
   from the single table of `contracts/ui-contracts.md` §6, and the shared code
   step `apps/web/app/components/auth/CodeStep.vue` that both identity flows
   consume — parameterized by the list of collected fields it displays, the
   change-number control, and the resend control, so US1 and US3 pass their own
   values instead of editing the component — with their unit and component
   tests; and the password-change service
   `apps/api/src/modules/auth/service/password-change.ts`, carrying the value
   rules, the current-password check, the credential rewrite, the global
   revocation, the pending recovery row's deletion, and the forced-first-change
   rule (the requirement cleared by that change and by no other path), declaring
   the lock, credential, and session collaborators as ports, and exposing the
   administrator branch as the `AdministratorPasswordChange` port. No identity
   requirement is verified here; US1, US2, US3, and US7 each consume the
   scaffolding, US2's route delegates the change to this service, and US6
   completes its branch in its own file without editing a US2 file.
    Both password writes order on the credential the same way: the change
    service and the recovery service
    (`apps/api/src/modules/auth/service/recovery.ts`) re-check their own
    authority inside the transaction that rewrites `accounts.password` — a live
    session and the current credential for the change, the `verified` recovery
    row for the reset — so the write that commits first removes the other's
    authority in that transaction and the other writes nothing (FR-013, FR-014;
    `data-model.md` §7).

**Checkpoint A→B (recorded).** The workspace, the layer, the shared scaffolding
(the bare layout, the step state machine, the message mapping, the shared code
step, and the password-change service), the tooling (including the OpenAPI
generator and the data-access layer — the Drizzle client, the unit of work, and
the migrator command), and the CI gate are accepted; the checkpoint record is
committed before any identity scenario runs. The checkpoint accepts no table and
no migration: the schema modules and the first migration are B1's (T030–T032).
No identity requirement is verified before it passes.

**Phase B — identity.**

9. **B1 Schema and the expected version.** The two schema modules (T030, T031)
   and one reversible first migration for `users`, `accounts`, `sessions`,
   `verifications` (the library's placeholder: the adapter's model set requires
   it, no R1 path writes it, and the suite asserts it empty — `data-model.md`
   §8), `phone_verifications`, and `rate_limit_counters`, with the constraints
   and indexes in `data-model.md` (T032) with its paired down migration
   exercised in CI and staging before production; and the generated
   `packages/db/schema-version.ts` — the SHA-256 of
   `packages/db/migrations/meta/_journal.json` with the applied-step count —
   with the boot-time guard in `apps/api/src/index.ts` and its two integration
   tests (T126). The expected version is derived from the journal the first
   migration produces, so the version and the schema it describes are generated
   from the same increment; A3 carries neither.
10. **B2 Better-auth adapter.** The phone-number extension, the scrypt hooks, the
    session cookie, the credential row, the server-side API calls (no public
    better-auth HTTP mount), the provisioning CLI, and US6's first-sign-in
    service `apps/api/src/modules/auth/service/sign-in-administrator.ts` (T112,
    asserted by T108): it exposes no public route and is called only from R13's
    administrator surface, which arrives later, and it returns a session
    restricted to the forced change, refusing every ordinary action with
    `PASSWORD_CHANGE_REQUIRED` while the password change and ending the session
    stay available (FR-028, AC-030).
11. **B3 The three pages.** Sign-up, sign-in, and password recovery composed on
    the A8 scaffolding: each page's steps, announcements, focus, and copy.
12. **B4 The identity flows.** Pending requests, one-time codes, resends,
    replacement, expiry, the recovery verified state, account creation, the
    existing-account outcomes, the lock (persisted by
    `apps/api/src/modules/users/repository/user-lock.ts` through the port declared
    in `packages/shared`), and the security notices. Account
    creation at verification runs in
    `apps/api/src/modules/auth/service/account-creation.ts`, which opens the one
    transaction for the account, its credential, and its session (research R-16).
13. **B5 Sessions and the shared entry point.** Sign-out, sign-out every device,
    platform revocation, the two clocks, the activity signal, status and role
    enforcement, and the ended-session state's contract. Every session read and
    write in `apps/api/src/http/context.ts` goes through the `auth` service's
    session port — never through `auth/repository` or the `sessions` table
    (`data-model.md` §1).
14. **B6 The frame's composition.** The shell primitives — header, sidebar,
    bottom bar, footer band, account menu, theme switch, and drawer — built in
    `packages/ui/app/components/shell/` with their structural tests, the route
    map, the guest variant, and the bottom bar's five slots. A2 carries the
    layer's assets and data-page primitives and builds none of these, so this
    increment and the six composition tasks (T101–T106) name the same boundary.
15. **B7 Security and abuse controls.** The two-key rate limits, the honeypot,
    the minimum time-to-submit, CSRF, output encoding, the security headers, and
    the uniform-response timing test.
16. **B8 Verification.** The coverage gate, the a11y scan and keyboard pass, the
    visual baseline, the load script, the merchant-isolation test, the committed
    `apps/api/openapi.json` regenerated from the full route set (the standalone
    drift test against it is R2's, ADR-031), the boot-guard refusal
    against an unmigrated database, the down migration's rollback exercise,
    the encrypted-backup restore drill, the
    register-closure check (`node governance-drift-check.mjs` over
    `.specify/memory/constitution.md`, whose current version is read from
    `.specify/memory/version.json`), and the convergence run. B8's completion is
R1's acceptance as *The verification contract* → *R1's acceptance (CHK036)*
defines it: the acceptance commit, not the end of this phase.
17. **P1 checkpoint.** US1, US2, and US7 together close the P1 checkpoint (ADR-139), and what gates it is the five US7 integration tests on the P1 surface: T073 asserts the hidden field's silence and the minimum time-to-submit (AC-031, AC-032); T074 the two-key limits over account creation and sign-in, with their resend bound (AC-033, AC-035, AC-036); T075 the refusal order (AC-055); T076 request forgery, output encoding, and the security headers (AC-048 to AC-050); and T077 the no-CAPTCHA rule (AC-034). AC-035's remaining part — the recovery operation's budget, the recovery steps' exemption from it, and the aggregate ceilings the two number keys produce — opens with the Polish T137 on US3's recovery route after T085, where it also applies the refusal order; T137 stays in the Polish phase.

## Complexity Tracking

| # | Item | Type | Why needed | Simpler alternative rejected because | Owner | Review / restore-by date |
|---|---|---|---|---|---|---|
| 1 | R1 carries its foundation phase and the identity work in one slice (workspace, layer, test runner, CI, SMS, backups, then eight identity increments) | Declared risk / unmapped work | `ROADMAP.md` → First obligations assigns every one of these duties to R1, and ADR-139 fixes the checkpoint that makes the boundary reviewable | A separate foundation slice is a classification error (ADR-007); a lean bootstrap would withdraw AC-022 … AC-027 from the only specification that carries the frame's contract (ADR-139) | repository owner | 2026-12-01 |
| 2 | The frame's page-level runtime lines are excluded from the ≥ 80% coverage target — exactly the lines `EX-007`'s exact scope names: the runtime lines of `packages/ui/app/components/shell/**` and `apps/web/app/layouts/shell.vue`: the focus landing on the destination page's heading after a drawer item's navigation, the drawer's focus containment, the overlays' stacking order, the consumption of an activation outside an open overlay, the account menu's live open and its runtime dismissal with the sign-out confirmation's result and the ended-session state it produces, the guest's redirection, the bottom bar's scroll-hide transition, the label cut at the inline-end, and the frame's accessibility scan and keyboard-only pass over its rendered behaviour. No other line is excluded, and a change to this set is a change to `EX-007` in the same change | Violation (Principle III scope) | No page in R1 renders the frame, so only a rendered page can execute those lines; the composition and every behaviour a mounted component can exercise — the `aria-expanded` open state, the three dismissals and the focus return to «المزيد», the confirmation's markup, the bar's rendered and visible state under the drawer, the guest redirect rule, and the label's whole text — are R1's, asserted by T094–T098, T103, and T132, and stay inside the target, while the label cut itself is pure styling with no runtime line to count | Counting page-only runtime lines would fail a target the slice cannot meet; the composition and control presence remain covered structurally | repository owner | 2026-12-01 |
| 3 | SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second, below the capacity model's 3,000–5,000 concurrent and 300 RPS envelope | Budget deviation | The specification fixes this measurement condition for the identity surface | Measuring at the full read envelope needs R12's load test, and the load-test tool is R12's register gap | repository owner | 2026-12-01 |
| 4 | The frame's page behaviour, accessibility scan, and keyboard-only pass are deferred to R2. The row's scope is `EX-007`'s exact scope, behaviour for behaviour and criterion for criterion, with nothing added or omitted. The runtime lines are those of `packages/ui/app/components/shell/**` and `apps/web/app/layouts/shell.vue`: the focus landing on the destination page's heading (AC-024); the overlays' stacking order (AC-024, AC-042, AC-051); the consumption of an activation outside an open overlay (AC-024, AC-042, AC-051); the drawer's focus containment (AC-024); the account menu's live open, its runtime dismissal, its sign-out confirmation's result, and the ended-session state a confirmation produces (AC-051, AC-053); the bottom bar's scroll-hide (AC-042); the guest's redirection from the drawer's item, the bar's slot, and the sidebar's item list (AC-024, AC-042, AC-052); the label cut at the inline-end (AC-042); and the frame's accessibility scan and keyboard-only pass (SC-005's R2 half, SC-006's frame half). It ends at R2's acceptance, the first page carrying the frame; 2027-01-31 is its escalation date, never a closing condition. The menu's two destinations and the Profile page's content are outside that set: they are R7's under row 34 | Violation (Principle VIII; exception `EX-007`) | The frame is built here and no page renders it; R2 is the first page carrying the frame (ADR-139), so each behaviour in that set is verified against its criterion there rather than a class of runtime behaviour being deferred. What a mounted component can exercise is R1's, not the exception's: T095 asserts the account menu's items, their link targets, and the sign-out confirmation's markup, and T132 asserts the drawer's `aria-expanded` open state, the collapse control, Escape, and an outside activation closing it with the focus returning to «المزيد» and the bar staying rendered (T132) and visible under the open drawer (T103) | A preview page or a placeholder page is a page the register forbids; the exception is the approved instrument | repository owner | 2027-01-31 |
| 5 | The static-page reachability requirement is discharged by R2 | Deferred binding requirement (FR-024) | The footer band renders on no page here; R1 builds it and fixes the four routes | Shipping a placeholder static page or a frame-rendering page contradicts the spec | repository owner | 2026-12-01 |
| 6 | Design reference gaps: the lab set does not capture the code, error, loading, disabled, post-submit, or 375-dark states; it draws the sidebar at the page's left edge where the specification fixes it at the inline-start (right) edge; and its recovery page carries no cross-link to sign-in where FR-036 requires one | Design evidence gap | The baseline is generated from the contract in CI (ADR-129), not copied from the lab | Copying lab screenshots is not a baseline and would import lab-only content and a composition the specification does not fix | R1 | 2026-12-01 |
| 7 | PgDog v0.1 (pre-1.0, AGPL-3.0 service) is the connection pooler between the API and PostgreSQL in every environment | Licence obligation / operational coupling (network service) | The Technology Standards row requires PgDog, and the Licence treatment for infrastructure services requires a plan that uses a network service to record the obligation its licence imposes, the operational coupling it creates, and a review date; `ROADMAP.md` line 117 assigns the deployment with its named fallback and review date to R1. **Licence — AGPL-3.0.** PgDog is consumed over a connection and is never shipped to or linked into a merchant's browser or device, so Dependency Governance's prohibition does not reach it and the infrastructure-services treatment applies. R1 runs the unmodified upstream release, retains its licence text and notices, and modifies nothing; a modification — a patched image included — obliges the platform to offer the Corresponding Source of that modified version to every user interacting with the service over a network (AGPL-3.0 §13), so a local patch is not a local choice. The obligation binds the service's own source and not the platform's: PgDog is a separate process reached over the PostgreSQL wire protocol, not a work based on the platform's code. **Operational coupling — the pre-1.0 hop.** The pooler stands in front of PostgreSQL in every environment: the development composition R1 writes, and the staging and production deployments that consume the same `DATABASE_URL` contract (R12's, Complexity Tracking row 25). The API, the migrator, and the health probe's `SELECT 1` reach the database only through it, so a protocol-breaking release, a failed upgrade, or an outage in the pooler stops every environment at the same point and an upgrade is taken across the three together; the image is pinned by digest and moved deliberately. **Fallback — PgBouncer**, named by the register, is one connection-string change plus the development composition's fallback profile, not a code change. | PgBouncer remains the named fallback and removes the pre-1.0 hop without a code change; making it the default, or removing PgDog from the register, is a register amendment. No pooler at all would put every concurrent request's connection on PostgreSQL's own limit, which the capacity model's 3,000–5,000 concurrent sessions exhaust. | repository owner | 2027-04-06 |
| 8 | IconPark's upstream is archived; both cuts are vendored and pinned | Maintenance risk | ADR-098/ADR-137 fix the set and the outline cut; Apache-2.0 is perpetual | A different set needs a decision record and re-vendoring; IconPark is the recorded choice | R1 | 2026-12-01 |
| 9 | Twilio is a proprietary service with an MIT SDK; its delivery guarantees are outside the platform | Register-gap closure / licence obligation | The SMS gap is R1's to close, ADR-141 records the choice, and OTP delivery is required by Product Scope | A Libyan aggregator was rejected in ADR-030; the port keeps the provider replaceable | R1 | 2026-12-01 |
| 10 | IBM Plex Sans Arabic and IBM Plex Mono are OFL-1.1 assets | Licence obligation | Principle V requires an Arabic-first, self-hosted, licensed family | A system font stack is not Arabic-first and is not recorded by the layer | R1 | 2026-12-01 |
| 11 | `@axe-core/playwright` is the automated accessibility checker under MPL-2.0 | Licence obligation (dev tool) | Principle IV requires an automated scan; ADR-145 carries the choice, the MPL-2.0 licence obligation (a dev-only CI gate that is never shipped: the licence text is retained and any modified file's source is made available), the vulnerability scan (`osv-scanner` and `npm audit` on the committed lockfile) and the review date 2026-12-01 | A manual-only scan does not satisfy the MUST | R1 | 2026-12-01 |
| 12 | GitHub Actions is the continuous-integration provider (CMV row 14); the hosted service is proprietary and its runner image is maintained by GitHub | Register-gap closure / licence obligation | The CI provider gap is R1's to close (the slice that introduces the test runner); ADR-143 records the choice; licence: GitHub's terms of service for the hosted service, with every first-party action pinned by commit SHA under its MIT licence; vulnerability scan: `osv-scanner` on the lockfile and Dependabot's `github-actions` ecosystem on the pinned actions | A single job hides one failing gate behind another; a self-hosted runner adds a second service to operate and does not remove the dependency | R1 | 2027-01-31 |
| 13 | `@cyclonedx/cyclonedx-npm` generates the SBOM of every build (CycloneDX JSON) | Register-gap closure / licence obligation | The SBOM generator gap is R1's to close (the slice that establishes the release build); ADR-144 records the choice; licence: Apache-2.0, a build-time tool that is never shipped; vulnerability scan: `osv-scanner` and `npm audit` on the committed lockfile | A hand-written SBOM is not reproducible from the lockfile and drifts on the first update; no SBOM is rejected by the supply-chain rule | R1 | 2027-01-31 |
| 14 | PostgreSQL's built-in `pg_basebackup` plus continuous WAL archiving is the backup and restore tooling (the RTO/RPO are CMV rows 8–9) | Register-gap closure / licence obligation | The backup tooling gap is R1's to close (the slice that introduces persistent storage); ADR-142 records the choice; licence: the PostgreSQL Licence (permissive, BSD-style); vulnerability scan: `osv-scanner` on the repository (no new package is added) and the official PostgreSQL 16 image pinned by digest and rebuilt on patch releases | A nightly `pg_dump` gives a 24-hour RPO; `pgBackRest` or Barman adds a third-party tool and a new register gap for no requirement this slice has | R1 | 2027-01-31 |
| 15 | better-auth requires a unique value in its `email` column; R1 stores the reserved, non-routable sentinel — the canonical number without `+`, then `@phone.invalid` (`+218912345678` → `218912345678@phone.invalid`) — for a phone-only account | Violation (the literal domain-model invariant; ADR + domain-model note) | The designated library's user model requires the column, and custom authentication code is prohibited | A real email address would create a channel the product forbids; a null unique column breaks the library's adapter. The placeholder can never receive mail, is never displayed, is never used for sign-in, and no email transport exists | repository owner | 2026-12-01 |
| 16 | The city list, the mobile-prefix set, and the breached-password list are curated static datasets | Data provenance / maintenance | Each is a fixed reference dataset the spec fixes once; a database table would make it mutable per environment | Storing them in the database would let environments diverge and would create a second source | R1 | 2027-01-31 |
| 17 | Backup archives are encrypted with AES-256-GCM under a key-encryption key injected from the environment, and the key is never stored beside the archive | Security obligation / key custody | Deployment and Observability requires backups to be encrypted, and R1 introduces the only persistent store whose archives leave the host; without the key an archive is unreadable, so the key's custody is a duty R1 must name and the quarterly drill must exercise | An unencrypted archive is refused by the constitution; a backup tool with native encryption (`WAL-G`, `pgBackRest`) would open a register gap this slice does not need | R1 | 2026-12-01 |
| 18 | US4's blocked-account sign-in test exercises the sign-in path US2 delivers | Violation (Principle VIII; exception `EX-008`) | The status rule US4 owns is observable only through a sign-in attempt, and R1 ships no act of blocking, so the test reaches the blocked state directly and then asserts the refusal the sign-in path produces — the blocked-account half of `apps/api/test/integration/users/status.spec.ts`. **Closes on:** AC-019 and AC-021, over `apps/api/src/modules/auth/service/sign-in.ts`, `apps/api/src/modules/auth/routes/session.ts`, and `apps/api/src/http/context.ts`; the row ends at R1's acceptance. | A second refusal path would break the uniform transcript FR-008 and SC-004 require; `EX-008` is the approved instrument and ends at R1's acceptance, when US2 and US4 are delivered together, while US4's status read and retained data are verified without US2's path; the withdrawn session is inside `EX-008`'s scope | repository owner | 2026-12-01 |
| 19 | The N+1 query-count SHOULD is **met**: every path R1 introduces is a point lookup on a unique index, and the integration suite asserts a sign-in request's query count (one user read, one credential read, one session insert) | Verification status (met) | `ROADMAP.md` lines 140 and 243–249 require R1's plan to record the assertion's status in Complexity Tracking, and line 140 is corrected in the same change to name R1 rather than R2 (I2); the constitution's N+1 rule reaches R1's session lookup first because it is the product's first public data path (ADR-139), and R2's first standalone documentation-drift test is a separate obligation (ADR-031 item 4) that neither discharges nor is discharged by this status | Recording the status only in the Verification Notes leaves the roadmap's named destination empty, and leaving line 140 assigning the assertion to R2 contradicts the note and ADR-139; an unmet-SHOULD row is not warranted because no N+1 was found and the count is asserted | R1 | 2026-12-01 |
| 20 | US5's bare-page end-to-end test opens the three bare pages this slice ships — sign-up (US1), sign-in (US2), and password recovery (US3) | Violation (Principle VIII; exception `EX-009`) | US5 delivers the frame's composition and ships no page that renders it, so AC-023's frame absence, wordmark, page title, and cross-links are asserted on the three bare pages this slice ships — sign-up (US1), sign-in (US2), and password recovery (US3); the scope names all three because AC-044 reaches them and T099 is the criterion's only test (corrected 2026-11-01, I1a), in `apps/web/tests/e2e/bare-layout.spec.ts`. **Closes on:** AC-023 and AC-044, over `/auth/sign-up`, `/auth/sign-in`, and `/auth/forgot-password`; the row ends at R1's acceptance. | A page of US5's own is a page the register forbids, and withdrawing the test would leave AC-023 unmeasured; `EX-009` is the approved instrument and ends at R1's acceptance, when US1, US2, US3, and US5 are delivered together, while the composition is verified structurally without another story under `EX-007` | repository owner | 2026-12-01 |
| 21 | US6's tests exercise US2's sign-in, lock, revocation, and notice behaviour and US3's recovery role refusal | Violation (Principle VIII; exception `EX-010`) | The lock, revocation, and notice rules and the merchant surfaces' refusals belong to US2 and US3 and are observable only there, while US6 owns the provisioning action and the forced first change, in `administrator-first-sign-in.spec.ts` and `administrator-refusal.spec.ts`. **Closes on:** AC-016, AC-029, and AC-030, over `sign-in.ts`, `user-lock.ts`, `recovery.ts`, and `sign-in-administrator.ts`; the row ends at R1's acceptance. | Duplicating those rules inside US6 would give one rule two homes; `EX-010` is the approved instrument and ends at R1's acceptance, when US2, US3, and US6 are delivered together, while provisioning and the forced change are verified with US6's own fixtures | repository owner | 2026-12-01 |
| 22 | US7's abuse and security controls live on the surfaces US1, US2, and US3 deliver | Violation (Principle VIII; exception `EX-011`) | The hidden `website` field is added in `apps/web/app/components/auth/SignUpForm.vue` (US1's file, T081; AC-031); the honeypot and the minimum time-to-submit (T073; AC-031, AC-032); the fixed refusal order is applied in `apps/api/src/modules/auth/routes/sign-up.ts` and `session.ts` (US1's and US2's routes, T080; AC-055); the two-key rate limits and the resend bound (T074; AC-033, AC-035, AC-036), the security middleware (T076; AC-048, AC-049, AC-050), and the no-CAPTCHA rule (T077; AC-034) are tested on US1's and US2's surfaces; and the recovery route's application and budget exemption are the Polish T137. US7 owns all six controls but ships no form or route of its own. **Closes on:** AC-031, AC-032, AC-033, AC-034, AC-035, AC-036, AC-048, AC-049, AC-050, and AC-055, over `SignUpForm.vue`, `sign-up.ts`, `session.ts`, `recovery.ts`, `verifications.ts`, and the six suites the register names; the row ends at R1's acceptance, and the P1 gate passes on the five US7 integration tests over US1's and US2's surfaces, so it implies no shippable US7 surface of its own. | Giving US7 a duplicate sign-up or recovery surface would create a second home for rules US1, US2, and US3 own and would break the uniform transcript FR-008 and SC-004 require; `EX-011` is the approved instrument and ends at R1's acceptance, when US1, US2, US3, and US7 are delivered together | repository owner | 2026-12-01 |
| 23 | R1 builds the layer's content skeleton, the in-place loading bar and its loading-state rule, and the bidirectional file-name surface, with no R1 page rendering them | Unmapped work (layer scope) | `ROADMAP.md` lines 126–127 assign all four to R1 as layer duties every later data page consumes; R1 is the slice that builds the layer whole, exactly as it builds the frame no page renders (`EX-007`), and A2 and T138–T139 carry them | Deferring them to the first data slice (R2) needs an ADR that moves a roadmap obligation and leaves the layer incomplete at R1's acceptance; a page of R1's own that renders them is a page the register forbids | repository owner | 2026-12-01 |
| 24 | US2's security-events test asserts the closed list beyond US2's events — the records US1, US3, and US6 produce and the refusals US1's route and US7's limiter emit no record for | Violation (Principle VIII; exception `EX-012`) | FR-037's list is one closed list with one home (AC-040), and T060 asserts one record per named event: `auth.sign_up.verified` (US1, T045), `auth.password.reset` (US3, T086), both `auth.otp.dispatch_failed` kinds (US1's T047 and US3's T085), `auth.administrator.provisioned` (US6, T107), and the absence of a record for a format refusal (US1's route) and a rate-limit refusal (US7's limiter). Each event is emitted in its own story, so the exception covers the cross-story assertion and no second emission point. **Closes on:** AC-040 and AC-047, over `security-events.spec.ts`, `events.ts`, and the emitting routes; the row ends at R1's acceptance. | Splitting the closed list across four stories would give one rule four homes and leave no test that the list is closed; `EX-012` is the approved instrument and ends at R1's acceptance, when US1, US2, US3, US6, and US7 are delivered together, while the US2-owned events are asserted without another story | repository owner | 2026-12-01 |
| 25 | The three environments (development, staging, production) with staging parity, and the monitoring and alerting set — the p95 request-latency, search-p95, processing-success-rate, queue-depth, and budget-breach alerts — are R12's; R1 delivers only the configuration contract and the runtime surfaces the deployment consumes (`.env.example`, the health probe, the structured log record, and the backup/restore contract) | Deferred operational obligation (R12) | `ROADMAP.md` line 139 assigns staging parity and the delivery duties to R12, and line 154 the monitoring and alerting set; R1 is not the deploying slice, so it cannot stand up a second environment, anonymise staging data, or operate an alert pipeline | Building a staging environment or an alerting stack inside R1 would duplicate R12's work and leave two owners; the configuration contract is the seam the deployment consumes, and the health probe, the structured log record, and the backup/restore contract are the only runtime surfaces R1 owes | R12 | 2027-01-31 |
| 26 | The `auth` module ships `routes/` and `service/` with better-auth's adapter as its persistence, and the `users` module ships `service/` and `repository/` with no HTTP route in R1 — neither module carries all three of the directories Principle X requires ("Each module has its own routes, service, and repository"), the layout `docs/architecture.md` §1.1 and §2 records | Violation (Principle X; module layout) | R1 mounts only authentication routes, which the `auth` module owns, and better-auth's adapter already writes `accounts` and `sessions`, so a hand-written `auth/repository` would be a second writer of the library's tables; the `users` module is reached through its service port and the shared entry point, and its routes arrive with the merchant profile surface (R7) | An empty `users/routes/` directory is a public surface no requirement names, and a hand-written `auth/repository` duplicates the adapter's writes; record 1 carries the deviation and the layout stays where `tasks.md` builds it | repository owner | 2026-12-01 |
| 27 | The account lock's denial-of-service consequence: any caller who knows a merchant's number can lock the account for fifteen minutes with five wrong passwords, and can re-lock it in each window by spending five more, so the lock is bounded per episode and not against sustained repetition | Accepted risk (security limitation; the lock is not a complete denial-of-service control) | CHK019 required the consequence to be accepted or bounded; FR-009 now states the acceptance and its per-episode bound, the constitution mandates the lock after five consecutive failed sign-in attempts and forbids weakening it, and the number-keyed sign-in budget (CMV 3: 20 attempts per normalized number per 15-minute window) is the only control that prices repetition | A second lock rule — a cap on lock episodes, a progressive wait, or a duration that grows — would give one rule two authorities and contradict FR-009's "the lock is a time bound alone"; lifting the lock on a successful reset would waive a rule the specification fixes, and removing the lock would breach the constitution | repository owner | 2026-12-01 |
| 28 | The README's clean-checkout verification — following `README.md`'s setup, development, testing, and deployment sections on a clean checkout — is deferred to the first release, R12 | Deferred verification obligation (R12) | The constitution's Documentation rule requires the README's four sections to be verified by following it on a clean checkout before a release; R1 writes the README (T121–T123) but is not the releasing slice, and `ROADMAP.md`'s Release gate fixes the first release at R12's acceptance, so the verification is due there and not at R1's acceptance | Running it at R1's acceptance would follow a deployment section for a deployment R12 executes and would certify a checkout that has not shipped; T123's quickstart run is different evidence — a developer workspace with the services already provisioned, not a clean checkout, and it never exercises the published deployment steps. R1 keeps the README's authoring (T121–T123), and only the clean-checkout proof moves to the release it precedes | R12 | 2027-01-31 |
| 29 | The boot-time schema-version guard (T126) serves Gate 2 → Schema and Migration Control and carries no `FR-###`/`AC-###` pair | Unmapped work (foundation gate) | The binding section requires the application to refuse to serve against an unmigrated database, and no product requirement names that duty: T126 embeds the expected version — the SHA-256 of `packages/db/migrations/meta/_journal.json` together with the applied-step count — in `packages/db/schema-version.ts` and compares it with the applied rows of `drizzle.__drizzle_migrations` before the listener opens, exiting non-zero on absence or mismatch, with the refusal and the ready path both asserted by integration tests. Row 1 is the umbrella the task cites; this row is the guard's own record, so the gate that requires it has a named entry rather than a sentence inside a broader row | Leaving the guard to the migration tool would let an instance serve against an unmigrated database, which the binding section forbids; widening an existing requirement to cover it would give the specification a rule it does not carry | R1 | 2026-12-01 |
| 30 | The public-interface documentation gate — the OpenAPI 3.1 generator (T125) and the verification of the committed document (T128) — serves Gate 2 → Documentation and carries no `FR-###`/`AC-###` pair | Unmapped work (foundation gate) | The binding section requires the public interface to be documented from the same source as the implementation (ADR-002): T125 emits `apps/api/openapi.json` from the Zod schemas in `packages/shared/src/contracts/**` and the Hono route table through Zod v4's built-in `z.toJSONSchema()` with no new dependency, and T128 regenerates it from the final route set and confirms the committed file matches. The first standalone documentation-drift test is R2's (ADR-031 item 4), so R1's gate is generation plus verification and this row records the half R1 owns | A hand-written prose contract as the only record drifts from the routes on the first change; running the drift test here would claim an obligation ADR-031 item 4 assigns to R2 | R1 | 2026-12-01 |
| 31 | The module-responsibility header check (T127) serves Gate 2 → Documentation and Gate 1 → X and carries no `FR-###`/`AC-###` pair | Unmapped work (foundation gate) | Every production module file opens with a one-line header naming its single responsibility and never repeats the owning feature, because the Ownership Map records the ownership once; `scripts/check/module-headers.mjs` asserts it in the CI gate, so a missing or empty header fails the build. The rule is Principle X's and the Ownership Map's, and no `FR-###`/`AC-###` names it | A written convention without a check drifts on the first added file; repeating the owning feature inside each header would create a second copy of what the Ownership Map records | R1 | 2026-12-01 |
| 32 | The coverage gate — Vitest with the V8 provider, the unit/integration project split, and the ≥ 80% measurable changed-line threshold (T022) — serves Gate 1 → III and carries no `FR-###`/`AC-###` pair | Unmapped work (foundation gate) | Principle III requires measured coverage of measurable changed production lines (the added lines with an lcov `DA` record), and the spec's Test Coverage Request answers it: T022 wires Vitest (jsdom with `@vue/test-utils` for the web unit class, Complexity Tracking row 36), the V8 provider, the project split over the unit project's roots, and the measurable changed-line threshold in `packages/config/vitest.config.ts`. Because every production line is new in R1, the whole-project threshold equals the measurable changed-line threshold; row 2 records the page-level exclusion alone, so the threshold and the split have this row | Leaving the threshold to the first slice that adds a diff-coverage step would ship R1's production lines unmeasured; a whole-project percentage taken over generated and library code would not state what the slice's own lines achieve | R1 | 2026-12-01 |
| 33 | The continuous-integration pipeline — `lighthouserc.json` and `.github/workflows/ci.yml` (T024) — serves Gate 2 → Performance Budgets and Verification, Dependency Governance, Documentation, and Module Discipline and Development Workflow, and carries no `FR-###`/`AC-###` pair | Unmapped work (foundation gate) | Every gate assertion above runs in that workflow: the governance drift check, lint and typecheck, unit, integration with the PostgreSQL service and migrations, end-to-end (Playwright, the fake SMS port, the accessibility scan, the visual baseline), Lighthouse CI on the three bare pages and the INP user flow, coverage, build plus SBOM, `osv-scanner`, and Semgrep, with the test classes offline and the dependency and tool installs (the pinned Playwright browser and Semgrep) as the networked setup steps. Row 12 records the provider's register-gap closure, its terms of service, and its pinned actions; this row records the pipeline's gate duties, so the two records do not restate each other | A single job would hide one failing gate behind another, and no workflow would leave every gate above unenforced | R1 | 2026-12-01 |
| 34 | The account menu's two destinations — the Profile page and its settings section — and the Profile page's own content, the account's full name, city, and status at its top and no other account field, are delivered and verified by R7 | Deferred binding requirement (FR-047) | The frame is delivered whole, so R1 builds the menu and fixes both link targets, while the Profile page is R7's (`ROADMAP.md` R7; `docs/design/slice-map.md` → R7), which owns the page's composition, its data, and its settings actions. The 2026-10-21 clarification already records that the menu's composition is this slice's and the destinations land with R7; AC-051 is narrowed to the composition and the link targets in the same change (2026-11-04, Clarifications), so no criterion claims a page R1 does not build | Shipping a Profile page here would add a page R1 does not own and duplicate R7's slice; an exception under Principle VIII is not the instrument, because no story here claims a behaviour the slice does not build — the criterion is narrowed instead, as row 5 does for R2's reachability | R7 | 2027-01-31 |
| 35 | The block a restore can undo, and the row it can bring back: a restore to a point within the recovery point returns `User` rows as they stood at that moment, so a block applied after the point is undone until an administrator re-applies it, and a row removed for good after the point is registered again until the removal is repeated | Accepted recovery consequence (FR-055, AC-061) | A restore returns the store to an earlier moment by definition; FR-055 fixes the consequence, bounds it by the plan's recovery time and recovery point, and makes the specification read FR-017 and FR-018 at the restored moment rather than reconcile afterwards, because the acts reconciliation would need — the block (R13's Users page) and the removal (R13 or R15) — do not exist in this slice | Reconciliation would need a durable record of blocks and removals that outlives the store being restored, which is an entity and an owner this feature does not have; refusing the restore would withhold the recovery guarantee the constitution requires. The consequence is bounded by the fifteen-minute recovery point, R12's recovery procedure re-applies a withdrawn block, and R13 or R15 repeats the removal | R12 (procedure), R13 (block), R15 (removal) | 2027-01-31 |
| 36 | The web unit class runs under `jsdom` directly, without `@nuxt/test-utils`, where the plan's test-class table fixes `node` with that environment: the class's component specs mount Vue components and need a DOM | Toolchain deviation (T204) | The Nuxt test environment cannot build under the pinned toolchain — Vite 7.3.7 with rolldown 1.2.16 throws `Missing field 'moduleType'` from rolldown's `invokeBuiltinHook` while Vite's environment plugin container transforms a test file, and resolving the environment from the workspace root fails with `Cannot find module 'C:/project-new/nuxt'` — so the project declares `environment: 'jsdom'` and the component specs mount through `@vue/test-utils`. No product line or test intent changes; the layer class already runs on jsdom for the same DOM need, and `scripts/check/test-environments.mjs` asserts the environment, the pure/DOM split, and the absence of `happy-dom` | Downgrading Vite or pinning a fork of the test environment would depart from the approved register for a test-only concern; leaving the class on `happy-dom` contradicts the plan's DOM choice; a per-file `@vitest-environment` comment does not make the Nuxt environment load, because the failure is in the project's environment setup rather than in one file | repository owner | 2026-12-01 |
| 37 | The integration, coverage, and end-to-end jobs reach the PostgreSQL service directly in CI rather than through PgDog: the plan's test-class table puts the pooler the deployment uses in the path the classes exercise, and `.env.example` points at port 6432 | Environment deviation (T203) | The pinned PgDog image cannot be validated on the development host (no Docker), and a GitHub Actions service container cannot mount the `pgdog.toml` and `users.toml` configuration `compose.dev.yml` supplies, so a pooler started in the job would run configuration no test has verified. The jobs keep the `postgres:16-alpine` service and a direct `DATABASE_URL` — the pair the local suites use — while the composition keeps the digest-pinned PgDog service and the `pgbouncer-fallback` profile for a deployment-shaped environment. The deviation is recorded rather than the pooled path being claimed; the row is restored to CI when a runner can start the pinned image with its configuration, or the check moves to a deployment-shaped environment | Pointing `DATABASE_URL` at a service whose configuration the job cannot mount would prove nothing about the pooler; adding a second database path to the local suites would diverge from the environment the suites actually run in | repository owner | 2026-12-01 |
| 38 | The restore drill's evidence (T129) is a host-adapted point-in-time logical `pg_dump` restore on Windows, not the encrypted `pg_basebackup` plus WAL ciphertext restored into a clean Linux container the runbook's production routine fixes: the host has no Docker and no Linux cluster | Environment deviation (FR-055, AC-061; T241) | The drill exercises the same encryption (`seal.mjs`, AES-256-GCM under the injected key-encryption key), a clean restore, the API boot, the `/health` answer inside the four-hour RTO, the FR-055 state assertions at the recovery point, and the RTO/RPO reading; only the backup mechanism and the host class differ, and the departure is recorded here, in `reports/t129-restore-drill.json`, and in `docs/runbooks/backup-restore.md` rather than claimed as the production drill | Running the production drill needs a clean Linux host with `pg_basebackup` and the WAL archive, which the development host cannot provide; a partly simulated WAL replay would assert a different recovery path and prove less than the logical dump's point-in-time restore | repository owner | 2026-12-01 |
| 39 | The committed lockfile's critical and high advisories are cleared by the 2026-11-09 dependency update, each with its disposition: `better-auth` 1.6.14 → 1.7.18 (critical GHSA-965c-763c-88jm and highs GHSA-qq9h-g4jm-xgf3, GHSA-q84f-53jg-9ppm, and GHSA-r4xp-prcw-77qf — updated); `drizzle-orm` 0.44.7 → 0.45.4 (high GHSA-gpj5-g38j-94v9 — updated); `tinypool` 1.1.1 (criticals GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr — replaced, because Vitest 4.1.12 no longer depends on it); `happy-dom` 20.14.6 → 21.0.4 (highs GHSA-834v-8h66-3h79 and GHSA-c8p4-j97h-3vg8 — updated); `@cyclonedx/cyclonedx-npm` 4.2.1 → 6.0.1 (its reported highs, fixed in ≥ 6.0.0 — updated); `basic-ftp` 5.3.1 → 6.2.6 through a pnpm override (high GHSA-c475-qrg2-pj4r — updated); and `hono` 4.13.5 → 4.13.17 (its moderates, fixed in ≥ 4.13.11 — updated, below the critical/high gate). The osv-scanner findings that remain are excepted in `osv-scanner.toml` with a reason and `effectiveUntil = 2026-12-09`: GHSA-vjh5-4x84-xrqp on `nuxt`/`@nuxt/nitro-server` 4.6.4 (the advisory fixes 4.6.2; OSV's EOL Nuxt 3 range carries no fixed event), GHSA-gcqx-w48m-w2h4 on `deepmerge` 4.3.1 (build-time merge of repository-controlled objects; no fixed release), GHSA-67mh-4wv8-2f99 on `esbuild` 0.18.20 and GHSA-g7r4-m6w7-qqqr on `esbuild` 0.27.7 (build-time transforms; the serve API is unused; the second is Windows-only), GHSA-3g3m-2fjr-6pw4 on `glob` 10.5.0/13.0.6, and GHSA-g3hv-75wg-m249 on `minimatch` 9.0.9/10.2.6 (build and test tooling over repository-controlled inputs) | Dependency Governance disposition (Constitution: Dependency Governance; T253) | The 2026-11-09 audit found 3 critical and 9 high advisories over 1,519 dependencies, five packages past the constitution's 30-day bound; every critical and high advisory is now updated or replaced, and `pnpm audit --audit-level=high` exits 0 with 0 critical and 0 high. `osv-scanner` exits 0 with the six medium/low exceptions above; every critical and high advisory is updated or replaced, and the ignore list contains no critical or high advisory. The disposition date is 2026-11-09; the `basic-ftp` override is the one forced major, because `get-uri` 6.0.5 still declares `basic-ftp ^5.3.1` and the fixed 6.x keeps the `Client` API the proxy chain uses | Leaving the pinned versions and recording exceptions for five packages past the 30-day bound would keep a known critical vulnerability in the runtime authentication engine and a known high in the ORM; a partial update would leave the audit gate red | repository owner | 2026-12-09 |
| 40 | `nuxt` 4.5 → 4.6.4 (and `@nuxt/nitro-server` with it): a minor upgrade of the framework the web surface runs on, carried by the 2026-11-09 dependency update | Minor dependency upgrade (Constitution: Technology Standards → Version-change rule; T258) | The framework moved from the 4.5 line to 4.6.4 in the lockfile while the plan's Primary Dependencies and the detail mirror still named 4.5; the Version-change rule requires a minor upgrade to be recorded in the plan that performs it. The upgrade is compatibility-only: no product requirement, route, page, or contract changes, and the typecheck, unit, integration, end-to-end, accessibility, and visual classes run against it | Leaving the old pin and not recording the movement would leave the plan's exact-version attribution false and the minor upgrade unrecorded, contrary to the Version-change rule | repository owner | 2026-12-09 |
| 41 | `tailwindcss` 4.2 → 4.3.4: a minor upgrade of the styling engine the Wafar UI layer consumes through Nuxt UI, carried by the 2026-11-09 dependency update | Minor dependency upgrade (Constitution: Technology Standards → Version-change rule; T258) | The styling engine moved from the 4.2 line to 4.3.4 in the lockfile while the plan's Primary Dependencies and the detail mirror still named 4.2; the Version-change rule requires a minor upgrade to be recorded in the plan that performs it. The upgrade is compatibility-only: the layer's tokens and the three pages' rendered states are unchanged, and the visual baseline and accessibility scans run against it | Leaving the old pin and not recording the movement would leave the plan's exact-version attribution false and the minor upgrade unrecorded, contrary to the Version-change rule | repository owner | 2026-12-09 |

## Decision records this plan introduces

Sixteen records accompany this plan. Five are already recorded — items 4, 8, 9,
10, and 11 as ADR-141, ADR-142, ADR-143, ADR-144, and ADR-145 — and ADR-146
records the Technology Standards amendment that consumes them. The remaining
eleven are appended to `docs/DECISIONS.md` and the last volume in the same change
that implements them (their numbers are assigned at append time, never guessed
here):

> Numbering note: The decision register ends at ADR-148 (see docs/DECISIONS.md). The eleven unnumbered records listed below (items 1, 2, 3, 5, 6, 7, 12, 13, 14, 15, and 16) take the next numbers the register assigns at append time — never a number named here — and are appended by T120, T136, T142, and T143.

1. **The identity flow's technical shape** — better-auth's phone-number extension
   wrapped by the `auth` module, the single Postgres transient store, the
   reserved `email` placeholder, the lock's persistence in the `users` module
   behind the port declared in `packages/shared`,
   the reason the extension's public HTTP routes are not mounted, and the two
   modules' directory layout in R1 — `auth` with `routes/` and `service/` and the
   library's adapter as its persistence, `users` with `service/` and `repository/`
   and no HTTP route until the profile surface (R7) — which deviates from
   `docs/architecture.md` §1.1 and §2 and from Principle X's "Each module has
   its own routes, service, and repository", and is recorded as Complexity
   Tracking row 26. The library remains the credential and session engine —
   password hashing, credential verification, session issuance, and revocation —
   while R1's routes and services only orchestrate it and enforce the product
   rules it does not carry: the uniform refusal, the lock, the rate limits, and
   the transient code store. That boundary is the reading research R-01 records,
   and it is what keeps the constitution's prohibition of custom authentication
   code satisfied.
2. **The city list and the mobile-prefix dataset** — their provenance (for the
   city list, the Libyan administrative-division reference, its recorded version,
   and the 22-governorate reference count), entry shape, uniqueness rule,
   normalization, the test that holds them fixed, and their build-time failure
   mode: a missing, unparsable, or truncated file fails the build that imports
   it, and no runtime path reads either.
3. **The password policy's local source** — SecLists' top 100,000 entries, the
   SHA-256 membership test, the refresh cadence, the licence, the boot-time
   line-count and digest check that stops startup on a missing or altered file,
   and the stale-list rule: the list stays in use and staleness is a maintenance
   finding with a review date.
4. **The transactional SMS transport** — Twilio, the port, the timeout, the
   licence obligation, and the vulnerability scan (register-gap closure).
   **Recorded as ADR-141.**
5. **The session policy** — the two clocks, the activity signal, the tombstone
   rows, and the ended-session reasons.
6. **The rate-limit and transient-store locations** — Postgres tables instead of
   Redis for R1, with the window and sweep rules, each row's time bound, and the
   hourly idempotent sweep that enforces it.
7. **The frame's route map** — the nine destinations, the four static routes, the
   three bare routes, the guest sign-in target, and the Profile settings anchor
   (FR-024).
8. **The backup and restore tooling** — PostgreSQL's built-in `pg_basebackup` plus
   WAL archiving, the `pg_restore` wrapper, the encryption of every archive
   (AES-256-GCM), the RTO/RPO, the drill, the post-disaster restore's state
   (FR-055), the in-memory estimate that resets, the key-encryption key's custody
   as the restore's one unrebuildable input, the release-level rollback's down
   direction and state loss, the PostgreSQL Licence, and the vulnerability scan
   (register-gap closure). **Recorded as ADR-142.**
9. **The continuous-integration provider** — GitHub Actions, the job set, the
   offline-by-default rule, the SHA-pinned actions, and the register-gap closure
   with its licence obligation and vulnerability scan. **Recorded as ADR-143.**
10. **The SBOM generator** — `@cyclonedx/cyclonedx-npm`, the CycloneDX JSON
    produced per build, its consumption by the release job, and the register-gap
    closure with its Apache-2.0 licence and vulnerability scan.
    **Recorded as ADR-144.**
11. **The automated accessibility checker** — `@axe-core/playwright` (MPL-2.0), a
    dev-only CI gate that is never shipped, its licence obligation, its
    vulnerability scan, and its review date. **Recorded as ADR-145.**
12. **The provisioning boundary, the initial password, and the audit log** — why the operator-run
    provisioning action is not an administrator operation under the
    constitution's audit rule, that the FR-037 structured security event
    records it instead, the record's six-field floor and its per-event fields,
    its emission before the response with the failure mode that changes no
    outcome, the provisioning action's exception (a failed emit turns its
    report into a failure that names the account identifier and exits
    non-zero), and how the initial password is handled: accepted only
    from a hidden prompt or standard input, never a value in argv, an environment
    variable, or a stored file; never echoed, logged, recorded, or re-displayed;
    handed to the administrator by the operator over a channel the operator
    controls, with no platform surface carrying it (FR-028). The rule's scope is
    the credential rather than a platform secret: Query Safety and Secrets'
    secret-manager or environment-injection requirement governs the platform's
    own keys, which the action still reads from the environment, while this
    one-off password is supplied by the operator and is never read from the
    environment or a file.
13. **Public API versioning and the deprecation rule** — the `/api/v1` path
    segment every public route carries, the unversioned `/health` operational
    probe outside the versioned surface, the notice of at least one release that
    a removal requires, and the ADR that records each deprecation; R1 ships
    version 1 with no deprecated route, so the record fixes the rule later
    slices follow and announces no removal. **Number assigned at append time.**
14. **The SC-009 load profile and its verdict** — the condition is measured as
    20 origin keys and 600 number keys, never as one client at 10 requests per
    second; the limiter is never disabled, raised, or skipped for a measurement,
    and the verdict reports attempted, accepted, and refused counts and fails on
    any refusal, with a post-run probe proving the limiter was live. The record
    binds R12's load test as well as R1's, so a later slice cannot buy a lower
    percentile by measuring a bypassed limiter. The channel's acceptance wait is
    a declared nominal — the fake's `SMS_FAKE_ACCEPT_MS` at **50 ms** inside
    every dispatch, with a run failed when a dispatch is faster than it — and
    the work-alone p95 is held to **250 ms**, the share of SC-009's 1,000 ms
    that leaves the provider's 750 ms ceiling inside the budget. **Number
    assigned at append time.**
15. **The silent hidden-field refusal's mechanism** — the 202 a filled hidden
    field receives is the same response a successful submission receives (status,
    headers, field set, and types) with a generated but unstored `requestId` and
    resume token, and the page's next step is decided by the resume read rather
    than by the 202: a live row answers 200 and the page enters `code`, while the
    unstored id answers `OTP_EXPIRED` and the page stays on `form` with no
    message; no row is written, no code is dispatched, and no security event is
    emitted (FR-029, AC-031). The response's duration is covered on the same
    record: the refusal performs the success path's pre-dispatch work on a
    discarded copy and then waits the channel's own current acceptance duration —
    one in-memory scalar, the rolling median of the **last sixteen** accepted
    dispatches, never keyed by number or client, capped at the 750 ms provider
    timeout — so it is not observably faster than a successful submission's 202,
    measured one-sided at median ≤ 50 ms and p95 ≤ 150 ms over the enumeration
    test's sampling with the fake's acceptance set to **200 ms** so a refusal that
    does not wait fails both limbs; the fake's duration is the configurable
    `SMS_FAKE_ACCEPT_MS` (0 to 750 ms, `0` by default), and the estimator has its
    own unit test. Full equality with the acceptance wait is rejected because it
    is unreachable
    without a dispatch, which FR-029 forbids, and because a wait covering the
    channel's tail would make the refusal slower than a success and breach the
    response budget. **Number assigned at append time; appended by
    T142 in `tasks.md`.**
16. **The copy's authority and measurable bindings** — the contract as the single
    record (the capture set as evidence of composition and appearance only, and the
    inventory stated once there); the SMS segment bound (UCS-2, counted in
    UTF-16 code units after the code is substituted: 70 for a one-time-code body
    and 134 for a notice, a build failure and never a truncation or a split); the
    emoji predicate's Unicode data pin (18.0.0, the vendored `emoji-data.txt` and
    its SHA-256, the generated range table, the runtime-independence rule, and the
    upgrade rule that a verdict change is the specification's amendment); the
    numerals' single source (`packages/shared/src/limits.ts`, the copy's slots, the
    agreement classes the test pins, and the two checks); the destination and
    action labels (the nine sidebar, the four footer, and the act/in-progress
    pairs, with a navigating control carrying the name and no in-progress
    label); the code step's five endings and their one text per event; the city
    combobox's no-match row and its build-failure empty list; the templates'
    render-failure rule; the `lang` marking (`SMS` as `en`, no `lang` on a numeral
    or a supplied value); and the message body's direction rule (no bidi control,
    the code's isolated run, rule N1). **Number assigned at
    append time; appended by T143 in `tasks.md`.**

## Phase 0 / Phase 1 artifacts

- [`research.md`](./research.md) — the decisions, rationale, and alternatives
  behind every value above.
- [`data-model.md`](./data-model.md) — the columns, constraints, indexes,
  state transitions, and non-entity stores.
- [`contracts/auth-api.md`](./contracts/auth-api.md) — the HTTP contract.
- [`contracts/ui-contracts.md`](./contracts/ui-contracts.md) — the route map, the
  page state machines, the frame's component contract, and the Arabic copy and
  its inventory.
- [`quickstart.md`](./quickstart.md) — the runnable validation guide.
