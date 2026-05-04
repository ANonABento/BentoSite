import type { Metadata } from 'next';
import { createRouteMetadata, ROUTE_SEO } from '@/lib/seo';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/photography']);

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
