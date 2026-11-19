import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      const duration = type === 'error' ? 7500 : 4800;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-md flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const styles = {
            success: 'border-emerald-200 bg-white text-slate-900 shadow-lg ring-1 ring-emerald-500/20',
            error: 'border-rose-300 bg-white text-slate-900 shadow-xl ring-1 ring-rose-500/25',
            warning: 'border-amber-300 bg-white text-slate-900 shadow-lg ring-1 ring-amber-500/20',
            info: 'border-sky-200 bg-white text-slate-900 shadow-lg ring-1 ring-sky-500/20',
          }[toast.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            warning: 'text-amber-600',
            info: 'text-sky-600',
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 transition-all ${styles}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.message && <p className="mt-1 text-xs leading-relaxed text-slate-600">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
