"use client";

import { useEffect, useState } from "react";
import { fetchOwnerVariantTypes } from "@/lib/tr/ownerClient";
import {
  BUILT_IN_SIZE_SOURCES,
  sizeSourcesFromTypes,
  type TrSizeSource,
} from "@/lib/tr/sizeSources";

/**
 * What the boutique's size tables offer: its Beden types (variant types marked as
 * size), or the built-in lists when it has none. A failed load falls back to the
 * built-in lists so a size table always works. `loaded` says the list is really in.
 */
export function useOwnerSizeSources(boutiqueId: string) {
  const [state, setState] = useState<{
    boutiqueId: string;
    sources: TrSizeSource[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerVariantTypes(boutiqueId)
      .then((result) => {
        if (!cancelled) {
          setState({ boutiqueId, sources: sizeSourcesFromTypes(result.types) });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, sources: [...BUILT_IN_SIZE_SOURCES] });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const loaded = state?.boutiqueId === boutiqueId;
  return {
    sources: loaded ? state!.sources : [...BUILT_IN_SIZE_SOURCES],
    loaded,
  };
}
