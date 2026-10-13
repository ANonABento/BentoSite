'use client';

/**
 * Viewers that put something in a frame: video (YouTube, Vimeo or a file),
 * any web page (embed), and PDFs (the browser's own viewer).
 */

import { useState } from 'react';

/** YouTube and Vimeo links become their embed URLs; anything ending in a video extension plays directly. */
export function videoSource(url: string): { type: 'frame' | 'file'; src: string } | null {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (youtube) return { type: 'frame', src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: 'frame', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: 'file', src: url };
  return null;
}

export function VideoViewer({ src }: { src: string }) {
  const video = videoSource(src);
  if (!video) return <Fallback href={src} text="This video link isn't one the viewfinder can play." />;
  if (video.type === 'file') {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <video src={video.src} controls playsInline className="max-h-full max-w-full" />
      </div>
    );
  }
  return (
    <iframe
      src={video.src}
      title="Video"
      className="h-full w-full bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

/** A live page in a frame. Many sites refuse to be framed, so the way out is always on screen. */
export function EmbedViewer({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full bg-white">
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        allow="fullscreen; clipboard-write"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-cell text-sm text-ash">Loading…</div>}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-md bg-lacquer/85 px-2.5 py-1 text-xs text-rice backdrop-blur-sm hover:bg-orange hover:text-lacquer"
      >
        Blank? Open in a new tab ↗
      </a>
    </div>
  );
}

export function PdfViewer({ src, title }: { src: string; title: string }) {
  return <iframe src={src} title={title} className="h-full w-full bg-cell" />;
}

export function Fallback({ href, text }: { href?: string; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-ash">
      <p>{text}</p>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline">
          Open it directly ↗
        </a>
      )}
    </div>
  );
}
