/**
 * Consolidated BentoGrid type definitions.
 *
 * These types bridge the existing InfiniteGrid physics model with the
 * UnifiedGrid card queue/view model while the refactor is built in phases.
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
  icon?: string;
  href: string;
  bestScore?: number;
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
// Grid Layout
// =============================================================================

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

/**
 * Physics layout uses center-based coordinates because Matter.js bodies are
 * positioned by center point.
 */
export interface CardLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: CardSize;
}

/**
 * Render positions are retained from UnifiedGrid and use top-left coordinates.
 */
export interface CardPosition extends Position {
  rotation: number;
  size: CardSize;
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

export interface GridConfig {
  cellSize: number;
  columns: number;
  gap: number;
}

export interface GridRuntimeConfig {
  theme: GridTheme;
  cards: CardData[];
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  pageTitle?: string;
  breadcrumb?: string;
}

// =============================================================================
// Card Pool
// =============================================================================

export interface QueuedCard {
  id: string;
  data: CardData;
  queuedAt: number;
}

export interface CardPoolState {
  visible: Map<string, CardPosition>;
  queue: QueuedCard[];
  cardDataMap: Map<string, CardData>;
}

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

// =============================================================================
// Camera / Viewport
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

export interface CanvasState {
  camera: Camera;
  isDragging: boolean;
  momentum: Point;
}

export interface NavigationState {
  camera: Camera;
  velocity: Velocity;
  isDragging: boolean;
  isPanning: boolean;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Search Card
// =============================================================================

export type StickyEdge = 'none' | 'top' | 'bottom' | 'left' | 'right';
export type SearchCardEdge = StickyEdge;

export interface SearchCardState {
  expanded: boolean;
  edge: SearchCardEdge;
  compression: number;
  width: number;
  height: number;
  searchTerm: string;
  category: string | null;
  categories: string[];
}

export interface SearchCardPresentation {
  edge: SearchCardEdge;
  compression: number;
  width: number;
  height: number;
  screenPosition: Point;
}

export interface ExclusionZone {
  x: number;
  y: number;
  width: number;
  height: number;
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
  targetPosition: Point;
  isRemoving: boolean;
}

export interface PhysicsConfig {
  friction: number;
  frictionAir: number;
  restitution: number;
  density: number;
  sleepThreshold: number;
  settlingStrength: number;
  damping: number;
  maxSettlingForce: number;
  entranceBurstStrength: number;
}

export interface BodySyncResult {
  added: string[];
  removed: string[];
  updated: string[];
}

// =============================================================================
// Layout Transitions
// =============================================================================

export interface LayoutTransition {
  kept: Set<string>;
  removed: Set<string>;
  added: Set<string>;
}

export type TransitionPhase = 'idle' | 'removing' | 'settling' | 'adding';

// =============================================================================
// Component Props
// =============================================================================

export interface BentoGridProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectProject?: (project: Project) => void;
}

export interface UsePhysicsWorldReturn {
  positions: Map<string, PhysicsPosition>;
  isReady: boolean;
  updateSearchClampedPosition: (x: number, y: number, isStuck: boolean) => void;
  updateTargets: (layouts: Map<string, CardLayout>) => void;
  applyEntranceBurstToCards: (
    cardIds: Iterable<string>,
    center?: Point,
    strength?: number,
  ) => void;
}

export interface UseViewportReturn {
  bounds: ViewportBounds;
  isInViewport: (position: Position, buffer?: number) => boolean;
  isCardInViewport: (card: CardPosition, buffer?: number) => boolean;
  getSpawnPosition: (edge: SpawnEdge) => Position;
  getExitEdge: (position: Position) => SpawnEdge | null;
}

export interface UseGridNavigationReturn {
  camera: Camera;
  pan: (dx: number, dy: number) => void;
  zoom: (delta: number, center?: Position) => void;
  reset: () => void;
  setCamera: (camera: Partial<Camera>) => void;
  bind: () => GridNavigationBindings;
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
