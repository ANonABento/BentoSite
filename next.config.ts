import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  // Next.js inlines hydration JSON; framer-motion / R3F use inline styles.
  // Vercel Analytics + Speed Insights are loaded from va.vercel-scripts.com.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  // Project showcases embed YouTube/Vimeo and other trusted https iframes.
  "frame-src 'self' https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  // X-XSS-Protection is deprecated and can introduce vulnerabilities in legacy
  // browsers; modern browsers ignore it. Setting `0` explicitly disables the
  // legacy auditor (OWASP recommendation).
  {
    key: 'X-XSS-Protection',
    value: '0'
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
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  }
];

const nextConfig: NextConfig = {
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.picsum.photos',
      },
    ],
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
