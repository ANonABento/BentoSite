'use client';

/**
 * SearchMenuCard - Regular BentoGrid search card with proportional edge squash.
 *
 * The card's logical slot remains the center 2x1 grid card. Its rendered shell
 * follows that slot while fully on-screen, then clamps to the viewport and
 * compresses smoothly as the slot moves farther off-screen.
 */

import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardPosition, Position, ThemeConfig, SearchCardEdge } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

// =============================================================================
// PROPS
// =============================================================================

export interface SearchMenuCardProps {
  /** Theme configuration */
  theme: ThemeConfig;
  /** Whether optional filter details are open */
  expanded: boolean;
  /** Which edge the card is stuck to */
  edge: SearchCardEdge;
  /** Screen position */
  position: Position;
  /** Proportional squash amount, from regular card (0) to edge card (1) */
  compression: number;
  /** Rendered width */
  width: number;
  /** Rendered height */
  height: number;
  /** Current search term */
  searchTerm: string;
  /** Selected category */
  category: string | null;
  /** Available categories */
  categories: string[];
  /** Breadcrumb text (e.g., "bentOS / playground") */
  breadcrumb?: string;
  /** Callback to toggle detail filters */
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

interface CategoryFilterButtonProps {
  active: boolean;
  accentColor: string;
  children: string;
  interactive: boolean;
  onClick: () => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest('button, input, select, textarea, a, [role="button"], [contenteditable="true"]')
  );
}

function CategoryFilterButton({
  active,
  accentColor,
  children,
  interactive,
  onClick,
}: CategoryFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
        active ? 'text-white' : 'text-white/60 hover:text-white/80'
      }`}
      style={{
        background: active ? `${accentColor}30` : 'rgba(255,255,255,0.05)',
        border: active ? `1px solid ${accentColor}50` : '1px solid transparent',
      }}
      tabIndex={interactive ? 0 : -1}
    >
      {children}
    </button>
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
  compression,
  width,
  height,
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
  const detailsOpacity = expanded ? Math.max(0, 1 - compression * 1.6) : 0;
  const detailsInteractive = detailsOpacity > 0.7;
  const isSideSquashed = (edge === 'left' || edge === 'right') && compression > 0.45;
  const isTight = width < 220 || height < 120;
  const compactSearch = compression > 0.72 || isTight;
  const headerInteractive = !isSideSquashed;
  const cardPosition: CardPosition = {
    x: position.x - width / 2,
    y: position.y - height / 2,
    width,
    height,
    rotation: 0,
    size: '2x1',
  };

  return (
    <BaseCard
      id="__search__"
      position={cardPosition}
      theme={theme}
      positionMode="fixed"
      motionMode="instant"
      className="z-50"
      shellClassName="backdrop-blur-md"
      shellStyle={{
        boxShadow: compression > 0
          ? `0 0 0 1px ${theme.accent.primary}33, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      hoverEnabled={compression === 0}
      onPointerDown={(event) => {
        if (isInteractiveTarget(event.target)) {
          event.stopPropagation();
        }
      }}
      ariaLabel="Search and filter cards"
    >
      <div className="h-full min-w-0 p-4 flex flex-col gap-3">
        <div
          className="flex items-center justify-between gap-2 min-w-0"
          style={{
            opacity: isSideSquashed ? 0 : 1,
            height: isSideSquashed ? 0 : 24,
            overflow: 'hidden',
          }}
          aria-hidden={isSideSquashed}
        >
          <span className="text-xs text-white/50 font-mono truncate">
            {breadcrumb || 'bentOS'}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {totalCards !== undefined && (
              <span className="text-[10px] text-white/40 font-mono">
                {filteredCards !== undefined && filteredCards !== totalCards
                  ? `${filteredCards}/${totalCards}`
                  : totalCards}
              </span>
            )}
            <button
              onClick={onToggleExpanded}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
              aria-label={expanded ? 'Hide filters' : 'Show filters'}
              style={{ color: theme.accent.primary }}
              tabIndex={headerInteractive ? 0 : -1}
            >
              <ChevronDownIcon
                className="w-4 h-4 transition-transform"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          </div>
        </div>

        {onBack && !compactSearch && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit"
            style={{ opacity: detailsOpacity }}
            tabIndex={detailsInteractive ? 0 : -1}
            aria-hidden={!detailsInteractive}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          {onBack && compactSearch && !isSideSquashed && (
            <button
              onClick={onBack}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-4 h-4 text-white/70" />
            </button>
          )}
          <label
            className={[
              'flex-1 min-w-0 flex items-center rounded-md bg-white/5 border border-white/10',
              isSideSquashed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2',
            ].join(' ')}
          >
            <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type="text"
              placeholder={compactSearch ? '' : 'Search...'}
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.currentTarget.blur();
                }
              }}
              className={[
                'flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/40 outline-none',
                isSideSquashed ? 'sr-only' : '',
              ].join(' ')}
              aria-label="Search cards"
            />
            {searchTerm && !isSideSquashed && (
              <button
                onClick={() => onSearchChange('')}
                className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Clear search"
              >
                <CloseIcon className="w-3 h-3 text-white/50" />
              </button>
            )}
          </label>
        </div>

        <div
          className="relative min-h-0"
          style={{
            opacity: detailsOpacity,
            pointerEvents: detailsInteractive ? 'auto' : 'none',
            height: expanded ? 'auto' : 0,
          }}
          aria-hidden={!detailsInteractive}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${theme.card.background}, transparent)` }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${theme.card.background}, transparent)` }}
          />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 -mx-1 pb-1">
            <CategoryFilterButton
              active={category === null}
              accentColor={theme.accent.primary}
              interactive={detailsInteractive}
              onClick={() => onCategoryChange(null)}
            >
              All
            </CategoryFilterButton>
            {categories.map((cat) => (
              <CategoryFilterButton
                key={cat}
                active={category === cat}
                accentColor={theme.accent.primary}
                interactive={detailsInteractive}
                onClick={() => onCategoryChange(cat === category ? null : cat)}
              >
                {cat}
              </CategoryFilterButton>
            ))}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
