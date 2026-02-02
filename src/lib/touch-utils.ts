/**
 * Touch utilities for mobile interaction optimization
 * 
 * Provides utilities for:
 * - Touch feedback animations
 * - Touch device detection
 * - Touch-optimized styles
 */

import { useEffect, useState } from 'react';

/**
 * Detect if device supports hover (mouse) or is touch-only
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setSupportsHover(window.matchMedia('(hover: hover)').matches);
    };
    
    checkTouch();
    
    // Re-check on resize (for device orientation changes)
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return { isTouch, supportsHover };
}

/**
 * Add touch-specific classes to document body
 * 
 * Adds classes for styling touch vs hover devices differently
 */
export function useTouchClasses() {
  const { isTouch, supportsHover } = useTouchDevice();

  useEffect(() => {
    if (isTouch) {
      document.body.classList.add('touch-device');
      document.body.classList.remove('hover-device');
    } else if (supportsHover) {
      document.body.classList.add('hover-device');
      document.body.classList.remove('touch-device');
    }
  }, [isTouch, supportsHover]);
}

/**
 * Touch feedback animation presets for Framer Motion
 */
export const touchFeedback = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
};

export const touchFeedbackStrong = {
  whileTap: { scale: 0.95, opacity: 0.8 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
};

/**
 * Touch-optimized styles as a CSS string
 * 
 * These are utility classes that will be used for touch interactions
 * Add these to your globals.css or use the injectTouchStyles helper
 */
export const touchStyles = `
  /* Base touch optimization styles */
  .touch-device * {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* Ensure tap targets are at least 44x44px on mobile */
  @media (max-width: 768px) {
    button, a, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Touch feedback - active state */
  .touch-active {
    transition: transform 0.1s ease-out, opacity 0.15s ease-out;
  }
  
  .touch-active:active {
    transform: scale(0.97);
    opacity: 0.9;
  }

  /* Prevent text selection on interactive elements during touch */
  .touch-device .no-select-touch {
    -webkit-user-select: none;
    user-select: none;
  }

  /* Enhanced focus states for touch */
  .touch-device button:focus-visible,
  .touch-device a:focus-visible {
    outline: 2px solid var(--interactive);
    outline-offset: 2px;
  }

  /* Smooth scrolling for touch */
  @media (hover: none) {
    html {
      scroll-behavior: smooth;
    }
  }
`;

/**
 * Hook to inject touch styles into the document
 * Call this in your layout component
 */
export function useInjectTouchStyles() {
  useEffect(() => {
    const styleId = 'touch-optimization-styles';
    
    // Only inject if not already present
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = touchStyles;
      document.head.appendChild(style);
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) {
        existing.remove();
      }
    };
  }, []);
}
