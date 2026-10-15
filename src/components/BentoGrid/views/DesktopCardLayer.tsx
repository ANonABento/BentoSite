'use client';

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
  /** Card ids the filter leaves out; they fade back rather than leave. */
  dimmed: Set<string>;
  /** While set, cards it rejects (by instance id) are darkened, light up under the pointer, and still open on click. */
  spotlit: ((instance: string, card: CardData) => boolean) | null;
  renderCard?: RenderCard;
  onCardClick: (card: CardData, layout: CardPosition) => void;
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
  dimmed,
  spotlit,
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
          const faded = dimmed.has(cardData.id);
          const dark = !faded && spotlit !== null && !spotlit(cardId, cardData);
          return (
            <div
              key={key}
              className={`transition-opacity duration-500 ${faded ? 'opacity-15' : dark ? 'opacity-40 hover:opacity-100 hover:duration-200' : ''}`}
              style={{ pointerEvents: faded ? 'none' : undefined }}
            >
              {renderCard(
                cardData,
                layout,
                theme,
                isFocused,
                () => onCardClick(cardData, layout),
                index,
              )}
            </div>
          );
        }

        return (
          <DefaultCard
            key={key}
            card={cardData}
            position={layout}
            theme={theme}
            onClick={() => onCardClick(cardData, layout)}
            isFocused={isFocused}
          />
        );
      })}
    </AnimatePresence>
  );
}

/** Where the search card would sit in this copy of the board: an empty compartment it docks into when it comes into view. */
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
        background: 'var(--color-lacquer)',
        boxShadow: 'inset 0 2px 10px rgb(0 0 0 / 0.5)',
      }}
    />
  );
}
