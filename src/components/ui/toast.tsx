'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = React.useMemo(
    () => ({
      success: (message: string, title?: string) => addToast('success', message, title),
      error: (message: string, title?: string) => addToast('error', message, title),
      info: (message: string, title?: string) => addToast('info', message, title),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur transition-all duration-200 animate-in fade-in slide-in-from-bottom-2',
              t.type === 'success' && 'bg-emerald-50/95 border-emerald-200 text-emerald-950',
              t.type === 'error' && 'bg-rose-50/95 border-rose-200 text-rose-950',
              t.type === 'info' && 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-emerald-600" />}
            </div>
            <div className="flex-1 space-y-0.5">
              {t.title && <h5 className="text-xs font-semibold uppercase tracking-wider">{t.title}</h5>}
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside of ToastProvider
    return {
      toast: {
        success: (msg: string) => console.log('Toast success:', msg),
        error: (msg: string) => console.error('Toast error:', msg),
        info: (msg: string) => console.info('Toast info:', msg),
      },
    };
  }
  return { toast: context.toast };
}
