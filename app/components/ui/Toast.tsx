'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400', bar: 'bg-emerald-500' },
  error:   { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    icon: 'text-rose-400',    bar: 'bg-rose-500'    },
  info:    { bg: 'bg-indigo-500/10',   border: 'border-indigo-500/30',  icon: 'text-indigo-400',  bar: 'bg-indigo-500'  },
  warning: { bg: 'bg-amber-500/10',    border: 'border-amber-500/30',   icon: 'text-amber-400',   bar: 'bg-amber-500'   },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = iconMap[t.type];
            const colors = colorMap[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border ${colors.bg} ${colors.border} bg-slate-900/90 backdrop-blur-xl shadow-2xl relative overflow-hidden`}
              >
                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: (t.duration ?? 3500) / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${colors.bar} origin-left`}
                />
                <Icon className={`w-5 h-5 ${colors.icon} shrink-0 mt-0.5`} />
                <p className="text-sm text-slate-200 font-medium flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
