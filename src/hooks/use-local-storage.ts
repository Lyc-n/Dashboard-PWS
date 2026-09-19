import { useEffect, useRef, useState } from "react";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const STORAGE_QUOTA_EVENT = "pws:storage-quota";

function isQuotaError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const o = e as { name?: string; code?: number };
  return o.name === "QuotaExceededError" || o.name === "NS_ERROR_FILE_NO_SPACE_LEFT" || o.code === 22;
}

function emitQuotaError(key: string): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(STORAGE_QUOTA_EVENT, { detail: { key } }));
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (!isBrowser()) return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // abaikan storage korup
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
      } catch (e) {
        // kuota penuh / storage tidak tersedia — beritahu via event agar UI toast
        if (isQuotaError(e)) emitQuotaError(key);
      }
      timer.current = null;
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, value]);

  // flush saat unmount agar data terakhir tidak hilang karena debounce
  useEffect(() => {
    return () => {
      if (!isBrowser()) return;
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      try {
        if (pending.current !== null) window.localStorage.setItem(key, JSON.stringify(pending.current));
      } catch (e) {
        if (isQuotaError(e)) emitQuotaError(key);
      }
    };
  }, [key]);

  return [value, setValue] as const;
}