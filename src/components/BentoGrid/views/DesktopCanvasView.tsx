'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchCardState } from '../cards';
import {
  countContentCards,
  filterCards,
  getCameraTransform,
  screenToCanvas,
  startsOnInteractiveControl,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { SEARCH_DOCK_PREFIX, useTiledBoard } from '../core/useTiledBoard';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { ArrowLeftIcon, CloseIcon, RefreshIcon, SearchIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, CardSizeMode, RenderCard, ThemeConfig } from '../BentoGrid.types';
import type { BoardLayout } from '../layout/boardLayout';
import { DesktopCardLayer } from './DesktopCardLayer';

/** Cards keyboard focus can land on: not the search card or the empty docks. */
function navigable(layouts: Map<string, CardPosition>): Map<string, CardPosition> {
  return new Map([...layouts].filter(([id]) => id !== SEARCH_CARD_ID && !id.startsWith(SEARCH_DOCK_PREFIX)));
}

/** How long the search card glides when it docks in another copy of the board. */
const DOCK_GLIDE_MS = 320;
/** How long the camera takes to bring the search card into view. */
const SUMMON_MS = 450;

interface DesktopCanvasViewProps {
  className?: string;
  cards: CardData[];
  layout: BoardLayout;
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
  layout,
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

  const board = useTiledBoard({ cards, layout, camera: navigation.camera, windowSize });

  const searchCardLayout = board.visible.get(SEARCH_CARD_ID);

  const { applyFilter: handleFilterChange, resetAnchor } = board;
  const { reset: resetCamera } = navigation;
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

  // Bring the search card into view and focus its input. If it's stuck to an
  // edge, the camera glides until the nearest copy of its slot is on screen,
  // and the card docks there.
  const { cameraRef, setCamera, stopMomentum } = navigation;
  const glideRef = useRef<number | null>(null);
  const focusPendingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const stopGlide = useCallback(() => {
    if (glideRef.current !== null) cancelAnimationFrame(glideRef.current);
    glideRef.current = null;
  }, []);
  const { nearestSearchSlot } = board;
  const summonSearch = useCallback(() => {
    if (!isSearchSticky) {
      searchInputRef.current?.focus();
      return;
    }
    const from = cameraRef.current;
    const center = screenToCanvas(windowSize.width / 2, windowSize.height / 2, from, windowSize);
    const slot = nearestSearchSlot(center);
    if (!slot) return;

    // Shift the camera just enough to bring the slot inside the view, with a margin.
    const margin = 64 / from.zoom;
    const topLeft = screenToCanvas(0, 0, from, windowSize);
    const bottomRight = screenToCanvas(windowSize.width, windowSize.height, from, windowSize);
    const shift = (start: number, size: number, min: number, max: number) =>
      start < min + margin ? min + margin - start : start + size > max - margin ? max - margin - (start + size) : 0;
    const dx = shift(slot.x, slot.width, topLeft.x, bottomRight.x);
    const dy = shift(slot.y, slot.height, topLeft.y, bottomRight.y);

    stopMomentum();
    stopGlide();
    focusPendingRef.current = true;
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / SUMMON_MS);
      const eased = 1 - (1 - t) ** 3;
      setCamera({ x: from.x + dx * eased, y: from.y + dy * eased });
      glideRef.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    glideRef.current = requestAnimationFrame(step);
  }, [isSearchSticky, cameraRef, windowSize, nearestSearchSlot, setCamera, stopMomentum, stopGlide]);

  // The input mounts again when the card docks; take focus then if a summon asked for it.
  const takeSearchFocus = useCallback((input: HTMLInputElement | null) => {
    searchInputRef.current = input;
    if (input && focusPendingRef.current) {
      focusPendingRef.current = false;
      input.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        summonSearch();
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
  }, [onBack, summonSearch]);

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
      onPointerDownCapture={stopGlide}
      role="application"
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Drag or use WASD to pan, arrow keys to focus cards, Enter to open one, slash to search, and R to recenter.`}
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
            dimmed={board.dimmed}
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
              <IconStripContent onBack={onBack} onSearch={summonSearch} />
            ) : isSearchSticky ? (
              <CompactBarContent
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                onBack={onBack}
                inputRef={takeSearchFocus}
              />
            ) : (
              <FullSearchContent
                searchTerm={searchState.searchTerm}
                category={searchState.category}
                categories={categories}
                onSearchChange={searchState.setSearchTerm}
                onCategoryChange={searchState.setCategory}
                onRecenter={resetView}
                totalCards={projectTotal}
                filteredCards={projectMatches}
                panAtRef={panAtRef}
                inputRef={takeSearchFocus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline sticky content components (imported from SearchMenuCard would create circular dep)
function IconStripContent({ onBack, onSearch }: { onBack?: () => void; onSearch: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 py-3">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onSearch}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
        aria-label="Search projects"
        title="Search (/)"
      >
        <SearchIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

/** Window after a pan during which we let wheel events bubble through
 *  swallow-zones (chip row, search input) so cursor-cross mid-pan doesn't
 *  stutter. ~100ms covers a typical trackpad wheel inter-event gap. */
const MID_PAN_BUBBLE_WINDOW_MS = 120;

function FullSearchContent({ searchTerm, category, categories, onSearchChange, onCategoryChange, onRecenter, totalCards, filteredCards, panAtRef, inputRef }: {
  searchTerm: string;
  category: string | null;
  categories: string[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string | null) => void;
  onRecenter: () => void;
  totalCards: number;
  filteredCards: number;
  panAtRef: React.MutableRefObject<number>;
  inputRef: (input: HTMLInputElement | null) => void;
}) {
  const allCount = filteredCards !== totalCards ? `${filteredCards}/${totalCards}` : `${totalCards}`;

  // Same chips as the dock, so the card and the bar read as one object.
  const chipStyle = (active: boolean) =>
    active
      ? { background: 'var(--board-dock-chip-on)', color: 'var(--board-dock-chip-on-fg)' }
      : { background: 'var(--board-dock-chip)' };

  // Stop pointer/wheel events from bubbling up to the canvas gesture handler
  // for elements that need their own native interaction (text selection).
  // Buttons don't need this — useGesture's drag threshold (5px) keeps clicks
  // from registering as pans. Wheel exception: if a pan is currently in
  // motion, let the event bubble so the pan continues across this zone.
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
    <div className="h-full min-w-0 p-4 flex flex-col gap-3">
      <label
        {...stopGesture}
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: 'var(--board-dock-field)' }}
      >
        <span className="font-crt text-xl leading-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="search projects"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent font-crt text-xl leading-none placeholder:text-current placeholder:opacity-55 outline-none"
          aria-label="Search projects"
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

      {/* Categories wrap rather than scroll, so every one is visible. */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onCategoryChange(null)}
          className="px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium"
          style={chipStyle(category === null)}
        >
          All ({allCount})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat === category ? null : cat)}
            className="px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors font-medium"
            style={chipStyle(category === cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] opacity-70">
        <span>Drag or WASD to explore</span>
        <button
          onClick={onRecenter}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-black/10 hover:opacity-100 transition-colors"
          aria-label="Recenter the board"
        >
          <RefreshIcon className="w-3 h-3" />
          <span>Recenter</span>
          <kbd className="font-mono text-[10px] opacity-70">R</kbd>
        </button>
      </div>
    </div>
  );
}

function CompactBarContent({ searchTerm, onSearchChange, onBack, inputRef }: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBack?: () => void;
  inputRef: (input: HTMLInputElement | null) => void;
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
        <input ref={inputRef} type="text" placeholder="search projects" value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)} className="flex-1 min-w-0 bg-transparent font-crt text-xl leading-none placeholder:text-current placeholder:opacity-55 outline-none" aria-label="Search cards" />
        {searchTerm && (
          <button onClick={() => onSearchChange('')} className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/10" aria-label="Clear search">
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </label>
    </div>
  );
}
