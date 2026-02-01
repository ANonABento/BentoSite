// KeyboardShortcutsHelp - Modal overlay showing available keyboard shortcuts
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useEffect, useCallback } from 'react';

import type { KeyboardShortcutsHelpProps } from '../../Dimension.types';

interface ExtendedKeyboardShortcutsHelpProps extends KeyboardShortcutsHelpProps {
  onClose?: () => void;
}

export function KeyboardShortcutsHelp({ isVisible, onClose }: ExtendedKeyboardShortcutsHelpProps) {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key to close
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  if (!isVisible) return null;

  const shortcuts = [
    { key: 'R', description: 'Reset View' },
    { key: 'Space', description: 'Auto Rotate' },
    { key: 'W', description: 'Wireframe' },
    { key: 'Z', description: 'Zoom Fit' },
    { key: 'S', description: 'Screenshot' },
    { key: 'F', description: 'Fullscreen' },
    { key: 'M', description: 'Models' },
    { key: '?', description: 'Hide Help' }
  ];

  return (
    <div className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 glass-strong text-[var(--text-primary)] p-6 rounded-xl shadow-2xl z-40 ${isInitialRender ? '' : 'transition-all duration-200'}`} role="dialog" aria-modal="true" aria-labelledby="keyboard-shortcuts-title">
      <h4 id="keyboard-shortcuts-title" className="font-bold mb-4 text-center text-lg">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center space-x-2">
            <kbd className="bg-[var(--glass-bg)] px-2 py-1 rounded-sm font-mono text-xs border border-[var(--border)] min-w-[24px] text-center">{shortcut.key}</kbd>
            <span className="text-[var(--text-secondary)] text-xs">{shortcut.description}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-[var(--interactive)] text-xs">
          Press <kbd className="bg-[var(--glass-bg)] px-1 py-0.5 rounded-sm font-mono border border-[var(--border)]">?</kbd> to hide
        </p>
      </div>
    </div>
  );
}