// The pages never retain a submitted password in their state: the sign-up page
// keeps only the four values the resume read carries, and the recovery page
// clears its new-password field on a refusal, after a reset, and when the flow
// returns to the form (FR-038, FR-040, AC-041; T222).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const signUp = readFileSync(
  resolve('apps/web/app/pages/auth/sign-up.vue'),
  'utf8',
);
const recovery = readFileSync(
  resolve('apps/web/app/pages/auth/forgot-password.vue'),
  'utf8',
);

describe('the submitted password is never retained', () => {
  it('stores only the four resumed values on the sign-up page', () => {
    expect(signUp).not.toContain('formValues.value = payload;');
    const stored = signUp.slice(signUp.lastIndexOf('formValues.value = {'));
    const assignment = stored.slice(0, stored.indexOf('};'));
    expect(assignment).toContain("fullName: payload['fullName']");
    expect(assignment).toContain("phone: payload['phone']");
    expect(assignment).toContain("city: payload['city']");
    expect(assignment).toContain("shopName: payload['shopName']");
    expect(assignment).not.toContain('password');
  });

  it('clears the recovery page’s new password on a refusal, after a reset, and on the return to the form', () => {
    const clears = recovery.match(/newPassword\.value = '';/g) ?? [];
    expect(clears.length).toBeGreaterThanOrEqual(3);
    expect(recovery).toContain('newPassword.value = \'\';\n    if (result.refusal.code === \'RECOVERY_EXPIRED\')');
    expect(recovery).toContain('newPassword.value = \'\';\n  outcome.value = result.data.outcome;');
  });
});
