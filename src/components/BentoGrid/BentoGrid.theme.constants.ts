import type {
  GridTheme,
  ThemeConfig,
} from './BentoGrid.types';

export const THEME_PLAYFUL: ThemeConfig = {
  name: 'playful',
  background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0415 100%)',
  card: {
    background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
    border: '2px solid rgba(255, 0, 255, 0.25)',
    borderRadius: 20,
    shadow: '0 0 20px rgba(255, 0, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
    hoverShadow: '0 0 40px rgba(255, 0, 255, 0.3), 0 12px 48px rgba(0, 0, 0, 0.4)',
    rotationRange: 3,
  },
  accent: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    tertiary: '#ffff00',
  },
  searchCard: {
    background: 'rgba(26, 10, 46, 0.95)',
    border: '2px solid rgba(255, 0, 255, 0.3)',
  },
};

export const THEME_PREMIUM: ThemeConfig = {
  name: 'premium',
  background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
  card: {
    background: 'rgba(20, 20, 20, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    shadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    hoverShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)',
    rotationRange: 0,
  },
  accent: {
    primary: '#8b5cf6',
    secondary: '#6366f1',
  },
  searchCard: {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

export const THEMES = {
  playful: THEME_PLAYFUL,
  premium: THEME_PREMIUM,
} satisfies Record<GridTheme, ThemeConfig>;

const MOBILE_VALUES = {
  breakpoint: 768,
  cardWidthPercent: 0.9,
  cardMaxWidth: 400,
  scrollGap: 16,
  scrollPadding: 24,
} as const;

export const MOBILE = {
  breakpoint: MOBILE_VALUES.breakpoint,
  cardWidthPercent: MOBILE_VALUES.cardWidthPercent,
  cardMaxWidth: MOBILE_VALUES.cardMaxWidth,
  scrollGap: MOBILE_VALUES.scrollGap,
  scrollPadding: MOBILE_VALUES.scrollPadding,
  BREAKPOINT: MOBILE_VALUES.breakpoint,
  CARD_WIDTH_PERCENT: MOBILE_VALUES.cardWidthPercent,
  CARD_MAX_WIDTH: MOBILE_VALUES.cardMaxWidth,
  SCROLL_GAP: MOBILE_VALUES.scrollGap,
  SCROLL_PADDING: MOBILE_VALUES.scrollPadding,
} as const;

export const Z_INDEX = {
  canvas: 1,
  cards: 10,
  searchCard: 50,
  searchCardSticky: 100,
  controls: 110,
} as const;

const INTERACTION_VALUES = {
  dragThreshold: 5,
  clickMaxDuration: 200,
  touchTargetMin: 44,
} as const;

export const INTERACTION = {
  dragThreshold: INTERACTION_VALUES.dragThreshold,
  clickMaxDuration: INTERACTION_VALUES.clickMaxDuration,
  touchTargetMin: INTERACTION_VALUES.touchTargetMin,
  DRAG_THRESHOLD: INTERACTION_VALUES.dragThreshold,
  CLICK_MAX_DURATION: INTERACTION_VALUES.clickMaxDuration,
  TOUCH_TARGET_MIN: INTERACTION_VALUES.touchTargetMin,
} as const;

const KEYBOARD_VALUES = {
  panUp: ['w', 'W'] as const,
  panDown: ['s', 'S'] as const,
  panLeft: ['a', 'A'] as const,
  panRight: ['d', 'D'] as const,
  cardUp: ['ArrowUp'] as const,
  cardDown: ['ArrowDown'] as const,
  cardLeft: ['ArrowLeft'] as const,
  cardRight: ['ArrowRight'] as const,
  select: ['Enter', ' '] as const,
  blur: ['Escape'] as const,
  reset: ['r', 'R'] as const,
  back: ['Backspace'] as const,
  close: ['Escape'] as const,
  search: ['/', 'f', 'F'] as const,
  cycle: ['Tab'] as const,
  zoomIn: ['+', '='] as const,
  zoomOut: ['-', '_'] as const,
} as const;

export const KEYBOARD = {
  pan: {
    up: [...KEYBOARD_VALUES.panUp, ...KEYBOARD_VALUES.cardUp],
    down: [...KEYBOARD_VALUES.panDown, ...KEYBOARD_VALUES.cardDown],
    left: [...KEYBOARD_VALUES.panLeft, ...KEYBOARD_VALUES.cardLeft],
    right: [...KEYBOARD_VALUES.panRight, ...KEYBOARD_VALUES.cardRight],
  },
  card: {
    up: KEYBOARD_VALUES.cardUp,
    down: KEYBOARD_VALUES.cardDown,
    left: KEYBOARD_VALUES.cardLeft,
    right: KEYBOARD_VALUES.cardRight,
  },
  select: KEYBOARD_VALUES.select,
  blur: KEYBOARD_VALUES.blur,
  reset: KEYBOARD_VALUES.reset,
  back: KEYBOARD_VALUES.back,
  close: KEYBOARD_VALUES.close,
  search: KEYBOARD_VALUES.search,
  cycle: KEYBOARD_VALUES.cycle,
  zoomIn: KEYBOARD_VALUES.zoomIn,
  zoomOut: KEYBOARD_VALUES.zoomOut,
  PAN_UP: KEYBOARD_VALUES.panUp,
  PAN_DOWN: KEYBOARD_VALUES.panDown,
  PAN_LEFT: KEYBOARD_VALUES.panLeft,
  PAN_RIGHT: KEYBOARD_VALUES.panRight,
  CARD_UP: KEYBOARD_VALUES.cardUp,
  CARD_DOWN: KEYBOARD_VALUES.cardDown,
  CARD_LEFT: KEYBOARD_VALUES.cardLeft,
  CARD_RIGHT: KEYBOARD_VALUES.cardRight,
  SELECT: KEYBOARD_VALUES.select,
  BLUR: KEYBOARD_VALUES.blur,
  RESET: KEYBOARD_VALUES.reset,
  BACK: KEYBOARD_VALUES.back,
  CLOSE: KEYBOARD_VALUES.close,
  SEARCH: KEYBOARD_VALUES.search,
  CYCLE: KEYBOARD_VALUES.cycle,
  ZOOM_IN: KEYBOARD_VALUES.zoomIn,
  ZOOM_OUT: KEYBOARD_VALUES.zoomOut,
} as const;

export const STORAGE_KEY = 'bentosite-bento-grid-camera';
