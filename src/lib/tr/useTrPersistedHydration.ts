"use client";

import { useEffect, useState } from "react";

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (callback: () => void) => () => void;
};

function asPersistApi(value: unknown): PersistApi | null {
  if (!value || typeof value !== "object") return null;
  return value as PersistApi;
}

/**
 * True after client rehydration. Safe when zustand `.persist` is missing —
 * falls back to mount (no spinner, no crash).
 */
export function useTrPersistedHydration(persistApi?: unknown): boolean {
  const persist = asPersistApi(persistApi);

  const [hydrated, setHydrated] = useState(() => {
    try {
      return persist?.hasHydrated?.() ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const api = asPersistApi(persistApi);
    if (api?.hasHydrated && api?.onFinishHydration) {
      try {
        setHydrated(api.hasHydrated());
        return api.onFinishHydration(() => setHydrated(true));
      } catch {
        setHydrated(true);
        return;
      }
    }
    setHydrated(true);
  }, [persistApi]);

  return hydrated;
}
