import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.addInitScript(() => {
  try {
    sessionStorage.removeItem('bentOS.bootComplete');
  } catch (_) {
    // ignore
  }
});

await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('h1[aria-label="bentOS"]', { timeout: 15000 });
await page.waitForTimeout(900);

// Full-screen capture for layout review.
await page.screenshot({ path: '/tmp/bentos-boot-real.png', fullPage: false });

// Tight crop around the wordmark to verify pixel mask landed.
const title = await page.locator('h1[aria-label="bentOS"]');
const box = await title.boundingBox();
if (box) {
  const pad = 30;
  await page.screenshot({
    path: '/tmp/bentos-boot-wordmark.png',
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
  });
}

await browser.close();
console.log('Captured /tmp/bentos-boot-real.png and /tmp/bentos-boot-wordmark.png');
