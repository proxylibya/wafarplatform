// The operator's provisioning CLI: repeatable with no cap, a conflict reported
// for an existing number, every field rule refused and reported, the password
// policy applied, the credential accepted only from standard input, never
// echoed or logged, and a run whose credential cannot be written leaving no
// account behind (FR-028, FR-035, AC-030; T107).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import { provision, provisionedRecords } from '../../support/cli.ts';
import {
  createHarness,
  hasDatabase,
  seedAccount,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'administrator initial password';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function count(table: string): Promise<number> {
  const result = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (result.rows[0] as { n: number }).n;
}

describe.skipIf(!hasDatabase)('the provisioning CLI', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('provisions an active administrator once per number, repeatably and with no cap', async () => {
    const first = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(first.status).toBe(0);
    expect(first.stdout).not.toContain(password);
    expect(first.stderr).not.toContain(password);
    expect(first.stderr.trim()).toBe('');

    const records = provisionedRecords(first.stdout);
    expect(records).toHaveLength(1);
    expect(JSON.stringify(records[0])).not.toContain(password);

    const rows = await harness!.db.select().from(users);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      phoneNumber: '+218912345678',
      role: 'administrator',
      status: 'active',
      mustChangePassword: true,
      email: '218912345678@phone.invalid',
      failedSignInCount: 0,
    });

    // A second administrator, and a third: no cap refuses a legitimate run.
    const second = provision({
      phone: '+218912345679',
      fullName: 'مديرة ثانية',
      city: city(),
      password,
    });
    const third = provision({
      phone: '+218912345680',
      fullName: 'مدير ثالث',
      city: city(),
      password,
    });
    expect(second.status).toBe(0);
    expect(third.status).toBe(0);
    expect(await count('users')).toBe(3);
    expect(await count('accounts')).toBe(3);

    // No code, no notice, no session, and the library placeholder stays empty.
    expect(await count('phone_verifications')).toBe(0);
    expect(await count('sessions')).toBe(0);
    expect(await count('verifications')).toBe(0);
    expect(first.stdout).not.toContain('sms.fake.dispatched');
  });

  it('reports a conflict for a number that already has an account', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password: 'an existing merchant password',
    });
    const before = await count('users');

    const result = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('already has an account');
    expect(result.stderr).not.toContain(password);
    expect(await count('users')).toBe(before);
    expect(provisionedRecords(result.stdout)).toHaveLength(0);
  });

  it('refuses and reports every field rule and the password policy', async () => {
    const cases: Array<{ args: Parameters<typeof provision>[0]; wording: RegExp }> = [
      {
        args: { phone: '+2181234', fullName: 'مدير المنصة', city: city(), password },
        wording: /not a listed Libyan mobile number/,
      },
      {
        args: { phone: '+218912345678', fullName: 'مدير 😀', city: city(), password },
        wording: /full name is not a valid value/,
      },
      {
        args: { phone: '+218912345678', fullName: 'مدير المنصة', city: 'باريس', password },
        wording: /city is not an entry of the fixed list/,
      },
      {
        args: { phone: '+218912345678', fullName: 'مدير المنصة', city: city(), password: 'short' },
        wording: /password is refused/,
      },
      {
        args: { phone: '+218912345678', fullName: 'مدير المنصة', city: city(), password: '' },
        wording: /initial password is empty/,
      },
    ];

    for (const item of cases) {
      const result = provision(item.args);
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(item.wording);
      expect(await count('users')).toBe(0);
      expect(await count('accounts')).toBe(0);
    }
  });

  it('accepts the credential only from standard input, never argv, an environment, or a file', async () => {
    const argvValue = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      args: ['--password', password],
    });
    expect(argvValue.status).toBe(1);
    expect(argvValue.stderr).toContain('hidden prompt or --password-stdin');
    expect(argvValue.stdout).not.toContain(password);
    expect(argvValue.stderr).not.toContain(password);

    const environmentValue = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      args: ['--password-stdin'],
      env: { WAFAR_ADMIN_PASSWORD: password },
      password,
    });
    expect(environmentValue.status).toBe(1);
    expect(environmentValue.stderr).toContain('hidden prompt or --password-stdin');
    expect(environmentValue.stderr).not.toContain(password);

    const fileValue = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      args: ['--password-file', 'initial-password.txt'],
    });
    expect(fileValue.status).toBe(1);
    expect(fileValue.stderr).toContain('hidden prompt or --password-stdin');

    expect(await count('users')).toBe(0);
    expect(await count('accounts')).toBe(0);
  });

  it('collects no address and stores only the placeholder', async () => {
    const result = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      password,
      args: ['--email', 'person@example.com'],
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('person@example.com');
    expect(result.stderr).not.toContain('person@example.com');
    const rows = await harness!.db.select().from(users);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe('218912345678@phone.invalid');
  });

  it('leaves no account behind when the credential cannot be written', async () => {
    await harness!.db.execute(sql`
      CREATE OR REPLACE FUNCTION wafar_test_refuse_credential()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'credential write refused by the test';
      END;
      $$ LANGUAGE plpgsql
    `);
    await harness!.db.execute(sql`
      CREATE TRIGGER wafar_test_refuse_credential
      BEFORE INSERT ON accounts
      FOR EACH ROW EXECUTE FUNCTION wafar_test_refuse_credential()
    `);
    try {
      const result = provision({
        phone: '+218912345678',
        fullName: 'مدير المنصة',
        city: city(),
        password,
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('Provisioning failed');
      expect(result.stderr).not.toContain(password);
      expect(await count('users')).toBe(0);
      expect(await count('accounts')).toBe(0);
      expect(provisionedRecords(result.stdout)).toHaveLength(0);
    } finally {
      await harness!.db.execute(
        sql`DROP TRIGGER IF EXISTS wafar_test_refuse_credential ON accounts`,
      );
      await harness!.db.execute(
        sql`DROP FUNCTION IF EXISTS wafar_test_refuse_credential()`,
      );
    }
  });
});
