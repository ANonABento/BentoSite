import type { GameCardData, ProjectCardData } from './BentoGrid.types';

const PROJECT_SEED_CATEGORIES = [
  'Robotics',
  'AI & Robotics',
  'Hardware',
  'Software',
  'VR/AR',
  'Competition',
  'Accessibility',
  'Games',
] as const;

const GAME_SEED_CATEGORIES = [
  'Arcade',
  'Music',
  'Puzzle',
  'Reflex',
  'Speed',
  'Visual',
] as const;

export function shouldUseBentoGridSeed(searchParams: URLSearchParams): boolean {
  return searchParams.get('seed') === '1' || searchParams.get('debug') === 'queue';
}

export function createSeedProjectCards(cards: ProjectCardData[], seedCount = 80): ProjectCardData[] {
  if (cards.length === 0) return cards;

  return Array.from({ length: seedCount }, (_, index) => {
    const base = cards[index % cards.length];
    const category = PROJECT_SEED_CATEGORIES[index % PROJECT_SEED_CATEGORIES.length];
    const cycle = Math.floor(index / cards.length) + 1;

    const title = `${base.title} ${cycle}.${(index % cards.length) + 1}`;
    return {
      ...base,
      id: `seed-project-${index + 1}-${base.id}`,
      title,
      description: `Queue spawn test card ${index + 1}. ${base.description ?? ''}`.trim(),
      category,
      featured: index % 7 === 0,
    };
  });
}

export function createSeedGameCards(cards: GameCardData[], seedCount = 80): GameCardData[] {
  if (cards.length === 0) return cards;

  return Array.from({ length: seedCount }, (_, index) => {
    const base = cards[index % cards.length];
    const category = GAME_SEED_CATEGORIES[index % GAME_SEED_CATEGORIES.length];
    const cycle = Math.floor(index / cards.length) + 1;

    return {
      ...base,
      id: `seed-game-${index + 1}-${base.id}`,
      title: `${base.title} ${cycle}.${(index % cards.length) + 1}`,
      description: `Spawn queue test card ${index + 1}. ${base.description ?? ''}`.trim(),
      category,
      icon: base.icon ?? base.id,
      href: base.href,
      bestScore: index * 37,
    };
  });
}
