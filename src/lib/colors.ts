/**
 * Centralized color utilities for the portfolio
 *
 * All colors reference CSS variables defined in globals.css for theme support.
 * NEVER use hardcoded Tailwind colors like orange-500 or violet-500.
 */

// CSS Variable references (for inline styles when needed)
export const CSS_VARS = {
  // Orange (highlight/attention)
  orange: 'var(--orange)',
  orangeHover: 'var(--orange-hover)',
  orangeActive: 'var(--orange-active)',
  orangeMuted: 'var(--orange-muted)',

  // Purple (interactive)
  purple: 'var(--purple)',
  purpleHover: 'var(--purple-hover)',
  purpleActive: 'var(--purple-active)',
  purpleMuted: 'var(--purple-muted)',

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
  warning: 'var(--status-warning)',
  warningMuted: 'var(--status-warning-muted)',
  error: 'var(--status-error)',
  errorMuted: 'var(--status-error-muted)',
  info: 'var(--status-info)',
  infoMuted: 'var(--status-info-muted)',
} as const;

// Tailwind class mappings using CSS variables
// Use these instead of hardcoded Tailwind color classes
export const COLORS = {
  orange: {
    bg: 'bg-[var(--orange)]',
    bgHover: 'bg-[var(--orange-hover)]',
    bgActive: 'bg-[var(--orange-active)]',
    bgMuted: 'bg-[var(--orange-muted)]',
    text: 'text-[var(--orange)]',
    border: 'border-[var(--orange)]',
    ring: 'ring-[var(--orange)]',
    shadow: 'shadow-[0_0_20px_var(--orange-muted)]',
  },
  purple: {
    bg: 'bg-[var(--purple)]',
    bgHover: 'bg-[var(--purple-hover)]',
    bgActive: 'bg-[var(--purple-active)]',
    bgMuted: 'bg-[var(--purple-muted)]',
    text: 'text-[var(--purple)]',
    border: 'border-[var(--purple)]',
    ring: 'ring-[var(--purple)]',
    shadow: 'shadow-[0_0_20px_var(--purple-muted)]',
  },
} as const;

// Gradient utilities (for cases where gradients are needed)
// Returns style objects for use with inline styles
export const GRADIENTS = {
  purpleToOrange: {
    background: 'linear-gradient(to right, var(--purple), var(--orange))',
  },
  purpleToOrangeSubtle: {
    background: 'linear-gradient(to right, var(--purple-muted), var(--orange-muted))',
  },
  purpleFade: {
    background: 'linear-gradient(to bottom, var(--purple-muted), transparent)',
  },
  orangeFade: {
    background: 'linear-gradient(to bottom, var(--orange-muted), transparent)',
  },
} as const;

// Common button class combinations
export const BUTTON_CLASSES = {
  // CTA button - orange (highlight/attention)
  cta: `bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)]
        text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--orange-muted)]
        border border-[var(--orange-hover)]/20`,

  // Primary button - purple (interactive)
  primary: `bg-[var(--purple)] hover:bg-[var(--purple-hover)] active:bg-[var(--purple-active)]
            text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--purple-muted)]
            border border-[var(--purple-hover)]/20`,

  // Ghost button with orange hover
  ghostOrange: `text-[var(--text-secondary)] hover:text-[var(--orange)]
                hover:bg-[var(--orange-muted)] transition-colors`,

  // Ghost button with purple hover
  ghostPurple: `text-[var(--text-secondary)] hover:text-[var(--purple)]
                hover:bg-[var(--purple-muted)] transition-colors`,
} as const;
