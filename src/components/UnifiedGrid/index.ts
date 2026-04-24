/**
 * UnifiedGrid - Infinite Grid System
 *
 * A shared infinite grid component for both /playground and /projects.
 *
 * @example
 * ```tsx
 * import { UnifiedGrid } from '@/components/UnifiedGrid';
 *
 * // Playground usage
 * <UnifiedGrid
 *   theme="playful"
 *   cards={gameCards}
 *   onCardSelect={(card) => router.push(card.href)}
 *   onBack={() => router.push('/')}
 *   breadcrumb="bentOS / playground"
 * />
 *
 * // Projects usage
 * <UnifiedGrid
 *   theme="premium"
 *   cards={projectCards}
 *   onCardSelect={(project) => openProjectViewer(project)}
 *   onBack={() => router.push('/')}
 *   breadcrumb="bentOS / projects"
 * />
 * ```
 */

// Main component
export { UnifiedGrid, type UnifiedGridProps } from './UnifiedGrid';
export { default } from './UnifiedGrid';

// Types
export type {
  GridTheme,
  ThemeConfig,
  CardType,
  BaseCardData,
  GameCardData,
  ProjectCardData,
  CardData,
  CardSize,
  Position,
  CardPosition,
  ViewportBounds,
  QueuedCard,
  CardQueueState,
  SpawnEdge,
  SpawnRequest,
  Camera,
  Velocity,
  NavigationState,
  SearchCardEdge,
  SearchCardState,
  GridConfig,
  GridState,
  UseCardQueueReturn,
  UseViewportReturn,
  UseSpawnManagerReturn,
  UseGridNavigationReturn,
} from './UnifiedGrid.types';

// Constants
export {
  GRID,
  CARD_SIZES,
  getCardDimensions,
  QUEUE,
  CAMERA,
  INTERACTION,
  SEARCH_CARD,
  ANIMATION,
  THEME_PLAYFUL,
  THEME_PREMIUM,
  THEMES,
  MOBILE,
  PERFORMANCE,
  KEYBOARD,
} from './UnifiedGrid.constants';

// Core hooks (for advanced usage)
export {
  useCardQueue,
  useViewport,
  useSpawnManager,
  useGridNavigation,
  useWindowSize,
  screenToCanvas,
  canvasToScreen,
  getCameraTransform,
} from './core';

// Card components (for advanced usage)
export {
  SearchMenuCard,
  useSearchCardState,
  type SearchMenuCardProps,
} from './cards';
