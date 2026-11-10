// The integration suite's setup: it refuses to run against a database it did
// not receive, so a missing DATABASE_URL skips rather than silently passing.
export const hasDatabase = process.env['DATABASE_URL'] !== undefined;

// The network rule (plan.md -> The test environment): `pnpm install
// --frozen-lockfile` is the only step that uses the network, so a suite that
// needs it is marked `@network`, is skipped unless NETWORK_TESTS=1, and is
// time-bounded at 120 s. CI never sets the flag.
export const networkTestsEnabled = process.env['NETWORK_TESTS'] === '1';
export const networkTestTimeoutMs = 120_000;

if (!hasDatabase) {
  console.warn(
    '[integration] DATABASE_URL is not set; database-backed suites are skipped.',
  );
}
