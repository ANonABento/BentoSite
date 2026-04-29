'use client';

/**
 * UnifiedGrid - Infinite Grid Component
 *
 * A shared infinite grid system used by both /playground and /projects.
 * Features:
 * - FILO queue-based card recycling
 * - Pan/zoom navigation with momentum
 * - Keyboard navigation (WASD/arrows)
 * - Morphing search card (collapses to edge bar)
 * - Responsive: infinite canvas on desktop, scroll on mobile
 */

import { useMemo } from 'react';
import { useWindowSize } from './core';
import { THEMES, MOBILE } from './UnifiedGrid.constants';
import type { GridConfig, RenderCard } from './UnifiedGrid.types';
import { DesktopCanvasView } from './views/DesktopCanvasView';
import { MobileScrollView } from './views/MobileScrollView';

// =============================================================================
// PROPS
// =============================================================================

export interface UnifiedGridProps extends GridConfig {
  /** CSS class for the container */
  className?: string;
  /** Custom card renderer (isFocused indicates keyboard focus for accessibility) */
  renderCard?: RenderCard;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UnifiedGrid({
  className,
  theme,
  cards,
  onCardSelect,
  onBack,
  breadcrumb,
  renderCard,
}: UnifiedGridProps) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < MOBILE.BREAKPOINT;
  const themeConfig = THEMES[theme];

  // Extract unique categories from cards
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cards.forEach((card) => {
      if (card.category) cats.add(card.category);
    });
    return Array.from(cats).sort();
  }, [cards]);

  if (isMobile) {
    return (
      <MobileScrollView
        className={className}
        cards={cards}
        theme={themeConfig}
        categories={categories}
        breadcrumb={breadcrumb}
        onCardSelect={onCardSelect}
        onBack={onBack}
        renderCard={renderCard}
      />
    );
  }

  return (
    <DesktopCanvasView
      className={className}
      cards={cards}
      theme={themeConfig}
      categories={categories}
      breadcrumb={breadcrumb}
      onCardSelect={onCardSelect}
      renderCard={renderCard}
      onBack={onBack}
    />
  );
}
