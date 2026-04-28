/**
 * BentoGrid shared types.
 *
 * These consolidate the camera, viewport, and card primitives from the
 * InfiniteGrid and UnifiedGrid implementations while the refactor is phased in.
 */

import type { CSSProperties, ReactNode } from 'react';
import type Matter from 'matter-js';

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

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface Point {
  x: number;
  y: number;
}

export type Position = Point;

export interface Size {
  width: number;
  height: number;
}

export type Rect = Point & Size;

export type Bounds = Rect;

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';
export type StickyEdge = 'none' | SpawnEdge;
export type SearchCardEdge = StickyEdge;

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

export interface QueuedCard {
  id: string;
  data: CardData;
  queuedAt: number;
}

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
}

export type ExclusionZone = Rect;

export interface GridConfig {
  theme: GridTheme;
  cards: CardData[];
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  pageTitle?: string;
  breadcrumb?: string;
}

export interface CameraBindingStyle {
  cursor: CSSProperties['cursor'];
  touchAction: CSSProperties['touchAction'];
}

export type CameraBindings = Record<string, unknown> & {
  style: CameraBindingStyle;
};

export interface UseCameraReturn {
  camera: Camera;
  pan: (dx: number, dy: number) => void;
  zoom: (delta: number, center?: Position) => void;
  setCamera: (camera: Partial<Camera> | ((camera: Camera) => Camera)) => void;
  reset: () => void;
  stopMomentum: () => void;
  isDragging: boolean;
  isAnimating: boolean;
  bind: () => CameraBindings;
}

export interface UseViewportReturn {
  bounds: ViewportBounds;
  windowSize: Size;
  isInViewport: (position: Position, buffer?: number) => boolean;
  isCardInViewport: (card: CardPosition | Rect, buffer?: number) => boolean;
  getSpawnPosition: (edge: SpawnEdge) => Position;
  getExitEdge: (position: Position) => SpawnEdge | null;
  screenToCanvas: (screenX: number, screenY: number) => Position;
  canvasToScreen: (canvasX: number, canvasY: number) => Position;
}
