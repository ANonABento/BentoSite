import type { Metadata } from 'next';
import { createRouteMetadata, ROUTE_SEO } from '@/lib/seo';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/playground']);

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
