'use client';

/**
 * Inner content components for the BentoGrid search card.
 *
 * Three display modes are exported so both SearchMenuCard (canvas-anchored)
 * and DesktopCanvasView (fixed overlay) can render identical UI without
 * duplicating markup.
 */

import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import type { ThemeConfig } from '../BentoGrid.types';

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  paddingClass: string;
}

function SearchInput({ searchTerm, onSearchChange, paddingClass }: SearchInputProps) {
  return (
    <label className={`flex-1 min-w-0 flex items-center gap-2 rounded-md bg-white/5 border border-white/10 ${paddingClass}`}>
      <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
        className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
        aria-label="Search cards"
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
  );
}

interface CategoryFilterButtonProps {
  active: boolean;
  accentColor: string;
  children: string;
  interactive: boolean;
  onClick: () => void;
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
// ICON STRIP — left/right edge, high compression
// =============================================================================

export interface IconStripContentProps {
  theme: ThemeConfig;
  searchTerm: string;
  onToggleExpanded: () => void;
  onBack?: () => void;
}

export function IconStripContent({
  theme,
  searchTerm,
  onToggleExpanded,
  onBack,
}: IconStripContentProps) {
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
// COMPACT BAR — top/bottom edge, moderate compression
// =============================================================================

export interface CompactBarContentProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBack?: () => void;
  breadcrumb?: string;
}

export function CompactBarContent({
  searchTerm,
  onSearchChange,
  onBack,
  breadcrumb,
}: CompactBarContentProps) {
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
      <SearchInput
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        paddingClass="px-3 py-1.5"
      />
    </div>
  );
}

// =============================================================================
// FULL CONTENT — free state, no compression
// =============================================================================

export interface FullSearchContentProps {
  theme: ThemeConfig;
  expanded: boolean;
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
}

export function FullSearchContent({
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
}: FullSearchContentProps) {
  return (
    <div className="h-full min-w-0 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 min-w-0">
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
          >
            <ChevronDownIcon
              className="w-4 h-4 transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </div>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      <SearchInput
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        paddingClass="px-3 py-2"
      />

      <div
        className="relative min-h-0"
        style={{
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          height: expanded ? 'auto' : 0,
        }}
        aria-hidden={!expanded}
      >
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 -mx-1 pb-1">
          <CategoryFilterButton
            active={category === null}
            accentColor={theme.accent.primary}
            interactive={expanded}
            onClick={() => onCategoryChange(null)}
          >
            All
          </CategoryFilterButton>
          {categories.map((cat) => (
            <CategoryFilterButton
              key={cat}
              active={category === cat}
              accentColor={theme.accent.primary}
              interactive={expanded}
              onClick={() => onCategoryChange(cat === category ? null : cat)}
            >
              {cat}
            </CategoryFilterButton>
          ))}
        </div>
      </div>
    </div>
  );
}
