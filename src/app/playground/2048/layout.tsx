import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGamePageJsonLd, createRouteMetadata, GAME_SEO } from '@/lib/seo';

const route = '/playground/2048';

export const metadata: Metadata = createRouteMetadata(GAME_SEO[route]);

export default function Game2048Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="game-2048-json-ld" data={buildGamePageJsonLd(route)} />
      {children}
    </>
  );
}
