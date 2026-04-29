'use client';

import { motion } from 'framer-motion';
import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import type { Position, SearchCardEdge, ThemeConfig } from '../BentoGrid.types';

export interface SearchCardProps {
  theme: ThemeConfig;
  expanded: boolean;
  edge: SearchCardEdge;
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
      className={[
        'flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap',
        active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      ].join(' ')}
      style={{
        background: active ? `${accentColor}30` : 'var(--glass-bg)',
        border: active ? `1px solid ${accentColor}50` : '1px solid transparent',
      }}
      tabIndex={interactive ? 0 : -1}
    >
      {children}
    </button>
  );
}

export function SearchCard({
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
}: SearchCardProps) {
  const detailsOpacity = expanded ? Math.max(0, 1 - compression * 1.6) : 0;
  const detailsInteractive = detailsOpacity > 0.7;
  const isSideSquashed = (edge === 'left' || edge === 'right') && compression > 0.45;
  const isTight = width < 220 || height < 120;
  const compactSearch = compression > 0.72 || isTight;
  const headerInteractive = !isSideSquashed;

  return (
    <motion.div
      className="fixed z-50 select-none overflow-hidden backdrop-blur-md"
      style={{
        left: position.x - width / 2,
        top: position.y - height / 2,
        width,
        height,
        background: theme.searchCard.background,
        border: theme.searchCard.border,
        borderRadius: theme.card.borderRadius,
        boxShadow: compression > 0
          ? `0 0 0 1px ${theme.accent.primary}33, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      animate={{
        left: position.x - width / 2,
        top: position.y - height / 2,
        width,
        height,
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      aria-label="Search and filter cards"
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
          <span className="text-xs text-[var(--muted-foreground)] font-mono truncate">
            {breadcrumb || 'bentOS'}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {totalCards !== undefined && (
              <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                {filteredCards !== undefined && filteredCards !== totalCards
                  ? `${filteredCards}/${totalCards}`
                  : totalCards}
              </span>
            )}
            <button
              onClick={onToggleExpanded}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--glass-bg)] transition-colors"
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
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
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
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--glass-bg)]"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
          <label
            className={[
              'flex-1 min-w-0 flex items-center rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)]',
              isSideSquashed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2',
            ].join(' ')}
          >
            <SearchIcon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
            <input
              type="text"
              placeholder={compactSearch ? '' : 'Search...'}
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur();
              }}
              className={[
                'flex-1 min-w-0 bg-transparent text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] outline-none',
                isSideSquashed ? 'sr-only' : '',
              ].join(' ')}
              aria-label="Search cards"
            />
            {searchTerm && !isSideSquashed && (
              <button
                onClick={() => onSearchChange('')}
                className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[var(--glass-bg)]"
                aria-label="Clear search"
              >
                <CloseIcon className="w-3 h-3 text-[var(--muted-foreground)]" />
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
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 -mx-1 pb-1">
            <CategoryFilterButton
              active={category === null}
              accentColor={theme.accent.primary}
              interactive={detailsInteractive}
              onClick={() => onCategoryChange(null)}
            >
              All
            </CategoryFilterButton>
            {categories.map((nextCategory) => (
              <CategoryFilterButton
                key={nextCategory}
                active={category === nextCategory}
                accentColor={theme.accent.primary}
                interactive={detailsInteractive}
                onClick={() => onCategoryChange(nextCategory === category ? null : nextCategory)}
              >
                {nextCategory}
              </CategoryFilterButton>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
