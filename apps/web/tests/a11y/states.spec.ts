// The automated accessibility scan over all 32 delivered states at 320 and
// 1280 CSS px in both appearances - 128 scans - with the WCAG 2.2 AA rule set
// and the no-horizontal-scroll check at the 320 floor (FR-040, AC-043, SC-006;
// T115, T194, T198).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { scenarios, settle, type Appearance } from '../support/scenarios';

const widths = [320, 1280] as const;
const appearances: readonly Appearance[] = ['light', 'dark'];

for (const scenario of scenarios) {
  test(`${scenario.page} ${scenario.state} scans at both widths and appearances`, async ({
    page,
  }) => {
    await scenario.prepare();
    await page.setViewportSize({ width: 320, height: 900 });
    await scenario.drive(page);

    // AC-043: the state's focus move landed where the state fixes it, and its
    // polite region carries the recorded text.
    if (scenario.focus !== undefined) {
      await expect(page.locator(scenario.focus).first()).toBeFocused();
    }
    if (scenario.announcement !== undefined) {
      await expect(
        page.getByRole('status').filter({ hasText: scenario.announcement }).first(),
      ).toBeVisible();
    }

    for (const width of widths) {
      for (const appearance of appearances) {
        await page.setViewportSize({ width, height: 900 });
        await settle(page, appearance);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          results.violations,
          `${scenario.page} ${scenario.state} at ${String(width)} in ${appearance}:\n` +
            results.violations
              .map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`)
              .join('\n'),
        ).toEqual([]);

        // The 320 CSS px reflow floor carries no horizontal scroll.
        if (width === 320) {
          const overflowing = await page.evaluate(
            () =>
              document.scrollingElement !== null &&
              document.scrollingElement.scrollWidth > 320,
          );
          expect(overflowing).toBe(false);
        }
      }
    }
  });
}
