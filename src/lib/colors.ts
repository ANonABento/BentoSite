/**
 * Centralized color utilities for the portfolio
 *
 * All colors reference CSS variables defined in globals.css for theme support.
 * NEVER use hardcoded Tailwind colors like orange-500 or violet-500.
 * Orange is the generic primary color; purple is reserved for AI UI.
 */

// CSS Variable references (for inline styles when needed)
export const CSS_VARS = {
  primary: 'var(--primary)',
  primaryHover: 'var(--primary-hover)',
  primaryActive: 'var(--primary-active)',
  primaryMuted: 'var(--primary-muted)',
  ai: 'var(--ai)',
  aiHover: 'var(--ai-hover)',
  aiActive: 'var(--ai-active)',
  aiMuted: 'var(--ai-muted)',

  // Legacy hue aliases
  orange: 'var(--primary)',
  orangeHover: 'var(--primary-hover)',
  orangeActive: 'var(--primary-active)',
  orangeMuted: 'var(--primary-muted)',
  purple: 'var(--ai)',
  purpleHover: 'var(--ai-hover)',
  purpleActive: 'var(--ai-active)',
  purpleMuted: 'var(--ai-muted)',

  // Semantic aliases
  highlight: 'var(--highlight)',
  highlightHover: 'var(--highlight-hover)',
  highlightActive: 'var(--highlight-active)',
  interactive: 'var(--interactive)',
  interactiveHover: 'var(--interactive-hover)',
  interactiveActive: 'var(--interactive-active)',

  // Backgrounds
  background: 'var(--background)',
  glassBg: 'var(--glass-bg)',
  glassBgStrong: 'var(--glass-bg-strong)',

  // Text
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textOnAccent: 'var(--text-on-accent)',
  textOnOverlay: 'var(--text-on-overlay)',

  // Status
  success: 'var(--status-success)',
  successMuted: 'var(--status-success-muted)',
  warning: 'var(--primary)',
  warningMuted: 'var(--primary-muted)',
  error: 'var(--destructive)',
  errorMuted: 'var(--destructive-muted)',
  info: 'var(--status-info)',
  infoMuted: 'var(--status-info-muted)',
} as const;

// Tailwind class mappings using CSS variables
// Use these instead of hardcoded Tailwind color classes
export const COLORS = {
  primary: {
    bg: 'bg-[var(--primary)]',
    bgHover: 'bg-[var(--primary-hover)]',
    bgActive: 'bg-[var(--primary-active)]',
    bgMuted: 'bg-[var(--primary-muted)]',
    text: 'text-[var(--primary)]',
    border: 'border-[var(--primary)]',
    ring: 'ring-[var(--primary)]',
    shadow: 'shadow-[0_0_20px_var(--primary-muted)]',
  },
  ai: {
    bg: 'bg-[var(--ai)]',
    bgHover: 'bg-[var(--ai-hover)]',
    bgActive: 'bg-[var(--ai-active)]',
    bgMuted: 'bg-[var(--ai-muted)]',
    text: 'text-[var(--ai)]',
    border: 'border-[var(--ai)]',
    ring: 'ring-[var(--ai)]',
    shadow: 'shadow-[0_0_20px_var(--ai-muted)]',
  },
  orange: {
    bg: 'bg-[var(--primary)]',
    bgHover: 'bg-[var(--primary-hover)]',
    bgActive: 'bg-[var(--primary-active)]',
    bgMuted: 'bg-[var(--primary-muted)]',
    text: 'text-[var(--primary)]',
    border: 'border-[var(--primary)]',
    ring: 'ring-[var(--primary)]',
    shadow: 'shadow-[0_0_20px_var(--primary-muted)]',
  },
  purple: {
    bg: 'bg-[var(--ai)]',
    bgHover: 'bg-[var(--ai-hover)]',
    bgActive: 'bg-[var(--ai-active)]',
    bgMuted: 'bg-[var(--ai-muted)]',
    text: 'text-[var(--ai)]',
    border: 'border-[var(--ai)]',
    ring: 'ring-[var(--ai)]',
    shadow: 'shadow-[0_0_20px_var(--ai-muted)]',
  },
} as const;

// Gradient utilities (for cases where gradients are needed)
// Returns style objects for use with inline styles
export const GRADIENTS = {
  purpleToOrange: {
    background: 'linear-gradient(to right, var(--primary), var(--primary-hover))',
  },
  purpleToOrangeSubtle: {
    background: 'linear-gradient(to right, var(--primary-muted), var(--primary-muted))',
  },
  purpleFade: {
    background: 'linear-gradient(to bottom, var(--ai-muted), transparent)',
  },
  orangeFade: {
    background: 'linear-gradient(to bottom, var(--primary-muted), transparent)',
  },
} as const;

// Common button class combinations
export const BUTTON_CLASSES = {
  cta: `bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
        text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--primary-muted)]
        border border-[var(--primary-hover)]/20`,

  primary: `bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
            text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--primary-muted)]
            border border-[var(--primary-hover)]/20`,

  ai: `bg-[var(--ai)] hover:bg-[var(--ai-hover)] active:bg-[var(--ai-active)]
       text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--ai-muted)]
       border border-[var(--ai-hover)]/20`,

  // Ghost button with orange hover
  ghostOrange: `text-[var(--text-secondary)] hover:text-[var(--primary)]
                hover:bg-[var(--primary-muted)] transition-colors`,

  ghostPurple: `text-[var(--text-secondary)] hover:text-[var(--ai)]
                hover:bg-[var(--ai-muted)] transition-colors`,
} as const;
