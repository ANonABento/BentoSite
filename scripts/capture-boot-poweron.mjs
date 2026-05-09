import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
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

// Capture five moments: the star flash, the chrome typing, the logo typing,
// the subtitle typing, and the bar progressing.
await page.waitForTimeout(60);
await page.screenshot({ path: '/tmp/boot-poweron-1.png' });

await page.waitForTimeout(160);
await page.screenshot({ path: '/tmp/boot-poweron-2.png' });

await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/boot-poweron-3.png' });

await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/boot-poweron-4.png' });

await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/boot-poweron-5.png' });

await browser.close();
console.log('Captured /tmp/boot-poweron-{1,2,3}.png');
