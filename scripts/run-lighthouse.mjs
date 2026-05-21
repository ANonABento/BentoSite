// Run Lighthouse CI with a deterministic Chromium binary.
//
// CI may provide Chrome through browser-actions/setup-chrome. Local machines
// often do not have Chrome on PATH, but this repo already installs Playwright
// for E2E. Fall back to Playwright's Chromium so `npm run lighthouse` is a
// reproducible production gate.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const lhciBin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'lhci.cmd' : 'lhci');
const PLAYWRIGHT_CACHE_DIR = path.join(os.homedir(), '.cache', 'ms-playwright');

function findCachedChromium() {
  if (!fs.existsSync(PLAYWRIGHT_CACHE_DIR)) return undefined;

  const candidates = fs.readdirSync(PLAYWRIGHT_CACHE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
    .map((entry) => {
      const executablePath = path.join(PLAYWRIGHT_CACHE_DIR, entry.name, 'chrome-linux64', 'chrome');
      const revision = Number(entry.name.replace('chromium-', ''));
      return { executablePath, revision };
    })
    .filter((candidate) => fs.existsSync(candidate.executablePath))
    .sort((a, b) => b.revision - a.revision);

  return candidates[0]?.executablePath;
}

function resolveChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const executablePath = chromium.executablePath();
  if (fs.existsSync(executablePath)) return executablePath;

  return findCachedChromium();
}

const chromePath = resolveChromePath();
const child = spawn(lhciBin, ['autorun'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    ...(chromePath ? { CHROME_PATH: chromePath } : {}),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
