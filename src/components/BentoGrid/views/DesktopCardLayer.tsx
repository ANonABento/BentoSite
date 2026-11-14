'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { SEARCH_CARD_ID, cardSpan } from '../BentoGrid.constants';
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

/** Most stand-ins drawn at once during the intro; the ones nearest the landing area win. */
const MAX_STAND_INS = 150;

/** Memoised: camera moves don't re-render the cards, only changes to which are on the board. */
export const DesktopCardLayer = memo(function DesktopCardLayer({
  layouts,
  cardDataMap,
  theme,
  focusedCardId,
  dimmed,
  live,
  renderCard,
  onCardClick,
}: DesktopCardLayerProps) {
  // During the intro, the stand-ins allowed to draw: the nearest MAX_STAND_INS to the landing area's centre.
  const standIns = useMemo(() => {
    if (!live) return null;
    const cx = (live.left + live.right) / 2;
    const cy = (live.top + live.bottom) / 2;
    const ids: { id: string; d: number }[] = [];
    layouts.forEach((layout, id) => {
      if (id === SEARCH_CARD_ID || id.startsWith(SEARCH_DOCK_PREFIX) || overlaps(layout, live)) return;
      const dx = layout.x + layout.width / 2 - cx;
      const dy = layout.y + layout.height / 2 - cy;
      ids.push({ id, d: dx * dx + dy * dy });
    });
    ids.sort((a, b) => a.d - b.d);
    return new Set(ids.slice(0, MAX_STAND_INS).map((entry) => entry.id));
  }, [layouts, live]);

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
          if (!standIns?.has(cardId)) return null;
          return <StandIn key={key} layout={layout} card={cardData} theme={theme} />;
        }

        if (renderCard) {
          const faded = dimmed.has(cardData.id);
          return (
            <div
              key={key}
              // A filtered-out card loses its colour rather than turning see-through, so the tray doesn't muddy it.
              className={faded ? 'opacity-30 [filter:grayscale(1)_brightness(0.6)] transition-[filter,opacity] duration-500' : undefined}
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
 * A card during the intro, while it's only seen small and far off: the same
 * rim, image, title and footer as the real card (ProjectCard), drawn flat, with
 * no hover or motion component, so the swap to the real card doesn't show.
 */
function StandIn({ layout, card, theme }: { layout: CardPosition; card: CardData; theme: ThemeConfig }) {
  const hue = card.category
    ? `var(--cat-${card.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, var(--color-ash))`
    : 'var(--color-ash)';
  const loose = card as unknown as {
    look?: { image?: string; variant?: 'full' | 'image' | 'text'; focus?: [number, number]; zoom?: number };
    thumbnail?: string;
    description?: string;
  };
  const look = loose.look ?? {};
  const image = look.image ?? loose.thumbnail;
  const variant = look.variant ?? (!image ? 'text' : cardSpan(layout.size).cols >= 3 ? 'full' : 'image');
  const focus = look.focus ?? [50, 50];
  const zoom = look.zoom ?? 1;
  const big = layout.width >= 600;
  const tag = (
    <p className="flex items-center gap-1.5 truncate text-[0.7rem] font-medium uppercase tracking-[0.08em]" style={{ color: hue }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hue }} />
      {card.category}
    </p>
  );
  return (
    <div
      aria-hidden
      className="absolute left-0 top-0"
      style={{ width: layout.width, height: layout.height, transform: `translate(${layout.x}px, ${layout.y}px)` }}
    >
      <div
        data-bento-cell
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          background: theme.card.background,
          borderRadius: theme.card.borderRadius,
          border: `1px solid color-mix(in srgb, ${hue} 32%, transparent)`,
          boxShadow: theme.card.shadow,
        }}
      >
        {variant === 'text' || !image ? (
          <div className="flex h-full flex-col gap-2 p-4">
            {tag}
            <h3 className={`font-semibold leading-tight tracking-tight text-rice ${big ? 'text-2xl' : 'text-xl'}`}>{card.title}</h3>
          </div>
        ) : (
          <>
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              style={{ background: `color-mix(in srgb, ${hue} 22%, var(--color-cell-raised))` }}
            >
              <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: `${focus[0]}% ${focus[1]}%` }}>
                {/* Same size request as the real card, so it's the same cached file when the card goes live. */}
                <Image
                  src={image}
                  alt=""
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${focus[0]}% ${focus[1]}%` }}
                  loading="eager"
                  sizes={`${Math.round(layout.width * zoom * 1.5)}px`}
                  draggable={false}
                />
              </div>
              {variant === 'image' && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-3 pt-10">
                  <h3 className={`truncate font-semibold tracking-tight text-white ${big ? 'text-lg' : 'text-base'}`}>{card.title}</h3>
                </div>
              )}
            </div>
            {variant === 'full' && (
              <div className="flex shrink-0 flex-col gap-1 px-4 py-3">
                <h3 className={`truncate font-semibold tracking-tight text-rice ${big ? 'text-lg' : 'text-base'}`}>{card.title}</h3>
                {loose.description && layout.height > 300 ? (
                  <p className="line-clamp-1 text-sm leading-snug text-ash">{loose.description}</p>
                ) : null}
                {tag}
              </div>
            )}
          </>
        )}
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
