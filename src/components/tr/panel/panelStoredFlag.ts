"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "tr-panel-stored-flag-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * A boolean the panel remembers per browser (sidebar collapsed, compare on…).
 * `useSyncExternalStore` serves `fallback` on the server, so hydration is clean
 * and the stored value applies right after.
 */
export function usePanelStoredFlag(
  key: string,
  fallback: boolean,
): [boolean, (next: boolean) => void] {
  const read = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? fallback : stored === "1";
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const value = useSyncExternalStore(subscribe, read, () => fallback);

  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Storage blocked: the flag still flips for this page view only.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, set];
}
