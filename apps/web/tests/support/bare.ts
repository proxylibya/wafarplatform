// The bare flows' shared browser steps: the render bootstrap that marks
// hydration, the sign-up form's fields, and the fixed prefix the pages always
// render (FR-002, FR-038; T039).
import type { Page } from '@playwright/test';

/** Waits for the render bootstrap, which the page issues once hydration is done. */
export async function openSignUp(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto('/auth/sign-up');
  await bootstrap;
  // The form guard accepts the stamp only once it is three seconds old.
  await page.waitForTimeout(3_100);
}

/** Waits for the next render bootstrap after a reload. */
export async function reloadSignUp(page: Page): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.reload();
  await bootstrap;
  // The reload issues a fresh stamp, which the guard accepts after three seconds.
  await page.waitForTimeout(3_100);
}

export interface SignUpValues {
  fullName: string;
  phone: string;
  password: string;
  city: string;
  shopName?: string;
}

export async function fillSignUpForm(page: Page, values: SignUpValues): Promise<void> {
  await page.locator('input[autocomplete="name"]').fill(values.fullName);
  await page.locator('input[autocomplete="tel-national"]').fill(values.phone);
  await page.locator('input[type="password"]').fill(values.password);
  await page.locator('#wf-city-input').fill(values.city);
  if (values.shopName !== undefined) {
    await page.locator('input[autocomplete="organization"]').fill(values.shopName);
  }
}

export async function submitSignUp(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
}

/** A national number unique to the run, inside a listed Libyan mobile prefix. */
export function uniqueNationalNumber(salt = 0): string {
  const tail = String((Date.now() + salt * 1_000_003) % 10_000_000).padStart(7, '0');
  return `94${tail}`;
}
