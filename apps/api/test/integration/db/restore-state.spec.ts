// The restore point's state: a database dumped at T and restored after a
// session, a lock, a replacement of the pending request, a spent window, a
// removal, and a block were applied reads as at T rather than reconciled — the
// session live at T still grants access and the later one is gone, the lock and
// its count are as they were, the pending request is as it was with the code it
// then held while the later one is refused under FR-034, the window spent after
// T is unspent, the removed account reads again, the block is undone, and the
// channel's rolling acceptance estimate is empty again
// (FR-055, FR-017, FR-018; AC-061; T152).
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  rateLimitWindowSeconds,
  sessionAbsoluteSeconds,
} from '@wafar/shared';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';
import { readCount } from '../../../src/modules/auth/service/rate-limit.ts';
import {
  hashOneTimeCode,
  hashPassword,
  hashResumeToken,
} from '../../../src/modules/auth/service/password-policy.ts';
import {
  createScratchDatabase,
  dumpDatabase,
  expectedSteps,
  migrateScratch,
  restoreDatabase,
  type Scratch,
} from '../../support/scratch.ts';

const enabled = hasDatabase;
const password = 'correct horse battery staple';
const atT = new Date('2026-03-01T10:00:00.000Z');
const later = new Date(atT.getTime() + 3600_000);
const laterWindow = new Date(
  Math.floor(atT.getTime() / (rateLimitWindowSeconds * 1000)) *
    rateLimitWindowSeconds *
    1000,
);
const liveToken = 'restore-live-session-token'.padEnd(40, 'a');
const laterToken = 'restore-later-session-token'.padEnd(40, 'b');
const resumeToken = 'restore-resume-token';
const code = '654321';
const laterCode = '111111';

async function one(
  scratch: Scratch,
  statement: string,
): Promise<Record<string, unknown> | undefined> {
  const rows = await scratch.db.execute(sql.raw(statement));
  return rows.rows[0] as Record<string, unknown> | undefined;
}

describe.skipIf(!enabled)("the restore point's state", () => {
  let source: Scratch;
  let target: Scratch;
  let dumpFile = '';

  beforeAll(async () => {
    source = await createScratchDatabase('restore_src');
    target = await createScratchDatabase('restore_dst');
    dumpFile = join(
      tmpdir(),
      `wafar-restore-${randomBytes(4).toString('hex')}.sql`,
    );
    await migrateScratch(source);

    // The state at the restore point T.
    const credential = await hashPassword(password);
    const pendingHash = await hashOneTimeCode(code, 'restore-request');
    const resumeHash = hashResumeToken(resumeToken);
    const expiresAt = new Date(atT.getTime() + sessionAbsoluteSeconds * 1000);

    for (const [id, phone, status] of [
      ['restore-account', '+218912345678', 'active'],
      ['restore-other', '+218912345679', 'active'],
      ['restore-removed', '+218912345680', 'active'],
      ['restore-blocked', '+218912345681', 'active'],
    ] as const) {
      await source.db.execute(sql`
        INSERT INTO users
          (id, full_name, email, phone_number, city, status, failed_sign_in_count, locked_until)
        VALUES (${id}, 'محمد علي', ${`${phone.replace(/\D/g, '')}@phone.invalid`}, ${phone},
                'طرابلس', ${status}, ${id === 'restore-account' ? 5 : 0},
                ${id === 'restore-account' ? later.toISOString() : null})
      `);
      await source.db.execute(sql`
        INSERT INTO accounts (id, user_id, account_id, provider_id, password)
        VALUES (${`${id}-credential`}, ${id}, ${id}, 'credential', ${credential})
      `);
    }

    await source.db.execute(sql`
      INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
      VALUES ('restore-live-session', 'restore-account', ${liveToken},
              ${expiresAt.toISOString()}, ${atT.toISOString()})
    `);
    await source.db.execute(sql`
      INSERT INTO phone_verifications
        (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at,
         incorrect_entries, re_requests, resume_token_hash, full_name, city, password_hash)
      VALUES ('restore-request', '+218912345678', 'sign_up', 'pending', ${pendingHash},
              ${later.toISOString()}, ${later.toISOString()}, 0, 1, ${resumeHash},
              'محمد علي', 'طرابلس', ${credential})
    `);
    await source.db.execute(sql`
      INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
      VALUES ('recovery:origin:earlier', ${laterWindow.toISOString()}, 2,
              ${new Date(laterWindow.getTime() + rateLimitWindowSeconds * 1000).toISOString()})
    `);

    // The dump at T.
    await dumpDatabase(source.url, dumpFile);

    // Everything that happens after T.
    await source.db.execute(sql`
      INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
      VALUES ('restore-later-session', 'restore-other', ${laterToken},
              ${expiresAt.toISOString()}, ${atT.toISOString()})
    `);
    await source.db.execute(
      sql`UPDATE users SET failed_sign_in_count = 5, locked_until = ${later.toISOString()} WHERE id = 'restore-other'`,
    );
    await source.db.execute(
      sql`UPDATE users SET failed_sign_in_count = 0, locked_until = NULL WHERE id = 'restore-account'`,
    );
    // The pending request is replaced: the later submission's own identifier and
    // code, as the upsert leaves them.
    await source.db.execute(
      sql`DELETE FROM phone_verifications WHERE id = 'restore-request'`,
    );
    await source.db.execute(sql`
      INSERT INTO phone_verifications
        (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at,
         resume_token_hash, full_name, city)
      VALUES ('restore-request-2', '+218912345678', 'sign_up', 'pending',
              ${await hashOneTimeCode(laterCode, 'restore-request-2')},
              ${later.toISOString()}, ${later.toISOString()},
              ${hashResumeToken('restore-later-resume')}, 'محمد علي', 'طرابلس')
    `);
    await source.db.execute(sql`
      INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
      VALUES ('sign_in:origin:later', ${laterWindow.toISOString()}, 3,
              ${new Date(laterWindow.getTime() + rateLimitWindowSeconds * 1000).toISOString()})
    `);
    // The removal, in the order the foreign keys impose: the credential, the
    // sessions, then the row.
    await source.db.execute(
      sql`DELETE FROM accounts WHERE user_id = 'restore-removed'`,
    );
    await source.db.execute(
      sql`DELETE FROM sessions WHERE user_id = 'restore-removed'`,
    );
    await source.db.execute(sql`DELETE FROM users WHERE id = 'restore-removed'`);
    await source.db.execute(
      sql`UPDATE users SET status = 'blocked' WHERE id = 'restore-blocked'`,
    );

    await restoreDatabase(target.url, dumpFile);
  });

  afterAll(async () => {
    if (dumpFile !== '') await rm(dumpFile, { force: true });
    await source.drop();
    await target.drop();
  });

  it('reads as at T rather than reconciled', async () => {
    const restored = createHarness({ connectionString: target.url });
    try {
      // 1. The session live at T grants access; the one created after T is gone.
      const live = await call(restored, 'GET', '/api/v1/auth/session', undefined, {
        headers: { cookie: `wafar.session=${liveToken}` },
      });
      expect(live.status).toBe(200);
      expect((live.body as { authenticated: boolean }).authenticated).toBe(true);
      const laterSession = await call(
        restored,
        'GET',
        '/api/v1/auth/session',
        undefined,
        { headers: { cookie: `wafar.session=${laterToken}` } },
      );
      expect(laterSession.status).toBe(200);
      expect((laterSession.body as { authenticated: boolean }).authenticated).toBe(
        false,
      );

      // 2. The lock and its count are as they were at T: the one applied after is
      // gone and the one lifted after is in force again.
      const lockedRow = await restored.db.execute(
        sql`SELECT failed_sign_in_count, locked_until FROM users WHERE id = 'restore-account'`,
      );
      const locked = lockedRow.rows[0] as {
        failed_sign_in_count: number;
        locked_until: string | Date | null;
      };
      expect(locked.failed_sign_in_count).toBe(5);
      expect(new Date(locked.locked_until ?? 0).toISOString()).toBe(
        later.toISOString(),
      );
      const otherRow = await restored.db.execute(
        sql`SELECT failed_sign_in_count, locked_until FROM users WHERE id = 'restore-other'`,
      );
      expect(otherRow.rows[0]).toMatchObject({
        failed_sign_in_count: 0,
        locked_until: null,
      });

      const lockedJar: CookieJar = {};
      await bootstrap(restored, lockedJar);
      const refused = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: '0912345678', password },
        { jar: lockedJar, csrf: true },
      );
      expect(refused.status).toBe(401);

      const unlockedJar: CookieJar = {};
      await bootstrap(restored, unlockedJar);
      const admitted = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: '0912345679', password },
        { jar: unlockedJar, csrf: true },
      );
      expect(admitted.status).toBe(200);

      // 3. The pending request is as it was at T: the later one is refused and
      // the one it replaced is live again with the code it then held.
      const laterCookie: CookieJar = {
        'wafar.pending': 'restore-request-2.restore-later-resume',
        'wafar.csrf': '',
      };
      await bootstrap(restored, laterCookie);
      const stale = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-up/verify',
        { requestId: 'restore-request-2', code: laterCode },
        { jar: laterCookie, csrf: true },
      );
      expect(stale.status).toBe(400);
      expect((stale.body as { error: { code: string } }).error.code).toBe(
        'OTP_EXPIRED',
      );

      const liveJar: CookieJar = { 'wafar.pending': `restore-request.${resumeToken}` };
      await bootstrap(restored, liveJar);
      const resumed = await call(
        restored,
        'GET',
        '/api/v1/auth/verifications/restore-request',
        undefined,
        { jar: liveJar },
      );
      expect(resumed.status).toBe(200);
      expect((resumed.body as { remainingReRequests: number }).remainingReRequests).toBe(2);
      const accepted = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-up/verify',
        { requestId: 'restore-request', code },
        { jar: liveJar, csrf: true },
      );
      expect(accepted.status).toBe(200);
      expect(accepted.body).toEqual({ outcome: 'existing_account' });

      // 4. The window spent after T is unspent; the one spent at T still reads.
      expect(
        await readCount(restored.db, 'sign_in', 'origin', 'later', atT),
      ).toBe(0);
      expect(
        await readCount(restored.db, 'recovery', 'origin', 'earlier', atT),
      ).toBe(2);

      // 5. The removed account is registered again, with its credential and its
      // session, until the removal is repeated.
      const removed = await restored.db.execute(
        sql`SELECT count(*)::int AS n FROM users WHERE id = 'restore-removed'`,
      );
      expect(removed.rows[0]).toMatchObject({ n: 1 });
      const removedCredential = await restored.db.execute(
        sql`SELECT count(*)::int AS n FROM accounts WHERE user_id = 'restore-removed'`,
      );
      expect(removedCredential.rows[0]).toMatchObject({ n: 1 });
      const removedJar: CookieJar = {};
      await bootstrap(restored, removedJar);
      const readsAgain = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: '0912345680', password },
        { jar: removedJar, csrf: true },
      );
      expect(readsAgain.status).toBe(200);

      // 6. The block applied after T is undone until it is re-applied.
      const blocked = await restored.db.execute(
        sql`SELECT status FROM users WHERE id = 'restore-blocked'`,
      );
      expect(blocked.rows[0]).toMatchObject({ status: 'active' });
      const blockedJar: CookieJar = {};
      await bootstrap(restored, blockedJar);
      const active = await call(
        restored,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: '0912345681', password },
        { jar: blockedJar, csrf: true },
      );
      expect(active.status).toBe(200);

      // 7. The channel's rolling acceptance estimate is empty again.
      expect(restored.sms.acceptanceEstimateMs()).toBe(0);
    } finally {
      await restored.close();
    }
  });

  it('carries the journal row the boot guard reads', async () => {
    expect(
      await one(target, 'SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations'),
    ).toMatchObject({ n: expectedSteps });
  });
});
