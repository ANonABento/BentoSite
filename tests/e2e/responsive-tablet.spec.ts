import { test, expect } from '@playwright/test';
import { gotoDashboard } from './helpers';

test.use({ viewport: { width: 768, height: 1024 } });

test.describe('Tablet View', () => {
  test('should work on tablet size', async ({ page }) => {
    await gotoDashboard(page);
    await expect(page.locator('header')).toBeVisible();
  });
});
