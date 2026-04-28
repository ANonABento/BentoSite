import type { ReactNode } from 'react';
import type { Project } from '@/lib/projects-data';
import type { Bounds, Point, Size } from './BentoGrid.primitives.types';
import type { ThemeConfig } from './BentoGrid.theme.types';

export type CardType = 'game' | 'project';

export interface BaseCardData {
  id: string;
  type: CardType;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
}

export interface GameCardData extends BaseCardData {
  type: 'game';
  /** Icon component name from the playground icon set. */
  icon?: string;
  /** Route to the game page. */
  href: string;
  /** Best score from localStorage. */
  bestScore?: number;
  /** Gradient colors for card artwork. */
  gradient?: { from: string; to: string };
}

export interface ProjectCardData extends BaseCardData {
  type: 'project';
  technologies?: string[];
  status?: 'Completed' | 'In Progress' | 'Archived';
  links?: {
    github?: string;
    demo?: string;
    modelPath?: string;
  };
  featured?: boolean;
  /** Original project data when rendering portfolio-backed cards. */
  project?: Project;
}

export type CardData = GameCardData | ProjectCardData;

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface GridLayoutConfig {
  cellSize: number;
  gap: number;
  /** @deprecated Column count is removed from BentoGrid layout planning. */
  columns?: number;
}

/** @deprecated Use GridLayoutConfig for layout constants or BentoGridProps for component props. */
export type GridConfig = GridLayoutConfig;

export interface CardPosition extends Point, Size {
  /** Rotation in degrees. */
  rotation: number;
  /** Card size variant. */
  size: CardSize;
}

export interface CardLayout extends CardPosition {
  id: string;
}

export type ExclusionZone = Bounds;

export type RenderCard = (
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex?: number,
) => ReactNode;

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

export interface PooledCard {
  id: string;
  data: CardData;
  /** Timestamp when the card entered the FIFO pool. */
  queuedAt: number;
}

export interface CardPoolState {
  /** Cards currently visible in the viewport. */
  visible: Map<string, CardPosition>;
  /** Cards waiting to be spawned in FIFO order. */
  pool: PooledCard[];
  /** All card data indexed by ID. */
  cardDataMap: Map<string, CardData>;
}

export interface UseCardPoolReturn {
  /** Currently visible cards. */
  visible: Map<string, CardPosition>;
  /** Cards waiting to spawn in FIFO order. */
  pool: PooledCard[];
  /** Add a card to the spawn pool. */
  enqueue: (cardId: string) => void;
  /** Remove and return the next card from the FIFO pool. */
  dequeue: () => PooledCard | undefined;
  /** Remove a visible card when it exits the viewport. */
  removeVisible: (cardId: string) => void;
  /** Add a card to the visible set. */
  addVisible: (cardId: string, position: CardPosition) => void;
  /** Reset to initial state. */
  reset: () => void;
  /** Filter cards by search/category. */
  applyFilter: (searchTerm: string, category: string | null) => void;
}

/** @deprecated Use PooledCard. Kept during the refactor bridge. */
export type QueuedCard = PooledCard;

/** @deprecated Use CardPoolState. Kept during the refactor bridge. */
export interface CardQueueState extends Omit<CardPoolState, 'pool'> {
  /** Cards waiting to be spawned in FIFO order. */
  queue: PooledCard[];
}

/** @deprecated Use UseCardPoolReturn. Kept during the refactor bridge. */
export interface UseCardQueueReturn extends Omit<UseCardPoolReturn, 'pool'> {
  /** Cards waiting to spawn in FIFO order. */
  queue: PooledCard[];
}
