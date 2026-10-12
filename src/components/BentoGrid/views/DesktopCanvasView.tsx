'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchCardState } from '../cards';
import {
  countContentCards,
  filterCards,
  getCameraTransform,
  startsOnInteractiveControl,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { SEARCH_DOCK_PREFIX, useTiledBoard } from '../core/useTiledBoard';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, RefreshIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, CardSizeMode, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DesktopCardLayer } from './DesktopCardLayer';

/** Cards keyboard focus can land on: not the search card or the empty docks. */
function navigable(layouts: Map<string, CardPosition>): Map<string, CardPosition> {
  return new Map([...layouts].filter(([id]) => id !== SEARCH_CARD_ID && !id.startsWith(SEARCH_DOCK_PREFIX)));
}

/** How long the search card glides when it docks in another copy of the board. */
const DOCK_GLIDE_MS = 320;

interface DesktopCanvasViewProps {
  className?: string;
  cards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  cardSizeMode?: CardSizeMode;
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

  const board = useTiledBoard({ cards, camera: navigation.camera, windowSize });

  const searchCardLayout = board.visible.get(SEARCH_CARD_ID);

  const { applyFilter, resetAnchor } = board;
  const { reset: resetCamera } = navigation;
  const handleFilterChange = useCallback(
    (searchTerm: string, category: string | null) => {
      applyFilter(searchTerm, category);
      resetCamera();
    },
    [applyFilter, resetCamera],
  );
  const resetView = useCallback(() => {
    resetAnchor();
    resetCamera();
  }, [resetAnchor, resetCamera]);

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    searchCardLayout,
    onFilterChange: handleFilterChange,
  });

  const isSearchSticky = searchState.compression > 0;

  // When the search card docks in another copy of the board, it glides there
  // rather than jumping. The glide lasts until the new anchor has settled.
  const [settledAnchor, setSettledAnchor] = useState(board.anchorKey);
  const gliding = settledAnchor !== board.anchorKey;
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledAnchor(board.anchorKey), DOCK_GLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [board.anchorKey]);

  // Display layouts: content cards at grid positions.
  // Search card uses sticky override when compressed, grid position when free.
  const displayLayouts = useMemo(() => {
    if (!searchState.stickyCanvasPosition) return board.visible;
    const layouts = new Map(board.visible);
    layouts.set(SEARCH_CARD_ID, searchState.stickyCanvasPosition);
    return layouts;
  }, [board.visible, searchState.stickyCanvasPosition]);

  const navigableLayouts = useMemo(() => navigable(displayLayouts), [displayLayouts]);

  const selectCard = useCallback((card: CardData) => onCardSelect?.(card), [onCardSelect]);

  const cardNavigation = useCardNavigation({
    visible: navigableLayouts,
    cardDataMap: board.cardDataMap,
    onSelect: selectCard,
    enabled: true,
  });
  const { focusedCardId, setFocusedCardId } = cardNavigation;

  const handleCardClick = useCallback(
    (card: CardData) => {
      setFocusedCardId(card.id);
      selectCard(card);
    },
    [selectCard, setFocusedCardId],
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

  // React registers wheel listeners as passive, so the gesture handler's
  // preventDefault is ignored, and the browser reads a horizontal two-finger
  // trackpad swipe as Back (and a pinch as page zoom). A native, non-passive
  // listener claims every wheel on the board. Rows that scroll natively
  // (category chips) opt out with data-wheel-scroll.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const claimWheel = (event: WheelEvent) => {
      const target = event.target as Element | null;
      if (!event.ctrlKey && target?.closest('[data-wheel-scroll]')) return;
      event.preventDefault();
    };
    // Safari's own pinch-zoom events.
    const claimGesture = (event: Event) => event.preventDefault();
    root.addEventListener('wheel', claimWheel, { passive: false });
    root.addEventListener('gesturestart', claimGesture);
    root.addEventListener('gesturechange', claimGesture);
    return () => {
      root.removeEventListener('wheel', claimWheel);
      root.removeEventListener('gesturestart', claimGesture);
      root.removeEventListener('gesturechange', claimGesture);
    };
  }, []);


  // Counts shown to the visitor are projects, not board occupancy: the board
  // shows every card many times over.
  const projectTotal = useMemo(() => countContentCards(cards), [cards]);
  const projectMatches = useMemo(
    () => countContentCards(filterCards(cards, searchState.searchTerm, searchState.category)),
    [cards, searchState.searchTerm, searchState.category],
  );

  // Tracks the timestamp of the last wheel event that reached the canvas
  // pan handler. If the cursor crosses an element that normally swallows
  // wheel (chip row, search input) WHILE a pan is in motion, that element
  // checks this ref and lets the event bubble through so panning doesn't
  // stutter mid-gesture. After ~100ms of inactivity, the element resumes
  // its native behavior (chip scroll, text caret).
  const panAtRef = useRef(0);
  const handleWrapperWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      panAtRef.current = Date.now();
      navBindings.onWheel?.(event);
    },
    [navBindings],
  );

  return (
    // Single gesture container holds the canvas AND the search overlay so
    // drag/wheel events on the search card's empty area bubble up here and
    // pan the viewport. Button clicks and input focus still work — useGesture
    // only fires onDrag past INTERACTION.dragThreshold (5px), so a click never
    // registers as a pan.
    <div
      ref={rootRef}
      id="main-content"
      className={['board-canvas fixed inset-0 isolate overscroll-none', className].filter(Boolean).join(' ')}
      {...navBindings}
      onWheel={handleWrapperWheel}
      role="application"
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Use arrow keys to focus cards, Enter to open, WASD to pan, and R to reset view.`}
      tabIndex={-1}
      style={{
        ...navBindings.style,
        // The dot grid pans with the board, at a fifth of the speed, for depth.
        backgroundPosition: `${navigation.camera.x * navigation.camera.zoom * 0.2}px ${navigation.camera.y * navigation.camera.zoom * 0.2}px`,
      }}
    >
      {/* Canvas layer — clips the transformed card grid */}
      <div className="absolute inset-0 overflow-hidden">
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
      </div>

      {/* Search overlay — `pointer-events-none` shell lets the canvas underneath
          receive any non-card clicks; the panel itself is `pointer-events-auto`
          but its events bubble up to the gesture handler on the wrapper. */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="pointer-events-auto absolute"
          style={{
            left: searchState.screenPosition.x - searchState.width / 2,
            top: searchState.screenPosition.y - searchState.height / 2,
            width: searchState.width,
            height: searchState.height,
            transition: gliding
              ? `width 200ms ease-out, height 200ms ease-out, left ${DOCK_GLIDE_MS}ms ease-out, top ${DOCK_GLIDE_MS}ms ease-out`
              : 'width 200ms ease-out, height 200ms ease-out',
          }}
        >
          <div
            className="h-full w-full overflow-hidden"
            style={{
              background: 'var(--board-dock-bg)',
              color: 'var(--board-dock-fg)',
              boxShadow: isSearchSticky ? theme.card.hoverShadow : theme.card.shadow,
              borderRadius: theme.card.borderRadius,
            }}
          >
            {isSearchSticky && (searchState.edge === 'left' || searchState.edge === 'right') ? (
              <IconStripContent
                onBack={onBack}
                onToggleExpanded={searchState.toggleExpanded}
              />
            ) : isSearchSticky ? (
              <CompactBarContent
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                onBack={onBack}
              />
            ) : (
              <FullSearchContent
                theme={theme}
                searchTerm={searchState.searchTerm}
                category={searchState.category}
                categories={categories}
                onSearchChange={searchState.setSearchTerm}
                onCategoryChange={searchState.setCategory}
                onBack={onBack}
                onReset={resetView}
                totalCards={projectTotal}
                filteredCards={projectMatches}
                panAtRef={panAtRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline sticky content components (imported from SearchMenuCard would create circular dep)
function IconStripContent({ onBack, onToggleExpanded }: {
  onBack?: () => void;
  onToggleExpanded: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 py-3">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors" aria-label="Search">
        <SearchIcon className="w-5 h-5" />
      </button>
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors" aria-label="Toggle filters">
        <ChevronDownIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

/** Window after a pan during which we let wheel events bubble through
 *  swallow-zones (chip row, search input) so cursor-cross mid-pan doesn't
 *  stutter. ~100ms covers a typical trackpad wheel inter-event gap. */
/** Categories beyond this many cannot fit the fixed-width panel in one row. */
const CATEGORY_SCROLL_THRESHOLD = 3;
const CATEGORY_SCROLL_STEP = 140;

const MID_PAN_BUBBLE_WINDOW_MS = 120;

function FullSearchContent({ theme, searchTerm, category, categories, onSearchChange, onCategoryChange, onBack, onReset, totalCards, filteredCards, panAtRef }: {
  theme: ThemeConfig;
  searchTerm: string;
  category: string | null;
  categories: string[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string | null) => void;
  onBack?: () => void;
  onReset: () => void;
  totalCards: number;
  filteredCards: number;
  panAtRef: React.MutableRefObject<number>;
}) {
  const allCount = filteredCards !== totalCards ? `${filteredCards}/${totalCards}` : `${totalCards}`;
  // The row holds far more chips than the panel is wide. Derive the affordance
  // from the category count rather than measuring the DOM: the panel is a fixed
  // size, so the threshold is stable, and no layout effect is needed.
  const categoryRowRef = useRef<HTMLDivElement>(null);
  const hasScrollableCategories = categories.length > CATEGORY_SCROLL_THRESHOLD;
  const scrollCategories = useCallback(() => {
    const row = categoryRowRef.current;
    if (!row) return;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
    row.scrollTo({
      left: atEnd ? 0 : row.scrollLeft + CATEGORY_SCROLL_STEP,
      behavior: 'smooth',
    });
  }, []);

  // Same chips as the dock, so the card and the bar read as one object.
  const categoryButtonStyles = {
    active: { background: 'var(--board-dock-chip-on)', color: 'var(--board-dock-chip-on-fg)' },
    inactive: { background: 'var(--board-dock-chip)' },
  };

  // Stop pointer/wheel events from bubbling up to the canvas gesture handler
  // for elements that need their own native interaction (text selection,
  // native horizontal scroll). Buttons don't need this — useGesture's drag
  // threshold (5px) keeps clicks from registering as pans.
  // Wheel exception: if a pan is currently in motion, let the event bubble
  // through so the pan continues smoothly when the cursor crosses this zone.
  const stopGesture = {
    onPointerDown: (event: React.PointerEvent) => {
      if (startsOnInteractiveControl(event.target)) return;
      event.stopPropagation();
    },
    onWheel: (event: React.WheelEvent) => {
      if (Date.now() - panAtRef.current < MID_PAN_BUBBLE_WINDOW_MS) return;
      event.stopPropagation();
    },
  };

  return (
    <div className="h-full min-w-0 p-4 flex flex-col gap-2.5">
      {/* Header: back left, reset right */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /><span>Back</span>
          </button>
        ) : <span />}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[11px] opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Reset view"
        >
          <RefreshIcon className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Search input — stop propagation so text selection drags don't pan. */}
      <label
        {...stopGesture}
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: 'var(--board-dock-field)' }}
      >
        <span className="font-crt text-xl leading-none">&gt;</span>
        <input
          type="text"
          placeholder="search projects"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent font-crt text-xl leading-none placeholder:text-current placeholder:opacity-55 outline-none"
          aria-label="Search cards"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/10"
            aria-label="Clear search"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </label>

      {/* Category filters — single row, horizontal scroll. The panel is a fixed
          2x1 card, so eight categories cannot fit: most of them start off-view.
          A fade alone did not say so clearly enough, hence the arrow. */}
      <div className="relative -mx-1 px-1">
        <div
          ref={categoryRowRef}
          {...stopGesture}
          data-wheel-scroll
          className="flex gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-hide pb-0.5"
          style={{
            maskImage: hasScrollableCategories
              ? 'linear-gradient(to right, black 0, black calc(100% - 28px), transparent 100%)'
              : undefined,
            WebkitMaskImage: hasScrollableCategories
              ? 'linear-gradient(to right, black 0, black calc(100% - 28px), transparent 100%)'
              : undefined,
          }}
        >
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium`}
            style={category === null ? categoryButtonStyles.active : categoryButtonStyles.inactive}
          >
            All ({allCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === category ? null : cat)}
              className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium`}
              style={category === cat ? categoryButtonStyles.active : categoryButtonStyles.inactive}
            >
              {cat}
            </button>
          ))}
        </div>

        {hasScrollableCategories ? (
          <button
            type="button"
            onClick={scrollCategories}
            aria-label="Show more categories"
            title="More categories"
            className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--board-dock-bg)', boxShadow: '0 0 0 1px var(--board-dock-chip)' }}
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Keyboard hints — pinned to bottom of the card, lo-fi terminal feel */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider opacity-60">
        <span>
          <span className="font-semibold">wasd</span> pan
        </span>
        <span>
          <span className="font-semibold">R</span> reset
        </span>
        <span>
          <span className="font-semibold">&#x21B5;</span> open
        </span>
      </div>
    </div>
  );
}

function CompactBarContent({ searchTerm, onSearchChange, onBack }: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBack?: () => void;
}) {
  return (
    <div className="h-full flex items-center gap-2 px-3">
      {onBack && (
        <button onClick={onBack} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
      )}
      <label
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        className="flex-1 min-w-0 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{ background: 'var(--board-dock-field)' }}
      >
        <span className="font-crt text-xl leading-none">&gt;</span>
        <input type="text" placeholder="search projects" value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)} className="flex-1 min-w-0 bg-transparent font-crt text-xl leading-none placeholder:text-current placeholder:opacity-55 outline-none" aria-label="Search cards" />
        {searchTerm && (
          <button onClick={() => onSearchChange('')} className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/10" aria-label="Clear search">
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </label>
    </div>
  );
}
