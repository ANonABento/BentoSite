'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const colors: Record<ToastType, string> = {
  success: 'bg-[var(--status-success-muted)] border-[var(--status-success)] border-opacity-30 text-[var(--status-success)]',
  error: 'bg-[var(--status-error-muted)] border-[var(--status-error)] border-opacity-30 text-[var(--status-error)]',
  info: 'bg-[var(--status-info-muted)] border-[var(--status-info)] border-opacity-30 text-[var(--status-info)]',
  warning: 'bg-[var(--status-warning-muted)] border-[var(--status-warning)] border-opacity-30 text-[var(--status-warning)]',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-[var(--status-success)]',
  error: 'text-[var(--status-error)]',
  info: 'text-[var(--status-info)]',
  warning: 'text-[var(--status-warning)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = nextIdRef.current++;
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const value: ToastContextType = {
    toast: addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <LazyMotion features={domAnimation}>
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <m.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`
                  pointer-events-auto
                  flex items-center gap-3
                  px-4 py-3
                  backdrop-blur-xl
                  border rounded-xl
                  shadow-lg shadow-[0_0_20px_var(--shadow-color)]
                  min-w-[280px] max-w-[400px]
                  ${colors[toast.type]}
                `}
              >
                <span className={iconColors[toast.type]}>
                  {icons[toast.type]}
                </span>
                <span className="text-sm font-medium flex-1">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-[var(--text-primary)] opacity-60 hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </ToastContext.Provider>
  );
}
