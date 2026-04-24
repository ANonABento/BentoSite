'use client';

/**
 * /playground - Games/Fidgets showcase page
 *
 * Uses UnifiedGrid with playful theme to display games
 * in an infinite scrollable/pannable grid.
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BENTO_CARDS } from '@/components/Playground/BentoHub/BentoHub.config';
import type { GameCardData, CardData, CardPosition, ThemeConfig } from '@/components/UnifiedGrid';
import { GameCard } from '@/components/UnifiedGrid/cards';

// Dynamic import to avoid SSR issues
const UnifiedGrid = dynamic(
  () => import('@/components/UnifiedGrid').then((mod) => mod.UnifiedGrid),
  { ssr: false }
);

/**
 * Convert BentoCardConfig to GameCardData
 */
function mapBentoCardToGameData(
  card: typeof BENTO_CARDS[number]
): GameCardData {
  // Map category based on game type
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

/**
 * Custom card renderer for games
 */
function renderGameCard(
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
): React.ReactNode {
  if (card.type !== 'game') return null;

  // Find index for color cycling
  const index = BENTO_CARDS.findIndex((c) => c.id === card.id);

  return (
    <GameCard
      card={card as GameCardData}
      position={position}
      theme={theme}
      index={index}
      isFocused={isFocused}
      onClick={onClick}
    />
  );
}

export default function PlaygroundPage() {
  const router = useRouter();

  // Convert game cards to unified card data
  const gameCards = useMemo(
    () => BENTO_CARDS.map(mapBentoCardToGameData),
    []
  );

  // Handle card selection - navigate to game
  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'game') {
        const gameCard = card as GameCardData;
        if (gameCard.href) {
          router.push(gameCard.href);
        }
      }
    },
    [router]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <UnifiedGrid
      theme="playful"
      cards={gameCards}
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / playground"
      renderCard={renderGameCard}
    />
  );
}
