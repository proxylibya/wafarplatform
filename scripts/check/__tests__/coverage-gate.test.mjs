// The coverage gate's regression suite: it pins the measured-line denominator,
// the no-coverage-record exclusion, the zero-hit rule, the class exclusions, and
// the untracked-source guard (T155; bug coverage-gate-scope).
import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const gate = fileURLToPath(new URL('../coverage-gate.mjs', import.meta.url));

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'coverage-gate-'));
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.email', 'coverage-gate@example.test']);
  git(dir, ['config', 'user.name', 'Coverage Gate Test']);
  writeFileSync(join(dir, 'README.md'), 'base\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'base']);
  return { dir, base: git(dir, ['rev-parse', 'HEAD']) };
}

function commitFiles(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'change']);
}

function writeLcov(dir, records) {
  const lines = [];
  for (const [file, entries] of Object.entries(records)) {
    lines.push(`SF:${file}`);
    for (const [line, hits] of entries) lines.push(`DA:${line},${hits}`);
    lines.push('end_of_record');
  }
  mkdirSync(join(dir, 'coverage'), { recursive: true });
  writeFileSync(join(dir, 'coverage', 'lcov.info'), `${lines.join('\n')}\n`);
}

function runGate(dir, base) {
  const result = spawnSync(process.execPath, [gate], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, COVERAGE_BASE: base },
  });
  const reportPath = join(dir, 'coverage', 'changed-lines.json');
  const report = existsSync(reportPath)
    ? JSON.parse(readFileSync(reportPath, 'utf8'))
    : null;
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    report,
  };
}

test('counts only changed lines with a DA record', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'src/measured.ts': [
      '// comment',
      'export const a = 1;',
      'export const b = 2;',
      '// comment',
      'export const c = 3;',
      '',
      'export const d = 4;',
      '// comment',
      '',
    ].join('\n'),
  });
  writeLcov(dir, {
    'src/measured.ts': [
      [2, 1],
      [3, 1],
      [5, 1],
      [7, 1],
    ],
  });

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.physicalChangedLineCount, 8);
  assert.equal(result.report.changedLineCount, 4);
  assert.equal(result.report.coveredLineCount, 4);
  assert.equal(result.report.unmeasuredLineCount, 4);
  assert.equal(result.report.noCoverageRecordLineCount, 0);
  assert.equal(result.report.noMeasurableLineCount, 0);
  assert.equal(result.report.percentage, 100);
  assert.deepEqual(result.report.files[0].unmeasured, [1, 4, 6, 8]);
});

test('excludes a test file with no coverage record', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'src/measured.ts': 'export const a = 1;\nexport const b = 2;\n',
    'tests/thing.spec.ts':
      '// a test file\n// with five lines\n// that has\n// no coverage\n// record\n',
  });
  writeLcov(dir, {
    'src/measured.ts': [
      [1, 1],
      [2, 1],
    ],
  });

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.changedLineCount, 2);
  assert.equal(result.report.noCoverageRecordLineCount, 5);
  assert.deepEqual(
    result.report.excluded.find((entry) => entry.path === 'tests/thing.spec.ts'),
    { path: 'tests/thing.spec.ts', reason: 'test code', exception: '—' },
  );
});

test('labels tooling and configuration without a coverage record', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'src/measured.ts': 'export const a = 1;\n',
    'packages/config/vitest.config.ts': 'export default {};\nexport const x = 1;\n',
    'packages/db/scripts/probe.ts': 'export const probe = 1;\n',
  });
  writeLcov(dir, {
    'src/measured.ts': [[1, 1]],
  });

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  const reasons = new Map(
    result.report.excluded.map((entry) => [entry.path, entry.reason]),
  );
  assert.equal(
    reasons.get('packages/config/vitest.config.ts'),
    'tooling or configuration',
  );
  assert.equal(reasons.get('packages/db/scripts/probe.ts'), 'tooling or configuration');
});

test('keeps a measured file with zero hits in the denominator', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'src/uncovered.ts': 'export const a = 1;\nexport const b = 2;\n',
  });
  writeLcov(dir, {
    'src/uncovered.ts': [
      [1, 0],
      [2, 0],
    ],
  });

  const result = runGate(dir, base);

  assert.equal(result.status, 1);
  assert.equal(result.report.changedLineCount, 2);
  assert.equal(result.report.coveredLineCount, 0);
  assert.equal(result.report.percentage, 0);
  assert.equal(result.report.files[0].changed, 2);
  assert.equal(result.report.files[0].covered, 0);
});

test('keeps the class exclusions before the coverage record', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'packages/shared/src/normalize/generated/emoji-data.ts': 'export const emoji = 1;\n',
    'packages/shared/src/reference/libyan-cities.ts': 'export const cities = 1;\n',
    'packages/db/migrations/0001_test.ts': 'export const migration = 1;\n',
    'apps/web/tests/e2e/__screenshots__/shot.ts': 'export const shot = 1;\n',
    'packages/ui/app/components/shell/WfShellHeader.vue':
      '<template><header /></template>\n',
  });
  writeLcov(dir, {});

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  const reasons = new Map(result.report.excluded.map((entry) => [entry.path, entry]));
  assert.equal(
    reasons.get('packages/shared/src/normalize/generated/emoji-data.ts').reason,
    'generated code',
  );
  assert.equal(
    reasons.get('packages/shared/src/reference/libyan-cities.ts').reason,
    'generated or vendored code',
  );
  assert.equal(reasons.get('packages/db/migrations/0001_test.ts').reason, 'migration');
  assert.equal(
    reasons.get('apps/web/tests/e2e/__screenshots__/shot.ts').reason,
    'snapshot',
  );
  assert.equal(
    reasons.get('packages/ui/app/components/shell/WfShellHeader.vue').exception,
    'EX-007',
  );
});

test('excludes a coverage record with no measurable changed line', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  commitFiles(dir, {
    'src/types.ts': 'export interface A { a: string; }\nexport type B = A;\n',
  });
  writeLcov(dir, { 'src/types.ts': [] });

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.changedLineCount, 0);
  assert.equal(result.report.noMeasurableLineCount, 2);
  assert.deepEqual(
    result.report.excluded.find((entry) => entry.path === 'src/types.ts'),
    {
      path: 'src/types.ts',
      reason: 'no measurable changed lines',
      exception: '—',
    },
  );
});

test('fails when untracked source is invisible to the diff', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'src', 'new.ts'), 'export const value = 1;\n');

  const result = runGate(dir, base);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /uncommitted source exists/);
  assert.match(result.report.failure, /no committed \.ts\/\.vue change is visible/);
  assert.equal(result.report.percentage, null);
});

test('fails when staged source is invisible to the diff', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'src', 'staged.ts'), 'export const value = 1;\n');
  git(dir, ['add', 'src/staged.ts']);

  const result = runGate(dir, base);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /uncommitted source exists/);
  assert.match(result.report.failure, /no committed \.ts\/\.vue change is visible/);
  assert.equal(result.report.percentage, null);
});

test('passes a docs-only change with an explicit message', (t) => {
  const { dir, base } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'README.md'), 'base\n\nA documentation-only change.\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'docs']);

  const result = runGate(dir, base);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no changed \.ts\/\.vue files; nothing to measure/);
  assert.equal(result.report, null);
});

test('the coverage include list carries the db production module', () => {
  const config = readFileSync(
    fileURLToPath(new URL('../../../packages/config/vitest.config.ts', import.meta.url)),
    'utf8',
  );
  assert.match(config, /packages\/db\/unit-of-work\.ts/);
});
