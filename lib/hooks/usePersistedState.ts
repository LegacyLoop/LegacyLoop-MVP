"use client";

import { useState, useCallback } from "react";

/**
 * useState with localStorage persistence.
 * SSR-safe. Graceful fallback if storage fails (Safari private mode).
 * If key is empty, behaves as plain useState.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValueRaw] = useState<T>(() => {
    if (!key || typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch {
      // Safari private mode or corrupt data — use default
    }
    return defaultValue;
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setValueRaw((prev) => {
        const next = typeof action === "function"
          ? (action as (prev: T) => T)(prev)
          : action;
        if (key) {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // Quota exceeded or private mode — silent fail
          }
        }
        return next;
      });
    },
    [key],
  );

  return [value, setValue];
}
