"use client";

import { useLayoutEffect, useRef } from "react";

export const ATELIER_FAB_BOTTOM_INSET_VAR = "--atelier-fab-bottom-inset";

/** Registers a fixed bottom bar height so the editorial help FAB can sit above it. */
export function useAtelierFabBottomInset<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;

    const sync = () => {
      root.style.setProperty(
        ATELIER_FAB_BOTTOM_INSET_VAR,
        `${Math.ceil(el.getBoundingClientRect().height)}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      root.style.removeProperty(ATELIER_FAB_BOTTOM_INSET_VAR);
    };
  }, []);

  return ref;
}
