// KeyboardShortcutsHelp - Modal overlay showing available keyboard shortcuts
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useEffect } from 'react';

import type { KeyboardShortcutsHelpProps } from '../../Dimension.types';

export function KeyboardShortcutsHelp({ isVisible }: KeyboardShortcutsHelpProps) {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

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
    <div className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/95 backdrop-blur-sm text-white p-6 rounded-xl shadow-2xl border border-gray-700/50 z-40 ${isInitialRender ? '' : 'transition-all duration-200'}`} role="dialog" aria-modal="false" aria-labelledby="keyboard-shortcuts-title">
      <h4 id="keyboard-shortcuts-title" className="font-bold mb-4 text-center text-lg">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center space-x-2">
            <kbd className="bg-gray-700 px-2 py-1 rounded-lg font-mono text-xs border border-gray-600 min-w-[24px] text-center">{shortcut.key}</kbd>
            <span className="text-gray-300 text-xs">{shortcut.description}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button 
          onClick={() => {}} 
          className="text-blue-400 hover:text-blue-300 text-xs underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-2 py-1"
        >
          Press '?' to hide
        </button>
      </div>
    </div>
  );
}