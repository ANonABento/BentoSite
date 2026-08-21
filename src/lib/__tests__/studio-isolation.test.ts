import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Studio is a local authoring tool with filesystem write access. It must
 * never be part of a production build. Two things keep that true, and both are
 * easy to undo by accident:
 *
 *  1. every studio route file is named `*.dev.tsx` / `*.dev.ts`
 *  2. next.config.ts only registers those extensions outside production
 *
 * If someone renames `page.dev.tsx` to `page.tsx`, the route ships. These
 * assertions fail loudly first.
 */

const ROOT = process.cwd();

function listRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(full);
    return /^(page|route|layout|default|template)\./.test(entry.name) ? [full] : [];
  });
}

describe('studio isolation', () => {
  it('names every studio route file with the dev-only extension', () => {
    const files = [
      ...listRouteFiles(path.join(ROOT, 'src', 'app', 'studio')),
      ...listRouteFiles(path.join(ROOT, 'src', 'app', 'api', 'studio')),
    ];

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(path.basename(file)).toMatch(/\.dev\.(tsx|ts)$/);
    }
  });

  it('keeps the dev page extensions out of the production build', () => {
    const config = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8');

    expect(config).toContain("const STUDIO_PAGE_EXTENSIONS = ['dev.tsx', 'dev.ts'];");
    expect(config).toContain('pageExtensions: isProduction');
    expect(config).toContain("const isProduction = process.env.NODE_ENV === 'production';");
    // The production branch must be the base list, with no dev extension in it.
    expect(config).toMatch(/\?\s*BASE_PAGE_EXTENSIONS/);
    expect(config).not.toMatch(/BASE_PAGE_EXTENSIONS\s*=\s*\[[^\]]*dev/);
  });

  it('guards the studio API at runtime as well as at build time', () => {
    const route = fs.readFileSync(
      path.join(ROOT, 'src', 'app', 'api', 'studio', '[...segments]', 'route.dev.ts'),
      'utf8',
    );

    expect(route).toContain("process.env.NODE_ENV === 'production'");
    for (const method of ['GET', 'POST', 'DELETE']) {
      expect(route).toMatch(new RegExp(`export async function ${method}[\\s\\S]{0,200}devOnly\\(\\)`));
    }
  });
});
