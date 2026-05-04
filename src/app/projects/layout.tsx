import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildProjectsPageJsonLd, createRouteMetadata, ROUTE_SEO } from '@/lib/seo';

export const metadata: Metadata = createRouteMetadata(ROUTE_SEO['/projects']);

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd id="projects-json-ld" data={buildProjectsPageJsonLd()} />
      {children}
    </>
  );
}
