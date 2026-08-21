'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchCardState } from '../cards';
import {
  filterCards,
  getCameraTransform,
  startsOnInteractiveControl,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { countDistinctCards } from '../duplicate-fill';
import { useBoardController } from '../core/useBoardController';
import { usePhysicsWorld } from '../physics';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, RefreshIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, CardSizeMode, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DesktopCardLayer } from './DesktopCardLayer';

function withoutSearchCard(layouts: Map<string, CardPosition>): Map<string, CardPosition> {
  if (!layouts.has(SEARCH_CARD_ID)) return layouts;

  const nextLayouts = new Map(layouts);
  nextLayouts.delete(SEARCH_CARD_ID);
  return nextLayouts;
}

const BOARD_LOOP_IDLE_VELOCITY = 0.05;
const BOARD_LOOP_WAKE_MS = 300;

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
  cardSizeMode,
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
    cardSizeMode,
  });

  const searchCardLayout = board.visible.get(SEARCH_CARD_ID);

  const handleFilterChange = useCallback(
    (searchTerm: string, category: string | null) => {
      board.applyFilter(searchTerm, category);
      navigation.reset();
    },
    [board, navigation],
  );

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    searchCardLayout,
    onFilterChange: handleFilterChange,
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
  const { updateSearchCard, hasAwakeBodies } = usePhysicsWorld({
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

  // Track last camera position so we can derive per-frame velocity for the
  // spawn anchor's direction-bias. Smoothed with a low-pass filter to avoid
  // jitter on near-stationary frames.
  const lastCameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const activeUntilRef = useRef(0);
  const startBoardLoopRef = useRef<() => void>(() => {});
  const hasAwakeBodiesRef = useRef(hasAwakeBodies);

  useEffect(() => {
    hasAwakeBodiesRef.current = hasAwakeBodies;
  }, [hasAwakeBodies]);

  const wakeBoardLoop = useCallback(() => {
    activeUntilRef.current = performance.now() + BOARD_LOOP_WAKE_MS;
    startBoardLoopRef.current();
  }, []);

  useEffect(() => {
    let mounted = true;

    function loop(now: number) {
      rafIdRef.current = null;
      if (!mounted) return;

      const cam = navigation.cameraRef.current;
      let speed = 0;
      let tickChanged = false;

      if (cam) {
        const last = lastCameraRef.current;
        const dx = cam.x - last.x;
        const dy = cam.y - last.y;
        speed = Math.sqrt(dx * dx + dy * dy);
        // Exponential smoothing — keeps responsive while damping single-frame spikes.
        velocityRef.current = {
          x: velocityRef.current.x * 0.6 + dx * 0.4,
          y: velocityRef.current.y * 0.6 + dy * 0.4,
        };
        lastCameraRef.current = { x: cam.x, y: cam.y };
        tickChanged = boardTickRef.current(
          cam,
          windowSizeRef.current,
          getCurrentLayouts,
          velocityRef.current,
        );
      }

      if (
        tickChanged ||
        speed > BOARD_LOOP_IDLE_VELOCITY ||
        hasAwakeBodiesRef.current() ||
        now < activeUntilRef.current
      ) {
        rafIdRef.current = requestAnimationFrame(loop);
      }
    }

    const start = () => {
      if (!mounted || rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(loop);
    };

    startBoardLoopRef.current = start;
    start();

    return () => {
      mounted = false;
      startBoardLoopRef.current = () => {};
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [navigation.cameraRef, getCurrentLayouts]);

  useEffect(() => {
    wakeBoardLoop();
  }, [board.queue.length, displayLayouts, navigation.camera, wakeBoardLoop, windowSize]);

  const navigableLayouts = useMemo(
    () => withoutSearchCard(displayLayouts),
    [displayLayouts],
  );

  const cardNavigation = useCardNavigation({
    visible: navigableLayouts,
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
      wakeBoardLoop();

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
  }, [onBack, searchState, wakeBoardLoop]);

  const transform = useMemo(
    () => getCameraTransform(navigation.camera, windowSize),
    [navigation.camera, windowSize],
  );

  const navBindings = navigation.bind();

  // Tracks the timestamp of the last wheel event that reached the canvas
  // pan handler. If the cursor crosses an element that normally swallows
  // wheel (chip row, search input) WHILE a pan is in motion, that element
  // checks this ref and lets the event bubble through so panning doesn't
  // stutter mid-gesture. After ~100ms of inactivity, the element resumes
  // its native behavior (chip scroll, text caret).
  // Counts shown to the visitor are content counts, not board occupancy:
  // `cards` is already clone-filled to cover a wide canvas, and
  // `board.filteredCount` counts card instances on and near the board.
  const distinctTotal = useMemo(() => countDistinctCards(cards), [cards]);
  const distinctFiltered = useMemo(
    () => countDistinctCards(filterCards(cards, searchState.searchTerm, searchState.category)),
    [cards, searchState.searchTerm, searchState.category],
  );

  const panAtRef = useRef(0);
  const handleWrapperWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      wakeBoardLoop();
      panAtRef.current = Date.now();
      navBindings.onWheel?.(event);
    },
    [navBindings, wakeBoardLoop],
  );
  const handleWrapperPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      wakeBoardLoop();
      navBindings.onPointerDown?.(event);
    },
    [navBindings, wakeBoardLoop],
  );
  const handleWrapperPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      wakeBoardLoop();
      navBindings.onPointerUp?.(event);
    },
    [navBindings, wakeBoardLoop],
  );
  const handleWrapperMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      wakeBoardLoop();
      navBindings.onMouseDown?.(event);
    },
    [navBindings, wakeBoardLoop],
  );

  return (
    // Single gesture container holds the canvas AND the search overlay so
    // drag/wheel events on the search card's empty area bubble up here and
    // pan the viewport. Button clicks and input focus still work — useGesture
    // only fires onDrag past INTERACTION.dragThreshold (5px), so a click never
    // registers as a pan.
    <div
      id="main-content"
      className={['fixed inset-0 isolate', className].filter(Boolean).join(' ')}
      {...navBindings}
      onWheel={handleWrapperWheel}
      role="application"
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Use arrow keys to focus cards, Enter to open, WASD to pan, and R to reset view.`}
      tabIndex={-1}
      style={{ ...navBindings.style, background: theme.background }}
      onPointerDown={handleWrapperPointerDown}
      onPointerUp={handleWrapperPointerUp}
      onMouseDown={handleWrapperMouseDown}
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
                onReset={navigation.reset}
                totalCards={distinctTotal}
                filteredCards={distinctFiltered}
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
function IconStripContent({ theme, onBack, onToggleExpanded, searchTerm }: {
  theme: ThemeConfig;
  onBack?: () => void;
  onToggleExpanded: () => void;
  searchTerm: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 py-3">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-5 h-5 text-white/70" />
        </button>
      )}
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="Search" style={{ color: searchTerm ? theme.accent.primary : undefined }}>
        <SearchIcon className="w-5 h-5 text-white/70" />
      </button>
      <button onClick={onToggleExpanded} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label="Toggle filters" style={{ color: theme.accent.primary }}>
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

  const categoryButtonStyles = useMemo(() => ({
    active: {
      background: `${theme.accent.primary}30`,
      border: `1px solid ${theme.accent.primary}50`,
    },
    inactive: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid transparent',
    },
  }), [theme.accent.primary]);

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
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /><span>Back</span>
          </button>
        ) : <span />}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition-colors"
          aria-label="Reset view"
        >
          <RefreshIcon className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Search input — stop propagation so text selection drags don't pan. */}
      <label
        {...stopGesture}
        className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-2"
      >
        <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
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

      {/* Category filters — single row, horizontal scroll. The panel is a fixed
          2x1 card, so eight categories cannot fit: most of them start off-view.
          A fade alone did not say so clearly enough, hence the arrow. */}
      <div className="relative -mx-1 px-1">
        <div
          ref={categoryRowRef}
          {...stopGesture}
          className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5"
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
            className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${category === null ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
            style={category === null ? categoryButtonStyles.active : categoryButtonStyles.inactive}
          >
            All ({allCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === category ? null : cat)}
              className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${category === cat ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
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
            className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Keyboard hints — pinned to bottom of the card, lo-fi terminal feel */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-white/35">
        <span>
          <span className="text-white/55">wasd</span> pan
        </span>
        <span>
          <span className="text-white/55">R</span> reset
        </span>
        <span>
          <span className="text-white/55">&#x21B5;</span> open
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
        <button onClick={onBack} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-4 h-4 text-white/70" />
        </button>
      )}
      <label
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        className="flex-1 min-w-0 flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-1.5"
      >
        <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)} className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/40 outline-none" aria-label="Search cards" />
        {searchTerm && (
          <button onClick={() => onSearchChange('')} className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10" aria-label="Clear search">
            <CloseIcon className="w-3 h-3 text-white/50" />
          </button>
        )}
      </label>
    </div>
  );
}
