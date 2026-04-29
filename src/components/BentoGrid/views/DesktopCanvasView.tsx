'use client';

import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SearchMenuCard, useSearchCardState } from '../cards';
import {
  getCameraTransform,
  useCardNavigation,
  useCardPool,
  useGridNavigation,
  useSpawnManager,
  useViewport,
  useWindowSize,
} from '../core';
import { GRID, SEARCH_CARD } from '../BentoGrid.constants';
import type { CardData, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DefaultCard } from './DefaultCard';

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

  const navigation = useGridNavigation({
    enabled: true,
    persistKey: `bento-grid-camera-${theme.name}`,
  });

  const cardPool = useCardPool({
    cards,
    rotationRange: theme.card.rotationRange,
  });

  const viewport = useViewport({
    camera: navigation.camera,
    buffer: GRID.SPAWN_BUFFER,
  });

  useSpawnManager({
    cardPool,
    viewport,
    camera: navigation.camera,
    rotationRange: theme.card.rotationRange,
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

  const handleCardClick = useCallback(
    (card: CardData) => {
      cardNavigation.setFocusedCardId(card.id);
      onCardSelect?.(card);
    },
    [onCardSelect, cardNavigation]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' || event.key === 'f') {
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          searchState.setExpanded(true);
        }
      }

      if (event.key === 'Backspace' && onBack) {
        if (!(event.target instanceof HTMLInputElement)) {
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
            const cardData = cards.find((card) => card.id === cardId);
            if (!cardData) return null;

            const isFocused = cardNavigation.focusedCardId === cardId;

            if (renderCard) {
              return (
                <Fragment key={cardId}>
                  {renderCard(
                    cardData,
                    position,
                    theme,
                    isFocused,
                    () => handleCardClick(cardData),
                    index
                  )}
                </Fragment>
              );
            }

            return (
              <DefaultCard
                key={cardId}
                card={cardData}
                position={position}
                theme={theme}
                onClick={() => handleCardClick(cardData)}
                isFocused={isFocused}
              />
            );
          })}
        </AnimatePresence>
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
