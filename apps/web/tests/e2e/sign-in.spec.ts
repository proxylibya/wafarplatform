// The sign-in journey end to end: no code step, the in-place confirmation, the
// one uniform failure text with no lock copy, no dial-code selector, no address,
// history entry, referrer, or stored value carrying the number, SC-002's thirty
// seconds, and the same page for a signed-in person and a guest (FR-007, FR-008,
// FR-009, FR-037, FR-002, AC-008, AC-009, AC-010, AC-002, AC-044; T062).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
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

async function openSignIn(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/sign-in');
  await bootstrap;
}

async function signIn(page: Page, phone: string, secret: string): Promise<void> {
  const field = page.locator('input[autocomplete="tel-national"]');
  await field.fill(phone);
  await page.locator('input[type="password"]').fill(secret);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
}

test('the sign-in journey confirms in place within thirty seconds and never reveals which check failed', async ({
  page,
  context,
}) => {
  const phone = uniqueNationalNumber(3);
  const fullPhone = `+218${phone}`;

  // Seed one account through the product's own sign-up journey.
  const before = dispatchMark();
  await openSignUp(page);
  await expect(page.locator('.wf-password__policy')).toBeVisible();
  await fillSignUpForm(page, {
    fullName: 'نور الهدى',
    phone,
    password,
    city: 'طرابلس',
  });
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  await page.locator('input[autocomplete="one-time-code"]').fill(dispatch.code);
  await page.locator('button.wf-code-step__submit').click();
  await expect(page.getByText('حسابك جاهز، وأنت مسجل الدخول الآن.')).toBeVisible();

  // The signed-in person sees the sign-in page exactly as a guest does.
  await openSignIn(page);
  const signedInView = await page.locator('.bare-layout__card').innerText();
  const signedInTitle = await page.title();
  await context.clearCookies();
  await openSignIn(page);
  expect(await page.locator('.bare-layout__card').innerText()).toBe(signedInView);
  expect(await page.title()).toBe(signedInTitle);

  // No dial-code selector, and no code step anywhere on this page.
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('.wf-field__prefix')).toHaveText('+218');
  await expect(page.locator('input[autocomplete="one-time-code"]')).toHaveCount(0);
  // The sign-in form applies no password rule and states none (FR-051).
  await expect(page.locator('.wf-password__policy')).toHaveCount(0);

  const historyLength = await page.evaluate(() => history.length);
  expect(await page.evaluate(() => document.referrer)).toBe('');

  // The unknown number and the wrong password produce one text, and no lock hint.
  await signIn(page, uniqueNationalNumber(4), password);
  await expect(page.locator('.wf-message--alert')).toBeVisible();
  const unknownText = await page.locator('.wf-message--alert').innerText();

  await signIn(page, phone, 'the wrong password entirely');
  await expect(page.locator('.wf-message--alert')).toBeVisible();
  expect(await page.locator('.wf-message--alert').innerText()).toBe(unknownText);
  await expect(page.locator('.wf-message--alert')).toHaveText(
    'رقم الهاتف أو كلمة المرور غير صحيحة.',
  );
  for (const lockWord of ['مقفل', 'قفل الحساب', 'محاولات فاشلة', 'محظور']) {
    await expect(page.getByText(lockWord)).toHaveCount(0);
  }
  await expect(page.locator('.wf-code-step')).toHaveCount(0);

  // SC-002: the in-place confirmation inside thirty seconds.
  const startedAt = Date.now();
  await signIn(page, phone, password);
  await expect(page.locator('.wf-signed-in__heading')).toHaveText('تم تسجيل الدخول');
  await expect(page.getByText('أنت مسجل الدخول الآن.')).toBeVisible();
  // The terminal step has no field, so focus moves to its heading (AC-043).
  await expect(page.locator('.wf-signed-in__heading')).toBeFocused();
  expect(Date.now() - startedAt).toBeLessThan(30_000);

  // No navigation, history entry, referrer, or stored value carries the number.
  expect(new URL(page.url()).pathname).toBe('/auth/sign-in');
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
  // The number is never rendered as a whole in the browser's own data.
  expect(JSON.stringify(stored)).not.toContain(fullPhone);
});
