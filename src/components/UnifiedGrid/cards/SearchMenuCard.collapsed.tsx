'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import { SEARCH_CARD } from '../UnifiedGrid.constants';
import type { SearchMenuCardProps } from './SearchMenuCard';

export function CollapsedBar({
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
      {onBack && (
        <button
          onClick={onBack}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-4 h-4 text-white/70" />
        </button>
      )}

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
            <CloseIcon className="w-3 h-3 text-white/50" />
          </button>
        )}
      </div>

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
