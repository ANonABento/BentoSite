import { test, expect, devices } from '@playwright/test';
import { gotoDashboard } from './helpers';

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile View', () => {
  test('should show mobile tab interface', async ({ page }) => {
    await gotoDashboard(page);
    await expect(page.getByRole('tab', { name: /viewfinder/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /terminal/i })).toBeVisible();
  });

  test('should be scrollable on mobile', async ({ page }) => {
    await page.goto('/scrollable');
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });
});
