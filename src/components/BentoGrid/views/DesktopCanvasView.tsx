'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { holdInsideEdges, searchCardShape, useSearchCardState } from '../cards';
import {
  canvasToScreen,
  countContentCards,
  filterCards,
  fitZoom,
  getCameraTransform,
  screenToCanvas,
  startsOnInteractiveControl,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { SEARCH_DOCK_PREFIX, useTiledBoard } from '../core/useTiledBoard';
import { SEARCH_CARD, SEARCH_CARD_ID } from '../BentoGrid.constants';
import { CloseIcon, RefreshIcon, SearchIcon, ZoomInIcon, ZoomOutIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, CardSizeMode, Rect, RenderCard, ThemeConfig } from '../BentoGrid.types';
import type { BoardLayout } from '../layout/boardLayout';
import { DesktopCardLayer } from './DesktopCardLayer';

/** Cards keyboard focus can land on: not the search card or the empty docks. */
function navigable(layouts: Map<string, CardPosition>): Map<string, CardPosition> {
  return new Map([...layouts].filter(([id]) => id !== SEARCH_CARD_ID && !id.startsWith(SEARCH_DOCK_PREFIX)));
}

/** Set once the visitor has lit the board up, so it opens lit for the rest of the tab session. */
const EXPLORED_KEY = 'bentOS.explored';

function readExplored(): boolean {
  try {
    return sessionStorage.getItem(EXPLORED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * The cards lit while the board opens in its spotlight: the intro and
 * contact in the home copy. Every project starts dark and lights up while
 * the pointer is over it.
 */
function inSpotlight(instance: string, card: CardData): boolean {
  return instance.endsWith('@0,0') && (card.type === 'intro' || card.type === 'info');
}

/** The intro's opening zoom (a multiple of the fit zoom), how long it holds there, and its glide in. */
const INTRO = { zoom: 0.4, holdMs: 750, glideMs: 1100, hurryMs: 250 };

/** How long the search card glides when it docks in another copy of the board, or its drawer opens or closes. */
const DOCK_GLIDE_MS = 320;

interface ScreenBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function lerpBox(a: ScreenBox, b: ScreenBox, t: number): ScreenBox {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

interface DesktopCanvasViewProps {
  className?: string;
  cards: CardData[];
  layout: BoardLayout;
  theme: ThemeConfig;
  categories: string[];
  cardSizeMode?: CardSizeMode;
  breadcrumb?: string;
  onCardSelect?: (card: CardData, origin?: Rect) => void;
  renderCard?: RenderCard;
  onBack?: () => void;
  /** Open with only the highlights lit (inSpotlight) until the visitor lights the rest. */
  spotlight?: boolean;
  /** Open zoomed out while the cards fall in, then glide in to the home group. */
  intro?: boolean;
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
  spotlight = false,
  intro = false,
}: DesktopCanvasViewProps) {
  const windowSize = useWindowSize();
  const navigation = useCamera({
    enabled: true,
    windowSize,
    introZoom: intro ? INTRO.zoom : undefined,
  });

  // The intro: the board opens zoomed out so its scale shows while the cards
  // fall in (and their images load), then the camera glides in to the home
  // group. Any wheel, drag or key cuts it short.
  //
  // It has to stay smooth with five times the usual cards on screen, so while
  // it runs (`booting`) the board renders as it stood at the opening zoom
  // (nothing mounts or unmounts mid-glide), and only the cards that can be on
  // screen when it lands are real; the rest are cheap stand-ins that become
  // real once it's over and they're out of sight.
  const [booting, setBooting] = useState(intro);
  const [introCamera] = useState(navigation.camera);
  const { settle } = navigation;
  useEffect(() => {
    if (!intro) return;
    let landed = 0;
    const glide = (ms: number) => {
      if (!settle(ms)) return;
      landed = window.setTimeout(() => setBooting(false), ms + 100);
    };
    const timer = window.setTimeout(() => glide(INTRO.glideMs), INTRO.holdMs);
    const hurry = () => glide(INTRO.hurryMs);
    const events = ['wheel', 'pointerdown', 'keydown'] as const;
    for (const e of events) window.addEventListener(e, hurry, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(landed);
      for (const e of events) window.removeEventListener(e, hurry);
    };
  }, [intro, settle]);
  // Where the intro lands, in canvas px: cards outside it are stand-ins until then.
  const landing = useMemo(() => {
    if (!booting) return null;
    const camera = { ...introCamera, zoom: fitZoom(windowSize) };
    const topLeft = screenToCanvas(0, 0, camera, windowSize);
    const bottomRight = screenToCanvas(windowSize.width, windowSize.height, camera, windowSize);
    return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
  }, [booting, introCamera, windowSize]);

  const board = useTiledBoard({ cards, layout, camera: booting ? introCamera : navigation.camera, windowSize });

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

  // Where the search card is drawn, in screen px (centre and size). Normally
  // that's where useSearchCardState puts it. When it docks in another copy of
  // the board it glides from where it was to the dock, and the dock's position
  // is recomputed every frame, so the glide follows the camera instead of
  // chasing a stale target.
  const stuckToSide = isSearchSticky && searchState.side !== null;
  // Against a side the card is a drawer tab; opening it slides the input bar
  // out from that edge, at the tab's height, without moving the camera.
  const [drawer, setDrawer] = useState(false);
  if (drawer && !stuckToSide) setDrawer(false);
  const drawerOpen = drawer && stuckToSide;
  // Docked, the card zooms with the board (its content scaled, not
  // reflowed); stuck to an edge it's a control again, at default-zoom size.
  const layoutW = SEARCH_CARD.EXPANDED_WIDTH * fitZoom(windowSize);
  const layoutH = SEARCH_CARD.EXPANDED_HEIGHT * fitZoom(windowSize);
  const zoomRatio = navigation.camera.zoom / fitZoom(windowSize);
  const cardScale = zoomRatio + (1 - zoomRatio) * searchState.compression;
  const fullW = layoutW * cardScale;
  const fullH = layoutH * cardScale;
  const squished = searchCardShape(searchState.squeeze.x, searchState.squeeze.y, fullW, fullH);
  const held = holdInsideEdges(searchState.slotCenter, squished.width, squished.height, windowSize);
  const target: ScreenBox = drawerOpen
    ? {
        x: searchState.side === 'right' ? windowSize.width - SEARCH_CARD.EDGE_PADDING - fullW / 2 : SEARCH_CARD.EDGE_PADDING + fullW / 2,
        y: searchState.screenPosition.y,
        w: fullW,
        h: SEARCH_CARD.COLLAPSED_HEIGHT,
      }
    : { x: held.x, y: held.y, w: squished.width, h: squished.height };
  const shownRef = useRef<ScreenBox>(target);
  const [glide, setGlide] = useState<{ from: ScreenBox; t: number } | null>(null);
  const firstAnchor = useRef(true);
  useLayoutEffect(() => {
    if (firstAnchor.current) {
      firstAnchor.current = false;
      return;
    }
    setGlide({ from: shownRef.current, t: 0 });
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - startedAt) / DOCK_GLIDE_MS);
      setGlide((g) => (g && t < 1 ? { ...g, t } : null));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [board.anchorKey, drawerOpen]);
  const shown = glide ? lerpBox(glide.from, target, 1 - (1 - glide.t) ** 3) : target;
  useLayoutEffect(() => {
    shownRef.current = shown;
  });

  // How open the card is, from its drawn size: against a top or bottom edge
  // it folds down to the input row; against a side it narrows to a tab.
  const unfold = clamp01((shown.h - SEARCH_CARD.COLLAPSED_HEIGHT) / (fullH - SEARCH_CARD.COLLAPSED_HEIGHT));
  const narrow = 1 - clamp01((shown.w - SEARCH_CARD.SQUASHED_SIDE_WIDTH) / (fullW - SEARCH_CARD.SQUASHED_SIDE_WIDTH));
  const contentOpacity = clamp01(1 - narrow * 2);
  const tabOpacity = clamp01(narrow * 2 - 1);

  // Display layouts: content cards at grid positions.
  // Search card uses sticky override when compressed, grid position when free.
  const displayLayouts = useMemo(() => {
    if (!searchState.stickyCanvasPosition) return board.visible;
    const layouts = new Map(board.visible);
    layouts.set(SEARCH_CARD_ID, searchState.stickyCanvasPosition);
    return layouts;
  }, [board.visible, searchState.stickyCanvasPosition]);

  const navigableLayouts = useMemo(() => navigable(displayLayouts), [displayLayouts]);

  const selectCard = useCallback((card: CardData, origin?: Rect) => onCardSelect?.(card, origin), [onCardSelect]);

  const cardNavigation = useCardNavigation({
    visible: navigableLayouts,
    cardDataMap: board.cardDataMap,
    onSelect: selectCard,
    enabled: true,
  });
  const { focusedCardId, setFocusedCardId } = cardNavigation;

  // A clicked card reports where it is on screen, so whatever opens can grow out of it.
  // It reads the camera when clicked, so the card layer needn't re-render as the camera moves.
  const { camera, cameraRef } = navigation;
  const handleCardClick = useCallback(
    (card: CardData, layout: CardPosition) => {
      setFocusedCardId(card.id);
      const now = cameraRef.current;
      const topLeft = canvasToScreen(layout.x, layout.y, now, windowSize);
      selectCard(card, { x: topLeft.x, y: topLeft.y, width: layout.width * now.zoom, height: layout.height * now.zoom });
    },
    [selectCard, setFocusedCardId, cameraRef, windowSize],
  );

  // Focus the search input. Docked, or folded to a bar at the top or bottom,
  // it's right there; stuck to a side, the drawer slides it out first.
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const summonSearch = useCallback(() => {
    if (stuckToSide) setDrawer(true);
    searchInputRef.current?.focus({ preventScroll: true });
  }, [stuckToSide]);
  const closeDrawer = useCallback(() => {
    setDrawer(false);
    searchInputRef.current?.blur();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        summonSearch();
      }
      if (event.key === 'Escape' && drawerOpen) closeDrawer();

      if (event.key === 'Backspace' && onBack) {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, summonSearch, drawerOpen, closeDrawer]);

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

  // Spotlight: the board opens with only the highlights lit, so a first look
  // lands on who Kevin is. The pill at the bottom lights
  // the rest; so does wandering off the home group, or searching.
  const [lit, setLit] = useState(!spotlight);
  useLayoutEffect(() => {
    if (spotlight && readExplored()) setLit(true);
  }, [spotlight]);
  const lightUp = useCallback(() => {
    setLit(true);
    try {
      sessionStorage.setItem(EXPLORED_KEY, '1');
    } catch {}
  }, []);
  const wandered =
    Math.abs(camera.x) * camera.zoom > windowSize.width / 2 || Math.abs(camera.y) * camera.zoom > windowSize.height / 2;
  const searching = searchState.searchTerm !== '' || searchState.category !== null;
  useEffect(() => {
    if (!lit && (wandered || searching)) lightUp();
  }, [lit, wandered, searching, lightUp]);

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
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Drag or use WASD to pan, arrow keys to focus cards, Enter to open one, slash to search, and R to recenter.`}
      tabIndex={-1}
      style={navBindings.style}
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
            spotlit={lit ? null : inSpotlight}
            live={landing}
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
          style={{ left: shown.x - shown.w / 2, top: shown.y - shown.h / 2, width: shown.w, height: shown.h }}
          onBlur={(event) => {
            // Clicking or tabbing away tucks the drawer back in.
            if (drawerOpen && !event.currentTarget.contains(event.relatedTarget as Node | null)) setDrawer(false);
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              background: 'var(--board-dock-bg)',
              color: 'var(--board-dock-fg)',
              // Lifted off the board while stuck to an edge, flush in its compartment when docked.
              boxShadow: isSearchSticky ? '0 10px 30px rgb(0 0 0 / 0.45)' : 'none',
              borderRadius: theme.card.borderRadius,
            }}
          >
            {/* Laid out at full size and clipped, so folding never reflows it; the input row stays put on top. */}
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: layoutW,
                height: layoutH,
                transform: cardScale === 1 ? undefined : `scale(${cardScale})`,
                opacity: contentOpacity,
                pointerEvents: contentOpacity > 0.5 ? undefined : 'none',
              }}
            >
              <FullSearchContent
                searchTerm={searchState.searchTerm}
                category={searchState.category}
                categories={categories}
                onSearchChange={searchState.setSearchTerm}
                onCategoryChange={searchState.setCategory}
                onRecenter={resetView}
                onZoom={navigation.zoom}
                zoomLevel={navigation.zoomLevel}
                canZoomIn={navigation.canZoomIn}
                canZoomOut={navigation.canZoomOut}
                totalCards={projectTotal}
                filteredCards={projectMatches}
                panAtRef={panAtRef}
                inputRef={searchInputRef}
                unfold={unfold}
              />
            </div>
            {tabOpacity > 0 && (
              <div className="absolute inset-0" style={{ opacity: tabOpacity, pointerEvents: tabOpacity > 0.5 ? undefined : 'none' }}>
                <SideTabContent
                  onOpen={summonSearch}
                  matches={projectMatches !== projectTotal ? projectMatches : null}
                  query={searchState.searchTerm}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!lit && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.3 } }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
          >
            <button
              onClick={lightUp}
              className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-[0_10px_30px_rgb(0_0_0/0.45)] transition-transform hover:scale-[1.03]"
              style={{ background: 'var(--board-dock-bg)', color: 'var(--board-dock-fg)' }}
            >
              <span className="opacity-70">Highlights</span>
              <span aria-hidden className="opacity-40">·</span>
              <span className="font-semibold">Show all {projectTotal}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The search card as a drawer tab against a side edge. Opening it slides the input bar out. */
function SideTabContent({ onOpen, matches, query }: { onOpen: () => void; matches: number | null; query: string }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-full w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-black/10"
      aria-label={query ? `Search projects (filtered by “${query}”)` : 'Search projects'}
      title="Search (/)"
    >
      <SearchIcon className="h-5 w-5 shrink-0" />
      <span className="font-crt text-lg leading-none [writing-mode:vertical-rl]">{query ? query.slice(0, 10) : 'search'}</span>
      {matches !== null && (
        <span
          className="min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none"
          style={{ background: 'var(--board-dock-chip-on)', color: 'var(--board-dock-chip-on-fg)' }}
        >
          {matches}
        </span>
      )}
    </button>
  );
}

/** Window after a pan during which we let wheel events bubble through
 *  swallow-zones (chip row, search input) so cursor-cross mid-pan doesn't
 *  stutter. ~100ms covers a typical trackpad wheel inter-event gap. */
const MID_PAN_BUBBLE_WINDOW_MS = 120;

function FullSearchContent({ searchTerm, category, categories, onSearchChange, onCategoryChange, onRecenter, onZoom, zoomLevel, canZoomIn, canZoomOut, totalCards, filteredCards, panAtRef, inputRef, unfold }: {
  searchTerm: string;
  category: string | null;
  categories: string[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string | null) => void;
  onRecenter: () => void;
  onZoom: (steps: number) => void;
  zoomLevel: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  totalCards: number;
  filteredCards: number;
  panAtRef: React.MutableRefObject<number>;
  inputRef: React.Ref<HTMLInputElement>;
  /** 1 when the card is fully open; falls to 0 as it folds down to the input row. */
  unfold: number;
}) {
  // The chips and footer fade out as the card folds, a little ahead of being clipped.
  const detail = { opacity: Math.max(0, unfold * 1.6 - 0.6), pointerEvents: unfold > 0.6 ? undefined : ('none' as const) };
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
      <div className="flex flex-wrap gap-1.5" style={detail}>
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

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px]" style={{ ...detail, opacity: detail.opacity * 0.7 }}>
        <span>Drag or WASD to explore</span>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => onZoom(-1)}
            disabled={!canZoomOut}
            className="rounded-md p-1 hover:bg-black/10 disabled:opacity-35 disabled:hover:bg-transparent"
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <ZoomOutIcon className="h-3.5 w-3.5" />
          </button>
          <span className="w-9 text-center tabular-nums" aria-live="polite">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => onZoom(1)}
            disabled={!canZoomIn}
            className="rounded-md p-1 hover:bg-black/10 disabled:opacity-35 disabled:hover:bg-transparent"
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomInIcon className="h-3.5 w-3.5" />
          </button>
        </div>
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
