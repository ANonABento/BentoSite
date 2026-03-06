// SearchCard - Bento grid search card
// Always lives IN the canvas, position is clamped by parent to stay visible

'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { Point, Size, StickyEdge } from '../InfiniteGrid.types';
import { STICKY, Z_INDEX } from '../InfiniteGrid.constants';
import { SearchIcon, CloseIcon, RefreshIcon } from '@/components/ui/Icons';

export interface SearchCardProps {
  /** Canvas position (already clamped by parent) */
  position: Point;
  /** Card dimensions */
  cardSize: Size;
  /** Whether position is currently clamped to an edge */
  isStuck: boolean;
  /** Which edge it's stuck to */
  stickyEdge: StickyEdge;
  onClose: () => void;
  onReset: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  projectCount: number;
  visibleCount: number;
}

export function SearchCard({
  position,
  cardSize,
  isStuck,
  stickyEdge: _stickyEdge, // Reserved for future edge-specific styling
  onClose,
  onReset,
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  projectCount,
  visibleCount,
}: SearchCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Simple absolute positioning - parent handles clamping
  const style = useMemo(() => ({
    position: 'absolute' as const,
    left: position.x - cardSize.width / 2,
    top: position.y - cardSize.height / 2,
    width: cardSize.width,
    height: cardSize.height,
    zIndex: Z_INDEX.cards, // Same level as project cards - it's a bento card
  }), [position, cardSize]);

  const isFiltered = searchTerm || selectedCategory !== 'All';

  return (
    <m.div
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.9,
      }}
      transition={STICKY.spring}
      className="select-none"
    >
      <div
        className={`
          h-full w-full rounded-2xl
          backdrop-blur-xl border bg-[var(--glass-bg)] p-4
          transition-all duration-200
          ${isStuck
            ? 'border-[var(--interactive)] shadow-[0_0_40px_var(--purple-muted)]'
            : 'border-[var(--border)]'
          }
        `}
      >
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <SearchIcon size={14} className="text-[var(--text-muted)]" />
            <span>Projects</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {visibleCount}/{projectCount}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            {/* Reset button */}
            <button
              onClick={onReset}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
              title="Reset view (R)"
            >
              <RefreshIcon size={14} />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--highlight)] hover:bg-[var(--highlight-muted)] rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--glass-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50 focus:border-[var(--interactive)] focus:outline-none transition-all"
          />
          <AnimatePresence>
            {searchTerm && (
              <m.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <CloseIcon size={12} />
              </m.button>
            )}
          </AnimatePresence>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 6).map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-2 py-1 text-[10px] font-mono border rounded-md transition-all ${
                selectedCategory === category
                  ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] border-[var(--interactive)]'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter indicator */}
        <AnimatePresence>
          {isFiltered && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-2 border-t border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Showing {visibleCount} results
                  {searchTerm && (
                    <span className="text-[var(--text-secondary)]">
                      {' '}for &ldquo;{searchTerm}&rdquo;
                    </span>
                  )}
                </span>
                <button
                  onClick={() => {
                    onSearchChange('');
                    onCategoryChange('All');
                  }}
                  className="text-[9px] font-mono text-[var(--interactive)] hover:underline"
                >
                  Clear
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
