import type { CardData } from '../../UnifiedGrid.types';

/**
 * Filter cards by search term and category.
 */
export function filterCards(
  cards: CardData[],
  searchTerm: string,
  category: string | null
): CardData[] {
  const term = searchTerm.toLowerCase().trim();

  return cards.filter((card) => {
    if (category && card.category !== category) {
      return false;
    }

    if (term) {
      const matchTitle = card.title.toLowerCase().includes(term);
      const matchDesc = card.description?.toLowerCase().includes(term);
      const matchCategory = card.category?.toLowerCase().includes(term);

      if (card.type === 'project') {
        const matchTech = card.technologies?.some((technology) =>
          technology.toLowerCase().includes(term)
        );
        return matchTitle || matchDesc || matchCategory || matchTech;
      }

      return matchTitle || matchDesc || matchCategory;
    }

    return true;
  });
}
