import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-21 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-strong px-4 py-2.5 text-xs font-semibold text-white transition-opacity duration-200"
        style={{ opacity: message ? 1 : 0 }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}