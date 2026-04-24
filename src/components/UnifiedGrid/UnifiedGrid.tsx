'use client';

/**
 * UnifiedGrid - Infinite Grid Component
 *
 * A shared infinite grid system used by both /playground and /projects.
 * Features:
 * - FILO queue-based card recycling
 * - Pan/zoom navigation with momentum
 * - Keyboard navigation (WASD/arrows)
 * - Morphing search card (collapses to edge bar)
 * - Responsive: infinite canvas on desktop, scroll on mobile
 */

import { Fragment, useCallback, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GridConfig, CardData, CardPosition, ThemeConfig } from './UnifiedGrid.types';
import {
  useCardQueue,
  useViewport,
  useSpawnManager,
  useGridNavigation,
  useCardNavigation,
  getCameraTransform,
  useWindowSize,
} from './core';
import { SearchMenuCard, useSearchCardState } from './cards';
import {
  THEMES,
  ANIMATION,
  MOBILE,
  GRID,
} from './UnifiedGrid.constants';

// =============================================================================
// PROPS
// =============================================================================

export interface UnifiedGridProps extends GridConfig {
  /** CSS class for the container */
  className?: string;
  /** Custom card renderer (isFocused indicates keyboard focus for accessibility) */
  renderCard?: (
    card: CardData,
    position: CardPosition,
    theme: ThemeConfig,
    isFocused?: boolean,
    onClick?: () => void,
  ) => React.ReactNode;
}

// =============================================================================
// DEFAULT CARD RENDERER
// =============================================================================

function DefaultCard({
  card,
  position,
  theme,
  onClick,
  isFocused,
}: {
  card: CardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  isFocused?: boolean;
}) {
  return (
    <motion.div
      layoutId={card.id}
      className="absolute cursor-pointer select-none"
      style={{
        width: position.width,
        height: position.height,
        background: theme.card.background,
        border: theme.card.border,
        borderRadius: theme.card.borderRadius,
        boxShadow: isFocused
          ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isFocused ? 1.02 : 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: ANIMATION.SPRING.stiffness,
        damping: ANIMATION.SPRING.damping,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: theme.card.hoverShadow,
      }}
      onClick={onClick}
    >
      <div className="p-4 h-full flex flex-col">
        <h3 className="font-bold text-white text-lg truncate">{card.title}</h3>
        {card.description && (
          <p className="text-sm text-white/60 mt-2 line-clamp-2">{card.description}</p>
        )}
        {card.category && (
          <span
            className="mt-auto inline-block px-2 py-1 text-xs rounded-full w-fit"
            style={{
              background: `${theme.accent.primary}20`,
              color: theme.accent.primary,
            }}
          >
            {card.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MOBILE SCROLL VIEW
// =============================================================================

function MobileScrollView({
  cards,
  filteredCards,
  theme,
  categories,
  breadcrumb,
  onCardSelect,
  onBack,
  renderCard,
}: {
  cards: CardData[];
  filteredCards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  breadcrumb?: string;
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  renderCard?: UnifiedGridProps['renderCard'];
}) {
  const windowSize = useWindowSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // Filter cards based on search and category — derived during render
  // (useMemo) rather than synced via setState/useEffect.
  const localFilteredCards = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return filteredCards.filter((card) => {
      if (category && card.category !== category) return false;
      if (term) {
        const matchTitle = card.title.toLowerCase().includes(term);
        const matchDesc = card.description?.toLowerCase().includes(term);
        const matchCategory = card.category?.toLowerCase().includes(term);
        return matchTitle || matchDesc || matchCategory;
      }
      return true;
    });
  }, [filteredCards, searchTerm, category]);

  // Search card state for mobile (always collapsed at top)
  const searchState = useSearchCardState({
    camera: { x: 0, y: 0, zoom: 1 },
    windowSize,
    categories,
    isMobile: true,
    onFilterChange: (term, cat) => {
      setSearchTerm(term);
      setCategory(cat);
    },
  });

  return (
    <div
      className="h-full overflow-hidden flex flex-col"
      style={{ background: theme.background }}
    >
      {/* Mobile search bar */}
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
        filteredCards={localFilteredCards.length}
      />

      {/* Scrollable card list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: MOBILE.SEARCH_BAR_HEIGHT + 16 }}
      >
        <div
          className="flex flex-col gap-4 max-w-md mx-auto"
          style={{ padding: MOBILE.SCROLL_PADDING }}
        >
          {localFilteredCards.map((card, index) => {
            const cardWidth = Math.min(
              windowSize.width * MOBILE.CARD_WIDTH_PERCENT,
              MOBILE.CARD_MAX_WIDTH
            );
            const cardHeight = 160;
            const position: CardPosition = {
              x: 0,
              y: 0,
              rotation: 0,
              size: '1x1',
              width: cardWidth,
              height: cardHeight,
            };

            // Wrap in a positioned container so cards (which use
            // `position: absolute` for the infinite canvas) lay out
            // correctly within the mobile scroll flow.
            const wrapperStyle: React.CSSProperties = {
              position: 'relative',
              width: cardWidth,
              height: cardHeight,
            };

            if (renderCard) {
              return (
                <div key={card.id} style={wrapperStyle}>
                  {renderCard(card, position, theme, false, () => onCardSelect?.(card))}
                </div>
              );
            }

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={wrapperStyle}
              >
                <DefaultCard
                  card={card}
                  position={position}
                  theme={theme}
                  onClick={() => onCardSelect?.(card)}
                />
              </motion.div>
            );
          })}

          {localFilteredCards.length === 0 && (
            <div className="text-center text-white/50 py-12">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DESKTOP CANVAS VIEW
// =============================================================================

function DesktopCanvasView({
  cards,
  theme,
  categories,
  breadcrumb,
  onCardSelect,
  renderCard,
  onBack,
  onFilterChange,
}: {
  cards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  breadcrumb?: string;
  onCardSelect?: (card: CardData) => void;
  renderCard?: UnifiedGridProps['renderCard'];
  onBack?: () => void;
  onFilterChange?: (searchTerm: string, category: string | null) => void;
}) {
  const windowSize = useWindowSize();

  // Initialize navigation
  const navigation = useGridNavigation({
    enabled: true,
    persistKey: `unified-grid-camera-${theme.name}`,
  });

  // Initialize card queue
  const cardQueue = useCardQueue({
    cards,
    rotationRange: theme.card.rotationRange,
  });

  // Initialize viewport tracking
  const viewport = useViewport({
    camera: navigation.camera,
    buffer: GRID.SPAWN_BUFFER,
  });

  // Initialize spawn manager
  useSpawnManager({
    cardQueue,
    viewport,
    camera: navigation.camera,
    rotationRange: theme.card.rotationRange,
  });

  // Search card state
  const searchState = useSearchCardState({
    camera: navigation.camera,
    windowSize,
    categories,
    onFilterChange: (term, cat) => {
      cardQueue.applyFilter(term, cat);
      onFilterChange?.(term, cat);
    },
  });

  // Keyboard card navigation
  const cardNavigation = useCardNavigation({
    visible: cardQueue.visible,
    cards,
    onSelect: onCardSelect,
    enabled: true,
  });

  // Handle card click (also sets focus)
  const handleCardClick = useCallback(
    (card: CardData) => {
      cardNavigation.setFocusedCardId(card.id);
      onCardSelect?.(card);
    },
    [onCardSelect, cardNavigation]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on / or f
      if (e.key === '/' || e.key === 'f') {
        if (!(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          searchState.setExpanded(true);
        }
      }
      // Backspace to go back (Escape is used for clearing focus)
      if (e.key === 'Backspace' && onBack) {
        if (!(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, searchState]);

  // Calculate transform
  const transform = useMemo(
    () => getCameraTransform(navigation.camera, windowSize),
    [navigation.camera, windowSize]
  );

  // Get navigation bindings and merge styles
  const navBindings = navigation.bind();
  const navStyle = navBindings.style as React.CSSProperties | undefined;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      {...navBindings}
      style={{ ...navStyle, background: theme.background }}
    >
      {/* Canvas container with transform */}
      <div
        className="absolute will-change-transform"
        style={{
          transform,
          transformOrigin: '0 0',
        }}
      >
        <AnimatePresence mode="popLayout">
          {Array.from(cardQueue.visible.entries()).map(([cardId, position]) => {
            const cardData = cards.find((c) => c.id === cardId);
            if (!cardData) return null;

            const isFocused = cardNavigation.focusedCardId === cardId;

            if (renderCard) {
              // GameCard/ProjectCard handle their own positioning and click via props.
              // Wrapping here in another positioned motion.div would double-translate.
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

      {/* Search Menu Card */}
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

      {/* Reset button */}
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

      {/* Debug info (development only) */}
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UnifiedGrid({
  theme,
  cards,
  onCardSelect,
  onBack,
  breadcrumb,
  renderCard,
}: UnifiedGridProps) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < MOBILE.BREAKPOINT;
  const themeConfig = THEMES[theme];

  // Extract unique categories from cards
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cards.forEach((card) => {
      if (card.category) cats.add(card.category);
    });
    return Array.from(cats).sort();
  }, [cards]);

  // Filter state
  const [filteredCards, setFilteredCards] = useState(cards);

  // Filter handler
  const handleFilterChange = useCallback(
    (searchTerm: string, category: string | null) => {
      const term = searchTerm.toLowerCase().trim();
      const filtered = cards.filter((card) => {
        // Category filter
        if (category && card.category !== category) return false;

        // Search filter
        if (term) {
          const matchTitle = card.title.toLowerCase().includes(term);
          const matchDesc = card.description?.toLowerCase().includes(term);
          const matchCategory = card.category?.toLowerCase().includes(term);
          return matchTitle || matchDesc || matchCategory;
        }
        return true;
      });
      setFilteredCards(filtered);
    },
    [cards]
  );

  // Update filtered cards when source changes
  useEffect(() => {
    setFilteredCards(cards);
  }, [cards]);

  if (isMobile) {
    return (
      <MobileScrollView
        cards={cards}
        filteredCards={filteredCards}
        theme={themeConfig}
        categories={categories}
        breadcrumb={breadcrumb}
        onCardSelect={onCardSelect}
        onBack={onBack}
        renderCard={renderCard}
      />
    );
  }

  return (
    <DesktopCanvasView
      cards={filteredCards}
      theme={themeConfig}
      categories={categories}
      breadcrumb={breadcrumb}
      onCardSelect={onCardSelect}
      renderCard={renderCard}
      onBack={onBack}
      onFilterChange={handleFilterChange}
    />
  );
}

export default UnifiedGrid;
