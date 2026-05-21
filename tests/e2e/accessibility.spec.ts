import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoDashboard } from './helpers';

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
    await gotoDashboard(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('canvas') // Exclude Three.js canvas
      .disableRules([
        'nested-interactive', // 3D viewer controls have complex nested buttons
        'color-contrast', // Known issues in light mode - tracked separately
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('scrollable page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/scrollable');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('canvas') // Exclude Three.js canvas
      .disableRules([
        'color-contrast', // Known issues in light mode - tracked separately
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  for (const route of ['/projects', '/photography', '/playground']) {
    test(`${route} should have no critical a11y violations`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('#main-content')).toBeVisible({ timeout: 15000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('canvas')
        .disableRules([
          'color-contrast', // Theme contrast is tracked separately from structural a11y.
        ])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
