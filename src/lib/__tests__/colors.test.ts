import { describe, it, expect } from 'vitest';
import { CSS_VARS, COLORS, GRADIENTS, BUTTON_CLASSES } from '../colors';

describe('colors utility', () => {
  describe('CSS_VARS', () => {
    it('should export orange CSS variables', () => {
      expect(CSS_VARS.orange).toBe('var(--orange)');
      expect(CSS_VARS.orangeHover).toBe('var(--orange-hover)');
      expect(CSS_VARS.orangeActive).toBe('var(--orange-active)');
      expect(CSS_VARS.orangeMuted).toBe('var(--orange-muted)');
    });

    it('should export purple CSS variables', () => {
      expect(CSS_VARS.purple).toBe('var(--purple)');
      expect(CSS_VARS.purpleHover).toBe('var(--purple-hover)');
    });

    it('should export semantic color aliases', () => {
      expect(CSS_VARS.highlight).toBe('var(--highlight)');
      expect(CSS_VARS.interactive).toBe('var(--interactive)');
    });

    it('should export background variables', () => {
      expect(CSS_VARS.background).toBe('var(--background)');
      expect(CSS_VARS.glassBg).toBe('var(--glass-bg)');
    });

    it('should export status colors', () => {
      expect(CSS_VARS.success).toBe('var(--status-success)');
      expect(CSS_VARS.error).toBe('var(--status-error)');
      expect(CSS_VARS.warning).toBe('var(--status-warning)');
      expect(CSS_VARS.info).toBe('var(--status-info)');
    });
  });

  describe('COLORS', () => {
    it('should have orange color classes', () => {
      expect(COLORS.orange.bg).toContain('bg-[var(--orange)]');
      expect(COLORS.orange.text).toContain('text-[var(--orange)]');
      expect(COLORS.orange.border).toContain('border-[var(--orange)]');
    });

    it('should have purple color classes', () => {
      expect(COLORS.purple.bg).toContain('bg-[var(--purple)]');
      expect(COLORS.purple.text).toContain('text-[var(--purple)]');
    });
  });

  describe('GRADIENTS', () => {
    it('should define gradient styles', () => {
      expect(GRADIENTS.purpleToOrange.background).toContain('linear-gradient');
      expect(GRADIENTS.purpleToOrange.background).toContain('var(--purple)');
      expect(GRADIENTS.purpleToOrange.background).toContain('var(--orange)');
    });
  });

  describe('BUTTON_CLASSES', () => {
    it('should define CTA button classes', () => {
      expect(BUTTON_CLASSES.cta).toContain('bg-[var(--orange)]');
      expect(BUTTON_CLASSES.cta).toContain('text-[var(--text-on-accent)]');
    });

    it('should define primary button classes', () => {
      expect(BUTTON_CLASSES.primary).toContain('bg-[var(--purple)]');
      expect(BUTTON_CLASSES.primary).toContain('text-[var(--text-on-accent)]');
    });

    it('should define ghost button classes', () => {
      expect(BUTTON_CLASSES.ghostOrange).toContain('hover:text-[var(--orange)]');
      expect(BUTTON_CLASSES.ghostPurple).toContain('hover:text-[var(--purple)]');
    });
  });
});
