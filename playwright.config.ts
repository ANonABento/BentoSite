import { defineConfig, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';

function getAvailablePort(preferredPort: number) {
  const script = `
const net = require('node:net');
const preferredPort = Number(process.argv[1]);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

(async () => {
  for (let port = preferredPort; port < preferredPort + 100; port += 1) {
    if (await isPortAvailable(port)) {
      process.stdout.write(String(port));
      return;
    }
  }

  process.stderr.write('No available local port found');
  process.exit(1);
})();
`;

  return Number(
    execFileSync(process.execPath, ['-e', script, String(preferredPort)], {
      encoding: 'utf8',
    }),
  );
}

const port = process.env.PORT
  ? Number(process.env.PORT)
  : getAvailablePort(3000);
const baseURL = `http://127.0.0.1:${port}`;
const shouldUseDevServer = process.env.PLAYWRIGHT_USE_DEV_SERVER === 'true';
const webServerCommand = shouldUseDevServer
  ? `npm run dev -- -p ${port}`
  : process.env.CI
    ? `npm run start -- -p ${port}`
    : `npm run build && npm run start -- -p ${port}`;

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
