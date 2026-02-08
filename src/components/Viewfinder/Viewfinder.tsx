'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ViewfinderHeader } from './ViewfinderHeader';
import { ViewerSkeleton } from './ViewerSkeleton';
import type { ViewfinderProps, MediaTab } from './Viewfinder.types';

// Dynamic imports for code splitting - only load viewers when needed
// Each viewer shows a skeleton while its chunk is being loaded
const Model3DViewer = dynamic(
  () => import('./viewers/Model3DViewer').then((mod) => ({ default: mod.Model3DViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const ImageViewer = dynamic(
  () => import('./viewers/ImageViewer').then((mod) => ({ default: mod.ImageViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const PDFViewer = dynamic(
  () => import('./viewers/PDFViewer').then((mod) => ({ default: mod.PDFViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const WebsiteViewer = dynamic(
  () => import('./viewers/WebsiteViewer').then((mod) => ({ default: mod.WebsiteViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const VideoViewer = dynamic(
  () => import('./viewers/VideoViewer').then((mod) => ({ default: mod.VideoViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const GameViewer = dynamic(
  () => import('./viewers/GameViewer').then((mod) => ({ default: mod.GameViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

export function Viewfinder({ project, minimal = false }: ViewfinderProps) {
  // Track project ID to detect changes
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  // Determine available tabs based on project media
  const availableTabs = useMemo<MediaTab[]>(() => {
    const tabs: MediaTab[] = [];

    // Always have 3D as an option (default model if no project)
    if (!project || project.links.modelPath) {
      tabs.push('3d');
    }

    if (project?.media?.images?.length) {
      tabs.push('images');
    }

    if (project?.media?.pdf) {
      tabs.push('pdf');
    }

    if (project?.media?.website) {
      tabs.push('website');
    }

    if (project?.media?.video) {
      tabs.push('video');
    }

    if (project?.media?.game) {
      tabs.push('game');
    }

    // Default to 3D if no tabs available
    return tabs.length ? tabs : ['3d'];
  }, [project]);

  // Compute initial tab - reset when project changes
  const currentProjectId = project?.id ?? null;
  const shouldResetTab = currentProjectId !== lastProjectId;

  const [activeTab, setActiveTab] = useState<MediaTab>(availableTabs[0]);

  // Handle project change - update lastProjectId and reset tab if needed
  if (shouldResetTab) {
    setLastProjectId(currentProjectId);
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }

  // Render the active viewer
  const renderViewer = () => {
    switch (activeTab) {
      case '3d':
        return <Model3DViewer modelPath={project?.links.modelPath} minimal={minimal} />;
      case 'images':
        return <ImageViewer images={project?.media?.images || []} />;
      case 'pdf':
        return <PDFViewer src={project?.media?.pdf || ''} />;
      case 'website':
        return <WebsiteViewer url={project?.media?.website || ''} />;
      case 'video':
        return <VideoViewer url={project?.media?.video || ''} />;
      case 'game':
        return <GameViewer game={project?.media?.game} />;
      default:
        return <Model3DViewer minimal={minimal} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with tab toggles - hide in minimal mode or when only one tab */}
      {!minimal && availableTabs.length > 1 && (
        <ViewfinderHeader
          availableTabs={availableTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          projectName={project?.name}
        />
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0">{renderViewer()}</div>
    </div>
  );
}
