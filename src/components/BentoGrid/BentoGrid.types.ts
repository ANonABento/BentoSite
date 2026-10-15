/**
 * BentoGrid shared type definitions.
 *
 * The grid uses top-left card coordinates for layout and rendering.
 */

import type {
  CSSProperties,
  MouseEventHandler,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from 'react';
import type { BoardLayout, CardLook } from './layout/boardLayout';

export type GridTheme = 'playful' | 'premium' | 'gallery' | 'arcade';

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

export type CardType = 'game' | 'project' | 'photo' | 'intro' | 'info';

export interface BaseCardData {
  id: string;
  type: CardType;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  /** Footprint on the board, from the layout. */
  size?: CardSize;
  /** Sits beside the search card in the home band and is never filtered out. */
  pinned?: boolean;
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
  /** Award text, shown as a star badge. */
  award?: string;
  /** The award in a few words, written on the badge when the card has room. */
  awardShort?: string;
  /** Short display date for the footer, e.g. "Oct 2026". */
  date?: string;
  /** How the card frames its image, from the layout. */
  look?: CardLook;
}

export interface PhotoCardData extends BaseCardData {
  type: 'photo';
  src: string;
  alt: string;
  location: string;
  year: string;
  aspectRatio: number;
  blurDataURL?: string;
}

/** Pinned identity card: placed beside the search card, never recycled or filtered out. */
export interface IntroCardData extends BaseCardData {
  type: 'intro';
}

/** Non-project compartment: resume and contact links. */
export interface InfoCardData extends BaseCardData {
  type: 'info';
  variant: 'contact';
}

export type CardData = GameCardData | ProjectCardData | PhotoCardData | IntroCardData | InfoCardData;

/** Footprint in grid cells, columns by rows, e.g. '3x2'. */
export type CardSize = `${number}x${number}`;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export type Point = Position;

export interface CardPosition extends Rect {
  rotation: number;
  size: CardSize;
}

export interface CardLayout extends CardPosition {
  id: string;
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
  x: number;
  y: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
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

export interface NavigationState {
  camera: Camera;
  velocity: Velocity;
  isDragging: boolean;
  isPanning: boolean;
}

export type SearchCardEdge = 'none' | 'top' | 'bottom' | 'left' | 'right';
export type StickyEdge = SearchCardEdge;

export interface SearchCardState {
  expanded: boolean;
  edge: SearchCardEdge;
  compression: number;
  width: number;
  height: number;
  screenPosition: Position;
  searchTerm: string;
  category: string | null;
  categories: string[];
}

export type CardSizeMode = 'mixed' | 'detail' | '2x2';

export interface GridConfig {
  theme: GridTheme;
  cards: CardData[];
  /** Where every card sits in the repeating tile (src/content/layout.json). */
  layout: BoardLayout;
  /** Force all content cards to a specific size. Default: 'mixed' (varied sizes). */
  cardSizeMode?: CardSizeMode;
  /** A card was opened. `origin` is where it is on screen, when known, for an open animation to grow from. */
  onCardSelect?: (card: CardData, origin?: Rect) => void;
  onBack?: () => void;
  pageTitle?: string;
  breadcrumb?: string;
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
  /** Step the zoom in (+) or out (-) through CAMERA.zoomLevels, about the middle of the screen. */
  zoom: (steps: number) => void;
  /** The current zoom as a multiple of the window's fit zoom. */
  zoomLevel: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  reset: () => void;
  setCamera: (camera: CameraUpdate) => void;
  bind: () => GridNavigationBindings;
  isAnimating: boolean;
}

export type CameraUpdate = Partial<Camera> | ((camera: Camera) => Camera);

export interface UseCameraReturn extends UseGridNavigationReturn {
  cameraRef: React.RefObject<Camera>;
  /** End the zoomed-out intro, gliding in over `ms`. */
  settle: (ms: number) => void;
  stopMomentum: () => void;
  isDragging: boolean;
}

export interface GridNavigationBindings {
  onPointerDown?: PointerEventHandler<EventTarget>;
  onPointerMove?: PointerEventHandler<EventTarget>;
  onPointerUp?: PointerEventHandler<EventTarget>;
  onPointerLeave?: PointerEventHandler<EventTarget>;
  onAuxClick?: MouseEventHandler<EventTarget>;
  onMouseDown?: MouseEventHandler<EventTarget>;
  onWheel?: WheelEventHandler<EventTarget>;
  style: CSSProperties;
}

export type CameraBindings = GridNavigationBindings;
