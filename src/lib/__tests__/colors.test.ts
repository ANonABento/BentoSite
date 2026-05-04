import { describe, it, expect } from 'vitest';
import { CSS_VARS, COLORS, GRADIENTS, BUTTON_CLASSES } from '../colors';

describe('colors utility', () => {
  describe('CSS_VARS', () => {
    it('should export primary CSS variables', () => {
      expect(CSS_VARS.primary).toBe('var(--primary)');
      expect(CSS_VARS.primaryHover).toBe('var(--primary-hover)');
      expect(CSS_VARS.primaryActive).toBe('var(--primary-active)');
      expect(CSS_VARS.primaryMuted).toBe('var(--primary-muted)');
    });

    it('should export AI CSS variables', () => {
      expect(CSS_VARS.ai).toBe('var(--ai)');
      expect(CSS_VARS.aiHover).toBe('var(--ai-hover)');
      expect(CSS_VARS.purple).toBe('var(--ai)');
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
      expect(CSS_VARS.error).toBe('var(--destructive)');
      expect(CSS_VARS.warning).toBe('var(--primary)');
      expect(CSS_VARS.info).toBe('var(--status-info)');
    });
  });

  describe('COLORS', () => {
    it('should have primary color classes', () => {
      expect(COLORS.primary.bg).toContain('bg-[var(--primary)]');
      expect(COLORS.primary.text).toContain('text-[var(--primary)]');
      expect(COLORS.primary.border).toContain('border-[var(--primary)]');
    });

    it('should have AI color classes', () => {
      expect(COLORS.ai.bg).toContain('bg-[var(--ai)]');
      expect(COLORS.ai.text).toContain('text-[var(--ai)]');
      expect(COLORS.purple.bg).toContain('bg-[var(--ai)]');
    });
  });

  describe('GRADIENTS', () => {
    it('should define gradient styles', () => {
      expect(GRADIENTS.purpleToOrange.background).toContain('linear-gradient');
      expect(GRADIENTS.purpleToOrange.background).toContain('var(--primary)');
      expect(GRADIENTS.purpleToOrange.background).toContain('var(--primary-hover)');
    });
  });

  describe('BUTTON_CLASSES', () => {
    it('should define CTA button classes', () => {
      expect(BUTTON_CLASSES.cta).toContain('bg-[var(--primary)]');
      expect(BUTTON_CLASSES.cta).toContain('text-[var(--text-on-accent)]');
    });

    it('should define primary button classes', () => {
      expect(BUTTON_CLASSES.primary).toContain('bg-[var(--primary)]');
      expect(BUTTON_CLASSES.primary).toContain('text-[var(--text-on-accent)]');
    });

    it('should define ghost button classes', () => {
      expect(BUTTON_CLASSES.ghostOrange).toContain('hover:text-[var(--primary)]');
      expect(BUTTON_CLASSES.ghostPurple).toContain('hover:text-[var(--ai)]');
    });
  });
});
