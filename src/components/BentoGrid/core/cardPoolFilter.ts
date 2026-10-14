import type { CardData } from '../BentoGrid.types';
import { isPinnedCard } from '../BentoGrid.constants';

export function filterCards(
  cards: CardData[],
  searchTerm: string,
  category: string | null,
): CardData[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return cards.filter((card) => {
    // Pinned cards (intro, contact) are part of the board, not the result set.
    if (isPinnedCard(card)) return true;
    if (category && card.category !== category) return false;
    if (!normalizedSearch) return true;

    const searchable = [
      card.title,
      card.description,
      card.category,
      ...(card.type === 'project' ? card.technologies ?? [] : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });
}

/** How many projects (not intro, info or tech tiles) a card list holds. */
export function countContentCards(cards: readonly CardData[]): number {
  return cards.filter((card) => card.type !== 'intro' && card.type !== 'info').length;
}
