'use client';

/**
 * Route-level dynamic boundary for the photography grid.
 *
 * The grid sizes itself from `window.innerWidth`, which SSR can only guess at
 * (`useWindowSize` falls back to 1920x1080). Rendering it on the server
 * produced card transforms that never matched the client and React logged a
 * hydration mismatch on every load. `/projects` already mounts its grid behind
 * `ssr: false` for the same reason — this mirrors that pattern.
 */

import dynamic from 'next/dynamic';
import { RouteLoadingFallback } from '@/components/ui';
import type { PhotoItem } from './PhotographyGallery.types';

const PhotographyGridClient = dynamic(
  () => import('./PhotographyGridClient').then((mod) => mod.PhotographyGridClient),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback label="loading photography..." spinnerVariant="purple" showIcon />
    ),
  }
);

export function PhotographyRouteClient({ photos }: { photos: readonly PhotoItem[] }) {
  return <PhotographyGridClient photos={photos} />;
}
