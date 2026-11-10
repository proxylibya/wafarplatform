// The Test Environment check (T162): one pinned environment per test class.
// It fails the build when a project's configuration departs from its class.
import { existsSync, readFileSync } from 'node:fs';

const config = readFileSync('packages/config/vitest.config.ts', 'utf8');
const setup = readFileSync('apps/api/test/setup.ts', 'utf8');
const enumeration = readFileSync(
  'apps/api/test/integration/auth/vitest.enumeration.config.ts',
  'utf8',
);
const envExample = readFileSync('.env.example', 'utf8');
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const playwright = readFileSync('apps/web/tests/playwright.config.ts', 'utf8');
const problems = [];

const expectations = [
  [/fileParallelism: false/, 'the integration files are serialized'],
  [/name: 'shared'[\s\S]*?include: \['packages\/shared\/src\/\*\*\/__tests__\/\*\*\/\*\.spec\.ts'\]/, 'the shared unit root'],
  [/name: 'api'[\s\S]*?include: \['apps\/api\/src\/\*\*\/__tests__\/\*\*\/\*\.spec\.ts'\]/, 'the API unit root'],
  [/name: 'ui'[\s\S]*?include: \['packages\/ui\/tests\/\*\*\/\*\.spec\.ts'\]/, 'the layer root'],
  [/name: 'ui'[\s\S]*?environment: 'jsdom'/, 'the layer class runs under jsdom'],
  [/name: 'web'[\s\S]*?include: \['apps\/web\/tests\/unit\/\*\*\/\*\.spec\.ts'\]/, 'the web unit root'],
  [/name: 'web'[\s\S]*?environment: 'jsdom'/, 'the web unit class runs under jsdom'],
  [/name: 'integration'[\s\S]*?include: \['apps\/api\/test\/integration\/\*\*\/\*\.spec\.ts'\]/, 'the integration root'],
  [/name: 'integration'[\s\S]*?exclude: \[[\s\S]*?enumeration\.spec\.ts[\s\S]*?sign-up-abuse\.spec\.ts[\s\S]*?\]/, 'the timing suites are excluded from the shared integration run'],
  [/provider: 'v8'/, 'the V8 coverage provider'],
  [/coverage: \{[\s\S]*?exclude: \[[\s\S]*?enumeration\.spec\.ts[\s\S]*?sign-up-abuse\.spec\.ts[\s\S]*?\]/, 'the timing suites are excluded from coverage'],
];

for (const [pattern, description] of expectations) {
  if (!pattern.test(config)) problems.push(`vitest.config.ts: ${description} is not pinned`);
}

const utc = config.match(/TZ: 'UTC'/g)?.length ?? 0;
if (utc !== 5) {
  problems.push(`vitest.config.ts: expected TZ=UTC in five projects, found ${utc}`);
}

// The two Vue suites run on jsdom. happy-dom is not the class environment the
// plan fixes for the layer, and the web unit class shares the layer's DOM
// environment under the recorded deviation (Complexity Tracking row 2; T204).
if (/happy-dom/.test(config)) {
  problems.push('vitest.config.ts: a project still selects happy-dom');
}

// The lock's database-backed scenarios are integration, and the unit class
// measures only the pure count, clear, and expiry rules (T204).
const lockUnit = 'apps/api/src/modules/auth/service/__tests__/sign-in-lock-rules.spec.ts';
const lockIntegration = 'apps/api/test/integration/auth/sign-in-lock.spec.ts';
if (!existsSync(lockUnit)) {
  problems.push(`${lockUnit}: the pure lock-rule unit suite is missing`);
} else {
  const unit = readFileSync(lockUnit, 'utf8');
  if (/DATABASE_URL|createDatabase|createHarness/.test(unit)) {
    problems.push(`${lockUnit}: the unit suite reaches a database`);
  }
}
if (!existsSync(lockIntegration)) {
  problems.push(`${lockIntegration}: the database-backed lock suite is missing`);
}
if (existsSync('apps/api/src/modules/auth/service/__tests__/sign-in-lock.spec.ts')) {
  problems.push('sign-in-lock.spec.ts: the database-backed lock suite still runs in the unit class');
}

if (!/DATABASE_URL/.test(setup)) {
  problems.push('apps/api/test/setup.ts: the database variable is not read');
}

// The integration class pins the fake transport, and its acceptance duration is
// zero unless a suite's own protocol sets another value.
const integration = config.slice(config.indexOf("name: 'integration'"));
if (!/SMS_TRANSPORT: 'fake'/.test(integration)) {
  problems.push('vitest.config.ts: the integration class does not pin the fake transport');
}
if (!/SMS_FAKE_ACCEPT_MS: '0'/.test(integration)) {
  problems.push('vitest.config.ts: the integration class does not default the acceptance duration to 0');
}
if (!/SMS_FAKE_ACCEPT_MS=0/.test(envExample)) {
  problems.push('.env.example: the acceptance duration does not default to 0');
}

// The network rule: a `@network` suite is skipped unless the flag is set, and
// it is time-bounded at 120 s. CI never sets the flag and never selects Twilio.
if (!/NETWORK_TESTS/.test(setup)) {
  problems.push('apps/api/test/setup.ts: the @network gate is not declared');
}
if (!/120_000|120000/.test(setup)) {
  problems.push('apps/api/test/setup.ts: the @network time bound is not declared');
}
if (/NETWORK_TESTS/.test(ci)) {
  problems.push('ci.yml: CI sets NETWORK_TESTS, so a @network suite would run');
}
if (/twilio/i.test(ci)) {
  problems.push('ci.yml: CI mentions Twilio, so the transport can reach the network');
}
if ((ci.match(/pnpm install --frozen-lockfile/g)?.length ?? 0) === 0) {
  problems.push('ci.yml: the dependency install is not the pinned one');
}

// The enumeration run's reproducibility (CHK032): serial, coverage off, the fake
// transport accepting immediately, and the same fixed roots.
const enumerationExpectations = [
  [/root: process\.cwd\(\)/, 'the root is the repository root'],
  [/fileParallelism: false/, 'the files are serialized'],
  [/sequence: \{ concurrent: false \}/, 'the files do not run concurrently'],
  [/coverage: \{ enabled: false \}/, 'coverage instrumentation is off'],
  [/TZ: 'UTC'/, 'the run is in UTC'],
  [/SMS_TRANSPORT: 'fake'/, 'the fake transport is pinned'],
  [/SMS_FAKE_ACCEPT_MS: '0'/, 'the acceptance duration is 0'],
  [/enumeration\.spec\.ts[\s\S]*sign-up-abuse\.spec\.ts/, 'the timing suites are listed'],
];
for (const [pattern, description] of enumerationExpectations) {
  if (!pattern.test(enumeration)) {
    problems.push(`vitest.enumeration.config.ts: ${description} is not pinned`);
  }
}

// The enumeration job: one re-run on the same runner and build, both reports
// kept, and a second failure treated as a failure.
const enumerationJob = ci.slice(
  ci.indexOf('enumeration:'),
  ci.indexOf('e2e:'),
);
if (ci.indexOf('enumeration:') === -1) {
  problems.push('ci.yml: the enumeration job is missing');
} else {
  if ((enumerationJob.match(/pnpm test:enumeration/g)?.length ?? 0) !== 2) {
    problems.push('ci.yml: the enumeration job does not carry exactly one first run and one re-run');
  }
  if (!/id: first[\s\S]*id: second/.test(enumerationJob)) {
    problems.push('ci.yml: the enumeration re-run is not identified');
  }
  if (!/if: steps\.first\.outcome == 'failure'/.test(enumerationJob)) {
    problems.push('ci.yml: the enumeration re-run does not follow a first failure');
  }
  if (!/upload-artifact/.test(enumerationJob)) {
    problems.push('ci.yml: the enumeration reports are not kept');
  }
  if (!/steps\.first\.outcome == 'failure' && steps\.second\.outcome == 'failure'/.test(enumerationJob)) {
    problems.push('ci.yml: a second enumeration failure is not a failure');
  }
  if (!/runs-on: ubuntu-24\.04/.test(enumerationJob)) {
    problems.push('ci.yml: the enumeration job is not on the fixed runner class');
  }
}

// The browser and load classes run in UTC: the browser context, both Playwright
// servers, and the e2e (which also runs the accessibility and visual projects),
// Lighthouse, and load jobs all pin it (T242).
if (!/timezoneId: 'UTC'/.test(playwright)) {
  problems.push('playwright.config.ts: the browser context is not in UTC');
}
const serverTz = playwright.match(/TZ: 'UTC'/g)?.length ?? 0;
if (serverTz !== 2) {
  problems.push(`playwright.config.ts: expected TZ=UTC in both web servers, found ${serverTz}`);
}
const ciTz = ci.match(/TZ: UTC/g)?.length ?? 0;
if (ciTz < 3) {
  problems.push(`ci.yml: expected TZ=UTC in the e2e, Lighthouse, and load jobs, found ${ciTz}`);
}

// The governance check runs in one process, once.
const governance = ci.match(/node governance-drift-check\.mjs/g)?.length ?? 0;
if (governance !== 1) {
  problems.push(`ci.yml: expected one governance-check process, found ${governance}`);
}

if (problems.length > 0) {
  console.error('Test environments are not pinned:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  'Test environments ok: five projects and the enumeration run, one class each, TZ=UTC, jsdom for the two Vue classes, the fake transport, the @network gate, and one governance process.',
);
