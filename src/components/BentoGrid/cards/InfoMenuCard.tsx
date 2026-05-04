'use client';

/**
 * InfoMenuCard - BentoGrid info card with three display modes:
 *
 * 1. Free (compression=0): Full card with breadcrumb, search, categories, back button
 * 2. Compact bar (top/bottom edge): Horizontal bar with search input + back button
 * 3. Icon strip (left/right edge): Vertical strip with icon buttons
 */

import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, InfoIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardPosition, Position, ThemeConfig, InfoCardEdge } from '../BentoGrid.types';
import { INFO_CARD_ID } from '../BentoGrid.constants';
import { BaseCard } from './BaseCard';

// =============================================================================
// PROPS
// =============================================================================

export interface InfoMenuCardProps {
  theme: ThemeConfig;
  expanded: boolean;
  edge: InfoCardEdge;
  position: Position;
  compression: number;
  width: number;
  height: number;
  searchTerm: string;
  category: string | null;
  categories: string[];
  breadcrumb?: string;
  onToggleExpanded: () => void;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string | null) => void;
  onBack?: () => void;
  totalCards?: number;
  filteredCards?: number;
  helpText?: string;
  debugInfo?: {
    camera: string;
    visible: number;
    queue: number;
    focus?: string | null;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function CategoryFilterButton({
  active,
  accentColor,
  children,
  interactive,
  onClick,
}: {
  active: boolean;
  accentColor: string;
  children: string;
  interactive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 snap-start px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
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
// ICON STRIP (left/right edge, high compression)
// =============================================================================

function IconStripContent({
  theme,
  onBack,
  onToggleExpanded,
  searchTerm,
}: {
  theme: ThemeConfig;
  onBack?: () => void;
  onToggleExpanded: () => void;
  searchTerm: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 py-3">
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white/70" />
        </button>
      )}
      <button
        onClick={onToggleExpanded}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Search"
        style={{ color: searchTerm ? theme.accent.primary : undefined }}
      >
        <SearchIcon className="w-5 h-5 text-white/70" />
      </button>
      <button
        onClick={onToggleExpanded}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Toggle filters"
        style={{ color: theme.accent.primary }}
      >
        <ChevronDownIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

// =============================================================================
// COMPACT BAR (top/bottom edge, moderate compression)
// =============================================================================

function CompactBarContent({
  searchTerm,
  onSearchChange,
  onBack,
  breadcrumb,
}: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBack?: () => void;
  breadcrumb?: string;
}) {
  return (
    <div className="h-full flex items-center gap-2 px-3">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-4 h-4 text-white/70" />
        </button>
      )}
      <span className="text-xs text-white/40 font-mono truncate flex-shrink-0">
        {breadcrumb || 'bentOS'}
      </span>
      <label className="flex-1 min-w-0 flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-1.5">
        <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
          className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          aria-label="Info cards"
        />
        {searchTerm && (
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
  );
}

// =============================================================================
// FULL CONTENT (free state, no compression)
// =============================================================================

function FullContent({
  theme,
  expanded,
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
  helpText,
  debugInfo,
}: Omit<InfoMenuCardProps, 'edge' | 'position' | 'compression' | 'width' | 'height' | 'theme'> & { theme: ThemeConfig }) {
  const detailsOpacity = expanded ? 1 : 0;
  const detailsInteractive = expanded;

  return (
    <div className="relative h-full min-w-0 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs text-white/50 font-mono truncate">
          {breadcrumb || 'bentOS'}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {helpText && (
            <div className="relative group">
              <button
                type="button"
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                aria-label="Grid controls help"
                style={{ color: theme.accent.primary }}
              >
                <InfoIcon className="w-4 h-4" />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-8 z-20 w-60 rounded-md border border-white/10 bg-black/90 px-3 py-2 text-[11px] leading-relaxed text-white/75 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {helpText}
              </div>
            </div>
          )}
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
          >
            <ChevronDownIcon
              className="w-4 h-4 transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </div>
      </div>

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
      <label className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-2">
        <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
          className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          aria-label="Info cards"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Clear search"
          >
            <CloseIcon className="w-3 h-3 text-white/50" />
          </button>
        )}
      </label>

      {/* Category filters */}
      <div
        className="relative min-h-0"
        style={{
          opacity: detailsOpacity,
          pointerEvents: detailsInteractive ? 'auto' : 'none',
          height: expanded ? 'auto' : 0,
        }}
        aria-hidden={!detailsInteractive}
      >
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth snap-x px-1 pr-7 -mx-1 pb-1">
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
        <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 bg-gradient-to-l from-black/50 to-transparent" />
      </div>

      {debugInfo && (
        <div className="absolute bottom-3 left-4 right-4 rounded-md border border-white/10 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-white/55 shadow-lg backdrop-blur">
          <div>{debugInfo.camera}</div>
          <div>Visible: {debugInfo.visible} | Queue: {debugInfo.queue}</div>
          {debugInfo.focus ? <div>Focus: {debugInfo.focus}</div> : null}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InfoMenuCard({
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
  helpText,
  debugInfo,
}: InfoMenuCardProps) {
  const isSideEdge = (edge === 'left' || edge === 'right') && compression > 0.8;
  const isHorizontalEdge = (edge === 'top' || edge === 'bottom') && compression > 0.8;

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
      id={INFO_CARD_ID}
      position={cardPosition}
      theme={theme}
      positionMode="absolute"
      motionMode="instant"
      className="pointer-events-auto z-10"
      shellClassName="backdrop-blur-xl"
      shellStyle={{
        background: theme.searchCard.background,
        border: theme.searchCard.border,
        boxShadow: compression > 0
          ? `0 0 0 1px ${theme.accent.primary}33, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      hoverEnabled={compression === 0}
      onPointerDown={(event) => {
        // Stop all pointer events on the info card from reaching the
        // drag gesture handler on the parent canvas
        event.stopPropagation();
      }}
      ariaLabel="Search and filter cards"
    >
      {isSideEdge ? (
        <IconStripContent
          theme={theme}
          onBack={onBack}
          onToggleExpanded={onToggleExpanded}
          searchTerm={searchTerm}
        />
      ) : isHorizontalEdge ? (
        <CompactBarContent
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onBack={onBack}
          breadcrumb={breadcrumb}
        />
      ) : (
        <FullContent
          theme={theme}
          expanded={expanded}
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
          helpText={helpText}
          debugInfo={debugInfo}
        />
      )}
    </BaseCard>
  );
}
