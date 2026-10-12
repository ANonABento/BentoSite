'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { BootScreen } from './BootScreen';
import type { ProjectsGridProps } from './ProjectsGridClient';

// The grid measures the window to place cards, so it only renders on the
// client. The boot screen covers it until it has mounted.
const ProjectsGridClient = dynamic(() => import('./ProjectsGridClient').then((mod) => mod.ProjectsGridClient), {
  ssr: false,
});

export function HomeGrid(props: ProjectsGridProps) {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  const { profile, projects } = props;
  const [current] = profile.jobs;
  const lines: [string, string][] = [
    ['whoami', `${profile.name}, ${profile.title}`.toLowerCase()],
    ...(current ? [['status', `${current.role} @ ${current.company}`.toLowerCase()] as [string, string]] : []),
    ['ls ~/projects | wc -l', String(projects.length)],
  ];

  return (
    <>
      <ProjectsGridClient {...props} onReady={handleReady} />
      <BootScreen lines={lines} ready={ready} />
    </>
  );
}
