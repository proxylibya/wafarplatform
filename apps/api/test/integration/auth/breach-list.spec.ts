// The vendored breached-password list is verified at boot: a truncated or
// altered file stops startup with a non-zero exit and a clear message, so a
// membership test never silently passes against a damaged list
// (FR-035, AC-037; plan → CHK012; data-model.md → loaded once at boot; T183).
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { hasDatabase } from '../../support/harness.ts';

const apiRoot = fileURLToPath(new URL('../../../', import.meta.url));
const listPath = join(
  apiRoot,
  'src',
  'modules',
  'auth',
  'data',
  'breached-passwords.sha256',
);

/** Runs the API's entry point and returns its exit code and stderr. */
function boot(): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'],
    {
      cwd: apiRoot,
      env: { ...process.env, NODE_ENV: 'test' },
      encoding: 'utf8',
      timeout: 60_000,
    },
  );
  return {
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}

describe.skipIf(!hasDatabase)('the breached-password list at boot', () => {
  afterAll(() => {
    // A failed run restores the file in its own finally, so this is a guard.
    const backup = `${listPath}.test-backup`;
    try {
      copyFileSync(backup, listPath);
      unlinkSync(backup);
    } catch {
      // No backup: the file was restored already.
    }
  });

  it('refuses to start when the vendored list is truncated', () => {
    const backup = `${listPath}.test-backup`;
    copyFileSync(listPath, backup);
    try {
      const original = readFileSync(listPath, 'utf8');
      const truncated = `${original.split('\n').slice(0, 1_000).join('\n')}\n`;
      writeFileSync(listPath, truncated, 'utf8');

      const result = boot();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Refusing to start:');
      expect(result.stderr).toContain('breached-password list');
    } finally {
      copyFileSync(backup, listPath);
      unlinkSync(backup);
    }
  });

  it('refuses to start when the vendored list is altered', () => {
    const backup = `${listPath}.test-backup`;
    copyFileSync(listPath, backup);
    try {
      const original = readFileSync(listPath, 'utf8');
      // The same line count, one digest changed: the count check passes and the
      // SOURCE record's SHA-256 is the rule that refuses it.
      const lines = original.split('\n');
      const first = lines[0] ?? '';
      lines[0] = `${first.slice(0, 63)}${first.endsWith('0') ? '1' : '0'}`;
      writeFileSync(listPath, lines.join('\n'), 'utf8');

      const result = boot();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Refusing to start:');
      expect(result.stderr).toContain('SHA-256');
    } finally {
      copyFileSync(backup, listPath);
      unlinkSync(backup);
    }
  });
});
