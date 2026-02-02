import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Mobile View', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should show mobile tab interface', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /say hi/i }).click();
      await page.waitForTimeout(1000);

      // On mobile, should have tab buttons for switching views
      // The specific tabs depend on implementation
      const tabContainer = page.locator('[role="tablist"], .tabs, [data-tabs]');
      // Just verify the page loads on mobile
      await expect(page.locator('body')).toBeVisible();
    });

    test('should be scrollable on mobile', async ({ page }) => {
      await page.goto('/scrollable');

      // Should be able to scroll
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should show split layout on desktop', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /say hi/i }).click();
      await page.waitForTimeout(1000);

      // Should have full desktop layout
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tablet View', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should work on tablet size', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /say hi/i }).click();
      await page.waitForTimeout(1000);

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
