# The shell layer

The shell components are the product's one page frame: `WfShellHeader`,
`WfShellSidebar` (with `WfNavList`), `WfShellBottomBar`, `WfShellFooter`,
`WfShellDrawer`, `WfAccountMenu`, `WfThemeSwitch`, and `WfEndedSession`. Their
composition and copy are fixed by `specs/001-identity-foundation/contracts/ui-contracts.md`
§8 and the design tokens by ADR-128.

R1 ships no page that renders the frame; the seven page behaviours SC-005 defers
are R2's under `EX-007`. The components are exercised structurally only.

## The administrator application's header binding (FR-050, AC-054)

R13 delivers the administrator application, and this slice builds none of it.
Its header carries the logo at the inline-start edge and an account control whose
menu offers `تسجيل الخروج` only: no merchant sidebar, no bottom bar, and no
notifications control. The binding is recorded here so R13 implements one
header rather than inventing a second.
