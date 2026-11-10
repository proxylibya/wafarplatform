// The INP user flow (T141): focus the mobile field, type a number, and submit,
// while an event-timing observer records every interaction's duration. The
// largest duration is the page's INP for the flow, and the Lighthouse budget's
// 200 ms bound is the assertion. The script starts the production server from
// the built artifact and the local API when they are not already up, so CI and
// a developer measure the same artifact.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://127.0.0.1:3000';
const apiOrigin = process.env['API_ORIGIN'] ?? 'http://127.0.0.1:3001';
const budgetMs = 200;
// The report sits beside the flow, so a root invocation and the filtered one
// write the artifact the Lighthouse job uploads.
const reportPath = fileURLToPath(new URL('../../reports/inp-user-flow.json', import.meta.url));
const webRoot = fileURLToPath(new URL('../../', import.meta.url));
const servedArtifact = 'apps/web/.output/server/index.mjs';
const databaseUrl =
  process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar';

const children = [];

async function reachable(url, timeoutMs = 1_500) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`the server at ${url} did not open within ${timeoutMs} ms`);
}

function start(command, args, env) {
  const child = spawn(command, args, {
    stdio: 'ignore',
    cwd: webRoot,
    env: { ...process.env, ...env },
  });
  children.push(child);
  return child;
}

async function ensureServers() {
  if (!(await reachable(`${apiOrigin}/health`))) {
    start('node', ['tests/support/api-server.mjs'], {
      DATABASE_URL: databaseUrl,
      NODE_ENV: 'test',
      SMS_TRANSPORT: 'fake',
      SMS_FAKE_ACCEPT_MS: '0',
      TZ: 'UTC',
      WEB_ORIGIN: webOrigin,
      BETTER_AUTH_SECRET: 'playwright-secret-value-000000',
      LOG_LEVEL: 'info',
    });
    await waitFor(`${apiOrigin}/health`, 120_000);
  }
  if (!(await reachable(`${webOrigin}/auth/sign-up`))) {
    start('node', ['.output/server/index.mjs'], {
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: '3000',
      TZ: 'UTC',
      API_BASE: apiOrigin,
      NUXT_PUBLIC_API_BASE: apiOrigin,
    });
    await waitFor(`${webOrigin}/auth/sign-up`, 180_000);
  }
}

function stopServers() {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // The child already ended.
    }
  }
}

await ensureServers();

const browser = await chromium.launch({ headless: true });
let failure = null;
let result = null;
try {
  const context = await browser.newContext({
    locale: 'ar-LY',
    timezoneId: 'UTC',
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto(`${webOrigin}/auth/sign-up`, { waitUntil: 'networkidle' });

  // The event-timing observer: every interaction's duration is a candidate INP,
  // and the largest candidate is the flow's INP.
  await page.evaluate(() => {
    const entries = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        entries.push({ name: entry.name, duration: entry.duration });
      }
    });
    observer.observe({ type: 'event', durationThreshold: 0, buffered: true });
    window.__inpEntries = entries;
  });

  const phone = page.locator('input[type="tel"]').first();
  await phone.click();
  await phone.pressSequentially('0912345678', { delay: 30 });

  const password = page.locator('input[type="password"]').first();
  if (await password.count()) {
    await password.click();
    await password.pressSequentially('correct horse battery staple', { delay: 5 });
  }

  const submit = page.locator('button[type="submit"]').first();
  await submit.click();
  await page.waitForTimeout(1_500);

  const entries = await page.evaluate(() => window.__inpEntries ?? []);
  const durations = entries
    .map((entry) => Number(entry.duration))
    .filter((duration) => Number.isFinite(duration));
  const inp = durations.length === 0 ? 0 : Math.max(...durations);
  result = {
    flow: 'sign-up: focus the mobile field, type a number, submit',
    budgetMs,
    inpMs: Math.round(inp * 10) / 10,
    interactions: entries.length,
    environment: {
      mode: 'production',
      servedArtifact,
      webOrigin,
      apiOrigin,
      timezone: 'UTC',
    },
    entries,
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
  if (inp > budgetMs) {
    failure = `INP ${result.inpMs} ms exceeds the ${budgetMs} ms budget`;
  }
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
} finally {
  await browser.close();
  stopServers();
}

if (result !== null) {
  console.log(
    `INP user flow: ${result.inpMs} ms (budget ${budgetMs} ms, ${result.interactions} interactions).`,
  );
  console.log(`INP report: ${existsSync(reportPath) ? reportPath : 'not written'}`);
}
if (failure !== null) {
  console.error(`INP user flow failed: ${failure}`);
  process.exit(1);
}
