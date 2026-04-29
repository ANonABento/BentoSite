'use client';

import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  getCameraTransform,
  screenToCanvas,
  useCamera,
  useCardNavigation,
  useCardPool,
  useSpawnManager,
  useViewport,
  useWindowSize,
} from '../core';
import { SEARCH_CARD } from '../BentoGrid.constants';
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { usePhysicsWorld } from '../physics';
import { SearchCard, useSearchCardState } from '../search';
import { DefaultCard } from '../cards';

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

const SEARCH_BODY_ID = '__search__';

function getPhysicsRenderPosition(
  position: CardPosition,
  physicsPosition: { x: number; y: number; angle: number } | undefined,
): CardPosition {
  if (!physicsPosition) return position;

  return {
    ...position,
    x: physicsPosition.x,
    y: physicsPosition.y,
    rotation: (physicsPosition.angle * 180) / Math.PI,
  };
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

  const physics = usePhysicsWorld({
    layouts: cardPool.visible,
    enabled: true,
    isMobile: false,
  });

  const viewport = useViewport({
    camera: navigation.camera,
  });

  useSpawnManager({
    cardPool,
    viewport,
    camera: navigation.camera,
    rotationRange: theme.card.rotationRange,
    physics,
  });

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    onFilterChange: cardPool.applyFilter,
  });

  const cardNavigation = useCardNavigation({
    visible: cardPool.visible,
    cards,
    onSelect: onCardSelect,
    enabled: true,
  });

  const cardDataById = useMemo(() => {
    const next = new Map<string, CardData>();
    cards.forEach((card) => next.set(card.id, card));
    return next;
  }, [cards]);

  const filteredCount = cardPool.visible.size + cardPool.queue.length;

  const searchCanvasLayout = useMemo(() => {
    const topLeft = screenToCanvas(
      searchState.screenPosition.x - searchState.width / 2,
      searchState.screenPosition.y - searchState.height / 2,
      navigation.camera,
      windowSize,
    );

    return {
      id: SEARCH_BODY_ID,
      x: topLeft.x,
      y: topLeft.y,
      width: searchState.width / navigation.camera.zoom,
      height: searchState.height / navigation.camera.zoom,
      rotation: 0,
      size: '2x1' as const,
    };
  }, [
    navigation.camera,
    searchState.height,
    searchState.screenPosition.x,
    searchState.screenPosition.y,
    searchState.width,
    windowSize,
  ]);

  useEffect(() => {
    physics.updateSearchCard(searchCanvasLayout, searchState.compression > 0.01);
  }, [physics, searchCanvasLayout, searchState.compression]);

  useEffect(() => {
    physics.updateTargets(cardPool.visible);
  }, [cardPool.visible, physics]);

  const handleCardClick = useCallback(
    (card: CardData) => {
      cardNavigation.setFocusedCardId(card.id);
      onCardSelect?.(card);
    },
    [cardNavigation, onCardSelect],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      if (event.key === '/' || event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchState.setExpanded(true);
      }

      if (event.key === 'Backspace' && onBack) {
        event.preventDefault();
        onBack();
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
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            left: -SEARCH_CARD.EXPANDED_WIDTH / 2,
            top: -SEARCH_CARD.EXPANDED_HEIGHT / 2,
            width: SEARCH_CARD.EXPANDED_WIDTH,
            height: SEARCH_CARD.EXPANDED_HEIGHT,
            background: theme.card.background,
            border: theme.card.border,
            borderRadius: theme.card.borderRadius,
            opacity: searchState.compression * 0.35,
            boxShadow: theme.card.shadow,
          }}
        />

        <AnimatePresence mode="popLayout">
          {Array.from(cardPool.visible.entries()).map(([cardId, position], index) => {
            const cardData = cardDataById.get(cardId);
            if (!cardData) return null;

            const renderPosition = getPhysicsRenderPosition(
              position,
              physics.positions.get(cardId),
            );
            const isFocused = cardNavigation.focusedCardId === cardId;

            if (renderCard) {
              return (
                <Fragment key={cardId}>
                  {renderCard(
                    cardData,
                    renderPosition,
                    theme,
                    isFocused,
                    () => handleCardClick(cardData),
                    index,
                  )}
                </Fragment>
              );
            }

            return (
              <DefaultCard
                key={cardId}
                card={cardData}
                position={renderPosition}
                theme={theme}
                onClick={() => handleCardClick(cardData)}
                isFocused={isFocused}
                entranceIndex={index}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <SearchCard
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
        filteredCards={filteredCount}
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
        <div className="fixed bottom-4 left-4 text-xs text-[var(--muted-foreground)] font-mono">
          Camera: ({navigation.camera.x.toFixed(0)}, {navigation.camera.y.toFixed(0)}) z:
          {navigation.camera.zoom.toFixed(2)}
          <br />
          Visible: {cardPool.visible.size} | Queue: {cardPool.queue.length}
          {cardNavigation.focusedCardId && (
            <>
              <br />
              Focus: {cardNavigation.focusedCardId}
            </>
          )}
        </div>
      )}
    </div>
  );
}
