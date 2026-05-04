import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRouteMetadata,
  GAME_SEO,
  getAbsoluteUrl,
  REQUIRED_SEO_ROUTES,
  ROUTE_SEO,
} from '@/lib/seo';

const appDir = path.join(process.cwd(), 'src/app');

function routeToAppPath(route: string): string {
  if (route === '/') return path.join(appDir, 'page.tsx');
  if (route === '/404') return path.join(appDir, '404/page.tsx');
  return path.join(appDir, route.replace(/^\//, ''), 'page.tsx');
}

describe('SEO validator gate', () => {
  it('tracks every required route in the App Router', () => {
    for (const route of REQUIRED_SEO_ROUTES) {
      expect(
        fs.existsSync(routeToAppPath(route)),
        `${route} must have an App Router page`
      ).toBe(true);
    }
  });

  it('requires branded metadata and canonical URLs for every tracked route', () => {
    for (const route of REQUIRED_SEO_ROUTES) {
      const seo = ROUTE_SEO[route] ?? GAME_SEO[route];
      const metadata = createRouteMetadata(seo);

      expect(metadata.title, `${route} title`).toBe(seo.title);
      expect(String(metadata.title), `${route} brand`).toMatch(
        /— bentOS \/ Kevin Jiang$/
      );
      expect(metadata.description, `${route} description`).toBe(seo.description);
      expect(metadata.alternates?.canonical, `${route} canonical`).toBe(
        getAbsoluteUrl(route)
      );
      expect(metadata.openGraph?.url, `${route} Open Graph URL`).toBe(
        getAbsoluteUrl(route)
      );
    }
  });

  it('requires JSON-LD schema coverage for every tracked route', () => {
    const expectedSchemaByRoute = {
      ...Object.fromEntries(Object.keys(GAME_SEO).map((route) => [route, 'Game'])),
      ...Object.fromEntries(
        Object.entries(ROUTE_SEO).map(([route, config]) => [route, config.schemaType])
      ),
    };

    for (const route of REQUIRED_SEO_ROUTES) {
      expect(expectedSchemaByRoute[route], `${route} schema`).toBeDefined();
    }
  });
});
