// Layout Transitions
// Categorize changes between layouts for hybrid animation

import type { CardLayout, LayoutTransition } from '../InfiniteGrid.types';

/**
 * Categorize cards for transition animation
 *
 * Hybrid animation approach:
 * - kept: Cards that exist in both layouts → physics settle to new position
 * - removed: Cards that were removed → fade out, then delete
 * - added: Cards that are new → create body, then fade in
 */
export function categorizeTransition(
  oldLayouts: Map<string, CardLayout>,
  newLayouts: Map<string, CardLayout>
): LayoutTransition {
  const kept = new Set<string>();
  const removed = new Set<string>();
  const added = new Set<string>();

  // Find kept and removed
  for (const id of oldLayouts.keys()) {
    if (newLayouts.has(id)) {
      kept.add(id);
    } else {
      removed.add(id);
    }
  }

  // Find added
  for (const id of newLayouts.keys()) {
    if (!oldLayouts.has(id)) {
      added.add(id);
    }
  }

  return { kept, removed, added };
}

/**
 * Check if a transition has any changes
 */
export function hasTransitionChanges(transition: LayoutTransition): boolean {
  return transition.removed.size > 0 || transition.added.size > 0;
}

/**
 * Check if layouts have position changes for kept cards
 * Used to determine if physics settling is needed
 */
export function hasPositionChanges(
  oldLayouts: Map<string, CardLayout>,
  newLayouts: Map<string, CardLayout>,
  threshold = 1 // minimum pixel change to count
): boolean {
  for (const [id, newLayout] of newLayouts) {
    const oldLayout = oldLayouts.get(id);
    if (!oldLayout) continue;

    const dx = Math.abs(newLayout.x - oldLayout.x);
    const dy = Math.abs(newLayout.y - oldLayout.y);

    if (dx > threshold || dy > threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Create an empty transition (no changes)
 */
export function emptyTransition(): LayoutTransition {
  return {
    kept: new Set(),
    removed: new Set(),
    added: new Set(),
  };
}
