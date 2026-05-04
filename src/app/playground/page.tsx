import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildPlaygroundPageJsonLd,
  createRouteMetadata,
  ROUTE_SEO,
} from '@/lib/seo';
import { PlaygroundPageClient } from './PlaygroundPageClient';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/playground']);

export default function PlaygroundPage() {
  return (
    <>
      <JsonLd id="playground-json-ld" data={buildPlaygroundPageJsonLd()} />
      <PlaygroundPageClient />
    </>
  );
}
