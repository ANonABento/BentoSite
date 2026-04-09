// InfiniteGrid v2 Types
// Canvas-based pan/zoom with sticky search card and physics collision

import type Matter from 'matter-js';
import type { Project } from '@/lib/projects-data';

// =============================================================================
// Primitives
// =============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Camera & Canvas
// =============================================================================

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  camera: Camera;
  isDragging: boolean;
  momentum: Point;
}

// =============================================================================
// Card Layout
// =============================================================================

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface CardLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: CardSize;
}

export interface GridConfig {
  cellSize: number;
  columns: number;
  gap: number;
}

// =============================================================================
// Search Card - Sticky Behavior
// =============================================================================

export type StickyEdge = 'none' | 'top' | 'bottom' | 'left' | 'right';

export interface SearchCardState {
  /** Position in canvas coordinates (where it would be without sticking) */
  canvasPosition: Point;
  /** Which edge it's stuck to, if any */
  stickyEdge: StickyEdge;
  /** Screen position when stuck to an edge */
  screenPosition: Point;
  /** Card dimensions */
  size: Size;
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
  /** Target position from bento layout (for settling force) */
  targetPosition: Point;
  /** Whether card is being removed (fade out, then delete body) */
  isRemoving: boolean;
}

export interface PhysicsConfig {
  friction: number;
  frictionAir: number;
  restitution: number;
  density: number;
  sleepThreshold: number;
  /** Strength of settling force toward bento targets */
  settlingStrength: number;
}

// =============================================================================
// Exclusion Zone (for clamped search card)
// =============================================================================

export interface ExclusionZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Layout Transitions (Hybrid Animation)
// =============================================================================

export interface LayoutTransition {
  /** Cards that exist in both old and new layout - physics settle */
  kept: Set<string>;
  /** Cards removed from layout - fade out then delete */
  removed: Set<string>;
  /** Cards added to layout - create body then fade in */
  added: Set<string>;
}

export type TransitionPhase = 'idle' | 'removing' | 'settling' | 'adding';

// =============================================================================
// Viewport
// =============================================================================

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Component Props
// =============================================================================

export interface InfiniteGridProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (project: Project) => void;
}

export interface SearchCardProps {
  /** Position to render at (always canvas coords - parent handles clamping) */
  position: Point;
  /** Whether the card is stuck to a viewport edge */
  isStuck: boolean;
  /** Which edge it's stuck to */
  stickyEdge: StickyEdge;
  /** Card dimensions */
  cardSize: Size;
  onClose: () => void;
  onReset: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  projectCount: number;
  visibleCount: number;
}

export interface ProjectCardProps {
  project: Project;
  layout: CardLayout;
  /** Position from physics world */
  physicsPosition?: PhysicsPosition;
  onClick: () => void;
  /** Animation state for transitions */
  isEntering?: boolean;
  isExiting?: boolean;
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseCanvasReturn {
  camera: Camera;
  /** Reset camera to origin */
  reset: () => void;
  /** Stop any ongoing momentum */
  stopMomentum: () => void;
  /** Whether canvas is currently being dragged */
  isDragging: boolean;
  /** Gesture binding for canvas element */
  bind: () => Record<string, unknown>;
}

export interface UseBentoLayoutReturn {
  /** Current card layouts */
  layouts: Map<string, CardLayout>;
  /** Filtered projects */
  filtered: Project[];
  /** Transition info for animation */
  transition: LayoutTransition;
  /** Current transition phase */
  phase: TransitionPhase;
}

export interface UsePhysicsWorldReturn {
  /** Current positions of all physics bodies */
  positions: Map<string, PhysicsPosition>;
  /** Whether physics world is initialized */
  isReady: boolean;
  /** Update search card position and clamped state (handles flow-around behavior) */
  updateSearchClampedPosition: (x: number, y: number, isClamped: boolean) => void;
  /** Update target positions for settling */
  updateTargets: (layouts: Map<string, CardLayout>) => void;
}

