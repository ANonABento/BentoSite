import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/projects`, priority: 0.7 },
  ];
}
