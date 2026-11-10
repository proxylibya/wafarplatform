// The visual baseline set: every state of contracts/ui-contracts.md §10 at 1280
// and 375 CSS px in both appearances, plus the 320 light reflow capture per page
// (T116, T201, FR-021, AC-023; ADR-129's baseline chain). Every state is driven
// through the local API and the database, so a capture records the named state
// and nothing the database happened to hold. Playwright sanitizes a state
// token's underscore to a hyphen in the file name (`expired_notice` becomes
// `expired-notice`); the test title keeps the contract's state name.
import { expect, test } from '@playwright/test';
import { scenarios, settle, type Appearance } from '../support/scenarios';

const widths = [1280, 375] as const;
const appearances: readonly Appearance[] = ['light', 'dark'];

for (const scenario of scenarios) {
  test(`${scenario.page} ${scenario.state} captures at both widths and appearances`, async ({
    page,
  }) => {
    await scenario.prepare();
    await page.setViewportSize({ width: 1280, height: 900 });
    await scenario.drive(page);

    for (const width of widths) {
      for (const appearance of appearances) {
        await page.setViewportSize({ width, height: 900 });
        await settle(page, appearance);
        await expect(page).toHaveScreenshot(
          `${scenario.page}--${scenario.state}--${String(width)}--${appearance}.png`,
          { fullPage: true, animations: 'disabled', caret: 'hide' },
        );
      }
    }
  });
}

// The 320 CSS px reflow capture: one per page, in the light appearance.
for (const scenario of scenarios.filter((entry) => entry.state === 'form')) {
  test(`${scenario.page} reflow at 320 in light`, async ({ page }) => {
    await scenario.prepare();
    await page.setViewportSize({ width: 320, height: 900 });
    await scenario.drive(page);
    await settle(page, 'light');
    await expect(page).toHaveScreenshot(
      `${scenario.page}--reflow--320--light.png`,
      { fullPage: true, animations: 'disabled', caret: 'hide' },
    );
  });
}
