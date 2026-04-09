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
        `${lighthouseBaseUrl}/scrollable`,
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        // Extend timeout for 3D content
        maxWaitForLoad: 45000,
        // Skip network throttling for portfolio (3D assets)
        throttlingMethod: 'provided',
      },
    },
    assert: {
      assertions: {
        // Performance (relaxed for 3D portfolio)
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Critical Web Vitals (relaxed for 3D)
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],

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
