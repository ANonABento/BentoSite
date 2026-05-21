import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Public Content Routes', () => {
  test('projects grid loads searchable project cards', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/projects');

    await expect(
      page.getByRole('application', { name: /bentos \/ projects interactive grid/i }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('textbox', { name: /search cards/i })).toBeVisible();
    await expect(page.locator('[aria-label^="Open "]').first()).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('photography grid loads photos and opens the lightbox', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/photography');

    await expect(
      page.getByRole('application', { name: /bentos \/ photography interactive grid/i }),
    ).toBeVisible({ timeout: 15000 });
    const firstPhoto = page.locator('[aria-label*=" — "]').first();
    await expect(firstPhoto).toBeVisible();
    await firstPhoto.click({ force: true });
    await expect(page.getByRole('dialog', { name: /lightbox/i })).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('playground grid loads playable game cards', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/playground');

    await expect(
      page.getByRole('application', { name: /bentos \/ playground interactive grid/i }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('textbox', { name: /search cards/i })).toBeVisible();
    await expect(page.locator('[aria-label="Reaction"]').first()).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('aim trainer route starts the lightweight target arena', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/playground/aim-trainer');

    await expect(page.getByRole('heading', { name: 'Aim Trainer', level: 1 })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /start aim training/i }).click();
    await expect(page.getByRole('button', { name: /aim trainer arena/i })).toBeVisible();
    await expect(page.getByText(/empty clicks count as misses/i)).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});
