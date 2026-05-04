'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { InfoMenuCard, useInfoCardState } from '../cards';
import {
  getCameraTransform,
  isEditableTarget,
  useCamera,
  useCardNavigation,
  useWindowSize,
} from '../core';
import { useBoardController } from '../core/useBoardController';
import { usePhysicsWorld } from '../physics';
import { INFO_CARD_ID } from '../BentoGrid.constants';
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
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
  getCardHref: (card: CardData) => string | undefined;
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
  getCardHref,
}: DesktopCanvasViewProps) {
  const windowSize = useWindowSize();
  const searchParams = useSearchParams();
  const showDebug = searchParams.get('debug') === '1';

  const navigation = useCamera({
    enabled: true,
    windowSize,
  });

  const board = useBoardController({
    cards,
    rotationRange: theme.card.rotationRange,
  });
  const {
    applyFilter,
    cardDataMap,
    filteredCount,
    queue,
    rehomeInfoCard,
    tick,
    visible,
  } = board;

  const infoCardLayout = visible.get(INFO_CARD_ID);

  const infoState = useInfoCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    infoCardLayout,
    onFilterChange: applyFilter,
  });

  const isInfoSticky = infoState.compression > 0;
  const {
    compression,
    ghostCanvasPosition,
    setExpanded,
    stickyCanvasPosition,
  } = infoState;

  // Rehome the info card when compression transitions from >0 to 0.
  // This anchors the grid home to wherever the ghost currently is.
  const prevCompressionRef = useRef(0);
  useEffect(() => {
    const prev = prevCompressionRef.current;
    prevCompressionRef.current = compression;

    if (prev > 0 && compression === 0 && ghostCanvasPosition) {
      rehomeInfoCard(
        ghostCanvasPosition.x,
        ghostCanvasPosition.y,
      );
    }
  }, [compression, ghostCanvasPosition, rehomeInfoCard]);

  // Display layouts: content cards at grid positions.
  // Info card uses sticky override when compressed, grid position when free.
  const displayLayouts = useMemo(() => {
    if (!stickyCanvasPosition) return visible;
    const layouts = new Map(visible);
    layouts.set(INFO_CARD_ID, stickyCanvasPosition);
    return layouts;
  }, [visible, stickyCanvasPosition]);

  // Physics is only used for info card collision body
  const { updateInfoCard } = usePhysicsWorld({
    layouts: displayLayouts,
    enabled: true,
    isMobile: false,
  });

  // Update info card physics body: static when sticky, dynamic when free
  const infoDisplayPos = displayLayouts.get(INFO_CARD_ID);
  useEffect(() => {
    if (!infoDisplayPos) return;
    updateInfoCard(
      { id: INFO_CARD_ID, ...infoDisplayPos },
      isInfoSticky,
    );
  }, [infoDisplayPos, isInfoSticky, updateInfoCard]);

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
  const boardTickRef = useRef(tick);
  useEffect(() => { boardTickRef.current = tick; }, [tick]);

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
          setExpanded(true);
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
  }, [onBack, setExpanded]);

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
          cardDataMap={cardDataMap}
          theme={theme}
          focusedCardId={focusedCardId}
          renderCard={renderCard}
          onCardClick={handleCardClick}
          getCardHref={getCardHref}
        />
      </div>

      {/* Info card — always rendered as fixed overlay in screen space */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <InfoMenuCard
          theme={theme}
          expanded={infoState.expanded}
          edge={infoState.edge}
          position={infoState.screenPosition}
          compression={infoState.compression}
          width={infoState.width}
          height={infoState.height}
          searchTerm={infoState.searchTerm}
          category={infoState.category}
          categories={categories}
          breadcrumb={breadcrumb}
          onToggleExpanded={infoState.toggleExpanded}
          onSearchChange={infoState.setSearchTerm}
          onCategoryChange={infoState.setCategory}
          onBack={onBack}
          totalCards={cards.length}
          filteredCards={filteredCount}
          helpText="Use arrow keys to focus cards, Enter to open, WASD to pan, R to reset view, and / or F to search."
          debugInfo={showDebug ? {
            camera: `Camera: (${navigation.camera.x.toFixed(0)}, ${navigation.camera.y.toFixed(0)}) z:${navigation.camera.zoom.toFixed(2)}`,
            visible: visible.size,
            queue: queue.length,
            focus: focusedCardId,
          } : undefined}
        />
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

    </div>
  );
}
