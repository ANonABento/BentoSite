/**
 * BentoGrid Type Definitions
 *
 * Public bridge for the consolidated canvas, physics, pool, search, and theme
 * types used while InfiniteGrid and UnifiedGrid are ported into BentoGrid.
 */

export type {
  Bounds,
  Point,
  Position,
  Size,
  Velocity,
} from './BentoGrid.primitives.types';

export type {
  GridTheme,
  ThemeConfig,
} from './BentoGrid.theme.types';

export type {
  BaseCardData,
  CardData,
  CardLayout,
  CardPoolState,
  CardPosition,
  CardQueueState,
  CardSize,
  CardType,
  ExclusionZone,
  GameCardData,
  GridConfig,
  GridLayoutConfig,
  PooledCard,
  ProjectCardData,
  QueuedCard,
  RenderCard,
  SpawnEdge,
  UseCardPoolReturn,
  UseCardQueueReturn,
} from './BentoGrid.card.types';

export type {
  BentoGridProps,
  Camera,
  CanvasState,
  GridNavigationBindings,
  GridState,
  LayoutTransition,
  NavigationState,
  PhysicsCard,
  PhysicsConfig,
  PhysicsPosition,
  ProjectCardProps,
  SearchCardEdge,
  SearchCardProps,
  SearchCardState,
  StickyEdge,
  TransitionPhase,
  UseBentoLayoutReturn,
  UseCameraReturn,
  UseCanvasReturn,
  UseCardNavigationReturn,
  UseGridNavigationReturn,
  UsePhysicsWorldReturn,
  UseSpawnManagerReturn,
  UseViewportReturn,
  ViewportBounds,
} from './BentoGrid.runtime.types';
