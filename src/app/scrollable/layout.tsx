import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildScrollablePageJsonLd,
  createRouteMetadata,
  ROUTE_SEO,
} from '@/lib/seo';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/scrollable']);

export default function ScrollableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="scrollable-json-ld" data={buildScrollablePageJsonLd()} />
      {children}
    </>
  );
}
