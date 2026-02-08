'use client';

import { useMemo } from 'react';
import type { VideoViewerProps } from '../Viewfinder.types';

// Helper to convert YouTube/Vimeo URLs to embed URLs
function getEmbedUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } | null {
  if (!url) return null;

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return { type: 'direct', embedUrl: url };
  }

  return null;
}

export function VideoViewer({ url }: VideoViewerProps) {
  const videoInfo = useMemo(() => getEmbedUrl(url), [url]);

  if (!url || !videoInfo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p>No video available</p>
        {url && <p className="text-sm mt-1">Unsupported format</p>}
      </div>
    );
  }

  // Direct video file
  if (videoInfo.type === 'direct') {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--surface-deep)]">
        <video
          src={videoInfo.embedUrl}
          controls
          className="max-w-full max-h-full"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // YouTube or Vimeo embed
  return (
    <div className="h-full flex items-center justify-center bg-[var(--surface-deep)]">
      <iframe
        src={videoInfo.embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video player"
      />
    </div>
  );
}
