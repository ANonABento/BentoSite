'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '3D Viewer',
    shortcuts: [
      { key: 'R', description: 'Reset camera view' },
      { key: 'Space', description: 'Toggle auto-rotation' },
      { key: 'W', description: 'Toggle wireframe mode' },
      { key: 'S', description: 'Take screenshot' },
      { key: 'F', description: 'Toggle fullscreen' },
      { key: 'Z', description: 'Zoom to fit model' },
      { key: 'C', description: 'Camera presets' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { key: '?', description: 'Show/hide this help' },
      { key: 'Esc', description: 'Close this help dialog' },
      { key: 'T', description: 'Toggle dark/light theme' },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <m.div
              ref={modalRef}
              className="glass max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2
                  id="keyboard-shortcuts-title"
                  className="text-lg font-semibold text-[var(--text-primary)]"
                >
                  Keyboard Shortcuts
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                  aria-label="Close shortcuts help"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  {shortcutGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        {group.title}
                      </h3>
                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                          >
                            <span className="text-sm text-[var(--text-secondary)]">
                              {shortcut.description}
                            </span>
                            <kbd className="px-2 py-1 text-xs font-mono bg-[var(--glass-bg)] text-[var(--text-primary)] border border-[var(--border)] rounded min-w-[24px] text-center">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--glass-bg)]">
                <p className="text-xs text-[var(--text-muted)] text-center">
                  Press <kbd className="px-1 py-0.5 bg-[var(--glass-bg-strong)] rounded text-[var(--text-secondary)] border border-[var(--border)]">?</kbd> or <kbd className="px-1 py-0.5 bg-[var(--glass-bg-strong)] rounded text-[var(--text-secondary)] border border-[var(--border)]">Esc</kbd> to close
                </p>
              </div>
            </m.div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleTheme } = useTheme();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ? to toggle help
      if (e.key === '?') {
        e.preventDefault();
        toggle();
      }

      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close, toggleTheme]);

  return { isOpen, open, close, toggle };
}
