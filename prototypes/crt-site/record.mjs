// Re-record public/prologue/prologue.mp4 (the phones' prologue) from the prototype page, frame by frame.
//   python3 prototypes/crt-site/serve.py   (from the repo root)
//   npm i --no-save puppeteer-core && node prototypes/crt-site/record.mjs
// Needs Google Chrome and ffmpeg. Stops where the site hands off to the board.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [W, H, FPS] = [960, 540, 24];
const DIR = 'prototypes/crt-site/.frames';
fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--window-size=${W},${H}`],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/prototypes/crt-site/index.html?t=0&nostudio', { waitUntil: 'load' });
await page.waitForFunction(() => window.prologueSeek, { timeout: 120000 });
await page.addStyleTag({ content: '.lil-gui, #hint, .prologue-sound, .tuning-save { display: none !important; }' });
const { end } = await page.evaluate(() => {
  const T = window.prologueTimes;
  let t = 0; while (T.story(t) < T.HANDOFF) t += 0.01;
  return { end: t + 0.1 };
});
const n = Math.ceil(end * FPS);
console.log('frames', n, 'seconds', end.toFixed(2));
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => new Promise((r) => { window.prologueSeek(t); requestAnimationFrame(() => requestAnimationFrame(r)); }), i / FPS);
  await page.screenshot({ path: `${DIR}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  if (i % 60 === 0) console.log(i);
}
await browser.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${DIR}/%04d.jpg`, '-vf', 'scale=854:480',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '30', '-preset', 'veryslow', '-movflags', '+faststart', 'public/prologue/prologue.mp4']);
fs.rmSync(DIR, { recursive: true, force: true });
console.log('wrote public/prologue/prologue.mp4');
