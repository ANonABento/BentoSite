'use client';

/**
 * /playground - Games/Fidgets showcase page
 *
 * Thin route shell. The grid and card renderer live behind a route-level
 * dynamic boundary so the page module does not eagerly import them.
 */

import dynamic from 'next/dynamic';
import { RouteLoadingFallback } from '@/components/ui';

const PlaygroundGridClient = dynamic(
  () => import('./_components/PlaygroundGridClient').then((mod) => mod.PlaygroundGridClient),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="loading playground..."
        spinnerVariant="orange"
        showIcon
      />
    ),
  }
);

export default function PlaygroundPage() {
  return <PlaygroundGridClient />;
}
