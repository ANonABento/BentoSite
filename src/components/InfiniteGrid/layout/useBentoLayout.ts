// useBentoLayout Hook
// Manages layout calculation and tracks transitions for animation
// Supports exclusion zones for clamped search card

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Project } from '@/lib/projects-data';
import type { CardLayout, LayoutTransition, TransitionPhase, UseBentoLayoutReturn, ExclusionZone } from '../InfiniteGrid.types';
import { ANIMATION } from '../InfiniteGrid.constants';
import { assignCardSizes, calculateBentoLayout, calculateBentoLayoutWithExclusion } from './algorithm';
import { categorizeTransition, emptyTransition, hasTransitionChanges } from './transitions';

interface UseBentoLayoutOptions {
  projects: Project[];
  searchTerm: string;
  selectedCategory: string;
  /** When search card is clamped, this is the zone to avoid */
  exclusionZone?: ExclusionZone;
}

export function useBentoLayout({
  projects,
  searchTerm,
  selectedCategory,
  exclusionZone,
}: UseBentoLayoutOptions): UseBentoLayoutReturn {
  // Track previous layouts for transition detection
  const prevLayoutsRef = useRef<Map<string, CardLayout>>(new Map());

  // Transition state
  const [transition, setTransition] = useState<LayoutTransition>(emptyTransition());
  const [phase, setPhase] = useState<TransitionPhase>('idle');

  // Timer refs for proper cleanup (fixes memory leak)
  const timersRef = useRef<number[]>([]);

  // Filter projects based on search and category
  const filtered = useMemo(() => {
    return projects.filter((project) => {
      // Category filter
      if (selectedCategory !== 'All' && project.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(search);
        const matchesDescription = project.shortDescription.toLowerCase().includes(search);
        const matchesTech = project.technologies.some((t) =>
          t.toLowerCase().includes(search)
        );

        if (!matchesName && !matchesDescription && !matchesTech) {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchTerm, selectedCategory]);

  // Assign sizes to filtered projects
  const cardSizes = useMemo(() => assignCardSizes(filtered), [filtered]);

  // Calculate layouts for filtered projects
  // Use exclusion zone layout when search card is clamped
  const layouts = useMemo(() => {
    if (exclusionZone) {
      return calculateBentoLayoutWithExclusion(filtered, cardSizes, exclusionZone);
    }
    return calculateBentoLayout(filtered, cardSizes);
  }, [filtered, cardSizes, exclusionZone]);

  // Detect and manage transitions when layouts change
  useEffect(() => {
    // Clear any pending timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const prevLayouts = prevLayoutsRef.current;
    const newTransition = categorizeTransition(prevLayouts, layouts);

    // Only trigger transition animation if there are actual changes
    if (hasTransitionChanges(newTransition)) {
      setTransition(newTransition);
      setPhase('removing');

      // Phase 1: Removed cards fade out
      const timer1 = window.setTimeout(() => {
        setPhase('settling');

        // Phase 2: Kept cards settle (physics handles this)
        const timer2 = window.setTimeout(() => {
          setPhase('adding');

          // Phase 3: New cards fade in
          const timer3 = window.setTimeout(() => {
            setPhase('idle');
            setTransition(emptyTransition());
          }, ANIMATION.fadeInDuration);

          timersRef.current.push(timer3);
        }, ANIMATION.settleDelay);

        timersRef.current.push(timer2);
      }, ANIMATION.fadeOutDuration);

      timersRef.current.push(timer1);
    }

    // Store current layouts for next comparison
    prevLayoutsRef.current = new Map(layouts);

    // Cleanup on unmount or before next effect run
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [layouts]);

  return {
    layouts,
    filtered,
    transition,
    phase,
  };
}

/**
 * Extract unique categories from projects
 */
export function extractCategories(projects: Project[]): string[] {
  const categories = new Set<string>();
  categories.add('All');

  for (const project of projects) {
    categories.add(project.category);
  }

  return Array.from(categories);
}
