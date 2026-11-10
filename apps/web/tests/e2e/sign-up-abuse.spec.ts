// The form's two abuse answers end to end: a filled hidden field receives the
// silent 202 and the page stays on the first step with no message and no code
// step, because the resume read answers OTP_EXPIRED; and a submission younger
// than the minimum time gets FORM_TOO_FAST with every typed value kept, then a
// retry after the refreshed stamp is accepted (FR-029, FR-033, AC-031, AC-032,
// AC-033; T081).
import { expect, test } from '@playwright/test';
import {
  fillSignUpForm,
  openSignUp,
  submitSignUp,
  uniqueNationalNumber,
} from '../support/bare';
import { dispatchMark, waitForDispatch } from '../support/fake-inbox';
import { clearRateLimits } from '../support/seed';

// The origin's account-creation window is shared by the whole suite, so each
// scenario starts with a full budget.
test.beforeEach(async () => {
  await clearRateLimits();
});

const password = 'correct horse battery staple';
const values = {
  fullName: 'ريم العبيدي',
  phone: uniqueNationalNumber(13),
  password,
  city: 'الخمس',
};

test('the honeypot is answered silently and leaves the first step unchanged', async ({
  page,
}) => {
  const before = dispatchMark();
  await openSignUp(page);
  await fillSignUpForm(page, values);
  await page.locator('.wf-honeypot input').fill('https://spam.example', { force: true });
  await submitSignUp(page);

  // The 202 chooses no step; the resume read answers OTP_EXPIRED, so the page
  // stays on the form with no message and no code step.
  await page.waitForTimeout(1_500);
  await expect(page.locator('form.wf-sign-up')).toBeVisible();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.wf-sign-up [role="alert"]')).toHaveCount(0);
  await expect(page.locator('.wf-message--status')).toHaveCount(0);
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');
  await expect(page.locator('button.wf-submit')).toBeEnabled();
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue(
    values.fullName,
  );
  // No message was dispatched for the silent answer.
  expect(dispatchMark()).toBe(before);
});

test('the minimum-time refusal keeps the values and a retry after the fresh stamp is accepted', async ({
  page,
}) => {
  // A page whose stamp is younger than three seconds, built without the helper's
  // age wait, so the first submission meets the guard.
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/sign-up');
  await bootstrap;
  const phone = uniqueNationalNumber(14);
  await fillSignUpForm(page, { ...values, phone });
  await submitSignUp(page);

  const alert = page.locator('.wf-sign-up [role="alert"]').first();
  await expect(alert).toHaveText(
    'أرسلت النموذج بسرعة أكبر من المعتاد. أعد المحاولة.',
  );
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue(
    values.fullName,
  );
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(phone);
  await expect(page.locator('#wf-city-input')).toHaveValue(values.city);

  // The retry takes the fresh pair, after its minimum age, with no reload; the
  // password is the one value the refusal cleared.
  const before = dispatchMark();
  await page.waitForTimeout(3_100);
  await page.locator('input[type="password"]').fill(password);
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  expect(dispatch.code).toMatch(/^\d{6}$/);
  await expect(page.locator('.wf-code-step')).toBeVisible();
});
