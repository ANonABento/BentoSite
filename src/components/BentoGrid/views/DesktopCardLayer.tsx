'use client';

import { Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
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
      {Array.from(layouts.entries()).map(([cardId, layout], index) => {
        // Search card is rendered as a fixed overlay by DesktopCanvasView
        if (cardId === SEARCH_CARD_ID) return null;

        // Content cards render directly at grid positions — no physics override
        const cardData = cardDataMap.get(cardId);
        if (!cardData) return null;

        const isFocused = focusedCardId === cardId;

        if (renderCard) {
          return (
            <Fragment key={cardId}>
              {renderCard(
                cardData,
                layout,
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
            position={layout}
            theme={theme}
            onClick={() => onCardClick(cardData)}
            isFocused={isFocused}
          />
        );
      })}
    </AnimatePresence>
  );
}
