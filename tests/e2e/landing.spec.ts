import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page with Say Hi button', async ({ page }) => {
    await page.goto('/');

    // Wait for landing to appear
    await expect(page.getByRole('button', { name: /say hi/i })).toBeVisible();
  });

  test('should transition to main layout after clicking Say Hi', async ({ page }) => {
    await page.goto('/');

    // Click Say Hi button
    await page.getByRole('button', { name: /say hi/i }).click();

    // Wait for transition and check header appears
    await expect(page.locator('header')).toBeVisible({ timeout: 5000 });
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();

    // Check meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);
  });
});

test.describe('Scrollable Page', () => {
  test('should load scrollable page', async ({ page }) => {
    await page.goto('/scrollable');

    // Should have main sections
    await expect(page.locator('main')).toBeVisible();
  });
});
