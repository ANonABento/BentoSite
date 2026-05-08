import { test, expect } from '@playwright/test';
import { gotoDashboard } from './helpers';

test.describe('Landing Page', () => {
  test('should display the bentOS boot screen', async ({ page }) => {
    await page.goto('/');
    const bootScreen = page.locator('.crt-shell');

    await expect(bootScreen).toBeVisible();
    await expect(bootScreen.getByText('ADMIN', { exact: true })).toBeVisible();
    await expect(bootScreen.getByText('ANonABento // Portfolio')).toBeVisible();
    await expect(bootScreen.getByText('CRT MODE')).toBeVisible();
  });

  test('should render the dashboard view directly from the query param', async ({ page }) => {
    await gotoDashboard(page);
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
