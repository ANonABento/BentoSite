'use client';

import dynamic from 'next/dynamic';
import type { Model3DViewerProps } from '../Viewfinder.types';

// Dynamic import Dimension to avoid SSR issues with Three.js
const Dimension = dynamic(() => import('@/components/Dimension/Dimension'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--interactive)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--text-muted)]">Loading 3D viewer...</span>
      </div>
    </div>
  ),
});

export function Model3DViewer({ minimal = false }: Model3DViewerProps) {
  return (
    <div className="h-full">
      <Dimension minimal={minimal} />
    </div>
  );
}
