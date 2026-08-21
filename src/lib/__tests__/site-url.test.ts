/**
 * @vitest-environment node
 *
 * The resolution runs during the build and on the server, where there is no
 * `window` — jsdom would mask the production-warning branch entirely.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `siteConfig.url` is the single origin behind `metadataBase`, every canonical
 * <link>, og:url, og:image, sitemap entry, robots Host, and JSON-LD @id.
 *
 * It used to fall back to a hard-coded `https://kevinjiang.dev`, which belongs
 * to a different Kevin Jiang. Any deploy without the env var set therefore told
 * search engines that a stranger's blog was the canonical version of this site,
 * and pointed the bentOS project card's live-demo link and embedded website tab
 * at it too. These tests exist so no literal domain can creep back in.
 */

const RETIRED_DOMAIN = 'kevinjiang.dev';
const REPO_ROOT = path.resolve(__dirname, '../../..');

async function loadSiteUrl(): Promise<string> {
  vi.resetModules();
  const { siteConfig } = await import('@/lib/site-config');
  return siteConfig.url;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteConfig.url resolution', () => {
  it('falls back to localhost, never to a public domain, when nothing is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', '');

    // The point is not that localhost is useful in production — it is that an
    // unconfigured build must not claim an origin somebody else owns.
    expect(await loadSiteUrl()).toBe('http://localhost:3000');
  });

  it('warns during a production build when no origin is configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('NODE_ENV', 'production');

    await loadSiteUrl();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NEXT_PUBLIC_SITE_URL'));
    warn.mockRestore();
  });

  it('stays quiet in development, where localhost is the right answer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('NODE_ENV', 'development');

    await loadSiteUrl();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('uses the configured site URL and drops a trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com/');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', '');

    expect(await loadSiteUrl()).toBe('https://example.com');
  });

  it("adds a scheme to Vercel's bare production host", async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', 'bento-site.vercel.app');

    expect(await loadSiteUrl()).toBe('https://bento-site.vercel.app');
  });

  it('prefers the explicit site URL over the Vercel-injected one', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://real-domain.dev');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', 'bento-site.vercel.app');

    expect(await loadSiteUrl()).toBe('https://real-domain.dev');
  });
});

function collectFiles(dir: string, extensions: string[]): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

describe('retired domain', () => {
  // Scoped to content and the authoring skill — the two places that write URLs
  // into the site. `site-config.ts` names the domain in a comment explaining
  // why it is gone, which is the one mention worth keeping.
  it.each([
    ['project and portfolio content', path.join(REPO_ROOT, 'src/content'), ['.json']],
    ['the update-portfolio skill', path.join(REPO_ROOT, '.claude/skills/update-portfolio'), ['.md']],
  ])('does not appear in %s', (_label, dir, extensions) => {
    const offenders = collectFiles(dir, extensions).filter((file) =>
      fs.readFileSync(file, 'utf8').includes(RETIRED_DOMAIN),
    );

    expect(offenders.map((file) => path.relative(REPO_ROOT, file))).toEqual([]);
  });
});
