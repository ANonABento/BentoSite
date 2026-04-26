import { describe, it, expect } from 'vitest';
import {
  easings,
  smoothReveal,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
  staggerItem,
  staggerFast,
  scaleIn,
  popIn,
  tabContent,
  cardHover,
  glowPulse,
  pageTransition,
  reducedPageTransition,
  skeletonPulse,
  buttonTap,
  buttonHover,
  float,
  defaultViewport,
  earlyViewport,
  springTransition,
  snappySpring,
  gentleSpring,
  sectionStagger,
  sectionItem,
  scrollReveal,
  reducedScrollReveal,
  bentoCardEntrance,
  bentoSlotReveal,
  unifiedGridCardEntranceDelay,
} from '../animations';

describe('animations utility', () => {
  describe('easings', () => {
    it('should export cubic bezier arrays with 4 values', () => {
      expect(easings.easeOutQuart).toHaveLength(4);
      expect(easings.easeInOutQuart).toHaveLength(4);
      expect(easings.easeOutBack).toHaveLength(4);
      expect(easings.easeOutExpo).toHaveLength(4);
      expect(easings.apple).toHaveLength(4);
    });

    it('should have values between -1 and 2 (valid bezier range)', () => {
      Object.values(easings).forEach((easing) => {
        easing.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(-1);
          expect(value).toBeLessThanOrEqual(2);
        });
      });
    });
  });

  describe('smoothReveal variant', () => {
    it('should have hidden and visible states', () => {
      expect(smoothReveal.hidden).toBeDefined();
      expect(smoothReveal.visible).toBeDefined();
    });

    it('should start with opacity 0 and blur', () => {
      expect(smoothReveal.hidden).toMatchObject({
        opacity: 0,
        y: 30,
        filter: 'blur(10px)',
      });
    });

    it('should animate to full visibility', () => {
      expect(smoothReveal.visible).toMatchObject({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      });
    });
  });

  describe('fadeInUp variant', () => {
    it('should have hidden and visible states', () => {
      expect(fadeInUp.hidden).toBeDefined();
      expect(fadeInUp.visible).toBeDefined();
    });

    it('should start below and transparent', () => {
      expect(fadeInUp.hidden).toMatchObject({
        opacity: 0,
        y: 20,
      });
    });
  });

  describe('directional fade variants', () => {
    it('fadeInLeft should start from the left', () => {
      expect(fadeInLeft.hidden).toMatchObject({ x: -30 });
    });

    it('fadeInRight should start from the right', () => {
      expect(fadeInRight.hidden).toMatchObject({ x: 30 });
    });
  });

  describe('stagger variants', () => {
    it('staggerContainer should have staggerChildren', () => {
      const visible = staggerContainer.visible as { transition: { staggerChildren: number } };
      expect(visible.transition.staggerChildren).toBe(0.08);
    });

    it('staggerFast should have faster stagger', () => {
      const visible = staggerFast.visible as { transition: { staggerChildren: number } };
      expect(visible.transition.staggerChildren).toBe(0.04);
    });

    it('staggerItem should animate opacity and y', () => {
      expect(staggerItem.hidden).toMatchObject({ opacity: 0, y: 15 });
      expect(staggerItem.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe('scale variants', () => {
    it('scaleIn should start smaller', () => {
      expect(scaleIn.hidden).toMatchObject({ opacity: 0, scale: 0.85 });
    });

    it('popIn should use spring animation', () => {
      const visible = popIn.visible as { transition: { type: string } };
      expect(visible.transition.type).toBe('spring');
    });
  });

  describe('tabContent variant', () => {
    it('should have initial, animate, and exit states', () => {
      expect(tabContent.initial).toBeDefined();
      expect(tabContent.animate).toBeDefined();
      expect(tabContent.exit).toBeDefined();
    });
  });

  describe('pageTransition variant', () => {
    it('should have initial, animate, and exit states', () => {
      expect(pageTransition.initial).toBeDefined();
      expect(pageTransition.animate).toBeDefined();
      expect(pageTransition.exit).toBeDefined();
    });

    it('should enter from below and exit upward with blur', () => {
      expect(pageTransition.initial).toMatchObject({
        opacity: 0,
        y: 12,
        filter: 'blur(6px)',
      });
      expect(pageTransition.exit).toMatchObject({
        opacity: 0,
        y: -8,
        filter: 'blur(4px)',
      });
    });

    it('should use smooth but bounded timing for route transitions', () => {
      expect(pageTransition.animate.transition.duration).toBe(0.3);
      expect(pageTransition.exit.transition.duration).toBe(0.2);
    });

    it('should honor reduced motion with instant opacity-only states', () => {
      expect(reducedPageTransition.initial).toMatchObject({ opacity: 0 });
      expect(reducedPageTransition.animate).toMatchObject({ opacity: 1 });
      expect(reducedPageTransition.exit).toMatchObject({ opacity: 0 });
      expect(reducedPageTransition.animate.transition.duration).toBe(0);
      expect(reducedPageTransition.exit.transition.duration).toBe(0);
    });
  });

  describe('cardHover variant', () => {
    it('should have rest and hover states', () => {
      expect(cardHover.rest).toBeDefined();
      expect(cardHover.hover).toBeDefined();
    });

    it('should scale up on hover', () => {
      expect(cardHover.hover.scale).toBeGreaterThan(1);
    });
  });

  describe('pulse variants', () => {
    it('glowPulse should have infinite repeat', () => {
      const animate = glowPulse.animate as { transition: { repeat: number } };
      expect(animate.transition.repeat).toBe(Infinity);
    });

    it('skeletonPulse should have infinite repeat', () => {
      const animate = skeletonPulse.animate as { transition: { repeat: number } };
      expect(animate.transition.repeat).toBe(Infinity);
    });
  });

  describe('button animations', () => {
    it('buttonTap should scale down', () => {
      expect(buttonTap.scale).toBeLessThan(1);
    });

    it('buttonHover should scale up slightly', () => {
      expect(buttonHover.scale).toBeGreaterThan(1);
    });
  });

  describe('float variant', () => {
    it('should animate y position', () => {
      const animate = float.animate as { y: number[] };
      expect(animate.y).toBeInstanceOf(Array);
    });
  });

  describe('viewport settings', () => {
    it('defaultViewport should trigger once', () => {
      expect(defaultViewport.once).toBe(true);
    });

    it('earlyViewport should trigger once with smaller margin', () => {
      expect(earlyViewport.once).toBe(true);
      expect(earlyViewport.margin).toBe('-20px');
    });
  });

  describe('spring transitions', () => {
    it('springTransition should have spring type', () => {
      expect(springTransition.type).toBe('spring');
    });

    it('snappySpring should have higher stiffness', () => {
      expect(snappySpring.stiffness).toBeGreaterThan(springTransition.stiffness as number);
    });

    it('gentleSpring should have lower stiffness', () => {
      expect(gentleSpring.stiffness).toBeLessThan(springTransition.stiffness as number);
    });
  });

  describe('section variants', () => {
    it('sectionStagger should have staggerChildren', () => {
      const visible = sectionStagger.visible as { transition: { staggerChildren: number } };
      expect(visible.transition.staggerChildren).toBe(0.15);
    });

    it('sectionItem should have blur effect', () => {
      expect(sectionItem.hidden).toMatchObject({ filter: 'blur(8px)' });
      expect(sectionItem.visible).toMatchObject({ filter: 'blur(0px)' });
    });
  });

  describe('scroll reveal variants', () => {
    it('scrollReveal animates from a blurred offset with caller-provided delay', () => {
      expect(scrollReveal.hidden).toMatchObject({
        opacity: 0,
        y: 28,
        filter: 'blur(8px)',
      });

      const visible = (scrollReveal.visible as (delay?: number) => {
        opacity: number;
        y: number;
        filter: string;
        transition: { delay: number };
      })(0.08);

      expect(visible).toMatchObject({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      });
      expect(visible.transition.delay).toBe(0.08);
    });

    it('reducedScrollReveal keeps the reveal opacity-only', () => {
      expect(reducedScrollReveal.hidden).toMatchObject({ opacity: 0 });

      const visible = (reducedScrollReveal.visible as (delay?: number) => {
        opacity: number;
        y?: number;
        filter?: string;
      })();

      expect(visible.opacity).toBe(1);
      expect(visible.y).toBeUndefined();
      expect(visible.filter).toBeUndefined();
    });
  });

  describe('bento entrance variants', () => {
    it('stagger bento card entrances by visible index', () => {
      const visible = (bentoCardEntrance.visible as (index?: number) => {
        opacity: number;
        scale: number;
        transition: { delay: number };
      })(3);

      expect(bentoCardEntrance.hidden).toMatchObject({ opacity: 0, scale: 0.92 });
      expect(visible.opacity).toBe(1);
      expect(visible.scale).toBe(1);
      expect(visible.transition.delay).toBeCloseTo(0.135);
    });

    it('stagger bento slot reveals with shorter timing than cards', () => {
      const visible = (bentoSlotReveal.visible as (index?: number) => {
        opacity: number;
        scale: number;
        transition: { delay: number; duration: number };
      })(4);

      expect(bentoSlotReveal.hidden).toMatchObject({ opacity: 0, scale: 0.96 });
      expect(visible.opacity).toBe(1);
      expect(visible.scale).toBe(1);
      expect(visible.transition.delay).toBeCloseTo(0.14);
      expect(visible.transition.duration).toBeLessThan(0.42);
    });
  });

  describe('unified grid card entrance delay', () => {
    it('stagger cards by visible index and caps delayed entrances', () => {
      expect(unifiedGridCardEntranceDelay()).toBe(0);
      expect(unifiedGridCardEntranceDelay(3)).toBeCloseTo(0.075);
      expect(unifiedGridCardEntranceDelay(12)).toBeCloseTo(0.2);
    });
  });
});
