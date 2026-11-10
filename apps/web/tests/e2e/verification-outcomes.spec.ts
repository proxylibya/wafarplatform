// The five post-verification outcomes end to end: at sign-up the existing active
// merchant, the blocked account, and the administrator account; in recovery the
// number with no account and the administrator account. Each replaces the code
// step in place with its recorded message and its own control, offers no retry
// and no code field, is announced as a status rather than an alert, and leaves
// the first step after a reload (FR-006, FR-014, FR-038, FR-040, AC-006, AC-016,
// AC-041, AC-043; T171).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  fillSignUpForm,
  openSignUp,
  reloadSignUp,
  submitSignUp,
  uniqueNationalNumber,
} from '../support/bare';
import { dispatchMark, waitForDispatch } from '../support/fake-inbox';
import {
  blockAccount,
  clearRateLimits,
  provisionAdministrator,
} from '../support/seed';

// The origin's account-creation window is shared by the whole suite, so each
// scenario starts with a full budget.
test.beforeEach(async () => {
  await clearRateLimits();
});

const password = 'correct horse battery staple';

async function submitAndVerifySignUp(
  page: Page,
  values: { fullName: string; phone: string; password: string; city: string },
): Promise<void> {
  const before = dispatchMark();
  await fillSignUpForm(page, values);
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();
}

async function expectOutcome(
  page: Page,
  heading: string,
  body: string,
): Promise<void> {
  const outcome = page.locator('.wf-outcome');
  await expect(outcome).toBeVisible();
  await expect(outcome).toHaveAttribute('role', 'status');
  await expect(outcome.locator('.wf-outcome__heading')).toHaveText(heading);
  await expect(outcome).toContainText(body);
  await expect(outcome.locator('[role="alert"]')).toHaveCount(0);
  await expect(page.locator('input[autocomplete="one-time-code"]')).toHaveCount(0);
  await expect(
    outcome.getByRole('button', { name: /إعادة|أعد المحاولة|رمز جديد/ }),
  ).toHaveCount(0);
  // The terminal step has no field, so focus moves to its heading (AC-043).
  await expect(outcome.locator('.wf-outcome__heading')).toBeFocused();
}

async function expectFirstStepAfterReload(page: Page): Promise<void> {
  await reloadSignUp(page);
  await expect(page.locator('form.wf-sign-up')).toBeVisible();
  await expect(page.locator('.wf-outcome')).toHaveCount(0);
}

async function requestRecovery(page: Page, phone: string): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/forgot-password');
  await bootstrap;
  const before = dispatchMark();
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  const dispatch = await waitForDispatch({ kind: 'otp_recovery', after: before });
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();
}

test('every post-verification outcome is stated in place and ends the request', async ({
  page,
  context,
}) => {
  const existingPhone = uniqueNationalNumber(6);
  const blockedPhone = uniqueNationalNumber(7);
  const administratorPhone = uniqueNationalNumber(8);
  const missingPhone = uniqueNationalNumber(9);

  // 1. The existing active merchant: the first sign-up creates the account.
  await openSignUp(page);
  await submitAndVerifySignUp(page, {
    fullName: 'عمر الفيتوري',
    phone: existingPhone,
    password,
    city: 'طرابلس',
  });
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();
  // The terminal step has no field, so focus moves to its heading (AC-043).
  await expect(page.locator('.wf-outcome__heading')).toBeFocused();
  await context.clearCookies();

  await openSignUp(page);
  await submitAndVerifySignUp(page, {
    fullName: 'عمر الفيتوري',
    phone: existingPhone,
    password: 'another different password',
    city: 'طرابلس',
  });
  await expectOutcome(
    page,
    'رقمك مسجل مسبقا',
    'هذا الرقم له حساب على المنصة. سجل الدخول أو استعد كلمة المرور.',
  );
  await expectFirstStepAfterReload(page);

  // 2. The blocked account.
  await openSignUp(page);
  await submitAndVerifySignUp(page, {
    fullName: 'مريم بن سعيد',
    phone: blockedPhone,
    password,
    city: 'بنغازي',
  });
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();
  // The terminal step has no field, so focus moves to its heading (AC-043).
  await expect(page.locator('.wf-outcome__heading')).toBeFocused();
  await blockAccount(blockedPhone);
  await context.clearCookies();

  await openSignUp(page);
  await submitAndVerifySignUp(page, {
    fullName: 'مريم بن سعيد',
    phone: blockedPhone,
    password: 'another different password',
    city: 'بنغازي',
  });
  await expectOutcome(
    page,
    'الحساب موقوف',
    'هذا الرقم له حساب موقوف. يبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله.',
  );
  await expectFirstStepAfterReload(page);

  // 3. The administrator account at sign-up.
  provisionAdministrator({
    phoneNumber: administratorPhone,
    fullName: 'مدير المنصة',
    city: 'طرابلس',
    password: 'administrator initial password',
  });
  await openSignUp(page);
  await submitAndVerifySignUp(page, {
    fullName: 'شخص آخر',
    phone: administratorPhone,
    password,
    city: 'طرابلس',
  });
  await expectOutcome(
    page,
    'الحساب إداري',
    'هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة. لا ينطبق عليه تسجيل الدخول أو الاستعادة من هنا.',
  );
  await expectFirstStepAfterReload(page);

  // 4. Recovery for a number with no account.
  await requestRecovery(page, missingPhone);
  await expectOutcome(
    page,
    'لا يوجد حساب لهذا الرقم',
    'لا يمكن إعادة تعيين كلمة مرور لرقم بلا حساب. أنشئ حسابا أو تحقق من الرقم.',
  );
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.reload();
  await bootstrap;
  await expect(page.locator('form.wf-forgot')).toBeVisible();
  await expect(page.locator('.wf-outcome')).toHaveCount(0);

  // 5. Recovery for the administrator account.
  await requestRecovery(page, administratorPhone);
  await expectOutcome(
    page,
    'لا يمكن إعادة التعيين من هنا',
    'هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة.',
  );
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
});
