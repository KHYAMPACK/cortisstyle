"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrCategoryListEntry } from "@/lib/tr/categories/types";
import { fetchOwnerCategories } from "@/lib/tr/ownerClient";

/**
 * The boutique's categories for a picker or filter. `loaded` says the list is really in
 * (an empty list before that would look like "no categories yet").
 */
export function useOwnerCategories(boutiqueId: string) {
  const [state, setState] = useState<{
    boutiqueId: string;
    categories: TrCategoryListEntry[];
  } | null>(null);

  useEffect(() => {
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
  }, [boutiqueId]);

  const loaded = state?.boutiqueId === boutiqueId;
  return { categories: loaded ? state!.categories : [], loaded };
}

/**
 * A category's name for a product's `category` slug, from the boutique's own categories.
 * Falls back to the slug (a category deleted since); null without a slug or while the
 * list is still loading (so a slug never flashes in before the name).
 */
export function useOwnerCategoryName(boutiqueId: string) {
  const { categories, loaded } = useOwnerCategories(boutiqueId);
  const names = useMemo(
    () => new Map(categories.map((entry) => [entry.slug, entry.name])),
    [categories],
  );
  return useCallback(
    (slug: string | null | undefined): string | null =>
      slug && loaded ? (names.get(slug) ?? slug) : null,
    [names, loaded],
  );
}
