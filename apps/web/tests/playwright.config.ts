// The Playwright configuration: the production artifacts, the pinned Chromium,
// the self-hosted fonts, and the e2e, accessibility, and visual projects
// (FR-040, AC-043; T023, T200). Every URL is an explicit 127.0.0.1 so a host
// that resolves `localhost` to IPv6 and a server bound to IPv4 still meet.
// Run `pnpm build` once before the classes: they serve `apps/web/.output` and
// `apps/api/dist` and never a development server (the plan's class table).
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const ci = process.env['CI'] !== undefined;
const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar';
const webRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: ci
    ? [['list'], ['junit', { outputFile: 'reports/playwright.xml' }]]
    : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    locale: 'ar-LY',
    timezoneId: 'UTC',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y',
      testMatch: /a11y\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      expect: {
        toHaveScreenshot: {
          // The contract fixes the file name:
          // <page>--<state>--<width>--<appearance>.png under the e2e directory
          // (contracts/ui-contracts.md §10, T116).
          pathTemplate: '{testDir}/e2e/__screenshots__/{arg}{ext}',
        },
      },
    },
  ],
  webServer: [
    {
      name: 'api',
      command: 'node tests/support/api-server.mjs',
      cwd: webRoot,
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL,
        NODE_ENV: 'production',
        TZ: 'UTC',
        SMS_TRANSPORT: 'fake',
        SMS_FAKE_ACCEPT_MS: '0',
        WEB_ORIGIN: 'http://127.0.0.1:3000',
        BETTER_AUTH_SECRET: 'playwright-secret-value-000000',
        LOG_LEVEL: 'info',
        TRUSTED_PROXIES: '',
      },
    },
    {
      name: 'web',
      command: 'node .output/server/index.mjs',
      cwd: webRoot,
      url: 'http://127.0.0.1:3000/auth/sign-up',
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NODE_ENV: 'production',
        TZ: 'UTC',
        API_BASE: 'http://127.0.0.1:3001',
        NUXT_PUBLIC_API_BASE: 'http://127.0.0.1:3001',
        PORT: '3000',
        HOST: '127.0.0.1',
      },
    },
  ],
});
