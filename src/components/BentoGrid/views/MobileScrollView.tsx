'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { filterCards, useWindowSize } from '../core';
import { MOBILE } from '../BentoGrid.constants';
import type { CardData, CardPosition, RenderCard, ThemeConfig } from '../BentoGrid.types';
import { DefaultCard } from '../cards';
import { SearchCard, useSearchCardState } from '../search';

interface MobileScrollViewProps {
  className?: string;
  cards: CardData[];
  theme: ThemeConfig;
  categories: string[];
  breadcrumb?: string;
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  renderCard?: RenderCard;
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
}: MobileScrollViewProps) {
  const windowSize = useWindowSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const filteredCards = useMemo(
    () => filterCards(cards, searchTerm, category),
    [cards, category, searchTerm],
  );

  const searchState = useSearchCardState({
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
        filteredCards={filteredCards.length}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: searchState.height + MOBILE.SCROLL_GAP }}
      >
        <div
          className="flex flex-col gap-4 max-w-md mx-auto"
          style={{ padding: MOBILE.SCROLL_PADDING }}
        >
          {filteredCards.map((card, index) => {
            const cardWidth = Math.min(
              windowSize.width * MOBILE.CARD_WIDTH_PERCENT,
              MOBILE.CARD_MAX_WIDTH,
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
            const wrapperStyle: CSSProperties = {
              position: 'relative',
              width: cardWidth,
              height: cardHeight,
            };

            if (renderCard) {
              return (
                <div key={card.id} style={wrapperStyle}>
                  {renderCard(card, position, theme, false, () => onCardSelect?.(card), index)}
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
                  entranceIndex={index}
                />
              </motion.div>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="text-center text-[var(--muted-foreground)] py-12">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
