import { expect, Page } from '@playwright/test';

export async function gotoDashboard(page: Page) {
  await page.goto('/?view=dashboard');
  await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
}

export async function openTerminalIfTabbed(page: Page) {
  const terminalTab = page.getByRole('button', { name: /terminal/i });

  if (await terminalTab.isVisible()) {
    await terminalTab.click();
  }
}
