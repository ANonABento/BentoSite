'use client';

import { Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { SEARCH_DOCK_PREFIX } from '../core/useTiledBoard';
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

/**
 * React key that includes the card's grid position. When the queue respawns
 * a card at a new cell — including same-tick respawns where AnimatePresence
 * would otherwise see "same key, new position" and run a spring transition
 * across the viewport — the position-hashed key forces an unmount + fresh
 * mount so the new component appears directly at its target with no flight.
 */
function presenceKey(cardId: string, layout: CardPosition): string {
  return `${cardId}#${Math.round(layout.x)},${Math.round(layout.y)}@${layout.size}`;
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
        if (cardId.startsWith(SEARCH_DOCK_PREFIX)) {
          return <SearchDock key={cardId} layout={layout} radius={theme.card.borderRadius} />;
        }

        // Content cards render directly at grid positions — no physics override
        const cardData = cardDataMap.get(cardId);
        if (!cardData) return null;

        const isFocused = focusedCardId === cardId;
        const key = presenceKey(cardId, layout);

        if (renderCard) {
          return (
            <Fragment key={key}>
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
            key={key}
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

/** Where the search card would sit in this copy of the board; it docks here when it comes into view. */
function SearchDock({ layout, radius }: { layout: CardPosition; radius: number }) {
  return (
    <div
      aria-hidden
      className="absolute left-0 top-0"
      style={{
        width: layout.width,
        height: layout.height,
        transform: `translate(${layout.x}px, ${layout.y}px)`,
        borderRadius: radius,
        border: '1.5px dashed var(--board-dock-bg)',
        opacity: 0.35,
      }}
    />
  );
}
