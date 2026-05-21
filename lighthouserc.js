const lighthouseBaseUrl = 'http://127.0.0.1:3001';

module.exports = {
  ci: {
    collect: {
      startServerCommand:
        'node_modules/.bin/next start --hostname 127.0.0.1 --port 3001',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120000,
      url: [
        `${lighthouseBaseUrl}/`,
        `${lighthouseBaseUrl}/projects`,
        `${lighthouseBaseUrl}/playground`,
        `${lighthouseBaseUrl}/playground/2048`,
        `${lighthouseBaseUrl}/playground/aim-trainer`,
        `${lighthouseBaseUrl}/playground/minesweeper`,
        `${lighthouseBaseUrl}/playground/pacman`,
        `${lighthouseBaseUrl}/playground/reaction`,
        `${lighthouseBaseUrl}/playground/rhythm`,
        `${lighthouseBaseUrl}/playground/sorting`,
        `${lighthouseBaseUrl}/playground/soundboard`,
        `${lighthouseBaseUrl}/playground/typing`,
        `${lighthouseBaseUrl}/photography`,
        `${lighthouseBaseUrl}/scrollable`,
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Extend timeout for 3D content
        maxWaitForLoad: 45000,
        // Skip network throttling for portfolio (3D assets)
        throttlingMethod: 'provided',
      },
    },
    assert: {
      assertions: {
        // Category scores that are stable for this animation-heavy portfolio.
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Critical rendering metrics. TTI/TBT are intentionally excluded:
        // looping 3D/canvas/animation routes can prevent Lighthouse from
        // finding a CPU-idle window and produce NaN assertions.
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'speed-index': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],

        // Accessibility must-haves
        'color-contrast': 'warn',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
