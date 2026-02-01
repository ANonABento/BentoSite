'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';

import type { MediaViewerProps, MediaType } from './MediaViewer.types';

// Dynamic imports for code splitting
const ImageGallery = dynamic(
  () => import('./viewers/ImageGallery').then((mod) => ({ default: mod.ImageGallery })),
  { ssr: false }
);

const PDFViewer = dynamic(
  () => import('./viewers/PDFViewer').then((mod) => ({ default: mod.PDFViewer })),
  { ssr: false }
);

const WebsiteEmbed = dynamic(
  () => import('./viewers/WebsiteEmbed').then((mod) => ({ default: mod.WebsiteEmbed })),
  { ssr: false }
);

const GameEmbed = dynamic(
  () => import('./viewers/GameEmbed').then((mod) => ({ default: mod.GameEmbed })),
  { ssr: false }
);

// Reuse existing 3D viewer
const ThreeViewer = dynamic(
  () => import('@/components/Dimension/Dimension'),
  { ssr: false }
);

interface ActiveViewer {
  type: MediaType;
  src: string | string[];
  title?: string;
  gameType?: 'unity-webgl' | 'itch';
}

interface MediaViewerWrapperProps {
  viewer: ActiveViewer | null;
  onClose: () => void;
}

export function MediaViewer({ type, src, title, onClose }: MediaViewerProps) {
  switch (type) {
    case 'images':
      return <ImageGallery images={src as string[]} onClose={onClose} />;
    case 'pdf':
      return <PDFViewer src={src as string} title={title} onClose={onClose} />;
    case 'website':
      return <WebsiteEmbed url={src as string} title={title} onClose={onClose} />;
    case 'game':
      // For game, we expect src to be the URL and pass gameType separately
      return (
        <GameEmbed
          type="itch" // Default to itch, can be overridden
          url={src as string}
          title={title}
          onClose={onClose}
        />
      );
    case '3d':
      return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-[var(--text-primary)] font-medium">{title || '3D Model'}</h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* 3D Viewer */}
          <div className="flex-1 min-h-0">
            <ThreeViewer />
          </div>
        </div>
      );
    default:
      return null;
  }
}

// Wrapper component for use in modals with AnimatePresence
export function MediaViewerWrapper({ viewer, onClose }: MediaViewerWrapperProps) {
  return (
    <AnimatePresence>
      {viewer && (
        <MediaViewer
          type={viewer.type}
          src={viewer.src}
          title={viewer.title}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

// Helper to determine media type from project data
export function getMediaType(project: {
  links?: { modelPath?: string };
  media?: {
    images?: string[];
    pdf?: string;
    website?: string;
    game?: { type: 'unity-webgl' | 'itch'; url: string };
  };
}): { type: MediaType; src: string | string[]; gameType?: 'unity-webgl' | 'itch' }[] {
  const media: { type: MediaType; src: string | string[]; gameType?: 'unity-webgl' | 'itch' }[] = [];

  if (project.links?.modelPath) {
    media.push({ type: '3d', src: project.links.modelPath });
  }

  if (project.media?.images?.length) {
    media.push({ type: 'images', src: project.media.images });
  }

  if (project.media?.pdf) {
    media.push({ type: 'pdf', src: project.media.pdf });
  }

  if (project.media?.website) {
    media.push({ type: 'website', src: project.media.website });
  }

  if (project.media?.game) {
    media.push({
      type: 'game',
      src: project.media.game.url,
      gameType: project.media.game.type,
    });
  }

  return media;
}
