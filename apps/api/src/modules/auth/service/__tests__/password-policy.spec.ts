// Unit test the password policy and the scrypt profile: the 12–128 bounds, the
// three refusal reasons, the vendored membership test, and the stored form
// (FR-035, AC-037).
import { describe, expect, it } from 'vitest';
import {
  checkPasswordPolicy,
  hashOneTimeCode,
  hashPassword,
  isBreachedPassword,
  parseHash,
  verifyOneTimeCode,
  verifyPassword,
} from '../password-policy.ts';

describe('the password policy', () => {
  it('refuses fewer than 12 characters', () => {
    expect(checkPasswordPolicy('a'.repeat(11))).toBe('PASSWORD_TOO_SHORT');
  });

  it('refuses more than 128 characters', () => {
    expect(checkPasswordPolicy('a'.repeat(129))).toBe('PASSWORD_TOO_LONG');
  });

  it('refuses a common password with its own reason', () => {
    const common = 'password123456';
    expect(isBreachedPassword(common)).toBe(true);
    expect(checkPasswordPolicy(common)).toBe('PASSWORD_TOO_COMMON');
  });

  it('accepts a value inside the bounds that is not in the list', () => {
    expect(checkPasswordPolicy('كلمة-سر-طويلة-جدا-987')).toBeNull();
  });

  it('accepts reuse on an ordinary change', async () => {
    const hash = await hashPassword('كلمة-سر-طويلة-جدا-987');
    expect(await verifyPassword('كلمة-سر-طويلة-جدا-987', hash)).toBe(true);
  });

  it('writes the CMV 2 form and refuses a weakened or unknown form', async () => {
    const hash = await hashPassword('كلمة-سر-طويلة-جدا-987');
    expect(hash.startsWith('$wafar$scrypt$32768$8$3$')).toBe(true);
    expect(parseHash(hash)?.n).toBe(32768);
    expect(await verifyPassword('كلمة-سر-طويلة-جدا-987', 'plaintext')).toBe(false);
    expect(await verifyPassword('كلمة-سر-طويلة-جدا-987', null)).toBe(false);
    expect(
      await verifyPassword('كلمة-سر-طويلة-جدا-987', '$wafar$scrypt$16384$8$3$00$00'),
    ).toBe(false);
  });

  it('hashes a one-time code with the request id and verifies only the match', async () => {
    const hash = await hashOneTimeCode('123456', 'request-1');
    expect(hash.startsWith('$wafar$scrypt$')).toBe(true);
    expect(await verifyOneTimeCode('123456', hash, 'request-1')).toBe(true);
    expect(await verifyOneTimeCode('123456', hash, 'request-2')).toBe(false);
    expect(await verifyOneTimeCode('654321', hash, 'request-1')).toBe(false);
  });
});
