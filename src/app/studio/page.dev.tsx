/**
 * /studio — local content editor.
 *
 * `page.dev.tsx`, not `page.tsx`: next.config.ts only includes the `.dev.tsx`
 * page extension outside production, so this route does not exist in a
 * production build. The `notFound()` below covers the case of someone running
 * `next dev` somewhere reachable.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StudioApp } from './_components/StudioApp';

export const metadata: Metadata = {
  title: 'Studio',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <StudioApp />;
}
