'use client';

import { memo } from 'react';
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
  /** While set (the intro), cards outside this canvas area are drawn as stand-ins. */
  live: Bounds | null;
  renderCard?: RenderCard;
  onCardClick: (card: CardData, layout: CardPosition) => void;
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function overlaps(layout: CardPosition, area: Bounds): boolean {
  return (
    layout.x < area.right && layout.x + layout.width > area.left && layout.y < area.bottom && layout.y + layout.height > area.top
  );
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

/** Memoised: camera moves don't re-render the cards, only changes to which are on the board. */
export const DesktopCardLayer = memo(function DesktopCardLayer({
  layouts,
  cardDataMap,
  theme,
  focusedCardId,
  dimmed,
  spotlit,
  live,
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

        if (live && !overlaps(layout, live)) {
          return <StandIn key={key} layout={layout} card={cardData} radius={theme.card.borderRadius} dark={spotlit !== null} />;
        }

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
});

/**
 * A card during the intro, while it's only seen small and far off: its
 * compartment and a block of its category's colour, with no image, text or
 * motion component. It drops in like the real cards (the block is the cell's
 * contents) and is swapped for the real card once the intro has landed.
 */
function StandIn({ layout, card, radius, dark }: { layout: CardPosition; card: CardData; radius: number; dark: boolean }) {
  const hue = card.category
    ? `var(--cat-${card.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, var(--color-ash))`
    : 'var(--color-ash)';
  return (
    <div
      aria-hidden
      className="absolute left-0 top-0"
      style={{
        width: layout.width,
        height: layout.height,
        transform: `translate(${layout.x}px, ${layout.y}px)`,
        opacity: dark ? 0.4 : undefined,
      }}
    >
      <div
        data-bento-cell
        className="h-full w-full overflow-hidden"
        style={{
          borderRadius: radius,
          background: 'var(--board-card)',
          border: `1px solid color-mix(in srgb, ${hue} 32%, transparent)`,
        }}
      >
        <div className="h-full w-full" style={{ background: `color-mix(in srgb, ${hue} 22%, var(--color-cell-raised))` }} />
      </div>
    </div>
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
