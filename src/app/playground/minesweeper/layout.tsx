import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGamePageJsonLd, createRouteMetadata, GAME_SEO } from '@/lib/seo';

const route = '/playground/minesweeper';

export const metadata: Metadata = createRouteMetadata(GAME_SEO[route]);

export default function MinesweeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="minesweeper-json-ld" data={buildGamePageJsonLd(route)} />
      {children}
    </>
  );
}
