'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BENTO_CARDS, getGameCards } from '@/components/Playground/BentoHub/BentoHub.config';
import { createSeedGameCards, shouldUseBentoGridSeed } from '@/components/BentoGrid/debugSeed';
import { duplicateCardsForFill } from '@/components/BentoGrid/duplicate-fill';
import {
  BentoGrid,
  type CardData,
  type CardPosition,
  type GameCardData,
  type ThemeConfig,
} from '@/components/BentoGrid';
import { GameCard } from '@/components/BentoGrid/cards';

function mapBentoCardToGameData(card: typeof BENTO_CARDS[number]): GameCardData {
  const categoryMap: Record<string, string> = {
    reaction: 'Reflex',
    typing: 'Speed',
    rhythm: 'Music',
    minesweeper: 'Puzzle',
    game2048: 'Puzzle',
    sorting: 'Visual',
    aim: 'Reflex',
    pacman: 'Arcade',
    soundboard: 'Music',
  };

  return {
    id: card.id,
    type: 'game',
    title: card.title,
    description: card.description,
    category: categoryMap[card.id] || 'Game',
    href: card.href || `/playground/${card.id}`,
    icon: card.id,
  };
}

function renderGameCard(
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex = 0
): ReactNode {
  if (card.type !== 'game') {
    return null;
  }

  const index = BENTO_CARDS.findIndex((candidate) => candidate.id === (card.icon ?? card.id));

  return (
    <GameCard
      card={card}
      position={position}
      theme={theme}
      index={index}
      isFocused={isFocused}
      onClick={onClick}
      entranceIndex={entranceIndex}
    />
  );
}

export function PlaygroundGridClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCards = useMemo(() => {
    const cards = getGameCards().map(mapBentoCardToGameData);
    if (shouldUseBentoGridSeed(searchParams)) return createSeedGameCards(cards);
    // Fill the canvas — cycle the source pool so the grid feels populated.
    return duplicateCardsForFill(cards);
  }, [searchParams]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'game') {
        // Clones reuse the original href, so no need to strip a suffix here.
        router.push(card.href);
      }
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <BentoGrid
      theme="arcade"
      cards={gameCards}
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / playground"
      renderCard={renderGameCard}
    />
  );
}
