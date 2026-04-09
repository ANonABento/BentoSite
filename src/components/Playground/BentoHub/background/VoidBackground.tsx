'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const VoidCanvas = dynamic(() => import('./ParticleVoid').then((mod) => mod.ParticleVoid), {
  ssr: false,
});

export function VoidBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Suspense fallback={<VoidFallback />}>
        <VoidCanvas />
      </Suspense>
    </div>
  );
}

function VoidFallback() {
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.08) 0%, var(--pg-bg-deep) 70%)',
      }}
    />
  );
}
