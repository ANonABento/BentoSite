/**
 * UnifiedGrid Type Definitions
 *
 * Shared types for the infinite grid system used by both
 * /playground (games) and /projects (portfolio) pages.
 */

import type {
  CSSProperties,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from 'react';

// =============================================================================
// THEME
// =============================================================================

export type GridTheme = 'playful' | 'premium';

export interface ThemeConfig {
  name: GridTheme;
  background: string;
  card: {
    background: string;
    border: string;
    borderRadius: number;
    shadow: string;
    hoverShadow: string;
    /** Random rotation range in degrees (0 = no rotation) */
    rotationRange: number;
  };
  accent: {
    primary: string;
    secondary: string;
    tertiary?: string;
  };
  searchCard: {
    background: string;
    border: string;
    collapsedBackground: string;
  };
}

// =============================================================================
// CARD DATA
// =============================================================================

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
  /** Icon component name from Icons.tsx */
  icon?: string;
  /** Route to the game page */
  href: string;
  /** Best score from localStorage */
  bestScore?: number;
  /** Gradient colors for card */
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
}

export type CardData = GameCardData | ProjectCardData;

// =============================================================================
// GRID LAYOUT
// =============================================================================

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface Position {
  x: number;
  y: number;
}

export interface CardPosition extends Position {
  /** Rotation in degrees */
  rotation: number;
  /** Card size variant */
  size: CardSize;
  /** Pixel dimensions */
  width: number;
  height: number;
}

export type RenderCard = (
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex?: number,
) => ReactNode;

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// =============================================================================
// CARD QUEUE
// =============================================================================

export interface QueuedCard {
  id: string;
  data: CardData;
  /** Timestamp when card was queued (for FILO delay) */
  queuedAt: number;
}

export interface CardQueueState {
  /** Cards currently visible in the viewport */
  visible: Map<string, CardPosition>;
  /** Cards waiting to be spawned (FILO order) */
  queue: QueuedCard[];
  /** All card data indexed by ID */
  cardDataMap: Map<string, CardData>;
}

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

// =============================================================================
// CAMERA / NAVIGATION
// =============================================================================

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface NavigationState {
  camera: Camera;
  velocity: Velocity;
  isDragging: boolean;
  isPanning: boolean;
}

// =============================================================================
// SEARCH / MENU
// =============================================================================

export type SearchCardEdge = 'none' | 'top' | 'bottom' | 'left' | 'right';

export interface SearchCardState {
  /** Whether the search card is expanded (full) or collapsed (bar) */
  expanded: boolean;
  /** Which edge the card is stuck to (none = floating) */
  edge: SearchCardEdge;
  /** Current search term */
  searchTerm: string;
  /** Selected category filter (null = all) */
  category: string | null;
  /** Available categories for filtering */
  categories: string[];
}

// =============================================================================
// GRID CONFIG
// =============================================================================

export interface GridConfig {
  /** Theme variant */
  theme: GridTheme;
  /** All available cards */
  cards: CardData[];
  /** Callback when a card is selected */
  onCardSelect?: (card: CardData) => void;
  /** Callback for back navigation */
  onBack?: () => void;
  /** Page title shown in search card */
  pageTitle?: string;
  /** Breadcrumb path (e.g., "bentOS / playground") */
  breadcrumb?: string;
}

// =============================================================================
// GRID STATE
// =============================================================================

export interface GridState {
  /** Current visible cards with positions */
  visibleCards: Map<string, CardPosition>;
  /** Cards in queue waiting to spawn */
  queuedCards: QueuedCard[];
  /** Search/filter state */
  search: SearchCardState;
  /** Navigation/camera state */
  navigation: NavigationState;
  /** Whether grid is in mobile mode */
  isMobile: boolean;
}

// =============================================================================
// HOOKS RETURN TYPES
// =============================================================================

export interface UseCardQueueReturn {
  /** Currently visible cards */
  visible: Map<string, CardPosition>;
  /** Queue waiting to spawn */
  queue: QueuedCard[];
  /** Add card to spawn queue */
  enqueue: (cardId: string) => void;
  /** Remove card from queue and spawn it */
  dequeue: () => QueuedCard | undefined;
  /** Remove a visible card (when it exits viewport) */
  removeVisible: (cardId: string) => void;
  /** Add a card to visible set */
  addVisible: (cardId: string, position: CardPosition) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Filter cards by search/category */
  applyFilter: (searchTerm: string, category: string | null) => void;
}

export interface UseViewportReturn {
  /** Current viewport bounds in canvas coordinates */
  bounds: ViewportBounds;
  /** Check if a position is within viewport (with buffer) */
  isInViewport: (position: Position, buffer?: number) => boolean;
  /** Check if a card rect is within viewport */
  isCardInViewport: (card: CardPosition, buffer?: number) => boolean;
  /** Get spawn position for an edge */
  getSpawnPosition: (edge: SpawnEdge) => Position;
  /** Determine which edge a position exited from */
  getExitEdge: (position: Position) => SpawnEdge | null;
}

export interface UseSpawnManagerReturn {
  /** Run a despawn + spawn check based on current camera/viewport state */
  tick: () => void;
  /** Force a spawn at a specific edge (testing/debugging) */
  forceSpawn: (edge: SpawnEdge) => void;
}

export interface UseGridNavigationReturn {
  /** Current camera state */
  camera: Camera;
  /** Pan the camera by delta */
  pan: (dx: number, dy: number) => void;
  /** Zoom the camera */
  zoom: (delta: number, center?: Position) => void;
  /** Reset camera to origin */
  reset: () => void;
  /** Set camera position directly */
  setCamera: (camera: Partial<Camera>) => void;
  /** Gesture bindings for the canvas */
  bind: () => GridNavigationBindings;
  /** Whether momentum animation is active */
  isAnimating: boolean;
}

export interface GridNavigationBindings {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
  style: CSSProperties;
}
