'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import { PERFORMANCE, SEARCH_CARD } from '../UnifiedGrid.constants';
import type { SearchMenuCardProps } from './SearchMenuCard';

export function ExpandedCard({
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

      <div className="flex-1 p-4 flex flex-col gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

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
              <CloseIcon className="w-3 h-3 text-white/50" />
            </button>
          )}
        </div>

        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${theme.searchCard.background}, transparent)` }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${theme.searchCard.background}, transparent)` }}
          />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 -mx-1">
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors ${
                category === null ? 'text-white' : 'text-white/60 hover:text-white/80'
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
                  category === cat ? 'text-white' : 'text-white/60 hover:text-white/80'
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
