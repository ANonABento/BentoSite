'use client';

import { Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  CardData,
  CardPosition,
  RenderCard,
  ThemeConfig,
} from '../BentoGrid.types';
import { DefaultCard } from './DefaultCard';

interface DesktopCardLayerProps {
  layouts: Map<string, CardPosition>;
  cardDataMap: Map<string, CardData>;
  theme: ThemeConfig;
  focusedCardId: string | null;
  renderCard?: RenderCard;
  onCardClick: (card: CardData) => void;
}

export function DesktopCardLayer({
  layouts,
  cardDataMap,
  theme,
  focusedCardId,
  renderCard,
  onCardClick,
}: DesktopCardLayerProps) {
  return (
    <AnimatePresence mode="popLayout">
      {Array.from(layouts.entries()).map(([cardId, position], index) => {
        const cardData = cardDataMap.get(cardId);
        if (!cardData) return null;

        const isFocused = focusedCardId === cardId;

        if (renderCard) {
          return (
            <Fragment key={cardId}>
              {renderCard(
                cardData,
                position,
                theme,
                isFocused,
                () => onCardClick(cardData),
                index,
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
            onClick={() => onCardClick(cardData)}
            isFocused={isFocused}
          />
        );
      })}
    </AnimatePresence>
  );
}
