import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.E2E_PORT ?? '3100';
const baseURL = `http://localhost:${e2ePort}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Local runs hit `npm run dev`, whose first request per route triggers a
  // cold Next.js compile. Parallel workers racing each other on uncompiled
  // routes across five browser projects can exhaust the dev server
  // (observed: ERR_CONNECTION_REFUSED after ~1m of parallel load), so run
  // serially locally. CI uses `npm run start` (prebuilt) where parallelism
  // is safe.
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
      use: { ...devices['Desktop Chrome'] },
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
    command: process.env.CI
      ? `PORT=${e2ePort} node_modules/.bin/next start`
      : `PORT=${e2ePort} node_modules/.bin/next dev`,
    url: baseURL,
    reuseExistingServer,
    timeout: 120 * 1000,
  },
});
