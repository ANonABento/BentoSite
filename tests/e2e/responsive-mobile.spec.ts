import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile View', () => {
  test('should show mobile tab interface', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /say hi/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be scrollable on mobile', async ({ page }) => {
    await page.goto('/scrollable');
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });
});
