import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const baseURL = `http://127.0.0.1:${port}`;
const shouldUseDevServer = process.env.PLAYWRIGHT_USE_DEV_SERVER === 'true';
const webServerCommand = shouldUseDevServer
  ? `node_modules/.bin/next dev --hostname 127.0.0.1 --port ${port}`
  : process.env.CI
    ? `node_modules/.bin/next start --hostname 127.0.0.1 --port ${port}`
    : `npm run build && node_modules/.bin/next start --hostname 127.0.0.1 --port ${port}`;

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
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
