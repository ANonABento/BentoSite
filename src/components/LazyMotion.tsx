'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Lazy-load framer-motion animations to reduce initial bundle size.
 *
 * The `domAnimation` feature set provides:
 * - Animate presence
 * - Layout animations
 * - Gestures (hover, tap, drag, pan, viewport detection)
 * - Variants
 * - Exit animations
 *
 * This reduces the framer-motion bundle from ~63KB to ~19KB.
 *
 * Note: For maximum benefit, use `m` components instead of `motion` components
 * within this provider. The `motion` components will still work but won't
 * benefit from the lazy loading.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export { domAnimation };
