'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { SearchMenuCard, useSearchCardState } from '../cards';
import {
  getCameraTransform,
  isEditableTarget,
  screenToCanvas,
  useCamera,
  useCardNavigation,
  useCardPool,
  useSpawnManager,
  useViewport,
  useWindowSize,
} from '../core';
import { preserveLayoutWithExclusion } from '../layout';
import { usePhysicsWorld } from '../physics';
import { GRID, SEARCH_CARD } from '../BentoGrid.constants';
import type { CardData, CardLayout, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
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

  const cardPool = useCardPool({
    cards,
    rotationRange: theme.card.rotationRange,
  });

  const viewport = useViewport({
    camera: navigation.camera,
    buffer: GRID.SPAWN_BUFFER,
  });

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    onFilterChange: cardPool.applyFilter,
  });

  const searchLayout = useMemo<CardLayout>(() => {
    const isCompressed = searchState.edge !== 'none' && searchState.compression > 0;
    const center = isCompressed
      ? screenToCanvas(
          searchState.screenPosition.x,
          searchState.screenPosition.y,
          navigation.camera,
          windowSize,
        )
      : { x: 0, y: 0 };
    const width = isCompressed
      ? searchState.width / navigation.camera.zoom
      : SEARCH_CARD.EXPANDED_WIDTH;
    const height = isCompressed
      ? searchState.height / navigation.camera.zoom
      : SEARCH_CARD.EXPANDED_HEIGHT;

    return {
      id: '__search__',
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
      rotation: 0,
      size: '2x1',
    };
  }, [
    navigation.camera,
    searchState.compression,
    searchState.edge,
    searchState.height,
    searchState.screenPosition.x,
    searchState.screenPosition.y,
    searchState.width,
    windowSize,
  ]);

  const isSearchStuck = searchState.edge !== 'none' && searchState.compression > 0;

  const displayLayouts = useMemo(() => {
    if (!isSearchStuck) return cardPool.visible;

    return preserveLayoutWithExclusion(
      cardPool.visible,
      {
        x: searchLayout.x,
        y: searchLayout.y,
        width: searchLayout.width,
        height: searchLayout.height,
        padding: SEARCH_CARD.EXCLUSION_PADDING,
      },
    );
  }, [
    cardPool.visible,
    isSearchStuck,
    searchLayout,
  ]);

  const { positions, updateSearchCard, addCard, removeCard, applyEntranceBurst } = usePhysicsWorld({
    layouts: displayLayouts,
    enabled: true,
    isMobile: false,
  });

  const physicsBridge = useMemo(
    () => ({ addCard, removeCard, applyEntranceBurst }),
    [addCard, removeCard, applyEntranceBurst],
  );

  const currentLayouts = useMemo(() => {
    const layouts = new Map<string, CardPosition>();

    displayLayouts.forEach((layout, cardId) => {
      const physicsPosition = positions.get(cardId);
      layouts.set(cardId, physicsPosition
        ? {
            ...layout,
            x: physicsPosition.x,
            y: physicsPosition.y,
            rotation: (physicsPosition.angle * 180) / Math.PI,
          }
        : layout,
      );
    });

    return layouts;
  }, [displayLayouts, positions]);

  useEffect(() => {
    updateSearchCard(searchLayout, isSearchStuck);
  }, [isSearchStuck, searchLayout, updateSearchCard]);

  useSpawnManager({
    cardPool,
    viewport,
    camera: navigation.camera,
    rotationRange: theme.card.rotationRange,
    physics: physicsBridge,
    currentLayouts,
  });

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
    [navigation.camera, windowSize]
  );

  const navBindings = navigation.bind();

  return (
    <div
      id="main-content"
      className={['fixed inset-0 overflow-hidden', className].filter(Boolean).join(' ')}
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
          cardDataMap={cardPool.cardDataMap}
          physicsPositions={positions}
          theme={theme}
          focusedCardId={focusedCardId}
          renderCard={renderCard}
          onCardClick={handleCardClick}
        />
      </div>

      <SearchMenuCard
        theme={theme}
        expanded={searchState.expanded}
        edge={searchState.edge}
        position={searchState.screenPosition}
        compression={searchState.compression}
        width={searchState.width}
        height={searchState.height}
        searchTerm={searchState.searchTerm}
        category={searchState.category}
        categories={categories}
        breadcrumb={breadcrumb}
        onToggleExpanded={searchState.toggleExpanded}
        onSearchChange={searchState.setSearchTerm}
        onCategoryChange={searchState.setCategory}
        onBack={onBack}
        totalCards={cards.length}
        filteredCards={cardPool.visible.size + cardPool.queue.length}
      />

      <button
        onClick={navigation.reset}
        aria-label="Reset grid view"
        className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: theme.searchCard.background,
          border: theme.searchCard.border,
          color: theme.accent.primary,
        }}
      >
        Reset View (R)
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 text-xs text-white/50 font-mono">
          Camera: ({navigation.camera.x.toFixed(0)}, {navigation.camera.y.toFixed(0)}) z:{navigation.camera.zoom.toFixed(2)}
          <br />
          Visible: {cardPool.visible.size} | Queue: {cardPool.queue.length}
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
