// Viewfinder Types - Multi-format media viewer

import type { Project } from '@/lib/projects-data';

export type MediaTab = '3d' | 'images' | 'pdf' | 'website' | 'video' | 'game';

export interface ViewfinderProps {
  /** Currently selected project (null shows default 3D view) */
  project: Project | null;
  /** Hide header for landing/minimal mode */
  minimal?: boolean;
  /** Callback when model path should be loaded in 3D viewer */
  onModelPathChange?: (path: string) => void;
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

export interface TabConfig {
  icon: React.ReactNode;
  label: string;
}
