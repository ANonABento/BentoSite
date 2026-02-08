import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 768, height: 1024 } });

test.describe('Tablet View', () => {
  test('should work on tablet size', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /say hi/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
