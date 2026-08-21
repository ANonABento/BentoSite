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
    // Touch-capable projects must open the card by tapping, not by a synthetic
    // mouse click: the grid's pan gesture owns pointer input, and tapping is
    // the interaction a tablet visitor actually performs. A mouse click under
    // touch emulation passes through a different code path and told us nothing.
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await firstPhoto.tap();
    } else {
      await firstPhoto.click();
    }
    await expect(page.getByRole('dialog', { name: /lightbox/i })).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('category chips filter the projects grid and the count is a content count', async ({ page }) => {
    await page.goto('/projects');

    await expect(
      page.getByRole('application', { name: /bentos \/ projects interactive grid/i }),
    ).toBeVisible({ timeout: 15000 });

    // The All chip reports how many projects exist, not how many card
    // instances the canvas cloned to fill itself. It switches to "All (x/y)"
    // once a filter is applied.
    const allChip = page.getByRole('button', { name: /^All \(/ });
    await expect(allChip).toBeVisible();
    const total = Number((await allChip.innerText()).match(/\((\d+)\)/)![1]);
    expect(total).toBeGreaterThan(0);

    // Clicking a category chip must actually filter. This was silently dead:
    // the chip row swallowed pointerdown for native scrolling, and the click
    // that followed never reached React.
    // The chip row scrolls horizontally and most categories start off-view, so
    // bring it into its row first — the same thing a visitor does by swiping.
    const category = page.getByRole('button', { name: 'Hackathon', exact: true });
    await category.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await expect(category).toBeVisible();
    // Touch contexts must tap: a synthetic mouse click takes a different path.
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (hasTouch) {
      await category.tap();
    } else {
      await category.click();
    }

    await expect(allChip).toHaveText(/^All \(\d+\/\d+\)$/, { timeout: 5000 });
    const [shown, outOf] = (await allChip.innerText())
      .match(/\((\d+)\/(\d+)\)/)!
      .slice(1)
      .map(Number);
    expect(outOf, 'filtering must not change the total').toBe(total);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
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
