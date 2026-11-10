# Bug Fix: Coverage gate measures only the lines that carry a coverage record

- **Slug**: coverage-gate-scope
- **Fixed**: 2026-11-08
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The changed-line gate now measures the intersection of the added lines with the lcov `DA` set, lists files that have no coverage record under `excluded` with a reason, keeps a measured file with zero hits in the denominator at 0%, and fails instead of reporting a 0/0 pass when the change is uncommitted. `packages/db/unit-of-work.ts` is added to the coverage include list so the no-record rule cannot hide that production module. The honest first-commit result is `3,416/4,976 = 68.65%`, below the 80% threshold, so R1's acceptance remains blocked on the real coverage gap rather than on test/tool noise.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `scripts/check/coverage-gate.mjs` | modified | `coverage()` now keeps both the full `DA` set and the covered subset; the loop intersects changed lines with the `DA` set; files with no coverage record are excluded with a reason; measured files with zero hits stay at 0%; a 0/0 run with uncommitted source fails and writes a failure report; the report gains `physicalChangedLineCount`, `unmeasuredLineCount`, `noCoverageRecordLineCount`, and `noMeasurableLineCount`. |
| `packages/config/vitest.config.ts` | modified | Adds `packages/db/unit-of-work.ts` to `coverage.include`, so the next coverage run instruments it and the gate can count it. |
| `scripts/check/__tests__/coverage-gate.test.mjs` | added | Ten fixture tests using a temporary git repository and lcov file, run by `node --test`. |
| `package.json` | modified | Adds `test:tools` for the gate's regression suite. |
| `.github/workflows/ci.yml` | modified | Runs `node --test scripts/check/__tests__/coverage-gate.test.mjs` in the `unit` job; the coverage-job comment now says “measurable changed production lines”. |
| `README.md` | modified | Documents the measurable-line denominator, the no-coverage-record `excluded` entries, the zero-hit rule, and the uncommitted-source guard. |
| `specs/001-identity-foundation/tasks.md` | modified | T022 and T155 now state the measurable changed-line threshold and the report's physical/measurable/unmeasured counts. |
| `specs/001-identity-foundation/plan.md` | modified | Gate 1 → III, the coverage-report row, and Complexity Tracking row 32 now state the measurable changed-line threshold. |
| `coverage/changed-lines.json` | regenerated | The live tree now writes the guard-failure report (`percentage: null`, a `failure` reason) instead of the old `0/0 = 100` report. The file is ignored. |

## Diff Highlights (optional)

The coverage parser keeps the full `DA` set, not only the hits:

```js
files.set(current, { measured: new Set(), covered: new Set() });
// ...
files.get(current)?.measured.add(lineNumber);
if (Number.parseInt(record[2], 10) > 0) {
  files.get(current)?.covered.add(lineNumber);
}
```

The loop uses that set to decide the denominator:

```js
const record = covered.get(file);
if (record === undefined) {
  noCoverageRecordLineCount += lines.size;
  excluded.push({ path: file, reason: unmeasuredReason(file), exception: '—' });
  continue;
}
const changedLinesInFile = [...lines]
  .filter((line) => record.measured.has(line))
  .sort((a, b) => a - b);
```

A measured file with zero hits still reaches `measured.push`, so it stays at 0%. A 0/0 run with uncommitted source now writes a failure report and exits 1:

```js
if (uncommitted.length > 0) {
  writeReport({ /* zero counts, percentage: null, failure */ });
  console.error(`Coverage gate: ${failure} (${uncommitted.length} file(s)); commit the change before measuring.`);
  process.exit(1);
}
```

## Tests Added or Updated

- `scripts/check/__tests__/coverage-gate.test.mjs` — “counts only changed lines with a DA record”: a file with eight physical lines and four `DA` lines at 100% reports `changedLineCount: 4`, `unmeasuredLineCount: 4`, and `percentage: 100`.
- “excludes a test file with no coverage record”: a five-line `tests/thing.spec.ts` is excluded with reason `test code` and counted in `noCoverageRecordLineCount`.
- “labels tooling and configuration without a coverage record”: `packages/config/vitest.config.ts` and `packages/db/scripts/probe.ts` are excluded with reason `tooling or configuration`.
- “keeps a measured file with zero hits in the denominator”: a file with two `DA` records at zero hits stays in `files` and drags the percentage to 0%.
- “keeps the class exclusions before the coverage record”: generated, vendored, migration, snapshot, and `EX-007` paths keep their reasons and exception rows.
- “excludes a coverage record with no measurable changed line”: an lcov `SF:` entry with no `DA` lines is excluded as `no measurable changed lines` and counted in `noMeasurableLineCount`.
- “fails when untracked source is invisible to the diff”: the 0/0 guard exits 1 and writes a failure report instead of 100%.
- “fails when staged source is invisible to the diff”: the same guard catches a staged but uncommitted change.
- “passes a docs-only change with an explicit message”: a change with no `.ts`/`.vue` file exits 0 with “no changed .ts/.vue files; nothing to measure.”
- “the coverage include list carries the db production module”: pins `packages/db/unit-of-work.ts` in `coverage.include`.

## Local Verification

- Commands run:
  - `pnpm test:tools` → 10 tests, 10 pass, 0 fail, exit 0.
  - `node scripts/check/test-environments.mjs` → “Test environments ok: five projects and the enumeration run…”
  - `node scripts/check/module-headers.mjs` → “Module headers ok: 136 files carry a responsibility header.”
  - `node governance-drift-check.mjs` → “RESULT: clean — no drift found.”
  - `node --check scripts/check/coverage-gate.mjs` and `node --check scripts/check/__tests__/coverage-gate.test.mjs` → pass.
  - `pnpm exec eslint scripts/check/coverage-gate.mjs scripts/check/__tests__/coverage-gate.test.mjs` → pass.
  - `pnpm exec prettier --config packages/config/prettier.config.mjs --check scripts/check/coverage-gate.mjs scripts/check/__tests__/coverage-gate.test.mjs packages/config/vitest.config.ts package.json` → “All matched files use Prettier code style!”
  - The gate against a scratch clone of the first commit (all untracked `.ts`/`.vue` files committed, existing `coverage/lcov.info`) → `Coverage gate: 3,416/4,976 measurable changed production lines covered (68.65%, threshold 80%)`, exit 1. The report records `physicalChangedLineCount: 22650`, `unmeasuredLineCount: 2604`, `noCoverageRecordLineCount: 15046`, and `noMeasurableLineCount: 24`; the four counts sum to 22,650.
  - The gate against the live tree with `COVERAGE_BASE=74ab8f29b832d7650669df32c05c0af3212e2e11` → exit 1 with “no committed .ts/.vue change is visible to git; uncommitted source exists (215 file(s))”. The old `0/0 = 100%` false pass is gone.
- Manual checks: reviewed the report’s physical/measurable split and the `68.65%` figure; verified that the generated `emoji-data.ts` (461 covered lines) remains excluded, so the report’s `71.31%` is not the gate’s number.
- Not run: the full `pnpm test:coverage` run (it needs PostgreSQL and the service stack). The existing `coverage/lcov.info` is the pre-fix snapshot, so the current gate still lists `packages/db/unit-of-work.ts` as “not measured by the coverage report”. A fresh run will include it through the new `coverage.include` entry. The full `pnpm lint` and `pnpm typecheck` runs were not repeated; the changed script and test are dependency-free Node, and the targeted checks above pass.

## Deviations from Assessment

- The assessment described the 0/0 guard for untracked source. The implementation also detects staged source (`git diff --cached`), because a staged change is equally invisible to `git diff <base>...HEAD` and would otherwise still produce a false pass. This is the same defect class, logged here.
- The report adds `noMeasurableLineCount` (a file with an `SF:` record but no `DA` line) and a `failure` field for the guard report. The assessment named `unmeasuredLineCount`; the extra field keeps the physical-line arithmetic exact (`22,650 = 4,976 + 2,604 + 15,046 + 24`).
- The regression suite uses Node's built-in test runner (`node --test`) and a `test:tools` script rather than a sixth Vitest project. The five-project Vitest split is pinned by `scripts/check/test-environments.mjs`; adding a project would change that contract for a tooling test, so the Node runner is the smaller change.
- The assessment's post-fix expectation of `71.31%` is corrected to `68.65%`: `71.31%` is `3,877/5,437` over the full lcov report and includes the 461 covered lines of the generated emoji file, which the gate excludes as a class. `68.65%` is the gate's actual scope, `3,416/4,976`.
- The spec's product-level “80% of changed production lines” wording is unchanged. The measurable-line definition is a technical measurement rule, recorded in `README.md`, T022, T155, and the plan; the product target remains 80%.

## Follow-ups

- Run `pnpm test:coverage` against PostgreSQL and re-run the gate on the fresh `coverage/lcov.info`. Confirm `packages/db/unit-of-work.ts` appears in the report (at 0% or covered) and that the new number is the one recorded for acceptance.
- Close the `68.65% → 80%` gap with tests, not by lowering the threshold. The scratch first-commit measurement’s uncovered lines point at the UI pages/forms (`apps/web/app/pages/auth/*.vue`, `SignUpForm.vue`, `SignInForm.vue`, `RecoveryForm.vue`, `NewPasswordStep.vue`, `PasswordField.vue`), the API CLI/openapi modules (`provision-administrator.ts`, `revoke-session.ts`, `openapi.ts`, `index.ts`), and the shared validation/contracts paths.
- Decide the docs-only/0-behaviour policy and the single source of truth for the production universe (the assessment’s open questions). Today the gate uses lcov `DA` presence, and the `coverage.include` list is the config’s declaration; a future production file omitted from the include list is visible only through its “not measured by the coverage report” exclusion, not as a failure.
- Consider making a production file with no `DA` record a failure (rather than an exclusion) once the production-universe source of truth exists. The current config test pins `unit-of-work.ts` only.
- If the exclusion globs are touched, narrow `packages/shared/src/reference/` so `__tests__/libyan-cities.spec.ts` is labelled `test code`, not “generated or vendored code”.
- R1's acceptance MUST NOT be recorded while the gate fails; the `68.65%` result is the blocking evidence the acceptance review should read.
