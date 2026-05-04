'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useSearchCardState } from '../cards';
import {
  getCameraTransform,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { useBoardController } from '../core/useBoardController';
import { usePhysicsWorld } from '../physics';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DesktopCardLayer } from './DesktopCardLayer';

interface DesktopCanvasViewProps {
  className?: string;
  cards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  breadcrumb?: string;
  onCardSelect?: (card: CardData) => void;
  renderCard?: RenderCard;
  onBack?: () => void;
}

export function DesktopCanvasView({
  className,
  cards,
  theme,
  categories,
  breadcrumb,
  onCardSelect,
  renderCard,
  onBack,
}: DesktopCanvasViewProps) {
  const windowSize = useWindowSize();

  const navigation = useCamera({
    enabled: true,
    windowSize,
  });

  const board = useBoardController({
    cards,
    rotationRange: theme.card.rotationRange,
  });

  const searchCardLayout = board.visible.get(SEARCH_CARD_ID);

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    searchCardLayout,
    onFilterChange: board.applyFilter,
  });

  const isSearchSticky = searchState.compression > 0;

  // Rehome the search card when compression transitions from >0 to 0.
  // This anchors the grid home to wherever the ghost currently is.
  const prevCompressionRef = useRef(0);
  useEffect(() => {
    const prev = prevCompressionRef.current;
    prevCompressionRef.current = searchState.compression;

    if (prev > 0 && searchState.compression === 0 && searchState.ghostCanvasPosition) {
      board.rehomeSearchCard(
        searchState.ghostCanvasPosition.x,
        searchState.ghostCanvasPosition.y,
      );
    }
  }, [searchState.compression, searchState.ghostCanvasPosition, board]);

  // Display layouts: content cards at grid positions.
  // Search card uses sticky override when compressed, grid position when free.
  const displayLayouts = useMemo(() => {
    if (!searchState.stickyCanvasPosition) return board.visible;
    const layouts = new Map(board.visible);
    layouts.set(SEARCH_CARD_ID, searchState.stickyCanvasPosition);
    return layouts;
  }, [board.visible, searchState.stickyCanvasPosition]);

  // Physics is only used for search card collision body
  const { updateSearchCard } = usePhysicsWorld({
    layouts: displayLayouts,
    enabled: true,
    isMobile: false,
  });

  // Update search card physics body: static when sticky, dynamic when free
  const searchDisplayPos = displayLayouts.get(SEARCH_CARD_ID);
  useEffect(() => {
    if (!searchDisplayPos) return;
    updateSearchCard(
      { id: SEARCH_CARD_ID, ...searchDisplayPos },
      isSearchSticky,
    );
  }, [searchDisplayPos, isSearchSticky, updateSearchCard]);

  // Refs for the rAF loop
  const visibleRef = useRef<Map<string, CardPosition>>(displayLayouts);
  const windowSizeRef = useRef(windowSize);
  useEffect(() => { visibleRef.current = displayLayouts; }, [displayLayouts]);
  useEffect(() => { windowSizeRef.current = windowSize; }, [windowSize]);

  // getCurrentLayouts returns grid positions directly — no physics merge
  const getCurrentLayouts = useCallback((): Map<string, CardPosition> => {
    return new Map(visibleRef.current);
  }, []);

  // rAF loop — runs spawn/despawn at display refresh rate
  const boardTickRef = useRef(board.tick);
  useEffect(() => { boardTickRef.current = board.tick; }, [board.tick]);

  useEffect(() => {
    let rafId: number;

    function loop() {
      const cam = navigation.cameraRef.current;
      if (cam) {
        boardTickRef.current(cam, windowSizeRef.current, getCurrentLayouts);
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [navigation.cameraRef, getCurrentLayouts]);

  const cardNavigation = useCardNavigation({
    visible: displayLayouts,
    cards,
    onSelect: onCardSelect,
    enabled: true,
  });
  const { focusedCardId, setFocusedCardId } = cardNavigation;

  const handleCardClick = useCallback(
    (card: CardData) => {
      setFocusedCardId(card.id);
      onCardSelect?.(card);
    },
    [onCardSelect, setFocusedCardId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' || event.key === 'f') {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          searchState.setExpanded(true);
        }
      }

      if (event.key === 'Backspace' && onBack) {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, searchState]);

  const transform = useMemo(
    () => getCameraTransform(navigation.camera, windowSize),
    [navigation.camera, windowSize],
  );

  const navBindings = navigation.bind();

  return (
    <div
      id="main-content"
      className={['fixed inset-0 overflow-hidden isolate', className].filter(Boolean).join(' ')}
      {...navBindings}
      role="application"
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Use arrow keys to focus cards, Enter to open, WASD to pan, and R to reset view.`}
      tabIndex={-1}
      style={{ ...navBindings.style, background: theme.background }}
    >
      <div
        className="absolute will-change-transform"
        style={{
          transform,
          transformOrigin: '0 0',
        }}
      >
        <DesktopCardLayer
          layouts={displayLayouts}
          cardDataMap={board.cardDataMap}
          theme={theme}
          focusedCardId={focusedCardId}
          renderCard={renderCard}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Search card — always rendered as fixed overlay in screen space */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div
          className="pointer-events-auto absolute"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            left: searchState.screenPosition.x - searchState.width / 2,
            top: searchState.screenPosition.y - searchState.height / 2,
            width: searchState.width,
            height: searchState.height,
            transition: 'width 200ms ease-out, height 200ms ease-out',
          }}
        >
          <div
            className="h-full w-full overflow-hidden backdrop-blur-xl"
            style={{
              background: theme.searchCard.background,
              border: theme.searchCard.border,
              boxShadow: isSearchSticky
                ? `0 0 0 1px ${theme.accent.primary}33, ${theme.card.hoverShadow}`
                : theme.card.shadow,
              borderRadius: theme.card.borderRadius,
            }}
          >
            {isSearchSticky && (searchState.edge === 'left' || searchState.edge === 'right') ? (
              <IconStripContent
                theme={theme}
                onBack={onBack}
                onToggleExpanded={searchState.toggleExpanded}
                searchTerm={searchState.searchTerm}
              />
            ) : isSearchSticky ? (
              <CompactBarContent
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                onBack={onBack}
                breadcrumb={breadcrumb}
              />
            ) : (
              <FullSearchContent
                theme={theme}
                expanded={searchState.expanded}
                searchTerm={searchState.searchTerm}
                category={searchState.category}
                categories={categories}
                breadcrumb={breadcrumb}
                onToggleExpanded={searchState.toggleExpanded}
                onSearchChange={searchState.setSearchTerm}
                onCategoryChange={searchState.setCategory}
                onBack={onBack}
                totalCards={cards.length}
                filteredCards={board.filteredCount}
              />
            )}
          </div>
        </div>
      </div>

      <button
        onClick={navigation.reset}
        aria-label="Reset grid view"
        className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium transition-all z-20"
        style={{
          background: theme.searchCard.background,
          border: theme.searchCard.border,
          color: theme.accent.primary,
        }}
      >
        Reset View (R)
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 text-xs text-white/50 font-mono z-20">
          Camera: ({navigation.camera.x.toFixed(0)}, {navigation.camera.y.toFixed(0)}) z:{navigation.camera.zoom.toFixed(2)}
          <br />
          Visible: {board.visible.size} | Queue: {board.queue.length}
          {focusedCardId && (
            <>
              <br />
              Focus: {focusedCardId}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Inline sticky content components (imported from SearchMenuCard would create circular dep)
function IconStripContent({ theme, onBack, onToggleExpanded, searchTerm }: {
  theme: ThemeConfig;
  onBack?: () => void;
  onToggleExpanded: () => void;
  searchTerm: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 py-3">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors" aria-label="Search" style={{ color: searchTerm ? theme.accent.primary : undefined }}>
        <SearchIcon className="w-5 h-5" />
      </button>
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--glass-bg)] transition-colors" aria-label="Toggle filters" style={{ color: theme.accent.primary }}>
        <ChevronDownIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

function SearchField({
  searchTerm,
  onSearchChange,
  className = 'px-3 py-2',
}: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  className?: string;
}) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value),
    [onSearchChange],
  );

  return (
    <label className={`flex items-center gap-2 rounded-md bg-[var(--glass-bg)] border border-[var(--border)] ${className}`}>
      <SearchIcon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleChange}
        className="flex-1 min-w-0 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] outline-none"
        aria-label="Search cards"
      />
      {searchTerm && (
        <button
          onClick={() => onSearchChange('')}
          className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
          aria-label="Clear search"
        >
          <CloseIcon className="w-3 h-3" />
        </button>
      )}
    </label>
  );
}

function CategoryButton({
  active,
  children,
  onClick,
  accent,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full whitespace-nowrap ${
        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
      style={{
        background: active ? `${accent}30` : 'var(--glass-bg)',
        border: active ? `1px solid ${accent}50` : '1px solid var(--border)',
      }}
    >
      {children}
    </button>
  );
}

function FullSearchContent({
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
}: {
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
  totalCards: number;
  filteredCards: number;
}) {
  return (
    <div className="h-full min-w-0 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs text-[var(--text-muted)] font-mono truncate">{breadcrumb || 'bentOS'}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {filteredCards !== totalCards ? `${filteredCards}/${totalCards}` : totalCards}
          </span>
          <button onClick={onToggleExpanded} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--glass-bg)] transition-colors" aria-label={expanded ? 'Hide filters' : 'Show filters'} style={{ color: theme.accent.primary }}>
            <ChevronDownIcon className="w-4 h-4 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>
      </div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
          <ArrowLeftIcon className="w-4 h-4" /><span>Back to Dashboard</span>
        </button>
      )}
      <SearchField searchTerm={searchTerm} onSearchChange={onSearchChange} />
      {expanded && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <CategoryButton
            active={category === null}
            onClick={() => onCategoryChange(null)}
            accent={theme.accent.primary}
          >
            All
          </CategoryButton>
          {categories.map((cat) => (
            <CategoryButton
              key={cat}
              active={category === cat}
              onClick={() => onCategoryChange(cat === category ? null : cat)}
              accent={theme.accent.primary}
            >
              {cat}
            </CategoryButton>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactBarContent({ searchTerm, onSearchChange, onBack, breadcrumb }: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBack?: () => void;
  breadcrumb?: string;
}) {
  return (
    <div className="h-full flex items-center gap-2 px-3">
      {onBack && (
        <button onClick={onBack} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
      )}
      <span className="text-xs text-[var(--text-muted)] font-mono truncate flex-shrink-0">{breadcrumb || 'bentOS'}</span>
      <SearchField
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        className="flex-1 min-w-0 px-3 py-1.5"
      />
    </div>
  );
}
