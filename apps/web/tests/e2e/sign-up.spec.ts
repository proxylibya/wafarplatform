// The sign-up journey end to end: the fixed +218 prefix and no dial-code
// selector, the in-place code step with the collected fields, the code read
// from the fake transport, the in-place confirmation, the resume on reload for
// the newest of several live requests, the first step after the confirmation,
// and the rule that no address, history entry, referrer, or stored value
// carries the submitted number (FR-001, FR-002, FR-004, FR-037, FR-038, FR-041,
// AC-001, AC-002, AC-004, AC-041, AC-044; T039).
import { expect, test } from '@playwright/test';
import {
  fillSignUpForm,
  openSignUp,
  reloadSignUp,
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

test('the sign-up journey stays in place, resumes, and keeps the number out of storage', async ({
  page,
  context,
}) => {
  const startedAt = Date.now();
  const first = {
    fullName: 'سارة أحمد',
    phone: uniqueNationalNumber(1),
    password,
    city: 'طرابلس',
    shopName: 'محل النور',
  };
  const second = {
    fullName: 'خالد سالم',
    phone: uniqueNationalNumber(2),
    password,
    city: 'بنغازي',
  };

  await openSignUp(page);
  const historyLength = await page.evaluate(() => history.length);
  expect(await page.evaluate(() => document.referrer)).toBe('');

  // The fixed prefix, one national field, and no dial-code selector anywhere.
  await expect(page.locator('.wf-field__prefix')).toHaveText('+218');
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveCount(1);
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveAttribute(
    'type',
    'tel',
  );

  // The first request.
  const beforeFirst = dispatchMark();
  await fillSignUpForm(page, first);
  await submitSignUp(page);

  const firstDispatch = await waitForDispatch({ kind: 'otp_sign_up', after: beforeFirst });
  expect(firstDispatch.code).toMatch(/^\d{6}$/);

  // The code step in place, with the collected fields.
  await expect(page.locator('.wf-code-step')).toBeVisible();
  await expect(page.getByText('رمز التحقق').first()).toBeVisible();
  await expect(page.locator('.wf-code-step__collected')).toContainText('سارة أحمد');
  await expect(page.locator('.wf-code-step__collected')).toContainText('طرابلس');
  await expect(page.locator('.wf-code-step__collected')).toContainText('محل النور');
  await expect(page.locator('.wf-code-step__collected')).toContainText(
    `+218 ${first.phone.slice(0, 2)} ${first.phone.slice(2, 5)} ${first.phone.slice(5)}`,
  );
  const codeField = page.locator('input[autocomplete="one-time-code"]');
  await expect(codeField).toBeFocused();
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');

  // A reload while the request is live resumes the same code step.
  await reloadSignUp(page);
  await expect(page.locator('.wf-code-step')).toBeVisible();
  await expect(page.locator('.wf-code-step__collected')).toContainText('سارة أحمد');
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');

  // A second request for another number replaces the tie; a reload resumes the
  // newest submission, not the earlier one.
  await page.getByRole('button', { name: 'تعديل البيانات' }).click();
  const beforeSecond = dispatchMark();
  await fillSignUpForm(page, second);
  await submitSignUp(page);
  const secondDispatch = await waitForDispatch({
    kind: 'otp_sign_up',
    after: beforeSecond,
  });
  await expect(page.locator('.wf-code-step__collected')).toContainText('خالد سالم');
  await expect(page.locator('.wf-code-step__collected')).toContainText('بنغازي');

  await reloadSignUp(page);
  await expect(page.locator('.wf-code-step__collected')).toContainText('خالد سالم');
  await expect(page.locator('.wf-code-step__collected')).not.toContainText('سارة أحمد');

  // The confirmation is in place, with no navigation.
  await codeField.fill(secondDispatch.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);

  // No address, history entry, referrer, or stored value carries the number.
  expect(new URL(page.url()).pathname).toBe('/auth/sign-up');
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(await page.evaluate(() => document.referrer)).toBe('');
  const stored = await page.evaluate(() => ({
    session: Object.values(sessionStorage),
    local: Object.values(localStorage),
  }));
  for (const value of [...stored.session, ...stored.local]) {
    expect(value).not.toContain(first.phone);
    expect(value).not.toContain(second.phone);
  }
  for (const cookie of await context.cookies()) {
    expect(cookie.value).not.toContain(first.phone);
    expect(cookie.value).not.toContain(second.phone);
  }
  // The browser's tie is the request identifier alone.
  await expect
    .poll(async () => {
      const cookies = await context.cookies();
      return cookies.some((cookie) => cookie.name === 'wafar.session');
    })
    .toBe(true);

  // A reload after the confirmation returns to the first step.
  await reloadSignUp(page);
  await expect(page.locator('form.wf-sign-up')).toBeVisible();
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toHaveCount(0);

  // SC-001's three-minute budget, excluding delivery after acceptance.
  expect(Date.now() - startedAt).toBeLessThan(180_000);
});
