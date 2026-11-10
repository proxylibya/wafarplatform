// The enumeration run's reproducibility configuration (T163): one job, the
// timing suites serial, one database, the fake transport accepting immediately,
// and coverage instrumentation off, so a passing run is a verdict and not an
// artifact of a loaded host (plan.md -> The enumeration test's reproducibility,
// CHK032). It is a standalone configuration rather than a project of the shared
// one, because the protocol fixes the whole run and not only a filter.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The runner is invoked from the repository root; pinning the root keeps the
    // include globs and the setup file independent of this file's own directory.
    root: process.cwd(),
    name: 'enumeration',
    env: { TZ: 'UTC', SMS_TRANSPORT: 'fake', SMS_FAKE_ACCEPT_MS: '0' },
    environment: 'node',
    include: [
      'apps/api/test/integration/auth/enumeration.spec.ts',
      'apps/api/test/integration/auth/sign-up-abuse.spec.ts',
    ],
    setupFiles: ['apps/api/test/setup.ts'],
    // One database and one order: no suite runs beside another, and no file runs
    // concurrently with another.
    fileParallelism: false,
    sequence: { concurrent: false },
    // A timing run with instrumentation on is invalid; the coverage report comes
    // from the non-timing run.
    coverage: { enabled: false },
    testTimeout: 300_000,
    hookTimeout: 30_000,
  },
});
