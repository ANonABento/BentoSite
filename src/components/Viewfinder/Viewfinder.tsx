'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ViewfinderHeader } from './ViewfinderHeader';
import { ViewerSkeleton } from './ViewerSkeleton';
import type { ViewfinderProps, MediaTab } from './Viewfinder.types';
import { getMapLocations, getAllMapLocations } from '@/lib/map-data';
import type { Project } from '@/lib/projects-data';

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

const MapViewer = dynamic(
  () => import('./viewers/MapViewer').then((mod) => ({ default: mod.MapViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

export function getViewfinderImages(project: Project | null): string[] {
  if (!project?.media) return [];

  return Array.from(
    new Set([
      project.media.featuredImage,
      ...(project.media.images ?? []),
    ].filter((image): image is string => Boolean(image)))
  );
}

export function getAvailableViewfinderTabs(project: Project | null): MediaTab[] {
  const tabs: MediaTab[] = [];

  // Always have 3D as an option for the default viewer. Project-specific 3D
  // appears only when a model path exists.
  if (!project || project.links.modelPath) {
    tabs.push('3d');
  }

  if (getViewfinderImages(project).length > 0) {
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

  // Map is always available and falls back to all portfolio locations.
  tabs.push('map');

  return tabs.length ? tabs : ['3d'];
}

export function Viewfinder({
  project,
  minimal = false,
  onMapLocationClick,
  activeTab,
  onTabChange,
  onAvailableTabsChange,
  showHeader = true,
  suspended = false,
}: ViewfinderProps) {
  // Determine available tabs based on project media
  const availableTabs = useMemo<MediaTab[]>(() => {
    return getAvailableViewfinderTabs(project);
  }, [project]);
  const imageSources = useMemo(() => getViewfinderImages(project), [project]);

  const [internalActiveTab, setInternalActiveTab] = useState<MediaTab>(availableTabs[0]);
  const isControlled = activeTab !== undefined && onTabChange !== undefined;
  const currentTab = isControlled ? activeTab : internalActiveTab;
  const resolvedActiveTab = availableTabs.includes(currentTab as MediaTab) ? (currentTab as MediaTab) : availableTabs[0];
  const setResolvedTab = isControlled ? (onTabChange as (tab: MediaTab) => void) : setInternalActiveTab;

  // Ensure controlled parent receives a valid tab when options change
  useEffect(() => {
    if (isControlled && activeTab !== undefined && !availableTabs.includes(activeTab)) {
      onTabChange?.(availableTabs[0]);
    }
  }, [availableTabs, activeTab, isControlled, onTabChange]);

  // Emit available tabs for parent-level tab controls
  useEffect(() => {
    onAvailableTabsChange?.(availableTabs);
  }, [availableTabs, onAvailableTabsChange]);

  // Resolve map locations from portfolio data
  const mapLocations = useMemo(() => {
    if (project?.media?.map?.locations) {
      return getMapLocations(project.media.map.locations);
    }
    return getAllMapLocations();
  }, [project]);

  const mapHighlightedIds = project?.media?.map?.highlightedIds;

  // Render the active viewer
  const renderViewer = () => {
    switch (resolvedActiveTab) {
      case '3d':
        return <Model3DViewer modelPath={project?.links.modelPath} minimal={minimal} suspended={suspended} />;
      case 'images':
        return <ImageViewer images={imageSources} />;
      case 'pdf':
        return <PDFViewer src={project?.media?.pdf || ''} />;
      case 'website':
        return <WebsiteViewer url={project?.media?.website || ''} />;
      case 'video':
        return <VideoViewer url={project?.media?.video || ''} />;
      case 'game':
        return <GameViewer game={project?.media?.game} />;
      case 'map':
        return (
          <MapViewer
            locations={mapLocations}
            highlightedIds={mapHighlightedIds}
            onLocationClick={onMapLocationClick}
          />
        );
      default:
        return <Model3DViewer minimal={minimal} suspended={suspended} />;
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header with tab toggles - hide in minimal mode or when only one tab */}
      {!minimal && availableTabs.length > 1 && (
        showHeader ? (
          <ViewfinderHeader
            availableTabs={availableTabs}
            activeTab={resolvedActiveTab}
            onTabChange={setResolvedTab}
            projectName={project?.name}
          />
        ) : null
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0">{renderViewer()}</div>
    </div>
  );
}
