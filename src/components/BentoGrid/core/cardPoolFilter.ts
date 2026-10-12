import type { CardData } from '../BentoGrid.types';
import { isPinnedCard } from '../BentoGrid.constants';

export function filterCards(
  cards: CardData[],
  searchTerm: string,
  category: string | null,
): CardData[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return cards.filter((card) => {
    // Pinned cards (intro, experience, about) are part of the board, not the result set.
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
