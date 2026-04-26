// Dimension.tsx - Custom Hooks

import { useRef, useState, useEffect, useMemo } from 'react';
import type { ModelInfo } from './Dimension.types';
import { isMobileDevice } from './Dimension.utils';

// Keyboard shortcuts callbacks interface
interface KeyboardCallbacks {
  onResetView?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleWireframe?: () => void;
  onScreenshot?: () => void;
  onToggleFullscreen?: () => void;
  onZoomFit?: () => void;
  onCameraPresets?: () => void;
  onModelManager?: () => void;
}

/**
 * Hook to detect if device is mobile
 * Uses centralized isMobileDevice utility function
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Hook to track screen size
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return screenSize;
};

/**
 * Hook for keyboard shortcuts
 * Uses individual callback refs to avoid re-registering listeners
 */
export const useKeyboardShortcuts = (callbacks: KeyboardCallbacks) => {
  // Store callbacks in refs to avoid effect re-runs
  const callbacksRef = useRef(callbacks);

  // Update ref in effect to avoid setting during render
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { key } = event;
      const cbs = callbacksRef.current;

      switch (key.toLowerCase()) {
        case 'r':
          cbs.onResetView?.();
          break;
        case ' ':
          event.preventDefault(); // Prevent page scroll
          cbs.onToggleAutoRotate?.();
          break;
        case 'w':
          cbs.onToggleWireframe?.();
          break;
        case 's':
          cbs.onScreenshot?.();
          break;
        case 'f':
          cbs.onToggleFullscreen?.();
          break;
        case 'c':
          cbs.onCameraPresets?.();
          break;
        case 'm':
          cbs.onModelManager?.();
          break;
        case 'z':
          cbs.onZoomFit?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Empty deps - callbacks accessed via ref
};

// Note: Touch gestures (pinch zoom) are handled natively by OrbitControls
// Note: Keyboard help ('?') and Performance HUD ('P') were removed as unused

/**
 * Hook for model search and filtering
 */
export const useModelSearch = (models: ModelInfo[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Memoize categories to avoid recalculating on every render
  const categories = useMemo(() => {
    const uniqueCategories = new Set(models.map((model) => model.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [models]);

  // Memoize filtered models
  const filteredModels = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return models.filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchLower) ||
                           model.description.toLowerCase().includes(searchLower);
      const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchTerm, selectedCategory]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredModels,
  };
};
