"use client";

import { useEffect, useState } from "react";
import type { TrCategoryListEntry } from "@/lib/tr/categories/types";
import { fetchOwnerCategories } from "@/lib/tr/ownerClient";

/**
 * The boutique's own categories for a picker or filter. Loads only when `enabled`
 * (the boutique manages its own categories); `loaded` says the list is really in
 * (an empty list before that would look like "no categories yet").
 */
export function useOwnerCategories(boutiqueId: string, enabled: boolean) {
  const [state, setState] = useState<{
    boutiqueId: string;
    categories: TrCategoryListEntry[];
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchOwnerCategories(boutiqueId)
      .then((result) => {
        if (!cancelled) setState({ boutiqueId, categories: result.categories });
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, categories: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, enabled]);

  const loaded = enabled && state?.boutiqueId === boutiqueId;
  return { categories: loaded ? state!.categories : [], loaded };
}
