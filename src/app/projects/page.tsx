'use client';

/**
 * /projects - Projects showcase page
 *
 * Thin route shell. The grid and card renderer live behind a route-level
 * dynamic boundary so the page module does not eagerly import them.
 */

import dynamic from 'next/dynamic';
import { RouteLoadingFallback } from '@/components/ui';

const ProjectsGridClient = dynamic(
  () => import('./_components/ProjectsGridClient').then((mod) => mod.ProjectsGridClient),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="loading projects..."
        spinnerVariant="purple"
        showIcon
      />
    ),
  }
);

export default function ProjectsPage() {
  return <ProjectsGridClient />;
}
