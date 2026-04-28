import type Matter from 'matter-js';
import type {
  CSSProperties,
  PointerEventHandler,
  WheelEventHandler,
} from 'react';
import type { Project } from '@/lib/projects-data';
import type {
  CardData,
  CardLayout,
  CardPosition,
  PooledCard,
  ProjectCardData,
  RenderCard,
  SpawnEdge,
} from './BentoGrid.card.types';
import type {
  Point,
  Position,
  Size,
  Velocity,
} from './BentoGrid.primitives.types';
import type { GridTheme, ThemeConfig } from './BentoGrid.theme.types';

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
  /** Canvas-space left edge alias used by InfiniteGrid. */
  x: number;
  /** Canvas-space top edge alias used by InfiniteGrid. */
  y: number;
  /** Canvas-space left edge. */
  left: number;
  /** Canvas-space top edge. */
  top: number;
  /** Canvas-space right edge. */
  right: number;
  /** Canvas-space bottom edge. */
  bottom: number;
}

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
  /** Current rendered size, kept for InfiniteGrid sticky-state compatibility. */
  size: Size;
  /** Current search term. */
  searchTerm: string;
  /** Selected category filter (null = all). */
  category: string | null;
  /** Available categories for filtering. */
  categories: string[];
}

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

export interface LayoutTransition {
  /** Cards that exist in both old and new layout. */
  kept: Set<string>;
  /** Cards removed from layout. */
  removed: Set<string>;
  /** Cards added to layout. */
  added: Set<string>;
}

export type TransitionPhase = 'idle' | 'removing' | 'settling' | 'adding';

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

/** @deprecated Use BentoGridProps. Kept during the refactor bridge. */
export interface GridState {
  /** Current visible cards with positions. */
  visibleCards: Map<string, CardPosition>;
  /** Cards in the FIFO pool waiting to spawn. */
  queuedCards: PooledCard[];
  /** Search/filter state. */
  search: SearchCardState;
  /** Navigation/camera state. */
  navigation: NavigationState;
  /** Whether grid is in mobile mode. */
  isMobile: boolean;
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
  /** @deprecated Use onBack. */
  onClose?: () => void;
  onReset: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  totalCount: number;
  /** @deprecated Use totalCount. */
  projectCount?: number;
  visibleCount: number;
  theme: ThemeConfig;
}

export interface ProjectCardProps {
  card: ProjectCardData;
  /** @deprecated Use card.project when the original portfolio project is needed. */
  project?: Project;
  layout: CardLayout;
  /** Position from physics world. */
  physicsPosition?: PhysicsPosition;
  onClick: () => void;
  /** Animation state for transitions. */
  isEntering?: boolean;
  isExiting?: boolean;
  theme: ThemeConfig;
}

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

/** @deprecated Use UseCameraReturn. */
export type UseGridNavigationReturn = UseCameraReturn;

/** @deprecated Use UseCameraReturn. */
export type UseCanvasReturn = UseCameraReturn;

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
