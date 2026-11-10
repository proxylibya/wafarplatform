// The composition test: the engine every service calls is better-auth's own, so
// an implementation that stops calling `createBetterAuth` fails here rather than
// passing as a hand-written credential engine (ADR-151, FR-035).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@wafar/db';
import { createAuthEngine } from '../engine.ts';

/** The workspace package's manifest, for the exact version it pins. */
function readManifestBetterAuthPin(): string {
  const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  const manifest = JSON.parse(
    readFileSync(join(apiRoot, 'package.json'), 'utf8'),
  ) as { dependencies: Record<string, string> };
  const pin = manifest.dependencies['better-auth'];
  if (pin === undefined) throw new Error('the manifest does not pin better-auth');
  return pin;
}

/** The version the installed package itself reports. */
function readInstalledBetterAuthVersion(): string {
  const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  const manifest = JSON.parse(
    readFileSync(join(apiRoot, 'node_modules', 'better-auth', 'package.json'), 'utf8'),
  ) as { version?: string };
  if (manifest.version === undefined) {
    throw new Error('the installed better-auth package reports no version');
  }
  return manifest.version;
}

// No query runs in this suite: the pool is opened only so the library's adapter
// has the client it maps its models onto.
const { db, pool } = createDatabase(
  process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar',
);

function engine() {
  return createAuthEngine({
    db,
    secret: 'composition-secret-value-000000000000',
    baseUrl: 'http://localhost:3001',
  });
}

describe('the auth engine', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('is the designated library, so an engine that skips createBetterAuth fails', async () => {
    const created = engine();
    expect(created.provider).toBe('better-auth');
    // The version is read from the installed package, never a constant, and it
    // agrees with the manifest's exact pin (Complexity Tracking row 39).
    expect(readInstalledBetterAuthVersion()).toMatch(/^\d+\.\d+\.\d+/);
    expect(created.version).toBe(readInstalledBetterAuthVersion());
    expect(created.version).toBe(readManifestBetterAuthPin());

    // better-auth's own surface: none of it exists without `createBetterAuth`.
    expect(typeof created.raw.handler).toBe('function');
    expect(typeof created.raw.api).toBe('object');
    expect(created.raw.$ERROR_CODES).toBeDefined();

    const context = await created.raw.$context;
    expect(typeof context.password.hash).toBe('function');
    expect(typeof context.password.verify).toBe('function');
    expect(typeof context.internalAdapter.createSession).toBe('function');
    expect(typeof context.internalAdapter.findSession).toBe('function');
    expect(typeof context.internalAdapter.updateSession).toBe('function');
    expect(typeof context.internalAdapter.findAccounts).toBe('function');
  });

  it('hashes with the CMV row 2 profile and verifies against the same hook', async () => {
    const created = engine();
    const hash = await created.hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$wafar\$scrypt\$32768\$8\$3\$/);
    expect(
      await created.verifyPassword('correct horse battery staple', hash),
    ).toBe(true);
    expect(await created.verifyPassword('a different value entirely', hash)).toBe(
      false,
    );
  });
});
