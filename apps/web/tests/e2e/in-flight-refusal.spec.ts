// A refusal produced while another request from the same page is in flight: the
// disabled submit control starts no second dispatch, the refusal renders on the
// step submitted as an alert with focus on the field it names, the in-progress
// state clears, every non-password value stays, and a FORM_TOO_FAST retry takes
// the refreshed bootstrap pair with no reload (FR-029, FR-040, AC-031, AC-043;
// T173).
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
  fullName: 'سلمى القذافي',
  phone: uniqueNationalNumber(11),
  password,
  city: 'الزاوية',
};

test('a refusal arriving while the request is in flight stays on the submitted step', async ({
  page,
}) => {
  await openSignUp(page);
  await fillSignUpForm(page, values);

  let requests = 0;
  await page.route('**/api/v1/auth/sign-up', async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'INVALID_FULL_NAME',
          field: 'fullName',
          reason: 'empty',
          retryable: false,
        },
      }),
    });
  });

  await submitSignUp(page);
  const submit = page.locator('button.wf-submit');
  await expect(submit).toBeDisabled();

  // A second submission cannot start while the first is in flight.
  await page.locator('input[autocomplete="name"]').press('Enter');
  await page.waitForTimeout(300);
  expect(requests).toBe(1);

  // The refusal is an alert on the step that was submitted.
  const alert = page.locator('.wf-sign-up [role="alert"]').first();
  await expect(alert).toBeVisible();
  await expect(alert).toHaveText('أدخل الاسم الكامل.');
  await expect(page.locator('.wf-code-step')).toHaveCount(0);
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');

  // The in-progress state clears, and the guard and the refusal agree.
  await expect(submit).toBeEnabled();
  await expect(page.locator('.wf-sign-up .wf-submit')).toHaveText('إرسال رمز التحقق');

  // Every non-password value stays; the password is never re-displayed.
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue(
    values.fullName,
  );
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue(
    values.phone,
  );
  await expect(page.locator('#wf-city-input')).toHaveValue(values.city);
  await expect(page.locator('input[type="password"]')).toHaveValue('');

  // Focus is on the field the refusal names.
  await expect(page.locator('input[autocomplete="name"]')).toBeFocused();
});

test('a FORM_TOO_FAST retry takes the fresh pair without a reload', async ({ page }) => {
  let csrfResponses = 0;
  page.on('response', (response) => {
    if (response.url().endsWith('/api/v1/auth/csrf')) csrfResponses += 1;
  });
  await openSignUp(page);
  await fillSignUpForm(page, { ...values, phone: uniqueNationalNumber(12) });
  const historyLength = await page.evaluate(() => history.length);
  let requests = 0;
  const stamps: string[] = [];
  await page.route('**/api/v1/auth/sign-up', async (route) => {
    requests += 1;
    const body = route.request().postDataJSON() as { formStamp?: string };
    stamps.push(body.formStamp ?? '');
    if (requests === 1) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'FORM_TOO_FAST', field: 'formStamp', retryable: true },
        }),
      });
      return;
    }
    await route.continue();
  });

  const before = dispatchMark();
  await submitSignUp(page);
  await expect(page.locator('.wf-sign-up [role="alert"]').first()).toHaveText(
    'أرسلت النموذج بسرعة أكبر من المعتاد. أعد المحاولة.',
  );
  await expect(page.locator('.wf-sign-up [role="alert"]').first()).toHaveAttribute(
    'role',
    'alert',
  );

  // The retry needs the refreshed stamp to age and the cleared password typed
  // again; both happen in place, with no reload.
  await page.waitForTimeout(3_100);
  await page.locator('input[type="password"]').fill(password);
  await submitSignUp(page);
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  expect(dispatch.code).toMatch(/^\d{6}$/);

  // Two attempts, a second bootstrap, and a different stamp: no reload.
  expect(requests).toBe(2);
  expect(csrfResponses).toBeGreaterThanOrEqual(2);
  expect(stamps[1]).not.toBe(stamps[0]);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(new URL(page.url()).pathname).toBe('/auth/sign-up');
});
