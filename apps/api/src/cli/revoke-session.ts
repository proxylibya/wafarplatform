// The `revoke-session` CLI: the platform's explicit end of one session, with the
// `platform_revocation` reason and stable exit codes. The revocation itself is
// the `auth` engine's (FR-012, §7.3; ADR-151).
import { environment } from '../env.ts';
import { createDatabase } from '@wafar/db';
import { createAuthEngine } from '../modules/auth/engine.ts';
import { processLogger } from '../observability/logger.ts';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const sessionId = argument('session-id');
const token = argument('token');
if (sessionId === undefined && token === undefined) {
  console.error('usage: revoke-session --session-id <id> | --token <token>');
  process.exit(2);
}

const env = environment();
if (env.DATABASE_URL === undefined) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const { db, pool } = createDatabase(env.DATABASE_URL);
const auth = createAuthEngine({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseUrl: env.BETTER_AUTH_URL,
});
const now = new Date();

try {
  // The row is resolved before it is ended, so the record names the account
  // when a live session changed and stays silent about one that did not
  // (FR-037, AC-040).
  const row =
    token !== undefined
      ? await auth.resolve(token, now)
      : await auth.resolveById(sessionId ?? '');

  const revoked =
    row === null || row.revokedAt !== null
      ? false
      : token !== undefined
        ? await auth.revoke(token, 'platform_revocation', now)
        : await auth.revokeById(sessionId ?? '', 'platform_revocation', now);

  if (!revoked) {
    console.error('No live session matched.');
    process.exitCode = 1;
  } else {
    processLogger.emit({
      event: 'auth.session.revoked',
      outcome: 'success',
      requestId: `cli-${process.pid}`,
      reason: 'platform_revocation',
      sessionCount: 1,
      ...(row === null ? {} : { accountId: row.userId }),
    });
    console.log('Session revoked.');
  }
} finally {
  await pool.end();
}
