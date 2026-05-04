import type { Metadata } from 'next';
import NotFound from '@/app/not-found';
import { createRouteMetadata, ROUTE_SEO } from '@/lib/seo';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/404']);

export default NotFound;
