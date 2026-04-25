'use client';

import { ComponentType } from 'react';
import { motion } from 'framer-motion';
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

  // glass-panel + motion.div MUST be the same element — a parent with a
  // residual CSS transform creates a new backdrop-root that breaks
  // backdrop-filter: blur() on descendants.
  return (
    <motion.div
      className={`flex-col min-h-0 overflow-hidden glass-panel rounded-2xl ${
        isMobileVariant
          ? `md:hidden ${mobileHidden ? 'hidden' : 'flex flex-1'}`
          : 'hidden md:flex md:w-1/2'
      }`}
      variants={isMobileVariant ? dashboardPanelIn : dashboardLeftIn}
    >
      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <Viewfinder project={selectedProject} minimal={false} suspended={suspended} />
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}
