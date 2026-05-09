import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

// Force the boot splash to show by clearing the session flag before nav.
await page.addInitScript(() => {
  try {
    sessionStorage.removeItem('bentOS.bootComplete');
  } catch (_) {
    // ignore
  }
});

await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' });

// Boot wordmark uses the bentOS heading. Wait for it, then let the loading bar
// progress a bit to match the lab's static mid-loading composition.
await page.waitForSelector('h1[aria-label="bentOS"]', { timeout: 15000 });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/bentos-boot-real.png', fullPage: false });

await browser.close();
console.log('Captured /tmp/bentos-boot-real.png');
