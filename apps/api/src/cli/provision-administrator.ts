// The `provision-administrator` CLI: creates the administrator account and its
// credential in one transaction. The credential is read once from a hidden TTY
// prompt or standard input â€” never argv, an environment variable, or a file â€”
// and it is never echoed or reported (FR-028, AC-030, contracts/auth-api.md Â§7.2).
import { createDatabase } from '@wafar/db';
import { normalizePhone, validateCity, validateFullName } from '@wafar/shared';
import { environment } from '../env.ts';
import { createUsersRepository } from '../modules/users/repository/users.ts';
import { createAuthEngine } from '../modules/auth/engine.ts';
import { checkPasswordPolicy } from '../modules/auth/service/password-policy.ts';
import { createLogger } from '../observability/logger.ts';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Refuses a credential supplied as a value in argv, an environment, or a file. */
function refuseSuppliedCredential(): void {
  const forbiddenEnv = ['WAFAR_ADMIN_PASSWORD', 'ADMIN_PASSWORD', 'WAFAR_PASSWORD'];
  const fromEnvironment = forbiddenEnv.some((name) => process.env[name] !== undefined);
  const fromFile = hasFlag('password-file') || hasFlag('password-file-path');
  if (hasFlag('password') || fromEnvironment || fromFile) {
    console.error(
      'Refused: the initial password is accepted only from a hidden prompt or --password-stdin.',
    );
    process.exit(1);
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

async function promptHidden(label: string): Promise<string> {
  if (process.stdin.isTTY !== true) {
    throw new Error('no TTY for the hidden prompt; use --password-stdin');
  }
  process.stdout.write(label);
  return await new Promise<string>((resolve, reject) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    let value = '';
    const finish = (result: string): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      process.stdout.write('\n');
      resolve(result);
    };
    const onData = (chunk: Buffer): void => {
      const text = chunk.toString('utf8');
      for (const character of text) {
        if (character === '\u0003') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          reject(new Error('interrupted'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };
    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  refuseSuppliedCredential();

  const phone = argument('phone');
  const fullName = argument('full-name');
  const city = argument('city');
  if (!phone || !fullName || !city) {
    console.error(
      'usage: provision-administrator --phone +218912345678 --full-name "â€¦" --city "â€¦" [--password-stdin]',
    );
    process.exit(2);
  }

  const password = hasFlag('password-stdin')
    ? await readStdin()
    : await promptHidden('Initial password: ');
  if (password.length === 0) {
    console.error('Refused: the initial password is empty.');
    process.exit(1);
  }

  const normalized = normalizePhone(phone);
  if (normalized === null) {
    console.error('Refused: the number is not a listed Libyan mobile number.');
    process.exit(1);
  }
  if (validateFullName(fullName).length > 0) {
    console.error('Refused: the full name is not a valid value.');
    process.exit(1);
  }
  if (validateCity(city).length > 0) {
    console.error('Refused: the city is not an entry of the fixed list.');
    process.exit(1);
  }
  const policy = checkPasswordPolicy(password);
  if (policy !== null) {
    console.error(`Refused: the password is refused (${policy}).`);
    process.exit(1);
  }

  const env = environment();
  if (env.DATABASE_URL === undefined) {
    console.error('DATABASE_URL is not set.');
    process.exit(2);
  }

  const { db, pool } = createDatabase(env.DATABASE_URL);
  let wroteRecord = true;
  const logger = createLogger({ onWriteFailure: () => { wroteRecord = false; } });
  try {
    const auth = createAuthEngine({
      db,
      secret: env.BETTER_AUTH_SECRET,
      baseUrl: env.BETTER_AUTH_URL,
    });
    const passwordHash = await auth.hashPassword(password);
    const userId = await auth.transaction(async (scope) => {
      const account = await createUsersRepository(scope.db).create({
        fullName: fullName.trim(),
        phoneNumber: normalized.e164,
        city: city.trim(),
        shopName: null,
        role: 'administrator',
        mustChangePassword: true,
      });
      await scope.auth.createCredential({
        userId: account.id,
        passwordHash,
      });
      return account.id;
    });
    logger.emit({
      event: 'auth.administrator.provisioned',
      outcome: 'success',
      requestId: `cli-${process.pid}`,
      accountId: userId,
    });
    if (!wroteRecord) {
      console.error(
        `Provisioning failed: account ${userId} exists, but its auth.administrator.provisioned record did not reach the stream.`,
      );
      process.exitCode = 2;
      return;
    }
    console.log(`Administrator provisioned: ${userId}`);
  } catch (error) {
    const message = error as { code?: string; cause?: { code?: string } };
    if (message.code === '23505' || message.cause?.code === '23505') {
      console.error('Refused: a number that already has an account.');
      process.exitCode = 1;
      return;
    }
    console.error('Provisioning failed:', (error as Error).message);
    process.exitCode = 2;
  } finally {
    await pool.end();
  }
}

await main();
