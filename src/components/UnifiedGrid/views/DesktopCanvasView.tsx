'use client';

import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SearchMenuCard, useSearchCardState } from '../cards';
import {
  getCameraTransform,
  useCardNavigation,
  useCardQueue,
  useGridNavigation,
  useSpawnManager,
  useViewport,
  useWindowSize,
} from '../core';
import { GRID } from '../UnifiedGrid.constants';
import type { CardData, RenderCard, ThemeConfig } from '../UnifiedGrid.types';
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
    persistKey: `unified-grid-camera-${theme.name}`,
  });

  const cardQueue = useCardQueue({
    cards,
    rotationRange: theme.card.rotationRange,
  });

  const viewport = useViewport({
    camera: navigation.camera,
    buffer: GRID.SPAWN_BUFFER,
  });

  useSpawnManager({
    cardQueue,
    viewport,
    camera: navigation.camera,
    rotationRange: theme.card.rotationRange,
  });

  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    onFilterChange: cardQueue.applyFilter,
  });

  const cardNavigation = useCardNavigation({
    visible: cardQueue.visible,
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
      className={['fixed inset-0 overflow-hidden', className].filter(Boolean).join(' ')}
      {...navBindings}
      style={{ ...navBindings.style, background: theme.background }}
    >
      <div
        className="absolute will-change-transform"
        style={{
          transform,
          transformOrigin: '0 0',
        }}
      >
        <AnimatePresence mode="popLayout">
          {Array.from(cardQueue.visible.entries()).map(([cardId, position]) => {
            const cardData = cards.find((card) => card.id === cardId);
            if (!cardData) return null;

            const isFocused = cardNavigation.focusedCardId === cardId;

            if (renderCard) {
              return (
                <Fragment key={cardId}>
                  {renderCard(cardData, position, theme, isFocused, () => handleCardClick(cardData))}
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
        searchTerm={searchState.searchTerm}
        category={searchState.category}
        categories={categories}
        breadcrumb={breadcrumb}
        onToggleExpanded={searchState.toggleExpanded}
        onSearchChange={searchState.setSearchTerm}
        onCategoryChange={searchState.setCategory}
        onBack={onBack}
        totalCards={cards.length}
        filteredCards={cardQueue.visible.size + cardQueue.queue.length}
      />

      <button
        onClick={navigation.reset}
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
          Visible: {cardQueue.visible.size} | Queue: {cardQueue.queue.length}
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
