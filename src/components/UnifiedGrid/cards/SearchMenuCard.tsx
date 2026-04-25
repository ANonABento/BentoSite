'use client';

/**
 * SearchMenuCard - Morphing Search/Navigation Card
 *
 * Features:
 * - Expanded state: Full card with search, categories, back button
 * - Collapsed state: Compact bar with search input and expand button
 * - Auto-collapses when panned to edge
 * - Not clickable/navigable (control panel only)
 */

import { AnimatePresence } from 'framer-motion';
import type { ThemeConfig, SearchCardEdge } from '../UnifiedGrid.types';
import { CollapsedBar } from './SearchMenuCard.collapsed';
import { ExpandedCard } from './SearchMenuCard.expanded';

// =============================================================================
// PROPS
// =============================================================================

export interface SearchMenuCardProps {
  /** Theme configuration */
  theme: ThemeConfig;
  /** Whether expanded or collapsed */
  expanded: boolean;
  /** Which edge the card is stuck to */
  edge: SearchCardEdge;
  /** Screen position */
  position: { x: number; y: number };
  /** Current search term */
  searchTerm: string;
  /** Selected category */
  category: string | null;
  /** Available categories */
  categories: string[];
  /** Breadcrumb text (e.g., "bentOS / playground") */
  breadcrumb?: string;
  /** Callback to toggle expanded state */
  onToggleExpanded: () => void;
  /** Callback when search term changes */
  onSearchChange: (term: string) => void;
  /** Callback when category changes */
  onCategoryChange: (category: string | null) => void;
  /** Callback for back button */
  onBack?: () => void;
  /** Total card count */
  totalCards?: number;
  /** Filtered card count */
  filteredCards?: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SearchMenuCard({
  theme,
  expanded,
  edge,
  position,
  searchTerm,
  category,
  categories,
  breadcrumb,
  onToggleExpanded,
  onSearchChange,
  onCategoryChange,
  onBack,
  totalCards,
  filteredCards,
}: SearchMenuCardProps) {
  return (
    <AnimatePresence mode="wait">
      {expanded ? (
        <ExpandedCard
          key="expanded"
          theme={theme}
          position={position}
          searchTerm={searchTerm}
          category={category}
          categories={categories}
          breadcrumb={breadcrumb}
          onToggleExpanded={onToggleExpanded}
          onSearchChange={onSearchChange}
          onCategoryChange={onCategoryChange}
          onBack={onBack}
          totalCards={totalCards}
          filteredCards={filteredCards}
        />
      ) : (
        <CollapsedBar
          key="collapsed"
          theme={theme}
          edge={edge}
          position={position}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onToggleExpanded={onToggleExpanded}
          onBack={onBack}
        />
      )}
    </AnimatePresence>
  );
}

export default SearchMenuCard;
