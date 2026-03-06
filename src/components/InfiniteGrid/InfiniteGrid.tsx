// InfiniteGrid v2 - Canvas-based pan/zoom with sticky search and physics
// Cards are NOT individually draggable - canvas pans as a whole
// SearchCard lives IN canvas, position clamped to stay visible

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { PROJECTS } from '@/lib/projects-data';
import type { Project } from '@/lib/projects-data';
import type { InfiniteGridProps, Size } from './InfiniteGrid.types';
import { Z_INDEX, VIEWPORT_BUFFER, PERFORMANCE, STICKY } from './InfiniteGrid.constants';
import { useCanvas } from './canvas/useCanvas';
import { clampCanvasPosition } from './canvas/clampToViewport';
import { getViewportBounds, getCameraTransform } from './canvas/transforms';
import { useBentoLayout, extractCategories } from './layout/useBentoLayout';
import { usePhysicsWorld } from './physics/usePhysicsWorld';
import { SearchCard } from './cards/SearchCard';
import { ProjectCard } from './cards/ProjectCard';
import { analytics } from '@/lib/analytics';

// Simple hooks
function useWindowSize(): Size {
  const [size, setSize] = useState<Size>({ width: 1920, height: 1080 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export function InfiniteGrid({
  isOpen,
  onClose,
  onSelectProject,
}: InfiniteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();
  const isMobile = useIsMobile();

  // Canvas state (pan/zoom)
  const { camera, reset, stopMomentum, isDragging, bind } = useCanvas({
    enabled: isOpen,
    windowSize,
  });

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = useMemo(() => extractCategories(PROJECTS), []);

  // Bento layout calculation - includes search card in layouts
  const { layouts, filtered, transition, phase } = useBentoLayout({
    projects: PROJECTS,
    searchTerm,
    selectedCategory,
  });

  // Get search card from layouts (it's now part of the grid)
  const searchLayout = layouts.get('__search__');
  const searchCardSize = useMemo(() => ({
    width: searchLayout?.width ?? STICKY.cardWidth,
    height: searchLayout?.height ?? STICKY.cardHeight,
  }), [searchLayout?.width, searchLayout?.height]);

  const searchLayoutPos = useMemo(() => ({
    x: searchLayout?.x ?? 0,
    y: searchLayout?.y ?? 0,
  }), [searchLayout?.x, searchLayout?.y]);

  // Calculate clamping for search card based on camera position
  const clampResult = useMemo(
    () => clampCanvasPosition(
      searchLayoutPos,
      searchCardSize,
      camera,
      windowSize,
      STICKY.edgePadding
    ),
    [searchLayoutPos, searchCardSize, camera, windowSize]
  );

  const clampedSearchPos = clampResult.position;
  const stickyEdge = clampResult.edge;
  const isClamped = clampResult.isClamped;

  // Physics world - only active when clamped (otherwise rigid grid)
  const { positions, isReady, updateSearchClampedPosition } = usePhysicsWorld({
    layouts,
    enabled: isOpen && isClamped, // Only enable physics when clamped!
    isMobile,
    transitionPhase: phase,
  });

  // Update physics when clamped state changes
  useEffect(() => {
    if (!isReady || !isClamped) return;
    updateSearchClampedPosition(clampedSearchPos.x, clampedSearchPos.y, isClamped);
  }, [clampedSearchPos.x, clampedSearchPos.y, isClamped, updateSearchClampedPosition, isReady]);

  // Search card position: use clamped pos when clamped, layout pos otherwise
  const searchPosition = isClamped ? clampedSearchPos : searchLayoutPos;

  // Viewport culling (skip search card - it's rendered separately)
  const visibleCardIds = useMemo(() => {
    const bounds = getViewportBounds(camera, windowSize, VIEWPORT_BUFFER);
    const maxCards = isMobile ? PERFORMANCE.maxVisibleCardsMobile : PERFORMANCE.maxVisibleCards;
    const visible: string[] = [];

    for (const [id, layout] of layouts) {
      // Skip search card - it's rendered separately
      if (id === '__search__') continue;

      // Use physics position only when clamped, otherwise use layout position
      const pos = isClamped ? positions.get(id) : undefined;
      const x = pos?.x ?? layout.x;
      const y = pos?.y ?? layout.y;

      const cardLeft = x - layout.width / 2;
      const cardRight = x + layout.width / 2;
      const cardTop = y - layout.height / 2;
      const cardBottom = y + layout.height / 2;

      const viewRight = bounds.x + bounds.width;
      const viewBottom = bounds.y + bounds.height;

      if (
        cardRight >= bounds.x &&
        cardLeft <= viewRight &&
        cardBottom >= bounds.y &&
        cardTop <= viewBottom
      ) {
        visible.push(id);
        if (visible.length >= maxCards) break;
      }
    }

    return visible;
  }, [layouts, positions, camera, windowSize, isMobile, isClamped]);

  // Handle project click
  const handleProjectClick = useCallback(
    (project: Project) => {
      analytics.projectViewed(project.id, project.name);
      onSelectProject?.(project);
    },
    [onSelectProject]
  );

  // Handle close
  const handleClose = useCallback(() => {
    stopMomentum();
    onClose();
  }, [stopMomentum, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      analytics.projectsModalOpened();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Canvas transform
  const canvasTransform = useMemo(
    () => getCameraTransform(camera, windowSize),
    [camera, windowSize]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 bg-[var(--overlay-strong)] backdrop-blur-md z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Projects infinite grid"
        >
          {/* Canvas container - handles pan/zoom gestures */}
          <div
            ref={containerRef}
            className={`absolute inset-0 overflow-hidden touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ zIndex: Z_INDEX.canvas }}
            {...bind()}
          >
            {/* Transformed canvas - all cards inside move with pan/zoom */}
            <div
              className="absolute will-change-transform"
              style={{ transform: canvasTransform, transformOrigin: '0 0' }}
            >
              {/* SearchCard - part of grid, clamped when it would go off-screen */}
              <SearchCard
                position={searchPosition}
                cardSize={searchCardSize}
                isStuck={isClamped}
                stickyEdge={stickyEdge}
                onClose={handleClose}
                onReset={reset}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                projectCount={PROJECTS.length}
                visibleCount={filtered.length}
              />

              {/* Project cards */}
              {visibleCardIds.map((id) => {
                const layout = layouts.get(id);
                const project = filtered.find((p) => p.id === id);
                if (!layout || !project) return null;

                const isEntering = transition.added.has(id);
                const isExiting = transition.removed.has(id);

                // Only use physics position when clamped (otherwise rigid grid)
                const physicsPos = isClamped ? positions.get(id) : undefined;

                return (
                  <ProjectCard
                    key={id}
                    project={project}
                    layout={layout}
                    physicsPosition={physicsPos}
                    onClick={() => handleProjectClick(project)}
                    isEntering={isEntering}
                    isExiting={isExiting}
                  />
                );
              })}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default InfiniteGrid;
