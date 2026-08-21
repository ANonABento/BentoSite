// Site configuration - centralized metadata for SEO and social sharing
// Kevin Jiang's portfolio configuration

/**
 * The site's canonical origin.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL` — the real domain, set in the Vercel project.
 *   2. `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` — injected by Vercel, so a
 *      deploy that forgets step 1 still points at itself.
 *   3. localhost, for `npm run dev`.
 *
 * There is deliberately no hard-coded public domain here. The literal fallback
 * used to read `https://kevinjiang.dev`, which belongs to a *different* Kevin
 * Jiang (github.com/jiang-kevin). With the env var unset, every canonical tag,
 * sitemap entry, robots `Host`, OG image URL, and JSON-LD `@id` on this site
 * pointed at that stranger's blog — and a wrong canonical is worse than a dead
 * one, because it tells search engines the other site is the original and this
 * one is the duplicate.
 */
function resolveSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configured) {
    // A production build with no origin canonicalises every page to localhost,
    // which search engines discard. Say so in the build log rather than ship it
    // silently — an invisible failure here is exactly what the hard-coded
    // domain used to paper over. Server-side only: this must not run per-render
    // in a visitor's browser.
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn(
        '[site-config] Neither NEXT_PUBLIC_SITE_URL nor ' +
          'NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is set. Canonical URLs, ' +
          'sitemap.xml, and robots.txt will point at http://localhost:3000.',
      );
    }
    return 'http://localhost:3000';
  }

  // Vercel supplies a bare host (`bento-site.vercel.app`), not a URL.
  const withScheme = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  return withScheme.replace(/\/+$/, '');
}

export const siteConfig = {
  // Personal info
  name: 'Kevin Jiang',
  title: 'Robotics & Embedded Systems Engineer',
  description:
    'Interactive portfolio showcasing robotics, embedded systems, and AI projects. UWaterloo Computer Engineering student building robots that think.',

  // URLs
  url: resolveSiteUrl(),
  ogImage: '/og-image.png',

  // Social links
  links: {
    github: 'https://github.com/ANonABento',
    linkedin: 'https://linkedin.com/in/ANonABento',
    email: 'k69jiang@uwaterloo.ca',
  },

  // SEO keywords
  keywords: [
    'robotics engineer',
    'embedded systems',
    'ROS2',
    'computer engineering',
    'UWaterloo',
    'hardware engineer',
    'AI robotics',
    'Python',
    'C++',
    'STM32',
    'ESP32',
    'PCB design',
    '3D printing',
    'Three.js',
    'portfolio',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
