'use client';

import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon, SettingsIcon } from '@/components/ui/Icons';
import type { ReactNode } from 'react';
import { SEARCH_CARD } from '../BentoGrid.constants';
import type { Position, SearchCardEdge, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from '../cards/BaseCard';

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
  entranceIndex?: number;
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
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors whitespace-nowrap"
      style={{
        color: active ? 'var(--text-on-overlay)' : 'var(--text-muted)',
        background: active ? `${accentColor}30` : 'var(--glass-bg)',
        border: active ? `1px solid ${accentColor}66` : '1px solid transparent',
      }}
      tabIndex={interactive ? 0 : -1}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  onClick,
  tabIndex,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      tabIndex={tabIndex}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-theme-subtle"
      style={{ color: 'var(--text-secondary)' }}
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
  entranceIndex,
}: SearchCardProps) {
  const detailsOpacity = expanded ? Math.max(0, 1 - compression * 1.6) : 0;
  const detailsInteractive = detailsOpacity > 0.7;
  const isSideSquashed = (edge === 'left' || edge === 'right') && compression > 0.45;
  const isTight = width < 220 || height < 120;
  const compactSearch = compression > 0.72 || isTight;
  const isSticky = compression > 0;
  const cardCount = filteredCards !== undefined && totalCards !== undefined && filteredCards !== totalCards
    ? `${filteredCards}/${totalCards}`
    : totalCards;

  return (
    <BaseCard
      theme={theme}
      size="2x1"
      interactive={false}
      isSticky={isSticky}
      entranceIndex={entranceIndex}
      className="fixed z-50"
      aria-label="Search and filter cards"
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{
        left: position.x - width / 2,
        top: position.y - height / 2,
        width,
        height,
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={SEARCH_CARD.spring}
      style={{
        left: position.x - width / 2,
        top: position.y - height / 2,
        width,
        height,
      }}
    >
      {isSideSquashed ? (
        <div className="flex h-full flex-col items-center justify-start gap-2 p-3">
          {onBack && (
            <IconButton label="Go back" onClick={onBack}>
              <ArrowLeftIcon className="h-4 w-4" />
            </IconButton>
          )}
          <IconButton label="Search cards">
            <SearchIcon className="h-4 w-4" />
          </IconButton>
          <IconButton label={expanded ? 'Hide filters' : 'Show filters'} onClick={onToggleExpanded}>
            <SettingsIcon className="h-4 w-4" />
          </IconButton>
          {cardCount !== undefined && (
            <span
              className="mt-auto font-mono text-[10px] [writing-mode:vertical-rl]"
              style={{ color: 'var(--text-muted)' }}
            >
              {cardCount}
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-full min-w-0 flex-col gap-3 p-4">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {breadcrumb || 'bentOS'}
            </span>
            <div className="flex flex-shrink-0 items-center gap-1">
              {cardCount !== undefined && (
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {cardCount}
                </span>
              )}
              <IconButton label={expanded ? 'Hide filters' : 'Show filters'} onClick={onToggleExpanded}>
                <ChevronDownIcon
                  className="h-4 w-4 transition-transform"
                  style={{
                    color: theme.accent.primary,
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </IconButton>
            </div>
          </div>

          {onBack && !compactSearch && (
            <button
              type="button"
              onClick={onBack}
              className="flex w-fit items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)', opacity: detailsOpacity }}
              tabIndex={detailsInteractive ? 0 : -1}
              aria-hidden={!detailsInteractive}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
          )}

          <div className="flex min-w-0 items-center gap-2">
            {onBack && compactSearch && (
              <IconButton label="Go back" onClick={onBack}>
                <ArrowLeftIcon className="h-4 w-4" />
              </IconButton>
            )}
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-theme bg-theme-subtle px-3 py-2">
              <SearchIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={compactSearch ? '' : 'Search...'}
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') event.currentTarget.blur();
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-theme-muted"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Search cards"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full hover:bg-theme-subtle"
                  aria-label="Clear search"
                >
                  <CloseIcon className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
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
            <div className="flex gap-1.5 overflow-x-auto px-1 pb-1">
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
      )}
    </BaseCard>
  );
}
