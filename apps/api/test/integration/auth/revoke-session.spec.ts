// The platform's explicit end of one session through the operator's CLI: the
// `platform_revocation` reason, the session's next request refused, and the
// stable exit codes for a live and an already-ended session (FR-012, AC-013;
// T068).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions } from '@wafar/db';

import {
  createHarness,
  hasDatabase,
  type Harness,
} from '../../support/harness.ts';

const run = promisify(execFile);
const harness: Harness | null = hasDatabase ? createHarness() : null;
const DATABASE_URL = process.env['DATABASE_URL'] ?? '';

async function revoke(token: string): Promise<{ code: number; stdout: string }> {
  try {
    const result = await run(
      process.execPath,
      [
        'apps/api/node_modules/tsx/dist/cli.mjs',
        'apps/api/src/cli/revoke-session.ts',
        '--token',
        token,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL,
          NODE_ENV: 'test',
          LOG_LEVEL: 'error',
        },
      },
    );
    return { code: 0, stdout: result.stdout };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? '' };
  }
}

describe.skipIf(!hasDatabase)('the platform revocation CLI', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('ends the named session with the platform reason and exits zero', async () => {
    const { createUsersRepository } = await import(
      '../../../src/modules/users/repository/users.ts'
    );
    const account = await createUsersRepository(harness!.db).create({
      fullName: 'محمد علي',
      phoneNumber: '+218912345678',
      city: 'طرابلس',
      shopName: null,
    });
    const issued = await harness!.auth.issue({
      userId: account.id,
      now: harness!.clock.now(),
    });

    const first = await revoke(issued.token);
    expect(first.code).toBe(0);
    expect(first.stdout).toContain('Session revoked');

    // The record names the account and carries no phone, name, or token.
    const records = first.stdout
      .split('\n')
      .filter((line) => line.trim().startsWith('{'))
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const record = records.find((entry) => entry['event'] === 'auth.session.revoked');
    expect(record).toMatchObject({
      event: 'auth.session.revoked',
      reason: 'platform_revocation',
      sessionCount: 1,
      accountId: account.id,
    });
    expect(JSON.stringify(record)).not.toContain(issued.token);
    expect(JSON.stringify(record)).not.toContain('0912345678');
    expect(JSON.stringify(record)).not.toContain('محمد علي');

    const rows = await harness!.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, issued.sessionId));
    expect(rows[0]?.revokedReason).toBe('platform_revocation');

    // The ended session grants nothing through the shared entry point.
    const read = await harness!.app.request('/api/v1/auth/session', {
      headers: { cookie: `wafar.session=${issued.token}` },
    });
    expect(read.status).toBe(401);

    // A session already ended is reported, not re-revoked.
    const second = await revoke(issued.token);
    expect(second.code).toBe(1);
  }, 60_000);
});
