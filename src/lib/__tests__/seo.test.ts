import { describe, expect, it } from 'vitest';
import {
  buildPhotographyPageJsonLd,
  buildPortfolioPageJsonLd,
  buildProjectsPageJsonLd,
  getAbsoluteUrl,
  getSitemapEntries,
} from '@/lib/seo';
import { PROJECTS } from '@/lib/projects-data';
import { siteConfig } from '@/lib/site-config';

const siteUrl = siteConfig.url.replace(/\/$/, '');

function getGraph(jsonLd: Record<string, unknown>): Record<string, unknown>[] {
  return jsonLd['@graph'] as Record<string, unknown>[];
}

describe('seo helpers', () => {
  it('builds absolute URLs without duplicate root slashes', () => {
    expect(getAbsoluteUrl('/')).toBe(siteUrl);
    expect(getAbsoluteUrl('/projects')).toBe(`${siteUrl}/projects`);
    expect(getAbsoluteUrl('scrollable')).toBe(`${siteUrl}/scrollable`);
    expect(getAbsoluteUrl('https://example.com/demo')).toBe('https://example.com/demo');
  });

  it('includes core pages and playground game routes in the sitemap', () => {
    const entries = getSitemapEntries();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(siteUrl);
    expect(urls).toContain(`${siteUrl}/projects`);
    expect(urls).toContain(`${siteUrl}/photography`);
    expect(urls).toContain(`${siteUrl}/scrollable`);
    expect(urls).toContain(`${siteUrl}/playground`);
    expect(urls).toContain(`${siteUrl}/playground/reaction`);
    expect(urls).toContain(`${siteUrl}/playground/rhythm`);
    expect(new Set(urls).size).toBe(urls.length);
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(true);
  });

  it('describes the portfolio page as a profile page for the site owner', () => {
    const jsonLd = buildPortfolioPageJsonLd();
    const graph = getGraph(jsonLd);
    const page = graph.find((item) => item['@id'] === `${siteUrl}#portfolio`);

    expect(page).toMatchObject({
      url: siteUrl,
      mainEntity: { '@id': `${siteUrl}#person` },
      about: { '@id': `${siteUrl}#person` },
    });
  });

  it('describes every portfolio project in projects page structured data', () => {
    const jsonLd = buildProjectsPageJsonLd();
    const graph = getGraph(jsonLd);
    const collection = graph.find(
      (item) => item['@id'] === `${siteUrl}/projects#projects`
    ) as Record<string, unknown>;
    const mainEntity = collection.mainEntity as Record<string, unknown>;
    const items = mainEntity.itemListElement as Record<string, unknown>[];

    expect(mainEntity.numberOfItems).toBe(PROJECTS.length);
    expect(items).toHaveLength(PROJECTS.length);
    expect(items[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      url: `${siteUrl}/?project=${encodeURIComponent(PROJECTS[0].id)}`,
    });

    const firstProject = items[0].item as Record<string, unknown>;
    expect(firstProject).toMatchObject({
      '@type': 'CreativeWork',
      '@id': `${siteUrl}/projects#${PROJECTS[0].id}`,
      name: PROJECTS[0].name,
      creator: { '@id': `${siteUrl}#person` },
    });
    expect(firstProject.datePublished).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('describes the photography page as an image gallery', () => {
    const photos = [
      {
        src: '/photos/lab-after-hours.jpg',
        title: 'Lab After Hours',
        alt: 'Warm workbench scene',
        location: 'Waterloo',
        year: '2026',
      },
      {
        src: '/photos/signal-path.jpg',
        title: 'Signal Path',
        alt: 'Diagonal light across a technical surface',
        location: 'Toronto',
        year: '2026',
      },
    ];
    const jsonLd = buildPhotographyPageJsonLd(photos);
    const graph = getGraph(jsonLd);
    const collection = graph.find(
      (item) => item['@id'] === `${siteUrl}/photography#photography`
    ) as Record<string, unknown>;
    const gallery = collection.mainEntity as Record<string, unknown>;
    const associatedMedia = gallery.associatedMedia as Record<string, unknown>[];

    expect(collection).toMatchObject({
      '@type': 'CollectionPage',
      url: `${siteUrl}/photography`,
      about: { '@id': `${siteUrl}#person` },
    });
    expect(gallery).toMatchObject({
      '@type': 'ImageGallery',
      numberOfItems: photos.length,
    });
    expect(associatedMedia).toHaveLength(photos.length);
    expect(associatedMedia[0]).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `${siteUrl}/photos/lab-after-hours.jpg`,
      name: 'Lab After Hours',
      creator: { '@id': `${siteUrl}#person` },
    });
  });
});
