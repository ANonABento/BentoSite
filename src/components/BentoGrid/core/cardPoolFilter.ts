import type { CardData } from '../BentoGrid.types';

export function filterCards(
  cards: CardData[],
  searchTerm: string,
  category: string | null,
): CardData[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return cards.filter((card) => {
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
