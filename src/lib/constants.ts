/**
 * Centralized constants for the application
 */

export const TIMEOUTS = {
  /** Chat API request timeout in ms */
  CHAT_REQUEST: 30000,
  /** Clipboard feedback display duration in ms */
  CLIPBOARD_FEEDBACK: 2000,
  /** Toast notification auto-dismiss duration in ms */
  TOAST_DURATION: 3000,
} as const;

export const ANIMATION_DURATIONS = {
  /** Fast transition for micro-interactions */
  FAST: 150,
  /** Normal transition for UI elements */
  NORMAL: 200,
  /** Slow transition for emphasis */
  SLOW: 300,
  /** Tab switch animation delay */
  TAB_SWITCH: 150,
} as const;
