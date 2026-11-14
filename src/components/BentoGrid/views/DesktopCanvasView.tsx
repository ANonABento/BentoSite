'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getImageProps } from 'next/image';
import { openedSearchCardBox, useSearchCardState, type SearchCardBox } from '../cards';
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
import { useSignal } from '../core/useSignal';
import { CAMERA, GRID, GRID_STEP, SEARCH_CARD, SEARCH_CARD_ID, getCardDimensions } from '../BentoGrid.constants';
import { ChevronDownIcon, CloseIcon, RefreshIcon, SearchIcon, ZoomInIcon, ZoomOutIcon } from '@/components/ui/Icons';
import type { CardData, CardPosition, CardSizeMode, Rect, RenderCard, SearchCardEdge, ThemeConfig } from '../BentoGrid.types';
import { sizeOf, type BoardLayout } from '../layout/boardLayout';
import { BoardField } from './BoardField';
import { DesktopCardLayer } from './DesktopCardLayer';

/** Cards keyboard focus can land on: not the search card or the empty docks. */
function navigable(layouts: Map<string, CardPosition>): Map<string, CardPosition> {
  return new Map([...layouts].filter(([id]) => id !== SEARCH_CARD_ID && !id.startsWith(SEARCH_DOCK_PREFIX)));
}

/** The intro's opening zoom (a multiple of the fit zoom), how long it holds there, and its glide in. */
const INTRO = {
  // Margin around the tile so the repeat peeks in at the edges of the wide shot.
  pad: 1.08,
  holdMs: 1100,
  glideMs: 1800,
  continueMs: 1700,
  hurryMs: 250,
  quickHoldMs: 120,
  quickMs: 1300,
};

/**
 * Opening zoom, as a multiple of the fit zoom. The camera stays on the home
 * group, so the shot is sized to the furthest card in each direction: every
 * project is on screen, then the glide comes back in to the default view.
 */
function introZoomFor(layout: BoardLayout, windowSize: { width: number; height: number }): number {
  const home = layout.cards.filter((card) => card.id === 'intro' || card.id === 'search' || card.id === 'contact');
  const originX = home.length
    ? (Math.min(...home.map((card) => card.col)) * GRID_STEP + Math.max(...home.map((card) => card.col + card.w)) * GRID_STEP - GRID.GAP) / 2
    : (layout.cols * GRID_STEP) / 2;
  const originY = home.length
    ? (Math.min(...home.map((card) => card.row)) * GRID_STEP + Math.max(...home.map((card) => card.row + card.h)) * GRID_STEP - GRID.GAP) / 2
    : (layout.rows * GRID_STEP) / 2;

  let halfW = 1;
  let halfH = 1;
  for (const card of layout.cards) {
    const x = card.col * GRID_STEP - originX;
    const y = card.row * GRID_STEP - originY;
    const w = card.w * GRID.CELL_SIZE + (card.w - 1) * GRID.GAP;
    const h = card.h * GRID.CELL_SIZE + (card.h - 1) * GRID.GAP;
    halfW = Math.max(halfW, -x, x + w);
    halfH = Math.max(halfH, -y, y + h);
  }
  const zoom = Math.min(windowSize.width / (2 * halfW * INTRO.pad), windowSize.height / (2 * halfH * INTRO.pad));
  return zoom / fitZoom(windowSize);
}

/** Start loading every board image now (during the prologue), at the sizes the cards will ask for. */
const preloaded = new Set<string>();
function preloadBoardImages(cards: CardData[], layout: BoardLayout) {
  if (typeof window === 'undefined') return;
  const byId = new Map(cards.map((card) => [card.id, card]));
  for (const slot of layout.cards) {
    const card = byId.get(slot.id) as unknown as { look?: { image?: string; zoom?: number }; thumbnail?: string } | undefined;
    const image = card?.look?.image ?? card?.thumbnail;
    if (!image) continue;
    const width = getCardDimensions(sizeOf(slot)).width * (card?.look?.zoom ?? 1);
    const sizes = `${Math.round(width * 1.5)}px`;
    const key = `${image}|${sizes}`;
    if (preloaded.has(key)) continue;
    preloaded.add(key);
    const { props } = getImageProps({ src: image, alt: '', fill: true, sizes });
    const img = new window.Image();
    img.decoding = 'async';
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  }
}

/** Same spring as the camera, slightly overdamped, so a dock or an open settles without a bounce. */
const SEARCH_SPRING = { k: CAMERA.spring.stiffness, c: CAMERA.spring.damping };

function zeroBox(): SearchCardBox {
  return { x: 0, y: 0, w: 0, h: 0 };
}

function addBox(a: SearchCardBox, b: SearchCardBox): SearchCardBox {
  return { x: a.x + b.x, y: a.y + b.y, w: a.w + b.w, h: a.h + b.h };
}

function subBox(a: SearchCardBox, b: SearchCardBox): SearchCardBox {
  return { x: a.x - b.x, y: a.y - b.y, w: a.w - b.w, h: a.h - b.h };
}

/** Springs `box` toward zero. The result is an offset from the grid, never a screen position. */
function springStep(box: SearchCardBox, vel: SearchCardBox, dt: number) {
  const next: SearchCardBox = { ...box };
  const nextVel: SearchCardBox = { ...vel };
  for (const key of ['x', 'y', 'w', 'h'] as const) {
    const accel = -SEARCH_SPRING.k * box[key] - SEARCH_SPRING.c * vel[key];
    nextVel[key] = vel[key] + accel * dt;
    next[key] = box[key] + nextVel[key] * dt;
  }
  return { box: next, vel: nextVel };
}

function springSettled(box: SearchCardBox, vel: SearchCardBox) {
  return (['x', 'y', 'w', 'h'] as const).every((key) => Math.abs(box[key]) < 0.5 && Math.abs(vel[key]) < 8);
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
  /** Open zoomed out while the cards fall in, then glide in to the home group. 'continue': no hold, and the glide
   *  starts at speed and eases out, carrying on the prologue's zoom into the screen. */
  intro?: boolean | 'continue' | 'quick';
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
  intro = false,
}: DesktopCanvasViewProps) {
  const windowSize = useWindowSize();
  const navigation = useCamera({
    enabled: true,
    windowSize,
    introZoom: intro ? introZoomFor(layout, windowSize) : undefined,
  });
  useEffect(() => preloadBoardImages(cards, layout), [cards, layout]);

  // The intro: the board opens zoomed out so its scale shows while the cards
  // fall in (and their images load), then the camera glides in to the home
  // group. Any wheel, drag or key cuts it short.
  //
  // It has to stay smooth with five times the usual cards on screen, so while
  // it runs (`booting`) the board renders as it stood at the opening zoom
  // (nothing mounts or unmounts mid-glide), and only the cards that can be on
  // screen when it lands are real; the rest are cheap stand-ins that become
  // real once it's over and they're out of sight.
  const [booting, setBooting] = useState(Boolean(intro));
  const [introCamera] = useState(navigation.camera);
  const { settle } = navigation;
  useEffect(() => {
    if (!intro) return;
    let landed = 0;
    const glide = (ms: number, easeOut?: boolean) => {
      if (!settle(ms, easeOut)) return;
      landed = window.setTimeout(() => setBooting(false), ms + 100);
    };
    const timer = intro === 'continue'
      ? window.setTimeout(() => glide(INTRO.continueMs, true), 0)
      : intro === 'quick'
        ? window.setTimeout(() => glide(INTRO.quickMs), INTRO.quickHoldMs)
        : window.setTimeout(() => glide(INTRO.glideMs), INTRO.holdMs);
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

  // Opening the card off an edge. The edge it opened from is remembered so a
  // pan onto a different edge folds it back up instead of retargeting mid-flight.
  const [panelEdge, setPanelEdge] = useState<SearchCardEdge | null>(null);
  if (panelEdge && searchState.edge !== panelEdge) setPanelEdge(null);

  // The card is drawn on the grid every frame. Opening, closing, and docking
  // only spring the gap closed: an offset from that grid position, so a pan
  // during the flight carries the card with the board instead of leaving it
  // behind in screen space.
  const closed: SearchCardBox = {
    x: searchState.screenPosition.x,
    y: searchState.screenPosition.y,
    w: searchState.width,
    h: searchState.height,
  };
  const target: SearchCardBox = panelEdge && panelEdge !== 'none'
    ? openedSearchCardBox(panelEdge, searchState.fullWidth, searchState.fullHeight, closed, windowSize)
    : closed;
  const releaseKey = `${board.anchorKey}|${panelEdge ?? ''}`;
  // A new dock or an open/close starts a spring. Comparing during render is
  // the supported way to react to a changed input without an effect.
  const [trackedRelease, setTrackedRelease] = useState(releaseKey);
  const [springing, setSpringing] = useState(false);
  if (releaseKey !== trackedRelease) {
    setTrackedRelease(releaseKey);
    setSpringing(true);
  }
  const targetRef = useRef(target);
  // `shown` is the last box drawn. `offset` is how far that still is from the grid.
  const springRef = useRef({ live: false, offset: zeroBox(), vel: zeroBox(), shown: target });
  const releaseRef = useRef(releaseKey);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef({
    fullW: searchState.fullWidth,
    fullH: searchState.fullHeight,
    pinRight: false,
    closed,
    radius: theme.card.borderRadius,
  });

  const writeOverlay = useCallback((shown: SearchCardBox) => {
    const motion = motionRef.current;
    const shell = shellRef.current;
    if (shell) {
      const w = Math.max(1, Math.min(shown.w, motion.fullW));
      const h = Math.max(1, Math.min(shown.h, motion.fullH));
      const clipLeft = motion.pinRight ? motion.fullW - w : 0;
      const shellLeft = shown.x - w / 2 - clipLeft;
      const shellTop = shown.y - h / 2;
      if (shell.style.width !== `${motion.fullW}px`) {
        shell.style.width = `${motion.fullW}px`;
        shell.style.height = `${motion.fullH}px`;
      }
      shell.style.transform = `translate3d(${shellLeft}px, ${shellTop}px, 0)`;
      shell.style.clipPath = `inset(0px ${Math.max(0, motion.fullW - clipLeft - w)}px ${Math.max(0, motion.fullH - h)}px ${clipLeft}px round ${motion.radius}px)`;
      const widthSpan = motion.fullW - SEARCH_CARD.SQUASHED_SIDE_WIDTH;
      const heightSpan = motion.fullH - SEARCH_CARD.COLLAPSED_HEIGHT;
      const narrow = widthSpan <= 1 ? 0 : 1 - clamp01((w - SEARCH_CARD.SQUASHED_SIDE_WIDTH) / widthSpan);
      const unfold = heightSpan <= 1 ? 1 : clamp01((h - SEARCH_CARD.COLLAPSED_HEIGHT) / heightSpan);
      const contentOpacity = clamp01(1 - narrow * 2);
      const detail = Math.max(0, unfold * 1.6 - 0.6);
      shell.style.setProperty('--search-detail', detail.toFixed(3));
      shell.style.setProperty('--search-detail-pe', unfold > 0.6 ? 'auto' : 'none');
      const content = contentRef.current;
      if (content) {
        content.style.opacity = String(contentOpacity);
        content.style.pointerEvents = contentOpacity > 0.5 ? '' : 'none';
      }
      const tab = tabRef.current;
      const tabBox = motion.closed;
      if (tab) {
        const tabOpacity = clamp01(narrow * 2 - 1);
        if (tab.style.width !== `${tabBox.w}px`) {
          tab.style.width = `${tabBox.w}px`;
          tab.style.height = `${tabBox.h}px`;
        }
        tab.style.transform = `translate3d(${tabBox.x - tabBox.w / 2}px, ${tabBox.y - tabBox.h / 2}px, 0)`;
        tab.style.opacity = String(tabOpacity);
        tab.style.pointerEvents = tabOpacity > 0.5 ? '' : 'none';
        tab.setAttribute('aria-hidden', tabOpacity > 0.5 ? 'false' : 'true');
      }
    }
  }, []);

  useLayoutEffect(() => {
    targetRef.current = target;
    motionRef.current = {
      fullW: searchState.fullWidth,
      fullH: searchState.fullHeight,
      pinRight: (panelEdge ?? searchState.edge) === 'right',
      closed,
      radius: theme.card.borderRadius,
    };
    const releaseChanged = releaseRef.current !== releaseKey;
    releaseRef.current = releaseKey;
    const spring = springRef.current;
    if (springing && (!spring.live || releaseChanged)) {
      // Keep the pixels where they were, and let that distance fall to zero.
      spring.live = true;
      spring.offset = subBox(spring.shown, target);
      spring.vel = zeroBox();
    }
    if (spring.live) {
      spring.shown = addBox(target, spring.offset);
      writeOverlay(spring.shown);
      return;
    }
    spring.offset = zeroBox();
    spring.shown = target;
    writeOverlay(target);
  });

  useEffect(() => {
    if (!springing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const spring = springRef.current;
      const stepped = springStep(spring.offset, spring.vel, dt);
      spring.offset = stepped.box;
      spring.vel = stepped.vel;
      if (springSettled(spring.offset, spring.vel)) {
        spring.offset = zeroBox();
        spring.vel = zeroBox();
        spring.live = false;
        spring.shown = targetRef.current;
        writeOverlay(spring.shown);
        setSpringing(false);
        return;
      }
      spring.shown = addBox(targetRef.current, spring.offset);
      writeOverlay(spring.shown);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [springing, writeOverlay]);

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

  // Focus the search input. In its slot, or folded along the top or bottom,
  // the field is already there. Against a side, open the card first.
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const summonSearch = useCallback(() => {
    if (searchState.side) setPanelEdge(searchState.edge);
    searchInputRef.current?.focus({ preventScroll: true });
  }, [searchState.side, searchState.edge]);
  const closePanel = useCallback(() => {
    setPanelEdge(null);
    searchInputRef.current?.blur();
  }, []);
  const togglePanel = useCallback(() => {
    setPanelEdge((open) => (open ? null : searchState.edge === 'none' ? null : searchState.edge));
  }, [searchState.edge]);

  useEffect(() => {
    if (!panelEdge) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (shellRef.current?.contains(target) || tabRef.current?.contains(target)) return;
      setPanelEdge(null);
    };
    window.addEventListener('pointerdown', closeOnOutside, true);
    return () => window.removeEventListener('pointerdown', closeOnOutside, true);
  }, [panelEdge]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        summonSearch();
      }
      if (event.key === 'Escape' && panelEdge) closePanel();

      if (event.key === 'Backspace' && onBack) {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, summonSearch, panelEdge, closePanel]);

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

  // CRT in motion: scanlines and colour fringes while the camera moves.
  useSignal(rootRef, navigation.camera, !booting);

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
      aria-label={`${breadcrumb ?? 'Card grid'} interactive grid. Drag or use WASD to pan, arrow keys to focus cards, Enter to open one, slash to search, and R to recenter.`}
      tabIndex={-1}
      style={navBindings.style}
    >
      {/* Canvas layer — clips the transformed card grid. The field sits in the walls. */}
      <div className="absolute inset-0 isolate overflow-hidden">
        <BoardField cameraRef={cameraRef} />
        <div
          className="board-layer absolute will-change-transform"
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
            live={landing}
            renderCard={renderCard}
            onCardClick={handleCardClick}
          />
        </div>
      </div>

      {/* Search overlay — `pointer-events-none` shell lets the canvas underneath
          receive any non-card clicks; the panel itself is `pointer-events-auto`
          but its events bubble up to the gesture handler on the wrapper.
          Position, clip and the tab fade are written straight to the nodes so
          the open and the dock glide don't re-render the board. */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ filter: isSearchSticky || panelEdge ? 'drop-shadow(0 10px 30px rgb(0 0 0 / 0.45))' : undefined }}
        >
          <div
            ref={shellRef}
            className="pointer-events-auto absolute left-0 top-0 will-change-transform"
            style={{
              background: 'var(--board-dock-bg)',
              color: 'var(--board-dock-fg)',
              borderRadius: theme.card.borderRadius,
            }}
            onBlur={(event) => {
              // Clicking or tabbing away folds the opened card back up.
              if (panelEdge && !event.currentTarget.contains(event.relatedTarget as Node | null)) setPanelEdge(null);
            }}
          >
            {/* Laid out at the fit-zoom size and scaled, so zooming never reflows it. The shell clips it to the folded window. */}
            <div
              ref={contentRef}
              className="origin-top-left"
              style={{
                width: searchState.fullWidth / searchState.scale,
                height: searchState.fullHeight / searchState.scale,
                transform: searchState.scale === 1 ? undefined : `scale(${searchState.scale})`,
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
                showHint={!isSearchSticky}
                showExpand={isSearchSticky && (searchState.edge === 'top' || searchState.edge === 'bottom')}
                panelOpen={panelEdge !== null}
                edge={searchState.edge}
                onTogglePanel={togglePanel}
              />
            </div>
          </div>
        </div>
        <div
          ref={tabRef}
          className="pointer-events-auto absolute left-0 top-0 overflow-hidden"
          style={{
            background: 'var(--board-dock-bg)',
            color: 'var(--board-dock-fg)',
            borderRadius: theme.card.borderRadius,
          }}
        >
          <SideTabContent
            onOpen={summonSearch}
            matches={projectMatches !== projectTotal ? projectMatches : null}
            query={searchState.searchTerm}
            category={searchState.category}
          />
        </div>
      </div>

    </div>
  );
}

/** The search card as a tab against a side edge. It stays this size and fades; the card opens beside it. */
function SideTabContent({ onOpen, matches, query, category }: { onOpen: () => void; matches: number | null; query: string; category: string | null }) {
  const name = query.trim() || category;
  const aria = name
    ? `Search projects, filtered by ${name}${matches !== null ? `, ${matches} shown` : ''}`
    : 'Search projects';
  return (
    <button
      onClick={onOpen}
      className="flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden px-1 py-3 transition-colors hover:bg-black/10"
      aria-label={aria}
      title="Search (/)"
      tabIndex={-1}
    >
      <SearchIcon className="h-5 w-5 shrink-0" />
      {name && (
        <span
          className="min-h-0 overflow-hidden font-crt text-sm leading-none [writing-mode:vertical-rl]"
          style={{ maskImage: 'linear-gradient(to bottom, #000 75%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000 75%, transparent)' }}
        >
          {name}
        </span>
      )}
      {matches !== null && (
        <span
          className="min-w-5 shrink-0 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none"
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

function FullSearchContent({ searchTerm, category, categories, onSearchChange, onCategoryChange, onRecenter, onZoom, zoomLevel, canZoomIn, canZoomOut, totalCards, filteredCards, panAtRef, inputRef, showHint, showExpand, panelOpen, edge, onTogglePanel }: {
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
  /** The explore hint, shown while the card sits in its slot. */
  showHint: boolean;
  /** Chevron that opens the full card off the top or bottom edge. */
  showExpand: boolean;
  panelOpen: boolean;
  edge: SearchCardEdge;
  onTogglePanel: () => void;
}) {
  // The chips and footer fade out as the card folds, a little ahead of being clipped.
  // The overlay writes these while it springs, so the fade doesn't need a re-render.
  const detail: React.CSSProperties = { opacity: 'var(--search-detail, 1)', pointerEvents: 'var(--search-detail-pe, auto)' as React.CSSProperties['pointerEvents'] };
  const expandUp = (edge === 'top' && panelOpen) || (edge === 'bottom' && !panelOpen);
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
    <div className="flex h-full min-w-0 flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <label
          {...stopGesture}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2"
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
        {showExpand && (
          <button
            onClick={onTogglePanel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-black/10"
            aria-label={panelOpen ? 'Hide filters' : 'Show filters'}
            title={panelOpen ? 'Hide filters' : 'Show filters'}
          >
            <ChevronDownIcon className="h-4 w-4 transition-transform" style={{ transform: expandUp ? 'rotate(180deg)' : undefined }} />
          </button>
        )}
      </div>

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

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px]" style={{ ...detail, opacity: 'calc(var(--search-detail, 1) * 0.7)' }}>
        {showHint && <span className="mr-auto">Drag or WASD to explore</span>}
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
