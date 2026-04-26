import { test, expect } from '@playwright/test';
import { gotoDashboard } from './helpers';

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Desktop View', () => {
  test('should show split layout on desktop', async ({ page }) => {
    await gotoDashboard(page);
    await expect(page.getByRole('link', { name: /view projects/i })).toBeVisible();
  });
});
