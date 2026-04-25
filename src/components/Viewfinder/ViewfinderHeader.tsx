'use client';

import type { ViewfinderHeaderProps, MediaTab } from './Viewfinder.types';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Viewfinder/camera icon
const ViewfinderIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Tab icons as inline SVGs (w-4 h-4 to match other header icons)
const TabIcons: Record<MediaTab, React.ReactNode> = {
  '3d': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  images: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  pdf: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  website: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  video: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  game: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  map: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const TabLabels: Record<MediaTab, string> = {
  '3d': '3D Model',
  images: 'Gallery',
  pdf: 'Document',
  website: 'Website',
  video: 'Video',
  game: 'Play',
  map: 'Map',
};

// Short labels for tab buttons
const ShortLabels: Record<MediaTab, string> = {
  '3d': '3D',
  images: 'IMG',
  pdf: 'PDF',
  website: 'WEB',
  video: 'VID',
  game: 'PLAY',
  map: 'MAP',
};

interface ViewfinderTabControlsProps {
  availableTabs: MediaTab[];
  activeTab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  compact?: boolean;
}

export function ViewfinderTabControls({
  availableTabs,
  activeTab,
  onTabChange,
  compact = false,
}: ViewfinderTabControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {availableTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            flex items-center gap-1 ${compact ? 'px-1.5 py-1' : 'px-2 py-1'} rounded transition-colors duration-150
            text-[10px] font-mono uppercase tracking-wider
            ${activeTab === tab
              ? 'bg-[var(--orange-muted)] text-[var(--orange)] border border-[var(--orange)] border-opacity-30'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
            }
          `}
          title={TabLabels[tab]}
          aria-label={TabLabels[tab]}
          aria-pressed={activeTab === tab}
        >
          {TabIcons[tab]}
          <span>{ShortLabels[tab]}</span>
        </button>
      ))}
    </div>
  );
}

export function ViewfinderHeader({
  availableTabs,
  activeTab,
  onTabChange,
  projectName,
}: ViewfinderHeaderProps) {
  return (
    <SectionHeader
      title={projectName || 'viewfinder'}
      icon={ViewfinderIcon}
      iconColor="orange"
      mono
      action={
        <ViewfinderTabControls
          availableTabs={availableTabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          compact
        />
      }
    />
  );
}
