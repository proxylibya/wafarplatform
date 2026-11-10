# Feature Specification: Identity and Foundation

**Feature Branch**: `001-identity-foundation`

**Created**: 2026-10-10

**Status**: Implemented — converged 2026-11-08, acceptance pending

**Input**: Parent roadmap: ROADMAP.md → R1. User description: "R1 — Identity and foundation. A merchant creates an account with a full name, a Libyan mobile number on +218 entered without any dial-code selector, a password, a city chosen from a fixed searchable list of every Libyan governorate, city, and area, and an optional shop name. The number is confirmed at sign-up by a one-time code sent to it; signing in afterwards needs no code. The merchant can sign in, sign out, sign out of every device at once, and recover a forgotten password through a one-time code sent to the registered number. No sign-in, sign-up, or recovery response ever reveals whether an account exists, and an account is locked for fifteen minutes after five consecutive failed sign-in attempts. A signed-in session can be ended by the platform at any time, and changing the password ends every existing session. The list of Libyan cities is fixed here as the single list the sign-up form offers. The account carries a status: active, or blocked. A blocked account keeps its data and its public contributions but can no longer sign in. No merchant can delete their own account, and no one becomes an administrator through public sign-up: the platform's administrator account is created by the operator and must change its password at first sign-in. This slice also establishes what every later slice needs to exist first — the platform's base project and its first working pages: sign-up, sign-in, and password recovery — inside the product's shared page frame (header, a sidebar that narrows to icons on a wide screen or becomes a drawer on a narrow one, a theme switch, an icon set, and the product's type). That frame appears on the public pages and the merchant's area only, never on the sign-up, sign-in, recovery, error, or static pages, and it carries the product's means of reaching those static pages. Sign-up is protected against automated abuse by a hidden field, a minimum time before submitting, and a limit on how often one client may submit; no CAPTCHA is ever used."

<!--
  BINDING RULES FOR THIS DOCUMENT (governed by `.specify/memory/constitution.md`; the current version is in its footer and in `.specify/memory/version.json`) - NORMATIVE:
  1. Technology-agnostic (Principle VII): this file MUST NOT name languages,
     frameworks, libraries, databases, products, or architectural patterns.
     Product behaviour only; every technical detail is recorded outside this file.
  2. Identifiers (Principle I): FR-### for functional requirements, AC-### for
     acceptance criteria (assigned in the Acceptance Criteria section and
     nowhere else), SC-### for success criteria. Identifiers are stable for the
     life of the feature: never renumber, never reuse; withdraw an item
     by keeping its identifier and marking it withdrawn.
  3. Every FR MUST be testable and unambiguous; every FR SHOULD be covered by
     at least one AC; every AC MUST be referenced by at least one task.
  4. Test request (Principle III): the Test Coverage Request section MUST
     state explicitly whether unit, integration, and end-to-end test tasks
     are requested. Task generation reads that request from THIS file, not
     from any other artifact.
  5. Project Context Sources (binding) — read these before writing this
     specification, and keep it consistent with them:
       - `.specify/memory/constitution.md` — principles and governance; the
         Product Scope (pages, roles, product features), the Product Register
         (roles, the twenty-eight pages, the data entities and the cross-entity
         rules), the Usage Limits, and the Glossary that is the naming
         authority.
       - `Core-Project.txt` — the product definition: roles and their
         permissions, the page list, the file-processing sequence, and the
         statements the product already makes as acceptance criteria.
       - the decision register — `docs/DECISIONS.md`'s index and the volumes
         under `docs/decisions/` (ADR-001 … ADR-161). A specification that
         contradicts one is a blocking defect.
       - `docs/design/slice-map.md` — the slice's entry: its blocks and order,
         its states, its copy, and the open questions this specification must
         answer. Reference, not a source of rules; the binding version is this
         specification.
       - `ROADMAP.md` — the slice's scope, dependencies, and what this slice
         does not do (ADR-134).
       - `docs/domain-model.md` — the entities a Key Entities section may name,
         and the invariants such a specification MUST NOT contradict. A
         specification MUST NOT invent an entity, and MUST NOT restate the
         entity's columns: an entity, a relationship, or an invariant is a
         registered product fact changed only by amending the register and
         recording an ADR.
     Read the sections named above; for `docs/DECISIONS.md` read its index and
     the volume that holds the records this feature touches, not the whole
     register (ADR-071, ADR-125, Reading protocol).
     The technical sources are bound outside this file: naming their content in
     this file would breach rule 1 (Principle VII).
     A page or a product feature that is not on the constitution's Product
     Scope list MUST NOT be specified without recording the addition as a
     deviation with its owner and review date.
-->

## Clarifications

### Session 2026-10-10

- Q: Does this slice deliver a page that renders the shared frame, or is the frame delivered and verified structurally with its first rendering page arriving later? → A: The frame is delivered and verified structurally; this slice adds no page whose purpose is to render it. The first page that composes the frame arrives with a later slice.
- Q: Does the rate limit cover every authentication operation or only the sign-up form? → A: Every authentication operation — account creation, sign-in, and password recovery — in addition to the sign-up form's hidden field and minimum time-to-submit.
- Q: Does the specification fix the one-time code's behaviour, or leave it to be fixed elsewhere? → A: The specification states the behaviour — the code expires, a new code is requestable subject to a limit, and the code is refused after a bounded number of incorrect entries — while the numeric values themselves are recorded separately.
- Q: When the password changes, does the current session end too, or only the other sessions? → A: Every existing session ends, including the one the change was made from; the merchant signs in again with the new password.
- Q: Before the code is verified, does a `User` row exist, or is the account created only after verification? → A: No `User` row is created until the correct code is entered; pending sign-up data is held outside `User`, so `User.status` stays the closed two-value set `active` / `blocked`.
- Q: Must the platform enforce a password policy when a password is set, and what is its nature? → A: Yes — a password policy is enforced at sign-up and on password change: a minimum length plus rejection of common or breached passwords, with the exact numeric values recorded separately.
- Q: Is the chosen appearance (dark or light) stored on the account or only in the browser? → A: In the browser only, per device; no appearance preference is stored on the account, so no entity gains a field. The default appearance on a first visit is light, and a stored choice wins over it (revised 2026-10-28, ADR-137).
- Q: For the pages this slice does not ship (the error page and the four static pages), does this slice verify the frame's absence, or is that deferred? → A: Deferred — AC-023 and SC-005 are narrowed to the pages this slice ships (sign-up, sign-in, password recovery); the error and static pages stay bound and are verified by the slice that ships them, and this slice creates no placeholder page.
- Q: Does this slice deliver the administrator's sign-in surface and the forced password change, or only the provisioning action with the rule enforced without a page? → A: Only the provisioning action and the enforcement — the slice creates the administrator account through an operator-run provisioning action and records the forced-password-change requirement and its state on the account, verified at the behaviour level rather than through a shipped page; the administrator's separate sign-in surface arrives with a later slice, and AC-030 is narrowed to that boundary.
- Q: Does this slice build the frame's controls that later slices own — the account control and its menu, and the means of reaching the static pages? → A: Yes, the frame is delivered whole: its header controls — the logo/home and account controls and the account menu — and its means of reaching the static pages are built and verified structurally, while each destination's behaviour and data are owned by the slice that owns it (the Profile page, the Notifications page); the decision on which surface carries the static-page links is recorded as an ADR by the slice that ships the first page carrying the frame, not here (revised 2026-10-11: this slice chooses and builds that surface and records the decision here — see Session 2026-10-11; revised 2026-10-27: the surface is fixed by the constitution, ADR-096, so this slice builds it rather than choosing it — see Session 2026-10-27).
- Q: When the sign-up form is submitted with a number that already has an account, does the flow continue to the code step, and is the submitted password ever applied to the existing account? → A: The flow continues identically and the code is sent to the number whether or not an account exists, so every step's response is the same; when the correct code is entered for a number that already has an account, no second account is created and the submitted password is not applied, and the person is directed to sign in or to recover the password. (Revised 2026-10-28: the generic direction is bounded to an existing active merchant account; a blocked or administrator account receives the status- or role-specific message — see Session 2026-10-28.)
- Q: Does this slice introduce a registered entity for the pending sign-up verification state, the one-time codes, and the lock state, or keep them outside the twelve-entity register? → A: No third entity — the pending sign-up data and the one-time codes are transient verification state held in an expiring store outside the entity register; the consecutive-failed-attempt count, the lock, and the forced-password-change requirement are account properties added as fields on `User`, through a Product Register amendment and a decision record in this slice.
- Q: What happens when the one-time code cannot be sent — a messaging-channel failure or an undeliverable number — and does the failed attempt count against the limit on re-requesting a code? → A: The person sees an explicit, retryable failure state; the pending sign-up stays valid until its own expiry; and a failed send does not count against the limit on re-requesting a code.
- Q: After the one-time code is verified at sign-up, is the merchant signed in automatically, or directed to sign in separately? → A: The merchant is signed in automatically — entering the correct code creates the session and the account becomes usable in place, with no separate sign-in step.
- Q: When a merchant resets a forgotten password through the recovery flow, does that end every existing session of the account, the way a password change does? → A: Yes — a reset counts as a password change: every existing session of the account ends, and the merchant signs in with the new password.
- Q: This slice ships no page that carries the shared frame, yet it requires a merchant to be able to sign out, including from every device. Where is that action offered in this slice? → A: Nowhere as a rendered surface in this slice — sign-out and sign-out-of-every-device are delivered as behaviour and verified by the integration tests, and the control arrives as the third item of the account menu, which is part of the frame's composition and is verified structurally here; because no page renders the frame yet, the menu is exercised at runtime by the slice that ships the first page carrying it; the US2 end-to-end journey in the Test Coverage Request is narrowed to sign-in.
- Q: During password recovery, when the submitted number has no account, is the one-time code actually sent to that number as it is at sign-up, or is the response merely uniform with no message dispatched? → A: The code is sent whether or not the number has an account — the same rule sign-up follows — so the response and the behaviour are both indistinguishable, and the dispatch stays bounded by the rate limit on authentication operations.
- Q: Does the appearance a person chose (dark or light) apply to the bare pages this slice ships — sign-up, sign-in, and password recovery — or do those pages always render in the default appearance? → A: It applies to every page, bare pages included, and is applied before the page is painted; the switch itself stays a frame control and is not offered on a bare page. The default appearance on a first visit is light, and a stored choice wins over it (revised 2026-10-28, ADR-137).
- Q: How should the platform express the fifteen-minute lock after five consecutive failed sign-in attempts, so that a sign-in response still does not reveal whether the number has an account? → A: The refusal stays uniform — an attempt made while the account is locked is refused with the same response text, the same status, and the same response path as any other failed sign-in, and no message, timing difference, or other signal distinguishes a locked account from a wrong password or an unknown number; the lock withholds acceptance only, so FR-008 and SC-004 stay unqualified and no documented exception is recorded. (Read with Sessions 2026-11-01 (6) and 2026-11-02 (18): the five failures counted are password verifications across the three paths — sign-in, the account's own change action, and the forced first change — not sign-in attempts alone.)
- Q: Where does a person arrive after the mobile number is verified at sign-up and after signing in, given that this slice ships no page carrying the frame and no page in the merchant's area? → A: Nowhere in this slice — each journey ends at the platform's own response (the session created after verification, or the session created after sign-in), the session's existence is verified at the behaviour level and by the integration tests, and the first page a signed-in merchant lands on arrives with the slice that ships the merchant's area; this slice adds no landing page and AC-023 and SC-005 keep the three bare pages as their only list.
- Q: Does a session end only when it goes unused, or also at an absolute maximum lifetime, however active the merchant is? → A: Both clocks — the session ends when the session timeout elapses with no activity, and it also ends when it reaches its absolute maximum lifetime, however active the merchant is; the two values are stated numerically in the recorded values, and AC-015 and the session unit tests cover both.
- Q: When a new one-time code is requested, does the previous code stop being valid, and is the bound on incorrect entries counted per code or over the whole verification? → A: Exactly one code is valid at any moment and the bound is counted over the whole verification - requesting a new code invalidates the previous one once the new message is dispatched and does not reset the count of incorrect entries, so the guessing bound holds across re-requests and is governed only by the limit on requesting new codes. (Revised 2026-10-22: the previous code stops being valid when the replacement is dispatched, so a failed send leaves it valid — see the Session 2026-10-22 bullet on a failed re-request.)
- Q: Does a successful password reset through the recovery flow lift the account's fifteen-minute lock, or does the lock run its full duration? → A: The lock runs its full duration — a successful reset neither lifts the lock nor resets the count of consecutive failed attempts, because the lock is a time bound independent of the password and proving ownership of the number does not waive it; the merchant signs in with the new password once the fifteen minutes have passed.

### Session 2026-10-11

- Q: How far does the sign-up flow's indistinguishability rule reach — does it cover the code-entry step too, given that the outcome necessarily differs once the correct code is entered (a number with no account creates a session, a number that already has an account does not)? → A: The rule is bounded to the form's response, the following step, and the sending of the code; entering the correct code proves ownership of the number, so the differing outcome past that point is legitimate and the rule stops there — FR-006, AC-006, and SC-004 are bounded to those steps.
- Q: When the holder of a blocked account tries to sign in, does the refusal stay uniform — revealing neither the block nor the account's existence — and does the enumeration criterion cover a blocked account as it covers a locked one? → A: The refusal stays uniform — the same text, the same status, and the same response path as every other failed sign-in — and nothing at any step tells the person the account is blocked or that it exists; SC-004 is extended to cover an attempt against a blocked account as it already covers a locked one, and no exception to FR-008 is recorded.
- Q: When the fifteen minutes elapse, does the count of consecutive failed attempts clear, and do refusals made while the account is locked count as further failed attempts? → A: The lock is a time bound alone — at its expiry the count clears, so a single later failure does not re-lock the account, and an attempt refused while the lock is in force is not counted as a further failed attempt and never extends the lock; AC-010 and SC-007 assert both.
- Q: In the password-recovery flow, is the indistinguishability rule bounded to the request and the code dispatch — as in sign-up — given that a number with no account has nothing to reset? → A: Bounded the same way — after the correct code is entered, ownership of the number is proven and the platform states explicitly that no account exists for it, rather than continuing as though a reset had occurred; FR-015 and AC-017 carry the bound, and SC-004 bounds the recovery flow as it bounds sign-up.
- Q: Is the set of valid Libyan mobile prefixes on +218 fixed in this slice as reference data named in a decision record — as the city list was — or left to be fixed elsewhere? → A: Fixed here, once — recorded as one reference dataset for accounts and named in a decision record alongside the city list; the platform decides whether a +218 number is a mobile number from that dataset rather than from a rule of its own, so FR-003 and AC-003 are testable without judgement.
- Q: Does this slice choose and build the surface that carries the static-page links and record the decision, or deliver the four routes only and defer the surface? → A: This slice chooses the surface, builds it inside the frame, and records the decision as a decision record — revising the earlier deferral, because the frame is delivered whole and ROADMAP assigns the choice and its record to R1; FR-024, AC-026, US5, and the matching Assumptions bullet are revised accordingly. (Revised 2026-10-27: the surface is fixed by the constitution (ADR-096) and ADR-127 fixes its narrow-screen placement, so this slice builds it and its decision record fixes the routes alone — see Session 2026-10-27.)
- Q: At the administrator's first sign-in, is the sign-in accepted and the account then restricted to the password change, or is the sign-in itself refused until the password is changed? → A: The first sign-in is accepted and the account is restricted so that no action other than the password change is permitted until the change is made; the sign-in itself is never refused, so FR-028 and AC-030 are reworded and the earlier "a first sign-in is refused" reading is removed. (Revised 2026-10-22: the restriction withholds every product action that needs the account's ordinary permissions, but not the password change itself or ending the session; see Session 2026-10-22.)
- Q: When the holder of a blocked account resets the password through the recovery flow, does the reset complete while the block stands, or is the request refused because the account is blocked? → A: The reset completes — a new password is set and every existing session ends — but the account's block stands, so no access is granted; the outcome is stated only after ownership of the number is proven, and FR-014 and the matching edge case carry the rule.
- Q: Does this slice deliver the act of blocking an account — the action that sets the status to blocked — or does it deliver the status and everything that follows from it, with the act arriving with the slice that ships the administrator's Users page? → A: The act is not delivered here: this slice delivers the status, the uniform refusal a blocked account receives, and the withdrawal of the sessions the account already held, and its tests reach the blocked state directly; the act of blocking arrives with the administrator's Users page (R13), where the audit record every administrator operation requires also exists, and US4's Independent Test is narrowed to that boundary.
- Q: Does this slice deliver the account's own change-password action — the action that changes the password from inside the account — or does it stay with the profile page (R7) so that session revocation is exercised through the recovery flow alone? → A: The action is delivered here as behaviour, with no page, and is verified by the integration tests; the profile page that offers it arrives with a later slice. Both halves of FR-013 therefore stay testable in this slice — the change made from inside the account and the change made through the recovery flow — and FR-013, US2, and its Independent Test carry the boundary.
- Q: Does the specification bind the body of the one-time-code message — its language, its numerals, and the no-emoji rule — and is that body covered by an acceptance criterion? → A: Yes — the message body is user-facing text and follows the same language, numeral, and no-emoji rules a page follows, even though it carries no icons; FR-026 and SC-008 are extended to cover it, so the criterion's scan of user-facing strings reaches the message templates rather than the screens alone.
- Q: Does the frame's composition include the platform's logo, and is the logo delivered as a wordmark rather than as a new image asset? → A: The logo is part of the frame's composition, and it is delivered as a wordmark set in the product's typography, adding no image asset and no new design value, with the form it takes recorded as a fixed design value; it sits in the header at its inline-start edge, not in the sidebar (revised 2026-10-21, ADR-099); FR-020, AC-022, and US5 name it.
- Q: Must the mobile-number field accept a number typed with Arabic-Indic numerals (for example ٠٩١…) and normalize it to the same canonical form, or is such a number refused as invalid? → A: It is accepted and read as the same digits — the field is tolerant on input while every numeral the platform renders stays Latin — so the number reaches the same normalized form and never becomes a second account; FR-031 and AC-007 are extended to name the form, and the matching edge case carries it.
- Q: When the operator's provisioning action creates the administrator account, is the administrator's mobile number verified by a one-time code the way a merchant's is, or is the account created directly — and does the invariant that an account exists only after the mobile number is verified bind the administrator too? → A: The account is created directly by the provisioning action, with no one-time code and no verification step, because the operator who runs the action already controls the platform and the constitution creates this account outside the public registration flow; the verification invariant is bounded to accounts created through public sign-up, the provisioning action sets the account's identity details (full name, Libyan mobile number, and city) in the same change, and Key Entities, FR-028, AC-030, the administrator Assumption, and the matching edge case carry the bound.
- Q: When a guest opens a page that carries the frame, what does the header show — does the sign-in action replace all the signed-in header's controls, or only some of them? → A: It replaces the account control and the notifications control; the guest keeps the theme switch, which sits in the header beside them, so a guest can still change the appearance, and the sidebar-collapse control stays in the sidebar so the guest can open or close the sidebar (revised 2026-10-21, ADR-099; revised 2026-10-21, ADR-102). FR-023, AC-025, US5, and the matching edge case carry the rule.
- Q: This slice ships no page that renders the frame, yet AC-024 asserts the sidebar's behaviour at two screen widths and US5's Independent Test calls that behaviour verifiable — on what surface is it exercised? → A: Neither is exercised at runtime here: the sidebar's two-width behaviour and the header controls' behaviour are verified by the slice that ships the first page carrying the frame, and this slice verifies the frame's composition, the presence of its controls, and the frame's absence from the three bare pages it ships. US5's Independent Test, AC-024, the end-to-end journey list, and SC-005 are narrowed to that boundary, and no preview route and no placeholder page is added.
- Q: FR-034's send-failure rule speaks of the "pending sign-up" alone — do the expiry, the re-request limit, and the failed-send rule govern a one-time code sent for password recovery the same way? → A: One rule governs both code paths: the pending request — whether it is a sign-up or a password reset — stays valid until its own expiry, and a code that cannot be sent produces the same explicit, retryable failure state and does not count against the limit on requesting a new code. FR-034, AC-036, and the matching edge case are reworded from "the pending sign-up" to "the pending request".
- Q: Two sign-up attempts for the same mobile number, or two entries of its one-time code, can arrive at the same moment — what does the platform guarantee then, and does the one-number-one-account rule still hold? → A: Uniqueness is enforced at the moment the account is created rather than by a check made before it, so two simultaneous attempts for one number produce at most one account and the attempt that does not create it receives the uniform outcome and the same direction FR-006 requires, leaving no partial account and no second session. FR-031, the `User` entity, the matching edge case, and the integration-test request carry the rule. (Revised 2026-11-02, Clarifications: AC-006 now asserts the concurrent code-entry case as well, so the edge case's citation points at a criterion that carries it — see Session 2026-11-02.) (Read with Session 2026-11-04 (2): the attempt that does not create the account receives the status- and role-specific message FR-006 fixes, not one uniform direction.)
- Q: How does a visitor reach, and move between, the three bare pages this slice ships — sign-up, sign-in, and password recovery — when no page carrying the shared frame is delivered here? → A: The three bare pages link to one another: sign-in carries the way to sign-up and to password recovery, sign-up carries the way to sign-in, and password recovery carries the way back to sign-in, so every journey this slice ships has a defined entry point and the end-to-end tests start from a page; the links live on the bare pages themselves, because the frame that would otherwise carry them is absent from those pages and arrives with a later slice. FR-036, AC-039, and the end-to-end journey list carry the rule.
- Q: In the sign-up flow, is the password policy applied when the form is submitted, or only when the account is created after the code is entered? → A: Applied when the form is submitted, before any one-time code is sent, so a password that fails the policy is refused at that point; the refusal is the same whether or not the number already has an account, so it adds no signal to the sign-up flow's uniformity. FR-035 and AC-037 carry the rule.
- Q: When a sign-up is started for a number that already has a live pending sign-up, does the new attempt replace the previous one, or do both stay live? → A: One pending request is live per mobile number: starting a new sign-up or a new recovery request for a number that already has a live pending request replaces it, and the previous code stops being valid at once — consistent with the rule that exactly one code is valid at any moment and with uniqueness being keyed on the normalized number. FR-034, AC-036, and the Key Entities note carry the rule.
- Q: Does each authentication operation carry its own rate limit, or do the three share one budget per client? → A: Each operation carries its own limit, so exhausting one operation's budget never blocks another: a client hammering sign-up cannot consume the sign-in budget and deny a legitimate merchant sign-in. FR-033 and AC-035 carry the rule.
- Q: Does this slice record the security-relevant events it produces, or does all recording wait for the log pipeline a later slice owns? → A: This slice emits a structured record for each security-relevant event it produces — a failed sign-in attempt, a lock applied, a password change or a reset, a session revocation, and a one-time-code dispatch failure — carrying no secret, no session token, and no personal data; collection, retention, and alerting remain with the log pipeline the deployment slice (R12) owns, and this slice introduces no pipeline of its own. FR-037 and AC-040 carry the rule.
- Q: When an administrator's mobile number and password are entered on the merchant sign-in page this slice ships, does the platform sign that account in, or refuse the attempt with the same uniform response every other failed sign-in receives? → A: It refuses — an administrator account cannot sign in on the merchant surface, and the attempt receives the identical uniform refusal FR-008 requires, so nothing tells the person the account exists or that it is an administrator account; the administrator signs in only on the administrator's own surface, which arrives with a later slice. FR-027, AC-029, US6, and the matching edge case carry the rule.
- Q: Is the operator's provisioning action repeatable — does the platform hold more than one administrator account — or does it provision exactly one? → A: It is repeatable: each run creates a distinct administrator account, the platform introduces no cap on how many administrator accounts exist (the sources' own wording speaks of every administrator account, and the register states no cap), and uniqueness is enforced on the normalised mobile number exactly as FR-031 requires for any account, so a run for a number that already has an account creates nothing and reports the conflict to the operator. FR-028, AC-030, US6, the administrator Assumption, and the matching edge case carry the rule.
- Q: Do the sign-in and password-recovery pages this slice ships also fix the country to Libya (+218) with no dial-code selector, as the sign-up form does? → A: Yes — the rule is general: every page this slice ships that takes a mobile number offers no dial-code selector and fixes the country to Libya (+218), so FR-002 and AC-002 are restated as a rule over those three pages rather than over the sign-up form alone.
- Q: Does this slice fix and record the icon set — a technology register gap it owns — the way it fixes the city list and the mobile-prefix dataset, or is the icon set left to be fixed elsewhere? → A: It is fixed and recorded here, once: this slice chooses the icon set and records the choice so every later slice reads it rather than choosing its own, with the choice itself recorded beside the platform's other fixed values together with the register-gap decision record, the licence-obligation record, and the vulnerability scan the technology register requires. FR-020, AC-022, and the icon-set Assumption carry the rule.
- Q: What identifies "one client" for the rate limits on the sign-up form and on the three authentication operations? → A: The client is identified by its network origin — the request's origin — and the limit is applied per operation, so one origin's exhausted budget never blocks another origin and each of the three operations carries its own budget. FR-029, FR-033, AC-033, and AC-035 carry the rule. (Revised 2026-10-21: the client is identified by the request's network origin, and the specification names no transport detail.) (Revised 2026-10-28: the origin key never blocks another origin, while the number key is global to the number, so a spent number is refused from every origin — see Session 2026-10-28.)
- Q: Does a successful sign-in clear the count of consecutive failed sign-in attempts, or does only the lock's expiry clear it? → A: A successful sign-in clears the count to zero, so the lock counts a run of five failures with no success in between; a success in the middle of a run ends it, exactly as the word "consecutive" requires. FR-009, AC-010, and SC-007 carry the rule. (Read with Session 2026-11-01 (6): the run counts password verifications across the three paths — sign-in, the account's own change action, and the forced first change — and a success on any of them clears it.)
- Q: When the bound on incorrect entries for a one-time code is reached, does the pending request end, or does it stay live and refuse every further code? → A: The pending request ends when the bound is reached, and the person starts a fresh request — a sign-up or a recovery — which begins a new verification with the count of incorrect entries at zero; the platform leaves no live request that can never be completed, and the fresh request replaces the ended one on the same terms FR-034 already states for a live pending request. FR-034, AC-036, and the matching edge case carry the rule.
- Q: When a client is refused because it has exceeded a rate limit, does the platform show a distinct refusal, or the same uniform refusal every other failed sign-in receives? → A: The refusal is distinct and explicit — it states that the limit was exceeded and that the person may retry later — because the limit protects the client rather than the account and therefore reveals nothing about whether an account exists; SC-004's indistinguishability rule stays bounded to responses that are not rate-limit refusals. FR-029, FR-033, AC-033, AC-035, and SC-004 carry the rule.
- Q: Is the list of security-relevant events FR-037 emits exhaustive, or does it also cover the operator's provisioning action and successful authentication? → A: The list is extended: the operator's provisioning of an administrator account is recorded as a security-relevant event, and so is a successful authentication — the verification that creates an account at sign-up and a successful sign-in — because an unrecorded privileged creation and an unrecorded successful authentication leave the security record one-sided. FR-037, AC-040, and the Test Coverage Request carry the rule.
- Q: Are the refusals produced by the sign-up form's hidden field and its minimum time-to-submit shown to the person, or kept silent? → A: The hidden-field refusal is silent — the platform returns the same response a successful submission receives, so a bot cannot tell it was detected — while the minimum-time refusal is explicit and retryable, because a real person may legitimately submit quickly and needs to be told to try again; no account is created in either case. FR-029, AC-031, and AC-032 carry the rule.
- Q: Does entering the one-time code — at sign-up and in password recovery — open a page or a route of its own, or is it a step of the same page that started the flow? → A: It is a step of the same page: the code entry renders within the sign-up page and within the password-recovery page and adds no page and no route, so this slice still ships exactly the three bare pages it names (sign-up, sign-in, password recovery) and the Product Register's twenty-seven pages are untouched. FR-038, AC-041, and the end-to-end journey note carry the rule. (Revised 2026-10-25 by ADR-126: the register gains the Upload Catalog page and names twenty-eight pages; this bullet's count is superseded.)
- Q: The operator's provisioning action creates the administrator account directly, but what credential does the administrator sign in with the first time — does the action set an initial password, or is the account created with no usable credential? → A: The action sets an initial password the operator supplies, which MUST satisfy the same password policy FR-035 requires, and the account is created with the forced-password-change requirement; the first sign-in accepts that credential and permits nothing but the password change, and the operator learns the credential out of band because the account is created outside the public flow. FR-028, FR-035, AC-030, and the administrator Assumption carry the rule. (Revised 2026-11-02 (23): the credential is supplied by the operator, so the operator does not "learn" it — they hold it and hand it to the administrator over a channel the operator controls, and FR-028 states the supply, display, recording, and delivery bounds — see Session 2026-11-02 (23).)
- Q: The sign-up form carries a limit of its own (FR-029) and account creation is one of the three rate-limited authentication operations (FR-033) — are those one budget or two? → A: One and the same budget: the sign-up form's limit is the account-creation operation's limit, so one budget governs account creation and the form carries no second, overlapping budget; the hidden field and the minimum time-to-submit stay form-level protections and are not budgets. FR-033 and AC-035 carry the rule. (Revised 2026-11-01 (4): the budget is keyed on the origin and the normalized number, and FR-033 states it that way — see Session 2026-11-01 (4).)
- Q: Must the one-time-code field accept a code typed with Arabic-Indic numerals and read it as the same digits, the way the mobile-number field does (FR-031)? → A: Yes — the same tolerance governs the code field: a code typed as Arabic-Indic numerals is read as the same digits and verifies identically, while every numeral the platform renders stays Latin, so FR-026's rule is unchanged and a correct code is neither refused nor silently mis-read. FR-031 and AC-007 carry the rule.
- Q: Does the account's own change-password action — the change made from inside the account, delivered here as behaviour — require the current password, or does a signed-in merchant set a new password without proving the old one? → A: The action requires the current password: a signed-in merchant MUST supply it, and a change submitted without it, or with a wrong one, is refused and ends no session; the recovery flow is the only path that sets a password without the current one, because it proves ownership of the number with the one-time code instead. FR-013, AC-014, and the Test Coverage Request carry the rule. (Bounded 2026-11-01 (6): the recovery flow is the only path that resets the password of an account that already holds one without the current one; the operator's provisioning action sets a first password, and the forced first change still requires the current one.)
- Q: The frame is delivered whole, yet the specification never says what the sidebar's navigation list carries — given that none of the pages such a list would reach ships in this slice — so what does the sidebar carry here, and what does its verification assert? → A: The sidebar ships with its navigation item list as part of the frame's composition: each item names a registered destination, an item whose page ships later points at the route that slice provides, and this slice's structural verification asserts the item list alongside the theme switch and the collapse control, so the frame is composed once and a later slice does not extend it. The theme switch is verified in the header, where ADR-102 places it, and the collapse control in the sidebar, where ADR-099 placed it. FR-039, AC-042, US5, and the Test Coverage Request carry the rule. (Revised 2026-10-11: the item list is fixed in this specification and the route each item points at is fixed by this slice's decision record — see the item-list and route bullets that follow in this session.)
- Q: Between the sign-up form's submission and the arrival of the one-time code — and while the code is being verified — what does the person see, and is a repeated submission prevented from starting a second dispatch? → A: The page shows an in-progress state and disables the submit control while a request is in flight, so a repeated submission cannot start a second dispatch or produce a second account; the guard is presentation only, and the server-side uniqueness rule FR-031 stays the authority, exactly as the concurrent-attempt case already requires. FR-040, AC-043, and the matching edge case carry the rule.
- Q: When a signed-in person opens one of the three bare pages this slice ships — sign-up, sign-in, or password recovery — what do they see, given that this slice ships no destination page and the frame is absent from those pages? → A: The page renders exactly as it does for a guest: no redirect and no signed-in-specific surface is introduced, because the pages are public, carry no state, and carry no frame, and a sign-out control on them would contradict the rule that the sign-out control belongs to the frame and not to a bare page — its only control is the account menu's third item, and a bare page carries no menu. FR-041, AC-044, the matching edge case, and the matching Assumption carry the rule. (Revised 2026-10-21: the sign-out control is the frame's, and this slice builds and verifies it structurally.)
- Q: At sign-in and in password recovery, when the submitted value is not a valid Libyan mobile number on +218 at all, is it refused with the uniform refusal FR-008 requires or with a distinct, explicit format refusal — and does the enumeration criterion cover it? → A: A distinct, explicit format refusal states that the value is not a valid Libyan mobile number; it stays outside SC-004's uniformity, because a malformed value can never have an account, so the refusal depends on the value's shape rather than on whether an account exists — exactly as the rate-limit refusal is excluded. FR-042, AC-045, SC-004, and the matching edge case carry the rule.
- Q: SC-004 requires sign-up, sign-in, and password-recovery responses to be indistinguishable and asserts it with an automated enumeration test, yet the specification names "no timing difference" only for the refusal made while an account is locked (FR-009) — does that uniformity also bind how long a response takes, or does it cover response text and status alone? → A: The uniformity binds timing as well as text and status: every authentication response does equivalent work whether or not the account exists — a sign-in attempt against an unknown number performs the same verification work as one against an existing account, so no response's duration signals account existence — and the enumeration test asserts the response's observable shape (text, status, and timing) rather than its text alone. FR-006, FR-008, FR-015, SC-004, and the Test Coverage Request carry the rule.
- Q: The merchant sign-in surface refuses an administrator account's credentials (FR-027), but the password-recovery flow this slice ships is not bounded the same way — what happens when that flow is used for a mobile number whose account holds the administrator role: does it set a new password on that account, or refuse after the code is verified the way it refuses a number with no account? → A: It refuses — after the correct code is entered and ownership of the number is proven, the platform states explicitly that the credential cannot be reset on this surface and sets no password and creates no session, because an administrator's credential belongs to the administrator's own surface, which arrives with a later slice; the request, the following step, and the code dispatch stay indistinguishable, exactly as FR-015 bounds them, so nothing before the code is entered signals the account's role. FR-014, FR-027, AC-016, and the matching edge case carry the rule.
- Q: FR-035 requires the platform to reject common or breached passwords, but the specification never says where that knowledge comes from or what happens when it is unavailable — is the check performed against a source the platform holds, so it never depends on an external service, or against an external breach service whose unavailability the platform must handle? → A: The check is performed against a source the platform holds: this slice introduces no external service for it, so the check is always available, a sign-up or a password change never fails for want of it, and no password material leaves the platform; the source and the way it is kept current are recorded, and a password that fails the check is refused exactly as AC-037 states. FR-035, AC-037, and the Test Coverage Request carry the rule.
- Q: Every administrator operation must be recorded in the audit log, and FR-019 defers the act of blocking for exactly that reason — yet this slice delivers the operator's provisioning of an administrator account; is that provisioning an administrator operation that must be recorded in the audit log (and therefore owned by the slice that creates that record), or an operation outside the product's role model? → A: It is out of band — the provisioning action is run by the platform's operator outside the product's role model and outside the administrator application, so it is not an administrator operation and writes no audit-log row; the audit log records the operations an administrator performs through the administrator application, which arrives with a later slice, and this slice records the provisioning through the structured security event FR-037 already names. FR-028, FR-037, the administrator Assumption, and AC-030 carry the rule.
- Q: The frame's sidebar is delivered whole and its navigation item list is verified structurally, yet the specification never says which destinations the items name — does this slice fix the item list, or leave it to be fixed elsewhere? → A: This slice fixes the item list in the specification: one item per registered destination a guest or a signed-in merchant can reach on the public site and in the merchant's area — Home, Parts, Catalog, My Files, Cart, Notifications, Messages, and Profile — and it carries no item for the three bare pages this slice ships or for the four bare-layout static pages, because the register states a static page is never a sidebar item; the structural verification asserts that exact list. FR-039, AC-042, and US5 carry the rule. (Revised 2026-10-25 by ADR-126: the list carries nine destinations — Upload Catalog sits between Catalog and My Files and points at `/upload` — and the register is at twenty-eight pages.)
- Q: When the sign-up form is submitted with the hidden field filled, the platform returns the same response a successful submission receives — but does that silent refusal also start a pending request and dispatch a one-time code to the submitted number? → A: No pending request is started and no one-time code is dispatched: the silence is a guarantee about the response, so the form cannot be turned into a way to send SMS to numbers the submitter does not control, and FR-006's timing rule, which binds the account-existence case, is not extended to this refusal. FR-029, AC-031, and the matching edge case carry the rule. (Revised 2026-10-21: the guarantee covers the response alone, and the flow stops at it — the code step is not reached.)
- Q: The frame's links must reach destinations whose pages ship in later slices, and the frame is verified structurally — does this slice fix the route strings those links point at, or does it point at routes a later slice chooses? → A: This slice fixes them: the frame's decision record fixes the route of every destination the frame links to — the eight sidebar destinations, the four static-page routes, and the Profile page's settings section that «إعدادات» opens — so every link has a definite target and a later slice ships its page at the route fixed here rather than choosing one of its own; a later slice therefore cannot move a route the frame already points at. FR-024, FR-039, AC-026, AC-042, and the matching Assumptions bullet carry the rule. (Revised 2026-10-25 by ADR-126: the sidebar destinations are nine, with Upload Catalog at `/upload`.)
- Q: FR-006 requires the platform to direct a person whose number already has an account to sign in or to recover the password — is that direction a message on the code step carrying the two links, or a redirect to another page? → A: It is a message on the code step that names the two options and offers the link to the sign-in page and the link to the password-recovery page, which the bare pages already carry; no redirect is introduced, consistent with the rule that the three bare pages render identically for a signed-in person and for a guest. FR-006, AC-006, and the matching edge case carry the rule. (Revised 2026-11-01 (5), Clarifications: the message replaces the code step in place and stays there until a reload or a fresh opening, because the pending request ends once the outcome is stated.)
- Q: Which refusals count toward an account's consecutive failed sign-in attempts — every refusal, or only a refusal produced by a failed password verification? → A: Only a failed password verification against an existing, active account counts: a refusal produced by a rate limit, a refusal of a value that is not a valid Libyan mobile number, and the refusal a blocked account receives MUST NOT increment the count, so the count measures exactly what a consecutive failed sign-in attempt is and the lock cannot be driven by requests that never verified a password. FR-009, FR-017, AC-010, and SC-007 carry the rule. (Widened 2026-11-01 (6): the same rule governs the current-password check of the account's own change action and the administrator's forced first change.)
- Q: What scale are this specification's success criteria and performance budget measured against? → A: A modest, explicit ceiling is stated in Assumptions — up to 10,000 registered accounts, up to 500 concurrent sessions, and a peak of no more than 10 authentication requests per second — and SC-009 and the stated capacity envelope are measured against it, rather than the criterion staying load-independent.
- Q: Does this slice fix the routes of the three bare pages it ships and the destination of the frame's guest sign-in action, or leave them to be fixed elsewhere? → A: This slice fixes them, by extending the frame's decision record (FR-024) to cover them as well — the destination of the header's guest sign-in action and the routes of sign-up, sign-in, and password recovery — so every link this slice builds has a definite target rather than the bare pages and the sign-in action being the only links left without one.
- Q: Does an account carry a cap on the number of concurrent sessions, or are they unlimited? → A: Unlimited — signing in creates a new session and ends no session the account already holds, no cap is applied, and a session is removed only by its own end (its timeout, its absolute maximum lifetime, an explicit sign-out, or a revocation); "sign out of every device" is the action an account uses to end them all at once. (Revised 2026-11-04, Clarifications: "its own end" is not the only removal — an account-level end also ends every session of the account, namely a sign-out of every device (FR-011), a password change or reset (FR-013), or a block (FR-019); see Session 2026-11-04 (7) and AC-058.)
- Q: Does this specification impose any constraint on the two free-text fields — the full name and the optional shop name — or leave them unbounded? → A: Both are bounded: the full name is required and must not be empty or spaces alone, each field carries a maximum length stated in the recorded values, and within those bounds a value is accepted as typed — letters and numerals alike — with no alphabetic-shape rule imposed, so the requirement is testable and reusable by the profile slice (R7).
- Q: Does this slice define the reverse status transition from blocked back to active, or leave it to the administrator application's slice (R13)? → A: It is recorded explicitly that both directions are administrator operations owned by R13: the status stays a closed two-value set, and setting an account to blocked and returning it to active both arrive with the administrator's Users page; this slice delivers the field and the effects of the blocked value, defines no reverse transition, and ships no action that sets the status.
- Q: When a guest opens a page that carries the frame, does the sidebar's navigation item list differ from the one a signed-in merchant sees, or is it the same list? → A: The list is the frame's single composition and is shown identically to a guest and to a signed-in merchant: all eight items are present in both states, because the frame is composed once and its item list is part of that composition, exactly as its logo, its typography, and its icon set are not varied by role; the frame MUST NOT add, remove, or disable an item by role, and AC-042's structural assertion is made once for that list. FR-039, AC-042, and US5 carry the rule. (Revised 2026-10-25 by ADR-126: the list is nine items in both states.)
- Q: Does the operator-run provisioning action that creates the administrator account apply the same field rules sign-up applies — FR-001's full-name presence and bounds, FR-003's Libyan-mobile-number rule against the fixed prefix dataset, and FR-005's city-from-the-fixed-list rule — or is the action exempt from them? → A: It applies all of them: the account it creates is a `User` like any other, and those are account rules rather than rules of the public sign-up path, so the action MUST refuse a value that fails any of them and MUST report the refusal to the operator, creating no account. Only the one-time-code verification (FR-004) is bounded to public sign-up, exactly as FR-028 and the Key Entities note already state. FR-028, AC-030, the administrator Assumption, and the Test Coverage Request carry the rule.
- Q: FR-040 states the in-progress state and the disabled submit control for the sign-up form's submission and the entry of a one-time code — do they also govern the sign-in submission and the password-recovery request submission? → A: Yes — the guard governs every authentication form this slice ships: the sign-up submission, the sign-in submission, the password-recovery request submission, and the one-time-code entry at sign-up and in recovery. A repeated submission of any of them cannot start a second request or a second dispatch, and the guard is presentation only: the server-side rules (FR-031's uniqueness and FR-034's single live pending request) remain the authority. The state-completeness requirement in Principle IX is satisfied by the guard on each of the three pages. FR-040, AC-043, and the Test Coverage Request carry the rule. (Revised 2026-10-22: the guard governs every submission these three pages make, so the new-password step of the password-recovery flow is guarded as well — a repeated submission there neither sets the password twice nor ends the account's sessions twice — and the account's own change-password action has no surface in this slice, so the guard has no page to act on there; see Session 2026-10-22.) (Revised 2026-10-29: the action has no page, but its request exists and carries the forgery protection; see Session 2026-10-29.)
- Q: When the correct one-time code is entered and verified but the account cannot be created at that moment — a transient failure — what does the person see, and is the same code still usable? → A: The pending request stays valid until its own expiry and the correct code stays usable, because a code is consumed only once the account is actually created; the person sees an explicit, retryable failure state, and that failure counts neither against the bound on incorrect entries (it was not an incorrect entry) nor against the limit on requesting a new code. The rule is distinct from the send-failure rule FR-034 already states, which governs a code that never reached the number, and the one-number-one-account rule is unaffected because no account was created. FR-034, AC-036, and the matching edge case carry the rule.
- Q: Does a sign-in attempt refused for its role — an administrator account's credentials submitted on the merchant sign-in surface (FR-027) — count toward the consecutive-failed-attempt count and drive the lock, or is it excluded as the rate-limit, format, and blocked-account refusals already are? → A: It is excluded: the count measures a failed password verification against an existing, active merchant account, and an administrator account's attempt is refused for its role rather than for a failed password, so it MUST NOT increment the count and MUST NOT drive the lock; it is treated exactly as the refusal a blocked account receives (FR-017). FR-009, AC-010, SC-007, and the Test Coverage Request carry the rule.
- Q: What clears the forced-password-change requirement the operator's provisioning action places on the administrator account, and does the restriction lift when it is cleared? → A: The change made at the first sign-in clears it: performing that change ends the restriction and the account is thereafter unrestricted, and no other path clears it — the merchant recovery flow refuses a mobile number whose account holds the administrator role (FR-014) and the merchant sign-in surface refuses an administrator's credentials (FR-027), so no surface other than the administrator's own reaches that credential. FR-028, AC-030, US6, and the Key Entities note carry the rule.
- Q: Which surface inside the frame carries the links to the four static pages, given that the register forbids a static page from being a sidebar item? → A: A footer band inside the frame, below the page's content: it is shown on every page that carries the frame and is absent from every page that does not, because the footer is part of the frame's composition exactly as the header and the sidebar are. FR-024, FR-021, AC-026, and the matching edge case carry the rule.
- Q: Is each rate limit keyed on the network origin alone, or on the origin and on the submitted mobile number as well, given that a mobile carrier's address is shared by many people at once? → A: Two keys: each budget is keyed on the network origin and on the normalized mobile number the request submits, so exhausting either key refuses further requests on that key alone — every other origin and every other number stays unaffected — and a shared carrier address therefore cannot spend a person's budget; the refusal is the same distinct, explicit limit refusal whichever key produced it, so nothing about it signals whether an account exists. FR-029, FR-033, AC-035, the matching edge case, and the Test Coverage Request carry the rule. (Revised 2026-10-28: the number key is global to the number, so a spent number is refused from every origin, while the origin key stays per-origin — see Session 2026-10-28.)
- Q: Does the accessibility criterion (SC-006) cover the shared frame itself, given that no page this slice ships renders it? → A: It covers the frame at the level of its markup: the structural verification this slice performs asserts that every frame control — the logo/home, account, and account-menu items, the notifications control, the theme switch, the sidebar-collapse control, and the footer band's links — carries an accessible name, a role, and keyboard reachability. The automated scan and the keyboard-only pass over the frame's rendered behaviour stay with the slice that ships the first page carrying the frame, exactly as its two-width behaviour does. SC-006, AC-022, and the Test Coverage Request carry the rule.
- Q: When the password changes or every session of an account is ended at once, does the platform send a notice by SMS to the registered number, or is the structured security record the only trace? → A: It sends one in both cases — on a password change and on a sign-out of every device — so the account's owner learns out of band of a change they did not make; the notice is Arabic, right-to-left, with Latin numerals and no emoji, it is dispatched best-effort so a failed send undoes nothing and blocks nothing, and it is recorded as the dispatch failure FR-037 names. No notice is sent on an ordinary sign-in or an ordinary sign-out, so the channel stays bound to those two events. FR-043, FR-037, AC-047, AC-040, and the Test Coverage Request carry the rule.
- Q: After the one-time code is verified at sign-up, and after a successful sign-in, what does the browser show, given that this slice ships no page a signed-in merchant lands on? → A: Option A — a confirmation state rendered in place on the same page: the code step at sign-up, the sign-in form, and the new-password step in password recovery are each replaced in place by a confirmation of the outcome, with no navigation, no new route, and no new page. FR-004, FR-007, FR-014, AC-004, AC-008, AC-016, and the no-landing-page Assumption carry the rule.
- Q: What identifies the subject of a structured security record, given that the constitution forbids personal data in a log? → A: Option A — an internal account identifier, carried only where an account exists: a record produced for a number with no account carries no account reference, and the mobile number never appears in any form. FR-037, AC-040, and the Test Coverage Request carry the rule.
- Q: May a new password be identical to the password it replaces? → A: Option A — yes: the policy stays exactly as FR-035 bounds it, so a new password MAY repeat the one it replaces and no password history is kept. FR-035, AC-037, and the Test Coverage Request carry the rule.
- Q: Must the sign-up form obtain an explicit acceptance of the Terms of Use and the Privacy Policy before the account is created? → A: Option A — no acceptance control: sign-up asks only for the fields FR-001 names, the two pages stay reachable from the frame's footer at the routes FR-024 fixes, and recording consent later is a register amendment rather than a feature edit. FR-001 carries the rule.
- Q: Must the optional shop name be unique across merchant accounts? → A: Option A — no uniqueness rule: the shop name is a label within its length bound and two accounts MAY hold the same value. FR-001, AC-046, and the Test Coverage Request carry the rule.
- Q: When the platform sends a one-time code, does it wait for the messaging channel to accept the message before telling the person to enter it, or does it move them to the code step and let the send finish in the background? → A: Option A — the send is attempted within the request that asks for the code, and the code step is reached only once the channel has accepted the message; a channel refusal therefore produces the explicit, retryable failure state on the submission itself, before the code step, so no failure arrives after the person has moved on, and the placement keeps the failure state FR-034 already promises where the specification already describes it. FR-034, AC-036, SC-009, and the Test Coverage Request carry the rule.
- Q: If a person reloads the sign-up or password-recovery page, or closes it and comes back, while a one-time code is still waiting for them, what does the page show them? → A: Option A — the page shows the code step again while the pending request is still live, so the person can enter the code they already received; the pending request already carries its own expiry and the re-request limit exists to bound abuse, so resuming keeps that code usable instead of spending a new code and a new SMS on an accidental refresh, and a fresh submission still replaces the pending request on FR-034's terms. FR-038, AC-041, AC-036, the matching edge case, and the Test Coverage Request carry the rule. (Revised 2026-10-29: the page resumes the request it most recently submitted from that browser, and returning to the first step ends the page's tie to it - see Session 2026-10-29.)
- Q: When a person signs in with a correct password, or enters the correct one-time code, but the platform unexpectedly fails to create the session, what does the person see — given that the three pages this slice ships are bare and the error page arrives with a later slice? → A: Option A — the page shows its own inline, explicit, retryable failure message, with no navigation and no separate error page, covering any failure that occurs while the page is being used; the three pages this slice ships are bare and cannot leave themselves, and the error page arrives with a later slice, so every failure they can hit must already be described on the page itself and this slice creates no placeholder error page. FR-040, AC-043, SC-005, the matching edge case, and the Test Coverage Request carry the rule.
- Q: How long is a merchant's personal data — their full name, mobile number, and city — kept after they close their account, given that a merchant can never delete their own account? → A: Option A — this slice fixes no retention period; it records that a merchant's data lives as long as the account is registered and is removed only by an administrator action, and that the facts this slice owns are what sign-up collects, that the mobile number is the sole identifier, and that no merchant can delete their own account. A numeric period is not stated here because the register fixes none, and the retention job's scope over account rows is not asserted by any source; the Privacy Policy page's wording belongs to the slice that ships it. FR-018, AC-020, and the matching Assumption carry the rule. (Revised 2026-10-21: the retention job is no longer named as a removal path for account data.) (Revised again 2026-11-01 (6): the retention job is named again as a removal path, with its trigger and scope left unfixed — see Session 2026-11-01 (6).) (Revised again 2026-11-02 (6): "registered" is defined as not soft-deleted, so the data's life ends where the register's soft deletion marks the row rather than continuing over the retained row — see Session 2026-11-02 (6).)
- Q: If a merchant closes their browser and opens it again later, are they still signed in? → A: Option A — the session survives closing and reopening the browser: the browser retains the reference that proves the session, while the session itself stays on the server and is never recoverable from browser storage, so a merchant who returns before the session's absolute maximum lifetime is still signed in, and only the inactivity timeout or the absolute maximum lifetime ends it. Neither clock is shortened or extended by the browser closing, which is why the specification fixes both values numerically in the first place. FR-032, AC-015, the `Session` entity, and the Test Coverage Request carry the rule. (Revised 2026-10-21: the reference is retained, and the session itself is never recoverable from browser storage.)
- Q: When a guest opens a page that carries the frame, what does the header show — the sign-in action alone as the constitution's Product Fact Clarifications bullet and its `Core-Project.txt` mirror state, or the sign-in action replacing the account and notifications controls while the guest keeps the theme switch and the sidebar collapse control, as FR-023 decides? → A: The specification's rule stands: the sign-in action replaces the account control and the notifications control only, and the guest keeps the theme switch and the sidebar collapse control, because the appearance and the sidebar belong to the frame rather than to an account. The contradiction with the constitution's Product Fact Clarifications bullet and its mirror is resolved by ADR-094 (2026-10-20), which amended both texts to this rule, so no binding source contradicts the guest's header any longer. (Revised 2026-10-21 by ADR-099: the header no longer carried a notifications control, and the theme switch and the collapse control sat in the sidebar; the guest rule itself stands.) (Revised again 2026-10-21 by ADR-102: the header carries a notifications control again and the theme switch sits beside it in the header, so the sign-in action replaces the account and notifications controls and the guest keeps the theme switch.) FR-023, AC-025, US5, and the matching edge case carry the rule.
- Q: Should the three browser-facing security controls the constitution requires of the first browser-facing feature — request-forgery protection, output encoding, and security headers — be stated as functional requirements with acceptance criteria, or left named only in the Test Coverage Request? → A: They are stated as functional requirements and acceptance criteria: FR-044 (every state-changing request issued from a browser session is protected against request forgery), FR-045 (every value a person supplies is encoded for its output context before it is rendered), and FR-046 (every response the browser surface returns carries the security headers the constitution names), with AC-048 … AC-050 asserting each, so the implementation work has a numbered requirement to cite under Principle I instead of arriving with none. FR-044, FR-045, FR-046, AC-048, AC-049, AC-050, US7, and the Test Coverage Request carry the rule.
- Q: When a client has exhausted the limit on requesting a new one-time code for a live pending request, what refusal does it receive — the uniform response or a distinct one — and is that limit one of the three per-operation budgets FR-033 fixes or a bound of its own? → A: The refusal is distinct and explicit: it states that the limit on requesting a new code was exceeded and that the person may retry later, and it is excluded from SC-004's enumeration comparison for the same reason the per-operation rate-limit refusal is, because it depends on the pending request's own history rather than on whether the number has an account — and the pending request exists for a number with no account exactly as it does for one. The bound is its own and sits above FR-033's per-operation budgets: requesting a new code neither consumes nor is bounded by the account-creation or the recovery budget, so a merchant who mistypes a code and asks for a new one cannot spend the operation's budget. FR-034, AC-036, SC-004, and the Test Coverage Request carry the rule.
- Q: When the account's own change-password action succeeds — the current password is correct — after failed attempts have accumulated, does the success clear the consecutive-failed-attempt count the way a successful sign-in does, and does it lift a lock already running? → A: It clears the count: the count measures a run of failures with no successful password verification in between, and the change action's own failures are counted (FR-009), so its successes end the run exactly as a successful sign-in does. It does not lift a lock already running: the lock is a time bound and keeps its full fifteen minutes whatever the password is set to, exactly as a successful reset through the recovery flow does not lift it. FR-009, AC-010, SC-007, and the Test Coverage Request carry the rule.
- Q: FR-004, FR-007, and FR-014 require each page to render a confirmation in place after a successful action, while FR-041 and AC-044 require the same three pages to render identically for a signed-in person and for a guest with no signed-in-specific surface — how do the two rules coexist, and what does a person see if they reload the page after the confirmation? → A: The confirmation is the outcome of an action taken on the page, not a surface the page carries for a signed-in person: FR-041 governs what the page shows when it is opened, so a person who opens the sign-up, sign-in, or password-recovery page sees the page exactly as a guest does whatever their session state, and the confirmation appears only in place of the step the action was taken from. Once the action is complete — the pending request consumed at sign-up, the session created at sign-in, the password set in recovery — reloading or reopening the page returns it to its first step with no confirmation and no redirect, exactly as FR-038 already provides for a reload while the pending request is still live. FR-004, FR-007, FR-014, FR-041, AC-004, AC-008, AC-016, AC-044, and the matching Assumption carry the rule.
- Q: Does the operator's provisioning action, which sets the administrator account's initial password, also send the security notice FR-043 requires on a password change? → A: No — FR-043 governs a change to the password of an account that already holds one, so that its owner learns out of band of a change they did not make; the provisioning action sets the account's first password rather than changing an existing one, and the operator who supplies it is the party the notice would inform. The provisioning stays recorded as the structured security event FR-037 names, so the privileged creation is not silent. FR-028, FR-037, FR-043, AC-030, AC-047, and the Test Coverage Request carry the rule.
- Q: Do submissions refused by the sign-up form's own protections — the hidden field and the minimum time-to-submit — consume the account-creation budget FR-029 and FR-033 share, or are they outside every budget? → A: They consume it: the account-creation budget is applied to every submission that reaches the sign-up form, including one refused by the hidden field or by the minimum time-to-submit, so the honeypot cannot be turned into an unbounded entry point and a client that only fills the hidden field is still bounded; the refusals themselves are unchanged — the hidden field's stays silent and returns the same response a successful submission receives, the minimum-time refusal stays explicit and retryable, and the budget's own refusal stays the distinct, explicit limit refusal outside SC-004. FR-029, FR-033, AC-031, AC-032, AC-033, and the Test Coverage Request carry the rule. (Revised 2026-10-29: the budget counts the form's own submission alone, so the code step's entry and the new-password submission are outside it and are bounded by FR-034's own limits — see Session 2026-10-29 (3).)

### Session 2026-10-21

- Q: The operator has fixed the shared shell's composition: what does the header carry, where do the theme switch and the sidebar-collapse control live, and what happens when the account control is used? → A: The header carries only the platform's logo/home control at its inline-start edge and the account control at its inline-end edge, with no page-navigation link, no notifications control, no theme switch, and no sidebar-collapse control; the theme switch and the collapse control sit in the sidebar; the account control opens a menu carrying «حسابي»، «إعدادات»، and «تسجيل الخروج»، and the sign-out item asks for a yes-or-no confirmation. A guest sees the sign-in action in place of the account control only. «إعدادات» is a section inside the Profile page, so no page is added and the Product Register stays at twenty-seven pages. The frame's composition and the menu are verified structurally here; the runtime behaviour lands with the first page that carries the frame (R2), and the destinations land with R7. FR-020, FR-022 … FR-025, FR-039, FR-047, AC-022, AC-024, AC-025, AC-027, AC-042, and AC-051 carry the rule; ADR-099 is the decision record. (Revised 2026-10-21 by ADR-102: the header carries the logo/home control at its inline-start edge and, at its inline-end edge, the notifications control, the theme switch, and the account control; the sidebar carries the navigation item list and the collapse control; a guest keeps the theme switch, and the sign-in action replaces the account and notifications controls.) (Revised 2026-10-25 by ADR-126: the register gains the Upload Catalog page and stays at twenty-eight pages, and the item list gains its ninth destination.) (Corrected 2026-10-29 by ADR-139: the first page carrying the frame is R2, the Upload Catalog page; R4 is the first table, not the first page inside the merchant area.)
- Q: What does the «إعدادات» item show, and how does it differ from «حسابي»? → A: «حسابي» opens the Profile page at its top, where the account's identity and status are shown, and «إعدادات» opens the settings section of that same page, where the account details are edited and the password is changed; the two items share the one Profile route the frame's decision record fixes, the settings section being identified by an anchor, so no page and no entity is added. FR-047 and AC-051 carry the rule. (Revised 2026-11-04, Clarifications: AC-051 carries the menu's composition and its two link targets, while the page's content is FR-047's and is delivered and verified by R7 under Complexity Tracking row 34.)
- Q: After the account menu settled on three items, where does a merchant trigger the action that ends every session of their account at once? → A: In the settings section of the Profile page, beside the account details and the password change, so the account menu keeps its three items; the action is delivered by the Profile slice (R7), and the Profile page's content in the constitution's Product Scope and its `Core-Project.txt` mirror carry it. FR-047 carries the rule.
- Q: The sidebar's item list is the same for a guest and a signed-in merchant, so a guest can press an item that names a merchant-area destination — what does the platform show then? → A: The sign-in page: the platform takes the guest there, because the register gives a guest no cart, no upload, no message, and no merchant area; the item itself stays present and enabled, since the list is not varied by role, and the three items that name a public destination — Home, Parts, and Catalog — open their own pages as they do for a merchant. The rule adds no page, no route, and no stored state, and whether the merchant returns to the item they wanted after signing in is a decision of the slice that ships the merchant area's pages. FR-048 and AC-052 carry the rule.
- Q: What does a merchant see when their session ends or their account is blocked while they are on a page that carries the frame? → A: An explicit state inside the frame, stating that the session has ended and offering the way to sign in again, and saying plainly that the account is blocked when that is the reason, because the person held a valid session and is no longer an unknown caller; no unrelated error is shown, and the frame stops sending requests for a session that no longer exists. The state adds no page, no route, and no entity, and it is outside the enumeration comparison SC-004 bounds. FR-049 and AC-053 carry the rule. (Revised 2026-10-28: the blocked variant states the block and withholds the way to sign in — see Session 2026-10-28.)
- Q: What does the administrator application's header carry now that the platform's header design is fixed? → A: The administrator application keeps its own shell, and its header carries the platform's logo at the inline-start edge and an account control whose menu offers «تسجيل الخروج» only, because the administrator application has no Profile page and no merchant settings page, so the merchant menu's destinations do not exist there. This specification binds that composition for R13 and delivers nothing of it. FR-050 and AC-054 carry the rule.
- Q: Is the background and its colour an option a merchant or the administrator chooses, or a fixed design value? → A: A fixed design value: the appearance's surfaces, backgrounds, and colours are recorded as fixed design values (ADR-098); neither a merchant nor the administrator chooses a background or a colour, and no such preference is stored on the account or in the platform's settings, so no requirement, entity, or slice is added. FR-025 carries the rule.
- Q: What closes the account menu? → A: Three paths, each closing it without action: pressing Escape, activating something outside it, and moving the focus out of it; the focus returns to the account control in every case. FR-047 and AC-051 carry the rule.
- Q: What does «حسابي» show exactly? → A: The account's full name, its city, and its status — active or blocked — and no other account field; the mobile number and the editable account details belong to the settings section, so the item that opens the page shows a summary and the item that opens the settings section shows and changes the details. FR-047 and AC-051 carry the rule. (Revised 2026-11-04, Clarifications: the content is FR-047's and is delivered and verified by R7 under Complexity Tracking row 34; AC-051 carries the menu's composition and its two link targets.)
- Q: What does the merchant see in the page they were on after confirming the sign-out in the account menu? → A: The same ended-session state FR-049 requires when a request is refused: the page stays where it is inside the frame, states that the session has ended, and offers the way to sign in again, so both ways a session ends lead to one outcome. FR-049 and AC-053 carry the rule.
- Q: What is the account control's accessible name in the header, and does the merchant's name appear beside it? → A: The accessible name is «حسابي», and the header shows the icon alone with no merchant name in it; the merchant's name is available inside the account menu's «حسابي» item, so the header stays a brand-and-account band and one Arabic string names the control. FR-023, AC-022, and AC-025 carry the rule.

### Session 2026-10-21 (2)

- Q: The Assumptions said sign-out has no surface in this slice, yet FR-041, FR-047, AC-051, and ADR-099's decision 6 say the account menu's third item and its confirmation are built and verified structurally here. Which is true? → A: The frame's composition is true: the control that offers sign-out is the account menu's third item with its yes-or-no confirmation, and this slice builds and verifies it structurally, because no page this slice ships renders the frame (ADR-099). Only its runtime behaviour lands with the slice that ships the first page carrying the frame (R2), and the action that ends every session of the account at once is the profile page's settings action (R7). The stale Assumption is replaced rather than supplemented, and FR-041 and US2's Independent Test are reworded to the same boundary. (Revised 2026-10-21.)
- Q: FR-029's hidden-field refusal says it returns the same response a successful submission receives, starts no pending request, dispatches no code, and that the silence covers the response and the following step. Which of these can hold together? → A: The guarantee is about the response alone, and the flow stops at that response: no pending request is started, no one-time code is dispatched, and the code step is not reached. The absent code is a consequence of the refusal rather than a signal of it, the submission still consumes the account-creation budget, and the form still cannot be turned into a way to send SMS to numbers the submitter does not control. FR-029, AC-031, and the matching edge case are reworded to the same rule. (Revised 2026-10-21.)
- Q: FR-020 said the icon set did not exist yet and that this slice must choose it, but ADR-098 already chose the set. What does this slice still owe? → A: The set is chosen and recorded (ADR-098); what the register still leaves open is the record itself. This slice records the chosen set in the technology register, records it with the platform's other fixed values, and executes the register-gap decision record, the licence-obligation record, the vulnerability scan, and the vendoring the register requires. FR-020 and the matching Assumption are reworded to that rule. (Revised 2026-10-21.)
- Q: FR-048, FR-049, AC-027, AC-052, and AC-053 assert runtime behaviour, yet no page in this slice renders the frame. Who verifies them? → A: This slice verifies the frame's composition and the presence of its controls structurally, and the slice that ships the first page carrying the frame verifies the runtime behaviour — the same boundary the neighbouring requirements and criteria already carry. The five are given that clause, so none of them asserts behaviour this slice cannot exercise. (Revised 2026-10-21.)
- Q: FR-024 chooses the footer band as the surface carrying the four static-page links, but the constitution binds the reachability requirement to the slice that chooses the surface, and this slice ships no page that carries the frame. How is the requirement discharged? → A: It is discharged by the slice that ships the first page carrying the frame (R2), because the surface this slice chooses renders on no page of its own. This slice builds the surface, fixes the four routes, and binds the rule; the deferral is recorded with an owner and a review date. FR-024, AC-026, and the matching Assumption carry the deferral, and the constitution is left as it is. (Revised 2026-10-21; revised 2026-10-27: the constitution fixes the surface as the footer band (ADR-096) and ADR-127 its narrow-screen placement, so the deferral rests on no page here carrying the frame rather than on this slice choosing the surface.)
- Q: The specification named two implementation details in a file that must name none — the client's identity was fixed by a transport-specific term, and the output-encoding rule named a platform technology as its default. What replaces them? → A: The client is identified by the request's network origin, which FR-033 already used, and the output-encoding rule is satisfied by a default the platform provides rather than by this requirement, with a test that fails when the encoding is removed. Neither rewrite changes the rule. (Revised 2026-10-21.)
- Q: The pending verification state and the three new account fields are not tracked anywhere a reviewer can read. What records them? → A: The transient verification store is recorded in `docs/domain-model.md` as transient, non-entity state owned by the `users` module, with its invariants, so it is documented without entering the entity register; and the account-level amendment's content is named explicitly as exactly three fields on `User` — the consecutive-failed-attempt count, the lock's expiry, and the requirement to change the password at first sign-in — with the amendment tracked in the recorded ownership map and as a recorded deviation with its owner and review date. (Revised 2026-10-21.)
- Q: FR-018 and AC-020 named the retention job as a way personal data is removed, while the register fixes no period and R15 owns the retention trigger. What does the specification now say? → A: The account's personal data is removed only by an administrator action; the specification fixes no retention period and asserts no trigger, and the retention job's scope over account rows is not asserted here either. (Revised 2026-10-21.) (Revised again 2026-11-01 (6): the retention job is named again as a removal path, with its trigger and scope left unfixed — see Session 2026-11-01 (6).)
- Q: Four acceptance criteria — the account menu, the guest's redirection, the ended-session state, and the administrator application's header — sat under the user story that resists automated abuse, because three later clarification sessions appended them to the end of the specification's last section. Where do they belong? → A: Under the stories they serve: the first three are frame criteria and belong to US5, and the administrator application's header belongs to US6, the only administrator-facing story in this slice. The criteria are moved to their stories, the ordinals are renumbered in document order, and the seven "Acceptance Scenarios" lines are rewritten from the actual grouping. No identifier is renumbered, reused, or withdrawn. (Revised 2026-10-21.)
- Q: The requirements are grouped by subject rather than by identifier, and a reader might mistake the order for a numbering. What says so? → A: A short note at the head of the Functional Requirements section: the identifier is what a task, a criterion, or a reviewer cites, it is stable for the life of the feature, and a requirement a later session revises keeps its identifier and its position. (Revised 2026-10-21.)
- Q: FR-032 said a session "is held by the browser rather than by the page", which reads loosely against the constitution's rule that a session is never persisted in browser storage in recoverable form. What does it say now? → A: The browser retains the reference that proves the session, while the session itself stays on the server and is never recoverable from browser storage. The rule the specification states is unchanged; only its wording moves onto the constitution's own terms. FR-032, the `Session` entity, and the matching clarification carry it. (Revised 2026-10-21.)

### Session 2026-10-22

- Q: FR-032 ends a session when "the session timeout elapsing with no activity", but the specification never says what counts as activity — so does a request the browser sends on its own, such as a background request the frame issues, keep the session alive? → A: Only what the merchant themselves do counts as activity for the session timeout — opening a page, submitting a form, or any other action the merchant starts — and that action MUST reset the inactivity clock; a request the browser sends on its own MUST NOT count as activity, so a background request cannot keep a session alive indefinitely and the timeout keeps its meaning. FR-032, AC-015, the `Session` entity, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: FR-035 requires a password policy with a minimum length and a rejection of common or breached passwords, but the specification never says whether the person is told what the policy requires, and whether the reasons a password is refused are told apart from one another? → A: Both: the form that takes a password states the policy's requirements before the password is typed, so the person can meet the policy without trial and error, and each reason the policy refuses a password carries its own message — shorter than the minimum, and common or breached — so the person knows what to correct. None of these messages reveals whether an account exists: the policy is applied to every password submitted, and the same message is given for the same reason whether or not the number has an account. FR-035, AC-037, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications; revised 2026-11-01, Clarifications: the maximum is stated and carries its own third message). (Revised 2026-11-01 (5), Clarifications: "applied to every password submitted" is bounded to every new password submitted to a form that sets one, because the sign-in form sets no password, states no requirement of the policy, shows no policy message, and receives the uniform refusal for a value that would fail it.)
- Q: FR-005 presents the city as "a searchable choice from one fixed list", but the specification never says what a person may type into that search, nor what names the list's entries carry — and the list is fixed once in this slice, so every later slice reads it. → A: Each entry carries one Arabic name and no Latin alternate name, and the search matches those Arabic names while ignoring diacritics, so a person who types a city without its diacritics still finds it, and the list holds no second naming source to keep in step with it. FR-005, AC-005, the city-list Assumption, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: FR-038 makes the one-time-code entry a step of the same page, but the specification never says what that step shows — do the fields the person filled in stay visible and editable, and may the mobile number be changed there? → A: The fields are shown for reading, the mobile number among them, so the person sees which number the code was sent to, and they are not editable there; a person who wants a different number returns to the page's first step and submits the form again, which starts a new pending request for the new number on FR-034's terms, while the pending request for the first number stays live until its own expiry. FR-038, AC-041, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-22: the fields the code step shows are enumerated, and the password is excluded from them — see the later bullet in this session.) (Revised again 2026-10-22: the enumeration is bounded to the fields each flow collected — the four at sign-up, the mobile number alone in recovery — and the step carries its re-request and change-number controls; see the later bullets in this session.)
- Q: FR-040 lists the submissions the in-progress state and the disabled submit control govern, but the new-password step of the password-recovery flow is not among them — does the guard cover that step, and what happens there when the request fails? → A: The guard governs every submission these three pages make, so the new-password step is guarded exactly as the password-recovery request is: a repeated submission there neither sets the password twice nor ends the account's sessions twice, and a failure on that step shows the same inline, explicit, retryable message every failure on these pages shows, because the error page arrives with a later slice. The account's own change-password action has no surface in this slice, so the guard has no page to act on there. FR-040, AC-043, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-29: the action has no page, but its request exists and carries the forgery protection; see Session 2026-10-29.)
- Q: When the correct one-time code is entered in the password-recovery flow, does the code stop being usable at that moment or stay usable until the new password is set, and what does the page show when the person reloads it at the new-password step? → A: In the password-recovery flow the code stops being usable the moment it is verified: the pending request moves to a verified state that carries the new-password step alone, lasts no longer than the pending request's own lifetime — the value the recorded values already fix — and is single-use, because setting the new password ends it and the pending request, so the same code cannot authorise a second reset. A reload, or a close-and-return, while the verified state lives shows the new-password step again rather than the code step, and once the password is set it returns the page to its first step as FR-041 provides. FR-014, FR-034, FR-038, AC-036, AC-041, the key-entities note, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: Must the in-progress state, the inline failure message, and the in-place confirmation the three bare pages render be announced to assistive technology, and where does focus go when a step that held it is replaced? → A: Every one of those states is announced to assistive technology, and when a step replaces another the focus moves to the step now shown — its first field, or its heading when it carries no field — and never remains on a control the previous step carried; the automated scan and the keyboard-only pass SC-006 requires assert both on the three bare pages. FR-040, AC-043, and SC-006 carry the rule (decided 2026-10-22, Clarifications). (Extended 2026-11-02, Clarifications: the same announcement and focus rule now reaches the notice that a request expired, the notice that a request ended at the bound on incorrect entries, and the terminal outcome message — see Session 2026-11-02 (10).)
- Q: The code step shows "the fields the person filled in" for reading, and the sign-up form's fields include the password — so does the step show the submitted password back to the browser? → A: No — the code step shows the full name, the mobile number, the city, and the optional shop name for reading, and the password is never shown back: it is not re-displayed, not echoed, and not masked-and-rendered either, so a submitted password never returns to the browser in any form. The mobile number is shown among them, so the person sees which number the code was sent to, and the whole set is read-only there. FR-038, AC-041, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-22: this enumeration is the sign-up code step's; in password recovery the step shows the mobile number alone, because the recovery form collects nothing else — see the later bullet in this session.)
- Q: AC-030 asserts that the administrator's forced-password-change requirement "is cleared by the change made at that first sign-in", and US6's Independent Test demands that clearing be confirmed — but this slice ships no administrator sign-in surface, and FR-027 and FR-014 close every other path to that credential, so the event AC-030 names cannot occur here. Does this slice deliver the administrator's first sign-in as behaviour, with no page? → A: Yes — this slice delivers the administrator's first sign-in as behaviour with no page, exactly as FR-013 delivers the account's own change-password action: the first sign-in is accepted, the account is restricted so that nothing but the password change is permitted, and the change made at that first sign-in clears the requirement and lifts the restriction. Only the administrator's sign-in *surface* — the page — arrives with the later slice that ships the administrator application, and this slice creates no page for it. FR-028, AC-030, US6, the administrator Assumption, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-22: the restriction withholds every product action that needs the account's ordinary permissions, but not the password change itself or ending the session, so sign-out remains available — see the later bullet in this session.)
- Q: FR-017 refuses a blocked account's sign-in "because it is a status refusal and never reached a password verification", while FR-008 and SC-004 require every sign-in response to do the same work and take the same time whatever the account's state — so does the platform refuse a blocked, a locked, and an administrator account before verifying the password, or after? → A: After — a status or role refusal performs the same verification work as any other sign-in attempt and is refused afterwards on the status or role ground, so its response is indistinguishable in text, status, response path, and duration from a wrong password and from an unknown number, exactly as SC-004 requires. The consecutive-failed-attempt count is still not incremented, because the verification the attempt performed was not against an active account — the reason FR-009 already gives, and the reason FR-017's own wording is brought into line with. FR-008, FR-009, FR-017, AC-009, AC-019, AC-029, SC-004, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: When the correct one-time code is entered at sign-up for a number that already has an account, the platform creates no second account and directs the person to sign in or to recover the password — but what happens to the pending request and its code at that point, given that the recovery flow's counterpart (FR-014) ends the pending request once the outcome is stated? → A: The same rule governs both code paths: the pending request ends once the outcome is stated, and the code stops being valid at once, so no live request and no usable code survive an outcome the platform has already reported. FR-006, FR-034, AC-006, the Key Entities note, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-28: the direction is status- and role-specific for a blocked or administrator account — see Session 2026-10-28.)
- Q: The Test Coverage Request sets the coverage target at "at least 80% of changed lines" of changed production code, while the frame's runtime behaviour — the account menu's open and confirm behaviour, the sidebar's two-width behaviour, and the header controls' behaviour — is expressly deferred to the slice that ships the first page carrying the frame, and this slice builds that frame. Does the deferred behaviour count against this slice's coverage target? → A: No — the target is stated over the changed production lines this slice introduces, except the frame's runtime behaviour this slice defers to the first frame-carrying slice, and that exclusion is named in the Test Coverage Request so the coverage gate is asserted over a scope the specification can actually meet. The frame's composition and the presence of its controls remain covered here by the structural verification, and the deferred runtime lines are covered in the slice that exercises them. The Test Coverage Request carries the rule (decided 2026-10-22, Clarifications).
- Q: In password recovery the page collects only a mobile number, yet FR-038 and AC-041 require the one-time-code step to show the full name, the mobile number, the city, and the optional shop name — what does that step show in the recovery flow? → A: The mobile number alone — the field the flow collected — in its canonical form with Latin numerals; the four fields remain the sign-up code step's rule, and the no-password rule governs both flows. Showing an account field before the code is verified would reveal that the number has an account, breaching FR-015 and SC-004. FR-038, AC-041, the matching edge cases, and the Test Coverage Request carry the bound (decided 2026-10-22, Clarifications).
- Q: At the administrator's first sign-in the account is restricted so that nothing but the password change is permitted (FR-028, AC-030), yet the administrator application's header offers sign-out (FR-050) — may the restricted administrator end their session before changing the password? → A: Yes — the restriction withholds every product action that needs the account's ordinary permissions, but it does not withhold the password change itself or ending the session: sign-out, the session timeout, and a platform revocation all remain available, so FR-028 and AC-030 are bounded to say so and FR-050's sign-out control stands for a restricted account (decided 2026-10-22, Clarifications).
- Q: The code step shows the submitted values for reading and keeps them from being edited there, and a reload resumes the code step — so how does the person request a new one-time code or return to the first step to change the mobile number? → A: The step carries two controls beside the code field and its submit control: one that requests a new one-time code, subject to FR-034's limit, and one that returns to the page's first step, where the values already typed are editable again and retained except the password, which the page never retains or shows; a reload still resumes the code step while the pending request is live, and a fresh submission replaces the pending request on FR-034's terms. FR-038, AC-041, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-29: the page resumes the request it most recently submitted from that browser, and returning to the first step ends the page's tie to it - see Session 2026-10-29.)
- Q: At the administrator's forced first sign-in, may the new password be identical to the initial password the operator supplied, so that submitting the same value clears the requirement without changing anything? → A: No — the change MUST set a value different from the initial password: a submission that repeats it is refused and clears nothing, and the requirement is cleared only by an actual change. The allowance that a new password MAY repeat the one it replaces stays as it is for every change made after the person's own password, because the policy keeps no history; only the forced first change is bounded (decided 2026-10-22, Clarifications).
- Q: When the sign-up form is submitted, does the pending request hold the submitted password until the account is created after verification, and in what form is it held so that no plaintext password is retained? → A: The password is irreversibly protected at submission — in the same protected form a stored password has, computed before the pending request is written — and the pending request holds only that protected value; the account is created from it when the correct code is entered, so no plaintext password is ever stored, logged, or cached while the request lives, and the page never retains or shows it. A request that is replaced or ends discards the value with it (decided 2026-10-22, Clarifications).
- Q: When more than one refusal applies to one submission — an exhausted rate limit, a filled hidden field, a submission before the minimum time, a value that breaks a rule, and a number that already has an account — which refusal does the sender receive first, and in what order are the checks applied? → A: One fixed order, applied identically on every page: the operation's rate limit first, then the sign-up form's hidden field, then its minimum time-to-submit, then the value rules, then the account-existence comparison. A submission refused at a step is decided by that step alone, so no later check runs; within the value step every failing rule may report its own message, but no account-existence comparison runs until every value rule has passed (decided 2026-10-22, Clarifications).
- Q: When a person asks for a new one-time code and the messaging channel does not accept the message, does the previously delivered code stay valid, or is it invalidated at the moment of the request so that the live request carries no valid code until another re-request succeeds? → A: The previous code stays valid until the channel accepts the new message: the replacement takes effect only when the new code is dispatched, a failed send leaves the previous code as the one valid code, the pending request stays live, and the failed attempt consumes no part of the limit on re-requesting. A moment with no valid code therefore never arises, and a channel outage does not cost the person the code they already hold (decided 2026-10-22, Clarifications).
- Q: Is the administrator's forced first change a password change for the two rules that follow one — does it end every existing session (FR-013), and does it send the security notice (FR-043) — or is it a special path exempt from both? → A: Both rules apply: it is a password change like any other, so every existing session of the account ends, including the restricted session the change was made from, and the administrator signs in again with the new password, now unrestricted; the security notice is sent as well, exactly as AC-047 already provides for the account's own change action, because the forced change replaces a password the account already held (decided 2026-10-22, Clarifications).
- Q: When a session ends by a platform revocation (FR-012), by a password change or reset made elsewhere (FR-013), or by a sign-out of every device (FR-011), does the merchant see the same ended-session state FR-049 defines, or do those paths have no defined surface? → A: Every path that ends a session leads to the one state FR-049 defines — the explicit state inside the frame, stating that the session has ended and offering the way to sign in again — so a platform revocation, a password change or reset, and a sign-out of every device join the inactivity timeout, the absolute maximum lifetime, an explicit sign-out elsewhere, and a block; no session-ending path shows an unrelated error, and the blocked variant still says the account is blocked. FR-049 and AC-053 carry the rule (decided 2026-10-22, Clarifications). (Revised 2026-10-28: the blocked variant states the block and withholds the way to sign in — see Session 2026-10-28.)
- Q: When the messaging channel accepts a one-time-code message but delivery later fails, is that a send failure that must produce the explicit failure state, or is "cannot be sent at all" bounded to a refusal at acceptance? → A: Bounded to a refusal at acceptance: a message the channel accepts is a successful send from the platform's side even if it is never delivered, a later delivery failure is outside the platform's observation and produces no failure state, and a person who does not receive an accepted message can request a new code subject to FR-034's limit; the explicit failure state and the retry it offers govern a channel refusal at acceptance alone. FR-034, AC-036, SC-009, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: Does the bound on incorrect entries count an expired code, or a code that a replacement has superseded, as an incorrect entry, or only a wrong value entered for the code that is currently valid? → A: Only a wrong value entered for the live code counts; an expired code and a superseded code are refused as expired or superseded and MUST NOT increment the bound, because neither is a wrong guess of the live code, so a stale code cannot lock a person out and the count measures exactly the guesses the bound exists to stop. FR-034, AC-036, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).
- Q: When a new sign-up or recovery request is started for a mobile number whose pending request is in the recovery flow's verified state, does the new request replace that state at once, or can the old verified state still set a password? → A: The new request replaces the pending request in every state, including the verified state: the verified state ends at once, its authority to set a password is withdrawn, and only the new code step is live, so two authorities never coexist for one number and a stale new-password step cannot set a password after a new code has been sent. FR-014, FR-034, AC-036, AC-041, the key-entities note, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications). (Dispatch-conditioned by Session 2026-11-01 (6): the replacement takes effect once the messaging channel accepts the new message; a dispatch the channel refuses leaves the previous state in place.)
- Q: Does the administrator's forced first change require the current (initial) password, as FR-013 requires of the account's own change action, or is the fresh sign-in proof enough? → A: It requires the current password: the forced change is a password change like any other for this rule, so a submission without the current password, or with a wrong one, is refused, clears nothing, leaves the account restricted, and counts as a failed password verification under FR-009, while a correct current password with a new value clears the requirement and lifts the restriction. FR-028, AC-030, US6's Independent Test, the administrator Assumption, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-22, Clarifications).

### Session 2026-10-24

- Q: When the recovery flow resets the password of a blocked account, what does the in-place confirmation state, given that AC-016 promises a sign-in that a block makes impossible? → A: It states both outcomes — the password was changed and the account is blocked — and says plainly that sign-in stays refused until an administrator returns the account to active; the block is disclosed only after the code is verified, so FR-015's uniformity is untouched, and the confirmation never promises a sign-in that cannot succeed. FR-014, FR-017, AC-016, and the matching edge case carry the rule (decided 2026-10-24, Clarifications).
- Q: When a new one-time code is successfully dispatched for a live pending request, does the pending request's lifetime start over, or does the original expiry still bound the replacement code? → A: It starts over — an accepted dispatch gives the pending request and the replacement code the full period already fixed, so a new code is never delivered with only the remainder of the request it replaced; the limit on requesting a new code bounds repeated extension, and a dispatch the channel refuses changes neither the code nor the expiry. FR-034, AC-036, the Key Entities note, and the matching edge case carry the rule (decided 2026-10-24, Clarifications).
- Q: A password change ends every session of the account by FR-013, while FR-043 requires a notice on a password change and on a sign-out of every device — does one action send one notice or two? → A: One — the session endings are the change's own consequence rather than a second action, so the change sends a single notice that reports it and the sessions it ended; the sign-out-of-every-device notice is sent when the merchant performs that action, not when a password change ends the same sessions. FR-013, FR-043, AC-047, and the matching edge case carry the rule (decided 2026-10-24, Clarifications).
- Q: SC-001 and SC-003 fix a three-minute journey while SMS delivery is outside the platform's control — is the time the code spends in delivery excluded from those criteria, as SC-009 excludes it? → A: Yes — both criteria measure the person's own actions and the platform's responses, and the delivery wait is excluded from the moment the messaging channel accepts the message, so a slow network does not fail a criterion the platform cannot control; SC-009, the Assumptions, and the end-to-end test note draw the same boundary (decided 2026-10-24, Clarifications).

### Session 2026-10-25

- Q: ADR-126 amends the Product Register with the Upload Catalog page as a standalone merchant page — does this slice's structural assertion of the sidebar's item list, and the register counts this specification names, change with it? → A: Yes — the frame's item list carries nine destinations now, with Upload Catalog between Catalog and My Files and pointing at the `/upload` route ADR-126 fixes, and the register is at twenty-eight pages; FR-039, AC-042, and US5 carry the nine-item list, the Assumptions bullet carries the count and the route alongside them, and the parentheticals in earlier entries that name eight destinations or twenty-seven pages are superseded as of this session. The page itself ships with R2, which the roadmap now assigns, and the structural verification is updated in the same change (decided 2026-10-25, Clarifications).

### Session 2026-10-27

- Q: The header now carries no drawer control, so what opens the sidebar drawer on a narrow screen, and what closes it? → A: The bottom navigation bar's «المزيد» slot opens the drawer, and the sidebar-collapse control inside the drawer closes it; «المزيد» does not toggle it, and the header carries neither control, so one control opens and a different one closes. FR-022, FR-023, FR-052, AC-024, and AC-042 carry the rule (decided 2026-10-27, Clarifications).
- Q: The footer band carries the four static-page links, but the frame now has a bottom bar on a narrow screen — is the band still rendered there, and where do its links go? → A: On a narrow screen the band is not rendered, and the same four links sit at the bottom of the drawer the bottom bar's «المزيد» slot opens, so the reachability requirement is unchanged and is still discharged by the slice that ships the first page carrying the frame (R2). FR-024, FR-052, AC-026, and the matching edge case carry the rule (decided 2026-10-27, Clarifications).
- Q: Does the bottom bar carry the same five slots for a guest and for a signed-in merchant, or does its composition vary by role? → A: It is one composition shown identically to both — Home, Upload Catalog, the raised search action to the Parts page, My Files, and «المزيد». A guest who activates a merchant-area slot — Upload Catalog or My Files — is taken to the sign-in page on FR-048's terms while the slot stays present and enabled, exactly as the sidebar's list is not varied by role. FR-052, FR-048, AC-042, and AC-052 carry the rule (decided 2026-10-27, Clarifications).
- Q: FR-052 sits between FR-024 and FR-025 and cites neither ADR-127 nor ADR-128, although ADR-127's consequences name FR-052. Where does it belong, and what must it cite? → A: It moves after FR-051, so it sits outside another requirement's block; the list stays grouped by subject rather than by identifier (see «Reading the list»), and no identifier is renumbered or reordered. It cites ADR-127 for the five slots and the drawer behaviour, ADR-132 for the scroll rule and the raised action's travel, and ADR-128 for the labels, measurements, and icon treatment. One sentence states the scroll rule ADR-132 fixes — the bar hides after 32px of cumulative downward scroll and returns on the first 16px of upward scroll or within 56px of the top. FR-022 and AC-026 keep their references to FR-052, and no identifier is renumbered. (Corrected 2026-10-29: the earlier wording said the requirements read in numeric order; they are grouped by subject instead. See «Reading the list».) FR-052, FR-022, and AC-026 carry the rule (decided 2026-10-27, Clarifications; ADR-127; ADR-128; ADR-132).
- Q: FR-024 says "This slice chooses the surface that carries them", but the constitution and ADR-096 already fix that surface as the footer band inside the frame. What does this slice still owe, and how must FR-024 and AC-026 read? → A: The surface is fixed, not chosen here: it is the footer band inside the frame (constitution, Product Scope; ADR-096 decision 2). This slice builds the band inside the frame and records the routes it links to in a decision record, as FR-024 already requires; no second surface choice is recorded. FR-024 is reworded to "The surface is the footer band (ADR-096); this slice builds it and records the routes it links to in a decision record", AC-026's "the surface that carries those links is chosen and built in this slice" becomes "the surface that carries those links is the footer band fixed by ADR-096 and built in this slice", and every earlier bullet that still says this slice chooses the surface gains a revision note naming ADR-096. FR-024, AC-026, and the matching Assumption carry the rule (decided 2026-10-27, Clarifications; ADR-096).
- Q: The specification fixes the uniform sign-in refusal, the one-time code's expiry, and each password-policy reason, but not their literal Arabic text — and the design reference shows a distinct fifteen-minute lockout alert. Does the product show a distinct locked state, and does the specification fix the literal text? → A: The product has no distinct locked state and no lockout text: an attempt made while the account is locked receives the same uniform refusal as a wrong password or an unknown number, so the reference's lockout alert is not transferred and no lockout string exists. No alert, banner, field message, or retry-time hint names the lock or invites the person back later. The literal Arabic text of the uniform refusal, the expired-code message, and the password-policy messages is not a specification value: the slice records it once in Arabic with Latin numerals and no emoji, and no acceptance criterion restates a specific string — AC-028 asserts the rendered text's identity to the record, and the criteria assert that the same case receives the same text. FR-008, FR-009, FR-026, FR-034, and FR-035 keep the rules, and no requirement or acceptance criterion is added (decided 2026-10-27, Clarifications). (Revised 2026-11-04, Clarifications: the authority is one record — the copy record — not the capture set or the external lab, and AC-028 asserts the rendered text's identity to that record; see Session 2026-11-04 (12).)

### Session 2026-10-28

- Q: The account's own change-password action counts a failed current-password check toward the lock, yet the lock refused sign-in only and did not block that action, so a session holder could keep guessing the current password without bound, and the only account-level effect was to lock sign-in. How is that check bounded? → A: The lock extends to that check: while the account is locked, the current-password check of the account's own change-password action is refused for the lock's full fifteen minutes, exactly as sign-in is, and the action resumes when the lock lifts; the lock still ends no session, ending the session remains available, and a check the lock refuses neither counts as a further failed attempt nor extends the lock. The same rule governs the administrator's forced first change. FR-009, FR-013, FR-028, AC-010, AC-030, SC-007, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: The send is attempted inside the request that asks for the code, and the code step opens only once the messaging channel accepts the message, but the platform names only acceptance and refusal. What happens when the channel neither accepts nor refuses within the platform's request timeout? → A: The wait for acceptance is bounded by the platform's request timeout, and a timeout is treated as a refusal at acceptance: the person sees the same explicit, retryable failure on the submission, the code step is not reached, the pending request stays live, a code already delivered stays valid, and the failed send consumes no part of the limit on requesting a new code. FR-034, AC-036, SC-009, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: The design map's bare layout carries the product's wordmark and the page title, while the specification says only that the frame is absent and never names either. Do the three bare pages carry them, and is the wordmark a link? → A: The bare layout carries both: the product's wordmark above the page title, and the page title above the form card. The wordmark is a non-interactive brand mark, not the frame's logo/home control and not a link; the page title names the page. Neither makes the page carry the frame, and the bare pages' only navigation remains the cross-links FR-036 fixes. FR-021, FR-036, AC-023, the matching Assumption, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: When the correct sign-up code is entered for a number whose existing account is blocked or holds the administrator role, what does the code step state — FR-006's generic direction to sign in or to recover, which cannot succeed for either account? → A: After ownership of the number is proven, the message states the situation explicitly: a blocked account is blocked, and sign-in stays refused until an administrator returns it to active; an administrator account's credential is managed on the administrator surface, and the merchant sign-in and recovery paths do not apply to it. The generic direction to sign in or to recover is bounded to an existing active merchant account, and nothing is disclosed before the code is verified, because FR-006's uniformity still binds the response, the following step, and the sending of the code. FR-006, FR-027, AC-006, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: The city list is one fixed flat list of governorates, cities, and areas, each entry carrying one Arabic name. May two entries share a name, and what identifies the chosen entry if they do? → A: Each entry's Arabic name is unique across the list: where a real place name recurs across a governorate, a city, and an area, the entry's one Arabic name carries the distinguishing qualifier — the governorate or the level — so no two entries share a name, the field stores the chosen name as it appears in the list, and the list stays one Arabic naming source with no separate identifier. FR-005, AC-005, the city-list Assumption, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: When one network origin exhausts a mobile number's budget for an authentication operation, is a request for that same number from a different origin also refused, or does that other origin stay unaffected? → A: The number's key is global to the number: once that number's budget for an operation is spent, a request for it from any origin receives the same distinct, explicit limit refusal, while every other number stays unaffected and another origin's own budget remains intact for that operation on every other number, and for the other two operations. The origin key stays per-origin, so exhausting it refuses that origin's requests alone; a request is refused when either key is spent, and the refusal is the same distinct, explicit limit refusal whichever key produced it, so it names the limit rather than the key. FR-029, FR-033, AC-033, AC-035, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: What is the smallest screen width the interface must support, given that AC-024 and SC-006 require a narrow-screen check while the edge case names "the smallest supported width" without fixing it? → A: 320 CSS pixels — the WCAG 2.2 AA reflow floor (1.4.10) — so the narrow-screen check and the reflow check are measured at 320px and at a wide width of 1024px or more, the design reference's 375px captures remain evidence of the reference appearance rather than the supported floor, and the edge case's "narrower than the smallest supported width" means narrower than 320px. SC-006, AC-024, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: When a submission on one of the three bare pages is refused, do the values the person typed stay in the form, and which values are cleared? → A: The page stays on the step that was submitted and shows its inline message, and every field keeps the value the person typed except the password fields — which are cleared and never re-displayed, because no password is ever retained or shown — and the one-time-code field, which is cleared after a refused entry. The sign-up form therefore keeps the full name, mobile number, city, and shop name; the sign-in and recovery forms keep the mobile number; and the silent hidden-field refusal is unchanged, returning the response of a successful submission and stopping the flow there rather than showing a message. FR-038, FR-040, FR-041, AC-041, AC-043, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: In the account's own change-password action — and in the administrator's forced first change, which follows the same rule — which check runs first when the new password and the current password are both wrong: the value rules, including the password policy and the forced change's different-from-initial rule, or the current-password check — and does a submission refused by a value rule count as a failed attempt toward the lock? → A: The value rules run first, on the principle FR-051 fixes for the three bare pages: a submission whose new password fails the policy, or repeats the initial password at the forced first change, is refused on that ground before any current-password check runs and does not increment the consecutive-failed-attempt count, because no password verification took place; only a submission that passes every value rule reaches the check, and a failed check then counts under FR-009 and is refused while the lock runs. The order is observable and asserted for both the account's own action and the forced first change. FR-009, FR-013, FR-028, FR-035, FR-051, AC-010, AC-030, AC-037, SC-007, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: SC-004 requires the enumeration test to assert how long each response takes, but no tolerance defines "the same time" — does the criterion fix a numeric tolerance, and where does it live? → A: The test asserts text, status, and response path for equality and the response's duration against a numeric tolerance recorded with the test design; that record fixes the tolerance and the sampling the test uses, measured over repeated samples of the account-exists and no-account cases, so the criterion is testable without this specification pinning a number it cannot tune. A response that does measurably less work for a number with no account still fails the test, and the criterion's other bounds — the three flows' steps, the rate-limit, format, and re-request refusals, and the status and role refusals — are unchanged. FR-006, FR-008, FR-015, SC-004, AC-009, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: The ended-session state offers the way to sign in again, yet a blocked account's block refuses every sign-in — does the blocked variant keep that way, or withhold it? → A: It withholds it — the blocked variant states that the session has ended and that the account is blocked, and offers no way to sign in, because FR-014 already refuses to send a blocked merchant to a sign-in that cannot succeed; the unblocked variant keeps the way to sign in, so no control the state carries can fail for the reason the state itself reports. FR-049, AC-053, and the matching edge case carry the rule (decided 2026-10-28, Clarifications).
- Q: When the password-recovery flow's verified state reaches the end of the pending request's lifetime while the person is still on the new-password step, what does the page show, and what does a submission made at that point receive? → A: The state ends at that moment and the page returns to the flow's first step with an explicit, retryable notice that the request expired and that a new code must be requested; a new password submitted after the state has ended is refused on the same ground and sets no password, exactly as an expired code is refused, so no password is ever set by an expired state and no one is left on a step whose authority has ended. FR-014, FR-034, FR-038, AC-036, and AC-041 carry the rule (decided 2026-10-28, Clarifications).
- Q: At sign-up, when the correct code is entered and the account's creation would succeed but the session that makes it usable cannot be created, does the account survive with the person told to sign in, or does the step leave neither an account nor a session? → A: It leaves neither — the account's creation and the session's creation are one indivisible step, so a failure at that point creates no account, ends no pending request, and keeps the correct code usable, exactly as FR-034 already states for a code consumed only once the account is created; the person sees the inline, retryable failure FR-040 requires and retries the same code, and the confirmation FR-004 requires is never shown for an account the merchant is not signed in to. FR-004, FR-034, FR-040, AC-004, AC-036, and AC-043 carry the rule (decided 2026-10-28, Clarifications).
- Q: The header's notifications control is built and verified structurally here, yet the specification never said what activating it does — does it point at the Notifications route, or is it present without a target until the notification list lands? → A: It points at the Notifications route the frame's decision record already fixes for the sidebar's Notifications item, so no route is added and the frame carries no control without a definite target, exactly as ADR-102 decision 7 provides; the unread count and the page itself arrive with R9, which adds the counter component. FR-020, FR-024, FR-039, AC-022, and AC-042 carry the rule (decided 2026-10-28, Clarifications; ADR-102).
- Q: SC-004 says 100% of sign-in responses are indistinguishable between a number that has an account and one that does not, yet a successful sign-in can occur only when the account exists and the password is correct (FR-007, AC-008) — is the criterion bounded to failed sign-in attempts? → A: Yes — SC-004's sign-in clause is bounded to attempts that do not succeed: a successful sign-in is outside the enumeration comparison because it requires the account's correct credentials and reveals nothing to a caller who does not hold them, while every failed sign-in attempt that reaches the account-existence comparison stays inside it, whatever its ground — a wrong password, an unknown number, a locked, a blocked, or an administrator account on the merchant surface; the rate-limit and format refusals stay outside it as FR-033 and FR-042 already provide. FR-008, SC-004, and AC-009 carry the bound; no behaviour changes and no identifier is added (decided 2026-10-28, Clarifications).
- Q: A sign-in or password-recovery submission whose value is not a valid Libyan mobile number has no normalized form, yet the rate limit is decided before the value rules (FR-051) and each budget is keyed on the normalized number (FR-033) — which key bounds such a submission? → A: Only the network-origin key — the number key exists only for a value that normalizes, so a malformed value spends no number's budget and a spent number key refuses no malformed value; the submission still consumes the origin's budget for its operation, because the limit is decided first, and the refusal it then receives is decided by the remaining steps of FR-051 rather than by the limit. The sign-up form's account-creation budget follows the same rule (FR-029). FR-029, FR-033, FR-042, FR-051, AC-035, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: The operator's provisioning action creates the administrator account directly (FR-028) but never says which status the new account carries, while its first sign-in must be accepted — is the account created active? → A: Yes — it is created with the status active and the administrator role; the action never sets the closed set's other value, which is reachable only through the administrator's Users page (R13), so the forced first sign-in is never refused by a status the action itself set. The account field rules and the forced-change requirement are unchanged. FR-016, FR-028, AC-030, the administrator Assumption, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: When the limit on requesting a new one-time code is exhausted for a pending request and a fresh sign-up or recovery request is then started for the same number, does the fresh request begin with a full allowance of new-code requests, or does the spent allowance still bound it? → A: It begins with a full allowance: the limit is counted per pending request, and a fresh request for the same number starts a new verification, because the operation's own budget (FR-033) already bounds how often a fresh request can start, so a person who mistyped a code is not barred from trying again while a client cannot send SMS without bound. The spent allowance is not carried across requests, and the transient store therefore carries the request's re-request count alongside its expiry and its incorrect-entry count. FR-034, AC-036, the Key Entities note, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: Does "a failed sign-in attempt" in FR-037 mean every sign-in attempt that reaches the account-existence comparison and does not succeed, or only a failed password verification against an existing, active account? → A: The broader event: every sign-in attempt that reaches the account-existence comparison and does not succeed is recorded — a wrong password, an unknown number, a locked account, a blocked account, and an administrator account on the merchant sign-in surface — because the record exists for security observation and not for the lock's count, so a blocked or locked account's refusal is not silent. A format refusal (FR-042) and a rate-limit refusal (FR-033) are not attempts against an account and emit no such record, exactly as they sit outside SC-004's comparison. FR-037, AC-040, SC-004, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: On a narrow screen, besides the collapse control inside the drawer, may the drawer also be closed by pressing Escape or by activating something outside it, and where does the focus return when it closes? → A: Yes — the drawer closes on the collapse control, on Escape, and on an activation outside it, and the focus returns to the «المزيد» slot that opened it, mirroring the account menu's three dismissal paths (FR-047); the collapse control remains the control that closes the drawer, and Escape and an outside activation are dismissals rather than controls, so the opener and the closer remain different controls. FR-022, FR-052, AC-024, US5, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).
- Q: When the bound on incorrect one-time-code entries is reached, does the page return to the flow's first step with an explicit notice — as it does when the recovery flow's verified state expires — or stay on the code step refusing every further entry? → A: It returns to the flow's first step with an explicit, retryable notice that the request ended and that a new code must be requested, mirroring FR-014's expiry rule, so the person is never left on a step whose request has ended; the fresh submission begins a new verification with the incorrect-entry count at zero, and no further code for the ended request is accepted. FR-034, FR-038, AC-036, AC-041, and the matching edge case carry the rule (decided 2026-10-28, Clarifications).
- Q: While a request for a new one-time code is in flight from the code step, does the in-progress guard also disable the re-request control, so a repeated activation cannot dispatch a second code or spend two of the allowed re-requests? → A: Yes — the guard governs the re-request control exactly as it governs the code entry's submit control: while the request is in flight the control is disabled and the step shows the in-progress state, so a repeated activation starts no second dispatch and spends one re-request; the re-request limit remains the server-side authority, exactly as FR-031's uniqueness remains the authority for a duplicate submission. FR-040, FR-034, FR-038, AC-043, and the Test Coverage Request carry the rule (decided 2026-10-28, Clarifications).

### Session 2026-10-29

- Q: FR-013 delivers the account's own change-password action as behaviour with no page, while FR-044 and AC-048 list it among the requests issued from a browser session - does the action have a request in this slice, and does forgery protection apply to it? → A: It does - the action is reachable as a request from a signed-in session even though no page offers it in this slice, so the request-forgery protection FR-044 requires covers it and AC-048 asserts it; the integration tests exercise it through that request, and R7 adds the page alone. A control whose runtime this slice defers - the account menu's sign-out and the settings section's sign-out of every device - is covered by the same rule when the slice that ships the first page carrying the frame exposes its request. (Revised 2026-11-03, Clarifications: both sign-out requests are served by this slice, so FR-044's enumeration and AC-048's now name them and the protection covers them here, while the frame-carrying slice adds the controls alone; see Session 2026-11-03 (9).) FR-013, FR-040, FR-044, AC-048, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications). Where an earlier record calls the action surface-less, it is read the same way: no rendered page offers it, while its request exists and is protected.
- Q: The recovery flow completes a reset for a blocked account but refuses one for an account that holds the administrator role - which rule decides when the account is both blocked and an administrator? → A: The role decides: the reset is refused after the code is verified, no password is set, no session is created, and the platform states that the credential cannot be reset on this surface, while the block is not mentioned, because the credential path is closed on the role ground before the status could matter. The request, the following step, and the dispatch stay indistinguishable, and nothing is disclosed before the code is entered. FR-014, FR-027, AC-016, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: One pending request is live per mobile number, so a browser can hold more than one at once when a person returns to the first step and submits another number - which code step does a reload resume, and does returning to the first step keep the page tied to the request it was showing? → A: The page resumes the request it most recently submitted from that browser, so the person's last action decides which code step they see; the control that returns to the first step ends the page's tie to the request it was showing while leaving that request live on FR-034's terms, so a reload at the first step shows the first step rather than a code step, and a fresh submission becomes the request the page resumes. No request is ended or resent by the rule. FR-038, AC-041, the matching edge cases, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: FR-037 records "a session revocation", but a session ends in seven ways in this slice - does every end emit that record, or only the explicit ones? → A: Only an explicit end driven by the person or the platform is a revocation and emits the record: a sign-out, a sign-out of every device, and a platform revocation. A session that ends at its inactivity timeout or at its absolute maximum lifetime is an expiry rather than a revocation and emits no such record, and the endings a password change or reset produces are part of that change's own record while the withdrawal a block produces belongs to the block's own event, so one action never emits a second record for the sessions it ended. FR-037, AC-040, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: FR-031 and AC-007 name four tolerated spellings of the mobile number, while the uniqueness rule speaks of "two spellings" generally - is that list closed, and what happens to a value typed with separators or with the country code in its international-prefix form? → A: The list is not closed: any spelling that resolves unambiguously to a +218 mobile number is read as that number - separators and spaces are ignored, a leading national zero is read as part of the national number, and a country code typed as part of the value is read once rather than doubled, with the plus sign or the international prefix - so it is neither a second account nor a refusal; a value that does not resolve is refused with the distinct format refusal FR-042 names. The form still offers no dial-code selector, and the number is stored in the one +218 form. FR-002, FR-031, FR-042, AC-007, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).

### Session 2026-10-29 (2)

- Q: When a merchant changes the password from inside the account while a password-recovery request for their number is still live — or has already reached the verified new-password step — does that change end the recovery request, or can the recovery still set another password? → A: The change ends it: a password change made from any other path — the account's own change action (FR-013) or the administrator's forced first change (FR-028) — ends a live recovery request for that number and any verified state it holds, so a reset authority created before the change never survives it, and the person starts a fresh recovery; a successful sign-in alone does not end it, because it does not change the credential. FR-013, FR-014, FR-034, AC-016, the Key Entities note, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).

### Session 2026-10-29 (3)

- Q: The pending request holds the one-time code, and the specification fixes the protected form of the password it holds but never says what form the code itself is held in — is the code held in an irreversibly protected form, or as it was dispatched? → A: It is held in an irreversibly protected form: the code is protected when it is dispatched, the pending request carries only that protected value, and an entered code is verified through the same form alone, so the store never holds a usable code in plaintext and a store that is read hands no one a live code; a replacement's protected value replaces the previous one at the accepted dispatch, and the value is discarded when the request is replaced or ends. FR-034, AC-036, the Key Entities note, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: FR-051 applies the operation's rate limit first on every submission a page makes, while FR-033's budget is the account-creation, sign-in, or recovery operation's limit — do the later steps of a page (the one-time-code entry and the new-password submission) consume that budget, or are they refused by it when it is spent? → A: Neither: the budget is consumed by the request that starts the operation alone — the sign-up form's submission, the sign-in submission, and the password-recovery request — and the later steps of the same page neither consume it nor are refused by it, because they are bounded by the code's own incorrect-entry bound and the limit on requesting a new code (FR-034); FR-051's step (1) therefore decides the initiating request, and a later step is decided by the remaining steps of that order. FR-029, FR-033, FR-034, FR-051, AC-035, AC-036, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: In password recovery, once the correct code is verified and the reset cannot proceed — the number has no account, or its account holds the administrator role — the specification requires the platform to state the outcome but never says what the page does with it; does the code step become the message, or does the page return to the flow's first step? → A: The code step is replaced in place by the outcome message, with no navigation and no new route, and the person stays on that message; a reload or a fresh opening returns the page to the flow's first step, because the pending request has ended, and the message carries no retry control because there is nothing to retry — the page's cross-link to sign-in (FR-036) remains the way forward, and sign-in carries the way to sign-up. FR-014, FR-036, FR-038, AC-016, AC-017, the matching edge cases, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).
- Q: The drawer closes on Escape or an outside activation with the focus returning to «المزيد», and the account menu closes when focus leaves it, but the specification never says where focus goes when either surface opens — does it stay on the opener, or move into the surface? → A: It moves into the surface: opening the drawer moves focus to its first focusable control and keeps it within the drawer until it closes, and opening the account menu moves focus to its first item, after which the menu still closes when focus leaves it (FR-047); in both cases the focus returns to the control that opened the surface when it closes. The rule is bound here and its runtime is verified by the slice that ships the first page carrying the frame, at the same boundary as the surfaces' other behaviour. FR-022, FR-047, AC-024, AC-051, SC-006, and the Test Coverage Request carry the rule (decided 2026-10-29, Clarifications).

### Session 2026-10-30

- Q: The specification states that no email address exists anywhere, while the platform's storage holds a reserved, non-routable placeholder derived from the normalized mobile number in the email field the platform's storage requires — which wording governs? → A: The product-level rule governs, and the stored value is bounded as a sentinel: no email address exists as a product datum — none is collected, displayed, used to identify an account, used to recover one, or used to send anything — while a reserved, non-routable placeholder derived from the normalised mobile number is not an address this rule governs, because it is never supplied by a person, never displayed, never used to sign in, and can never receive mail; the exact placeholder and the storage deviation are recorded as a deviation with an owner and a review date. The `User` invariant in Key Entities and the matching Assumption carry the bound (decided 2026-10-30, Clarifications).
- Q: After ADR-126 added the Upload Catalog page, FR-048 and AC-052 still enumerate only five merchant-area destinations, so a guest who activates the sidebar's Upload Catalog item is not covered by the rule — which destinations does it govern? → A: The rule governs the nine destinations FR-039 fixes, split by area: the six merchant-area destinations — Upload Catalog, My Files, Cart, Notifications, Messages, and Profile — take a guest to the sign-in page, while the three public destinations — Home, Parts, and Catalog — open their own pages; the enumeration in FR-048 and AC-052 is corrected to name Upload Catalog, and both cite FR-039 as the list's authority so the enumeration and the list cannot drift apart (decided 2026-10-30, Clarifications).
- Q: The frame's rule says it appears on the public pages and in the merchant's area, but the term "public pages" is never defined — does it include the sign-up, sign-in, and password-recovery pages, which a guest can reach without an account? → A: It does not: the public pages are the public site's own pages that carry the frame — Home, Parts, and Catalog — while sign-up, sign-in, and password recovery are the authentication pages, shown bare with no frame (FR-021), and the error page and the four static pages are bare in the same way; the term is defined in FR-020 so no reader takes "public" to mean "reachable without an account" (decided 2026-10-30, Clarifications).
- Q: FR-024 says the footer band is shown on every page that carries the frame, while the same requirement says it is not rendered on a narrow screen — does the band appear at the narrow width, and if not, where do its four links go? → A: It does not appear: the band is rendered at the frame's wide width, 1024 CSS px and up, on every page that carries the frame, and below 1024px it is not rendered at all, with the same four static-page links sitting at the bottom of the sidebar drawer the bottom bar's «المزيد» slot opens, so the way to the static pages is never lost; FR-024 states the width condition in its presence rule, AC-022 names the band among the surfaces present at the wide width, and AC-023 names it among the surfaces absent from a bare page (decided 2026-10-30, Clarifications).

### Session 2026-10-31

- Q: Do the language, right-to-left, Latin-numeral, and no-emoji rules (FR-026, SC-008) reach a value a person supplies — the full name and the optional shop name — or do they bind the text the platform itself writes? → A: The language and numeral rules bind the platform's own text — its labels, its messages, and the numerals it generates — and not a value a person supplies: a name or a shop name keeps the script and the digits it was typed with, is shown as typed, and is never transliterated or re-numeralised, while the mobile number and the one-time code are structured values the platform parses and renders in their canonical Latin-numeral form (FR-031, FR-038). The no-emoji rule is not bounded that way: no emoji may appear in any text a person reads inside the platform, a table cell and a profile field included, so a value carrying an emoji cannot be shown as it is; the platform refuses it at input with an explicit message naming the reason rather than stripping or rewriting the person's text, and that refusal is a rule on the value's characters rather than an alphabetic-shape rule, so FR-001's "letters and numerals alike" stands and the refusal is decided among the value rules, before account existence is consulted, adding no signal to the sign-up flow's uniformity. FR-001, FR-026, FR-038, FR-045, SC-008, AC-028, AC-046, and the Test Coverage Request carry the rule.
- Q: When a person activates a navigation item inside the open sidebar drawer, does the drawer close, where does the focus settle after the move, and does the bottom bar stay visible while the drawer is open? → A: Activating an item closes the drawer and performs the navigation it names — including a guest's merchant-area item, which goes to the sign-in page on FR-048's terms — and that close is part of the activation rather than a dismissal, so it asks for no confirmation. The focus settles at the start of the destination page's content, on its page heading, and does not return to «المزيد», because the move leaves the page that carried the drawer; the return to «المزيد» governs the three dismissals that do not navigate — the collapse control, Escape, and an activation outside the drawer. The bottom bar stays rendered and visible while the drawer is open, with «المزيد» showing its open state, because the slot is the drawer's opener and the focus's return target; opening the drawer is not a downward page scroll, and scrolling inside the drawer still does not count, so the scroll rule never hides the bar under an open drawer. FR-022, FR-048, FR-052, AC-024, the matching edge case, and the Test Coverage Request carry the rule.
- Q: What does the header carry at the smallest supported width of 320 CSS px when the four controls — the logo/home control, the notifications control, the theme switch, and the account control — no longer fit side by side? → A: All four remain: no control is dropped, folded into an overflow menu, or moved into the account menu, because the header's composition is fixed (FR-023) and the frame is composed once rather than varied by width. The three inline-end controls stay icon-only at the touch floor the design contract fixes, with their accessible names, and the logo/home control keeps the wordmark at the smallest form recorded for it — a shortened wordmark, never a new image asset — with the row's gaps tightened; the header stays one row with no horizontal page scroll. FR-023, SC-006, AC-025, the matching edge case, and the Test Coverage Request carry the rule.
- Q: Is the ended-session state FR-049 shows announced to assistive technology, and where does the focus go when it appears? → A: It is announced when it replaces the page's content, with the announcement taking precedence over the page's other announcements, because it interrupts work the person was doing and explains why. The focus moves to the state's heading, made focusable programmatically for that purpose, and never remains on a control the page carried before the refusal; the blocked variant, which carries no way to sign in, lands on the same heading. The rule is the one the bare pages' step changes already follow — the focus lands on the step now shown, its first field, or its heading when it carries no field — applied to the frame's one state. FR-049, AC-053, SC-006, the matching edge case, and the Test Coverage Request carry the rule.
- Q: Which acceptance criterion asserts FR-052's scroll rule for the bottom bar, or is the rule's deferral to the first frame-carrying slice recorded explicitly? → A: AC-042 carries it: the criterion asserts the rule's thresholds and transition as FR-052 states them, and records in the same clause that this slice verifies the bar's composition structurally while the scroll behaviour is verified by the slice that ships the first page carrying the frame (R2), because no page here scrolls under the bar. No new criterion is added and no identifier moves; AC-024 keeps the drawer's opener and closer, and AC-042 gains the scroll rule alone.

### Session 2026-10-31 (2)

- Q: AC-031 states that a sign-up submission with the hidden field filled receives the same response as a successful submission, while FR-051 and AC-055 decide the operation's rate limit first, so an over-budget honeypot submission receives the distinct limit refusal — which response does such a submission receive, and how is AC-031 bounded so the two criteria cannot be read as conflicting? → A: The rate limit governs first: AC-031 is bounded to a submission the operation's rate limit does not refuse first, and a submission whose account-creation budget is already spent receives the distinct, explicit limit refusal whatever else is wrong with it, a filled hidden field included, because FR-051's step (1) decides the initiating request before its step (2) reaches the hidden field. The bound narrows AC-031's scope alone and changes no requirement: FR-029 speaks only of a submission the hidden field refuses, and a submission the limit refuses first never reaches that check, so the hidden field's silence, its absent pending request, and its undispatched code stand unchanged for every submission the order leaves to it, and AC-033's rule that a hidden-field submission still consumes the budget is untouched. FR-029, FR-051, AC-031, AC-033, AC-055, and the matching edge case carry the rule (decided 2026-10-31, Clarifications).

### Session 2026-10-31 (3)

- Q: The Independent Test paragraphs of US4, US5, and US6 claim full isolation, while each of those stories carries one test that necessarily runs on another story's delivered surface — which exception covers each test, and what does each story verify without another story? → A: US4's status read, retained data, and delete-path absence are verified without another story, while the blocked-account half of its status test and its withdrawn-session assertion run through US2's sign-in and session-read surfaces under `EX-008`; US5's composition is verified structurally without another story under `EX-007`, and its bare-page end-to-end test opens the three bare pages this slice ships (US1, US2, US3), covering AC-023, under `EX-009`; US6's provisioning and forced-change behaviour are verified with its own fixtures, and its tests over US2's sign-in, lock, revocation, and notice behaviour and US3's recovery role refusal, covering AC-029, are covered by `EX-010`. The three newly registered exceptions (EX-008, EX-009, EX-010) carry the repository owner as approver and a 2026-12-01 review date; no requirement, criterion, or success criterion changes (decided 2026-10-31, analyze C2, Clarifications; revised 2026-10-31, analyze B: the withdrawn-session assertion runs only on a path that carries a session, which is US2's session read and already inside `EX-008`'s scope, so it leaves the list verified without another story, and the count now names the three exceptions this session registered). (Revised 2026-11-01, Clarifications: `EX-011` and `EX-012` were registered after this session and are now named by US7's and US2's Independent Tests respectively, so the count of three names the exceptions this session registered alone.) (Revised again 2026-11-01 (13), Clarifications: `EX-009`'s scope names all three bare pages — sign-up (US1), sign-in (US2), and password recovery (US3) — because AC-044 reaches all three and one end-to-end test opens them all; see Session 2026-11-01 (13).)

### Session 2026-10-31 (4)

- Q: AC-055 says that a submission filling the hidden field receives the silent response "even when another rule would also refuse it", a reading that includes the operation's rate limit, which FR-051 decides first — how is the clause bounded so it cannot be read as overturning the limit's precedence? → A: The clause is bound to a rule later in the fixed order: the silent response is asserted only where a rule after the hidden field — the minimum time-to-submit, a value rule, or the account-existence comparison — would also refuse the same submission, while the operation's rate limit stays step (1) and is not such a rule, so an over-budget submission receives the distinct, explicit limit refusal whatever else is wrong with it, a filled hidden field included, exactly as AC-031 and AC-033 provide. AC-055 states the bound in that wording; the matching edge case already carries it ("unless the account-creation rate limit refuses the submission first … the hidden field is never the refusing step") and is unchanged. No requirement, criterion, or identifier moves, and FR-051's order is unchanged. FR-029, FR-051, AC-031, AC-033, AC-055, and the matching edge case carry the rule (decided 2026-10-31, Clarifications).
- Q: SC-009 states that every authentication step completes "under 1 second at p95", a strict bound, while the recorded numeric bounds, the budget check, and the load profile accept p95 = 1,000 ms — which bound governs, and where is it stated? → A: The bound is inclusive and exact: SC-009 states p95 ≤ 1,000 ms and is the single authority for the figure, and the recorded bound cites it and restates the same bound, while the budget check and the load profile keep failing a run only when p95 exceeds 1,000 ms. "Under 1 second" is replaced by the exact figure so a measurement of exactly 1,000 ms cannot be read two ways; no identifier moves, no other success criterion changes, and the recorded p50 ≤ 150 ms bound is untouched (decided 2026-10-31, Clarifications).

### Session 2026-11-01

- Q: The recorded numeric values fix a maximum password length of 128
  characters, while FR-035 and AC-037 state a minimum and the
  common-or-breach rejection alone — so is an explicit maximum stated in the
  specification, or is the maximum dropped? → A: The maximum is stated:
  FR-035's policy now requires a minimum length, refuses a password longer than
  a maximum length, and rejects common or breached passwords, with both numeric
  values recorded separately, and a password longer
  than the maximum carries its own message among the reasons the form names,
  none of which reveals whether the number has an account. AC-037 asserts the
  longer-than-the-maximum case alongside the minimum and the breach cases, and
  the Test Coverage Request names both lengths. Dropping the maximum was
  rejected: the refusal the platform already enforces would otherwise be a bound the
  specification does not own, and an unbounded value is untestable at the form.
  FR-035, AC-037, and the Test Coverage Request carry the rule (decided
  2026-11-01, Clarifications).
- Q: FR-001, FR-026, and AC-046 refuse a value carrying an emoji — FR-038,
  FR-045, AC-028, and SC-008 reading the same rule — but no source defines what
  an emoji is, so which Unicode predicate decides it? → A: The predicate is
  fixed in FR-026, once: a value carries an emoji when it contains a code point
  with the Unicode property `Extended_Pictographic` — the regional-indicator
  code points that form a flag are among them — or the variation selector
  U+FE0F, or the combining encloser keycap U+20E3, so the keycap and
  emoji-presentation forms those two complete are refused as well; a numeral or
  a letter typed without any of the three is never an emoji, so FR-001's
  "letters and numerals alike" stands unchanged and a bare numeral is accepted
  as typed. FR-001 names the predicate as FR-026 fixes it, AC-046 asserts its
  boundary — a keycap sequence and a flag refused, a bare numeral accepted —
  and FR-038, FR-045, AC-028, SC-008, and the Test Coverage Request read it the
  same way (decided 2026-11-01, Clarifications).
- Q: FR-023 and AC-025 keep all four of the header's controls in one row at 320
  CSS px, while a guest's header carries three — the sign-in action replaces the
  account control and the notifications control, and the guest keeps the theme
  switch — so what does the same rule keep for a guest? → A: The guest's three:
  at the smallest supported width of 320 CSS px the rule keeps the logo/home
  control, the theme switch, and the sign-in action in the one row for a guest —
  none dropped, folded into an overflow menu, or moved — each with its
  accessible name and its touch target, so the four-control sentence reads as
  the signed-in merchant's composition and the guest's is stated beside it.
  US5's story, FR-023, AC-025, SC-006, the Test Coverage Request, the frame
  Assumption, and the matching edge case carry the rule (decided 2026-11-01,
  Clarifications).
- Q: FR-003 refuses an unresolvable value on the sign-up form with "the format
  refusal FR-042 names", while FR-042 states that refusal at sign-in and in
  password recovery alone — so which governs the sign-up form's format refusal?
  → A: FR-042 is widened to govern every page this slice ships that takes a
  mobile number — the three bare pages — with one and the same distinct,
  explicit refusal; on the sign-up form it is decided within the value-rules
  step FR-051 fixes, after the hidden field and the minimum time-to-submit have
  decided theirs, so FR-003's reference reads against the widened requirement
  rather than a narrower one. AC-003 now cites FR-042 beside FR-003, AC-007 and
  AC-045 keep their citations, and FR-033's tail names the format refusal among
  the value rules the order decides at sign-up (decided 2026-11-01,
  Clarifications).
- Q: AC-028's first clause asserts that any screen's text is Arabic and
  right-to-left with Latin numerals, yet the same criterion and FR-026 show a
  supplied full name or shop name as typed — so does that clause bind the
  platform's own text or every character on the screen? → A: It binds the
  platform's own text: the clause now names the text the platform itself writes
  — its labels, its messages, and the numerals it generates — so a supplied
  value keeps the script and digits it was typed with, exactly as FR-026 states,
  while the no-emoji clause stays unbounded and reaches every text a person
  reads. AC-028 carries the rule (revised 2026-11-01, Clarifications).
- Q: FR-008, FR-009, FR-017, and FR-027 each restate the uniform refusal's terms
  — the same text, the same status, and the same response path — so which
  requirement owns that definition? → A: FR-008 owns it: the definition is
  stated there once, and FR-009, FR-017, and FR-027 now name "the uniform refusal
  FR-008 defines" without repeating its terms, so the refusal's shape has one
  authority and a later change to it cannot leave a stale copy behind. No rule
  changes: each requirement keeps the behaviour it already carried. FR-008,
  FR-009, FR-017, and FR-027 carry the rule (revised 2026-11-01,
  Clarifications).
- Q: The Test Coverage Request placed the recovery operation's budget and its
  later steps' exemption in a named task after US3 — a task identifier a
  specification does not own — so what replaces that reference?
  → A: The final phase: the sentence now places that verification in the final
  phase, after US3, and cites FR-033 and FR-051, which carry the rule — the
  recovery request consumes the recovery budget while the code entry and the
  new-password step neither consume it nor are refused by it — so the
  specification names no task and the reference survives any renumbering of the
  task list. The Test Coverage Request carries the rule (revised 2026-11-01,
  Clarifications).

### Session 2026-11-01 (2)

- Q: Should FR-023 state the account menu's composition itself, or name the
  menu FR-047 fixes while that requirement is its single authority instead of
  FR-023 restating the menu's items and its sign-out confirmation? → A: The
  reference instead of the narration: FR-047 owns the menu, FR-023 names the
  account menu FR-047 fixes and no longer restates its three items or its
  sign-out confirmation, so the menu's shape has one authority and a later
  change to it cannot leave a stale copy behind; the governing reading is
  replace instead of duplicating (decided 2026-11-01, Clarifications).
- Q: Does a screen narrower than the smallest supported width of 320 CSS px
  stay inside the specification's supported scope, or is it placed outside it?
  → A: Outside the supported scope — the edge case that promised such a screen
  still renders the frame without breaking is reworded, not deleted: it now
  states that a viewport narrower than 320 CSS px is outside the supported
  scope and that the specification asserts how the platform renders at the
  supported widths, 320 CSS px and up, alone, so nothing is asserted about a
  viewport narrower than that floor (decided 2026-11-01; corrected 2026-11-01,
  Clarifications).
- Q: After the sign-up form's hidden-field refusal — the silent match that
  returns the response a successful submission receives without starting a
  pending request — what does the person who submitted it see? → A: The person
  stays in the form: the flow stops at that response, no pending request exists
  for the page to resume (FR-038), so the code step is never reached and the
  form's first step is what the person is left on; the response carries no
  next-step content, so the same response can lead a successful submission to
  the code step and this refusal to the first step, and the response's shape is fixed so both hold (decided 2026-11-01, Clarifications; revised
  2026-11-01 (4): the silence is bounded to the response's text, status, and
  timing — see Session 2026-11-01 (4)).

### Session 2026-11-01 (3)

- Q: FR-020 restated the header's composition that FR-023 owns — the logo/home
  control, the notifications control with its route and unread count, the theme
  switch, and the account control — so which requirement owns the header, and
  what does FR-020 state? → A: FR-023 owns it: FR-020 now names the frame's four
  surfaces — the header, the sidebar, the bottom bar, and the footer band —
  together with the product's icon set and typography, and refers each surface's
  composition to the requirement that owns it (the header to FR-023, the sidebar
  to FR-022 and FR-039, the bottom bar to FR-052, and the footer band to FR-024),
  so the header's controls, the notifications route and unread count, and the
  logo's wordmark are stated once in FR-023; the governing reading is replace
  instead of duplicating, as the 2026-11-01 (2) session applied to FR-023 and
  FR-047. No identifier is added, removed, or renumbered (decided 2026-11-01,
  Clarifications).
- Q: FR-052 and FR-021 called the frame's fourth surface the "bottom navigation
  bar" while the rest of the specification called it the "bottom bar" — which form is
  canonical, and where is it defined? → A: The short form is canonical: FR-020
  defines it once as the short form of the bottom navigation bar and states that
  this specification uses it throughout, and every
  normative occurrence — US5, FR-021, FR-052, AC-022, AC-023, and AC-042 — now
  reads "bottom bar"; the 2026-10-27 Clarifications entry keeps its original
  wording as a dated record. No identifier is added, removed, or renumbered
  (decided 2026-11-01, Clarifications).
- Q: The 2026-11-01 (2) record said the edge case for a screen narrower than 320
  CSS px "is deleted", while the edge case remains in the specification as an
  out-of-scope statement — is the record corrected or the edge case deleted? →
  A: The record is corrected: the edge case is reworded, not deleted, and the
  2026-11-01 (2) bullet now says so, because the case carries the boundary's
  lower side — that nothing below 320 CSS px is asserted — which no other
  section states; deleting it would remove that boundary. The record and the
  specification now agree. No identifier is added, removed, or renumbered
  (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (4)

- Q: The sign-up form's hidden-field refusal returns the same response a successful submission receives, yet FR-029 leaves the person on the form's first step while a successful submission reaches the code step — which of the two holds? → A: The silence is bounded to the response's text, status, and timing, and the flow stops at that response: the person stays on the form's first step, no pending request is started, no code is dispatched, and the code step is not reached. The response MUST carry no next-step content, so the same response can lead a successful submission to the code step and this refusal to the first step; the response's shape is fixed so both hold, and the "transitional" note is removed. FR-029, AC-031, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-11-01, Clarifications). (Revised 2026-11-02: the silence is bounded to the response's text, status, and headers, and its duration to a one-sided numeric bound rather than to "timing" in general — see Session 2026-11-02 (25).)
- Q: SC-005 asserts that 100% of the frame's target scopes render the frame, while no page this slice ships renders it — is the criterion bounded to what this slice can verify? → A: Yes — SC-005 asserts that the three bare pages this slice ships do not render the frame and that the frame's delivered composition and scoping are verified structurally, and the assertion that the frame's target scopes render it is verified by the slice that ships the first page carrying the frame (R2); the error and static scopes stay with the slice that ships them. No page, route, or preview is added here. SC-005, AC-022, AC-023, and the Test Coverage Request carry the rule (decided 2026-11-01, Clarifications).
- Q: When the ended-session state is shown because the account is blocked, what does the frame's header carry, given that the state withholds the way to sign in and the session has ended? → A: The header carries the logo/home control and the theme switch alone: the sign-in action is withheld because the block refuses every sign-in, and the account control is withheld because the session has ended, so no control the header carries can fail for the reason the state reports; the sidebar, the bottom bar, and the footer band keep their composition. FR-049, AC-053, the matching edge case, and the Test Coverage Request carry the rule (decided 2026-11-01, Clarifications).
- Q: The Assumptions section restates most of the functional requirements, and that duplication has already let several sentences drift from the rules they repeat — is the section pruned in this session? → A: Only where the duplication produced a contradiction: the drifted sentences are corrected or replaced by a pointer to the requirement that owns the rule, and the remaining restatements are left for a separate documentation pass rather than rewritten here, because this specification has passed analysis and its assumptions are relied on downstream, so a wholesale rewrite would invalidate them. The report records the remaining duplication. The Assumptions section carries the rule (decided 2026-11-01, Clarifications). (Completed 2026-11-04, Clarifications: the restatements that remained after Session 2026-11-01 (12) — the administrator's role and audit-log rule, the icon set's duties, the SMS measurement rule, and the merchant's deletion rule — are replaced by references to their owners, while every slice boundary stays; see Session 2026-11-04.)
- Q: Did the consistency pass find statements that later accepted clarifications had already superseded, and what was corrected? → A: Yes — US2's body still said the sign-out control arrives with a later slice while its Independent Test and the Assumptions say this slice builds it; US5 still said every page of the public site carries the frame and omitted the footer band from the frame's composition; FR-020 listed the bottom bar before the footer band, so FR-052's "fourth surface" contradicted it; FR-051's step (5) called the account-existence comparison a refusal at sign-up, which FR-006 does not; FR-033 still said "one per-origin budget" while the same requirement keys it on the origin and the number; the `Session` invariant said a password change revokes a session while FR-037 defines that ending as part of the change's own record rather than a revocation; AC-039 said each bare page offers the way to "the other two" while FR-036 gives sign-up one link; AC-020 said "an account that is no longer registered" where FR-018 speaks of an account an administrator removes; FR-045 carried a double negative that obscured the constitution's rule; and an edge case named Cart and Profile in Arabic, introducing a second name for two registered pages. Each is corrected to the rule the later decision already fixed; no rule, identifier, or count changes (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (5)

- Q: US2's and US7's Independent Tests claimed full isolation while the exception register records `EX-012` for US2's security-events test and `EX-011` for US7's controls, which live on US1's, US2's, and US3's surfaces — does each story name its exception the way US4, US5, and US6 already do? → A: Each names it: US2's Independent Test cites `EX-012` and US7's cites `EX-011`, both pointing at the register's exact scope and the point where the dependence ends, so the specification's isolation claim and the register's exception agree; the 2026-10-31 (3) record's count of three is bounded to the exceptions that session registered and names the two the repair pass added later. No requirement, criterion, success criterion, or identifier changes (decided 2026-11-01, Clarifications).
- Q: The ended-session state's header rule said "in that state the header MUST carry the logo/home control and the theme switch alone", while the same state offers the way to sign in again when the account is not blocked and FR-023 gives a guest a sign-in action — which header does a merchant whose session ended see? → A: The header follows FR-023, which now states all four of its states once: the signed-in merchant's, the guest's, an ended session whose account is not blocked — the guest's header, the logo/home control, the theme switch, and the sign-in action, because the session has ended and the state offers the way to sign in again — and an ended session whose account is blocked, the logo/home control and the theme switch alone, with the sign-in action withheld because the block refuses every sign-in and the account control withheld because the session has ended. FR-049 and AC-053 refer to that rule instead of restating it, exactly as FR-020, FR-023, and FR-047 already divide the frame by one authority per surface and then by one authority per control, so the header's shape has one home and a later change to it cannot leave a stale copy in the state's requirement. The sidebar, the bottom bar, and the footer band keep their composition in every state, and no requirement, criterion, success criterion, or identifier changes (decided 2026-11-01, Clarifications).
- Q: FR-051 said the refusal order is "applied identically on every page this slice ships" and listed the password policy among the value rules, while FR-035 applies the policy "whenever a password is set" and requires "the form that takes a password" to state its requirements — so does the sign-in form state the policy and refuse a value that fails it? → A: No — the policy binds only where a password is set: the sign-up form, the new-password step of the password-recovery flow, the account's own change action, the administrator's forced first change, and the operator's provisioning action. The sign-in form sets no password, so it states no requirement of the policy, shows no policy message, and refuses on no policy ground; a value that would fail the policy is a wrong password there and receives the uniform refusal FR-008 defines, exactly as any other wrong value does. FR-051's step (4) is therefore read page by page, each page applying the value rules it owns — the mobile-number format on all three, the name and city rules on the sign-up form, and the password policy only where a password is set — so the order stays one order while its content is per page. FR-035, FR-051, AC-037, the matching edge case, and the Test Coverage Request carry the rule, and no requirement, criterion, success criterion, or identifier is added or moved (decided 2026-11-01, Clarifications).
- Q: FR-044 required forgery protection over "every action this slice ships that changes state" but enumerated five, while the recovery flow's new-password submission — which sets the password and ends every session — and the code step's re-request control, which dispatches an SMS, were not among them; is the enumeration completed? → A: Yes — both are added to FR-044 and to AC-048: the submission of the new password in password recovery, and the request for a new one-time code from the code step. The list therefore matches the claim it carries, and a task or a test derived from AC-048 covers every request the three pages issue rather than five of them; the change-password action's own request stays in the list with the note that no page offers it here. No requirement, criterion, success criterion, or identifier is added or moved (decided 2026-11-01, Clarifications).
- Q: FR-006 put the sign-up direction message "on the code step", while FR-038 said the recovery flow's outcome message is "the one case" that does not return the page to the first step — so what does a person see after entering the correct code for a number that already has an account? → A: The message replaces the code step in place and stays there until a reload or a fresh opening, exactly as the recovery flow's outcome message does, so FR-038 now names two terminal outcomes rather than one: the recovery flow's message when the reset cannot proceed, and the sign-up flow's direction when the correct code is entered for a number that already has an account — an active merchant's, a blocked account's, or an administrator account's. The pending request has ended at that point, so a code step left behind would invite an entry that cannot be accepted, and a reload or a fresh opening returns the page to its first step, because no live request exists for the page to resume. FR-006, FR-038, AC-006, the matching edge cases, and the Test Coverage Request carry the rule, and no requirement, criterion, success criterion, or identifier is added or moved (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (6)

- Q: FR-051's step (5) said the account-existence comparison refuses a password-recovery request with the uniform response, while FR-015 and AC-017 require the request to continue identically and the outcome to be stated only after the code is verified — which governs? → A: FR-015 and AC-017 govern: at sign-up and in password recovery the comparison continues the flow identically and the code is sent, the outcome being stated only after the code is verified; only at sign-in is the comparison refused with the uniform refusal FR-008 defines. FR-051's step (5) is reworded to say so, AC-017 already carries the recovery outcome, FR-004 and AC-004 are bounded to a sign-up that creates the account while FR-006 and AC-006 carry the existing-account outcome, and no requirement, criterion, success criterion, or identifier is added or moved (decided 2026-11-01, Clarifications).
- Q: A fresh sign-up or recovery request for a number that already has a live pending request must replace the previous one, while a dispatch the messaging channel refuses must leave the previous code valid — does the fresh request still replace the previous one when its own message is refused at acceptance? → A: No — the replacement is dispatch-conditioned, exactly as the replacement of a code is: the fresh request replaces the previous pending request and invalidates its code only once the channel accepts the new message, while a request the channel refuses at acceptance leaves the previous request and its code live and produces the explicit, retryable failure FR-034 states, so a moment with no valid code never arises. FR-034, AC-036, AC-041, the Key Entities note, the matching edge case, and the Test Coverage Request are reworded to that condition, and the earlier records that say "at once" are read with it (decided 2026-11-01, Clarifications).
- Q: FR-018 said an account's personal data is removed only by an administrator action, while the constitution's cross-entity rule says a `User` row is soft-deleted and only the retention job or an administrator operation removes a row for good — which removal paths does the specification state? → A: The constitution's rule governs: deletion is soft, and a `User` row is removed for good only by an administrator operation or by the retention job, whose trigger and scope over account rows this slice does not fix and whose period it does not state. FR-018, AC-020, and the matching Assumption are reworded to name both paths without asserting a trigger, so the specification no longer contradicts the register and still fixes no retention period; this revises the 2026-10-21 record's "administrator action" wording (decided 2026-11-01, Clarifications).
- Q: FR-023 said the notifications control MUST carry the unread count and that the count arrives with R9, while AC-022 asserted only the control's route — does this slice render a badge? → A: The control and its target are built here and carry no badge: the count and the Notifications page arrive with R9 (ADR-102), and the control remains the surface that carries the count when it exists, so no other surface gains it. FR-023 is bounded to the control and its route for this slice, AC-022 asserts the control, its route, and the absence of a badge here, and the structural verification reads the same way (decided 2026-11-01, Clarifications).
- Q: FR-009 and SC-007 name the lock's trigger as five consecutive failed sign-in attempts, while the same requirement counts the current-password check of the account's own change action exactly as a failed sign-in — do the two paths share one count, so a mixed run of five locks the account? → A: They share one count: every failed password verification against an existing, active account — a sign-in attempt, the current-password check of the account's own change action, and the administrator's forced first change on the same rule — increments the one consecutive count, and the fifth locks the account for fifteen minutes whether the five came from one path or any mix of the three; a success on any path clears it. FR-009's opening, AC-010, SC-007, and the Test Coverage Request are reworded to say so, and the `User` field the Key Entities note names is the one counter (decided 2026-11-01, Clarifications). (Read with Session 2026-11-02 (18): FR-009 states the term, the three-path set, and the increment, clear, and lift rules once, and SC-007 and AC-010 repeat them identically.)

### Session 2026-11-01 (7)

- Q: The sign-up edge case said the platform "directs the person … and to the administrator surface for an administrator account", while FR-006 states the status- and role-specific messages "with no generic direction in either of those two cases" — which wording governs? → A: FR-006 governs: the edge case is reworded to state the three outcomes exactly as FR-006 states them — an active merchant account receives a message that names sign-in and password recovery and offers both links with no redirect; a blocked account receives the statement that it is blocked and that sign-in stays refused until an administrator returns it to active; an administrator account receives the statement that its credential is managed on the administrator surface and that the merchant sign-in and recovery paths do not apply to it — and the phrase "and to the administrator surface for an administrator account" is removed, so no generic direction is offered in the blocked or the administrator case. FR-006, AC-006, and the matching edge case carry the rule, and no requirement, criterion, success criterion, or identifier changes (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (8)

- Q: FR-025 placed the theme switch "in the header immediately beside the notifications control", while FR-023 gives the header four states and three of them carry no notifications control — where does the switch sit in those three? → A: In the same position of the header's inline-end group: immediately beside the notifications control in the signed-in merchant's header, and in that same position in the three other states FR-023 fixes — the guest's, the ended session whose account is not blocked, and the ended session whose account is blocked — where the notifications control is absent. FR-025 states the position once and AC-027's "beside the notifications control" is read as that rule, so FR-023, AC-025, AC-027, and every identifier stay unchanged (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (9)

- Q: The Assumption that states this slice implements none of the sixteen product features enumerated the slices that own them, but the enumeration named ten of the sixteen and left Supplier and Date Extraction, Column Normalisation, Deduplication, Tables, Pagination, and Column Sorting without an owner — is that enumeration completed from ROADMAP.md, or removed? → A: Removed — the Assumption now states that each of the sixteen features is implemented by the slice ROADMAP.md assigns it, and none is implemented here, and it reads the assignment from ROADMAP.md rather than restating it, so the slice order keeps one authority and the assumption cannot drift from it again. Tables is why the enumeration is the wrong shape: ROADMAP.md assigns the first table to R4 and the Parts table to R5, the Catalog table to R6, and the administrator's tables to R14, R16 and R17, so a single owner per feature cannot be restated without interpreting the roadmap. The count stays sixteen, no feature and no identifier is added, and no requirement, criterion, or success criterion changes (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (10)

- Q: The 2026-11-01 (5) record said FR-049 and AC-053 refer to the header state
  FR-023 fixes instead of restating it, yet both still enumerated the controls,
  and AC-025 still restated the account menu's three items — are the references
  applied to the text? → A: Yes — FR-049 and AC-053 now carry "the header state
  FR-023 fixes for that variant, in both its unblocked and its blocked form",
  and AC-025 carries "the account menu FR-047 fixes, with its three items and
  its sign-out confirmation", so each surface's shape has one authority and no
  copy of it remains in the ended-session state's requirement or the header's
  criterion. Every behavioural assertion stays as it was — the announcement, the
  focus move to the state's heading, and the rule that no control a state or a
  header carries may fail for the reason the state reports — and FR-023, FR-047,
  and every identifier are unchanged (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (11)

- Q: US2's Independent Test claimed the structural verification of the sign-out
  control — the account menu's third item with its yes-or-no confirmation —
  while that verification is US5's, named in US5's own Independent Test and
  asserted by AC-051; which story owns it? → A: US5 owns
  it: US2's Independent Test verifies sign-out, sign-out-of-every-device, the
  change-password action, and the other session-ending paths at the behaviour
  level, and states that the structural verification of the sign-out control and
  the account menu belongs to US5, adding that the claim is not made by US2's
  independent test. AC-051, US2's Acceptance Scenarios line, and every
  identifier are unchanged (decided 2026-11-01, Clarifications).

### Session 2026-11-01 (12)

- Q: The Assumptions section still restated most of the functional requirements,
  and the 2026-11-01 (4) record deferred pruning it to a separate documentation
  pass — is that pass performed now, and on what terms? → A: Yes — every
  assumption that restated a rule owned by a functional requirement now points
  at that requirement instead of repeating its text, and each keeps only what is
  not a rule there: the slice boundary (what is not built here and which slice
  verifies it), the decision dates, and the record's own content. The pass
  started from the five blocks the record named — the frame (FR-020 … FR-025,
  FR-039, FR-047, FR-052), the administrator account (FR-028), the logo
  (FR-023), the city list and the mobile-prefix set (FR-005 and FR-003), and the
  sign-out control (FR-047 and FR-011) — and then re-read every remaining
  assumption against its owning requirement or source. No rule, requirement,
  criterion, success criterion, identifier, count, or route changes (decided
  2026-11-01, Clarifications).

### Session 2026-11-01 (13)

- Q: AC-044 asserts its rule on the three bare pages this slice ships — sign-up,
  sign-in, and password recovery — and one end-to-end test carries the
  criterion, while `EX-009` bounded its scope to "the three bare pages US1 and
  US3 deliver", and US1 and US3 deliver two pages between them — does that test cover
  all three pages, and how is `EX-009`'s scope corrected? → A: It covers the
  three pages: it is the one end-to-end test that opens sign-up (US1), sign-in
  (US2), and password recovery (US3), so AC-044's rule is measured on every page
  it names. `EX-009`'s exact scope now reads "the end-to-end test … on the three bare pages this
  slice ships — sign-up (US1), sign-in (US2), and password recovery (US3)", and
  its closing sentence names US2 beside US1 and US3, so the exception ends at
  R1's acceptance, when US1 (P1), US2 (P1), US3 (P2), and US5 (P2) are delivered
  together. US5's Independent Test states the same three pages, replacing "the
  pages US1 and US3 deliver" with "the three bare pages this slice ships (US1,
  US2, US3)". No FR, AC, or SC identifier is added or renumbered
  (decided 2026-11-01, Clarifications).

### Session 2026-11-02

- Q: The Edge Cases say two entries of one number's one-time code arriving
  together leave at most one account and refuse the losing entry with the uniform
  response and the direction FR-006 requires, while AC-006 asserted two
  simultaneous sign-up attempts alone — does a criterion carry the concurrent
  code-entry case, and which one? → A: AC-006 carries it: two entries of the same
  correct code for one number arriving together create at most one account and at
  most one session, the entry that does not create the account is refused with
  the same uniform response and the same direction to sign in or to recover the
  password, and no partial account, no second session, and no live pending
  request is left behind. The Edge Cases are split so the sign-up-attempt race
  and the code-entry race each cite the criterion that asserts it — AC-006, with
  FR-031 and FR-034 — and the Test Coverage Request names both races, so the
  integration test that asserts the case is requested at the level that can
  observe it; no requirement, criterion, success criterion, or identifier is
  added or moved (decided 2026-11-02, Clarifications). (Read with Session
  2026-11-04 (2): the losing entry receives the status- and role-specific
  message FR-006 fixes, not a generic direction to sign in or recover.)
- Q: FR-028 and AC-030 create the administrator account with an initial password
  the operator supplies, but neither states that pair as one indivisible step
  the way FR-004 states the account and its session at sign-up — can a failed
  provisioning leave an administrator account that no password can open? → A:
  It cannot: the account and the initial password that makes it usable come into
  existence as one indivisible step, so the provisioning action MUST NOT produce
  an account before, or without, that credential — a failure to set the initial
  password leaves no account behind, the run fails as a whole, and the operator
  receives the failure — and no provisioned account ever exists that no password
  can open. FR-028, AC-030, the matching Edge Case, and the Test Coverage
  Request carry the rule; no requirement, criterion, success criterion, or
  identifier is added or moved (decided 2026-11-02, Clarifications).
- Q: An administrator removes an account (R13), and FR-018 says the personal
  data is removed but never states what happens to the account's sessions, a
  live pending request for its number, and its stored credential — does this
  slice state those consequences, or assign them to R13? → A: This slice states
  them, bounded to the state it creates, because it builds the session store,
  the pending request, and the credential, and a removal that left any of them
  behind would leave a live session, a usable code, or a credential for an
  account that no longer exists: every session of the account MUST stop
  granting access and MUST be withdrawn, a live pending request for the
  account's mobile number MUST end with its code no longer valid, and no stored
  credential of a removed account MUST permit a sign-in — removed with the row
  when the row is removed for good. The act of removal, whether and when it is
  soft or for good, its audit record, the retention job's trigger and period,
  and whether a removed account's number may open a new account stay with R13
  and R15 and are not decided here. FR-018, AC-020, the matching Edge Case, the
  `Session` invariant in Key Entities, and the Test Coverage Request carry the
  rule; no requirement, criterion, success criterion, or identifier is added or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (2)

- Q: The 2026-11-01 data review records that the Key Entities invariant "no
  email address exists as a product datum" has no acceptance criterion that
  fails when it is broken — does one carry it, or does it stay prose? → A:
  AC-057 carries it as a cross-cutting criterion: no form collects an email
  address, no response or notice shows one, no path identifies an account by
  one, recovers an account with one, or sends anything to one, and every stored
  email-shaped value is the reserved, non-routable placeholder recorded for it,
  derived from the account's normalized mobile number — never supplied by a
  person, never displayed, never a sign-in input, unable to receive mail — with
  an automated test that fails when a supplied address, a second such value, or
  an email input is introduced. The Key Entities note and the Assumptions
  already carry the bound, and the Test Coverage Request now names the assertion
  at the integration level; no requirement or success criterion changed, and
  AC-057 is appended after AC-056 without renumbering, reusing, or moving an
  existing identifier (decided 2026-11-02, Clarifications).
- Q: The same review records that the no-cap rule — an account may hold
  unlimited concurrent sessions, and signing in never revokes one — has no
  criterion asserting two live sessions or one ending while the other survives;
  which criterion asserts it? → A: AC-058 asserts it: two sign-ins from two
  separate browsers or devices hold two distinct live sessions at once, one of
  them ending — by the merchant's sign-out or by the platform — leaves the other
  live and granting access, and each further sign-in adds a live session and
  ends none of the sessions the account already holds, so no cap refuses or
  replaces a session. The Test Coverage Request already requests the assertion
  at the integration level and now names it explicitly; no requirement or success criterion changed, and AC-058 is appended
  after AC-057 without renumbering, reusing, or moving an existing identifier
  (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (3)

- Q: The 2026-11-01 data review records that AC-004 asserts only that the
  account does not become usable and that no session is created, so an
  incomplete or not-yet-usable `User` row could satisfy it while the Key
  Entities invariant — no `User` row before the correct code is entered — is
  broken; does a criterion assert that invariant at the row level? → A: AC-004
  now asserts it: after the form is submitted and while the pending request is
  live, and again after an incorrect code, no `User` row exists for the submitted
  number, the account is not created ahead of verification in a partial or
  not-yet-usable state, and the account row and the session that makes it usable
  appear together only when the correct code is entered. FR-004 states the same
  rule as a requirement so the criterion cites a requirement that carries it, the
  Test Coverage Request names the assertion at the integration level, and the
  sign-up integration test asserts it. The existing-account path stays
  with FR-006 and AC-006, so the two paths remain told apart; no requirement,
  criterion, success criterion, or identifier was added, renumbered, or moved,
  and the counts stay 53 FR, 58 AC, and 9 SC (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (4)

- Q: The 2026-11-01 data review records that the Test Coverage Request names
  most of the data invariants but leaves the merchant scope (FR-053) and the
  stability of "no `User` row before verification" without a stated test level —
  which level observes each of them, and what must the no-row assertion hold
  across? → A: Both are asserted at the integration level, the lowest level that
  can observe them. The merchant scope is exercised through the shared entry
  point: a session lookup carries the account's scope, an account identifier
  supplied in the request is ignored, and the test fails when the scope is
  removed (FR-053, AC-056). The no-row invariant is asserted at every point the
  sign-up flow passes rather than by one observation: after the form is
  submitted, while the pending request is live, and after an incorrect code no
  account row exists for the number, and when two entries of the correct code
  arrive together at most one row and one session are created, the row appearing
  with the session that makes it usable only when the correct code is entered
  (FR-004, AC-004, AC-006). The Test Coverage Request names both at that level:
  the sign-up integration test asserts the no-row points, the
  concurrent attempts are asserted beside them, and the isolation test asserts the merchant scope. No
  requirement, criterion, success criterion, or identifier was added,
  renumbered, reused, or moved: the counts stay 53 FR, 58 AC, and 9 SC (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (5)

- Q: FR-017 requires a blocked account to keep its "public contributions" but
  names neither the rows the term covers nor the slices that ship them — which
  rows does the term cover, which slices own them, and what does this slice do
  with them? → A: The term is the register's: the catalogs the account uploaded
  and the parts extracted from them. Those contributions belong to later slices
  — the Upload Catalog slice (R2) ships a merchant's upload, and the My Files
  slice (R4) owns the merchant's own removal of a file — and blocking withdraws
  access alone, so it removes no contribution, hides none, and decides nothing
  about a contribution's content, its visibility, or its removal. This slice
  creates no contribution, reads no contribution, and removes none. FR-017
  carries the rule, and AC-019 asserts that the data and the contributions
  remain in place; no requirement, criterion, success criterion, or identifier
  was added, renumbered, reused, or moved (decided 2026-11-02, Clarifications).
- Q: FR-018 names the retention job as one of the two paths that remove a
  `User` row for good, yet it names no owning slice and fixes no trigger, scope,
  or period — who owns the retention job, and how far does this slice's silence
  reach? → A: The retention slice (R15) owns the retention job, its trigger, and
  its period, and it alone decides whether, when, and over which rows the job
  runs; this slice fixes no period, states no trigger, asserts no retention
  behaviour, and performs no removal. The removal effects this slice does state
  — every session withdrawn, a live pending request ended, and no stored
  credential able to sign in — hold whichever of the two paths removes the row.
  FR-018 and AC-020 carry the rule; no requirement, criterion, success
  criterion, or identifier was added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (6)

- Q: FR-018 says the account's personal data lives as long as the account is
  registered, while the same requirement states that deletion is soft and that a
  soft-deleted row is retained — is "registered" defined against the
  register's soft-deleted state, so the rule does not read as extending the
  data's life past the deletion that marks it? → A: Yes — registered means
  not soft-deleted: once the register's soft deletion marks the row, the row is
  retained, but the account is no longer registered and its personal data is
  no longer read by the platform, so the rule ends at the deletion that marks
  the row instead of extending the data's life over it. FR-018 carries the
  definition, and the matching Assumption continues to point at FR-018 for the
  rule rather than defining the term again; no requirement, criterion, success
  criterion, or identifier was added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (7)

- Q: One pending request is live per mobile number, so a browser that returns to
  the first step and submits another number leaves the first request live while
  the page's tie moves to the second — what becomes of the request the tie has
  left: is it still live, can the person reach its code step again, and does the
  tie move back to it? → A: It stays live until its own expiry or until an
  ending the requirements state reaches it, and leaving the page ends neither
  that request nor its code; the page never resumes it, so a reload, a fresh
  opening, or any other return shows the request the page is tied to, never the
  one the tie has left, and the tie never moves back to it on its own. The only
  route to a code step for that request's number is a fresh submission, which
  starts a new pending request and, once the messaging channel accepts its
  message, replaces the request the tie left behind on FR-034's terms, so no
  control, link, or return path reopens a code step for the request the page has
  left. FR-038 carries the rule, and no requirement, criterion, success
  criterion, or identifier was added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (8)

- Q: The 2026-11-02 flow review records that the recovery flow's verified
  state is defined as expiring while the person is on the
  new-password step, but never defines what the page does when the pending
  request itself expires while the person is sitting on the code
  step — does the page wait for the next submission and refuse it, or end the
  step at that moment as FR-014 does for the verified state? → A: It ends the
  step at that moment: when the pending request's own lifetime elapses while
  the code step is shown, the code step ends, the page returns to the flow's
  first step with an explicit, retryable notice that the request expired and
  that a new code must be requested, and no navigation, no new route, and no
  new page is added — the same in-place ending FR-014 states for the verified
  state — while a code submitted after that moment is refused on the same
  expired ground and does not increment the bound on incorrect entries, exactly
  as an expired code is refused. One rule governs both code paths, so the
  answer holds at sign-up and in password recovery. FR-034 carries the ending
  and FR-038 states it beside the bound's own ending, AC-036 asserts it, the
  matching Edge Case states it; no requirement,
  criterion, success criterion, or identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (9)

- Q: The 2026-11-02 flow review records that the abandoned sign-up — the person
  leaves after a code is requested and never returns — appears only as an
  edge-case outcome, and no acceptance criterion asserts that the pending
  request expires leaving no account and no session; which criterion asserts
  it? → A: AC-004 asserts it: when the pending request's own lifetime elapses
  with no one returning, the request has ended at that moment, no `User` row
  exists for the number, and no session exists, because neither comes into
  existence before the correct code is entered. FR-034 states the abandoned
  ending as a property of the pending request beside the expiry rule, the
  matching Edge Case is reworded to the same rule, and the sign-up integration
  test asserts the post-expiry absence; no requirement, criterion, success criterion, or identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (10)

- Q: The 2026-11-02 flow review records that FR-040's announcement rule covers
  the in-progress state, the inline failure, and the in-place confirmation, but
  not the notice that a request expired, the notice that it ended at the bound,
  or the terminal outcome message — does the same announcement and focus rule
  reach those three states? → A: Yes — the rule is one rule over every state
  these pages render, so the notice that a request expired, the notice that the
  request ended at the bound on incorrect entries, and the terminal outcome
  message are each announced to assistive technology, and when one of them
  replaces the step that held the focus, the focus moves to the state now shown:
  the first step's first field for the two notices, which return the page to its
  first step, and the message's heading for the terminal outcome message, which
  carries no field. FR-040 states the widened set, AC-043 asserts the terminal
  message's announcement and focus, AC-036 asserts both notices' beside the
  transitions that produce them, the Test Coverage Request carries the same set;
  no requirement, criterion, success
  criterion, or identifier is added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (11)

- Q: The 2026-11-02 flow review records that FR-034 produces the explicit,
  retryable failure at two different points — on a fresh request's submission
  when the messaging channel refuses its message, and on the code step when a
  re-request's message is refused — while the requirement calls both "the
  explicit, retryable failure this requirement states"; is one failure state
  meant to serve both steps, and does the requirement say which step shows
  each? → A: One failure state serves both, and the step that asked for the
  message is the step that shows it: a fresh request's refusal at acceptance
  shows that failure on the form's submission itself, which keeps the person on
  the first step with the code step never reached, while a re-request's refusal
  at acceptance shows the same failure on the code step that asked for the new
  code, which keeps the person on that step with the code they already hold and
  lets them retry there; no failure reaches a step that did not ask for the
  message, and no second failure state is added. FR-034 states both placements
  once; no requirement, criterion,
  success criterion, or identifier is added, renumbered, reused, or moved
  (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (12)

- Q: The 2026-11-02 flow review records that when the bound on incorrect
  entries has already ended the pending request and the person's fresh request
  is then refused by the messaging channel at acceptance, the failure's stated
  premises — the pending request live and a code already delivered still valid —
  describe a request that no longer exists, and that the fresh request's
  cross-reference, "the terms the preceding sentence states", points at the
  sentence before it rather than at the sentence that carries the dispatch
  condition; is that case stated, and is the reference corrected? → A: The case
  is stated and the reference is corrected: the request that ended at the bound
  is already gone, so the fresh request replaces nothing still live, and the
  dispatch condition the requirement states for a request that replaces a live
  one still governs it — it takes effect once the messaging channel accepts its
  own message. A fresh request whose message the channel refuses at acceptance
  therefore produces the explicit, retryable failure on the form's submission
  itself, leaves no code valid because the ended request left none, and consumes
  no part of the limit on requesting a new code, which the fresh request begins
  with a full allowance. FR-034 states the case and its cross-reference now
  names that condition, and AC-036 asserts the case; no requirement, criterion, success criterion, or identifier
  is added, renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (13)

- Q: FR-034 bounds incorrect one-time-code entries per pending request and
  restarts that count when a fresh request begins, while
  FR-033's number-keyed budgets bound how many fresh requests a number can
  start — is the aggregate ceiling on code guesses for one number over a stated
  period specified, or is its absence accepted, so the guess ceiling is not left
  to be derived by the reader from two separate limits? → A: It is specified:
  the ceiling is the product of the incorrect-entry bound and the number of
  fresh requests the number-keyed budgets allow across both code paths in one
  window — 5 × 6 = 30 incorrect entries per normalized number per 15-minute
  window, from 3 account-creation and 3 recovery requests — and it is produced
  by those two limits rather than by a third counter, so the code entry neither
  consumes nor is refused by an operation's budget, exactly as FR-033 provides;
  the fresh request that would exceed it is refused by the number's budget with
  the distinct limit refusal, the ceiling resets at the window's boundary with
  the budgets that produce it, and it holds across re-requests because a new
  code does not reset the incorrect-entry count. FR-034, AC-036, the matching
  edge case carry the rule; no requirement, criterion, success
  criterion, or identifier is added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (14)

- Q: Sign-up and recovery each dispatch a one-time code whether or not the
  number has an account (FR-006, FR-015), and a code is re-requestable up to the
  re-request limit (FR-034) — is a cap on the messages the platform sends to one
  number across both flows and their re-requests stated, or is its absence
  accepted, so the platform cannot be turned into a way to flood a third party's
  number? → A: It is stated: the platform MUST NOT dispatch more one-time-code
  messages to one normalized number in one 15-minute window than the product of
  the dispatches a pending request allows — its first dispatch and the three
  re-requests — and the fresh requests the number-keyed budgets allow across both
  code paths — three account creation and three recovery — which is **24 accepted
  dispatches per normalized number per 15-minute window**, recorded numerically
  beside the code-guess ceiling. The ceiling is produced by those
  two limits rather than by a third counter, exactly as the code-guess ceiling is,
  so the twenty-fifth message is impossible rather than refused: the seventh fresh
  request is refused by the number's budget and the fifth dispatch by the
  re-request limit, and no counter store gains a message key. It counts the
  dispatches the messaging channel accepted, because an accepted message is the
  platform's own notion of a send; a dispatch the channel refuses at acceptance —
  the request timeout treated as a refusal included — sends nothing from the
  platform's side and does not count. The ceiling governs the one-time-code
  messages alone: the security notices FR-043 requires are outside it, because
  they follow an authenticated action on the account and go to the number that
  account holds, so no caller who does not control the account can reach them.
  FR-034, AC-036, and the matching edge case carry the rule; no
  requirement, criterion, success criterion, or identifier is added, renumbered,
  reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (15)

- Q: FR-009 makes a failed current-password check inside a password change a
  counted failed password verification — in the account's own change action and
  in the administrator's forced first change — yet FR-037's closed event list
  names failed sign-in attempts and completed changes and not that failure; is the
  record it emits defined, or is its absence stated as deliberate? → A: It is
  defined: the failure emits its own security-relevant event, named apart from a
  failed sign-in attempt because the submission is made from a live session rather
  than at the sign-in surface and never reaches the account-existence comparison.
  The event covers both paths that perform the check — the account's own change
  action and the administrator's forced first change — and is emitted exactly for
  the failures FR-009 counts there: a submission that passed every value rule
  (FR-035; at the forced first change, FR-028) and reached the check, and whose
  current password is wrong. A submission a value rule refuses, and one the lock
  refuses before the check runs, emit no such record, because neither is a failed
  password verification, and the fifth failure emits this record and the lock
  record (FR-009), each for its own fact. FR-037, FR-009, FR-013, FR-028, AC-040,
  and the Test Coverage Request carry the rule; no
  requirement, criterion, success criterion, or identifier is added, renumbered,
  reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (16)

- Q: FR-037 forbids the mobile number in a structured record, but the requirement
  set never says where else the number may appear; is its treatment in URLs,
  browser history, the referrer, and client storage specified, so the identifier
  does not leak through a path the log rule does not reach? → A: It is specified
  as a bound on the browser surface: the number travels in a request's body and,
  where a response carries it, in that response's body; and it appears in no URL
  (no path segment and no query parameter), in no browser-history entry, in no
  referrer, and in no client-side storage. Every form this slice ships submits the
  values it collected in the body; the three page addresses carry no number; the
  read that resumes a request carries the pending request's identifier alone; and
  a response carries the canonical number in its body only, never in a header, a
  cookie, or a redirect's location. The browser's tie to a pending request is that request's
  opaque identifier — not the number and not encoding it — so the code step's
  displayed number comes from a response body, the submission's own response or
  the read that resumes the request, and is held in the page while it is open
  rather than written to storage. The referrer cannot carry the number
  because no URL does, and the pages this slice ships load no third-party
  subresource, so no request they make carries a referrer off the origin. FR-037,
  FR-038, and the end-to-end test request carry the rule; no requirement, criterion, success
  criterion, or identifier is added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (17)

- Q: The 2026-11-02 security review records that FR-029 requires a minimum time
  between the form being shown and being submitted without naming the clock, and
  that the request carries a client-supplied start time — is the interval
  measured from a value the submitter can move, and can a slow page load produce
  a false refusal? → A: The interval is measured on the platform's own clock,
  from a value the platform issues when it serves the form, never from a value
  the submitter supplies: the platform issues a signed form stamp with the form's
  rendering, binds it to the sign-up form, and reads its issuance time back
  against its own clock, so the submitter can neither set the starting point nor
  move it. A submission whose stamp is absent, malformed, forged, issued for
  another surface, or outside the stamp's validity window is refused with the
  same explicit, retryable refusal a too-fast submission receives, and no account
  is created. Because the interval begins no later than the platform's serving of
  the form, a slow page load counts toward the interval and never against it, so
  a slow load cannot produce a false refusal. The request that fetches the page issues a signed stamp of the time; the stamp
  is carried in the request body in place of that client-supplied value and is
  never stored: a submission
  does not consume it, so its 30-minute validity window and the account-creation
  budget bound its reuse rather than a stored one-time record. FR-029 and AC-032
  carry the rule, and the matching edge case and US7's Independent Test state it;
  the 3 s minimum and the 30-minute window are recorded numerically, and no store
  gains a row; no requirement, criterion, success criterion, or identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (18)

- Q: FR-009 and SC-007 speak of a failed password verification, FR-037 of a
  failed sign-in attempt, and AC-010's clause named two of the three paths — does
  "failed sign-in attempt" carry one meaning across FR-009, FR-037, SC-007,
  AC-010, and the `User` invariants, and does each state the same increment,
  clear, and lift rules? → A: One term and one set govern all five places. A
  **failed password verification** is a password check that runs against an
  existing, active account and does not match, and it arises on exactly three
  paths — sign-in, the account's own change-password action, and the
  administrator's forced first change — which share one consecutive count. The
  three rules are stated once in FR-009 and repeated identically where a reader
  meets them: **increment** — each failed password verification adds one and
  nothing else does, so a rate-limit, format, blocked-account, or
  administrator-on-the-merchant-surface refusal, a value-rule refusal, and a
  refusal the lock makes never count; **clear** — a success on any of the three
  paths clears the count to zero, and the lock's expiry clears it too, while a
  reset through the recovery flow clears neither the count nor the lock; and
  **lift** — the lock lifts when its fifteen minutes elapse and at no other
  moment, and a refusal made while it is in force neither counts nor extends it.
  FR-037 keeps two records and now says plainly that they are not the count: the
  broader failed sign-in attempt — which also covers an unknown number, a locked
  account, a blocked account, and an administrator account on the merchant
  surface — and the failed password verification in a password change, and a
  record's emission neither increments nor clears the count and neither applies
  nor lifts the lock. FR-009, FR-037, SC-007, AC-010, AC-040, the Test Coverage
  Request, the Key Entities note, and `docs/domain-model.md`'s `User` invariants
  carry the rule; no requirement,
  criterion, success criterion, or identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (19)

- Q: FR-046 required a content-security policy "whose script sources carry no
  wildcard", which a directive containing `'unsafe-inline'` satisfies literally
  while permitting the execution the policy exists to stop — is the property the
  requirement means to forbid stated so that AC-050 can assert it? → A: The
  script sources of the policy MUST carry no wildcard, no `'unsafe-inline'`, and
  no eval-permitting source such as `'unsafe-eval'`, so a policy that satisfies
  "no wildcard" literally while admitting inline script text or the evaluation of
  a string as code is refused rather than accepted; the rule reaches the script
  sources alone, and the policy's style sources may keep their inline allowance
  because a style declaration is not script execution. AC-050 asserts all three
  allowances are absent by reading the policy the response carries, and its
  automated test fails when any of them appears. FR-046 and AC-050 carry the
  rule, and the automated test asserts it. No requirement, criterion, success
  criterion, or identifier is added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (20)

- Q: FR-053 requires a single scoped entry point but does not state the refusal
  a request for another account's row receives, nor whether that refusal is
  distinguishable from "no such row" — is the refusal specified as
  indistinguishable, so scoping does not become an existence oracle for another
  merchant's identifiers? → A: A request that names a row belonging to another
  account receives the platform's ordinary not-found answer — the same status,
  the same body, and no header that differs from the answer a row that does not
  exist receives — so the two answers are indistinguishable and the refusal
  never tells the caller that the row exists somewhere else. The requirement
  states the rule, AC-056 asserts both halves of the scope test, and the same
  rule is carried by the merchant-scope invariant in Key Entities. No requirement, criterion, success
  criterion, or identifier is added, renumbered, reused, or moved (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (21)

- Q: FR-009 lets any caller lock a known merchant's account for fifteen minutes
  with five wrong passwords, and the specification neither accepts nor bounds
  that consequence — is the denial-of-service risk recorded as accepted, and
  what exactly does the acceptance cover, given that a caller who spends five
  attempts in each fifteen-minute window can re-lock the account as soon as the
  lock lifts? → A: The risk is accepted, and the acceptance is bounded per lock
  episode: a lock lasts fifteen minutes, a refusal made while it is in force
  neither counts toward the next run nor extends it, and neither a success nor
  a reset lifts or shortens it, so no lock outlives its duration. The acceptance
  does not claim a bound on repetition: five further failed password
  verifications in a later window re-lock the account as soon as the lock
  lifts, and the number-keyed sign-in budget (FR-033; 20
  attempts per normalized number per 15-minute window) is the control that
  prices that repetition rather than a second lock rule. The residual exposure
  is recorded as accepted, with its owner (`repository owner`) and review date
  (`2026-12-01`), so the lock keeps one
  authority and one duration. No
  requirement, criterion, success criterion, or identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (22)

- Q: A password change and a password reset for one number can be submitted at
  the same moment — the change from a live session and the reset from the
  recovery flow's verified state — and FR-013 and FR-014 state only that a
  completed change ends a live recovery request; what is the outcome when the
  two arrive concurrently, so exactly one authority sets the final password and
  no session survives on a stale decision? → A: The two writes are ordered,
  and the write that takes effect first is the authority: it removes the
  other path's authority in the same indivisible step — the change deletes the
  recovery request and its verified state, and the reset revokes every session
  — so the other submission, re-checking its own authority inside its write,
  finds it gone and is refused, writing nothing. A change takes effect only
  while its session is live and its current password still matches; a reset
  takes effect only while its verified state still exists. No later write can
  overwrite the password the first set, so the final password is always the one
  the first write set. Each refused path keeps the outcome it already has: the
  reset is refused as an ended request and the page returns to the flow's first
  step with the ended-request notice, and the change is refused as an ended
  session and shows the ended-session state, so no refusal and no text is added. Every session
  that exists when the winning write takes effect ends with it, whichever path
  wrote, so no session survives on a superseded decision. FR-013, FR-014, AC-014,
  AC-016, the Key Entities note, and the Test Coverage Request
  carry the rule. No FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (23)

- Q: FR-028 and AC-030 create the administrator account with an initial password
  the operator supplies and say only that the operator learns the credential
  out of band — are there handling requirements for that credential, so it
  never appears where it can be read, replayed, or recovered? → A: It is handled
  as a secret on every step and never leaves the action's own process: the
  action MUST take it only through a hidden prompt or an input stream the
  operator supplies directly — never as a value carried in the command that starts
  the action, never from an environment variable, and never from a stored
  configuration file — so it appears in no command history and in no process
  list, and it MUST NOT read it from, or write it to, any file the platform
  keeps; it MUST NOT echo it as it is entered, MUST NOT display or repeat it in
  any output the action produces — its success report included — and MUST NOT
  write it to a log, a security record, an error message, or a diagnostic
  output, so the report names only the account and the outcome. The operator
  MUST hand the credential to the administrator through a channel the operator
  controls outside the platform, and no page, one-time-code message, or
  security notice of the platform may carry it; the platform MUST NOT display,
  transmit, or offer to retrieve it again after the run. FR-028, AC-030, the
  matching Edge Case, the administrator Assumption, and the Test Coverage Request
  carry the rule. No FR, AC, or SC identifier is added, renumbered, reused, or moved
  (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (24)

- Q: FR-019 withdraws access from every session when an account is blocked, and
  FR-049 defines the state a refused request shows, but neither states what
  happens to a request that was already in flight when the block was recorded —
  is that boundary defined, or expressly left outside the slice? → A: It is
  defined, and it is a request boundary rather than a clock. The session's
  authority — the session's own state and the account's status — is read for
  each request at the single shared entry point every authenticated request
  passes, so a request that had already passed that point when the block was
  recorded is not interrupted and is decided on the state it met, while every
  request that reaches the entry point afterwards is refused with the blocked
  variant of the ended-session state FR-049 defines, a request issued from a
  page that was already open included. The block therefore waits for no refresh,
  no cache, and no token lifetime, and the only exposure it leaves is the one
  request already in flight; that request neither creates, extends, nor renews
  a session for the account. The session that carries the next request is marked
  as ended for the block as that request is refused, so every later request reads
  that mark and is refused in the same way. This slice ships no act of blocking,
  so the rule is stated as the effect of the blocked value and reached in its
  tests by setting the status directly; the act that records the block and its
  own audit record stay with R13, and the state's rendering with the slice that
  ships the first page carrying the frame (R2). FR-019, AC-021, the matching Edge
  Case, and the Test Coverage Request carry the rule. No FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (25)

- Q: FR-029 promises the hidden-field refusal the same timing as a successful
  submission's response, while a successful submission waits for the messaging
  channel's acceptance and this refusal dispatches no code at all — is that
  promise full equality with the longer success path, the acceptance wait
  included, or the narrower property that the refusal is not observably faster,
  and against what number? → A: The narrower property, bounded numerically. Full
  equality is not reachable while the refusal dispatches nothing: it has no
  acceptance to wait for, and a wait that imitated the channel would make the
  refusal the slower of the two and break the response budget the product fixes
  for authentication requests. The refusal therefore performs the same work a
  success performs before the dispatch, on a discarded copy, so the two durations
  differ by the channel's acceptance wait alone, and it MUST NOT be observably
  faster: over repeated samples of both cases its duration MUST NOT fall short of
  a successful submission's 202 by more than 50 ms at the median and 150 ms at
  p95, measured with the same sampling the enumeration test uses, and the wait
  it is held to tracks the channel's own current acceptance duration rather than
  a constant, so the difference does not widen as the channel slows. FR-029,
  AC-031, and the matching edge case carry the rule; the recorded decision carries
  the mechanism and the recorded verification the measurement, and the test asserts both
  cases. No FR, AC, or SC
  identifier is added, renumbered, reused, or moved (decided 2026-11-02,
  Clarifications).

### Session 2026-11-02 (26)

- Q: AC-010's lock clause named the account's own change action beside sign-in
  but not the administrator's forced first change, which FR-009 and SC-007 count
  in the same run — does the clause that withholds acceptance name all three
  paths? → A: Yes — the lock refuses sign-in and the current-password check of
  both password-change paths, the account's own action and the administrator's
  forced first change, for its full fifteen minutes; it ends no session the
  attempt was made from, the restricted session included, and each check resumes
  when the lock lifts, exactly as FR-009's three-path rule provides and SC-007
  repeats. AC-010 now names the third path in that clause, so the criterion can
  no longer pass while the forced first change's lock refusal goes unasserted.
  No FR, AC, or SC identifier is
  added, renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (27)

- Q: FR-034's replacement of a live pending request is dispatch-conditioned, so a
  messaging channel's refusal at acceptance produces the explicit, retryable
  failure while the previous request stays live — is that failure's position
  outside SC-004's enumeration comparison stated, as the re-request limit's
  refusal is, so an explicit failure that exists for both cases is not read as an
  account-existence leak? → A: Yes — the failure state the channel's refusal at
  acceptance produces is excluded from SC-004's enumeration comparison, whether
  it is shown on the form's submission at a fresh request or on the code step at
  a re-request, because one failure state serves both dispatches and it states
  the channel's response rather than anything about the number's account: the
  failure is produced identically whether or not the number has an account, so
  the exclusion rests on the same ground as the re-request limit's refusal and
  names no second reason.
  FR-034 states the exclusion, SC-004 carries it among its bounds, AC-036 asserts
  it, the matching edge case repeats it, and the enumeration test keeps the
  dispatch failure out of its cases. No FR, AC, or SC identifier is added, renumbered, reused, or moved
  (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (28)

- Q: FR-052 fixes the bar's return "within 56px of the top" without saying what
  the top is measured from, what happens to a page too short to scroll, or what
  becomes of the raised search action while the bar is hidden — what do the three
  mean? → A: The top is the page's own vertical scroll origin: the distance is the
  page's scroll offset from that origin in CSS pixels, measured on the page's
  scrolling element and not on the drawer's or another surface's scroll, so the
  bar is within 56px of the top when the offset is 56px or less, whatever the
  header's height or the first content element's position. The return rule wins
  wherever the two thresholds overlap: at an offset above the origin but within
  56px of it the bar stays visible, so a page whose whole scroll range is 56px or
  less never hides it, and a page that cannot scroll at all keeps it visible.
  While the bar is hidden the raised search action is hidden with it: the bar and
  every slot it carries, the raised action included, leave the focus order and
  the accessibility tree together, no separate floating action stands in for it,
  and it returns with the bar. Below 1024px the drawer's opener «المزيد» is
  itself a slot of the bar, so no drawer is open while the bar is hidden and no
  control of the frame is then a way to search; at 1024px and up the bar is absent
  and the sidebar's «بحث وفر» item carries the way. FR-052 states the three
  definitions, AC-042 asserts them, and the matching edge cases repeat them.
  No FR, AC, or SC identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (29)

- Q: FR-023 and AC-025 say the header carries no "page-navigation link", yet the
  header's logo/home control and notifications control are themselves links to
  registered destinations — what does the term cover, and can AC-025 still be
  read as "no link"? → A: The term is defined once, in FR-023: a
  page-navigation link is a link the frame renders as one of the navigation
  items in the sidebar's item list FR-039 fixes — the nine destinations — shown
  in the full sidebar, in the collapsed icon-only rail, or in the narrow-screen
  drawer, and it is decided by the link's role in that list rather than by the
  destination it points at. The header's logo/home control and notifications
  control point at Home and Notifications, which that list also names, but each
  is one of the header's own controls rather than a navigation item, so neither
  is a page-navigation link; the same holds for the guest's sign-in action and
  for the footer band's four static-page links. AC-025's clause therefore reads
  as "no item of that list is rendered in the header", never as "the header
  carries no link", and the logo/home control, the notifications control, and
  the guest's sign-in action each stay a link to the route the frame's decision
  record fixes (FR-024). FR-023 states the definition once, AC-025 refers to it
  rather than restating it. No FR, AC, or SC identifier is
  added, renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (30)

- Q: FR-026 binds every page and the body of every message the platform sends by
  SMS, while AC-028's scan spoke of "any screen" and only SC-008 reached the
  bodies of the one-time-code messages — does the acceptance criterion take
  FR-026's whole subject, or does the success criterion carry the SMS limb
  alone? → A: AC-028 takes FR-026's whole subject: it now scans every text the
  platform delivers to a person — what a screen renders and what a message
  carries — under the same language, numeral, and no-emoji rules, with the icon
  limb left to the screens because a message body carries no icon. The
  one-time-code messages are therefore asserted by the same criterion as the two
  notices AC-047 already covers, and no limb of FR-026 rests on a success
  criterion alone, while SC-008 keeps its 100% outcome over the same scope.
  FR-026, AC-028, and SC-008 carry the rule. No FR, AC, or SC
  identifier is added, renumbered, reused, or moved (decided 2026-11-02,
  Clarifications).

### Session 2026-11-02 (31)

- Q: The automated accessibility scan visited every delivered state in the light
  appearance but only the form, code-entry, and completion states of each page in the
  dark one, and no rule said whether that subset was deliberate — does the
  criterion judge the two appearances as completely as one another, or does it
  accept the three-state subset with a reason? → A: It judges them alike: the
  scan visits every delivered state in both appearances, at 320 and at 1280 CSS
  px, so the dark set carries exactly the states the light set carries and the
  three-state subset is withdrawn rather than justified. FR-025 binds the chosen
  appearance to every page, the bare pages included; a dark set smaller than the
  light set would leave the appearance's own states unjudged, and the states the
  subset omitted — the inline failure messages, the notices, the in-progress
  states — are the ones that carry the alert, notice, and loading surfaces a
  second palette can break. The manual keyboard-only pass stays
  appearance-independent, because the appearance changes no keyboard behaviour,
  and the visual baseline keeps its own matrix — every state in both appearances
  at 1280 and 375, plus the 320 light reflow capture — so the two gates read one
  state list. SC-006 and the recorded verification carry the rule. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (32)

- Q: When a label does not fit the surface that carries it at the smallest
  supported width — the sidebar's nine items and the bottom bar's five slots at
  320 CSS px — does it wrap, is it cut, or is it dropped for its icon alone, and
  which way does the cut run? → A: It stays on one line and is cut at the
  inline-end — the left in the right-to-left interface — with the ellipsis «…»
  at the cut, so the label's beginning is never clipped; it never wraps, is
  never abbreviated, and is never dropped so that the control shows its icon
  alone, and the cut never leaves a partial numeral, while a Latin numeral
  inside an Arabic label keeps its Latin digit order and its own direction. The
  whole label survives the cut — its complete text stays in the markup — and no
  control's accessible name is shortened by it, so the cut shortens only the
  visible line. The icon-only rail renders no visible label at all — it is
  icon-only at every width rather than as an overflow measure — and keeps each
  item's whole label as its accessible name and in the tooltip recorded for it,
  which is placed inside the viewport so the page's edge never clips
  it. FR-026 states the rule once for the frame's labels and FR-052
  applies it to the bar's five slots, which keep their labels at 320 CSS px and
  the fixed height ADR-128 records; AC-042 asserts the whole label and the
  accessible name structurally, and the cut itself is a rendering rule the slice
  that ships the first page carrying the frame (R2) verifies under `EX-007`.
  No FR, AC,
  or SC identifier is added, renumbered, reused, or moved (decided 2026-11-02,
  Clarifications).

### Session 2026-11-02 (33)

- Q: While the drawer is open, which surface is on top — the drawer, the account
  menu, or the bottom bar — and which one receives an activation? → A: The open
  drawer is the frame's topmost surface: it and its scrim render above the page
  and the header, the scrim covers the bar while the panel ends at the bar's top
  edge so no slot is covered, and the header's controls and the bar's slots
  take no activation until it closes, while the bar stays rendered and visible
  through the scrim with «المزيد» keeping its open state. The account menu is
  topmost while it is open, the bar sits above the page's content but below both
  overlays, and the drawer and the menu are never open at the same time, in
  either order. FR-022, FR-047, FR-052, AC-024, AC-042, and AC-051 carry the
  rule. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).
- Q: When an open overlaying surface is dismissed by an activation outside it,
  does that activation also perform the action of the control it lands on? → A:
  It does not: the activation is consumed by the dismissal, so the person
  activates the control again once the surface has closed. A tap on a bottom-bar
  slot or on «المزيد» closes the drawer without navigating, and the same tap
  closes the account menu without opening the drawer, so no navigation follows a
  dismissal. FR-022, FR-047, FR-052, AC-024, AC-042, and AC-051 carry the rule.
  No FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (34)

- Q: AC-022 restated the sidebar's contents, the bottom bar's five slots, and the
  footer band's four links after FR-020 had given each surface of the frame one
  owning requirement — does the criterion assert the frame by naming each
  surface's owning requirement, or by repeating what that requirement makes the
  surface carry? → A: It names the requirement that owns each surface — the
  header FR-023, the sidebar FR-022 and FR-039, the bottom bar FR-052, and the
  footer band FR-024 — and asserts each surface's presence at the width and in
  the composition that requirement fixes, so the criterion no longer restates
  the item list, the five slots, or the four links, and the frame's composition
  keeps the one home FR-020 gives it with one authority per surface. The icon
  set and the typography stay named by FR-020, whose record the criterion keeps
  citing, and the criterion's other two limbs are unchanged: every frame control
  carries an accessible name, a role, and keyboard reachability asserted
  structurally (SC-006), and the notifications control points at the
  Notifications route with no badge in this slice (FR-023). FR-020, FR-022,
  FR-023, FR-024, FR-039, FR-052, and AC-022 carry the rule. No FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (35)

- Q: SC-004 describes the response's observable shape as its text, its status,
  and how long it takes, while the enumeration test the criterion names asserts
  text, status, header set, and response path for equality and the duration
  against the recorded tolerance — does the criterion state every property its
  measurement point compares, or does the test compare a superset the criterion
  never names? → A: The criterion and its measurement point name the same
  properties: SC-004 states the compared shape as the response's text, its
  status, its header set, its response path, and its duration, so the text,
  status, header set, and response path are asserted for equality and the
  duration against the recorded tolerance, and the enumeration
  verification is that same set rather than a superset of the
  criterion. The earlier answers that name the shape in fewer terms — text and
  status with timing, or text, status, and response path with timing — are read
  with this enumeration rather than as a narrower set. The criterion's
  identifier, its bounds, its delegation of the numeric tolerance and the
  sampling to the recorded verification, and every exclusion are unchanged — the rate-limit
  refusal, the format refusal, the re-request limit's refusal, and the
  channel-refusal failure each stay outside the comparison — and no FR, AC, or
  SC identifier is added, renumbered, reused, or moved (decided 2026-11-02,
  Clarifications).

### Session 2026-11-02 (36)

- Q: The shared message table carries one full-name refusal for two causes — an
  empty value and a value over the maximum — and one shop-name refusal for one,
  yet FR-001 requires an explicit message naming the reason and the table
  carries no text for the emoji refusal; does one refusal carry its cause
  explicitly, so the table selects one text per cause, or does the refusal alone
  select one text? → A: The refusal stays one per field and names its
  cause distinctly beside it, so the empty value, the value over the maximum,
  and the value carrying an emoji are three causes of the full-name refusal and
  the last two are causes of the shop-name refusal, each with its own text in
  the shared table: «أدخل الاسم الكامل.»، «الاسم الكامل يتجاوز 100 حرف.»،
  «الاسم الكامل لا يقبل الرموز التعبيرية.»، «اسم المحل يتجاوز 100 حرف.»، and
  «اسم المحل لا يقبل الرموز التعبيرية.». The page selects the text by the cause
  the refusal carries and composes none of its own, so no cause is left for the
  implementation to invent; the cause is a distinct value the refusal carries,
  so the table keys each text on the refusal and the cause, and no separate
  refusal is added. FR-001, AC-046, and the shared message table carry the rule (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (37)

- Q: FR-021 says «the page title names the page» while the Glossary says «the wordmark and the page titles read «منصة وفر»», and the browser title was given as `<page title> — منصة وفر` — what is the visible title and the browser title of the three pages, and how does the brand appear in them? → A: The visible title is the page's own name and carries no brand — «إنشاء حساب», «تسجيل الدخول», «نسيت كلمة المرور» — and the browser title is `<page name> — منصة وفر`: the page's name first, then the brand in the Glossary's exact form, so the three are distinguishable in a tab, in history, and in a screen reader's page list while every title still carries the brand. The wordmark above the visible title reads «منصة وفر» in the same form. The Glossary's sentence fixes the written form the brand takes wherever the wordmark or a page title carries it; it does not make the brand the page's name, because FR-021 gives the title the page's name and a title reading only the brand would name no page. FR-021 and AC-023 carry the rule; the earlier browser title `<page title> — منصة وفر` is restated as `<page name> — منصة وفر`, and no FR, AC, or SC identifier is added, renumbered, reused, or moved (decided 2026-11-02, Clarifications; revised 2026-11-02 by ADR-147: the brand's Arabic form carries no diacritics, so «منصة وفر» is the final form in the Glossary, and the page-title decision is unchanged).

### Session 2026-11-02 (38)

- Q: The recovery page's subtitle says «الرد موحَّد ولا يكشف وجود الحساب», while FR-015 bounds the indistinguishability to the request, the following step, and the dispatch of the code and requires the platform to state explicitly after verification that no account exists — what does the subtitle say instead, so the page does not promise what the flow must not keep? → A: The subtitle states the bound: «يُرسل رمز إلى رقمك المسجّل. لا نكشف وجود الحساب قبل التحقق من الرمز.» The first sentence stays; the second no longer promises a uniform response past the code's verification and instead says exactly what FR-015 binds — nothing before the code is verified reveals whether the number has an account — so the page's copy and the no-account outcome state one rule. The no-account copy («لا يوجد حساب لهذا الرقم») is unchanged because it already states the outcome after verification; no FR, AC, or SC identifier is added, renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (39)

- Q: The Glossary imposed the diacritics of the Arabic trade name — «وَفَّر»,
  with the wordmark and page titles reading «منصة وَفَّر» — while the specification
  and the four SMS bodies write «وفر»; which
  form is approved in the wordmark and in running text, and does the mark's form
  differ from the name's form inside a sentence? → A: One Arabic form, «وفر»,
  carries no diacritics in every context: the wordmark and the page titles read
  «منصة وفر», the brand line reads «منصة وفر — كتالوج قطع الغيار», the sidebar
  item reads «بحث وفر», and the four SMS bodies read «في وفر». The mark differs
  from the in-sentence name only by the word «منصة», never by its diacritics, so
  no surface carries a second form. The constitution is corrected rather than the
  copy: the Glossary's Wafar row and the Product Fact Clarifications bullet now
  state that the Arabic form carries no diacritics, at constitution 6.3.1, and
  ADR-147 records the amendment; the existing «وفر» occurrences are
  therefore correct and unchanged (decided 2026-11-02, Clarifications).

### Session 2026-11-02 (40)

- Q: Does SC-008's scan reach the frame's copy — the nine sidebar labels, the
  five bottom-bar slots, the four footer links, the brand line, the account
  menu's three items and its confirmation, and the ended-session state's two
  variants — given that SC-008 says "every screen this slice delivers" while the
  recorded verification scopes the scan to the three pages' copy and
  the four SMS templates? → A: Yes — the frame is delivered whole in this slice,
  so its copy is user-facing text this slice delivers: SC-008 and AC-028 are
  widened to it, and the recorded verification follows, because the
  boundary SC-005 and SC-006 record defers the frame's rendered behaviour and not
  the text, and a string scan reads the components' strings rather than a
  rendered page. No requirement, criterion, or success criterion is added,
  renumbered, or moved, and SC-008's 100% outcome now stands over the three bare
  pages' copy, the frame's copy, and the four SMS templates (decided 2026-11-02,
  Clarifications).
- Q: "Right-to-left" in SC-008 is a presentation property a string does not
  carry, and the string scan reads strings — which criterion measures the direction FR-026
  requires, and does it stay inside SC-008 or move to another criterion? → A: It
  stays inside SC-008 as a second, named measurement: the language, numeral, and
  no-emoji limbs remain the string scan's, while the direction limb is asserted
  at the document level — every document the platform serves declares Arabic as
  its language and right-to-left as its base direction, and no frame component
  sets a direction or language of its own, inheriting the document's — because a
  string carries no direction. A message body carries no markup and no direction
  attribute, so its direction limb is satisfied by opening with Arabic text,
  which the same scan asserts. SC-006 stays the accessibility criterion and does
  not take the direction rule, no success criterion is added, and the string scan
  no longer claims to scan a property a string does not carry; the end-to-end test
  asserts the declaration on the three bare pages and the frame's inheritance is
  asserted structurally (decided
  2026-11-02, Clarifications).

### Session 2026-11-02 (41)

- Q: FR-038 requires the mobile number to be shown "in its canonical form with
  Latin numerals" and says nothing about grouping, separators, or where the
  `+218` prefix sits, while the code step's copy writes `+218 91 234 5678`,
  the phone field's placeholder writes `91 000 0000`, and FR-031 stores
  `+218912345678` — what is the one rendered form the platform shows, and how
  does it differ from the stored form? → A: The platform shows the number in one
  fixed display form: the `+218` prefix, then a single space, then the nine
  national digits grouped 2-3-4 with a single space between groups, in Latin
  numerals — `+218 91 234 5678`. The stored form is unchanged: the unspaced
  canonical number `+218912345678` FR-031 fixes, so storage and display are
  stated apart and neither is inferred from the other. The display form is used
  at the code step and at every place the platform shows the number — the
  sign-up and recovery code steps, any later page, and a notice that names it —
  and the whole value renders as one isolated left-to-right run under FR-026's
  numeral rule, so its groups never reorder inside the right-to-left page and the
  value never breaks across lines. FR-038 states the form once and AC-041 and
  AC-028 read it rather than restating a
  second shape; no FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-02, Clarifications).

- Q: The platform's copy carries partial tashkeel — «محدِّد», «موثَّق»,
  «مسجَّل», «تحقّق», «جارٍ», and the tanween of «رمزًا» — with no stated rule,
  while the city list's search ignores diacritics, so a reviewer cannot tell
  whether a missing or an added mark is a defect; what is the diacritics policy
  for the text the platform writes? → A: The platform's own text carries no
  diacritics at all: a combining mark in the range U+064B–U+0652 or the
  superscript alef U+0670 in a label, a message, or a message body is a defect,
  with no closed exception list and no editorial judgement, so the string scan
  decides it and one mark never distinguishes a correct string from a broken
  one. Words whose mark carried the meaning are rewritten instead of marked: the
  sign-up subtitle reads «المنصة ليبية: الرقم يبدأ دائما بـ +218، ولا يوجد اختيار
  لرمز الاتصال.»; the four in-progress labels read «يجري الإرسال…», «يجري
  التحقق…», «يجري تسجيل الدخول…», and «يجري الحفظ…»; the sign-up footnote reads
  «سيصلك الرمز برسالة SMS إلى الرقم نفسه…»; the recovery subtitle reads «سيصلك رمز
  على رقمك المسجل…»; the
  submission-too-fast message reads «أرسلت النموذج بسرعة أكبر من المعتاد…»; the
  session notices read «انتهت كل الجلسات السابقة…» and «انتهت جلسات حسابك في وفر
  من كل الأجهزة…». The rule binds the platform's text alone: an entry in the
  fixed city list keeps the form it carries and its search still ignores
  diacritics (FR-005), and a value a person supplies keeps the script and the
  marks it was typed with (FR-001). FR-026, AC-028, and SC-008 carry the
  rule; no FR, AC, or SC
  identifier is added, renumbered, reused, or moved (decided 2026-11-02,
  Clarifications).

- Q: The copy writes «برسالة SMS» while the constitution's Principle V names
  only PDF, Excel, OEM, and SKU as technical names that do not translate — is
  `SMS` permitted, and which Latin strings may appear in Arabic text at all? → A:
  `SMS` is permitted, and the permitted set is closed and stated once: the Latin
  digits 0–9, the `+218` prefix, and the exact token `SMS`. Principle V's four
  product-wide names — PDF, Excel, OEM, SKU — stay permitted for the whole
  product, but this slice's copy uses none of them, so they add nothing here. Any
  other Latin letter sequence in user-facing text is a defect unless a recorded
  decision adds it to the list, and a technical name is never invented at a call
  site. A template's `{code}` placeholder is not user-facing text: it is replaced
  before rendering by Latin digits, which the numeral rule already governs.
  FR-026, AC-028, and SC-008 carry the rule; no FR, AC, or SC identifier is added, renumbered, reused, or moved
  (decided 2026-11-02, Clarifications).

- Q: FR-045 requires every supplied value to be encoded before it is rendered
  and states no rule for its direction, so a full name carrying a Latin word —
  or a value that begins in Latin inside an Arabic-first page — has no stated
  rendering; how is a supplied value isolated and shown, and where is the rule
  recorded? → A: Each supplied value renders as one isolated bidirectional run
  whose direction is taken from the value's own first strong character: an
  Arabic-first name stays right-to-left with its Latin word embedded in reading
  order, and a Latin-first value renders left-to-right, while the surrounding
  Arabic is neither reordered nor allowed to reorder the value. The value is
  never split across runs, never concatenated with platform text inside one run,
  and never forced to the page's direction; the platform's own text keeps the
  document's direction. The rule is recorded where the value is rendered and
  where it is judged: FR-045 states the behaviour, the code step's read-only
  fields carry it (the whole value in one isolated bidirectional run whose
  direction is automatic, with no ancestor forcing a direction), AC-028's
  supplied-value clause asserts it, and the test exercises it. The mobile number and the one-time code are not
  supplied values: the platform renders them, so FR-026's numeral rule and
  FR-038's display form govern them. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved (decided 2026-11-02, Clarifications).

### Session 2026-11-03

- Q: The Clarifications record and the specification body carried detail
  Principle VII reserves outside a specification — references to planning and
  implementation artifacts, task identifiers, numeric-value row numbers, a
  transport path, and refusal codes — so the document was not
  technology-agnostic; what was removed, and what is unchanged? → A: Every such
  reference was removed and restated in behavioural terms: the request that
  fetches a page issues a signed stamp of the time, and each refusal is named by
  its outcome — an ended request, an ended session, or the blocked variant of the
  ended-session state — rather than by a code; the remaining citations name only
  requirements, criteria, success criteria, decisions, and registered sources.
  Every earlier record keeps the decision it recorded, and only its wording
  changed. Every FR, AC, and SC keeps its identifier, its number, and its
  meaning; no requirement, criterion, success criterion, page, route, count, or
  behaviour changes, and the specification carries no reference to a planning or
  implementation artifact (decided 2026-11-03, Clarifications).
- Q: The coverage target excepted the frame's runtime behaviour as one class,
  including the drawer's opening and its three dismissals, the focus's return to
  «المزيد», the bottom bar's visibility under the open drawer, and the sign-out
  confirmation — all of which this slice's structural verification exercises —
  so which behaviours does the exclusion still cover? → A: Only the frame
  behaviour no test here exercises: the focus landing on the destination page's
  heading after a drawer item's navigation, the overlaying surfaces' stacking
  order and the consumption of an activation outside them, the bottom bar's
  scroll-hide rule, and the header's runtime behaviour. The drawer's opening by
  «المزيد», its closing by the collapse control, Escape, and an activation
  outside it, the focus's return to «المزيد», the bottom bar staying rendered and
  visible under the open drawer, and the sign-out confirmation the account menu
  carries stay inside the denominator, exercised by the structural verification.
  No requirement, criterion, success criterion, identifier, page, route, count,
  or behaviour changes (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (2)

- Q: The Key Entities note stated the state the account carries twice — first as
  the failed-attempt count, the lock, and the forced-change requirement, and
  again as the three `User` fields — so which statement stands, and does any
  meaning change? → A: One statement stands: the three fields on `User` are
  named once — the count of consecutive failed password verifications, one
  count across the three paths FR-009 fixes, the lock's expiry, and the
  requirement to change the password at first sign-in, which the change made at
  that first sign-in clears and no other path clears — and the ADR-105 citation
  is unchanged: ADR-105 registered those fields, so the feature implements them
  and makes no second amendment. No requirement, criterion, success criterion,
  identifier, field, or behaviour changes (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (3)

- Q: AC-024 and SC-005 named the drawer's open state, its three dismissals with
  the focus return to «المزيد», the bottom bar's rendered and visible state under
  the open drawer, and the header's behaviour as work the slice that ships the
  first page carrying the frame verifies, although the structural verification
  this slice runs already exercises them — so which behaviours does this slice
  verify, and which wait for that slice? → A: The controls and every behaviour
  the delivered controls can exercise without a rendered page are verified here
  as part of the frame's composition — the drawer's open state, its three
  dismissals with the focus return to «المزيد», and the bottom bar's rendered
  and visible state under the open drawer — while the page behaviour alone waits
  for the slice that ships the first page carrying the frame: the focus landing
  on the destination page's heading, the drawer's focus containment, the
  overlays' stacking order and the consumption of an activation outside them,
  and the guest's redirection on a page that carries the frame. The sidebar's
  two-width behaviour, the bottom bar's drawer-opening behaviour, and the
  header's single-row behaviour at 320 CSS px are asserted structurally here,
  and their page-level counterparts — the drawer's focus containment, the
  guest's redirection, the account menu's live open, the bottom bar's
  scroll-hide, and the label cut at the inline-end — are verified by that slice.
  AC-024 and SC-005 carry the boundary as their closing clauses, and the
  exception `EX-007` names the same two sets; the earlier records that send the
  drawer's open state, its three dismissals, the focus return, the bar's visible
  state under it, or the header's controls' behaviour whole to that slice are
  read with this one. No FR, AC, or SC identifier is added, renumbered, reused,
  or moved, and no requirement, criterion, success criterion, page, route, or
  count changes (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (4)

- Q: Three passages still resolved their record through a planning artifact
although the record of this date states that the specification carries no
reference to a planning or implementation artifact: the reason the frame's
structural-only verification stands as an exception, the deferral of the static
pages' reachability rule, and the storage deviation the sentinel placeholder
records; what do the passages say now, and does any meaning change? → A: Each
states its substance without naming the artifact. The frame's structural-only
verification is recorded as exception `EX-007` in the exception register with
its exact scope, the repository owner as approver, and a review date, because
Principle VIII is NON-NEGOTIABLE and the exception register, not a deviation
entry, is the instrument for it (ADR-139). The deferral of the static pages'
reachability rule to the slice that ships the first page carrying the frame is
recorded with an owner and a review date. The exact placeholder and the storage
deviation from the literal wording of the domain model's invariant are recorded
with an owner and a review date. The record of this date therefore holds of the
whole document: no passage names a planning or implementation artifact, and the
only instrument it names for a permitted departure is the exception register
with its owner and review date. No requirement, criterion, success criterion,
identifier, page, route, count, or behaviour changes, and every earlier record
keeps the decision it recorded (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (5)

- Q: US5's Independent Test and the end-to-end bullet of the Test Coverage
  Request sent the sidebar's two-width behaviour, the drawer's opening and
  closing with the focus return to «المزيد», the bottom bar's rendered and
  visible state under the open drawer, and the header's controls' behaviour
  whole to the slice that ships the first page carrying the frame, although the
  structural verification this slice runs exercises them — so which behaviours
  stay here, and which wait for that slice? → A: Both passages now state the
  boundary SC-005, exception `EX-007`, and the drawer's structural verification
  state. This slice verifies structurally the frame's composition and every
  behaviour its controls can exercise without a rendered page: the sidebar's
  two-width behaviour; the header's single-row behaviour at 320 CSS px with its
  controls present; the account menu's items and the sign-out confirmation's
  markup; the drawer's opening by «المزيد» and its closing by the collapse
  control, Escape, and an activation outside it, with the focus returning to
  «المزيد»; and the bottom bar staying rendered and visible under the open
  drawer. Runtime behaviour alone waits for the slice that ships the first page
  carrying the frame: the focus landing on the destination page's heading after
  a drawer item navigates, the drawer's focus containment, the overlays'
  stacking order and the consumption of an activation outside them, the account
  menu's live open and its runtime dismissal with the sign-out confirmation's
  result, the guest's redirection, the bottom bar's scroll-hide rule, and the
  label cut at the inline-end. The earlier records that send the sidebar's
  two-width behaviour, the drawer's opening and closing, the bar's visible state
  under the drawer, or the header's controls' behaviour whole to that slice are
  read with this one. No FR, AC, or SC identifier is added, renumbered, reused,
  or moved, and no requirement, criterion, success criterion, page, route,
  count, or behaviour changes (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (6)

- Q: The coverage target's exclusion list named the focus landing on the
  destination page's heading after a drawer item's navigation, the overlaying
  surfaces' stacking order and the consumption of an activation outside them,
  the bottom bar's scroll-hide rule, and the header's runtime behaviour, but it
  did not name the drawer's focus containment, although AC-024, US5's
  Independent Test, the Test Coverage Request's end-to-end bullet, SC-005, and
  exception `EX-007` all defer that behaviour to the slice that ships the first
  page carrying the frame — so does the drawer's focus containment sit inside
  this slice's coverage target, or is it excluded with the rest of that runtime
  behaviour? → A: It is excluded. The exclusion list now names it between the
  focus landing on the destination page's heading and the overlaying surfaces'
  stacking order, because it is page-level runtime behaviour that no test in
  this slice exercises: the structural verification exercises the drawer's
  opening by «المزيد», its closing by the collapse control, Escape, and an
  activation outside it, the focus returning to «المزيد», and the bottom bar
  staying rendered and visible under the open drawer, not the focus being held
  inside the drawer while it is open. The drawer's focus containment therefore
  leaves the 80% denominator with the other excluded runtime behaviour and is
  covered by the slice that exercises it, which is the boundary AC-024, US5's
  Independent Test, the Test Coverage Request, SC-005, and `EX-007` already
  carry. No FR, AC, or SC identifier is added, renumbered, reused, or moved, and
  no requirement, criterion, success criterion, page, route, count, or
  behaviour changes; every earlier record keeps the decision it recorded
  (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (7)

- Q: SC-005 named five behaviours as the set it defers to the slice that ships
  the first page carrying the frame — the drawer's focus containment, the guest's
  redirection, the account menu's live open, the bottom bar's scroll-hide, and the
  label cut at the inline-end — while US5's Independent Test, the end-to-end
  bullet of the Test Coverage Request, and exception `EX-007` name seven, adding
  the focus landing on the destination page's heading after a drawer item
  navigates and the overlays' stacking order with the consumption of an activation
  outside them — so which set does the criterion carry, and is its list
  exhaustive? → A: The seven, in one wording. SC-005's list is replaced with the
  set the other three passages already carry: the focus landing on the destination
  page's heading after a drawer item navigates, the drawer's focus containment,
  the overlays' stacking order and the consumption of an activation outside them,
  the guest's redirection, the account menu's live open and its runtime dismissal
  with the sign-out confirmation's result, the bottom bar's scroll-hide, and the
  label cut at the inline-end. The list stays exhaustive rather than being opened
  with "among them", because a criterion that defers behaviours and names only
  some of them lets the unnamed ones fall outside every record, and SC-005 is the
  criterion a reader checks that deferral against. No FR, AC, or SC identifier is
  added, renumbered, reused, or moved; AC-024 and exception `EX-007` are
  unchanged, and no requirement, criterion, success criterion, page, route,
  count, or behaviour changes (decided 2026-11-03, Clarifications).
- Q: US5's Independent Test and the end-to-end bullet of the Test Coverage
  Request named the drawer's closing by the collapse control, Escape, and an
  activation outside it as this slice's structural verification and sent the
  drawer's navigation to the slice that ships the first page carrying the frame
  only as the focus landing on the destination page's heading — so who verifies
  that activating a navigation item closes the drawer, given that FR-022 states
  it, the drawer's structural test asserts it, and exception `EX-007` names it
  among the behaviours this slice can verify structurally? → A: This slice
  verifies it. Both passages add
  "an item's activation closing it as part of the navigation" between the focus
  return to «المزيد» and the bottom bar's rendered and visible state under the
  open drawer, so the drawer's opening, its three dismissals, its item activation,
  and the bar's state under it are this slice's structural verification, while
  the focus landing on the destination page's heading after a drawer item
  navigates and the drawer's focus containment stay deferred to that slice (R2),
  exactly as they were. The item's activation was never in the coverage target's
  exclusion list, so the denominator is untouched, and the Assumption and AC-024,
  which enumerate the structural assertions without it, are read with this record
  and keep their text. No FR, AC, or SC identifier is added, renumbered, reused,
  or moved; AC-024 and exception `EX-007` are unchanged, and no requirement,
  criterion, success criterion, page, route, count, or behaviour changes
  (decided 2026-11-03, Clarifications).

### Session 2026-11-03 (8)

- Q: The US5 narrative still sent the sidebar's two-width behaviour and the
  bottom bar's drawer-opening behaviour to runtime beside the account menu's
  own behaviour, while SC-005, US5's Independent Test, and the sidebar's and the
  drawer's structural tests carry both behaviours as this slice's structural
  verification — what does the
  narrative sentence say now, and does any judgement become a different one?
  → A: The sentence states the boundary the other four passages carry, and
  reads: "This slice delivers the frame whole — its header's logo/home,
  notifications, and theme-switch controls and the account menu, the sidebar's
  navigation item list with the collapse control, the bottom bar's five slots,
  its means of reaching the static pages, and the surface that carries those
  links — and verifies them structurally, the sidebar's two-width behaviour and
  the bottom bar's drawer-opening behaviour among them; the account menu's live
  open, its runtime dismissal, and the confirm behaviour are exercised at
  runtime by the slice that ships the first page carrying the frame, while the
  data behind the menu's destinations and the notifications destination arrives
  with the slice that owns each destination (decided 2026-10-10, revised
  2026-10-11, 2026-10-21, and 2026-11-03, Clarifications; revised 2026-10-25,
  ADR-126)." The two behaviours join the structural verification the sentence
  asserts instead of waiting for runtime, and the only behaviours it sends to
  runtime are the account menu's live open, its runtime dismissal, and the
  confirm behaviour. No judgement becomes a different one: every behaviour
  keeps the side of the boundary it already holds in SC-005, US5's Independent
  Test, and the sidebar's and the drawer's structural tests, and the sentence is
  rewritten rather than reinterpreted (decided 2026-11-03, Clarifications).
- Q: AC-024's closing clause enumerated what this slice verifies as part of the
  frame's composition without naming the sidebar's two-width behaviour or an
  item's activation closing the drawer, although US5's Independent Test names
  both as structural assertions and the sidebar's and the drawer's structural
  tests carry them, and Session 2026-11-03 (7) kept AC-024's text as it was —
  what does the criterion's list carry now, and does that earlier note keep its
  force? → A: The list carries
  the five behaviours whole: the sidebar's two-width behaviour, the drawer's
  open state, its three dismissals with the focus return to «المزيد», an item's
  activation closing it as part of the navigation, and the bottom bar's
  rendered and visible state under the open drawer. The two behaviours the
  list omitted join it; no behaviour in it is narrowed or re-sent, and the
  criterion's deferred page behaviour keeps its own list as it is. This amends
  the note of Session 2026-11-03 (7) that kept AC-024's text as it was: that
  note declined to act beyond its own question, and this session amends the
  criterion's enumeration deliberately, completing it to the set the
  Independent Test and the two tasks already carry. No judgement changes: the
  criterion verifies the same composition here and defers the same page
  behaviour to the same slice as before. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved; no requirement, success criterion, page, route,
  count, or behaviour changes (decided 2026-11-03, Clarifications).
- Q: The reading note on the requirements list said an identifier is never
  renumbered, never reused, and never withdrawn, without saying how an item
  leaves the list, so the rule could be read as sending the identifier away
  with a withdrawn item — what does the sentence say now, and does the rule
  change? → A: The sentence states the withdrawal path: "an identifier is
  never renumbered, never reused, and never withdrawn — an item is withdrawn
  by keeping its identifier and marking it withdrawn, and never by removing
  the identifier from the list". The rule is stated, not changed: the
  identifier's three imperatives keep their sense, and the added clause closes
  the one reading that contradicted them, that a withdrawn item's identifier
  could be removed from the list rather than kept and marked (decided
  2026-11-03, Clarifications).

### Session 2026-11-03 (9)

- Q: FR-044 and AC-048 enumerate seven state-changing actions and omit the
  sign-out and sign-out-of-every-device actions, although this slice serves
  both requests (AC-011, AC-012) and every state-changing request it serves
  requires the protection — do the two join the enumeration now, as
  password/change did, with the page that offers their controls left to R2?
  → A: Yes. FR-044's enumeration and AC-048's add the sign-out action and
  the sign-out-of-every-device action, and FR-044's closing sentence states
  that the slice serves both requests although no page renders their controls, so
  the protection covers them and the slice that ships the first page carrying the
  frame adds the controls alone. The treatment is the one password/change
  already has, save that R7 adds that page and R2 the frame's; no action's rule
  changes, no route is added, no FR, AC, or SC identifier is added, renumbered,
  reused, or moved, and the page boundary is unchanged (decided 2026-11-03,
  Clarifications).
- Q: SC-009 fixes p95 ≤ 1,000 ms alone, while p50 ≤ 150 ms is fixed elsewhere in
  the feature — does SC-009 gain the p50 bound, or does p50 stay outside the
  criterion? → A: SC-009 gains it: the criterion reads p50 ≤ 150 ms and
  p95 ≤ 1,000 ms. The constitution requires a feature's performance budget to
  state both percentiles, the load measurement already fails a run whose p50
  exceeds 150 ms, and stating both bounds in the criterion leaves one authority
  for them. The measurement condition, the scale, the exclusion of delivery
  after acceptance, and the timeout refusal are unchanged; no identifier is
  added, renumbered, reused, or moved (decided 2026-11-03, Clarifications).
- Q: The 2026-11-03 sessions cite identifiers that are assigned after this file
  for the sidebar's and the drawer's structural tests — does the clarification
  record keep those identifiers, or state the decision without them? → A: It
  states the decision without them. Such an identifier is a downward pointer: it
  is assigned after this file, and a later pass extended the list it belongs to,
  so a specification that names one can point at a different item after that
  pass. Each occurrence now reads by what the check does — the sidebar's
  structural test and the drawer's structural test — and the records'
  questions, answers, decisions, and dates are unchanged; no item is renamed,
  moved, or renumbered, and no FR, AC, or SC identifier changes (decided
  2026-11-03, Clarifications).
- Q: The behaviours deferred to R2 are stated in four records and the four
  drifted once — does SC-005 become the single enumeration and the other three
  cite it? → A: Yes. SC-005 keeps the full set and states it once; the frame
  Assumption and the other two records that carry the same boundary replace
  their lists with a reference to SC-005, and those two cite exception `EX-007`
  for the criterion each behaviour closes against, keeping the owner and the
  review date they carry. The elaborated clause "the ended-session state it
  produces" is read as SC-005's "the sign-out confirmation's result", which
  `EX-007` already spells out, so no behaviour leaves the record and none is
  re-sent. No FR, AC, or SC identifier is added, renumbered, reused, or moved;
  AC-024 and `EX-007` are unchanged, and no requirement, criterion, page, route,
  count, or behaviour changes (decided 2026-11-03, Clarifications).

### Session 2026-11-04

- Q: SC-006's parenthetical said the automated scan and the keyboard-only pass
  wait for R2 "the same boundary its two-width behaviour already observes",
  while SC-005, AC-024, US5's Independent Test, the frame Assumption, and
  exception `EX-007` all verify the sidebar's two-width behaviour structurally
  here — which reading of the boundary does the accessibility criterion carry?
  → A: The parenthetical is corrected: the scan and the keyboard-only pass wait
  for R2 because that is the boundary SC-005 fixes for the frame's page
  behaviour alone, and the two-width behaviour is not an instance of it. SC-006
  keeps every accessibility assertion it carried — the markup-level coverage of
  every frame control, the header's four controls at 320 CSS px, the guest's
  three, the ended-session state's announcement and focusable heading, and the
  bare pages' announced state changes — and only the false comparison is
  removed. The 2026-10-11 record that set the two-width behaviour beside the
  scan as one deferral is read with this one. No FR, AC, or SC identifier is
  added, renumbered, reused, or moved,
  and no requirement, criterion, page, route, count, or behaviour changes
  (decided 2026-11-04, Clarifications).
- Q: The boundary between the frame behaviour this slice verifies structurally
  and the page behaviour it defers is stated in SC-005 and restated, in
  different words, in US5's Independent Test, both frame passages of the Test
  Coverage Request, AC-024, SC-006, the frame Assumption, the plan's notes, and
  exception `EX-007`, and the restatements have drifted once — where does the
  boundary live, and what do the other passages say? → A: SC-005 is its single
  statement: the criterion keeps the full split and both lists as they stand,
  and every other passage now cites "the boundary SC-005 fixes" instead of
  phrasing the split as its own rule, keeping the list each passage needs for
  its own claim — US5's structural verification, the Test Coverage Request's
  two coverage levels, AC-024's assertions, the frame Assumption's structural
  half, the plan's measurement notes, and `EX-007`'s exact scope with the
  criterion each behaviour closes against — so Session 2026-11-03 (9)'s "replace
  their lists with a reference" is read as replacing the statement of the split,
  not the list a passage's own claim depends on. No list is reworded, shortened, or
  re-sent, no behaviour changes side, and no FR, AC, or SC identifier is added,
  renumbered, reused, or moved; the counts stay 53 FR, 58 AC, and 9 SC (decided
  2026-11-04, Clarifications).
- Q: Session 2026-11-01 (4) deferred a documentation pass over the Assumptions,
  to reduce the FR text restated there and keep only what is not a rule; which
  restatements still remained after the 2026-11-01 (12) pass, and what does each
  say now? → A: Four remained and are trimmed: the administrator-out-of-band
  Assumption no longer repeats FR-028's role and audit-log rule and records the
  data-model fact the requirement leaves open — the administrator is one `User`
  row, not a separate kind of account; the icon-set Assumption no longer
  enumerates the record, the fixed value, the licence-obligation record, the
  vulnerability scan, and the vendoring FR-020 owns; the SMS-delivery Assumption
  no longer restates SC-001's and SC-003's measurement rule and cites all three
  criteria that exclude delivery; and the merchant-data Assumption no longer
  repeats FR-018's rule that a merchant cannot delete their own account. Every
  slice boundary the section records stays — the bare pages with no frame, the
  frame's behavioural half, the administrator's page, the static pages, the
  absent landing page, the sign-out and change-password controls, and the
  measurement ceiling — because a boundary is not a restated rule. No FR, AC, or
  SC identifier is added, renumbered, reused, or moved, and no requirement,
  criterion, success criterion, page, route, count, or behaviour changes
  (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (2)

- Q: SC-004 and AC-006, AC-017, and AC-031 compare the response's «text», but the
  202 a successful submission receives carries a generated `requestId`,
  `codeExpiresAt`, and `expiresAt`, while only the generated values may differ —
  so what does «text» mean, and where is it defined? → A: The
  comparison is the response's text after masking the generated values, and it is
  defined once in SC-004: the masked fields are the pending request's identifier
  (`requestId`), the moment the code expires (`codeExpiresAt`), and the moment
  the pending request expires (`expiresAt`), each replaced by a fixed
  placeholder. The field names, their types, the header set's names, the response
  path, and the duration stay compared, so a response that omits a field, changes
  a field's type, drops a header, takes another path, or does less work still
  fails; no other value is masked. AC-006, AC-017, and AC-031 cite that
  comparison instead of restating it. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved (decided 2026-11-04, Clarifications). (Revised
  2026-11-04 (5): the masked set gains `phone`, because the response a
  successful sign-up submission or password-recovery request receives echoes the
  submitted number and the enumeration's two cases submit different numbers; the
  test asserts each response's `phone` outside the comparison — see Session
  2026-11-04 (5).)
- Q: AC-006's race paragraph said the attempt that does not create the account
  receives «the same outcome and direction the existing account's status and role
  call for», while the paragraph before it distinguishes the active merchant's,
  the blocked account's, and the administrator account's messages — what does the
  losing attempt receive in each case, and who decides it? → A: The losing
  attempt receives the message FR-006 fixes for the existing account's status and
  role, case by case: the active merchant's message naming sign-in and recovery
  with both links, the blocked account's message stating the block and that
  sign-in stays refused until an administrator returns the account to active, or
  the administrator account's message stating that the credential is managed on
  the administrator surface and that the merchant sign-in and recovery paths do
  not apply — with no generic direction where the status or role calls for none.
  The existing account's stored status and role decide it, as the winning
  transaction left them or as the already-existing row held them, not the losing
  attempt's own view; the concurrent code-entry case carries the same rule rather
  than a generic direction to sign in or recover. FR-006 is unchanged. No FR, AC,
  or SC identifier is added, renumbered, reused, or moved (decided 2026-11-04,
  Clarifications).
- Q: FR-044 said «every state-changing request issued from a browser session»,
  which reads as an authenticated session, while the guest's sign-up, sign-in,
  and password-recovery requests carry no session — does the forgery protection
  cover them? → A: Yes — the requirement now speaks of every state-changing
  request issued from a browser, whether the person is a guest or signed in, and
  states that the guest's three requests carry no session and are covered as a
  signed-in merchant's requests are. The nine enumerated actions are unchanged.
  No FR, AC, or SC identifier is added, renumbered, reused, or moved (decided
  2026-11-04, Clarifications).
- Q: AC-024 asserted the drawer's focus containment and the guest's redirection,
  then its closing paragraph sent both to the slice that ships the first page
  carrying the frame; AC-042 asserted the guest's redirection and deferred the
  label cut and the scroll rule without naming the exception — where does each
  assertion sit, and what names the deferral? → A: The two AC-024 assertions are
  removed from the structural paragraph and left to the deferred paragraph, which
  already names the drawer's focus containment and the guest's redirection; that
  paragraph now cites the boundary SC-005 fixes and exception `EX-007`. AC-042
  applies the same rule: the guest's redirection is stated as page behaviour
  deferred to R2 under `EX-007`, and the label cut and the scroll rule name
  `EX-007` beside the slice that verifies them. No FR, AC, or SC identifier is
  added, renumbered, reused, or moved (decided 2026-11-04, Clarifications).
- Q: The exceptions to the non-discrimination rule were restated with their
  reasons in FR-008, FR-015, FR-027, FR-029, FR-033, FR-034, and again in SC-004
  — where is the list kept, and what do the requirements say now? → A: SC-004 is
  its single home: the criterion states the closed list once, each exception
  beside the requirement that produces it — a successful sign-in; the outcome
  stated after the correct code is verified; a rate-limit refusal; a format
  refusal; a re-request-limit refusal; and the messaging-channel
  acceptance-failure state — and each requirement now states its behaviour and
  cites the single statement — SC-004's list or, for the administrator rule,
  FR-008's uniform refusal — instead of re-arguing it. Every existing
  exception is preserved, no exception is added or removed, and no requirement's
  behaviour changes. No FR, AC, or SC identifier is added, renumbered, reused, or
  moved (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (3)

- Q: AC-051 asserted that «حسابي» opens the Profile page and that the page shows
  the account's full name, city, and status at its top, then sent the whole
  runtime pass to the slice that ships the first page carrying the frame, while
  FR-047 and T102 build the menu only and the Profile page arrives with R7 —
  what does AC-051 accept here, and who verifies the Profile content? → A:
  AC-051 is narrowed to what this slice builds: the menu's composition — its
  three items, their accessible names and roles, its keyboard reachability, the
  sign-out confirmation's markup, and the two items' link targets — is verified
  structurally here; the menu's live open, its runtime dismissal, and the
  confirmation's result are verified by R2 on the boundary SC-005 fixes under
  `EX-007`; and the destinations the two items name, with the Profile page's own
  content, are R7's against FR-047, recorded as Complexity Tracking row 34, type
  "Deferred binding requirement (FR-047)", owner R7, review 2027-01-31. No new
  exception row is opened: no story here claims a behaviour the slice does not
  build, so the instrument is the narrowed criterion plus the deferred row, as
  rows 5, 25, and 28 do for R2 and R12. FR-047 keeps the binding and states the
  same two levels of verification; the Profile page's content, the status it
  shows included, stays as decided 2026-10-21, and R7's specification answers
  the slice map's open questions against it. No FR, AC, or SC identifier is
  added, renumbered, reused, or moved, and the counts stay 53 FR, 58 AC, and
  9 SC (decided 2026-11-04, Clarifications).
- Q: plan.md named `91 000 0000` one of "the two display forms of the mobile
  number", beside `+218`, while the 2026-11-02 session (41) fixed one display
  form, `+218 91 234 5678`, and `91 000 0000` is the phone field's placeholder —
  which is it, and does either sequence become a CMV value? → A: `91 000 0000`
  is the phone field's placeholder, a prompt in an empty field and not a display
  form of a number: the single display form the platform renders is
  `+218 91 234 5678`, fixed by FR-038 and Session 2026-11-02 (41). The two
  literal digit sequences a template may carry stay `+218`, the prefix the
  number always carries, and the placeholder, and neither is a CMV value; the
  plan's paragraph and the contract's §6 sentence are corrected to say so, and
  FR-038 is unchanged. No FR, AC,
  or SC identifier is added, renumbered, reused, or moved (decided 2026-11-04,
  Clarifications).

### Session 2026-11-04 (4)

- Q: The "no third entity" assumption called the transient store "the pending
  sign-up data", while FR-034 and the Key Entities note call the same store "the
  pending request", because it carries a sign-up and a password-recovery request
  alike — which name does the assumption use? → A: "The pending request": the
  assumption now reads "The pending request's data and the one-time codes" and
  names the shared transient store the way FR-034 and the Key Entities note name
  it once for both flows. The correction is to the term alone: no rule, page,
  scope, or count changes, and no FR, AC, or SC identifier is added, renumbered,
  reused, or moved — the counts stay 53 FR, 58 AC, and 9 SC (decided 2026-11-04,
  Clarifications).

### Session 2026-11-04 (5)

- Q: SC-004 masks three values — `requestId`, `codeExpiresAt`, and `expiresAt` —
  and says no other value is masked, yet the sign-up and password-recovery 202
  body carries the submitted number in `phone`, so the text comparison fails
  whenever the enumeration's two cases submit different numbers; is `phone`
  masked too, and how is the echo still verified? → A: The masked set is four
  values — `requestId`, `phone`, `codeExpiresAt`, and `expiresAt` — because the
  202 body echoes the number each case submitted and the two cases submit
  different numbers. Outside the comparison, the test asserts that each
  response's `phone` equals that case's own submitted number in the canonical
  form, so the echo is verified rather than exempted from scrutiny. The field
  names, their types, the header set's names, the response path, and the
  duration stay compared, and every other rule of SC-004 is unchanged. No FR,
  AC, or SC identifier is added, renumbered, reused, or moved (decided
  2026-11-04, Clarifications).

### Session 2026-11-04 (6)

- Q: The Key Entities note names the shared transient store "the pending sign-up
  data" in its first paragraph and "the pending sign-up request" in the sentence
  that follows, while Session 2026-11-04 (4), FR-034, and `data-model.md` fix
  "the pending request" as its name for both flows — does the note keep the older
  wording or adopt the fixed term? → A: "The pending request": the first
  paragraph now reads "The pending request's data and the one-time codes", and
  the later sentence reads "The pending request carries the details the form
  collected", so the note names the store the way FR-034 and `data-model.md` name
  it. The correction is to the Key Entities note alone: no other section changes,
  no rule, path, page, or scope changes, and no FR, AC, or SC identifier is
  added, renumbered, reused, or moved — the counts stay 53 FR, 58 AC, and 9 SC
  (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (7)

- Q: AC-058 said a session is removed only by its own end — "its timeout, its
  absolute maximum lifetime, a sign-out, or a revocation" — while FR-011,
  FR-013, and FR-019 end every session of an account at once, and FR-037
  defines "revocation" narrowly enough to exclude the endings a password change
  and a block produce; does the criterion assert that a session ends only by an
  act of its own? → A: No — a session also ends by an account-level end: a
  sign-out of every device (FR-011), a password change or reset (FR-013), and a
  block (FR-019). AC-058's closing clause now reads "a session is removed only
  by an end — its own (its timeout, its absolute maximum lifetime, a sign-out,
  or a revocation) or an account-level end (FR-011, FR-013, FR-019)", so "its
  own end" no longer presents the enumeration as exhaustive, and the criterion
  cites those three requirements beside the four it already cited. The no-cap
  answer recorded earlier in this section gains a revision note for the same
  reason, so its own "only by its own end" no longer stands as an exclusive
  enumeration; beyond that note and AC-058's clause and citation list, no
  statement changes: FR-007, FR-010, FR-012, FR-032, and FR-037 are unchanged,
  no rule, page, or scope changes, and no FR, AC, or SC identifier is added,
  renumbered, reused, or moved — the counts stay 53 FR, 58 AC, and 9 SC
  (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (8)

- Q: The specification bounds request latency and states a measurement ceiling, but fixes no availability expectation for the identity surface — does it set an availability target, or state explicitly that the target and its measurement belong elsewhere, and which artifact owns which part? → A: It states the deferral and the boundary: no availability figure and no maintenance window are fixed here, and no success criterion in this slice measures availability, because the target and its measurement belong to R12, the deploying slice that runs the platform with its monitoring and alerting set. This specification owns what the person sees while the service or its data store is unavailable — FR-040's inline, explicit, retryable failure — and no other requirement promises availability; the mechanism that withholds traffic from a service that cannot serve is recorded outside this specification, ADR-142 records the recovery arrangement the constitution's recovery time and recovery point govern, and ADR-141 accepts the messaging provider's consequence. FR-040, AC-043, the matching edge case, and the availability Assumption carry the rule.
- Q: When the service, or the store its data lives in, cannot serve a request one of the three bare pages makes, is the person shown FR-040's inline, explicit, retryable failure — the same state every unnamed failure produces — or a distinct "service unavailable" state with its own copy and placement? → A: FR-040's state, named explicitly: the failure this specification does not name now reaches the service's and its data store's unavailability too, so an outage has one stated rendering rather than an inferred one, with no second state, no separate notice, no navigation, and no error page. The rendering is stated once in FR-040, asserted by AC-043, and carried by the matching edge case, so a second failure surface cannot be introduced for the same condition.
- Q: What does the retry a refusal invites require — a stated interval the person must wait, or "no interval": an immediate retry after FR-040's failure, and no wait named by a limit refusal, whose acceptance the limit's own window decides? → A: No interval of the refusal's own: FR-040's failure is retryable at once, because no limit produced it and the page imposes no wait, while a refusal a limit produces states no interval of its own — whether a later attempt is accepted is decided by that limit's window boundary, the value the recorded values fix, and the response carries the remaining time to it as a machine-readable value, so an operator and a page state the same moment while the page shows no countdown or timer. FR-033 states the rule for the three operation budgets, FR-034 for the limit on requesting a new code, and FR-040 for every failure it renders; AC-035, AC-036, and AC-043 assert them.
- Q: Does this specification guarantee that an SMS message accepted by the channel is delivered, or exclude delivery explicitly, and is the messaging provider recorded as an accepted single point of failure with its outage scope? → A: Delivery is excluded explicitly: the platform's guarantee ends at the channel's acceptance, so a message accepted but never delivered is neither retried nor observable, does not undo the action it reports, and does not turn the request or the action into a failure. FR-043 states that exclusion for the two security notices, as FR-034 already states it for the one-time codes and SC-009 for the measured wait. The provider is recorded in a new Assumption as an accepted single point of failure: its outage stops the two code dispatches and the two notices alone — the dispatches receive FR-034's existing explicit, retryable failure with no second path, and the notices are skipped and recorded as dispatch failures under FR-037 — while sign-in, sign-out, the sign-out of every device, the session's reads and ends, the password change and reset, the forced first change, and provisioning continue, because none needs a message; the platform does not treat the provider's outage as a failure of the service itself, and ADR-141 accepts the consequence. FR-043, AC-047, the matching edge case, and the messaging-provider Assumption carry the rule.

### Session 2026-11-04 (9)

- Q: Are this slice's multi-step writes required to be indivisible — the account
  and its session at code verification, the new password and the ending of every
  session at a change or reset, and the replacement of a code at an accepted
  dispatch — and what does a failure between their parts leave behind? → A: Yes,
  each is one indivisible step, as a product requirement: the account and the
  session that makes it usable come into existence together, so a failure leaves
  neither and keeps the correct code usable (FR-004); the new password and the
  ending of every existing session take effect together, so a failure leaves the
  previous password and every session as they were, and no session survives on a
  superseded password (FR-013, FR-014, FR-028); and the replacement's protected
  value is installed while the previous code stops being valid, in the same step,
  so a failure leaves the previous code valid, the request unchanged, and the
  re-request limit unspent (FR-034). The person sees FR-040's inline, retryable
  failure and retries. The mechanism — how a write is made indivisible, how its
  parts are ordered, and what the plan's storage does — is a plan detail and is
  not stated here, because Principle VII keeps this file technology-agnostic.
  FR-004, FR-013, FR-014, FR-028, FR-034, FR-040; AC-004, AC-014, AC-016,
  AC-036, AC-043 carry the rule (decided 2026-11-04, Clarifications).
- Q: When a request's first response is lost and the person repeats it, what is
  the outcome of each path — sign-up, code entry, password recovery's request,
  and setting the new password — and does a repetition produce a second effect?
  → A: No path produces a second effect, and each reaches a stated outcome. A
  sign-up or recovery submission that the page is still tied to, while the
  pending request it started is live, re-renders the code step and dispatches no
  second code; the code already sent stays valid and no part of the re-request
  limit is spent, while a submission made after the page returns to its first
  step — which ends the tie — is a fresh request that replaces the pending
  request on FR-034's terms. A repeat of the code entry whose first attempt
  reached its outcome, recognized as the same completed step repeated rather than
  a new verification, re-renders that outcome — the confirmation FR-004 requires
  or the terminal message FR-006 requires — creates no second account and no
  second session, and does not consume the code again. A
  repeat of the new-password submission whose first attempt set the password,
  recognized as the same completed step repeated, re-renders the confirmation
  FR-014 requires, sets no password again, ends no session again, and sends no
  second notice. The two surface-less requests this
  slice also serves follow from their own rules: a repeat of the account's own
  change-password action and a repeat of the sign-out of every device arrive
  after the first request ended every session, including the one it was issued
  from, so they are refused as an ended session and write nothing, revoke
  nothing, and send no second notice (FR-011, FR-013, FR-043). No repeat produces
  a second account, a second session, a second code dispatch, a second password
  write, a second revocation, or a second notice. FR-011, FR-013, FR-031, FR-034,
  FR-040, FR-043; AC-006, AC-014, AC-036, AC-043, AC-047 carry the rule (decided
  2026-11-04, Clarifications).
- Q: Are these outcomes product requirements or details left to the plan? → A:
  The outcomes are product requirements: what the person sees on each path, what
  a failure leaves behind, and the guarantee that no repeat produces a second
  effect are stated here and asserted by acceptance criteria. The means are plan
  details: how a completed outcome is recognised, how a submission is matched to
  the pending request it repeats, and how an indivisible write is achieved are
  not named here, because Principle VII keeps this file technology-agnostic; the
  plan owns them and the tasks cite them. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved — the counts stay 53 FR, 58 AC, and 9 SC (decided
  2026-11-04, Clarifications).

### Session 2026-11-04 (10)

- Q: What does a restart of the service do to the state this slice holds — the
  live sessions, the account locks and their counts, the live pending requests
  and their codes, and the rate-limit windows — and what does a request that was
  in flight when the service stopped receive? → A: A restart changes none of it,
  because none of it is state a restart may exercise: a live session stays live
  and keeps both its clocks, the count of consecutive failed password
  verifications and the lock stay as they were and the lock still lifts only at
  its own expiry, a live pending request keeps its code, its own expiry, its
  verified state, and its remaining allowance, and a rate-limit window keeps the
  budget it has spent. The restart is therefore invisible to a person: no session
  ends, no lock lifts or is applied, no pending request is replaced, no code is
  invalidated, and no window is reset, and only the rules this specification
  states end or change any of that state — the session's own ends (FR-010 …
  FR-013, FR-019, FR-032), the lock's own expiry (FR-009), a pending request's
  own end (FR-034), and a window's own boundary (FR-033) — none of which the
  restart exercises. A request in flight when the service
  stopped receives no answer; when the service serves again, the person's repeat
  reaches the outcome FR-040 states for a repeated request, so no restart
  produces a second account, session, dispatch, write, revocation, or notice.
  FR-054 and AC-059 carry the rule (decided 2026-11-04, Clarifications).
- Q: During a deployment that applies a migration, what may the platform serve,
  what does a migration itself change, and what does a request that arrives while
  no instance serves the release receive? → A: The platform serves no request
  while the stored data is not at the version the running code expects — it
  refuses to serve rather than answer from data of another version, so no
  request is decided against a shape the running code does not expect — and
  applying a migration changes none of the state the restart rule names, so a
  release changes the stored data's shape and nothing a person holds. A request
  that arrives while no instance serves the release is outside FR-040, because
  FR-040 renders the failure of a request the platform answers; the gap's
  duration, the answer such a request receives, and the procedure that shortens
  it are the deployment procedure R12 owns, and the Assumptions record that split
  and its boundary. FR-054 and AC-060 carry the rule (decided 2026-11-04,
  Clarifications).
- Q: After a restore to a point within the fifteen-minute recovery point, what is
  the expected state of sessions, locks, pending requests, and rate-limit
  windows — and does FR-032's "only two clocks" still hold? → A: The store
  returns to the state of that moment, and the state this specification defines
  is read as at that moment rather than reconciled: a session live at the point
  stays live while one created after it ends and its holder signs in again, a
  lock and its count are as they then were, a pending request is as it then was
  (one started after the point no longer exists and its code is refused under
  FR-034, one replaced or ended after it is live again with the code it then
  held), and a window spent after the point is unspent. A restore therefore MAY
  end a session, lift a lock, drop a pending request, or reopen a window, and
  those effects are accepted rather than prevented: FR-032's two clocks govern
  the platform's own operation and are untouched by the event, which is a stated
  cause outside them and outside every rule that ends a session, bounded by the
  fifteen minutes the recovery point fixes, so no restore loses more state than
  that window and no continuity across it is promised. FR-055 and AC-061 carry
  the rule (decided 2026-11-04, Clarifications).
- Q: May a restore reintroduce account data FR-017 and FR-018 say is removed or
  retained — a `User` row removed for good after the restore point, or a block
  applied after it? → A: Yes, and the consequence is accepted. The row returns as
  it stood at that moment, so the account is registered again and its personal
  data is read again until the removal is repeated, and a block applied after the
  point is undone, so the account can sign in again until an administrator
  re-applies it. Neither effect breaches FR-017 or FR-018: a restore removes no
  data, "keeps its data" describes what blocking does rather than the store's
  timeline, and "lives as long as the account is registered" is read at the
  restored moment, in which the account is registered again. This slice performs
  no reconciliation and keeps no out-of-band record of removals or blocks;
  instead it states the cost — bounded by the recovery point, repeated by the
  act that owns the removal (R13's administrator operation or R15's retention
  job) and re-applied through R12's recovery procedure. FR-055 and AC-061 carry
  the rule (decided 2026-11-04, Clarifications).
- Q: Who owns the rollback of the schema change this slice introduces, is it
  exercised before production, and what does a person see when a release is
  rolled back? → A: The migration is one reversible step with both directions
  defined, and its rollback is applied in staging before it is needed in
  production: R1 owns the migration and its reversibility and R12 owns running a
  release-level rollback in production, with that boundary recorded in the
  Assumptions. A production rollback is read as the same class of event a
  restore is, so state written under the version being rolled back is lost with
  it — a session created after the migration ends and its holder signs in again,
  a lock and its count applied after it are gone, a pending request started after
  it ends, and a window spent after it is unspent — and while the rollback runs
  the platform serves nothing, so a request that arrives then is outside FR-040
  exactly as it is during a deployment. No continuity is promised across the
  event. FR-055 and AC-062 carry the rule (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (11)

- Q: Every response that is not a plain success has been classified from its
  requirement, from the contract, and from the shared message table, and the fifth
  incorrect entry is recorded in one place as an error code and in another as a
  status that is not an error — which class is it, and by what one rule is every
  other response classified exactly once? → A: Every response is exactly one of
  five kinds, decided by what it reports and by the action it leaves the person —
  never by its rendering, its announcement, or its transport's success status: a
  **refusal** answers a submission, names a cause in what was submitted or in the
  request's handling of it, and leaves the step able to serve again; a **notice**
  reports that the request or the step has ended and requires a fresh request,
  with the step replaced; a **state** reports the session's or the account's
  condition inside the frame; an **outcome message** reports a flow's settled
  branch after ownership of the number is proven; and a **confirmation** reports
  success. The fifth incorrect entry is a **notice**: its response reports that
  the request ended rather than a fault in the code that was entered, the code
  step cannot serve again, and the page returns to the flow's first step carrying
  it — its cause code names the reason and not the kind, the message table
  carries one text for it instead of the duplicate "status, not an error" row,
  and the contract lists it as a notice rather than among the refusals. The
  silent hidden-field response stays a refusal, because silence is a rendering
  and the submission was not carried out, and the three post-verification
  messages are outcome messages rather than refusals. The words "refused" and
  "refusal" elsewhere in the specification name only the fact that a submission
  is not accepted. FR-034, FR-038, FR-040, FR-051, and SC-004 carry the rule, and
  the catalogue at the end of the Functional Requirements section holds it
  (decided 2026-11-04, Clarifications).
- Q: Where is the slice's response set enumerated once, what does "retryable"
  mean and is it a property stated for every refusal, and where does each
  response appear? → A: The set is enumerated once in the refusal catalogue at
  the end of the Functional Requirements section: one row per response, naming
  its kind, the requirement that produces it, where it appears, and whether it is
  retryable, with a closing note that maps the four refusals excluded from
  SC-004's comparison to that criterion's closed exceptions and states that no
  seventh exception is added. **Retryable** is defined there once: a response is
  retryable when it invites the person to act again and the action may succeed
  without correcting any value the response reports — a refusal's step may be
  submitted again, a notice's fresh request may be started — it states no
  interval of its own, a limit's window alone deciding when the repeat is
  accepted, and a response whose only action is to correct a value it reports, or
  which reports a settled condition, is not retryable. Placement is stated per
  row in six terms — field,
  card, silent, step replaced, surface state, and none — so no response borrows
  another page's placement. The contract's retryable flag follows the definition,
  so `OTP_INCORRECT` no longer carries it; no FR, AC, or SC identifier is added,
  renumbered, or reused (decided 2026-11-04, Clarifications).

### Session 2026-11-04 (12)

- Q: The literal Arabic text is called a fixed design value "taken from the
  design reference and recorded", yet the design reference is a capture set and
  the recorded copy is one record — which artifact governs a string, and does an
  acceptance criterion assert the text? → A: The recorded copy is the single
  authority: every string is recorded there once, a capture is evidence of
  composition and appearance only and governs no string, and where a capture and
  the record differ the record wins (the diacritics rule and the lab's
  lockout alert are the recorded differences). FR-026 states the copy's rules and
  its identity, and AC-028 asserts that every rendered string is the text
  recorded for its state, reason, or cause, so the literal copy is pinned by
  identity rather than by a quoted string (decided 2026-11-04, Clarifications).
- Q: May any string name a state this specification does not have — «مقفل» or
  «موقوف» on the sign-in page, or a countdown — or is every string confined to
  the states this specification defines? → A: No string names an unowned state:
  the sign-in page's copy names neither the lock nor the blocked status and
  shows no countdown, and the blocked-status strings appear only on the three
  surfaces this specification owns — the sign-up outcome for a blocked account
  (FR-006), the recovery result for a blocked account (FR-014), and the frame's
  ended-session blocked variant (FR-049); FR-026 and AC-028 state the rule, and
  AC-010's existing lock clause is unchanged (decided 2026-11-04,
  Clarifications).
- Q: Does an acceptance criterion pin the literal text, or only the identity
  between two states? → A: AC-028 pins it by identity: every string a page, the
  frame, or a message template renders is the text recorded for its state,
  reason, or cause, no page composes a sentence of its own, and the same cause
  renders the same text wherever it appears; AC-009, AC-010, AC-036, and AC-037
  keep the same-case and same-reason comparisons, and SC-008 keeps the form
  scan. No identifier is added, renumbered, or reused (decided 2026-11-04,
  Clarifications).

### Session 2026-11-04 (13)

- Q: What is the coverage gate's denominator, its comparison basis, the moment
  it blocks, and the artifact that carries its verdict? → A: The denominator is
  the changed production lines this slice introduces: every added or modified
  executable line of production source in the diff between the revision the
  feature branch was created from and the commit under test, counted per file.
  Test files, fixtures, documentation, and configuration are not production
  source and are outside it; generated code, migrations, and snapshots are
  exempt by Principle III and stay out of both numerator and denominator. The
  numerator is the subset of those lines a test exercises, so the percentage is
  covered changed production lines over changed production lines. The
  comparison basis is that one diff and no other: the repository total, a later
  branch, and a line unchanged in the diff are not counted. The gate blocks in
  continuous integration — a change whose report shows fewer than 80% of changed
  production lines covered MUST NOT merge — and R1's acceptance at the
  verification increment MUST NOT be recorded while the gate fails. The artifact
  is the coverage report attached to the change's review and kept with the
  acceptance record, naming the diff baseline, the changed-line count, the
  covered count, the percentage, and every excluded path with the exception row
  that authorises it. The exclusion is closed to `EX-007`'s exact scope and no
  other line is excluded; adding a behaviour to it or removing one from it
  requires amending that row. The Test Coverage Request carries the rule. The
  earlier records that named the header's runtime behaviour mean the account
  menu's live open and dismissal, which this list names; no wider header
  behaviour is excluded.
- Q: On what clock are SC-001, SC-002, and SC-003 measured, and by what sampling
  and tolerance is SC-004 decided, so two runs of one journey are timed alike and
  the enumeration test cannot pass on a favourable count? → A: The three journey
  criteria use one clock: it starts when the page's first step is served and
  stops when the terminal confirmation renders; the interval between the
  messaging channel's acceptance of a code and the moment the code is available
  to the person is subtracted, and no other interval is. SC-002 has no delivery
  interval because it sends no code. SC-004 uses one enumeration protocol, stated
  once: 200 samples per case after a 20-request warm-up, the top and bottom 5%
  of each case's durations dropped, and the account-exists and no-account cases
  compared so that the difference between their medians is ≤ 50 ms and the
  difference between their p95s is ≤ 150 ms, with one test per operation. The
  compared cases are closed: the account/no-account pair for sign-up, sign-in,
  and recovery, plus the locked, blocked, and administrator accounts on the
  merchant sign-in surface. The text is compared after masking the four named
  values and no others; status, header set, response path, and duration stay
  compared. AC-031's hidden-field comparison is one-sided — the silent response
  MUST NOT be observably faster than a successful submission by more than the
  tolerance, and being equal or slower passes — and its comparator is a
  successful submission whose dispatch the channel accepted; a channel refusal is
  outside SC-004's comparison under exception 6 and is never the comparator.
  SC-001, SC-002, SC-003, SC-004, and AC-031 carry the rule.
- Q: What are SC-005's, SC-006's, and SC-008's closed scopes, and what may AC-042
  assert? → A: SC-005 has two halves and is met only when both hold: this slice's
  half is 100% of the three bare pages rendering no frame and the frame's
  delivered composition passing the structural assertions, and R2's half is the
  target scopes rendering it and the named page behaviours passing; this slice
  may report its half met while R2's half stays open under `EX-007`, and it MUST
  NOT read as fully met before R2 closes it. SC-006's matrix is closed at the
  states the three pages deliver — sign-up's thirteen, sign-in's four, and
  recovery's fifteen — each in both appearances at 320 and at 1280 CSS px, with
  the keyboard-only pass and reflow check at both widths; the design-conformance
  baseline reads the same delivered-state set in both appearances, so a state
  omitted from either appearance is a failure rather than an untested state, and
  a baseline update cannot remove a state or an appearance from the set. SC-008's scan is closed to the four SMS templates — the
  sign-up code, the recovery code, the password-change notice, and the
  sign-out-of-every-device notice — and to the platform's own strings; it fails
  on a code point with `Extended_Pictographic`, U+FE0F, or U+20E3, on an
  Arabic-Indic digit, on a combining mark in U+064B–U+0652 or U+0670, and on a
  Latin letter sequence other than `SMS`, while a supplied value's script and
  digits and the fixed city list's recorded names are outside the language,
  numeral, and diacritic limbs and inside the no-emoji limb. AC-042 asserts the
  frame's composition and each control's presence, accessible name, role, and
  keyboard reachability only; the overlays' stacking order, an outside
  activation's consumption, the drawer's focus containment and destination
  focus, the account menu's live open and dismissal, the guest's redirection, the
  bottom bar's scroll-hide, and the label cut are R2's page behaviour under
  `EX-007` and are not asserted here. SC-005, SC-006, SC-008, and AC-042 carry
  the rule.
- Q: What is the P1 checkpoint's pass condition, and how is SC-009's load
  condition keyed and failed? → A: The P1 checkpoint passes only when the five
  US7 integration cases pass on the P1 surface — the hidden field's silence and
  the minimum time (AC-031, AC-032), the two-key limits over account creation and
  sign-in with the resend bound (AC-033, AC-035, AC-036), the refusal order
  (AC-055), request forgery, output encoding, and the security headers (AC-048,
  AC-049, AC-050), and the no-CAPTCHA rule (AC-034) — together with US1's and
  US2's acceptance criteria; no other test gates it, and the coverage gate is
  R1's acceptance condition rather than a P1 condition. SC-009 is an aggregate
  ceiling, not one client's rate: 600 measured requests — 200 per operation —
  are presented by 20 independent origin keys with one distinct number key per
  request, so no origin or number exhausts its own budget and the 10-per-second
  figure is the aggregate. The run fails when any measured request is refused,
  when an operation's accepted count is not 200, when a dispatch is faster than
  the declared 50 ms channel-acceptance wait, when the work-only p95 exceeds
  250 ms, or when p50 exceeds 150 ms or p95 exceeds 1,000 ms; percentiles are
  over accepted requests only, and a post-run probe MUST prove the limiter live
  by refusing the 21st account-creation submission from a fresh origin.
- Q: Which story and measurement point own AC-056, AC-057, and AC-058, and which
  named unit or integration test covers each journey withdrawn from end-to-end? →
  A: AC-056 is US2's, measured by the merchant-scope integration test — the
  scoped session lookup, the ignored supplied account identifier, and the
  ordinary not-found answer for another account's row. AC-057 is US1's, measured
  by the no-email case of the account-creation integration test over every form,
  response, notice, and stored value the slice creates or reads. AC-058 is US2's,
  measured by the multi-session case of the session-endings integration test,
  which signs in from two clients, ends one, and then signs in again. The journeys withdrawn from end-to-end are mapped
  one-to-one: US2's sign-out (AC-011) and sign-out of every device (AC-012) are
  named integration cases in the session-endings test, the first asserting that
  one of two live sessions ends while the other stays live and granting access,
  the second that every session of the account ends; the platform revocation
  (AC-013), the password change that ends every session (AC-014), and the
  multi-session rule (AC-058) are that test's remaining cases, while the two
  session clocks and the activity rule (AC-015) are the session-clocks unit
  test's cases; US4
  (AC-018 – AC-021) is the status integration test, with the blocked state
  reached directly and the withdrawn session under `EX-008`; and US6 (AC-029,
  AC-030, AC-054) is the administrator first-sign-in and refusal integration
  cases, under `EX-010`. No withdrawn journey is left to "the unit and
  integration tests named above". AC-056, AC-057, AC-058, and the Test Coverage
  Request carry the assignment. No FR, AC, or SC identifier is added,
  renumbered, reused, or moved, and no page, route, or count changes.

### Session 2026-11-05

- Q: Which refusals are decided before FR-051's five-step order begins — before
  its step (1) — and are they part of that order or outside it? → A: Four are
  decided before any page step and sit outside the five-step order: the request's
  forgery and origin check (FR-044), its body-size bound, its method, and an
  unknown route. Each precedes step (1) and none is one of the order's five
  steps, so the order begins only with a request they admit and no page rule in
  it runs on a request any of them refuses. `contracts/auth-api.md` §2.1 and §4
  record the same boundary — the forgery and origin check precedes step (1),
  and the body-size, method, and unknown-route refusals stand outside the
  order. FR-051 carries the rule; no FR, AC, or SC is added, and no
  identifier moves (decided 2026-11-05, Clarifications).
- Q: Are SC-009's 10 requests per second, 10,000 registered accounts, and 500
  concurrent sessions a limit the service enforces, and what happens to a
  request above them? → A: They are a measurement condition, not a service
  limit: no request is refused for reaching them, and above them FR-033's
  per-key budgets still decide each request exactly as they do below the
  ceiling, while a request the platform cannot serve is FR-040's unnamed
  failure, rendered on the page that made it. The Assumptions carry the rule;
  no FR, AC, or SC is added, and no identifier moves (decided 2026-11-05,
  Clarifications).
- Q: Does SC-009's p50/p95 budget bound the three pages' rendering as well as a
  request's server-side completion? → A: No — SC-009 bounds a request's
  server-side completion alone. The three pages carry a separate rendering
  budget, fixed by the design contract and asserted by the plan's performance
  gate; this specification names neither the budget's metric nor the tool that
  asserts it, so neither budget is read as covering the other. The Assumptions
  carry the rule; no FR, AC, or SC is added, and no identifier moves (decided
  2026-11-05, Clarifications).

### Session 2026-11-05 (2)

- Q: FR-044's rule counts state-changing requests while its enumeration counts
  actions — which unit governs, and how many requests does the enumeration
  cover? → A: The request is the unit, because it is what the protection
  covers; the nine actions are served by ten requests, because the entry of a
  one-time code is served once at sign-up and once in password recovery; an
  action served by more than one request is protected on every request it is
  issued to.

### Session 2026-11-10

- Q: FR-055 and AC-062 say the migration this slice introduces is one reversible
  step, while the plan and the tree carry two ordered migrations, `0001` and
  `0002`. Which count is the rule? → A: Each migration is one reversible step
  with both directions defined; this release carries two ordered steps, `0001`
  then `0002`, and each down is the exact inverse of its up. FR-055's sentence,
  AC-062's parenthetical, and the plan's schema-rollback section carry the rule;
  the plan's "two ordered reversible steps" is the release reading, not a second
  rule. No requirement, acceptance criterion, success criterion, or identifier
  is added or renumbered (decided 2026-11-10, Clarifications).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account and verify the mobile number (Priority: P1)

A visitor to the platform signs up as a merchant. They enter their full name, a
Libyan mobile number on +218 (the form offers no dial-code selector at all — the
platform is Libyan only), a password, a city picked from one fixed searchable
list of every Libyan governorate, city, and area, and an optional shop name. The
platform sends a one-time code by SMS to the number, and the account becomes
usable only once the visitor enters that code correctly — entering it signs the
visitor in, with no separate sign-in step. This is the door into
the whole product: without a verified account a person cannot upload, bookmark,
or message, so it is the first thing the platform must do.

**Why this priority**: It is the entry point for every other slice and the only
way a person becomes a merchant. Without it nothing else in the product is
reachable.

**Independent Test**: Can be fully tested by completing the sign-up form with a
valid Libyan mobile number and entering the code the platform sends, and
delivers a usable merchant account with the merchant signed in; the number's
Libyan-only shape, the absence of a dial-code selector, the city list, and the
uniform response are each verifiable on their own.

**Acceptance Scenarios**: covered by AC-001 – AC-007, AC-037, AC-041, AC-043, and AC-046 in the Acceptance Criteria section.

---

### User Story 2 - Sign in, sign out, and end every session (Priority: P1)

A verified merchant signs in with their mobile number and password and is not
asked for a code. They can sign out of the current session, or sign out of every
device at once. The platform itself can end a signed-in session at any time, and
changing the password ends every existing session. A session also ends at its own
lifetime — the timeout after no activity, or its absolute maximum lifetime —
after which the merchant signs in again. This is how a
merchant gets back in and how they take control of their access. This slice
delivers sign-out and sign-out-of-every-device as behaviour, and it builds the
control that offers sign-out — the account menu's third item with its yes-or-no
confirmation — as part of the frame's composition, verifying it structurally,
because no page this slice ships renders the frame; the control's runtime
behaviour lands with the slice that ships the first page carrying the frame (R2)
(decided 2026-10-10; revised 2026-10-21, Clarifications). The account's own
change-password action
is delivered the same way — as behaviour, with no page — and the profile page
that offers it arrives with a later slice (decided 2026-10-11, Clarifications).

**Why this priority**: A merchant who cannot sign in or out cannot use the
product; the session lifecycle is part of the same MVP as account creation.

**Independent Test**: Can be fully tested by signing a verified merchant in
without a code, signing out of one session, signing out of every device, ending a
session from the platform side, and changing the password, and delivers control
over the merchant's access. Sign-out, sign-out-of-every-device, the
change-password action, and the other session-ending paths are verified at the
behaviour level; the structural verification of the sign-out control and the
account menu is US5's, named in that story's Independent Test, because no page
this slice ships renders the frame (decided 2026-10-10 and 2026-10-11,
Clarifications; revised 2026-10-21, Clarifications; revised 2026-11-01,
Clarifications).
One test is the exception: the security-events test asserts the closed list's
events across the surfaces US1, US3, US6, and US7 deliver, and that one test is
covered by exception `EX-012` in
the exception register, whose exact scope names where the
dependence ends (decided 2026-11-01, Clarifications). The sign-out control's
structural verification belongs to US5 (AC-051) and is not claimed
by this story's independent test.

**Acceptance Scenarios**: covered by AC-008 – AC-015, AC-040, AC-045, and AC-047 in the Acceptance Criteria section.

---

### User Story 3 - Recover a forgotten password (Priority: P2)

A merchant who has forgotten their password asks to reset it. The platform sends
a one-time code by SMS to the registered mobile number, and once the code is
entered correctly the merchant sets a new password, which ends every existing
session of the account. The response never reveals whether the number has an
account.

**Why this priority**: Without recovery a merchant locked out of their password
is permanently locked out, since there is no email and no self-deletion; it is
essential but secondary to getting in the first time.

**Independent Test**: Can be fully tested by requesting a reset for a registered
number, entering the code, and setting a new password, and delivers a merchant
back into their account with every session the account already held ended; the
uniform response is verifiable on its own, and so is the code's single use — it
stops being usable once verified, the new-password step survives a reload while
the verified state lives, and it cannot authorise a second reset (decided
2026-10-22, Clarifications).

**Acceptance Scenarios**: covered by AC-016 – AC-017 and AC-038 in the Acceptance Criteria section.

---

### User Story 4 - Account status and control over sessions (Priority: P2)

An account carries a status: active or blocked. A blocked merchant keeps all
their data and their public contributions but can no longer sign in, and any
session they already held stops granting access. A merchant can never delete
their own account; the platform's administrator controls accounts. This slice
delivers the status and what it governs — the uniform refusal at sign-in and the
withdrawal of the sessions the account already held — while the act of blocking
belongs to the administrator's Users page, which arrives with a later slice
(decided 2026-10-11, Clarifications).

**Why this priority**: Blocking is how the platform withdraws access without
destroying data, and it must be defined with the account from the start, but it
is not needed to create the first account.

**Independent Test**: The status read, the retained data, and the absence of a
delete path are each verified without another story: the blocked state is
reached directly in this slice's tests, because the act of blocking arrives with
the administrator's Users page (decided 2026-10-11, Clarifications). The
blocked-account half of the status test runs through the sign-in surface US2
delivers, and its withdrawn-session assertion — that a session the account
already held is refused — runs through the session read US2 delivers; that one
test is covered by exception `EX-008` in
the exception register, whose exact scope names both paths
and where the dependence ends.

**Acceptance Scenarios**: covered by AC-018 – AC-021 in the Acceptance Criteria section.

---

### User Story 5 - Move around the platform inside the shared page frame (Priority: P2)

Every page that carries the frame — the public site's Home, Parts, and Catalog
pages and the merchant's area — is presented inside one
shared page frame: a header, a sidebar, a footer band at the wide width, a
bottom bar on a narrow screen, the product's icon set, and the product's
typography. The sidebar sits
at the inline-start edge — the right edge under the RTL direction — and carries
the platform's navigation item list — one item per registered destination a
guest or a signed-in merchant can reach (Home, Parts, Catalog, Upload Catalog,
My Files, Cart, Notifications, Messages, and Profile), with the bare pages and
the four static pages carrying no item and with the same list shown to a guest
and to a signed-in merchant — no item added, removed, or disabled by role —
together with the sidebar-collapse control. The sidebar shows in full on a wide screen and narrows to an icon-only
rail when collapsed; on a narrow screen it becomes a drawer that the bottom
bar's «المزيد» slot opens and the collapse control closes, or that Escape or an
activation outside it closes, with the focus returning to «المزيد»; activating a
navigation item inside it instead closes it and moves the person to the
destination, with the focus settling on that page's heading, and the bottom bar
stays visible while the drawer is open (decided 2026-10-31, Clarifications). Below 1024px the
bottom bar carries five slots — Home, Upload Catalog, a raised search action to
the Parts page, My Files, and «المزيد» — and from 1024px up it is absent; it is
one composition shown identically to a guest and to a signed-in merchant. The
header carries the platform's logo/home control at its
inline-start edge and, at its inline-end edge, the notifications control, the
theme switch, and the account control, and keeps all four in one row at the
smallest supported width of 320 CSS px, the guest's three controls under the
same rule (decided 2026-10-31, Clarifications; guest rule stated 2026-11-01,
Clarifications); the account control opens a menu
carrying «حسابي»، «إعدادات»، and «تسجيل الخروج», the last asking for a
yes-or-no confirmation; for a guest a sign-in action replaces the account
control and the notifications control, and the guest keeps the theme switch
(ADR-102). The frame carries the
platform's way of reaching the static pages (Contact, Privacy Policy, Terms of
Use, FAQ). The frame never appears on the sign-up, sign-in, password-recovery,
error, or static pages, which are shown bare. This slice delivers the frame
whole — its header's logo/home, notifications, and theme-switch controls and
the account menu, the sidebar's navigation item list with the collapse
control, the bottom bar's five slots, its means of reaching the static pages,
and the surface that carries those links — and verifies them structurally,
the sidebar's two-width behaviour and the bottom bar's drawer-opening
behaviour among them; the account menu's live open, its runtime dismissal,
and the confirm behaviour are exercised at runtime by the slice that ships
the first page carrying the frame, while the data behind the menu's
destinations and the notifications destination arrives with the slice that
owns each destination (decided 2026-10-10, revised 2026-10-11, 2026-10-21,
and 2026-11-03, Clarifications; revised 2026-10-25, ADR-126).

**Why this priority**: The frame is what every later browser-facing slice
composes instead of rebuilding; it is delivered here so the platform is coherent
from its first page. It is secondary to the account flows, which are usable
without it.

**Independent Test**: The frame's composition — the header's logo/home,
notifications, and theme-switch controls and the account menu, the sidebar's
navigation item list with the collapse control, and the bottom bar's five slots —
is verified structurally without another story, as delivered, because this slice
ships no page that renders the frame. That structural-only verification is
recorded as exception `EX-007` in
the exception register, with its exact scope, the repository
owner as approver, and a review date, because Principle VIII is
NON-NEGOTIABLE and the exception register, not a deviation entry, is the
instrument for it (ADR-139). What this slice verifies itself is the structural
half of the boundary SC-005 fixes: the sidebar's two-width behaviour; the
header's single-row behaviour at 320 CSS px
with its controls present; the account menu's items and the sign-out
confirmation's markup; the drawer's opening by «المزيد» and its closing by the
collapse control, Escape, and an activation outside it, with the focus returning
to «المزيد», an item's activation closing it as part of the navigation, and the
bottom bar staying rendered and visible under the open drawer. The page behaviour
alone waits for the slice that ships the first page carrying the frame: the focus
landing on the destination page's heading after a
drawer item navigates, the drawer's focus containment, the overlays' stacking
order and the consumption of an activation outside them, the account menu's live
open and its runtime dismissal with the sign-out confirmation's result, the
guest's redirection, the bottom bar's scroll-hide rule, and the label cut at the
inline-end (decided 2026-10-11; revised 2026-10-21, Clarifications; revised
2026-10-27, Clarifications; revised 2026-11-03, Clarifications; boundary cited
from SC-005 2026-11-04, Clarifications). One test is the
exception: the bare-page end-to-end test opens the three bare pages this slice
ships (US1, US2, US3), covering AC-023, and that one test is covered by
exception `EX-009` in the same register, whose exact scope names where the
dependence ends.

**Acceptance Scenarios**: covered by AC-022 – AC-028, AC-039, AC-042, AC-044, AC-051, AC-052, and AC-053 in the Acceptance Criteria section.

---

### User Story 6 - The operator creates the administrator account (Priority: P3)

No one becomes an administrator through the public sign-up flow. The platform's
administrator account is created by the operator, and the administrator must
change the password at first sign-in. This keeps the platform's privileged
surface out of the public registration path, and the merchant sign-in surface
refuses an administrator's credentials with the same uniform refusal any failed
sign-in receives, so the administrator signs in only on the administrator's own
surface. This slice delivers the
provisioning action and the requirement it places on the account, not the
administrator's sign-in surface, which arrives with a later slice (decided
2026-10-10 and 2026-10-11, Clarifications).

**Why this priority**: It protects the platform's privileged surface and is
required from the start, but it concerns the operator rather than the merchant,
so it is lower priority than the merchant's own flows.

**Independent Test**: Provisioning and the forced-change behaviour are verified
with the story's own fixtures: the provisioning action is run twice and each run
yields a distinct administrator account while a run for a number that already has
an account creates nothing and reports the conflict, and the provisioned account
carries the forced-password-change requirement, so that any further product
action is refused until the password is changed while ending the session remains
available; the password change made at that first sign-in clears the requirement
and lifts the restriction while no other path clears it, a submission repeating
the initial password is refused and clears nothing, the change requires the
current password and a submission without it or with a wrong one is refused and
leaves the account restricted, the change ends every existing session of the
account, and it sends the security notice — the first sign-in and the change made
at it are exercised at the behaviour level here, with no page, and only the
administrator's sign-in surface arrives with a later slice (decided 2026-10-10
and 2026-10-11, Clarifications). The tests that exercise the sign-in, lock,
revocation, and notice behaviour US2 delivers, and the recovery role refusal US3
delivers, covering AC-029, are covered by exception `EX-010` in
the exception register, whose exact scope names where the
dependence ends.

**Acceptance Scenarios**: covered by AC-029 – AC-030 and AC-054 in the Acceptance Criteria section.

---

### User Story 7 - Sign-up resists automated abuse without a CAPTCHA (Priority: P1)

The sign-up form is protected against automated submission by a hidden field a
person leaves empty, a minimum time between the platform's serving of the form
and its submission, measured on the platform's own clock, and a limit on how
often one client may submit. The rate limit covers
every authentication operation — account creation, sign-in, and password
recovery — so one client cannot submit any of them without bound. No CAPTCHA is
ever used anywhere in the platform. The whole browser surface this slice ships is
protected by the three controls the constitution requires of the first
browser-facing feature: every state-changing request is protected against
request forgery, every value a person supplies is encoded for its output context,
and every response carries the security headers the constitution names (decided
2026-10-11, Clarifications).

**Why this priority**: It is the protection layer the constitution requires of
the first browser-facing feature, and this slice ships that feature, so the
control set is P1: the form and its controls ship together or not at all. The
story sits last in this file because requirement identifiers are fixed, not
because its priority is lower; the P1 checkpoint includes its integration tests
(ADR-139).

**Independent Test**: Can be fully tested by submitting the form with the hidden
field filled, before the minimum time has passed, with a time value the platform
did not issue, and more often than the limit,
by confirming no CAPTCHA challenge is ever presented, and by confirming that a
request the person did not make is refused, that a value typed as markup or
script is shown as text, and that every response carries the required security
headers. The controls themselves live on the surfaces US1, US2, and US3 deliver —
the hidden field, the fixed refusal order, the two-key rate limits, the
request-forgery, output-encoding, and security-header controls, and the
no-CAPTCHA rule — and that crossing is covered by exception `EX-011` in
the exception register, whose exact scope names where the
dependence ends (decided 2026-11-01, Clarifications).

**Acceptance Scenarios**: covered by AC-031 – AC-036, AC-048 – AC-050, and AC-055 in the
Acceptance Criteria section.
---

### Edge Cases

- A visitor signs up with a number already registered, written differently
  (spaces, a leading zero, without the +218 prefix, with separators such as
  dashes, with a country code written with the plus sign or as the international
  prefix, or with the digits typed as Arabic-Indic numerals). It is the same
  number: the country code is read once rather than doubled, so it must not
  become a second account, and the response must not reveal that the number is
  taken (see AC-007, AC-006). A value that does not resolve to a +218 mobile
  number is refused with the format refusal FR-042 names rather than treated as
  a different account (AC-003, FR-031).
- Two sign-up attempts for the same number arrive at the same moment. Uniqueness
  is enforced when the account is created, so at most one account exists; the
  attempt that does not create it receives the message FR-006 fixes for the
  existing account's status and role — the active merchant's
  sign-in-or-recovery message, the blocked account's message, or the
  administrator account's message, with no generic direction where the status or
  role calls for none — decided by the existing account's stored status and role,
  and no partial account and no second session is left behind (AC-006).
- Two entries of the same correct one-time code for one number arrive at the same
  moment. At most one account is created and at most one session results; the
  entry that does not create the account receives that same status- and
  role-specific message rather than a generic direction to sign in or to recover
  the password, and no partial account, no second session, and no live pending
  request is left behind (AC-006, FR-031, FR-034).
- A person submits the sign-up form, or a one-time code, and the request is
  still in flight when they submit again. The page shows an in-progress state
  and the submit control is disabled, so no second dispatch is started; if a
  duplicate still reaches the platform, the server-side rules handle it as the
  concurrent cases above, and a repeat whose first response was lost follows the
  per-path rule below, so no second account and no second code dispatch results
  (AC-043, FR-040).
- A multi-step write fails partway — the account's creation and its session at
  code verification; the new password and the ending of every session at a
  change, a reset, or the forced first change; or the replacement of a code at an
  accepted dispatch. The step is indivisible, so none of its parts takes effect:
  no partial account, no password set without the sessions it ends, no session
  that outlives the password it was issued under, and no moment with no valid
  code; the person sees FR-040's inline, retryable failure and retries, and the
  pending request and its code stay as they were where the step had not completed
  (AC-004, AC-014, AC-016, AC-036, AC-043; decided 2026-11-04, Clarifications).
- A request's first response is lost and the person repeats it. No second effect
  results: a sign-up or recovery submission still tied to its live pending
  request re-renders the code step without a second dispatch and leaves the code
  already sent valid; a code entry whose first attempt reached its outcome
  re-renders that outcome without a second account or session; a new-password submission
  that set the password re-renders the confirmation without a second write, a
  second ending of the sessions, or a second notice; and a repeat of the
  account's own change or of the sign-out of every device is refused as an ended
  session without a second revocation or notice, because the first ended every
  session including the one it was issued from. A submission made after the page
  returned to its first step is a fresh request on FR-034's terms
  (AC-006, AC-014, AC-036, AC-043, AC-047; decided 2026-11-04, Clarifications).
- A visitor completes sign-up with a number that already has an account and
  enters the code correctly. No second account is created and the password they
  typed is not applied to the existing account; they are directed to sign in or
  to recover the password by a message on the code step that names both options
  and offers the link to the sign-in page and the link to the password-recovery
  page, with no redirect (AC-006).
- A person asks to reset the password of a number that has no account and enters
  the delivered code correctly. Ownership of the number is proven, no password is
  set, and the platform states explicitly that no account exists for that number;
  the code step is replaced in place by that message, with no navigation and no
  retry control, the person stays on it, and a reload or a fresh opening returns
  the page to its first step, because the pending request has ended;
  the request's response, the following step, and the code dispatch were already
  indistinguishable from those for a number that has an account (AC-017).
- A one-time code is entered incorrectly several times, after it has expired, or
  after a replacement has superseded it. The platform refuses it and lets the
  person request another — which replaces
  the previous code when the new message is accepted and otherwise leaves it
  valid, restarts the pending request's own expiry at that accepted dispatch so
  the new code carries a full period, and does not reset the bound on incorrect
  entries,
  because that bound is counted over the whole verification — without revealing
  whether the number has an account. Only a wrong value entered for the live code
  increments the bound: an expired code, and a code a replacement has superseded,
  are refused as expired or superseded and do not increment it, so a stale code
  cannot lock the person out. When the bound on incorrect entries is
  reached the pending request ends, the page returns to the flow's first step
  with an explicit, retryable notice that the request ended, and the person
  starts a fresh request — a sign-up or a recovery — which begins a new
  verification with the count at zero (AC-036, FR-034).
- A person keeps guessing one-time codes for one number across both flows,
  starting a fresh request each time the previous one ends. The guesses are
  bounded in aggregate, not only per request: the number's budgets allow a fixed
  number of fresh requests in one window and each request allows the bounded
  number of incorrect entries, so the ceiling is their product, and the fresh
  request that would exceed it is refused by the number's budget with the
  distinct limit refusal — no separate ceiling refusal, message, or state
  exists. The ceiling follows the window those budgets use, so it resets at that
  window's boundary with them, and requesting a new code does not reset the
  count of incorrect entries (AC-036, FR-033, FR-034).
- One number is the target of one-time codes from both flows at once — a caller
  starts sign-ups and recoveries for it and re-requests each code to its limit.
  The messages the platform dispatches to that number are bounded in aggregate:
  six fresh requests in one window (three account creation and three recovery),
  four accepted dispatches each (the first and three re-requests), so
  twenty-four one-time-code messages at most, and the twenty-fifth cannot arise
  because the seventh fresh request is refused by the number's budget and the
  fifth dispatch by the re-request limit. A dispatch the channel refuses at
  acceptance sends nothing and does not count, and the security notices are
  outside the ceiling because they follow an authenticated action on the account
  (AC-036, FR-034, FR-033).
- The messaging channel refuses a one-time code at acceptance — the channel
  fails, or the number is one the channel will not accept because it cannot
  deliver to it. The person sees an explicit failure and can
  retry, the pending request — a sign-up or a password reset — stays valid until
  it expires, and the failed send does not consume the limit on requesting a new
  code (AC-036). The failure is shown on the submission that asked for the code
  and the code step is never reached, because the send is attempted inside that
  request and the step opens only once the channel has accepted the message
  (AC-036). The failure is outside the enumeration comparison SC-004 bounds at
  both placements, because it states the channel's response rather than anything
  about the number's account and is produced identically whether or not the
  number has an account, so it is not read as a leak (AC-036, SC-004).
- The messaging channel neither accepts nor refuses a one-time code within the
  platform's request timeout. The attempt is treated as refused at acceptance:
  the person sees the same explicit, retryable failure on the submission, the
  code step is not reached, the pending request stays live, a code already
  delivered stays valid, and the failed send consumes no part of the limit on
  requesting a new code (AC-036).
- The messaging channel accepts a one-time code but the message never reaches the
  number. The platform has no delivery signal, so it shows no failure state and
  the code step remains until the request's own lifetime ends, when the page
  returns to the first step with the expiry notice; the code expires on its own,
  and the person can request a new code
  subject to the limit on requesting a new code, because a later
  delivery failure is outside the platform's observation (AC-036).
- The messaging channel accepts a security notice FR-043 requires — the notice of
  a password change or of a sign-out of every device — but the message never
  reaches the number. The platform has no delivery signal and sends no second
  copy: the change or the ending of the sessions stands, the notice is neither
  retried nor reported, and the action is not turned into a failure, exactly as a
  one-time code's post-acceptance delivery failure is treated (AC-047, FR-043).
- A one-time code is entered correctly but the account cannot be created at that
  moment — a transient failure. The pending request stays valid until its own
  expiry and the same code remains usable, because a code is consumed only once
  the account is created; the person sees an explicit, retryable failure, and
  the failure counts neither as an incorrect entry nor against the limit on
  requesting a new code (AC-036).
- A visitor abandons sign-up after the code is requested and never returns. The
  pending request ends at the end of its own lifetime, and no `User` row and no
  session exist for the number, because neither comes into existence before the
  correct code is entered (AC-004, FR-034).
- A failure occurs while a person is using one of the three bare pages this
  slice ships, and it is not one the specification names — a session that cannot
  be created after a correct password or a correct code, or any other unexpected
  failure. The page shows an inline, explicit, retryable failure message, the
  person stays on the page, no navigation happens, and no error page is shipped
  or reached (AC-043).
- The service cannot complete a request one of the three bare pages makes because
  the store its data lives in is unreachable, or because the service fails before
  the request can be answered. The page shows the same inline, explicit,
  retryable failure every other unnamed failure produces, with no separate
  "service unavailable" state, no navigation, and no error page; the message names
  no wait, so the person may submit again at once, and the request is refused by a
  limit only when a limit is what refused it (AC-043, FR-040).
- A submission on one of the three bare pages is refused — by a value rule, by
  the password policy where the page is setting a password (the sign-up form and
  the recovery flow's new-password step), by the minimum time-to-submit, or by a
  failure the
  specification does not name. The page stays on the step that was submitted,
  the refusal appears inline, every field keeps what the person typed except the
  password fields, which are cleared and never re-displayed, and the one-time-code
  field, which is cleared after a refused entry; the sign-up form keeps the full
  name, mobile number, city, and shop name, and the sign-in and recovery forms
  keep the mobile number (AC-043, FR-040). The silent hidden-field refusal is not
  this case: it returns the response of a successful submission and stops the
  flow there (AC-031, FR-029).
- A person reloads the sign-up or password-recovery page, or closes it and comes
  back, while a one-time code is still waiting for them. While the pending
  request is still live and its code has not yet been verified the page shows the
  code step again, so the code already sent stays usable and no new code is
  requested; once the code has been verified in password recovery, the same
  reload shows the new-password step while the verified state lives; once the
  pending request has ended or expired, the page returns to the form's first step
  and a fresh submission begins a new verification on FR-034's terms (AC-041,
  AC-036). When more than one pending request is live from the same browser - one
  per mobile number, as when the person returns to the first step and submits
  another number - the page resumes the request it is tied to, which is the one
  most recently submitted from that browser; returning to the first step ends
  that tie while leaving the request live, so a reload at the first step shows
  the first step rather than a code step (AC-041, FR-038, FR-034).
- The pending request reaches the end of its own lifetime while the person is
  still on the code step: the code step ends at that moment, the page returns to
  the flow's first step with an explicit, retryable notice that the request
  expired and that a new code must be requested, with no navigation, no new
  route, and no new page, and a code submitted after that moment is refused as
  expired, sets nothing, and does not increment the bound on incorrect entries
  (AC-036, FR-034, FR-038).
- The password-recovery flow's verified state reaches the end of its lifetime
  while the person is still on the new-password step: the state ends at that
  moment, the page returns to the flow's first step with an explicit, retryable
  notice that the request expired and that a new code must be requested, and a
  new password submitted after it has ended is refused on the same ground and
  sets no password (AC-036, FR-014).
- A sign-up enters the correct one-time code, but the session that makes the
  new account usable cannot be created. The account's creation and its session
  are one indivisible step, so the failure leaves no account, ends no pending
  request, and keeps the correct code usable; the person sees the inline,
  retryable failure FR-040 requires and retries the same code, and no account is
  left behind without the session that makes it usable (AC-036, AC-043).
- A person at the sign-up code step wants to use a different mobile number. The
  full name, the mobile number, the city, and the optional shop name are shown
  at that step for reading and are not editable there; the step carries a
  control that returns to the page's first step, where those values are editable
  again and retained except the password, which the page never retains or shows, so
  the person changes the number and submits the form again; the fresh
  submission starts a new pending request for the new number on FR-034's terms,
  while the pending request for the first number stays live until its own
  expiry, because only one pending request is live per number (AC-041,
  AC-036).
- A person reaches the sign-up code step. The password they submitted is not
  shown back to them in any form — neither re-displayed, nor echoed, nor
  rendered masked — so the step carries the full name, the mobile number, the
  city, and the optional shop name for reading, and the password never returns
  to the browser (AC-041). In the password-recovery flow, the code step carries
  the mobile number alone, because that is the only field the recovery form
  collected; no account field is shown there before the code is verified
  (AC-041, FR-015).
- A person enters the correct one-time code at sign-up for a number that already
  has an account. The platform states that no second account was created and
  directs the person according to the existing account's status and role, with
  no generic direction in the blocked and the administrator cases: for an active
  merchant account, a message names sign-in and password recovery and offers the
  link to the sign-in page and the link to the password-recovery page, with no
  redirect; for a blocked account, the message states that the account is
  blocked and that sign-in stays refused until an administrator returns it to
  active; and for an administrator account, the message states that the
  credential is managed on the administrator surface and that the merchant
  sign-in and recovery paths do not apply to it. The pending request ends at
  that point: its code stops being valid at once, so no live request and no
  usable code survive an outcome the platform has already reported, and the same
  rule governs the password-recovery flow's counterpart (AC-006, AC-036, FR-027).
- A person enters the correct code in password recovery and reloads the page,
  or closes it and comes back, before setting a new password. The new-password
  step is shown again while the verified state lives, no new code is requested,
  and the code already used is not offered again; if a new request for the same
  number is accepted in place of the pending request, the verified state ends and
  the new code step is the only live step; a request the channel refuses at
  acceptance leaves the verified state in place; once the password is set, a
  reload returns the page to its first step (AC-036, AC-041, FR-014).
- A person who has just set a new password tries to use the same one-time code
  again. The pending request has ended, so the code is refused and a fresh
  request is needed (AC-036, FR-034).
- A merchant changes the password from inside the account while a
  password-recovery request for their number is live, or while its verified
  new-password step is live. The change ends the recovery request and its
  verified state at once, so the code already delivered and the new-password
  step can no longer set a password, and the person starts a fresh recovery;
  the change's own session endings and security notice are unaffected. A
  successful sign-in alone ends nothing, because it does not change the
  credential (AC-016, FR-013, FR-014, FR-034). If the change and the reset
  arrive together, exactly one sets the final password: the write that takes
  effect first withdraws the other's authority in the same step, the losing
  submission is refused and writes nothing, and no session that existed at the
  winning write survives it (AC-014, AC-016, FR-013, FR-014).
- A +218 number that is not a mobile number (for example a landline) is
  submitted. It is refused, because the account identifier is a Libyan *mobile*
  number (AC-003).
- The operator runs the provisioning action for the administrator account: the
  account is created directly, with the status active and the administrator
  role, with no one-time code and no verification step,
  and the mobile-number verification rule is not applied to it (AC-030).
- The administrator's forced first change is submitted without the current
  password, or with a wrong one. It is refused, clears nothing, and leaves the
  account restricted; a correct current password with a new value clears the
  requirement and lifts the restriction (AC-030, FR-028).
- A merchant is blocked while signed in on more than one device: every session
  they hold stops granting access (AC-021).
- A merchant is blocked while a request of theirs is already in flight: the
  request that had already passed the single shared entry point when the block
  was recorded is decided on the state it met and completes, while every request
  the session issues afterwards — one issued from a page that was already open
  included — is refused, and the page shows the blocked variant of the
  ended-session state FR-049 defines; the session carries the block's ending from
  that request on, so no later request is granted access (AC-021, FR-019,
  FR-049).
- An account is removed while some of its sessions are still signed in, or while
  a pending request for its mobile number is live. Every session it holds stops
  granting access and is withdrawn, the pending request ends and its code stops
  being valid, and no stored credential of the account permits a sign-in, so no
  session, no code, and no credential outlives the account; whether the number
  may open a new account stays with R13, and the row's removal for good stays
  with the administrator operation or the retention job (AC-020, FR-018).
- A merchant asks to reset the password of a blocked account and enters the
  correct code: the reset completes — a new password is set and every existing
  session ends — but the account stays blocked, so no access is granted; the
  request's response stayed uniform, and the outcome is stated only after
  ownership of the number is proven, and the confirmation states plainly that
  the account is blocked, so it does not promise a sign-in that cannot succeed
  (AC-016, AC-038, AC-019).
- A person asks to reset the password of a mobile number whose account holds the
  administrator role and enters the delivered code correctly: ownership of the
  number is proven, no password is set, no session is created, and the platform
  states explicitly that the credential cannot be reset on this surface; the
  code step is replaced in place by that message, with no navigation and no
  retry control, and a reload or a fresh opening returns the page to its first
  step, because the pending request has ended; the
  request, the following step, and the code dispatch were already
  indistinguishable from those for a number with no account (AC-016).
- The account of the mobile number is both blocked and holds the administrator
  role, and the correct code is entered in password recovery: the role decides
  the outcome — no password is set, no session is created, and the platform
  states that the credential cannot be reset on this surface, without mentioning
  the block, because the credential path is closed on the role ground before the
  status could matter — and the request, the following step, and the dispatch
  stayed indistinguishable; the code step is replaced in place by that message
  on the same terms as the administrator case above (AC-016, FR-014, FR-027).
- An account is locked and the merchant submits the correct password before the
  fifteen minutes elapse: the attempt is refused exactly like any other failed
  sign-in, and nothing distinguishes that refusal from a wrong password or from
  an unknown number; the page shows the one uniform failure message and no
  lock-specific copy — no alert, banner, or field message names the lock
  (AC-010, AC-009).
- An account is locked and the merchant resets the password through the recovery
  flow before the fifteen minutes elapse: the reset succeeds, but the lock keeps
  running its full fifteen minutes and the count of consecutive failed password
  verifications is not reset, so the merchant signs in with the new password once the lock
  lifts (AC-010).
- The city field finds no match for what the person typed; they can still only
  choose a value from the fixed list (AC-005).
- Two real places — a governorate and a city, or a city and an area — share the
  same name. The list carries two entries whose Arabic names differ by the
  qualifying governorate or level, so the person can tell them apart and the
  chosen name is stored as it appears in the list (AC-005).
- A guest opens a page that carries the frame: the header shows a sign-in action
  in place of the account control and the notifications control, with no
  account menu, while the theme switch remains available in the header and the
  sidebar collapse control remains available in the sidebar, so a guest can
  still change the appearance, open the sidebar from the bottom bar's «المزيد»
  slot, and close it from the collapse control (AC-025, AC-042).
- A keyboard user activates «المزيد» or the account control: the focus moves into
  the opened surface — the drawer's first focusable control, or the menu's first
  item — the drawer keeps it until it closes, the menu closes when focus leaves
  it, and the focus returns to the control that opened the surface when it
  closes (AC-024, AC-051). When the person activates a navigation item inside
  the drawer instead of dismissing it, the drawer closes, the destination page
  is shown, and the focus settles on that page's heading rather than on
  «المزيد», while the bottom bar stays visible under the open drawer (AC-024).
- A person has the drawer or the account menu open and activates a control the
  open surface covers — a bottom-bar slot, «المزيد», or the account control: the
  activation closes the open surface and performs nothing else, so the person
  activates the control again to open what it names, and the two overlaying
  surfaces are never open at once (AC-024, AC-051).
- A page carrying the frame cannot scroll, or scrolls 56px or less: the bar stays
  visible and never hides, because the return rule holds at every offset such a
  page reaches, so a short page has no hidden-bar state at all (AC-042).
- A person scrolls a page carrying the frame far enough for the bar to hide: the
  raised search action goes with it — out of the focus order and the
  accessibility tree, so no keyboard user lands on an invisible control — and
  both return together on the first 16px of upward scroll or within 56px of the
  top. No floating control stands in while they are away: below 1024px the
  drawer's opener «المزيد» is itself in the bar, so no drawer is open while the
  bar is hidden, and at 1024px and up the bar is absent and the sidebar's
  «بحث وفر» item is the way to search (AC-042).
- A guest presses a sidebar item that needs an account, such as Cart or Profile,
  or the bottom bar's Upload Catalog or My Files slot: the
  sign-in page is shown, and the item or slot itself stays present and enabled
  because neither the list nor the bar is varied by role (AC-052, AC-042).
- A merchant's session ends, or their account is blocked, while they are on a
  page that carries the frame: an explicit state inside the frame states that
  the session has ended and offers the way to sign in again, and says plainly
  that the account is blocked when that is the reason, while the blocked variant
  offers no way to sign in — the block refuses every sign-in, so a control that
  cannot succeed is withheld and the state never offers what the block refuses;
  the state is announced to assistive technology when it appears, and the focus
  moves to its heading rather than staying on a control the page carried before
  the refusal; in the blocked variant the header carries the logo/home control
  and the theme switch alone, with the sign-in action and the account control
  withheld (AC-053).
- A signed-in merchant opens the account menu and chooses «تسجيل الخروج»: a
  yes-or-no confirmation appears; cancelling it leaves the session untouched,
  and confirming it ends the session (AC-051).
- A signed-in merchant opens the account menu and dismisses it without choosing
  an item: the menu closes and nothing changes (AC-051).
- A person who has signed in moves between pages: the appearance they chose
  (dark or light) holds, and is applied before the page is painted so it does not
  flash the other appearance (AC-027).
- A signed-in person opens one of the three bare pages this slice ships. The
  page renders exactly as it does for a guest, with no redirect and no
  signed-in-specific surface; no sign-out control is offered there, because
  the sign-out control belongs to the frame — its only control is the
  account menu's third item, and the page carries no menu because it carries no
  frame (AC-044, AC-051).
- A screen narrower than the smallest supported width of 320 CSS px is outside
  the supported scope: the specification asserts how the platform renders at
  the supported widths — 320 CSS px and up — and asserts nothing about a
  viewport narrower than that floor; at 320 CSS px the
  header keeps all four of its controls in one row for a signed-in merchant,
  none dropped, folded into an overflow menu, or moved into the account menu,
  and the three controls a guest's header carries under the same rule, with the
  wordmark at its
  smallest recorded form (AC-024, AC-025, SC-006).
- One of the three bare pages this slice ships is opened: it carries no footer
  and no bottom bar, because both are part of the frame and the frame is absent
  from those pages, so the way to the four static pages is not offered there
  (AC-026, AC-023, FR-021).
- An administrator's mobile number and password are submitted on the merchant
  sign-in surface: the attempt is refused with the same uniform refusal any
  failed sign-in receives, and nothing distinguishes it from a wrong password or
  from an unknown number (AC-029).
- The operator runs the provisioning action for a mobile number that already has
  an account: uniqueness is enforced exactly as for any account, so no second
  account is created for that number and the conflict is reported to the
  operator, who is running the action out of band (AC-030).
- The operator's provisioning action cannot set the initial password it was given
  for the account it is creating: the account and that usable password are one
  indivisible step, so no account is created, no account row survives without a
  usable password, and the run reports the failure to the operator — exactly as
  a field rule the action refuses does (AC-030, FR-028).
- The provisioning action is started with the initial password in a place it MUST
  NOT accept it from — as a value on the command line that starts it, in an
  environment variable, or in a stored configuration file — or a run succeeds
  and its output is examined: a run given the credential in any of those places
  refuses it and creates no account, and a successful run's output — its report,
  its errors, its logs, and its security record — carries the account and the
  outcome but never the credential (AC-030, FR-028).
- A person types a mobile number on the sign-in or password-recovery page: the
  page offers no dial-code selector and the country is fixed to Libya (+218), as
  at sign-up (AC-002).
- A person submits, on the sign-in or password-recovery page, a value that is
  not a valid Libyan mobile number on +218 at all. It is refused with a distinct,
  explicit format refusal, which is not the uniform refusal a failed sign-in
  receives and is excluded from SC-004's enumeration comparison, because such a
  value can never have an account (AC-045). The value has no normalized form,
  so only the network-origin key bounds it: it consumes no number's budget, and
  unless that origin's budget is already spent it receives the format refusal
  rather than the limit refusal, because the limit is decided first (AC-035,
  FR-033, FR-051).
- The sign-up form is submitted with the hidden field filled, or before the
  minimum time has passed since the platform served it, or with a value that is
  not the one the platform issued — absent, altered, issued for another surface,
  or outside its validity window. In the first case — unless the
  account-creation rate limit refuses the submission first, in which case the
  distinct limit refusal is what the sender receives and the hidden field is
  never the refusing step (AC-033, AC-055, FR-051) — the platform
  returns the same response a successful submission receives, so nothing in the
  response tells the sender it was detected — its text and status the same, and
  its duration not observably faster than the success path's, within the bound
  FR-029 states — and it does nothing further — no
  pending request is started, no one-time code is dispatched, and the code step
  is not reached, so the form cannot be used to send SMS to numbers the
  submitter does not control; in the second and third it returns an explicit,
  retryable refusal. No account is created in any case (AC-031, AC-032).
- A person is refused by a rate limit — on the sign-up form or on one of the
  three authentication operations. The refusal is distinct and explicit, states
  that the limit was exceeded and that they may retry later, and is not the
  uniform refusal a failed sign-in receives, on the rate-limit exception SC-004
  states (AC-033, AC-035). The budget belongs to the request that starts the
  operation: a person who has spent it is refused the operation's next
  initiating request, while a code entry or a new-password submission on the
  same page neither consumes it nor is refused by it, because those steps are
  bounded by the code's own limits (AC-035, AC-036).
- A merchant changes their password, or ends every session of the account at
  once, and the notice cannot be sent — the messaging channel fails. The change
  and the ending of the sessions stand, the failure is recorded as the dispatch
  failure FR-037 names, and no action the person asked for is undone (AC-047).
  A password change that ends every session of the account sends one notice for
  the change, not a second one for the sessions it ended (AC-047, FR-043).
- Several people share one network address — as a mobile carrier's address is
  shared — and one of them exhausts the address's budget for an authentication
  operation. The refusal is the same distinct, explicit limit refusal, and the
  per-number key is spent only by submissions for that number, so requests for
  another number do not consume it (AC-035). The number's key is
  global to the number: once a number's budget is spent — whatever origin spent
  it — a request for that number from any origin is refused on the same terms,
  and every other number stays unaffected (AC-035).
- A person requests a new one-time code for a live pending request beyond the
  limit on requesting new codes. The request is refused with a distinct,
  explicit refusal stating that the limit was exceeded and that they may retry
  later; the refusal reveals nothing about whether the number has an account,
  because the pending request exists for a number with no account exactly as it
  does for one, so it is excluded from SC-004's enumeration comparison, and the
  code already delivered stays valid while the operation's own rate-limit budget
  is untouched. A fresh request started for the same number begins a new
  verification with a full allowance, because the spent allowance is not carried
  across requests (AC-036, SC-004).
- A signed-in merchant whose account is locked — five consecutive failed
  current-password checks inside the account's own change-password action —
  submits the change with the correct current password before the fifteen
  minutes elapse. The check is refused for the lock's full duration: the change
  is not made, the refusal is not counted as a further failed attempt, the lock
  is not extended, and the session the change was attempted from remains
  available to end. Once the lock lifts, the merchant can make the change; the
  successful check then clears the count to zero, and the merchant signs in with
  the new password (AC-010).
- A person completes an action on one of the three bare pages — verifies the
  code at sign-up, signs in, or sets a new password in recovery — and the page
  renders its confirmation in place. Reloading the page, or closing it and
  returning, shows the page's first step again with no confirmation and no
  redirect: the confirmation was the outcome of the action rather than a state
  the page carries, so the page still renders for that person exactly as it does
  for a guest (AC-044, AC-041).
- A merchant-scoped read is asked for a row that belongs to another account, and
  the row exists. The platform answers exactly as it does for a reference that
  matches no row — the same status, the same body, and no header that differs —
  so the answer tells the caller nothing about whether the row exists, and the
  scope cannot be used to learn another merchant's identifiers (AC-056,
  FR-053).
- The service restarts, or a release applies a migration, while people are using
  it. No session ends, no lock lifts, no pending request is replaced, no code is
  invalidated, and no rate-limit window is reset; a person whose request was in
  flight repeats it and reaches the outcome FR-040 states for a repeat, with no
  second account, session, dispatch, write, revocation, or notice; and a request
  that arrives while no instance serves the release is outside FR-040 and
  belongs to R12's deployment procedure (AC-059, AC-060, FR-054).
- The stored data is restored to a point within the recovery point, or a release
  is rolled back to the previous schema version. The state is as it stood at the
  restored moment: a session created after the point ends and its holder signs in
  again, a lock applied after it is gone, a pending request started after it ends
  while one replaced or ended after it is live again, and a window spent after it
  is unspent — and a row removed for good after the point comes back with its
  account registered again, while a block applied after the point is undone and
  can be re-applied by an administrator. The window is bounded by the fifteen
  minutes the recovery point fixes, no continuity is promised across it, and no
  reconciliation is attempted (AC-061, AC-062, FR-055).

## Requirements *(mandatory)*

### Functional Requirements

**Reading the list.** The requirements below are grouped by the subject they
govern, not by identifier. A requirement added after the list was first written
keeps the identifier it was given and is placed where the list can carry it
without splitting another requirement's block: FR-052 is the standing example,
and it follows FR-051 although its subject is the frame. The identifier is what
a task, a criterion, or a reviewer cites, and it is stable for the life of the
feature: an identifier is never renumbered, never reused, and never withdrawn —
an item is withdrawn by keeping its identifier and marking it withdrawn,
and never by removing the identifier from the list, and a requirement that
a later session revises keeps its identifier. The
Acceptance Criteria section groups every criterion under the user story it
serves, and each criterion names the requirements it asserts (decided
2026-10-21, Clarifications; revised 2026-10-27, Clarifications).

**Creating an account**

- **FR-001**: System MUST let a person create a merchant account by providing a
  full name, a Libyan mobile number, a password, a city chosen from the fixed
  Libyan city list, and an optional shop name. The full name MUST be present and
  MUST NOT be empty or made of spaces alone, and both the full name and the
  optional shop name MUST be bounded by a maximum length; within those bounds a
  value MUST be accepted as typed — letters and numerals alike — with no
  alphabetic-shape rule imposed, so the rule is testable here and reusable by the
  profile slice. The language and numeral rules FR-026 states govern the
  platform's own text and MUST NOT reach this value: a supplied value is shown
  as it was typed, in its own script and digits, never transliterated or
  re-numeralised (decided 2026-10-31, Clarifications). The no-emoji rule does
  reach it, because no emoji may appear in any text a person reads inside the
  platform: a value carrying an emoji MUST be refused with an explicit message
  naming the reason, never stripped or rewritten, and that refusal is a rule on
  the value's characters rather than an alphabetic-shape rule — the emoji being
  the one the predicate FR-026 fixes, the Unicode property
  `Extended_Pictographic`, or the variation selector U+FE0F, or the keycap
  encloser U+20E3, so the refusal is testable without judgement (FR-026;
  decided 2026-10-31, Clarifications; predicate pinned 2026-11-01,
  Clarifications). The refusal MUST name its cause distinctly — an empty value,
  a value over the maximum, and a value carrying an emoji are three causes, not
  one — so the shared message table carries one text per cause and the page
  selects the text by the cause it received rather than inventing one (decided
  2026-11-02, Clarifications). The maximum lengths
  are stated numerically under Constitution
  Mandated Values (decided 2026-10-11, Clarifications). The form MUST ask for no
  acceptance of the platform's terms or of its privacy policy: the Product
  Register fixes the fields sign-up collects, so no consent control is added and
  the account records no acceptance, and the two pages stay reachable from the
  frame's footer at the routes FR-024 fixes (decided 2026-10-11, Clarifications).
  The shop name carries no uniqueness rule: it is a label within its bound and
  two accounts MAY hold the same value, because the register names no uniqueness
  invariant for it (decided 2026-10-11, Clarifications).
- **FR-002**: Every page this slice ships that takes a mobile number — the
  sign-up, sign-in, and password-recovery pages — MUST offer no dial-code
  selector; the country is fixed to Libya (+218) and no other country or dial
  code is presented (decided 2026-10-11, Clarifications).
- **FR-003**: System MUST reject a number that is not a Libyan mobile number on
  +218, and MUST create no account for it. The set of valid Libyan mobile
  prefixes is fixed here, once, as one reference dataset for accounts and named
  in a decision record alongside the city list; the platform
  MUST decide whether a +218 number is a mobile number against that dataset
  rather than against a rule of its own, and a later slice reads the dataset
  instead of writing one. The refusal for such a value on the sign-up form is
  the same distinct, explicit format refusal FR-042 names, and it is excluded
  from SC-004's enumeration comparison for the same reason, because a value
  that is not a valid Libyan mobile number can never have an account (decided
  2026-10-21, Clarifications).
- **FR-004**: System MUST confirm the mobile number at sign-up by sending a
  one-time code by SMS to that number; the account MUST become usable only after
  the correct code is entered. Until the correct code is entered, no `User` row
  MUST exist for the submitted number: the account MUST NOT be created ahead of
  verification in a partial or not-yet-usable state, so the pending request is
  the only state that exists before verification and an incorrect code leaves it
  unchanged (decided 2026-11-02, Clarifications). When the sign-up creates the
  account, entering the correct code MUST sign the
  merchant in — the account becomes usable in place, with no separate sign-in
  step; when the number already has an account, FR-006's outcome applies and no
  session is created. When the sign-up creates the account, it and the session
  that makes it usable come into existence
  together, so entering the correct code MUST NOT leave an account behind
  without the session that makes it usable (FR-034; decided 2026-10-28,
  Clarifications). That pair MUST come into existence in one indivisible step: a
  failure between the account's creation and the session's creation MUST leave
  neither, MUST end no pending request, and MUST keep the correct code usable, so
  the person retries the same code and no partial account ever exists (decided
  2026-11-04, Clarifications). When the sign-up creates the account, the confirmation that
  follows MUST be rendered in place on the sign-up
  page — the code step is replaced by a confirmation that the account is ready
  and that the merchant is signed in — with no navigation, no new route, and no
  new page, because this slice ships no destination page (decided 2026-10-11,
  Clarifications).
- **FR-005**: System MUST present the city as a searchable choice from one fixed
  list covering every Libyan governorate, city, and area, and MUST accept only a
  value drawn from that list. The list is a single list whose entries are the
  governorates, the cities, and the areas themselves; each entry MUST carry one
  Arabic name and no Latin alternate name, and the search MUST match those
  Arabic names while ignoring diacritics, so a person who types a city without
  its diacritics still finds it and no second naming source has to be kept in
  step with the list (decided 2026-10-22, Clarifications). Each entry's Arabic
  name MUST be unique across the list: where a real place name recurs across a
  governorate, a city, and an area, the entry's one Arabic name MUST carry the
  distinguishing qualifier — the governorate or the level — so no two entries
  share a name, and the field MUST store the chosen entry's Arabic name as it
  appears in the list (decided 2026-10-28, Clarifications).
- **FR-006**: System MUST NOT reveal, in any sign-up response, whether the
  submitted mobile number already has an account. The sign-up flow MUST pass
  through the code step in the same way, and MUST send the code to the number,
  whether or not an account exists, so that the form's response, the following
  step, and the sending of the code are indistinguishable; the rule is bounded to
  those steps, because entering the correct code proves ownership of the number
  and the outcome past that point differs legitimately. When the correct code is
  entered for a number that already has an account, the platform MUST create no
  second account and MUST NOT apply the submitted password, and MUST direct the
  person according to the existing account's status and role. For an existing
  account that is active and holds the merchant role, the direction is a message
  that names sign-in and password recovery and offers the link
  to the sign-in page and the link to the password-recovery page, with no
  redirect introduced, because the three bare pages render identically for a
  signed-in person and for a guest (decided 2026-10-11, Clarifications). When the
  existing account is blocked, the message MUST state, after ownership is
  proven, that the account is blocked and that sign-in stays refused until an
  administrator returns it to active; when it holds the administrator role, the
  message MUST state that the credential is managed on the administrator surface
  and that the merchant sign-in and recovery paths do not apply to it. Whichever
  of the three messages the outcome produces replaces the code step in place and
  stays there until a reload or a fresh opening, because the pending request ends
  once the outcome is stated and a code step left behind would invite an entry
  that cannot be accepted (FR-038; decided 2026-11-01, Clarifications). Neither
  statement is made before the correct code is entered, because the uniformity
  this requirement states still binds the response, the following step, and the
  sending of the code (decided 2026-10-28, Clarifications). The indistinguishability MUST
  also cover how long each of those steps takes: the form's response, the
  following step, and the sending of the code MUST do the same work whether or
  not the number has an account, so no step's duration signals it (decided
  2026-10-11, Clarifications). When the correct code is entered for a number that
  already has an account, the pending request MUST end once the outcome is
  stated, and its code MUST stop being valid at once, so no live request and no
  usable code survive an outcome the platform has already reported — the same
  rule FR-014 states for the recovery flow (decided 2026-10-22, Clarifications).
- **FR-031**: System MUST treat the mobile number as the account's unique
  identifier, comparing it in a normalized form so that two spellings of the same
  number are one account. The normalized form MUST also be reached from digits
  typed as Arabic-Indic numerals (for example `٠٩١…`): the field is tolerant on
  input and reads them as the same digits, so such a number is neither refused as
  invalid nor allowed to become a second account for the same person; the rule
  governs what is typed, never what is rendered, so FR-026's Latin-numeral rule
  stands unchanged (decided 2026-10-11, Clarifications). The same tolerance
  governs the one-time-code field: a code typed as Arabic-Indic numerals is read
  as the same digits and verifies identically, while every numeral the platform
  renders stays Latin (decided 2026-10-11, Clarifications). The normalized form
  MUST also be reached from every spelling that resolves unambiguously to a
  +218 mobile number: separators and spaces are ignored, a leading national zero
  is read as part of the national number, and a country code typed as part of
  the value is read once rather than doubled, whether it is written with the
  plus sign or as the international prefix, so such a value is the same account
  rather than a second one or a refusal. A value that does not resolve to a
  +218 mobile number is refused with the format refusal FR-042 names. The form
  still presents no dial-code selector (FR-002): it reads a code if one is
  typed and never offers one (decided 2026-10-29, Clarifications). Uniqueness MUST be
  enforced at the moment the account is created rather than by a check made
  before it, so that two attempts arriving together for one number still produce
  at most one account and the attempt that does not create it receives the
  status- and role-specific outcome FR-006 requires (decided 2026-10-11,
  Clarifications).
- **FR-035**: System MUST enforce a password policy whenever a password is set —
  at sign-up, on password change, and when the operator's provisioning action
  sets an administrator's initial password — requiring a minimum length,
  refusing a password longer than a maximum length, and rejecting common or
  breached passwords; the exact numeric values — the minimum and the maximum —
  are recorded separately (decided 2026-11-01,
  Clarifications). In the sign-up flow the policy MUST be applied
  when the form is submitted, before any one-time code is sent, and the refusal
  MUST be the same whether or not the number already has an account, so it adds
  no signal to FR-006's uniformity (decided 2026-10-11, Clarifications). The
  form that takes a new password MUST state the policy's requirements before the
  password is typed — the sign-up form and the new-password step of the
  password-recovery flow here, and the settings form a later slice adds — so
  that a person can meet the policy without trial and
  error, and each reason the policy refuses a password MUST carry its own
  message — a password shorter than the minimum, a password longer than the
  maximum, and a password that is common or breached — so that the person knows
  what to correct. The policy never reaches a password a person signs in with:
  the sign-in form sets no password, so it states no requirement of the policy,
  refuses a submitted value on no policy ground, and shows no policy message,
  and its refusals are the ones FR-008, FR-042, and FR-051 name, so a value that
  fails the policy is a wrong password there and receives the uniform refusal
  exactly as any other wrong value does (decided 2026-11-01, Clarifications).
  None of these messages
  reveals whether an account exists: the policy is applied to every new password
  submitted to one of those forms, and the same message is given for the same
  reason whether
  or not the number has an account (decided 2026-10-22, Clarifications; revised
  2026-11-01, Clarifications). The
  literal Arabic text of each of those messages is not a specification value: it
  is the fixed design value FR-026 records once for the slice,
  presented in Arabic with Latin numerals and no emoji; no
  acceptance criterion restates the string — AC-028 asserts that the rendered
  text is the text recorded for its cause, and AC-037 asserts that
  the same reason receives the same message (decided 2026-10-27, Clarifications;
  authority and identity recorded 2026-11-04, Clarifications).
  The
  common-or-breached check MUST be performed against a source the platform
  itself holds: this slice introduces no external service for it, so the check
  is always available, a sign-up or a password change MUST NOT fail for want of
  it, and no password material leaves the platform; the source and the way it is
  kept current are recorded (decided 2026-10-11, Clarifications).
  The policy sets no rule that a new password differ from the one it replaces: a
  password MAY be set to the value it already has, and no password history is
  kept, because the register provides no entity for one and this slice
  introduces no third entity (decided 2026-10-11, Clarifications; revised
  2026-10-22, Clarifications). That allowance is bounded by FR-028's forced
  first change: the administrator's first change MUST set a value different
  from the initial password the operator supplied, because a change that
  repeats it would leave the forced-password-change requirement unsatisfied,
  and the allowance therefore governs every later change alone (decided
  2026-10-22, Clarifications).
- **FR-040**: While a request is in flight — the sign-up form's submission, the
  sign-in form's submission, the password-recovery request's submission, the
  entry of a one-time code at sign-up or in password recovery, the request for a
  new one-time code from the code step, and the
  submission of the new password in password recovery — the page
  MUST show an in-progress state and MUST disable the submit control, so that a
  repeated submission cannot start a second dispatch or produce a second
  account. The guard governs every authentication form this slice ships, so a
  repeated submission of the sign-in form or of the password-recovery request is
  prevented exactly as one of the sign-up form, and no second request is started
  (decided 2026-10-11, Clarifications). It governs the new-password step of the
  password-recovery flow as well, so a repeated submission there neither sets
  the password twice nor ends the account's sessions twice, and it is the same
  guard on every submission these three pages make (decided 2026-10-22,
  Clarifications). It governs the code step's re-request control as well, so a
  repeated activation of it starts no second dispatch and spends one of the
  allowed re-requests (decided 2026-10-28, Clarifications). The account's own
  change-password action has no page in
  this slice, so the guard does not act there (decided 2026-10-22,
  Clarifications; revised 2026-10-29, Clarifications). The guard is presentation only: the
  server-side rules remain the authority, so a duplicate that still reaches the
  platform is decided by them rather than by the guard. A repeated request whose
  first response was lost MUST reach a stated outcome and MUST NOT produce a
  second effect: a sign-up or recovery submission that the page is still tied
  to, while the pending request it started is live, re-renders the code step and
  dispatches no second code, the code already sent stays valid, and no part of
  the re-request limit is spent, while a submission made after the page returns
  to its first step is a fresh request that replaces the pending request on
  FR-034's terms; a repeat of a code entry whose first attempt reached its
  outcome, recognized as the same completed step repeated rather than a new
  verification, re-renders that outcome — the confirmation FR-004 requires or
  the terminal message FR-006 requires — creates no second account and no second
  session, and does not consume the code again; a repeat of the
  new-password submission whose first attempt set the password, recognized as the
  same completed step repeated, re-renders the
  confirmation FR-014 requires, sets no password again, ends no session again,
  and sends no second notice; and a repeat of the account's own change-password
  action or of the sign-out of every device arrives after the first request ended
  every session, including the one it was issued from, so it is refused as an
  ended session and writes nothing, revokes nothing, and sends no second notice
  (decided 2026-11-04, Clarifications). A repeat recognized this way is not a new
  request for FR-034's replacement rule, so it neither replaces the pending
  request nor spends the re-request limit. A duplicate that still reaches the
  platform is otherwise handled exactly as the concurrent-attempt case (decided
  2026-10-11, Clarifications). The same rule governs failure: whenever a failure occurs while
  one of these three pages is being used — including a failure this
  specification does not name, such as a session that cannot be created after a
  correct password or a correct code — the page MUST show an inline, explicit,
  retryable failure message and MUST NOT navigate away from itself, because the
  error page arrives with a later slice and a bare page has no frame to navigate
  through; no placeholder error page is created here (decided 2026-10-11,
  Clarifications). A refusal keeps the page on the step that was submitted, with
  the inline message, and the values the person typed stand except the password
  fields — cleared and never re-displayed, because no password is ever retained
  or shown — and the one-time-code field, cleared after a refused entry; the
  sign-up form keeps the full name, mobile number, city, and shop name, and the
  sign-in and recovery forms keep the mobile number (decided 2026-10-28,
  Clarifications). The silent hidden-field refusal is unchanged: it returns the
  response of a successful submission and stops the flow there rather than
  showing a message, exactly as FR-029 provides (decided 2026-10-28,
  Clarifications). Every state these pages render — the in-progress state, the
  inline failure message, the in-place confirmation FR-004, FR-007, and
  FR-014 require, the notice that a request expired, the notice that it ended
  at the bound on incorrect entries, and the terminal outcome message FR-006
  and FR-038 require — MUST be announced to assistive technology, and when a
  step replaces another the focus MUST move to the step now shown — its first
  field, or its heading when it carries no field — and MUST NOT remain on a
  control the previous step carried, so a step that ends in the notice that the
  request expired or that it ended at the bound leaves the focus on the first
  step's first field (decided 2026-10-22, Clarifications; extended 2026-11-02,
  Clarifications). The same inline, explicit, retryable failure is the single
  rendering for a request the platform cannot complete — the store its data lives
  in is unreachable, or the service fails before the request can be answered: the
  failure this specification does not name reaches these three pages with no
  second state, no separate notice, no navigation, and no error page, so such an
  outage has one stated rendering rather than an inferred one (decided 2026-11-04,
  Clarifications). A failure this requirement renders is retryable at once: the
  message names no wait and the page imposes no interval, so the person may submit
  again immediately, and only a refusal a limit produces is decided by a window,
  exactly as FR-033 and FR-034 provide (decided 2026-11-04, Clarifications).

**Signing in and out**

- **FR-007**: System MUST let a verified merchant sign in with their mobile
  number and password, without a one-time code. Signing in MUST create a new
  session and MUST NOT end any session the account already holds: an account MAY
  hold an unlimited number of concurrent sessions, this feature applies no cap,
  and only a session's own end — its timeout, its absolute maximum lifetime, an
  explicit sign-out, or a revocation — removes it (decided 2026-10-11,
  Clarifications). A successful sign-in MUST render its confirmation in place on
  the sign-in page — the form is replaced by a confirmation that the merchant is
  signed in — with no navigation, no new route, and no new page, because this
  slice ships no destination page (decided 2026-10-11, Clarifications).
- **FR-008**: System MUST NOT reveal, in any sign-in response that does not
  succeed, whether the submitted mobile number has an account, including when
  that account is locked (FR-009) or blocked (FR-017). The uniformity MUST cover
  the response's whole observable shape — the same text, the same status, the
  same response path, and the same work: a sign-in attempt against an unknown
  number MUST perform the same verification work as one against an existing
  account, so how long a response takes MUST NOT signal whether the account
  exists (decided 2026-10-11, Clarifications). That one uniform refusal is stated
  here, once: FR-009, FR-017, and FR-027 refer to it as the refusal FR-008
  defines rather than restating its terms (revised 2026-11-01, Clarifications). A
  successful sign-in is outside this rule on the exception SC-004 states for it
  (decided 2026-10-28, Clarifications). The literal Arabic text of
  that uniform refusal is not a specification value: it is the fixed design
  value FR-026 records once for the slice, presented in Arabic
  with Latin numerals and no emoji; no acceptance criterion restates the
  string — AC-028 asserts that the rendered text is the text recorded for its
  cause, and AC-009 and AC-010 assert that the same case receives
  the same text (decided 2026-10-27, Clarifications; authority and identity
  recorded 2026-11-04, Clarifications).
- **FR-042**: On every page this slice ships that takes a mobile number — the
  sign-up, sign-in, and password-recovery pages — when the submitted value is
  not a valid Libyan mobile number on +218, System MUST refuse it with one and
  the same distinct, explicit refusal that states the value is not a valid
  Libyan mobile number. On the sign-up form the refusal is decided within the
  value-rules step FR-051 fixes, after the form's hidden field and its minimum
  time-to-submit have decided theirs; at sign-in and in password recovery it is
  the value rule the page's order reaches. That refusal is not the uniform
  refusal FR-008 defines and is excluded from SC-004's enumeration comparison on
  the format exception SC-004 states (decided 2026-10-11, Clarifications; scope
  widened 2026-11-01, Clarifications).
- **FR-009**: System MUST lock an account for fifteen minutes after five
  consecutive failed password verifications. A failed password verification is a
  password check that runs against an existing, active account and does not
  match, and it arises on exactly three paths: the sign-in attempt whose password
  is wrong; the current-password check of the account's own change-password
  action; and the current-password check of the administrator's forced first
  change. The three paths share one consecutive count on the account, and three
  rules govern that count identically on every path. **Increment**: each failed
  password verification on any path adds one, and nothing else does — a refusal
  produced by a rate limit (FR-033), a refusal of a value that is not a valid
  Libyan mobile number (FR-042), the refusal a blocked account receives (FR-017),
  the refusal an administrator account receives on the merchant sign-in surface
  (FR-027), a submission a value rule refuses before the check runs (FR-035; at
  the forced first change, FR-028), and a refusal the lock itself makes MUST NOT
  add to it, because none of them is a failed password verification against an
  existing, active account: the first four never reach a password check against
  an active account, and the lock withholds the count from the check it refuses,
  so the lock cannot be driven by requests that never verified a password
  (decided 2026-10-11, Clarifications; revised 2026-10-28 and 2026-11-01,
  Clarifications). **Clear**: a successful password verification on any of the
  three paths — a successful sign-in, a successful change through the account's
  own action, and a successful forced first change — clears the count to zero, so
  the run that follows starts afresh, and the lock's expiry clears it too; a
  password reset through the recovery flow clears neither the count nor the lock,
  because it verifies no password (decided 2026-10-11, Clarifications). **Lift**:
  the lock lifts when its fifteen minutes elapse and at no other moment — no
  success and no reset lifts it or shortens it — and a refusal made while the
  lock is in force neither counts toward the next run nor extends it, so the lock
  is a time bound alone (decided 2026-10-11, Clarifications). The
  denial-of-service consequence is accepted and bounded per lock episode: any
  caller who knows the number can lock the account with five wrong passwords,
  and no lock outlives its fifteen minutes, because the lift rule above neither
  extends it while it runs nor lets a success or a reset shorten it. The
  acceptance claims no bound on repetition: five further failed password
  verifications in a later window re-lock the account as soon as the lock
  lifts, and the number-keyed sign-in budget (FR-033) prices that repetition
  rather than a second lock rule. That residual exposure is recorded as
  accepted, with its owner and review
  date, so the lock keeps one authority and one duration (decided 2026-11-02,
  Clarifications).
  The lock is expressed as the uniform
  refusal FR-008 defines: an attempt made while the account is locked is refused
  identically, and no message, timing difference, or other signal tells the
  person that the account is locked or that it exists. The locked state therefore
  carries no copy of its own: the one uniform failed-sign-in message is the only
  text shown, and no alert, banner, field message, or retry-time hint names the
  lock or invites the person back later; the wording of that one message is the
  fixed design value FR-026 records once, not a second string this requirement
  introduces (decided 2026-10-27, Clarifications; authority and identity
  recorded 2026-11-04, Clarifications). The lock withholds acceptance
  on the three paths alone: it does not end the session the change was attempted
  from, and ending the session remains available throughout; the current-password
  check is refused for the lock's full duration, and the action resumes when the
  lock lifts (decided 2026-10-28, Clarifications). A status or role refusal still
  performs the same verification work as any other attempt and is refused
  afterwards on that ground, so its response's duration is indistinguishable —
  the verification it performs is simply not one against an active account
  (FR-017, FR-008; decided 2026-10-22, Clarifications).
- **FR-010**: System MUST let a signed-in merchant end the current session by
  signing out.
- **FR-011**: System MUST let a signed-in merchant end every session of their
  account at once ("sign out of every device").
- **FR-012**: System MUST allow the platform to end any signed-in session at any
  time, after which that session no longer grants access.
- **FR-013**: System MUST end every existing session of an account when its
  password changes, whether the password is changed from the account's own change
  action or set through the recovery flow; after a reset the merchant MUST sign
  in with the new password, except that a blocked account's block stands and
  grants no access, as FR-014 provides. The administrator's forced first change is a password
  change for this rule: it ends every existing session of that account too,
  including the restricted session it was made from, and the administrator signs
  in again with the new password, now unrestricted (decided 2026-10-22,
  Clarifications). The account's own change action MUST require the
  current password: a change submitted without it, or with a wrong one, is
  refused and ends no session, and the recovery flow is the only path that resets
  the password of an account that already holds one without the current one,
  because it proves ownership of the number
  with the one-time code; the operator's provisioning action sets an account's
  first password rather than resetting one, and the forced first change still
  requires the current one (decided 2026-10-11, Clarifications; revised
  2026-11-01, Clarifications). The value rules are
  decided before that check: a submission whose new password fails the policy
  (FR-035) — or, at the forced first change, repeats the initial password
  (FR-028) — is refused on that value ground, ends no session, and does not
  increment the count of consecutive failed password verifications, because no
  password
  verification took place; only a submission that passes every value rule reaches
  the current-password check, and a failed check then counts under FR-009 (decided
  2026-10-28, Clarifications). While the account
  is locked, that current-password check is refused under FR-009 for the lock's
  full duration, exactly as sign-in is: the change is not made, the session
  remains available to end, and the action resumes when the lock lifts (decided
  2026-10-28, Clarifications). The account's own
  change action is delivered in this
  slice as behaviour and verified by the integration tests, with no page
  offering it: the profile page that offers it arrives with a later slice, so
  both halves of this requirement are exercised here at the behaviour level
  (decided 2026-10-11, Clarifications). The action exposes a request that a
  signed-in session issues even though no page offers it here, so that request
  carries the request-forgery protection FR-044 requires and is exercised
  through it, and R7 adds the page alone (decided 2026-10-29, Clarifications).
  When a password change and a password reset for one account are submitted
  concurrently, exactly one of them sets the final password: the two writes are
  ordered, and each takes effect only while the authority it rests on still
  holds at that moment — a live session and the current password for a change,
  a verified recovery state for a reset — and the write that takes effect first
  removes the other's authority in the same indivisible step, so the other
  submission is refused and writes nothing, and no later write overwrites the
  password the first set. Every session of the account that exists when the
  winning write takes effect ends with it, whichever path wrote, so no session
  survives on a superseded decision (decided 2026-11-02, Clarifications). The
  write of the new password and the ending of every existing session MUST be one
  indivisible step: a failure between them MUST leave the account's previous
  password and every session as they were, so no session survives on a superseded
  password and no password is set without the sessions it ends; the person sees
  FR-040's inline, retryable failure and retries. The rule governs the account's
  own change action, the recovery flow's reset, and the administrator's forced
  first change alike (decided 2026-11-04, Clarifications).
- **FR-032**: System MUST end a session on either of two clocks: the session
  timeout elapsing with no activity, and the session reaching its absolute
  maximum lifetime, which ends it however active the merchant is; on either end
  the merchant MUST sign in again. Only what the merchant themselves do counts
  as activity for the session timeout — opening a page, submitting a form, or
  any other action the merchant starts — and that action MUST reset the
  inactivity clock; a request the browser sends on its own, such as a background
  request the frame issues, MUST NOT count as activity, so a background request
  cannot keep a session alive indefinitely and the timeout keeps its meaning.
  Both values are stated numerically in the
  recorded values. A session survives the browser being closed and
  reopened: the browser retains only the reference that proves the session, and
  the session itself is never recoverable from browser
  storage, so a merchant who
  returns before the session's absolute maximum lifetime is still signed in, and
  only the session timeout or the absolute maximum lifetime ends it; closing the
  browser neither shortens nor extends either clock (decided 2026-10-11,
  Clarifications; revised 2026-10-21, Clarifications; revised 2026-10-22,
  Clarifications).
- **FR-037**: System MUST emit a structured record for each security-relevant
  event this slice produces — a failed sign-in attempt, a successful sign-in,
  the verification that creates an account at sign-up, a lock applied, a
  password change or a reset, a failed password verification in a password
  change, a session revocation, a one-time-code dispatch failure, a
  security-notice dispatch failure, and the operator's provisioning of an
  administrator account —
  carrying no secret, no session token, and no personal data beyond
  what the constitution permits in a log. A failed sign-in attempt is every
  sign-in attempt that reaches the account-existence comparison and does not
  succeed — a wrong password, an unknown number, a locked account, a blocked
  account, and an administrator account on the merchant sign-in surface —
  while a format refusal (FR-042) and a rate-limit refusal (FR-033) are not
  attempts against an account and emit no such record, exactly as they sit
  outside SC-004's comparison (decided 2026-10-28, Clarifications). A failed
  password verification in a password change is its own event rather than a
  failed sign-in attempt: the submission is made from a live session, not
  at the sign-in surface, and it never reaches the account-existence comparison,
  so its record names the path it came from — the account's own change action or
  the administrator's forced first change — and reports a password verification
  that ran against an existing, active account and did not match. The record is
  emitted exactly for the failures FR-009 counts on those paths: a submission
  that passed every value rule (FR-035; at the forced first change, FR-028) and
  reached the check, and whose current password was wrong. A submission a value
  rule refuses, and one the lock refuses before the check runs, emit no such
  record, because neither is a failed password verification; the fifth failure
  emits this record and the lock record (FR-009), each for its own fact (decided
  2026-11-02, Clarifications). The two records are not the same fact, and neither
  is the count. A failed password verification is the term FR-009 fixes — a
  password check against an existing, active account that did not match, on one
  of the three paths it names — and one record is emitted for each such failure:
  on the sign-in path it is the wrong-password case of a failed sign-in attempt,
  recorded as that attempt, and on the two change paths it is the event this
  paragraph defines. A failed sign-in attempt that is not a failed password
  verification — an unknown number, a locked account, a blocked account, and an
  administrator account on the merchant sign-in surface — is recorded all the
  same, and its record does not make it a counted failure. A record's emission
  neither increments nor clears the count and neither applies nor lifts the
  lock: those three rules are FR-009's alone, and they are the same on all three
  paths (decided 2026-11-02, Clarifications). A session
  revocation is an explicit end of a session driven by the person or the
  platform — an explicit sign-out, a sign-out of every device, and a platform
  revocation (FR-012) — while a session that ends at its inactivity timeout or at
  its absolute maximum lifetime (FR-032) is an expiry rather than a revocation
  and emits no such record; the session endings a password change or reset
  produces are part of that change's own record, and the withdrawal a block
  produces belongs to the block's own record, which the slice that ships the act
  owns, so one action never emits a second
  record for the sessions it ended (decided 2026-10-29, Clarifications). Collection,
  retention, and alerting
  remain with the log pipeline the deployment slice (R12) owns; this slice
  introduces no pipeline and no separate audit store of its own (decided
  2026-10-11, Clarifications). A record MUST identify its subject by an internal
  account identifier, MUST carry it only where an account exists — a record
  produced for a number with no account carries no account reference — and MUST
  NOT carry the mobile number in any form, because the constitution forbids
  personal data in a log (decided 2026-10-11, Clarifications). The bound reaches
  past the record: on the browser surface the mobile number MUST be carried in a
  request's body and, where a response carries it, in that response's body, and
  MUST NOT appear in a URL — no path segment and no query parameter — in a
  browser-history entry, in a referrer, or in any client-side storage. Every form
  this slice ships submits
  the values it collected in the request body, no page's own address carries a
  number, and a response carries it in its body alone, never in a header, a
  cookie, or a redirect's location. The browser's tie to a pending request is
  that request's opaque identifier, which the browser holds for the flow and
  which is not the number and does not encode it; the number the code step shows
  for reading is a value a response returned in its body — the submission's own
  response or the read that resumes the request — held in the page while it is
  open and not written to storage (decided 2026-11-02, Clarifications).
- **FR-043**: System MUST send a notice by SMS to the account's registered
  mobile number when the account's password changes and when every session of the
  account is ended at once ("sign out of every device"), so that the account's
  owner learns out of band of a change they did not make. The notice MUST follow
  the language, numeral, and no-emoji rules FR-026 states for the body of every
  SMS, and it MUST be dispatched best-effort: a send that fails MUST NOT undo the
  change or the ending of the sessions, MUST NOT block either, and is recorded as
  the dispatch failure FR-037 names (decided 2026-10-11, Clarifications). No
  notice is sent on an ordinary sign-in or an ordinary sign-out, so the channel
  stays bound to those two security-relevant events alone. One action produces
  one notice: a password change ends every session of the account by FR-013, and
  that consequence is part of the change rather than a second sign-out of every
  device, so the change sends a single notice that reports it and the sessions it
  ended; the notice for a sign-out of every device is sent when the merchant
  performs that action, not when a password change ends the same sessions
  (decided 2026-10-24, Clarifications). No notice is sent when
  the operator's provisioning action sets the administrator account's initial
  password: that action sets an account's first password rather than changing one
  it already holds, and the operator who supplies it is the party the notice
  would inform, so the notice has no owner to inform; the provisioning stays
  recorded as the structured security event FR-037 names, so the privileged
  creation is not silent (decided 2026-10-11, Clarifications). The change made
  at the administrator's forced first sign-in changes a password the account
  already holds, so the notice is sent for it as well, exactly as it is for the
  account's own change action (decided 2026-10-22, Clarifications). The
  platform's guarantee ends at the channel's acceptance, exactly as FR-034
  bounds the one-time codes and SC-009 the measured wait: a notice the channel
  accepts is a successful send even if it is never delivered, and a later
  delivery failure is outside the platform's observation — it MUST NOT be
  retried, MUST NOT be reported, MUST NOT undo the change or the ending of the
  sessions, and MUST NOT turn that action into a failure, so no delivery
  guarantee is promised and no delivery report is introduced (decided
  2026-11-04, Clarifications).

**Recovering a password**

- **FR-014**: System MUST let a merchant who has forgotten the password reset it
  by entering a one-time code sent by SMS to the registered mobile number and
  then setting a new password. The one-time code MUST stop being usable the
  moment it is entered correctly: the pending request MUST move to a verified
  state that carries the new-password step alone, lasts no longer than the
  pending request's own lifetime — the value already fixed — and ends when the new password is set, when a new request
  replaces the pending request (FR-034), or when the account's password changes
  by another path, so the same code cannot authorise a second reset and a
  replaced request leaves no verified state behind. A password change made from
  any other path — the account's own change action (FR-013) or the
  administrator's forced first change (FR-028) — MUST end a live recovery request
  for that number and any verified state it holds, so a reset authority created
  before the change never survives it, and the person MUST start a fresh
  recovery; a successful sign-in alone does not end the request, because it does
  not change the credential (decided 2026-10-29, Clarifications). The reset
  takes effect only while its verified state still exists at the moment the new
  password is written: a change that took effect first has deleted that state, so
  a new password submitted concurrently is refused on the ended-request ground
  this requirement already states for an ended verified state, sets no password,
  and returns the page to the flow's first step with the explicit, retryable
  notice (decided 2026-11-02, Clarifications). The reset's write of the new
  password and the ending of every existing session are one indivisible step, as
  FR-013 provides: a failure between them MUST leave the password unset, every
  session as it was, and the verified state live until its own expiry, so the
  person retries the same step and no password is set without the sessions it
  ends (decided 2026-11-04, Clarifications). When
  that lifetime elapses while the person is still on the new-password step, the
  verified state MUST end at that moment, the page MUST return to the flow's
  first step with an explicit, retryable notice that the request expired and
  that a new code must be requested, and a new password submitted after the
  state has ended MUST be refused on that same ground and MUST set no password,
  exactly as an expired code is refused by FR-034 (decided 2026-10-28,
  Clarifications). A person
  who reloads, or closes and reopens,
  the page while that verified state lives MUST be shown the new-password step
  again rather than the code step, and once the password is set the page MUST
  return to its first step as FR-041 provides (decided 2026-10-22,
  Clarifications). A reset requested for a blocked account completes
  — a new password is set and every existing session ends — but the account's
  block stands, so no access is granted and the outcome is stated only after
  ownership of the number is proven. The confirmation that follows MUST state
  both outcomes — that the password was changed and that the account is blocked
  — and MUST say plainly that sign-in stays refused until an administrator
  returns the account to active, so the page never sends the merchant to a
  sign-in that cannot succeed; before the code is verified the flow's uniformity
  (FR-015) still binds, so nothing about the block is disclosed earlier (decided
  2026-10-24, Clarifications). A reset requested for a mobile number whose
  account holds the administrator role MUST be refused after the code is
  verified: no password is set, no session is created, and the platform states
  explicitly that the credential cannot be reset on this surface, because an
  administrator's credential belongs to the administrator's own surface
  (decided 2026-10-11, Clarifications). When the account is both blocked and
  holds the administrator role, the role decides the outcome: the reset is
  refused after the code is verified, no password is set, no session is created,
  and the platform states that the credential cannot be reset on this surface,
  while the block is not mentioned, because the credential path is closed on the
  role ground before the status could matter; the request, the following step,
  and the dispatch stay indistinguishable, and nothing is disclosed before the
  code is entered (FR-015, FR-027; decided 2026-10-29, Clarifications). Where the reset cannot proceed — because
  the number has no account, or because its account holds the administrator
  role — the pending request MUST end once the outcome is stated, so no verified
  state outlives the step it would have carried, and the code step MUST be
  replaced in place by the outcome message, with no navigation and no new route,
  so the person stays on the message; a reload or a fresh opening then returns
  the page to the flow's first step, the message carries no retry control
  because there is nothing to retry, and the page's cross-link to sign-in
  (FR-036) remains the way forward (decided 2026-10-22, Clarifications; revised
  2026-10-29, Clarifications). Setting the new password MUST render its
  confirmation in place on the password-recovery page — the step is replaced by a
  confirmation that the password was changed and, for an account that is not
  blocked, that the merchant must sign in with it, while a blocked account's
  confirmation states the block as the preceding paragraph requires — with no
  navigation, no new route, and no new page (decided
  2026-10-11, Clarifications; revised 2026-10-24, Clarifications).
- **FR-015**: System MUST NOT reveal, in any password-recovery response, whether
  the submitted mobile number has an account. The one-time code MUST be sent to
  the submitted number whether or not it has an account, so that the request's
  response, the following step, and the sending of the code are indistinguishable;
  the rule is bounded to those steps on the post-verification exception SC-004
  states, and the platform MUST then state explicitly that no
  account exists for that number rather than continue as though a reset had
  occurred. The dispatch stays bounded by the rate limit on authentication
  operations, and a dispatch that fails outright is handled by the same explicit,
  retryable failure state FR-034 states for a code that cannot be sent (decided
  2026-10-11, Clarifications). The indistinguishability MUST also cover how long
  each of those steps takes: the request's response, the following step, and the
  sending of the code MUST do the same work whether or not the number has an
  account, so no step's duration signals it (decided 2026-10-11,
  Clarifications).

**Account status and sessions**

- **FR-016**: The account MUST carry a status that is exactly one of active or
  blocked. The status is a closed two-value set, and this slice performs neither
  transition: setting an account to blocked and returning it to active are both
  administrator operations owned by the slice that ships the administrator's
  Users page (R13). This slice delivers the field and the effects of the blocked
  value — the tests reach the blocked state directly — and it defines no reverse
  transition and ships no action that sets the status, apart from the initial
  active value the provisioning action gives the account it creates, which is a
  creation value rather than a transition (decided 2026-10-11, Clarifications;
  revised 2026-10-28, Clarifications).
- **FR-017**: A blocked account MUST keep all of its data and its public
  contributions, and MUST NOT be able to sign in. Its public contributions are
  the catalogs it uploaded and the parts extracted from them, as the register's
  `User` invariant states, and blocking withdraws access alone: it removes no
  contribution, hides none, and decides nothing about a contribution's content,
  its visibility, or its removal. Those contributions belong to later slices:
  the Upload Catalog slice (R2) ships a merchant's upload and the My Files slice
  (R4) owns the merchant's own removal of a file, so this slice creates no
  contribution, reads no contribution, and removes none (decided 2026-11-02,
  Clarifications). The refusal MUST be the uniform refusal FR-008 defines, so
  that no signal, at any step, tells the person the account is blocked or that
  it exists. A status refusal MUST perform the same verification work as any
  other sign-in attempt and be refused afterwards on the status ground, so its
  response's duration signals nothing, exactly as FR-008 and SC-004 require
  (decided 2026-10-22, Clarifications). That refusal MUST NOT increment the
  account's count of consecutive failed password verifications, because the
  verification the
  attempt performed was not against an active account (FR-009; decided
  2026-10-11 and 2026-10-22, Clarifications).
- **FR-018**: A merchant MUST NOT be able to delete their own account, and no
  such control MUST be offered. The account's personal data lives as long as the
  account is registered, where registered means not soft-deleted: once the
  register's soft deletion marks the row, the row is retained, but the account
  is no longer registered and its personal data is no longer read by the
  platform. Deletion is soft as the register's cross-entity rule provides, and a
  `User` row is removed for good only by an administrator operation or by the
  retention job; neither path is decided here. The administrator
  operation belongs to the slice that ships the administrator's Users page
  (R13); the retention job belongs to the retention slice (R15), which owns its
  trigger and its period and alone decides whether, when, and over which rows it
  runs. This slice therefore fixes no retention period, states no trigger, and
  asserts no retention behaviour of its own, and the wording of the
  Privacy Policy page belongs to the slice that ships it (decided 2026-10-11,
  Clarifications; revised 2026-10-21, 2026-11-01, and 2026-11-02,
  Clarifications). The effects of a removal on the state this slice creates MUST
  be as follows, and they do not depend on which of the two paths removes the
  row: every session of the account MUST stop granting access and MUST be
  withdrawn, a live pending request for the account's mobile number MUST end
  with its code no longer valid, and no stored credential of the account MUST
  permit a sign-in — the credential is removed with the row when the row is
  removed for good. Only these effects are stated here: the act of removal,
  whether and when it is soft or for good, its timing, its audit record, the
  retention job's trigger, scope, and period, and whether a removed account's
  number may open a new account stay with the slice that ships the
  administrator's Users page (R13) and the retention slice (R15), and this
  slice performs no removal (decided 2026-11-02, Clarifications).
- **FR-019**: When an account is blocked, every existing session of it MUST stop
  granting access. That end takes effect at a request boundary, and the boundary
  is stated here once: the session's authority — the session's own state and the
  account's status — is read for each request at the single shared entry point
  every authenticated request passes, so a request that had already passed that
  point when the block was recorded is not interrupted and is decided on the
  state it met, while every request that reaches the entry point afterwards is
  refused with the blocked variant of the ended-session state FR-049 defines — a
  request issued from a page that was already open included — and the block
  therefore waits for no refresh, no cache, and no token lifetime. The only
  exposure this leaves is the one request already in flight, and that request
  neither creates, extends, nor renews a session for the account. The session
  that carries the next request is marked as ended for the block as that request
  is refused, so every later request reads that mark and is refused in the same
  way. This slice delivers the status and everything that follows
  from it, not either act that changes it: no operator action sets or clears the
  status of an existing account here — the provisioning action's initial active
  value is not such a transition — so neither blocking nor returning an account
  to active is
  performed by this slice, and both arrive with the slice that ships the
  administrator's Users page, where the audit record every administrator
  operation requires also exists (decided 2026-10-11, Clarifications; revised
  2026-10-28, Clarifications; revised 2026-11-02, Clarifications).

**The shared page frame**

- **FR-020**: System MUST present the product's shared page frame — the header,
  the sidebar, the footer band, and, on a narrow screen, the bottom bar,
  together with the product's icon set and the product's typography — on the
  public pages and in the merchant's area only. Here and throughout this
  specification, the public pages
  are the public site's own pages that carry the frame — Home, Parts, and
  Catalog — and not every page a guest can reach without an account: the three
  authentication pages this slice ships (sign-up, sign-in, password recovery)
  are bare pages outside the term (FR-021), as are the error page and the four
  static pages (decided 2026-10-30, Clarifications). The bottom bar — the short
  form of the bottom navigation bar — is used throughout this specification
  (revised 2026-11-01,
  Clarifications). Each surface's presence and composition are stated by the
  requirement that owns it — the header by FR-023, the sidebar by FR-022 and
  FR-039, the footer band by FR-024, and the bottom bar by FR-052 — so the frame
  has one authority per surface and this requirement names the four surfaces
  rather than restating their terms; the enumeration follows the constitution's
  order, so the bottom bar is the frame's fourth surface as FR-052 states
  (revised 2026-11-01, Clarifications).
  The technology register carried the icon set as an open gap owned by this
  slice, and that gap is closed: ADR-146 removes the icon and typeface rows and
  keeps the set an asset of the Wafar UI layer rather than a row of the
  register, so the layer records the family and the cut it consumes (ADR-097,
  ADR-098, ADR-137) and every later slice reads that record rather than
  choosing a set of its own; this slice therefore records the choice with the
  platform's other fixed values, executes the licence-obligation record
  and the vulnerability scan the gap rule required, and delivers the set by the
  vendoring the layer's record fixes (decided 2026-10-11, Clarifications;
  revised 2026-10-21, Clarifications, ADR-098; revised 2026-10-31, ADR-146).
- **FR-021**: The frame MUST NOT appear on the sign-up, sign-in,
  password-recovery, error, and static pages; those pages MUST be shown bare,
  with no frame header, no sidebar, no bottom bar, and no footer
  (decided 2026-10-11; revised 2026-10-27, Clarifications). The bare layout MUST carry
  the product's wordmark above the page title and the page title above the form
  card; the wordmark is a non-interactive brand mark, not the frame's
  logo/home control, adds no link, and does not make the page carry the frame,
  and the page title names the page (decided 2026-10-28, Clarifications). For
  the three pages this slice ships the visible title is the page's own Arabic
  name — «إنشاء حساب» at sign-up, «تسجيل الدخول» at sign-in, and «نسيت كلمة
  المرور» in password recovery — and it carries no brand, while the browser
  title is `<page name> — منصة وفر`: the page's name first, then the brand in
  the Glossary's exact form, so each of the three is distinguishable in a tab,
  in history, and in a screen reader's page list and every title still carries
  the brand; the wordmark above the visible title reads «منصة وفر» in the same
  form (decided 2026-11-02, Clarifications).
- **FR-036**: The three bare pages this slice ships — sign-up, sign-in, and
  password recovery — MUST link to one another: sign-in MUST offer the way to
  sign-up and to password recovery, sign-up MUST offer the way to sign-in, and
  password recovery MUST offer the way back to sign-in. The links live on the
  bare pages themselves, because the frame that would otherwise carry them is
  absent from those pages and arrives with a later slice, and every journey this
  slice ships therefore has a defined entry point (decided 2026-10-11,
  Clarifications). The route of each of the three pages is fixed by the frame's
  decision record (FR-024), so each of those links points at a definite target
  (decided 2026-10-11, Clarifications).
- **FR-038**: The one-time-code entry — at sign-up and in password recovery —
  MUST be a step of the same page that begins the flow, not a page and not a
  route of its own. The code step adds no page and no route, so this slice ships
  exactly the three bare pages it names — sign-up, sign-in, and password
  recovery — and this requirement adds no page to the Product Register, which ADR-126
  holds at twenty-eight pages (decided 2026-10-11, Clarifications). The code step MUST show, for reading and
  without editing them, the fields the flow collected: at sign-up, the full name,
  the mobile number, the city, and the optional shop name; in password recovery,
  the mobile number alone, because the recovery form collects nothing else and
  showing an account's name, city, or shop name before the code is verified would
  reveal that the number has an account, breaching FR-015 and SC-004. The mobile
  number is shown in its canonical Latin-numeral form, in the one display form
  this requirement fixes, so that the person sees which number the code was sent
  to: the `+218` prefix, then a single space, then the nine national digits
  grouped 2-3-4 with a single space between groups (`+218 91 234 5678`). That
  form is used at this step and at every place the platform shows the number,
  while the stored form stays the unspaced canonical number FR-031 fixes; the
  whole value renders as one isolated left-to-right run, so its groups never
  reorder inside the right-to-left page and never break across lines (decided
  2026-11-02, Clarifications). The other fields the step shows — the
  full name, the city, and the optional shop name — are shown as the person
  supplied them, in their own script and digits, because FR-026's language and
  numeral rules govern the platform's own text and not a value a person types,
  while a value carrying an emoji never reaches this step because the form
  refuses it (FR-001, FR-026; decided 2026-10-31, Clarifications). The password MUST NOT be shown back in
  any form: it is neither re-displayed, nor echoed, nor rendered masked, so a
  submitted password never returns to the browser in any form, and that rule is
  the same at sign-up and in password recovery (decided 2026-10-22,
  Clarifications). The prohibition governs the page: the pending request still
  carries the submitted password, so that the account can be created when the
  correct code is entered, and it carries it only in the same irreversibly
  protected form a stored password has, computed at submission, so no plaintext
  password is stored, logged, or cached while the request lives; a request that
  is replaced or that ends discards the value with it (decided 2026-10-22,
  Clarifications). The step MUST carry, beside the code field and its submit
  control, a control that requests a new one-time code subject to FR-034's limit
  on re-requesting and to FR-040's in-progress guard, and a control that returns to the page's first step; the
  first step then shows the values the person already typed for editing again,
  except the password, which the page never retains or shows, and submitting it starts
  a new pending request for the new number on FR-034's terms (decided
  2026-10-22, Clarifications). A person who
  reloads that page, or who closes it and comes back, MUST be shown the code
  step again for the pending request the page is tied to — the one it most
  recently submitted from that browser — while that request is still live and
  its code has not yet been verified, so the code already sent to them stays
  usable rather than being spent by an accidental refresh; once the code has been verified in the
  password-recovery flow, the same reload MUST show the new-password step
  instead, as FR-014 provides. When more than one pending request is live from
  the same browser — one per mobile number, which FR-034 allows — the page
  resumes the request it is tied to, which is the one most recently submitted
  from that browser; the control that returns to the first step ends that tie
  while leaving the request live on FR-034's terms, so a reload at the first step
  shows the first step rather than a code step, and a fresh submission becomes
  the request the page is tied to
  (decided 2026-10-29, Clarifications). The tie is the pending request's own
  identifier, which the browser holds for the flow, and never the mobile number:
  resuming a request therefore puts no number in the page's address, in a history
  entry, in a referrer, or in a stored value (FR-037; decided 2026-11-02,
  Clarifications). The resumption adds no page and no
  route, and a fresh submission still replaces the pending request on FR-034's
  terms (decided 2026-10-11, Clarifications; revised 2026-10-22 and 2026-10-29,
  Clarifications). The request the tie has left MUST stay live until its own
  expiry or until an ending the requirements state reaches it — leaving the page
  ends neither that request nor its code — and the page MUST NOT resume it: a
  reload, a fresh opening, or any other return to the page shows the request the
  page is tied to, never the one the tie has left, and the tie MUST NOT move
  back to that request on its own. The only route to a code step for that
  request's number is a fresh submission, which starts a new pending request
  and, once the messaging channel accepts its message, replaces the request the
  tie left behind on FR-034's terms, so no control, link, or return path reopens
  a code step for the request the page has left (decided 2026-11-02,
  Clarifications). When the bound on incorrect entries is reached, the code step
  ends and the page returns to the flow's first step with the notice FR-034
  requires (decided 2026-10-28, Clarifications). The same ending follows the
  pending request's own expiry: when its lifetime elapses while the code step is
  shown, the code step ends at that moment and the page returns to the flow's
  first step with the expiry notice FR-034 requires (decided 2026-11-02,
  Clarifications). Two terminal outcomes do not
  return the page to the first step, and each replaces the code step in place and
  stays there until a reload or a fresh opening, because each reports an outcome
  rather than a request the person may retry: the outcome message FR-014
  requires when the reset cannot proceed, and the direction message FR-006
  requires when the correct code is entered for a number that already has an
  account (decided 2026-10-29, Clarifications; the sign-up direction added
  2026-11-01, Clarifications).
- **FR-041**: The three bare pages this slice ships — sign-up, sign-in, and
  password recovery — MUST render identically for a signed-in person and for a
  guest: no redirect is introduced and no signed-in-specific surface is shown on
  them, because the pages are public and carry no frame, and offering a sign-out
  control there would contradict the rule that the sign-out control belongs to
  the frame and not to a bare page — its only control is the account menu's
  third item, which the frame carries and which a bare page does not. The rule
  governs what each page shows when it is opened: the in-place
  confirmation FR-004, FR-007, and FR-014 require is the outcome of an action
  taken on the page and is not a signed-in-specific surface, so a person who
  opens one of the three pages sees it exactly as a guest does whatever their
  session state, and once the action is complete — the pending request consumed
  at sign-up, the session created at sign-in, the password set in recovery — a
  reload or a fresh opening returns the page to its first step, with no
  confirmation re-shown and no redirect (decided 2026-10-11, Clarifications).
- **FR-022**: The frame's sidebar MUST sit at the inline-start edge, which the
  RTL direction resolves to the right edge of the page, and MUST carry the
  platform's navigation item list (FR-039) and the sidebar-collapse control. It
  MUST show in full on a wide screen and narrow to an icon-only rail when
  collapsed; on a narrow screen it MUST become a drawer that the bottom bar's
  «المزيد» slot opens (FR-052) and the collapse control closes, so the control
  that opens it and the control that closes it are not the same control, and the
  header carries neither (FR-023). For this requirement a wide screen is
  1024 CSS px and up, and a narrow screen is below 1024 CSS px — the same
  boundary FR-024 and FR-052 fix. The drawer MUST also
  close when the person presses Escape or activates something outside it, and the
  focus MUST return to the «المزيد» slot that opened it; the collapse control
  remains the control that closes the drawer, and Escape and an outside
  activation are dismissals rather than controls (decided 2026-10-28,
  Clarifications). When the drawer opens, the focus MUST move into it — to its
  first focusable control — and MUST remain within it until it closes, so a
  keyboard user is never left on the «المزيد» slot behind an open drawer
  (decided 2026-10-29, Clarifications). Activating a navigation item inside the
  open drawer MUST close the drawer and perform the navigation the item names —
  a guest's merchant-area item going to the sign-in page on FR-048's terms — and
  that close is part of the activation rather than a dismissal, so it asks for
  no confirmation. The focus then settles at the start of the destination page's
  content, on its page heading, and MUST NOT return to «المزيد», because the
  move leaves the page that carried the drawer; the return to «المزيد» governs
  the three dismissals that do not navigate — the collapse control, Escape, and
  an activation outside the drawer (decided 2026-10-31, Clarifications). While it
  is open the drawer MUST be the frame's topmost surface: the drawer and its
  scrim render above the page's content and the header, and the scrim covers the
  bottom bar, so no control below the scrim — the header's controls and the bar's
  slots included — receives an activation until the drawer closes. The bar stays
  rendered and visible through the scrim with «المزيد» keeping its open state, as
  FR-052 provides, and the drawer's panel ends at the bar's top edge, so the panel
  covers no slot and the drawer's four static-page links sit above the bar. An
  activation that lands outside the drawer panel — on the scrim,
  including where it covers the header or the bar — closes the drawer as the
  outside dismissal this requirement provides and has no other effect: it MUST
  NOT activate the control it lands on, so the person activates that control
  again once the drawer has closed. The drawer and the account menu MUST NOT be
  open at the same time: the account control sits below the scrim while the
  drawer is open, so an activation on it closes the drawer without opening the
  menu, and while the menu is open an activation on «المزيد» closes the menu
  without opening the drawer (FR-047; decided 2026-11-02, Clarifications). The collapse control
  sits in the sidebar itself, beside the navigation item list (decided
  2026-10-21; revised 2026-10-27, Clarifications; ADR-127). The rail's width is
  a fixed design value this slice records, and the shell's desktop collapsed
  state consumes it (decided 2026-10-21, Clarifications).
- **FR-039**: The frame MUST carry the sidebar's navigation item list as part of
  its composition, so the frame is composed once and a later slice composes it
  rather than extending it. The list is fixed here as one item per registered
  destination a guest or a signed-in merchant can reach on the public site and in
  the merchant's area — Home, Parts, Catalog, Upload Catalog, My Files, Cart,
  Notifications, Messages, and Profile — and it carries no item for the three
  bare pages this slice ships (sign-up, sign-in, password recovery) or for the
  four bare-layout static pages (Contact, Privacy Policy, Terms of Use, FAQ),
  because the register states a static page is never a sidebar item. The list is
  the frame's single composition and MUST be shown identically to a guest and to
  a signed-in merchant: all nine items are present in both states, and the frame
  MUST NOT add, remove, or disable an item by role, exactly as its logo, its
  typography, and its icon set are not varied by role (decided 2026-10-11,
  Clarifications; revised 2026-10-25, ADR-126).
  Each item MUST name a registered
  destination, and the route each item points at is fixed by this slice's
  decision record (FR-024), so an
  item whose destination page ships in a later slice points at the route fixed
  here and that slice ships its page at that route rather than choosing one of
  its own (decided 2026-10-11, Clarifications); this slice MUST verify the item
  list structurally, alongside the sidebar's collapse control, because no page
  here renders the frame; the logo, the notifications control, and the theme
  switch are verified in the header, where FR-023 places them (decided
  2026-10-11; revised 2026-10-21, Clarifications; revised 2026-10-21,
  ADR-102).
- **FR-023**: The frame's header MUST carry the platform's logo/home control at
  its inline-start edge and, at its inline-end edge, the notifications control,
  the theme switch, and the account control for a signed-in merchant, and MUST
  carry no page-navigation link and no sidebar-collapse control. A
  page-navigation link is a link the frame renders as one of the navigation
  items in the sidebar's item list FR-039 fixes — the nine destinations —
  whether it is shown in the full sidebar, in the collapsed icon-only rail, or
  in the narrow-screen drawer, and the term is decided by the link's role in
  that list rather than by the destination it points at. The header's
  logo/home control and notifications control point at Home and Notifications,
  which that list also names, but each is one of the header's own controls
  rather than a navigation item, so neither is a page-navigation link; the same
  holds for the guest's sign-in action and for the footer band's four
  static-page links (FR-024). The rule that the header carries no
  page-navigation link therefore means that no item of that list is rendered in
  the header; it does not mean that the header carries no link, because the
  logo/home control, the notifications control, and the guest's sign-in action
  each stay a link to the route the frame's decision record fixes (FR-024). The
  notifications control MUST be a link to the Notifications route the frame's
  decision record fixes (FR-024), and it is the control that carries the unread
  count — no other surface carries it; the count itself and the Notifications
  page arrive with R9 (ADR-102), so this slice builds the control and its target
  and renders no badge, and the structural verification asserts the control and
  its route alone (revised 2026-11-01, Clarifications). The logo is delivered as a wordmark set in the product's
  typography: it adds no image asset and no new design value, and the form it
  takes is recorded (decided 2026-10-11; revised 2026-10-21,
  Clarifications; revised 2026-10-21, ADR-102). The account
  control MUST carry the accessible name
  «حسابي» and MUST show the icon alone, with no merchant name in the header;
  the merchant's name is available inside the account menu's «حسابي» item.
  The account control MUST open the account menu FR-047 fixes (ADR-099): the
  menu's three items and its sign-out confirmation are stated there, once, and
  this requirement names the menu rather than restating its terms, so the
  menu's shape has one authority and a later change to it cannot leave a stale
  copy behind (revised 2026-11-01, Clarifications). For a guest the header MUST show a
  sign-in action in place of the account control and the notifications control;
  the guest has no account menu, and the theme switch remains available because
  it sits in the header, while the sidebar-collapse control remains available
  in the sidebar. A header carries one of four states, and this requirement is
  their single authority: the signed-in merchant's, stated above; the guest's,
  stated above; an ended session whose account is not blocked — the state
  FR-049 defines — whose header MUST carry the logo/home control, the theme
  switch, and the sign-in action, exactly as a guest's does, because the
  session has ended and that state offers the way to sign in again; and an
  ended session whose account is blocked, whose header MUST carry the
  logo/home control and the theme switch alone, because the sign-in action is
  withheld — the block refuses every sign-in — and the account control is
  withheld because the session has ended, so no control the header carries
  can fail for the reason the state reports. In every one of the four states
  the sidebar, the bottom bar, and the footer band keep their composition
  (decided 2026-11-01, Clarifications). The constitution's Product
  Fact Clarifications bullet and its mirror in `Core-Project.txt` state this
  rule as amended by ADR-099 and ADR-102 on 2026-10-21, so no binding source
  contradicts the header. This slice delivers the header's controls and the menu as part of
  the frame and verifies them structurally; the data behind the menu's
  destinations belongs to the slice that owns each destination, while the
  menu's own open and confirm behaviour is exercised at runtime by the slice
  that ships the first page carrying the frame. The sign-in action MUST point
  at the sign-in page at the route the frame's decision record fixes (FR-024),
  so the frame carries no link without a definite target (decided 2026-10-11;
  revised 2026-10-21, Clarifications; revised 2026-10-21, ADR-102). At the
  smallest supported width of 320 CSS px the header MUST keep all four of its
  controls — no control is dropped, folded into an overflow menu, or moved into
  the account menu — with the three inline-end controls icon-only at the touch
  floor the design contract fixes and the logo/home control's wordmark at the
  smallest form recorded for it;
  the header stays one row with no horizontal page scroll. For a
  guest, whose sign-in action replaces the account control and the
  notifications control, the same rule keeps the three controls the guest's
  header carries — the logo/home control, the theme switch, and the sign-in
  action — in that one row, each with its accessible name and its touch target,
  and the header of either ended-session state keeps, under the same rule, the
  controls FR-023 fixes for it, none of them dropped for width
  (decided 2026-10-31, Clarifications; guest rule stated 2026-11-01,
  Clarifications; ended-session states stated 2026-11-01, Clarifications).
- **FR-047**: The account control MUST open a menu carrying exactly three
  items — «حسابي»، «إعدادات»، and «تسجيل الخروج» — and MUST close without action
  when the person dismisses it: by pressing Escape, by activating something
  outside it, or by moving the focus out of it. The focus MUST return to the
  account control in each of those cases. «حسابي» MUST open the Profile page at
  its top, where the account's full name, city, and status — active or blocked —
  are shown, and where no other account field is shown; the mobile number and
  the editable account details belong to the settings section. «إعدادات» MUST open the
  settings section of that same page, where the account details are edited, the
  password is changed, and the action that ends every session of the account at
  once is offered; the two items share the one Profile route the frame's
  decision record fixes, and the settings section is identified by an anchor, so
  no page and no entity is added. «تسجيل الخروج»
  MUST ask for a yes-or-no confirmation and MUST end the session only when the
  person confirms, leaving it untouched when they cancel. The menu is part of
  the frame's composition: its three items, their accessible names and roles,
  its keyboard reachability, the two items' link targets, and the sign-out
  confirmation's markup are verified structurally in this slice, because no
  page here renders the frame; its live open, runtime dismissal, and the
  confirmation's result are verified by the slice that ships the first page
  carrying the frame (R2) under exception `EX-007`; and the destinations the
  two items name — the Profile page and its settings section — with the content
  that page shows, the account's full name, city, and status at its top and no
  other account field, are delivered and verified by the Profile slice (R7),
  which also delivers the settings section's own actions, the deferral being
  recorded as Complexity Tracking row 34 (revised 2026-11-04, Clarifications).
  The menu MUST be
  reachable by keyboard, and each item MUST carry an accessible name and a role.
  When the menu opens, the focus MUST move to its first item, so the menu is
  usable from the keyboard the moment it opens; the focus may then leave it, and
  leaving it closes it without action as this requirement provides (decided
  2026-10-21, Clarifications; revised 2026-10-29, Clarifications; ADR-099,
  ADR-100). While it is open the menu MUST be the frame's topmost surface,
  above the page and the frame's other surfaces, and an activation outside it —
  on the header, the page, or the bottom bar — closes it as the outside
  dismissal this requirement provides and has no other effect: it MUST NOT
  activate the control it lands on, so an activation on a bottom-bar slot closes
  the menu and leaves that slot for the person to activate again, and an
  activation on «المزيد» closes the menu without opening the drawer. The menu
  MUST NOT open while the drawer is open, because the account control sits below
  the drawer's scrim (FR-022; decided 2026-11-02, Clarifications).
- **FR-048**: When a guest activates a sidebar item that names a merchant-area
  destination — Upload Catalog, My Files, Cart, Notifications, Messages, or
  Profile, the six merchant-area destinations of the nine FR-039 fixes — the
  platform MUST take the guest to the sign-in page, because the register gives a
  guest no cart, no upload, no message, and no merchant area; the item itself
  stays present and enabled, because the frame's item list is not varied by role
  (FR-039). The three items that name a public destination — Home, Parts, and
  Catalog — open their own pages for a guest exactly as they do for a merchant.
  The sign-in page is a bare page and the frame is absent from it, and this rule
  adds no page, no route, and no stored state; whether the merchant returns to
  the item they wanted after signing in is a decision of the slice that ships
  the merchant area's pages. The cart control the Parts table shows follows the
  same rule (decided 2026-10-21, Clarifications; ADR-100). Because no page this
  slice ships renders the frame, this rule is verified structurally here and
  its runtime behaviour is verified by the slice that ships the first page
  carrying the frame (decided 2026-10-21, Clarifications).
- **FR-049**: When a request issued from a page that carries the frame is refused
  because the session has ended — by the inactivity timeout, by the absolute
  maximum lifetime, by an explicit sign-out elsewhere, by a platform revocation
  (FR-012), by a sign-out of every device (FR-011), or by a password change or
  reset made elsewhere (FR-013) — or because the
  account is blocked, the platform MUST show an explicit state inside the frame,
  stating that the session has ended and offering the way to sign in again; when
  the account is blocked, that state MUST say so plainly, because the person
  held a valid session and is no longer an unknown caller. The blocked variant
  MUST withhold the way to sign in again, because the block refuses every
  sign-in and FR-014 already refuses to send a blocked merchant to a sign-in
  that cannot succeed, so no control the state carries can fail for the reason
  the state itself reports; the unblocked variant keeps that way (decided
  2026-10-28, Clarifications). In that state the frame's header MUST carry the
  header state FR-023 fixes for that variant, in both its unblocked and its
  blocked form, so no control the header carries can fail for the reason the
  state reports; the sidebar, the bottom bar, and the footer band
  keep their composition (FR-023; decided 2026-11-01, Clarifications). Every path that ends
  a session leads to that one state, so no session-ending path shows an
  unrelated error, and the frame MUST NOT keep sending requests for a
  session that no longer exists. The same state is shown after a merchant signs
  out deliberately from the account menu, so that both ways a session ends lead
  to one outcome. This state is shown only to a person who held a
  valid session, so it is outside the enumeration comparison SC-004 bounds, and
  it introduces no page, no route, and no entity. The state MUST be announced to
  assistive technology when it appears, as an announcement that takes precedence
  over the page's other announcements, because it interrupts work the person was
  doing, and the focus MUST move to the state's
  heading, made focusable programmatically for that purpose, never remaining on
  a control the page carried before the refusal; the blocked variant, which
  carries no way to sign in, lands on the same heading (decided 2026-10-31,
  Clarifications). Because no page this slice
  ships renders the frame, this state is verified structurally here and its
  runtime behaviour is verified by the slice that ships the first page carrying
  the frame (decided 2026-10-21,
  Clarifications; ADR-100; revised 2026-10-22, Clarifications).
- **FR-050**: The administrator application keeps its own shell, and its header
  MUST carry the platform's logo at the inline-start edge and an account control
  whose menu offers «تسجيل الخروج» only, because the administrator application
  has no Profile page and no merchant settings page, so the merchant menu's
  destinations do not exist there. The sign-out control remains available while
  the account is restricted by the forced-password-change requirement, as FR-028
  provides. This slice binds that composition for the
  slice that ships the administrator application (R13) and delivers nothing of it
  here, exactly as it binds the shared frame without rendering it (decided
  2026-10-21, Clarifications; ADR-100; revised 2026-10-22, Clarifications).
- **FR-024**: The frame MUST carry the product's means of reaching the static
  pages (Contact, Privacy Policy, Terms of Use, FAQ). The surface that carries
  them is a footer band inside the frame, below the page's content, shown on
  every page that carries the frame at the frame's wide width — 1024 CSS px and
  up — and absent from every page that does not carry the frame and from every
  narrow viewport, because the footer is part of the frame's composition exactly
  as the header and the sidebar are. The surface is not this slice's choice: the constitution fixes
  it as the footer band (ADR-096), and ADR-127 fixes the band's narrow-screen
  placement, so this slice builds the fixed surface rather than choosing one
  (decided 2026-10-11, Clarifications; revised 2026-10-27, Clarifications). Below
  1024 CSS px the band MUST NOT be rendered, and the same four links MUST sit
  at the bottom of the sidebar drawer, which the bottom bar's «المزيد» slot opens
  (FR-052), so hiding the band never removes the way to the static pages
  (ADR-127; decided 2026-10-27, Clarifications). This slice builds the band
  inside the frame and records a decision record that fixes the route of every
  destination the frame links to — the nine sidebar destinations, the four
  static-page routes, the destination of the header's guest sign-in action, the
  Home destination of the header's logo/home control (already one of the nine),
  the Notifications route of the header's notifications control (already one of
  the nine), and the account menu's destinations, with «حسابي» pointing at the Profile
  route and «إعدادات» at the Profile page's settings section (no route is added
  for «تسجيل الخروج») — and the routes of the three bare pages this slice ships
  (sign-up, sign-in, and password recovery), so every link this slice builds has
  a definite target and the slice that ships the static pages ships them at the
  four routes fixed here rather than choosing routes of its own (decided
  2026-10-11; revised 2026-10-21, Clarifications; revised 2026-10-25,
  ADR-126). The reachability requirement
  itself — that an in-scope static page no in-scope page links to is a defect —
  is discharged by the slice that ships the first page carrying the frame (R2),
  because this slice ships no page that carries the frame and the fixed surface
  therefore renders on no page of its own; this slice builds the surface,
  fixes the four routes, and binds the rule, and the deferral is recorded
  with an owner and a review date (decided 2026-10-21, Clarifications;
  revised 2026-10-27, Clarifications).
- **FR-025**: The frame MUST honour two appearances — dark and light — with a
  control that switches between them, and the chosen appearance MUST hold as a
  person moves between pages. The default appearance on a first visit is light;
  a stored choice wins over it, the choice is per device, and the appearance is
  applied before the page is painted so neither appearance flashes (ADR-137,
  amending ADR-132 decision 3 and restoring ADR-098 decision 4, ADR-102
  decision 5, and ADR-128 decision 16). The chosen appearance MUST apply to
  every page, including the bare pages that carry no frame, and MUST be applied
  before the page is painted so the other appearance never flashes; the switch
  itself remains a frame control, sits in the header's inline-end group:
  immediately beside the notifications control in the signed-in merchant's
  header, and in the same position of that group in the three other header
  states FR-023 fixes, where the notifications control is absent; the switch is
  not offered on a bare page. The choice
  MUST be remembered in the browser the person is using (per device) and MUST
  NOT be stored on the account, so no entity gains an appearance field. The
  appearance's surfaces, backgrounds, and colours are fixed design values, not
  a product setting: neither a merchant nor the administrator chooses a
  background or a colour, and no such preference is stored on the account or in
  the platform's settings (decided 2026-10-21, Clarifications; ADR-098; ADR-128;
  revised 2026-10-21, ADR-102; revised 2026-10-27, ADR-132; revised 2026-10-28,
   ADR-137).
- **FR-026**: Every page MUST be presented in Arabic and right-to-left, with
  Latin numerals, and every icon MUST come from the product's icon set and MUST
  NOT be an emoji. The frame this slice delivers is composed into every page that
  carries it, so its labels, its state messages, and its accessible names MUST
  follow the same language, numeral, and no-emoji rules, and its components MUST
  set no direction or language of their own, inheriting the document's (decided
  2026-11-02, Clarifications). The body of every message the platform sends by SMS MUST
  follow the same language, numeral, and no-emoji rules, because it is
  user-facing text; it carries no icon, so the icon rule does not apply to it
  (decided 2026-10-11, Clarifications). The language and numeral rules bind the
  text the platform itself writes — its labels, its messages, and the numerals
  it generates — and MUST NOT reach a value a person supplies: the full name and
  the optional shop name are shown as typed, in their own script and digits,
  never transliterated or re-numeralised (FR-001, FR-045). The no-emoji rule
  reaches further: it covers every text a person reads inside the platform, a
  supplied value included, so a value carrying an emoji MUST be refused at input
  with an explicit message naming the reason, never displayed, stripped, or
  rewritten (FR-001). The rule's subject is pinned here, once, so the refusal
   is testable without judgement: a value carries an emoji when it contains a
  code point with the Unicode property `Extended_Pictographic` — the
  regional-indicator code points that form a flag are among them — or the
  variation selector U+FE0F, which exists only to request emoji presentation,
  or the combining encloser keycap U+20E3, which completes the keycap forms
  the property alone does not name; a numeral or a letter typed without any of
  the three is never an emoji under it, so FR-001's "letters and numerals
  alike" stands unchanged (decided 2026-11-01, Clarifications). The mobile
  number and the one-time code are structured
  values the platform parses and renders in their canonical Latin-numeral form
  (FR-031, FR-038), so the numeral rule governs what the platform renders and
  never what a person types (decided 2026-10-31, Clarifications). The text the
  platform itself writes carries no diacritics: a combining mark in the range
  U+064B–U+0652, or the superscript alef U+0670, in a label, a message, or a
  message body is a defect, with no closed exception list, so a mark never
  distinguishes a correct string from a broken one and the string scan decides
  it; the rule binds that text alone, so an entry in the fixed city list keeps
  the form it carries while its search still ignores diacritics (FR-005), and a
  value a person supplies keeps the script and the marks it was typed with
  (FR-001; decided 2026-11-02, Clarifications). The Latin characters that text
  may carry are a closed set as well: the digits 0–9, the `+218` prefix, and the
  exact token `SMS`, with Principle V's four product-wide names — PDF, Excel,
  OEM, SKU — permitted for the whole product but used nowhere in this slice's
  copy; any other Latin letter sequence in user-facing text is a defect unless a
  recorded decision adds it, and a template's `{code}` placeholder is not
  user-facing text because it is replaced by Latin digits before rendering
  (decided 2026-11-02, Clarifications). The same
  right-to-left direction governs a label that does not fit the surface carrying
  it, and the rule is stated once here for the frame's labels — the sidebar's
  nine navigation items in the full sidebar and in the narrow-screen drawer, and
  the bottom bar's five slots at 320 CSS px. In the surfaces it governs that render
  the label — the full sidebar, the drawer, and the bottom bar's slots — a label
  that does not fit MUST stay on one line: it MUST NOT wrap to a second line,
  MUST NOT be abbreviated, and MUST NOT be dropped so that the control shows its
  icon alone. Its overflow is directed to the inline-end — in the right-to-left
  interface the end of the label and the cut fall at the left — so the label's
  beginning is never clipped, the cut is marked by the ellipsis «…» at that end,
  and the label is clipped by its own slot rather than by the
  surface's edge: it MUST NOT widen the slot, intrude into a neighbouring slot,
  or produce horizontal page scroll. Truncation MUST NOT leave a partial
  numeral, and a Latin numeral inside an Arabic label keeps its Latin digit
  order and its own direction. The whole label MUST survive the cut: its
  complete text stays in the markup, and clipping the visible line shortens no
  control's accessible name — a name the label provides carries the label's
  whole text, and a name this specification fixes separately is not shortened at
  all. In the icon-only rail at its narrowest — the width FR-022 delegates
  — no visible label is rendered at all, because that rail is icon-only
  at every width rather than as an overflow measure, so nothing is truncated
  there and each item keeps its whole label as its accessible name (decided
  2026-11-02, Clarifications). Because this is a rendering rule, this slice's
  structural
  verification asserts the whole accessible name of each of the nine items and
  the five slots, and the whole text of every label those surfaces render,
  while the truncation itself is verified by the slice that ships the first page
  carrying the frame (R2), at the same boundary as the frame's other runtime
  behaviour (ADR-128).

  **The recorded text.** The literal text this slice delivers is one fixed design
  value recorded once for the slice, not a value this specification fixes: every
  page, component, and message template MUST render the text recorded for its
  state, reason, or cause, composing no sentence of its own, so the same cause
  renders the same text wherever it appears. No text MUST name a state this
  specification does not have: the sign-in page's copy MUST name neither the lock
  (FR-009) nor the blocked status (FR-017) and MUST show no countdown, and a
  status- or role-specific string MUST appear only on a surface where this
  specification defines that state (FR-006, FR-014, FR-049). The record is one
  fixed design value, the single authority for every string; a capture is
  evidence of composition and appearance only and governs no string, and where a
  capture and the record differ the record wins (decided 2026-11-04,
  Clarifications; AC-028 asserts the identity this requirement states).

**The administrator account**

- **FR-027**: System MUST NOT let anyone become an administrator through the
  public sign-up flow, and MUST NOT let an administrator account sign in on the
  merchant sign-in surface: such an attempt MUST receive the uniform refusal
  FR-008 defines.
  The administrator
  signs in only on the administrator's own surface, which arrives with a later
  slice (decided 2026-10-11, Clarifications). The same boundary governs password
  recovery: the merchant recovery flow MUST NOT set a new password on an
  administrator account, and MUST refuse after the code is verified as FR-014
  states (decided 2026-10-11, Clarifications). The role rule governs whatever
  the account's status is: a blocked account that holds the administrator role
  is refused on the role ground, never completed on the blocked ground, so the
  merchant surface sets no credential on an administrator account in any state
  (FR-014; decided 2026-10-29, Clarifications).
- **FR-028**: System MUST create the administrator account only by an
  operator-run provisioning action, and MUST require the administrator to change
  the password at first sign-in: the first sign-in is accepted, and the account
  is then restricted so that no product action other than the password change is
  permitted until the change is made. The restriction withholds every action that
  needs the account's ordinary permissions, but it MUST NOT withhold the password
  change itself or ending the session: sign-out, the session timeout, and a
  platform revocation all remain available, so the administrator application's
  sign-out control (FR-050) stands for a restricted account (decided 2026-10-22,
  Clarifications). That requirement is cleared by the change
  performed while the account is restricted — the change made at that first
  sign-in — and it is cleared by no other path: the restriction lifts at that
  point and the account is thereafter unrestricted, because an administrator's
  credential is reachable only on the administrator's own surface, the recovery
  flow refusing it (FR-014) and the merchant sign-in surface refusing it
  (FR-027) (decided 2026-10-11, Clarifications). The value that first change
  sets MUST differ from the initial password the operator supplied: a
  submission that repeats it MUST be refused and MUST NOT clear the
  requirement, because a forced change that sets the same value would leave the
  requirement unsatisfied (decided 2026-10-22, Clarifications). The forced change
  MUST also require the current password — the initial password the operator
  supplied — exactly as FR-013 requires of the account's own change action: a
  submission without the current password, or with a wrong one, MUST be refused,
  MUST clear nothing, and MUST leave the account restricted, and a failed check is
  a failed password verification under FR-009; while the account is locked, that
  check is refused under FR-009 for the lock's full duration, exactly as the
  account's own change action's check is, the restricted session remains
  available to end, and the forced change resumes when the lock lifts (decided
  2026-10-28, Clarifications); the fresh sign-in is not treated as
  proof for this purpose, so a restricted session that is taken over cannot set a
  new password without the current password (decided 2026-10-22,
  Clarifications). The value rules — the password policy and the rule that the new
  value must differ from the initial password — are decided before that
  current-password check, so a submission refused on either ground clears
  nothing, leaves the account restricted, and does not increment the
  count of consecutive failed password verifications; only a submission that passes them reaches
  the check, and a failed check counts under FR-009 (decided 2026-10-28,
  Clarifications). The provisioning action MUST create the
  account directly, with the status active and the administrator role: it sets
  the account's full name, Libyan mobile number, city,
  and an initial password the operator supplies — which MUST satisfy the same
  password policy FR-035 requires, because a password is being set — and it sends
  no one-time code and performs no verification step, because
  the mobile-number verification rule governs the public sign-up flow alone
  (decided 2026-10-11, Clarifications). The account and the initial password that
  makes it usable MUST come into existence as one indivisible step: the action
  MUST NOT produce a provisioned account before, or without, the credential that
  makes it usable, so a failure to set the initial password MUST leave no account
  behind — the run fails as a whole and MUST report the failure to the operator —
  and no provisioned account ever exists that no password can open (decided
  2026-11-02, Clarifications). The initial password MUST be handled as a secret
  on every step: the action MUST take it only through a hidden prompt or an input
  stream the operator supplies directly — never as a value carried in the command
  that starts the action, never from an environment variable, and never from a
  stored configuration file — so the credential appears in no command history
  and in no process list, and it MUST NOT read it from, or write it to, any file
  the platform keeps. It MUST NOT echo it as it is entered, MUST NOT display or
  repeat it in any output the action produces — its success report included —
  and MUST NOT write it to a log, a security record, an error message, or a
  diagnostic output; the report the operator receives names only the account and
  the outcome. The operator MUST hand the credential to the administrator
  through a channel the operator controls outside the platform, and no page, no
  one-time-code message, and no security notice may carry it; the platform MUST
  NOT display, transmit, or offer to retrieve it again after the run (decided
  2026-11-02, Clarifications). The action MUST NOT set the status to
  blocked: the closed set's other value is reachable only through the
  administrator's Users page (R13), so the forced first sign-in is never refused
  by a status the action itself set (decided 2026-10-28, Clarifications). The values it sets MUST satisfy the same
  account field rules sign-up applies — the full name present and within its
  bounds (FR-001), the mobile number a Libyan mobile number on +218 decided
  against the fixed prefix dataset (FR-003), and the city drawn from the fixed
  list (FR-005) — because those are account rules rather than rules of the public
  path; only the one-time-code verification (FR-004) is bounded to public
  sign-up, and a value that fails any rule MUST be refused, with the refusal
  reported to the operator and no account created (decided 2026-10-11,
  Clarifications). The action is repeatable: each run
  creates a distinct administrator account, and the platform MUST introduce no
  cap on how many administrator accounts exist, because the register states
  none. Uniqueness is enforced on the normalised mobile number exactly as FR-031
  requires for any account, so a run for a number that already has an account
  MUST create nothing and MUST report the conflict to the operator, who is
  running the action out of band (decided 2026-10-11, Clarifications). This
  slice delivers the provisioning action, and it delivers the administrator's
  first sign-in as behaviour with no page, exactly as FR-013 delivers the
  account's own change-password action: the first sign-in is accepted, the
  account is restricted so that nothing but the password change is permitted
  among the product actions that need its ordinary permissions, while ending the
  session remains available, and the change made at that first sign-in clears the requirement and lifts
  the restriction, so the rule is exercised here rather than asserted of a path
  that does not exist; only the administrator's sign-in surface — the page — is
  delivered by a later slice, and this slice creates no page for it (decided
  2026-10-22, Clarifications). The provisioning action is out of band:
  it is run by the platform's operator outside the product's role model and
  outside the administrator application, so it is not an administrator operation
  and writes no audit-log row — the audit log records the operations an
  administrator performs through the administrator application, which arrives
  with a later slice — and this slice records the provisioning through the
  structured security record FR-037 names (decided 2026-10-11, Clarifications).

**Resisting automated abuse**

- **FR-029**: System MUST protect the sign-up form against automated submission
  by a hidden field a person leaves empty, a minimum time between the platform's
  serving of the form and its submission, measured on the platform's own clock,
  and a limit on how often one client may submit. The
  client is identified by its network origin — the request's origin — and
  the limit is applied per operation (decided 2026-10-11, Clarifications; revised
  2026-10-21, Clarifications). That
  budget is keyed both on the network origin and on the normalized mobile number
  the form submits, so requests from a shared address spend no other number's budget
  and repeated submissions for one number are bounded on their own (decided
  2026-10-11, Clarifications). The number key is global to the number on FR-033's
  terms: once that number's account-creation budget is spent, a submission for
  it from any origin is refused with the same distinct, explicit limit refusal,
  while every other number stays unaffected (decided 2026-10-28, Clarifications).
  When the form's submitted value has no normalized form, only the origin key
  applies, exactly as FR-033 provides, so a malformed value spends no number's
  budget (decided 2026-10-28, Clarifications). A
  submission refused by the hidden field MUST be refused silently: the platform
  returns the same response a successful submission receives, so nothing in the
  response tells the sender it was detected, and no account is created. That
  refusal MUST do nothing further: it MUST NOT start a pending request, MUST
  NOT dispatch a one-time code to the submitted number, and MUST NOT reach the
  code step, so the form cannot be turned into a way to send SMS to numbers the
  submitter does not control; the silence is a guarantee about the response
  alone, and the flow stops at that response, so the absent code is a
  consequence of the refusal rather than a signal of it. What the person is
  then left on is the form's first step again: no pending request exists for
  the page to resume (FR-038), so the code step is not reached and the person
  stays in the form they submitted. The response MUST carry no next-step
  content, so the same response can lead a successful submission to the code
  step and this refusal to the first step; the response's shape is fixed
  so both hold, and the silence stays a guarantee about the response's text,
  status, and headers (decided 2026-11-01, Clarifications; revised 2026-11-02,
  Clarifications). The refusal MUST NOT be observably faster than the 202 a
  successful submission receives: full equality with that response's channel
  acceptance wait is not promised, because this refusal dispatches nothing
  (FR-034) and a wait imitating the channel would make the refusal the slower of
  the two and break the response budget, so the refusal performs the same work a
  success performs before the dispatch, on a discarded copy, and the shortfall
  MUST NOT exceed a median of 50 ms and a p95 of 150 ms over the same repeated
  sampling the enumeration test uses, with the wait it observes tracking the
  channel's own current acceptance duration rather than a constant (decided
  2026-11-02, Clarifications). The
  timing rule FR-006 states for the account-existence case is not extended to it.
  A submission refused by the
  hidden field or by the minimum time-to-submit MUST still consume the
  account-creation budget FR-033 keys, because that budget is applied to every
  submission of the form itself; the honeypot therefore cannot be
  turned into an unbounded entry point, while the refusals themselves are
  unchanged and the budget's own refusal stays the distinct, explicit limit
  refusal (decided 2026-10-11, Clarifications; revised 2026-10-29,
  Clarifications). The budget is the form's own submission alone: the code
  step's entry and its re-request control are not counted against it, because
  the re-request limit is its own (FR-034) and the entry is bounded by the
  incorrect-entry bound, exactly as FR-033 provides (decided 2026-10-29,
  Clarifications). A submission refused by
  the minimum time-to-submit MUST receive an explicit, retryable refusal, because
  a real person may legitimately submit quickly; no account is created in either
  case. The minimum time MUST be measured from a value the platform itself
  issues when it serves the form, never from a value the submitter supplies: the
  platform issues that value with the form's rendering, binds it to the sign-up
  form so a value issued for another surface cannot satisfy this rule, and reads
  its issuance time back against the platform's own clock, so a submitter can
  neither set the starting point nor move it, and a clock under the submitter's
  control never shortens the interval. A submission whose value is absent,
  malformed, not one the platform issued, or outside the platform's stated
  validity window MUST be refused exactly as a submission made before the
  minimum time is refused — explicitly and retryably — and no account is created
  in any of those cases. Because the interval begins no later than the moment the
  platform serves the form, the time a slow page load takes to bring the form
  onto the screen counts toward the interval and never against it, so a slow load
  cannot produce a false refusal (decided 2026-11-02, Clarifications). A submission refused by the rate limit MUST receive a distinct, explicit
  refusal stating that the limit was exceeded and that the person may retry
  later, on the rate-limit exception SC-004 states (decided 2026-10-11,
  Clarifications).
- **FR-030**: System MUST NOT use CAPTCHA anywhere in the platform.
- **FR-033**: System MUST apply a rate limit to every authentication operation —
  account creation, sign-in, and password recovery — so that one client cannot
  submit any of them without bound. Each of the three operations MUST carry its
  own limit, so exhausting one operation's budget MUST NOT block another and a
  client cannot deny a legitimate merchant sign-in by exhausting the sign-up
  budget (decided 2026-10-11, Clarifications). The sign-up form's own limit
  (FR-029) is the account-creation operation's limit: one budget governs
  account creation, keyed as this requirement states, and the form carries no
  second, overlapping budget:
  that budget counts every submission of the form itself, including one the
  form's own hidden field or minimum time-to-submit refuses, so the honeypot is
  not an unbounded entry point. It is consumed by the request that starts an
  operation alone — the sign-up form's submission, the sign-in submission, and
  the password-recovery request — while the later steps of the same page, the
  one-time-code entry and the new-password submission, neither consume it nor
  are refused by it when it is spent, because they are bounded by FR-034's
  incorrect-entry bound and limit on requesting a new code; FR-051's step (1)
  therefore decides the initiating request alone (decided 2026-10-11,
  Clarifications; revised 2026-10-29, Clarifications). The client is identified the same
  way FR-029 fixes — by the request's network origin — and each budget is
  additionally keyed on the normalized mobile number the request submits, so each
  origin carries its own budget for each of the three operations and each
  submitted number carries one as well: exhausting the origin key refuses that
  origin's further requests alone, while exhausting the number key refuses further
  requests for that number from every origin, because the number key is global to
  the number; every other number stays unaffected, and another origin remains able
  to submit every other number, so requests for one number spend no other
  number's budget and a change of origin does not evade a number's
  spent budget. The refusal is the same distinct, explicit limit refusal
  whichever key produced it (decided 2026-10-11, Clarifications; revised
  2026-10-28, Clarifications). A refusal produced by one of these limits MUST be distinct and
  explicit — it states that the limit was exceeded and that the person may retry
  later — and it is not the uniform refusal FR-008 defines, on the rate-limit
  exception SC-004 states (decided 2026-10-11, Clarifications). The retry that
  refusal invites MUST carry no interval of its own: whether a later attempt is
  accepted is decided by the limit's own window alone, whose boundary the recorded
  values fix, and the response MUST carry the remaining time to that boundary as a
  machine-readable value, so an operator and a page state the same moment rather
  than a second number the page invents. The refusal's visible message MUST NOT
  show a countdown or a timer: it states that the limit was exceeded and that a
  retry may be attempted later, and the page renders no retry time of its own
  (decided 2026-11-04, Clarifications). When the submitted
  value is not a valid Libyan mobile number on +218 and therefore has no
  normalized form, only the network-origin key applies: the number key exists
  only for a value that normalizes, so such a value MUST NOT spend any number's
  budget and a spent number key MUST NOT refuse it; the submission still
  consumes the origin's budget for its operation, because the rate limit is
  decided before the value rules (FR-051), and the refusal it then receives is
  decided by the remaining steps of that order — the distinct format refusal
  FR-042 names at sign-in and in password recovery, or, at sign-up, the hidden
  field, the minimum time-to-submit, or the value rules deciding in that order,
  the format refusal among them — unless that origin's own
  budget is spent first (decided 2026-10-28, Clarifications; aligned with the
  widened FR-042 on 2026-11-01, Clarifications).
- **FR-034**: A one-time code — sent at sign-up or for password recovery — MUST
  expire after a period, MUST be re-requestable subject to a limit on how often a
  new code may be requested, and MUST be refused after a bounded number of
  incorrect entries. The limit on requesting a new code MUST be counted per
  pending request: a fresh sign-up or recovery request for the same number MUST
  begin a new verification with a full allowance, because the operation's own
  budget (FR-033) already bounds how often a fresh request can start, and the
  spent allowance MUST NOT be carried across requests (decided 2026-10-28,
  Clarifications). A request refused by the limit on requesting a new code MUST
  receive a distinct, explicit refusal stating that the limit was exceeded and
  that the person may retry later; that refusal is excluded from SC-004's
  enumeration comparison on the re-request exception SC-004 states. That refusal
  MUST NOT carry an interval of its own either: the pending request's own clock
  and the limit's allowance decide when a new request is accepted, the response
  carries the remaining time to that boundary as the same machine-readable value,
  and the refusal's visible message shows no countdown, so the page states no
  retry time of its own (decided 2026-11-04, Clarifications). The bound on requesting a new code
  is its own and sits above FR-033's per-operation budgets: requesting a new code
  neither consumes nor is bounded by the account-creation or the recovery budget,
  so a merchant who mistypes a code and asks for a new one cannot spend the
  operation's budget (decided 2026-10-11, Clarifications). Exactly one code is
  valid for a verification at any moment: a request for a new code MUST take
  effect only once the messaging channel has accepted the new message, and at
  that moment it MUST invalidate the previous code at once; the installation of
  the replacement's protected value and the invalidation of the previous code
  MUST be one indivisible step, so a failure between them leaves the previous
  code valid, the pending request unchanged, and the limit on re-requesting
  untouched (decided 2026-11-04, Clarifications); a request the channel
  refuses at acceptance MUST leave the previous code as the one valid code, the pending request
  live, and the limit on re-requesting untouched, so a moment with no valid code
  never arises and a channel outage does not cost the person the code they
  already hold (decided 2026-10-22, Clarifications). The accepted dispatch MUST
  also start the pending request's lifetime afresh: the request and the
  replacement code get the full period already fixed, so a
  new code is never delivered with only the remainder of the request it
  replaced, and the limit on requesting a new code is what bounds repeated
  extension; a dispatch the channel refuses changes neither the code nor that
  expiry (decided 2026-10-24, Clarifications). The code MUST be held only in an
  irreversibly protected form: the pending request carries the protected value
  computed when the code is dispatched, and an entered code MUST be verified
  through that same form alone, so the store never holds a usable code in
  plaintext; a replacement's protected value replaces the previous one at the
  accepted dispatch, and the value is discarded when the request is replaced or
  ends (decided 2026-10-29, Clarifications). The bound on
  incorrect entries MUST be counted over the whole verification, not per code, so
  that a new code does not reset it, and it MUST count only a wrong value entered
  for the code that is currently valid: an expired code, and a code that a
  replacement has superseded, MUST be refused as expired or superseded and MUST
  NOT increment the bound, because neither is a wrong guess of the live code, so
  a stale code cannot lock a person out and the count measures exactly the
  guesses the bound exists to stop (decided 2026-10-22, Clarifications). The
  bound MUST also hold in aggregate for one normalized mobile number: the
  platform MUST apply a ceiling on incorrect code entries for that number over
  the same window the per-operation budgets use, equal to the product of the
  incorrect-entry bound and the number of fresh requests the number-keyed
  budgets allow for it across both code paths in one window, so the per-request
  bound cannot be multiplied by starting fresh requests, and the ceiling MUST be
  stated numerically in the recorded values. The ceiling is produced
  by those two limits rather than by a third refusal: a person reaches it only
  by starting a fresh request, and the fresh request that would exceed it MUST
  be refused by the number's budget with the distinct limit refusal FR-033
  states, so no separate ceiling refusal, message, or state is introduced and
  the code entry neither consumes nor is refused by an operation's budget,
  exactly as FR-033 provides. The ceiling follows the window those budgets use
  and therefore resets at that window's boundary with them, and it holds across
  re-requests because a new code does not reset the count of incorrect entries
  (decided 2026-11-02, Clarifications). The platform MUST also bound the
  one-time-code messages it dispatches to one normalized mobile number: over the
  same window the per-operation budgets use, it MUST NOT dispatch more
  one-time-code messages to that number than the product of the dispatches one
  pending request allows — its first dispatch and the limit on requesting a new
  code — and the fresh requests the number-keyed budgets allow for it across both
  code paths, and that ceiling MUST be stated numerically under Constitution
  Mandated Values. The ceiling is produced by those two limits rather than by a
  third counter, exactly as the aggregate incorrect-entry ceiling is: a pending
  request cannot dispatch past its re-request limit and a number cannot start a
  seventh fresh request in the window, so no separate message ceiling, refusal,
  message, state, or counter is introduced, and the ceiling resets at that
  window's boundary with the budgets that produce it. It counts the dispatches
  the messaging channel accepted, because a message the channel accepts is a
  successful send from the platform's side however it is later delivered, as this
  requirement already states: a dispatch the channel refuses at acceptance — the
  request timeout treated as a refusal included — sends nothing from the
  platform's side and does not count against the ceiling, while a message such an
  attempt may nevertheless have delivered is outside the platform's observation,
  exactly as a later delivery failure is. The ceiling governs the one-time-code
  messages alone; the security notices FR-043 requires are outside it, because
  they follow an authenticated action on the account and go to the number that
  account holds, so no caller who does not control the account can reach them
  (decided 2026-11-02, Clarifications). The
  literal Arabic text of the refusal an expired or superseded code receives is
  not a specification value: it is the fixed design value FR-026 records once
  for the slice, presented in Arabic with Latin numerals and
  no emoji; no acceptance criterion restates the string — AC-028
  asserts that the rendered text is the text recorded for its cause, and AC-036
  asserts that the same case receives the same text (decided 2026-10-27,
  Clarifications; authority and identity recorded 2026-11-04, Clarifications). Exactly
  one pending request MUST also be
  live per mobile number: a new sign-up or recovery request for a number that
  already has a live pending request MUST replace the previous one and
  invalidate its code once the messaging channel accepts the new message — the
  same dispatch condition the replacement of a code carries above — so a request
  the channel refuses at acceptance leaves the previous pending request and its
  code live and produces the explicit, retryable failure this requirement states
  (decided 2026-10-11, Clarifications; revised 2026-11-01, Clarifications). The
  replacement of the pending request MUST also take effect in one indivisible
  step: installing the new request and invalidating the previous one's code
  happen together, so a failure between them leaves the previous request and its
  code live and produces the explicit, retryable failure this requirement states
  (decided 2026-11-04, Clarifications). The
  replacement reaches every state of the pending request, including the recovery
  flow's verified state: a new request for a number whose pending request is in
  that state MUST, once the new message is accepted, end the verified state and
  withdraw its authority to set a password, so only the new code step is live and
  two authorities never coexist for one number (decided 2026-10-22, Clarifications). When the messaging
  channel refuses a code at acceptance — a failure at the channel, or a number the
  channel refuses because it cannot deliver to it — the platform MUST show an
  explicit failure state that allows a retry, MUST keep the pending request valid
  until its own expiry, MUST leave the code already delivered valid — the
  replacement takes effect only once the channel accepts the new message — and
  MUST NOT count the failed send against the limit on requesting a new code. A
  message the channel accepts is a successful send from the platform's side even
  if it is never delivered: a later delivery failure is outside the platform's
  observation, MUST NOT produce that failure state, and does not by itself
  invalidate the code, so a person who does not receive an accepted message can
  request a new code subject to the limit on re-requesting (decided 2026-10-22,
  Clarifications). One rule governs both code paths — the code sent at sign-up
  and the code sent for password recovery — so the pending request, whether it is
  a sign-up or a password reset, expires on the same terms and behaves identically
  when a send is refused at acceptance (decided 2026-10-11, Clarifications).
  The send is attempted inside the request that asks for the code, and the code
  step is reached only once the messaging channel has accepted the message: one
  failure state serves both dispatches, and the step that asked for the message
  is the step that shows it — a fresh request's refusal at acceptance produces
  that explicit, retryable failure on the form's submission itself, which keeps
  the person on the first step with the code step never reached, while a
  re-request's refusal at acceptance produces the same failure on the code step
  that asked for the new code, which keeps the person on that step with the code
  they already hold and lets them retry there — so no failure reaches a step that
  did not ask for the message, and the failure state stays the one this
  requirement already describes rather than a second state for the code step
  (decided 2026-10-11, Clarifications; revised 2026-11-02,
  Clarifications). The wait for that acceptance MUST be bounded by the platform's
  request timeout: a wait that reaches that bound MUST be treated as a refusal at
  acceptance — the same explicit, retryable failure in the placement stated above,
  the pending request live, a code already delivered still valid, and no part of
  the limit on requesting a new code consumed — because a channel that neither
  accepts nor refuses must not leave the request waiting without a bound or the
  person at a code step for a message that was never accepted (decided 2026-10-28,
  Clarifications).
  When the bound on incorrect entries is reached the pending request MUST end,
  and the person MUST start a fresh request — a sign-up or a recovery — which
  begins a new verification and counts incorrect entries from zero; the platform
  MUST NOT leave a live request that can never be completed. That fresh request
  replaces nothing still live, because the request that ended at the bound is
  already gone; the dispatch condition this requirement states for a request
  that replaces a live one still governs it, so it takes effect once the
  messaging channel accepts its own message. A fresh request whose message the
  channel refuses at acceptance MUST therefore produce the explicit, retryable
  failure on the form's submission itself, MUST leave no code valid — the ended
  request left none — and MUST NOT consume any part of the limit on requesting a
  new code, which the fresh request begins with a full allowance
  (decided 2026-10-11 and 2026-11-02, Clarifications). That failure state — on
  the form's submission at a fresh request and on the code step at a re-request,
  because one failure state serves both dispatches — is excluded from SC-004's
  enumeration comparison on the channel-failure exception SC-004 states (decided
  2026-11-02, Clarifications). When the bound is reached the page MUST
  also return to the flow's first step with an explicit, retryable notice that
  the request ended and that a new code must be requested, so the person is
  never left on a step whose request has ended (decided 2026-10-28,
  Clarifications). The pending request's own expiry MUST end the code step the
  same way: when its lifetime elapses while the person is still on the code
  step, the step MUST end at that moment and the page MUST return to the flow's
  first step with an explicit, retryable notice that the request expired and
  that a new code must be requested — the same in-place ending FR-014 states
  for the recovery flow's verified state, with no navigation, no new route, and
  no new page — and a code submitted after that moment MUST be refused on that
  same expired ground and MUST NOT increment the bound on incorrect entries,
  exactly as an expired code is refused above, so no one is left on a step whose
  request has ended and no code is accepted for a request that has expired
  (decided 2026-11-02, Clarifications). An abandoned request MUST end on the
  same terms with no one present: when its lifetime elapses after a code was
  requested and the person never returns, the pending request MUST have ended at
  that moment and MUST leave no account and no session behind, because neither
  exists before the correct code is entered (FR-004) (decided 2026-11-02,
  Clarifications). When the correct code is entered but the
  account cannot be created at that moment — a transient failure — the pending
  request MUST stay valid until its own expiry and the correct code MUST stay
  usable, because at sign-up a code is consumed only once the account is
  actually created;
  the person MUST see an explicit, retryable failure state, and that failure MUST
  NOT count against the bound on incorrect entries (it was not an incorrect
   entry) nor against the limit on requesting a new code. The account's
  creation and the session that makes it usable are one indivisible step: a
  failure at that point MUST leave no account, MUST end no pending request, and
  MUST keep the code usable, so an account never exists without the session that
  makes it usable and the confirmation FR-004 requires is never shown for an
  account the merchant is not signed in to (decided 2026-10-28, Clarifications).
  This rule is distinct
   from the send-failure rule above, which governs a code the channel refused at
   acceptance; a message the channel accepted but did not deliver is not that
   failure, as the rule above states (decided 2026-10-11, Clarifications). In the
   password-recovery flow the
  correct code MUST end its own validity at once, and the pending request MUST
  end when the new password is set, when a new request replaces it, or when the
  account's password changes by another path (FR-014), so a verified code cannot
  authorise a second reset and a reset authority created before a password change
  never survives it (decided 2026-10-22 and 2026-10-29, Clarifications). The same rule governs the sign-up
  path's own outcome: when the correct code is entered for a number that already
  has an account, the pending request MUST end once the outcome is stated, so no
  live request survives an outcome the platform has already reported
  (decided 2026-10-22, Clarifications).
- **FR-051**: When more than one refusal applies to a submission, System MUST
  decide them in one fixed order, applied on every page this slice ships, each
  page owning the rules it applies:
  (1) the operation's rate limit, decided for the request that starts the
  operation — the sign-up form's submission, the sign-in submission, or the
  password-recovery request — and refused with the distinct, explicit limit
  refusal (FR-033), while a later step of the same page (the one-time-code entry
  or the new-password submission) is not decided by it and is bounded by
  FR-034's own limits; (2) at sign-up only, the form's hidden field, refused
  with the silent response whose flow stops at it (FR-029); (3) at sign-up only,
  the minimum time-to-submit, refused with the explicit, retryable refusal
  (FR-029); (4) the value rules each page owns — the mobile-number format on
  every one of the three pages (FR-042, FR-003), the full-name and shop-name
  bounds and their no-emoji rule (FR-001, FR-026) and the city-list rule
  (FR-005) on the sign-up form, and the password policy (FR-035) wherever a
  password is set, which on these pages is the sign-up form and the
  new-password step of the password-recovery flow alone — the sign-in form sets
  no password, so it applies no password rule, states no requirement of the
  policy, and its only value rule is the number's format, a value that would
  fail the policy being a wrong password there and receiving the uniform
  refusal FR-008 defines; and (5) the account-existence comparison — which at
  sign-up continues the flow identically rather than refusing (FR-006), and in
  password recovery likewise continues identically and sends the code (FR-015),
  the outcome being stated only after the code is verified; at sign-in alone it
  is refused with the uniform refusal FR-008 defines (FR-008; revised
  2026-11-01, Clarifications). Four refusals are decided before any page step
  and sit outside this five-step order: the request's forgery and origin check
  (FR-044), its body-size bound, its method, and an unknown route. Each is
  answered before step (1) is reached, so no page rule in this order runs on a
  request any of them refuses, and the order begins only with a request they
  admit (decided 2026-11-05, Clarifications). A submission refused at a
  step MUST be decided by that step alone: no later check runs and no earlier
  refusal is replaced. Within step (4) every failing value rule MAY carry its
  own message and several MAY be reported together, but no account-existence
  comparison runs until every value rule has passed. The order is observable
  and MUST be asserted, because a client's refusal depends on it; it narrows no
  response's uniformity: a value-rule refusal is the same whether or not the
  number has an account, so SC-004 still compares it, while the limit, format,
  and re-request refusals stay outside that comparison exactly as their own
  requirements provide. The order introduces no
  refusal beyond those this specification already names (decided 2026-10-22,
  Clarifications). The responses the order produces are enumerated once in the
  refusal catalogue at the end of this section, each with its kind, placement,
  and retry decision (decided 2026-11-04, Clarifications).
- **FR-052**: The frame MUST carry the bottom bar as its fourth surface
  on a narrow screen. It MUST be shown below 1024px and absent from 1024px up,
  and MUST carry five slots — Home, Upload Catalog, a raised search action that
  opens the Parts page, My Files, and «المزيد» (ADR-127). «المزيد» MUST open the
  sidebar drawer and MUST NOT be its close control; the collapse control inside
  the drawer closes it (FR-022), and the header carries no drawer control
  (FR-023), so one control opens the drawer and a different one closes it
  (ADR-127). The drawer also closes on Escape and on an activation outside it,
  with the focus returning to «المزيد» (FR-022; decided 2026-10-28,
  Clarifications). While the drawer is open the bar MUST stay rendered and
  visible, and «المزيد» MUST show its open state, because the slot is the
  drawer's opener and the focus's return target; opening the drawer is not a
  downward page scroll and scrolling inside the drawer still does not count, so
  the scroll rule MUST NOT hide the bar under an open drawer (decided
  2026-10-31, Clarifications). The bar MUST sit above the page's content and
  below the drawer and the account menu: the drawer's panel ends at the bar's top
  edge and its scrim covers the bar, so while either surface is open the bar stays
  rendered and visible and its slots receive no activation — an activation on a
  slot closes the open surface as an outside dismissal and does not perform the
  slot's action, so the person activates the slot again once the surface has
  closed (FR-022, FR-047; decided 2026-11-02, Clarifications).
  The bar MUST hide after 32px of cumulative downward scroll and MUST
  return on the first 16px of upward scroll or within 56px of the top. The top is
  the page's own vertical scroll origin: the distance is the page's scroll offset
  from that origin in CSS pixels, measured on the page's scrolling element and
  not on the drawer's or any other surface's scroll, so the bar is within 56px of
  the top whenever that offset is 56px or less, whatever the header's height or
  the first content element's position (decided 2026-11-02, Clarifications). The
  return rule wins wherever the two thresholds overlap: at an offset above the
  origin but within 56px of it the bar MUST stay visible, so a page whose whole
  scroll range is 56px or less never hides it and a page that cannot scroll at
  all keeps it visible (decided 2026-11-02, Clarifications). The transition is
  220ms with no fade, `prefers-reduced-motion` MUST stop the slide and keep the
  bar visible, scrolling inside the drawer MUST NOT count, and the page MUST NOT
  reserve the bar's height while it is hidden. The raised search action MUST
  travel with the bar (ADR-132), and while the bar is hidden it MUST be hidden
  with it: the bar and every slot it carries, the raised action included, leave
  the focus order and the accessibility tree together, no separate floating
  action stands in for it, and it returns with the bar. Below 1024px the drawer's
  opener «المزيد» is itself a slot of the bar, so no drawer is open while the bar
  is hidden and no control of the frame is then a way to search; at 1024px and up
  the bar is absent and the sidebar's «بحث وفر» item carries the way (decided
  2026-11-02, Clarifications). The bar is part of the
  frame's composition, so it is absent from every page that carries no frame
  (FR-021), and it is one composition shown identically to a guest and to a
  signed-in merchant: a guest who activates a merchant-area slot — Upload
  Catalog or My Files — MUST be taken to the sign-in page on FR-048's terms,
  while the slot stays present and enabled (ADR-127). The five slots keep their
  labels at the smallest supported width of 320 CSS px — no slot's label is
  dropped there and no label is abbreviated — and the bar's fixed height does
  not change, because no label wraps. A label that does not fit its slot is
  governed by FR-026's one-line rule, so the bar's composition is the same at
  320 CSS px as at any width below 1024 CSS px (decided 2026-11-02,
  Clarifications). The bar's labels,
  measurements, and icon treatment are fixed design values, not product
  settings (ADR-128); this specification fixes the five slots, the labels'
  one-line treatment at 320 CSS px, the drawer
  behaviour, the scroll rule, and the raised action's travel only. The
  bar is built and verified structurally in this slice, because no page here
  renders the frame; its runtime behaviour — opening the drawer and the scroll
  rule — is verified by
  the slice that ships the first page carrying the frame (decided 2026-10-27,
  Clarifications; ADR-127; ADR-128; ADR-132).

**Securing the browser surface**

- **FR-044**: Every state-changing request issued from a browser MUST be
  protected against request forgery, whether the person is a guest or signed in —
  the guest's sign-up, sign-in, and password-recovery requests carry no session,
  and the protection covers them as it covers a signed-in merchant's requests —
  so that a request the person did not make is refused. The protection MUST cover
  every state-changing request this slice ships — ten requests in all, serving
  nine actions: the sign-up submission, the sign-in submission, the
  password-recovery request, the entry of a one-time code at sign-up, the entry
  of a one-time code in password recovery, the request for a new one-time code
  from the code step, the submission of the new password in password recovery,
  the account's own change-password action, the sign-out action, and the
  sign-out-of-every-device action — and the constitution requires its
  configuration to be covered by an automated test, because this slice is
  the first browser-facing feature it names (decided 2026-10-11, Clarifications;
  enumeration completed 2026-11-01 and 2026-11-03, Clarifications). The
  change-password action's request exists in this slice although no page offers
  it, so the protection covers it and R7 adds the page alone; the same rule
  covers the two sign-out requests —
  the account menu's sign-out and the settings section's sign-out of every
  device — which this slice serves although no page renders their controls, so
  the protection covers both and the slice that ships the first page carrying
  the frame adds the controls alone (decided 2026-10-29; enumeration completed
  2026-11-03, Clarifications). An action served by more than one request is
  protected on every request it is issued to. (Revised 2026-11-05 (2): the unit
  is the request; the code entry is enumerated once per flow, so the list counts
  ten requests; no action is added.)
- **FR-045**: Every value a person supplies that the platform holds and shows —
  the full name, the shop name, and any further value a later slice adds — MUST be
  encoded for its output context before it is rendered, so that a value typed as
  markup or script is shown as the text it is and never executed. The same value
  MUST also be rendered as one isolated bidirectional run whose direction is
  taken from the value's own first strong character, so an Arabic-first name
  stays right-to-left with a Latin word inside it kept in reading order, a
  Latin-first value renders left-to-right, and the surrounding Arabic is neither
  reordered nor allowed to reorder the value; the value MUST NOT be split across
  runs, concatenated with platform text inside one run, or forced to the page's
  direction, and the platform's own text keeps the document's direction. The
  mobile number and the one-time code are not supplied values — the platform
  parses and renders them — so FR-026's numeral rule and FR-038's display form
  govern them (decided 2026-11-02, Clarifications). A default the platform provides MUST NOT be treated as satisfying this rule
  without a test that fails when the encoding is removed (decided 2026-10-11,
  Clarifications; revised 2026-10-21 and 2026-11-01, Clarifications).
- **FR-046**: Every response the browser surface returns MUST carry the security
  headers the constitution's Identity, Authentication, and Session Policy names: a
  content-security policy whose script sources carry no wildcard, no
  `'unsafe-inline'`, and no eval-permitting source such as `'unsafe-eval'`, so the
  policy does not admit a script merely because its text sits in the page or
  because a string is evaluated as code; a
  transport-security declaration that binds future requests to the protected
  transport, a declaration that the browser MUST NOT guess a response's content
  type, and a restriction naming which frames may embed the page. Their presence
  MUST be asserted by an automated test that reads the policy the response carries
  and fails when any of the three script-source allowances appears, because this
  slice is the first browser-facing feature the policy names (decided 2026-10-11
  and 2026-11-02, Clarifications).

- **FR-053**: Every merchant-scoped read and write MUST pass through the single
  shared entry point that applies the account's scope, so that no path — the
  session lookup this slice serves or any path a later slice adds — can return
  another account's row. A request that names a row belonging to another account
  MUST receive the platform's ordinary not-found answer — the same status, the
  same body, and no header that differs from the answer a row that does not
  exist receives — so the two answers are indistinguishable and the refusal
  never tells the caller that the row exists somewhere else; the scope MUST NOT
  become an existence oracle for another merchant's identifiers. The scope MUST
  be asserted by an automated test that fails when the scope is removed, and the
  same test MUST assert that the answer for another account's row is
  indistinguishable from the answer for a row that does not exist, because
  `Session` is a merchant-scoped table and this slice is the first slice to read
  one (ADR-139; decided 2026-11-02, Clarifications).

- **FR-054**: A restart of the service MUST change none of the state this
  specification defines, because none of it is state a restart may exercise: a
  live session stays live and keeps both its clocks, an account's count of
  consecutive failed password verifications and its lock stay as they were — the
  lock still lifts when its fifteen minutes elapse and at no other moment — a
  live pending request keeps its code, its own expiry, its verified state, and
  its remaining allowance, and a rate-limit window keeps the budget it has spent,
  so an operator restart neither signs a merchant out nor clears an abuse control
  (decided 2026-11-04, Clarifications). Only the rules this specification states
  end or change any of that state — the session's own ends (FR-010 … FR-013,
  FR-019, FR-032), the lock's own expiry (FR-009), a pending request's own end
  (FR-034), and a window's own boundary (FR-033) — and a restart exercises none
  of them. A request that was in flight
  when the service stopped receives no answer; when the service is serving again,
  the person's repeat reaches the outcome FR-040 states for a repeated request,
  so a restart produces no second account, session, dispatch, write, revocation,
  or notice (decided 2026-11-04, Clarifications). A release that applies a
  migration MUST NOT serve a request while the stored data is not at the version
  the running code expects: the platform refuses to serve rather than answer from
  data of another version, so no request is decided against a shape the running
  code does not expect. Applying a migration MUST change none of the state named
  above — it ends no session, lifts no lock, ends no pending request, and resets
  no window — so a release changes the stored data's shape and nothing a person
  holds. A request that arrives while no instance is serving the release is
  outside FR-040, because FR-040 renders the failure of a request the platform
  answers: the gap's duration, the answer such a request receives, and the
  procedure that shortens it belong to the deployment procedure R12 owns, and the
  Assumptions record that split and its boundary (decided 2026-11-04,
  Clarifications).
- **FR-055**: A restore of the stored data — returning it to an earlier moment
  after a failure — MUST return the platform to the state of that moment, and the
  state this specification defines MUST be read as at that moment rather than
  reconciled afterwards: a session live at the restore point stays live, while a
  session created after it ends and its holder signs in again; a lock and its
  count are as they were at that moment, so a lock applied after it is gone and a
  lock lifted after it is in force again; a pending request is as it was at that
  moment, so one started after it no longer exists and its code is refused as
  expired or superseded under FR-034, and one replaced or ended after it is live
  again with the code it then held; and a rate-limit window is as it was at that
  moment, so a budget spent after it is unspent. A restore therefore MAY end a
  session, lift a lock, drop a pending request, or reopen a window, and those
  effects are accepted rather than prevented: FR-032's two clocks govern the
  platform's own operation and are untouched by the event, which is a stated
  cause outside them and outside every rule that ends a session, bounded by the
  recovery point of fifteen minutes the plan fixes, so no restore loses more
  state than that window, and by the recovery time of four hours the same plan
  fixes, so the platform serves again within it; no promise of continuity across
  the event is made, and no success criterion in this slice measures either
  value, because the recovery arrangement is ADR-142's and its measurement is
  R12's (decided 2026-11-04, Clarifications). A restore MAY also bring back a
  `User` row that was removed
  for good after the restore point, and MAY undo a block applied after it: the
  row returns as it stood at that moment, so the account is registered again and
  its personal data is read again until the removal is repeated, and the account
  can sign in again until an administrator re-applies the block. FR-017 is not
  breached by either effect — a restore removes no data, "keeps its data"
  describes what blocking does rather than the store's timeline, and an account
  whose block the restore undid is not blocked at the restored moment, so the
  refusal governs an account whose stored status is blocked — and FR-018's
  "lives as long as the account is registered" is read at the restored moment, in
  which the account is registered again. This slice performs no reconciliation,
  keeps no out-of-band record of removals or blocks, and states the consequence
  instead: it is bounded by the recovery point, the removal is repeated by the
  act that owns it — the administrator operation the Users page ships (R13) or
  the retention job (R15) — and the recovery procedure that runs the restore and
  re-applies a withdrawn block is R12's (decided 2026-11-04, Clarifications). A
  rollback of the release — returning the running code to the previous schema
  version — MUST be exercised before it is needed in production and MUST be read
  as the same class of event: state written under the version being rolled back
  is lost with it, so a session created after the migration ends and its holder
  signs in again, a lock and its count applied after it are gone, a pending
  request started after it ends, and a window spent after it is unspent. Each
  migration this slice introduces MUST be one reversible step with both
  directions defined, and each step's rollback MUST be applied in staging before
  it reaches production; the release carries two ordered steps, `0001` then
  `0002`; R1 owns the migrations and their reversibility and R12 owns running a
  release-level rollback in production, with that boundary recorded in the
  Assumptions. While a release is being rolled back the platform serves
  nothing, exactly as FR-054 provides for a deployment, so a request that arrives
  then is outside FR-040 there as it is here (decided 2026-11-04, Clarifications).

**The refusal catalogue**

This catalogue is the single enumeration of every response this slice returns to
a person that is not a plain success. It is closed: each response appears in
exactly one row, each row names the requirement that produces it — or, for the
transport's own answers, states that no requirement does — and no requirement
names a response this catalogue omits. It adds no behaviour — a row's kind,
placement, and retry decision follow from the requirement it cites — and the
words "refused" and "refusal" elsewhere in this specification name the fact that
a submission is not accepted, never a row's kind, so the class of each response
is read here once.

**The classification rule.** Every response is exactly one of five kinds, decided
by what it reports and by the action it leaves the person, never by how it is
rendered, announced, or transported, and never by whether that transport reports
success:

1. **Refusal** — it answers a submission, or answers a merchant-scoped read,
   and does not carry it out; it names a cause in what was submitted or in the
   request's handling of it, and the step it answered can serve again, so the
   person corrects a value or waits for the cause to clear. Its rendering may be
   a field message, a message on the card, or silence — silence is a rendering,
   not a kind, so the hidden-field refusal is a refusal although its response is
   the one a success receives (FR-029) — and the scope's not-found answer names
   no cause deliberately, because a cause would tell the caller the row exists
   somewhere else (FR-053).
2. **Notice** — it reports that the request or the step has ended, and the step
   cannot serve again: the page returns to the flow's first step carrying the
   notice, and the person starts a fresh request. A notice is never a refusal,
   even when a submission produced it, and the fifth incorrect entry is the test
   case: the response reports that the request ended rather than a fault in the
   code that was entered, so it is a notice and its cause code names the reason,
   not the kind (FR-034).
3. **State** — it reports a condition of the session or the account on the page
   the person is already using, inside the frame: the session has ended, or the
   account is blocked (FR-049). No form was submitted and no step is being
   answered.
4. **Outcome message** — it reports the settled result of a flow whose branch
   the platform has decided after ownership of the number is proven: the number
   already has an account, no account exists for it, or its account holds the
   administrator role (FR-006, FR-014). It replaces the step, ends the request,
   and offers the way forward rather than a retry.
5. **Confirmation** — it reports that the requested action succeeded, in place
   of the step it succeeded from. Every confirmation this slice returns is on
   the success side of this line: FR-004's account created and signed in,
   FR-007's signed in, and FR-014's password set, including its blocked-account
   variant. No refusal is rendered as a confirmation and no confirmation is a
   row of this catalogue.

**Retryable** is defined once, here, and the table states it for every row: a
response is retryable when it invites the person to act again and the action it
offers may succeed without correcting any value the response reports — for a
refusal, the step it answered may be submitted again; for a notice, the fresh
request it invites may be started. A retryable response states no interval of
its own: a response a limit produces is accepted again at that limit's own
window boundary, and every other retryable response may be repeated at once
(FR-033, FR-034, FR-040). A response is not retryable when the only action it
offers is to correct a value it reports — a field refusal, the uniform sign-in
refusal, or a wrong code — because the person corrects the value and submits
again, and the page offers no separate repeat; nor is one that reports a settled
condition — a state or an outcome message — because no action on that page
clears it. No requirement restates the property.

**Where a response appears** is one of six placements, stated per row: **field**
— the message is attached to the control carrying the value, and the step stays;
**card** — the message is attached to the form or the step as a whole, and the
step stays; **silent** — no message is rendered and the response is the one a
success receives; **step replaced** — the step's content is replaced in place by
the response or by the flow's first step carrying it, with no navigation and no
new route (FR-040); **surface state** — the frame shows the state in place; and
**none** — the response is answered before any of the page's steps, so no page
renders it. A row whose surface this slice does not ship says so rather than
borrowing another page's placement.

| Response | Kind | Source | Where it appears | Retryable |
|---|---|---|---|---|
| The mobile number is not a Libyan mobile number on +218 | refusal | FR-003, FR-042 | field — the number field, on every page that takes one | no |
| The full name is empty, over its maximum, or carries an emoji | refusal | FR-001, FR-026 | field — the full-name field, on the sign-up form | no |
| The shop name is over its maximum or carries an emoji | refusal | FR-001, FR-026 | field — the shop-name field, on the sign-up form | no |
| The city is not an entry of the fixed list | refusal | FR-005 | field — the city field, on the sign-up form | no |
| The password is shorter than the minimum, longer than the maximum, or common or breached | refusal | FR-035 | field — the password field, wherever a new password is set | no |
| The new password repeats the one it replaces, at the forced first change | refusal | FR-028 | field — the password field, on the administrator surface this slice does not ship | no |
| A sign-in attempt fails — a wrong password, an unknown number, a locked account, a blocked account, or an administrator account on the merchant surface | refusal | FR-008, FR-009, FR-017, FR-027 | card — the sign-in form; and the current-password check of the account's own change action and of the forced first change, whose pages this slice does not ship | no |
| An operation's limit is spent — account creation, sign-in, or recovery, on either key | refusal | FR-029, FR-033 | card — the submission that starts the operation | yes — the limit's window |
| The sign-up form is submitted before the minimum time, or without a stamp the platform issued, valid, and bound to that form | refusal | FR-029 | card — the sign-up form | yes — at once |
| The sign-up form's hidden field is filled | refusal | FR-029 | silent — the response a success receives, carrying no message, and the flow stops on the form's first step | no |
| A one-time code entered for the live request is wrong, the bound not yet reached | refusal | FR-034 | field — the code field | no |
| A one-time code is expired or superseded while its request is still live | refusal | FR-034 | field — the code field | yes — a new code |
| A new one-time code is requested beyond the allowance | refusal | FR-034 | card — the code step, beside the control that asked | yes — the pending request's clock and the allowance boundary |
| The messaging channel refuses a code at acceptance, or the wait reaches the request timeout | refusal | FR-034 | card — the step that asked for the message: the form's submission at a fresh request, the code step at a re-request | yes — at once |
| The correct code is entered but the account and its session cannot be created | refusal | FR-004, FR-034 | card — the code step | yes — at once |
| A failure this specification does not name, including the service's or its store's unavailability | refusal | FR-040 | card — the step being submitted | yes — at once |
| A restricted administrator session attempts an action other than the password change or ending the session | refusal | FR-028 | card — on the administrator surface this slice does not ship; R13 renders it | no |
| A state-changing request is refused for its forgery protection | refusal | FR-044 | none — answered before the page's step is reached; the person opens the page again, which is a new request | no |
| A transport refusal — a body beyond the platform's bound, a method the route does not serve | refusal | — | none — answered before the page's step is reached | no |
| A merchant-scoped row does not exist or lies outside the caller's scope | refusal | FR-053 | none — the shared entry point's ordinary not-found answer; no page this slice ships makes such a read | no |
| The one-time-code request ends at the bound on incorrect entries — the fifth incorrect entry | notice | FR-034 | step replaced — the code step becomes the flow's first step, carrying the notice | yes — a fresh request |
| A one-time code is submitted for a request that is unknown or has ended, or the request's lifetime elapses while the person waits on the code step | notice | FR-034 | step replaced — the flow's first step, carrying the notice | yes — a fresh request |
| The recovery flow's verified state ends — its lifetime elapses, or a new password is submitted after it has ended | notice | FR-014 | step replaced — the flow's first step, carrying the notice | yes — a fresh request |
| The session has ended, by any of its ends | state | FR-032, FR-049 | surface state — inside the frame, offering the way to sign in again | no |
| The account is blocked | state | FR-017, FR-019, FR-049 | surface state — inside the frame, withholding the way to sign in | no |
| Sign-up, correct code, the number has an active merchant account | outcome message | FR-006 | step replaced — the code step | no |
| Sign-up, correct code, the account is blocked | outcome message | FR-006 | step replaced — the code step | no |
| Sign-up, correct code, the account holds the administrator role | outcome message | FR-006 | step replaced — the code step | no |
| Recovery, correct code, no account exists for the number | outcome message | FR-014, FR-015 | step replaced — the code step | no |
| Recovery, correct code, the account holds the administrator role | outcome message | FR-014, FR-027 | step replaced — the code step | no |

The two states are the frame's: this slice delivers the frame and verifies the
state's markup structurally, and the slice that ships the first page carrying the
frame exercises it (FR-049). A message the platform sends to the registered
number — the security notice FR-043 requires — is not a response and is outside
this catalogue; where a requirement calls it a notice, that names the message and
not a kind.

**SC-004's comparison.** SC-004 states the comparison and its closed list of six
exceptions once, and they are not restated here. Four refusals of this catalogue
are among those exceptions — the operation's limit refusal (exception 3), the
format refusal (exception 4), the re-request limit refusal (exception 5), and
the channel failure (exception 6) — and no other refusal is excluded; the
successful sign-in (exception 1) and the post-verification outcome (exception 2)
are the two non-refusals among them. Every other row is produced identically
whether or not the number has an account, so it is compared and passes, whichever
step decides it; the rows the comparison never produces — the forgery and
transport answers and the scope's not-found answer, which are decided before the
flow, and the two states, which appear on a surface the comparison does not
enumerate — are outside its subject rather than excepted from it. This catalogue
states no seventh exception.

**The texts.** Each response's literal Arabic text is the fixed design value
FR-026 records once for the slice, selected by its cause and not a value this
specification fixes (FR-008, FR-034, FR-035): one text per cause, a cause whose
several situations deliberately share one text says so, and no page composes a
sentence of its own. AC-028 asserts that each rendered string is the text
recorded for its cause.

### Test Coverage Request *(mandatory)*

**One class, one boundary.** The three classes divide the slice's verification
and do not restate one another: unit tests own the decision a business rule makes
on a value or a state; integration tests own the contract between modules and the
state transition a flow produces across them; and end-to-end tests own the
rendered journey a person takes through a browser, including its route, step
sequence, in-place outcome, announcement, focus, and timing. A behaviour is
requested at one class only. Where a journey also has an integration case, the
integration case asserts the functional rule and the end-to-end case adds only
the rendered-path property, so the same rule is never requested twice with two
expected outcomes. The assignment is closed: a behaviour added to one class is
removed from the others in the same change, and a behaviour whose class is
unclear is a defect in this request rather than a second home.

- **Unit tests (business rules)**: Requested - the mobile-number shape and
  normalization, including the accepted spellings — separators, a national
  leading zero, a country code read once in its plus or international-prefix
  form, and Arabic-Indic digits — with a value that does not resolve to a +218
  mobile number refused by the format refusal FR-042 names (decided 2026-10-29,
  Clarifications), the sign-up field rules (including the full-name and
  shop-name constraints: present, bounded length, no alphabetic-shape rule, no
  emoji (the predicate FR-026 fixes deciding the value's characters — an
  `Extended_Pictographic` code point, the variation selector U+FE0F, or the
  keycap encloser U+20E3, with a bare numeral accepted), and
  no uniqueness rule, so two accounts MAY hold the same shop name (decided
  2026-10-11, Clarifications; revised 2026-10-31, Clarifications)),
  the password policy — the minimum and the maximum lengths, and the
  common-or-breached check performed against a source the platform holds rather
  than an external service, so the check never depends on a third party's
  availability (decided 2026-10-11 and 2026-11-01, Clarifications), and the rule that a new
  password MAY repeat the one it replaces, because no password history is kept
  (decided 2026-10-11, Clarifications) — bounded by the rule that the
  administrator's forced first change must set a value different from the
  initial password, so a submission that repeats it is refused and clears
  nothing (decided 2026-10-22, Clarifications), and the rule that the form states the
  policy's requirements before the password is typed and that each reason the
  policy refuses a password carries its own message — shorter than the minimum,
  longer than the maximum, or common or breached — none of which reveals
  whether the number has an account (decided 2026-10-22, Clarifications), and the
  order in which the account's own change action and the forced first change
  decide their value rules before the current-password check, so a submission
  refused on a value ground counts as no failed attempt while a failed check that
  follows a passing value step does (decided 2026-10-28, Clarifications) — and
  the rule that a stored password is
  never held in a recoverable form and is verified through the form the
  platform stores it in, so that a weakened or unrecognised storage form is
  detected rather than accepted (decided 2026-10-21, Clarifications), and the
  rule that a pending sign-up request holds the submitted password only in that
  same protected form, so no plaintext password is held while the request lives
  and the value is discarded when the request is replaced or ends (decided
  2026-10-22, Clarifications) — the city-list
  rule — every entry carrying one Arabic name and no Latin alternate name, each
  entry's Arabic name unique across the list with a qualifier where a real name
  recurs across a governorate, a city, and an area, the search matching the
  Arabic names while ignoring diacritics, the chosen name stored as it appears
  in the list, and a value outside the list not being accepted (decided
  2026-10-22 and 2026-10-28, Clarifications) — the
  consecutive
  failed password verifications and the fifteen-minute lock, one shared count
  across the three paths — sign-in, the account's own change-password action,
  and the administrator's forced first change — with the same three rules on
  every path: only a failed password verification against an existing, active
  account increments the count, so a rate-limit refusal, a format refusal, the
  refusal a blocked account receives, the refusal an administrator account
  receives on the merchant sign-in surface, a submission a value rule refuses
  before the check runs, and a refusal the lock makes do not; a successful
  password verification on any of the three paths and the lock's expiry clear it
  to zero, while a successful reset through the recovery flow clears neither it
  nor the lock; and the lock lifts after fifteen minutes and at no other moment,
  refusing the check as it refuses sign-in for its full duration without ending
  the session it was attempted from, letting the action resume when it lifts,
  and neither counting nor extending a refusal made while it is in force
  (decided 2026-10-11, Clarifications; revised 2026-10-28 and 2026-11-01,
  Clarifications; term and set unified 2026-11-02, Clarifications)
   — the per-operation rate
  limits with the client identified by the request's network origin and keyed
  additionally on the normalized mobile number submitted (one origin's exhausted
  budget leaving another origin's budget for the same operation untouched, and
  one number's exhausted budget leaving another number's untouched, while the
  number key is global to the number, so a spent number is refused from every
  origin, and a value that cannot be normalized carrying only the origin key,
  spending no number's budget and being decided by the next step in FR-051's
  order unless that origin's budget is spent — decided 2026-10-28,
  Clarifications), the
  account-creation budget counting every submission of the form itself,
  including one the form's hidden field or minimum time-to-submit refuses, while
  the code entry and the new-password step are outside it and bounded by the
  code's own limits (decided 2026-10-11, Clarifications; revised 2026-10-29,
  Clarifications), the dispatch-conditioned replacement of a live pending request
  for a number, the re-request limit counted per pending request, so a fresh
  request begins a new verification with a full allowance (decided 2026-10-28,
  Clarifications), the dispatch-conditioned replacement of a one-time code — a
  failed send leaves the previous code valid, the request live, and the
  re-request limit untouched, and the previous code stops being valid at the
  moment the new message is accepted (decided 2026-10-22, Clarifications), and
  that accepted dispatch restarts the pending request's expiry so the new code
  carries a full period while a refused dispatch changes neither (decided
  2026-10-24, Clarifications), the code held only in an irreversibly protected
  form, so the store never carries a usable code in plaintext and an entered
  code is verified through that form alone (decided 2026-10-29,
  Clarifications), and the rate limit's scope — the request that starts an
  operation alone consumes and is refused by its budget, while the code entry
  and the new-password submission are neither counted nor refused by it and are
  bounded by the code's own limits (decided 2026-10-29, Clarifications) — the
  ending of a pending request when the bound on incorrect
  entries is reached, the page returning to the flow's first step with the
  notice FR-034 requires (decided 2026-10-28, Clarifications), the bound
  counting only a wrong value for the live code, so
  an expired or superseded code is refused without incrementing it, the verified
  state that carries the recovery flow's
  new-password step — the code stops being usable at verification, the state
  lasts no longer than the pending request's own lifetime, it survives a
  reload, and setting the new password ends it — or a new request accepted in
  place of the pending request, which ends the verified state — so the same code
  cannot authorise a second reset (decided 2026-10-22, Clarifications), and the
  ending of a live recovery request and its verified state when the account's
  password changes by another path, while a successful sign-in alone ends
  nothing because it does not change the credential (decided 2026-10-29,
  Clarifications) — and the ordering of the two password writes when a change
  and a reset for one number are submitted together, so each takes effect only
  while its own authority still holds, the write that takes effect first
  withdraws the other's authority in the same step, and the other submission is
  refused and writes nothing (decided 2026-11-02, Clarifications) — the pending
  request's own ending at the end of its lifetime
  while the code step is shown, with the page returning to the flow's first step
  with the expiry notice and a code submitted after that moment refused and not
  incrementing the bound on incorrect entries (decided 2026-11-02,
  Clarifications), the
  verified state's ending at the end of its lifetime, with the page returning to
  the flow's first step and a password submitted after it refused and setting no
  password (decided 2026-10-28, Clarifications), and the indivisibility of the
  account's creation and the session that makes it usable, so a failure leaves
  neither an account nor a session and the correct code stays usable (decided
  2026-10-28, Clarifications), the indivisibility of each further multi-step
  write — the new password with the ending of every session at a change, a reset,
  and the forced first change, and the replacement's installation with the
  previous code's invalidation at an accepted dispatch — so a failure leaves the
  previous password and every session as they were, or the previous code valid and
  the request unchanged (decided 2026-11-04, Clarifications) — the uniform
  responses that
  conceal account existence — including the refusal made while the account is
  locked, the refusal of a blocked account, and the refusal of an administrator
  account on the merchant sign-in surface — each asserted over the response's
  whole observable shape, its text, its status, and its timing, so a response
  that does less work for a number with no account fails the test, the timing
  being measured against the numeric tolerance recorded for the
  enumeration test over repeated samples of both cases (decided
  2026-10-11, Clarifications; revised 2026-10-28, Clarifications), while a
  successful sign-in is outside the comparison because it occurs only for an
  existing account with the correct password (decided 2026-10-28,
  Clarifications) — and the rule that the locked state carries no
  copy of its own, the one uniform failed-sign-in message being the only text
  shown, so no alert, banner, field message, or retry-time hint names the lock
  (decided 2026-10-27, Clarifications) — the distinct, explicit refusal a
  rate limit produces, the distinct, explicit format refusal a submitted
  value that is not a valid Libyan mobile number receives (FR-042), and the
  distinct, explicit refusal the limit on requesting a new one-time code produces
  (FR-034), all
  deliberately outside that uniformity — the fixed order in which a
  submission's refusals are decided, so an over-budget submission receives the
  limit refusal whatever else is wrong with it — a filled hidden field included,
  so the honeypot's silent response is not what an over-budget submission
  receives (decided 2026-10-31, Clarifications) — and that the hidden-field
  response carries no next-step content, so the person stays on the form's
  first step while the same response leads a successful submission to the code
  step (decided 2026-11-01, Clarifications) — and a value failure is decided
  before any account-existence comparison (FR-051) — the
  repeatability of the operator's
  provisioning action and the uniqueness conflict it reports for a number that
  already has an account, the status active it sets on the account it creates,
  the initial password it sets and the password policy
  that governs it, the handling of that password — taken only through a hidden
  prompt or a directly supplied input stream, never as a value on the command
  line, never from an environment variable, or from a stored file, so it appears
  in no command history
  and in no process list, never echoed, never displayed in the action's success
  report or any other output, never written to a log, a security record, or an
  error, and never carried by a page, a one-time-code message, or a security
  notice, while the operator hands it over through a channel the operator
  controls outside the platform (decided 2026-11-02, Clarifications), the
  indivisibility of the account and that password — a run
  whose initial password cannot be set leaves no account behind and reports the
  failure to the operator — the forced first change's requirement of the current password —
  a submission without it or with a wrong one is refused, clears nothing, and
  leaves the account restricted — the account field rules it applies — the full-name bounds and the no-emoji rule, the
  Libyan-mobile-number rule against the fixed prefix dataset, and the city-list
  rule, each refusing and reporting to the operator — the structured security record emitted for each event
  FR-037 names (including the operator's provisioning action, a successful
  sign-in, and the verification that creates an account), each identifying its
  subject by an internal account identifier and never by the mobile number
  (decided 2026-10-11, Clarifications), and the rule that every sign-in attempt
  reaching the account-existence comparison and failing is recorded, while a
  format or rate-limit refusal is not (decided 2026-10-28, Clarifications), that a
  failed password verification in a password change — the account's own
  action or the administrator's forced first change — has its own record,
  separate from a failed sign-in attempt, while a value-rule refusal and a lock
  refusal emit none (decided 2026-11-02, Clarifications), with
  a session revocation defined as an explicit end — a sign-out, a sign-out of
  every device, and a platform revocation — while a session that expires on
  either clock emits none and a password change or reset emits its own record
  alone (decided 2026-10-29, Clarifications), and
  the session ending on
  password change — including the administrator's forced first change, which
  ends the restricted session it was made from — on
  blocking, on the session timeout, and at the session's absolute maximum
  lifetime. A session outlives the page and the browser that created it, so
  closing the browser ends nothing and resets neither clock (decided 2026-10-11,
  Clarifications) — and the rule that only what the merchant themselves do counts
  as activity for the session timeout, so that an action the merchant starts
  resets the inactivity clock while a request the browser sends on its own does
  not, and a background request therefore cannot keep a session alive
  indefinitely (decided 2026-10-22, Clarifications). The security notice FR-043 requires is asserted here too — sent on a
  password change and on a sign-out of every device, Arabic with Latin numerals
  and no emoji, best-effort so a failed send undoes nothing and blocks nothing,
  and sent on no other event, with one action producing one notice — a password
  change that ends every session sends the change's notice alone rather than a
  second one for the sessions it ended (decided 2026-10-24, Clarifications) — in
  particular not when the operator's provisioning
  action sets the administrator's initial password, which sets a first password
  rather than changing one already held, while the administrator's forced first
  change does send it because it changes a password the account already held
  (decided 2026-10-11 and 2026-10-22, Clarifications).
  The state changes the three bare pages render are asserted here as well — the
  in-progress state, the inline failure message, the in-place confirmation, the
  notice that a request expired, the notice that it ended at the bound on
  incorrect entries, and the terminal outcome message are announced to
  assistive technology, and focus lands on the step now shown rather than on a
  control the previous step carried (decided 2026-10-22, Clarifications;
  extended 2026-11-02, Clarifications).
- **Integration tests (module contracts)**: Requested — the account area
  and the authentication surface together: account creation and the
  one-time-code verification, sign-in and sign-out, the recovery flow —
  including the refusal of a reset for a mobile number whose account holds the
  administrator role, which this slice delivers with no administrator surface
  (decided 2026-10-11, Clarifications), and including the combined case where
  that account is also blocked — the role refuses the reset and the block is not
  reported, because the role ground closes the credential path first (decided
  2026-10-29, Clarifications), and including the ending of a live recovery
  request and its verified state when the account's password changes by another
  path, while a successful sign-in alone ends nothing (decided 2026-10-29,
  Clarifications), and including the concurrent case where a change and a reset
  for one number are submitted together — exactly one sets the final password,
  the other is refused as an ended request or an ended session, whichever path lost, and writes nothing,
  and no session that existed at the winning write survives it (decided
  2026-11-02, Clarifications) — and the
  session store's revocation paths — including the withdrawal that follows an
  account's block, with the blocked state set directly because this slice
  carries no act of blocking, and including the boundary that withdrawal keeps:
  a request already past the shared entry point when the block is recorded is
  decided on the state it met and is not interrupted, while the session's next
  request is refused with the blocked variant of the ended-session state and marks the session ended for the block,
  so no later request is granted access (FR-019, AC-021; decided 2026-11-02,
  Clarifications) — and including the effects of an
  account's removal,
  with the removed state set directly for the same reason — every session of the
  account withdrawn, a live pending request for its number ended with its code
  no longer valid, and no stored credential of the account permitting a sign-in
  (decided 2026-11-02, Clarifications) — and including the account's own
  change-password
  action — with the current-password check it requires — which this slice
  delivers as behaviour because the page that offers it arrives later (decided
  2026-10-11, Clarifications), and including the lock's refusal of that check for
  its full duration while the session remains endable and the check resumes when
  the lock lifts, with a refused check neither counting nor extending the lock
  (decided 2026-10-28, Clarifications), and including the
  concurrent cases, where two attempts for one number arrive together — two
  sign-up submissions, or two entries of its one-time code — so at most one
  account and at most one session result and the attempt that does not create the
  account receives the uniform response and the direction FR-006 requires
  (decided 2026-10-11 and 2026-11-02, Clarifications), and including the
  ending of a pending request once the platform has stated an outcome it cannot
  complete — at sign-up for a number that already has an account, including the
  status- and role-specific message when that account is blocked or holds the
  administrator role, and in recovery for a number with no account or one
  holding the administrator role — so no live request and no usable code outlive
  that step (decided 2026-10-22 and 2026-10-28, Clarifications).
  The repeats whose first response was lost are asserted at this same level,
  per path: a sign-up or recovery submission still tied to its live pending
  request re-renders the code step with no second dispatch and leaves the code
  already sent valid; a code entry that created the account re-renders the
  confirmation with no second account or session; the new-password submission
  re-renders the confirmation with one write, one ending of the sessions, and one
  notice; and the account's own change and the sign-out of every device are
  refused as an ended session with no second revocation or notice (FR-040,
  FR-034, FR-043, AC-043; decided 2026-11-04, Clarifications).
  The row-level invariant of account creation is asserted here too, at every
  point the sign-up flow passes rather than by one observation: after the form
  is submitted, while the pending request is live, again after an incorrect
  code, and once the pending request's own lifetime has elapsed with no one
  returning — the abandoned sign-up leaving no account and no session — no
  `users` row exists for the number — the account is not created ahead
  of verification in a partial or not-yet-usable state — and when two entries of
  the correct code arrive together, at most one row and at most one session are
  created, the row appearing together with the session that makes it usable only
  when the correct code is entered, so no partial, not-yet-usable, or second row
  can satisfy the assertion at any of those points (FR-004, AC-004, AC-006;
  decided 2026-11-02, Clarifications). The merchant scope is asserted at this
  same integration level, because the scope is applied where the shared entry
  point meets the stored rows and a test that substitutes the store cannot
  observe it: a session lookup carries the account's scope, an account
  identifier supplied in the request is ignored, and a test that reads another
  account's session through the same entry point fails when the scope is
  removed (FR-053, AC-056; decided 2026-11-02, Clarifications).
  The service-level cases are asserted at this same level: a request that cannot
  be served because the store its data lives in is unreachable receives FR-040's
  inline, explicit, retryable failure on the page that made it, with no second
  state and no navigation, and a retry after it names no wait; a retry after a
  limit refusal shows no countdown and is decided by the limit's own window,
  whose remaining time the response carries; a
  security notice the channel accepts but never delivers is neither retried nor
  reported and leaves the change or the sign-out standing; and an outage of the
  messaging channel stops the two code dispatches and the two notices alone,
  while sign-in, sign-out, the session's ends, the password change and reset, the
  forced first change, and provisioning continue (FR-040, FR-033, FR-034, FR-043,
  AC-043, AC-047; decided 2026-11-04, Clarifications).
  The operational state cases are asserted at this same level: a restart of the
  service leaves a live session, a lock and its count, a live pending request
  with its code and allowance, and a spent budget as they were, and a repeat of
  the request that was in flight reaches FR-040's repeated-request outcome; a
  release that applies a migration serves no request while the stored data is
  not at the version the running code expects, and changes none of that state;
  a restore to a point within the recovery point leaves the state of that
  moment, with no reconciliation and the
  consequence AC-061 states for a removed row and an undone block; and the
  migration's rollback is exercised in staging with the state consequence AC-062
  states (FR-054, FR-055, AC-059, AC-060, AC-061, AC-062; decided 2026-11-04,
  Clarifications).
  The administrator's first sign-in is exercised here as behaviour with no page —
  the sign-in is accepted, the account is restricted to the password change, the
  change made at that first sign-in clears the requirement and lifts the
  restriction, ends every session of the account, and sends the security notice,
  and ending the session remains available to the restricted account — and the
  forced change's current-password check is refused while the account is locked,
  with the restricted session still endable and the forced change resuming when
  the lock lifts (decided 2026-10-28, Clarifications) — together with the rule
  that a status or role refusal performs the
  same verification work as any other attempt and is refused afterwards on that
  ground, so the enumeration test compares a blocked, a locked, and an
  administrator account against a wrong password and an unknown number over the
  response's whole shape (decided 2026-10-22, Clarifications). The
  unlimited-concurrency rule is asserted here too: a sign-in leaves every session
  the account already holds intact, so only an explicit end removes a session
  (decided 2026-10-11, Clarifications). The no-email rule is asserted at the same
  level: every account this slice creates holds the reserved, non-routable
  placeholder derived from its normalized number and no supplied address, and no
  form collects, no response shows, and no path uses an email address, so a
  supplied one fails the test (FR-001, FR-007, FR-014; decided 2026-11-02,
  Clarifications). The ended-session state FR-049 defines is
  asserted over every path that ends a session — the inactivity timeout, the
  absolute maximum lifetime, an explicit sign-out, a sign-out of every device, a
  platform revocation, a password change or reset, and a block — so no path shows
  an unrelated error (decided 2026-10-22, Clarifications). The blocked variant
  of that state withholds the way to sign in, because the block refuses every
  sign-in, and the unblocked variant keeps it (decided 2026-10-28,
  Clarifications); in the blocked variant the header carries the state FR-023
  fixes — the logo/home control and the theme switch alone, with the sign-in
  action and the account control withheld (FR-023; decided 2026-11-01, Clarifications). The access
  controls the constitution
  requires of the first browser-facing feature (request-forgery protection,
  output encoding, and security headers, FR-044 … FR-046) are exercised here,
  including the change-password action's own request, which exists although no
  page offers it (decided 2026-10-29, Clarifications). The frame's
  composition is also asserted structurally here — the header's logo/home,
  notifications, and theme-switch controls and the account menu (its three
  items and the sign-out confirmation), the sidebar's navigation item list
  (each item naming a registered destination, and the list shown identically to
  a guest and to a signed-in merchant), the sidebar collapse control, the bottom
  bar's five slots, the four static-page links at the bottom of the drawer, and
  the notifications control and its target — the Notifications route the frame's
  decision record fixes, with no unread badge in this slice because the count
  arrives with R9 —
  because no page in this slice renders the frame (decided 2026-10-11; revised
  2026-10-21, Clarifications; revised 2026-10-27, Clarifications). The
  frame's accessibility is asserted at the same structural level — an accessible
  name, a role, and keyboard reachability for each of its controls — while its
  runtime scan and keyboard-only pass belong to the slice that ships the first
  page carrying the frame, on the boundary SC-005 fixes (decided 2026-10-11,
  Clarifications; boundary cited from SC-005 2026-11-04, Clarifications). That
  level also covers the header's four controls at 320 CSS px, none of them dropped or
  moved into a menu, and the three controls a guest's header carries under the
  same rule, and the ended-session state's live announcement and
  focusable heading (decided 2026-10-31, Clarifications). The messaging
   channel's contract is asserted here too: the send is attempted inside the
   request that asks for the code, the code step opens only once the channel has
   accepted the message, and a channel refusal is reported as the explicit,
   retryable failure on the submission rather than on the code step, so no
   failure reaches a person who has already moved on; only a refusal at
   acceptance is that failure, and a message the channel accepts but does not
   deliver is outside the platform's observation and is not a failure the request
   reports, so the person requests a new code subject to the limit (decided
   2026-10-11 and 2026-10-22, Clarifications). A channel that neither accepts nor
   refuses within the platform's request timeout is treated as that refusal at
   acceptance, with the pending request live, the previous code valid, the code
   step not reached, and the re-request limit untouched (decided 2026-10-28,
   Clarifications).
- **End-to-end tests (user journeys)**: Requested — journeys covered: US1
  (sign-up and verification), US2 (sign-in), US3 (password recovery), and US5 as
  far as the frame's scoping — the absence of the frame from the three bare
  pages this slice ships, and the bare layout's own wordmark, page title, and
  browser title. The frame's structural half is asserted in this slice rather
  than end to end, on the boundary SC-005 fixes, because no page here renders it:
  the sidebar's two-width behaviour; the header's single-row behaviour at 320 CSS
  px with its controls present; the account menu's items and the sign-out
  confirmation's markup; the drawer's opening by «المزيد» and its closing by the
  collapse control, Escape, and an activation outside it, with the focus
  returning to «المزيد», an item's activation closing it as part of the
  navigation, and the bottom bar staying rendered and visible under the open
  drawer. What this level
  leaves to the slice that ships the first page carrying the frame is the
  frame's runtime behaviour on a rendered page: the focus landing on the
  destination page's heading after a drawer item navigates, the drawer's focus
  containment, the overlays' stacking order and the consumption of an activation
  outside them, the account menu's live open and its runtime dismissal with the
  sign-out confirmation's result, the guest's redirection, the bottom bar's
  scroll-hide rule, and the label cut at the inline-end (decided 2026-10-11;
  revised 2026-10-27, Clarifications; revised 2026-11-03, Clarifications;
  boundary cited from SC-005 2026-11-04, Clarifications). Each journey starts from one of the three bare pages, which link to one another (decided 2026-10-11, Clarifications), runs through the one-time-code step as a step of the same page — no route of its own (FR-038), with the fields the flow collected shown for reading — at sign-up the full name, the mobile number, the city, and the optional shop name; in recovery the mobile number alone — the mobile number shown in its canonical Latin-numeral form and not editable there, the password not shown back in any form, and the step carrying both the re-request control and the control that returns to the first step (decided 2026-10-22, Clarifications) — and ends at the platform's own response —
  the session created by verification or by sign-in — because this slice ships no
  landing page (decided 2026-10-10, Clarifications); that response is a
  confirmation rendered in place on the page that began the journey, so each
  journey ends at a visible outcome (decided 2026-10-11, Clarifications). The in-progress state and
  the disabled submit control (FR-040) are exercised on the sign-up submission,
  on the sign-in submission, on the password-recovery request, on the
  code-entry step, on the code step's re-request control, and on the
  new-password step of the recovery flow (decided 2026-10-22, Clarifications;
  revised 2026-10-28, Clarifications). A journey that reloads part-way resumes at the code step while
  its pending request is live and its code has not yet been verified, and the code already sent is entered rather than a
  new one requested (decided 2026-10-11, Clarifications), and a browser that
  holds more than one live pending request resumes the one most recently
  submitted from it, while a journey that returns to the first step and reloads
  there sees the first step rather than a code step (decided 2026-10-29,
  Clarifications), while a journey that
  reloads at the new-password step resumes there for as long as the verified
  state lives and returns to the page's first step once the password is set
  (decided 2026-10-22, Clarifications). Each of the three bare
  pages is exercised showing an inline, retryable failure message without
  navigating away when a failure occurs, since this slice ships no error page to
  navigate to (decided 2026-10-11, Clarifications), and keeps the step the
  person submitted with every non-password value retained and the password fields
  cleared, a refused one-time code cleared as well (decided 2026-10-28,
  Clarifications). The mobile number's transport bound is exercised at this
  level too: through each journey no address, history entry, referrer, or
  client-side stored value carries the submitted number, while the browser's tie
  to the pending request is that request's identifier (FR-037, FR-038; decided
  2026-11-02, Clarifications). Both terminal outcomes are exercised in place of the code
  step with no navigation — the recovery flow's outcome message, when the reset
  cannot proceed, and the sign-up direction message, when the correct code is
  entered for a number that already has an account — and a reload returns the
  page to its first step (decided 2026-10-29, Clarifications; the sign-up
  direction added 2026-11-01, Clarifications). US2's sign-out (AC-011) and sign-out of every device (AC-012) are named integration cases in
  the session-endings test — the first asserts that signing out of one of two
  live sessions ends only that session and leaves the other live and granting
  access, the second that signing out of every device ends every session of the
  account, while the platform revocation (AC-013), the password change that ends
  every session (AC-014), and the multi-session rule (AC-058) are that test's
  remaining cases and the two session clocks and the activity rule (AC-015) are
  the session-clocks unit test's cases — because no surface offers those actions
  in this slice; US4's
  status, blocked refusal, retained data, and withdrawn sessions (AC-018 –
  AC-021) are the status integration test, with the blocked state reached
  directly and the withdrawn-session half under `EX-008`; and US6's provisioning,
  forced first change, and both administrator cases (AC-029, AC-030, AC-054) are
  the administrator first-sign-in and refusal integration cases under `EX-010`.
  No withdrawn journey is left to "the unit and integration tests named above".
  While US7's rate limit on the
  P1 operations (account creation and sign-in), its hidden field, its minimum
  time-to-submit, its request-forgery protection, its output encoding, and its
  security headers are integration tests that gate this slice's P1 checkpoint
  rather than travelling with the deferred journeys, because the first
  browser-facing feature cannot ship without them (ADR-139). The P1 checkpoint's
  pass condition is the five US7 integration cases on the P1 surface - the hidden
  field's silence and the minimum time (AC-031, AC-032), the two-key limits over
  account creation and sign-in with the resend bound (AC-033, AC-035, AC-036),
  the refusal order (AC-055), request forgery, output encoding, and the security
  headers (AC-048, AC-049, AC-050), and the no-CAPTCHA rule (AC-034) - together
  with US1's and US2's acceptance criteria; no other test gates it. The recovery
  operation's budget and its later steps' exemption are verified in the final
  phase, after US3 (FR-033, FR-051), and the aggregate ceilings the two number
  keys produce - the code-guess ceiling and the one-time-code message ceiling -
  are asserted there as well, because both span the account-creation
  and recovery paths and need both to be exercised (FR-034). (Revised
  2026-10-31: the P1 gate names the
  P1 operations, and the recovery budget's exemption belongs to the final
  phase; the pass condition was named 2026-11-04, Clarifications.) The journeys are measured on SC-001's and SC-003's terms, excluding the
  interval between the messaging channel's acceptance of a code and the moment
  that code is available to the person (decided 2026-10-24, Clarifications;
  interval fixed 2026-11-04, Clarifications). The three bare pages are exercised at the
  smallest supported width of 320 CSS px as well as at 1280 CSS px, because
  SC-006's scan, keyboard-only pass, and reflow check are measured there
  (decided 2026-10-28, Clarifications; wide width fixed 2026-11-04,
  Clarifications).
- **Coverage target for changed production code**: at least 80% of the changed
  production lines this slice introduces. The denominator is every added or
  modified executable line of production source in the diff between the revision
  the feature branch was created from and the commit under test, counted per
  file; test files, fixtures, documentation, and configuration are not production
  source and are outside it, and generated code, migrations, and snapshots are
  exempt by Principle III and stay out of both numerator and denominator. The
  numerator is the subset of those changed lines that a test actually exercises,
  so the percentage is covered changed production lines over changed production
  lines. The comparison basis is that one diff and no other: a line unchanged in
  it is not counted, a line changed and then reverted is not counted, and the
  threshold is not taken against the repository total or against a later branch.
  The exclusion from the target is closed and is exactly `EX-007`'s exact scope,
  named here in full: the focus landing on the destination page's heading after
  a drawer item navigates; the drawer's focus containment; the overlaying
  surfaces' stacking order; the consumption of an activation outside an open
  overlay — that it performs nothing beneath it; the account menu's live open
  and its runtime dismissal, including the rendered result of the sign-out
  confirmation; the guest's redirection; the bottom bar's scroll-hide; the label
  cut at the inline-end; and the frame's accessibility scan and keyboard-only
  pass over its rendered behaviour. No other line is excluded, and a behaviour
  outside that list cannot be excluded without a new exception row; a behaviour
  on the list that R1 comes to exercise enters the denominator when `EX-007` is
  narrowed. The frame's composition, the
  presence of its controls, and the structural behaviours this slice verifies
  stay inside the denominator — «المزيد» opening the drawer, the collapse
  control, Escape, and an activation outside closing the drawer (the close
  itself, not the activation's effect beneath it), the focus returning to
  «المزيد», the bottom bar staying rendered and visible under the open drawer,
  and the sign-out confirmation the account menu carries — as do the three pages,
  the flows, the session paths, and the security controls.
  The gate blocks in continuous integration: a change whose report shows fewer
  than 80% of the changed production lines covered MUST NOT merge, and R1's
  acceptance at the verification increment MUST NOT be recorded while the gate
  fails. The artifact is the coverage report attached to the change's review and
  kept with the acceptance record, naming the diff baseline, the changed-line
  count, the covered count, the percentage, and every excluded path with the
  exception row that authorises it. The P1 checkpoint is not a coverage
  condition: it passes on the named US1, US2, and US7 cases above, while this
  gate is R1's separate acceptance condition under Principle III. Both this
  exclusion and SC-009's measurement ceiling — up to 10,000 registered accounts,
  500 concurrent sessions, and 10 authentication requests per second, against the
  capacity model's larger envelope — are deviations from a binding rule, so each
  MUST be recorded as a deviation with an owner and a review date; naming them
  here does not discharge them (ADR-139; numerator, baseline, blocking point, and
  closed exclusion fixed 2026-11-04, Clarifications).

**Every criterion has a test, written to fail first.** Each of the 62 acceptance
criteria is exercised by at least one test this request names, and that test is
written before the implementation it exercises and fails on the implementation's
absence, so a task that implements a criterion without a failing-first test does
not satisfy this request. The criterion's measurement point is the test named for
it in the task that carries it; a criterion left to an implementation task with
no test is a defect in the tasks, not an inference the request permits. A test
that asserts nothing, or asserts only its own setup, does not count toward the
criterion or the coverage target (Principle III).

### Key Entities *(include if the feature involves data)*

- **User**: a registered merchant account. It represents a person's identity and
  shop details, and it carries the role that separates a merchant from an
  administrator and the status (active or blocked). This feature creates it and
  relies on the invariants that the mobile number is its sole, unique identifier
  (enforced when the account is created, so two attempts arriving together for
  one number cannot produce two accounts),
  that no email address exists as a product datum — none is collected,
  displayed, used to identify an account, used to recover one, or used to send
  anything, and the reserved, non-routable placeholder recorded for it is not
  an address this invariant governs — that no merchant can delete it, and that an
  account created through public sign-up exists only after the mobile number is
  verified (decided 2026-10-10, Clarifications — no `User` row is created before
  the code is entered). That verification invariant is bounded to the public
  sign-up flow: the operator-provisioned administrator account is created
  directly, with no one-time code and no verification step (decided 2026-10-11,
  Clarifications). Its
  relationship to this feature is one account to many sessions.
- **Session**: one session for an account, held by the platform. It represents the proof
  that a merchant is signed in, and it is revocable on its own or all at once
  ("sign out of every device"). This feature creates it and relies on the
  invariants that a session belongs to exactly one account, that it ends when
  the account's password changes or the account is blocked — endings FR-037
  treats as part of the change's or the block's own record rather than as a
  revocation — that it is withdrawn when its account is removed, as FR-018
  provides, and that it ends
  at its own lifetime — after the session timeout with no activity, or at its
  absolute maximum lifetime (decided 2026-10-10; corrected 2026-11-01,
  Clarifications). Only what the
  merchant themselves do counts as activity for the session timeout — an action
  the merchant starts resets the inactivity clock, and a request the browser
  sends on its own does not, so a background request cannot keep a session alive
  indefinitely (decided 2026-10-22, Clarifications). An account MAY
  hold an unlimited number of concurrent sessions: this feature applies no cap,
  signing in never revokes an existing session, and "sign out of every device"
  is the action an account uses to end them all at once (decided 2026-10-11,
  Clarifications). A session outlives the page and the browser that created it:
  the browser retains only the reference that proves it, the session is
  never recoverable from browser storage, and it ends only
  when the session timeout elapses with no
  activity or when it reaches its absolute maximum lifetime, so closing the
  browser neither ends it nor resets either clock (decided 2026-10-11,
  Clarifications; revised 2026-10-21, Clarifications).

The fixed Libyan city list is reference data this feature fixes once, not an
entity: the constitution names it as one dataset held for accounts, and every
later slice reads it rather than writing its own.

No third entity is introduced (decided 2026-10-10, Clarifications). The pending
request's data and the one-time codes are transient verification state held
outside the entity register as state that carries an expiry rather than as an
entity; because the
store carries a per-number identity, an expiry, a replacement rule, a count of
the new codes the live request has asked for, and a bound on incorrect entries
that counts only a wrong value for the live code — an
expired or superseded code is refused without incrementing it — `docs/domain-model.md`
records it as transient,
non-entity state owned by the `users` module, with those invariants, in the same
change that records the decision — so the store is documented without entering
the entity register (decided 2026-10-21 and 2026-10-22, Clarifications). The pending
request carries the details the form collected, so that the account can be
created when the correct code is entered; the password among them is held only
in the same protected form a stored password has, which cannot be reversed — never in
plaintext — and it is discarded when the request is replaced or ends (decided
2026-10-22, Clarifications). The one-time code itself is held the same way: the
store carries the irreversibly protected value computed when the code was
dispatched, an entered code is verified through that form alone, and a
replacement's protected value replaces the previous one at the accepted
dispatch, so the store never holds a usable code in plaintext (decided
2026-10-29, Clarifications). Exactly one
pending request is live per mobile number: a new sign-up or recovery request for
a number that already has a live pending request replaces it and invalidates its
code once the messaging channel accepts the new message, in every state,
including the recovery flow's verified state, which then ends and can no longer
set a password (decided 2026-10-11 and 2026-10-22, Clarifications; revised
2026-11-01, Clarifications). A dispatch the messaging channel accepts restarts
the pending request's lifetime, so the replacement code carries a full period
rather than the remainder of the request it replaced, and a dispatch the
channel refuses changes neither the code nor the expiry (decided 2026-10-24,
Clarifications). In the password-recovery flow,
entering the correct code moves the pending request to a verified state that
carries the new-password step alone, lasts no longer than the pending request's
own lifetime, survives a reload, and ends when the new password is set, when a
new request replaces the pending request, or when the account's password changes
by another path — so the
same code cannot authorise a second reset, a replaced request leaves no
verified state behind, and a reset authority created before a password change
never survives it, while a successful sign-in alone ends nothing because it does
not change the credential (decided 2026-10-22 and 2026-10-29, Clarifications).
The reset and a change also cannot both take effect when they are submitted
together: the two writes are ordered, the first withdraws the other's
authority in the same step, and the other submission is refused and writes
nothing, so one password stands and no session survives on a superseded
decision (decided 2026-11-02, Clarifications). When that lifetime
elapses while the person is still on the new-password step, the state ends at
that moment and the page returns to the flow's first step, so an expired state
never sets a password (decided 2026-10-28, Clarifications).
A pending request also ends once the platform has stated an outcome it cannot
complete — at sign-up, when the number already has an account, and in recovery,
when the number has no account or holds the administrator role — so no live
request and no usable code outlive the step that would have carried them
(decided 2026-10-22, Clarifications). The state
the account itself carries is an account property: three fields on `User` — the
count of consecutive failed password verifications, one count across the three
paths FR-009 fixes, the lock's expiry, and the requirement to change the
password at first sign-in, which the change made at that first sign-in clears
and no other path clears — and they are already registered: ADR-105 amended the
register's `User` row and `docs/domain-model.md` in the same change. This
feature implements them and makes no second amendment, so ADR-105 is cited in
the ownership record and in its Reaffirmed decision records rather than
recording the change again (decided 2026-10-21, Clarifications; corrected
2026-10-29, ADR-139).

## Acceptance Criteria *(mandatory)*

### User Story 1 — Create an account and verify the mobile number (P1)

1. **AC-001**: **Given** a visitor on the sign-up page, **When** they provide a
   full name, a Libyan mobile number, a password, a city from the fixed list, and
   an optional shop name, **Then** the platform accepts the details and begins
   confirming the number *(FR-001)*
2. **AC-002**: **Given** any page this slice ships that takes a mobile number —
   the sign-up, sign-in, and password-recovery pages — **When** it is shown,
   **Then** it offers no dial-code selector and the country is fixed to Libya
   (+218) *(FR-002)*
3. **AC-003**: **Given** a visitor enters a number that is not a Libyan mobile
   number on +218 — including a Libyan landline number — **When** they submit,
   **Then** the platform refuses it against the fixed mobile-prefix dataset and
   creates no account *(FR-003, FR-042)*
4. **AC-004**: **Given** valid details are submitted for a number with no
   account, **When** the one-time code has been sent and the visitor has not yet
   entered it, **Then** no `User` row exists for that number — the account is not
   created ahead of verification in a partial or not-yet-usable state — and no
   session exists *(FR-004)*; **And given** the visitor never returns after the
   code is requested and the pending request reaches the end of its own lifetime,
   **Then** the request has ended at that moment and still no `User` row exists
   for the number and no session exists, so an abandoned sign-up leaves nothing
   behind *(FR-004, FR-034)*; **And given** the code is entered incorrectly,
   **Then** still no `User` row exists for that number, the account does not
   become usable, and no session is created *(FR-004)*; **And given** the
   correct code is entered, **Then** the account row and the session that makes
   it usable are created together, the account becomes usable, and the merchant
   is signed in, with no separate sign-in step *(FR-004)*; **And given** a
   failure occurs between the account's creation and the session's creation,
   **Then** neither exists, the pending request is unchanged, and the correct
   code remains usable, so the person retries the same code *(FR-004, FR-034)*;
   **And given** the correct code has been entered, **Then** the page renders a
   confirmation in place — no navigation, no new route, and no new page — stating
   that the account is ready and that the merchant is signed in *(FR-004)*
5. **AC-005**: **Given** a visitor is choosing a city, **When** they type into
   the city field, **Then** it searches one fixed list of every Libyan
   governorate, city, and area, and a value outside that list is not accepted
   *(FR-005)*; **And given** the visitor types a city's Arabic name without its
   diacritics, **Then** the search finds that entry, and every entry in the list
   carries one Arabic name and no Latin alternate name *(FR-005)*; **And given**
   two real places share a name, **Then** the list carries two entries whose
   Arabic names differ by the qualifying governorate or level, so both are
   selectable and distinguishable, and the chosen name is stored as it appears
   in the list *(FR-005)*
6. **AC-006**: **Given** a mobile number already has an account, **When** the
   sign-up form is submitted with it, **Then** the form's response, the following
   step, and the sending of the code are indistinguishable, on SC-004's
   comparison (which masks the values SC-004 names), from those for a
   number with no account, and that indistinguishability is bounded to those
   steps; **And when** the correct code is entered, **Then** ownership of the
   number is proven, no second account is created, the submitted password is not
   applied, and the person is directed according to the existing account's
   status and role: an active merchant account is directed to sign in or to
   recover the password by a message naming both options with
   the link to the sign-in page and the link to the password-recovery page, and
   with no redirect; a blocked account's message states that the account is
   blocked and that sign-in stays refused until an administrator returns it to
   active; an administrator account's message states that the credential is
   managed on the administrator surface and that the merchant sign-in and
   recovery paths do not apply to it, with no generic direction in either of
   those two cases and with nothing disclosed before the code is verified
   *(FR-006, FR-027)*; **And then** the message replaces the code step in place
   and stays there until a reload or a fresh opening, the pending request ends at
   that point, and
   its code stops being valid at once, so no live request survives the outcome
   *(FR-006, FR-034, FR-038)*; **And given** two sign-up attempts for the same number
   arrive at the same moment, **Then** at most one account is created, the
   attempt that does not create it receives the message FR-006 fixes for the
   existing account's status and role — the active merchant's
   sign-in-or-recovery message, the blocked account's message, or the
   administrator account's message, with no generic direction where the status
   or role calls for none — decided by the existing account's stored status and
   role as the winning transaction left them, not by the losing attempt's own
   view, and no partial account and no second session is left behind
   *(FR-006, FR-031)*; **And given** two entries of
   the same correct code for one number arrive at the same moment, **Then** at
   most one account is created and at most one session results, the entry that
   does not create the account receives that same status- and role-specific
   message rather than a generic direction to sign in or to recover the password,
   decided by the existing account's stored status and role, and no partial
   account, no second session, and no live pending request is left behind
   *(FR-006, FR-031, FR-034)*
7. **AC-007**: **Given** an account exists for a mobile number, **When** the
   sign-up form is submitted with the same number written differently (spaces, a
   leading zero, without the +218 prefix, or with the digits typed as
   Arabic-Indic numerals), **Then** it is treated as the same number and no
   second account is created *(FR-031, FR-006)*; **And given** the same number is
   typed with separators, or with a country code written with the plus sign or as
   the international prefix, **Then** the country code is read once rather than
   doubled and the value remains the same account, while a value that does not
   resolve to a +218 mobile number is refused with the format refusal FR-042
   names *(FR-031, FR-042)*; **And given** the one-time
   code is typed as Arabic-Indic numerals, **Then** it is read as the same digits
   and verifies identically *(FR-031)*
8. **AC-037**: **Given** a person sets a password — at sign-up or on password
   change — **When** the password fails the policy (shorter than the minimum,
   longer than the maximum, or a common or breached password), **Then** the
   platform refuses it and no password is set *(FR-035)*; **And given** the
   sign-up form, **When** it is
   submitted with a password that fails the policy, **Then** it is refused at
   that point, before any one-time code is sent, and the refusal is the same
   whether or not the number already has an account *(FR-035, FR-006)*;
   **And given** the common-or-breached check, **Then** it is performed against
   a source the platform holds — no external service is called, so the refusal
   depends on the password alone and never on a third party's availability
   *(FR-035)*; **And given** a new password identical to the one it replaces on a change
   other than the administrator's forced first change, **Then** it is accepted,
   because the policy applies no rule against reuse and no password history is
   kept *(FR-035)*; **And given** the administrator's forced first change,
   **Then** a value identical to the initial password the operator supplied is
   refused and clears nothing, so only an actual change lifts the restriction
   *(FR-035, FR-028)*; **And given** the form that sets a
   new password — the sign-up form or the recovery flow's new-password step —
   **When** it is shown, **Then** it states the policy's requirements
   before the password is typed, and each reason the policy refuses a password
   carries its own message — shorter than the minimum, longer than the maximum,
   or common or breached — none of which reveals whether the number has an
   account, while the sign-in form states no requirement of the policy, shows no
   policy message, and receives the uniform refusal for a value that would fail
   it *(FR-035)*

9. **AC-041**: **Given** the one-time-code step at sign-up or in password
   recovery, **When** it is reached, **Then** it renders as a step of the same
   page that began the flow — no page and no route of its own — so this slice
   still ships exactly the three bare pages: sign-up, sign-in, and password
   recovery *(FR-038)*; **And given** the code step is reached, **Then** it
   shows the fields the flow collected, for reading and without editing them:
   at sign-up, the full name, the mobile number, the city, and the optional shop
   name; in password recovery, the mobile number alone, shown like the
   sign-up number in the one display form FR-038 fixes — `+218 91 234 5678` —
   with Latin numerals, because the recovery form collects nothing else and
   showing an account field there before the code is verified would reveal that
   the number has an account; the password is not shown back in any form —
   neither re-displayed, nor echoed, nor rendered masked — so a submitted
   password never returns to the browser, and the pending request holds it only
   in the same protected form a stored password has, which cannot be reversed, so no
   plaintext password is held while the request lives *(FR-038)*; **And given**
   the code step, **Then**
   it carries a control that requests a new one-time code, subject to the limit
   on re-requesting, and a control that returns to the page's first step, where
   the values already typed are editable again and retained except the password,
   which the page never retains or shows, and a fresh submission starts a new pending
   request for the new number *(FR-038, FR-034)*;
   **And given** the page is reloaded, or reopened, while a
   one-time code is still waiting, its pending request is still live, and its
   code has not yet been verified, **Then**
   the code step is shown again for the request the page is tied to — the one it
   most recently submitted from that browser — and the code already sent stays
   usable, with no new code requested and no new pending request started
   *(FR-038, FR-034)*;
   **And given** more than one pending request is live from the same browser,
   one per mobile number, **Then** the page resumes the request it is tied to,
   which is the one most recently submitted from that browser, and the control
   that returns to the first step ends that tie while leaving the request live,
   so a reload at the first step shows the first step rather than a code step
   *(FR-038, FR-034)*;
   **And given** the code has been verified in the password-recovery flow and
   the page is reloaded, or reopened, while the verified state lives, **Then**
   the new-password step is shown again rather than the code step, and once the
   password is set the page returns to its first step *(FR-014, FR-038)*;
   **And given** a new request replaces the pending request while the verified
   state lives, **Then** once the messaging channel accepts the new message the
   verified state ends, its authority to set a password is withdrawn, and the
   new code step is shown; a request the channel refuses at acceptance leaves the
   verified state in place *(FR-014, FR-034,
   FR-038)*; **And given** the bound on incorrect entries is reached, **Then**
   the code step ends and the page returns to the flow's first step with the
   notice FR-034 requires *(FR-034, FR-038)*

10. **AC-043**: **Given** any authentication form this slice ships has been
    submitted — the sign-up form, the sign-in form, or the password-recovery
    request — or a one-time
    code is being verified, or the new password is being set in password
    recovery, **When** the request is in flight, **Then** the page
    shows an in-progress state and the submit control is disabled; **And given**
    the same submission is sent twice, **Then** no second account and no second
    code dispatch results, because the server-side rules — the uniqueness rule
    and the single live pending request — remain the authority *(FR-040, FR-031,
    FR-034)*; **And given** the new password is submitted twice in
   password recovery, **Then** the password is set once and the account's
   sessions are ended once *(FR-040)*; **And given** a request's first response
   was lost and the person repeats it, **Then** the repeat produces no second
   effect and reaches a stated outcome: a sign-up or recovery submission still
   tied to its live pending request re-renders the code step, dispatches no second
   code, and leaves the code already sent valid with no part of the re-request
   limit spent, while a submission made after the page returned to its first step
   is a fresh request that replaces the pending request; a code entry whose first
   attempt reached its outcome re-renders that outcome, creates no second account
   or session, and does not consume the code again; a new-password
   submission whose first attempt set the password re-renders the confirmation,
   sets no password again, ends no session again, and sends no second notice; and
   a repeat of the account's own change or of the sign-out of every device is
   refused as an ended session, writes nothing, revokes nothing, and sends no
   second notice *(FR-040, FR-031, FR-034, FR-043, FR-013, FR-011)*; **And given**
   the code step's control
   that requests a new one-time code, **When** its request is in flight, **Then**
   the control is disabled and the step shows the in-progress state, so a
   repeated activation starts no second dispatch and spends one of the allowed
   re-requests *(FR-040, FR-034)*; **And given** a failure occurs while one
   of these three
   pages is being used, **Then** the page shows an inline, explicit, retryable
   failure message and does not navigate away, including when the failure is one
   this specification does not name — such as a session that cannot be created
   after a correct password or a correct code, or a request the service cannot
   serve because the store its data lives in is unavailable — and no error page
   is shipped or reached *(FR-040)*; **And given** that failure, **Then** the
   message names no wait and the page imposes no interval, so the person may
   submit again at once *(FR-040)*; **And given** a refusal answers a submission,
   **Then** the page
   stays on the step that was submitted, every field keeps the value the person
   typed except the password fields — cleared and never re-displayed — and the
   one-time-code field, cleared after a refusal of the code entry, while the
   sign-up form
   keeps the full name, mobile number, city, and shop name and the sign-in and
   recovery forms keep the mobile number *(FR-038, FR-040, FR-041)*;
   **And given** the flow reaches its terminal outcome message — the message the
   sign-up code step ends on for a number that already has an account, or the
   message a recovery request ends on for a number that has none or holds the
   administrator role — **Then** that message is announced to assistive
   technology, and the focus moves to it — its heading, because the message
   carries no field — and does not remain on a control the code step carried
   *(FR-040, FR-006, FR-014)*;
    **And given** any of those states — the in-progress state, the inline failure
    message, or the in-place confirmation — **Then** it is announced to assistive
    technology, and when a step replaces another the focus moves to the step now
    shown — its first field, or its heading when it carries no field — and does
    not remain on a control the previous step carried *(FR-040)*

11. **AC-046**: **Given** the sign-up form, **When** the full name is left empty
   or contains only spaces, **Then** the details are refused and no account is
   begun *(FR-001)*; **And given** a full name or an optional shop name longer
   than the stated maximum length, **Then** the details are refused *(FR-001)*;
   **And given** a full name or shop name within the limit, **Then** it is
   accepted exactly as typed — letters and numerals alike — with no
   alphabetic-shape rule applied *(FR-001)*; **And given** a full name or shop
   name carrying an emoji as the predicate FR-026 fixes decides it — an
   `Extended_Pictographic` code point, a keycap sequence, or a flag among them —
   **Then** it is refused with an explicit message naming the reason and no
   account is begun, while every other value within the bounds is accepted as
   typed, a bare numeral included, because no member of that predicate matches a
   numeral typed without it *(FR-001, FR-026)*; **And** the empty, the over-long,
   and the emoji refusals of the same field each carry their own text — one text
   per cause, selected by the cause the refusal names — so no two causes share a
   message and no page composes one *(FR-001)*; **And given** a shop name another
   account already holds, **Then** it is accepted, because no uniqueness rule
   applies to it *(FR-001)*

### User Story 2 — Sign in, sign out, and end every session (P1)

12. **AC-008**: **Given** a verified merchant, **When** they submit their mobile
   number and password, **Then** they are signed in and are not asked for a
   one-time code *(FR-007)*; **And given** the sign-in succeeds, **Then** the page
   renders a confirmation in place — no navigation, no new route, and no new page
   — stating that the merchant is signed in *(FR-007)*
13. **AC-009**: **Given** a sign-in attempt, **When** the number is unknown or the
   password is wrong, **Then** the response does not reveal whether an account
   exists, and it does the same work and takes the same time, within the
   tolerance recorded for the enumeration test, as an attempt
   against a blocked, a locked, or an administrator account *(FR-008, FR-017)*
14. **AC-010**: **Given** an account has five consecutive failed password
    verifications in one run — sign-in attempts, the current-password checks of
    the account's own change-password action, and the current-password checks of
    the administrator's forced first change, counted together in any mix —
    **When** a sign-in is attempted within the next fifteen minutes,
    **Then** it is refused with the same uniform response as any other failed
    sign-in, and nothing in that response tells the person the account is locked
    or that it exists *(FR-009, FR-008)*; **And given** the sign-in page renders
    any failed sign-in, **Then** it carries no lock-specific copy — no alert,
    banner, or field message names the lock — and the one uniform failure message
    is the only text shown, so a locked account is not identifiable from the
    page's copy *(FR-009)*; **And given** the merchant completes a
    password reset through the recovery flow while the account is locked, **Then**
    the lock still runs its full fifteen minutes and the count of consecutive
    failed password verifications is not reset *(FR-009)*; **And given** attempts
    are made while the account is locked, **Then** they are not counted as
    further failed password verifications and do not extend the lock *(FR-009)*;
    **And given** a successful password verification occurs on any of the three
    paths before five failures have accumulated, **Then** the count is cleared to
    zero and the next failure starts a new count of one — a successful sign-in, a
    successful change through the account's own action, and a successful forced
    first change each clear it *(FR-009)*; **And given** a refusal that never
    reached a password verification against an active account — a refusal
    produced by a rate limit, a refusal of a value that is not a valid Libyan
    mobile number, the refusal a blocked account receives, the refusal an
    administrator account receives on the merchant sign-in surface, a submission
    a value rule refuses before the check runs, or a refusal the lock itself
    makes — **Then** the count is not incremented and the lock is not driven by
    it *(FR-009, FR-017, FR-027, FR-028, FR-033, FR-035, FR-042)*; **And given**
    fifteen minutes have passed, **Then** a correct sign-in is accepted again and
    the count has cleared, so a single later failure does not re-lock the account
    *(FR-009)*; **And given** the account's own change-password action, or the
    administrator's forced first change, succeeds with the correct current
    password after failures have accumulated, **Then** the count is cleared to
    zero, while a lock already running is not lifted and keeps its full fifteen
    minutes *(FR-009)*; **And given** the account's own change-password action,
    or the administrator's forced first change, is submitted with a missing or
    wrong current password, **Then** the refusal counts toward the count, and
    five consecutive such refusals — alone or mixed with sign-in failures — lock
    the account for the same fifteen minutes, while the lock refuses sign-in and
    the current-password check of both password-change paths — the account's own
    action and the administrator's forced first change — for its full duration,
    but ends no session the attempt was made from, the restricted session
    included; each check resumes when the lock lifts, and a check the lock
    refuses is not counted and does not extend the lock *(FR-009,
    FR-013, FR-028)*; **And given** the change action's new password fails a value
    rule — the policy, or at the forced first change the rule that it must differ
    from the initial password — **Then** the submission is refused on that value
    ground before any current-password check runs, so it does not increment the
    count and does not drive the lock *(FR-009, FR-013, FR-028, FR-035, FR-051)*
15. **AC-011**: **Given** a signed-in merchant, **When** they sign out, **Then**
    the current session ends *(FR-010)*
16. **AC-012**: **Given** a signed-in merchant, **When** they sign out of every
    device, **Then** every session of their account ends *(FR-011)*
17. **AC-013**: **Given** a signed-in merchant, **When** the platform ends their
    session, **Then** their next action that requires a session is refused and
    they must sign in again *(FR-012)*
18. **AC-014**: **Given** a merchant changes their password, **When** the change
    completes, **Then** every existing session of the account ends, including the
    one the change was made from, and the merchant must sign in again with the
    new password *(FR-013)*; **And given** the merchant uses the account's own
    change action, **Then** the current password is required, and a change
    submitted without it or with a wrong one is refused and ends no session
    *(FR-013)*; **And given** a reset through the recovery flow is submitted at
    the same moment as the change, **Then** exactly one password is set — the
    one whose write takes effect first — the other submission is refused having
    written nothing, the change is refused as an ended session when the reset took
    effect first, and every session that existed when the winning write took
    effect ends with it *(FR-013, FR-014)*; **And given** a failure occurs
    between writing the new password and ending the account's sessions, **Then**
    neither takes effect — the previous password stands and every session remains
    — and the person sees the inline, retryable failure *(FR-013, FR-040)*
19. **AC-015**: **Given** a signed-in merchant has been inactive beyond the
    session timeout, **When** they next act, **Then** the session has ended
    and they must sign in again *(FR-032)*; **And given** the merchant's browser
    sends a request on its own while the merchant does nothing, **Then** that
    request does not count as activity, the inactivity clock is not reset by it,
    and the session still ends when the timeout elapses *(FR-032)*; **And given**
    the merchant opens a page or submits a form, **Then** that action counts as
    activity and resets the inactivity clock *(FR-032)*; **And given** a session reaches its
    absolute maximum lifetime while the merchant keeps using it, **Then** it
    ends at that point too, however active they are *(FR-032)*; **And given** the
    merchant closes the browser and reopens it, **Then** the session is still
    held and the merchant is still signed in, because the session outlives the
    page and the browser that created it and only the two clocks end it
    *(FR-032)*
20. **AC-040**: **Given** a security-relevant event this slice produces — a
    failed sign-in attempt, a successful sign-in, the verification that creates
    an account at sign-up, a lock applied, a password change or a reset, a failed
    password verification in a password change, a session revocation,
    a one-time-code or security-notice dispatch failure, or
    the operator's provisioning of an administrator account — **When** it
    occurs, **Then** a structured record is emitted for it, and that record
    carries no secret, no session token, and no personal data beyond what the
    constitution permits in a log *(FR-037)*; **And given** a sign-in attempt
    that reaches the account-existence comparison and does not succeed — a wrong
    password, an unknown number, a locked, a blocked, or an administrator account
    on the merchant surface — **Then** it is a failed sign-in attempt for this
    criterion and emits its record, while a format refusal and a rate-limit
    refusal emit none *(FR-037, FR-042, FR-033)*; **And given** a password
    change's current-password check fails — the account's own change action or
    the administrator's forced first change — **Then** the failure emits its own
    record, separate from a failed sign-in attempt, while a submission a value
    rule refuses and one the lock refuses before the check emit none *(FR-037,
    FR-009, FR-013, FR-028)*; **And given** the
    record's subject, **Then** it is identified by an internal account identifier
    where an account exists and by no account reference where none does, and no
    record carries the mobile number *(FR-037)*; **And given** a session ends,
    **Then** an explicit end — a sign-out, a sign-out of every device, or a
    platform revocation — emits the revocation record, while an end at the
    inactivity timeout or at the absolute maximum lifetime does not, and a
    password change or reset emits its own record alone rather than a second one
    for the sessions it ended *(FR-037, FR-032, FR-013)*
21. **AC-045**: **Given** the sign-in page or the password-recovery page,
    **When** the submitted value is not a valid Libyan mobile number on +218,
    **Then** it is refused with a distinct, explicit refusal stating that the
    value is not a valid Libyan mobile number, and that refusal is not the
    uniform refusal FR-008 defines and is excluded from SC-004's enumeration
    comparison *(FR-042)*
22. **AC-047**: **Given** an account's password changes — through the recovery
    flow, through the account's own change action, or through the
    administrator's forced first change — **When** the change
    completes, **Then** a notice is sent by SMS to the registered mobile number,
    whose body is Arabic and right-to-left with Latin numerals and no emoji
    *(FR-043, FR-026)*; **And given** every session of an account is ended at
    once, **Then** the same notice is sent *(FR-043)*; **And given** a password
    change, which ends every session of the account by FR-013, **Then** it sends
    one notice that reports the change and the sessions it ended, not a second
    notice for those sessions, because they are the change's own consequence
    rather than a second action *(FR-043, FR-013)*; **And given** a completed
    password change or sign-out of every device is repeated after its first
    response was lost, **Then** it writes nothing and sends no second notice,
    because the first ended every session including the one it was issued from
    *(FR-043, FR-040, FR-013, FR-011)*;
    **And given** an ordinary
    sign-in or an ordinary sign-out, **Then** no notice is sent *(FR-043)*;
    **And given** the notice cannot be sent, **Then** the change and the ending of
    the sessions still stand and are not blocked, and the failed send is recorded
    as the dispatch failure FR-037 names *(FR-043, FR-037)*; **And given** the
    channel accepts the notice but it is never delivered, **Then** the platform
    neither retries nor reports it, and the change or the ending of the sessions
    still stands, because the guarantee ends at the channel's acceptance
    *(FR-043)*; **And given** the
    operator's provisioning action sets the administrator account's initial
    password, **Then** no notice is sent, because the action sets an account's
    first password rather than changing one the account already holds, and the
    provisioning stays recorded as the structured security event FR-037 names
    *(FR-043, FR-028)*

### User Story 3 — Recover a forgotten password (P2)

23. **AC-016**: **Given** a merchant has forgotten the password, **When** they
    ask to reset it with their registered mobile number, **Then** a one-time code
    is sent by SMS to that number and, once the code is entered correctly, they
    can set a new password *(FR-014)*; **And given** the number's account holds
    the administrator role, **Then** the reset is refused after the code is
    verified — no password is set, no session is created, and the platform states
    explicitly that the credential cannot be reset on this surface, while the
    request, the following step, and the code dispatch stayed indistinguishable
    *(FR-014, FR-027)*; **And given** the account is both blocked and holds the
    administrator role, **Then** the role decides — no password is set, no session
    is created, the platform states that the credential cannot be reset on this
    surface, and the block is not mentioned, while the request, the following
    step, and the code dispatch stayed indistinguishable *(FR-014, FR-027)*;
    **And given** the new password is set for an account that
    is not blocked, **Then** the page
    renders a confirmation in place — no navigation, no new route, and no new page
    — stating that the password was changed and that the merchant must sign in with
    it *(FR-014)*; **And given** the account whose password is reset is blocked,
    **Then** the confirmation states both that the password was changed and that
    the account is blocked, so sign-in stays refused until an administrator
    returns the account to active, and nothing about the block is disclosed
    before the code is verified *(FR-014, FR-017)*; **And given** the account's
    password changes by another path while a recovery request for its number is
    live — or while its verified new-password step is live — **Then** that change
    ends the request and its verified state at once, the code already delivered
    and the step can no longer set a password, and the person must start a fresh
    recovery, while a successful sign-in alone ends nothing *(FR-013, FR-014,
    FR-034)*; **And given** the reset cannot proceed — the number has no account,
    or its account holds the administrator role — **Then** the code step is
    replaced in place by the outcome message, with no navigation and no new
    route, the person stays on it, no retry control is offered, and a reload or
    a fresh opening returns the page to the flow's first step *(FR-014, FR-036,
    FR-038)*; **And given** a failure occurs between setting the new password
    and ending the account's sessions, **Then** neither takes effect — the
    password is not set, every session remains, and the verified state stays live
    until its own expiry — and the person retries the same step *(FR-014,
    FR-013, FR-040)*; **And given** the account's own change action is submitted at the
    same moment as the new-password submission, **Then** exactly one password is
    set — the one whose write takes effect first — and if the change took effect
    first the reset is refused as an ended request, sets no password, and returns
    the page to the flow's first step with the ended-request notice *(FR-013,
    FR-014)*
24. **AC-017**: **Given** a password-recovery request, **When** the number has no
    account, **Then** the request's response, the following step, and the sending
    of the code do not reveal whether an account exists and match, on SC-004's
    comparison (which masks the values SC-004 names), those for a
    number that has an account, and that indistinguishability is bounded to those
    steps; **And when** the correct code is entered, **Then** ownership of the
    number is proven and the platform states explicitly that no account exists
    for that number, so no password is set; **And then** the code step is
    replaced in place by that message, with no navigation, and a reload or a
    fresh opening returns the page to its first step, on the terms AC-016 states
    *(FR-014, FR-015, FR-036, FR-038)*
25. **AC-038**: **Given** a merchant completes a password reset through the
    recovery flow, **When** the new password is set, **Then** every existing
    session of the account ends, and, for an account that is not blocked, the
    merchant must sign in with the new password, while a blocked account's block
    stands and its confirmation says so as AC-016 provides *(FR-013, FR-014,
    FR-017)*

### User Story 4 — Account status and control over sessions (P2)

26. **AC-018**: **Given** an account, **When** its status is read, **Then** it is
    exactly one of active or blocked *(FR-016)*
27. **AC-019**: **Given** a merchant is blocked, **When** they try to sign in,
    **Then** the attempt is refused with the same uniform response as any other
    failed sign-in and nothing in that response tells the person the account is
    blocked or that it exists, the response doing the same work and taking the
    same time as any other failed sign-in, and their data and public
    contributions remain in place *(FR-017, FR-008)*
28. **AC-020**: **Given** a signed-in merchant, **When** they look for a way to
    delete their account, **Then** no such control is offered and any such
    request is refused *(FR-018)*; **And given** an account an administrator
    removes, **Then** its personal data is removed by that action or by the
    retention job, whose trigger and scope this specification does not fix, with
    no retention period fixed by this specification and no trigger asserted for
    one; every session it held is withdrawn and stops granting access, a live
    pending request for its mobile number ends with its code no longer valid,
    and no stored credential of it permits a sign-in *(FR-018)*
29. **AC-021**: **Given** an account is blocked, **When** a session it already
    held issues a request after the block was recorded, **Then** access is
    refused *(FR-019)*; **And given** a request from that session had already
    passed the single shared entry point when the block was recorded, **Then**
    that request is decided on the state it met and is neither interrupted nor
    refused for the block, while the request that follows it is refused with the
    blocked variant of the ended-session state FR-049 defines, whichever page
    issued it *(FR-019, FR-049)*

### User Story 5 — Move around the platform inside the shared page frame (P2)

30. **AC-022**: **Given** the shared frame as delivered, **When** it is applied
    to a page on the public site or in the merchant's area, **Then** the frame is
    present, each surface at the width and in the composition the requirement
    that owns it fixes — the header by FR-023, the sidebar by FR-022 and FR-039,
    the bottom bar by FR-052, and the footer band by FR-024 — together with the
    product's icon set and the product's typography, which FR-020 names; the
    criterion asserts each surface's presence and names the requirement that
    owns it rather than restating that requirement's composition, so the frame
    keeps the one home FR-020 gives it and one authority per surface; in this
    slice the scoping is verified structurally, because no public or merchant
    content page ships until a later slice; and the icon set is the one already
    chosen and recorded (ADR-098), whose register gap ADR-146 closes by keeping
    the set an asset of the Wafar UI layer rather than a row of the technology
    register; this slice delivers it through the layer's vendoring, with the
    licence-obligation record and the vulnerability scan the gap rule required
    *(FR-020, FR-022, FR-023, FR-024, FR-039, FR-052)*;
    **And given** the frame as delivered, **When** its controls are
    inspected, **Then** each of them — the logo/home, account, the account
    menu's three items, the notifications control, the theme switch, the
    sidebar-collapse control, the bottom bar's five slots, and the
    footer band's links — carries an accessible name, a role, and keyboard
    reachability, asserted structurally here, while the runtime scan and
    keyboard pass wait for the slice that ships the first page carrying the
    frame *(SC-006)*; **And given** the header's notifications control,
    **Then** it is a link to the Notifications route the frame's decision record
    fixes — the same route the sidebar's Notifications item carries — so no
    control the frame carries is left without a definite target, and in this
    slice it carries no unread badge, because the count arrives with R9
    *(FR-023, FR-024)*
31. **AC-023**: **Given** any of the pages this slice ships — sign-up, sign-in,
    and password-recovery — **When** it renders, **Then** the frame is absent,
    with no frame header, no sidebar, no bottom bar, and no footer
    band, while the chosen appearance still applies
    (AC-027); the page carries the bare layout's own composition — the product's
    wordmark above the page title and the page title above the form card — the
    wordmark being non-interactive and reading «منصة وفر», the visible title
    being the page's own Arabic name as FR-021 fixes it and carrying no brand,
    and the browser title being `<page name> — منصة وفر` with the brand in the
    Glossary's exact form; the wordmark and the page title are neither the
    frame's header nor its logo/home control, so the bare page's only navigation
    remains the cross-links FR-036 fixes; the error page and the four static pages stay bound
    by the same rule but are verified by the slice that ships them *(FR-021,
    FR-036)*
32. **AC-024**: **Given** a wide screen of 1024 CSS px or more, **When** the sidebar collapse control —
    carried in the sidebar — is used, **Then** the sidebar narrows to an
    icon-only rail and can be restored; **And given** a narrow screen at the
    smallest supported width of 320 CSS px, **When**
    the bottom bar's «المزيد» slot is activated, **Then** the sidebar opens as a
    drawer, and **When** the collapse control inside the drawer is used, **Then**
    the drawer closes; **And when** the person presses Escape or activates
    something outside the drawer, **Then** it closes and the focus returns to
    «المزيد»; the header carries no drawer control;
    **And given** the drawer is open and the person activates one of its
    navigation items, **Then** the drawer closes as part of the navigation;
    **And given** the drawer is open, **Then** the bottom bar stays
    rendered and visible, with «المزيد» showing its open state, **and** no
    surface below the drawer's scrim — the header's controls and the bar's slots
    included — receives an activation, so an activation on «المزيد», on the account
    control, or on a slot closes the drawer and performs nothing beneath it, and
    the account menu does not open over the drawer;
    in this slice the controls and every behaviour the delivered controls can
    exercise without a rendered page are verified as part of the frame's
    composition — the sidebar's two-width behaviour, the drawer's open state,
    its three dismissals with the focus return to «المزيد», an item's
    activation closing it as part of the navigation, and the bottom bar's
    rendered and visible state under the open drawer — while the page
    behaviour alone is verified by the slice that ships the first page
    carrying the frame: the focus landing on the destination page's heading,
    the drawer's focus containment, the overlays'
    stacking order and the consumption of an activation outside them, and the
    guest's redirection on a page that carries the frame, because no page here
    renders it, on the boundary SC-005 fixes and under exception EX-007
    *(FR-022, FR-023, FR-052, FR-048)*
33. **AC-025**: **Given** the frame as delivered, **When** its header is
    inspected, **Then** it carries the logo/home control at its inline-start
    edge and, at its inline-end edge, the notifications control, the theme
    switch, and the account control for a signed-in merchant, and no
    page-navigation link — no item of the navigation item list FR-039 fixes is
    rendered in it, in the sense FR-023 gives the term — or sidebar-collapse
    control, while the logo/home control, the notifications control, and the
    guest's sign-in action each stay a link to their own route; the account
    control carries the accessible name «حسابي» and shows the icon alone, with no
    merchant name in the header;
    the account control opens the account menu FR-047 fixes, with its three
    items and its sign-out confirmation; for a guest the header
    carries the sign-in action in place of the account control and the
    notifications control, with no account menu, and the guest keeps the theme
    switch, while the collapse control is found in the sidebar; **And given** the
    smallest supported width of 320 CSS px, **Then** all four controls remain in
    the single header row — none dropped, folded into an overflow menu, or moved
    into the account menu — each keeping its accessible name and its touch
    target at the floor the design contract fixes, with no horizontal page
    scroll, and a guest's three controls — the logo/home control, the theme
    switch, and the sign-in action — remain in that row under the same rule,
    each keeping its accessible name and its touch target *(FR-023)*; the
    controls
    are verified structurally, and the data behind the
    menu's destinations arrives with the slice that owns each destination
    *(FR-023, FR-047, SC-006)*
34. **AC-026**: **Given** the frame as delivered, **When** a person needs the
    static pages, **Then** the frame gives them a way to reach Contact, Privacy
    Policy, Terms of Use, and FAQ, verified structurally, and the surface that
    carries those links is fixed by the constitution (ADR-096) and built in this
    slice — the frame's footer band, present at the wide width on every page
    that carries the frame and absent from every bare page; below 1024 CSS px
    the band is not rendered, and the same four links sit at the bottom of the
    drawer the bottom bar's «المزيد» slot opens, so the way to the four pages is
    not lost
    (ADR-127); this slice records the decision that fixes the four routes, which
    the slice that ships the static pages adopts, and that record additionally
    fixes the destination of the header's guest sign-in action and the routes of
    the three bare pages this slice ships, so no link this slice builds is left
    without a target; the
    reachability requirement itself is discharged by the slice that ships the
    first page carrying the frame, and the deferral is recorded
    with an owner and a review date
    *(FR-024, FR-052)*
35. **AC-027**: **Given** the frame is present, **When** the theme switch — a
    header control, beside the notifications control — is used, **Then** the
    interface moves between dark and
    light, the
    chosen appearance holds as the person moves between pages — including to a
    bare page, where it is applied before the page is painted and no switch is
    offered — and it is remembered for that browser without being stored on the
    account; the switch's presence and its position in the header are verified
    structurally in this slice, and its runtime behaviour is verified by the
    slice that ships the first page carrying the frame *(FR-025)*
36. **AC-028**: **Given** every text the platform delivers to a person — what a
    screen renders, the frame this slice delivers, and the body of every message
    it sends by SMS — **When** that
    text is produced, **Then** the text the platform itself writes — its labels,
    its messages, and the numerals it generates — is Arabic and right-to-left
    with Latin numerals, carries no diacritics, and carries no Latin characters
    beyond the closed set — the digits 0–9, the `+218` prefix, and `SMS` — and
    every icon a screen renders is from the product's
    icon set and never an emoji, while a message body is judged by the same
    language, numeral, and no-emoji rules and carries no icon; **And** the
    direction is read where it is declared rather than in the string: every
    document the platform serves declares Arabic as its language and
    right-to-left as its base direction, and no frame component sets a direction
    or language of its own, and a message body, which carries no markup, opens
    with Arabic text; **And given** a
    full name or a shop name carrying Arabic-Indic digits or a Latin word,
    **Then** the value is shown as it was typed and is neither transliterated nor
    re-numeralised, and it renders as one isolated bidirectional run whose
    direction is taken from its own first strong character, so a Latin word
    inside an Arabic name neither reorders the name nor is reordered by the
    page *(FR-045)*, while the mobile number and the one-time code are shown in
    their canonical Latin-numeral form — the number in the one display form
    FR-038 fixes, `+218 91 234 5678` — as one isolated left-to-right run;
    **And given** a full name or a shop name
    carrying an emoji as the predicate FR-026 fixes decides it, **Then** it is
    refused with an explicit message naming the reason and no account is begun,
    because no emoji may appear in any text a person reads;
    the criterion's scan covers the platform's own strings on every screen, in
    the frame this slice delivers, and in every message template for the language,
    numeral, no-diacritics, and permitted-token rules, and every text a person
    reads for the no-emoji rule; **And** every string a page, the frame, or a
    message template renders is the text recorded for its state, reason, or
    cause — no page composes a sentence of its own, and the same cause renders
    the same text wherever it appears; **And** no text names a state this
    specification does not have: the sign-in page's copy names neither the lock
    nor the blocked status and shows no countdown, and a status- or role-specific
    text appears only on a surface where this specification defines that state
    *(FR-026, FR-001, FR-038, FR-009, FR-017; revised 2026-11-01, 2026-11-02,
    and 2026-11-04, Clarifications)*
37. **AC-039**: **Given** the three bare pages this slice ships — sign-up,
    sign-in, and password recovery — **When** any of them renders, **Then** it
    offers the way to the other pages it links to: sign-in offers the way to
    sign-up and to password recovery, sign-up offers the way to sign-in, and
    password recovery offers the way back to sign-in, so each journey has a
    defined entry point even though no page renders the frame *(FR-036)*
38. **AC-042**: **Given** the frame as delivered, **When** its composition is
    inspected, **Then** the assertion set is each control's presence, its
    accessible name, its role, and its keyboard reachability, and nothing this
    criterion does not name: the sidebar carries its nine-item navigation list —
    one item per registered destination a guest or a signed-in merchant can reach
    on the public site and in the merchant's area (Home, Parts, Catalog, Upload
    Catalog, My Files, Cart, Notifications, Messages, Profile), with no item for
    the three bare pages this slice ships and no item for the four static pages —
    each item pointing at the route this slice's decision record fixes, its whole
    label carried as its accessible name in the full sidebar and in the icon-only
    rail, where no visible label is rendered, and the same list shown to a guest
    and to a signed-in merchant with no item added, removed, or disabled by role;
    the sidebar carries its collapse control; the bottom bar carries its five
    slots — Home, Upload Catalog, a raised search action to the Parts page, My
    Files, and «المزيد» — is absent from 1024px up, is one composition shown
    identically to a guest and to a signed-in merchant with a guest's
    merchant-area slot present and enabled, and keeps its labels at 320 CSS px
    with no label dropped or abbreviated; the drawer carries the same nine-item
    list and, at its bottom, the four static-page links AC-026 names; the header
    carries its logo/home control, notifications control, theme switch, and
    account control; and the account menu carries its three items and the
    sign-out confirmation's markup, each with its accessible name and role.
    **And given** a runtime behaviour this criterion does not assert — the
    overlaying surfaces' stacking order, the consumption of an activation outside
    them, the drawer's focus containment, the focus landing on a destination
    page's heading, the account menu's live open and dismissal, the guest's
    redirection, the bottom bar's scroll-hide, and the label cut at the
    inline-end — **Then** it is the page behaviour the slice that ships the first
    page carrying the frame (R2) verifies under exception `EX-007`, and this
    criterion MUST NOT be read as asserting it here *(FR-026, FR-039, FR-052;
    revised 2026-11-04, Clarifications)*.
39. **AC-044**: **Given** a signed-in person, **When** they open one of the three
    bare pages this slice ships — sign-up, sign-in, or password recovery —
    **Then** the page renders exactly as it does for a guest, with no redirect
    and no signed-in-specific surface *(FR-041)*; **And given** an action taken
    on one of those pages completes and its confirmation is rendered in place,
    **Then** that confirmation is the outcome of the action rather than a
    signed-in-specific surface, and reloading or freshly opening the page returns
    it to its first step with no confirmation re-shown and no redirect *(FR-041,
    FR-004, FR-007, FR-014)*

40. **AC-051**: **Given** the frame as delivered, **When** the account control is
     activated, **Then** a menu carrying exactly «حسابي»، «إعدادات»، and
     «تسجيل الخروج» opens, each item carries an accessible name and a role, and
     the menu is keyboard-reachable; «حسابي» points at the Profile page's route
     and «إعدادات» at that page's settings anchor, both on the one Profile route
     the frame's decision record fixes, and no item points at any other page;
     **And given** the menu is open, **When** the person presses Escape, activates
     something outside it, or moves the focus out of it, **Then** the menu closes
     without action and the focus returns to the account control, **and** that
     outside activation performs nothing beneath it, so an activation on a
     bottom-bar slot or on «المزيد» closes the menu without acting on the slot and
     without opening the drawer, while the menu does not open over the drawer;
     **And given** the «تسجيل الخروج» item is
     activated, **Then** a yes-or-no confirmation is shown, cancelling it leaves
     the session untouched, and confirming it ends the session; **And given** the
     account control opens the menu, **Then** the focus moves
     to its first item, and the menu still closes when focus leaves it, with the
     focus returning to the account control; the menu's composition — its three
     items, their accessible names and roles, its keyboard reachability, the
     sign-out confirmation's markup, and the two items' link targets — is
     verified structurally in this slice; the menu's live open, its runtime
     dismissal, and the confirmation's result are verified by the slice that
     ships the first page carrying the frame (R2) on the boundary SC-005 fixes
     under exception `EX-007`; and the destinations the two items name — the
     Profile page and its settings section — with the page's own content, the
     account's full name, city, and status at its top and no other account
     field, are delivered and verified by the Profile slice (R7) against FR-047
     and recorded as Complexity Tracking row 34 *(FR-047; revised 2026-11-04,
     Clarifications)*

41. **AC-052**: **Given** a guest on a page that carries the frame, **When** the
     guest activates a sidebar item that names a merchant-area destination —
     Upload Catalog, My Files, Cart, Notifications, Messages, or Profile —
     **Then** the sign-in page
     is shown, while the three items that name a public destination — Home,
     Parts, and Catalog — open their own pages; the item list itself is
     unchanged, with no item added, removed, or disabled by role; the rule adds
     no page and no route, and the return to the wanted item after signing in
     belongs to the slice that ships the merchant area's pages; the item list
     and the rule are verified structurally in this slice, and the guest's
     redirection is verified by the slice that ships the first page carrying the
     frame *(FR-048, FR-039)*
42. **AC-053**: **Given** a signed-in merchant on a page that carries the frame,
     **When** a request is refused because the session has ended — whether by
     the inactivity timeout, the absolute maximum lifetime, an explicit sign-out
     elsewhere, a platform revocation, a sign-out of every device, or a password
     change or reset made elsewhere — or because the account
     is blocked, **Then** an explicit state inside the frame states that the
     session has ended and, where the account is not blocked, offers the way to
     sign in again; it says plainly that the account is blocked when that is the
     reason, and the blocked variant offers no way to sign in, because the block
     refuses every sign-in and no control the state carries may fail for the
     reason the state itself reports; in that state the header carries the header
     state FR-023 fixes for that variant, in both its unblocked and its blocked
     form, so no control the header carries can fail for the reason the state
     reports; no unrelated error is
     shown, the frame sends no further requests for a session that no longer
     exists, and the state adds no page and no route; **And given** the merchant
     confirms the sign-out in the account menu, **Then** that same state is shown
     in the page they were on; **And given** the state appears, **Then** it is
     announced to assistive technology and the focus moves to its heading, never
     remaining on a control the page carried before the refusal; the state is
     verified structurally in this slice,
     and its runtime behaviour is verified by the slice that ships the first
     page carrying the frame *(FR-019, FR-049, FR-011, FR-012, FR-013, SC-006)*

### User Story 6 — The operator creates the administrator account (P3)

43. **AC-029**: **Given** the public sign-up flow, **When** a person completes
    it, **Then** they become a merchant and never an administrator *(FR-027)*;
    **And given** an administrator account's mobile number and password are
    submitted on the merchant sign-in surface, **Then** the attempt is refused
    with the same uniform response as any other failed sign-in and nothing in
    that response tells the person the account exists or that it is an
    administrator account, and the response does the same work and takes the
    same time as any other failed sign-in *(FR-027, FR-008)*
44. **AC-030**: **Given** the operator creates the administrator account,
    **When** it is provisioned, **Then** it carries the requirement to change
    the password at first sign-in, so that the first sign-in is accepted and no
    product action other than the password change is permitted until the change
    is made, while ending the session — sign-out, the session timeout, and a
    platform revocation — remains available,
    and that requirement is cleared by the change made at that first sign-in,
    which lifts the restriction and MUST set a value different from the initial
    password the operator supplied — a submission repeating the initial
    password is refused and clears nothing, and a submission without the current
    password or with a wrong one is refused, clears nothing, leaves the account
    restricted, and counts as a failed password verification under FR-009; while
    the account is locked, that check is refused for the lock's full duration,
    exactly as the account's own change action's check is, the restricted session
    remains available to end, and the forced change resumes when the lock lifts —
    and by no other path, the change
    also ends every existing session of the account, including the restricted
    session it was made from, and sends the security notice FR-043 requires, the whole
    rule being verified at the behaviour level with no page because the
    administrator's first sign-in is delivered here as behaviour *(FR-028,
    FR-035, FR-009, FR-013, FR-043)*;
    **And given** the provisioning action runs, **Then** it creates the account
    directly with no one-time code and no verification step, with the status
    active and the administrator role, and the account
    carries the identity details the register requires, including an initial
    password the operator supplied that satisfies the password policy *(FR-028,
    FR-035)*; **And given** the provisioning action takes that initial password,
    **Then** it does so only through a hidden prompt or an input stream the
    operator supplies directly — never as a value carried in the command that starts
    the action, never from an environment variable, and never from a stored
    configuration file — so the
    credential appears in no command history and in no process list; it is never
    echoed, never displayed or repeated in any output the action produces (its
    success report included), and never written to a log, a security record, an
    error, or a diagnostic, and the report names only the account and the
    outcome *(FR-028)*; **And given** the credential is handed to the
    administrator, **Then** no page, one-time-code message, or security notice
    carries it, and it travels only through a channel the operator controls
    outside the platform *(FR-028)*; **And given** the initial password cannot be set while the account
    is being created, **Then** no account is created and no account row survives
    without a usable password, the run fails as a whole and reports the failure
    to the operator, because the account and its initial usable password are one
    indivisible step *(FR-028)*; **And given** a value the action is given fails an account field
    rule — a full name outside its bounds, a number that is not a Libyan mobile
    number on +218 against the fixed dataset, or a city not on the fixed list —
    **Then** the action refuses it, reports the refusal to the operator, and
    creates no account *(FR-028, FR-001, FR-003, FR-005)*; **And given**
    the provisioning action is run twice with two distinct mobile numbers,
    **Then** each run yields a distinct administrator account and no cap on the
    number of administrator accounts is applied *(FR-028)*; **And given** the
    action is run for a mobile number that already has an account, **Then** no
    second account is created for that number and the conflict is reported to
    the operator *(FR-028, FR-031)*; the sign-in
    surface — the page — is verified by the slice that ships it *(FR-028)*; **And given** the
    forced change's new password fails a value rule — the password policy or the
    rule that it must differ from the initial password — **Then** the submission is
    refused on that value ground before any current-password check runs, clears
    nothing, leaves the account restricted, and does not increment the
    consecutive-failed-attempt count *(FR-028, FR-035, FR-009)*; **And given** the
    provisioning action runs, **Then** it is out of band — run by the operator
    outside the administrator application — so it writes no audit-log row, and
    the provisioning is recorded as the structured security event FR-037 names
    *(FR-028, FR-037)*

45. **AC-054**: **Given** the administrator application, **When** its header is
     inspected, **Then** it carries the platform's logo at the inline-start edge
     and an account control whose menu offers «تسجيل الخروج» only; this slice
     binds that composition and delivers nothing of it, and the slice that
     ships the administrator application builds and verifies it *(FR-050)*

### User Story 7 — Sign-up resists automated abuse without a CAPTCHA (P1)

46. **AC-031**: **Given** the sign-up form, **When** it is submitted with the
    hidden field filled in and the operation's rate limit does not refuse the
    submission first, **Then** no account is created and the response's text and
    status are the same as those of the response a successful submission
    receives on SC-004's comparison — its text compared after the
    values SC-004 names are masked — and its duration does not fall short of
    that response's by more
    than the numeric tolerance — a median of no more than 50 ms and a p95 of no
    more than 150 ms over repeated samples of both cases, measured with the
    enumeration test's sampling — so nothing in the response, its timing
    included, tells the sender it was detected; the comparison is one-sided —
    the silent response MUST NOT be observably faster than the successful
    submission by more than the tolerance, and being equal or slower passes —
    and the successful submission used as the comparator is one whose one-time-code
    dispatch the channel accepted, while a channel refusal is outside SC-004's
    comparison under exception 6 and is never the comparator; **And given** that refusal, **Then**
    no pending request is started, no one-time code is dispatched to the
    submitted number, the code step is not
    reached, and the person stays on the form's first step, while the response
    carries no next-step content so the same response can lead a successful
    submission to the code step *(FR-029)*; **And given** a submission whose
    account-creation budget is already spent, **Then** the rate limit decides it
    first and it receives the distinct, explicit limit refusal whatever else is
    wrong with it, a filled hidden field included, so this criterion's silent
    response is not what it receives *(FR-051, FR-033, FR-029)*
47. **AC-032**: **Given** the sign-up form, **When** it is submitted before the
    minimum time has passed since the platform served it — or with a value that
    is absent, malformed, not one the platform issued, or outside the platform's
    validity window — **Then** no account is created and the person receives an
    explicit, retryable refusal *(FR-029)*
48. **AC-033**: **Given** one client — identified by the request's network
    origin — submits the sign-up form more often than the
    allowed rate, **When** the next submission arrives, **Then** it is refused
    with a distinct, explicit refusal stating that the limit was exceeded and
    that the person may retry later *(FR-029)*; **And given** a submission the
    form's own hidden field or minimum time-to-submit refuses, **Then** it still
    counts against that same account-creation budget, so a client that only fills
    the hidden field is bounded too *(FR-029, FR-033)*
49. **AC-034**: **Given** any public form, **When** it is shown, **Then** no
    CAPTCHA challenge is ever presented *(FR-030)*
50. **AC-035**: **Given** one client — identified by the request's network
    origin — submits an authentication operation
    (account creation, sign-in, or password recovery — account creation being the
    sign-up form's own submission, whose limit is that same budget, FR-029) more
    often than the allowed rate, **When** the next submission arrives, **Then** it is refused with the
    same distinct, explicit limit refusal, which states that the limit was
    exceeded and that the person may retry later *(FR-033)*; **And given** that
    refusal, **Then** it shows no countdown or timer, the response carries the
    remaining time to the limit's window boundary as a machine-readable value,
    and whether a later attempt is accepted is decided by that boundary alone
    *(FR-033)*;
    **And given** a client exhausts the limit of one of the three operations,
    **Then** the other two remain available, because each operation carries its
    own budget *(FR-033)*; **And given** one network origin exhausts an
    operation's budget, **Then** another origin's budget for the same operation
    is unaffected *(FR-033)*; **And given** one submitted mobile number exhausts
    its own budget for an operation, **Then** another number's budget for that
    operation is unaffected, so requests for one number do not spend another
    number's budget *(FR-033)*; **And given**
    one origin exhausts a mobile number's budget for an operation, **Then** a
    request for that same number from another origin is refused with the same
    distinct, explicit limit refusal, because the number key is global to the
    number, while that other origin's own budget remains intact for every other
    number and for the other two operations *(FR-033)*; **And given** a
    submission whose mobile-number value is not a valid Libyan number and
    therefore has no normalized form, **Then** only the origin key bounds it —
    it consumes that origin's budget for the operation and no number's budget,
    and, unless that origin's budget is already spent, the limit does not decide
    it: the refusal comes from the next step in FR-051's order, the format
    refusal at sign-in and in password recovery or the sign-up form's own steps
    *(FR-033, FR-042, FR-051)*; **And given** a submission on a later step of the
    same page — a one-time-code entry or a new-password submission — **Then** it
    neither consumes the operation's budget nor is refused by it when the budget
    is spent, because those steps are bounded by the code's own limits
    *(FR-033, FR-034, FR-051)*
51. **AC-036**: **Given** a one-time code, **When** it has expired, or a new code
    is requested beyond the allowed limit, or it is entered incorrectly more than
    the allowed number of times, **Then** the platform refuses it and grants no
    access; **And given** a new code is requested, **Then** the replacement takes
    effect only when the messaging channel accepts the new message, the previous
    code stops being valid at that moment, and the count of incorrect entries is
    not reset, so
    the bound holds over the whole verification *(FR-034)*; **And given** the
    replacement is installed at that accepted dispatch, **Then** installing its
    protected value and invalidating the previous code take effect together, and a
    failure between them leaves the previous code valid, the pending request
    unchanged, and the re-request limit unspent *(FR-034)*; **And given** that
    accepted replacement, **Then** the pending request and the new code get a
    full period from that moment, so the new code is never delivered with only
    the remainder of the request it replaced, while the re-request limit bounds
    repeated extension and a refused dispatch changes neither the code nor the
    expiry *(FR-034)*; **And given** the
    code entered is expired, or a code a replacement has superseded, **Then** it
    is refused as expired or superseded and does not increment the bound on
    incorrect entries, while a wrong value for the live code does *(FR-034)*;
    **And given** a new
    code is requested beyond the allowed limit, **Then** the request is refused
    with a distinct, explicit refusal stating that the limit was exceeded and that
    the person may retry later, and that refusal shows no countdown, carries the
    remaining time to the pending request's own boundary as a machine-readable
    value, and leaves the pending request's clock and the limit's allowance to
    decide when a new request is accepted, and that refusal is excluded from SC-004's
    enumeration comparison on the re-request exception SC-004 states
    *(FR-034)*; **And given** a
    fresh sign-up or recovery request is started for the same number, **Then** it
    begins a new verification with a full allowance of new-code requests, because
    the operation's own budget bounds how often a fresh request can start and the
    spent allowance is not carried across requests *(FR-034)*; **And given** the
    messaging channel refuses the code at acceptance, **Then** an explicit
    failure state allows a retry, the pending request — a sign-up or a password
    reset — stays valid until it expires, the code already delivered stays
    valid because the replacement takes effect only once the channel accepts the
    new message, and the failed send does not count
    against the re-request limit; the failure is shown on the submission that
    asked for the code and the code step is never reached, because the send is
    attempted inside that request and the step opens only once the channel has
    accepted the message, so no failure reaches a person who has already moved
    on *(FR-034)*; **And given** that failure state, **Then** it is excluded from
    SC-004's enumeration comparison on the channel-failure exception SC-004
    states *(FR-034, SC-004)*;
    **And given** the messaging channel neither accepts nor
    refuses within the platform's request timeout, **Then** the attempt is
    treated as that same refusal at acceptance — the explicit, retryable failure
    on the submission, no code step, the pending request live, a code already
    delivered still valid, and no part of the re-request limit consumed
    *(FR-034)*; **And given** the messaging channel
    accepts the message but delivery later fails, **Then** no failure state is
    shown, the code stays valid until it expires, and the person can request a
    new code subject to the re-request limit, because a later delivery failure
    is outside the platform's observation *(FR-034)*; **And given** a new sign-up or
    recovery request is started for a number that already has a live pending
    request, **Then** the previous pending request and its code are replaced and
    stop being valid once the messaging channel accepts the new message, and a
    request the channel refuses at acceptance leaves the previous request and
    its code live and shows the explicit, retryable failure, including a pending
    request in the recovery flow's verified state, whose authority to set a
    password ends when the new message is accepted
    *(FR-014, FR-034)*; **And given** the bound on incorrect
    entries is reached, **Then** the pending request ends, the page returns to
    the flow's first step with an explicit, retryable notice that the request
    ended and that a new code must be requested, no further code for it is
    accepted, and a fresh request begins a new verification with the count of
    incorrect entries at zero *(FR-034, FR-038)*; **And given** that fresh
    request is itself refused by the messaging channel at acceptance, **Then**
    the explicit, retryable failure is shown on the form's submission, no code is
    left valid because the request that ended at the bound left none, and no part
    of the re-request limit is consumed, because the fresh request begins with a
    full allowance *(FR-034)*; **And given** the pending
    request reaches the end of its own lifetime while the person is on the code
    step, **Then** the code step ends at that moment, the page returns to the
    flow's first step with an explicit, retryable notice that the request
    expired and that a new code must be requested, with no navigation, no new
    route, and no new page, and a code submitted after that moment is refused as
    expired and does not increment the bound on incorrect entries
    *(FR-034, FR-038)*; **And given** the correct code is
    entered but the account cannot be created at that moment, **Then** the
    pending request stays valid and the same code remains usable, no account
    is left behind because the account's creation and the session that makes it
    usable are one indivisible step, an explicit
    retryable failure is shown, and the failure counts neither as an incorrect
     entry nor against the limit on requesting a new code *(FR-004, FR-034)*;
    **And given** the correct code is entered in the password-recovery flow,
    **Then** it stops being usable at once, the pending request carries the
    new-password step as a verified state that lasts no longer than the pending
    request's own lifetime, and setting the new password ends both — or a new
    request accepted in place of the pending request, which ends the verified
    state, while a request the channel refuses at acceptance leaves it in place
    — so the same code cannot authorise a second reset *(FR-014, FR-034)*;
    **And given** that verified state reaches the end of its lifetime while the
    person is on the new-password step, **Then** it ends at that moment, the page
    returns to the flow's first step with an explicit, retryable notice that the
    request expired and that a new code must be requested, and a new password
    submitted after it has ended is refused on the same ground and sets no
    password *(FR-014, FR-034, FR-038)*; **And given** the
    reset cannot proceed because the number has no account or because the account
    holds the administrator role, **Then** the pending request ends once the
    outcome is stated and no verified state remains *(FR-014, FR-034, FR-015)*;
    **And given** a one-time code is dispatched, **Then** the pending request
    holds it only in an irreversibly protected form, so no plaintext code is
    stored and an entered code is verified through that form alone, and a
    replacement's protected value replaces the previous one at the accepted
    dispatch *(FR-034)*; **And given** one mobile number across both code paths,
    **Then** the incorrect code entries it can produce in one window of the
    per-operation budgets are bounded in aggregate by the product of the
    incorrect-entry bound and the number of fresh requests its number-keyed
    budgets allow, so starting fresh requests cannot multiply the per-request
    bound; the fresh request that would exceed the ceiling is refused by the
    number's budget with the distinct limit refusal, no separate ceiling refusal
    exists, and the ceiling resets at that window's boundary with the budgets
    that produce it *(FR-033, FR-034)*; **And given** that same mobile number
    across both code paths, **Then** the one-time-code messages the platform
    dispatches to it in one window of the per-operation budgets are bounded in
    aggregate by the product of the dispatches one pending request allows — its
    first dispatch and the three re-requests — and the six fresh requests its
    number-keyed budgets allow, so the platform dispatches at most twenty-four
    accepted one-time-code messages to it in that window however the two flows and
    their re-requests are combined; the twenty-fifth is impossible rather than
    refused, because the seventh fresh request is refused by the number's budget
    and the fifth dispatch by the re-request limit, a dispatch the channel refuses
    at acceptance counts as no message, and no separate message ceiling, refusal,
    or counter exists, while the security notices are outside the ceiling because
    they follow an authenticated action on the account *(FR-033, FR-034)*;
    **And given** either the notice that the request
    expired or the notice that it ended at the bound on incorrect entries,
    **Then** it is announced to assistive technology, and the focus moves to the
    first step's first field, because the step that held it has been replaced by
    the first step *(FR-040, FR-034, FR-038)*
52. **AC-048**: **Given** any of the ten state-changing requests this slice
     ships — the sign-up submission, the sign-in submission, the
     password-recovery request, the entry of a one-time code at sign-up, the
     entry of a one-time code in password recovery, the request for a new
     one-time code from the code step, the submission of the new password in
     password recovery, the account's own change-password action, the sign-out
     action, or the sign-out-of-every-device action —
     **When** it is issued from a browser, whether by a guest or a
     signed-in person, **Then** it is
     protected against request forgery, so a request the person did not make is
     refused *(FR-044)*; the account's own change-password action's request is
     protected too, although no page offers it in this slice, and so are the two
     sign-out requests, whose controls the slice that ships the first page
     carrying the frame adds *(FR-044)*
53. **AC-049**: **Given** a person has supplied a value the platform holds and
     shows — the full name or the shop name — **When** it is rendered back,
     **Then** it is encoded for its output context, so a value typed as markup or
     script is shown as the text it is and never executed, and a test fails when
     the encoding is removed *(FR-045)*
54. **AC-050**: **Given** any response the browser surface returns, **When** it is
     inspected, **Then** it carries the security headers the constitution names —
     a content-security policy whose script sources carry no wildcard, no
     `'unsafe-inline'`, and no eval-permitting source such as `'unsafe-eval'`; a
     transport-security declaration; a declaration that the browser MUST NOT guess
     a response's content type; and a frame-ancestors restriction — asserted by an
     automated test that reads the policy the response carries and fails when any
     of the three script-source allowances appears *(FR-046)*
55. **AC-055**: **Given** a submission to which more than one refusal applies,
     **When** it is decided, **Then** the refusals are applied in the one fixed
     order — the operation's rate limit first, then the sign-up form's hidden
     field, then its minimum time-to-submit, then the value rules, then the
     account-existence comparison — so an over-budget submission receives the
     distinct limit refusal whatever else is wrong with it, a submission that
     fills the hidden field receives the silent response even when a rule later
     in that order would also refuse it, a submission before the minimum time
     receives the explicit, retryable time refusal even when a field is invalid,
     and a submission whose value rules fail is refused for those rules before
     any account-existence comparison runs *(FR-051, FR-029, FR-033, FR-042)*;
     **And given** several value rules fail at once, **Then** each failing rule
     carries its own message and no account-existence comparison runs until every
     value rule has passed *(FR-051, FR-001, FR-005, FR-035)*; **And given** a
     submission refused at one step, **Then** no later check runs and no earlier
     refusal is replaced *(FR-051)*

### Cross-cutting — merchant-scoped data access

56. **AC-056**: **Given** the shared entry point every merchant-scoped read and
    write passes through, **When** a session is looked up by its reference,
    **Then** the query carries the account's scope, and an automated test that
    reads another account's session through the same entry point fails when the
    scope is removed *(FR-053)*; **And when** a request names a row that belongs
    to another account, **Then** it receives the platform's ordinary not-found
    answer — the same status, the same body, and no header that differs from the
    answer a row that does not exist receives — so the two answers are
    indistinguishable and the caller is told nothing about whether the row
    exists *(FR-053; assigned to US2; measurement point: the merchant-scope
    integration test — the scoped session lookup, the ignored supplied account
    identifier, and the ordinary not-found answer for another account's row)*

### Cross-cutting — the entity invariants

57. **AC-057**: **Given** an account this slice creates — through public sign-up
    or the operator's provisioning — **When** the account, the forms that create
    it, and every surface that reads it are inspected, **Then** no email address
    exists as a product datum: no form collects one, no response or notice shows
    one, no path identifies an account by one, recovers an account with one, or
    sends anything to one, and every stored email-shaped value is the reserved,
    non-routable placeholder recorded for it, derived from that account's
    normalized mobile number, which no person supplies, which is never displayed,
    which is never a sign-in input, and which can receive no mail — and an
    automated test fails when a supplied address, a second email-shaped value, or
    an email input is introduced on any of those surfaces *(FR-001, FR-007,
    FR-014; assigned to US1; measurement point: the no-email case of the
    account-creation integration test over every form, response, notice, and
    stored value the slice creates or reads)*
58. **AC-058**: **Given** a verified merchant signs in from two separate
    browsers or devices, **When** both sign-ins succeed, **Then** the account
    holds two distinct live sessions at the same time, each granting access;
    **And given** one of them is ended — by the merchant's sign-out or by the
    platform — **Then** only that session ends, while the other stays live and
    still grants access; **And given** the merchant signs in again, **Then**
    each further sign-in adds a live session and ends none of the sessions the
    account already holds, so no cap refuses or replaces a session and a session
    is removed only by an end — its own (its timeout, its absolute maximum
    lifetime, a sign-out, or a revocation) or an account-level end (FR-011,
    FR-013, FR-019) *(FR-007, FR-010, FR-011, FR-012, FR-013, FR-019, FR-032;
    assigned to US2; measurement point: the multi-session case of the
    session-endings integration test, which signs in from two clients, ends one,
    and then signs in again)*

### Cross-cutting — operational state across restarts, releases, and recovery

59. **AC-059**: **Given** the service restarts while it holds live state — a
    signed-in session, an account's count of consecutive failed password
    verifications and its lock, a live pending request with its code and
    allowances, and a rate-limit window whose budget is spent — **When** the
    service serves again, **Then** the session still grants access and keeps both
    its clocks, the count and the lock are as they were and the lock lifts only
    at its own expiry, the pending request still verifies the code it held and
    keeps its remaining allowance, and the window still refuses on the budget it
    spent — with no session ended, no lock lifted or applied, no pending request
    replaced, no code invalidated, and no window reset *(FR-054, FR-009, FR-032,
    FR-033, FR-034)*; **And given** a request was in flight when the service
    stopped, **Then** it receives no answer, and its repeat once the service
    serves again reaches the outcome FR-040 states for a repeated request, with
    no second account, session, dispatch, write, revocation, or notice
    *(FR-040, FR-054)*
60. **AC-060**: **Given** a release that applies a migration, **When** the
    release is deployed, **Then** no request is served while the stored data is
    not at the version the running code expects, and the platform refuses to
    serve rather than answer from data of another version *(FR-054)*; **And
    given** the migration is applied, **Then** it ends no session, lifts no lock,
    ends no pending request, and resets no window, so every one of them is as it
    was *(FR-054, FR-009, FR-032, FR-033, FR-034)*; **And given** a request
    arrives while no instance is serving the release, **Then** its outcome is not
    FR-040's rendering, because FR-040 renders the failure of a request the
    platform answers, and the gap's duration, that answer, and the procedure that
    shortens it are R12's deployment procedure, on the boundary the Assumptions
    state *(FR-054, FR-040)*
61. **AC-061**: **Given** the stored data is restored to a point within the
    fifteen-minute recovery point, **When** the platform serves again, **Then**
    the state this specification defines reads as at that moment — a session live
    at the point still grants access and one created after it ends, a lock and
    its count applied after the point are gone and a lock lifted after it is in
    force again, a pending request started after the point no longer exists with
    its code refused under FR-034 and one replaced or ended after it is live
    again with the code it then held, and a window spent after the point is
    unspent — so a restore may end a session, lift a lock, drop a pending
    request, or reopen a window, accepted and bounded by the recovery point
    rather than reconciled *(FR-055, FR-009, FR-032, FR-033, FR-034)*; **And
    given** the restore brings back a `User` row removed for good after the
    point, **Then** the account is registered again and its personal data is read
    again until the removal is repeated, FR-018's "lives as long as the account
    is registered" being read at the restored moment *(FR-018, FR-055)*; **And
    given** the restore undoes a block applied after the point, **Then** the
    account can sign in again until an administrator re-applies the block, and
    FR-017's "keeps its data" is not breached because a restore removes no data
    *(FR-017, FR-055)*; **And given** the platform is not serving while the
    restore runs, **Then** a request that arrives then is outside FR-040's
    rendering, on the boundary AC-060 states for a deployment *(FR-040,
    FR-055)*
62. **AC-062**: **Given** the first migration this slice introduces, **When** its
    rollback is taken, **Then** it is one reversible step with both directions
    defined — the first of the release's two ordered steps, each meeting this
    rule — its rollback is applied in staging before it is needed in
    production, and no destructive change reaches production *(FR-055)*; **And
    given** a release is rolled back to the previous schema version, **Then**
    state written under the version being rolled back is lost with it — a session
    created after the migration ends and its holder signs in again, a lock and
    its count applied after it are gone, a pending request started after it ends,
    and a window spent after it is unspent — read as the same class of event a
    restore is, with R1 owning the migration's reversibility and R12 the
    release-level rollback in production *(FR-055)*; **And given** the rollback
    is running, **Then** the platform serves nothing, so a request that arrives
    then is outside FR-040's rendering *(FR-040, FR-055)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A merchant can complete sign-up, including confirming the number,
  in under 3 minutes. The clock starts when the page's first step is served and
  stops when the in-place confirmation that the account is created is rendered;
  the interval between the messaging channel's acceptance of the code message and
  the moment that code is available to the person is subtracted, and no other
  interval is. The bound is measured on the sign-up end-to-end journey the Test
  Coverage Request names, once per run, so two runs of the same journey are timed
  alike; a run that is refused and returns to the first step is a fresh run
  (decided 2026-10-24, Clarifications; clock fixed 2026-11-04, Clarifications).
- **SC-002**: A returning verified merchant signs in in under 30 seconds, without
  a one-time code. The clock is SC-001's: it starts when the page's first step is
  served and stops when the in-place confirmation that the merchant is signed in
  is rendered, with no delivery interval because no code is sent, and the bound is
  measured on the sign-in end-to-end journey once per run (clock fixed
  2026-11-04, Clarifications).
- **SC-003**: A merchant can reset a forgotten password in under 3 minutes. The
  clock is SC-001's: it starts when the page's first step is served and stops when
  the terminal confirmation that the password is set is rendered, the interval
  between the messaging channel's acceptance of the code message and the moment
  that code is available to the person is subtracted, and no other interval is;
  the bound is measured on the recovery end-to-end journey once per run (decided
  2026-10-24, Clarifications; clock fixed 2026-11-04, Clarifications).
- **SC-004**: 100% of sign-up, sign-in, and password-recovery responses are
  indistinguishable between a number that has an account and one that does not,
  except for the closed list of exceptions this criterion states below; the
  comparison includes an attempt made while the account is locked, an attempt
  against a blocked account, and an attempt against an administrator account on
  the merchant sign-in surface, and it is asserted by an automated enumeration
  test. The measurement rule is closed: the test takes 200 samples of each case
  after a 20-request warm-up, drops the top and bottom 5% of each case's
  durations, and requires the difference between the account-exists and
  no-account cases' medians to be ≤ 50 ms and the difference between their 95th
  percentiles to be ≤ 150 ms, with one test carrying each operation. The compared
  cases are exactly the account/no-account pair for sign-up, sign-in, and
  recovery, plus the locked, the blocked, and the administrator account on the
  merchant sign-in surface; the six exceptions below are the only responses
  outside the comparison, and no other case is added or removed. The criterion covers the response's whole observable shape — its text,
  its status, its header set, its response path, and how long it takes — and the
  enumeration test asserts the response's text, status, header set, and response
  path for equality and its duration against the recorded tolerance, so a
  response MUST NOT do less work for a number that has no account than for one
  that has (decided 2026-10-11, Clarifications; revised 2026-11-02,
  Clarifications), the duration being measured by the protocol stated above over
  repeated samples of both cases (decided 2026-10-28, Clarifications). The text is compared after masking the four
  values that are allowed to differ, each replaced by a fixed placeholder: the
  pending request's identifier (`requestId`), the number the response echoes
  back (`phone`), the moment the code expires (`codeExpiresAt`), and the moment
  the pending request expires (`expiresAt`). `phone` is masked because the
  response a successful sign-up submission or password-recovery request
  receives carries the number that was submitted, and the enumeration's two
  cases submit different numbers; outside the comparison the test asserts that
  each response's `phone` equals that case's own submitted number in the
  canonical form, so the echo is verified rather than left uncompared. The
  field names, their types, the header set's names, the response path, and the
  duration stay compared, so a response that omits a field, changes a field's
  type, drops a header, takes another path, or does less work still fails, and
  no other value is masked (decided 2026-11-04, Clarifications). The exceptions
  are closed and are stated here once, each beside the requirement that produces
  it: (1) a successful sign-in (FR-008), which can occur only for an existing
  account whose password is correct and therefore reveals nothing to a caller
  who does not hold it, so the sign-in clause is bounded to attempts that do not
  succeed; (2) the outcome stated after the correct one-time code is verified, in
  sign-up and in password recovery (FR-006, FR-014, FR-015), because entering
  the correct code proves ownership of the number and the outcome past that
  point differs by design — including, at sign-up, the status- and
  role-specific outcome an existing account produces; (3) a refusal produced by a rate limit (FR-029, FR-033), which is
  deliberately distinct and explicit and depends on the client's own request
  history rather than on whether the number has an account; (4) a refusal of a
  value that is not a valid Libyan mobile number on +218 (FR-042), which is
  deliberately distinct and explicit because such a value can never have an
  account; (5) a refusal produced by the limit on requesting a new one-time code
  (FR-034), which is deliberately distinct and explicit because it depends on
  the pending request's own history rather than on whether the number has an
  account, and the pending request exists for a number with no account exactly
  as it does for one (decided 2026-10-11, Clarifications); and (6) the explicit,
  retryable failure state a messaging channel's refusal at acceptance produces
  (FR-034), at a fresh request and at a re-request alike, which states the
  channel's response rather than anything about the number's account and is
  produced identically whether or not the number has an account, so an explicit
  failure that exists for both cases is not read as a leak (decided 2026-11-02,
  Clarifications). The criterion is unweakened for a status or role refusal: a
  blocked, a locked, and an administrator account each receive a response that
  does the same work and takes the same time as a wrong password and as an
  unknown number, so the enumeration test asserts them alongside those cases
  rather than exempting them (decided 2026-10-22, Clarifications).
- **SC-005**: SC-005 has two halves and is met only when both hold. **This
  slice's half**: 100% of the three bare pages it ships — sign-up, sign-in, and
  password recovery — render no frame, and the frame's delivered composition
  passes the structural assertions: each control's presence, accessible name,
  role, and keyboard reachability; the sidebar's nine-item list and its collapse
  control, in the full sidebar and the icon-only rail; the bottom bar's five slots
  at 320 CSS px with no label dropped; the drawer's same list and four
  static-page links; the header's logo/home, notifications, theme switch, and
  account control; and the account menu's three items and the sign-out
  confirmation's markup. The sidebar's two-width behaviour, the bottom bar's
  drawer-opening composition, and the header's single-row behaviour at 320 CSS px
  with its four controls — or a guest's three — none dropped, are asserted
  structurally here. **R2's half**: the target scopes render the frame, and the
  page behaviours this slice cannot exercise pass — the focus landing on the
  destination page's heading after a drawer item navigates, the drawer's focus
  containment, the overlays' stacking order and the consumption of an activation
  outside them, the guest's redirection, the account menu's live open and its
  runtime dismissal with the sign-out confirmation's result, the bottom bar's
  scroll-hide, and the label cut at the inline-end — together with the frame's
  accessibility scan and keyboard-only pass. The error and static scopes are
  verified by the slices that ship them. This slice may report its half met while
  R2's half stays open under `EX-007`; it MUST NOT report SC-005 as fully met
  before R2 closes it. The structural half is measured by the frame's structural
  tests and the frame-absence end-to-end test; R2's half is measured by the first
  page carrying the frame (decided 2026-11-01, Clarifications; revised
  2026-11-03, Clarifications; two halves and measurement points fixed
  2026-11-04, Clarifications).
- **SC-006**: Every delivered page passes an automated accessibility scan and a
  keyboard-only pass at WCAG 2.2 AA. The matrix is closed: the states the three
  pages deliver — sign-up's thirteen, sign-in's four, and password recovery's
  fifteen — are each scanned in both appearances FR-025 fixes, light and dark, at
  320 CSS px and at 1280 CSS px, and the keyboard-only pass and the reflow check
  are performed at both widths; a state the matrix omits, in either appearance or
  at either width, fails the criterion rather than becoming an untested state.
  The design-conformance baseline reads the same delivered-state set in both
  appearances; its widths are the design contract's, with the 320 CSS px reflow
  capture, and a baseline update MUST NOT remove a state or an appearance from
  the set. The smallest supported width is 320 CSS px, the WCAG 2.2 AA reflow
  floor: the design reference's 375px captures are evidence of the reference
  appearance rather than the supported floor, and the earlier three-state dark
  subset is withdrawn. The frame this slice delivers is covered at the level of
  its markup: its structural verification asserts that every frame control
  carries an accessible name, a role, and keyboard reachability, including the
  header's four controls and a guest's three at 320 CSS px, and the ended-session
  state's live announcement and focusable heading; the scan and keyboard-only pass
  over the frame's rendered behaviour belong to R2, exactly as SC-005 divides the
  frame's structural half from its page behaviour. On the three bare pages this
  slice ships, the scan and the keyboard-only pass also assert that each state
  change is announced and that focus lands on the step now shown rather than on a
  control the previous step carried (decided 2026-10-11, 2026-10-22, 2026-10-28,
  2026-10-31, and 2026-11-02, Clarifications; matrix closed and wide width fixed
  at 1280 CSS px, 2026-11-04, Clarifications).
- **SC-007**: The account locks on the fifth consecutive failed password
  verification in one run across the three paths FR-009 fixes — a sign-in
  attempt, the current-password check of the account's own change-password
  action, and the current-password check of the administrator's forced first
  change — in 100% of tested cases, and the three rules that govern the count
  are identical on every path. **Increment**: only a failed password
  verification against an existing, active account adds one, so a refusal
  produced by a rate limit, a refusal of a value that is not a valid Libyan
  mobile number, the refusal a blocked account receives, the refusal an
  administrator account receives on the merchant sign-in surface, a submission a
  value rule refuses before the check runs, and a refusal the lock itself makes
  never drive the lock, in 100% of tested cases. **Clear**: a successful password
  verification on any of the three paths — a successful sign-in, a successful
  change through the account's own action, and a successful forced first
  change — clears the count to zero, so the run that follows starts afresh, and
  the lock's expiry clears it too, in 100% of tested cases. **Lift**: the lock
  lifts after fifteen minutes and at no other moment — no success and no
  password reset lifts or shortens it — and a refusal made while the lock is in
  force is neither counted nor extends it, in 100% of tested cases (decided
  2026-10-11, Clarifications; revised 2026-10-28 and 2026-11-01,
  Clarifications; term and set unified 2026-11-02, Clarifications).
- **SC-008**: 100% of user-facing text — every screen this slice delivers, the
  frame it delivers, and the body of every message it sends by SMS — presents
  Arabic right-to-left text with Latin numerals and no emoji (decided 2026-10-11
  and 2026-11-02, Clarifications). The message set is closed at the four SMS
  templates — the sign-up code, the recovery code, the password-change notice,
  and the sign-out-of-every-device notice — and no fifth template is added
  without amending this criterion. The language, numeral, and no-emoji limbs are
  asserted by a scan of the platform's own strings: the message templates, the
  frame's copy, and the screens, including labels, messages, accessible names,
  and generated numerals; the direction limb is asserted at the document level —
  every document declares Arabic as its language and right-to-left as its base
  direction, and the frame's components set no direction or language of their
  own — while a message body satisfies the limb by opening with Arabic text. The
  scan's fail predicate is closed: a string fails when it contains a code point
  with `Extended_Pictographic`, the variation selector U+FE0F, or the keycap
  encloser U+20E3; an Arabic-Indic digit (U+0660–U+0669 or U+06F0–U+06F9); a
  combining mark in U+064B–U+0652 or the superscript alef U+0670; or a Latin
  letter sequence other than the token `SMS`. The scan excludes a value a person
  supplies — its script and digits are its own — and the fixed city list's
  recorded names, which keep the form FR-005 records, from the language, numeral,
  and diacritic limbs; both stay inside the no-emoji limb, so a supplied value
  carrying an emoji is refused at input rather than counted as presentable text.
  The mobile number and the one-time code are counted in the platform's canonical
  rendering rather than as free text, the mobile number in FR-038's display form
  `+218 91 234 5678` (FR-001, FR-005, FR-026, FR-038; decided 2026-10-31 and
  2026-11-02, Clarifications; message set and fail predicate closed 2026-11-04,
  Clarifications).
- **SC-009**: Every sign-up, sign-in, and password-recovery step completes with
  p50 ≤ 150 ms and p95 ≤ 1,000 ms, measured under the scale stated in
  Assumptions (up to 10,000 registered accounts, up to 500 concurrent sessions,
  and a peak of no more than 10 authentication requests per second), excluding
  the time the SMS takes to arrive. The time a request spends waiting for the
  messaging channel to accept a message is inside that budget and is not
  excluded: the send is attempted inside the request that asks for the code, so
  only the delivery after acceptance lies outside the platform's control; a
  delivery that fails after acceptance is outside the platform's observation and
  does not turn the request into a failure (decided 2026-10-11 and 2026-10-22,
  Clarifications; p50 bound added 2026-11-03, Clarifications). A wait for
  acceptance that reaches the platform's request timeout is refused within that
  budget with the explicit, retryable failure FR-034 states, so an
  unresponsive channel neither leaves the step waiting beyond the budget nor
  turns it into an unrelated error (decided 2026-10-28, Clarifications). The
  measurement is an aggregate ceiling, not one client's rate: 600 measured
  requests — 200 per operation — are presented by 20 independent origin keys with
  one distinct number key per request, so no origin or number exhausts its own
  budget and the 10-per-second figure is the aggregate. The run fails when any
  measured request is refused, when an operation's accepted count is not 200,
  when a dispatch is faster than the declared 50 ms channel-acceptance wait, when
  the work-only p95 exceeds 250 ms, or when p50 exceeds 150 ms or p95 exceeds
  1,000 ms; percentiles are over accepted requests only, and a post-run probe
  MUST prove the limiter live by refusing the 21st account-creation submission
  from a fresh origin (key plan and verdict fixed 2026-11-04, Clarifications).

## Assumptions

- **The registered page names are fixed here, once, and the prose terms this
  specification uses denote exactly those pages.** The Product Register names
  the pages "Log In", "Sign Up", "Forgot Password", and "404". Where this
  specification's prose names one of those pages, "sign-in" denotes the "Log In"
  page, "sign-up" denotes the "Sign Up" page, "password recovery" denotes the
  "Forgot Password" page, and "error page" denotes the "404" page: each term is a
  reading of a registered row, not a second name, so the four terms name the four
  registered pages and add no page of their own. No page is renamed, the Glossary
  and the Product Register stand unchanged, and every FR, AC, and SC identifier
  and every route this specification fixes is unchanged.
- **This slice implements none of the sixteen product features, and says so
  against the register (decided 2026-10-21; revised 2026-11-01,
  Clarifications).** The constitution's Product Scope lists sixteen product
  features, each of which MUST be implemented through a specification that
  references that list. This specification references it and implements none of
  the sixteen: it delivers the identity surfaces the Product Scope names — the
  sign-up, sign-in, and password-recovery pages, the account's status, the
  session lifecycle, and the shared page frame the later slices' pages are
  composed from. Each of the sixteen features is implemented by the slice
  ROADMAP.md assigns it, and none is implemented here; the assignment is read
  from ROADMAP.md rather than restated here, so the slice order keeps one
  authority and this assumption cannot drift from it.
- **The pages this slice delivers are bare, and no page renders the frame here
  (decided 2026-10-10; revised 2026-10-28, Clarifications).** The sign-up,
  sign-in, and password-recovery pages are the only pages this slice delivers,
  and all three are shown without the frame; FR-021 owns what the bare layout
  carries and FR-036 the cross-links between those pages, and this assumption
  does not restate either. What it records is the slice boundary: the shared
  frame is delivered here for the public site and the merchant's area, whose
  first content pages arrive with later slices; this slice adds no page whose
  purpose is to render the frame, and its acceptance verifies the frame's
  composition and its scoping structurally rather than through a shipped
  content page.
- **The frame is delivered whole, and its controls are verified structurally
  (decided 2026-10-10, revised 2026-10-11 and 2026-10-21, Clarifications;
  revised 2026-10-21, ADR-102; revised 2026-10-25, ADR-126; revised 2026-10-27,
  Clarifications).** The frame's four surfaces, each surface's composition, the
  controls each carries, and the items and routes the frame links to are owned
  by FR-020 … FR-025, FR-039, FR-047, and FR-052, which are their single
  authority; this assumption does not restate them. What it records is the slice
  boundary those requirements leave open: this slice builds the frame and
  verifies its composition and its scoping structurally rather than through a
  shipped content page, because no page here renders the frame; the data behind
  the account menu's destinations and the notifications item belongs to the
  slices that own them; and the frame's page behaviour — the set SC-005 names —
  is not exercised here but verified by the slice that ships the first page
  carrying the frame, while the composition and every behaviour the delivered
  controls can exercise without a rendered page — the
  drawer's open state and its three dismissals, the focus return to «المزيد», the
  confirmation's markup, the bar's rendered and visible state under the drawer,
  the sidebar's two-width rule, and the header's single-row rule — are asserted
  structurally here, on the boundary SC-005 fixes (decided 2026-10-11; revised
  2026-10-21, Clarifications; revised 2026-10-27, Clarifications; revised
  2026-10-31, Clarifications; guest rule stated 2026-11-01, Clarifications;
  structural assertions and page behaviour separated 2026-11-03; deferred set
  cited from SC-005 2026-11-03; boundary cited from SC-005 2026-11-04,
  Clarifications).
- **The platform's logo is a wordmark (decided 2026-10-11; revised 2026-10-21
  and 2026-10-28, Clarifications).** FR-023 owns the frame's logo/home control
  and FR-021 the bare layout's brand mark, with the form the logo takes and the
  width at which it keeps its place; this assumption records only the decision
  that the logo is a wordmark and adds no rule of its own.
- **The static and error pages arrive later (decided 2026-10-10 and
  2026-10-21, Clarifications).** Contact, Privacy Policy, Terms of Use, FAQ, and
  the error page are delivered by a later slice, which also verifies the frame's
  absence from them (FR-021); FR-024 owns the reachability requirement and names
  the slice that discharges it. This slice creates no placeholder page, and the
  deferral is recorded as FR-024 requires.
- **The icon set is fixed here, once (decided 2026-10-11, Clarifications;
  revised 2026-10-21, Clarifications, ADR-098; revised 2026-10-31, ADR-146).**
  FR-020 owns the set and everything this slice owes for it; this assumption
  records the decision and adds no rule of its own, except that changing the set
  is an amendment to that record rather than an edit made inside a feature. This
  specification names no set, because naming a library in this file would breach
  Principle VII.
- **The Libyan city list is fixed here, once (decided 2026-10-22 and
  2026-10-28, Clarifications).** What this assumption records is the list's
  ownership rather than its content: it is recorded as one reference list for
  accounts and named in a decision record; every later slice reads it rather
  than writing a list of its own, and changing the list is an amendment to that
  record rather than an edit made inside a feature. FR-005 owns what the list
  contains, how its entries are named, how the search matches them, and how a
  chosen entry is stored, and this assumption does not restate those rules.
- **The Libyan mobile-prefix set is fixed here, once (decided 2026-10-11,
  Clarifications).** FR-003 owns the dataset, the rule that decides whether a
  +218 number is a mobile number against it, and a later slice's reading of it,
  and this assumption does not restate them. What it records is the one thing
  the requirement does not state: changing the dataset is an amendment to the
  decision record that names it rather than an edit made inside a feature.
- **The administrator account is created out of band (decided 2026-10-11;
  revised 2026-10-22 and 2026-10-28, Clarifications).** FR-028 owns the
  operator-run provisioning action, the account it creates, the forced password
  change and its clearing, the rule that the action is out of band, and the
  handling of the initial password — where it may be supplied from, where it
  may never appear, and how it reaches the administrator; this
  assumption does not restate them. What it records is the data-model fact the
  requirement leaves open: the administrator is one `User` row, not a separate
  kind of account, so this slice adds no entity and the entity register stands
  unchanged.
- **The administrator's first sign-in is delivered as behaviour, and its
  surface arrives later (decided 2026-10-10 and 2026-10-11; revised 2026-10-22,
  Clarifications).** FR-028 owns the first sign-in, the restriction, and its
  clearing, and FR-027 the refusal the merchant sign-in surface gives an
  administrator's credentials; this assumption does not restate either. What it
  records is the slice boundary: this slice ships no administrator sign-in page,
  it delivers the first sign-in and the forced-password-change requirement at
  the behaviour level, and the administrator's separate login surface — the
  page — belongs to the slice that ships the administrator application.
- **The base project is established by R1's foundation phase, and the identity
  work begins after its checkpoint.** The repository workspaces,
  the shared configuration, the test runner, and the supporting infrastructure
  the rules require (including the SMS channel that carries the one-time codes)
  are created in a phase that runs before the account and authentication work,
  and the phase is accepted before any identity requirement is verified. It is a
  phase of this slice's work, not a separate slice and not work that precedes
  R1: `ROADMAP.md` names it once and retires the phrase "pre-R1 foundation"
  (ADR-139). Their technical composition is not stated in this
  specification.
- **SMS delivery time is outside the platform's control (decided 2026-10-24,
  Clarifications).** The timing criteria SC-001, SC-003, and SC-009 exclude it;
  this assumption records the fact and adds no rule of its own. A send that
  fails outright is handled by FR-034, whose failure state and re-request rule
  this assumption does not restate (decided 2026-10-10, Clarifications).
- **The product is a browser catalog only.** No installable application, no
  offline surface, and no service worker are shipped.
- **The product collects no email address (revised 2026-10-30,
  Clarifications).** No email address exists as a product datum at any point in
  this feature: none is collected at sign-up, none is asked for at sign-in, none
  is displayed, none identifies an account or is used to recover one, and none is
  used to send anything, so the mobile number stays the sole account
  identifier. Where the platform's storage requires a value in a field reserved
  for an email address, that value MUST be a reserved, non-routable placeholder
  derived from the normalised mobile number: it is never supplied by a person,
  never displayed, never used to sign in, and cannot receive mail, so it is not
  an email address in the sense this rule governs. The exact
  placeholder is recorded, and the storage deviation from the literal wording of the
  domain model's invariant, with an owner and a review date.
- **A merchant's data lives as long as the account is registered (decided
  2026-10-11, Clarifications; revised 2026-10-21 and 2026-11-01,
  Clarifications).** FR-018 owns the removal paths, the soft deletion, and the
  absent retention period, and it leaves the Privacy Policy page's wording to
  the slice that ships it; this assumption does not restate those rules. What it
  records is the set of facts this slice owns for that page — that the account's
  personal data is its full name, mobile number, and city, what sign-up
  collects, and that the mobile number is the sole identifier.
- **No third entity, and the account-level state is already registered (decided
  2026-10-10, Clarifications; revised 2026-10-21, 2026-10-29, and 2026-11-04,
  Clarifications).** The pending request's data and the one-time codes are
  transient verification state held outside the entity register as state that
  carries an expiry, so this feature names no entity beyond `User` and `Session`; the
  store is recorded in `docs/domain-model.md` as transient, non-entity state
  owned by the `users` module, with its invariants, so it is documented without
  entering the entity register. The forms in which the store holds the
  submitted password and the live one-time code are owned by FR-034 and FR-038,
  and this assumption does not restate them (decided 2026-10-29, Clarifications). The
  failed-attempt count, the lock, and the forced-password-change requirement are
  account properties, and they are already registered: ADR-105 amended the
  register's `User` row and `docs/domain-model.md` in the same change, so this
  feature implements those fields and makes no second amendment; ADR-105 is cited
  in the ownership record and in its Reaffirmed decision records
  (corrected 2026-10-29, ADR-139).
- **The sign-out control is the frame's, and no page here renders it (decided
  2026-10-10, Clarifications; revised 2026-10-21 and 2026-10-21 (2),
  Clarifications).** FR-047 owns the account menu's third item, its yes-or-no
  confirmation, and their structural verification here; FR-011 owns the action
  that ends every session. What this assumption records is the slice boundary:
  sign-out and sign-out-of-every-device are delivered as behaviour and verified
  by the integration tests, no page this slice ships renders the frame, so the
  menu's runtime behaviour is exercised by the slice that ships the first page
  carrying it, and the US2 end-to-end journey is correspondingly narrowed to
  sign-in.
- **The three bare pages render the same for a signed-in person and for a guest
  (decided 2026-10-11, Clarifications).** FR-041 owns the rule, including the
  in-place confirmation and the reload behaviour; this assumption adds no rule of
  its own and is kept for the decision it records.
- **Blocking has no act in this slice (decided 2026-10-11, Clarifications).**
  FR-016, FR-017, and FR-019 own the status, its effects, and the refusal a
  blocked account receives; this assumption does not restate them. What it
  records is the scope: the tests reach the blocked state directly, and the acts
  that change the status — setting an account to blocked and returning it to
  active — arrive with the administrator's Users page, where the audit record
  every administrator operation requires exists; US4's Independent Test is
  narrowed to that boundary.
- **The account's own change-password action has no page in this slice
  (decided 2026-10-11; revised 2026-10-29, Clarifications).** FR-013 owns the
  action, both of its halves, and the request FR-044 requires; this assumption
  does not restate them. What it records is the slice boundary: the action is
  delivered as behaviour and verified by the integration tests with no page
  offering it, the profile page that offers it arrives with the slice that owns
  it, and no page this slice ships carries the frame, so no control offers it
  here — exactly as sign-out is treated.
- **No landing page exists in this slice (decided 2026-10-10 and 2026-10-11,
  Clarifications).** FR-004, FR-007, and FR-014 own the in-place confirmations
  each journey ends at; this assumption does not restate them. What it records
  is the slice boundary: the journeys end at the platform's own response — the
  session created by verifying the code, and the session created by signing in —
  no page this slice ships is the destination of either, the session is asserted
  at the behaviour level and by the integration tests, the first page a
  signed-in merchant lands on arrives with the slice that ships the merchant's
  area, and the three bare pages stay the only pages this slice delivers.
- **A modest measurement ceiling is assumed, and the success criteria are
  measured against it (decided 2026-10-11, Clarifications).** SC-009 is measured
  under up to 10,000 registered accounts, up to 500 concurrent sessions, and a
  peak of no more than 10 authentication requests per second across the three
  authentication operations. The three figures are a measurement condition, not
  a service limit: no request is refused for reaching them, and above them
  FR-033's per-key budgets still decide each request exactly as they do below the
  ceiling, while a request the platform cannot serve is FR-040's unnamed failure,
  rendered on the page that made it (decided 2026-11-05, Clarifications).
  SC-009 bounds a request's server-side completion alone. The three pages carry a
  separate rendering budget, fixed by the design contract and asserted by the
  plan's performance gate; this specification names neither the budget's metric
  nor the tool that asserts it, so neither budget is read as covering the other
  (decided 2026-11-05, Clarifications). The stated capacity envelope starts from
  `docs/capacity-model.md`, records this measurement condition, and states any
  deviation from that model; the ceiling is an operational fact, not a design
  value, so it adds no field and no entity.
- **The availability target is R12's, and this specification owns only what the
  person sees (decided 2026-11-04, Clarifications).** No availability figure and
  no maintenance window are fixed here, and no success criterion in this slice
  measures availability: the target and its measurement belong to R12, the
  deploying slice that runs the platform together with its monitoring and
  alerting set. This specification owns the boundary alone — FR-040 states the
  rendering a request receives when it cannot be completed because its data store
  is unreachable or the service fails before answering it, and no other
  requirement promises availability — while the mechanism that
  withholds traffic from a service that cannot serve is recorded outside this
  specification, ADR-142 records the recovery arrangement the constitution's
  recovery time and recovery point govern, and ADR-141 accepts the messaging
  provider's consequence. The split is stated once, here, so the guarantee is
  neither claimed twice nor left unowned.
- **A recovery event's consequence is stated here, and its procedure is R12's
  (decided 2026-11-04, Clarifications).** FR-054 and FR-055 own what a restart, a
  release, a restore, and a rollback do to the state this slice defines; this
  assumption owns the split they leave open. The deployment's gap — how long no
  instance serves a release, what a request receives in it, and the procedure
  that shortens it — is R12's, together with the recovery procedure that runs a
  restore within the recovery time and the release-level rollback. The removal a
  restore undoes is repeated by the act that owns it — the administrator
  operation the Users page ships (R13) or the retention job (R15) — and this
  slice performs neither and keeps no out-of-band record of either. What this
  specification fixes is the state a person holds and the rendering a served
  request receives; it promises no continuity across a recovery event and
  measures none, and no success criterion here covers availability, as the
  availability assumption above states. The recovery arrangement itself is
  ADR-142's, and the numbers it is held to are the plan's recovery time of four
  hours and recovery point of fifteen minutes, which no success criterion here
  measures and R12 measures.
- **The messaging provider is an accepted single point of failure (decided
  2026-11-04, Clarifications).** Its outage is accepted rather than worked
  around: no second provider, no fallback channel, and no email path exist, and
  ADR-141 accepts that consequence when it fixes the provider behind the messaging
  channel. The outage's scope is stated once, here. It stops the two one-time-code
  dispatches — the sign-up verification code and the password-recovery code — and
  any request for a new code; such a request receives the explicit, retryable
  failure state FR-034 already defines, on the step that asked for the message,
  with no second failure path and no further state introduced. It removes the two
  security notices FR-043 requires from a password change or a sign-out of every
  device, which proceed without them because the notice is best-effort and its
  failed send is recorded as the dispatch failure FR-037 names. It stops nothing
  else: sign-in, sign-out, the sign-out of every device, the session's reads and
  ends, the password change and the password reset themselves, the administrator's
  forced first change, and the operator's provisioning action all need no message
  and continue, and the platform does not treat the provider's outage as a failure
  of the service itself, because a channel that is out is an outbound dependency
  the flows already handle rather than a reason to stop serving. The alerting that
  observes the provider belongs to R12's monitoring set, and no success criterion
  here measures the provider's availability.
- **A repeated request's outcome and each indivisible write are requirements;
  their mechanisms belong to the plan (decided 2026-11-04, Clarifications).**
  What this specification fixes is what a person observes — no second account, no
  second session, no second code dispatch, no second password write, no second
  revocation, and no second notice, with a stated outcome for each path — and
  what a failure leaves behind. How a completed outcome is recognised, how a
  submission is matched to the pending request it repeats, and how a multi-step
  write is made indivisible are plan details and are not stated here, because
  Principle VII keeps this file technology-agnostic; the plan owns them and the
  tasks cite them.
