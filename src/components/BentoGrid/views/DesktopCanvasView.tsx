'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DesktopCardLayer } from './DesktopCardLayer';
import {
  SearchCardCompactBarContent,
  SearchCardFullContent,
  SearchCardIconStripContent,
} from '../cards/SearchMenuCard';

export interface DesktopCanvasViewProps {
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
              <SearchCardIconStripContent
                theme={theme}
                onBack={onBack}
                onToggleExpanded={searchState.toggleExpanded}
                searchTerm={searchState.searchTerm}
              />
            ) : isSearchSticky ? (
              <SearchCardCompactBarContent
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                onBack={onBack}
                breadcrumb={breadcrumb}
              />
            ) : (
              <SearchCardFullContent
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
