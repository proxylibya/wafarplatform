// The fifth incorrect entry's ending end to end: the first four keep the code
// step with the field cleared and the wrong-code message; the fifth ends the
// request, returns the first step with the OTP_REQUEST_ENDED notice as a status,
// keeps every collected value, moves focus to the first field, leaves no live
// request, and lets a fresh submission start a new verification (FR-034, FR-038,
// FR-040, AC-036, AC-041, AC-043; T172).
import { expect, test } from '@playwright/test';
import {
  fillSignUpForm,
  openSignUp,
  reloadSignUp,
  submitSignUp,
  uniqueNationalNumber,
} from '../support/bare';
import { dispatchMark, waitForDispatch } from '../support/fake-inbox';
import { clearRateLimits, expireCode } from '../support/seed';

// The origin's account-creation window is shared by the whole suite, so each
// scenario starts with a full budget.
test.beforeEach(async () => {
  await clearRateLimits();
});

const password = 'correct horse battery staple';

test('the fifth incorrect entry ends the request and returns the first step with its values', async ({
  page,
}) => {
  const values = {
    fullName: 'أمل الزوي',
    phone: uniqueNationalNumber(10),
    password,
    city: 'سبها',
    shopName: 'ورشة أمل',
  };

  await openSignUp(page);
  const before = dispatchMark();
  await fillSignUpForm(page, values);
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  // The reload must follow the 202, whose Set-Cookie and requestId the browser
  // has to receive before it can resume.
  await expect(page.locator('.wf-code-step')).toBeVisible();
  // The reload resumes the code step from the pending read, so the values the
  // ending returns to come from the resume payload (T221).
  await reloadSignUp(page);
  await expect(page.locator('.wf-code-step')).toBeVisible();
  const wrong = dispatch.code === '000000' ? '111111' : '000000';
  const field = page.locator('input[autocomplete="one-time-code"]');

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await field.fill(wrong);
    await page.locator('button.wf-code-step__submit').click();
    await expect(page.locator('.wf-code-step')).toBeVisible();
    await expect(page.locator('.wf-code-step__form input')).toHaveValue('');
    await expect(page.locator('.wf-code-step [role="alert"]')).toHaveText(
      'الرمز غير صحيح.',
    );
  }

  // The fifth ends the request.
  await field.fill(wrong);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');

  // The notice is a polite status, not an alert.
  const notice = page.locator('.wf-message--status');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('role', 'status');
  await expect(notice).toHaveText(
    'انتهت محاولات التحقق. أدخل رقمك من جديد لطلب رمز جديد.',
  );
  await expect(page.locator('.wf-message--alert')).toHaveCount(0);

  // Every collected value is kept, and focus is on the first field.
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue(values.fullName);
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(
    values.phone,
  );
  await expect(page.locator('#wf-city-input')).toHaveValue(values.city);
  await expect(page.locator('input[autocomplete="organization"]')).toHaveValue(
    values.shopName,
  );
  await expect(page.locator('input[autocomplete="name"]')).toBeFocused();

  // The browser's tie to the ended request is gone, so no live request survives.
  const stored = await page.evaluate(() =>
    sessionStorage.getItem('wafar.pending.requestId'),
  );
  expect(stored).toBeNull();

  // A fresh submission starts a new verification from the kept values, and its
  // code works: the incorrect-entry count begins at zero.
  const beforeFresh = dispatchMark();
  // The password is never re-displayed, so it is the one value to type again.
  await page.locator('input[type="password"]').fill(values.password);
  await submitSignUp(page);
  const fresh = await waitForDispatch({ kind: 'otp_sign_up', after: beforeFresh });
  expect(fresh.code).toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(fresh.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();

  // After the new confirmation, a reload returns the first step.
  await reloadSignUp(page);
  await expect(page.locator('form.wf-sign-up')).toBeVisible();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.wf-message--status')).toHaveCount(0);
});

test('a request that expires after a reload returns the first step with its values', async ({
  page,
}) => {
  const values = {
    fullName: 'نور الهدى',
    phone: uniqueNationalNumber(11),
    password,
    city: 'البيضاء',
    shopName: 'مكتبة نور',
  };

  await openSignUp(page);
  const before = dispatchMark();
  await fillSignUpForm(page, values);
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });

  // The reload must follow the 202, whose Set-Cookie and requestId the browser
  // has to receive before it can resume. It then resumes the code step from the
  // pending read alone; the first step's values are not held in this tab's
  // submission.
  await expect(page.locator('.wf-code-step')).toBeVisible();
  await reloadSignUp(page);
  await expect(page.locator('.wf-code-step')).toBeVisible();

  // The request's lifetime ends, and the next submission reports it.
  await expireCode(values.phone);
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();

  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  const notice = page.locator('.wf-message--status');
  await expect(notice).toHaveText('انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.');

  // The resume payload seeds the first step: every collected value stands,
  // the password is empty, and focus is on the first field (T221, AC-041).
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue(values.fullName);
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(
    values.phone,
  );
  await expect(page.locator('#wf-city-input')).toHaveValue(values.city);
  await expect(page.locator('input[autocomplete="organization"]')).toHaveValue(
    values.shopName,
  );
  await expect(page.locator('input[type="password"]')).toHaveValue('');
  await expect(page.locator('input[autocomplete="name"]')).toBeFocused();
});
