/**
 * Centralized constants for the application
 */

// === BREAKPOINTS ===

/**
 * Screen size breakpoints for responsive design
 * Matches Tailwind's default breakpoints
 */
export const BREAKPOINTS = {
  /** Small screens (mobile landscape) */
  SM: 640,
  /** Medium screens (tablet) */
  MD: 768,
  /** Large screens (desktop) */
  LG: 1024,
  /** Extra large screens (wide desktop) */
  XL: 1280,
  /** 2x Extra large screens */
  '2XL': 1536,
} as const;

// === TIMEOUTS ===

export const TIMEOUTS = {
  /** Chat API request timeout in ms */
  CHAT_REQUEST: 30000,
  /** Clipboard feedback display duration in ms */
  CLIPBOARD_FEEDBACK: 2000,
  /** Toast notification auto-dismiss duration in ms */
  TOAST_DURATION: 3000,
  /** Debounce delay for search input in ms */
  SEARCH_DEBOUNCE: 300,
  /** Delay before showing loading indicator in ms */
  LOADING_DELAY: 150,
} as const;

// === ANIMATION DURATIONS ===

export const ANIMATION_DURATIONS = {
  /** Instant - no animation (0ms) */
  INSTANT: 0,
  /** Fast transition for micro-interactions (150ms) */
  FAST: 150,
  /** Normal transition for UI elements (200ms) */
  NORMAL: 200,
  /** Slow transition for emphasis (300ms) */
  SLOW: 300,
  /** Dramatic transition for major state changes (500ms) */
  DRAMATIC: 500,
  /** Tab switch animation delay */
  TAB_SWITCH: 150,
} as const;

// === DEFAULT VALUES ===

export const DEFAULTS = {
  /** Default window width for SSR */
  WINDOW_WIDTH: 1920,
  /** Default window height for SSR */
  WINDOW_HEIGHT: 1080,
  /** Maximum stored chat messages */
  MAX_CHAT_MESSAGES: 50,
  /** Default FPS threshold for performance adaptations */
  FPS_THRESHOLD: 30,
} as const;

// === PERFORMANCE THRESHOLDS ===

export const PERFORMANCE = {
  /** FPS below this triggers quality reduction */
  LOW_FPS_THRESHOLD: 30,
  /** Maximum pixel ratio on mobile devices */
  MOBILE_MAX_PIXEL_RATIO: 1.5,
  /** LOD distance thresholds for desktop */
  LOD_DESKTOP: {
    HIGH_DETAIL: 10,
    MEDIUM_DETAIL: 20,
  },
  /** LOD distance thresholds for mobile */
  LOD_MOBILE: {
    HIGH_DETAIL: 5,
    MEDIUM_DETAIL: 10,
  },
} as const;

// === ZOOM LIMITS ===

export const ZOOM_LIMITS = {
  DESKTOP: {
    MIN_DISTANCE: 3,
    MAX_DISTANCE: 30,
  },
  MOBILE: {
    MIN_DISTANCE: 4,
    MAX_DISTANCE: 40,
  },
} as const;

// === STORAGE KEYS ===

export const STORAGE_KEYS = {
  /** Chat message history */
  CHAT_HISTORY: 'portfolio-chat-history',
  /** High scores for playground games */
  HIGH_SCORES: 'playground-high-scores',
  /** User preferences */
  PREFERENCES: 'user-preferences',
} as const;

// === Z-INDEX SCALE ===

export const Z_INDEX = {
  BASE: 0,
  ELEVATED: 10,
  DROPDOWN: 20,
  STICKY: 30,
  FIXED: 40,
  OVERLAY: 50,
  MODAL: 60,
  POPOVER: 70,
  TOOLTIP: 80,
  TOAST: 90,
} as const;

// === API ENDPOINTS ===

export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  FEEDBACK: '/api/feedback',
} as const;

// === EXTERNAL URLS ===

/**
 * Resume PDF — exported on demand from the canonical Google Doc.
 * Using the export endpoint avoids stale `/public` copies and keeps
 * the source of truth in Google Docs.
 */
export const RESUME_URL =
  'https://docs.google.com/document/d/140poL_mXjYyzeCwDNUE6Fs4U9zUKyypF3m4gpUiO1ZU/export?format=pdf';
