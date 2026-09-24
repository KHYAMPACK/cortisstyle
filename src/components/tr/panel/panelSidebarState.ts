"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "tr-panel-sidebar-collapsed";
const CHANGE_EVENT = "tr-panel-sidebar-collapsed-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Desktop sidebar collapsed state, remembered per browser. `useSyncExternalStore`
 * with a `false` server snapshot keeps hydration clean and applies the stored
 * value right after hydration.
 */
export function usePanelSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Storage blocked: the toggle still works for this page view only.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [collapsed, setCollapsed];
}
