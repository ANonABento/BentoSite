import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  // Run the suite against the production server. `next dev` can become
  // transiently unavailable between browser projects while compiling routes,
  // which shows up as intermittent ERR_CONNECTION_REFUSED/NS_ERROR_CONNECTION_REFUSED.
  workers: 2,
  reporter: isCI ? 'github' : 'html',
  expect: {
    // Bump from the 5s default to tolerate the boot screen's preload and
    // typewriter animation on slower browsers.
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3000',
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
    command: isCI
      ? 'node_modules/.bin/next start'
      : 'node_modules/.bin/next build && node_modules/.bin/next start',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 180 * 1000,
  },
});
