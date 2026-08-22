import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js needs inline scripts for hydration/runtime chunks and the theme
  // bootstrap. `unsafe-eval` is required in dev/Turbopack and tolerated here
  // because this site does not accept user-authored script.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  // No CDN in script-src: nothing in the app or in its 3D dependencies
  // (@react-three/drei, three-stdlib) loads from one, and an unused allowance
  // is just a place a compromised or injected script could fetch code from.
  "worker-src 'self' blob:",
  "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com https://generativelanguage.googleapis.com https://api.openai.com",
  "frame-src 'self' https:",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy
  }
];

// The Studio (`/studio` + `/api/studio/*`) is a local authoring tool, not part
// of the site. Its files are named `*.dev.tsx` / `*.dev.ts` and only registered
// as routes in development, so a production build contains no studio route, no
// studio bundle, and no filesystem-writing API surface at all.
const STUDIO_PAGE_EXTENSIONS = ['dev.tsx', 'dev.ts'];
const BASE_PAGE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Stamped into the boot screen's `SYS <date>` line. It used to be the literal
 * `05.07.26`, which was simply the day someone typed it — a fixed date that
 * only gets more wrong. Resolved at build time (not render time) so the server
 * and client markup always agree and there is no hydration mismatch.
 */
function buildDateStamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${String(now.getFullYear()).slice(-2)}`;
}

const nextConfig: NextConfig = {
  reactCompiler: true,

  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDateStamp(),
  },

  pageExtensions: isProduction
    ? BASE_PAGE_EXTENSIONS
    : [...STUDIO_PAGE_EXTENSIONS, ...BASE_PAGE_EXTENSIONS],

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: '/models/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/photos/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/data/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Webpack optimization for Three.js
  webpack: (config) => {
    // Optimize Three.js bundle
    config.externals = config.externals || [];

    // Enable tree shaking for Three.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': 'three',
    };

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion'],
  },

  // Compression
  compress: true,

  // Silence Turbopack warning (Next.js 16 default)
  turbopack: {},
};

export default withBundleAnalyzer(nextConfig);
