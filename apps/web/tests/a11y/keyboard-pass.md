# The manual keyboard-only pass — SC-006

**Recorded:** 2026-11-07. **Tasks:** T124 (the manual pass at 320 and 1280 CSS px)
and T134 (the 2026-10-31 structural conformance and the 2026-11-01 guest clause).
**Criteria:** FR-040, AC-043, SC-006; FR-001, FR-022, FR-023, FR-026, FR-049,
FR-052, AC-024, AC-025, AC-028, AC-042, AC-053.

## 1. Scope and environment

The pass covers the three bare pages this slice ships — `/auth/sign-up`,
`/auth/sign-in`, and `/auth/forgot-password` — at 320 and 1280 CSS px, and the
frame's structural half, which no page renders in R1 (`EX-007`).

| Item | Value |
|---|---|
| Host | Windows 10 (10.0.19045) |
| Browser | the Playwright-pinned Chromium, `@playwright/test` 1.64.1 |
| Application | Nuxt dev server at `127.0.0.1:3000`, API at `127.0.0.1:3001`, fake SMS transport |
| Widths | 320 × 900 and 1280 × 900 CSS px |
| Appearance | light; the automated scan in `states.spec.ts` covers both |
| State driver | the Nuxt dev server at `127.0.0.1:3000`, the local API at `127.0.0.1:3001`, and the fake SMS transport, per §1; no stand-in was used (corrected 2026-11-10: the row previously named `apps/web/tests/support/mock-auth-api.ts`, the visual baseline's stand-in T201 removed) |

## 2. Method

Every step was performed with the keyboard alone: `Tab` and `Shift+Tab` to move,
typing into the focused field, `Enter` to activate the focused control or submit
the form. The pointer was never used. Focus was read from `document.activeElement`
after each key, and the values are the ones recorded below. The pass was run at
both widths in the same session; the order did not differ between them.

## 3. The three bare pages

### 3.1 Sign-up — the first step

From the document start, `Tab` reaches, in order:

| # | Focused element |
|---|---|
| 1 | the full-name field (the wordmark is not focusable) |
| 2 | the phone field, whose fixed `+218` prefix is not a separate stop |
| 3 | the password field |
| 4 | the city field |
| 5–12 | the open city list's options when the field is empty (طبرق, الجغبوب, أمساعد, درنة, القبة, تميمي, البيضاء, شحات) |
| 13 | the shop-name field |
| 14 | the submit control, «إرسال رمز التحقق» |
| 15 | the cross-link «لديك حساب؟ تسجيل الدخول» |

Typing `طرابلس` narrows the open list to its one matching option; `Tab` reaches
that option, `Enter` selects it, and the list closes. The next `Tab` reaches the
shop-name field and the one after it the submit control. The city value is the
selected entry, and the form submits.

`Enter` on the submit control starts the request. While the request is in flight
the control is disabled and reads «يجري الإرسال…»; the other controls keep their
order.

### 3.2 Sign-up — the code step

The page replaces the form with the code step and moves focus to the six-digit
field without a pointer. The order is: the code field, «تحقق», «إرسال رمز جديد»,
«تعديل البيانات», then the cross-link. `Enter` in the code field submits the
code; while verify is in flight the submit reads «يجري التحقق…» and is disabled.
A refusal shows the inline message in place; focus stays in the step.

### 3.3 Sign-up — the endings

`done` replaces the code step with the outcome section and moves focus to its
heading (the terminal step has no field); `expired_notice` and `ended_notice`
return the page to the first step with the notice above the form and move focus
to the full-name field. The outcome or notice is announced because its region
carries `role="status"`. From the focused heading the next `Tab` reaches the
outcome's own controls and then the cross-link:

| Ending | `Tab` order after the heading |
|---|---|
| `done` (`created`) | «الانتقال إلى تسجيل الدخول», «لديك حساب؟ تسجيل الدخول» |
| `done` (`existing_account`) | «تسجيل الدخول», «نسيت كلمة المرور», «لديك حساب؟ تسجيل الدخول» |
| `done` (`blocked_account`, `administrator_account`) | «لديك حساب؟ تسجيل الدخول» |
| `expired_notice`, `ended_notice` | the full-name field, the phone field, the password field, the city field, the shop-name field, the submit control, then the cross-link |

The first step keeps the full name, the phone, the city, and the shop name and
renders the password empty, matching AC-041.

### 3.4 Sign-in

The order is: the phone field, the password field, the submit control
(«تسجيل الدخول»), then the cross-links «إنشاء حساب» and «نسيت كلمة المرور». While
the request is in flight the submit is disabled and reads «يجري تسجيل الدخول…». A
refusal shows the one uniform message and clears the password, keeping the
number. On success the form is replaced by the outcome and focus moves to its
heading «تم تسجيل الدخول»; the body «أنت مسجل الدخول الآن.» is announced by the
`role="status"` region, and the next `Tab` reaches the two cross-links.

### 3.5 Password recovery

The first step's order is: the phone field, «إرسال رمز التحقق», then the
cross-link «تسجيل الدخول». The code step moves focus to the six-digit field; its
order is the code field, «تحقق», «إرسال رمز جديد», «تغيير الرقم», then the
cross-link. On a verified code the new-password step replaces the code step and
focus moves to its field; the order is the new-password field, «تعيين كلمة
المرور», then the cross-link. `Enter` on the save control reaches the outcome:
focus moves to the heading «تم تعيين كلمة المرور», `role="status"` carries
«انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة.», and the next `Tab`
reaches «الانتقال إلى تسجيل الدخول», then the cross-link. `done_blocked` carries
the same heading and its blocked body with no sign-in link; `no_account` and
`administrator` carry their own headings and bodies, and only `no_account` adds
«إنشاء حساب».

The expiry and ended notices return the page to the first step with the notice
above the form, the number kept, and focus on the phone field.

### 3.6 Result

Every interactive element on the three pages is reachable and operable by the
keyboard alone at both widths. No keyboard trap was found, no step change
stranded focus outside the document, and no control required a pointer. At
320 CSS px the automated scan also asserts no horizontal scroll.

## 4. The frame's structural half (T134)

R1 ships no page that renders the frame (`EX-007`; the first page carrying it is
R2's), so the frame's keyboard contract is verified structurally by the layer's
suites. On 2026-11-07 the `ui` project ran **44 tests in 11 files, all passing**:

| Suite | Tests | What it fixes |
|---|---|---|
| `packages/ui/tests/shell/drawer.spec.ts` | 5 | «المزيد» carries `aria-expanded` and its open state while the drawer is open; the collapse control, `Escape`, and an activation outside each close it and return focus to «المزيد»; an item is a link that closes the drawer on activation (T132) |
| `packages/ui/tests/shell/header.spec.ts` | 5 | logo/home at the inline-start; notifications, theme switch, and account control at the inline-end; no page-navigation link and no drawer control; the three account-menu items and the sign-out confirmation; the guest sees one sign-in action and the theme switch; all four controls stay in one row at 320 CSS px with none dropped (T095, T098) |
| `packages/ui/tests/shell/bottom-bar.spec.ts` | 6 | the five slots in order; the raised `/parts` action; each slot's whole accessible name; a guest's merchant-area slot goes to sign-in and keeps the slot; the bar stays rendered under an open drawer; it hides after 32 px down and returns after 16 px up or within 56 px of the top (T096, T103) |
| `packages/ui/tests/shell/ended-session.spec.ts` | 3 | the live region announces ahead of the page; the heading is focusable and both variants land on it; the blocked variant withholds the sign-in control; a merchant-area item takes a guest to sign-in and keeps it enabled (T097, T105) |
| `packages/ui/tests/shell/footer.spec.ts` | 2 | the brand line and the four recorded links; absent below 1024 px, with its links carried in the drawer |
| `packages/ui/tests/shell/sidebar.spec.ts` | 5 | the nine destinations in order with their names and hrefs; each label carried whole in the full sidebar and the rail; the collapse control's three names; the rail consumes the layer's width token; the drawer copy of the four static links |
| `packages/ui/tests/shell/accessibility.spec.ts` | 4 | every header control's name and role; the bar slots' names and the guest's three controls; the ended-session live region and focusable heading; no shell component sets its own direction or language |
| `packages/ui/tests/shell/no-admin-surface.spec.ts` | 2 | the administrator surface is not shipped by R1; the layer's README records the administrator header binding |

The A8 shared code step's supplied values (T133) pass in
`apps/web/tests/unit/supplied-values.spec.ts` — 3 tests: Arabic-Indic digits
render unchanged, every supplied value sits in its own isolated run (`dir="auto"`,
the phone `dir="ltr"`), and the resend control is disabled when the allowance is
spent. The emoji refusal (T034, T037) passes in the shared suite — 32 tests in 4
files, including `refuses an emoji with reason emoji rather than a length text`
in `packages/shared/src/contracts/__tests__/sign-up.spec.ts` — and its API half
lives in `apps/api/test/integration/auth/sign-up.spec.ts`.

## 5. SC-006's markup half — no page renders the frame

At both widths the three pages render the bare layout and no frame:

| Probe | 320 | 1280 |
|---|---|---|
| `header` elements | 0 | 0 |
| `footer` elements | 0 | 0 |
| `nav` elements | 1 (the bare page's cross-links) | 1 |
| `.bare-layout` | 1 | 1 |

The automated scan (`apps/web/tests/a11y/states.spec.ts`) ran 12 tests on
2026-11-07 — three pages at 320 and 1280 in both appearances — with no axe
violation and no horizontal scroll at 320. On 2026-11-08 it was extended to the
full matrix: **32 delivered states × 320 and 1280 CSS px × light and dark = 128
scans**, under the WCAG 2.2 AA tag set (`wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`, `wcag22aa`), driven by the shared state module
(`apps/web/tests/support/scenarios.ts`) against the production build, the local
API, and the database. All 128 scans passed with no violation and no horizontal
scroll at 320 (T194, T198). The frame's runtime, its keyboard pass on a rendered
page, and its accessibility scan stay with R2, which ends `EX-007`.

## 6. Observations

1. **Terminal focus.** A terminal step removes the control that was focused, so
   focus moves to the outcome's heading (`tabindex="-1"`); the code step and the
   new-password step move it to their first field. The outcome is announced by
   the `role="status"` region, and the next `Tab` reaches the outcome's own
   controls. This behaviour was recorded on 2026-11-09 for T211/T213 and is
   asserted by `apps/web/tests/e2e/verification-outcomes.spec.ts`,
   `sign-in.spec.ts`, `forgot-password.spec.ts`, and
   `code-bound-ending.spec.ts`; the baseline in
   `apps/web/tests/e2e/__screenshots__/` records the same states.
2. **The city list's tab stops.** While the city list is open its option buttons
   are in the tab order. They are ordinary buttons, all reachable and all
   operable with `Enter`, and the list closes on selection; the pattern is
   recorded here as observed, not as a new requirement.
3. **The wordmark is not focusable.** The first `Tab` lands on the first field,
   so the keyboard path starts where the work starts.

## 7. Evidence

- The keyboard walkthrough was executed with `Tab`, `Shift+Tab`, typing, and
  `Enter` only, at 320 and 1280 CSS px, against the dev server, the local API,
  and the fake SMS transport named in §1 (corrected 2026-11-10: the sentence
  previously said "the state stand-in", the stand-in T201 removed); its focus
  order is the one recorded above.
- `pnpm exec vitest run --project ui`: 44 passed (11 files).
- `pnpm exec vitest run --project shared`: 32 passed (4 files).
- `pnpm exec vitest run --project web supplied-values`: 3 passed.
- `pnpm exec playwright test --config apps/web/tests/playwright.config.ts --project=a11y`:
  32 tests passed on 2026-11-08, carrying 128 scans (32 states × 320/1280 ×
  light/dark) with no axe violation and no horizontal scroll at 320.
- `pnpm exec playwright test --config apps/web/tests/playwright.config.ts --project=visual`:
  35 tests passed on 2026-11-08, carrying 128 baselines (32 states × 1280/375 ×
  light/dark) and the three 320 light reflow captures, driven through the local
  API and the database.
