// The changed-line coverage gate (T155): the blocking moment of the ≥ 80%
// threshold T022 fixes. It reads the V8 coverage report, asks git for the lines
// this change added against the revision the branch was created from, and fails
// when fewer than 80% of the measurable changed production lines are covered.
// A measurable line is an added line that carries a DA record in the lcov
// report: comments, blank lines, type-only declarations, and files the coverage
// configuration does not instrument are not measurable. Generated code,
// migrations, and snapshots are excluded as classes; the frame's page-level
// runtime is excluded only by EX-007. The report names the diff baseline, the
// physical and measurable changed-line counts, the covered count, the
// percentage, the unmeasured-line count, and every excluded path with its
// reason and exception row (Complexity Tracking row 2).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const threshold = 80;
const lcovPath = process.env['COVERAGE_LCOV'] ?? join('coverage', 'lcov.info');
const reportPath =
  process.env['COVERAGE_REPORT'] ?? join('coverage', 'changed-lines.json');

function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

/**
 * The exclusion classes. The first match decides the row the report carries;
 * only EX-007 is an exception with a row, the rest are classes the threshold
 * never reaches.
 */
const exclusions = [
  {
    test: (file) => /(^|\/)generated\//.test(file) || file.endsWith('.d.ts'),
    reason: 'generated code',
    exception: '—',
  },
  {
    test: (file) =>
      file.startsWith('packages/shared/src/reference/') ||
      file.startsWith('apps/api/src/modules/auth/data/') ||
      file.startsWith('packages/ui/vendor/'),
    reason: 'generated or vendored code',
    exception: '—',
  },
  {
    test: (file) => file.startsWith('packages/db/migrations/'),
    reason: 'migration',
    exception: '—',
  },
  {
    test: (file) =>
      file.includes('__snapshots__/') ||
      file.startsWith('apps/web/tests/e2e/__screenshots__/'),
    reason: 'snapshot',
    exception: '—',
  },
  {
    test: (file) =>
      file.startsWith('packages/ui/app/components/shell/') ||
      file === 'apps/web/app/layouts/shell.vue',
    reason: 'the frame’s page-level runtime',
    exception: 'EX-007',
  },
];

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function baseline() {
  if (process.env['COVERAGE_BASE'] !== undefined && process.env['COVERAGE_BASE'] !== '') {
    return process.env['COVERAGE_BASE'];
  }
  try {
    return git(['merge-base', 'HEAD', 'origin/main']);
  } catch {
    return '';
  }
}

/**
 * The reason a file with no DA record sits outside the measured universe. The
 * coverage configuration already keeps tests, tooling, and configuration out
 * of the report; naming the class here keeps the report readable without
 * changing the gate's verdict.
 */
function unmeasuredReason(file) {
  if (/(^|\/)(__tests__|test|tests)\//.test(file) || /\.(spec|test)\.ts$/.test(file)) {
    return 'test code';
  }
  if (
    file.startsWith('scripts/') ||
    file.startsWith('packages/config/') ||
    file.startsWith('packages/db/scripts/') ||
    /(^|\/)[^/]*\.config\.(ts|mjs|js)$/.test(file)
  ) {
    return 'tooling or configuration';
  }
  return 'not measured by the coverage report';
}

/** The untracked or staged .ts/.vue files git would not show in the commit diff. */
function uncommittedSource() {
  try {
    const untracked = git([
      'ls-files',
      '--others',
      '--exclude-standard',
      '--',
      '*.ts',
      '*.vue',
    ])
      .split('\n')
      .filter(Boolean);
    const staged = git(['diff', '--cached', '--name-only', '--', '*.ts', '*.vue'])
      .split('\n')
      .filter(Boolean);
    return [...new Set([...untracked, ...staged])];
  } catch {
    return [];
  }
}

/** The lines this change added against the baseline, per production file. */
function changedLines(base) {
  const diff = execFileSync(
    'git',
    ['diff', '--unified=0', '--no-color', `${base}...HEAD`, '--', '*.ts', '*.vue'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const files = new Map();
  let current = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      const path = line.slice(4).trim();
      current = path === '/dev/null' ? null : path.replace(/^b\//, '');
      if (current !== null) files.set(current, new Set());
      continue;
    }
    if (current === null) continue;
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk === null) continue;
    const from = Number.parseInt(hunk[1], 10);
    const count = hunk[2] === undefined ? 1 : Number.parseInt(hunk[2], 10);
    for (let offset = 0; offset < count; offset += 1) {
      files.get(current)?.add(from + offset);
    }
  }
  return files;
}

/**
 * file -> { measured, covered } from the LCOV report. A file with DA records
 * and zero hits stays measured: "no covered lines" is not "no coverage record".
 */
function coverage() {
  if (!existsSync(lcovPath)) {
    throw new Error(`no coverage report at ${lcovPath}; run the coverage run first`);
  }
  const files = new Map();
  let current = null;
  for (const line of readFileSync(lcovPath, 'utf8').split('\n')) {
    if (line.startsWith('SF:')) {
      current = line.slice(3).trim().replace(/\\/g, '/').replace(/^\.\//, '');
      files.set(current, { measured: new Set(), covered: new Set() });
      continue;
    }
    if (current === null) continue;
    const record = /^DA:(\d+),(\d+)/.exec(line);
    if (record === null) continue;
    const lineNumber = Number.parseInt(record[1], 10);
    files.get(current)?.measured.add(lineNumber);
    if (Number.parseInt(record[2], 10) > 0) {
      files.get(current)?.covered.add(lineNumber);
    }
  }
  return files;
}

const base = baseline();
if (base === '') {
  // A local run without git has no baseline to measure against; CI must carry
  // one and the job sets COVERAGE_BASE from the event, so this branch is local
  // only and never a passing verdict.
  console.log(
    'Coverage gate: no baseline available (git or COVERAGE_BASE); skipped locally.',
  );
  process.exit(0);
}

const changed = changedLines(base);
if (changed.size === 0) {
  // An untracked or staged change is invisible to `git diff base...HEAD`; a
  // 0/0 pass would claim a verdict the gate never measured. A docs-only change
  // has no .ts/.vue file and passes with an explicit "nothing to measure"
  // message.
  const uncommitted = uncommittedSource();
  if (uncommitted.length > 0) {
    const failure =
      'no committed .ts/.vue change is visible to git; uncommitted source exists';
    writeReport({
      baseline: base,
      threshold,
      physicalChangedLineCount: 0,
      changedLineCount: 0,
      coveredLineCount: 0,
      unmeasuredLineCount: 0,
      noCoverageRecordLineCount: 0,
      noMeasurableLineCount: 0,
      percentage: null,
      failure,
      excluded: [],
      files: [],
    });
    console.error(
      `Coverage gate: ${failure} (${uncommitted.length} file(s)); commit the change before measuring.`,
    );
    process.exit(1);
  }
  console.log('Coverage gate: no changed .ts/.vue files; nothing to measure.');
  process.exit(0);
}

const covered = coverage();
const excluded = [];
const measured = [];
let physicalChangedLineCount = 0;
let noCoverageRecordLineCount = 0;
let noMeasurableLineCount = 0;

for (const [file, lines] of changed) {
  const exclusion = exclusions.find((candidate) => candidate.test(file));
  if (exclusion !== undefined) {
    excluded.push({
      path: file,
      reason: exclusion.reason,
      exception: exclusion.exception,
    });
    continue;
  }
  physicalChangedLineCount += lines.size;
  const record = covered.get(file);
  if (record === undefined) {
    noCoverageRecordLineCount += lines.size;
    excluded.push({
      path: file,
      reason: unmeasuredReason(file),
      exception: '—',
    });
    continue;
  }
  const changedLinesInFile = [...lines]
    .filter((line) => record.measured.has(line))
    .sort((a, b) => a - b);
  if (changedLinesInFile.length === 0) {
    noMeasurableLineCount += lines.size;
    excluded.push({
      path: file,
      reason: 'no measurable changed lines',
      exception: '—',
    });
    continue;
  }
  const coveredLines = changedLinesInFile.filter((line) => record.covered.has(line));
  const unmeasured = [...lines]
    .filter((line) => !record.measured.has(line))
    .sort((a, b) => a - b);
  measured.push({
    path: file,
    changed: changedLinesInFile.length,
    covered: coveredLines.length,
    unmeasured,
    uncovered: changedLinesInFile.filter((line) => !record.covered.has(line)),
  });
}

const changedLineCount = measured.reduce((sum, file) => sum + file.changed, 0);
const coveredLineCount = measured.reduce((sum, file) => sum + file.covered, 0);
const unmeasuredLineCount = measured.reduce(
  (sum, file) => sum + file.unmeasured.length,
  0,
);
const percentage =
  changedLineCount === 0
    ? 100
    : Math.round((coveredLineCount / changedLineCount) * 10000) / 100;

const report = {
  baseline: base,
  threshold,
  physicalChangedLineCount,
  changedLineCount,
  coveredLineCount,
  unmeasuredLineCount,
  noCoverageRecordLineCount,
  noMeasurableLineCount,
  percentage,
  excluded,
  files: measured,
};
writeReport(report);

console.log(
  `Coverage gate: ${coveredLineCount}/${changedLineCount} measurable changed production lines covered (${percentage}%, threshold ${threshold}%), baseline ${base}.`,
);
console.log(
  `  physical changed lines: ${physicalChangedLineCount}; unmeasured in measured files: ${unmeasuredLineCount}; lines in files with no coverage record: ${noCoverageRecordLineCount}; lines with no measurable changed line: ${noMeasurableLineCount}.`,
);
if (changedLineCount === 0) {
  console.log(
    '  no measurable changed production lines; every changed file is excluded.',
  );
}
const excludedByReason = new Map();
for (const entry of excluded) {
  const key = `${entry.reason} (${entry.exception})`;
  const paths = excludedByReason.get(key) ?? [];
  paths.push(entry.path);
  excludedByReason.set(key, paths);
}
for (const [reason, paths] of excludedByReason) {
  if (paths.length <= 10) {
    for (const path of paths) console.log(`  excluded: ${path} (${reason})`);
  } else {
    console.log(`  excluded: ${paths.length} files (${reason})`);
  }
}
for (const file of measured) {
  if (file.uncovered.length > 0) {
    console.log(`  uncovered: ${file.path} lines ${file.uncovered.join(', ')}`);
  }
}
console.log(`Coverage gate report: ${reportPath}`);

if (percentage < threshold) {
  console.error(
    `Coverage gate failed: ${percentage}% of the measurable changed production lines is below ${threshold}%.`,
  );
  process.exit(1);
}
