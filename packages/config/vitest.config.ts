// The Vitest project split the workspace extends: unit, layer, web, and integration.
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// The unit/integration split the plan fixes: unit suites live beside the
// modules they test (`src/**/__tests__`), the web unit specs under
// `apps/web/tests/unit`; integration suites live in `apps/*/test`; the layer's
// suites live in `packages/ui/tests`.
export default defineConfig({
  test: {
    // One database per run with the files serialized: every integration suite
    // truncates the shared tables in its own setup, so parallel files would end
    // one another's fixtures mid-run. Vitest reads this option at the root only,
    // so it is set here rather than per project.
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'shared',
          env: { TZ: 'UTC' },
          environment: 'node',
          include: ['packages/shared/src/**/__tests__/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'api',
          env: { TZ: 'UTC' },
          environment: 'node',
          include: ['apps/api/src/**/__tests__/**/*.spec.ts'],
          setupFiles: ['apps/api/test/setup.ts'],
        },
      },
      {
        plugins: [vue()],
        test: {
          name: 'ui',
          env: { TZ: 'UTC' },
          environment: 'jsdom',
          include: ['packages/ui/tests/**/*.spec.ts'],
        },
      },
      {
        plugins: [vue()],
        test: {
          name: 'web',
          env: { TZ: 'UTC' },
          // The plan fixes a DOM environment for this class's component tests;
          // the Nuxt test environment cannot load under the pinned toolchain,
          // so the class runs under jsdom (Complexity Tracking row 36; T204).
          environment: 'jsdom',
          include: ['apps/web/tests/unit/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          env: { TZ: 'UTC', SMS_TRANSPORT: 'fake', SMS_FAKE_ACCEPT_MS: '0' },
          environment: 'node',
          include: ['apps/api/test/integration/**/*.spec.ts'],
          // The timing protocols run only in the enumeration class, with
          // coverage off and one host (CHK032; T199). The non-timing abuse
          // cases live in sign-up-abuse-cases.spec.ts and stay here.
          exclude: [
            'apps/api/test/integration/auth/enumeration.spec.ts',
            'apps/api/test/integration/auth/sign-up-abuse.spec.ts',
          ],
          setupFiles: ['apps/api/test/setup.ts'],
          testTimeout: 30_000,
          hookTimeout: 30_000,
          sequence: { concurrent: false },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // The report measures production source, not tooling, tests, or
      // generated artifacts: the `all` scan would otherwise price the scripts
      // and the build output at zero and state nothing about the product.
      include: [
        'apps/api/src/**/*.ts',
        'apps/web/app/**/*.ts',
        'apps/web/app/**/*.vue',
        'apps/web/server/**/*.ts',
        'packages/db/client.ts',
        'packages/db/index.ts',
        'packages/db/schema-version.ts',
        'packages/db/schema/**/*.ts',
        'packages/db/sweeps.ts',
        'packages/db/unit-of-work.ts',
        'packages/shared/src/**/*.ts',
        'packages/ui/app/**/*.ts',
        'packages/ui/app/**/*.vue',
      ],
      // The frame's page-level runtime is the only excluded set; the exact
      // scope is EX-007's, behaviour for behaviour (Complexity Tracking row 2).
      // The timing suites are excluded because a covered run is not a valid
      // timing run (CHK032; T199).
      exclude: [
        'packages/ui/app/components/shell/**',
        'apps/web/app/layouts/shell.vue',
        'apps/api/test/integration/auth/enumeration.spec.ts',
        'apps/api/test/integration/auth/sign-up-abuse.spec.ts',
        // Generated build artifacts are not source. The `all` scan must not
        // read their sourcemaps: `.output` carries a virtual module whose
        // encoded path Windows cannot resolve back to a file.
        '**/.output/**',
        '**/.nuxt/**',
        '**/dist/**',
      ],
    },
  },
});
