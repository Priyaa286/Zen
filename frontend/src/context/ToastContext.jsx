import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-[#168B66]',
    border: 'border-[#168B66]/25',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-[#C98A1C]',
    border: 'border-[#C98A1C]/30',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    border: 'border-red-200',
  },
  info: {
    icon: Info,
    iconColor: 'text-[#465BE6]',
    border: 'border-[#E6E5E0]',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, tone = 'info', duration = 3200, action } = {}) => {
      if (!title && !description) return null;
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone, action }]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const meta = TONE_STYLES[toast.tone] || TONE_STYLES.info;
            const Icon = meta.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-elevated',
                  meta.border
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta.iconColor)} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  {toast.title && (
                    <p className="text-[13px] font-semibold text-[#101828]">
                      {toast.title}
                    </p>
                  )}
                  {toast.description && (
                    <p className="text-xs leading-relaxed text-[#667085]">
                      {toast.description}
                    </p>
                  )}
                  {toast.action && <div className="pt-1">{toast.action}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-md p-1 text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#101828]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { showToast: () => null, dismissToast: () => {} };
  }
  return ctx;
}

