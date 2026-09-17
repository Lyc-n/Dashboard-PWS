import { useEffect, useRef, useState } from "react";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (!isBrowser()) return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // ignore corrupt storage
    }
    return initial;
  });

  const timer = useRef<number | null>(null);
  const pending = useRef<T | null>(null);

  useEffect(() => {
    if (!isBrowser()) return;
    pending.current = value;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        if (pending.current !== null) window.localStorage.setItem(key, JSON.stringify(pending.current));
      } catch {
        // storage full — keep in memory, caller handles via repository
      }
      timer.current = null;
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, value]);

  return [value, setValue] as const;
}