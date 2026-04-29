'use client';

import { Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  CardData,
  CardPosition,
  PhysicsPosition,
  RenderCard,
  ThemeConfig,
} from '../BentoGrid.types';
import { DefaultCard } from './DefaultCard';

interface DesktopCardLayerProps {
  layouts: Map<string, CardPosition>;
  cardDataMap: Map<string, CardData>;
  physicsPositions: Map<string, PhysicsPosition>;
  theme: ThemeConfig;
  focusedCardId: string | null;
  renderCard?: RenderCard;
  onCardClick: (card: CardData) => void;
}

export function DesktopCardLayer({
  layouts,
  cardDataMap,
  physicsPositions,
  theme,
  focusedCardId,
  renderCard,
  onCardClick,
}: DesktopCardLayerProps) {
  return (
    <AnimatePresence mode="popLayout">
      {Array.from(layouts.entries()).map(([cardId, layout], index) => {
        const cardData = cardDataMap.get(cardId);
        if (!cardData) return null;

        const isFocused = focusedCardId === cardId;
        const physicsPosition = physicsPositions.get(cardId);
        const position: CardPosition = physicsPosition
          ? {
              ...layout,
              x: physicsPosition.x,
              y: physicsPosition.y,
              rotation: (physicsPosition.angle * 180) / Math.PI,
            }
          : layout;

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
