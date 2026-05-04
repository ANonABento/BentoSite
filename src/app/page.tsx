import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPortfolioPageJsonLd, createRouteMetadata, ROUTE_SEO } from '@/lib/seo';
import { HomeClient } from './HomeClient';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/']);

export default function Home() {
  return (
    <>
      <JsonLd id="home-json-ld" data={buildPortfolioPageJsonLd()} />
      <HomeClient />
    </>
  );
}
