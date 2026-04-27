/**
 * BentoGrid Type Definitions
 *
 * Consolidates the canvas/physics types from InfiniteGrid with the card pool,
 * theme, search, and mobile view types from UnifiedGrid.
 */

import type Matter from 'matter-js';
import type {
  CSSProperties,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from 'react';
import type { Project } from '@/lib/projects-data';

// =============================================================================
// Primitives
// =============================================================================

export interface Point {
  x: number;
  y: number;
}

export type Position = Point;

export interface Velocity {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Point, Size {}

// =============================================================================
// Theme
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
    /** Random rotation range in degrees (0 = no rotation). */
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
  };
}

// =============================================================================
// Card Data
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

// =============================================================================
// Camera & Viewport
// =============================================================================

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  camera: Camera;
  isDragging: boolean;
  momentum: Velocity;
}

export interface NavigationState {
  camera: Camera;
  velocity: Velocity;
  isDragging: boolean;
  isPanning: boolean;
}

export interface ViewportBounds extends Size {
  /** Canvas-space left edge. */
  left: number;
  /** Canvas-space top edge. */
  top: number;
  /** Canvas-space right edge. */
  right: number;
  /** Canvas-space bottom edge. */
  bottom: number;
}

// =============================================================================
// Grid Layout
// =============================================================================

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface GridLayoutConfig {
  cellSize: number;
  gap: number;
}

export interface CardPosition extends Point, Size {
  /** Rotation in degrees. */
  rotation: number;
  /** Card size variant. */
  size: CardSize;
}

export interface CardLayout extends CardPosition {
  id: string;
}

export interface ExclusionZone extends Bounds {}

export type RenderCard = (
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex?: number,
) => ReactNode;

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

// =============================================================================
// Card Pool
// =============================================================================

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

// =============================================================================
// Search Card
// =============================================================================

export type SearchCardEdge = 'none' | SpawnEdge;
export type StickyEdge = SearchCardEdge;

export interface SearchCardState {
  /** Whether optional search filters/details are visible. */
  expanded: boolean;
  /** Which viewport edge the card is compressing against. */
  edge: SearchCardEdge;
  /** Alias used by the physics/sticky implementation. */
  stickyEdge: StickyEdge;
  /** How far the card has compressed from regular card to edge state. */
  compression: number;
  /** Position in canvas coordinates before sticking. */
  canvasPosition: Point;
  /** Screen position while stuck to an edge. */
  screenPosition: Point;
  /** Current rendered width after proportional compression. */
  width: number;
  /** Current rendered height after proportional compression. */
  height: number;
  /** Current search term. */
  searchTerm: string;
  /** Selected category filter (null = all). */
  category: string | null;
  /** Available categories for filtering. */
  categories: string[];
}

// =============================================================================
// Physics
// =============================================================================

export interface PhysicsPosition {
  x: number;
  y: number;
  angle: number;
}

export interface PhysicsCard {
  id: string;
  body: Matter.Body;
  /** Target position from bento layout for settling force. */
  targetPosition: Point;
  /** Whether card is being removed (fade out, then delete body). */
  isRemoving: boolean;
}

export interface PhysicsConfig {
  friction: number;
  frictionAir: number;
  restitution: number;
  density: number;
  sleepThreshold: number;
  /** Strength of settling force toward bento targets. */
  settlingStrength: number;
}

// =============================================================================
// Layout Transitions
// =============================================================================

export interface LayoutTransition {
  /** Cards that exist in both old and new layout. */
  kept: Set<string>;
  /** Cards removed from layout. */
  removed: Set<string>;
  /** Cards added to layout. */
  added: Set<string>;
}

export type TransitionPhase = 'idle' | 'removing' | 'settling' | 'adding';

// =============================================================================
// Component Props
// =============================================================================

export interface BentoGridProps {
  /** Theme variant. */
  theme: GridTheme;
  /** All available cards. */
  cards: CardData[];
  /** Callback when a card is selected. */
  onCardSelect?: (card: CardData) => void;
  /** Callback for back navigation. */
  onBack?: () => void;
  /** Page title shown in search card. */
  pageTitle?: string;
  /** Breadcrumb path, e.g. "bentOS / playground". */
  breadcrumb?: string;
  /** CSS class for the container. */
  className?: string;
  /** Custom card renderer. */
  renderCard?: RenderCard;
}

export interface SearchCardProps {
  /** Position to render at in canvas coordinates. */
  position: Point;
  /** Whether the card is stuck to a viewport edge. */
  isStuck: boolean;
  /** Which edge it is stuck to. */
  stickyEdge: StickyEdge;
  /** Card dimensions. */
  cardSize: Size;
  onBack?: () => void;
  onReset: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  totalCount: number;
  visibleCount: number;
  theme: ThemeConfig;
}

export interface ProjectCardProps {
  card: ProjectCardData;
  layout: CardLayout;
  /** Position from physics world. */
  physicsPosition?: PhysicsPosition;
  onClick: () => void;
  /** Animation state for transitions. */
  isEntering?: boolean;
  isExiting?: boolean;
  theme: ThemeConfig;
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseCameraReturn {
  camera: Camera;
  /** Pan the camera by delta. */
  pan: (dx: number, dy: number) => void;
  /** Zoom the camera. */
  zoom: (delta: number, center?: Position) => void;
  /** Reset camera to origin. */
  reset: () => void;
  /** Stop any ongoing momentum. */
  stopMomentum: () => void;
  /** Set camera position directly. */
  setCamera: (camera: Partial<Camera>) => void;
  /** Whether canvas is currently being dragged. */
  isDragging: boolean;
  /** Whether momentum animation is active. */
  isAnimating: boolean;
  /** Gesture binding for canvas element. */
  bind: () => GridNavigationBindings;
}

export interface UseViewportReturn {
  /** Current viewport bounds in canvas coordinates. */
  bounds: ViewportBounds;
  /** Check if a position is within viewport. */
  isInViewport: (position: Position, buffer?: number) => boolean;
  /** Check if a card rect is within viewport. */
  isCardInViewport: (card: CardPosition, buffer?: number) => boolean;
  /** Get spawn position for an edge. */
  getSpawnPosition: (edge: SpawnEdge) => Position;
  /** Determine which edge a position exited from. */
  getExitEdge: (position: Position) => SpawnEdge | null;
}

export interface UseSpawnManagerReturn {
  /** Run a despawn + spawn check based on current camera/viewport state. */
  tick: () => void;
  /** Force a spawn at a specific edge for testing/debugging. */
  forceSpawn: (edge: SpawnEdge) => void;
}

export interface UseCardNavigationReturn {
  focusedCardId: string | null;
  setFocusedCardId: (cardId: string | null) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  selectFocused: () => void;
}

export interface UseBentoLayoutReturn {
  /** Current card layouts. */
  layouts: Map<string, CardLayout>;
  /** Filtered cards. */
  filtered: CardData[];
  /** Transition info for animation. */
  transition: LayoutTransition;
  /** Current transition phase. */
  phase: TransitionPhase;
}

export interface UsePhysicsWorldReturn {
  /** Current positions of all physics bodies. */
  positions: Map<string, PhysicsPosition>;
  /** Whether physics world is initialized. */
  isReady: boolean;
  /** Update search card position and clamped/static state. */
  updateSearchClampedPosition: (x: number, y: number, isClamped: boolean) => void;
  /** Update target positions for settling. */
  updateTargets: (layouts: Map<string, CardLayout>) => void;
}

export interface GridNavigationBindings {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
  style: CSSProperties;
}
