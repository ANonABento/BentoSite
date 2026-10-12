import type { MetadataRoute } from 'next';
import { SITE_URL, getProjects } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    ...getProjects().map((p) => ({ url: `${SITE_URL}/projects/${p.id}`, priority: 0.7 })),
  ];
}
