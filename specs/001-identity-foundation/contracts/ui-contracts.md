# Contract — Pages, States, Copy, and the Frame

**Feature**: `001-identity-foundation` | **Date**: 2026-10-29 | **Plan**: [plan.md](../plan.md) | **API**: [auth-api.md](./auth-api.md)

The pages this slice ships — Sign Up, Sign In, Forgot Password — and the shared
frame it builds without rendering. The design values (colour, type scale,
spacing, radius, focus ring, measurements, the wordmark's form) live in the
Wafar UI layer at `packages/ui` and are fixed by ADR-128; the appearance is
ADR-137's (light on a first visit, a stored choice wins). This document records
the composition, the state machines, the accessible behaviour, the route map,
and every Arabic string, because the specification makes the literal text a
fixed design value this contract records once (FR-026, FR-008, FR-009, FR-034,
FR-035), and AC-028 asserts that every rendered string is the one recorded for
its state, reason, or cause.

**The inventory.** This document is the complete inventory of the user-facing
strings this slice delivers: §2 (the bare layout's wordmark and document title),
§3 (the sign-up page, its states, and its copy), §4 (sign-in and its states), §5
(recovery and its states), §6 (the shared message table), §7 (the four SMS
bodies), and §8 (the frame's labels, accessible names, ended-session state, and
appearance). No page, component, or message template composes a string outside
this set, and no string is taken from a capture or from the external lab against
this record.

The reference screenshots in `docs/design/screenshots/R1/` are evidence of the
reference appearance, not a baseline (ADR-128, ADR-129). Where the reference and
the specification differ, the specification wins and the difference is recorded
in the plan's Complexity Tracking.

## 1. Route map

Fixed once by the plan's decision record (FR-024, FR-036); exported from
`packages/shared/src/routes.ts` as one object, read by the frame, the pages, the
tests, and later slices.

| Destination | Route | R1 ships it |
|---|---|---|
| Home | `/` | no (R5) |
| Parts | `/parts` | no (R5) |
| Catalog | `/catalogs` | no (R6) |
| Upload Catalog | `/upload` | no (R2) |
| My Files | `/my-files` | no (R4) |
| Cart | `/cart` | no (R8) |
| Notifications | `/notifications` | no (R9) |
| Messages | `/messages` | no (R10) |
| Profile | `/profile` | no (R7) |
| Profile settings section | `/profile#settings` | no (R7) |
| Contact | `/contact` | no (R11) |
| Privacy Policy | `/privacy` | no (R11) |
| Terms of Use | `/terms` | no (R11) |
| FAQ | `/faq` | no (R11) |
| Sign up | `/auth/sign-up` | **yes** |
| Sign in | `/auth/sign-in` | **yes** |
| Password recovery | `/auth/forgot-password` | **yes** |
| Guest sign-in action | `/auth/sign-in` | target only |
| Logo/home control | `/` | target only |
| Notifications control | `/notifications` | target only |
| Sign out | no route | — |

No route outside this table is built, and no later slice moves a route it fixes.
The three bare pages are the only pages R1 renders. No route in this table
carries a mobile number: the three pages take it in the form's submitted body,
and the one-time-code step adds no route, so the browser's address, a history
entry, and a referrer stay free of it (FR-037, FR-038).

Each destination's recorded Arabic name is the surface's: the sidebar's nine
labels and the footer band's four are §8.3's, the header's control names and the
account menu's three items are §8.2's and §8.3's, and the three bare pages'
titles are §2's. The
destination names in this table — and in the specification — are the
destinations' identifiers, not a second text, so a destination carries exactly
one Arabic name and this table and §8.3 are read together.

## 2. The bare layout

`apps/web/app/layouts/bare.vue`, used by all three pages (FR-021).

```
┌──────────────────────────────────────────────┐
│  wordmark  «منصة وفر»   (non-interactive)     │
│  page title                                   │
│  subtitle (one line, optional)                │
│  ┌────────────────────────────────────────┐   │
│  │ one form card                          │   │
│  └────────────────────────────────────────┘   │
│  the page's cross-links                       │
└──────────────────────────────────────────────┘
```

- **No frame**: no header, no sidebar, no bottom bar, no footer band (FR-021).
- The wordmark is a brand mark, **not** the frame's logo/home control: no link,
  no `role="link"`, no pointer cursor. It is the same `WfWordmark` the frame uses,
  in its non-interactive variant.
- The page title names the page and sits above the card; the card holds the
  current step only. The step is not a route (FR-038). The visible title is the
  page's own Arabic name — «إنشاء حساب», «تسجيل الدخول», «نسيت كلمة المرور»
  (§3.4, §4.2, §5.2) — and carries no brand, because the wordmark above it is
  the brand.
- The pages are server-rendered, call no session endpoint, and render identically
  for a signed-in person and a guest (FR-041). A reload after a completed action
  returns the page to its first step, with no confirmation re-shown and no
  redirect.
- `<html dir="rtl" lang="ar">` is set by `apps/web/app/app.vue` for every page,
  and the frame's components set no direction or language of their own,
  inheriting the document's; the appearance is applied before paint by a blocking inline script carrying the
  CSP nonce (ADR-137). A stored choice wins over light.
- Logical CSS properties only. The card's width, spacing, type, and focus ring
  come from the layer's tokens; this contract fixes the composition and the
  floors: 320 CSS px reflow, 44 × 44 px touch targets on coarse pointers, a 2 px
  `:focus-visible` ring, `prefers-reduced-motion` honoured.
- Document title: `<page name> — منصة وفر` — the page's own name first, then
  the brand in the Glossary's exact form, so the three are distinguishable in a
  tab, in history, and in a screen reader's page list (FR-021).

### 2.1 Common form behaviour (FR-040)

- Every submission shows an in-progress state, disables the submit control (and
  the resend control while a resend is in flight), and cannot start a second
  request. The guard is presentation only; the server's rules are the authority.
- A refusal keeps the page on the step that was submitted and shows one inline
  message attached to the field or to the card. No navigation, no error page.
- A notice ends the step it belongs to: when the incorrect-entry bound is
  reached, or the pending request or the verified state has ended, the step ends
  and the page returns to its first step with the status message §3.1 and §5.1
  name, because no step whose request has ended stays shown (FR-034, FR-038).
- After a refusal the person's values stand **except** every password field and
  the one-time-code field, which are cleared and never re-displayed (FR-038,
  FR-040). The mobile number, full name, city, and shop name stand.
- Announcements: in-progress, `done`, every terminal outcome state, the resend's
  accepted status, and the status message a code step ending returns to the first
  step with (`expired_notice` or `ended_notice`) →
  `role="status"` (polite); a refusal → `role="alert"`. The message element
  carries an `id` and the field references it with `aria-describedby`;
  `aria-invalid` is set on the field.
- When a step replaces another, focus moves to the new step's first field, or to
  its heading (`tabindex="-1"`) when it has none, and never remains on a control
  the previous step carried (FR-040).
- Numerals are Latin everywhere the platform renders a number, including the
  phone's prefix, the code, counts, and the SMS body. The code and phone inputs
  accept Arabic-Indic digits and normalize them (FR-031); nothing Arabic-Indic is
  ever rendered.
- A field-level message is never shown before the field is submitted once.

**The action's label and the in-progress label.** One act carries one label
wherever it appears, and a control that makes a request shows its act's label
while idle and the in-progress label while that request is in flight — never
both, and never a second sentence beside it. The ellipsis is U+2026 HORIZONTAL
ELLIPSIS: one character, written against the last word with no space before it,
and three full stops (U+002E repeated) are not the same character and fail the
copy scan.

| Act | Idle label | In-progress label | Where |
|---|---|---|---|
| Request a one-time code | `إرسال رمز التحقق` | `يجري الإرسال…` | The sign-up form and the recovery form |
| Verify the code | `تحقق` | `يجري التحقق…` | Both code steps |
| Request a new code | `إرسال رمز جديد` | `يجري الإرسال…` | Both code steps' resend |
| Edit the data and return to the first step | `تعديل البيانات` | — | The sign-up code step (no request) |
| Change the number and return to the first step | `تغيير الرقم` | — | The recovery code step (no request) |
| Sign in | `تسجيل الدخول` | `يجري تسجيل الدخول…` | The sign-in form makes the request; the guest's header action and the ended-session state's control carry the same name but navigate, so they show no in-progress label; the sign-up form's cross-link carries the same name inside «لديك حساب؟ تسجيل الدخول» |
| Set the new password | `تعيين كلمة المرور` | `يجري الحفظ…` | The recovery new-password step |
| Go to sign-in after a terminal success | `الانتقال إلى تسجيل الدخول` | — | The sign-up and recovery `done` states (a navigation, not a request) |

Only the return from a code step carries two labels, because the step it returns
to is not the same form: the sign-up flow edits a five-field form and the
recovery flow a number-only form, so each label names what the person edits. The
code steps' `تحقق` and `إرسال رمز جديد` are identical on both pages, and the
request for a code is `إرسال رمز التحقق` on both first steps. A control that
navigates names its destination or the move it makes — the form's cross-link
names the destination, `تسجيل الدخول`, and the done state's way forward names the
move, `الانتقال إلى تسجيل الدخول` — while a control that acts names the act. A
control that navigates makes no request, so it carries its name and no
in-progress label.

**One state, one text.** A state renders the heading, body, and controls its
page's copy table records for it, and never another state's: the sign-in `done`
(«تم تسجيل الدخول»), the sign-up `done` («تم إنشاء حسابك»), the recovery `done`
(«تم تعيين كلمة المرور»), the sign-up outcomes `existing`, `blocked`, and
`administrator`, the recovery outcomes `no_account` and `administrator`, and the
frame's `ended` and `blocked` variants (§3.4, §4.2, §5.2, §8.4) each carry their
own text, and the same state name on two pages is two recorded outcomes rather
than one text reused. The one deliberate sharing is recovery's `done` and
`done_blocked`: the same heading, «تم تعيين كلمة المرور», with two bodies, because
the heading states what succeeded and the body states the account's state. A
notice, a refusal, and a terminal outcome are distinct classes as well:
`OTP_REQUEST_ENDED` renders as a status and never as an alert (§6), and a refusal
renders on the step that was submitted.

## 3. Sign Up — `/auth/sign-up`

### 3.1 States

| State | Shown | Controls | Exit |
|---|---|---|---|
| `form` | Title, subtitle, full name, phone (+218 prefix), password, city combobox, optional shop name, submit, cross-link to sign-in | `إرسال رمز التحقق` | submit → `submitting`; validation refusal stays `form` |
| `submitting` | Same form, all controls disabled, submit shows `يجري الإرسال…` | none | 202 + a live request at the resume read → `code`; 202 + `OTP_EXPIRED` at the resume read → `form` (unchanged, no message); refusal → `form_error`; `OTP_SEND_FAILED` → `form_error` with a retryable message |
| `form_error` | Form + inline refusal | as `form` | as `form` |
| `code` | Heading, body, read-only full name / phone / city / shop name, code field, submit, resend, back | `تحقق`, `إرسال رمز جديد`, `تعديل البيانات` | submit → `verifying`; resend → `resending`; back → `form` (values kept, password empty); the request's lifetime elapses → `expired_notice` |
| `verifying` | Code step, controls disabled, submit `يجري التحقق…` | none | 200 → `done` / `existing` / `blocked` / `administrator`; refusal → `code_error`; a response that reports the request ended → `expired_notice` |
| `code_error` | Code step + inline message | as `code` | as `code` |
| `resending` | Code step, resend disabled, `يجري الإرسال…` | none | 202 → `code` + status; refusal → `code_error` |
| `expired_notice` | `form` + status message `OTP_EXPIRED`; full name, phone, city, and shop name kept, password empty | as `form` | as `form` |
| `ended_notice` | `form` + status message `OTP_REQUEST_ENDED`; full name, phone, city, and shop name kept, password empty | as `form` | as `form` |
| `done` | Heading `تم إنشاء حسابك`, body | cross-link to sign-in | terminal (a reload returns to `form`) |
| `existing` | Heading, body, two links | sign-in and recovery links | terminal |
| `blocked` | Heading, body | cross-link to sign-in (kept; the page's own link) | terminal |
| `administrator` | Heading, body | cross-link to sign-in (kept) | terminal |

The `done` state is an in-place replacement of the code step: no navigation, no
new route, no new page (FR-004). `existing`, `blocked`, and `administrator` are
also in place; the pending request is deleted by the server before the response,
so a reload shows `form` (FR-006, FR-034).

`expired_notice` ends a code step whose pending request has reached its own
lifetime: the step ends at that moment, the page returns to `form` in place —
no navigation, no route, no new page — with `OTP_EXPIRED` as a status message,
and the values are kept except the password, which the page never retains
(FR-034, FR-038). A code submitted in that moment is refused as expired and
does not increment the bound (FR-034). The response alone does not choose the
state, because `OTP_EXPIRED` also answers a superseded code: the page reads its
request back and enters `expired_notice` when the request is no longer live — its
lifetime elapsed, or the platform no longer holds it — and otherwise, with the
request live, shows the message on `code_error`. A step that was never shown is
not ended: the resume read that leaves `submitting` after a 202 stays on `form`,
as the silent refusal's paragraph below states.

**Why the silent refusal ends on `form`.** A 202 does not choose the step. After
any 202 the page reads its request back —
`GET /api/v1/auth/verifications/{requestId}` with the pending cookie — and enters
`code` only on that read's 200. The hidden-field refusal receives the same 202 as
a success (the same status, headers, field set, and types) with a generated but
unstored `requestId` and resume token, so the read answers `OTP_EXPIRED` and the
page stays on `form`, unchanged, with no message and no code step. Unless the
operation's limit refuses the request first (FR-051; AC-031; AC-033), that
silent 202 holds (plan record 15; AC-031): a submission whose account-creation
budget is already spent is decided by the limit first and receives the distinct,
explicit limit refusal whatever else is wrong with it, a filled hidden field
included. Because that
read is the transition out of `submitting`, before any code step was shown, the
expiry message that belongs to `code` is never rendered; the response itself
carries no next-step content — no field names the step or the outcome, and the
`requestId` and the two expiries are the same shape in both responses — so the
same response leads a successful submission to the code step (FR-029, FR-051,
AC-031; plan record 15, T142).

### 3.2 Field rules

| Field | Rule |
|---|---|
| Full name | Required; trimmed; 1–100 characters; any letters and numerals; no emoji (the predicate FR-026 fixes); `autocomplete="name"` |
| Phone | `+218` fixed prefix, no dial-code selector; 9 national digits; accepts Arabic-Indic digits, separators, spaces; `inputmode="numeric"`, `autocomplete="tel-national"`; the placeholder is `91 000 0000` |
| Password | Required; the policy statement sits above the field; `autocomplete="new-password"`; never re-displayed, never echoed, never masked-back |
| City | A combobox over the bundled list; search ignores diacritics and matches substrings; only an entry's exact name is submitted; `autocomplete="off"` |
| Shop name | Optional; trimmed; ≤ 100 characters; no emoji (the predicate FR-026 fixes); empty-after-trim is sent as absent |
| Honeypot | A field named `website`, off-screen, `tabindex="-1"`, `aria-hidden="true"`, `autocomplete="off"`, no label. A non-empty value produces the silent success of the API contract and stops the flow (FR-029) |
| Minimum time | The page keeps the `formStamp` the render bootstrap (`GET /api/v1/auth/csrf`) returned and submits it unchanged; a submission under 3 s since that stamp's issuance, or one whose stamp the platform did not issue, was altered, is for another surface, or is older than 30 min, is refused explicitly and retryably. The refusal is retryable on the same page: the page takes a fresh bootstrap pair — token and stamp — after a `FORM_TOO_FAST`, keeps every typed value, and lets the person submit again, so a stale stamp is resolved by retrying rather than by reloading |

**The city combobox's empty state.** The listbox shows the matching entries;
when the query matches none it shows one row, `لا توجد مدينة مطابقة`, which is
not selectable, is not a submitted value, and is announced with the listbox. The
closed control shows the placeholder `اختر المدينة` while no entry is chosen, so
the placeholder and the no-match row are different states. The bundled list has
no empty runtime state: a list with no entry is a build failure the completeness
test catches (plan → Verification Notes, FR-005), and if one were ever shipped
the no-match row would be the listbox's only content rather than a blank panel. A
submitted value that is not an entry is refused `CITY_NOT_IN_LIST` (§6), not by
the no-match row.

The password policy statement (before the field, always visible):

> 12 حرفا على الأقل و128 حرفا كحد أقصى، وليست من كلمات المرور الشائعة أو المسربة.

The two numerals are slots from `packages/shared/src/limits.ts`, not typed text;
§6 records the binding, its CMV source, and the agreement class.

- The incorrect-entry bound is not a field rule: the fifth incorrect entry ends
  the request and returns the page to `form` in `ended_notice` with the
  `OTP_REQUEST_ENDED` status message, keeping the full name, phone, city, and shop
  name and clearing the password (FR-034, FR-038).

### 3.3 The code step

It is a step of the same page (FR-038): no route, no page, no register change.
It shows, read-only and in Latin numerals, the fields the flow collected — full
name, the canonical mobile number, city, and the shop name
when present — plus the code field, `تحقق`, `إرسال رمز جديد`, and
`تعديل البيانات`. It never shows the password in any form.

The mobile number is rendered in the one display form FR-038 fixes:
`+218 91 234 5678` — the prefix, then a single space, then the nine national
digits grouped 2-3-4 with a single space between groups (U+0020), in Latin
digits. The stored form is the unspaced canonical number `+218912345678`
(FR-031), so the two are stated apart and neither is derived from the other.
The whole value sits in one isolated left-to-right run under the layer's numeral
utility (`direction: ltr; unicode-bidi: isolate`), so its groups keep their order
inside the right-to-left page, and it does not wrap or break across lines. Every
place the platform shows the number uses this same form and this same isolation;
the placeholder `91 000 0000` groups the national digits the same way, and it is
not a second display form because it carries no prefix.

Each value a person supplies is rendered as one isolated bidirectional run:
the whole value in a single `<bdi dir="auto">`, whose direction is resolved from
the value's own first strong character, with no fixed `dir="ltr"` or `dir="rtl"`
set on it by any component. An Arabic-first name therefore stays right-to-left
with its Latin word
embedded in reading order, and a Latin-first value renders left-to-right, while
the surrounding Arabic is unchanged. The value is never split across elements,
never concatenated with platform copy inside the run, and never given `dir="rtl"`
or `dir="ltr"` by hand (FR-045).

- Code field: 6 digits, `inputmode="numeric"`, `autocomplete="one-time-code"`,
  `maxlength="6"`, paste allowed; Arabic-Indic digits are accepted and read as
  the same digits (FR-031).
- The expiry hint is always visible: `تنتهي صلاحية الرمز بعد 5 دقائق.`
- The hint states the bound the request was issued under, not a running count:
  it reads the same from the moment the step is shown until the request ends, and
  it is not a countdown. The message body states the same bound from the
  dispatch's side — `صالح 5 دقائق.` — so the two channels state one value from two
  positions, both rendered from `{otpLifetimeMinutes}`, and neither is a second
  bound (§7).
- `إرسال رمز جديد` is disabled while a dispatch is in flight and after the third
  accepted re-request, with the reason stated inline (FR-034, FR-040).
- `تعديل البيانات` returns to `form`, keeps every field except the password, and
  ends the page's tie to the pending request while the request itself stays live
  (FR-038).
- A reload while the request is live and the code unverified shows `code` again
  for the request this browser is tied to (the most recent submission from it).
  The page learns that from the resume read
  (`GET /api/v1/auth/verifications/{requestId}`, authenticated by the pending
  cookie), which returns the read-only payload and the state; it never stores a
  step or a name in browser storage.
- A reload after verification shows `form`, not the confirmation: the pending
  request is consumed and the confirmation is never re-shown (FR-041).
- The fifth incorrect entry deletes the request; the page returns to `form` with
  the `OTP_REQUEST_ENDED` status message.
- A superseded code — one a replacement has superseded while the request stays
  live — keeps the page on `code` with the expired-or-superseded message; it does
  not increment the bound (FR-034).
- When the pending request's own lifetime elapses while the step is shown, the
  step ends at that moment: the page returns to `form` in `expired_notice` with
  `OTP_EXPIRED` as a status message — no navigation, no route, no new page — and
  a code submitted after that moment is refused as expired and does not increment
  the bound (FR-034, FR-038).
- When the number already has an account, the code verifies and the page states
  the outcome in place: the active-merchant message carries the two links; the
  blocked and administrator messages state their fact and carry no retry control
  (FR-006).

### 3.4 Copy

| Element | Arabic |
|---|---|
| Title | إنشاء حساب |
| Subtitle | المنصة ليبية: الرقم يبدأ دائما بـ +218، ولا يوجد اختيار لرمز الاتصال. |
| Full name label | الاسم الكامل |
| Phone label / prefix / placeholder | رقم الهاتف / +218 / 91 000 0000 |
| Password label | كلمة المرور |
| City label / helper / placeholder / empty | المدينة / قائمة ثابتة قابلة للبحث / اختر المدينة / لا توجد مدينة مطابقة |
| Shop name label / optional | اسم المحل / اختياري |
| Submit | إرسال رمز التحقق |
| Footnote | سيصلك الرمز برسالة SMS إلى الرقم نفسه، ودخول الحساب الموثق لا يحتاج رمزا. |
| Cross-link | لديك حساب؟ تسجيل الدخول |
| Existing links | تسجيل الدخول / نسيت كلمة المرور |
| Code heading / body | رمز التحقق / أرسلنا رمزا من 6 أرقام برسالة SMS إلى رقمك. |
| Code label / hint | رمز التحقق / 6 أرقام |
| Code submit / resend / back | تحقق / إرسال رمز جديد / تعديل البيانات |
| Expiry hint | تنتهي صلاحية الرمز بعد 5 دقائق. |
| Done heading / body | تم إنشاء حسابك / حسابك جاهز، وأنت مسجل الدخول الآن. |
| Done link | الانتقال إلى تسجيل الدخول |
| Existing heading / body | رقمك مسجل مسبقا / هذا الرقم له حساب على المنصة. سجل الدخول أو استعد كلمة المرور. |
| Blocked heading / body | الحساب موقوف / هذا الرقم له حساب موقوف. يبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله. |
| Administrator heading / body | الحساب إداري / هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة. لا ينطبق عليه تسجيل الدخول أو الاستعادة من هنا. |

**Script, diacritics, and Latin tokens.** Every string in this section — and
every string in §2, §3, §4, §5, §6, §7, and §8 — is platform copy, and the
diacritics and permitted-token rules FR-026 fixes apply to all of it, judged by
the same string scan (AC-028, SC-008, T100). It carries no diacritics: a
combining mark in the range U+064B–U+0652, or the superscript alef U+0670, is a
defect with no exception, so «تحقق», «الموثق», «مسجل», «المسربة», «دائما», and
«رمزا» are written unmarked, and a word whose mark carried its meaning is
reworded rather than marked: the sign-up subtitle reads «المنصة ليبية: الرقم يبدأ
دائما بـ +218، ولا يوجد اختيار لرمز الاتصال.»; the four in-progress labels read
«يجري الإرسال…», «يجري التحقق…»,
«يجري تسجيل الدخول…», and «يجري الحفظ…»; the sign-up footnote reads
«سيصلك الرمز برسالة SMS…»; the recovery subtitle reads «سيصلك رمز على رقمك
المسجل…»; the too-fast message reads «أرسلت النموذج…»; and the session notices
read «انتهت كل الجلسات…» and «انتهت جلسات حسابك…». The only Latin characters
that copy may carry are the digits 0–9, the `+218` prefix, and the exact token
`SMS`; Principle V's four product-wide names — PDF, Excel, OEM, SKU — are
permitted for the whole product and used nowhere here, and any other Latin
letter sequence needs a recorded decision before it may appear. `{code}` in §7
is not user-facing text: it is a placeholder replaced by Latin digits before the
body is sent. The rule binds platform copy alone — an entry in the fixed city
list and a value a person supplies keep the marks and the script they carry, and
the city search still ignores diacritics (FR-005).

**The Latin run's language.** The document declares `lang="ar"` and `dir="rtl"`
(§2); a run whose characters are not Arabic is marked for assistive technology
where its language is known, and left unmarked where it is not. The token `SMS`
is English, so each rendered occurrence is one inline element carrying
`lang="en"` — the rendered text is unchanged, and the copy scan reads its
characters, not its markup. The `+218` prefix and the one-time code are numerals:
they carry no language of their own and are read in the surrounding Arabic, so
no `lang` is set on them, and their order is kept by the numeral utility's
isolated left-to-right run (§3.3) rather than by a language mark. A value a
person supplies carries no `lang` either, because the platform does not know the
language it is written in and must not guess it: its direction is the `bdi`
element's `dir="auto"` and its text stands as typed (FR-045). No component sets
a base language or a base direction of its own; the document's declaration is
inherited (FR-026).

## 4. Sign In — `/auth/sign-in`

### 4.1 States

| State | Shown | Controls | Exit |
|---|---|---|---|
| `form` | Title, subtitle, phone, password, submit, two cross-links | `تسجيل الدخول` | submit → `submitting` |
| `submitting` | Form disabled, submit `يجري تسجيل الدخول…` | none | 200 → `done`; 401 → `form` + uniform message |
| `form_error` | Form + inline message; phone kept; password cleared | as `form` | as `form` |
| `done` | Heading `تم تسجيل الدخول`, body; the two cross-links remain | cross-links | terminal (a reload returns to `form`) |

There is **no lock state and no blocked state**: the lock, the block, the
administrator role, an unknown number, and a wrong password all render the same
`form_error` with the same text (FR-008, FR-009, FR-017, FR-027). No alert,
banner, count-down, or "try later" hint is added for the lock; `RATE_LIMITED` is
the only refusal with its own message, and it names the limit, never the account.

### 4.2 Copy

| Element | Arabic |
|---|---|
| Title | تسجيل الدخول |
| Subtitle | برقم هاتفك الليبي وكلمة المرور. |
| Phone label / prefix / placeholder | رقم الهاتف / +218 / 91 000 0000 |
| Password label | كلمة المرور |
| Submit | تسجيل الدخول |
| In progress | يجري تسجيل الدخول… |
| Cross-links | إنشاء حساب / نسيت كلمة المرور |
| Done heading / body | تم تسجيل الدخول / أنت مسجل الدخول الآن. |

## 5. Forgot Password — `/auth/forgot-password`

### 5.1 States

| State | Shown | Controls | Exit |
|---|---|---|---|
| `form` | Title, subtitle, phone, submit, cross-link to sign-in | `إرسال رمز التحقق` | submit → `submitting` |
| `submitting` | Form disabled, submit `يجري الإرسال…` | none | 202 → `code`; refusal → `form_error` |
| `form_error` | Form + inline message | as `form` | as `form` |
| `code` | Heading, body, read-only phone, code field, submit, resend, back | `تحقق`, `إرسال رمز جديد`, `تغيير الرقم` | submit → `verifying`; the request's lifetime elapses → `expired_notice` |
| `verifying` | Code step disabled, `يجري التحقق…` | none | 200 `verified` → `new_password`; `no_account` → `no_account`; `administrator_account` → `administrator`; refusal → `code_error`; a response that reports the request ended → `expired_notice` |
| `code_error` | Code step + inline message | as `code` | as `code` |
| `resending` | Code step, resend disabled, `يجري الإرسال…` | none | 202 → `code` + status; refusal → `code_error` |
| `new_password` | Heading `كلمة مرور جديدة`, policy statement, new password field, submit | `تعيين كلمة المرور` | submit → `setting`; `RECOVERY_EXPIRED` → `form` + expiry notice |
| `setting` | New-password step disabled, `يجري الحفظ…` | none | 200 → `done` or `done_blocked` |
| `done` | Heading `تم تعيين كلمة المرور`, body, link to sign-in | link | terminal |
| `done_blocked` | Same heading, blocked body, **no** sign-in link | none | terminal |
| `no_account` | Heading, body, link to sign-up | link | terminal |
| `administrator` | Heading, body, no retry control | the page's cross-link to sign-in | terminal |
| `expired_notice` | `form` + status message — `RECOVERY_EXPIRED` when the verified state ended at the new-password or setting step, `OTP_EXPIRED` when the pending request ended at the code step; phone kept | as `form` | as `form` |
| `ended_notice` | `form` + status message `OTP_REQUEST_ENDED`; phone kept | as `form` | as `form` |

- The code step is a step of this page (FR-038) and shows the canonical mobile
  number only — never the name, city, or shop name, which would reveal that the
  number has an account (FR-015, FR-038).
- The verified state survives a reload: the page shows `new_password` again, from
  the resume read's `state: "verified"` (API contract §5.3.1), not from browser
  storage.
- `RECOVERY_EXPIRED` at the new-password or setting step returns to `form` with
  `انتهت صلاحية الطلب. اطلب رمزا جديدا.` The same answer covers a verified
  state that a concurrent password change deleted (FR-014): the notice states
  that the request's validity has ended, not that its clock ran out, so the person
  is not told the wrong reason and no second message is added.
- When the pending request's own lifetime elapses while a code-step state is
  shown, the step ends at that moment and the page returns to `form` in
  `expired_notice` with `OTP_EXPIRED` —
  `انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.` — with no navigation,
  no route, and no new page; a code submitted after that moment is refused as
  expired and does not increment the bound, and a superseded code, whose request
  is still live, stays on `code_error` instead (FR-034, FR-038).
- The fifth incorrect entry returns to `form` with the ended notice.
- `no_account` and `administrator` are terminal and in place: no navigation, no
  route, and **no retry control**, because there is nothing to retry (FR-014).
- A blocked account's reset completes: `done_blocked` states both facts and
  offers no sign-in that cannot succeed (FR-014).
- The page never sends a signed-in person anywhere: it renders as it does for a
  guest (FR-041).

### 5.2 Copy

| Element | Arabic |
|---|---|
| Title | نسيت كلمة المرور |
| Subtitle | سيصلك رمز على رقمك المسجل. لا نكشف وجود الحساب قبل التحقق من الرمز. |
| Phone label / prefix / placeholder | رقم الهاتف / +218 / 91 000 0000 |
| Submit | إرسال رمز التحقق |
| Cross-link | تسجيل الدخول |
| Code heading / body | رمز التحقق / أرسلنا رمزا من 6 أرقام برسالة SMS إلى رقمك. |
| Code submit / resend / back | تحقق / إرسال رمز جديد / تغيير الرقم |
| New-password heading | كلمة مرور جديدة |
| New-password label / submit | كلمة المرور الجديدة / تعيين كلمة المرور |
| Done heading / body | تم تعيين كلمة المرور / انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة. |
| Done, blocked | تم تعيين كلمة المرور / انتهت كل الجلسات السابقة. الحساب موقوف، ويبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله. |
| Done link | الانتقال إلى تسجيل الدخول |
| No account heading / body / link | لا يوجد حساب لهذا الرقم / لا يمكن إعادة تعيين كلمة مرور لرقم بلا حساب. أنشئ حسابا أو تحقق من الرقم. / إنشاء حساب |
| Administrator heading / body | لا يمكن إعادة التعيين من هنا / هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة. |

The new-password step's policy statement is §3.2's sentence, rendered from the
same slots — one string, not a second text — and the step shows it above the
field as §3.2 does. The code step's field label `رمز التحقق`, its digit hint
`6 أرقام`, and its expiry hint `تنتهي صلاحية الرمز بعد 5 دقائق.` are §3.4's and
§3.3's strings, rendered from the same slots — one string each, not second
texts — and the step shows them beside the field as §3.3 does.

## 6. Messages shared by the three pages

| Code (API) | Reason | Arabic | Where |
|---|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | — | رقم الهاتف أو كلمة المرور غير صحيحة. | The sign-in form's card — the message names the pair, not one field — and the change-password current-password check (no page in R1) |
| `INVALID_PHONE` | — | أدخل رقم هاتف ليبي صحيحا يبدأ بـ +218. | Any phone field |
| `INVALID_FULL_NAME` | `empty` | أدخل الاسم الكامل. | Sign-up |
| `INVALID_FULL_NAME` | `too_long` | الاسم الكامل يتجاوز 100 حرف. | Sign-up |
| `INVALID_FULL_NAME` | `emoji` | الاسم الكامل لا يقبل الرموز التعبيرية. | Sign-up |
| `INVALID_SHOP_NAME` | `too_long` | اسم المحل يتجاوز 100 حرف. | Sign-up |
| `INVALID_SHOP_NAME` | `emoji` | اسم المحل لا يقبل الرموز التعبيرية. | Sign-up |
| `CITY_NOT_IN_LIST` | — | اختر مدينة من القائمة. | Sign-up |
| `PASSWORD_TOO_SHORT` | — | كلمة المرور أقصر من 12 حرفا. | Sign-up, new password |
| `PASSWORD_TOO_LONG` | — | كلمة المرور تتجاوز 128 حرفا. | Sign-up, new password |
| `PASSWORD_TOO_COMMON` | — | كلمة المرور شائعة أو ظهرت في تسريبات سابقة. اختر كلمة أخرى. | Sign-up, new password |
| `PASSWORD_UNCHANGED` | — | كلمة المرور الجديدة مطابقة للكلمة الحالية. اختر كلمة مختلفة. | Reserved for the administrator surface (R13) and the settings section (R7); no R1 page renders it |
| `RATE_LIMITED` | — | تجاوزت الحد المسموح من المحاولات. أعد المحاولة بعد قليل. | The submission that starts an operation — the sign-up form, the sign-in form, the recovery request |
| `FORM_TOO_FAST` | — | أرسلت النموذج بسرعة أكبر من المعتاد. أعد المحاولة. | Sign-up |
| `OTP_INCORRECT` | — | الرمز غير صحيح. | Sign-up code, recovery code |
| `OTP_EXPIRED` | — | انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا. | Sign-up code, recovery code, and `expired_notice` when the pending request expired at the code step |
| `OTP_REQUEST_ENDED` | — | انتهت محاولات التحقق. أدخل رقمك من جديد لطلب رمز جديد. | Code steps, and the `ended_notice` on the flow's first step |
| `OTP_RESEND_LIMIT` | — | تجاوزت عدد طلبات الرمز المسموح بها. أعد المحاولة بعد قليل. | Code steps |
| `OTP_SEND_FAILED` | — | تعذر إرسال الرمز. أعد المحاولة. | The step that requested the code — the form's submission, or the code step's resend |
| Resend accepted (202) | — | أرسلنا رمزا جديدا. الرمز السابق لم يعد صالحا. | Both code steps, after a successful re-request, announced as a status |
| `RECOVERY_EXPIRED` | — | انتهت صلاحية الطلب. اطلب رمزا جديدا. | Recovery; `expired_notice` when the verified state expired |
| `ACCOUNT_CREATION_FAILED` | — | تعذر إنشاء الحساب. أعد المحاولة. | Sign-up verify |
| `INTERNAL_ERROR` / transport failure | — | حدث خطأ. أعد المحاولة. | Any step |
| Signed-in after verification | — | حسابك جاهز، وأنت مسجل الدخول الآن. | Sign-up done |

`OTP_REQUEST_ENDED` is a **notice**, not a refusal (specification, Refusal
catalogue): it reports that the verification request ended, so the page replaces
the code step with `form` and announces the message as a status (polite). It
carries one text, and the former "Attempts ended (status, not an error)" row that
duplicated it is withdrawn. `OTP_EXPIRED` carries a refusal while the request is
still live and the same step-ending notice once it has ended, and
`RECOVERY_EXPIRED` carries the step-ending notice, so one text serves both
situations for each. The resend's accepted 202 is the one success the code step
announces: it is a status, not a refusal, and its text is the table's
`Resend accepted` row, so the step states that the previous code no longer
applies rather than leaving the person to discover it.

The `Reason` column is the cause the refusal carries beside its code
(`reason` in `contracts/auth-api.md` §3) wherever one code carries more than one
text: `INVALID_FULL_NAME` carries `empty`, `too_long`, or `emoji`, and
`INVALID_SHOP_NAME` carries `too_long` or `emoji`. A code with a single text
carries no reason and its row reads `—`, and a code whose several causes
deliberately share one text — `OTP_EXPIRED` — carries none either. A page
selects the text by the code and the reason it received; it composes no
sentence of its own.

**Every code has one outcome.** A code a page renders has a row in the table
above. `PASSWORD_UNCHANGED` and `PASSWORD_CHANGE_REQUIRED` belong to surfaces
this slice does not ship — the settings section and the administrator
application — and have no R1 state, and `SESSION_ENDED` and `ACCOUNT_BLOCKED`
render §8.4's ended-session state rather than a page message; the bare pages
never call the session endpoint, so no bare page renders them (FR-041). The
responses the refusal catalogue places at `none` render no state and carry no
text: `CSRF_FAILED`, answered before the page's step is reached, so the person
opens the page again as a new request; the transport codes
`PAYLOAD_TOO_LARGE`, `METHOD_NOT_ALLOWED`, and `NOT_FOUND`, which answer a
request no control on these pages can produce; and the scope's not-found answer,
which no page this slice ships reads. The hidden-field submission is the one
refusal rendered as silence on a live step: the silent 202 of §3.1 — no message,
no code step, the form unchanged. Every other code a page renders selects its
text by code and reason, so no page composes a sentence.

**The code step's endings.** The code step's endings are one table, so the same
event receives the same text on both pages and no page infers a cause from a
response code alone:

| Event | Code | Text | State the page shows |
|---|---|---|---|
| The live code's lifetime passed while its request is live | `OTP_EXPIRED` | انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا. | `code_error`, on the code step |
| A re-request replaced the code and the entered one was superseded, the request still live | `OTP_EXPIRED` | the same text | `code_error`, on the code step |
| The pending request is no longer live while the code step is shown — its lifetime elapsed, or the platform no longer holds it | `OTP_EXPIRED` | the same text | `expired_notice`: the first step, with the message as a status |
| The fifth incorrect entry ended the request at its bound | `OTP_REQUEST_ENDED` | انتهت محاولات التحقق. أدخل رقمك من جديد لطلب رمز جديد. | `ended_notice`: the first step, with the message as a status |
| The verified recovery state ended before the new password was set | `RECOVERY_EXPIRED` | انتهت صلاحية الطلب. اطلب رمزا جديدا. | `expired_notice`, on recovery's first step |

The first two rows are deliberately one text and one state: from the person's
side the cause is the same — the code they hold is no longer the live one — and
the next act is the same, while a distinct text would tell a caller that a newer
code had been sent. The third row shares that text because the code is equally no
longer valid, and differs in state because the request itself has ended, so no
step whose request has ended stays shown; the fourth row is the only event that
names the attempts, because the person's own guesses ended the request rather
than the clock; the fifth is recovery's own, because a verified state, not a
code, has expired. The page chooses the row from the response and from the
request's recorded expiry — the response alone does not choose the state (§3.1,
§5.1) — and never from a local guess, so the same event renders the same text
wherever it appears. The live case and the ended one are told apart by the
resume read rather than by the response code: a read that answers 200 means the
request is live and only the code is stale, so the step stays and the message is
`code_error`'s; a read that answers `OTP_EXPIRED` means the request is no longer
live, so the step ends with the notice — except in `submitting`, where no code
step has been shown and the page stays on `form` with no message (§3.1).

**The numerals in these strings.** Every numeral the table carries — and every one
§3.2, §3.3, §3.4, and §7 carry — is a slot filled from
`packages/shared/src/limits.ts`, never a number typed into the copy, so a recorded
value's change cannot leave a message stating the old number:

| String (section) | Numeral | Slot | Counted noun (class) | Source |
|---|---|---|---|---|
| §3.2 password-policy statement | 12 | `passwordMinLength` | حرفا (11–99) | CMV 17 |
| §3.2 password-policy statement | 128 | `passwordMaxLength` | حرفا (11–99) | CMV 17 |
| §3.3 expiry hint | 5 | `otpLifetimeMinutes` | دقائق (03–10) | CMV 18 |
| §3.4 code heading and body | 6 | `otpLength` | أرقام (03–10) | CMV 18 |
| §3.4 code label hint | 6 | `otpLength` | أرقام (03–10) | CMV 18 |
| `INVALID_FULL_NAME` / `too_long` | 100 | `fullNameMaxLength` | حرف (00–02) | CMV 19 |
| `INVALID_SHOP_NAME` / `too_long` | 100 | `shopNameMaxLength` | حرف (00–02) | CMV 19 |
| `PASSWORD_TOO_SHORT` | 12 | `passwordMinLength` | حرفا (11–99) | CMV 17 |
| `PASSWORD_TOO_LONG` | 128 | `passwordMaxLength` | حرفا (11–99) | CMV 17 |
| §7 both one-time-code bodies | 5 | `otpLifetimeMinutes` | دقائق (03–10) | CMV 18 |

The text above shows each string rendered at the recorded values. The counted noun
is part of the string and is written for the value's agreement class, which its
last two digits select — `00`, `01`, and `02` singular («100 حرف»), `03`–`10`
plural genitive («6 أرقام»، «5 دقائق»), `11`–`99` singular accusative («12 حرفا»،
«128 حرفا») — and the copy's test asserts that each value still falls in the class
its string declares, so a change inside a class renders correctly and a change
across one fails the test and revises the noun form in the same change
(`plan.md` → Technical Context, T054, T100). The only digit sequences a string's
source may carry as typed text are the `+218` prefix the number always carries
and the phone field's placeholder `91 000 0000`, and neither is a display form
or a CMV value — the one display form the platform renders is `+218 91 234 5678`
(§3.4, FR-038) — so every other numeral is a slot, and a rendered string's
digits always come from `packages/shared/src/limits.ts`.

**No numeral is composed at runtime.** Every string in this record is a fixed
template: the only runtime substitutions are the six slots above and §7's
`{code}`, and R1 renders no generated count at all — the frame's unread badge is
R9's, and R1 renders the notifications control with no badge (§8.3). The counted
noun is part of the template and is chosen for the value's agreement class, so no
count computed at runtime can produce an ungrammatical phrase. A later slice that
renders a generated count selects a recorded variant for the class the value
falls in and adds the variants to this record, rather than composing a sentence.

Every message is Arabic, right-to-left, with Latin numerals where a number
appears, with no diacritics, with no Latin characters beyond the digits 0–9, the
`+218` prefix, and the token `SMS` (§3.4), and with no emoji (SC-008). The token
`SMS` is one inline `lang="en"` run where it renders (§3.4), and the digits carry
no language of their own. The texts
above are the single mapping from the
API's codes; no page composes a sentence of its own, which is what makes "the
same reason receives the same message" true (AC-037, AC-009, AC-010, AC-036,
AC-028).

## 7. SMS bodies

Fixed templates in `apps/api/src/modules/auth/sms/`; Arabic, Latin
digits, no diacritics, no Latin letters (the trade name is written in Arabic), no
emoji. A body is **UCS-2**, because GSM-7 cannot carry Arabic, and its length is
counted in UTF-16 code units after `{code}` is replaced by its six Latin digits,
with no byte-order mark and no user-data header: a one-time-code body MUST fit
**one segment, 70 code units**, and a notice body MUST fit **two segments, 134 code
units** (2 × 67, the 6-byte concatenation header included). The transport sends
one body and never truncates, splits, or appends a signature; a body over its
class's bound fails the build rather than being cut, and the four lengths —
**51**, **64**, **84**, and **71** — are recorded in `plan.md` → Technical Context.

| Kind | Body |
|---|---|
| `otp_sign_up` | رمز التحقق في وفر: `{code}`. صالح 5 دقائق. لا تشاركه. |
| `otp_recovery` | رمز استعادة كلمة المرور في وفر: `{code}`. صالح 5 دقائق. لا تشاركه. |
| `notice_password_changed` | تم تغيير كلمة مرور حسابك في وفر، وانتهت كل الجلسات. إن لم تكن أنت، تواصل مع الإدارة. |
| `notice_signed_out_all` | انتهت جلسات حسابك في وفر من كل الأجهزة. إن لم تكن أنت، غير كلمة المرور. |

`{code}` is rendered with Latin digits, and each body's `5` is the slot
`{otpLifetimeMinutes}` from `packages/shared/src/limits.ts` (§6 records the
binding), so a change to CMV 18's lifetime renders in both bodies rather than
leaving the old number in the copy. The bodies are scanned by the same
user-facing-string test as the screens, under AC-028, and measured by SC-008. No
template names the account,
the city, or any other personal detail.

**Rendering and failure.** A template is rendered only with its placeholder
replaced by the six Latin digits of the issued code; a render with a placeholder
unfilled, or with a value that is not six digits, is a build failure (T026), not
a runtime branch, and no body is dispatched — the transport never sees a body
carrying `{` or `}`. A dispatch the channel refuses at acceptance — the 750 ms
wait elapses or the provider answers an error — sends nothing: no partial,
truncated, or fallback body exists, and the requesting step shows §6's
`OTP_SEND_FAILED` with its retry. The four bodies are the closed set SC-008
fixes; there is no fifth template, no signature line, and no message composed
outside them.

**The body's direction.** A body is plain text: it carries no markup, no
direction attribute, and no bidirectional control character (U+200E, U+200F,
U+202A–U+202E, U+2066–U+2069). Its direction is the receiving client's
first-strong-character rule, and every body opens with an Arabic letter, so it
renders right-to-left. The code is one maximal run of six ASCII digits inside an
Arabic sentence: in logical order it is preceded by «: » and followed by «. »,
and under the Unicode Bidirectional Algorithm that digit run keeps its
left-to-right order inside the right-to-left body while the colon and the full
stop take the Arabic direction (rule N1), so the code is not reordered and the
closing full stop is not displaced — `رمز التحقق في وفر: 482913. صالح 5 دقائق.`
reads with the code in its logical order and the sentence's full stop after it.
The lifetime's `5` in «صالح 5 دقائق» behaves the same way. A template that would
place the code next to a Latin letter, a bracket, or another number is a build
failure, because the code would then no longer be one isolated run of digits. T026's
unit test asserts the four properties on every rendered body: it opens with an
Arabic letter, no ASCII letter appears, no bidirectional control character
appears, and — for the two one-time-code bodies — the code is the only maximal
run of six or more digits.

## 8. The shared frame (built here, rendered from R2)

The composition is built once, composed by `apps/web/app/layouts/shell.vue`, and
**no page in R1 uses that layout**. Every component lives in
`packages/ui/app/components/shell/` and receives its data as props; the route map
and the item list come from the layer's props, whose values are
`packages/shared/src/routes.ts` (research R-12).

### 8.1 Surfaces and order

At 1024 px and wider the frame occupies four regions on screen: a header band; a
sidebar at the **inline-start** edge (the right edge in RTL) carrying the
nine-item navigation list and the collapse control; the page content at the
inline-end; and a footer band below the content carrying the brand line at its
inline-start and the four static-page links at its inline-end. The reference set
draws the sidebar on the left; the specification fixes inline-start and wins
(plan → Complexity Tracking).

A surface is one of FR-020's four parts — header, sidebar, footer band, bottom
bar; a region is a slot of the layout at a given width. At 1024 px and wider the
four regions are the header band, the sidebar, the page content, and the footer
band; below 1024 the footer band moves into the drawer and the bottom bar is the
fourth region.

Below 1024 px the sidebar leaves the flow and becomes a drawer opened by the
bottom bar's `المزيد` and closed by the collapse control inside it, the footer
band is not rendered and its four links sit at the bottom of the drawer, and the
bottom bar appears (FR-022, FR-024, FR-052).

**Stacking order.** While the drawer is open it is the frame's topmost surface:
the drawer and its scrim render above the page and the header, the scrim covers
the bottom bar, and the panel ends at the bar's top edge, so no slot is covered
and the drawer's four static-page links sit above the bar. The header's controls
and the bar's slots take no activation or focus until it closes, while the bar
stays rendered and visible through the scrim and `المزيد` keeps its open state.
The account menu is topmost while it is open, above the page and the frame's
other surfaces, and the bar sits above the page's content but below both
overlays. The drawer and the menu are never open at the same time, in either
order. An activation that dismisses an open surface — on the scrim, the header,
a bar slot, or `المزيد` — is consumed by the dismissal: it performs nothing
beneath it, so the control is activated again after the surface closes.
The layer's z-index tokens carry the values, and a component carries no raw
`z-index` (Principle IX); this contract fixes the order and the activation rule
(FR-022, FR-047, FR-052; Clarifications 2026-11-02).

### 8.2 Components

| Component | Props | Renders | Accessible contract |
|---|---|---|---|
| `WfWordmark` | `as?: 'mark' \| 'link'`, `href?` | «منصة وفر», the second word in the accent colour | `mark`: no role, not focusable. `link`: an `<a>` with the accessible name «منصة وفر» |
| `WfShellHeader` | `signedIn`, `unreadCount`, `appearance` | the header band; logo/home at inline-start; notifications, theme switch, account control at inline-end | a `banner` landmark; no page-navigation link (no item of the sidebar's navigation item list, FR-039 — never a link as such, FR-023); no drawer control |
| `WfShellSidebar` | `items`, `collapsed`, `open` | the nav list, the collapse control, and (in the drawer) the four footer links | a `navigation` landmark named «القائمة» |
| `WfShellBottomBar` | `items` | five slots, the raised action, the scroll-hide behaviour (the raised action leaves with the bar) | a `navigation` landmark; every slot 44 px |
| `WfShellFooter` | `links` | the brand line and the four links | a `contentinfo` landmark |
| `WfAccountMenu` | `signedIn` | the account control and its menu | a `button` named «حسابي» with `aria-haspopup="menu"` and `aria-expanded`; a `menu` with three `menuitem`s |
| `WfThemeSwitch` | `modelValue: 'light' \| 'dark'` | the switch | a `button` with `aria-pressed` and a name that states the action (§8.5) |
| `WfNavList` | `items` | the nine links, icon + label | each link a name; the collapsed rail keeps the name as an accessible name with a tooltip |
| `WfEndedSession` | `variant: 'ended' \| 'blocked'` | the ended-session state | a heading, a body, and (ended only) a sign-in control |

### 8.3 Content the composition fixes

**Sidebar: nine destinations, in this order, identical for a guest and a signed-in
merchant** (FR-039):

| # | Arabic label | Route |
|---|---|---|
| 1 | الرئيسية | `/` |
| 2 | بحث وفر | `/parts` |
| 3 | الكتالوج | `/catalogs` |
| 4 | رفع كتالوج | `/upload` |
| 5 | ملفاتي | `/my-files` |
| 6 | سلة المشتريات | `/cart` |
| 7 | الإشعارات | `/notifications` |
| 8 | المراسلة | `/messages` |
| 9 | الملف الشخصي | `/profile` |

No item for a bare page or a static page; no item is added, removed, or
disabled by role. A guest activating a merchant-area item goes to
`/auth/sign-in` while the item stays present and enabled (FR-048).

**These labels are recorded values.** The nine labels in the table above, the
four in the footer band, the brand line, the five bar slots, the header's control
names, and the account menu's three items are the copy this slice records — the
one record FR-026 makes binding — not descriptions of it. A destination's English
name in the specification and in §1 is the destination's identifier, not a second
Arabic text: each destination carries exactly one Arabic name, recorded here
once, and a later slice renders it unchanged. The nine are the sidebar's, in the
order above, in the full sidebar, in the collapsed rail (as the accessible name),
and in the drawer; the four are the footer band's and the drawer's, in the table
below.

**Bottom bar: five slots** (FR-052, ADR-127): الرئيسية (`/`), رفع كتالوج
(`/upload`), a raised search action with the accessible name «البحث في القطع»
(target `/parts`), ملفاتي (`/my-files`), «المزيد» (opens the drawer; it is not
the close control). A guest activating Upload Catalog or My Files goes to
`/auth/sign-in`; the slot stays present and enabled. The bar hides after 32 px of
cumulative downward scroll and returns on the first 16 px of upward scroll or
within 56 px of the top, the top being the page's own scroll origin — the page's
scroll offset in CSS px, measured on the page's scrolling element and not on the
drawer's — so the bar is visible at any offset of 56 px or less and the return
rule wins in the 32–56 px band: a page whose whole scroll range is 56 px or less
never hides it, and one that cannot scroll keeps it visible. 220 ms slide, no
fade; `prefers-reduced-motion` keeps it visible; scrolling inside the drawer does
not count, and while the drawer is open the bar stays rendered and visible with
«المزيد» showing its open state, so the scroll rule never hides it there; the
page does not reserve its height while hidden; the raised action travels with the
bar, and while the bar is hidden it leaves with it and out of the focus order and
the accessibility tree — no separate floating action — so below 1024 px no
drawer is open while the bar is hidden and no control of the frame is then a way
to search, while at 1024 px and up the bar is absent and the sidebar's
«بحث وفر» item carries the way (ADR-132; Clarifications 2026-10-31 and
2026-11-02).

**Two affordances, two names, one destination.** The sidebar's «بحث وفر» names
the Parts destination, and the bar's raised «البحث في القطع» names the act that
opens that destination's search; both point at `/parts`, and the pair is
deliberate — a destination's label names the destination, an action's label
names the act — so neither is reworded to match the other. The bar's other four
slots carry a destination's name from this section's list — Home, Upload Catalog,
and My Files — or «المزيد» for the drawer's opener; the centre slot is the bar's
one action, so it is the one label that names an act.

**Footer band: four links** (FR-024): the brand line «منصة وفر — كتالوج قطع
الغيار» at the inline-start and, at the inline-end, four links in this order:

| # | Arabic label | Route |
|---|---|---|
| 1 | اتصل بنا | `/contact` |
| 2 | سياسة الخصوصية | `/privacy` |
| 3 | شروط الاستخدام | `/terms` |
| 4 | الأسئلة الشائعة | `/faq` |

The drawer carries the same four links, in the same order and with the same
labels, at its bottom, so hiding the band below 1024 px removes no label and
rewords none.

**Header:** logo/home at inline-start (`/`); at inline-end the notifications
control (`/notifications`, bell icon, unread badge in Latin digits — the count is
R9's, so R1 renders the control with no badge), the theme switch, and the account
control. No page-navigation link — an item of the sidebar's navigation item list
(FR-039), never a link as such, so the logo/home and notifications controls stay
links (FR-023) — and no drawer control. A guest sees the sign-in
action (`/auth/sign-in`, name «تسجيل الدخول») in place of the account control and
the notifications control; the theme switch stays; the sidebar collapse control
stays in the sidebar (FR-023, FR-048). At 320 CSS px all four controls stay in one
row — none dropped, folded into an overflow menu, or moved into the account menu —
the three inline-end controls icon-only at the 44 px touch floor with their
accessible names, the wordmark in its shortened form, and no horizontal page
scroll (FR-023, AC-025; Clarifications 2026-10-31).

**Labels at 320 px** (FR-026, FR-052; Clarifications 2026-11-02). In the three
contexts this rule governs — the full sidebar, the drawer, and the bottom bar's
five slots — a label is one visible line, and a label that does not fit is cut
at the inline-end — the left in RTL — with `…` (U+2026) at the cut, never at the
inline-start, so the Arabic beginning of the label stays readable. The label is
clipped by its own slot: it never widens the slot, reaches into a neighbouring
slot, or gives the page horizontal scroll. No such label wraps to a second line,
is abbreviated, or is replaced by its icon alone, so the sidebar's nine labels
keep their text in the full sidebar and in the drawer, and the bar's labels
stay at 320 px while the bar keeps its 60 px height (ADR-128 decision 5). A cut
never leaves a partial numeral, and a Latin numeral inside an Arabic label keeps
its Latin digit order and is isolated, as a file name's extension is (ADR-128
decision 14). Every label's whole text stays in the markup, and the cut shortens
no control's accessible name: a name the label provides carries the label's
whole text, and a name fixed separately — the raised action's «البحث في القطع» —
is not touched. The rail is outside that rule because it renders no visible
label: it is icon-only at 4.25rem, and the whole label is the accessible name
and the tooltip's text; the tooltip opens on the rail's inline-end side and
stays inside the viewport, so neither the page's edge nor the rail clips it. The header's 320 px composition is FR-023's and this rule
does not touch it.

**Sidebar behaviour** (FR-022): at 1024 px and wider the list shows in full; the
collapse control narrows it to an icon-only rail and restores it, and the rail
keeps each item's name as its accessible name. Below 1024 px it is the drawer:
`المزيد` opens it, focus moves to its first focusable control and stays within it
until it closes, and the collapse control inside it closes it. Escape and an
activation outside are dismissals, not controls: they close it too, and the three
dismissals that do not navigate — the collapse control, Escape, and an activation
outside — return focus to `المزيد`. Activating a navigation item is not a
dismissal: it closes the drawer as part of the navigation and settles focus at the
start of the destination page's content, on its page heading, because the move
leaves the page that carried the drawer. The header carries neither control.

**Account menu:** exactly «حسابي»، «إعدادات»، «تسجيل الخروج» (FR-047).
«حسابي» opens `/profile`; «إعدادات» opens `/profile#settings`; «تسجيل الخروج» has
no route, asks a yes/no confirmation (`هل تريد تسجيل الخروج؟` — `تسجيل الخروج` /
`إلغاء`), and ends the session only on confirmation. Dismissal by Escape, by an
activation outside, or by focus leaving the menu: closes without action and
returns focus to the account control. Opening moves focus to the first item;
keyboard reachable; each item has a role and an accessible name.

### 8.4 The ended-session state (FR-049)

`WfEndedSession` is shown inside the frame when any request is refused
`SESSION_ENDED` or `ACCOUNT_BLOCKED`, and after a deliberate sign-out.

| Variant | Heading | Body | Control |
|---|---|---|---|
| `ended` | انتهت الجلسة | انتهت جلستك. سجل الدخول من جديد للمتابعة. | «تسجيل الدخول» → `/auth/sign-in` |
| `blocked` | الحساب موقوف | أوقفت الإدارة هذا الحساب، ولن يقبل تسجيل الدخول حتى يعاد تفعيله. | **none** — the way to sign in is withheld |

The frame stops issuing requests for a session it knows has ended. Every
session-ending path leads to this one state; no path shows an unrelated error.
The header follows FR-023 in both variants: the `ended` variant carries the
guest's three controls — the logo/home control, the theme switch, and the
sign-in action — and the `blocked` variant carries the logo/home control and the
theme switch alone, with the sign-in action and the account control withheld
(FR-023, FR-049; Clarifications 2026-11-01).
When it replaces the page's content it is announced ahead of the page's other
announcements, and focus moves to its heading, made focusable programmatically;
the blocked variant lands on the same heading because it carries no sign-in
control (FR-049, AC-053; Clarifications 2026-10-31).

### 8.5 Appearance (FR-025, ADR-137)

Light is the first-visit default; a stored per-device choice wins and is applied
before paint. The switch reflects the state with `aria-pressed="true"` when dark
and an accessible name that states the action: light → «التبديل إلى الوضع
الداكن»; dark → «التبديل إلى الوضع الفاتح». Icons are IconPark outline (moon /
sun); no emoji; the switch is a frame control and is never offered on a bare
page.

### 8.6 What the structural test asserts

`packages/ui/tests/shell/*.spec.ts` mounts the components with
`@vue/test-utils` under `jsdom` and asserts, with no page and no route:

1. the nine items in order with their hrefs and Arabic names, each name carried
   whole as the item's accessible name in the full sidebar and in the rail;
2. the collapse control's presence, role, accessible name, and its change of name
   between expanded (`طي القائمة`), collapsed (`توسيع القائمة`), and drawer
   (`إغلاق القائمة`);
3. the five bottom-bar slots in order, the raised `/parts` action's name
   «البحث في القطع», each slot's accessible name carried whole, and the bar's
   absence from a 1024 px render;
4. the four footer links, their hrefs, and the drawer's copy of them;
5. the footer band's absence below 1024 px and its links' presence in the drawer;
6. the account menu's three items, their order, names, roles, and keyboard
   reachability, and its dismissal contract (Escape, outside activation, focus
   leave) with focus returning to the control;
7. the guest variant: the account and notifications controls replaced by one
   sign-in action, the theme switch kept, the sidebar list unchanged;
8. the logo/home target `/`, the notifications target `/notifications`, the
   wordmark's non-interactive variant on a bare page;
9. the theme switch's `aria-pressed` and both names;
10. every control's accessible name and role, and that every control is reachable
    by keyboard in DOM order — the header's four controls included at 320 CSS px,
    where none is dropped, folded into an overflow menu, or moved into the account
    menu, and a guest's three controls — the logo/home control, the theme switch,
    and the sign-in action — remain in that one row under the same rule, none
    dropped, folded into an overflow menu, or moved, each keeping its accessible
    name and its touch target — and the ended-session state's live-region markup
    and focusable heading in both variants, and the blocked variant's header carries
    the logo/home control and the theme switch alone, with the sign-in action,
    the account control, and the notifications control withheld.

Runtime behaviour that only a rendered page can exercise (the navigation from the drawer and the focus landing on the destination page's heading, the scroll-hide transition, the overlaying surfaces' stacking order and the consumption of an activation outside them, focus containment, the account menu's live open, the guest's redirection on a page that carries the frame, the ended-session state's live
move, and a label's one-line cut at the inline-end) is R2's to exercise, as
`EX-007` records; the composition, the control presence, the drawer's opener and its three dismissals with the focus return to «المزيد», the account menu's items and the sign-out confirmation's markup, the bar's rendered and visible state under the drawer, and the structural accessibility assertions are asserted here.

## 9. Accessibility contract

- WCAG 2.2 AA; axe (`@axe-core/playwright`) on every delivered state at 320 and
  1280 CSS px in both appearances (FR-025) — the dark set carries every state the
  light set carries, each run setting the appearance it scans rather than taking
  it from the machine.
- A manual keyboard-only pass at 320 and 1280, recorded in the pull request: tab
  order follows reading order, every control is operable, no focus trap exists on
  a bare page, focus is visible, and each step change moves focus as §2.1 says.
- 320 px is the supported floor; 375 px captures are reference evidence only.
- Contrast, focus ring, type scale, and spacing are the layer's tokens
  (ADR-128); the token contract test asserts them and the baseline is the gate
  (ADR-129).
- 44 × 44 px touch targets on coarse pointers; `prefers-reduced-motion` removes
  transitions.
- Language of parts: the document declares Arabic for the whole page; each
  rendered `SMS` carries `lang="en"` on its own inline element, while the `+218`
  prefix, the one-time code, and a value a person supplies carry no `lang` and no
  component sets a base language of its own (§3.4). The manual pass at both
  widths reads the three pages for the wrapper and for the absence of a guessed
  language on a supplied value, and the copy test asserts the same on the
  rendered strings.
- The only `aria-live` regions are the status and alert containers of §2.1; no
  page announces a value it does not display.

## 10. The baseline set

Generated in CI with the Playwright-pinned Chromium and the self-hosted fonts
(`document.fonts.ready` awaited), stored under
`apps/web/tests/e2e/__screenshots__/<page>--<state>--<width>--<appearance>.png`.

| Page | States captured |
|---|---|
| `sign-up` | `form`, `submitting`, `form_error`, `code`, `verifying`, `code_error`, `resending`, `expired_notice`, `ended_notice`, `done`, `existing`, `blocked`, `administrator` |
| `sign-in` | `form`, `submitting`, `form_error`, `done` |
| `forgot` | `form`, `submitting`, `form_error`, `code`, `verifying`, `code_error`, `resending`, `new_password`, `setting`, `done`, `done_blocked`, `no_account`, `administrator`, `expired_notice`, `ended_notice` |

Widths 1280 and 375 for every state in both appearances, plus a 320 light reflow
capture per page. The reference set does not capture the code, error, loading,
disabled, post-submit, or 375-dark states; the baseline is generated from this
contract, never copied from `docs/design/` (ADR-129, plan → Complexity Tracking).

## 11. What R1 does not render

- No page carrying the frame: no Home, no merchant area, no upload, no error page,
  no static page (FR-021, ADR-139).
- No administrator surface; `provision-administrator` and
  `auth.service.signInAdministrator` are behaviour only (FR-028).
- No change-password page; the action is a request, not a screen (FR-013).
- No city API, no session-aware rendering on the bare pages, no sign-out control
  on a bare page (FR-041).
