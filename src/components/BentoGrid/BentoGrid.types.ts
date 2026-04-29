/**
 * BentoGrid shared type definitions.
 *
 * The consolidated grid uses top-left card coordinates for layout/rendering.
 * The physics layer converts those rectangles to Matter.js body centers.
 */

import type Matter from 'matter-js';
import type {
  CSSProperties,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from 'react';

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

export interface Position {
  x: number;
  y: number;
}

export type Point = Position;

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export interface GridLayoutConfig {
  cellSize: number;
  gap: number;
  columns?: number;
}

export interface CardPosition extends Rect {
  rotation: number;
  size: CardSize;
}

export interface CardLayout extends CardPosition {
  id: string;
}

export interface ExclusionZone extends Rect {
  padding?: number;
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
  x?: number;
  y?: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

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

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export type SearchCardEdge = 'none' | 'top' | 'bottom' | 'left' | 'right';
export type StickyEdge = SearchCardEdge;

export type StickyEdge = SearchCardEdge;

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

export interface GridConfig {
  theme: GridTheme;
  cards: CardData[];
  onCardSelect?: (card: CardData) => void;
  onBack?: () => void;
  pageTitle?: string;
  breadcrumb?: string;
}

export interface UseCardPoolReturn {
  visible: Map<string, CardPosition>;
  queue: QueuedCard[];
  cardDataMap: Map<string, CardData>;
  maxVisible: number;
  enqueue: (cardId: string) => void;
  dequeue: () => QueuedCard | undefined;
  removeVisible: (cardId: string) => void;
  addVisible: (cardId: string, position: CardPosition) => boolean;
  reset: () => void;
  applyFilter: (searchTerm: string, category: string | null) => void;
}

export interface UseViewportReturn {
  bounds: ViewportBounds;
  isInViewport: (position: Position, buffer?: number) => boolean;
  isCardInViewport: (card: CardPosition, buffer?: number) => boolean;
  getSpawnPosition: (edge: SpawnEdge) => Position;
  getExitEdge: (position: Position) => SpawnEdge | null;
}

export interface SpawnPhysicsBridge {
  addCard: (cardId: string, position: CardPosition) => void;
  removeCard: (cardId: string) => void;
  applyEntranceBurst: (cardId: string, center?: Position) => void;
}

export interface UseSpawnManagerReturn {
  tick: () => void;
  forceSpawn: (edge: SpawnEdge) => void;
}

export interface CameraBindings {
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: PointerEventHandler<HTMLDivElement>;
  onWheel?: WheelEventHandler<HTMLDivElement>;
  style: CSSProperties;
}

export interface UseCameraReturn {
  camera: Camera;
  pan: (dx: number, dy: number) => void;
  zoom: (delta: number, center?: Position) => void;
  reset: () => void;
  stopMomentum: () => void;
  setCamera: (camera: Partial<Camera> | ((camera: Camera) => Camera)) => void;
  isDragging: boolean;
  isAnimating: boolean;
  bind: () => CameraBindings;
}

export interface PhysicsPosition {
  x: number;
  y: number;
  angle: number;
}

export interface PhysicsCard {
  id: string;
  body: Matter.Body;
  targetPosition: Position;
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

export interface UsePhysicsWorldReturn extends SpawnPhysicsBridge {
  positions: Map<string, PhysicsPosition>;
  isReady: boolean;
  updateSearchCard: (layout: CardLayout, isStatic: boolean) => void;
  updateTargets: (layouts: Map<string, CardPosition>) => void;
}
