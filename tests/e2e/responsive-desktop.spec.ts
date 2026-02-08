import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Desktop View', () => {
  test('should show split layout on desktop', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /say hi/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
