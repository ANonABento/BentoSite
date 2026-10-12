'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SearchMenuCard, useSearchCardState } from '../cards';
import { countContentCards, filterCards, useWindowSize } from '../core';
import { MOBILE, isPinnedCard } from '../BentoGrid.constants';
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

  const localFilteredCards = useMemo(
    () => filterCards(cards, searchTerm, category),
    [cards, searchTerm, category]
  );

  // Two-column tray: intro, featured work, the info compartments, then the rest.
  const trayCards = useMemo(() => {
    const isFeatured = (card: CardData) => card.type === 'project' && Boolean(card.featured);
    const content = localFilteredCards;
    return [
      ...content.filter((card) => card.type === 'intro'),
      ...content.filter(isFeatured),
      ...content.filter((card) => card.type !== 'intro' && isPinnedCard(card)),
      ...content.filter((card) => !isPinnedCard(card) && !isFeatured(card)),
    ];
  }, [localFilteredCards]);

  const select = (card: CardData) => onCardSelect?.(card);
  const trayWidth = Math.min(windowSize.width, MOBILE.TRAY_MAX_WIDTH) - MOBILE.SCROLL_PADDING * 2;
  const columnWidth = (trayWidth - MOBILE.TRAY_GAP) / 2;

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
        totalCards={countContentCards(cards)}
        filteredCards={countContentCards(localFilteredCards)}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: searchState.height + MOBILE.SCROLL_GAP }}
      >
        <div
          className="mx-auto grid grid-cols-2 [grid-auto-flow:row_dense]"
          style={{ padding: MOBILE.SCROLL_PADDING, gap: MOBILE.TRAY_GAP, width: trayWidth + MOBILE.SCROLL_PADDING * 2 }}
        >
          {trayCards.map((card, index) => {
            const span = spanOf(card);
            const cardWidth = span === 2 ? trayWidth : columnWidth;
            const cardHeight = heightOf(card, trayWidth, columnWidth);
            const position: CardPosition = {
              x: 0,
              y: 0,
              rotation: 0,
              size: span === 2 ? '2x2' : '1x1',
              width: cardWidth,
              height: cardHeight,
            };

            const wrapperStyle: React.CSSProperties = {
              position: 'relative',
              width: cardWidth,
              height: cardHeight,
              gridColumn: `span ${span}`,
            };

            if (renderCard) {
              return (
                <div key={card.id} style={wrapperStyle}>
                  {renderCard(card, position, theme, false, () => select(card), index)}
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
                  onClick={() => select(card)}
                />
              </motion.div>
            );
          })}

          {trayCards.length === 0 && (
            <div className="col-span-2 text-center text-white/50 py-12">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Intro, info compartments and featured work span both columns. */
function spanOf(card: CardData): 1 | 2 {
  if (card.type === 'intro' || isPinnedCard(card)) return 2;
  if (card.type === 'project' && card.featured) return 2;
  return 1;
}

function heightOf(card: CardData, trayWidth: number, columnWidth: number): number {
  if (card.type === 'intro') return 720;
  if (card.type === 'info' && card.variant === 'skills') return 150;
  if (spanOf(card) === 2) return Math.round(trayWidth * 0.75);
  return Math.round(columnWidth * 1.1);
}
