// The in-progress guard and the inline failure on the sign-up page: the submit
// control disabled while a request is in flight, the refusal announced as an
// alert on the step that was submitted, every typed value kept except the
// password, and the client's own field rule (FR-038, FR-040, FR-041, AC-041,
// AC-043; T040).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearRateLimits } from '../support/seed';

// The origin's account-creation window is shared by the whole suite, so each
// scenario starts with a full budget.
test.beforeEach(async () => {
  await clearRateLimits();
});

/** Waits for the render bootstrap, which the page issues once hydration is done. */
async function openSignUp(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/sign-up');
  await bootstrap;
}

async function fillSignUp(page: Page): Promise<void> {
  await page.locator('input[autocomplete="name"]').fill('محمد علي');
  await page.locator('input[autocomplete="tel-national"]').fill('912345678');
  await page.locator('input[type="password"]').fill('correct horse battery staple');
  await page.locator('#wf-city-input').fill('طرابلس');
}

test('a field rule refuses before any request and stays on the form', async ({ page }) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/auth/sign-up')) requests += 1;
  });
  await openSignUp(page);

  await page.locator('input[autocomplete="tel-national"]').fill('912345678');
  await page.locator('input[type="password"]').fill('short');
  await page.locator('#wf-city-input').fill('طرابلس');
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();

  await expect(page.locator('.wf-field__error').first()).toBeVisible();
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');
  expect(requests).toBe(0);
});

test('a refusal keeps the step, keeps the typed values, and clears the password', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/sign-up', async (route) => {
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

  await openSignUp(page);
  await fillSignUp(page);

  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();

  // The in-progress guard disables the control while the request is in flight;
  // the control's accessible name changes with the state, so the class is the
  // stable handle.
  const submit = page.locator('button.wf-submit');
  await expect(submit).toBeDisabled();

  // The refusal is an alert on the step that was submitted.
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  await expect(page.locator('.bare-layout__title')).toHaveText('إنشاء حساب');

  // Every typed value stays except the password, which is never re-displayed.
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue('محمد علي');
  await expect(page.locator('input[autocomplete="tel-national"]')).toHaveValue('912345678');
  await expect(page.locator('#wf-city-input')).toHaveValue('طرابلس');
  await expect(page.locator('input[type="password"]')).toHaveValue('');
  await expect(submit).toBeEnabled();
});
