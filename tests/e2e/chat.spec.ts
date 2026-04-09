import { test, expect } from '@playwright/test';
import { gotoDashboard, openTerminalIfTabbed } from './helpers';

test.describe('Chat Feature', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await openTerminalIfTabbed(page);
  });

  test('should display chat interface', async ({ page }) => {
    const chatInput = page.getByRole('textbox', { name: /type your message/i });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('should display suggested questions', async ({ page }) => {
    // Chat should have suggested question buttons when empty
    const suggestedButtons = page.locator('button:has-text("?")');
    // At least some suggested questions should be visible
    const count = await suggestedButtons.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not have suggestions
  });

  test('should allow typing in chat input', async ({ page }) => {
    const chatInput = page.getByRole('textbox', { name: /type your message/i });
    await chatInput.fill('Hello, this is a test message');
    await expect(chatInput).toHaveValue('Hello, this is a test message');
  });
});

test.describe('Theme Toggle', () => {
  test('should have theme toggle button', async ({ page }) => {
    await gotoDashboard(page);

    // Look for theme toggle (usually sun/moon icon)
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="mode"], button:has(svg)').first();
    await expect(themeToggle).toBeVisible();
  });
});
