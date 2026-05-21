'use client';

import type { PDFViewerProps } from '../Viewfinder.types';

export function PDFViewer({ src }: PDFViewerProps) {
  if (!src) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
        No document available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--glass-bg)]">
        <span className="min-w-0 truncate text-sm text-[var(--text-secondary)]">
          Document preview
        </span>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
          >
            Open
          </a>
          <a
            href={src}
            download
            className="px-3 py-1.5 rounded-md bg-[var(--purple)] text-[var(--text-on-accent)] text-sm hover:bg-[var(--purple-hover)] transition-colors"
          >
            Download
          </a>
        </div>
      </div>

      <iframe
        src={src}
        title="Project document"
        className="flex-1 w-full bg-[var(--background)]"
      />
    </div>
  );
}
