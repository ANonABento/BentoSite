'use client';

import dynamic from 'next/dynamic';
import type { ProjectsGridProps } from './ProjectsGridClient';

// The grid measures the window to place cards, so it only renders on the client.
const ProjectsGridClient = dynamic(() => import('./ProjectsGridClient').then((mod) => mod.ProjectsGridClient), {
  ssr: false,
});

export function HomeGrid(props: ProjectsGridProps) {
  return <ProjectsGridClient {...props} />;
}
