'use client';

import { ComponentType, useEffect } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { dashboardLeftIn, dashboardPanelIn } from '@/lib/animations';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Project } from '@/lib/projects-data';

interface ViewfinderPanelProps {
  selectedProject: Project | null;
  Viewfinder: ComponentType<{ project: Project | null; minimal?: boolean; suspended?: boolean }>;
  /** When defined, renders the mobile variant (hidden/shown via activeSection) */
  mobileHidden?: boolean;
  /** When true, pauses 3D rendering to save resources */
  suspended?: boolean;
}

export function ViewfinderPanel({ selectedProject, Viewfinder, mobileHidden, suspended }: ViewfinderPanelProps) {
  const isMobileVariant = mobileHidden !== undefined;
  const projectId = selectedProject?.id ?? null;
  const prefersReducedMotion = useReducedMotion();
  const contentControls = useAnimationControls();

  // `?project=A` -> `?project=B` swapped the panel contents in place with no
  // cue, so a visitor clicking through projects lost track of which one they
  // were looking at. Replay a short fade on the content — not a remount (the
  // WebGL canvas underneath must survive the switch) and opacity only, because
  // a residual transform here would create a backdrop root and kill the glass
  // blur on everything below it (see the note under this hook).
  useEffect(() => {
    if (!projectId || prefersReducedMotion) return;
    contentControls.start({
      opacity: [0.35, 1],
      transition: { duration: 0.35, ease: 'easeOut' },
    });
  }, [projectId, contentControls, prefersReducedMotion]);

  // glass-panel + motion.div MUST be the same element — a parent with a
  // residual CSS transform creates a new backdrop-root that breaks
  // backdrop-filter: blur() on descendants.
  return (
    <motion.div
      className={`flex-col min-h-0 overflow-hidden glass-panel dashboard-panel ${
        isMobileVariant
          ? `bento-corner-all md:hidden ${mobileHidden ? 'hidden' : 'flex flex-1'}`
          : 'hidden md:flex md:w-1/2 md:bento-corner-tl md:bento-corner-bl'
      }`}
      variants={isMobileVariant ? dashboardPanelIn : dashboardLeftIn}
    >
      <motion.div className="flex-1 min-h-0" animate={contentControls}>
        <ErrorBoundary>
          <Viewfinder project={selectedProject} minimal={false} suspended={suspended} />
        </ErrorBoundary>
      </motion.div>
    </motion.div>
  );
}
