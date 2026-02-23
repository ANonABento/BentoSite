// MediaViewer Types - Unified media viewer for projects

export type MediaType = 'images' | 'pdf' | 'website' | 'game' | '3d';

export interface ProjectMedia {
  images?: string[];
  pdf?: string;
  video?: string;
  website?: string;
  game?: {
    type: 'unity-webgl' | 'itch';
    url: string;
  };
  map?: {
    locations: string[];
    highlightedIds?: string[];
  };
}

export interface MediaViewerProps {
  type: MediaType;
  src: string | string[];
  title?: string;
  onClose: () => void;
}

export interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export interface PDFViewerProps {
  src: string;
  title?: string;
  onClose: () => void;
}

export interface WebsiteEmbedProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export interface GameEmbedProps {
  type: 'unity-webgl' | 'itch';
  url: string;
  title?: string;
  onClose: () => void;
}
