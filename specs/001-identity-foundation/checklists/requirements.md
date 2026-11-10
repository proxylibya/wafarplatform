# Specification Quality Checklist: Identity and Foundation

**Purpose**: Validate specification completeness and quality at the stage the specification's Status line names — tasks generated, ready for analysis and implementation — rather than at a gate the artifact has already cleared (planning and task generation)
**Created**: 2026-10-10
**Refreshed**: 2026-10-22 — after ADR-111 (the recovery flow's verified state, and the bare pages' state announcements), again after the fifth `/speckit.clarify` session of that date (five answers; see Notes), again after the sixth session of that date (five answers; ADR-114), and again after the seventh session of that date (five answers; ADR-115); 2026-10-24 — the Assumptions' scale sentence now names `docs/capacity-model.md` as the planning authority (no requirement, criterion, or count changed); 2026-10-27 — the frame's fourth surface (the bottom bar), the drawer's opener and closer, and the footer's narrow-screen rule; 2026-10-27 (second session) — the footer band's surface authority, FR-052's position and citations, and the locked state's copy; 2026-10-27 (third session) — FR-052 moves after FR-051 and names ADR-127 and ADR-128; 2026-10-27 (correction) — ADR-132 corrects the first-visit appearance to the device preference and reverses the bar's visibility to scroll-hide, and the two stale Clarifications answers were corrected to FR-025 and FR-052 (no identifier or count changed); 2026-10-28 — ADR-137 restores the light default and the outline icon cut, and adds the page-size default (20) and the focus line (no identifier or count changed); 2026-10-29 — ADR-139's repair set: US7 raised to P1, FR-053 and AC-056 added for merchant-scoped access, R2 named as the first page carrying the frame, `EX-007` recorded for US5's structural verification, the account fields cited to ADR-105, the binding block completed, and the two deviations (the frame's runtime coverage, the measurement ceiling) named where the specification states them; 2026-10-29 (fourth session) — the live counts corrected to 53 FR / 56 AC, the 2026-10-21 R4 references corrected to R2, and the numeric-order claim corrected to the subject grouping (no identifier changed); 2026-10-30 — the four answers of that date re-read against this checklist: the plan-only email sentinel (the specification's own invariant is unchanged), FR-048 and AC-052's six merchant-area destinations against FR-039's nine, FR-020's definition of "public pages", and FR-024's 1024 CSS px presence rule with its four links in the drawer below that width (no identifier or count changed); 2026-10-31 (second session) — AC-031 bounded to a submission the account-creation rate limit does not refuse first, so it cannot be read against FR-051 and AC-055 (no identifier or count changed); 2026-10-31 (third session) — regenerated against the four amendments the specification now carries: the Status line ("Tasks generated — ready for analysis and implementation", and this checklist's own review point moved with it), the AC-056 numbering (AC-056 is the fifty-sixth criterion, contiguous with AC-001 … AC-055, and sits in a cross-cutting group no user story's Acceptance Scenarios line names), the page-name mapping ("sign-in" reads the registered "Log In" page, "sign-up" reads "Sign Up", "password recovery" reads "Forgot Password", "error page" reads "404", stated once in the Assumptions and used everywhere), and AC-031's bound to a submission the rate limit does not refuse first (carried into the criterion, the hidden-field edge case, the Test Coverage Request, AC-033, and AC-055). No requirement, criterion, or count changed: 53 FR, 56 AC, 9 SC; 2026-10-31 (fourth session) — the three Independent Test paragraphs of US4, US5, and US6 were restated to claim only what each story verifies without another story and to name the registered exception covering its one test over a delivered surface (`EX-008` for US4's blocked-account half over US2's sign-in surface, `EX-009` for US5's bare-page end-to-end test over the pages US1 and US3 deliver, and `EX-010` for US6's tests over US2's and US3's behaviour), with US5's `EX-007` citation kept; no requirement, criterion, identifier, or count changed: 53 FR, 56 AC, 9 SC; 2026-11-01 (thirteenth session) — the I1a finding closed the gap between AC-044 and `EX-009`: the criterion reaches the three bare pages this slice ships — sign-up (US1), sign-in (US2), and password recovery (US3) — and T099 is its only test, so the exception's scope now names all three and its closing sentence names US2, while US5's Independent Test states the same three pages; no requirement, criterion, identifier, or count changed: 53 FR, 56 AC, 9 SC; 2026-11-02 — AC-057 and AC-058 added as cross-cutting criteria for the no-email invariant and the no-cap session rule (Session 2026-11-02 (2)); no existing identifier moved, and the live counts read 53 FR, 58 AC, 9 SC; 2026-11-04 (operations session) — FR-054 and FR-055 added with AC-059 … AC-062 for the state across a restart, a deployment or migration, a restore within the recovery point, and a release rollback, with a new Assumption naming the R12, R13, and R15 split (Session 2026-11-04 (10)); no existing identifier moved, and the live counts read 55 FR, 62 AC, 9 SC
**Feature**: [spec.md](../spec.md) — 55 functional requirements, 62 acceptance criteria, 9 success criteria

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] AC-031's bound is stated once and repeated identically wherever the rule is
      carried — the criterion itself, the hidden-field edge case, the Test Coverage
      Request, AC-033, and AC-055 — so the hidden field's silence is asserted only
      for a submission the account-creation rate limit does not refuse first, and
      an over-budget submission is asserted to receive the distinct limit refusal
      whatever else is wrong with it, a filled hidden field included
      (Spec §AC-031, §FR-051)

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] The P1 set satisfies every applicable MUST — the rate limit and the three
      access controls (US7: FR-033, FR-044, FR-045, FR-046) gate the P1
      checkpoint, so the first browser-facing feature does not ship without them
      (ADR-139)
- [x] The Status line names the stage the artifacts have actually reached, and
      every review-point sentence that reads it agrees — no checklist, plan, or
      task statement still presents planning or clarification as the next gate
      (Spec §Status)
- [x] AC-056 is the fifty-sixth criterion, contiguous with AC-001 … AC-055, and
      the group it sits in is declared where a reader meets it: the Acceptance
      Criteria section announces its cross-cutting group and the traceability
      records name the criterion, so its absence from every user story's
      Acceptance Scenarios line reads as a grouping rather than as a missing or
      dangling criterion (Spec §AC-056)
- [x] No implementation details leak into specification

## Constitutional Compliance

- [x] No requirement asserts an answer the constitution reserves to another
      slice — the five open rows of the constitution's Unresolved product
      facts (`expires_at` → R15, notification retention
      → R9, the message sender and the `Conversation` administrator reference →
      R10, the multi-separator printed price → R3) are untouched
- [x] The specification adds nothing outside the four registers — no page
      beyond the twenty-eight, no entity beyond the twelve, no product feature
      beyond the sixteen, and no role beyond the three — and the twenty-eight-page
      register is not amended by this specification (ADR-126 amended it, and the
      item list's ninth destination is carried by FR-039, AC-042, and US5)
- [x] No requirement contradicts an accepted decision record
- [x] Identifiers are contiguous, stable, and never reused — FR-001 … FR-055,
      AC-001 … AC-062, SC-001 … SC-009, with no gap, no renumbering, and no
      dangling reference
- [x] The page-name mapping is stated once and holds across the document — the
      prose's "sign-in" reads the registered "Log In" page, "sign-up" reads
      "Sign Up", "password recovery" reads "Forgot Password", and "error page"
      reads "404" — so no FR, AC, SC, or Clarifications entry introduces a second
      name for a registered page or a page of its own (Spec §Assumptions)
- [x] Every user story is independently testable and deliverable, and each
      crossing the repaired Independent Test paragraphs name is governed rather
      than claimed away: US4 verifies its status read, retained data, and
      delete-path absence without another story, while the blocked-account half
      of its status test — the withdrawn session included — runs over US2's
      sign-in and session-read surfaces under `EX-008`; US5 verifies the frame's
      composition structurally without another story under `EX-007`, while its
      bare-page end-to-end test opens the three bare pages this slice ships (US1,
      US2, US3), covering AC-023, under `EX-009`, and its supplied-values test
      (T133) exercises the A8 shared code step, not US1's code; US6 verifies
      provisioning and the forced change with its own fixtures, while the tests
      over US2's sign-in, lock, revocation, and notice behaviour and US3's
      recovery role refusal,
      covering AC-029, are covered by `EX-010`; US7's hidden `website` field in
      `SignUpForm.vue` (T081), its refusal order applied in `sign-up.ts` and
      `session.ts` (T080), its rate limits (T074), its security middleware
      (T076), and its no-CAPTCHA rule (T077) live on US1's and US2's surfaces and
      are covered by `EX-011`; US3's `recovery.ts` is the Polish T137, so no
      story crossing remains there. Each exception names the repository
      owner as approver and carries 2026-12-01 as the review date; `EX-008`,
      `EX-009`, `EX-010`, and `EX-011` end at R1's acceptance, and `EX-007` ends
      when R2 renders the frame and verifies its runtime, its accessibility scan,
      and its keyboard-only pass (ADR-139)
- [x] The specification names no framework, library, database, product, or
      architectural pattern

## Review against the 2026-11-01 changes (I1, U1, A1, C1, C2)

This section records the re-examination of the 27 items above against the
2026-11-01 changes. No checkbox item became stale: each remains true or remains
open for the reason it was opened. One Notes sentence is superseded, and two
gaps are recorded here rather than edited:

- The 2026-10-31 note's "At 320 CSS px the header keeps all four controls in one
  row" states the merchant's composition; A1 states the guest's three beside it,
  so the sentence is incomplete as a statement of the current rule.
- The 2026-10-31 note's emoji sentence is extended, not stale: U1 fixes the
  predicate FR-026 now carries.
- No note records I1's third password message or C2's operational boundary; the
  new items below carry both.

The 2026-10-31 (third session) note's "27 items, 23 checked" count is stale: the
file carried 27 items but 24 checked before this section, and it now carries 32
items with 24 checked, because every new item is unchecked.

### New items

- [x] The password policy's shape is stated once and its numbers are delegated
      once — FR-035 names the minimum, the maximum, and the common-or-breached
      rejection, AC-037 asserts all three, and the plan's CMV 17 supplies only
      the two numeric values (Spec §FR-035, §AC-037; Plan CMV 17; change I1)
- [x] The no-emoji rule has one predicate — FR-026 fixes
      `Extended_Pictographic`, U+FE0F, and U+20E3 — and every requirement that
      refuses a supplied value or renders one cites it rather than restating it
      (Spec §FR-026, §FR-001, §AC-046; change U1)
- [x] The 320 CSS px header rule states both compositions — the merchant's four
      controls and the guest's three — and AC-025 asserts both, so neither is
      read as the other's exception (Spec §FR-023, §AC-025; change A1)
- [x] The lock's two fields are stated as the account's, with one owning module
      and one writer, so FR-009's increment, clear, and lift rules cannot be
      implemented against a second store (Spec §FR-009, Key Entities; Plan
      §data-model §4; change C1)
- [x] The operational duties this slice does not ship — the three environments,
      the error tracker, the secret manager, TLS, the log pipeline, and
      monitoring and alerting — are assigned to R12 with R1's contract-only
      boundary stated, so no requirement implies R1 delivers them (Plan
      §Technical Context; ROADMAP R12; change C2)

## Review against the 2026-11-01 repair pass (C1, D1, E1, F1, G1)

This section records the re-examination of the 32 items above against the repair
pass that gave the silent hidden-field refusal a stated mechanism (C1, record 15,
T142), carried the guest's three header controls into the contract (D1), fixed
the module layout the tasks build (E1), completed the documentation tree (F1),
and numbered the Complexity Tracking table (G1). It appends one item, unchecked,
and does not delete, reword, or mark any existing item.

### New item

- [x] The plan's bookkeeping states fifteen decision records and a Complexity
      Tracking table of twenty-six numbered rows; does every count a document
      states read fifteen for the records — five already recorded as ADR-141 to
      ADR-145, ADR-146 consuming them, ten appended at implementation, record 15
      by T142 — and does every deviation the plan records carry its own numbered
      row with an owner and a review date, so no deviation is described in prose
      while its row is missing and no row is cited by a number the table does
      not hold? (Plan §Constitution Check → Documentation, §Complexity Tracking,
      §Decision records this plan introduces; changes C1, G1)

The 2026-10-31 (third session) note's "27 items, 23 checked" count was already
stale, and the "32 items with 24 checked" sentence above it had drifted with the
items later passes appended: the file carried 32 items, every one checked,
before this section, and it now carries 33 items with 32 checked, because the
new item is unchecked (corrected by the 2026-11-01 review recorded in the Notes:
the thirty-third item is marked, so the file carries 33 items, every one checked).

## Notes

- Items marked incomplete require spec updates before `/speckit.analyze` or
  `/speckit.implement`, the gates the Status line leaves open.
- No `[NEEDS CLARIFICATION]` markers were raised. The three boundary questions
  the feature description left implicit were resolved from the binding sources
  and recorded in Assumptions instead: where the shared frame renders at this
  slice (the frame is delivered for the public and merchant scopes; this slice's
  own pages are all bare), that the static and error pages arrive with a later
  slice while this slice binds the frame's absence from them and provides the
  reachability surface, and that the base project's technical composition is a
  plan matter rather than a specification matter.
- FR-001 … FR-055 (55 requirements) are each covered by at least one AC;
  AC-001 … AC-055 are grouped under the seven user stories they serve, and
  AC-056 … AC-062 sit in cross-cutting groups after them — AC-056 for
  merchant-scoped access, AC-057 and AC-058 for the entity invariants, and
  AC-059 … AC-062 for operational state across restarts, releases, and recovery
  — so the sixty-two criteria run contiguous from 001 to 062, each cites its
  functional requirement, and each is referenced by at least one task — the four
  operational criteria by the integration tasks the next `/speckit.tasks` pass
  adds, which the Test Coverage Request already requests.
  SC-001 … SC-009 are numeric and technology-agnostic.
- The spec names only entities registered in `docs/domain-model.md` (`User`,
  `Session`). The fixed Libyan city list is treated as reference data, not an
  entity, because no entity is registered for it. The pending verification
  state is recorded in `docs/domain-model.md` as transient, non-entity state
  owned by the `users` module (→ "Transient verification state (not an
  entity)"), and the account-level amendment's content is named explicitly as
  exactly three fields on `User` — in the register's `User` row and in the
  model's `User` invariants, both moved by ADR-105, which is the amendment this
  checklist previously asserted before it existed.
- Refreshed 2026-10-20: ADR-094 aligned the guest header rule, and ADR-096
  added the three Constitution Mandated Values (password policy, one-time-code
  limits, and field lengths) and bound the frame's static-page link surface,
  which this specification records as a footer band (FR-024). The three boundary
  clarifications above remain the only clarifications; no new
  `[NEEDS CLARIFICATION]` marker was raised, and the requirement and criterion
  counts are unchanged.
- Refreshed 2026-10-21: ADR-097 fixed the Wafar UI layer path at `packages/ui`,
  moved the frontend layout to Nuxt 4 `app/`, and amended the constitution to
  3.3.0; ADR-098 recorded IconPark (vendored), IBM Plex Sans Arabic, the light
  default, and the marine/sand palette. The spec remains product-level; the R1
  plan records the technical choices and fills CMV row 11.
- Refreshed 2026-10-21 (second time): ADR-099 fixed the shared shell's header
  and account menu — the header carries only the logo/home and account controls,
  the account control opens the «حسابي / إعدادات / تسجيل الخروج» menu with a
  yes-or-no sign-out confirmation, the theme switch and the sidebar-collapse
  control sit in the sidebar, and «إعدادات» is a section inside the Profile page.
  FR-047 and AC-051 were added; the frame's checks now assert the new
  composition.
- Refreshed 2026-10-21 (fifth time): ADR-102 moved the theme switch out of the
  sidebar and into the header, immediately beside a notifications control that
  carries the unread count, and restored the crescent glyph of the registered
  IconPark set for the switch. FR-020, FR-023, FR-025, FR-039, AC-022, AC-025,
  AC-027, and AC-042 now assert the new header composition; the default
  appearance stays light (ADR-098), and no `[NEEDS CLARIFICATION]` marker was
  raised, and the requirement and criterion counts are unchanged. **Corrected
  2026-10-27:** ADR-132 replaces that default with the device preference
  (`system`); FR-025 carries the current rule.
- Refreshed 2026-10-21 (third time): the `/speckit.clarify` session answered five
  questions and ADR-100 recorded the answers — the two landing points of the
  account items, the sign-out-everywhere action in the Profile page's settings
  section (the constitution moved to 3.5.0), the sign-in redirect a guest gets
  from a merchant-area sidebar item, the explicit state the frame shows when a
  session ends or an account is blocked, and the administrator application's own
  header. FR-048 … FR-050 and AC-052 … AC-054 were added; no
  `[NEEDS CLARIFICATION]` marker was raised, and every requirement is covered by
  at least one criterion.
- Refreshed 2026-10-21 (fourth time): a second `/speckit.clarify` session
  answered five more questions and ADR-101 recorded the answers — the background
  and its colour are a fixed Wafar UI layer value and no product setting; the
  account menu closes on Escape, on an activation outside it, or on a focus loss,
  with the focus returning to the account control; «حسابي» shows the full name,
  the city, and the account status and no other field; the merchant sees the
  ended-session state after confirming the sign-out; and the account control's
  accessible name is «حسابي». FR-023, FR-025, FR-047, FR-049, AC-022, AC-025,
  AC-051, and AC-053 carry the rules. The constitution stays at 3.5.0, the
  requirement and criterion counts are unchanged at 50 FR and 54 AC, and no
  `[NEEDS CLARIFICATION]` marker was raised.
- Refreshed 2026-10-21 (sixth time): a third `/speckit.clarify` session answered
  eight questions and corrected the contradictions four earlier sessions left
  behind. The sign-out control belongs to the frame — the account menu's third
  item and its confirmation are built and verified structurally here, and only
  the runtime behaviour lands with R4 (ADR-099 decision 6) — which replaces the
  stale Assumption, FR-041's wording, and US2's Independent Test. FR-029's
  hidden-field refusal now guarantees the response alone, with the flow stopping
  at it, so the three statements that could not hold together now do. FR-020
  records the icon set ADR-098 already chose instead of choosing it again.
  FR-048, FR-049, AC-027, AC-052, and AC-053 gained the deferral clause their
  neighbours already carried, so none of them asserts runtime behaviour this
  slice cannot exercise. FR-024, AC-026, and the matching Assumption record
  that the static pages' reachability requirement is discharged by R4 and that
  R1's plan records the deferral in its Complexity Tracking table with an owner
  and a review date. FR-018 and AC-020 no longer name the retention job as a
  removal path for account data. The two implementation details the file named
  are gone, and the transient verification store and the three new `User` fields
  are recorded where a reviewer can read them. The requirement and criterion
  counts are unchanged at 50 FR, 54 AC, and 9 SC; no identifier was renumbered
  or reused; no `[NEEDS CLARIFICATION]` marker was raised; and the six
  constitutional checks above were added to cover what the earlier checklist
  omitted. (Corrected 2026-10-29 by ADR-139: the first page carrying the frame is
  R2, not R4, so the runtime behaviour and the static pages' reachability are
  discharged there; R4 is the first table.)
- Refreshed 2026-10-21 (seventh time): the same session continued. The four
  acceptance criteria that three earlier sessions had appended to the end of the
  specification's last section — the account menu, the guest's redirection, the
  ended-session state, and the administrator application's header — were moved
  to the user stories they serve: the first three to US5, the fourth to US6.
  The ordinals were renumbered in document order and the seven "Acceptance
  Scenarios" lines were rewritten from the actual grouping, so the grouping
  this checklist claims is now the grouping the file carries. The Functional
  Requirements section states that the requirements are grouped by subject
  rather than by identifier and that an identifier is stable for the life of
  the feature, so a reader does not mistake the order for a numbering. FR-032,
  the `Session` entity, and the matching clarification describe the session's
  browser-held reference in the constitution's own terms: the browser retains
  the reference that proves the session, and the session itself is never
  recoverable from browser storage. The requirement and criterion counts are
  unchanged at 50 FR, 54 AC, and 9 SC; no identifier was renumbered or reused;
  and no `[NEEDS CLARIFICATION]` marker was raised.
- Refreshed 2026-10-21 (eighth time): ADR-105 made the sixth refresh's last
  claim true. The transient verification store and the three account-level
  `User` fields are now recorded where a reviewer can read them — the register's
  `User` row names the three fields, and `docs/domain-model.md` carries their
  invariants plus a "Transient verification state (not an entity)" section owned
  by the `users` module, so the register stays at twelve entities. The
  constitution moved to 3.7.0 (MINOR: a register expanded). No requirement,
  criterion, or identifier changed.
- Refreshed 2026-10-22: a `/speckit.clarify` session answered two more questions
  and ADR-111 recorded the answers — the one-time code stops being usable the
  moment it is verified in password recovery, the pending request moves to a
  single-use verified state that carries the new-password step and lasts no
  longer than the request's own lifetime, a reload at that step resumes it, and
  setting the password ends the state so the same code cannot authorise a second
  reset; and the in-progress state, the inline failure message, and the in-place
  confirmation are announced to assistive technology, with focus moving to the
  step now shown rather than remaining on a removed control. FR-014, FR-034,
  FR-038, FR-040, AC-036, AC-041, AC-043, SC-006, the key-entities note, US3's
  Independent Test, two edge cases, the Test Coverage Request, and
  `docs/domain-model.md`'s transient-verification-state section carry the rules.
  The requirement and criterion counts are unchanged at 50 FR, 54 AC, and 9 SC;
  no identifier was renumbered, reused, or withdrawn; no `[NEEDS CLARIFICATION]`
  marker was raised; and every checkbox above stays checked.
- Refreshed 2026-10-22 (second time): the fifth `/speckit.clarify` session of
  that date answered five questions that the earlier sessions had left open, and
  ADR-112 recorded the answers; each answer was applied to the sections that
  carry its rule. The code step no
  longer shows back "the fields the person filled in": FR-038 and AC-041
  enumerate the fields it shows — the full name, the mobile number, the city, and
  the optional shop name — and state that the password is never re-displayed,
  echoed, or rendered masked, so a submitted password cannot return to the
  browser. The administrator's first sign-in is delivered here as behaviour with
  no page, exactly as FR-013's change-password action is, so AC-030's assertion
  that the forced-password-change requirement is cleared by the change made at
  that first sign-in is exercisable in this slice; FR-028, AC-030, US6's
  Independent Test, the administrator Assumption, an edge case, and the Test
  Coverage Request carry the bound, and only the sign-in surface stays with the
  later slice. A status or role refusal now performs the same verification work
  as any other sign-in attempt and is refused afterwards on that ground, which
  brings FR-017 into line with FR-009's wording and with FR-008 and SC-004's
  timing uniformity; AC-009, AC-019, AC-029, SC-004, an edge case, and the Test
  Coverage Request assert it. The pending request now ends once the platform has
  stated an outcome it cannot complete, at sign-up for a number that already has
  an account as well as in the recovery flow, so no live request or usable code
  survives a reported outcome; FR-006, FR-034, AC-006, the key-entities note, an
  edge case, and the Test Coverage Request carry the rule. Finally, the coverage
  target names its scope: 80% of the changed production lines this slice
  introduces, excepting the frame's runtime behaviour it defers to the first
  frame-carrying slice, which that slice covers. AC-022's stale clause about the
  icon set being chosen here was corrected against FR-020 and ADR-098, which
  record that the set is already chosen and that this slice records it in the
  technology register. The requirement and criterion counts are unchanged at 50
  FR, 54 AC, and 9 SC; no identifier was renumbered, reused, or withdrawn; no
  `[NEEDS CLARIFICATION]` marker was raised; all 50 FRs remain cited by at least
  one AC and every AC still cites at least one FR; and every checkbox above
  stays checked.
- Refreshed 2026-10-22 (third time): a sixth `/speckit.clarify` session answered
  five questions and ADR-114 recorded the answers. The administrator's forced
  first change must set a value different from the initial password, so the
  reuse allowance no longer makes the requirement vacuous. The pending sign-up
  request holds the submitted password only in the same irreversibly protected
  form a stored password has, computed at submission, so no plaintext password is
  retained and the account is still created from it after verification. A
  submission's refusals are decided in one fixed order — the rate limit, the
  hidden field, the minimum time, the value rules, then account existence — so
  each criterion asserts one refusal. A failed re-request of a one-time code
  leaves the previous code valid, the request live, and the re-request limit
  untouched. The forced first change ends every session, including the restricted
  one it was made from, and sends the security notice. FR-013, FR-028, FR-034,
  FR-035, FR-038, FR-043, and the new FR-051 carry the rules; AC-030, AC-036,
  AC-037, AC-041, AC-047, and the new AC-055 assert them, with US6's Independent
  Test, two Assumptions, the Key Entities note, two edge cases, and the Test
  Coverage Request. `docs/domain-model.md` is corrected in the same change — the
  transient store's protected password, the dispatch-conditioned code
  replacement, and the forced change's session and notice. The counts become 51
  FR, 55 AC, and 9 SC; no identifier was renumbered, reused, or withdrawn; every
  FR is cited by at least one AC; and all 22 checkboxes above stay checked.
- Refreshed 2026-10-22 (fourth time): a seventh `/speckit.clarify` session
  answered five questions and ADR-115 recorded the answers — the ended-session
  state, the send-failure boundary, the counted code, the replaced verification,
  and the forced change's current-password check. The counts stay 51 FR, 55 AC,
  and 9 SC; no identifier was renumbered, reused, or withdrawn; every FR is cited
  by at least one AC; and all 22 checkboxes above stay checked.
- Refreshed 2026-10-24: the Assumptions' scale sentence now states the
  measurement condition for SC-009 and names `docs/capacity-model.md` as the
  planning authority for the platform envelope, so the plan's `Scale/Scope`
  starts from that model and records this feature's condition and any deviation
  instead of treating 10,000 accounts / 500 sessions / 10 authentication requests
  per second as the platform's sizing ceiling. No requirement, criterion,
  identifier, or count changed.
- Refreshed 2026-10-25: ADR-126 amended the Product Register with the Upload
  Catalog page (the register's twenty-eighth page and the sidebar's ninth
  destination at route `/upload`), so FR-039, AC-042, and US5 carry the
  nine-item list, the page-count claims above read twenty-eight, and the
  checklist item marks the register as amended by ADR-126 rather than by this
  specification. No requirement, criterion, or identifier changed (counts stay
  51 FR, 55 AC, and 9 SC); all 22 checkboxes above stay checked.
- Refreshed 2026-10-27: the `/speckit.clarify` session recorded the frame's
  fourth surface. FR-052 fixes the bottom navigation bar — shown below 1024px,
  absent from 1024px up, with five slots (Home, Upload Catalog, a raised search
  action to the Parts page, My Files, and «المزيد»), one composition shown
  identically to a guest and to a signed-in merchant, and a guest's merchant-area
  slot taking them to sign-in while the slot stays present and enabled. FR-022
  now says «المزيد» opens the drawer and the collapse control closes it; FR-024
  hides the footer band on a narrow screen and puts its four links at the bottom
  of the drawer; FR-021 and AC-023 add the bar to the bare pages' absence;
  AC-022, AC-024, AC-026, AC-042, US5, the edge cases, SC-005, the Test Coverage
  Request, and the frame Assumption carry the rule. The counts become 52 FR,
  55 AC, and 9 SC; no identifier was renumbered, reused, or withdrawn; every FR
  is cited by at least one AC; and all 22 checkboxes above stay checked.
- Refreshed 2026-10-27 (second session): a `/speckit.clarify` session answered
  three questions. The surface that carries the four static-page links is a
  constitutional fact (ADR-096), so FR-024 and AC-026 now state that this slice
  builds the fixed footer band and that its decision record fixes the routes
  alone, rather than claiming that this slice chooses the surface; the
  Assumptions bullet and the two earlier Clarifications bullets that asserted a
  choice carry revision notes. FR-052 then kept its place beside the frame
  requirements it qualified — the section's reading note groups requirements by
  subject, so position was not numbering — and cited ADR-127 for the fourth
  surface and its five slots and ADR-128 for the labels, measurements, and icon
  treatment being fixed design values; the third session of this date supersedes
  that placement and restates the citations. The locked sign-in state carries no
  copy
  of its own: the one uniform failed-sign-in message is the only text shown, no
  alert, banner, field message, or retry-time hint names the lock, and the design
  reference's lockout alert is not carried into the product; FR-009, AC-010, the
  matching edge case, and the Test Coverage Request carry the rule, while the
  message's wording is a design value the plan records. No identifier was added,
  renumbered, reused, or withdrawn; the counts stay 52 FR, 55 AC, and 9 SC; every
  FR is cited by at least one AC; and all 22 checkboxes above stay checked.
- Refreshed 2026-10-27 (third session): FR-052 moves out of the frame group and
  now follows FR-051, so no requirement sits inside another requirement's block;
  it states that the bar is always visible — it does not hide on scroll and the
  page reserves its height, because the design reference's scroll-hide is not
  transferred — and it names ADR-127 for the five slots, the drawer behaviour,
  the always-visible bar, and the reserved height, and ADR-128 for the labels,
  measurements, and icon treatment. **Corrected 2026-10-27:** ADR-132 reverses
  that rule — the bar hides after 32px of cumulative downward scroll, returns on
  the first 16px of upward scroll or within 56px of the top, and the page does
  not reserve its height while the bar is hidden; FR-052 carries the current
  rule. FR-022 and AC-026 keep their references to
  FR-052, the Functional Requirements reading note now describes the placement
  rule instead of naming FR-052 as sitting beside FR-024, and the second session's
  note above carries a revision note. No identifier was added, renumbered,
  reused, or withdrawn; the counts stay 52 FR, 55 AC, and 9 SC; every FR is cited
  by at least one AC; and all 22 checkboxes above stay checked.
- Refreshed 2026-10-27 (correction): ADR-132 supersedes the first-visit
  appearance fixed earlier in this checklist and the bar's always-visible rule.
  The default is the device preference (`system`), with a stored choice winning
  (FR-025), and the bar hides after 32px of cumulative downward scroll and
  returns on the first 16px of upward scroll or within 56px of the top (FR-052).
  The two stale Clarifications answers in `spec.md` were corrected in the same
  change. No identifier was added, renumbered, reused, or withdrawn; the counts
  stay 52 FR, 55 AC, and 9 SC; every FR is cited by at least one AC; and all 22
  checkboxes above stay checked.
- Refreshed 2026-10-28: ADR-137 restores the light default and the outline icon
  cut, and it adds the page-size default (20) and the focus line to the layer's
  record. FR-025 carries the appearance rule; the checklist's earlier
  `system` note is superseded, not deleted. No identifier was added,
  renumbered, reused, or withdrawn; the counts stay 52 FR, 55 AC, and 9 SC;
  every FR is cited by at least one AC; and all 22 checkboxes above stay
  checked.
- Refreshed 2026-10-29 (second session): a `/speckit.clarify` session answered
  one question — a password change made from any other path (the account's own
  change action or the administrator's forced first change) ends a live
  password-recovery request and its verified new-password state, so a reset
  authority created before the change never survives it, while a successful
  sign-in alone does not end the request. FR-013, FR-014, FR-034, AC-016, the
  Key Entities note, an edge case, the Test Coverage Request, and
  `docs/domain-model.md`'s transient-verification-state section carry the rule.
  No identifier was added, renumbered, reused, or withdrawn; the counts stay
  52 FR, 55 AC, and 9 SC; every FR is cited by at least one AC; and all 22
  checkboxes above stay checked.
- Refreshed 2026-10-29 (third session): ADR-140 split the administrator block
  into R13 (the gate: application, shell, login, `AuditLog` recorder, Settings,
  Users), R14 (the audit-log page), R16 (catalog management) and R17
  (communication and oversight), and left R15 untouched. This specification
  changes only its feature-to-slice sentence — the Admin Application is now
  R13, R16 and R17 — and its live range string. No requirement, criterion, or
  identifier was added, renumbered, reused, or withdrawn, and the counts are
  unchanged; every FR remains cited by at least one AC; and every checkbox above
  stays checked.
- Refreshed 2026-10-29 (fourth session): the live count block is corrected to
  53 FR and 56 AC, the counts ADR-139's FR-053 and AC-056 produce; the notes
  that state 52 FR / 55 AC predate those two identifiers. The sixth-time note's
  R4 references are corrected to R2 above, and the specification's clarification
  that FR-052 makes the requirements read in numeric order is corrected to say
  the list stays grouped by subject, with FR-052 outside another requirement's
  block; the slice map carries the same correction. No identifier was added,
  renumbered, reused, or withdrawn; every FR is cited by at least one AC; and
  every checkbox above stays checked.
- Refreshed 2026-10-31: a `/speckit.clarify` session answered five questions and
  applied each answer to the sections that carry its rule. The language and
  numeral rules are bounded to the platform's own text, so a supplied name or
  shop name is shown in the script and digits it was typed with (FR-001, FR-026,
  FR-038, SC-008, AC-028); the no-emoji rule is not bounded that way — it covers
  every text a person reads, so a value carrying an emoji is refused at input
  with an explicit message and joins the value rules of FR-051 (FR-001, FR-026,
  FR-051, AC-028, AC-046, and the provisioning Assumption). Activating a
  navigation item inside the open drawer closes it, navigates, and settles the
  focus on the destination page's heading rather than on «المزيد», while the
  bottom bar stays visible under the open drawer (FR-022, FR-048, FR-052,
  AC-024). At 320 CSS px the header keeps all four controls in one row, with the
  wordmark at its smallest recorded form and no control dropped or moved into a
  menu (FR-023, AC-025, SC-006). The ended-session state is announced and moves
  the focus to its heading (FR-049, AC-053, SC-006). AC-042 now asserts FR-052's
  scroll rule and records its verification by R2, so the rule is no longer
  unasserted. No identifier was added, renumbered, reused, or withdrawn; the
  counts stay 53 FR, 56 AC, and 9 SC; every FR is cited by at least one AC; and
  every checkbox above stays checked.
- Refreshed 2026-10-31 (second session): a `/speckit.clarify` session answered one
  question — AC-031's silent response was stated unconditionally, while FR-051 and
  AC-055 decide the operation's rate limit first, so the two criteria could be read
  as conflicting. AC-031 is now bounded to a submission the account-creation rate
  limit does not refuse first, and it states in the same criterion that an
  over-budget submission receives the distinct limit refusal whatever else is
  wrong with it, a filled hidden field included; the matching edge case and the
  Test Coverage Request carry the same bound, and FR-029, FR-033, and FR-051 are
  unchanged because FR-029 speaks only of a submission the hidden field refuses.
  No identifier was added, renumbered, reused, or withdrawn; the counts stay
  53 FR, 56 AC, and 9 SC; every FR is cited by at least one AC; and every
  checkbox above stays checked.
- Regenerated 2026-10-31 (third session) on the four points the specification
  amended, and the regeneration records its findings rather than passing them.
  (1) The Status line leaves `/speckit.analyze` and `/speckit.implement` open, so
  the review point at the head of this checklist and the Notes' own gate sentence
  were stale; both now name those commands. (2) AC-056 is the fifty-sixth
  criterion and the count block reads 53 FR / 56 AC / 9 SC; the earlier claim that
  the criteria are "grouped under their user stories" is corrected above, because
  AC-056 sits in a cross-cutting group after the seven stories and no user story's
  Acceptance Scenarios line names it — the grouping, and whether the Acceptance
  Criteria section should announce that group, is left as an open question for the
  reviewer rather than passed. (3) The page-name mapping is verified: the four
  registered names "Log In", "Sign Up", "Forgot Password", and "404" appear only
  in the Assumptions bullet that maps them, and no FR, AC, SC, or Clarifications
  entry introduces a second name for a registered page or a page of its own.
  (4) AC-031's bound is verified as carried into the criterion, the hidden-field
  edge case, the Test Coverage Request, AC-033, and AC-055, with FR-029 unchanged
  because it speaks only of a submission the hidden field refuses. Four items were
  added unchecked (the file carries 27 items, 23 checked), so the earlier notes'
  "every checkbox above stays checked" sentences describe the set each was written
  against. No requirement, criterion, identifier, or count changed, and
  `node governance-drift-check.mjs` reports the feature's identifiers sound at
  53 FR, 56 AC, and 9 SC.
- Refreshed 2026-10-31 (fourth session): the analyze pass's C2 finding read the
  User Stories' Independent Test paragraphs against Principle VIII and found that
  US4, US5, and US6 each claimed full isolation while carrying one test that
  necessarily runs on another story's delivered surface, with no exception named
  there. Only those three paragraphs were rewritten. US4 now states that its
  status read, retained data, and delete-path absence are verified without
  another story, and that the blocked-account half of its status test — the
  withdrawn-session assertion included — runs through US2's sign-in and
  session-read surfaces under `EX-008`. US5 keeps its `EX-007`
  citation for the composition verified structurally without another story, and
  names `EX-009` for the bare-page end-to-end test that opens the pages US1 and
  US3 deliver, covering AC-023. US6 states that provisioning and the
  forced-change behaviour are verified with the story's own fixtures, and names
  `EX-010` for the tests over US2's sign-in, lock, revocation, and notice
  behaviour and US3's recovery role refusal, covering AC-029. The four
  exceptions registered by that pass are recorded in
  `.specify/templates/exception-register.md` with the repository owner as
  approver and a 2026-12-01 review date. No requirement, criterion, or success
  criterion was added, no FR, AC, or SC identifier moved, and the wording stays
  technology-agnostic; the counts stay 53 FR, 56 AC, and 9 SC, and
  `node governance-drift-check.mjs` reports the feature's identifiers sound.
- Refreshed 2026-10-31 (fifth session): the analyze pass's C3 finding moved the
  shared code step into A8 and registered US7's crossing as `EX-011`. Item 75 now
  states that the withdrawn session is inside `EX-008` and names `EX-011`; no
  requirement, criterion, identifier, or count changed, and
  `node governance-drift-check.mjs` reports the register at eleven rows.
- Refreshed 2026-11-01 (thirteenth session): the I1a finding read AC-044
  against `EX-009` and found the exception's scope short by one page — the
  criterion reaches sign-up, sign-in, and password recovery, and T099 is its
  only test, while the scope said "the three bare pages US1 and US3 deliver",
  which names two. The scope now reads "T099 … on the three bare pages this
  slice ships — sign-up (US1), sign-in (US2), and password recovery (US3)", its
  closing sentence names US2 beside US1 and US3, and US5's Independent Test
  states the same three pages. Item 75 carries the corrected scope. No
  requirement, criterion, success criterion, identifier, or count changed —
  53 FR, 56 AC, 9 SC — and `node governance-drift-check.mjs` reports the
  feature's identifiers sound.
- Refreshed 2026-11-02: the data checklist's CHK025 and CHK027 closed by adding
  two cross-cutting acceptance criteria after AC-056. AC-057 asserts that no
  email address exists as a product datum — no form collects one, no response or
  notice shows one, no path identifies, recovers, or sends to one, and every
  stored email-shaped value is the reserved, non-routable placeholder derived
  from the account's normalized number, with a test that fails when a supplied
  address, a second such value, or an email input is introduced (FR-001, FR-007,
  FR-014). AC-058 asserts the no-cap session rule — two sign-ins hold two live
  sessions, one ending leaves the other live and granting access, and each
  further sign-in adds a session and ends none (FR-007, FR-010, FR-012, FR-032).
  The Key Entities note and the Assumptions already carried both invariants; the
  Test Coverage Request now names both assertions at the integration level, and
  T037 and T059 carry them, so every criterion is referenced by a task. No FR or
  SC changed, no existing AC identifier was renumbered, reused, or moved, the
  criteria run contiguous from AC-001 to AC-058, and the live counts read 53 FR,
  58 AC, 9 SC.
- Refreshed 2026-11-02 (second time): the CHK023 pass in `checklists/ui.md` closed
  by widening AC-028 rather than by naming SC-008 as the criterion for the SMS
  limb. The criterion's Given clause now names every text the platform delivers
  to a person — what a screen renders and the body of every message it sends by
  SMS — so its scan covers the platform's own strings on every screen and in
  every message template for the language and numeral rules, and every text a
  person reads for the no-emoji rule, with the icon limb left to the screens
  because a message body carries no icon (FR-026, AC-028, SC-008). The
  one-time-code messages are now asserted by a criterion as the two notices are
  by AC-047, and no limb of FR-026 rests on a success criterion alone; SC-008
  keeps its 100% outcome over the same scope. `contracts/ui-contracts.md` §7
  names AC-028 beside SC-008, `tasks.md` T026 and T100 name the scan they run,
  and the 2026-11-02 clarification trace records the clause with its verifying
  tasks. No FR, AC, or SC identifier was added, renumbered, reused, or
  withdrawn; the counts stay 53 FR, 58 AC, and 9 SC; every FR is cited by at
  least one AC; and every checkbox above stays checked.
- Refreshed 2026-11-02 (third time): the CHK025 pass in `checklists/ui.md` closed
  by widening the dark coverage of the automated accessibility scan rather than
  by accepting the three scanned states with a reason. SC-006 now states that the
  scan runs in both appearances FR-025 fixes — every delivered state scanned in
  light and in dark at 320 and 1280 CSS px — so the dark set carries every state
  the light set carries and the earlier `form`/`code`/`done` subset is withdrawn:
  the states it omitted carry the alert, notice, and loading surfaces a second
  palette can break, so a smaller dark set would leave the appearance's own
  states unjudged. `contracts/ui-contracts.md` §9, `plan.md` §Verification Notes,
  its SC-006 measurement point, and Gate IV, `tasks.md` T115, and `quickstart.md`
  §4 and its Done-when list read the same matrix; the manual keyboard-only pass
  stays appearance-independent, because the appearance changes no keyboard
  behaviour, and the visual baseline keeps its own widths. No FR, AC, or SC
  identifier was added, renumbered, reused, or withdrawn; the counts stay 53 FR,
  58 AC, and 9 SC; every FR is cited by at least one AC; and every checkbox above
  stays checked.
- Refreshed 2026-11-02 (fourth time): the CHK046 pass in `checklists/ui.md` closed
  by rewriting AC-022 to assert the frame the way FR-020 states it. The criterion
  now names the requirement that owns each surface — the header FR-023, the
  sidebar FR-022 and FR-039, the bottom bar FR-052, and the footer band FR-024 —
  and asserts each surface's presence at the width and in the composition that
  requirement fixes, instead of restating the sidebar's item list, the bar's five
  slots, and the band's four static-page links, whose single homes are FR-039
  with AC-042, FR-052 with AC-042, and FR-024 with AC-026. The icon set and the
  typography stay with FR-020, and the criterion's accessibility and
  notifications limbs are unchanged (SC-006, FR-023). No FR, AC, or SC identifier
  was added, renumbered, reused, withdrawn, or moved; the counts stay 53 FR,
  58 AC, and 9 SC; every FR is cited by at least one AC; and every checkbox above
  stays checked.
- Refreshed 2026-11-02 (fifth time): the CHK027 pass in `checklists/security.md`
  and the CHK039 pass in `checklists/ui.md` closed together, because both asked
  the same question of exception `EX-007` — which behaviour the frame's deferral
  carries and which criterion closes each. The register's row now names every
  behaviour beside its criterion: the account menu's live open and its
  «تسجيل الخروج» item, with the yes-or-no confirmation and the ended-session state
  a confirmation produces (AC-051, AC-053); the drawer's open and close (AC-024);
  the drawer's focus containment and its return to «المزيد» (AC-024); the bottom
  bar's scroll-hide (AC-042); and the guest's redirection of a merchant-area
  destination to the sign-in page, from the drawer's item, the bar's slot, and the
  sidebar's item list (AC-024, AC-042, AC-052). AC-052 joins the four criteria the
  two items name because it is the criterion whose own last sentence sends the
  sidebar's redirection to R2. The row keeps the repository owner as approver and
  the 2026-12-01 review date and still ends at R2, the first page carrying the
  frame (ADR-139); `plan.md`'s Complexity Tracking row 4 carries the same list and
  criteria, and its Gate 1 → VIII status is unchanged. No requirement, criterion,
  success criterion, identifier, or count changed — 53 FR, 58 AC, 9 SC — and
  every checkbox above stays checked.

- Refreshed 2026-11-02 (sixth time): the clarify session closed
  `checklists/copy.md` CHK003 and CHK010. The emoji refusal now has its own text
  in the shared message table — five cause rows under the two field codes, with
  a `Reason` column and the refusal carrying the same cause
  (`contracts/auth-api.md` §3) — so FR-001 and AC-046 state one text per cause
  and T008, T047, and T054 carry the schema, the route, and the mapping. The
  platform's name is fixed once at constitution 6.3.1 (ADR-147): the Arabic form
  is «وفر» without diacritics, the wordmark and page titles read «منصة وفر», and
  the trade name is «وفر». No FR, AC, or SC identifier was added, renumbered,
  reused, or moved; the counts stay 53 FR, 58 AC, and 9 SC; every FR is cited by
  at least one AC; and all 33 items stay checked.

- Refreshed 2026-11-02 (seventh time): the clarify session closed
  `checklists/copy.md` CHK008, CHK009, CHK011, CHK012, and CHK033. The mobile
  number now has one rendered form — `+218 91 234 5678`, the prefix then the
  nine national digits grouped 2-3-4 with single spaces, in Latin digits, inside
  one isolated left-to-right run — stated in FR-038 and
  `contracts/ui-contracts.md` §3.3, while the stored form stays the unspaced
  `+218912345678`; AC-041, AC-028, SC-008, T052, and T133 read it. Platform copy
  now carries no diacritics (U+064B–U+0652, U+0670) and no Latin character
  outside a closed set — the digits 0–9, `+218`, and `SMS` — with Principle V's
  PDF, Excel, OEM, and SKU permitted product-wide and unused here; the strings
  that carried a mark are written unmarked or reworded, and FR-026, AC-028,
  SC-008, T026, T100, and the contract's §3.4, §6, §7, and §8.3 carry the rule.
  A supplied value now renders as one isolated bidirectional run whose direction
  comes from its own first strong character, stated in FR-045 and asserted by
  AC-028 and T133. No FR, AC, or SC identifier was added, renumbered, reused, or
  moved; the counts stay 53 FR, 58 AC, and 9 SC; every FR is cited by at least
  one AC; and all 33 items stay checked.

- Refreshed 2026-11-03: three passages in `spec.md` still named the plan's
  Complexity Tracking table, so the 2026-11-03 record's sentence — that the
  specification carries no reference to a planning or implementation artifact —
  did not yet hold of the whole document. Each passage now states its substance:
  US5's Independent Test records the frame's structural-only verification as
  `EX-007` in the exception register "because Principle VIII is NON-NEGOTIABLE
  and the exception register, not a deviation entry, is the instrument for it"
  (ADR-139); FR-024 records the static pages' reachability deferral "with an
  owner and a review date"; and the sentinel Assumption records the placeholder
  and the storage deviation "with an owner and a review date". The sentence now
  holds — the file names no plan, task, research, data-model, quickstart, or
  contract artifact — and the change is recorded as Session 2026-11-03 (4) in
  `spec.md`. No requirement, criterion, success criterion, identifier, page,
  route, or count changed; the counts stay 53 FR, 58 AC, and 9 SC, and all 33
  items stay checked.

### Review 2026-11-01 (C1)

**Review line**: reviewed 2026-11-01 against `spec.md`, `plan.md`, and `tasks.md` — 33 items, 33 marked, 0 open (33/33). No item is left unchecked; no item was reworded or removed.

- The item appended by the 2026-11-01 repair pass (the plan's bookkeeping) is
  satisfied and is now marked: `plan.md` §Decision records this plan introduces
  states fifteen records, `plan.md` §Complexity Tracking holds twenty-six
  numbered rows (1–26), and every row citation in `plan.md` and `tasks.md`
  resolves to a row the table holds — no citation names a row above 26 and no
  recorded deviation lacks its numbered row, its owner, and its review date.
- The file therefore ends this review at 33 items, every one checked; the
  earlier sentence that recorded "33 items with 32 checked" describes the state
  before this review, and the review line above is the current count.

### Review 2026-11-04 (AC-051)

**Review line**: reviewed 2026-11-04 against `spec.md`, `plan.md`, and
`tasks.md` — 33 items, 33 marked, 0 open (33/33). AC-051's narrowing is tracked;
no item changed state.

- **The AC-051 trace holds.** AC-051 is narrowed to what this slice builds: the
  account menu's composition — its three items, their accessible names and
  roles, its keyboard reachability, the sign-out confirmation's markup, and the
  two items' link targets — is verified structurally here; the menu's live open,
  its runtime dismissal, and the confirmation's result are R2's on the boundary
  SC-005 fixes under `EX-007`; and the two destinations, with the Profile page's
  own content, are R7's against FR-047, recorded as Complexity Tracking row 34
  (owner R7, review 2027-01-31). The criterion still cites FR-047; T095 and T102
  still cite AC-051, the 2026-11-04 amendment in `tasks.md` names both and row
  34, and the task trace table's AC-051 row resolves, so the identifier remains
  covered by at least one task and the narrowing opens no dangling reference.
  The item "Every user story is independently testable and deliverable" stays
  satisfied: US5's structural verification under `EX-007` and its bare-page
  test under `EX-009` are unchanged, and the Profile content AC-051 no longer
  claims is recorded as a deferred row rather than an exception, because no
  story here claims a behaviour the slice does not build. No FR, AC, or SC
  identifier was added, renumbered, reused, moved, or withdrawn; the counts stay
  53 FR, 58 AC, and 9 SC; every FR is cited by at least one AC; and all 33 items
  stay checked.

### Review 2026-11-04 (Key Entities terminology)

**Review line**: reviewed 2026-11-04 against `spec.md` — 33 items, 33 marked,
0 open (33/33). No item changed state.

- **The term is one, and the note now uses it.** The Key Entities note carried
  "the pending sign-up data" in its first paragraph and "the pending sign-up
  request" in the sentence after it, while Session 2026-11-04 (4), FR-034, and
  `data-model.md` fix "the pending request" as the name of the one shared
  transient store. The two phrases now read "The pending request's data" and
  "The pending request carries the details", recorded as Session 2026-11-04 (6)
  in `spec.md`. The item "Requirements are testable and unambiguous" and the item
  "No requirement contradicts an accepted decision record" stay satisfied,
  because the correction removes a second name for a term the specification had
  already fixed rather than changing a rule. No FR, AC, or SC identifier was
  added, renumbered, reused, moved, or withdrawn; no path, page, or route
  changed; the counts stay 53 FR, 58 AC, and 9 SC; and all 33 items stay
  checked.
