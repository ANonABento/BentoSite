import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:3100/boot-font-lab.html';
const out = process.argv[3] ?? '/tmp/bentos-font-lab.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();

console.log(`Captured ${url} -> ${out}`);
