# Bug Assessment: Coverage gate counts unmeasured files and non-executable lines

- **Slug**: coverage-gate-scope
- **Created**: 2026-11-08
- **Source**: pasted text (no URL; URL Trust Policy not applicable)
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> بوابة التغطية scripts/check/coverage-gate.mjs معطوبة. محليًا تعطي 0/0 = 100% لأن الملفات غير متعقّبة في git. وعند أول commit ستعطي 17.12% لسببين: (أ) changedLines() في السطر 81 يمرّر كل *.ts و*.vue بلا استثناء لمسارات الاختبار، فيدخل نحو 14,671 سطرًا من apps/api/test وapps/web/tests وpackages/ui/tests وpackages/config بصفر تغطية؛ (ب) البسط أسطر lcov المقاسة فقط (5,437) والمقام أسطر الـdiff الفيزيائية، فالسقف 67.45% حتى لو غُطّيت كل الأسطر المقاسة. القياس الفعلي 3877/5437 = 71.31%. المطلوب: قياس الأسطر المضافة التي لها سجل DA فقط، وإدراج الملفات غير المقاسة (اختبارات/أدوات/مولّد) في excluded بسببها، وإعادة القياس. slug=coverage-gate-scope

**English summary.** The changed-line coverage gate is measured against the wrong universe. Locally it reports `0/0 = 100%` because the R1 source files are untracked and therefore invisible to `git diff`. On the first commit it would count every `*.ts` and `*.vue` file, including roughly 15,000 test/tool/config lines with no coverage instrumentation, and it divides covered lcov lines by physical diff lines, so even 100% coverage of every measured line is capped below the 80% threshold. The requested fix is to count only added lines with a `DA` record, list files with no coverage record under `excluded`, and re-measure.

## Symptom

The gate cannot report the change's real production-line coverage. A local run over untracked sources reports `0/0 = 100%` and exits 0 without measuring anything; a first commit would report about 15–17% because test/tool/config files and non-executable lines sit in the denominator, and after the requested fix the gate reports `3,416/4,976 = 68.65%`, which is still below the 80% threshold and still fails.

## Reproduction

1. Start from the current working tree with the existing coverage snapshot: `coverage/lcov.info` contains 94 `SF:` records, 5,437 `DA:` records, and 3,877 records with a hit count greater than zero (the overall lcov line coverage is `3,877/5,437 = 71.31%`).
2. Reproduce the local false pass: run the gate with `COVERAGE_BASE` set to the branch point (`74ab8f29b832d7650669df32c05c0af3212e2e11`), for example `$env:COVERAGE_BASE='74ab8f29b832d7650669df32c05c0af3212e2e11'; node scripts/check/coverage-gate.mjs` in PowerShell. Because all R1 `.ts`/`.vue` files are untracked, `git diff <base>...HEAD` is empty. The script writes `changedLineCount: 0`, `coveredLineCount: 0`, `percentage: 100` and exits 0. The existing `coverage/changed-lines.json` already carries that report.
3. Simulate the first commit in a scratch clone: commit every untracked `*.ts`/`*.vue` file on top of an empty base and run the same gate with `COVERAGE_BASE=<base>`. The current gate reports `3,416/22,650 = 15.08%` and exits 1. The report's 17.12% is `3,877/22,650`; the 461-line difference is the generated `packages/shared/src/normalize/generated/emoji-data.ts` (461 `DA` lines, all covered), which the gate correctly excludes as generated code.
4. Apply the requested DA-intersection in a scratch copy of the script. The gate reports `3,416/4,976 = 68.65%`, skips 2,604 changed non-executable/unmeasured lines inside measured files, and lists 109 files with no coverage record under `excluded`. It still exits 1. The report's 71.31% is `3,877/5,437` over the full lcov report, including the generated file; it is not the gate's post-fix scope.
5. Measure the ceiling. The 109 no-DA files account for about 15,000 physical changed lines (the report's ~14,671 covers `apps/api/test`, `apps/web/tests`, `packages/ui/tests`, and `packages/config`; the difference is the co-located `__tests__` suites, `packages/db/scripts`, and config files). The 92 measured files contain 7,580 physical changed lines, of which only 4,976 have a `DA` record; the other 2,604 are comments, blank lines, type-only declarations, and similar non-executable lines. With the current denominator, even 100% coverage of all 4,976 measurable lines yields `4,976/22,650 = 21.97%`; after removing test/tool files but keeping the physical production denominator, the cap is about 65.3% with generated code excluded (71.4% if generated code were counted). Both are below 80%; the report's 67.45% is in the same range and depends on how the test/tool/config paths are classified.

No URL was supplied, so no page was fetched and no untrusted page content was processed.

## Suspected Code Paths

- `scripts/check/coverage-gate.mjs:81` — `git diff ... -- '*.ts' '*.vue'` makes the extension the only filter. Every test, tool, and config file enters `changedLines()`, even though the coverage configuration never instruments them.
- `scripts/check/coverage-gate.mjs:105-126` — `coverage()` keeps only `DA` records with a hit count greater than zero. The full `DA` set, which is needed to know which changed lines are measurable, is discarded.
- `scripts/check/coverage-gate.mjs:142-157` — a file absent from lcov gets `new Set()` and is measured at 0% instead of being excluded or flagged; `changed` is the physical line count, including non-executable lines.
- `scripts/check/coverage-gate.mjs:159-164` — the denominator is the sum of all physical changed lines, and `changedLineCount === 0` returns 100. The `0/0` case reports a pass without evidence.
- `packages/config/vitest.config.ts:75-111` — the coverage `include`/`exclude` lists already define the production universe: API/web/UI/db/shared source in, tests/tools/build output out. The gate does not honor that boundary.
- `packages/config/vitest.config.ts:81-94` — `packages/db/unit-of-work.ts` is production code but is missing from `coverage.include`; it has no `DA` record, so the requested no-DA exclusion would silently hide it.
- `.github/workflows/ci.yml:88-135` — the `coverage` job runs `pnpm test:coverage` and then the gate with `COVERAGE_BASE`; this is the blocking moment T155 names.
- `README.md:152-167` — the documented contract: 80% of changed production lines, generated/migrations/snapshots excluded as classes, EX-007 only for the frame, and R1 acceptance must not be recorded while the gate fails.
- `specs/001-identity-foundation/tasks.md:1049` (T155) and `specs/001-identity-foundation/plan.md:3609` (Complexity Tracking row 32) — the acceptance contract the gate serves.

## Root Cause Hypothesis

The gate has two independent measurement defects and one false-green path, all confirmed by code inspection and reproduction. First, its diff filter is extension-only, so the universe includes test, tooling, and configuration files that the coverage configuration intentionally does not instrument; those files can never have a `DA` record, and the gate silently prices them at 0%. Second, the denominator is the physical added-line count while the numerator is covered `DA` lines; comments, blank lines, type-only declarations, and other non-executable lines are in the denominator but can never be in the numerator, so the score is capped below the threshold. The correct denominator is the intersection of added lines with the lcov `DA` set. Third, when the change is untracked, `git diff` returns nothing and the `0/0 → 100` branch reports a pass without measuring anything. The report's exact figures are slightly off because its 17.12% and 71.31% include the 461 covered lines of the generated emoji file that the gate excludes, but the direction and the two root causes are exactly right. Confidence: high.

## Proposed Remediation

**Preferred**: Make the coverage report, not the extension filter, define the measured universe.

In `coverage()`, retain both the full set of `DA` line numbers and the covered subset for each file. In the main loop, after the existing class exclusions, look up the file's `DA` record:

- If the file has no `DA` record at all, add it to `excluded` with `reason: 'not measured by the coverage report'` (optionally classifying it as test, tooling, configuration, or generator for readability). This is the requested no-DA exclusion.
- If the file has a `DA` record, set `changedLinesInFile = changed ∩ measured`, `coveredLines = changed ∩ covered`, and keep `unmeasured = changed − measured` for transparency.
- If the file has a `DA` record but no changed line has one, exclude it as `no measurable changed lines`.
- A file with `DA` records and zero hits must stay in the denominator at 0%. It is measured but uncovered; do not mistake "no covered lines" for "no coverage record".

Then sum the measurable changed lines for `changedLineCount`, add `unmeasuredLineCount` to the report, and keep the 80% threshold. On the current snapshot this yields `3,416/4,976 = 68.65%`.

Two companion fixes are required for the result to be trustworthy:

1. **Do not let the no-DA rule hide production code.** `packages/db/unit-of-work.ts` is production and has no `DA` record because it is absent from `coverage.include`. Add it to the include list, or make the gate fail when a file inside the production roots has no coverage record. A no-DA allowlist for tests/tools/config/generator is safer than excluding every no-DA file.
2. **Make the 0/0 case honest.** When `changed.size === 0`, check for untracked `*.ts`/`*.vue` files (`git ls-files --others --exclude-standard -- '*.ts' '*.vue'`). If any exist, fail or warn that the gate measured nothing; a docs-only change may pass with a clear "no changed source" message. Fixing only the denominator leaves the local 100% false pass in place.

Keep the generated/vendored/migration/snapshot/EX-007 exclusions exactly as they are. Do not include the 461 generated lines to inflate the number to 71.31%; that would contradict the documented generated-code exclusion.

**The script fix alone does not make the gate pass.** The honest first-commit result is 68.65%, below 80%. R1's acceptance remains blocked until the coverage gap is closed by tests or an ADR changes the threshold or scope. This assessment surfaces the gap; it does not lower the threshold.

**Alternatives**:

- **Path-only exclusions**: add `**/__tests__/**`, `apps/api/test/**`, `apps/web/tests/**`, `packages/ui/tests/**`, `packages/config/**`, `packages/db/scripts/**`, and `*.config.ts` to `exclusions`. This removes the test/tool noise but leaves the non-executable-line ceiling: the physical production denominator is about 7,600 lines while only 4,976 are `DA`, so the result is still capped below 80% (about 65.3% with generated code excluded). Not sufficient alone.
- **Use a diff-coverage tool such as `diff-cover`**: it already intersects the diff with lcov `DA` lines and enforces a threshold. Trade-off: a Python dependency and a second tool in CI; the current script is small and already wired into T155.
- **File-level `LF`/`LH` instead of per-line**: coarser and weights a changed file by its total coverage; a change to an uncovered part of a mostly covered file could pass. Not preferred.
- **Count the generated emoji file**: `3,877/5,437 = 71.31%`, matching the report's figure, but it violates the generated-code exclusion and still fails. Do not.

**Files likely to change**:

- `scripts/check/coverage-gate.mjs` — DA-intersection, no-DA exclusion, `unmeasuredLineCount`, 0/0 guard.
- `packages/config/vitest.config.ts` — add `packages/db/unit-of-work.ts` to `coverage.include` (and audit the production list).
- `README.md` — describe the DA-intersection, the unmeasured-file exclusion, and the 0/0 behavior.
- `specs/001-identity-foundation/tasks.md` and/or `specs/001-identity-foundation/plan.md` — update T155/T022 and Complexity Tracking row 32 if the report fields or the gate contract change.
- `.github/workflows/ci.yml` — only if the 0/0 guard needs a new flag or base validation.
- `scripts/check/__tests__/coverage-gate.spec.ts` (or a Node test file beside the script) — new fixture tests; wire them into a Vitest project or the Node test runner.
- `coverage/changed-lines.json` — regenerated, ignored.

**Tests to add or update**:

- A fixture that creates a temporary git repo and lcov file, then asserts: a measured production file with 100 changed lines, 60 `DA` lines, and 50 covered yields `50/60 = 83.33%`; a test file with 200 changed lines and no `DA` is excluded; a production file with 100 changed lines and no `DA` is excluded or flagged according to the chosen policy; comments and blank lines in a measured file do not enter the denominator.
- A measured file with `DA` records and zero hits remains in the denominator at 0% (regression against excluding it).
- A generated file, vendored file, migration, snapshot, and EX-007 path are still excluded by class.
- A 0/0 run with untracked `*.ts` files does not report 100%; a docs-only change reports "no changed source" without a false pass.
- The report carries `unmeasuredLineCount` and per-file `unmeasured` line numbers, and `changedLineCount` is the measurable denominator.
- A coverage-config test that `packages/db/unit-of-work.ts` is in `coverage.include`, or a gate test that a production file with no `DA` record fails rather than being silently excluded.

## Risks & Considerations

- **The fix will make the gate fail at 68.65%, not pass.** This is the main consequence. R1's acceptance must not be recorded while the gate fails; the team needs a coverage plan (tests for the uncovered UI pages/forms, the API CLI/openapi files, and the shared/services modules) or an ADR that changes the threshold or scope. Lowering the threshold without an ADR would violate the documented contract.
- **The 71.31% figure is not the gate's number.** It is the full lcov line coverage including the generated emoji file. The gate's scope is `3,416/4,976 = 68.65%`. Using 71.31% would overstate the result and blur the generated-code exclusion.
- **The no-DA exclusion can hide production code.** `packages/db/unit-of-work.ts` is the concrete case: it is production, has no `DA` record, and would be silently excluded. `createUnitOfWork` also appears to have no caller, so the team should decide whether the file is dead code, should be tested, or should be added to `coverage.include`.
- **The 0/0 false pass is a separate defect.** Fixing the denominator does not fix it. A local gate that reports 100% with zero measured lines is worse than a skip; the untracked-source guard is needed.
- **The lcov snapshot is from 2026-11-08 01:33.** A fresh `pnpm test:coverage` is required to confirm the final number and to ensure the report matches the current source. The `coverage` CI job runs all projects; the `unit` job runs only four projects with coverage, so the gate must read the combined report.
- **The exact line counts differ by classification.** The report says about 14,671 test lines; the reproduced four-root count is 14,005, and the full test/tool/config set is about 15,000. The difference is the co-located `__tests__` suites, `packages/db/scripts`, and config files. Do not tune the fix to the headline number; tune it to the DA rule.
- **The existing `packages/shared/src/reference/` exclusion also catches `__tests__/libyan-cities.spec.ts`.** The file is excluded, but its reason reads "generated or vendored code"; if the exclusions are touched, narrow the glob so a test is not mislabeled.
- **The gate depends on `git` being on `PATH`.** In this environment Git exists only at `C:\Program Files\Git\cmd\git.exe`, and the gate crashed with `spawnSync git ENOENT` until the path was prepended. CI has Git on `PATH`; a local wrapper should ensure it too.
- **Console output will list about 109 excluded files.** The JSON can carry every path, but the console should group them by class so the gate's output stays readable.
- **Performance and security**: parsing two sets per lcov file is negligible (94 files, 5,437 lines); no security impact. The report is an artifact and should stay ignored/attached as it is today.

## Open Questions

- [NEEDS CLARIFICATION: What should the gate do for a docs-only change with no `.ts`/`.vue` files? Pass with "no changed source", skip, or fail? The current `0/0 → 100` is misleading either way.]
- [NEEDS CLARIFICATION: Is `packages/db/unit-of-work.ts` intentionally outside `coverage.include`, or should it be added? If `createUnitOfWork` is unused, is it dead code to remove, or a port to test?]
- [NEEDS CLARIFICATION: Is the 80% threshold meant to apply to the first commit's entire R1 source? If yes, the real gap is 68.65% → 80% and needs a test plan or an ADR. If it is meant for incremental changes after the foundation, the first commit needs an explicit baseline/exemption decision.]
- [NEEDS CLARIFICATION: Should `coverage.include` be the single source of truth for the gate's production universe? If yes, how should the `.mjs` gate read the TypeScript config — a shared JSON/manifest, an environment variable, or a duplicated list?]
- [NEEDS CLARIFICATION: Should `changedLineCount` keep its current meaning (physical changed lines) or become the measurable changed-line count? Adding `physicalChangedLineCount` and `unmeasuredLineCount` avoids breaking readers of the report.]
- [NEEDS CLARIFICATION: Should the test/tool/config exclusions be path-based, DA-based, or both? DA-based is the semantic rule; path-based labels make the report stable if the coverage configuration changes.]
