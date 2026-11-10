# Tasks: Identity and Foundation

**Input**: Design documents from `/specs/001-identity-foundation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/auth-api.md, contracts/ui-contracts.md, quickstart.md

**Regenerated**: 2026-10-31, after the clarification session of that day. The six
clarify answers are traced to their tasks in "Clarification trace (2026-10-31)"
below, and the analyze pass's C2 answer is separate and changes no criterion; no
identifier `T001`â€“`T131` moved, and T132â€“T175 are later passes' additions.

**Amended 2026-10-31** by the analyze pass's finding C1: the password-change
service that carries the forced-first-change rule moved into the foundation
increment A8 (T135), so US2's route delegates to foundation code and US6 supplies
its administrator branch in its own file; US4's and US6's tests seed their own
fixtures â€” the blocked account and its live session, the existing account a
provisioning conflict meets, the administrator's restricted session and lock
state â€” so no test waits on another story's flow to produce one; the one test the
plan registers an exception for, US4's blocked-account sign-in half, is covered by
`EX-008`; and the dependency entries now state what the tasks do instead of
claiming that no story touches another's work. No identifier moved and no FR, AC,
or SC changed.

**Amended 2026-10-31** by the analyze pass's finding G1: T017 states the
`/api/v1` mount every public route carries and the unversioned `/health` probe,
T120 appends the plan's records 1, 2, 3, 5, 6, 7, 12, and 14, and T136 appends
record 13 (public-API versioning and the deprecation rule) beside T120, so the
rule `ROADMAP.md` assigns to R1 has a named task and one home; Gate C3 names all
three. No identifier moved and no FR, AC, or SC changed.

**Amended again 2026-10-31** by the SC-009 measurement-validity pass: T117
states the load profile (20 origin keys; one number key per request in three
disjoint blocks â€” 200 numbers outside the seed for account creation, 200 seeded
accounts for sign-in, and 200 other seeded accounts for recovery; the per-origin
and per-number spend; and 300 seeded sessions that the run's 200 sign-ins raise
to the 500-session ceiling), the accepted/refused verdict that fails on any
refusal, and the post-run limiter probe; T074 and T078 carry the origin
derivation of `contracts/auth-api.md` Â§2.5; and T120 appends the plan's record 14
with the other remaining records. No identifier moved and no FR, AC, or SC
changed.

**Amended again 2026-10-31** by the analyze pass's findings O1 and F1. O1 needed
no task change: the Ownership Map now records `.specify/memory/version.json` as a
governance-owned row this feature reads and never writes, and T131 already reads
its value only through `governance-drift-check.mjs` check A, so T131 stands
unchanged. F1 keeps T128: it verifies and commits the generated
`apps/api/openapi.json`, which is R1's documentation gate (ADR-002), while the
first standalone documentation-drift test remains R2's (ADR-031 item 4), so R1
adds no such test.

**Amended again 2026-10-31** by the analyze pass's finding C2 and the
clarification session's sixth answer. C2 names every crossing where it
occurs: US4's Independent Test and dependency entry cite `EX-008`, US5's cite
`EX-009` for T099, and US6's cite `EX-010` for T108 and T109, each beside the
fixture description that says the test seeds its own fixture, so no fixture
crosses a story boundary. The sixth clarify answer bounds AC-031 by FR-051, and
"Clarification trace (2026-10-31)" now carries it with T073 as the verifying
task, so the table traces the six clarify answers of the session; the analyze
pass's C2 answer is separate from them and changes no criterion, and Gate S names
the five frame clauses as its own among the six. No identifier moved, no task was
added, and no FR, AC, or SC changed.

**Amended again 2026-10-31** by the analyze pass's finding C3: the shared code
step moved into A8 as T052, so US3 configures it through its properties instead
of editing a US1 file and US5's supplied-values test exercises the A8 component;
US7's hidden field and refusal-order application are registered as `EX-011`, so
the dependency and parallel sections no longer claim US7 has no task on another
story's surface. No identifier moved and no FR, AC, or SC changed.

**Amended 2026-10-31** by the analyze pass's R1: T074's recovery rate-limit
assertions and T080's `recovery.ts` application move to the Polish T137;
`EX-011`'s scope now names all five US7 controls â€” the hidden field, the refusal
order, the rate limits, the security middleware, and the no-CAPTCHA rule â€” and
the tests T073, T074, T076, T077, T080, and T081, so the P1 checkpoint (US1 + US2 + US7)
closes without US3. T137 applies US7's refusal order in US3's `recovery.ts` after
T085 and tests the recovery budget exemption. No identifier T001â€“T136 moved; the
task count becomes 137; no FR, AC, or SC changed.

**Amended 2026-10-31** by the tasks repair that applies the C2 and C3 decisions
to this file without renumbering: T052 states the shared code step for both
flows and stays in A8, T089 consumes it in recovery mode instead of editing it,
T100 moves to the final phase with no story label, T133 stays in US5 and
exercises the A8 component alone so AC-046 rests on T034 and T037, T081 keeps
the hidden `website` field and the refusals' messages but no longer builds the
the form's minimum-time record T051 owns, T080 and T081 name `EX-011`, US4's
withdrawn-session assertion sits inside `EX-008`, and the US3, US5, US7, and
Phase Dependency entries state what the tasks do. The six clarify answers of
2026-10-31 are counted apart from the analyze pass's C2 answer, which registers
exceptions and changes no criterion. No identifier moved, no task was added, and
no FR, AC, or SC changed: the count stays 53 FR, 56 AC, and 9 SC.

**Amended again 2026-10-31** by the plan repair that closes S1, P1, T1, and D1:
T138 and T139 join the foundational phase for the content skeleton, the
in-place loading bar and its loading-state rule, and the bidirectional
file-name surface, which `ROADMAP.md` lines 126â€“127 assign to R1 and A2 now
carries; T060 is registered under `EX-012` for the closed list's verification,
recovery, and provisioning records and for the format and rate-limit refusals
it opens; T069 builds the shared events module and wires US2's events only, so
T045, T047, T085, T086, and T107 emit their own stories' events and T069 edits
no US1 or US6 file. The task count becomes 139. No identifier T001â€“T137 moved
and no FR, AC, or SC changed.

**Amended 2026-11-01** by the analyze and clarify pass that closes C1, I1, U1,
A1, and I2. C1 places T064's lock repository at the path the plan fixes,
`apps/api/src/modules/users/repository/user-lock.ts`, the `users` module's
repository the `auth` services reach through the lock port declared in
`packages/shared`; I1 states the password maximum and its third message in
T035, T043, T054, T088, and T140, with T008's closed error-code union already
carrying `PASSWORD_TOO_LONG`; U1 records the emoji predicate in T006, T034,
T037, T047, T051, and T054; A1 adds the guest's three header controls at 320
CSS px to T095, T098, T102, and T134 and to the clarification trace; and I2
fixes the numbering range and adds the source paragraphs for T140 and T141. The
same session's AC-003 (FR-042 widened to the sign-up form), AC-028 (the
platform's own text), FR-008 (the uniform refusal's single definition), and
Test Coverage Request (the final-phase placement) clauses are traced in
"Clarification trace (2026-11-01)". No identifier moved, no task was
renumbered, and no FR, AC, or SC changed: the count stays 53 FR, 56 AC, and
9 SC, and the task count stays 141.

**Amended again 2026-11-01** by the tasks repair that gives FR-037's closed
security-event list one owner and completes the shared verifications, CSRF, and
refused-form wording, without renumbering. T018 keeps the structured JSON logger
alone: `apps/api/src/observability/events.ts` is built by no task, and FR-037's
closed list and the event-record schema its records are written against have
their single home in T069's `apps/api/src/modules/auth/service/events.ts` â€” the
one-closed-list state `EX-012`'s exception premise already records. T049
implements the shared resend `POST /api/v1/auth/verifications/resend` of
`contracts/auth-api.md` Â§5.4 beside the resume read, T052 binds its
`Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø¬Ø¯ÙŠØ¯` control to that route, and the resend's own allowance is
asserted in T036's unit test and T074's limiter test â€” US3's tests seed what
they assert through the recovery flow itself, so no new exception row is
needed. T019 states the `GET /api/v1/auth/csrf` route issuing and rotating the
`wafar.csrf` cookie and T076 tests that route. T040 asserts that a refused
submission keeps the typed values except the password fields and clears the
code field. US4's Goal, Independent Test, and T090 name the fixture this slice
can seed â€” the account's rows and a live session â€” in place of the
contributions no artifact of this slice carries. No identifier moved, no task
was added (a new task takes an identifier above the highest present one,
`T141`, starting at `T142`), and no FR, AC, or SC changed: the count stays
53 FR, 56 AC, and 9 SC, and the task count stays 141.

**Amended again 2026-11-01** by the plan repair that closes C1, D1, E1, F1, and
G1: T142 appends the plan's record 15 (the silent hidden-field refusal's
mechanism) beside T120 and T136; T141's Complexity Tracking citation stays row 1,
the row it already named; and the module layout the plan now states is the one
these tasks build â€” `auth` with `routes/` and `service/` and better-auth's
adapter as its persistence, `users` with `service/` and `repository/` and no HTTP
route in R1 â€” so no task is added for a directory no requirement fills. No
identifier moved, no task was renumbered, and no FR, AC, or SC changed: the count
stays 53 FR, 56 AC, and 9 SC, and the task count becomes 142.

**Amended again 2026-11-01** by the 2026-11-01 analyze pass's findings C2 and
J1, applied without renumbering. C2 gives AC-031's page clause one verifying
task: T073 now states that the silent refusal's response carries the same
status, headers, field set, and types as a successful submission and no
next-step content, and that the resume read for the returned `requestId`
answers `OTP_EXPIRED`, so the page stays on the form's first step with no
message and the code step is never reached â€” the transition rule T055 applies,
fixed by `contracts/ui-contracts.md` Â§3.1 and plan record 15 (T142). T040 keeps
the form-state assertions it owns and gains no US7 control, so US1 keeps its
independence and `EX-011`'s scope is unchanged; the 2026-11-01 trace gains
AC-031's row with T073 as the verifying task. J1 moves T017's tail from
`(implements FR-051, AC-055)` to `(implements Complexity Tracking: R1 carries
its foundation phase and the identity work in one slice)`: the composition
root, the `/health` probe, the error envelope, the body guard, and graceful
shutdown implement no product requirement, while FR-051's order is implemented
by T080 and T137 and tested by T075. No Complexity Tracking row and no decision
record is added, so the plan's fifteen records stand and T120, T136, and T142
keep their appends.
*(Superseded 2026-11-04: sixteen records; T143 appends record 16 beside T120,
T136, and T142.)*
T017 touches no `routes/`, `service/`, or `repository/`
declaration, so no task is added for a module path and the layout stays the one
Complexity Tracking row 26 and record 1 record. No identifier moved and no task
was added or removed: the count stays 142 tasks, 53 FR, 56 AC, and 9 SC.

**Amended again 2026-11-01** by the tasks repair that gives AC-031's page clause
an executable page-level verifier, without renumbering. The analyze pass's C2
above gave that clause to T073, which is an API integration test: it proves the
response's shape and the resume read's `OTP_EXPIRED` and can only infer the
page's state from the transition rule T055 implements, so no test observes
`form` on the page. T081 now carries the page half in a file it can run â€”
`apps/web/tests/e2e/sign-up-abuse.spec.ts`, US7's own file in the shared
Playwright directory â€” so a 202 returned to a form whose hidden `website` field
is filled leaves the page on `form` with no message and no code step, and T073
keeps the API half alone. Both AC-031 rows in the two clarification traces state
that split the same way, and Gate S and US7's dependency entry name it, so no
current statement claims one task verifies both clauses; the C2 paragraph above
stands as the record of what that pass did. T073, T055, and T040 are
unchanged, `EX-011`'s scope and every exception row are unchanged, and no
identifier moved or was added: the count stays 142 tasks, 53 FR, 56 AC, and
9 SC.

**Amended again 2026-11-01** by the tasks repair P-03, which writes the page
half's transition rule into T055 without renumbering. T055's description now
states the rule plan record 15 fixes and T081 verifies: a 202 received by a form
whose hidden `website` field is filled chooses no step, and the transition is
decided by the read `GET /api/v1/auth/verifications/{requestId}` with the pending
cookie â€” the page enters `code` only on that read's 200, while `OTP_EXPIRED`
leaves it on `form` with no message and the code step is never reached
(`contracts/ui-contracts.md` Â§3.1; AC-031). T055's tail is unchanged â€”
`(implements FR-038, FR-041, AC-041, AC-044)` â€” and AC-031 is not added to it, so
T081 stays the page's verifier in `apps/web/tests/e2e/sign-up-abuse.spec.ts` and
T073 stays on the API half. T040, T073, and T081 are unchanged; the sentence adds
no route and no file path â€” the read is T049's route and T055's two paths stand â€”
`EX-011`'s scope and every exception row are unchanged, and the plan's fifteen
records stand.
*(Superseded 2026-11-04: sixteen records; T143 appends record 16 beside T120,
T136, and T142.)*
The paragraph above stands as the record of what that pass did,
when T055 was unchanged. This pass edits no other artifact. No identifier moved
and no task was added or removed: the count stays 142 tasks, 53 FR, 56 AC, and
9 SC.

**Amended again 2026-11-01** by the I1a scope correction, without renumbering.
`EX-009`'s exact scope and its closing sentence now name all three bare pages
this slice ships â€” sign-up (US1), sign-in (US2), and password recovery (US3) â€”
because AC-044 reaches them and T099 is its only test; the earlier wording,
"the three bare pages US1 and US3 deliver", named two pages and left the
criterion short by one. T099's description and the four narrative statements of
that crossing â€” the US5 phase note, the phase-dependency bullet, US5's
dependency entry, and the parallel-opportunities bullet â€” state the same three
pages, and US5's Independent Test in `spec.md` carries the same correction. No
task identifier moved or was added, no exception row was added or removed, and
no FR, AC, or SC changed: the count stays 142 tasks, 53 FR, 56 AC, and 9 SC.

**Amended again 2026-11-01** by the I4 sequencing repair, without renumbering.
T126 derives the expected schema version from
`packages/db/migrations/meta/_journal.json` and tests the boot guard, so it needs
the journal T032 generates in B1 and the case R1's single migration makes the only
reachable one â€” a database no migration has reached. The task stood in the API
skeleton section, above B1, and Phase Dependencies named T017 as its only
predecessor. It now sits in B1 after T032; its test starts the API against an
unmigrated database instead of "the previous migration", because R1 ships one
migration and no earlier one exists to leave a database at; Phase Dependencies
records that T126 follows T017 and T032 and that B1 â€” T030â€“T032 and T126 â€” is the
increment that closes Gate C2 after the Aâ†’B checkpoint is recorded; and Gate C2
and the B1 heading name the task's position. No identifier moved and no task was
added or removed: the count stays 142 tasks, 53 FR, 56 AC, and 9 SC.

**Amended again 2026-11-02** by the security checklist's CHK036, without
renumbering. FR-029 and AC-031 no longer promise the hidden-field refusal "the
same timing" as a success while the success path waits for the channel's
acceptance: the property is one-sided and numeric â€” the refusal is not observably
faster, a median shortfall of no more than 50 ms and a p95 of no more than
150 ms â€” and T073 measures the pair on that protocol beside the assertions it
already made. T142 appends record 15 with the timing clause the plan's Technical
Context and Verification Notes carry, so the record that fixes the mechanism also
fixes the bound. No identifier moved and no task was added or removed: the count
stays 142 tasks, 53 FR, 58 AC, and 9 SC.

**Amended again 2026-11-02** by the flow checklist's CHK037, without
renumbering. The 2026-11-01 clarification trace gains the three flow clauses
that session amended and the trace omitted: AC-006's direction replacing the
code step in place, with FR-038's two terminal outcomes (T037, T038); AC-036's
dispatch-conditioned replacement of a live pending request and its code (T036,
T083); and AC-041's dispatch-conditioned replacement as each flow's code step
carries it (T036, T039, T040). The trace's preamble counts nine acceptance
criteria instead of six, and `checklists/flows.md`'s CHK037 is closed. No
identifier moved and no task was added or removed: the count stays 142 tasks,
53 FR, 58 AC, and 9 SC, and every exception row is unchanged.

**Amended again 2026-11-02** by the copy checklist's CHK013, CHK025, CHK036, and
CHK004, without renumbering. T006 builds the emoji predicate from the range table
generated from the vendored Unicode 18.0.0 data rather than from the runtime's
property escape, and asserts the table's version, hash, and regeneration; T026
asserts each SMS template's length against its class's bound and carries the
reworded one-time-code bodies; T054 fills the message table's numerals from
`packages/shared/src/limits.ts`, and the new `copy-values` test asserts the slots,
the rendering, and the agreement class; T100 adds the limb that no template carries
a numeral literal; and T143 appends the plan's record 16 beside T142. No identifier
moved and no requirement, criterion, or success criterion changed: the count stays
53 FR, 58 AC, and 9 SC, and the task count becomes 143.

**Amended again 2026-11-03** by the AC-020 coverage pass, without renumbering.
AC-020's second half â€” the effects an administrator's removal has on the state
this slice creates â€” had no verifying task: T091 asserted the first half alone,
that no merchant deletes their own account, that no control offers it, and that
no retention period or trigger is asserted. T144 joins the US4 phase beside T091
and carries the three effects FR-018 states. It seeds the account directly
through `packages/db` â€” its `users` row, its `accounts` credential, a live
`session`, and a live `phone_verifications` row for its number carrying a known
code â€” establishes that state first, then performs the removal itself in the
order R13's administrator operation must use, and asserts what survives. The
order is the one `data-model.md` Â§3 fixes: the `accounts` row is deleted
explicitly, which is what `accounts.user_id`'s `ON DELETE RESTRICT` keeps honest;
the number's `phone_verifications` row is deleted by the operation because that
table carries no foreign key and no cascade can end the pending request; and the
`sessions` rows go with the `users` row, whose `sessions.user_id` key cascades.
The assertions are the requirement's own: no `sessions` row survives and the
seeded token resolves as the guest state at the shared entry point, so the
sessions grant no access; no `phone_verifications` row survives, so the pending
request has ended and the `code_hash` carrying its code is gone; and no
`accounts` row survives, so no stored credential permits a sign-in. T144 adds no
product delete path, asserts no retention period and no trigger, and opens no
other story's surface â€” the entry point is T020's foundation code and every other
assertion reads the store â€” so no exception row is added and `EX-008`'s scope,
which is T090's test and nothing else, is untouched. T091 and its no-self-deletion
half stand unchanged, and both tasks keep the tail `(implements FR-018, AC-020)`.
No identifier moved and no FR, AC, or SC changed: the count stays 53 FR, 58 AC,
and 9 SC, and the task count becomes 144.

**Amended again 2026-11-03** by the L3 verifications-empty confirmation, without
renumbering. T031, T032, `data-model.md` Â§8, and `plan.md` â†’ Gate 2 â†’ Schema and
Migration Control all state that the integration suite asserts the library's
`verifications` placeholder empty, and no task carried that assertion: T037 named
it as a bare two-word item with no point in the flow attached to it. T037 now
states it explicitly â€” a direct read of the placeholder through `packages/db`
answers `count(verifications) = 0` once the correct code has created the account
row and its session and the pending row has been deleted, and at each earlier
point the test already reaches (after the form, after an incorrect code, and
after the abandoned request whose own lifetime elapsed) â€” so a write to the
placeholder anywhere in the flow fails the test and the emptiness is asserted at
every point the flow passes rather than at its end alone. T031 and T032 name
T037 as the carrier of the "asserted empty" clause each of them states, so the
claim has one owner a reader can follow and no file repeats an unowned promise.
T037's tail is unchanged and already cites AC-004, so no reference was added to
it: the assertion rests on the account-creation clause AC-004 carries and on the
invariant `data-model.md` Â§8 fixes. No identifier moved and no task was added or
removed: the count stays 144 tasks, 53 FR, 58 AC, and 9 SC.

**Amended again 2026-11-03** by the analyze pass's E1b, F3, and F5, without
renumbering. E1b adds `apps/web/tests/unit` to the unit project's roots in T022,
so the three tests that already live there â€” `copy-values.spec.ts`,
`supplied-values.spec.ts`, and `user-facing-strings.spec.ts` â€” run under Vitest
rather than Playwright, and T022 states that split. F3 replaces the US5
checkpoint's deferred list with the seven behaviours SC-005 names, in that
criterion's own wording, so the checkpoint, SC-005, US5's Independent Test, and
`EX-007` state one set. F5 extends the regenerated paragraph's range to
`T132`â€“`T144`, covering T143 and T144. No identifier moved, no task was added or
removed, and no FR, AC, or SC changed: the count stays 144 tasks, 53 FR, 58 AC,
and 9 SC.

**Amended again 2026-11-03** by the tasks repair that applies the analyze pass's
A1, C1, C2, and I3, without renumbering. A1 adds the two sign-out requests
FR-044's 2026-11-03 enumeration reaches â€” `POST /api/v1/auth/sign-out` and
`POST /api/v1/auth/sign-out-all` â€” to what T076 asserts, so the test proves each
is refused when its request carries no token, beside the change-password request
it already covered. C1 names SC-005 in T094â€“T098, the five structural tests of
`packages/ui/tests/shell/` the plan attributes the frame's composition and its
scoping to, so rule 7 of this file's Format section holds for the criterion's
structural half as it already held for T099's bare-scope half and T106's
frame-scope half. C2 re-links six tails to the named rows `plan.md` â†’ Complexity
Tracking added for the foundation gates â€” T125 and T128 to row 30, T126 to row
29, T127 to row 31, T022 to row 32 (its description naming row 2 for the
page-level exclusion) and T024 to row 33 â€” so row 1 is no longer cited by a
foundation gate that has its own named row. I3 moves T119's tail to
`(implements FR-004, AC-004)`, because the transient-store note it writes is the
pending request FR-004 bounds, and names Complexity Tracking row 15 â€” the
phone-only account's reserved `email` sentinel â€” in the task's description
instead. No identifier moved and no task was added or removed: the count stays
144 tasks, 53 FR, 58 AC, and 9 SC.

**Amended 2026-11-04** by the clarification session (3), without renumbering:
T095 asserts the account menu's two link targets (`/profile` for Â«Ø­Ø³Ø§Ø¨ÙŠÂ» and
`/profile#settings` for Â«Ø¥Ø¹Ø¯Ø§Ø¯Ø§ØªÂ»), because AC-051 is narrowed to the menu's
composition, its two link targets, and its confirmation markup, and T102 names
Complexity Tracking row 34 for the Profile page's content it does not build.
No identifier moved and no task was added or removed: the count stays 144 tasks,
53 FR, 58 AC, and 9 SC.

**Amended again 2026-11-04** by the alignment pass that carries the two sessions of
that day and the plan's re-evaluation into this file, without renumbering. The
Dependencies entries and the P1 checkpoint now state what `plan.md` â†’
"Re-evaluation after the 2026-11-04 analyze pass" (H2) fixes: AC-035's remaining
part â€” the recovery operation's budget, the recovery steps' exemption from it,
and the aggregate ceilings the two number keys produce â€” opens with the Polish
T137 on US3's recovery route after T085, while T074 keeps the criterion's
account-creation and sign-in halves on the P1 surface. The new trace table
records AC-051's narrowed scope (2026-11-04, session (3)): what this slice builds
and verifies structurally, and what waits for R2 under `EX-007` and for R7 under
Complexity Tracking row 34. Session (2)'s single home for the non-discrimination
exceptions is applied: SC-004 states the closed list once, and T037, T058, T061,
T074, and T082 cite it â€” the post-verification outcome, the successful sign-in,
the format refusal, and the rate-limit and re-request refusals â€” instead of
naming the requirement that produces each. No identifier moved, no task was added
or removed, and no task's scope changed: the count stays 144 tasks, 53 FR, 58 AC,
and 9 SC.

**Amended again 2026-11-04** by the AC-006 code-entry coverage pass, without
renumbering. T038 now carries AC-006's third limb â€” two entries of the same
correct code for one number arriving at the same moment: at most one account and
at most one session, the entry that does not create the account receiving the
status- and role-specific message FR-006 fixes rather than a generic direction
to sign in or to recover the password, decided by the existing account's stored
status and role, and no partial account, no second session, and no live pending
request left behind â€” and it states the two-sign-up race with that same message
in place of the earlier "one outcome", decided by the existing account's stored
status and role as the winning transaction left them. The task stays in the US1
phase and keeps its `[P]`, its file
`apps/api/test/integration/auth/sign-up-concurrency.spec.ts` (now a row of
`plan.md` â†’ Ownership Map), and its tail
`(implements FR-006, FR-031, AC-006, AC-007)`; the 2026-11-01 trace's AC-006 row
states the same scope. No identifier moved and no task was added or removed: the
count stays 144 tasks, 53 FR, 58 AC, and 9 SC.

**Amended again 2026-11-04** by the SC-004 masked-set propagation, without
renumbering. The clarification session (5) of that day added `phone` to SC-004's
masked set and named the assertion that verifies the echo, and the plan's
re-evaluation paragraph carries both; T037, T058, and T082 now name the four
values â€” `requestId`, `phone`, `codeExpiresAt`, and `expiresAt` â€” each replaced
by its fixed placeholder, and state the assertion made outside the comparison
that each response's `phone` equals that case's own submitted number in the
canonical form, so the echo is verified rather than exempted from scrutiny.
T058 records that the sign-in transcript's 401 body carries no `phone` field, so
the field is absent in every sampled case rather than differing between them,
while the masked set stays the four values SC-004 names. Each task keeps its
phase, `[P]` and `[US#]` markers, file path, and `(implements FR-###, AC-###)`
tail; no task was added or removed, no identifier moved, and no other task's
scope changed. The count stays 144 tasks, 53 FR, 58 AC, and 9 SC.

**Amended again 2026-11-04** by the tasks pass that carries the clarification
sessions (8)â€“(10) and the plan's operational-record, recovery, and
verification-contract paragraphs into this file, without renumbering. Eleven
tasks are added above T144: T145 tests the structured record's closed schema, its
emission order, and its failure isolation before T018 lands; T146 tests the three
indivisible writes; T147 tests the repeated requests whose first response was
lost; T148 tests the service's and the store's unavailability and the messaging
provider's outage; T149 tests the restart's invariance; T150 tests the release
boundary and the migration's neutrality; T151 tests the first migration's
rollback; T152 tests the restore point's state; T153 tests the operational rows'
hourly bound; T154 tests the provisioning action's failed record; and T155
enforces the coverage gate's blocking moment and evidence at R1's acceptance.
T060 gains the record's emission-before-response assertion, T121's README order
gains T155 as its fourth writer, and T129's drill gains the `/health` and FR-055
state assertions the plan fixes. No identifier moves and no existing task's scope
shrinks. The count becomes 155 tasks; the specification's counts are 55 FR, 62 AC,
and 9 SC. **CHK002 is closed**: AC-059â€“AC-062 now have test tasks, and every one
of the 62 criteria is exercised by at least one requested test task. **CHK005 is
closed**: T155 names the moment the coverage gate blocks â€” R1's acceptance â€” and
the artifact that reports it. The trace tables below carry both closures.

**Project Context Sources (binding)**: task generation read `plan.md` for the
technical detail and the ownership map, and it MUST agree with the project-level
sources the plan was written against â€” `.specify/memory/constitution.md`,
`docs/architecture.md`, `docs/domain-model.md`, and `docs/DECISIONS.md`. Every
path a task touches appears in the plan's ownership map, which matches
`docs/architecture.md` apart from the module layout `plan.md` â†’ Complexity
Tracking row 26 records and record 1 carries; the entities touched are `User`
and `Session`, both
registered in `docs/domain-model.md`; and no task contradicts an accepted
decision in `docs/DECISIONS.md` (read as its index plus the volume holding the
records this feature touches, ADR-071 and ADR-125).

**Tests**: The specification's **Test Coverage Request** requests unit,
integration, and end-to-end tests (spec.md â†’ Test Coverage Request), so test
tasks are generated. Every `FR-###` and every `AC-###` is referenced by at least
one task, and every acceptance criterion is exercised by at least one test task.

**Organization**: Tasks are grouped by user story. The phases follow the
priority order of the specification â€” the three P1 stories (US1, US2, US7)
before the P2 stories (US3, US4, US5) and the P3 story (US6). US7 sits last in
`spec.md` only because requirement identifiers are fixed, not because its
priority is lower: its integration tests gate the P1 checkpoint (ADR-139), which
is why its phase follows US2 here.

**Plan increments**: Phases 1â€“2 are the plan's foundation increments A1â€“A8 plus
B1; Phases 3â€“9 are B2â€“B7; the final phase is B8.

**Task numbering**: T001â€“T124 keep the identifiers earlier artifacts, commits,
and the 2026-10-30 analysis cite. The foundation and acceptance gates that
analysis added carry T125â€“T129: inserting them in place would renumber every
later task, so each sits in the phase where it executes, and the phase order â€”
not the numeric suffix â€” is the execution order. T125â€“T127 are foundation gates
(A4, A5, and B1); T128â€“T129 are acceptance gates (B8). The 2026-10-30 amendment pass
adds T130 (the accessibility checker's record, now ADR-145, before T023) and T131
(the register amendment, now ADR-146, after T120) on the same rule. The
2026-10-31 clarification pass adds T132 and T133 to the US5 phase and T134 to the
final phase on that same rule: a new task never renumbers an old one. The
2026-10-31 analyze pass adds T135 to the foundational phase (the password-change
service, A8) and T136 to the final phase (the deprecation-policy record, beside
T120) on the same rule.
The 2026-10-31 analyze pass's R1 repair adds T137 to the final phase (the
refusal order's application on US3's recovery route and the recovery budget
exemption) on the same rule. The 2026-10-31 plan repair adds T138 and T139 to
the foundational phase (the layer's content skeleton, in-place loading bar and
loading-state rule, and bidirectional file-name surface) on the same rule. The
2026-11-01 analyze and clarify pass adds T140 and T141 on that same rule, and
their provenance is stated once here so a later reader does not reconstruct it:

**T140's source.** The 2026-11-01 clarification made FR-035 state the maximum
the plan's CMV row 17 already fixed, and the plan's record 3 (T120) fixes the
breached-password source: SecLists' top 100,000 entries as lowercase SHA-256
hex digests, refreshed quarterly. T140 vendors that list and implements the
policy in the foundational "Shared reference and contracts" section, because
T008's closed error-code union, T035's unit test, T043's password field, T047's
sign-up route, T088's new-password step, T111's provisioning, and T135's
password-change service all consume the same policy before any story verifies
it; T035 stays the test that exercises it and no requirement is added.

**T141's source.** The plan's Testing section puts the INP user flow under
`apps/web/tests/perf/` and the Lighthouse budget asserts INP â‰¤ 200 ms through a
timespan flow, while T024's CI job already names "the INP user flow" without a
task building it. T141 supplies that file and wires it into T024's Lighthouse
step, beside T024 in the test-runner section, and cites Complexity Tracking
row 1 because it implements no FR/AC of its own; the budget it feeds is the
constitution's lightweight performance budget the plan records.

The 2026-11-02 copy-checklist pass adds T143 to the final phase (record 16, beside
T142) on the same rule. The 2026-11-03 AC-020 coverage pass adds T144 to the US4
phase, beside T091, on the same rule: it carries AC-020's removal effects, which
no task verified before.

The 2026-11-04 operational-state pass adds T145â€“T155 on the same rule. T145 sits
in the API-skeleton section of the foundational phase, before T018's logger,
because the record's schema, order, and failure isolation are asserted before the
writer lands. T146â€“T154 sit in the final phase, where the assembled service is
exercised: the indivisible writes (T146), the lost-response repeats (T147), the
unavailability and provider outage (T148), the restart (T149), the release and
migration (T150), the rollback (T151), the restore point (T152), the operational
rows' bound (T153), and the provisioning action's failed record (T154). T155
follows T024 and T121â€“T123, because it writes the CI gate's coverage step and the
README's acceptance condition. Their provenance is the clarification sessions
(8)â€“(10) â€” the availability and degradation boundary, the indivisible writes and
lost-response repeats, and the restart, release, restore, and rollback rules â€” and
the plan's operational-record, recovery, and verification-contract paragraphs
(the record's content and emission, the rows' bound, the provider's outage, the
restore's state, and the rollback's state consequence).

The 2026-11-05 copy-scan and message-code pass adds T174 and T175 to the final
phase, beside T100, on the same rule: T174 completes SC-008's scan over the
static strings, the runtime-generated numerals, and the four templates, with its
verdict and its two exceptions; T175 binds the message table to the closed
26-code union and fails on a missing placement. Their provenance is the copy
checklist's CHK024, CHK026, and CHK018 and the refusals checklist's CHK019, and
no earlier task's scope changes.

**Amended 2026-11-04** by the verification-and-refusal closure pass: T156â€“T163 add
the tests `plan.md` â†’ *The verification contract* fixes and no earlier task carried â€”
the deterministic races (CHK025), the four clocks on both sides of every bound
(CHK026), the channel's failure matrix (CHK027), the invariants' failing cases
(CHK030), the test classes' environments (CHK031), and the enumeration's
reproducibility (CHK032) â€” while verification CHK028 and CHK029 close on the tasks
the trace maps to them. T164â€“T166 carry the cross-cutting criteria AC-056, AC-057,
and AC-058, and T167â€“T173 the refusals no criterion reaches, closing the refusals
checklist's CHK021â€“CHK029. No identifier T001â€“T155 moved, and no FR, AC, or SC was
added, renumbered, or amended: the count stays 55 FR, 62 AC, and 9 SC, and the task
count becomes 173.

**Amended 2026-11-05** by the copy-scan and message-code binding pass, without
renumbering. T174 completes SC-008's scan in
`apps/web/tests/unit/user-facing-strings.spec.ts` (T100) â€” the static strings, the
numerals the platform generates at runtime (the one-time code and the mobile
number in FR-038's display form, with R1's notifications control carrying no
unread badge), and the four SMS templates â€” and fixes the scan's verdict (one
failing string fails the test, the run, and the CI job, and the report is
SC-008's evidence at R1's acceptance) and its two exceptions (a supplied value
and the city list's recorded names, each outside the language, numeral, and
diacritic limbs and inside the no-emoji limb). T175 binds the message table to
the closed error-code union: `contracts/ui-contracts.md` Â§6 and Â§8.4 are read
against `contracts/auth-api.md` Â§3.1's **26** codes and
`packages/shared/src/contracts/auth.ts` (T008), and the test fails when a code
has no placement, a row names a code outside the union, a `reason` variant is
missing or duplicated, or a `Where` cell is empty. The pass closes copy CHK024,
CHK026, and CHK018's executable binding and refusals CHK019. No identifier
`T001`â€“`T173` moved, and no FR, AC, or SC was added, renumbered, or amended: the
count stays 55 FR, 62 AC, and 9 SC, and the task count becomes 175.

**Amended again 2026-11-05** by the counts-as-readings pass, without
renumbering. T123 now names the source of its scenarios instead of their count â€”
`quickstart.md` Â§3's list, closed by Â§7 at Scenarios 1â€“15, with Scenario 1's SQL
checks â€” and T167 derives its requests from AC-048's ten state-changing
requests, the ten POST routes of `contracts/auth-api.md` Â§5.2â€“Â§5.11 with both
code-entry routes included. T076 names those two routes beside the
change-password and the two sign-out requests it already asserts, so the forgery
test reaches every request AC-048 enumerates. The Notes state the rule these
edits apply: every count is a reading of a named list, and the task total is
read from this file's own identifiers. No task identifier was added, removed, or
moved â€” the `T001`â€“`T175` sequence stands as it was â€” and no FR, AC, or SC was
added, renumbered, or amended.

## Format (REQUIRED)

Every task strictly follows this format:

```text
- [ ] T### [P?] [US#?] <action> with exact file path (implements FR-###, AC-###)
```

1. **Checkbox**: always `- [ ]`.
2. **Task ID**: `T001`, `T002`, â€¦ in execution order for the original sequence.
   A task appended by a later consistency pass keeps an identifier above the
   highest existing number (`T125`-`T175`) and sits in the phase where it
   executes; the phase order, not the numeric suffix, is the execution order.
3. **[P]**: present only when the task is parallelizable â€” different files and no
   dependency on an incomplete task.
4. **[US#]**: required for user-story-phase tasks; omitted in Setup, Foundational,
   and Polish phases.
5. **Description**: the action with the exact file path it touches.
6. **Reference tail**: every task ends with `(implements FR-###, AC-###)`, or with
   `(implements Complexity Tracking: <row>)` naming an existing row of `plan.md` â†’
   Complexity Tracking when no requirement genuinely applies.
7. **Success-criterion references**: a task that produces or asserts a success
   criterion names it in its description (`SC-###`), because the tail keeps the
   `(implements FR-###, AC-###)` form the constitution fixes. SC-001 â€¦ SC-009
   each appear against the task that evidences them.
8. **Absence as the implementation**: Where a requirement is a prohibition
   (FR-018, FR-030) or a criterion verified only by absence (AC-020, AC-034),
   the absence test is the implementation; no code task cites it.

## Path Conventions

Monorepo: `apps/`, `packages/`. Paths come from `plan.md` â†’ Project Structure and
appear in its Ownership Map. The Wafar UI layer is `packages/ui` (ADR-097); a task
that renders an icon names the semantic `WfIcon` key (never a raw `i-*` class or
an emoji), and a task that adds a visual value names the token it uses (never a
raw colour, spacing, radius, shadow, duration, or z-index value).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace initialization and the project's basic structure
(plan â†’ Implementation Sequencing â†’ A1).

- [X] T001 Create the pnpm + Turborepo workspace: `pnpm-workspace.yaml`, root `package.json` (scripts `dev`, `build`, `test`, `test:integration`, `test:e2e`, `test:a11y`, `test:visual`, `db:up`, `db:migrate`, `db:reset`, `db:seed`, `load:auth`, `sbom`), `turbo.json`, `.npmrc`, `.nvmrc` = `22`, `engines.node` = `>=22 <23`, and the committed lockfile (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T002 [P] Configure strict TypeScript, ESLint (`no-explicit-any`, `no-restricted-imports` for module boundaries), Stylelint (logical CSS properties only), and Prettier in `packages/config/**`, with every workspace extending `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters` (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T003 [P] Write `compose.dev.yml` (PostgreSQL 16, PgDog with the PgBouncer fallback profile, Redis, SeaweedFS, and OpenSearch under profiles) and `.env.example` listing every key the quickstart names â€” `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`, `SMS_TRANSPORT`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `LOG_LEVEL`, and `BACKUP_KEY_ENCRYPTION_KEY` (a name only, never a value) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T004 [P] Add the dependency-budget check (â‰¤ 30 direct runtime dependencies per workspace and â‰¤ 60 repository-wide, counting `dependencies` only) in `packages/config/scripts/check-dependency-budget.mjs` and wire it into the lint job (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The layer, the shared reference datasets and the breached-password
policy, the shared scaffolding (the bare layout, the step state
machine, the message mapping, the shared code step, and the password-change
service), the layer's data-page primitives (the content skeleton, the in-place
loading bar and its loading-state rule, and the bidirectional file-name
surface), the data access, the API skeleton, the test runner and its CI gate
(the INP user flow included), the SMS port, and the backups every user story
consumes (plan â†’ Implementation Sequencing â†’ A2â€“A8 and B1).

**CRITICAL**: No user story work can begin until this phase is complete.

### Shared reference and contracts

- [X] T005 Create `packages/shared/src/routes.ts` exporting the one route map of `contracts/ui-contracts.md` Â§1 â€” the nine sidebar destinations, `/profile#settings`, the four static routes, the three bare routes, the guest sign-in action, and the logo/home and notifications targets (implements FR-024, FR-036, AC-026, AC-039)
- [X] T006 [P] Implement `normalizePhone`, `normalizeCode`, `normalizeArabic`, and `hasEmoji` â€” the predicate FR-026 fixes: a code point with `Extended_Pictographic`, the variation selector U+FE0F, or the keycap U+20E3 â€” read from the range table generated from the vendored Unicode 18.0.0 data (`packages/shared/vendor/unicode/18.0.0/emoji-data.txt`, read by `scripts/gen/emoji-data.mjs`; the generated `emoji-data.ts` carries the version, URL, SHA-256, and range count, and its test asserts those values and regenerates the file from the vendored source), never from the runtime's `\p{Extended_Pictographic}` â€” with `hasEmoji` in `packages/shared/src/normalize/emoji.ts`, the predicate's one home as `plan.md` â†’ Technical Context â†’ Supplied-value validation fixes it, and `normalizePhone`, `normalizeCode`, and `normalizeArabic` beside it under `packages/shared/src/normalize/` â€” separators and spaces ignored, Arabic-Indic and Eastern Arabic-Indic digits mapped to Latin, a leading national zero read as part of the national number, a country code read once in its `+218` / `00218` / `218` form, a listed prefix plus exactly nine national digits required, and exactly six digits for a code (implements FR-031, FR-003, FR-026, AC-007, AC-003, AC-046)
- [X] T007 [P] Author the two fixed datasets `packages/shared/src/reference/libyan-cities.json` (flat array of unique, non-empty Arabic names covering every one of the 22 governorates of the Libyan administrative-division reference, each with at least one city or area entry, a qualifier inside the name where a real name recurs) and `packages/shared/src/reference/libyan-mobile-prefixes.json`, each with its `SOURCE` note and SHA-256 digest â€” the city list's note recording the source, version `1.0.0` (2026-11-01), the 22-governorate reference count, and the file's total entry count (implements FR-005, FR-003, AC-005, AC-003)
- [X] T140 Vendor the breached-password list in `apps/api/src/modules/auth/data/breached-passwords.sha256` â€” the top 100,000 passwords from SecLists (MIT) as lowercase SHA-256 hex digests, carrying the list's `SOURCE`, version, and SHA-256 digest â€” and implement the SHA-256 membership check with the 12-128 character rules read from `packages/shared/src/limits.ts` and the three refusal reasons (`PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`) in `apps/api/src/modules/auth/service/password-policy.ts`; T035 stays the test that exercises it, and the plan's record 3 in T120 rests on it (implements FR-035, AC-037)
- [X] T008 [P] Define the Zod request and response schemas and the closed error-code union of `contracts/auth-api.md` Â§3.1 â€” `PASSWORD_TOO_LONG` included, and the error envelope's optional `reason` (`empty` | `too_long` | `emoji`) on the two field codes â€” in `packages/shared/src/contracts/auth.ts` and `packages/shared/src/contracts/index.ts`, with every numeric bound declared once in `packages/shared/src/limits.ts` â€” each annotated with its CMV row â€” and read from there by both the web client and the API (implements FR-001, FR-007, FR-014, FR-035, AC-046, AC-008, AC-016, AC-037)

### Wafar UI layer and shared scaffolding â€” foundation

- [X] T009 Record the Precision design tokens, the light default, and the layer's rail-width token â€” **4.25rem**, 68 px at a 16 px root, recorded from ADR-128 decision 5, consumed by the collapsed sidebar's state and restated by no page â€” in `packages/ui/app/assets/css/tokens.css`, and wire the layer's Nuxt module in `packages/ui/nuxt.config.ts` (implements FR-025, FR-022, AC-027, AC-024)
- [X] T010 [P] Vendor both IconPark cuts under `packages/ui/vendor/icon-park/**` and `packages/ui/vendor/icon-park-outline/**`, pin each by SHA-256 (2,658 icons per cut, the outline cut consumed), and record the Apache-2.0 licence and the vulnerability scan beside them (implements FR-020, FR-026, AC-022, AC-028)
- [X] T011 [P] Self-host IBM Plex Sans Arabic and IBM Plex Mono as WOFF2 under `packages/ui/app/assets/fonts/**` with their OFL-1.1 records (implements FR-026, AC-028)
- [X] T012 Build `WfIcon.vue` (semantic keys over the vendored outline cut at 20px, never a raw `i-*` class), `WfNumeral.vue` (Latin digits with `direction: ltr; unicode-bidi: isolate`), and `WfWordmark.vue` (`as: 'mark' | 'link'`, with the shortened form the header uses at 320 CSS px from the layer's own mark and no second image asset) in `packages/ui/app/components/` (implements FR-026, FR-021, AC-028, AC-023)
- [X] T013 Implement the per-device appearance module and its pre-paint bootstrap in `packages/ui/app/composables/useAppearance.ts`, consumed by `apps/web/app/app.vue` with the CSP nonce and the stored-choice-wins rule (implements FR-025, AC-027)
- [X] T014 Set `<html dir="rtl" lang="ar">`, the document-title pattern, the layer's CSS import, and the Nuxt UI theme in `apps/web/app/app.vue`, `apps/web/app/app.config.ts`, and `apps/web/app/assets/main.css` (implements FR-026, AC-028)
- [X] T050 Build the bare layout in `apps/web/app/layouts/bare.vue` â€” the non-interactive wordmark above the page title, the title above the card, the cross-links slot, and no frame (implements FR-021, FR-036, AC-023, AC-039)
- [X] T053 Build the step state machine and the in-progress guard in `apps/web/app/composables/auth/useAuthStep.ts`, with the status and alert announcements and focus moving to the step now shown, and the two endings that each return a code step to the flow's first step with a retryable status message and no navigation: the one the pending request's own lifetime produces, at that moment, and the one the incorrect-entry bound produces â€” the fifth incorrect entry ends the code step and returns the page to the flow's first step with the `OTP_REQUEST_ENDED` notice (`contracts/ui-contracts.md` Â§6's `ended_notice` row), so the person is never left on a step whose request has ended and a fresh submission begins a new verification with the incorrect-entry count at zero (AC-041) (implements FR-040, FR-034, FR-038, AC-043, AC-036, AC-041)
- [X] T054 Build the code-to-Arabic message mapping in `apps/web/app/composables/auth/useAuthMessages.ts` from the single table of `contracts/ui-contracts.md` Â§6, keyed on the refusal code and â€” where the table names one â€” its `reason`, so the five cause rows the two field codes carry each select their own text: `INVALID_FULL_NAME` with `empty`, `too_long`, and `emoji`, and `INVALID_SHOP_NAME` with `too_long` and `emoji`; the three password-policy reason rows (`PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_TOO_COMMON`) are included on the same terms â€” no cause is left for the implementation to invent, and no error code is added â€” and every numeral the table carries is a slot filled from `packages/shared/src/limits.ts` (`passwordMinLength`, `passwordMaxLength`, `fullNameMaxLength`, `shopNameMaxLength`, `otpLength`, `otpLifetimeMinutes`), with `apps/web/tests/unit/copy-values.spec.ts` asserting that each slot resolves, that each rendered string carries its slot's value and no other numeral, and that each value still falls in the agreement class its string declares (implements FR-008, FR-035, FR-026, AC-009, AC-037, AC-046)
- [X] T052 Build the shared code step for both flows in `apps/web/app/components/auth/CodeStep.vue` â€” the read-only collected fields, with the full name, city, and shop name shown as the person supplied them (their own script and digits, never transliterated or re-numeralised) and each of them rendered in one isolated bidirectional run whose direction comes from its own first strong character (FR-045), and the mobile number in FR-038's display form `+218 91 234 5678` inside one isolated left-to-right run â€” the code field, `ØªØ­Ù‚Ù‚`, `Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø¬Ø¯ÙŠØ¯`, `ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª`, the expiry hint, and interpolation-only rendering of every collected value, parameterized by the displayed-field list, the change-number control, and the resend control â€” the `Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø¬Ø¯ÙŠØ¯` control the passing flow binds to the resend route `POST /api/v1/auth/verifications/resend` (T049), disabled while it is in flight â€” so US1 and US3 pass their own values and neither edits the component, with its unit and component tests (implements FR-038, FR-045, FR-026, FR-006, AC-041, AC-049, AC-006, AC-028)
- [X] T015 [P] Write the token contract test in `packages/ui/tests/tokens.spec.ts`, asserting every recorded token name and value â€” the focus line, the type scale, the measurements, the appearance defaults, and the rail-width token the collapsed sidebar consumes (implements FR-025, FR-022, AC-027, AC-024)
- [X] T138 [P] Build the content skeleton and the in-place loading bar in `packages/ui/app/components/WfContentSkeleton.vue` and `packages/ui/app/components/WfLoadingBar.vue` with the loading-state rule ADR-128 decision 9 fixes â€” the indicator appears after 120 ms and stays for at least 300 ms, the skeleton's geometry equals the content's geometry, one Arabic sentence per region, the shimmer colour derived from the ink token, and the RTL shimmer direction as a token rather than a hard-coded angle â€” with the unit test in `packages/ui/tests/loading.spec.ts`; no R1 page renders it, and every later data page (R2, R4, R5, R9) consumes it (implements Complexity Tracking: R1 builds the layer's content skeleton, the in-place loading bar and its loading-state rule, and the bidirectional file-name surface, with no R1 page rendering them)
- [X] T139 [P] Build the bidirectional file-name surface in `packages/ui/app/components/WfFileName.vue` â€” the Latin extension isolated inside an Arabic name with bidirectional isolation so it renders in reading order, per ADR-128 decision 14 â€” with its unit test in `packages/ui/tests/file-name.spec.ts`; no R1 page renders it, and R2, R4, R5, and R6 consume it (implements Complexity Tracking: R1 builds the layer's content skeleton, the in-place loading bar and its loading-state rule, and the bidirectional file-name surface, with no R1 page rendering them)
- [X] T135 Build the password-change service in `apps/api/src/modules/auth/service/password-change.ts` â€” the value rules, the current-password check, the credential rewrite, the global revocation, the pending recovery row's deletion, the conditional credential write that re-checks the live session inside the transaction so a reset that committed first makes the change write nothing, and the forced-first-change rule (the requirement cleared by that change and by no other path) â€” declaring the lock, credential, session, and security-event collaborators as ports and exposing the administrator branch as the `AdministratorPasswordChange` port US6 implements in its own file; a failed current-password check reports `auth.password.current_check_failed` with its path â€” `change` for the account's own action and `forced_change` for the administrator's forced first change â€” through that port, while a value-rule refusal and a lock refusal report nothing; US2's route delegates to it and clears no flag (implements FR-013, FR-028, FR-009, FR-037, AC-014, AC-030, AC-010, AC-040)

### Data access

- [X] T016 Build the Drizzle client, the unit-of-work handle, and the migrator entry in `packages/db/client.ts`, `packages/db/index.ts`, and `packages/db/unit-of-work.ts`, with connection `statement_timeout = 2 s` and parameterized statements only (implements FR-004, AC-004)

### API skeleton

- [X] T017 Build the Hono composition root in `apps/api/src/app.ts` and `apps/api/src/index.ts` â€” the `/api/v1` mount every public route carries, with `/health` unversioned as the operational probe, `GET /health` running `SELECT 1` against PostgreSQL on every call and answering `200 {"status":"ok","database":"ok"}` or `503 {"status":"degraded","database":"error"}` when the database is unreachable (PostgreSQL is the only probed dependency; Twilio is an outbound channel whose refusal the flow already handles), the correlation id, the error envelope of `contracts/auth-api.md` Â§3, the 16 KB body guard, and graceful shutdown (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T125 Build the OpenAPI 3.1 generator in `apps/api/src/http/openapi.ts`, emitting `apps/api/openapi.json` from the Zod contract schemas in `packages/shared/src/contracts/**` and the Hono route table through Zod v4's built-in `z.toJSONSchema()` with no new dependency, and regenerate the document as routes land (implements Complexity Tracking: The public-interface documentation gate â€” the OpenAPI 3.1 generator (T125) and the verification of the committed document (T128) â€” serves Gate 2 â†’ Documentation and carries no FR-###/AC-### pair)
- [X] T145 [P] Unit test the structured record's closed schema, its emission order, and its failure isolation in `apps/api/src/observability/__tests__/logger.spec.ts`, written before T018 and failing until it lands â€” one line per event carrying exactly `event`, `level`, `timestamp` (UTC, RFC 3339 with milliseconds, read from the injected clock), `requestId`, `outcome` (`success` or `failure`), `reason` where the contract names one, `accountId` only where an account exists and never the mobile number, and the per-event `path`, `blocked`, `sessionCount`, `kind`, and `channel` fields and no others; no phone number, name, city, shop name, token, code, hash, initial password, or IP address; the emit returns before the response's write is called, asserted through a stream that records its call order; and a stream that throws leaves the action's outcome and response unchanged, writes one `error` line to stderr carrying the `requestId` and the event name, and retries nothing, queues nothing, and reaches no second sink (implements FR-037, AC-040)
- [X] T018 Build the structured JSON logger in `apps/api/src/observability/logger.ts`, carrying no phone number, name, city, shop name, token, code, hash, or IP address; FR-037's closed security-event list and the event-record schema its records are written against live only in T069's `apps/api/src/modules/auth/service/events.ts`, so no second schema is written here (implements FR-037, AC-040)
- [X] T019 Build the request-forgery middleware and the security-header middleware in `apps/api/src/http/security.ts` â€” the `GET /api/v1/auth/csrf` route issuing and rotating the `wafar.csrf` cookie (`contracts/auth-api.md` Â§5.1: 32 random bytes base64url, not `HttpOnly`, `SameSite=Lax`, `Secure` in production, and a rotation invalidating the previous token) and returning the signed `formStamp` in the same body â€” the stamp carrying only its issuance time and the destination `sign_up_form`, signed with HMAC-SHA256 under a key derived from the authentication secret with the `form_stamp` context, never stored, and invalidated by neither a token rotation nor a submission â€” plus the cookie pair with the `Origin` allowlist, a content-security policy with a per-response nonce whose script sources carry no wildcard, no `'unsafe-inline'`, and no eval-permitting source such as `'unsafe-eval'`, HSTS in production, `nosniff`, and `frame-ancestors 'none'` (implements FR-044, FR-046, FR-029, AC-048, AC-050)
- [X] T020 Build the single shared entry point in `apps/api/src/http/context.ts` â€” resolve the session token, the account's status, role, and forced-change restriction, and the merchant scope in one place, applying the guest, non-blocked revocation, clock, restriction, and allowed rows of the refusal table in `data-model.md` Â§5; the blocked-status ground â€” a live session of a blocked account, and the tombstone that carries `blocked` â€” is added by T092 (implements FR-053, FR-049, AC-056, AC-053)
- [X] T021 Add the Nitro security-header and nonce plugin in `apps/web/server/plugins/csp.ts`, injecting the nonce into Nuxt's inline scripts (implements FR-046, AC-050)

### Test runner and continuous integration

- [X] T022 Wire Vitest (node plus `@nuxt/test-utils`), the V8 coverage provider, the unit/integration project split over the unit project's roots â€” `packages/shared/src/**/__tests__/**`, `apps/api/src/**/__tests__/**`, and `apps/web/tests/unit` â€” alongside `apps/*/test` and `packages/ui/tests`, and the â‰¥ 80% measurable changed-line threshold in `packages/config/vitest.config.ts`, excluding the frame's page-level runtime (Complexity Tracking row 2); `apps/web/tests/unit/copy-values.spec.ts`, `apps/web/tests/unit/supplied-values.spec.ts`, and `apps/web/tests/unit/user-facing-strings.spec.ts` run under Vitest, not Playwright, so the unit project's roots carry them and the Playwright project in `apps/web/tests/playwright.config.ts` claims none of them (implements Complexity Tracking: The coverage gate â€” Vitest with the V8 provider, the unit/integration project split, and the â‰¥ 80% measurable changed-line threshold (T022) â€” serves Gate 1 â†’ III and carries no FR-###/AC-### pair)
- [X] T130 Verify the automated-accessibility-checker decision record is recorded as ADR-145 in `docs/DECISIONS.md` â€” `@axe-core/playwright` (MPL-2.0), a dev-only CI gate that is never shipped, its licence obligation, its vulnerability scan, and its review date â€” before T023 wires the checker, and append nothing (implements Complexity Tracking: @axe-core/playwright is the automated accessibility checker under MPL-2.0)
- [X] T023 [P] Wire Playwright, `@axe-core/playwright`, and the screenshot project in `apps/web/tests/playwright.config.ts` with the pinned Chromium and the self-hosted fonts (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T024 Build `lighthouserc.json` and `.github/workflows/ci.yml` â€” governance, lint/typecheck, unit, integration (PostgreSQL service plus migrations), e2e (Playwright, fake SMS, accessibility, visual), Lighthouse CI (the mobile-preset LCP/INP/CLS budget on the three bare pages plus the INP user flow), coverage, build plus SBOM, `osv-scanner` and Semgrep â€” with the dependency-install step as the only networked step (implements Complexity Tracking: The continuous-integration pipeline â€” `lighthouserc.json` and `.github/workflows/ci.yml` (T024) â€” serves Gate 2 â†’ Performance Budgets and Verification, Dependency Governance, Documentation, and Module Discipline and Development Workflow, and carries no FR-###/AC-### pair)
- [X] T141 Write the INP user flow for the Lighthouse budget in `apps/web/tests/perf/inp-user-flow.mjs` â€” focus the mobile field, type a number, and submit â€” and wire it into T024's Lighthouse step, the one that already names "the INP user flow" (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T025 Add `.github/dependabot.yml` and the `pnpm sbom` job for `@cyclonedx/cyclonedx-npm` to the `.github/workflows/ci.yml` that T024 creates (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T127 Add the module-responsibility header check in `scripts/check/module-headers.mjs` â€” every production module file opens with a one-line header naming its single responsibility and never repeats the owning feature (the Ownership Map records that once) â€” and wire it into the CI gate so a missing or empty header fails the build (implements Complexity Tracking: The module-responsibility header check (T127) serves Gate 2 â†’ Documentation and Gate 1 â†’ X and carries no FR-###/AC-### pair)

### SMS transport

- [X] T026 Build the `SmsTransport` port, the Twilio adapter (750 ms timeout, no in-request retry, no fallback provider), the deterministic fake with its configurable acceptance duration â€” `SMS_FAKE_ACCEPT_MS`, a whole number of milliseconds from 0 to 750, `0` by default, named in `.env.example` as a non-secret and read once at boot through the validated environment schema so a value outside the range stops startup, and waited inside the transport call before the fake answers `accepted` â€” the rolling-median acceptance estimator `apps/api/src/modules/auth/sms/acceptance-estimate.ts` with its own unit test `apps/api/src/modules/auth/sms/__tests__/acceptance-estimate.spec.ts` pinning the empty window at `0`, one sample, an even and an odd window, the oldest sample's eviction when the seventeenth arrives, the 750 ms cap, and the process reset, and the four Arabic templates in `apps/api/src/modules/auth/sms/`, with every template body Arabic, right-to-left, Latin-numeral, diacritic-free, and emoji-free because AC-028's scan reaches the message bodies as it reaches the screens, and SC-008 measures the same scope; each body is UCS-2 and its length is asserted against its class's bound after `{code}` is replaced by six Latin digits â€” 70 code units for a one-time-code body and 134 for a notice â€” so a body over the bound fails the test rather than being cut, split, or truncated, and the two code bodies carry the closing clause Â«Ù„Ø§ ØªØ´Ø§Ø±ÙƒÙ‡.Â» (implements FR-043, FR-026, AC-047, AC-028)
- [X] T027 Write `docs/runbooks/sms-provider.md` â€” the provider's terms, the port's contract, the 750 ms acceptance bound, and the fake's use in development and CI (implements Complexity Tracking: Twilio is a proprietary service with an MIT SDK)

### Backup and restore

- [X] T028 Build `scripts/backup/backup.sh`, `scripts/backup/seal.mjs`, `scripts/backup/verify.sh`, and `scripts/backup/restore.sh` (nightly `pg_basebackup`, `archive_timeout = 60`, a `pg_restore` drill); `seal.mjs` encrypts every archive â€” each base backup and each archived WAL segment â€” with AES-256-GCM under a data key wrapped by the key-encryption key injected from `BACKUP_KEY_ENCRYPTION_KEY` (the name lives in `.env.example`, never a value), using Node's built-in `crypto` and no new dependency; write `docs/runbooks/backup-restore.md` with the RTO 4 h / RPO 15 min drill and the key-custody rule (implements Complexity Tracking: Backup archives are encrypted with AES-256-GCM under a key-encryption key injected from the environment)

### Checkpoint Aâ†’B

- [X] T029 Record the Aâ†’B checkpoint in `README.md`: the workspace, the layer, the tooling, and the CI gate are accepted and green, and no identity scenario runs before it (ADR-139) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)

### B1 â€” Schema, the first migration, and the expected version

- [X] T030 Declare the `users` and `phone_verifications` tables with every constraint and index of `data-model.md` Â§4 and Â§7 in `packages/db/schema/users.ts` â€” `btrim(full_name) <> ''`, `char_length(full_name) <= 100`, the unique `phone_number`, the unique `email` sentinel (`+218912345678` â†’ `218912345678@phone.invalid`, the canonical number without `+` then `@phone.invalid`), `CHECK (role IN ('merchant','administrator'))`, `CHECK (status IN ('active','blocked'))`, `failed_sign_in_count >= 0`, `must_change_password`, the two quota overrides (`BETWEEN 1 AND 500`, `BETWEEN 1 AND 1500`), and the pending store's `purpose`, `state`, `incorrect_entries BETWEEN 0 AND 5`, and `re_requests BETWEEN 0 AND 3` checks (implements FR-016, FR-031, FR-009, FR-028, FR-001, AC-018, AC-007, AC-010, AC-030, AC-046, AC-057)
- [X] T031 [P] Declare the `accounts`, `sessions`, `verifications`, and `rate_limit_counters` tables with every constraint and index of `data-model.md` Â§5, Â§6, Â§8, and Â§9 in `packages/db/schema/auth.ts` â€” the `revoked_reason` check paired with `revoked_at`, `char_length(token) >= 32`, `CHECK (password LIKE '$wafar$scrypt$%')`, the `(key, window_start)` primary key, and the partial and sweep indexes; `verifications` is the library's placeholder (the adapter's model set requires it, no R1 path writes it, and T037 asserts it empty â€” `data-model.md` Â§8) (implements FR-032, FR-033, FR-035, AC-015, AC-035, AC-037)
- [X] T032 Generate and hand-review `packages/db/migrations/0001_identity_foundation.sql` with its paired `0001_identity_foundation.down.sql` using `drizzle-kit generate`, creating the six tables in the order `data-model.md` Â§13 fixes â€” including the library's `verifications` placeholder, asserted empty by T037 (Â§8) â€” and add the hourly idempotent sweeps (pending requests, rate-limit counters, sessions) behind an advisory lock (implements FR-004, FR-032, AC-004, AC-015)
- [X] T126 Generate `packages/db/schema-version.ts` with the SHA-256 of `packages/db/migrations/meta/_journal.json` and the applied-step count, and add the boot-time schema-version guard in `apps/api/src/index.ts` â€” comparing the applied rows of `drizzle.__drizzle_migrations` with that value before the listener opens and exiting non-zero on absence or mismatch; add `apps/api/test/integration/db/schema-version.spec.ts` starting the API against an unmigrated database (asserting the refusal) and at the expected version (asserting readiness) (implements Complexity Tracking: The boot-time schema-version guard (T126) serves Gate 2 â†’ Schema and Migration Control and carries no FR-###/AC-### pair)

**Checkpoint**: Foundation ready â€” user story implementation can now begin.

**Gate C1 (Documentation, foundation half)**: the OpenAPI generator (T125) and the
module-responsibility header check (T127) exist and run, and the accessibility
checker's record (T130) lands before T023 wires the checker; T128 at B8 verifies
the generated document and records the standalone drift test's R2 ownership
(ADR-031 item 4).

**Gate C2 (Schema and startup)**: T126, B1's last step, after the migration whose
journal fixes the expected version, has its two integration tests green â€” the API
refuses to open its listener against an unmigrated database and opens at the
expected version (plan â†’ Constitution Check â†’ Schema and Migration Control; C2).

---

## Phase 3: User Story 1 â€” Create an account and verify the mobile number (Priority: P1) â€” MVP

**Goal**: A visitor signs up with a full name, a Libyan mobile number on +218
with no dial-code selector, a password, a city from the fixed list, and an
optional shop name; the platform sends a one-time code and entering it creates
the account and its session together, in place, with no separate sign-in step.

**Independent Test**: Complete the sign-up form with a valid Libyan mobile number
and enter the code the fake transport recorded; the merchant ends up signed in
with a usable account. The number's Libyan-only shape, the absence of a
dial-code selector, the city list, the uniform response, and the refusal of a
value carrying an emoji are each verifiable on their own.

### Tests for User Story 1

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T033 [P] [US1] Unit test the accepted number spellings and the format refusal in `packages/shared/src/normalize/__tests__/phone.spec.ts` â€” separators, a national leading zero, `+218` / `00218` / `218` read once, Arabic-Indic digits, and a landline or an unlisted prefix refused (implements FR-031, FR-003, FR-042, AC-007, AC-003)
- [X] T034 [P] [US1] Unit test the sign-up field rules and the city list in `packages/shared/src/contracts/__tests__/sign-up.spec.ts` and `packages/shared/src/reference/__tests__/libyan-cities.spec.ts` â€” presence, the 100-code-point bound, no alphabetic-shape rule, a full name or shop name carrying an emoji refused with its explicit reason message under the predicate FR-026 fixes (an `Extended_Pictographic` code point, the variation selector U+FE0F, or the keycap U+20E3, with a keycap sequence and a flag refused and a bare numeral accepted), no shop-name uniqueness, every one of the 22 governorates present with at least one city or area entry and the entry count equal to the `SOURCE` note's, one Arabic name per entry with no Latin alternate, unique Arabic names with qualifiers, diacritic-insensitive search, and exact-name storage (implements FR-001, FR-005, FR-026, AC-046, AC-005)
- [X] T035 [P] [US1] Unit test the password policy and the scrypt profile in `apps/api/src/modules/auth/service/__tests__/password-policy.spec.ts` - 12-128 characters read from `packages/shared/src/limits.ts`, with the three refusal reasons (shorter than the minimum, longer than the maximum, and common or breached, each carrying its own message), the vendored SHA-256 membership test, reuse accepted on an ordinary change, a weakened or unrecognised storage form refused, and the pending password held only as a `$wafar$scrypt$` value (implements FR-035, AC-037)
- [X] T036 [P] [US1] Unit test the pending request's state machine in `apps/api/src/modules/users/service/__tests__/pending-request.spec.ts` â€” replacement per number, the re-request allowance â€” an accepted resend increments `re_requests` and restarts both expiries, the fourth answers `OTP_RESEND_LIMIT`, and a refused or timed-out send spends none of it â€” the incorrect-entry bound counting only a wrong live value, expiry, and the verified state's lifetime (implements FR-034, FR-038, AC-036, AC-041)
- [X] T037 [P] [US1] Integration test sign-up and verification in `apps/api/test/integration/auth/sign-up.spec.ts` â€” no `users` row after the form, still none after an incorrect code, and still none once the pending request's own lifetime has elapsed with no return, the abandoned sign-up leaving no account and no session, one account and one session at verification with the account row and its session appearing together, one `auth.sign_up.verified` record at verification, the library's `verifications` placeholder empty after the full registration path â€” a direct read through `packages/db` answers `count(verifications) = 0` once the correct code has created the account and its session and the pending row has been deleted, and at each earlier point this test reaches (after the form, after an incorrect code, and after the abandoned request's own lifetime has elapsed) â€” so a write to the placeholder anywhere in the flow fails the test and the emptiness `data-model.md` Â§8 fixes is asserted at every point the flow passes rather than at its end alone, the existing/blocked/administrator outcomes, the pending row deleted once the outcome is stated, an existing number submitted in an alternate spelling â€” spaces, a leading zero, without `+218`, or Arabic-Indic digits â€” reaching the existing-account outcome with one `users` row and no second account, a one-time code typed in Arabic-Indic digits verifying identically, a full name or shop name carrying an emoji refused among the value rules with its explicit reason message and identically whether or not the number has an account, before any account-existence comparison runs, and the sign-up path's SC-004 comparison: the same status, the same body shape and field set, with SC-004's four masked values â€” `requestId`, `phone`, `codeExpiresAt`, and `expiresAt` â€” each replaced by its fixed placeholder, the same header names (excluding `Date` and `X-Request-Id`), and a duration difference within the plan's enumeration tolerance (median â‰¤ 50 ms, p95 â‰¤ 150 ms) whether or not the number has an account, each response's `phone` asserted separately outside that comparison to equal that case's own submitted number in the canonical form, and the outcome stated after the correct code outside that comparison on the second exception SC-004 states, a fake-transport case that refuses the message at acceptance on the sixth exception SC-004 states, the explicit retryable failure it produces compared between a number that has an account and one that does not and asserted identical in every compared property â€” the same status, the same body shape and field set with the four masked values each replaced by its fixed placeholder, the same header names excluding `Date` and `X-Request-Id`, and the same duration tolerance â€” so the exception is exercised rather than assumed, and that every account row's email-shaped value is the reserved sentinel derived from its normalized number, with no supplied address stored and no email input on any form (implements FR-001, FR-004, FR-006, FR-026, FR-034, AC-004, AC-006, AC-007, AC-046, AC-057)
- [X] T038 [P] [US1] Integration test the two concurrency races for one number in `apps/api/test/integration/auth/sign-up-concurrency.spec.ts` â€” two simultaneous sign-ups for one number producing at most one account, no partial account, and no second session, with the attempt that does not create the account receiving the message FR-006 fixes for the existing account's status and role â€” the active merchant's sign-in-or-recovery message, the blocked account's message, or the administrator account's message, with no generic direction where the status or role calls for none â€” decided by the existing account's stored status and role as the winning transaction left them rather than by the losing attempt's own view; and two entries of the same correct code for one number arriving at the same moment producing at most one account and at most one session, the entry that does not create the account receiving that same status- and role-specific message rather than a generic direction to sign in or to recover the password, decided by the existing account's stored status and role, with no partial account, no second session, and no live pending request left behind (implements FR-006, FR-031, AC-006, AC-007)
- [X] T039 [P] [US1] End-to-end test the sign-up journey in `apps/web/tests/e2e/sign-up.spec.ts` â€” the form, no dial-code selector, the in-place code step with the collected fields, the code read from the fake transport, the in-place confirmation, a reload while the pending request is live resuming the code step, a reload after a second request was submitted for another number resuming the most recent submission (more than one live pending request, the newest wins), and a reload after the confirmation returning the page to its first step; through the journey no page address, history entry, referrer, or stored value carries the submitted number, the browser's tie to the pending request being its identifier; the journey completes within SC-001's three-minute budget, excluding delivery after the channel accepts (implements FR-001, FR-004, FR-037, FR-038, FR-041, FR-002, AC-001, AC-004, AC-041, AC-044, AC-002)
- [X] T040 [P] [US1] End-to-end test the in-progress guard, the inline failure, and focus movement in `apps/web/tests/e2e/form-states.spec.ts` â€” the disabled submit, the `role="status"` and `role="alert"` announcements, and focus landing on the step now shown, plus a refused submission keeping the page on the step that was submitted with every typed value, the password fields cleared and never re-displayed, and the code field cleared after a refused entry (implements FR-038, FR-040, FR-041, AC-041, AC-043)

### Implementation for User Story 1

- [X] T041 [P] [US1] Implement the `users` repository for the pending store and account creation in `apps/api/src/modules/users/repository/phone-verifications.ts` and `apps/api/src/modules/users/repository/users.ts` (implements FR-004, FR-031, AC-004, AC-007)
- [X] T042 [P] [US1] Build the city combobox in `apps/web/app/components/auth/CityCombobox.vue` over the bundled list, matching Arabic names while ignoring diacritics and submitting only an entry's exact name (implements FR-005, AC-005)
- [X] T043 [P] [US1] Build the password field with the policy statement above it, its two numerals filled from `packages/shared/src/limits.ts`, and one message per reason â€” shorter than the minimum, longer than the maximum, and common or breached â€” in `apps/web/app/components/auth/PasswordField.vue` (implements FR-035, AC-037)
- [X] T044 [US1] Implement the pending-request service in `apps/api/src/modules/users/service/pending-request.ts` â€” create, replace, resend, consume, expire; one row per number; the row is written only after the channel accepts (implements FR-034, FR-038, AC-036, AC-041)
- [X] T045 [US1] Implement account creation as one transaction with its credential and session in `apps/api/src/modules/auth/service/account-creation.ts` â€” it opens the unit of work and calls the `users` service port, so the `users` repository stays the only writer of `users` â€” rolling all three back on failure, leaving the code usable, and emitting `auth.sign_up.verified` when the transaction commits (implements FR-004, FR-034, AC-004, AC-036)
- [X] T046 [US1] Configure better-auth 1.6.14 with the phone-number extension, the scrypt hooks, the reserved placeholder `email`, `scim` and `sso` disabled, and no mounted library HTTP handler in `apps/api/src/modules/auth/better-auth.ts` (implements FR-004, FR-035, AC-004, AC-037)
- [X] T047 [US1] Implement `POST /api/v1/auth/sign-up` in `apps/api/src/modules/auth/routes/sign-up.ts` â€” value rules (the format refusal FR-042 widens to this page, and the emoji refusal under the predicate FR-026 fixes â€” an `Extended_Pictographic` code point, U+FE0F, or U+20E3 â€” each field refusal carrying its `reason` (`empty`, `too_long`, or `emoji`), both before any account-existence comparison), the pending row on accepted dispatch, the sign-up `auth.otp.dispatch_failed` event when the channel refuses or times out, and the response that is identical whether or not the number has an account (implements FR-001, FR-003, FR-005, FR-026, FR-035, FR-042, AC-001, AC-003, AC-005, AC-037, AC-046)
- [X] T048 [US1] Implement `POST /api/v1/auth/sign-up/verify` with the four outcomes in `apps/api/src/modules/auth/routes/sign-up-verify.ts` (implements FR-006, FR-031, AC-006, AC-007)
- [X] T049 [US1] Implement the resume read `GET /api/v1/auth/verifications/{requestId}` and the resend `POST /api/v1/auth/verifications/resend` in `apps/api/src/modules/auth/routes/verifications.ts` â€” the resume read returning the pending row's own payload and never an account row, authenticated by the pending cookie alone with no CSRF (a safe GET), and the resend for the live pending request of either flow ordered cookie â†’ live request â†’ `re_requests < 3` â†’ channel, refusing `OTP_EXPIRED`, `OTP_RESEND_LIMIT`, and `OTP_SEND_FAILED` and changing no state â€” the previous code stays valid and no allowance is spent â€” on a refused or timed-out send, the shared endpoint both the sign-up and recovery flows bind (`contracts/auth-api.md` Â§5.3.1, Â§5.4) (implements FR-038, FR-034, FR-014, AC-041, AC-036)
- [X] T051 [US1] Build the sign-up form in `apps/web/app/components/auth/SignUpForm.vue` â€” full name, the fixed `+218` phone with no dial-code selector, password, city combobox, optional shop name, the `formStamp` the render bootstrap (`GET /api/v1/auth/csrf`) returns, kept in the page and submitted unchanged and never written to storage, the shared emoji predicate applied to the full name and the shop name, and the format refusal FR-042 widens to this page (implements FR-001, FR-002, FR-003, FR-005, FR-026, FR-029, FR-042, AC-001, AC-002, AC-003, AC-005, AC-046)
- [X] T055 [US1] Build the sign-up page and its resume-on-reload tie in `apps/web/app/pages/auth/sign-up.vue` and `apps/web/app/composables/auth/usePendingRequest.ts` â€” the page composes the A8 shared code step (T052) with the sign-up flow's displayed fields and resend control and reopens the code step for the most recent request this browser submitted when more than one is live â€” rendering identically for a signed-in person and a guest; the page half of the rule plan record 15 fixes and T081 verifies: a 202 to a form whose hidden `website` field is filled chooses no step, and the transition is decided by the read `GET /api/v1/auth/verifications/{requestId}` with the pending cookie â€” `code` on that read's 200 alone, while `OTP_EXPIRED` leaves the page on `form` with no message and the code step is never reached (`contracts/ui-contracts.md` Â§3.1; AC-031) (implements FR-038, FR-041, AC-041, AC-044)

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 â€” Sign in, sign out, and end every session (Priority: P1)

**Goal**: A verified merchant signs in without a code, signs out, signs out of
every device, is subject to a fifteen-minute lock after five consecutive failed
attempts, and loses every session when the password changes; the platform can end
any session; both clocks end a session.

**Independent Test**: Sign a verified merchant in without a code, sign out of one
session, sign out of every device, revoke a session from the platform, and change
the password; each path ends exactly the sessions it should, and the sign-in
page renders one uniform refusal with no lock or block copy. The events US2 owns
are verified without another story; the security-events test's closed-list
assertions over the records US1, US3, and US6 produce, and over the format and
rate-limit refusals that emit none, are the registered exception `EX-012`.

### Tests for User Story 2

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T056 [P] [US2] Unit test the consecutive-failure count and the fifteen-minute lock in `apps/api/src/modules/auth/service/__tests__/sign-in-lock.spec.ts` â€” only a failed password verification against an existing active account increments; five lock; the lock is neither counted nor extended; expiry clears; a success clears; a value-rule refusal does not count; a failed current-password check counts; SC-007 asserts every one of these cases (implements FR-009, AC-010)
- [X] T057 [P] [US2] Unit test the two session clocks and the activity rule in `apps/api/src/modules/auth/service/__tests__/session-clocks.spec.ts` â€” 30 minutes of inactivity, 12 hours absolute, only a merchant-initiated action resets, a background request does not, and a browser restart neither ends nor extends (implements FR-032, AC-015)
- [X] T058 [P] [US2] Integration test sign-in and the uniform transcript in `apps/api/test/integration/auth/sign-in.spec.ts` â€” the five non-successful cases (unknown number, wrong password, locked account, blocked account, administrator account), a successful sign-in staying outside the comparison on the first exception SC-004 states, the enumeration test SC-004 requires (200 samples per case after a 20-request warm-up, top and bottom 5% dropped, byte-identical bodies once SC-004's four masked values â€” `requestId`, `phone`, `codeExpiresAt`, and `expiresAt` â€” are each replaced by its fixed placeholder, the same status, the same header set excluding `Date` and `X-Request-Id`, median difference â‰¤ 50 ms and p95 difference â‰¤ 150 ms, and each response's `phone` asserted separately outside that comparison to equal that case's own submitted number in the canonical form, with the sign-in transcript's 401 body carrying no `phone` field, so the field is absent in every sampled case rather than differing between them), SC-007's lock cases among them, and the query count of a sign-in (one user read, one credential read, one session insert) (implements FR-007, FR-008, FR-009, FR-017, FR-027, AC-008, AC-009, AC-010, AC-019, AC-029)
- [X] T059 [P] [US2] Integration test the session endings in `apps/api/test/integration/auth/sessions.spec.ts` â€” two sign-ins producing two live sessions, and signing out of one leaving the other live and granting access, sign-out idempotent, sign-out-all, platform revocation, the password change ending every session, and a failed current-password check ending none (implements FR-007, FR-010, FR-011, FR-012, FR-013, AC-011, AC-012, AC-013, AC-014, AC-058)
- [X] T060 [P] [US2] Integration test the security events and the notices in `apps/api/test/integration/auth/security-events.spec.ts` â€” one record per named event of FR-037's closed list, under the registered exception `EX-012` for the records US1, US3, and US6 produce (`auth.sign_up.verified`, `auth.password.reset`, both `auth.otp.dispatch_failed` kinds, and `auth.administrator.provisioned`) and for the format and rate-limit refusals it opens; the US2-owned events are asserted without another story; a failed current-password check on both change paths emits `auth.password.current_check_failed` with its `path`, while a value-rule refusal and a lock refusal emit none; no phone/name/city/token/code/hash/initial password in any record, no record for a format or rate-limit refusal, no notice on an ordinary sign-in or sign-out, one notice on a sign-out of every device, and one notice per change; and the record is handed to the process's structured stream before the response is written, asserted with a stream that records its call order, so a client that received a response can rely on the record having reached the stream (implements FR-037, FR-043, AC-040, AC-047)
- [X] T061 [P] [US2] Integration test the distinct format refusal in `apps/api/test/integration/auth/format-refusal.spec.ts`, asserting it is not the uniform transcript and sits outside the enumeration comparison on the format exception SC-004 states (implements FR-042, AC-045)
- [X] T062 [P] [US2] End-to-end test the sign-in journey in `apps/web/tests/e2e/sign-in.spec.ts` â€” no code, the in-place confirmation, the uniform failure text, no lock copy, no dial-code selector, no address, history entry, referrer, or stored value carrying the submitted number, and the journey completes within SC-002's thirty-second budget, and that a signed-in person sees the sign-in page exactly as a guest does (implements FR-007, FR-008, FR-009, FR-037, FR-002, AC-008, AC-009, AC-010, AC-002, AC-044)

### Implementation for User Story 2

- [X] T063 [US2] Implement the sign-in service with the decoy verification, the fixed check order of `contracts/auth-api.md` Â§5.5.1 (lock â†’ block â†’ administrator role â†’ credential), the administrator role refusal, and the lock port declared in `packages/shared` that the `users` module implements (T064) and the session port T065 implements, in `apps/api/src/modules/auth/service/sign-in.ts` (implements FR-007, FR-008, FR-009, FR-027, AC-008, AC-009, AC-010, AC-029)
- [X] T064 [US2] Implement the lock port declared in `packages/shared` in `apps/api/src/modules/users/repository/user-lock.ts` â€” the conditional update, the success reset, the expiry clear, and the current-password check's lock refusal, with the count cleared on success and at expiry as SC-007 requires â€” the plan's C1 decision places the lock's persistence in the `users` module, so the only writer of `users.failed_sign_in_count` and `users.locked_until` after account creation is the `users` module and no `auth` file issues SQL against `users` (implements FR-009, AC-010)
- [X] T065 [US2] Implement session issuance, the two clocks, the throttled activity write, and the tombstone revocations in `apps/api/src/modules/auth/service/sessions.ts` (implements FR-032, FR-010, FR-011, AC-015, AC-011, AC-012, AC-058)
- [X] T066 [US2] Implement `POST /api/v1/auth/sign-in`, `POST /api/v1/auth/sign-out`, `POST /api/v1/auth/sign-out-all`, and `GET /api/v1/auth/session` in `apps/api/src/modules/auth/routes/session.ts` (implements FR-007, FR-010, FR-011, AC-008, AC-011, AC-012, AC-058)
- [X] T067 [US2] Implement `POST /api/v1/auth/password/change` in `apps/api/src/modules/auth/routes/password-change.ts` â€” value rules, then the lock, then the current-password check, then the credential rewrite, the global revocation, and the pending recovery row's deletion â€” delegating the change to the foundation password-change service in `apps/api/src/modules/auth/service/password-change.ts` (T135) with the `users` lock implementation (T064) and the session implementation (T065) its ports declare; the route clears no flag and carries no rule of its own, so no second clearing path exists, and SC-007's count-clearing and lock-refusal cases hold (implements FR-013, FR-009, AC-014, AC-010)
- [X] T068 [US2] Implement the platform revocation CLI in `apps/api/src/cli/revoke-session.ts` with its exit codes and the `platform_revocation` reason (implements FR-012, AC-013)
- [X] T069 [US2] Build FR-037's closed security-event list and its emit function in `apps/api/src/modules/auth/service/events.ts`, and emit the US2-owned events from the services that produce them â€” `auth.sign_in.failed` and `auth.sign_in.succeeded` (T063), `auth.lock.applied` (T063, when the lock port reports the lock applied), `auth.password.changed` (T067's route over the A8 service), `auth.password.current_check_failed` (T135's event port, supplied here, with its `path` â€” `change` for the account's own action and `forced_change` for the administrator's forced first change), `auth.session.revoked` (T065), and `auth.notice.dispatch_failed` (T070) â€” so the closed list has one home and T069 edits no US1 or US6 file; `auth.sign_up.verified` is emitted by T045, the two `auth.otp.dispatch_failed` kinds by T047 and T085, `auth.password.reset` by T086, and `auth.administrator.provisioned` by T107, each in its own story (implements FR-037, AC-040)
- [X] T070 [US2] Dispatch the two security notices best-effort in `apps/api/src/modules/auth/service/notices.ts`, recording a failed send and undoing nothing (implements FR-043, AC-047)
- [X] T071 [US2] Build the sign-in form and page in `apps/web/app/components/auth/SignInForm.vue` and `apps/web/app/pages/auth/sign-in.vue` â€” one uniform failure message, no lock or block copy, and the two cross-links (implements FR-002, FR-007, FR-008, FR-042, AC-002, AC-008, AC-009, AC-045)
- [X] T072 [US2] Build the session resource in `apps/web/app/composables/auth/useSession.ts` and send `X-Wafar-Activity: 1` only from user-initiated handlers (implements FR-032, AC-015)

**Checkpoint**: User Story 2 is fully functional and testable independently.

---

## Phase 5: User Story 7 â€” Sign-up resists automated abuse without a CAPTCHA (Priority: P1)

**Goal**: The sign-up form carries a hidden field, a minimum time-to-submit, and a
per-client limit; every authentication operation carries its own two-key budget;
no CAPTCHA exists anywhere; every state-changing request is forgery-protected,
every supplied value is encoded, and every response carries the security headers.

**Independent Test**: Submit with the hidden field filled, before the minimum time,
and beyond the limit; confirm no CAPTCHA is ever presented, that a request the
person did not make is refused, that a value typed as markup is shown as text, and
that every response carries the named headers. These integration tests gate the
P1 checkpoint (ADR-139).

### Tests for User Story 7

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T073 [P] [US7] Integration test the honeypot and the minimum time-to-submit in `apps/api/test/integration/auth/sign-up-abuse.spec.ts` â€” with the fake's acceptance duration `SMS_FAKE_ACCEPT_MS` set to 200 ms in both the success and the refusal cases, and restored to `0` afterwards so the other suites keep their speed, so a refusal whose wait is removed falls the full configured wait short and fails both limbs â€” the silent success with no row and no dispatch, its response carrying the same status, headers, field set, and types as a successful submission and no next-step content, its duration measured one-sided against a successful submission's 202 â€” a median shortfall of no more than 50 ms and a p95 shortfall of no more than 150 ms over 200 samples per case after a 20-request warm-up with the top and bottom 5% dropped â€” so the wait the refusal observes is asserted rather than assumed, the resume read for the returned `requestId` answering `OTP_EXPIRED`, so the page's transition rule (T055) leaves it on the form's first step with no message and the code step is never reached (a 202 chooses no step, and only the resume read's 200 enters `code`; `contracts/ui-contracts.md` Â§3.1), the explicit retryable time refusal for a stamp younger than 3 s, for a missing, altered, forged, or wrong-destination stamp, and for one older than 30 min, a time value the submitter supplies in place of the stamp never shortening the interval (a request carrying a past timestamp and no stamp is refused), a retry with a freshly issued stamp succeeding once the minimum time has passed, so the refusal is retryable on the same page, and both refusals consuming the account-creation budget (implements FR-029, AC-031, AC-032)
- [X] T074 [P] [US7] Integration test the two-key rate limits in `apps/api/test/integration/auth/rate-limits.spec.ts` â€” each P1 operation its own budget â€” account creation and sign-in â€” the origin key isolated, the number key global, a malformed value carrying only the origin key, and an untrusted peer's `X-Real-IP` ignored in favour of its socket address (`contracts/auth-api.md` Â§2.5), plus the resend bounded neither by the operation budgets nor consuming one â€” three new codes then `OTP_RESEND_LIMIT` (`contracts/auth-api.md` Â§5.4), with the rate-limit and re-request refusals outside the enumeration comparison on the exceptions SC-004 states â€” under the registered exception `EX-011` (implements FR-029, FR-033, FR-034, AC-033, AC-035, AC-036)
- [X] T075 [P] [US7] Integration test the refusal order in `apps/api/test/integration/auth/refusal-order.spec.ts`, stacking two applicable refusals and asserting the earlier one at every step (implements FR-051, AC-055)
- [X] T076 [P] [US7] Integration test request forgery, output encoding, and the security headers in `apps/api/test/integration/http/security.spec.ts` â€” the CSRF token route `GET /api/v1/auth/csrf` issuing the `wafar.csrf` cookie a mutation then presents, including the change-password request and the two sign-out requests `POST /api/v1/auth/sign-out` and `POST /api/v1/auth/sign-out-all` FR-044's 2026-11-03 enumeration reaches, and both code-entry routes, `POST /api/v1/auth/sign-up/verify` and `POST /api/v1/auth/password/forgot/verify`, each of the five refused when its request carries no token, and returning the signed `formStamp` the sign-up route accepts even after the token is rotated â€” the policy's script sources asserted to carry no wildcard, no `'unsafe-inline'`, and no eval-permitting source, and a test that fails when the middleware is removed, under the registered exception `EX-011` (implements FR-044, FR-045, FR-046, FR-029, AC-048, AC-049, AC-050)
- [X] T077 [P] [US7] End-to-end test that no CAPTCHA is ever presented in `apps/web/tests/e2e/no-captcha.spec.ts`, under the registered exception `EX-011` (implements FR-030, AC-034)

### Implementation for User Story 7

- [X] T078 [US7] Implement the two-key fixed-window rate limiter with `Retry-After` in `apps/api/src/modules/auth/service/rate-limit.ts`, keyed by the origin `contracts/auth-api.md` Â§2.5 derives â€” the trusted proxy's `X-Real-IP`, otherwise the peer address (implements FR-033, FR-029, AC-035, AC-033)
- [X] T079 [US7] Implement the form guard â€” the honeypot's silent success and the minimum time-to-submit, fixed at 3 s measured on the server's clock from the signed `formStamp` the render bootstrap issued when the form was served, inside the 30-minute window the same value bounds â€” in `apps/api/src/modules/auth/service/form-guard.ts`: the stamp is verified (signature, destination `sign_up_form`, issuance time) before any value rule runs, a missing, malformed, forged, wrong-destination, too-young, or older-than-30-minutes stamp is `FORM_TOO_FAST` with `formStamp` as its field, and the guard reads no time value the request supplies (implements FR-029, AC-031, AC-032)
- [X] T080 [US7] Implement the fixed refusal order in `apps/api/src/modules/auth/service/refusal-order.ts` and apply it in US1's and US2's `sign-up.ts` and `session.ts` surfaces, under the registered exception `EX-011` (implements FR-051, AC-055)
- [X] T081 [US7] Add the hidden `website` field to `apps/web/app/components/auth/SignUpForm.vue` â€” US1's file, under the registered exception `EX-011` â€” and add the distinct limit and time refusals to the message mapping, and add the fresh bootstrap pair the page takes after a `FORM_TOO_FAST` so the refusal is retryable without a reload (`contracts/ui-contracts.md` Â§3.2), and add AC-031's page-level assertion in `apps/web/tests/e2e/sign-up-abuse.spec.ts`: a submission the platform answers with the silent 202 while the hidden field is filled leaves the page on `form` â€” no rendered message, no code step, and the composable T055 builds (`usePendingRequest`) choosing no step for the 202 and staying on `form` when the resume read answers `OTP_EXPIRED` (`contracts/ui-contracts.md` Â§3.1), while a `FORM_TOO_FAST` leaves every typed value and a second submission after the fresh pair is accepted (implements FR-029, FR-033, AC-031, AC-032, AC-033)

**Checkpoint**: The P1 checkpoint is complete â€” US1, US2, and US7 together.

---

## Phase 6: User Story 3 â€” Recover a forgotten password (Priority: P2)

**Goal**: A merchant who forgot the password requests a reset, receives a code by
SMS, enters it, sets a new password, and every session of the account ends; the
request never reveals whether the number has an account.

**Independent Test**: Request a reset for a registered number, enter the code, set
a new password, and confirm every session ended; repeat for a number with no
account, a blocked account, and an administrator account, and confirm each stated
outcome and the uniform request.

### Tests for User Story 3

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T082 [P] [US3] Integration test the recovery flow in `apps/api/test/integration/auth/recovery.spec.ts` â€” the uniform request, the code step, the new-password step, the `no_account` and `administrator_account` outcomes, the blocked confirmation, and the recovery path's SC-004 comparison: the same status, the same body shape and field set, with SC-004's four masked values â€” `requestId`, `phone`, `codeExpiresAt`, and `expiresAt` â€” each replaced by its fixed placeholder, the same header names (excluding `Date` and `X-Request-Id`), and a duration difference within the plan's enumeration tolerance (median â‰¤ 50 ms, p95 â‰¤ 150 ms) whether or not the number has an account, each response's `phone` asserted separately outside that comparison to equal that case's own submitted number in the canonical form, and the outcome stated after the correct code outside that comparison on the second exception SC-004 states (implements FR-014, FR-015, AC-016, AC-017)
- [X] T083 [P] [US3] Integration test the verified state and the reset's session ending in `apps/api/test/integration/auth/recovery-state.spec.ts` â€” it survives a reload, ends at expiry, ends on replacement, ends when the password changes by another path, the code cannot authorise a second reset, and a successful sign-in alone ends nothing, and the concurrent case in both orders â€” a change and a reset submitted together, so exactly one sets the password, the reset answers `RECOVERY_EXPIRED` having written nothing when the change committed first, and no session that existed at the winning write survives (implements FR-014, FR-034, FR-013, AC-016, AC-036, AC-038, AC-014)
- [X] T084 [P] [US3] End-to-end test the recovery journey in `apps/web/tests/e2e/forgot-password.spec.ts` â€” the cross-links, the code step, the reload onto the new-password step, the in-place confirmation, the terminal outcome message with no retry control, no address, history entry, referrer, or stored value carrying the submitted number, the browser's tie to the pending request being its identifier, and the journey completes within SC-003's three-minute budget, excluding delivery after the channel accepts (implements FR-014, FR-036, FR-037, FR-038, FR-002, AC-016, AC-039, AC-002)

### Implementation for User Story 3

- [X] T085 [US3] Implement `POST /api/v1/auth/password/forgot`, `/forgot/verify`, and `/password/reset` and the service contract T086 fulfils in `apps/api/src/modules/auth/routes/recovery.ts`, emitting the recovery `auth.otp.dispatch_failed` event when the channel refuses or times out (implements FR-014, FR-015, AC-016, AC-017)
- [X] T086 [US3] Implement the verified state and the reset transaction â€” credential rewrite, global revocation, the pending row's deletion, the notice, the lock left untouched, the conditional credential write that re-checks the `verified` row inside the transaction so a change that committed first makes the reset write nothing, the administrator account refused after the code with no credential written, the role ground decided before the status when both apply, and `auth.password.reset` emitted with its `blocked` boolean when the reset completes â€” in `apps/api/src/modules/auth/service/recovery.ts` (implements FR-014, FR-013, FR-009, FR-027, AC-016, AC-038, AC-010, AC-029)
- [X] T087 [US3] Build the recovery form and page in `apps/web/app/components/auth/RecoveryForm.vue` and `apps/web/app/pages/auth/forgot-password.vue` (implements FR-002, FR-014, FR-036, AC-002, AC-016, AC-039)
- [X] T088 [US3] Build the new-password step and the terminal outcome messages in `apps/web/app/components/auth/NewPasswordStep.vue`, with the policy statement and one message per reason â€” shorter than the minimum, longer than the maximum, and common or breached (implements FR-014, FR-035, AC-016, AC-037)
- [X] T089 [US3] Consume the A8 shared code step (T052) in the recovery flow's mode â€” the single read-only field and its `ØªØºÙŠÙŠØ± Ø§Ù„Ø±Ù‚Ù…` control â€” from `apps/web/app/components/auth/RecoveryForm.vue`, passing the displayed-field list, the change-number control, and the resend control as the component's properties, so US3 edits no file A8 owns and `CodeStep.vue` gains no US3 branch (implements FR-038, FR-015, AC-041, AC-017)

**Checkpoint**: User Story 3 is fully functional and testable independently.

---

## Phase 7: User Story 4 â€” Account status and control over sessions (Priority: P2)

**Goal**: The account carries the closed status set; a blocked account keeps its
data â€” the account's rows remain and nothing cascades â€” but is refused at
sign-in with the uniform response and loses the sessions it already held; no
merchant can delete their own account, and an administrator's removal leaves no
session, no pending request, and no credential behind.

**Independent Test**: Seed the account's rows and a live session directly in
the test's own setup â€” no sign-up flow and no US1 task produces the fixture â€”
set the account's status to blocked with a direct update (this slice ships no
act of blocking), and confirm the uniform refusal, the withdrawn session, the
account rows that remain, the absence of any delete path, and the block's
request boundary â€” a request already past the shared entry point when the status
is set is decided on the state it met, while the session's next request is
refused. The sign-in half and the withdrawn-session assertion open US2's
delivered sign-in and session-read surfaces and are the registered exception
`EX-008`; the status read, the retained
data, and the delete-path absence are verified without another story.
The removal's effects are verified the same way: T144 seeds the account's rows,
a live session, and a live pending request for its number, removes them directly
in the order R13's administrator operation must use, and asserts the surviving
store and the shared entry point, so it opens no other story's surface either.

### Tests for User Story 4

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T090 [P] [US4] Integration test the status and its effects in `apps/api/test/integration/users/status.spec.ts` â€” seed the blocked account's rows and a live session directly through `packages/db` in the test's setup (no sign-up or sign-in flow, so no US1 task produces the fixture), then assert the status read is one of two values, a blocked account's sign-in is the uniform refusal doing the same work and taking the same time, the account's rows remain and nothing cascades, a session it already held is refused, and the block's boundary â€” a request already past the shared entry point when the status is set is decided on the state it met and is not interrupted, while the next request bearing its token is refused `ACCOUNT_BLOCKED` and the row is marked `blocked`; the sign-in and session-read halves open US2's delivered surfaces, which the registered exception `EX-008` covers (implements FR-016, FR-017, FR-019, AC-018, AC-019, AC-021)
- [X] T091 [P] [US4] Integration test that no self-deletion path exists in `apps/api/test/integration/users/no-self-deletion.spec.ts` â€” seed the account directly through `packages/db` (no sign-up flow), then assert no route accepts its deletion, no control offers it, and no retention period or trigger is asserted (implements FR-018, AC-020)
- [X] T144 [P] [US4] Integration test the effects of an administrator removal in `apps/api/test/integration/users/removal-effects.spec.ts` â€” seed the account directly through `packages/db` (no sign-up or sign-in flow): its `users` row, its `accounts` credential row with a known password, a live `sessions` row that is neither revoked nor past either clock, and a live `phone_verifications` row for the account's number (`state = 'pending'`) carrying a known code and its `code_hash`, and establish that state first â€” the shared entry point resolves the seeded token to the account, the credential row is present and holds a `$wafar$scrypt$` hash, and the pending row is readable with that code current â€” so the assertions after the removal are not vacuous; then perform the removal the test owns, in the order R13's administrator operation must use and `data-model.md` Â§3 fixes â€” delete the `accounts` row first, because `accounts.user_id` is `ON DELETE RESTRICT` and a `users` delete issued before it is refused, which the test asserts inside a rolled-back transaction so the seeded state survives for the removal it then performs; delete the number's `phone_verifications` row next, because that table carries no foreign key, so no cascade or restriction ends the pending request and the removal path must do it itself; then delete the `users` row, whose `sessions.user_id` key is `ON DELETE CASCADE` â€” and assert that no `sessions` row survives for the account and a request presenting the seeded token through the shared entry point (`apps/api/src/http/context.ts`, T020) resolves as the guest state with no `userId`, so the sessions grant no access; that no `phone_verifications` row survives for the number, so the pending request has ended and the `code_hash` that carried its code is gone and the code can authorise nothing; that no `accounts` row survives for the account, so no stored credential permits a sign-in; and that no `users` row survives for the number, so the personal data the row carried is gone with it; the test performs the removal itself and adds no product delete path, asserts no retention period and no trigger, opens no other story's surface, and leaves the no-self-deletion half T091 verifies unchanged (implements FR-018, AC-020)

### Implementation for User Story 4

- [X] T092 [US4] Add the blocked-status ground to the shared entry point in `apps/api/src/http/context.ts`: when a request presents a live session whose account is blocked, tombstone that session with `revoked_reason = 'blocked'` and answer `401 ACCOUNT_BLOCKED`, before either clock, and answer a tombstone already carrying `blocked` the same way â€” reading the status on every authenticated request so the block is observed at the next request boundary, and leaving a request already past the entry point to the state it met (implements FR-019, FR-017, AC-021, AC-019)
- [X] T093 [US4] Read the account's status, role, and restriction through the shared entry point in `apps/api/src/modules/users/repository/users.ts`, keeping the closed set in the schema's check constraint and defining no transition (implements FR-016, FR-017, AC-018, AC-019)

**Checkpoint**: User Story 4's status rule and its effects are delivered, its
fixtures seeded directly; the blocked-account sign-in and withdrawn-session
halves are verified against US2's paths under `EX-008`, and the removal's
effects are verified by T144, which opens no other story's surface.

---

## Phase 8: User Story 5 â€” Move around the platform inside the shared page frame (Priority: P2)

**Goal**: The frame is built whole â€” the header with the logo/home, notifications,
theme switch, and account control with its three-item menu, keeping all four
controls in one row at 320 CSS px and a guest's three in that row under the same
rule; the sidebar at the inline-start edge with the
nine-item list and the collapse control, narrowing to the icon-only rail the
layer's rail-width token fixes and becoming a drawer whose opener, three
dismissals, and item activation follow FR-022; the bottom bar's five slots with
Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â»'s open state and the bound scroll rule; the footer band with the four
static-page links and its drawer copy; and the ended-session state with its live
announcement and focusable heading â€” and verified structurally, because no page
here renders it (exception `EX-007`).

**Independent Test**: Mount the shell components and assert the composition, the
control presence, the header's 320 CSS px control row for a signed-in merchant
and for a guest, the drawer's opener,
dismissal, and activation bindings, the bar's open state and bound scroll rule,
and each control's accessible name, role, and keyboard reachability, the
ended-session state's live-region markup and focusable heading included; assert
the three bare pages carry no frame and render the same for a guest and a signed-in
person, and that the A8 shared code step shows a supplied value exactly as it was
typed â€” the end-to-end half opens the three bare pages this slice ships (US1,
US2, US3), which the registered exception `EX-009` covers.

### Tests for User Story 5

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T094 [P] [US5] Structural test the sidebar in `packages/ui/tests/shell/sidebar.spec.ts` â€” the nine items in order with their hrefs and Arabic names, each label's whole text carried as the item's accessible name in the full sidebar and in the icon-only rail, the same list for a guest and a signed-in merchant, the collapse control's three names, and the collapsed rail consuming the layer's rail-width token rather than a width of its own â€” SC-005's structural half for the sidebar's composition and its two-width rule (implements FR-039, FR-022, FR-026, AC-042, AC-024)
- [X] T095 [P] [US5] Structural test the header and the account menu in `packages/ui/tests/shell/header.spec.ts` â€” logo/home at inline-start; notifications, theme switch, and account control at inline-end; no page-navigation link and no drawer control; the three menu items with their roles and their link targets â€” `/profile` for Â«Ø­Ø³Ø§Ø¨ÙŠÂ» and `/profile#settings` for Â«Ø¥Ø¹Ø¯Ø§Ø¯Ø§ØªÂ» â€” and the sign-out confirmation; the guest's single sign-in action with the theme switch kept; and at 320 CSS px all four controls in one row, none dropped, folded into an overflow menu, or moved into the account menu, the three inline-end controls icon-only at the 44 px touch floor with their accessible names, the wordmark in its shortened form, and no horizontal page scroll, while a guest's three controls â€” the logo/home control, the theme switch, and the sign-in action â€” remain in that row under the same rule â€” SC-005's structural half for the header's single-row behaviour at 320 CSS px (implements FR-023, FR-047, FR-025, AC-025, AC-051, AC-027)
- [X] T096 [P] [US5] Structural test the bottom bar and the footer band in `packages/ui/tests/shell/bottom-bar.spec.ts` and `packages/ui/tests/shell/footer.spec.ts` â€” the five slots in order, the raised `/parts` action, each slot's accessible name carried whole with the raised action's Â«Ø§Ù„Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ù‚Ø·Ø¹Â» included, the labels kept at 320 CSS px with none dropped, the bar absent from 1024px up, the four footer links and the drawer's copy of them, the band absent below 1024px, and the bar's composition carrying the bound scroll rule (32px down, 16px up or within 56px of the top read as the page's own scroll offset on the page's scrolling element, the 32â€“56px band where the return rule wins so a page scrolling 56px or less never hides the bar, 220ms, `prefers-reduced-motion`, the drawer-scrolling exclusion, the un-reserved height, and the raised action's travel with its removal from the focus order and the accessibility tree while the bar is hidden) exactly as `contracts/ui-contracts.md` Â§8.3 records it, with the scroll behaviour and the labels' one-line cut at the inline-end themselves verified by R2 under `EX-007` â€” SC-005's structural half for the bar's composition and the footer band (implements FR-052, FR-024, FR-026, AC-042, AC-026)
- [X] T097 [P] [US5] Structural test the ended-session state and the guest redirect rule in `packages/ui/tests/shell/ended-session.spec.ts` â€” both variants, the blocked variant withholding the sign-in control, the live region announced ahead of the page's other announcements, the heading made focusable programmatically with both variants landing on it, and a merchant-area item taking a guest to the sign-in page while staying present and enabled â€” SC-005's structural half for the ended-session state and the guest redirect rule (implements FR-049, FR-048, AC-053, AC-052)
- [X] T098 [P] [US5] Structural accessibility test every frame control's accessible name, role, and keyboard reachability in `packages/ui/tests/shell/accessibility.spec.ts` â€” the header's four controls included at 320 CSS px with none dropped or moved into a menu, the guest's three controls under the same rule, the bottom bar's five slots, and the ended-session state's live-region markup and focusable heading in both variants: SC-006's markup-level coverage of the frame, and that no frame component sets a direction or language of its own, inheriting the document's `dir="rtl"` and `lang="ar"` â€” SC-005's structural half for the frame's delivered composition and its control set (implements FR-020, FR-023, FR-049, FR-026, AC-022, AC-025, AC-053, AC-028)
- [X] T099 [P] [US5] End-to-end test the bare pages' frame absence, wordmark, page title, browser title, cross-links, and the document's `dir="rtl"` and `lang="ar"` declaration in `apps/web/tests/e2e/bare-layout.spec.ts`, and that a signed-in person sees the same page as a guest - SC-005's bare-scope half; the pages it opens are the three bare pages this slice ships (US1's, US2's, and US3's), which the registered exception `EX-009` covers (implements FR-021, FR-041, FR-036, FR-026, AC-023, AC-044, AC-039, AC-028)
- [X] T132 [P] [US5] Structural test the drawer's opener, its three dismissals, and its item activation in `packages/ui/tests/shell/drawer.spec.ts` â€” Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â» carries `aria-expanded` and shows its open state while the drawer is open, the bottom bar stays rendered, the collapse control, Escape, and an activation outside each close the drawer and return focus to Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â», and an item is a link that closes the drawer as part of the navigation without asking for a confirmation, with the focus landing on the destination page's heading left to R2 under `EX-007` (implements FR-022, FR-052, AC-024, AC-042)
- [X] T133 [P] [US5] Component test the A8 shared code step's supplied-value rendering â€” the component A8 owns, not a US1 component â€” in `apps/web/tests/unit/supplied-values.spec.ts`: a full name or shop name carrying Arabic-Indic digits or a Latin word renders as it was typed, never transliterated or re-numeralised, in one isolated bidirectional run whose direction comes from the value's own first strong character (FR-045), while the mobile number and the one-time code render in their canonical Latin-numeral form â€” the number in FR-038's display form `+218 91 234 5678` inside one isolated left-to-right run â€” (implements FR-026, FR-001, FR-038, FR-045, AC-028)

### Implementation for User Story 5

- [X] T101 [P] [US5] Build `WfNavList.vue` and `WfShellSidebar.vue` in `packages/ui/app/components/shell/` â€” the nine items, each rendered label on one line and cut at the inline-end where it does not fit, with its whole text as the item's accessible name, the collapse control, the icon-only rail consuming the layer's rail-width token, the drawer's four static-page links, and the drawer's dismissal bindings: the Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â» focus-return target, Escape and the outside activation, and the item activation that closes the drawer as part of the navigation (implements FR-039, FR-022, FR-026, AC-042, AC-024)
- [X] T102 [P] [US5] Build `WfShellHeader.vue`, `WfAccountMenu.vue`, and `WfThemeSwitch.vue` in `packages/ui/app/components/shell/` â€” the two edges, the three menu items with their routes (`/profile` for Â«Ø­Ø³Ø§Ø¨ÙŠÂ» and `/profile#settings` for Â«Ø¥Ø¹Ø¯Ø§Ø¯Ø§ØªÂ») and the sign-out confirmation, the guest variant, the switch's `aria-pressed` and two names, the header's notifications control â€” present in the signed-in merchant's variant at the inline-end edge before the theme switch, a link to the Notifications page at `/notifications` (the route T005's map carries and the sidebar's Â«Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§ØªÂ» item names), drawn with the semantic `WfIcon` key `bell` over the vendored outline cut at 20px and never a raw `i-*` class, carrying the accessible name Â«Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§ØªÂ» and no unread badge in this slice because the count is R9's â€” and the 320 CSS px rule: all four controls in one row, the three inline-end ones icon-only at the touch floor with their accessible names, the wordmark in its shortened form, no horizontal page scroll, and a guest's three controls â€” the logo/home control, the theme switch, and the sign-in action â€” in that row under the same rule; the Profile page's content â€” full name, city, and status at the top, details and password in the settings section â€” is bound by FR-047 for R7 and built by nothing here, and the deferral is Complexity Tracking row 34 (implements FR-023, FR-047, FR-025, FR-024, AC-025, AC-051, AC-027, AC-026)
- [X] T103 [P] [US5] Build `WfShellBottomBar.vue` with the five slots â€” each label kept at 320 CSS px, on one line, and cut at the inline-end where it does not fit, its whole text kept in the markup and each slot's accessible name whole â€” the raised search action, Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â»'s `aria-expanded` open state and the bar's visibility under an open drawer, and the scroll-hide rule (32px down, 16px up or within 56px of the top read as the page's own scroll offset, so a page scrolling 56px or less keeps the bar visible, the raised action leaving with the bar and out of the focus order and the accessibility tree while hidden, 220ms, `prefers-reduced-motion` keeps it visible, scrolling inside the drawer does not count) in `packages/ui/app/components/shell/` (implements FR-052, FR-022, FR-026, AC-042, AC-024)
- [X] T104 [P] [US5] Build `WfShellFooter.vue` in `packages/ui/app/components/shell/` â€” the brand line and the four static-page links (implements FR-024, AC-026)
- [X] T105 [P] [US5] Build `WfEndedSession.vue` in `packages/ui/app/components/shell/` with the two variants, the blocked variant's withheld sign-in control, the live region that announces ahead of the page's other announcements, and the heading made focusable programmatically so both variants land on it (implements FR-049, AC-053)
- [X] T106 [US5] Compose the frame in `apps/web/app/layouts/shell.vue` and implement the guest redirect rule in `packages/ui/app/components/shell/WfNavList.vue` and `WfShellBottomBar.vue`, with no page using the layout â€” SC-005's frame-scope half, in which the nine destinations resolve to the frame and the three bare routes do not (implements FR-020, FR-048, AC-022, AC-052)

**Checkpoint**: User Story 5's composition and every behaviour a mounted component
can exercise â€” the drawer's `aria-expanded` open state, its three dismissals with
the focus return to Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â», the account menu's items and the sign-out
confirmation's markup, and the bar's rendered and visible state under the drawer â€”
are delivered and verified structurally; its page behaviour â€” the set `SC-005`
names â€” stays with R2 (`EX-007`).

---

## Phase 9: User Story 6 â€” The operator creates the administrator account (Priority: P3)

**Goal**: No one becomes an administrator through public sign-up; the operator
provisions the account out of band with an initial password that satisfies the
policy, the first sign-in is accepted and restricted to the password change, and
the change clears the requirement, ends every session, and sends the notice.

**Independent Test**: Provision the administrator through the operator's action
(T111) â€” the action is US6's own, so the fixture waits on no other story â€” run it
twice and confirm two distinct accounts while a run for a number that already has
an account (seeded directly) creates nothing and reports the conflict; sign in
through `signInAdministrator` (T112) and exercise the forced change at the
behaviour level through the A8 service (T135) and US6's administrator branch in
its own file (T113), with the lock state and the live sessions seeded directly;
confirm the merchant sign-in and recovery refuse an administrator account with the
uniform refusal and the role message â€” a crossing the registered exception
`EX-010` covers, while its fixtures cross nothing.

### Tests for User Story 6

> **NOTE: Write these tests FIRST; ensure they FAIL before implementation.**

- [X] T107 [P] [US6] Integration test provisioning in `apps/api/test/integration/auth/provision-administrator.spec.ts` â€” seed the existing account the conflict case meets directly through `packages/db` (no sign-up flow), then assert repeatable, no cap, a conflict reported for an existing number, the field rules refused and reported to the operator, the policy applied to the initial password, the credential accepted only from a hidden prompt or standard input â€” a run given it on argv, in an environment variable, or in a file refuses it and creates no account â€” and never echoed, never present in the success report or any other output, never in a log, an error, or the `auth.administrator.provisioned` record, and never carried by a page, a one-time-code message, or a notice, that a run whose initial credential cannot be written leaves no account row behind and reports the failure to the operator, status active, role administrator, `must_change_password` set, one `auth.administrator.provisioned` record, no audit-log row, and no code and no notice (implements FR-028, FR-035, AC-030)
- [X] T108 [P] [US6] Integration test the administrator's first sign-in and forced change in `apps/api/test/integration/auth/administrator-first-sign-in.spec.ts` â€” provision the administrator through T111 and sign in through `signInAdministrator` (T112), both US6's own, seed the lock state and the live sessions directly through `packages/db`, and run the forced change through the A8 service (T135) with T113's branch; assert accepted, restricted to the change, the change requiring the current password, a repeat of the initial password refused, the lock refusing the check for its full duration, the change clearing the requirement, ending every session, and sending the notice; a restricted administrator signs out and the session ends, and the session timeout and a platform revocation remain available to the restricted account; the lock, revocation, and notice checks run over the behaviour US2 delivers (T064, T065, T070), which the registered exception `EX-010` covers, while no fixture waits on a US1, US2, or US3 task (implements FR-028, FR-013, FR-009, FR-043, AC-030)
- [X] T109 [P] [US6] Integration test that the merchant surface refuses an administrator account in `apps/api/test/integration/auth/administrator-refusal.spec.ts` â€” seed the administrator account through T111 (US6's own), then assert the merchant sign-in's uniform refusal and the recovery's role refusal, with the block never mentioned when both apply; the two surfaces are US2's and US3's, opened under the registered exception `EX-010`, and the administrator fixture waits on no other story (implements FR-027, FR-014, AC-029, AC-016)
- [X] T110 [P] [US6] Structural test that this slice ships no administrator surface and that its header binding is recorded in `packages/ui/tests/shell/no-admin-surface.spec.ts` (implements FR-050, AC-054)

### Implementation for User Story 6

- [X] T111 [US6] Implement the operator's provisioning CLI in `apps/api/src/cli/provision-administrator.ts` â€” a hidden TTY password prompt or `--password-stdin`, never the credential as a value in argv, an environment variable, or a file; the credential is read once, the input is closed, and it is redacted from every output and error, so the success report and every diagnostic name only the account and the outcome; the account field rules and the policy; one transaction; the conflict reported; the `auth.administrator.provisioned` security event carrying no credential material and no audit-log row; exit codes (implements FR-028, FR-035, AC-030)
- [X] T112 [US6] Implement `signInAdministrator` and the computed restricted-session rule in `apps/api/src/modules/auth/service/sign-in-administrator.ts`, refusing every ordinary action with `PASSWORD_CHANGE_REQUIRED` while the change and the session's end stay available (implements FR-028, AC-030)
- [X] T113 [US6] Implement the administrator's password-change branch â€” the `AdministratorPasswordChange` port the A8 service declares â€” in `apps/api/src/modules/auth/service/password-change-administrator.ts`: the branch that applies to a restricted account and the difference rule that refuses a new password repeating the initial one, registered at the composition root as that port; the value rules, the current-password check, the credential rewrite, the global revocation, the pending recovery row's deletion, and the forced-change clearing stay in the A8 service (T135), so the requirement is cleared once and nowhere else, US2's route (T067) delegates to the service, and US6 edits no US2 file (implements FR-028, FR-013, AC-030, AC-014)
- [X] T114 [US6] Record the administrator application's header binding â€” the logo at the inline-start edge and an account control whose menu offers `ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬` only â€” in `packages/ui/app/components/shell/README.md`, delivered by R13 and built by nothing here (implements FR-050, AC-054)

**Checkpoint**: User Story 6 is delivered as behaviour, with no administrator page.

---

## Final Phase: Polish and Cross-Cutting Concerns

- [X] T115 [P] Run the automated accessibility scan over every delivered state at 320 and 1280 CSS px in both appearances â€” the dark set carrying every state the light set carries â€” in `apps/web/tests/a11y/states.spec.ts` â€” SC-006's scan at the 320 CSS px reflow floor and at a wide width (implements FR-040, AC-043)
- [X] T100 [P] Unit scan every user-facing string in `apps/web/tests/unit/user-facing-strings.spec.ts` â€” the three pages' copy, the frame's copy â€” its nine sidebar labels, five bar slots, four footer links, brand line, three account-menu items and confirmation, and both ended-session variants â€” and the four SMS templates â€” for Arabic script, Latin numerals, no diacritics, no Latin letter sequence beyond the token `SMS`, and no emoji, over the strings the platform itself writes and never over a value a person supplies, whose script and digits are its own; SC-008's closed predicate and the supplied values' place in it are T174's â€” a supplied full name or shop name and the city list's recorded names outside the language, numeral, and diacritic limbs and inside the no-emoji limb through the input refusal AC-046 asserts â€” and this scan applies the limbs to the platform's own strings alone; and scan every icon the three pages and the frame components render for its source: a semantic `WfIcon` key resolved from the vendored IconPark outline cut, never a raw `i-*` class, a second icon family, or an emoji glyph; this is AC-028's scan, which reaches the message templates and not the screens alone, and SC-008 measures its result; assert that each rendered string is the text recorded for its state, reason, or cause in `contracts/ui-contracts.md`, with no page composing its own, so AC-028's identity limb is measured beside its form limbs; the direction limb is not this scan's â€” T099 asserts the document's `dir="rtl"` and `lang="ar"` on the three bare pages, and T098 asserts that no frame component sets a direction or language of its own; and scan the copy's template sources â€” the three pages' copy, the message mapping, and the four SMS templates â€” for a numeral typed as text, where the only literal digit sequences a template may carry are `+218` and `91 000 0000`, so every number a rendered string states comes from `packages/shared/src/limits.ts` (implements FR-026, FR-001, AC-028, AC-046)
- [X] T174 Extend SC-008's scan in `apps/web/tests/unit/user-facing-strings.spec.ts` (T100) to its complete subject, verdict, and exceptions, after T026, T052, T054, T098, T099, and T133 â€” scan the static strings (the three pages' copy, the frame's copy, and the four SMS templates) beside the numerals the platform generates at runtime: the one-time code as exactly six Latin digits inside its message body and the mobile number in FR-038's display form `+218 91 234 5678`, each produced through the renderer that produces it (T012's `WfNumeral.vue`, T052's code step, and T026's templates) rather than typed into the test, while R1's notifications control renders no unread badge, so no generated count exists in this slice and the unread count is outside its subject; apply SC-008's closed fail predicate to every scanned string â€” an `Extended_Pictographic` code point, U+FE0F, or U+20E3; an Arabic-Indic digit U+0660â€“U+0669 or U+06F0â€“U+06F9; a combining mark in U+064Bâ€“U+0652 or U+0670; or a Latin letter sequence other than the token `SMS` â€” so one failing string fails the test, the run, and the CI job, and the scan's report is SC-008's evidence at R1's acceptance rather than a warning; the only exceptions are the two SC-008 states â€” a supplied full name or shop name and the fixed city list's recorded names, each excluded from the language, numeral, and diacritic limbs and inside the no-emoji limb, the supplied value through the input refusal AC-046 asserts and the city list's recorded form FR-005 keeps â€” and no third exception is added (implements FR-026, FR-038, AC-028)
- [X] T175 [P] Bind the message table to the closed error-code union in `apps/web/tests/unit/message-codes.spec.ts` â€” read the **26** codes of `contracts/auth-api.md` Â§3.1 from `packages/shared/src/contracts/auth.ts` (T008), the message table of `contracts/ui-contracts.md` Â§6, the ended-session rows of Â§8.4, and Â§6's completeness paragraph, and assert every code has exactly one placement: a Â§6 row per `(code, reason)` pair, a Â§8.4 row for `SESSION_ENDED` and `ACCOUNT_BLOCKED`, the declared R13 surface of `PASSWORD_CHANGE_REQUIRED`, or the declared `none` placement of `CSRF_FAILED`, `PAYLOAD_TOO_LARGE`, `METHOD_NOT_ALLOWED`, and `NOT_FOUND` â€” `PASSWORD_UNCHANGED`'s Â§6 row stands with its `Where` cell stating that no R1 page renders it; fail when a code has no placement, a code-bearing row names a code outside the union (the `INTERNAL_ERROR / transport failure` row's label follows its code), a code carrying several texts lacks or duplicates a `reason` variant (`INVALID_FULL_NAME`'s `empty`, `too_long`, and `emoji`, and `INVALID_SHOP_NAME`'s `too_long` and `emoji`), a `Where` cell is empty, or a row's `Where` names no page, no state, and no declared absence; the table's two declared non-code rows â€” `Resend accepted (202)` and `Signed-in after verification` â€” are the only rows that name no code, so a third fails the test and every code a page can render has one recorded text, while T100 keeps the rendered-string identity and the no-composed-sentence limb (implements FR-026, AC-028)
- [X] T116 [P] Generate the visual baseline set under `apps/web/tests/e2e/__screenshots__/` for every state of `contracts/ui-contracts.md` Â§10 at 1280 and 375 in both appearances, plus the 320 light reflow capture (implements FR-021, AC-023)
- [X] T117 [P] Write the load script and the deterministic seeder in `scripts/load/auth-smoke.mjs` and `scripts/fixtures/seed.mjs` â€” the SC-009 profile of `plan.md` â†’ The SC-009 load profile: 600 requests over 60 s at 10 per second (200 per operation) from 20 virtual users bound to `127.0.0.2` â€¦ `127.0.0.21`, each issuing one request every 2 s staggered 100 ms apart, with one distinct number key per request in three disjoint blocks â€” 200 numbers outside the seed for account creation, 200 seeded accounts for sign-in, and 200 other seeded accounts for recovery â€” so each origin spends 10 per operation (11 with the warm-up, below 60% of every budget) and each number spends 1 of 3, 1 of 20, and 1 of 3; each sign-up sends `website: ""` and the `formStamp` the warm-up's render-bootstrap read returned, and the script waits 3 s after that read before its first sign-up so the stamp is old enough and, at 30 min, never too old, each sign-in presents a seeded account and the load-only credential, and each request carries the warm-up's CSRF token and the allowlisted web `Origin`; seed 10,000 accounts and 300 live sessions that the 200 sign-ins raise to the 500-session ceiling, asserted from `sessions` before and after; report attempted, accepted, and refused counts with refusal codes per operation and in total, p50 and p95 per operation and in aggregate over accepted requests, the slowest statement, and the rate-limit rows the run created; fail the run on any refusal, on an accepted count other than 200 for an operation, or when p50 exceeds 150 ms or p95 exceeds 1,000 ms; and run the post-run limiter probe â€” read back the `rate_limit_counters` rows the run created and require a fresh origin's (`127.0.0.22`) 21st account-creation submission to be refused `RATE_LIMITED` with `Retry-After` â€” recording the verdict as SC-009's measurement and R1's baseline for later slices (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T118 [P] Integration test the merchant scope in `apps/api/test/integration/http/isolation.spec.ts` â€” a session lookup carries the account's scope, an account identifier in the request is ignored, a reference that belongs to another account receives the same `404 NOT_FOUND` status, body, and headers a reference that matches no row receives, and the test fails when the scope is removed (implements FR-053, AC-056)
- [X] T119 [P] Amend `docs/domain-model.md` with the transient-store note and the library-placeholder note the plan records, adding no entity â€” the transient store is the pending request FR-004 bounds and the library's placeholder stays asserted empty â€” and record the phone-only account's reserved `email` sentinel as the third note: Complexity Tracking row 15, a domain-model note and not a product field (implements FR-004, AC-004)
- [X] T120 Append the eight remaining decision records of `plan.md` â†’ Decision records â€” items 1, 2, 3, 5, 6, 7, 12, and 14, including the provisioning boundary and the audit log and the SC-009 load profile and its verdict; items 4 and 8â€“11 are already recorded as ADR-141 to ADR-145, item 13 is appended by T136, item 15 by T142, and item 16 by T143 â€” to `docs/DECISIONS.md` and `docs/decisions/volume-09.md` (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T136 Append the plan's record 13 â€” public API versioning and the deprecation rule: the `/api/v1` path segment every public route carries, the unversioned `/health` operational probe outside the versioned surface, the notice of at least one release a removal requires, and the ADR that records each deprecation, with R1 shipping version 1 and no deprecated route so the record fixes the rule later slices follow and announces no removal â€” to `docs/DECISIONS.md` and `docs/decisions/volume-09.md`, beside T120 and after it (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T142 Append the plan's record 15 â€” the silent hidden-field refusal's mechanism: the 202 a filled hidden field receives is the same response a successful submission receives, carrying a generated but unstored `requestId` and resume token, while the page's next step is decided by the resume read (`GET /api/v1/auth/verifications/{requestId}`) rather than by the 202, so a live row reaches `code` and the unstored id answers `OTP_EXPIRED` and leaves the page on `form` with no message, and the refusal's duration bound: the same pre-dispatch work on a discarded copy and a wait that tracks the channel's current acceptance duration, measured one-sided at median â‰¤ 50 ms and p95 â‰¤ 150 ms â€” to `docs/DECISIONS.md` and `docs/decisions/volume-09.md`, beside T120 and T136 (implements FR-029, AC-031)
- [X] T143 Append the plan's record 16 â€” the copy's authority and measurable bindings: the contract as the single record, with the capture set as evidence of composition and appearance only, and the inventory stated once there; the SMS segment bound (UCS-2, 70 code units for a one-time-code body and 134 for a notice, counted in UTF-16 code units after the code is substituted, a build failure and never a truncation or a split), the emoji predicate's Unicode data pin (18.0.0, the vendored `emoji-data.txt` and its SHA-256, the generated range table, the runtime-independence rule, and the upgrade rule that a verdict change is the specification's amendment), and the numerals' single source (`packages/shared/src/limits.ts`, the copy's slots, the agreement classes, and the two checks) â€” to `docs/DECISIONS.md` and `docs/decisions/volume-09.md`, beside T142 (implements FR-026, FR-035, FR-043, AC-046, AC-028, AC-047)
- [X] T131 Verify the Technology Standards Approved register amendment recorded as ADR-146 â€” the five rows (Twilio Programmable Messaging, GitHub Actions, `@cyclonedx/cyclonedx-npm`, `pg_basebackup` + WAL archiving, and `@axe-core/playwright`), the closure of the IconPark and IBM Plex gap rows against ADR-098, the constitution version, `.specify/memory/version.json`, the ADR index's constitution-version column, the live ADR range strings, and `Project-Technologies.txt` â€” by running `governance-drift-check.mjs` until clean, appending nothing if the amendment is recorded â€” repository owner, before R1's acceptance (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T121 Update `README.md` with setup, development, testing, deployment, the dependency budget, and the frame's structural suite; the four README writers run in order â€” T121, then T122, then T123, then T155 â€” and the file is never written in parallel (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T122 Run the committed `governance-drift-check.mjs` and resolve every drift it reports, recording the result in `README.md` (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T123 Run every scenario `quickstart.md` Â§3 lists, closed by `quickstart.md` Â§7 at Scenarios 1â€“15, and the SQL checks of Scenario 1 against a freshly migrated database and record the outcome in `README.md` (implements FR-004, AC-004)
- [X] T124 Record the manual keyboard-only pass at 320 and 1280 CSS px in `apps/web/tests/a11y/keyboard-pass.md` â€” SC-006's manual pass â€” covering the three bare pages' step changes and the frame's structural suite, and confirm the frame's structural suite passes with no page rendering the frame (implements FR-040, AC-043)
- [X] T134 Record the 2026-10-31 structural and accessibility conformance and the 2026-11-01 guest clause in `apps/web/tests/a11y/keyboard-pass.md` as one gate - the drawer's opener, its three dismissals, and its item activation (T132), the header's four controls at 320 CSS px with none dropped and a guest's three under the same rule (T095, T098), the bottom bar's composition and bound scroll rule (T096, T103), the ended-session state's live region and focusable heading in both variants (T097, T105), the supplied values' rendering in the A8 component (T133), and the emoji refusal (T034, T037) - and confirm SC-006's markup half passes with no page rendering the frame (implements FR-001, FR-022, FR-023, FR-026, FR-049, FR-052, AC-024, AC-025, AC-028, AC-042, AC-053)
- [X] T128 Verify the generated public-interface document at `apps/api/openapi.json` â€” regenerate it from the final route set through T125's generator and confirm the committed file matches â€” as R1's documentation gate (ADR-002), and record that the first standalone documentation-drift test (the generated document, the registered routes, and the contract prose compared as three records) is R2's, per ADR-031 item 4 and `ROADMAP.md` line 140, so R1 adds no such test (implements Complexity Tracking: The public-interface documentation gate â€” the OpenAPI 3.1 generator (T125) and the verification of the committed document (T128) â€” serves Gate 2 â†’ Documentation and carries no FR-###/AC-### pair)
- [X] T129 Run the encrypted-backup restore drill â€” restore `scripts/backup/seal.mjs`'s ciphertext into a clean container, prove the ciphertext decrypts (the archive encryption T028 builds: AES-256-GCM under a key-encryption key injected from the environment, Complexity Tracking row 17), start the API against the restored data, assert `/health` answers 200 inside the four-hour RTO and the restored state is FR-055's at the recovery point (the session, lock, pending request, and rate-limit window read as at that moment, and the SMS port's rolling acceptance estimate empty again), measure the restore against RTO 4 h / RPO 15 min, and record the drill in `docs/runbooks/backup-restore.md`; this host has no Docker and no Linux cluster, so the delivered drill is the host-adapted logical restore that `reports/t129-restore-drill.json` records, and the departure is Complexity Tracking row 38 with its owner and review date (implements FR-055, AC-061)
- [X] T137 [P] Apply US7's refusal order in `apps/api/src/modules/auth/routes/recovery.ts` after T085, and test the recovery steps' rate-limit exemption in `apps/api/test/integration/auth/recovery-rate-limit.spec.ts` â€” the recovery request consumes the recovery budget, while the code entry and new-password step neither consume it nor are refused by it when it is spent â€” and assert the aggregate ceiling the two number keys produce: three account-creation and three recovery requests for one number each allow five wrong entries, and the fourth request on either key is refused, so the two paths together cannot exceed the ceiling in one window and no separate code-entry budget exists â€” and assert the aggregate message ceiling the same keys produce in `apps/api/test/integration/auth/code-dispatch-ceiling.spec.ts`: the six fresh requests for one number allow four accepted dispatches each (the first and three re-requests), so the fake transport counts at most 24 one-time-code messages for that number in the window, the twenty-fifth cannot arise because the seventh fresh request and the fifth dispatch are refused, a dispatch the channel refuses at acceptance adds none, and no separate message budget or counter exists (implements FR-051, FR-033, FR-034, AC-055, AC-035, AC-036)

### Availability, atomicity, and repeated requests (B8)

- [X] T146 [P] Integration test the three indivisible writes in `apps/api/test/integration/auth/atomic-writes.spec.ts` â€” inject a failure after each part with the test-only fault port `apps/api/test/support/fault.ts`, which fails one collaborator call inside the real unit of work and then lets the transaction roll back, and assert: at code verification a failure after the credential insert leaves no `users`, `accounts`, or `sessions` row and keeps the correct code usable; at the account's change, the reset, and the administrator's forced change a failure after the credential write leaves the previous password and every session exactly as they were, and no session survives on a superseded password; at an accepted dispatch a failure while installing the replacement leaves the previous code valid, the request unchanged, and the re-request allowance unspent; and the response each time is the inline, explicit, retryable failure FR-040 defines, with the test failing when the transaction boundary or the conditional write is removed (implements FR-004, FR-013, FR-014, FR-028, FR-034, FR-040, AC-004, AC-014, AC-016, AC-036, AC-043)
- [X] T147 [P] Integration test the repeated requests whose first response was lost in `apps/api/test/integration/auth/repeated-requests.spec.ts` â€” for each path, lose the first response and repeat the same submission: a sign-up or recovery submission the page is still tied to, while its pending request is live, re-renders the code step, dispatches no second code, keeps the code already sent valid, and spends no part of the re-request limit, while a submission made after the page returns to its first step is a fresh request that replaces the pending request on FR-034's terms; a code entry whose first attempt reached its outcome re-renders that outcome â€” the confirmation or the terminal message â€” creates no second account or session, and does not consume the code again; a new-password submission whose first attempt set the password re-renders the confirmation, sets no password again, ends no session again, and sends no second notice; and a repeat of the account's own change or of the sign-out of every device is refused as an ended session, writes nothing, revokes nothing, and sends no second notice â€” each repeat producing no second account, session, dispatch, password write, revocation, or notice (implements FR-011, FR-013, FR-031, FR-034, FR-040, FR-043, AC-006, AC-014, AC-036, AC-043, AC-047)
- [X] T148 [P] Integration test the service's and the store's unavailability in `apps/api/test/integration/http/degradation.spec.ts` â€” with PostgreSQL stopped, `GET /health` answers 503 `{"status":"degraded","database":"error"}`, every authentication request answers with the platform's ordinary failure envelope rather than a second "service unavailable" state, and the response the three forms' page renders is the inline, explicit, retryable failure FR-040 defines, with no navigation and no wait, while the database's return restores `200 {"status":"ok","database":"ok"}` and the same request succeeds; with the messaging channel refusing at acceptance and then timing out at 750 ms, `/health` stays 200 because the provider is an outbound channel and not a readiness dependency, a sign-up or recovery dispatch receives `OTP_SEND_FAILED` with no pending row written and no code, sign-in, sign-out, the session's ends, the password change and reset, the forced first change, and provisioning continue, and each failed dispatch emits its `auth.otp.dispatch_failed` record with its `kind` (implements FR-040, FR-043, AC-043, AC-047)
- [X] T149 [P] Integration test the restart's invariance in `apps/api/test/integration/auth/restart-state.spec.ts` â€” start the API against its database, establish a live session with both clocks running, an account's count of consecutive failed password verifications and its lock, a live pending request with its code, its verified state and its remaining re-request allowance, and a rate-limit window whose budget is spent, then stop and start the process and assert the session still grants access and keeps both clocks, the count and the lock are as they were and the lock lifts only at its own expiry, the pending request still verifies the code it held and keeps its remaining allowance, and the window still refuses on the budget it spent, with no session ended, no lock lifted or applied, no pending request replaced, no code invalidated, and no window reset; a request in flight when the process stopped receives no answer, and its repeat once the service serves again reaches FR-040's repeated-request outcome with no second account, session, dispatch, write, revocation, or notice (implements FR-054, FR-009, FR-032, FR-033, FR-034, FR-040, AC-059)

### Operational state, records, and rows (B8)

- [X] T150 [P] Integration test the release boundary and the migration's neutrality in `apps/api/test/integration/db/migration-release.spec.ts` â€” against a scratch database, assert the boot guard refuses to open the listener while the applied version differs from the embedded expected version and opens at the expected version, so no request is served against data of another version; seed a live session with both clocks, a lock and its count, a pending request with its code and allowance, and a spent window, apply a test-only additive migration that stands in for a later release's step, and assert every one of them is as it was â€” no session ended, no lock lifted or applied, no pending request ended, and no window reset; and scan `packages/db/migrations/0001_identity_foundation.sql` to assert it carries no `INSERT`, `UPDATE`, or `DELETE` against the four state tables (implements FR-054, AC-060)
- [X] T151 [P] Integration test the first migration's rollback in `apps/api/test/integration/db/migration-rollback.spec.ts` â€” apply `packages/db/migrations/0001_identity_foundation.sql` to a scratch database, seed the representative row set â€” an account with its credential and a session, a lock and its count, a pending request, a rate-limit counter, and the empty `verifications` placeholder â€” apply `packages/db/migrations/0001_identity_foundation.down.sql`, and assert the six tables are gone and the applied count in `drizzle.__drizzle_migrations` is zero; re-apply the up and assert the pair is the exact inverse, and that the seeded state written under the version being rolled back is gone with it â€” the session ends and its holder signs in again, the lock and its count are gone, the pending request ends, and the window is unspent â€” while the boot guard refuses to serve across the down state (implements FR-055, AC-062)
- [X] T152 [P] Integration test the restore point's state in `apps/api/test/integration/db/restore-state.spec.ts` â€” create a database at a restore point T with a live session, a lock and its count, a live pending request with its code, a spent rate-limit window, and a registered account; dump it with the PostgreSQL client, then after T create a session, apply a lock, start and replace a pending request, spend a window, remove an account's rows in `data-model.md` Â§3's order, and block another account; restore the dump into a clean database, point the API at it, and assert the state reads as at T rather than reconciled â€” the session live at T still grants access and the one created after it ends, the lock and count are as they were at T so the one applied after is gone and the one lifted after is in force again, the pending request is as it was at T so the one started after is gone and its code is refused under FR-034 while the one replaced or ended after is live again with the code it then held, the window spent after T is unspent, the removed `User` row is registered again and its data reads again until the removal is repeated, the block applied after T is undone until an administrator re-applies it, and the SMS port's rolling acceptance estimate is empty again (implements FR-055, FR-017, FR-018, AC-061)
- [X] T153 [P] Integration test the operational rows' hourly bound in `apps/api/test/integration/db/operational-sweep.spec.ts` â€” insert one row past and one inside each bound (a session revoked or expired 24 hours ago and one revoked or expired 24 hours minus 1 ms ago, a pending request whose `request_expires_at` has passed and one that has not, a rate-limit counter one hour past its window and one inside it), run the sweep T032 adds, and assert exactly the past-bound rows are gone and the inside rows remain; run it a second time and assert it deletes nothing; hold the advisory lock from a second connection and assert a concurrent run skips without deleting or losing a row; assert no `users` or `accounts` row is deleted, so the sweep is an operational bound and not an account-retention policy, and that the statements read `sessions_revoked_at_idx`, `sessions_expires_at_idx`, `phone_verifications_request_expires_at_idx`, and `rate_limit_counters_expires_at_idx` (implements FR-018, AC-020)
- [X] T154 [P] Integration test the provisioning action's failed record in `apps/api/test/integration/auth/provision-administrator-emit-failure.spec.ts` â€” replace the structured stream with one that throws on the `auth.administrator.provisioned` emit, run T111's CLI through its hidden prompt or `--password-stdin`, and assert the run reports a failure naming the account identifier and stating that the account exists and its record did not reach the stream, exits non-zero, writes one `error` line to stderr, and retries nothing, queues nothing, and sends nothing to a second sink, while the account row that exists is the one the report names and no credential is echoed (implements FR-028, FR-037, AC-030, AC-040)
- [X] T155 Enforce the coverage gate's blocking moment and evidence in `.github/workflows/ci.yml` and `README.md`, after T024 and T121â€“T123 â€” fail the change when fewer than 80% of the measurable changed production lines are covered (the added lines with an lcov `DA` record), measured against the revision the feature branch was created from, with files that carry no coverage record listed as excluded and generated code, migrations, and snapshots excluded and the frame's page-level runtime excluded only by `EX-007`; attach the report to the pull request and keep the acceptance run's copy in the `r1-acceptance` release, naming the diff baseline, the physical and measurable changed-line counts, the covered count, the percentage, the unmeasured-line counts, and every excluded path with its reason and exception row; and record in `README.md` that R1's acceptance MUST NOT be recorded while the gate fails, so the threshold has an enforcement moment and an artifact rather than only a measurement (implements Complexity Tracking: The coverage gate â€” Vitest with the V8 provider, the unit/integration project split, and the â‰¥ 80% measurable changed-line threshold (T022) â€” serves Gate 1 â†’ III and carries no FR-###/AC-### pair)

### Verification and refusal closure (B8)

The tests `plan.md` â†’ *The verification contract* fixes and no earlier task
carries: the deterministic races (CHK025), the four clocks on both sides of every
bound (CHK026), the channel's failure matrix (CHK027), the invariants' failing
cases (CHK030), the test classes' environments (CHK031), the enumeration's
reproducibility (CHK032), the cross-cutting criteria AC-056â€“AC-058, and the
refusals no criterion reaches. T156â€“T163 close the verification checklist's
CHK025â€“CHK027 and CHK030â€“CHK032, with CHK028 and CHK029 closing on the tasks the
trace maps to them; T164â€“T166 carry AC-056â€“AC-058, and T167â€“T173 close the
refusals checklist's CHK021â€“CHK029.

- [X] T156 [P] Build the deterministic concurrency harness in `apps/api/test/support/barrier.ts` â€” a test-only decorator over the `UnitOfWork` port with `holdAt('beforeCommit')` and `release()`, so a request can be held after its pre-write read and before its commit; no production seam is added and no `setTimeout`, `Promise.race`, or scheduling luck decides an order, and the harness runs a race's three interleavings once each â€” A commits first, B commits first, both at the barrier â€” so `plan.md` â†’ *Concurrency: how "together" is produced* is executable (implements FR-031, AC-006)
- [X] T157 Extend the two sign-up races in `apps/api/test/integration/auth/sign-up-concurrency.spec.ts` (T038) to all three interleavings each with T156's harness â€” two sign-ups for one number and two entries of the same correct code â€” and assert one account and one session for the two sign-ups; one account, one session, and no live pending request for the two code entries; and that the losing sign-up receives the same 202 any submission receives, its resume read stating the winning row's own status and role â€” `existing_account`, `blocked_account`, or `administrator_account` â€” while both rows, no row, a partial row, and two sessions each fail the run (implements FR-006, FR-031, AC-006)
- [X] T158 Extend the change-and-reset race in `apps/api/test/integration/auth/recovery-state.spec.ts` (T083) to all three interleavings with T156's harness â€” the account's own change and the recovery reset submitted together â€” and assert exactly one password write, no session that existed at the winning write surviving it, and the loser's specified outcome: `RECOVERY_EXPIRED` for the reset when the change committed first, or the ended session for the change when the reset committed first, with the conditional write rather than the pre-read carrying the authority (implements FR-013, FR-014, AC-014, AC-016)
- [X] T159 [P] Integration test the four clocks on both sides of every bound in `apps/api/test/integration/auth/clock-bounds.spec.ts` â€” one injected clock, the process time set to the same instant so the library's expiry read agrees, and `advance(ms)` moving it with no test sleeping â€” asserting each field at bound âˆ’ 1 ms and at the bound: `users.locked_until` (refused while it holds, allowed as it lifts), `phone_verifications.code_expires_at` (accepted before, `OTP_EXPIRED` at), `phone_verifications.request_expires_at` (live before, ended at with the expiry notice), `sessions.last_activity_at` (live at 30 minutes âˆ’ 1 ms, ended at 30 minutes), and `sessions.expires_at` (live at 12 hours âˆ’ 1 ms, ended at 12 hours); each persisted effect read back with the advanced instant passed as the bound, and a build that reads a bound it does not enforce failing the bound âˆ’ 1 ms case (implements FR-009, FR-032, FR-034, AC-010, AC-015, AC-036)
- [X] T160 [P] Integration test the messaging channel's failure matrix in `apps/api/test/integration/auth/sms-failure-matrix.spec.ts` â€” all eight cells of `plan.md` â†’ *The messaging channel's failure matrix*: the refusal at acceptance and the 750 ms timeout at both placements (a fresh sign-up verification, a fresh recovery request, a sign-up re-request, and a recovery re-request); the fake produces the kind and the adapter's 750 ms timer is advanced on the fake clock rather than waited on; each cell asserts `OTP_SEND_FAILED` on the step that asked, no pending row and no code at a fresh request with the operation's budget spent and the re-request allowance untouched, the previous row, code, and both expiries unchanged at a re-request with no allowance spent, no second dispatch and no queued retry, and the `auth.otp.dispatch_failed` record with its `kind` (`sign_up` or `recovery`) (implements FR-034, FR-037, FR-043, AC-036, AC-040, AC-047)
- [X] T161 [P] Integration test the negative and temporal invariants' failing cases in `apps/api/test/integration/auth/invariant-mutations.spec.ts` â€” apply each mutation in a rolled-back transaction and assert the corresponding passing assertion now fails: a supplied `email` field on sign-up is refused or ignored and stores no address, a seeded real email-shaped value fails the scan, and an email-shaped sign-in identifier receives the format refusal; a partial `users` row seeded after the form, after an incorrect code, and after the pending request's lifetime is found by the same detector that counted zero; a `users` row without its session at the correct-code point is caught by the same detector; and advancing one millisecond past each of T159's bounds flips the verdict, so a build that reads a bound it does not enforce fails; the seeded state is established before each mutation so a failed mutation is never mistaken for the invariant's result (implements FR-001, FR-004, FR-007, FR-009, FR-031, FR-032, FR-034, AC-004, AC-006, AC-010, AC-015, AC-036, AC-057)
- [X] T162 [P] Assert each test class's pinned environment in `scripts/check/test-environments.mjs` and add it to the lint script in the root `package.json` â€” `TZ=UTC` in every project config; the unit roots `packages/shared/src/**/__tests__/**`, `apps/api/src/**/__tests__/**`, and `apps/web/tests/unit`; the layer root `packages/ui/tests`; the integration root `apps/api/test` with `SMS_TRANSPORT=fake` and `SMS_FAKE_ACCEPT_MS` defaulting to `0`; `@network` skipped unless `NETWORK_TESTS=1` and time-bounded at 120 s, with `pnpm install --frozen-lockfile` the only networked step; one database per integration run with files serialized; `fileParallelism: false` for the three enumeration suites and coverage off for them; and one process for the governance check â€” failing the build when a project's config departs from its class (implements Complexity Tracking: The continuous-integration pipeline â€” `lighthouserc.json` and `.github/workflows/ci.yml` (T024) â€” serves Gate 2 â†’ Performance Budgets and Verification, Dependency Governance, Documentation, and Module Discipline and Development Workflow, and carries no FR-###/AC-### pair)
- [X] T163 [P] Build the committed enumeration fixture and its reproducibility configuration â€” `apps/api/test/support/enumeration-fixture.ts` creating one active merchant per case, one locked account, one blocked account, and one administrator with fixed numbers, a fixed city, and the load-only credential, the no-account case using a number outside the seed, created once in the three suites' `beforeAll` and read by all three (T037, T058, T082), and `apps/api/test/integration/auth/vitest.enumeration.config.ts` setting `fileParallelism: false`, coverage off, and the serial order â€” and wire the single re-run on the same runner class and build into the enumeration job in `.github/workflows/ci.yml`, keeping both reports and treating a second failure as a failure; no value is generated per run (implements Complexity Tracking: The continuous-integration pipeline â€” `lighthouserc.json` and `.github/workflows/ci.yml` (T024) â€” serves Gate 2 â†’ Performance Budgets and Verification, Dependency Governance, Documentation, and Module Discipline and Development Workflow, and carries no FR-###/AC-### pair)
- [X] T164 Complete AC-056's measurement point in `apps/api/test/integration/http/isolation.spec.ts` (T118) â€” the scoped session lookup over the shared entry point for the session read US2 serves, the supplied account identifier ignored, and the pair of not-found answers compared as one: another account's row and a row that matches no row answering the same `404 NOT_FOUND` status, body, and header set (excluding `Date` and `X-Request-Id`), with the scope-removal mutation applied in a rolled-back transaction so the test fails when the scope is removed rather than passing on a fixture alone (implements FR-053, AC-056)
- [X] T165 Extend the account-creation, sign-in, and provisioning integration tests with the no-email case in `apps/api/test/integration/auth/sign-up.spec.ts`, `apps/api/test/integration/auth/sign-in.spec.ts`, and `apps/api/test/integration/auth/provision-administrator.spec.ts` (T037, T058, T107) â€” every account created through public sign-up and through the operator's provisioning stores only the reserved placeholder `218â€¦@phone.invalid` derived from its normalized number, which no person supplies, which is never displayed, which is never a sign-in input, and which can receive no mail; no form collects an address â€” the three pages' field lists and the contract schemas in `packages/shared/src/contracts/**` carry no `email` input â€” no response or notice shows one, and no path identifies, recovers, or sends anything to one; a supplied `email` field is refused or ignored and stores no address, a seeded real address fails the scan, and an email-shaped sign-in identifier receives the format refusal (implements FR-001, FR-007, FR-014, AC-057)
- [X] T166 Extend the session-endings integration test with the no-cap case in `apps/api/test/integration/auth/sessions.spec.ts` (T059) â€” seed three live sessions for one account, sign in, and assert all four grant access; end one by sign-out and another by a platform revocation and assert only those end while the rest stay live; sign in twice more and assert each sign-in adds a live session and ends none, so no cap refuses or replaces a session; and apply the mutation that revokes on sign-in in a rolled-back transaction, asserting it leaves one session and fails the assertion, with the three seeded first so the count is not vacuous (implements FR-007, FR-010, FR-011, FR-012, FR-032, AC-058)
- [X] T167 [P] Integration test the forgery, transport, and scope refusals in `apps/api/test/integration/http/transport-refusals.spec.ts` â€” `CSRF_FAILED` (403) for a missing token, a wrong token, and an unlisted `Origin` on each of AC-048's ten state-changing requests â€” the ten POST routes of `contracts/auth-api.md` Â§5.2â€“Â§5.11, both code-entry routes included, each refused before any service code and outside SC-004's comparison, with one test that removes the middleware and one that removes only the token comparison so either removal fails the run; `PAYLOAD_TOO_LARGE` (413) at the 16 KB bound's two sides, 16,384 bytes accepted and 16,385 refused; `METHOD_NOT_ALLOWED` (405) for a method a registered route does not serve; and `NOT_FOUND` (404) for a merchant-scoped row outside the caller's scope, identical in status, body, and header set to a row that does not exist, on the registered exception `EX-011` where the request opens US1's or US2's surface; the two transport codes carry no `FR-###` because `contracts/auth-api.md` Â§3.1 marks them transport's own answers, while the forgery and not-found answers assert FR-044 and FR-053 (implements FR-044, FR-053, AC-048, AC-056)
- [X] T168 Integration test the refusal catalogue's conformance in `apps/api/test/integration/http/refusal-catalogue.spec.ts` â€” a table-driven walk of the contract's closed error-code union (Â§3.1) and the refusal catalogue's rows: every code is produced by at least one named test (the table maps each code to the suite that produces it and fails when a code has no producer or a suite names a code the union lacks), and it maps each code either to the acceptance criterion that asserts it or to the declaration that the transport's own answers stand outside the criteria with their reason; each row's `retryable` flag, `field`, `reason`, and `retryAfterSeconds` match the contract; every refusal whose text is a fixed design value renders one text, asserted as identity between the two cases that share it â€” the locked, blocked, wrong-password, and unknown-number sign-in transcript sharing `AUTH_INVALID_CREDENTIALS`, and the expired, superseded, and unknown-request code cases sharing `OTP_EXPIRED` â€” and each retryable refusal carries its retry affordance while a non-retryable one carries none; `CSRF_FAILED`, `PAYLOAD_TOO_LARGE`, `METHOD_NOT_ALLOWED`, and the scope's `NOT_FOUND` are listed with their producing test T167, so no catalogued response is left unasserted (implements FR-008, FR-009, FR-034, FR-040, FR-044, FR-053, AC-009, AC-010, AC-036, AC-043, AC-048, AC-056)
- [X] T169 Extend the refusal-order test in `apps/api/test/integration/auth/refusal-order.spec.ts` (T075) â€” a table-driven case for each step of FR-051's five-step order, asserting the earlier refusal and that the later check never runs (the operation's limit over the hidden field, the hidden field over the minimum time, the minimum time over the value rules, the value rules over the account-existence comparison); the same-step pair where several value rules fail together, each carrying its own `code` and `reason` and no account-existence comparison running until every value rule passes; and that a submission refused at a step is never replaced by a later refusal, and that a request which both fails the transport check â€” a missing or wrong token, an unlisted `Origin`, a body past the 16 KB bound, or a method a registered route does not serve â€” and stands over its operation's budget is decided by the transport check first, never by FR-051 step (1), so the transport's `CSRF_FAILED`, `PAYLOAD_TOO_LARGE`, or `METHOD_NOT_ALLOWED` answer stands and `RATE_LIMITED` never replaces it, asserted with T167's cases, each transport refusal paired with a spent budget, on the registered exception `EX-011` (implements FR-051, FR-029, FR-033, FR-042, FR-044, AC-055, AC-048)
- [X] T170 Integration test a refusal and a success racing on the same step in `apps/api/test/integration/auth/refusal-race.spec.ts` â€” with T156's barrier, submit together (a) a sign-up a value rule will refuse and one that will succeed for the same number, and (b) the fifth incorrect code entry and the correct entry for one request; assert the admissible outcome set: in (a) at most one account and one session, the refused attempt writing nothing and the successful attempt's outcome reaching the resume read, and in (b) either the correct entry wins and creates the account with the request ended, or the fifth wrong entry wins and the correct entry is refused as an ended request â€” never two accounts, two sessions, a partial row, or a live request left behind; and that a refusal arriving after a success is decided on the state the success left, while a success arriving after a refusal is decided on the state the refusal left, so no refusal is applied to a successful state (implements FR-031, FR-034, FR-040, AC-006, AC-036, AC-043)
- [X] T171 [P] End-to-end test the five post-verification outcomes in `apps/web/tests/e2e/verification-outcomes.spec.ts` â€” at sign-up the existing active merchant, the blocked account, and the administrator account; in recovery the number with no account and the administrator account â€” each replacing the code step in place with its recorded outcome message and its own control, offering no retry and no code field, announced as a status rather than an alert, and distinguished from a refusal; a reload after each returns the page to its first step, and the pending request ends once the outcome is stated (implements FR-006, FR-014, FR-038, FR-040, AC-006, AC-016, AC-041, AC-043)
- [X] T172 [P] End-to-end test the fifth incorrect entry's ending in `apps/web/tests/e2e/code-bound-ending.spec.ts` â€” five wrong entries in sequence: the first four leave the code step with the field cleared and the wrong-code message, and the fifth ends the request, replaces the code step with the flow's first step carrying the `OTP_REQUEST_ENDED` notice, keeps every collected value, announces the notice as a status (polite) rather than an alert, and moves focus to the first step's first field; no live pending request or usable code remains, and a fresh submission starts a new verification with the incorrect-entry count at zero (implements FR-034, FR-038, FR-040, AC-036, AC-041, AC-043)
- [X] T173 [P] End-to-end test a refusal produced while another request from the same page is in flight in `apps/web/tests/e2e/in-flight-refusal.spec.ts` â€” with the submit control disabled by the in-progress state, a second submission cannot start a dispatch, and the refusal belonging to the first request renders on the step that was submitted (field or card), clears the in-progress state, keeps every non-password value, and announces the refusal as an alert with focus on the field or card it names; the guard and the refusal cannot contradict each other, and a `FORM_TOO_FAST` retry takes the fresh bootstrap pair without a reload (implements FR-029, FR-040, AC-031, AC-043)

**Gate V (Verification and refusals)**: T156â€“T173 are green together â€” the nine
race runs (T157 and T158 over T156's harness), the ten clock verdicts (T159), the
eight channel cells (T160), the invariants' failing mutations (T161), the
environment check (T162), the enumeration fixture and its one re-run (T163),
AC-056â€“AC-058 (T164â€“T166), the forgery, transport, and scope refusals (T167), the
catalogue table (T168), the five-step order (T169), the refusal/success race
(T170), the five outcomes (T171), the bound's ending (T172), and the in-flight
refusal (T173) â€” and the items they close are marked in both checklists.

**Gate C1 (Documentation)**: T125, T127, and T128 are green together â€” the
OpenAPI generator emits `apps/api/openapi.json` from the same source as the
implementation (the Zod contracts and the route table) and the document is
committed; `scripts/check/module-headers.mjs` passes over every production
module; T128 records that the first standalone documentation-drift test is R2's
(ADR-031 item 4); and `scripts/check/module-headers.mjs` runs in
`.github/workflows/ci.yml` (plan â†’ Constitution Check â†’ Documentation; C1).

**Gate C3 (Deployment, versioning, health, backup)**: T017's `GET /health`
answers 503 while PostgreSQL is stopped, T017 mounts every public route under
`/api/v1` with `/health` unversioned as the operational probe, and T136 appends
the versioning and deprecation record while T120 appends the other remaining
records, so the rule `ROADMAP.md` assigns to R1 has a named task and one home;
T148 asserts the 503/200 probe, the unavailability rendering, and the provider
outage's scope, T149â€“T153 assert the restart, release, rollback, restore, and
row-bound rules, and T129 restores the ciphertext into a clean container, asserts
`/health` 200 and FR-055's state, and records the RTO/RPO
(plan â†’ Constitution Check â†’ Deployment and Observability; C3, C4).

**Gate S (Structural and accessibility conformance)**: T094â€“T098, T100, T132,
T133, T174, and T175 are green together, T115 and T124 record their passes, and
T134 records the 2026-10-31 conformance and the 2026-11-01 guest clause in
`apps/web/tests/a11y/keyboard-pass.md` with no page rendering the frame â€”
SC-006's markup half, SC-008's string and icon scan (T100 and T174) and the
copy-to-code binding that keeps every code's text recorded (T175), the five frame
criteria the six clarify answers of 2026-10-31 amended (AC-024, AC-025, AC-028,
AC-042, AC-053), and the guest's three controls at 320 CSS px the 2026-11-01
session added to AC-025; T174 closes copy CHK024 and CHK026, and T175 closes copy
CHK018's executable binding and refusals CHK019. AC-031's bounding by FR-051 is
the sixth clarify answer of
2026-10-31, and its page clause the 2026-11-01 session added â€”
the response's no-next-step content and the resume read's `OTP_EXPIRED`, which
leave the page on `form` â€” rests on US7's T081, with T073 as the API half and
T055 applying the transition rule, so each clause of AC-031 has a verifying task;
the 2026-10-31 analyze pass's C2 answer (US4's, US5's, and
US6's exceptions) is separate, not one of the six; neither AC-031's clauses nor
that C2 answer is a structural or accessibility clause of this gate.

---

## Clarification trace (2026-10-31)

Every criterion the six clarify answers of 2026-10-31 added or amended is linked
to the task that verifies it â€” the frame clauses in the US5 phase, with the
final-phase task that closes them, and AC-031's bound in US7's phase â€” so no
amended clause is left unverified and no amended frame clause waits on the slice
that ships the first frame-carrying page. The analyze pass's C2 answer is
separate: it registers `EX-008`, `EX-009`, and `EX-010` and changes no criterion,
so it has no row here.

| Criterion | What the 2026-10-31 session changed | Verifying task(s) | Final-phase task |
|---|---|---|---|
| AC-024 | Activating an item closes the drawer and settles focus on the destination page's heading, not on Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â»; the bar stays rendered and visible while the drawer is open; the three dismissals return focus to Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â» | T132 (drawer contract), T094, T101, T103 | T134 |
| AC-025 | At 320 CSS px all four header controls stay in one row, the three inline-end ones icon-only at the touch floor with their names, the wordmark in its shortened form, no horizontal scroll | T095, T102, T098 | T134 |
| AC-028 | Every rendered string is the text recorded for its state, reason, or cause, with no page composing its own; a supplied value keeps the script and digits it was typed with and is never transliterated or re-numeralised; a value carrying an emoji is refused at input with its reason | T133 (the A8 component's rendering), T034 and T037 (the refusal), T100, T052 | T134 |
| AC-042 | The bar's open state under the drawer, and its scroll rule â€” the thresholds with the top read as the page's own scroll offset, so the bar stays visible at 56px or less and a page scrolling no further than that never hides it, with the transition, the reduced-motion rule, the drawer-scrolling exclusion, the un-reserved height, and the raised action's travel and its exit from the focus order and the accessibility tree while hidden â€” and the labels: each of the nine items' whole text as its accessible name in the full sidebar and in the icon-only rail, and the five slots keeping their labels at 320px, one line, cut at the inline-end where a label does not fit, with the whole text as the accessible name â€” bound with composition structural here and the cut runtime at R2 | T094, T096, T101, T103, T132 | T134 |
| AC-053 | The state is announced ahead of the page's other announcements and focus moves to its focusable heading in both variants | T097, T105, T098 | T134, T124 |
| AC-046 | The emoji limb of the field rules, decided among the value rules before account existence is consulted, adding no signal to the sign-up flow's uniformity | T034 and T037 (the US1 unit and integration assertions), T054 (the reason messages), T100 (the no-emoji scan) | T100 |
| AC-031 | Bounded by FR-051: the rate limit decides first, so a submission whose account-creation budget is spent receives the distinct limit refusal whatever else is wrong, a filled hidden field included, while the hidden field's silence, its absent pending request, and its undispatched code stand unchanged for every submission the order leaves to it | T073 (the API half: the response's shape and the resume read's `OTP_EXPIRED`), T081 (the page half: the page stays on `form`), T055 (the transition rule's implementation) | â€” |
| SC-006 | The markup assertion covers the header's four controls at 320 CSS px and the ended-session state's live announcement and focusable heading | T098, T095, T097 | T134, T115, T124 |
| SC-008 | The language and numeral rules cover the platform's own text, the no-emoji rule covers every text a person reads, a supplied value included | T100, T133 | T100 |

The plan's one value this pass records outside the criteria â€” FR-022's delegated
collapsed-rail width, **4.25rem**, from ADR-128 decision 5 â€” is carried by T009
(the token), T015 (the token contract test), and T101 (the collapsed state that
consumes it).

---

## Clarification trace (2026-11-01)

The 2026-11-01 session amended nine acceptance criteria, one success
criterion, and one requirement's reach without adding an identifier. Each
clause is linked to the task that verifies it, so no amended clause is left
unverified; the session's two clarify findings (I1, the password maximum; U1,
the emoji predicate), the guest's three-control clause (A1), and AC-031's page
clause, which the 2026-11-01 analyze pass's C2 found untraced, are carried here
beside the plan's C1 and the numbering repair I2, and no FR, AC, SC, or task
identifier moves.

| Criterion / requirement | What the 2026-11-01 session changed | Verifying task(s) | Final-phase task |
|---|---|---|---|
| AC-037 | The maximum is stated and carries its own third message â€” shorter than the minimum, longer than the maximum, or common or breached | T035 (the policy test), T043 (the password field's messages), T054 (the message rows), T140 (the policy implementation) | â€” |
| AC-046 | The emoji predicate is fixed once â€” `Extended_Pictographic`, U+FE0F, or U+20E3 â€” with a keycap sequence and a flag refused and a bare numeral accepted | T006 (the predicate), T034 and T037 (the refusal), T047 and T051 (the route and the form), T054 (the reason messages) | T100 |
| AC-025 | The guest's three controls â€” the logo/home control, the theme switch, and the sign-in action â€” stay in the 320 CSS px header row under the same rule as the signed-in merchant's four | T095, T102, T098 | T134 |
| SC-006 | The markup assertion adds the guest's three controls at 320 CSS px to the header's four, under the same rule | T098, T095 | T134, T115, T124 |
| AC-003 | FR-042 is widened to the sign-up form, so the format refusal is decided within the value-rules step FR-051 fixes | T033, T047, T051 | â€” |
| AC-031 | The silence is bounded to the response's text, status, and timing, and the flow stops at that response: the page stays on the form's first step, no pending request is started, no code is dispatched, the code step is not reached, and the response carries no next-step content | T073 (the API half: the response's shape and the resume read's `OTP_EXPIRED`), T081 (the page half: a 202 to a form whose hidden `website` field is filled leaves the page on `form` with no message and no code step, `apps/web/tests/e2e/sign-up-abuse.spec.ts`), T055 (the transition rule's implementation) | â€” |
| AC-006 | The sign-up direction replaces the code step in place and stays there until a reload or a fresh opening, because the pending request ends once the outcome is stated, and FR-038 now names two terminal outcomes â€” the recovery flow's message and the sign-up flow's direction â€” rather than one | T037 (the existing, blocked, and administrator outcomes and the pending row's deletion once the outcome is stated), T038 (both concurrent cases: two sign-ups for one number and two entries of the same correct code, each producing at most one account and one session, the losing attempt receiving the same status- and role-specific message the winning row fixes, with no partial account, no second session, and no live pending request) | â€” |
| AC-036 | The replacement of a live pending request and its code is dispatch-conditioned: the new request replaces the previous one and invalidates its code only once the messaging channel accepts the new message, while a dispatch refused at acceptance leaves the previous request and its code live and produces the explicit, retryable failure | T036 (the pending request's state machine), T083 (the verified state's ending on replacement and the reset's session ending) | â€” |
| AC-041 | The same dispatch-conditioned replacement as each flow's code step carries it: a new request replaces the pending request, the recovery flow's verified state included, only once the channel accepts the new message, and a refused dispatch leaves the state in place | T036 (the state machine's replacement rule), T039 (the sign-up journey: the in-place code step and the reload that resumes it), T040 (the refused submission: the step kept, the typed values retained, and the code field cleared) | â€” |
| AC-028 | The language and numeral clause binds the text the platform itself writes, while the no-emoji clause stays unbounded | T100, T133 | T100 |
| FR-008 | The uniform refusal's definition is stated once, and FR-009, FR-017, and FR-027 name it without repeating its terms | T058, T063, T071 | â€” |
| Test Coverage Request | The recovery operation's budget and its later steps' exemption are placed in the final phase, with FR-033 and FR-051 cited, so the specification names no task | T137 | T137 |

---

## Clarification trace (2026-11-02)

The 2026-11-02 CHK036 pass amended one acceptance criterion's clause without
adding an identifier: AC-031's silence now covers the refusal's duration as a
one-sided, numeric bound rather than "the same timing" as a success that waits
for the channel. The clause and its verifier are recorded here, so the criterion
is not left with a promise no task asserts. The CHK023 pass then widened
AC-028's scope to every text the platform delivers â€” on a screen and in an SMS
message â€” so the criterion's subject matches FR-026's and the one-time-code
bodies are asserted by a criterion rather than by SC-008 alone. The CHK032 pass
then fixed the stacking order of the frame's three overlaying surfaces and the
consumption of an activation outside an open surface, amending AC-024, AC-042,
and AC-051 without adding an identifier.

| Criterion / requirement | What the 2026-11-02 session changed | Verifying task(s) | Final-phase task |
|---|---|---|---|
| AC-031 | The silence is bounded to the response's text, status, and headers, and its duration to a one-sided numeric tolerance â€” the refusal is not observably faster than a successful submission's 202, with a median shortfall of no more than 50 ms and a p95 of no more than 150 ms over the enumeration test's sampling; full equality with the channel acceptance wait is expressly not promised | T073 (the API half: the response's shape, the duration pair, and the resume read's `OTP_EXPIRED`), T081 (the page half), T055 (the transition rule), T142 (record 15's timing clause) | â€” |
| AC-028 | The scan now covers every text the platform delivers to a person â€” what a screen renders, the frame this slice delivers, and the body of every message it sends by SMS â€” with the icon limb left to the screens, so the four message templates stand under the same criterion as the screens and compare with the two notices AC-047 already covers; the criterion's subject matches SC-008's widened one, and the direction limb is the document-level assertion rather than the string scan | T026 (the four templates), T100 (the string scan over the three pages' copy, the frame's copy, and the four templates), T099 (the declaration on the three bare pages), T098 (the frame's inheritance), T133 (the supplied-value rendering) | T100 |
| AC-024 | The open drawer is the frame's topmost surface â€” it and its scrim above the page and the header, the scrim over the bar with the panel ending at the bar's top edge â€” and an activation outside it is consumed by the dismissal, performing nothing beneath it, so a tap on Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â», the account control, or a slot closes the drawer and the person activates the control again; the account menu does not open over the drawer | T132 (the drawer's structural contract), T103 (the bar's state under it), with the order and the consumption runtime at R2 under `EX-007` | T134 |
| AC-042 | The bar sits above the page's content and below the drawer and the account menu, its panel ending at the bar's top edge, and its slots take no activation while either is open | T096, T103, T132, with the order runtime at R2 under `EX-007` | T134 |
| AC-051 | An outside activation closes the menu and performs nothing beneath it, so an activation on a bottom-bar slot or on Â«Ø§Ù„Ù…Ø²ÙŠØ¯Â» closes it without acting on the slot and without opening the drawer, and the menu does not open over the drawer | T095 (the menu's structural contract), T102, with the order and the consumption runtime at R2 under `EX-007` | T134 |
| SC-008 | The subject now reaches the frame's copy this slice delivers â€” nine sidebar labels, five bar slots, four footer links, brand line, the account menu's three items and confirmation, and both ended-session variants â€” and the direction limb is measured at the document level rather than by the string scan | T100 (the widened string scan), T099 (the declaration on the three bare pages), T098 (the frame's inheritance) | T100 |

---

## Clarification trace (2026-11-02, session 41)

The session added no identifier and amended four requirements, two criteria, and
one success criterion in place, so each clause is linked to the task that
verifies it. The number's display form, the two closed sets the string scan now
judges, and the supplied value's bidirectional isolation are the three rules the
session fixed; the copy itself was rewritten to the new rules in
`contracts/ui-contracts.md`, `quickstart.md`, and T026, T052, T100, and T133
carry them.

| Criterion / requirement | What the session 41 clarify pass changed | Verifying task(s) | Final-phase task |
|---|---|---|---|
| FR-038 | The mobile number has one display form â€” `+218 91 234 5678`, the prefix then the nine national digits grouped 2-3-4 with single spaces, in Latin digits, in one isolated left-to-right run â€” stated at the code step and at every place the platform shows the number, while FR-031's unspaced `+218912345678` stays the stored form | T052 (the code step's read-only number), T055 and T089 (the two pages that reach it), T099 (the bare pages' copy) | T100 |
| AC-041 | The recovery code step's number is the same display form as the sign-up step's, so the criterion reads FR-038's form instead of a second shape | T052, T089, T040 (the recovery journey) | T100 |
| FR-026 | Platform copy carries no diacritics â€” U+064Bâ€“U+0652 and U+0670 are defects with no exception â€” and no Latin character outside the closed set (digits 0â€“9, `+218`, `SMS`), with Principle V's PDF, Excel, OEM, and SKU permitted product-wide and unused here | T100 (the scan's two new limbs), T026 (the four templates), T054 (the message table), T099 and T098 (the pages' and the frame's copy) | T100 |
| AC-028 | The platform's own text limb adds the no-diacritics and permitted-token rules, the supplied-value limb adds the isolated bidirectional run, and the number is counted in FR-038's display form | T100, T133, T099, T098 | T100 |
| SC-008 | The scan decides the two closed sets without judgement â€” a combining mark in U+064Bâ€“U+0652 or U+0670 fails it, and so does a Latin letter sequence other than `SMS` â€” and counts the number in the display form | T100 | T100 |
| FR-045 | A supplied value renders as one isolated bidirectional run whose direction comes from its own first strong character, never split, never concatenated with platform copy in the run, and never forced to the page's direction | T133 (the supplied-value rendering), T054 (the interpolation-only mapping), T052 (the code step's read-only fields) | â€” |

---

## Plan trace (2026-11-02, copy checklist)

The copy checklist's four open items closed against `plan.md` and
`contracts/ui-contracts.md` without changing a requirement, a criterion, or a
success criterion; each rule they fix is traced to the tasks that assert it.

| Requirement | What the plan now fixes | Verifying task(s) | Final-phase task |
|---|---|---|---|
| FR-026 | The emoji predicate's data is pinned â€” Unicode 18.0.0, the vendored `emoji-data.txt` and its SHA-256, the generated range table, and the regeneration test â€” so a new Unicode release cannot change a value's verdict without the specification's amendment; the predicate reads that table and never the runtime's property escape | T006, T034, T037, T047, T051, T100 | T143 |
| FR-035 | The copy's authority is one record â€” `contracts/ui-contracts.md`, whose inventory states the complete set, with the R1 capture set as evidence of composition only â€” and every numeral the copy carries is a slot from `packages/shared/src/limits.ts` bound to its CMV row, with the agreement class the test pins | T035, T043, T054, T088, T140, T100 | T143 |
| FR-043 | Each SMS body's length is asserted against its class's bound â€” 70 UCS-2 code units for a one-time-code body and 134 for a notice â€” so a body over the bound fails the build rather than being cut, and the two code bodies carry the same closing clause | T026, T100 | T143 |

---

## Clarification trace (2026-11-04)

Session (3) narrowed AC-051 to what this slice builds and named the slice each
deferral waits for; session (2) made SC-004 the single home of the
non-discrimination exceptions, so a task that names an exception cites that one
statement instead of the requirement that produced it. Neither session added an
identifier, moved a task, or changed a task's scope. The table states AC-051's
two sides once â€” what is built and verified here, and what each deferral waits
for â€” so the criterion, `EX-007`, and Complexity Tracking row 34 are read
together rather than reconstructed from three places.

| Criterion / requirement | Built and verified in this slice | Deferred, and to which slice | Verifying task(s) |
|---|---|---|---|
| AC-051 | The account menu's composition: its three items (Â«Ø­Ø³Ø§Ø¨ÙŠÂ»ØŒ Â«Ø¥Ø¹Ø¯Ø§Ø¯Ø§ØªÂ»ØŒ Â«ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬Â»), their accessible names and roles, its keyboard reachability, the sign-out confirmation's markup, and the two items' link targets â€” `/profile` for Â«Ø­Ø³Ø§Ø¨ÙŠÂ» and `/profile#settings` for Â«Ø¥Ø¹Ø¯Ø§Ø¯Ø§ØªÂ», on the one Profile route the frame's decision record fixes | The menu's live open, its runtime dismissal, and the confirmation's result to R2, on the boundary SC-005 fixes under `EX-007` (R2 ships the first page carrying the frame, ADR-139); the destinations the two items name, with the Profile page's own content â€” the account's full name, city, and status at its top and no other account field â€” to R7 against FR-047, recorded as Complexity Tracking row 34 (owner R7, review 2027-01-31). No exception row is opened for either deferral: the instrument is the narrowed criterion plus the deferred row, as rows 5, 25, and 28 do for R2 and R12 | T095 (the menu's structural contract and its two link targets), T102 (the components, the three items' routes, and the confirmation's markup), T098 (the three items' accessible names, roles, and keyboard reachability under AC-022), with the live open and the runtime dismissal at R2 under `EX-007` |

The session (2) re-link is carried by the tasks that assert an exclusion: T037
and T082 cite the post-verification exception, T058 the successful sign-in's,
T061 the format refusal's, and T074 the rate-limit and re-request refusals' â€”
each pointing at SC-004's closed list and restating none of its reasons.

---

## Verification trace (2026-11-04, sessions (8)â€“(10) and the plan's operational pass)

The clarification sessions (8)â€“(10) added FR-054 and FR-055 and AC-059â€“AC-062,
and amended FR-004, FR-013, FR-014, FR-028, FR-034, FR-037, FR-040, and FR-043's
reach without adding an identifier. The plan's operational-record, recovery, and
verification-contract paragraphs fixed the record's content and emission, the
operational rows' bound, the messaging provider's outage, the restore's state,
and the rollback. Each clause is linked here to the task that verifies it, so no
added or amended clause is left unverified.

| Criterion / requirement | What the session or plan fixed | Verifying task(s) | Final-phase task |
|---|---|---|---|
| FR-040, AC-043 | The service's or the store's unavailability renders the one inline, explicit, retryable failure FR-040 defines â€” no second "service unavailable" state, no navigation, no wait â€” and a request repeated after a lost response reaches a stated outcome with no second effect | T040 (the rendered failure and the in-progress guard), T081 (the page half), T147 (the lost-response repeats), T148 (the store's unavailability and the provider's outage), T149 (the in-flight request a restart strands) | T147, T148, T149 |
| FR-043, AC-047 | The provider's outage stops the two code dispatches and the two notices alone; a refused dispatch writes no pending row and no code; sign-in, sign-out, the session ends, the password paths, the forced change, and provisioning continue; `/health` stays 200 | T026 (the port and the templates), T060 (the dispatch-failure records), T148 (the outage matrix) | T148 |
| FR-004, AC-004 | The account, its credential, and the session that makes it usable come into existence in one indivisible step, and a failure leaves none of them and keeps the code usable | T037 (the row-level invariant), T045 (the transaction), T146 (the fault injection) | T146 |
| FR-013, AC-014 | The new password and the ending of every existing session take effect together, so a failure leaves the previous password and every session as they were and no session survives on a superseded password | T059 (the session endings), T086 (the reset transaction), T135 (the change service), T146 (the fault injection), T147 (the repeated change and sign-out of every device) | T146, T147 |
| FR-014, AC-016 | The reset's credential write and global revocation are one step, and the recovery verified state ends with the write | T082 (the recovery flow), T083 (the verified state and the concurrent change/reset), T086 (the reset transaction), T146 (the fault injection) | T146 |
| FR-028, AC-030 | The administrator's forced change applies the same indivisible write and revocation as the account's own change | T108 (the forced first sign-in), T113 (the administrator branch), T135 (the shared service), T146 (the fault injection) | T146 |
| FR-034, AC-036 | The replacement's protected value is installed while the previous code stops being valid, in one step; a failure leaves the previous code valid, the request unchanged, and the re-request allowance unspent | T036 (the pending request's state machine), T049 (the resend route), T146 (the fault injection), T147 (the repeat that spends no re-request) | T146, T147 |
| FR-054, AC-059 | A restart changes none of the live state â€” the session and both clocks, the lock and its count, the pending request and its allowance, and the spent window â€” and a request in flight receives no answer while its repeat reaches FR-040's outcome | T149 (the restart's invariance) | T149 |
| FR-054, AC-060 | No request is served while the stored data is not at the version the running code expects, and applying a migration changes none of the person-held state | T126 (the boot guard's refusal and ready path), T150 (the release boundary and the migration's neutrality) | T150 |
| FR-055, AC-061 | A restore to a point within the recovery point returns the state of that moment rather than reconciling it, including the removed row and the undone block, and the in-memory acceptance estimate resets | T152 (the restore point's state), T129 (the drill's `/health` and FR-055 assertions) | T152 |
| FR-055, AC-062 | The first migration is one reversible step with both directions defined; its rollback is exercised before production and loses the state written under the version being rolled back | T032 (the up and its paired down), T151 (the rollback's row set, applied count, and re-apply) | T151 |
| FR-037, AC-040 | Every record carries the closed schema's fields and no forbidden value, is handed to the stream before the response, and a stream that cannot take it changes no outcome; the provisioning action is the one exception, whose failed emit turns its report into a failure and a non-zero exit | T018 (the logger), T060 (the closed list's records and the emission order), T145 (the schema, order, and throwing-stream case), T154 (the provisioning action's failed record) | T145, T154 |
| CHK018 (plan â†’ Technical Context) | The operational rows are bounded by time, enforced by the hourly idempotent sweep under an advisory lock; no sweep deletes a `users` or `accounts` row | T032 (the sweeps), T153 (the bound, the idempotent second run, and the held lock) | T153 |

**CHK002 closure.** Every one of the 62 acceptance criteria is exercised by at
least one requested test task, AC-059â€“AC-062 included: T149 exercises AC-059, T150
exercises AC-060, T152 exercises AC-061, and T151 exercises AC-062. The four
operational criteria are cross-cutting and their tests sit in the final phase,
where the assembled service is exercised; each fails when the rule it asserts is
removed â€” the restart reset, the version check, the restore point, or the down
migration â€” so the criterion does not rest on a task reference alone.

**CHK005 closure.** T155 names the moment the coverage gate blocks â€” R1's
acceptance, not the P1 checkpoint â€” and the artifact that reports it: the
changed-line report attached to the pull request and kept in the `r1-acceptance`
release, naming the diff baseline, the changed-line count, the covered count, the
percentage, and every excluded path with its exception row. `README.md` records
that R1's acceptance MUST NOT be recorded while the gate fails, so the threshold
has an enforcement moment and a report rather than only a measurement.

---

## Verification trace (2026-11-04, the two checklists)

This pass closes the verification checklist's **CHK025â€“CHK032** and the refusals
checklist's **CHK021â€“CHK029** by giving each open item the task that carries it.
Two items of the verification set close on tasks that already exist; no new task
is added for them.

| Item | The gap the review found | Verifying task(s) |
|---|---|---|
| verification CHK025 | "Arrive together" had no determinism rule, and only two of the three interleavings were named | T156 (the harness), T157 (the two sign-up races), T158 (the change and reset) |
| verification CHK026 | The four clocks were named but no task asserted both sides of every bound | T159; the unit and integration helpers are T056â€“T058 and T108 |
| verification CHK027 | The channel's two failure kinds at both placements were not asserted as a matrix | T160 |
| verification CHK028 | US2's sign-out journeys, US4, and US6 are withheld from end-to-end and were left to "the tests named above" | No new task: T057 (AC-015), T059 (AC-011â€“AC-014 and AC-058), T090 (AC-018â€“AC-021, `EX-008`), T108 and T109 (AC-029, AC-030, `EX-010`), T110 (AC-054), and T144 (AC-020's removal effects); this row is the mapping |
| verification CHK029 | The two substituted states were named but their boundary was not carried beside the tests | No new task: T090 seeds the blocked state and T144 the removed one, and `plan.md` â†’ *The substituted states* states what neither proves â€” the act, its authorization, its audit record, and the operator's surface (R13 or R15) |
| verification CHK030 | The passing assertions existed; the failing mutation of each invariant did not | T161 |
| verification CHK031 | Each test class's environment was fixed in prose but nothing failed when a project departed from it | T162 |
| verification CHK032 | The enumeration protocol was fixed but no committed fixture or serial, coverage-off configuration enforced it | T163 |
| refusals CHK021 | A refusal code could lack a criterion or a producer without a failure | T168 |
| refusals CHK022 | The order was asserted at "two applicable refusals", not at every step and the same-step pair | T169 |
| refusals CHK023 | "The same text" was asserted in two suites, not as identity between the cases that share a text | T168, with T058, T082, and T100 |
| refusals CHK024 | The retryable property was stated in the table but not asserted per refusal | T168, with T137's `Retry-After` |
| refusals CHK025 | The forgery, body-size, method, and scope not-found answers had no criterion and no test | T167, and T168's table declares the two transport codes outside the criteria with the contract's reason |
| refusals CHK026 | A refusal and a success could race on one step with no stated outcome | T170 |
| refusals CHK027 | The post-verification outcomes were asserted at the API but not as rendered states with their own controls | T171, with T037 and T082 |
| refusals CHK028 | The fifth incorrect entry was asserted as a refusal, not as the state change with its announcement and focus | T172, with T036 and T053 |
| refusals CHK029 | A refusal produced while another request from the same page was in flight was not covered | T173 |

No FR, AC, or SC identifier was added, renumbered, reused, or amended: the counts
stay 55 FR, 62 AC, and 9 SC, and the task count becomes 173.

---

## Copy-scan and message-code trace (2026-11-05)

This pass gives the copy checklist's two open items and its already-satisfied
CHK018 an executable binding, and gives the refusals checklist's open code item
the task that carries it. Every closure names one measurement point, so no
requirement is claimed satisfied by prose alone.

| Item | The gap the review found | Verifying task(s) |
|---|---|---|
| copy CHK024 | SC-008's scan did not reach the numerals the platform generates at runtime â€” the one-time code, the rendered number, and a future unread count â€” but only the static strings | T174 renders the code through T026's template and the number through T012's `WfNumeral.vue` and T052's code step, scans them beside the static strings, and asserts that R1's notifications control renders no unread badge, so the future count is outside the slice's subject |
| copy CHK026 | The scan's verdict was not fixed: what a failing string does to the build, and whether the scan's report is the evidence SC-008 claims | T174 applies SC-008's closed fail predicate and fails the test, the run, and the CI job on one failing string, and its report is SC-008's evidence at R1's acceptance; the only exceptions are a supplied value and the city list's recorded names |
| copy CHK018 | The message table's `Where` column and the no-composed-sentence rule had no executable binding over the whole code set | T175 asserts every one of the 26 codes has a placement, every code-bearing row names a code in the union, every `reason` variant exists once, and every `Where` cell names a page, a state, or a declared absence; T100 keeps the rendered-string identity and the no-composed-sentence limb |
| refusals CHK019 | The error-code union and the message table could drift, with no test failing when a code lacked a row or a row lacked a code | T175 binds `contracts/auth-api.md` Â§3.1's 26 codes to `contracts/ui-contracts.md` Â§6 and Â§8.4 and fails on a missing placement, an extra code, a missing variant, or an empty `Where`; T168 keeps the requirement-and-criterion mapping of the same union |

No FR, AC, or SC identifier was added, renumbered, reused, or amended: the counts
stay 55 FR, 62 AC, and 9 SC, and the task count becomes 175.

The same pass corrects T129's reference tail to `(implements FR-055, AC-061)`:
the restore drill asserts FR-055's state at the recovery point, so the task
carries that requirement and its criterion rather than a Complexity Tracking row.
The archive's encryption - AES-256-GCM under a key-encryption key injected from
the environment - and its Complexity Tracking row 17 reference stay in the task's
description, and T028 keeps citing the row. No other task changed: the count
stays 175 and no identifier was added, removed, or renumbered.

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies â€” starts immediately.
- **Foundational (Phase 2)**: depends on Setup and blocks every user story. The
  shared scaffolding â€” the bare layout (T050), the step state machine and
  in-progress guard (T053), the message mapping (T054), the shared code step
  (T052), and the password-change service (T135) â€” lands with the layer (A8), so
  no story owns it; US3's T089 consumes the shared code step in recovery mode and
  US5's T133 exercises it, and neither edits a file A8 owns. The Aâ†’B
  checkpoint (T029) is recorded before any identity scenario runs; B1 â€” the two
  schema modules, the first migration, and the expected version it fixes
  (T030â€“T032, T126) â€” is the last foundational step (ADR-139). The foundation
  gates sit inside it: T125 follows T017 â€” the composition root that mounts the
  route table and the `/health` probe and implements no product requirement, so
  it cites Complexity Tracking row 1 â€” T126 follows T017 and T032, because the
  expected version is the SHA-256 of the journal that migration generates, T130
  precedes T023, T127 follows T024 and T025, T140 follows T007 and precedes T008
  and every consumer of the password policy (T035, T043, T047, T088, T111, T135),
  T141 follows T024 and wires the INP flow into its Lighthouse step, T145 precedes
  T018's logger and fails until it lands, and Gate C2
  closes B1, after the checkpoint is recorded.
- **User Stories (Phases 3â€“9)**: start after Foundational. The P1 stories (US1,
  US2, US7) run together, and US7's integration tests gate the P1 checkpoint. The
  crossings that remain are stated rather than claimed away: US4's blocked-account
  test opens US2's sign-in and session-read surfaces under the registered
  exception `EX-008`; US5's T099 opens the three bare pages this slice ships (US1,
  US2, US3) under the registered exception `EX-009`; US6's T108 and T109 open the
  sign-in, change, and recovery surfaces US2 and US3 deliver under the registered
  exception `EX-010`;
  and US7's T080 applies its refusal order on US1's and US2's routes, and T073,
  T074, T076, and T077 open US1's and US2's surfaces, all under `EX-011`; the Polish
  T137 applies it on US3's recovery route after T085, and that is where AC-035's
  remaining part opens â€” the recovery operation's budget, the recovery steps'
  exemption from it, and the aggregate ceilings the two number keys produce â€”
  while T074 keeps the criterion's account-creation and sign-in halves on the P1
  surface; T081 adds its hidden field
  to US1's sign-up form under `EX-011`; and US2's T060 asserts the closed list's
  records that US1, US3, and US6 produce and the format and rate-limit refusals
  that emit none, under the registered exception `EX-012`. Each test seeds its own
  fixture, so a test crossing is a delivered surface, not a fixture dependency;
  US7's crossing is a code-surface crossing, not a fixture dependency either, and
  T060's crossing is an assertion over events each story emits in its own files.
- **Polish (Final Phase)**: depends on the targeted stories being complete. T128
  closes Gate C1 and depends on T125, T127, and T017; T129 closes Gate C3's
  backup half and depends on T028, while T017's `/health` probe and its
  `/api/v1` mount and T136's versioning and deprecation record supply the rest;
  T136 follows T120 and
  T131 follows T136, and T131 precedes R1's acceptance; T134 closes Gate S and
  depends on T094â€“T098, T100, T115, T124, T132, and T133.
- **Operational verification (Final Phase)**: T146 follows T045, T086, and T135;
  T147 follows T044, T045, T086, and T135; T148 follows T017 and T026; T149
  follows T017 and T032; T150 follows T126 and T032; T151 follows T032; T152
  follows T028 and T032; T153 follows T032; T154 follows T111; and T155 follows
  T022, T024, and T121â€“T123. T146â€“T154 touch different files and run in parallel
  with one another after those prerequisites; T155 carries no `[P]` because it
  writes `README.md` after T121â€“T123 and the CI gate after T024.
- **Verification and refusal closure (Final Phase)**: T156 precedes T157 and
  T158; T157 follows T038 and T158 follows T083. T159 follows T032, T056â€“T058,
  and T108; T160 follows T026, T047, T049, and T085; T161 follows T037, T038,
  T059, and T159; T162 follows T022â€“T024; T163 follows T037, T058, T082, and
  T024; T164 follows T118; T165 follows T037, T058, and T107; T166 follows T059;
  T167 follows T019, T076, and T118; T168 follows T008, T037, T047, T054, T058, T082,
  and T167; T169 follows T075, T079, and T080; T170 follows T156 and T157; T171
  follows T037, T039, T082, and T084; T172 follows T036, T040, and T053; and
  T173 follows T040 and T081. T156, T159â€“T163, T167, and T171â€“T173 touch their
  own files and run in parallel with one another after those prerequisites; T157,
  T158, T164â€“T166, T168, T169, and T170 extend a file an earlier task owns, so
  they follow it and carry no `[P]`.
- **Copy scan and message-code binding (Final Phase)**: T174 follows T100 and the
  limbs it scans â€” T026, T052, T054, T098, T099, and T133 â€” and extends T100's
  file, so it carries no `[P]`. T175 follows T008 and reads the two contracts;
  it touches its own file and runs in parallel with T174 after those
  prerequisites.

### User Story Dependencies

- **US1 (P1)**: after Foundational; no dependency on another story. Its delivered
  surfaces are opened by US5's T099 under `EX-009` and touched by US7's T080 and
  T081 under `EX-011`; those are the other stories' crossings, not US1's
  dependencies.
- **US2 (P1)**: after Foundational; no dependency on another story, and none of
  its tasks waits on a US1 task â€” the bare layout (T050), message mapping (T054),
  step guard (T053), and the password-change service (T135) it consumes are
  foundation code. US4's T090 and US6's T108 open its delivered surfaces under
  `EX-008` and `EX-010`, and US7's T080 applies its refusal order on its route
  under `EX-011`; US2's own T060 opens the closed list's records US1, US3, and
  US6 produce under `EX-012`, while its US2-owned assertions need no other story.
  Those are the other stories' crossings, not US2's dependencies.
- **US7 (P1)**: after Foundational. Its abuse and security controls land on
  surfaces US1 and US2 deliver â€” the hidden field in US1's `SignUpForm.vue`
  (T081), the refusal order in US1's and US2's `sign-up.ts` and `session.ts`
  (T080), the rate limits (T074), the security middleware (T076), and the
  no-CAPTCHA rule (T077) â€” all under `EX-011`; the recovery route's application
  and budget exemption are the Polish T137, which opens AC-035's remaining part
  on US3's `recovery.ts` after T085. Its integration tests (T073â€“T077)
  exercise the P1 surface as a whole, seed their own fixtures, and gate the P1
  checkpoint (ADR-139). AC-031's two halves have a verifying task each: T073
  carries the API half â€” the response's no-next-step content and the resume
  read's `OTP_EXPIRED` â€” and T081 the page half â€” a 202 to a form whose hidden
  field is filled leaves the page on `form` with no message, asserted in
  `apps/web/tests/e2e/sign-up-abuse.spec.ts` â€” while T055 implements the
  transition rule both rest on.
- **US3 (P2)**: after Foundational; no dependency on another story, and none of its
  tasks waits on a US1 task â€” the pending store's table, the shared contracts, and
  the shared code step (T052) are foundation code, and T089 consumes that
  component in recovery mode by passing its properties rather than editing
  `CodeStep.vue`, so the recovery phase supplies its own reads and writes. US5's
  T099 opens its pages under `EX-009`, US6's T109 opens its recovery surface under
  `EX-010`, and the Polish T137 applies US7's order and the recovery budget
  exemption on its `recovery.ts` route and is the task that opens AC-035's
  remaining part; those are the other stories' crossings,
  not US3's dependencies.
- **US4 (P2)**: after Foundational; its tests seed their own fixtures â€” T090
  inserts the blocked account's rows and a live session directly through
  `packages/db`, and T091 and T144 insert their accounts the same way, so none
  waits on US1's sign-up â€” and its blocked-status ground (T092) lands on the
  foundation entry point while its status read (T093) sits in the `users` module.
  The blocked-account half of T090 â€” the uniform refusal and the withdrawn-session
  assertion â€” opens US2's delivered sign-in and session-read surfaces, which the
  registered exception `EX-008` covers, so neither is claimed as verified without
  another story. The status read, the retained data, and the delete-path absence
  are verified without another story. T144's removal-effects test opens none
  either: it seeds the account's `users`, `accounts`, `sessions`, and
  `phone_verifications` rows itself, performs the row removal itself in the order
  R13 must use, and reads the surviving store and the foundation entry point
  (T020), so `EX-008`'s scope stays T090's test alone.
- **US5 (P2)**: after Foundational (the layer and its rail-width token). Its
  composition assertions (T094â€“T098, T132) wait on no story, and T133 exercises
  the A8 shared code step (T052) â€” foundation code, not a US1 component; its
  bare-page end-to-end test (T099) opens the three bare pages this slice ships
  (US1, US2, US3), which the registered exception `EX-009` covers. T132 and T133
  are written first and fail until T101 and T103 land and the foundational
  T052 and T054 are in place.
- **US6 (P3)**: after Foundational; its forced-change work is the administrator
  branch of the A8 password-change service (T113), implemented in its own file, so
  none of its implementation tasks waits on US2 and it edits no US2 file. Its
  tests seed their own fixtures: T107 seeds the existing account the conflict case
  meets directly and provisions its administrators through T111, T108 provisions
  through T111 and signs in through T112 (both US6's own) while seeding the lock
  state and the live sessions directly, and T109 seeds its administrator through
  T111. Their surface crossings â€” T108 over the lock, revocation, and notice
  behaviour US2 delivers (T064, T065, T070), and T109 over US2's sign-in and US3's
  recovery â€” are covered by the registered exception `EX-010`; no fixture crosses
  a story boundary.

### Within Each User Story

- Tests MUST be written and MUST FAIL before implementation.
- The sign-in service (T063) precedes the lock repository (T064) and the session
  service (T065) it consumes, and the recovery routes (T085) precede the recovery
  service (T086) they consume: T063 and T085 declare the ports and contracts their
  collaborators implement, and each collaborator is complete before the story's
  checkpoint. Pages follow the service they consume, and each story is complete at
  its checkpoint, with the crossings its dependency entry names (`EX-008` for
  US4, `EX-009` for US5, `EX-010` for US6, `EX-011` for US7, and `EX-012` for
  US2's closed-list assertion).
- In US4 and US6 the fixture comes before the assertion and belongs to the story
  that asserts it: T090 and T091 insert the blocked account's rows and its
  session directly through `packages/db`, and T144 seeds its account's `users`,
  `accounts`, `sessions`, and `phone_verifications` rows and then removes them
  itself; T107 and T109 seed their
  accounts the same way and provision their administrators through T111; T108
  provisions through T111, signs in through T112, and seeds its lock state and
  live sessions directly. No test in either story runs another story's flow to
  produce its fixture, and the only cross-story openings are the delivered
  surfaces T090 (`EX-008`), T099 (`EX-009`), T108 and T109 (`EX-010`), T073,
  T074, T076, T077, T080, and T081 (`EX-011`), and T060 (`EX-012`) name â€” T144 opens
  none, because its observations are the store and the foundation entry point
  (T020).
- The password-change route (T067) follows the same pattern: it calls the
  foundation service in `apps/api/src/modules/auth/service/password-change.ts`
  (T135) and clears no flag. That service carries the value rules, the
  current-password check, the revocation, and the forced-change clearing, and
  declares the administrator branch as a port; T113 implements the branch in
  `apps/api/src/modules/auth/service/password-change-administrator.ts`, so the
  forced-change clearing happens once and nowhere else and US6 edits no US2 file
  (U3).
- In US5 the structural tests come before the components they mount: T094â€“T098
  and T132 are written and fail before T101â€“T106 build the composition they
  assert, and T133 is written and fails until the foundational T052 and T054
  are in place; T106 composes the frame only after the components exist.

### Parallel Opportunities

- Tasks marked `[P]` within a phase touch different files and can run in parallel.
- After Foundational, the stories that consume no other story's work start at
  once: US1, US2, and US3 have no task in another story's phase as a
  prerequisite; T073, T074, T076, T077, T080, and T081 land on US1's and
  US2's surfaces under `EX-011`, while the Polish T137 carries US7's order to
  US3's recovery route, so the P1 stories (US1, US2, US7) run in parallel and
  US7's integration tests close the P1 checkpoint with US1 and US2.
- US4, US5, and US6 start at once too, because none of their implementation tasks
  waits on another story's delivered behaviour: T092 and T093 touch the foundation
  entry point and the `users` module, T101â€“T106 the layer, and T111â€“T113 their own
  files. Their tests seed their own fixtures â€” T090, T091, T107, T108, and T109
  insert what they need directly or provision it through T111/T112, and T144
  seeds its account's four rows and performs the removal itself â€” so only the
  surface crossings wait: T090's sign-in and session-read halves on US2's paths
  under `EX-008`, T099 on the three bare pages this slice ships (US1, US2, US3)
  under `EX-009`, T108 and T109 on the sign-in, change, and recovery behaviour
  US2 and US3 deliver under `EX-010`, and T073, T074, T076, T077, T080, and T081
  on US1's and US2's surfaces and US1's sign-up form under `EX-011`; T060 on the
  closed list's verification, recovery, and provisioning records under `EX-012`;
  the Polish T137 on US3's recovery route. Such a test is written first and fails
  until the surface it opens lands.
- US5's tests T094â€“T099, T132, and T133 are parallel across different files; its
  five component tasks (T101â€“T105) are parallel too; only the composition (T106)
  follows them.
- T025 writes `.github/workflows/ci.yml`, which T024 creates, and
  T121, T122, T123, T155, and T134 all write `README.md` or
  `apps/web/tests/a11y/keyboard-pass.md` â€” T121, T122, T123, and T155 write
  `README.md` in the stated order, T124 writes the keyboard pass record, and T134
  appends to it after T124 â€” so none of them carries `[P]`. T136 appends its single record to
  `docs/DECISIONS.md` and `docs/decisions/volume-09.md` after T120's batch, so it
  carries no `[P]` either; T130, which verifies the checker's record already
  there, sits in the foundational phase. The gate tasks T125â€“T131, T134, and T136
  are not `[P]` either: each closes a gate other tasks depend on. T140 and T141
  carry no `[P]` for the same reason: T140 precedes every consumer of the
  password policy, and T141 writes the file T024's Lighthouse step runs. T135
  carries no `[P]` for the same reason: it consumes the shared contracts (T008)
  and the API skeleton (T017) before it can declare its ports.
- T120, T136, and T142 write the same two files, so they run in that order and
  none carries [P].
- T146â€“T154 touch different files and run in parallel after their named
  prerequisites; T155 runs after T121â€“T123 and T024 because it writes the
  README's acceptance condition and the CI gate.
- T174 extends T100's file, so it runs after T100 and carries no `[P]`; T175
  touches its own file and runs in parallel with T174 after T008.

---

## Parallel Example: User Story 1

```bash
# Launch the requested tests for User Story 1 together:
Task: "Unit test the accepted number spellings in packages/shared/src/normalize/__tests__/phone.spec.ts (implements FR-031, FR-003, FR-042, AC-007, AC-003)"
Task: "Unit test the sign-up field rules and the city list in packages/shared/src/contracts/__tests__/sign-up.spec.ts (implements FR-001, FR-005, FR-026, AC-046, AC-005)"
Task: "Unit test the password policy in apps/api/src/modules/auth/service/__tests__/password-policy.spec.ts (implements FR-035, AC-037)"
Task: "Integration test sign-up and verification in apps/api/test/integration/auth/sign-up.spec.ts (implements FR-001, FR-004, FR-006, FR-026, FR-034, AC-004, AC-006, AC-007, AC-046, AC-057)"

# Launch independent implementation tasks together:
Task: "Implement the users repository in apps/api/src/modules/users/repository/ (implements FR-004, FR-031, AC-004, AC-007)"
Task: "Build the city combobox in apps/web/app/components/auth/CityCombobox.vue (implements FR-005, AC-005)"
Task: "Build the password field in apps/web/app/components/auth/PasswordField.vue (implements FR-035, AC-037)"
```

## Parallel Example: User Story 5

```bash
# Launch the structural and accessibility tests together (they fail until the components land):
Task: "Structural test the sidebar in packages/ui/tests/shell/sidebar.spec.ts (implements FR-039, FR-022, AC-042, AC-024)"
Task: "Structural test the header and the account menu in packages/ui/tests/shell/header.spec.ts (implements FR-023, FR-047, FR-025, AC-025, AC-051, AC-027)"
Task: "Structural test the bottom bar and the footer band in packages/ui/tests/shell/bottom-bar.spec.ts (implements FR-052, FR-024, AC-042, AC-026)"
Task: "Structural test the ended-session state in packages/ui/tests/shell/ended-session.spec.ts (implements FR-049, FR-048, AC-053, AC-052)"
Task: "Structural accessibility test every frame control in packages/ui/tests/shell/accessibility.spec.ts (implements FR-020, FR-023, FR-049, AC-022, AC-025, AC-053)"
Task: "Structural test the drawer's opener, dismissals, and item activation in packages/ui/tests/shell/drawer.spec.ts (implements FR-022, FR-052, AC-024, AC-042)"
Task: "Component test the A8 shared code step's supplied-value rendering in apps/web/tests/unit/supplied-values.spec.ts (implements FR-026, FR-001, FR-038, FR-045, AC-028)"

# Launch independent implementation tasks together:
Task: "Build WfNavList.vue and WfShellSidebar.vue in packages/ui/app/components/shell/ (implements FR-039, FR-022, AC-042, AC-024)"
Task: "Build WfShellHeader.vue, WfAccountMenu.vue, and WfThemeSwitch.vue in packages/ui/app/components/shell/ (implements FR-023, FR-047, FR-025, FR-024, AC-025, AC-051, AC-027, AC-026)"
Task: "Build WfShellBottomBar.vue in packages/ui/app/components/shell/ (implements FR-052, FR-022, AC-042, AC-024)"
Task: "Build WfShellFooter.vue in packages/ui/app/components/shell/ (implements FR-024, AC-026)"
Task: "Build WfEndedSession.vue in packages/ui/app/components/shell/ (implements FR-049, AC-053)"
```

---

## Parallel Example: the verification and refusal suites

```bash
# Launch the independent suites together after their prerequisites:
Task: "Build the deterministic concurrency harness in apps/api/test/support/barrier.ts (implements FR-031, AC-006)"
Task: "Integration test the four clocks on both sides of every bound in apps/api/test/integration/auth/clock-bounds.spec.ts (implements FR-009, FR-032, FR-034, AC-010, AC-015, AC-036)"
Task: "Integration test the messaging channel's failure matrix in apps/api/test/integration/auth/sms-failure-matrix.spec.ts (implements FR-034, FR-037, FR-043, AC-036, AC-040, AC-047)"
Task: "Integration test the negative and temporal invariants' failing cases in apps/api/test/integration/auth/invariant-mutations.spec.ts (implements FR-001, FR-004, FR-007, FR-009, FR-031, FR-032, FR-034, AC-004, AC-006, AC-010, AC-015, AC-036, AC-057)"
Task: "Integration test the forgery, transport, and scope refusals in apps/api/test/integration/http/transport-refusals.spec.ts (implements FR-044, FR-053, AC-048, AC-056)"
Task: "End-to-end test the five post-verification outcomes in apps/web/tests/e2e/verification-outcomes.spec.ts (implements FR-006, FR-014, FR-038, FR-040, AC-006, AC-016, AC-041, AC-043)"
Task: "End-to-end test the fifth incorrect entry's ending in apps/web/tests/e2e/code-bound-ending.spec.ts (implements FR-034, FR-038, FR-040, AC-036, AC-041, AC-043)"
Task: "End-to-end test a refusal produced while another request from the same page is in flight in apps/web/tests/e2e/in-flight-refusal.spec.ts (implements FR-029, FR-040, AC-031, AC-043)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational â€” the Aâ†’B checkpoint (T029) is recorded after
   A1â€“A8 and before B1 â€” and pass Gates C1 (foundation half) and C2.
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: run T033â€“T040 and the sign-up scenarios of
   `quickstart.md` Â§3.
5. Demo the three-page sign-up journey if the foundation is accepted.

### P1 Checkpoint

US1, US2, and US7 together are the P1 checkpoint (ADR-139). US7's integration
tests (T073â€“T077) gate it, because the first browser-facing feature cannot ship
without the abuse, forgery, encoding, and header controls: T073 closes the hidden
field's silence and the minimum time-to-submit (AC-031, AC-032); T074 the two-key
limits over account creation and sign-in, with their resend bound (AC-033,
AC-035, AC-036); T075 the refusal order (AC-055); T076 request forgery, output
encoding, and the security headers (AC-048 to AC-050); and T077 the no-CAPTCHA
rule (AC-034). AC-035's remaining part â€” the recovery operation's budget, the
recovery steps' exemption from it, and the aggregate ceilings the two number keys
produce â€” opens with the Polish T137 on US3's recovery route after T085, where it
also applies the refusal order; T137 stays in the Polish phase. The coverage gate
is R1's acceptance condition rather than a P1 condition, and T155 enforces it at
that moment.

### Incremental Delivery

1. Setup + Foundational â†’ foundation ready, Gates C1 (foundation half) and C2
   passed, checkpoint recorded.
2. US1 â†’ sign-up and verification usable.
3. US2 â†’ sign-in, sign-out, the lock, and both session clocks.
4. US7 â†’ the abuse and security controls on US1's and US2's surfaces under
   `EX-011`; the P1 checkpoint closes; T137 (Polish) applies the order to US3's
   recovery route after step 5.
5. US3 â†’ recovery.
6. US4 â†’ the status and its effects, its tests seeding the blocked account and
   session directly, with the blocked-account sign-in and withdrawn-session halves
   verified against US2's paths under `EX-008`, and the removal's effects (T144)
   verified on a direct removal the test performs in R13's order.
7. US5 â†’ the frame's composition (structurally verified), the 2026-10-31 clauses
   and the 2026-11-01 guest clause included: the drawer's opener, dismissals, and
   item activation, the header's four controls and a guest's three at 320 CSS px,
   the bar's open state and bound scroll rule, the ended-session state's live
   region and focusable heading, and the supplied values' rendering in the A8
   component (T133).
8. US6 â†’ provisioning and the forced first change, its tests provisioning through
   T111 and signing in through T112, with the change running through the A8 service
   and US6's administrator branch in its own file.
9. Polish â†’ accessibility, the user-facing string and icon scan (T100 and T174),
   the copy-to-code binding (T175), the baseline, the load report, the isolation
   test, the documentation, the generated
   OpenAPI document and its R2 handoff, the deprecation-policy record (T136), the
   encrypted restore drill, the operational-state verification (T146â€“T154), the
   verification and refusal closure (T156â€“T173), the coverage gate's blocking
   record (T155), the governance check, the 2026-10-31 conformance record (T134),
   and Gates C1, C3, S, and V.

### Notes

- `[P]` = different files, no dependency on an incomplete task.
- `[US#]` maps a task to a story for traceability.
- Every task ends with `(implements FR-###, AC-###)` â€” or with
  `(implements Complexity Tracking: <row>)` when no requirement genuinely applies.
- Commits and pull requests MUST reference the spec, plan, and task identifiers.
- Avoid: vague tasks, same-file conflicts, and cross-story dependencies that break
  independence.

**Counts are readings.** Every count this file states is read from a named
enumeration, never carried as a literal of its own: the nine sidebar names and
the five bar slots from `contracts/ui-contracts.md` Â§8.3; the 13/4/15 state
matrix (sign-up, sign-in, forgot-password) from `contracts/ui-contracts.md` Â§10;
the 26 codes of `contracts/auth-api.md` Â§3.1; the six tables of `data-model.md`;
the scenarios from `quickstart.md` Â§3, closed by Â§7; and the task total from this
file's own identifiers â€” `T001`â€“`T221`, one per task.

## Phase 10: Convergence

This phase appends the 2026-11-07 convergence pass; its identifiers continue from `T175`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T176 Clear the consecutive-failed-verification count on a successful password change in `apps/api/src/modules/auth/service/password-change.ts` — call `locks.recordSuccess(input.userId, input.now)` on the success path so the account's own change and the administrator's forced first change both end the run, while a lock already running keeps its full fifteen minutes and a reset still clears nothing — and add the case to `apps/api/test/integration/auth/sessions.spec.ts` and the forced path to `apps/api/test/integration/auth/administrator-first-sign-in.spec.ts` asserting that four counted failures followed by a successful change leave `failed_sign_in_count` at zero and the next failure starts at one, so SC-007's Clear rule holds per AC-010 (partial) (implements FR-009, AC-010)
- [X] T177 Apply the password policy to sign-up in `apps/api/src/modules/auth/routes/sign-up.ts` — after the hidden-field step and the passing value rules, call `checkPasswordPolicy(input.password)` and refuse `PASSWORD_TOO_COMMON` as a `password` field failure before the pending-request read and any account-existence comparison, so no code is dispatched and the refusal is the same whether or not the number has an account — and add the case to `apps/api/test/integration/auth/sign-up.spec.ts` asserting the refusal, no pending row, and no SMS, while the hidden-field path keeps its silent success per FR-035 (missing) (implements FR-035, AC-037)
- [X] T178 Bring both security-header emitters to `contracts/auth-api.md` 2.4 in `apps/api/src/http/security.ts` and `apps/web/server/plugins/csp.ts` — add `Permissions-Policy` and `Cross-Origin-Opener-Policy`, send `Referrer-Policy: strict-origin-when-cross-origin`, drop `preload` from HSTS and emit HSTS on page responses in production, and make the CSP `script-src` `'self' 'nonce-…'` with `object-src 'none'` and no `'strict-dynamic'` — and rewrite `apps/api/test/integration/http/security.spec.ts` to assert the six headers on an API response and add the page-response assertion in `apps/web/tests/e2e/security-headers.spec.ts`, so AC-050's header set is the contract's rather than the current divergent one (contradicts) (implements FR-046, AC-050)
- [X] T179 Restore T060's missing deliverable in `apps/api/test/integration/auth/security-events.spec.ts` — one record per event of FR-037's closed list under `EX-012`, the `auth.password.current_check_failed` records on both change paths and none for a value-rule or lock refusal, no phone/name/city/token/code/hash/initial password in any record, no record for a format or rate-limit refusal, no notice on an ordinary sign-in or sign-out, one notice on a sign-out of every device and one per change, and the record handed to the structured stream before the response is written, asserted through a real route with a stream that records call order — and replace the tautological order assertion in `apps/api/src/observability/__tests__/logger.spec.ts` with one that exercises the route (missing) (implements FR-037, AC-040)
- [X] T180 Remove the extra `auth.session.revoked` record from the password-change success path in `apps/api/src/modules/auth/service/password-change.ts` — a password change emits its own `auth.password.changed` record alone, and the session endings it produces are part of that record rather than a second record, while the `sessions.revoked_reason = 'password_change'` column stays — and assert in `apps/api/test/integration/auth/sessions.spec.ts` and `apps/api/test/integration/auth/administrator-first-sign-in.spec.ts` that a successful change emits exactly one security record and no revocation record with reason `password_change`, so FR-037's one-action-one-record rule holds per AC-040 (contradicts) (implements FR-037, AC-040)
- [X] T181 Refuse a state-changing request with no `Origin` header in `apps/api/src/http/security.ts` — `csrfGuard` must refuse an absent, malformed, or unlisted `Origin` exactly as it refuses an unlisted one, because `contracts/auth-api.md` 2.1 requires all three refused and the current `origin !== undefined` allowance admits a request with no origin — and add the absent-origin case (`origin: null`) to `apps/api/test/integration/http/security.spec.ts` beside the missing-token, wrong-token, and unlisted-origin cases per FR-044 (contradicts) (implements FR-044, AC-048)
- [X] T182 Return the canonical number in every auth response body — replace `formatPhoneForDisplay(...)` with the stored or normalized canonical `+218…` in the 202s of `apps/api/src/modules/auth/routes/sign-up.ts` and `apps/api/src/modules/auth/routes/password-recovery.ts` and in the resume read of `apps/api/src/modules/auth/routes/verifications.ts`, format the canonical value in `apps/web/app/pages/auth/sign-up.vue` and `apps/web/app/pages/auth/forgot-password.vue` before handing it to `CodeStep.vue`, and change the assertions in `apps/api/test/integration/auth/enumeration.spec.ts` from the display form to the canonical submitted number, so SC-004's outside-comparison rule and `contracts/auth-api.md` 5.2/5.3.1 hold (contradicts) (implements FR-031, AC-007)
- [X] T183 Verify the vendored breached-password list at boot — in `apps/api/src/modules/auth/service/password-policy.ts` load it eagerly and check the line count and SHA-256 digest against `apps/api/src/modules/auth/data/breached-passwords.source.json` (`uniqueDigests` and `sha256`), and fail startup in `apps/api/src/index.ts` with a non-zero exit and a clear message when the file is missing, truncated, or altered, instead of the current lazy `readFileSync` on first check — and add the boot test that backs up the vendored file, replaces it with a truncated copy, spawns the entry point, asserts the non-zero exit, and restores the file, so the plan's CHK012 failure mode and `data-model.md`'s loaded-once-at-boot rule hold (partial) (implements FR-035, AC-037)
- [X] T184 Restore T061's missing deliverable in `apps/api/test/integration/auth/format-refusal.spec.ts` — assert that a value that is not a valid Libyan number on sign-in and in password recovery receives the distinct explicit format refusal rather than the uniform transcript, that its text, status, and response path differ from the enumeration comparison, and that it sits outside SC-004's comparison as the format exception states, so AC-045 is verified by its named suite rather than only indirectly (missing) (implements FR-042, AC-045)
- [X] T185 Restore T091's missing deliverable in `apps/api/test/integration/users/no-self-deletion.spec.ts` — seed the account directly through `packages/db` with no sign-up flow, then assert that no route accepts its deletion and no control offers it, with no retention period or trigger asserted, so AC-020's absence is verified and T144's removal-effects suite is not mistaken for it (missing) (implements FR-018, AC-020)
- [X] T186 Add the city combobox's two missing states in `apps/web/app/components/auth/CityCombobox.vue` — the closed control shows the placeholder `اختر المدينة` while no entry is chosen, and a query that matches none renders one non-selectable row `لا توجد مدينة مطابقة` that is announced with the listbox and submits no value, distinct from the placeholder — and assert both states in `apps/web/tests/unit/city-combobox.spec.ts` per `contracts/ui-contracts.md` 3.2 (partial) (implements FR-005, AC-005)
- [X] T187 Align the recovery flow's file paths with T085, T087, T088, and T137 — rename `apps/api/src/modules/auth/routes/password-recovery.ts` to `recovery.ts`, extract `apps/web/app/components/auth/RecoveryForm.vue` and `apps/web/app/components/auth/NewPasswordStep.vue` from the current `ForgotPasswordForm.vue` and the inline step in `apps/web/app/pages/auth/forgot-password.vue`, update every import, and keep the existing recovery suites green, so a checked task names a file that exists (partial) (implements FR-014, AC-016)

## Phase 11: Convergence

- [X] T188 Fix the recovery request's repeat branch in `apps/api/src/modules/auth/routes/recovery.ts` — a new `POST /api/v1/auth/password/forgot` for a number whose pending request is in the verified state must not re-render that verified request: it must start a new request, and once the messaging channel accepts the new message the accepted dispatch must replace the verified row, ending the verified state and withdrawing its authority to set a password, so the previous request's resume read answers `OTP_EXPIRED` and its reset answers `RECOVERY_EXPIRED`, while a live code-step request keeps the repeat behaviour unchanged — and make the existing case in `apps/api/test/integration/auth/recovery.spec.ts` (`ends the verified state when a newer request replaces it`) green, so FR-034's verified-state replacement clause holds per AC-016 (contradicts) (implements FR-034, AC-016)
- [X] T189 Make `apps/api/test/integration/auth/code-dispatch-ceiling.spec.ts` start three genuinely fresh account-creation requests — drop the browser's pending tie (`wafar.pending` in the jar, or a fresh jar) between the three attempts so each submission starts a new verification rather than re-rendering the previous live one, while the number-keyed budgets stay shared — and keep the assertions of four dispatches per request, twelve sign-up messages, the fourth fresh request's `RATE_LIMITED`, and the recovery half, so the suite proves AC-036's fresh-request full allowance and the aggregate message ceiling instead of failing on the second attempt's `OTP_RESEND_LIMIT` (partial) (implements FR-034, AC-036)
- [X] T190 Restore the refusal catalogue's scan in `apps/api/test/integration/http/refusal-catalogue.spec.ts` — add `NODE_ENV` to `notCodes` beside `DATABASE_URL`, because `apps/web/tests/e2e/security-headers.spec.ts` quotes it and the scan reads it as a refusal code outside the union, so T168's one-producer and no-code-outside-the-union check is green with T178's page-header suite present (partial) (implements FR-008, AC-009)

## Phase 12: Convergence

This phase appends the 2026-11-07 convergence pass; its identifiers continue from `T190`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T191 Make the page responses carry the six security headers the contract fixes in `apps/web/server/plugins/csp.ts` — the `request` hook sets them on `event.res.headers` and a built `.output/server` page response carries none of `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or `Cross-Origin-Opener-Policy` — by writing them on the Node response (for example `event.node.res.setHeader` or a `beforeResponse` hook), keep the per-response nonce in the CSP and the injected scripts identical, send HSTS in production only, and make `apps/web/tests/e2e/security-headers.spec.ts` assert the six headers on a production page response, so AC-050 holds per FR-046 (partial) (implements FR-046, AC-050)
- [X] T192 Replace the boolean `trustedProxy` with the contract's allowlist — read the trusted proxy addresses from the environment in `apps/api/src/env.ts`, pass the list through `apps/api/src/http/deps.ts` and `apps/api/src/app.ts`, and make `originFrom` in `apps/api/src/modules/auth/service/rate-limit.ts` trust `X-Real-IP` only when the peer address is in the list and use the peer address otherwise, because `apps/api/src/index.ts:50` currently trusts the header from every peer outside development and a client can choose its rate-limit origin — and add the integration case in `apps/api/test/integration/auth/rate-limits.spec.ts` that a production-mode app ignores `X-Real-IP` from an unlisted peer and accepts it from a listed one, so FR-033's per-client key holds per `contracts/auth-api.md` §2.5 and plan threat T09 (contradicts) (implements FR-033, AC-033)
- [X] T193 Pin every GitHub Action in `.github/workflows/ci.yml` by full commit SHA — `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `actions/upload-artifact`, and `google/osv-scanner-action` currently use floating `@v4`/`@v1` tags, while the constitution's Technology Standards register (line 1421) and the plan's GitHub Actions row require every action, first-party included, pinned by commit SHA — keep the version in a comment beside each SHA, keep Dependabot's `github-actions` ecosystem pointed at the pinned actions, and add a check under `scripts/check/` wired into `pnpm lint` and CI that fails on a floating tag, so the supply-chain control is enforced per the Technology Standards register (contradicts) (implements Complexity Tracking: the GitHub Actions provider row 12)
- [X] T194 Scan all 32 delivered states at 320 and 1280 CSS px in both appearances — 128 scans — in `apps/web/tests/a11y/states.spec.ts`, because the suite currently scans only the three pages' default state (12 scans) while SC-006 and T115 close the matrix at sign-up's 13, sign-in's 4, and recovery's 15 states in both appearances and at both widths — extract the visual suite's scenario drivers into a shared support module and drive each named state before the axe scan, assert no violations and no horizontal scroll at 320, and record the 128 scans in `apps/web/tests/a11y/keyboard-pass.md`, so SC-006's R1 half is measured per SC-006 (partial) (implements FR-040, AC-043)
- [X] T195 Give the `e2e` job in `.github/workflows/ci.yml` the database the class needs — it has no PostgreSQL service, no migration step, and no `DATABASE_URL`, while `apps/web/tests/playwright.config.ts` starts the API whose `assertSchemaVersion` refuses to serve an unmigrated database — mirror the integration job's `postgres:16-alpine` service, apply `pnpm --filter @wafar/db migrate` before the suites, pass `DATABASE_URL` to `pnpm test:e2e`, `pnpm test:a11y`, and `pnpm test:visual`, and keep `SMS_TRANSPORT=fake`, so the e2e gate can run at all per plan → CHK031 (missing) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T196 Record IconPark's licence and provenance beside both vendored cuts — `packages/ui/vendor/icon-park` and `packages/ui/vendor/icon-park-outline` carry only the SVG files and a `SHA256SUMS` line, while ADR-098 decision 1 and T010 require the Apache-2.0 licence text, the NOTICE, the source commit the copy was taken from, and the vulnerability-scan record beside each cut — add the Apache-2.0 licence and NOTICE to both roots, record the upstream source commit and the scan result beside `SHA256SUMS`, and keep the SHA-256 pin, so the licence obligation and provenance are reviewable per ADR-098 (partial) (implements FR-020, AC-022)
- [X] T197 Run the Lighthouse budget on the mobile preset the plan fixes in `lighthouserc.json` — the file currently sets `"preset": "desktop"` with no throttling, while T024 and the plan's test-class table fix the mobile preset with simulated throttling over the three bare pages and the INP user flow — switch to the mobile preset, keep `numberOfRuns: 3`, keep the LCP 2500 ms and CLS 0.1 assertions, and re-establish the budget from the mobile run per T024 (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T198 Add the WCAG 2.2 AA rule set to the automated scan in `apps/web/tests/a11y/states.spec.ts` — `withTags` currently selects `wcag2a`, `wcag2aa`, `wcag21a`, and `wcag21aa`, while SC-006 fixes WCAG 2.2 AA and axe-core 4.14 carries the `wcag22aa` tag — add the tag and re-run the 128-scan matrix, so the criterion's version is the one measured per SC-006 (partial) (implements FR-040, AC-043)
- [X] T199 Separate the 200-sample timing suites from the shared run — `packages/config/vitest.config.ts` includes `apps/api/test/integration/auth/enumeration.spec.ts` and `sign-up-abuse.spec.ts` in the `integration` project, so `pnpm test:integration` runs them (two 300 s timeouts were observed) and `pnpm test:coverage` runs them with V8 coverage instrumentation, which CHK032 declares an invalid timing run — exclude the timing files from the shared integration project and the coverage run, keep the non-timing abuse cases in the integration class (split them into their own file if needed), and leave the three enumeration suites to `vitest.enumeration.config.ts`, so the protocol's coverage-off and one-host conditions hold per CHK032 (contradicts) (implements FR-006, AC-009)
- [X] T200 Run the Playwright classes against the production build the plan fixes — `apps/web/tests/playwright.config.ts` starts `pnpm exec nuxt dev` for the web app and `node tests/support/api-server.mjs` (a `tsx watch` of `src/index.ts`) for the API, while the e2e, accessibility, and visual classes' fixed environment is the production build — build once, serve `apps/web/.output/server/index.mjs` and the API's `dist/index.js` (or `pnpm start`) in the `webServer` entries with `NODE_ENV=production`, make the security-header test's HSTS branch follow the server's production mode, and re-run the three classes so their evidence is a verdict per CHK031 (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T201 Drive the visual baseline's 32 states through the local API and the database rather than the API stand-in — `apps/web/tests/visual/states.spec.ts` imports `installAuthMock` and feeds every state from `apps/web/tests/support/mock-auth-api.ts`, while the plan's accessibility and visual class fixes the production build, the local API, and the database as the environment — seed the named accounts and outcomes through the existing harness, drive the same 32 states against the real API, and keep the 128 baselines plus the three 320 light reflow captures, so the baseline is generated in the class's environment per CHK031 (contradicts) (implements FR-021, AC-023)
- [X] T202 Pin the development images by digest in `compose.dev.yml` — `postgres:16-alpine` and `ghcr.io/pgdogdev/pgdog:0.1` carry mutable tags, while the plan's PgDog row and its PostgreSQL row fix the images by digest and move them deliberately — replace each tag with `<tag>@sha256:<digest>`, record the digests, and keep the `pgbouncer-fallback` profile, so the composition is the one the plan records per plan → Complexity Tracking row 7 (contradicts) (implements Complexity Tracking: the PgDog v0.1 row 7)
- [X] T203 Put PgDog in the path the integration and end-to-end classes exercise — `.env.example` points at 6432 but `apps/web/tests/playwright.config.ts` defaults to 5432 and the CI `integration`, `coverage`, and `e2e` jobs use the PostgreSQL service directly, while the plan's test-class table says the two classes reach PostgreSQL through PgDog and the pooler the deployment uses is in the path the tests exercise — add the PgDog service (or the `pgdog-fallback` profile) in front of the CI database and point `DATABASE_URL` at it, or record an approved deviation with its reason, and prove the pooler is in the path, so CHK031's environment holds (partial) (implements Complexity Tracking: the PgDog v0.1 row 7)
- [X] T204 Align the unit and layer projects with the class environments the plan fixes — `apps/api/src/modules/auth/service/__tests__/sign-in-lock.spec.ts` opens a real database and its four tests skip in the `unit` job (no `DATABASE_URL`), while the plan's Unit — shared and API class has no services; `packages/ui/tests/**` runs under `happy-dom` where the plan fixes jsdom, and `apps/web/tests/unit/**` runs under `happy-dom` where the plan fixes node with `@nuxt/test-utils` — move the database-backed lock scenarios to `apps/api/test/integration/auth/`, keep the pure count, clear, and expiry rules in the unit suite, set the two projects' environments to the plan's (or amend the plan with an ADR), and extend `scripts/check/test-environments.mjs` to fail on each departure, so T162's check enforces the boundary per CHK031 (partial) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)

## Phase 13: Convergence

This phase appends the 2026-11-08 convergence pass; its identifiers continue from `T204`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T205 CRITICAL — Append the eight decision records the plan introduces that T120 claims but the register lacks — items 1, 2, 3, 5, 6, 7, 12, and 14: the identity flow's technical shape (better-auth's phone-number extension, the single Postgres transient store, the reserved `email` placeholder, the lock's persistence behind the shared port, the unmounted library routes, and the two modules' layout); the city list and mobile-prefix dataset (provenance, entry shape, uniqueness, normalization, the fixed test, and the build-time failure mode); the password policy's local source (SecLists' top 100,000 entries, the SHA-256 membership test, the refresh cadence, the licence, the boot-time line-count and digest check, and the stale-list rule); the session policy (the two clocks, the activity signal, the tombstone rows, and the ended-session reasons); the rate-limit and transient-store locations (Postgres tables instead of Redis, the window and sweep rules, each row's time bound, and the hourly idempotent sweep); the frame's route map (the nine destinations, the four static routes, the three bare routes, the guest sign-in target, and the Profile settings anchor); the provisioning boundary, the initial password, and the audit log (the operator-run action, the FR-037 record, its six-field floor, its emission before the response, and the credential-handling rule); and the SC-009 load profile and its verdict (20 origin keys and 600 number keys, the limiter never bypassed, the attempted/accepted/refused counts, the 50 ms acceptance wait, and the 250 ms work-alone p95) — to `docs/DECISIONS.md` and `docs/decisions/volume-09.md`, each naming the owning feature and recording its alternatives, so T120's checked claim is true per plan: Decision records this plan introduces (missing) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T206 CRITICAL — Append the plan's record 13 — public API versioning and the deprecation rule: the `/api/v1` path segment every public route carries, the unversioned `/health` operational probe outside the versioned surface, the notice of at least one release a removal requires, and the ADR that records each deprecation, with R1 shipping version 1 and no deprecated route so the record fixes the rule later slices follow and announces no removal — to `docs/DECISIONS.md` and `docs/decisions/volume-09.md`, beside T205, so T136's checked claim is true per plan: Decision records this plan introduces (missing) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)
- [X] T207 Give `WfShellHeader` the blocked ended-session state that FR-023 and FR-049 fix — add a `blocked` prop (or a `state` union) that withholds both the sign-in action and the account control while keeping the logo/home control and the theme switch, keep the signed-in and guest states and the ended variant's guest composition, and extend `packages/ui/tests/shell/header.spec.ts` to assert the blocked composition (logo/home and theme switch present, no sign-in action, no account control, and no notifications control) and the ended composition (the guest's sign-in action and theme switch, no account control, and no notifications control), so the header carries the state FR-023 fixes for the blocked variant per FR-049, AC-053, and `contracts/ui-contracts.md` §8.4 (partial) (implements FR-049, AC-053)
- [X] T208 Wire the existing hourly sweep into the API process's scheduler — start a timer at the top of each hour that calls `sweep(db)` from `packages/db/sweeps.ts` (the function already takes the PostgreSQL advisory lock), start it after the listener opens in `apps/api/src/index.ts`, clear it on shutdown so the process exits, and add a test with a fake clock asserting the schedule and the call, so `data-model.md` §14's "run from the API process's scheduler at the top of each hour" holds per plan: the operational rows' bound (CHK018) (partial) (implements Complexity Tracking: R1 carries its foundation phase and the identity work in one slice)

## Phase 14: Convergence

This phase appends the 2026-11-08 convergence pass; its identifiers continue from `T208`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T209 CRITICAL — Make better-auth 1.6.14 the credential and session engine, as research R-01, plan record 1, and the plan's Gate 2 → Identity row fix — `createBetterAuth` in `apps/api/src/modules/auth/better-auth.ts` has zero callers, while `service/credentials.ts` reads and writes the `accounts` row, `service/sessions.ts` mints the 32-byte token and inserts the `sessions` row, and `service/sign-in.ts`, `service/account-creation.ts`, `service/password-change.ts`, and `service/recovery.ts` verify passwords and revoke sessions by hand; instantiate the configured engine once at the composition root (`apps/api/src/index.ts` or the builder of `AppDependencies`), pass it to the services through a port, and route password hashing and verification, session issuance, session resolution, and revocation through `auth.api.*` while the R1 routes keep the uniform refusal, lock, rate limits, honeypot, and refusal order; keep the library's HTTP handler unmounted and forward the library's session cookie from the R1 routes as R-01 states; add a composition test that fails when `createBetterAuth` is not called and an integration assertion that a sign-in's session is the library's row, so the constitution's "Authentication MUST be implemented with the designated proven library. Custom authentication code is prohibited." holds (contradicts) (implements Complexity Tracking: the module layout row 26)
- [X] T210 HIGH — Emit `auth.session.revoked` from `POST /api/v1/auth/sign-out` — `apps/api/src/modules/auth/routes/session.ts` lines 83–90 call `sessions.revokeByToken(token, 'sign_out', now)` and return 204 without an event, while the sign-out-all route emits at line 110 and `contracts/auth-api.md` §5.6 fixes "the revocation event when a row changed" and §6 names `auth.session.revoked` for sign-out; resolve the row before revoking (or return the account id from `revokeByToken`), emit the event with `reason: 'sign_out'`, `sessionCount: 1`, and `accountId` only when a live row changed, emit nothing for an unknown cookie or an already-ended session, and add an integration assertion beside the sign-out-all case in `apps/api/test/integration/auth/security-events.spec.ts` (missing) (implements FR-037, AC-040)
- [X] T211 HIGH — Restore the recovery code step's `تغيير الرقم` control — `apps/web/app/pages/auth/forgot-password.vue` renders the shared `CodeStep.vue` with `:can-change-number="false"` and no `@change-number`, so no control returns to the page's first step, while T089, AC-041, and `contracts/ui-contracts.md` §5.1/§5.2 fix `تحقق` / `إرسال رمز جديد` / `تغيير الرقم`; pass the control, handle `change-number` by calling `pending.forget()`, clearing the code message and status, showing `form`, keeping the phone, and focusing the first field, and extend the recovery journey test to assert the control, its return to `form`, and the ended page tie (contradicts) (implements FR-038, AC-041)
- [X] T212 HIGH — Render the recorded terminal outcomes with their headings, bodies, and controls — `apps/web/app/pages/auth/sign-up.vue` lines 215–228, `sign-in.vue` 48–51, and `forgot-password.vue` 187–203 compose their own sentences and omit the recorded headings: sign-up `تم إنشاء حسابك` / `حسابك جاهز، وأنت مسجل الدخول الآن.`, `رقمك مسجل مسبقا` / `هذا الرقم له حساب على المنصة. سجل الدخول أو استعد كلمة المرور.` with the sign-in and recovery links, `الحساب موقوف` / `هذا الرقم له حساب موقوف. يبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله.`, and `الحساب إداري` / `هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة. لا ينطبق عليه تسجيل الدخول أو الاستعادة من هنا.`; sign-in `تم تسجيل الدخول` / `أنت مسجل الدخول الآن.`; recovery `تم تعيين كلمة المرور` / `انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة.`, the blocked variant `تم تعيين كلمة المرور` / `انتهت كل الجلسات السابقة. الحساب موقوف، ويبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله.` with no sign-in link, `لا يوجد حساب لهذا الرقم` / `لا يمكن إعادة تعيين كلمة مرور لرقم بلا حساب. أنشئ حسابا أو تحقق من الرقم.` with the `إنشاء حساب` link, and `لا يمكن إعادة التعيين من هنا` / `هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة.`; remove the unrecorded `الرئيسية` controls, keep the page cross-links the state table keeps, and update the outcome tests with T220 (contradicts) (implements FR-006, AC-006)
- [X] T213 HIGH — Give every step transition the focus and announcement AC-043 and its 2026-11-02 extension fix — `apps/web/app/composables/auth/useAuthStep.ts` focuses `heading.value` on `show()`, but no page binds `step.heading`, the three pages' terminal `<section role="status">` blocks carry no heading or focus target, `expire()`/`end()` return to `form` with focus left on the removed code control, and `NewPasswordStep.vue` has no mount focus; bind a `ref` to each step and outcome heading (or a `tabindex="-1"` wrapper), add the recorded headings to the terminal sections, move focus to the step's first field or its heading when it carries none, call the existing focus helper after every `expire`/`end`, and assert focus and the polite announcement for the sign-up `done`/`existing`/`blocked`/`administrator` outcomes, the sign-in `done`, the recovery `new_password`/`done`/`done_blocked`/`no_account`/`administrator` outcomes, and the `expired_notice`/`ended_notice` returns in the a11y and keyboard-only passes (partial) (implements FR-040, AC-043)
- [X] T214 MEDIUM — Set the pending cookie's attributes to `contracts/auth-api.md` §2.2 — `apps/api/src/http/deps.ts` `pendingCookie` writes `Path=/` and defaults `Max-Age` to 1800 s, while the contract fixes `Path=/api/v1/auth` and `Max-Age=300`, refreshed by every accepted dispatch, and every caller (`routes/sign-up.ts` lines 71/130/174, `routes/recovery.ts` 82/119, `routes/verifications.ts` 124) takes the default; change the path and default lifetime, keep `HttpOnly; SameSite=Lax; Secure` in production, and assert the header on a sign-up 202, a recovery 202, and a resend 202 (contradicts) (implements FR-038, AC-041)
- [X] T215 MEDIUM — Compare the CSRF pair with `crypto.timingSafeEqual` — `apps/api/src/http/security.ts` lines 134–141 compare the `wafar.csrf` cookie and `X-Wafar-CSRF` with `!==`, while `contracts/auth-api.md` §2.1 requires the comparison with `crypto.timingSafeEqual`; decode both as base64url, compare lengths first, return `CSRF_FAILED` on a length mismatch or a false result, and keep the origin check ahead of it (contradicts) (implements FR-044, AC-048)
- [X] T216 MEDIUM — Honour `X-Wafar-Activity` only behind the §2.3 guard — `apps/api/src/modules/auth/routes/session.ts` line 143 passes `isUserInitiated: c.req.header('x-wafar-activity') === '1'` straight to `authenticate`, which touches `last_activity_at` at `apps/api/src/http/context.ts` 80–82 without checking the CSRF pair or the origin, while `contracts/auth-api.md` §2.3 honours the header only with a valid `X-Wafar-CSRF` and an allowed `Origin` and ignores it otherwise; validate the pair in constant time and the origin allowlist (a present unlisted origin refuses the signal; a same-origin GET's absent origin is the browser's normal case, with the token as the same-origin proof), ignore the signal rather than the request when either fails, make `apps/web/app/composables/auth/useSession.ts` `refreshFromUserAction` send the held `x-wafar-csrf` token, and add a test that a header without the pair leaves `lastActivityAt` unchanged (contradicts) (implements FR-032, AC-015)
- [X] T217 MEDIUM — Refuse a resend for a `verified` recovery row — `apps/api/src/modules/users/service/pending-request.ts` `resend()` checks only `re_requests` and the channel, then rewrites `code_expires_at` and `request_expires_at`, so a `POST /api/v1/auth/verifications/resend` with a verified row's pending cookie restarts both expiries and extends the verified state's authority past `request_expires_at`, while `contracts/auth-api.md` §5.4 resends for a live pending request and `docs/domain-model.md` §8 fixes that the verified state never outlives `request_expires_at`; refuse a verified row with `OTP_EXPIRED` before the channel call, leave the row and its expiries unchanged, and add an integration test that a resend after verification neither sends a code nor moves the expiry (contradicts) (implements FR-014, AC-036)
- [X] T218 MEDIUM — Render the new-password step from the recorded copy — `apps/web/app/components/auth/NewPasswordStep.vue` composes `كلمة المرور من {{ passwordMinLength }} إلى {{ passwordMaxLength }} حرفا.` instead of the recorded §3.2 sentence `12 حرفا على الأقل و128 حرفا كحد أقصى، وليست من كلمات المرور الشائعة أو المسربة.`, titles the step `كلمة المرور الجديدة` instead of §5.2's `كلمة مرور جديدة`, and submits `حفظ كلمة المرور` instead of `تعيين كلمة المرور`; render the policy through the same `notices.passwordPolicy`/`PasswordField` source, set the recorded heading and submit label, and add the step to T220's recorded-copy assertions (contradicts) (implements FR-026, AC-028)
- [X] T219 MEDIUM — Align the three pages' remaining form and frame copy with §3.4/§4.2/§5.2 — none of the pages passes the recorded subtitle (`المنصة ليبية: الرقم يبدأ دائما بـ +218، ولا يوجد اختيار لرمز الاتصال.`, `برقم هاتفك الليبي وكلمة المرور.`, `سيصلك رمز على رقمك المسجل. لا نكشف وجود الحساب قبل التحقق من الرمز.`); `SignUpForm.vue` submits `إنشاء الحساب` instead of `إرسال رمز التحقق`, omits the footnote `سيصلك الرمز برسالة SMS إلى الرقم نفسه، ودخول الحساب الموثق لا يحتاج رمزا.`, writes the optional marker as `(اختياري)`, and gives the honeypot a label where §3.2 fixes no label; `RecoveryForm.vue` submits `إرسال رمز الاستعادة` instead of `إرسال رمز التحقق`; the recovery page title is `استعادة كلمة المرور` instead of `نسيت كلمة المرور`; and the cross-link sets and labels diverge (`لديك حساب؟ سجل الدخول` vs `لديك حساب؟ تسجيل الدخول`, `ليس لديك حساب؟ أنشئ حسابا` vs `إنشاء حساب`, recovery's two links vs `تسجيل الدخول`); render the recorded strings and the per-state link sets, keep the existing outcome's `تسجيل الدخول`/`نسيت كلمة المرور` links, and add the strings to T220 (partial) (implements FR-026, AC-028)
- [X] T220 MEDIUM — Bind the rendered copy to the contract instead of to itself — `apps/web/tests/unit/user-facing-strings.spec.ts` scans the pages' own strings for the script, numeral, diacritic, and emoji limbs but never compares them with `contracts/ui-contracts.md`, and `apps/web/tests/e2e/verification-outcomes.spec.ts` asserts the implementation's own sentences (lines 83–152), so T100's identity limb and T171's `recorded outcome message` are not measured; read §3.4/§4.2/§5.2/§6's tables at test time (the contract file is in the repository, so the test does not become a second copy), assert each rendered state's labels, headings, bodies, and links equal the recorded row with the numeral slots resolved from `packages/shared/src/limits.ts`, fail when a page carries an Arabic literal that no recorded row or listed exception contains, and update the e2e outcome assertions to the recorded strings and headings after T212/T218/T219 (partial) (implements FR-026, AC-028)
- [X] T221 MEDIUM — Carry the resumed values back into the first step on `expired_notice`/`ended_notice` — `apps/web/app/pages/auth/sign-up.vue` sets `formValues` only in `onSubmit` and `enterCodeStep` fills `collected` alone, while `forgot-password.vue` sets `typedPhone` only in `onRequest`; after a reload the code step resumes from the pending read with the payload and phone, but the expiry or fifth-incorrect-entry return renders `SignUpForm :initial="formValues"` / `RecoveryForm :initial-phone="typedPhone"` empty, while `contracts/ui-contracts.md` §3.1 keeps the full name, phone, city, and shop name with the password empty and §5.1 keeps the phone; seed the form state from the resume payload in `enterCodeStep` and from the resumed phone on the recovery mount (stripping `+218` for the national field), and assert the kept values after a reload plus expiry and ended returns (partial) (implements FR-038, AC-041)

## Phase 15: Convergence

This phase appends the 2026-11-09 convergence pass; its identifiers continue from `T221`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T222 CRITICAL — Never retain a submitted password in page state — `apps/web/app/pages/auth/sign-up.vue` line 115 stores the whole `payload` (including `password`) in `formValues`, which survives into the code step and is passed back as `initial`, and `apps/web/app/pages/auth/forgot-password.vue` never clears its `newPassword` ref on a policy refusal or after a successful reset, while `apps/web/app/components/auth/NewPasswordStep.vue` binds the field to that ref, so a refused or completed reset leaves the plaintext in the field and in memory; store only `fullName`, `phone`, `city`, and `shopName` in `formValues`, clear `newPassword` when a refusal message arrives and after a successful reset (and when the recovery flow returns to the form), and add unit/e2e assertions that the new-password field is empty after a failed reset and that the sign-up form's `initial` state carries no password, so the constitution's "Plaintext passwords MUST NOT be stored, logged, cached" and FR-038/FR-040's "never retains or shows" hold per Constitution (Identity, Authentication, and Session Policy) and FR-038/FR-040 (contradicts) (implements FR-038, AC-041)
- [X] T223 HIGH — Close the administrator credential-reset bypass — `apps/api/src/modules/auth/routes/sign-up-verify.ts` lines 33-51 never check `row.purpose === 'sign_up'`, so a correct recovery code submitted there is consumed by `apps/api/src/modules/users/service/pending-request.ts` lines 152-156, which marks the recovery row `verified` and returns `verified`, and `apps/api/src/modules/auth/routes/recovery.ts` lines 186-238 and `apps/api/src/modules/auth/service/recovery.ts` lines 27-66 never re-check the administrator role, so an administrator's number reaches `/api/v1/auth/password/reset` and receives a new credential from the merchant surface; refuse a row whose purpose is not the route's own (`OTP_EXPIRED`), re-assert the administrator role inside the reset transaction (refuse, delete the row, set no password, create no session), and add an integration case in `apps/api/test/integration/auth/administrator-refusal.spec.ts` that a recovery code verified through `/sign-up/verify` cannot reset an administrator and that `sign-up/verify` refuses a recovery row, so FR-027's "the merchant surface sets no credential on an administrator account in any state" holds per FR-027 (contradicts) (implements FR-027, AC-016)
- [X] T224 HIGH — Refuse a superseded one-time code without counting it — `apps/api/src/modules/users/service/pending-request.ts` lines 143-164 compares the entered value only with the single live `codeHash`, so the code a resend replaced falls through to `incrementIncorrect` and burns one of the five entries (and can end the request), while FR-034 says an expired or superseded code MUST be refused as such and MUST NOT increment the bound; retain the superseded code's protected value (a `previous_code_hash` column on `phone_verifications` plus its migration and check constraint, or an equivalent in the transient store), install it and the new hash in the same accepted-resend write, compare against it and refuse `OTP_EXPIRED` without incrementing, and add an integration case in `apps/api/test/integration/auth/sign-up.spec.ts` and `recovery.spec.ts` asserting a post-resend old code is refused and leaves `incorrect_entries` unchanged, so FR-034's stale-code rule holds per FR-034 (contradicts) (implements FR-034, AC-036)
- [X] T225 HIGH — Complete the Libyan city list to every governorate, city, and area — `packages/shared/src/reference/libyan-cities.json` holds 66 entries (three per governorate), so major places such as الزنتان، ترهونة، غدامس، صبراتة are absent while FR-005 and AC-005 require one fixed list covering every governorate, city, and area; replace the sample with a reviewed complete dataset from the administrative reference ADR-152 names, keep one unique Arabic name per entry (with the qualifier where a name recurs), update `entryCount`, `governorateCount`, `sha256`, and the SOURCE note, align the file shape with ADR-152's flat array of names (or record the object shape in a new decision record), and strengthen `packages/shared/src/reference/__tests__/libyan-cities.spec.ts` to assert the reviewed reference count and a representative set of cities and areas beyond the 22-governorate floor, so FR-005 and AC-005 hold per FR-005 (partial) (implements FR-005, AC-005)
- [X] T226 HIGH — Compose the frame whole in `apps/web/app/layouts/shell.vue` — the layout always renders `WfShellSidebar` and `WfShellBottomBar` with no `guest` prop, never renders `WfShellDrawer`, holds no `drawerOpen` state, and handles no `openDrawer`, so «المزيد» emits to nobody, the drawer and its four static links are unreachable below 1024px, a guest's merchant-area items do not redirect, and the bar's `aria-expanded` and `aria-controls` point at no drawer; add `drawerOpen`, render `WfShellDrawer :open="drawerOpen" :guest="!signedIn" @close="drawerOpen = false"`, pass `:guest="!signedIn"` to the sidebar and bar and `:drawer-open="drawerOpen"` to the bar, handle `@openDrawer`, hide the fixed sidebar below 1024px so the drawer replaces it, and add a layout test (or extend `packages/ui/tests/shell/*`) that mounts `shell.vue` and asserts the drawer opens from «المزيد», closes on the recorded dismissals, and receives the guest composition, so FR-022, FR-039, FR-048, FR-052, and AC-024, AC-042, AC-052 hold per FR-022 (missing) (implements FR-022, AC-024)
- [X] T227 MEDIUM — Send a guest to the Catalog page, not to sign-in — `packages/shared/src/routes.ts` lines 72-80 list `/catalogs` in `merchantAreaPaths`, so `destinationFor('/catalogs', true)` returns `/auth/sign-in` and the sidebar and bottom bar render the wrong target, while FR-048 and AC-052 name Home, Parts, and Catalog as the three public destinations and only Upload Catalog, My Files, Cart, Notifications, Messages, and Profile as merchant-area; remove `/catalogs` from the list and add assertions to `packages/ui/tests/shell/sidebar.spec.ts` and `bottom-bar.spec.ts` (or a new `routes` unit test) that a guest's Catalog href is `/catalogs` and the six merchant-area destinations still go to `/auth/sign-in`, so FR-048's structural rule holds per FR-048 (contradicts) (implements FR-048, AC-052)
- [X] T228 MEDIUM — Show the account control as the icon alone — `packages/ui/app/components/shell/WfAccountMenu.vue` lines 31-33 render the profile icon, a visible «حسابي» label, and a chevron, and only hide the label below 360px (lines 134-143), while FR-023 and AC-025 require the trigger to show the icon alone with «حسابي» as its accessible name; remove the visible label and the chevron from the trigger (keep `aria-label="حسابي"`), keep the touch floor, and extend `packages/ui/tests/shell/header.spec.ts` to assert the trigger's text is empty and its accessible name is «حسابي» at both widths, so AC-025's composition holds per FR-023 (contradicts) (implements FR-023, AC-025)
- [X] T229 MEDIUM — Stop stating the password policy on the sign-in form — `apps/web/app/components/auth/SignInForm.vue` line 53 uses `PasswordField`, which unconditionally renders `notices.passwordPolicy` at `apps/web/app/components/auth/PasswordField.vue` line 19, while FR-051 says the sign-in form applies no password rule and states no requirement of the policy (a wrong password there is the uniform refusal); add a `showPolicy?: boolean` prop (default true) to `PasswordField`, pass `:show-policy="false"` in `SignInForm.vue`, keep the policy on the sign-up form and the new-password step, and add a unit/e2e assertion that the sign-in page contains no policy sentence while the other two do, so FR-051 and AC-055 hold per FR-051 (contradicts) (implements FR-051, AC-055)
- [X] T230 MEDIUM — Withhold the sign-in link from the blocked reset outcome — `apps/web/app/pages/auth/forgot-password.vue` lines 203-205 always supply the bare layout's cross-links slot with «تسجيل الدخول», including for `reset_blocked`, while `specs/001-identity-foundation/contracts/ui-contracts.md` §5.2 records `done_blocked` with no sign-in link; make the cross-links slot conditional (for example a `showCrossLinks` computed that is false for `reset_blocked`) and let `apps/web/app/layouts/bare.vue` omit the empty `<nav>`, then add an e2e assertion in `apps/web/tests/e2e/forgot-password.spec.ts` or `verification-outcomes.spec.ts` that the blocked outcome renders no sign-in link while the other outcomes keep theirs, so FR-014's recorded copy holds per FR-014 (contradicts) (implements FR-014, AC-016)
- [X] T231 MEDIUM — End the recovery code step on a resend refusal that reports the request gone — `apps/web/app/pages/auth/forgot-password.vue` lines 149-162 set `codeMessage` for every failed resend, while `apps/web/app/pages/auth/sign-up.vue` lines 182-189 handle `OTP_EXPIRED` by `step.expire(...)` and returning to the form; add the same `OTP_EXPIRED` (and `OTP_REQUEST_ENDED` when it can arrive) branch to the recovery page, call `pending.forget()`, show the recorded notice, and focus the first field, and add an e2e case that a resend after the pending request's lifetime returns to the form with the expiry notice instead of staying on the code step, so FR-034, AC-036, and AC-041 hold per FR-034 (partial) (implements FR-034, AC-036)
- [X] T232 MEDIUM — Render the resend control's own in-progress state — `apps/web/app/components/auth/CodeStep.vue` lines 24 and 102-109 support a `resending` prop and the recorded `resending` state (`يجري الإرسال…`), but neither `apps/web/app/pages/auth/sign-up.vue` lines 233-244 nor `apps/web/app/pages/auth/forgot-password.vue` lines 221-234 passes it, so during a resend the submit button reads `يجري التحقق…` while the resend button keeps its idle label; track a `resending` ref in each page around the resend call, pass `:resending`, keep the verify label tied to `loading && !resending` (or a separate `verifying` state), and assert the `resending` state's label and disabled controls in the e2e or unit suite, so FR-040 and AC-043's re-request guard hold per FR-040 (partial) (implements FR-040, AC-043)
- [X] T233 MEDIUM — Identify the account in the platform-revocation record — `apps/api/src/cli/revoke-session.ts` lines 46-52 emit `auth.session.revoked` with `reason` and `sessionCount` but no `accountId`, while FR-037, AC-040, and `specs/001-identity-foundation/contracts/auth-api.md` §6 require a record produced for an existing account to carry the internal account identifier; resolve the session before revoking (or have `revoke` and `revokeById` return the row's `userId`) and emit `accountId` only when a live row changed, then add a CLI or integration assertion that the record carries the account id and no phone, name, or token, so FR-037's subject rule holds per FR-037 (partial) (implements FR-037, AC-040)
- [X] T234 MEDIUM — Carry the remaining time on the re-request-limit refusal — `apps/api/src/modules/auth/routes/verifications.ts` line 121 refuses `OTP_RESEND_LIMIT` without `retryAfterSeconds`, `apps/api/src/http/errors.ts` line 29 carries no value, and `specs/001-identity-foundation/contracts/auth-api.md` §3 line 183 narrows `retryAfterSeconds` to `RATE_LIMITED`, while FR-034 and AC-036 require the response to carry the remaining time to the pending request's boundary as the same machine-readable value; compute the seconds from `row.requestExpiresAt` (and the allowance boundary), pass `retryAfterSeconds` to `refuse`, set `Retry-After`, allow it for `OTP_RESEND_LIMIT` in the contract, and add an integration assertion in `recovery-rate-limit.spec.ts` or `code-dispatch-ceiling.spec.ts`, so FR-034's machine-readable boundary holds per FR-034 (partial) (implements FR-034, AC-036)
- [X] T235 MEDIUM — Claim a re-request allowance atomically — `apps/api/src/modules/users/service/pending-request.ts` lines 126-140 read `row.reRequests`, dispatch, then write `row.reRequests + 1`, and `incrementReRequests` in `apps/api/src/modules/users/repository/phone-verifications.ts` lines 134-144 is never called, so two concurrent resends both pass the `reRequests < 3` check and dispatch; claim the allowance with a conditional increment (or a row lock) before calling the channel, release or compensate it when the channel refuses so a failed send still costs nothing, and add a concurrency case to `apps/api/test/integration/auth/repeated-requests.spec.ts` or `code-dispatch-ceiling.spec.ts` asserting at most three accepted re-requests and the message ceiling, so FR-034's dispatch bound holds per FR-034 (partial) (implements FR-034, AC-036)
- [X] T236 MEDIUM — Refuse an empty current password as a credential failure, not a policy failure — `apps/api/src/modules/auth/routes/password-change.ts` lines 29-36 return `PASSWORD_TOO_SHORT` for every `changePasswordRequestSchema` failure, while `packages/shared/src/contracts/auth.ts` lines 117-120 require `currentPassword` to be at least one character, so a submission with an empty current password is reported as a new-password policy failure and the current-password check (FR-013 and FR-051 step 5) never runs; accept an empty current password at the schema (or distinguish the field in the parse error), let the service's current-password check return `AUTH_INVALID_CREDENTIALS` and count it as a failed verification, and add an integration case to `apps/api/test/integration/auth/sessions.spec.ts` asserting the uniform code and no policy message, so FR-013's "submitted without it is refused" and FR-051's order hold per FR-013 (partial) (implements FR-013, AC-014)
- [X] T237 MEDIUM — Install the Lighthouse runner the CI job invokes — `.github/workflows/ci.yml` line 281 runs `pnpm exec lhci autorun`, but `@lhci/cli` is absent from `package.json`, `pnpm-lock.yaml`, and `node_modules/.bin` (the command exits 1), so the budget job cannot run; add `@lhci/cli` to the root devDependencies, regenerate the lockfile, keep the dependency-budget check green, and verify the mobile budget job resolves and runs, so the Lighthouse class is executable per plan: the test-class table (missing) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T238 MEDIUM — Run the Playwright installs from the workspace that owns the binary — `.github/workflows/ci.yml` lines 226 and 260 run `pnpm exec playwright install` from the repository root, while `@playwright/test` is a dependency of `apps/web` only and `pnpm exec playwright` at the root fails (`apps/web/node_modules/.bin/playwright` is the binary), so the e2e, accessibility, visual, and Lighthouse jobs stop before their suites; change both steps to `pnpm --filter @wafar/web exec playwright install ...` (or add the dependency at the root), keep the pinned Chromium and `--with-deps`, and verify the e2e job reaches `pnpm test:e2e`, so the browser classes the plan fixes can run per plan: the test-class table (partial) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T239 MEDIUM — Measure the INP flow against the production build — `apps/web/tests/perf/inp-user-flow.mjs` line 67 starts `pnpm exec nuxt dev` when port 3000 is free, and `.github/workflows/ci.yml` line 270 runs `pnpm test:inp` after `pnpm build` but before any preview server, while the plan's Lighthouse and INP class fixes the production build and a local server; start `apps/web/.output/server/index.mjs` (or `pnpm --filter @wafar/web preview`) with `NODE_ENV=production`, `HOST=127.0.0.1`, and `PORT=3000`, keep the API at 3001, and record the served artifact in the INP report, so the class's environment matches the plan per plan: the Lighthouse/INP class (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T240 MEDIUM — Run the load class with the environment the plan fixes — `scripts/load/auth-smoke.mjs` line 174 spawns the API with `NODE_ENV: 'development'`, while the plan's Load class fixes `NODE_ENV=test`; set `NODE_ENV: 'test'` (the trusted-proxy allowlist is already empty, so the origin key is unchanged), re-run the SC-009 measurement on the Linux host, and record the environment in the load report or `docs/capacity-model.md`, so the SC-009 verdict is the registered environment per plan: the Load class (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T241 MEDIUM — Run the restore drill in the clean container T129 fixes, or record the departure — `reports/t129-restore-drill.json` and `docs/runbooks/backup-restore.md` record a host-adapted logical `pg_dump` restore because the host has no Docker or Linux cluster, while T129 requires the encrypted ciphertext restored into a clean container and the plan's Complexity Tracking carries no row for the departure; either run the production drill (`pg_basebackup` plus WAL) against a clean Linux container or CI runner and record the `/health` and FR-055 assertions, or record the departure in the plan's Complexity Tracking table with its owner and review date and align T129, the report, and the runbook, so FR-055's evidence is the arrangement the plan fixes per FR-055 (partial) (implements FR-055, AC-061)
- [X] T242 LOW — Pin TZ=UTC for the browser and load classes — the plan's test-class table fixes `TZ=UTC` for every class, but `apps/web/tests/playwright.config.ts` sets only the browser's `timezoneId` and its `webServer` environments carry no `TZ`, and `.github/workflows/ci.yml` has no `TZ`; add `TZ: 'UTC'` to both Playwright `webServer` entries and the e2e, accessibility, visual, Lighthouse, and load jobs, and extend `scripts/check/test-environments.mjs` to fail when the Playwright config lacks it, so the plan's fixed environment holds per plan: the test-class table (partial) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T243 LOW — Keep the bare page's wordmark whole at 320 CSS px — `packages/ui/app/components/WfWordmark.vue` lines 53-59 hide «منصة» and show «وفر» below 360px for every consumer, and `apps/web/app/layouts/bare.vue` line 12 uses that component, while FR-021 and AC-023 require the bare page's wordmark above the title to read «منصة وفر» (the header's shortened form is the header's, not the bare page's); add a `variant` or `short` prop or scope the media query to the header usage so the bare mark stays full at 320, and add an e2e or unit assertion that the bare page's visible wordmark is «منصة وفر» at 320, so AC-023 holds per FR-021 (contradicts) (implements FR-021, AC-023)
- [X] T244 LOW — Make the CI header's network claim true — `.github/workflows/ci.yml` lines 1-3 say the dependency-install step is the only networked step, but the workflow also runs Playwright installs (lines 226 and 260), `python3 -m pip install semgrep` (line 371), and `lighthouserc.json` line 28 uploads to `temporary-public-storage`, while the plan's Lighthouse and INP class says offline; either preinstall the tools and artifacts and remove the public upload, or state the tool-install and upload exceptions in the header and the plan's class table, so the committed gate's claim and the plan agree per plan: the test-class table (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)

## Phase 16: Convergence

This phase appends the 2026-11-09 convergence pass; its identifiers continue from `T244`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T245 HIGH — Reach the embedded schema version in every scratch database — `apps/api/test/support/scratch.ts` lines 111-114 apply only `0001_identity_foundation.sql` and stamp one journal row (`upFile` and `downFile` at lines 15-16 name that first step alone), while `packages/db/schema-version.ts` fixes `EXPECTED_SCHEMA_STEPS = 2` and `packages/db/migrations/0002_identity_foundation_previous_code.sql` adds `phone_verifications.previous_code_hash`, so six of the seven deterministic integration failures occur: `apps/api/test/integration/db/schema-version.spec.ts` lines 46 and 74 expect one applied step and the message `/expected 1 applied step\(s\), found 2/`, `apps/api/test/integration/db/migration-release.spec.ts` lines 70-80 and 127-131 stamp two steps as the mismatch, `apps/api/test/integration/db/migration-rollback.spec.ts` line 112 re-stamps one step and expects the guard to resolve, and `apps/api/test/integration/db/restore-state.spec.ts` line 256 expects 400 but receives 500 because the request's select reads `previous_code_hash`, which the scratch database does not have (`column "previous_code_hash" does not exist`); read `packages/db/migrations/meta/_journal.json`, apply every entry's up file in order, stamp the journal's entry count, apply the down files in reverse order for the rollback exercise, assert in the harness that the applied count equals `EXPECTED_SCHEMA_STEPS` so a future migration cannot land without this support, re-run the four db files to green, and re-run the encrypted restore drill at the applied set with its step count recorded in `reports/t129-restore-drill.json`, so FR-054/AC-060's release boundary, FR-055/AC-062's rollback, and FR-055/AC-061's restore evidence all read at the version being released (contradicts) (implements FR-054, AC-060)
- [X] T246 HIGH — Leave the CI database at the embedded version after the down-migration exercise — `.github/workflows/ci.yml` lines 81-85 apply only `packages/db/migrations/0001_identity_foundation.down.sql` and then run `pnpm --filter @wafar/db migrate`, but the journal already holds both steps, so the migrate is a no-op and the step leaves the six tables dropped while `drizzle.__drizzle_migrations` still reads 2 (reproduced on a scratch database: the journal count answered 2 and `SELECT count(*) FROM users` answered `relation "users" does not exist`), and `pnpm test:integration` then fails at the first harness `TRUNCATE` (`apps/api/test/support/harness.ts` lines 132-137), so the committed integration job cannot be green and the down-migration evidence the plan's acceptance condition requires is never produced; exercise the rollback at the applied set — apply `0002_identity_foundation_previous_code.down.sql` and then `0001_identity_foundation.down.sql`, or drop and recreate the database — run `migrate` again, assert that the journal count equals `EXPECTED_SCHEMA_STEPS` and the six tables exist before the suite, and fail the step when the assertion does not hold, so the plan's acceptance condition that the down-migration exercise has its evidence holds per plan: Verification and handoff (contradicts) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T247 HIGH — Release a claimed re-request allowance when the replacement cannot be installed — `apps/api/src/modules/users/service/pending-request.ts` lines 140-165 claim the allowance with `claimReRequest`, dispatch, then call `updateCode` with no compensation, so a failed install returns 500 with the allowance spent, while T146 and FR-034 fix that the failure leaves the request unchanged and the allowance unspent; wrap the install in a try/catch that calls `releaseReRequest` and rethrows, and re-point `apps/api/test/integration/auth/atomic-writes.spec.ts` lines 305-310 from the second `phone_verifications` INSERT — which no longer occurs, because `claimReRequest` (`apps/api/src/modules/users/repository/phone-verifications.ts` lines 151-171) and `updateCode` (lines 183-206) are UPDATEs — to `{ table: 'phone_verifications', verb: 'update', occurrence: 2 }`, assert the 500, the same `codeExpiresAt`, `remainingReRequests` 3, the unchanged `re_requests` row, and the first code still valid, so FR-034 and AC-036's atomic replacement is measured again (partial) (implements FR-034, AC-036)
- [X] T248 MEDIUM — Address the resend control in its in-flight state — `apps/web/tests/support/scenarios.ts` lines 227-234 and 386-393 click the button named `إرسال رمز جديد` and then assert that the same accessible name is disabled, while `apps/web/app/components/auth/CodeStep.vue` lines 102-109 render `notices.resending` (`يجري الإرسال…`) while `resending` is true and `apps/web/app/pages/auth/sign-up.vue` line 250 and `apps/web/app/pages/auth/forgot-password.vue` pass it, so both accessibility scans and both visual captures fail with `getByRole('button', { name: 'إرسال رمز جديد' })` answering `element(s) not found` after the click; assert the in-flight control by the recorded `resending` label, keep the disabled assertion on it, restore the verify control's `يجري التحقق…`/`تحقق` states after the hold is released, and re-run the two resending scans and the two resending captures, so FR-040 and AC-043's re-request guard is measured per FR-040 (contradicts) (implements FR-040, AC-043)
- [X] T249 MEDIUM — Regenerate and review the stale visual baselines — `apps/web/tests/e2e/__screenshots__/` still carries the captures taken before T229, T230, and T243 changed the pages: the visual project fails on the sign-in `form` capture at 1280 light (20,967 px, ratio 0.02), the sign-in `submitting` capture (21,186 px), the sign-in `form_error` capture (21,592 px), the forgot `done_blocked` capture (5,602 px), the `sign-up--reflow--320--light` capture (274 px), the `sign-in--reflow--320--light` capture (14,966 px), and the `forgot--reflow--320--light` capture (274 px), while the sign-in policy sentence is gone (FR-051), the blocked reset outcome carries no sign-in link (T230, the contract's §5.2 row), and the bare wordmark stays whole at 320 (T243); re-capture every width and appearance of the affected states — sign-in `form`, `submitting`, and `form_error`, forgot `done_blocked`, and the three 320 reflow captures — compare each against `contracts/ui-contracts.md` §10's baseline list and the recorded copy before committing it, record that review, and re-run the visual project to green, so ADR-129's baseline chain and the plan's acceptance condition that the visual baseline is green hold per plan: the test-class table (partial) (implements Complexity Tracking: the continuous-integration pipeline row 33)
- [X] T250 MEDIUM — Mutate a decoded byte in the CSRF mismatch case — `apps/api/test/integration/http/security.spec.ts` lines 57-70 replace only the final base64url character of the 32-byte token with `A` or `B`, but the last character of a 32-byte token carries two significant bits, so when the token's own last character is `A`-`D` the decoded bytes are identical and `csrfPairMatches` (`apps/api/src/http/security.ts` lines 89-99) correctly accepts the pair, and the case receives the sign-in result instead of 403 (the full run failed it once and the isolated rerun passed it); decode the token, flip one byte, re-encode it so the string length is unchanged and the value differs, keep the decoded-length assertion, and repeat the case over fresh bootstrap tokens so it no longer depends on the token's last character, so FR-044's constant-time comparison is measured per FR-044 (contradicts) (implements FR-044, AC-048)
- [X] T251 MEDIUM — Record the city list's object shape and version — `packages/shared/src/reference/libyan-cities.json` is an object carrying `entries`, `entryCount` 138, `version` 2.0.0, and `updated` 2026-11-09, while ADR-152 items 1-2 (`docs/decisions/volume-09.md` lines 886-894) fix a flat array of names at version 1.0.0 (2026-11-01), and T225 allowed the object shape only if a new decision record captured it; no record after ADR-152 names the city list, and `packages/shared/src/reference/__tests__/libyan-cities.spec.ts`'s header cites ADR-152 while asserting the object; either flatten the file to ADR-152's array and re-version it, or append a decision record that amends ADR-152 with the object envelope, its fields, the 138-entry dataset, and version 2.0.0, cite it from the test's header and `docs/DECISIONS.md`, and run `node governance-drift-check.mjs`, so FR-005's single reviewed list rests on a recorded shape per FR-005 (contradicts) (implements FR-005, AC-005)

## Phase 17: Convergence

This phase appends the second 2026-11-09 convergence pass; its identifiers continue from `T251`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T252 MEDIUM — Describe the release's two committed migrations and the reverse-order rollback — `packages/db/migrations/meta/_journal.json` lists two steps (`0001_identity_foundation`, then `0002_identity_foundation_previous_code`) and `packages/db/schema-version.ts` fixes `EXPECTED_SCHEMA_STEPS = 2`, while the live documents still describe a single migration: `data-model.md` line 25 and §13 (lines 492-505) say "one migration" and name only `0001_identity_foundation.down.sql`, `plan.md`'s "The schema rollback" (lines 480-486) calls the release "one reversible step" whose down returns the applied count to zero without the second down, its verification note (line 545) speaks of "the down" and "the up" in the singular, and its Constitution Check row (line 1065) describes the down as the six tables and the migration's row, `quickstart.md` lines 35 and 43 promise "the one migration" and "one migration applied", `README.md` line 113 says to apply "the first migration", and the six CI jobs name their step "Apply the first migration" (`.github/workflows/ci.yml` lines 77, 130, 177, 241, 277, and 328) while each applies every pending migration; align those live statements with the committed journal — `0001` creates the six tables and `0002` adds `phone_verifications.previous_code_hash`, the rollback applies `0002_identity_foundation_previous_code.down.sql` before `0001_identity_foundation.down.sql`, and the boot guard reads 2 applied steps — leaving the historical task text unrewritten, so FR-055's rollback record and the plan's release boundary describe what the migrator, the integration rollback suite, and the restore drill actually exercise (contradicts) (implements FR-055, AC-062)

## Phase 18: Convergence

This phase appends the 2026-11-09 convergence pass that follows Phase 17; its identifiers continue from `T252`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T253 CRITICAL — Clear every critical and high advisory the committed lockfile carries, or except it on the constitution's terms — `pnpm audit --json` on the current tree reports **3 critical and 9 high** advisory rows over **1,519** dependencies, and the plan's Complexity Tracking table records no exception for any of them: `better-auth@1.6.14` carries critical GHSA-965c-763c-88jm (OAuth state used as a Magic Link; fixed ≥1.7.7) and highs GHSA-qq9h-g4jm-xgf3 (fixed ≥1.6.22, published 2026-07-24), GHSA-q84f-53jg-9ppm (fixed ≥1.7.0-rc.3), and GHSA-r4xp-prcw-77qf (fixed ≥1.7.7); `drizzle-orm@0.44.7` carries high GHSA-gpj5-g38j-94v9 (fixed ≥0.45.2, published 2026-04-08); `tinypool@1.1.1` carries critical GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr (fixed ≥2.1.2, published 2026-10-05); `happy-dom@20.14.6` carries highs fixed in ≥21.0.4; `@cyclonedx/cyclonedx-npm@4.2.1` carries highs fixed in ≥6.0.0; `basic-ftp@5.3.1` carries high GHSA-c475-qrg2-pj4r (fixed ≥6.2.1, published 2026-10-01); and `hono@4.13.5` carries moderates fixed in ≥4.13.11; the constitution's Dependency Governance requires a dependency already in use with a critical vulnerability to be updated, replaced, or explicitly excepted within 30 days of the advisory, with the date in the plan's Complexity Tracking table, and five packages (seven advisory rows) are already past that bound (drizzle-orm 215 days, `@cyclonedx/cyclonedx-npm` 143, better-auth's 2026-07-24 high 108, basic-ftp 39, tinypool 35) — raise each package to its patched floor or replace it (moving Vitest to a release that pins tinypool ≥2.1.2, better-auth to ≥1.7.7 or later, drizzle-orm to ≥0.45.2, happy-dom to ≥21.0.4, `@cyclonedx/cyclonedx-npm` to ≥6.0.0, and hono to ≥4.13.11), regenerate `pnpm-lock.yaml` only through the dependency update process, adapt the auth adapter, the SBOM job, and the test stack to the new majors, re-run typecheck, unit, integration, e2e, the SBOM build, and `osv-scanner`, add Complexity Tracking row 39 recording each advisory, its disposition (updated, replaced, or excepted), and the disposition date, and make `security-scan` run `pnpm audit --audit-level=high` beside `osv-scanner` (or correct the plan's Dependency Governance row to name `osv-scanner` as the only lockfile scanner and update the workflow header), so no critical or high advisory is left unpatched or unexcepted at R1's acceptance per Constitution (Dependency Governance) and plan: Gate 2 → Dependency Governance (contradicts) (implements Complexity Tracking: row 39, the Dependency Governance advisories)
- [ ] T254 HIGH — Produce the registered SC-009 verdict on the plan's Linux runner and attach its passing report — `reports/sc-009-load-development-2026-11-08.md` records **Verdict: FAIL — development check, not the registered verdict** and closes with "SC-009 still has no successful verdict", because this Windows host sustains about 8.6 scrypt hashes per second against the profile's 13.3 and a single sign-in verification exceeds the p50 bound; the plan fixes the registered measurement as the `load` job on `ubuntu-24.04` (plan.md → The SC-009 load profile, "The measurement host is Linux"), and `.github/workflows/ci.yml` lines 306–348 already carry `NODE_ENV=test`, `TZ=UTC`, the 10,000-account seed, and the fake at 50 ms — run that job (or the same profile on a Linux host) and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`; if the runner cannot meet the bounds either, escalate the scrypt profile or the p50 bound as a governing specification/plan change with its own decision record rather than lowering a limit in the script or marking the task complete, and record the run's host, identifier, and environment in the report and the acceptance bundle, so R1's acceptance condition 4 and SC-009 have their verdict per plan: R1's acceptance condition 4 and The SC-009 load profile (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T255 MEDIUM — Complete the two checklists R1's acceptance requires to zero unchecked items — `checklists/refusals.md` leaves CHK008–CHK012, CHK014–CHK018, CHK020, and CHK030–CHK034 unchecked (16 items), and `checklists/operations.md` leaves CHK003 and CHK004 unchecked (2 items), while plan.md → R1's acceptance condition 2 requires every checklist under `checklists/` — the nine files, `requirements.md` included — to carry zero unchecked items on the acceptance commit; walk each item against its requirement, the plan, and the contracts (the refusal's text, status, retry hint, identity, precedence, surface, announcement, record, ownership, and numeric source; and SC-009's 10-request/second ceiling against the pages' rendering budget), tick it with the evidence location or an explicit not-applicable note, and where an item exposes a missing statement or behaviour, implement it before ticking and add its task reference to the checklist's row, so the acceptance commit's checklist gate is empty per plan: R1's acceptance condition 2 (partial) (implements Complexity Tracking: R1's acceptance condition 2 — every checklist carries zero unchecked items)
- [X] T256 LOW — Align the plan's generated emoji table path with the committed file — plan.md → Technical Context → "The emoji predicate's Unicode data (CHK025)" says `scripts/gen/emoji-data.mjs` emits `packages/shared/src/normalize/emoji-data.ts`, while the script's `target` and the committed file are `packages/shared/src/normalize/generated/emoji-data.ts`, and the regeneration test passes against the committed path; either move the generator's target and the committed file to the plan's path and update every import and the Ownership Map's entry, or correct the plan's sentence to `packages/shared/src/normalize/generated/emoji-data.ts` (the ownership entry `packages/shared/src/normalize/**` already covers it) and keep `node scripts/gen/emoji-data.mjs --check` green, so the plan's path statement and the file the predicate imports are the same record per plan: Technical Context → The emoji predicate's Unicode data (CHK025) (contradicts) (implements FR-026, AC-046)

## Phase 19: Convergence

This phase appends the 2026-11-09 convergence pass that follows Phase 18; its identifiers continue from `T256`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T257 HIGH — Produce the registered SC-009 verdict on the plan's Linux runner and attach its passing report — `reports/sc-009-load-development-2026-11-08.md` still records **Verdict: FAIL — development check, not the registered verdict**, `reports/sc-009-load.json` is absent, and T254 remains `[ ]`, because this Windows host sustains about 8.6 scrypt hashes per second against the profile's 13.3 and a single sign-in verification exceeds the p50 bound; the plan fixes the registered measurement as the `load` job on `ubuntu-24.04` (plan.md → The SC-009 load profile, "The measurement host is Linux"), and `.github/workflows/ci.yml` lines 307–349 already carry `NODE_ENV=test`, `TZ=UTC`, the 10,000-account seed, and the fake at 50 ms — run that job (or the same profile on a Linux host) and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`; if the runner cannot meet the bounds either, escalate the scrypt profile or the p50 bound as a governing specification/plan change with its own decision record rather than lowering a limit in the script or marking the task complete, and record the run's host, identifier, and environment in the report and the acceptance bundle, so R1's acceptance condition 4 and SC-009 have their verdict per plan: R1's acceptance condition 4 and The SC-009 load profile (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T258 MEDIUM — Record the Nuxt and Tailwind minor upgrades and align the live exact-version statements with the lockfile — `plan.md:47` says the exact versions R1 consumes — Nuxt 4.5, Tailwind CSS 4.2, Hono 4.13.5, and better-auth 1.6.14 — are carried by `Project-Technologies.txt` and `pnpm-lock.yaml`, while the lockfile carries `nuxt@4.6.4`, `tailwindcss@4.3.4`, `hono@4.13.17`, and `better-auth@1.7.18`; `Project-Technologies.txt` still states 4.13.5 (line 59), 4.5 (line 87), v4.2 (line 90), and 1.6.14 (line 231), and `plan.md:26` and the Gate 2 → Identity row at line 1069 still state better-auth 1.6.14; Complexity Tracking row 39 records the advisory-driven better-auth, drizzle-orm, tinypool, happy-dom, @cyclonedx/cyclonedx-npm, basic-ftp, and hono movements but not the Nuxt 4.5 → 4.6.4 and Tailwind 4.2 → 4.3.4 minor upgrades, while the constitution's Version-change rule requires every minor or patch upgrade to be recorded in the plan that performs it — add the two records (with their dates) to the plan's Complexity Tracking, update the live exact-version statements in `plan.md` (Summary line 26, Primary Dependencies line 47, Gate 2 → Identity line 1069) and the four `Project-Technologies.txt` rows to the lockfile's versions, and leave the historical ADR-151, research R-01, and plan re-evaluation text as records with a pointer to row 39 rather than rewriting them, so the plan's attribution is true and the register's mirror is current per Constitution → Technology Standards → Version-change rule and plan: Technical Context → Primary Dependencies (contradicts) (implements Complexity Tracking: the dependency update row 39)
- [X] T259 LOW — Reconcile the Ownership Map's `apps/web/public/**` row with the tree — `plan.md:3375` records `apps/web/public/**` (favicon, web manifest-free) as written by this feature, but `apps/web/public` does not exist, `nuxt.config.ts` declares no `link rel="icon"`, and the built Nitro server answers `/favicon.ico` with Nuxt's transparent 1×1 GIF fallback, so the product ships no favicon while the plan says it does — add the product favicon (an approved IconPark SVG or the wordmark's mark, with its `<link rel="icon">` in `nuxt.config.ts` and the file under `apps/web/public/`) or record in the plan that the row is ownership-only and R1 ships no favicon, and add the assertion or the record so the plan's claim and the tree agree per plan: Ownership Map → `apps/web/public/**` (missing) (implements Complexity Tracking: the Ownership Map row for `apps/web/public/**`)

## Phase 20: Convergence

This phase appends the 2026-11-09 convergence pass that follows Phase 19; its identifiers continue from `T259`, and no existing task, requirement, criterion, or success criterion moves.

- [X] T260 HIGH — Record the SC-009 runner blocker as a governing escalation decision and attach the evidence — the registered verdict cannot be produced on this Windows host (no Docker, no WSL distribution, no GitHub remote), `reports/sc-009-load.json` is absent, and `reports/sc-009-load-development-2026-11-08.md` records **Verdict: FAIL — development check, not the registered verdict**; draft the decision request in `reports/sc-009-escalation-2026-11-09.md` that names the two permitted resolutions — provide the registered `ubuntu-24.04` runner (or an equivalent Linux host) and run the `load` job, or approve a governing change to the scrypt profile or the p50 bound with its own ADR — and record it in the report trail, without lowering a limit in `scripts/load/auth-smoke.mjs` or marking T257 complete, so R1's acceptance condition 4 has an owner and a next action per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)

## Phase 21: Convergence

This phase appends the 2026-11-09 convergence pass that follows Phase 20; its identifiers continue from `T260`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T261 HIGH — Complete the SC-009 escalation's decision and produce its registered verdict — `reports/sc-009-load.json` is absent, `reports/sc-009-load-development-2026-11-08.md` still records **Verdict: FAIL — development check, not the registered verdict**, T254 and T257 remain `[ ]`, and §5 of `reports/sc-009-escalation-2026-11-09.md` still carries an empty decision record, so R1's acceptance condition 4 has no owner-selected resolution; record the repository owner's selected resolution there — A, provide the registered `ubuntu-24.04` runner or an equivalent Linux host and run the `load` job, or B, approve a governing change to the scrypt profile or the p50 bound with its own ADR and the matching specification, plan, and Constitution Mandated Values updates — and then execute it: on A run the `load` job (or the same profile on that host) and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`, recording the run's host, identifier, and environment in the report and the acceptance bundle; on B append the ADR and amend the specification, the plan, and the CMV row before the re-run; in neither case lower a limit in `scripts/load/auth-smoke.mjs` or mark T254/T257 complete without the passing registered report, so the criterion and the acceptance condition close on evidence rather than on an open escalation, per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)

## Phase 22: Convergence

This phase appends the 2026-11-09 convergence pass that follows Phase 21; its identifiers continue from `T261`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T262 HIGH — Complete the SC-009 escalation's decision and produce its registered verdict — `reports/sc-009-load.json` is still absent, `reports/sc-009-load-development-2026-11-08.md` still records **Verdict: FAIL — development check, not the registered verdict**, T254, T257, and T261 remain `[ ]`, and §5 of `reports/sc-009-escalation-2026-11-09.md` still carries an empty decision record, so R1's acceptance condition 4 still has no owner-selected resolution; record the repository owner's selected resolution there — A, provide the registered `ubuntu-24.04` runner or an equivalent Linux host and run the `load` job, or B, approve a governing change to the scrypt profile or the p50 bound with its own ADR and the matching specification, plan, and Constitution Mandated Values updates — and then execute it: on A run the `load` job (or the same profile on that host) and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`, recording the run's host, identifier, and environment in the report and the acceptance bundle; on B append the ADR and amend the specification, the plan, and the CMV row before the re-run; in neither case lower a limit in `scripts/load/auth-smoke.mjs` or mark T254/T257/T261 complete without the passing registered report, so the criterion and the acceptance condition close on evidence rather than on an open escalation per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T263 MEDIUM — Install the TanStack Query provider the session resource needs and prove the composable reads the session — `apps/web/app/composables/auth/useSession.ts` calls `useQuery` from `@tanstack/vue-query`, but no `VueQueryPlugin` is installed and no `QueryClient` exists anywhere in `apps/web` (a repository search for `QueryClient`, `VueQueryPlugin`, or `queryClient` in `apps/web` finds nothing), and no module imports `useSession`, so the resource T072 built is unreachable and throws `No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library` the moment a later slice calls it; add the Nuxt plugin that installs `VueQueryPlugin` with one `QueryClient`, keep the 30-second `staleTime`, and add a component or unit test that mounts `useSession` under the plugin, asserts the read of `/api/v1/auth/session`, and asserts that `X-Wafar-Activity: 1` is sent only from `refreshFromUserAction` and only with the held CSRF token, so the session resource's client path exists and works rather than sitting as unreachable code per plan: Technical Context → Primary Dependencies and T072 (partial) (implements FR-032, AC-015)
- [X] T264 MEDIUM — Report the installed better-auth version instead of the stale 1.6.14 constant — `apps/api/src/modules/auth/engine.ts:121` sets `version: '1.6.14'`, and `apps/api/src/modules/auth/__tests__/engine.spec.ts:30` asserts it, while the installed `apps/api/node_modules/better-auth/package.json` and `pnpm-lock.yaml` carry `1.7.18` and plan.md → Complexity Tracking row 39 records the 1.6.14 → 1.7.18 update; the engine's `version` is the only live statement of the library version in the tree, and it contradicts both the installed package and the plan — read the version from `better-auth/package.json` at module load (or set the constant to `1.7.18`), update the assertion, and add a check that fails when the reported version and the installed package disagree, so the engine identifies the library it actually runs per plan: Complexity Tracking row 39 (contradicts) (implements Complexity Tracking: the dependency update row 39)
- [X] T265 LOW — Remove the dead auth stand-in and the local probe debris, and correct the keyboard pass's evidence row — `apps/web/tests/support/mock-auth-api.ts` is imported by no test after T201 moved the visual baseline to the local API and the database, yet `apps/web/tests/a11y/keyboard-pass.md:21` still records it as the pass's "State driver"; `apps/web/tests/.artifacts/` carries `probe.mjs`, `probe2.mjs`, `overflow.mjs`, and `sign-up.html` from the 2026-11-05 debugging session, while `api.log` is written by `apps/web/tests/support/api-server.mjs` and stays; delete the dead stand-in and the four probe files, rewrite the keyboard-pass row and its §7 evidence sentence to name the environment the pass actually used — the Nuxt dev server, the local API, and the fake SMS transport, as §1 records — and leave the report's evidence and its SC-006 claim naming a driver that exists, so the tree carries no unrequested debugging output and the record is true per T201 and SC-006 (unrequested) (implements FR-040, AC-043)
- [X] T266 LOW — Drop the unused test-environment declarations and the stale Nuxt setup pin — `apps/web/package.json` and `packages/ui/package.json` still declare `happy-dom@^21.0.4`, and `package.json` and `apps/web/package.json` still declare `@nuxt/test-utils@^4.4.0`, while `packages/config/vitest.config.ts` runs both Vue classes under `jsdom` and Complexity Tracking row 36 records that the web unit class runs without `@nuxt/test-utils`; `apps/web/.nuxtrc` still pins `setups.@nuxt/test-utils="3.23.0"`, a version the lockfile does not carry (installed 4.4.0) — remove the two unused devDependencies from the root and the two workspace manifests, delete `apps/web/.nuxtrc` (or update it only if a consumer remains), regenerate `pnpm-lock.yaml` through the dependency update process, and keep `node scripts/check/test-environments.mjs` green, so the declared test stack matches the one the config runs per Complexity Tracking row 36 (unrequested) (implements Complexity Tracking: row 36 — the web unit class runs under jsdom without @nuxt/test-utils)

## Phase 23: Convergence

This phase appends the 2026-11-10 convergence pass that follows Phase 22; its identifiers continue from `T266`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T267 HIGH — Execute the recorded SC-009 resolution A on the registered runner and attach the passing verdict — §5 of `reports/sc-009-escalation-2026-11-09.md` now records the repository owner's selection of A (2026-11-10), but `reports/sc-009-load.json` is still absent, `reports/sc-009-load-development-2026-11-08.md` still records **Verdict: FAIL — development check, not the registered verdict**, and T254, T257, T261, and T262 remain `[ ]`; provide the registered `ubuntu-24.04` runner (or an equivalent Linux host), run the `load` job — or the same profile on that host — and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`, recording the run's host, identifier, and environment in the report and the acceptance bundle, and close T254/T257/T261/T262 only on that evidence; do not lower a limit in `scripts/load/auth-smoke.mjs` and do not substitute a development run for the registered verdict, so R1's acceptance condition 4 and SC-009 close on the passing registered report per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T268 MEDIUM — Bring the TanStack Query provider's path under the fixed layout and the Ownership Map — `apps/web/app/plugins/use-query.client.ts` now carries the provider, but `docs/architecture.md:68` and the constitution's Internal layout (Frontend row) list only `apps/web/app/{pages,components,composables,stores,layouts,assets}`, and plan.md's Source Code tree (lines 3298–3313) and Ownership Map (lines 3337–3375) carry no `apps/web/app/plugins/**` row, so the tree holds a path the architecture record does not own; either add the path to the plan's Ownership Map and Source Code tree and amend `docs/architecture.md` and the constitution's Internal layout through the constitution workflow with its ADR (the layout list then names the Nuxt plugin directory), or move the provider to a location the fixed layout already names — for example the layer's `packages/ui/app/plugins/**`, which the map covers, if the layer is its right owner — and keep the unit and browser gates green, so the provider's location and the records that govern it agree per plan: Ownership Map and Constitution → Technology Standards → Internal layout (contradicts) (implements Complexity Tracking: the Ownership Map row for packages/ui/**)
- [X] T269 LOW — Align the test-stack descriptions with the delivered toolchain — `quickstart.md:357` still describes `pnpm test` as "Vitest unit + `@nuxt/test-utils` component tests", `contracts/ui-contracts.md:945` still says the structural test mounts the components with `@nuxt/test-utils`, and `plan.md:56` still names "node + `@nuxt/test-utils`" for the web unit class, while T266 removed the package and Complexity Tracking row 36 records that both Vue classes run under `jsdom` with `@vue/test-utils`; update the three sentences to the delivered stack (or point each at row 36) and leave `research.md`'s historical record as it stands, so a reader following the quickstart or the contract mounts the suite the tree actually runs per Complexity Tracking row 36 (contradicts) (implements Complexity Tracking: row 36 — the web unit class runs under jsdom without @nuxt/test-utils)

## Phase 24: Convergence

This phase appends the second 2026-11-10 convergence pass; its identifiers continue from `T269`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T270 HIGH — Produce the registered SC-009 verdict on the registered Linux runner and attach its passing report — `reports/sc-009-load.json` is absent, `reports/sc-009-load-development-2026-11-08.md` records **Verdict: FAIL — development check, not the registered verdict**, and T254, T257, T261, T262, and T267 remain `[ ]`; §5 of `reports/sc-009-escalation-2026-11-09.md` records the repository owner's selection of A (2026-11-10) and §7 records that no registered `ubuntu-24.04` runner and no equivalent Linux host is reachable from this working copy (no Docker, no WSL distribution, no Git remote, and no `gh`), so this task carries the chain's one deliverable and closes all five identifiers when it lands — provide the registered runner, run the `load` job in `.github/workflows/ci.yml` (or the same profile on that host), and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`, recording the run's host, identifier, and environment in the report and the acceptance bundle; do not lower a limit in `scripts/load/auth-smoke.mjs`, do not promote a development run to the registered verdict, and mark none of the five identifiers complete without the passing registered report, so R1's acceptance condition 4 and SC-009 close on evidence rather than on an open escalation per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T271 LOW — Stop tracking the generated run artifacts the evidence table places outside the tree — `apps/web/test-results/.last-run.json` is tracked and holds only Playwright's `{ "status": "passed", "failedTests": [] }` run marker, and `apps/web/reports/inp-user-flow.json` is tracked and rewritten by `apps/web/tests/perf/inp-user-flow.mjs`, while `.gitignore` already ignores `apps/web/reports/` and carries no `test-results/` entry and the plan's Ownership Map names neither path; remove both files from the index, add `apps/web/test-results/` to `.gitignore` beside `apps/web/reports/`, keep the working copies so a local run still writes them, and confirm that a further visual and INP run leaves the tracked tree clean, so the deliverable carries no generated run state and the INP result stays where the plan's evidence table puts it — the CI artifact, the pull request, and the acceptance release per plan: the Ownership Map and The evidence kept (unrequested) (implements Complexity Tracking: the Ownership Map row for `apps/web/tests/**`)

## Phase 25: Convergence

This phase appends the third 2026-11-10 convergence pass; its identifiers continue from `T271`, and no existing task, requirement, criterion, or success criterion moves.

- [ ] T272 HIGH — Produce the registered SC-009 verdict on the registered Linux runner and attach its passing report — `reports/sc-009-load.json` is absent, `reports/sc-009-load-development-2026-11-08.md` records **Verdict: FAIL - development check, not the registered verdict**, and T254, T257, T261, T262, T267, and T270 remain `[ ]`; §5 of `reports/sc-009-escalation-2026-11-09.md` records the repository owner's selection of A (2026-11-10) and §7 records that no registered `ubuntu-24.04` runner and no equivalent Linux host is reachable from this working copy (no Docker, no WSL distribution, no Git remote, and no `gh`), so the chain's one deliverable is still the registered run — provide the registered runner, run the `load` job in `.github/workflows/ci.yml` (or the same profile on that host), and attach the generated `reports/sc-009-load.json` with 200 accepted requests per operation, zero refusals, p50 ≤ 150 ms, p95 ≤ 1,000 ms, the work-only p95 ≤ 250 ms, the slowest query, and the post-run 21st-submission `RATE_LIMITED` probe with `Retry-After`, recording the run's host, identifier, and environment in the report and the acceptance bundle, and update the escalation report's related-task list to name this task before closing T254/T257/T261/T262/T267/T270 on that evidence; do not lower a limit in `scripts/load/auth-smoke.mjs`, do not promote a development run to the registered verdict, and mark none of the six identifiers complete without the passing registered report, so R1's acceptance condition 4 and SC-009 close on evidence rather than on an open escalation per SC-009 and plan: R1's acceptance condition 4 (missing) (implements Complexity Tracking: SC-009 is measured at 10,000 accounts, 500 concurrent sessions, and 10 authentication requests/second)
- [X] T273 HIGH — Add the negative output-encoding test AC-049 requires — `apps/web/tests/unit/supplied-values.spec.ts` mounts `CodeStep` and asserts the Arabic-Indic digits, the `bdi` runs, and their `dir` values, while `apps/web/app/components/auth/CodeStep.vue:71` renders `{{ field.value }}`; no test supplies a value typed as markup or script and asserts it is shown as text, and no test fails when that encoding is removed, so FR-045's "a test that fails when the encoding is removed" and AC-049's same clause have no evidence — add a case that renders a full name or shop name carrying markup and script (for example `<b>محمد</b>` and `<script>alert(1)</script>`), asserts the value is shown as the text it is, asserts no element or script from the value is created (no `b`/`script` node and no handler), and fails when the interpolation is replaced by an unescaped render such as `v-html`, so the encoding is guarded rather than assumed per FR-045 and AC-049 (missing) (implements FR-045, AC-049)
- [X] T274 HIGH — Measure the sign-up enumeration pair against a number outside the seed — `apps/api/test/integration/auth/enumeration.spec.ts:154-218` seeds `numberAt(index)` and then compares the `withAccount` loop's `0${numberAt(index).slice(4)}` against the `without` loop's `displayAt(index)`, and both normalize to the same E.164 (`+21893` + `2000000 + index`), so the "without" side is the seeded account too and the timing verdict compares two input formats of one account rather than a number with an account and one without; the sign-in case (lines 263-315) and the recovery case (lines 340-392) use disjoint blocks (`1000+` against `5000+`, `2000+` against `6000+`), so the sign-up case alone collapsed — move the `without` block to a range disjoint from every other case's seed and probe blocks (for example `7000+`), seed only the `withAccount` block, assert before the loop that the no-account number is absent from `users`, and keep the body/header/timing assertions, so the case measures the enumeration signal FR-006 and AC-009 name rather than the same account twice per FR-006 and AC-009 (partial) (implements FR-006, AC-009)
- [X] T275 HIGH — Reconcile the migration-step count between the specification and the plan — FR-055 (spec.md:5302) says "The migration this slice introduces MUST be one reversible step with both directions defined", AC-062 (spec.md:7319-7322) reads "it is one reversible step", and the 2026-11-04 clarification (spec.md:2219) repeats it, while plan.md:480-488 fixes "The release is two ordered reversible steps" and `packages/db/migrations/meta/_journal.json` carries `0001_identity_foundation` and `0002_identity_foundation_previous_code`, each with a paired `.down.sql`; the plan's own later sentence (plan.md:510) still says "one reversible step", so the records disagree on whether the slice introduces one step or two — either amend FR-055, AC-062, and the clarification through the specification workflow to state that each migration is one reversible step and this release carries two ordered steps (recording the change as the clarification it is), or fold the two migrations into one reversible step and update the plan, the journal, and the down-migration exercise, so the specification, the plan, and the tree state the same count per FR-055 and AC-062 (contradicts) (implements FR-055, AC-062)
- [X] T276 LOW — Align Complexity Tracking row 32 with the delivered test stack — plan.md:3617 still says "T022 wires Vitest (node plus `@nuxt/test-utils`)", while T266 removed the package and row 36 (plan.md:3621) records that the web unit class runs under `jsdom` with `@vue/test-utils`; T269 aligned plan.md:56, `quickstart.md:357`, and `contracts/ui-contracts.md:945` but left row 32's parenthetical, so a reader of the coverage-gate row mounts a package the tree no longer carries — replace the parenthetical with the delivered stack (Vitest with `jsdom` and `@vue/test-utils`, row 36) or point the row at row 36, and leave the rest of the row's account of T022 as it stands, so the plan's coverage-gate row and its deviation row state one toolchain per Complexity Tracking row 36 (contradicts) (implements Complexity Tracking: row 36 — the web unit class runs under jsdom without @nuxt/test-utils)
- [X] T277 LOW — Give the retained `reports/**` evidence a row in the plan's Ownership Map — `reports/sc-009-load-development-2026-11-08.md`, `reports/sc-009-escalation-2026-11-09.md`, `reports/t129-restore-drill.json`, and the other retained reports are written and read by T117, T129, T241, T254, and the SC-009 chain, and plan.md:3623 itself names `reports/t129-restore-drill.json`, but the Ownership Map (plan.md:3337-3390) carries no `reports/**` row, so a path the tasks and the plan touch has no owner — add a `reports/**` row naming the retained evidence, its owning feature (001-identity-foundation), that this feature writes it, and that later slices append their own reports, or move the retained reports to a path the map already owns, so every path a task touches appears in the plan's Ownership Map per plan: the Ownership Map and the evidence table (missing) (implements Complexity Tracking: the Ownership Map row for `reports/**`)
- [X] T278 LOW — Remove the generated debris no task or map owns — `sbom.cdx.json` (2.3 MB at the repository root, the SBOM the plan's evidence table places in the CI artifact) and `reports/tmp-ci-formatted.yml` (a 15 KB formatting debug copy) sit in the working tree, are ignored by no rule, and are named by no task or Ownership Map row; delete both, or add narrow ignore entries (`sbom.cdx.json`, `reports/tmp-ci-formatted.yml`) if a local run must keep them, and if the SBOM is meant to be a deliverable, give it an Ownership Map row and a task instead of leaving it at the root, so the tree carries no unrequested generated output per plan: the evidence table and the Ownership Map (unrequested) (implements Complexity Tracking: the Ownership Map row for the evidence artifacts)
