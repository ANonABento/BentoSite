import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const baseURL = `http://127.0.0.1:${port}`;
const shouldUseDevServer = process.env.PLAYWRIGHT_USE_DEV_SERVER === 'true';
const webServerCommand = shouldUseDevServer
  ? `node_modules/.bin/next dev --hostname 127.0.0.1 --port ${port}`
  : process.env.CI
    ? `node_modules/.bin/next start --hostname 127.0.0.1 --port ${port}`
    : `npm run build && node_modules/.bin/next start --hostname 127.0.0.1 --port ${port}`;

const PLAYWRIGHT_CACHE_DIR = path.join(os.homedir(), '.cache', 'ms-playwright');

function findCachedChromium() {
  if (!fs.existsSync(PLAYWRIGHT_CACHE_DIR)) return undefined;

  return fs.readdirSync(PLAYWRIGHT_CACHE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
    .map((entry) => {
      const executablePath = path.join(PLAYWRIGHT_CACHE_DIR, entry.name, 'chrome-linux64', 'chrome');
      const revision = Number(entry.name.replace('chromium-', ''));
      return { executablePath, revision };
    })
    .filter((candidate) => fs.existsSync(candidate.executablePath))
    .sort((a, b) => b.revision - a.revision)[0]?.executablePath;
}

function resolveChromiumExecutablePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const executablePath = chromium.executablePath();
  if (fs.existsSync(executablePath)) return undefined;

  return findCachedChromium();
}

const chromiumExecutablePath = resolveChromiumExecutablePath();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Keep CI parallelism modest because cold Next.js compiles can otherwise
  // cascade into transient connection failures.
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'html',
  expect: {
    // Bump from the 5s default to tolerate first-hit dev compiles and the
    // boot screen's ~1–2s preload + typewriter animation.
    timeout: 15000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : undefined,
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
