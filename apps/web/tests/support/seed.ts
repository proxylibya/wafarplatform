// The end-to-end fixtures a browser cannot produce: a blocked account and a
// provisioned administrator. The first is one column the test flips on an
// account the product created; the second runs the product's own CLI. No
// product path is added for either.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const apiRoot = fileURLToPath(new URL('../../../api/', import.meta.url));
const require = createRequire(
  fileURLToPath(new URL('../../../api/package.json', import.meta.url)),
);

interface PgClient {
  connect: () => Promise<void>;
  query: (text: string, values?: unknown[]) => Promise<unknown>;
  end: () => Promise<void>;
}

type PgConstructor = new (config: {
  connectionString: string;
  options?: string;
}) => PgClient;

const { Client } = require('pg') as { Client: PgConstructor };

function databaseUrl(): string {
  return (
    process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar'
  );
}

async function withClient<T>(run: (client: PgClient) => Promise<T>): Promise<T> {
  // The role carries the API's 100 ms statement timeout; a fixture's cascade
  // may need longer and is not a request path, so the session starts without it.
  const client = new Client({
    connectionString: databaseUrl(),
    options: '-c statement_timeout=0',
  });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/** Removes every row a fixed scenario number owns, so a rerun starts clean. */
export async function forgetPhone(phoneNumber: string): Promise<void> {
  const full = `+218${phoneNumber}`;
  await withClient(async (client) => {
    await client.query(
      'DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE phone_number = $1)',
      [full],
    );
    await client.query(
      'DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone_number = $1)',
      [full],
    );
    await client.query('DELETE FROM phone_verifications WHERE phone_number = $1', [
      full,
    ]);
    await client.query('DELETE FROM users WHERE phone_number = $1', [full]);
  });
}

/** Clears every fixed-window counter, so one scenario's spend never refuses the next. */
export async function clearRateLimits(): Promise<void> {
  await withClient((client) => client.query('DELETE FROM rate_limit_counters'));
}

/** Moves one pending request past both expiries, for the expired notice. */
export async function expireCode(phoneNumber: string): Promise<void> {
  await withClient((client) =>
    client.query(
      "UPDATE phone_verifications SET code_expires_at = now() - interval '1 second', request_expires_at = now() - interval '1 second' WHERE phone_number = $1",
      [`+218${phoneNumber}`],
    ),
  );
}

/** Puts one number's operation counter at its limit, for the refusal state. */
export async function seedLimit(
  operation: 'account_creation' | 'sign_in' | 'recovery',
  phoneNumber: string,
  count: number,
): Promise<void> {
  const step = 15 * 60 * 1000;
  const start = Math.floor(Date.now() / step) * step;
  const key = `${operation}:number:+218${phoneNumber}`;
  await withClient((client) =>
    client.query(
      `INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
       VALUES ($1, to_timestamp($2 / 1000.0), $3, to_timestamp(($2 + $4) / 1000.0))
       ON CONFLICT (key, window_start) DO UPDATE SET count = EXCLUDED.count`,
      [key, start, count, step],
    ),
  );
}


/** Flips one account's status to blocked, the R13 column an administrator owns. */
export async function blockAccount(phoneNumber: string): Promise<void> {
  await withClient((client) =>
    client.query('UPDATE users SET status = $1 WHERE phone_number = $2', [
      'blocked',
      `+218${phoneNumber}`,
    ]),
  );
}

/** Provisions an administrator through the product's CLI and its stdin channel. */
export function provisionAdministrator(input: {
  phoneNumber: string;
  fullName: string;
  city: string;
  password: string;
}): void {
  const args = [
    'node_modules/tsx/dist/cli.mjs',
    'src/cli/provision-administrator.ts',
    '--phone',
    `+218${input.phoneNumber}`,
    '--full-name',
    input.fullName,
    '--city',
    input.city,
    '--password-stdin',
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl() },
    input: input.password,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `provision-administrator exited ${String(result.status)}: ${result.stderr}`,
    );
  }
}
