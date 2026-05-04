'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BENTO_CARDS, getGameCards } from '@/components/Playground/BentoHub/BentoHub.config';
import { createSeedGameCards, shouldUseBentoGridSeed } from '@/components/BentoGrid/debugSeed';
import type {
  CardData,
  CardPosition,
  GameCardData,
  ThemeConfig,
} from '@/components/BentoGrid';
import { GameCard } from '@/components/BentoGrid/cards';

const BentoGrid = dynamic(
  () => import('@/components/BentoGrid').then((mod) => mod.BentoGrid),
  { ssr: false }
);

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
  entranceIndex = 0,
  href?: string
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
      href={href}
    />
  );
}

export function PlaygroundGridClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCards = useMemo(() => {
    const cards = getGameCards().map(mapBentoCardToGameData);
    return shouldUseBentoGridSeed(searchParams) ? createSeedGameCards(cards) : cards;
  }, [searchParams]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'game') {
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
      theme="playful"
      cards={gameCards}
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / playground"
      renderCard={renderGameCard}
    />
  );
}
