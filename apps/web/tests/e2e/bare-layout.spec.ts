// The three bare pages: no frame, the non-interactive wordmark, the page title,
// the browser title, the cross-links, and the document's direction and language,
// rendering the same for a guest and a signed-in person (FR-021, FR-036, FR-041,
// FR-026, AC-023, AC-039, AC-044, AC-028; T099).
import { expect, test } from '@playwright/test';

const pages = [
  {
    path: '/auth/sign-up',
    title: 'إنشاء حساب',
    links: ['/auth/sign-in'],
  },
  {
    path: '/auth/sign-in',
    title: 'تسجيل الدخول',
    links: ['/auth/sign-up', '/auth/forgot-password'],
  },
  {
    path: '/auth/forgot-password',
    title: 'نسيت كلمة المرور',
    links: ['/auth/sign-in'],
  },
] as const;

for (const entry of pages) {
  test(`${entry.path} carries the bare layout`, async ({ page }) => {
    await page.goto(entry.path);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page).toHaveTitle(`${entry.title} — منصة وفر`);

    // The wordmark above the title, not a control.
    const mark = page.locator('.bare-layout__mark .wf-wordmark');
    await expect(mark).toBeVisible();
    await expect(mark).toHaveAttribute('aria-label', 'منصة وفر');
    await expect(page.locator('.bare-layout__mark a')).toHaveCount(0);

    // The page title above the card.
    await expect(page.locator('.bare-layout__title')).toHaveText(entry.title);

    // The cross-links, and only those.
    for (const href of entry.links) {
      await expect(page.locator(`.bare-layout__links a[href="${href}"]`).first()).toBeVisible();
    }

    // No frame: no header, no sidebar, no bottom bar, no footer band.
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.locator('.wf-shell-header')).toHaveCount(0);
    await expect(page.locator('.wf-shell-sidebar')).toHaveCount(0);
    await expect(page.locator('.wf-shell-bottom-bar')).toHaveCount(0);
    await expect(page.locator('.wf-shell-footer')).toHaveCount(0);

    // No horizontal page scroll at the 320 CSS px floor, and the bare page's
    // wordmark keeps the full «منصة وفر» form there (FR-021, AC-023).
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(mark.locator('.wf-wordmark__full')).toBeVisible();
    await expect(mark.locator('.wf-wordmark__short')).toBeHidden();
    const overflow = await page.evaluate(
      () => document.scrollingElement !== null && document.scrollingElement.scrollWidth > 320,
    );
    expect(overflow).toBe(false);
  });
}
