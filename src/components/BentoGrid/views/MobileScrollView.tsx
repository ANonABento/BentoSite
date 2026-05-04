'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { InfoMenuCard, useInfoCardState } from '../cards';
import { filterCards, useWindowSize } from '../core';
import { MOBILE } from '../BentoGrid.constants';
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DefaultCard } from './DefaultCard';

interface MobileScrollViewProps {
  className?: string;
  cards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  breadcrumb?: string;
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  renderCard?: RenderCard;
  getCardHref: (card: CardData) => string | undefined;
}

export function MobileScrollView({
  className,
  cards,
  theme,
  categories,
  breadcrumb,
  onCardSelect,
  onBack,
  renderCard,
  getCardHref,
}: MobileScrollViewProps) {
  const windowSize = useWindowSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const localFilteredCards = useMemo(
    () => filterCards(cards, searchTerm, category),
    [cards, searchTerm, category]
  );

  const infoState = useInfoCardState({
    camera: { x: 0, y: 0, zoom: 1 },
    windowSize,
    categories,
    isMobile: true,
    onFilterChange: (term, nextCategory) => {
      setSearchTerm(term);
      setCategory(nextCategory);
    },
  });

  return (
    <div
      id="main-content"
      className={['h-full overflow-hidden flex flex-col', className].filter(Boolean).join(' ')}
      tabIndex={-1}
      style={{ background: theme.background }}
    >
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
        filteredCards={localFilteredCards.length}
        helpText="Search, filter, and open cards from this list."
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: infoState.height + MOBILE.SCROLL_GAP }}
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

            const wrapperStyle: React.CSSProperties = {
              position: 'relative',
              width: cardWidth,
              height: cardHeight,
            };

            if (renderCard) {
              return (
                <div key={card.id} style={wrapperStyle}>
                  {renderCard(
                    card,
                    position,
                    theme,
                    false,
                    () => onCardSelect?.(card),
                    index,
                    getCardHref(card),
                  )}
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
                  href={getCardHref(card)}
                />
              </motion.div>
            );
          })}

          {localFilteredCards.length === 0 && (
            <div className="text-center text-[var(--text-secondary)] py-12">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
