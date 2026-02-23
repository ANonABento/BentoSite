// Viewfinder Types - Multi-format media viewer

import type { Project } from '@/lib/projects-data';

export type MediaTab = '3d' | 'images' | 'pdf' | 'website' | 'video' | 'game' | 'map';

export interface ViewfinderProps {
  /** Currently selected project (null shows default 3D view) */
  project: Project | null;
  /** Hide header for landing/minimal mode */
  minimal?: boolean;
  /** Callback when model path should be loaded in 3D viewer */
  onModelPathChange?: (path: string) => void;
  /** Callback when map location is selected/clicked */
  onMapLocationClick?: (location: MapLocation) => void;
  /** Controlled active tab (optional) */
  activeTab?: MediaTab;
  /** Controlled tab change handler (optional) */
  onTabChange?: (tab: MediaTab) => void;
  /** Emits available tabs to parent for external controls */
  onAvailableTabsChange?: (tabs: MediaTab[]) => void;
  /** Show internal tab header; disable when parent renders controls */
  showHeader?: boolean;
}

export interface ViewfinderHeaderProps {
  availableTabs: MediaTab[];
  activeTab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  projectName?: string;
}

export interface Model3DViewerProps {
  modelPath?: string;
  minimal?: boolean;
}

export interface ImageViewerProps {
  images: string[];
}

export interface PDFViewerProps {
  src: string;
}

export interface WebsiteViewerProps {
  url: string;
}

export interface VideoViewerProps {
  url: string;
}

export interface GameViewerProps {
  game?: {
    type: 'unity-webgl' | 'itch';
    url: string;
  };
}

export interface MapLocation {
  id: string;
  label: string;
  sublabel: string;
  location: string;
  coordinates: { lat: number; lng: number };
  period: string;
  type: 'work' | 'education';
  details: string[];
}

export interface MapViewerProps {
  locations: MapLocation[];
  highlightedIds?: string[];
  onLocationClick?: (location: MapLocation) => void;
}

export interface TabConfig {
  icon: React.ReactNode;
  label: string;
}
