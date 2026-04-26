import { MetadataRoute } from 'next';
import { getAbsoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: getAbsoluteUrl('/'),
  };
}
