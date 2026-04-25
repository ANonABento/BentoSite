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

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeConfig, SearchCardEdge } from '../UnifiedGrid.types';
import { SEARCH_CARD, PERFORMANCE } from '../UnifiedGrid.constants';

// =============================================================================
// ICONS
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

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
// COLLAPSED BAR
// =============================================================================

function CollapsedBar({
  theme,
  edge,
  position,
  searchTerm,
  onSearchChange,
  onToggleExpanded,
  onBack,
}: Pick<
  SearchMenuCardProps,
  'theme' | 'edge' | 'position' | 'searchTerm' | 'onSearchChange' | 'onToggleExpanded' | 'onBack'
>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isVertical = edge === 'left' || edge === 'right';

  // Calculate dimensions
  const barWidth = isVertical
    ? SEARCH_CARD.COLLAPSED_HEIGHT
    : Math.min(
        typeof window !== 'undefined'
          ? window.innerWidth * SEARCH_CARD.COLLAPSED_WIDTH_PERCENT
          : SEARCH_CARD.COLLAPSED_MAX_WIDTH,
        SEARCH_CARD.COLLAPSED_MAX_WIDTH
      );
  const barHeight = SEARCH_CARD.COLLAPSED_HEIGHT;

  return (
    <motion.div
      className="fixed flex items-center gap-2 px-3 backdrop-blur-md z-50"
      style={{
        left: position.x - barWidth / 2,
        top: position.y - barHeight / 2,
        width: barWidth,
        height: barHeight,
        background: theme.searchCard.collapsedBackground,
        border: theme.searchCard.border,
        borderRadius: barHeight / 2,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: SEARCH_CARD.MORPH_DURATION / 1000 }}
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-4 h-4 text-white/70" />
        </button>
      )}

      {/* Search input */}
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
        <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none min-w-0"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <XIcon className="w-3 h-3 text-white/50" />
          </button>
        )}
      </div>

      {/* Expand button */}
      <button
        onClick={onToggleExpanded}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
        style={{ color: theme.accent.primary }}
        aria-label="Expand filters"
      >
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// =============================================================================
// EXPANDED CARD
// =============================================================================

function ExpandedCard({
  theme,
  position,
  searchTerm,
  category,
  categories,
  breadcrumb,
  onSearchChange,
  onCategoryChange,
  onToggleExpanded,
  onBack,
  totalCards,
  filteredCards,
}: Omit<SearchMenuCardProps, 'expanded' | 'edge'> & {
  position: { x: number; y: number };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search input. Skip when local matches the prop (e.g. initial
  // mount, or just after a fired debounce) so we don't trigger a redundant
  // applyFilter that resets visible cards and re-rolls rotations.
  useEffect(() => {
    if (debouncedSearch === searchTerm) return;

    const timeout = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, PERFORMANCE.SEARCH_DEBOUNCE);

    return () => clearTimeout(timeout);
  }, [debouncedSearch, searchTerm, onSearchChange]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cardWidth = SEARCH_CARD.EXPANDED_WIDTH;
  const cardHeight = SEARCH_CARD.EXPANDED_HEIGHT;

  return (
    <motion.div
      className="fixed backdrop-blur-md z-50 flex flex-col overflow-hidden"
      style={{
        left: position.x - cardWidth / 2,
        top: position.y - cardHeight / 2,
        width: cardWidth,
        height: cardHeight,
        background: theme.searchCard.background,
        border: theme.searchCard.border,
        borderRadius: 16,
        boxShadow: `0 8px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.accent.primary}20`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: SEARCH_CARD.MORPH_DURATION / 1000 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-xs text-white/50 font-mono truncate">
          {breadcrumb || 'bentOS'}
        </span>
        <button
          onClick={onToggleExpanded}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Collapse"
        >
          <ChevronDownIcon className="w-4 h-4 text-white/50 rotate-180" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          />
          {debouncedSearch && (
            <button
              onClick={() => {
                setDebouncedSearch('');
                onSearchChange('');
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <XIcon className="w-3 h-3 text-white/50" />
            </button>
          )}
        </div>

        {/* Category pills - horizontal scroll */}
        <div className="relative">
          {/* Left fade gradient */}
          <div
            className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${theme.searchCard.background}, transparent)` }}
          />
          {/* Right fade gradient */}
          <div
            className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${theme.searchCard.background}, transparent)` }}
          />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 -mx-1">
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors ${
                category === null
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={{
                background: category === null ? `${theme.accent.primary}30` : 'rgba(255,255,255,0.05)',
                border: category === null ? `1px solid ${theme.accent.primary}50` : '1px solid transparent',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat === category ? null : cat)}
                className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
                style={{
                  background: category === cat ? `${theme.accent.primary}30` : 'rgba(255,255,255,0.05)',
                  border: category === cat ? `1px solid ${theme.accent.primary}50` : '1px solid transparent',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {totalCards !== undefined && (
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/40">
          {filteredCards !== undefined && filteredCards !== totalCards
            ? `${filteredCards} / ${totalCards} items`
            : `${totalCards} items`}
        </div>
      )}
    </motion.div>
  );
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
