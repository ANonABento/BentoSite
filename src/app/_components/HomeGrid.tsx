'use client';

import dynamic from 'next/dynamic';
import type { ProjectsGridProps } from './ProjectsGridClient';

// The grid measures the window to place cards, so it only renders on the client.
const ProjectsGridClient = dynamic(() => import('./ProjectsGridClient').then((mod) => mod.ProjectsGridClient), {
  ssr: false,
  loading: () => (
    <div className="crt fixed inset-0 grid place-items-center text-2xl">
      <span>
        <span className="text-orange">&gt;</span> loading projects <span className="cursor" />
      </span>
    </div>
  ),
});

export function HomeGrid(props: ProjectsGridProps) {
  return <ProjectsGridClient {...props} />;
}
