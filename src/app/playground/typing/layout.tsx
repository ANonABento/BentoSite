import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGamePageJsonLd, createRouteMetadata, GAME_SEO } from '@/lib/seo';

const route = '/playground/typing';

export const metadata: Metadata = createRouteMetadata(GAME_SEO[route]);

export default function TypingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="typing-json-ld" data={buildGamePageJsonLd(route)} />
      {children}
    </>
  );
}
