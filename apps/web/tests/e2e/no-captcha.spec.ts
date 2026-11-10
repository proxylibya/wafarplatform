// The three bare pages present no CAPTCHA of any kind: no widget, no iframe, no
// challenge text, and no script from a challenge provider (FR-030, AC-034; T077).
import { expect, test } from '@playwright/test';

const pages = ['/auth/sign-up', '/auth/sign-in', '/auth/forgot-password'];

for (const path of pages) {
  test(`${path} presents no CAPTCHA`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const html = await page.content();
    expect(html).not.toMatch(/recaptcha|hcaptcha|turnstile|captcha/i);

    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('[class*="captcha" i], [id*="captcha" i], [name*="captcha" i]')).toHaveCount(0);
    await expect(
      page.getByText(/كابتشا|تحقق من أنك لست روبوت|لست روبوتًا/),
    ).toHaveCount(0);
  });
}
