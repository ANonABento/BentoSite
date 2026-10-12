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
  /** Fixed footprint chosen by the caller (e.g. from the image's aspect ratio).
   *  Overrides the size mode when set. */
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
  /** Short display date for the footer, e.g. "Oct 2026". */
  date?: string;
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

/** Non-project compartment: experience or about. */
export interface InfoCardData extends BaseCardData {
  type: 'info';
  variant: 'experience' | 'about';
}

export type CardData = GameCardData | ProjectCardData | PhotoCardData | IntroCardData | InfoCardData;

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x2' | '2x3' | '4x2';

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
  /** Force all content cards to a specific size. Default: 'mixed' (varied sizes). */
  cardSizeMode?: CardSizeMode;
  onCardSelect?: (card: CardData) => void;
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
  zoom: (delta: number, center?: Position) => void;
  reset: () => void;
  setCamera: (camera: CameraUpdate) => void;
  bind: () => GridNavigationBindings;
  isAnimating: boolean;
}

export type CameraUpdate = Partial<Camera> | ((camera: Camera) => Camera);

export interface UseCameraReturn extends UseGridNavigationReturn {
  cameraRef: React.RefObject<Camera>;
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
