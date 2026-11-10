// The recovery journey end to end: the cross-links, the code step, the reload
// onto the new-password step, the in-place confirmation, the terminal message
// with no retry control, no address, history entry, referrer, or stored value
// carrying the number, and SC-003's three minutes (FR-014, FR-036, FR-037,
// FR-038, FR-002, AC-016, AC-039, AC-002; T084).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  fillSignUpForm,
  openSignUp,
  submitSignUp,
  uniqueNationalNumber,
} from '../support/bare';
import { dispatchMark, waitForDispatch } from '../support/fake-inbox';
import { clearRateLimits, expireCode, blockAccount } from '../support/seed';

// The origin's account-creation window is shared by the whole suite, so each
// scenario starts with a full budget.
test.beforeEach(async () => {
  await clearRateLimits();
});

const password = 'correct horse battery staple';
const newPassword = 'a longer replacement phrase';

async function openRecovery(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/forgot-password');
  await bootstrap;
}

async function reloadRecovery(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.reload();
  await bootstrap;
}

test('the recovery journey reloads onto the new-password step and states the outcome once', async ({
  page,
  context,
}) => {
  const startedAt = Date.now();
  const phone = uniqueNationalNumber(5);

  // Seed one account through the product's own sign-up journey.
  const before = dispatchMark();
  await openSignUp(page);
  await fillSignUpForm(page, {
    fullName: 'هدى موسى',
    phone,
    password,
    city: 'مصراتة',
  });
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();
  await context.clearCookies();

  await openRecovery(page);
  const historyLength = await page.evaluate(() => history.length);
  expect(await page.evaluate(() => document.referrer)).toBe('');

  // The cross-links the page carries: the recovery page offers sign-in only
  // (contracts/ui-contracts.md §5.2).
  await expect(
    page.locator('.bare-layout__links a[href="/auth/sign-in"]').first(),
  ).toBeVisible();
  await expect(
    page.locator('.bare-layout__links a[href="/auth/sign-up"]'),
  ).toHaveCount(0);

  // The request, then the code step in place.
  const beforeRequest = dispatchMark();
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  await waitForDispatch({
    kind: 'otp_recovery',
    after: beforeRequest,
  });
  await expect(page.locator('.wf-code-step')).toBeVisible();
  await expect(page.locator('.wf-code-step__collected')).toContainText(
    `+218 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`,
  );
  await expect(page.locator('input[autocomplete="one-time-code"]')).toBeFocused();

  // A reload while the code is pending resumes the code step.
  await reloadRecovery(page);
  await expect(page.locator('.wf-code-step')).toBeVisible();

  // The recovery code step's own control returns to the first step, keeps the
  // phone, ends the browser's tie, and moves focus to the field (T211, AC-041).
  await page.getByRole('button', { name: 'تغيير الرقم' }).click();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('form.wf-forgot')).toBeVisible();
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(phone);
  await expect(page.locator('input[autocomplete="tel-national"]')).toBeFocused();
  expect(
    await page.evaluate(() => sessionStorage.getItem('wafar.pending.requestId')),
  ).toBeNull();

  // A fresh request starts a new code step, and its code moves to the
  // new-password step.
  const beforeSecond = dispatchMark();
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  const second = await waitForDispatch({
    kind: 'otp_recovery',
    after: beforeSecond,
  });
  await page.locator('input[autocomplete="one-time-code"]').fill(second.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.locator('.wf-new-password')).toBeVisible();
  await expect(page.locator('.wf-new-password h2')).toHaveText('كلمة مرور جديدة');
  await expect(page.locator('.wf-new-password input')).toBeFocused();

  // A reload while the request is verified returns to the new-password step.
  await reloadRecovery(page);
  await expect(page.locator('.wf-new-password')).toBeVisible();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);

  // A refused new password clears the field rather than retaining the plaintext
  // (T222; FR-038, FR-040).
  const newPasswordField = page.getByLabel('كلمة المرور الجديدة');
  await newPasswordField.fill('short');
  await page.getByRole('button', { name: 'تعيين كلمة المرور' }).click();
  await expect(page.locator('.wf-new-password [role="alert"]')).toBeVisible();
  await expect(newPasswordField).toHaveValue('');
  await expect(page.locator('.wf-new-password')).toBeVisible();

  // The confirmation is in place, with the recorded heading and body, and the
  // outcome offers no retry control.
  await newPasswordField.fill(newPassword);
  await page.getByRole('button', { name: 'تعيين كلمة المرور' }).click();
  await expect(page.locator('.wf-outcome__heading')).toHaveText('تم تعيين كلمة المرور');
  await expect(
    page.getByText('انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة.'),
  ).toBeVisible();
  await expect(page.locator('.wf-outcome__heading')).toBeFocused();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.wf-new-password')).toHaveCount(0);
  await expect(page.locator('.wf-outcome button')).toHaveCount(0);
  // The reset outcome keeps its sign-in link (contracts/ui-contracts.md §5.2).
  await expect(page.locator('.bare-layout__links a[href="/auth/sign-in"]')).toBeVisible();

  // No address, history entry, referrer, or stored value carries the number.
  expect(new URL(page.url()).pathname).toBe('/auth/forgot-password');
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(await page.evaluate(() => document.referrer)).toBe('');
  const stored = await page.evaluate(() => ({
    session: Object.values(sessionStorage),
    local: Object.values(localStorage),
  }));
  for (const value of [...stored.session, ...stored.local]) {
    expect(value).not.toContain(phone);
  }
  for (const cookie of await context.cookies()) {
    expect(cookie.value).not.toContain(phone);
  }

  // SC-003's three-minute budget, excluding delivery after acceptance.
  expect(Date.now() - startedAt).toBeLessThan(180_000);
});

test('a recovery request that expires after a reload keeps the number on the first step', async ({
  page,
}) => {
  const phone = uniqueNationalNumber(12);
  await openRecovery(page);
  const before = dispatchMark();
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  await waitForDispatch({ kind: 'otp_recovery', after: before });
  // The reload must follow the 202, whose Set-Cookie and requestId the browser
  // has to receive before it can resume.
  await expect(page.locator('.wf-code-step')).toBeVisible();

  // The reload resumes the code step without this tab's submission state.
  await reloadRecovery(page);
  await expect(page.locator('.wf-code-step')).toBeVisible();

  await expireCode(phone);
  await page.locator('input[autocomplete="one-time-code"]').fill('000000');
  await page.locator('button.wf-code-step__submit').click();

  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.wf-message--status')).toHaveText(
    'انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.',
  );
  // The resumed number seeds the first step and takes the focus (T221, AC-041).
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(phone);
  await expect(page.locator('input[autocomplete="tel-national"]')).toBeFocused();
});

test('a resend after the request’s lifetime returns to the form with the expiry notice', async ({
  page,
}) => {
  const phone = uniqueNationalNumber(14);
  await openRecovery(page);
  const before = dispatchMark();
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  await waitForDispatch({ kind: 'otp_recovery', after: before });
  await expect(page.locator('.wf-code-step')).toBeVisible();

  await expireCode(phone);
  await page.getByRole('button', { name: 'إرسال رمز جديد' }).click();

  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('form.wf-forgot')).toBeVisible();
  await expect(page.locator('.wf-message--status')).toHaveText(
    'انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.',
  );
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(phone);
});

test('the blocked reset outcome withholds the sign-in link', async ({ page, context }) => {
  const phone = uniqueNationalNumber(13);
  const before = dispatchMark();
  await openSignUp(page);
  await fillSignUpForm(page, {
    fullName: 'سالم الفيتوري',
    phone,
    password,
    city: 'طرابلس',
  });
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();
  await context.clearCookies();
  await blockAccount(phone);

  await openRecovery(page);
  const beforeRequest = dispatchMark();
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  const code = await waitForDispatch({ kind: 'otp_recovery', after: beforeRequest });
  await page.locator('input[autocomplete="one-time-code"]').fill(code.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.locator('.wf-new-password')).toBeVisible();
  await page.getByLabel('كلمة المرور الجديدة').fill(newPassword);
  await page.getByRole('button', { name: 'تعيين كلمة المرور' }).click();

  // The blocked confirmation carries its own body and no sign-in link
  // (contracts/ui-contracts.md §5.2; T230).
  await expect(page.locator('.wf-outcome__heading')).toHaveText('تم تعيين كلمة المرور');
  await expect(
    page.getByText(
      'انتهت كل الجلسات السابقة. الحساب موقوف، ويبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله.',
    ),
  ).toBeVisible();
  await expect(page.locator('.bare-layout__links')).toHaveCount(0);
});
