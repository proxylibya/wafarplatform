// The deterministic load fixture (T117): 10,000 merchant accounts with one
// load-only credential, 300 live sessions for the sign-in ceiling, and the three
// disjoint 200-number blocks the SC-009 profile names. Nothing is random: the
// numbers, identifiers, and tokens are derived from their index, so a rerun
// produces the same rows and the load run measures the same population
// (FR-016, FR-031; SC-009, plan.md -> The SC-009 load profile).
//
// Every block is a listed Libyan mobile range: the seeded accounts sit on 92,
// the measured sign-ups on 93, the warm-up on 94, and the limiter probe on 95.
import { scrypt as scryptCallback } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// `pg` belongs to the data-access package and the scrypt profile belongs to the
// shared limits; resolving both through the API's manifest keeps the script
// runnable from the repository root under pnpm, without a new dependency and
// without restating a value the register fixes once (CMV 2).
const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Client } = require('pg');
const { scryptKeyLength, scryptN, scryptP, scryptR, scryptSaltBytes } = await import(
  pathToFileURL(require.resolve('@wafar/shared/limits')).href
);

/** The one credential every seeded account verifies with (plan item 9). */
export const loadCredential = 'load-only credential value';
export const loadCity = 'طرابلس';

/**
 * The profile's number blocks. The two 92-blocks are members of the 10,000
 * seeded accounts; the 93, 94, and 95 blocks have no account before the run.
 */
export const loadProfile = {
  accounts: 10_000,
  liveSessions: 300,
  ceilingSessions: 500,
  /** The seeded accounts the 200 measured sign-ins present. */
  signIn: { prefix: '92', from: 0, count: 200 },
  /** Other seeded accounts the 200 measured recovery requests present. */
  recovery: { prefix: '92', from: 200, count: 200 },
  /** The 200 measured account-creation submissions. */
  signUp: { prefix: '93', from: 0, count: 200 },
  /** The 20 warm-up submissions, one per virtual user, outside the 600. */
  warmUp: { prefix: '94', from: 0, count: 20 },
  /** The limiter probe: 20 accepted submissions, then the 21st refused. */
  probe: { prefix: '95', from: 0, count: 21 },
};

/** The canonical number of the seeded account at `index`. */
export function seededNumber(index) {
  return `+21892${String(index).padStart(7, '0')}`;
}

/** The canonical number of a block member, as the profile states it. */
export function blockNumber(block, index) {
  return `+218${block.prefix}${String(block.from + index).padStart(7, '0')}`;
}

/** The typed national form a person enters for a canonical number. */
export function typedForm(e164) {
  return `0${e164.slice(4)}`;
}

/** Every number a run can leave a pending request under. */
export function fixtureNumbers() {
  const blocks = [
    loadProfile.signUp,
    loadProfile.recovery,
    loadProfile.warmUp,
    loadProfile.probe,
  ];
  const numbers = new Set();
  for (const block of blocks) {
    for (let index = 0; index < block.count; index += 1) {
      numbers.add(blockNumber(block, index));
    }
  }
  return [...numbers];
}

function sessionOf(index) {
  return {
    id: `load-session-${String(index).padStart(6, '0')}`,
    // The store requires at least 32 characters; this form is 50.
    token: `load-session-token-${String(index).padStart(6, '0')}-${'t'.repeat(24)}`,
    userId: `load-user-${String(index + 1000).padStart(6, '0')}`,
  };
}

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      scryptKeyLength,
      { N: scryptN, r: scryptR, p: scryptP, maxmem: 128 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/**
 * The one credential row shape the store accepts, computed once. The salt is
 * exactly `scryptSaltBytes` long and the key `scryptKeyLength`, so the store's
 * `parseHash` accepts it rather than refusing every verify.
 */
async function credentialHash() {
  const salt = Buffer.from('wafar-load-salt!', 'utf8');
  if (salt.length !== scryptSaltBytes) {
    throw new Error(`the load salt is ${salt.length} bytes, not ${scryptSaltBytes}`);
  }
  const key = await scrypt(loadCredential, salt);
  return `$wafar$scrypt$${scryptN}$${scryptR}$${scryptP}$${salt.toString('hex')}$${key.toString('hex')}`;
}

function batches(items, size) {
  const out = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/**
 * Rewrites the load fixture and returns the live-session count before the run.
 * The rows are the fixture's own (`load-user-*`, `load-account-*`,
 * `load-session-*`), the pending rows its own numbers carry, and the
 * rate-limit keys those numbers and the loopback origins own; no development
 * account is touched.
 */
export async function seedLoadFixture(databaseUrl = process.env['DATABASE_URL']) {
  if (databaseUrl === undefined) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query('SET statement_timeout = 0');
  try {
    const password = await credentialHash();
    await client.query('BEGIN');

    await client.query("DELETE FROM sessions WHERE id LIKE 'load-session-%'");
    await client.query(
      'DELETE FROM phone_verifications WHERE phone_number = ANY($1::text[])',
      [fixtureNumbers()],
    );
    // The limiter's fixed windows are ephemeral; the fixture owns them so the
    // run's readback is exactly the rows the run created.
    await client.query('DELETE FROM rate_limit_counters');
    await client.query("DELETE FROM accounts WHERE id LIKE 'load-account-%'");
    await client.query("DELETE FROM users WHERE id LIKE 'load-user-%'");

    const users = [];
    const accounts = [];
    for (let index = 0; index < loadProfile.accounts; index += 1) {
      const suffix = String(index).padStart(6, '0');
      const phone = seededNumber(index);
      users.push({
        id: `load-user-${suffix}`,
        fullName: 'محمد علي',
        email: `${phone.slice(1)}@phone.invalid`,
        phone,
        city: loadCity,
      });
      accounts.push({ id: `load-account-${suffix}`, userId: `load-user-${suffix}` });
    }

    for (const batch of batches(users, 500)) {
      const values = [];
      const params = [];
      batch.forEach((row, offset) => {
        const base = offset * 5;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, true)`);
        params.push(row.id, row.fullName, row.email, row.phone, row.city);
      });
      await client.query(
        `INSERT INTO users (id, full_name, email, phone_number, city, phone_number_verified)
         VALUES ${values.join(', ')}`,
        params,
      );
    }

    for (const batch of batches(accounts, 500)) {
      const values = [];
      const params = [];
      batch.forEach((row, offset) => {
        const base = offset * 3;
        values.push(`($${base + 1}, $${base + 2}, $${base + 2}, 'credential', $${base + 3})`);
        params.push(row.id, row.userId, password);
      });
      await client.query(
        `INSERT INTO accounts (id, user_id, account_id, provider_id, password)
         VALUES ${values.join(', ')}`,
        params,
      );
    }

    // The 300 live sessions the 200 measured sign-ins raise to the 500 ceiling.
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    for (let index = 0; index < loadProfile.liveSessions; index += 1) {
      const session = sessionOf(index);
      await client.query(
        `INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.id, session.userId, session.token, expiresAt.toISOString(), now.toISOString()],
      );
    }

    await client.query('COMMIT');

    const counts = await client.query(
      `SELECT
         (SELECT count(*)::int FROM users WHERE id LIKE 'load-user-%') AS users,
         (SELECT count(*)::int FROM accounts WHERE id LIKE 'load-account-%') AS accounts,
         (SELECT count(*)::int FROM sessions
           WHERE id LIKE 'load-session-%' AND revoked_at IS NULL AND expires_at > now()) AS sessions`,
    );
    return counts.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const counts = await seedLoadFixture();
  console.log(
    `Load fixture: ${counts.users} accounts, ${counts.accounts} credentials, ${counts.sessions} live sessions.`,
  );
}
