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

// Slow ALL animations 8× so the flash window (500ms → 4s) is screenshot-able.
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 8s !important;
      transition-duration: 8s !important;
    }
  `,
});

await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' });
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 8s !important;
      transition-duration: 8s !important;
    }
  `,
});
// Also slow framer-motion via CSS variable
await page.evaluate(() => {
  const slow = (factor) => {
    document.querySelectorAll('[style*="--motion-duration"]').forEach((el) => {
      el.style.setProperty('--motion-duration', `${factor}s`);
    });
  };
  // Try to find motion divs and slow them via CSS
});

await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/boot-flash-1.png' });

await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/boot-flash-2.png' });

await browser.close();
console.log('Captured /tmp/boot-flash-{1,2}.png');
