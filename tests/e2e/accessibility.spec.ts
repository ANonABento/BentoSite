import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('landing page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('canvas') // Exclude Three.js canvas (not applicable)
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('main layout should have no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /say hi/i }).click();
    await page.waitForTimeout(1500); // Wait for transition

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('canvas') // Exclude Three.js canvas
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('scrollable page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/scrollable');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('canvas') // Exclude Three.js canvas
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
