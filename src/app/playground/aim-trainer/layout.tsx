import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGamePageJsonLd, createRouteMetadata, GAME_SEO } from '@/lib/seo';

const route = '/playground/aim-trainer';

export const metadata: Metadata = createRouteMetadata(GAME_SEO[route]);

export default function AimTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="aim-trainer-json-ld" data={buildGamePageJsonLd(route)} />
      {children}
    </>
  );
}
