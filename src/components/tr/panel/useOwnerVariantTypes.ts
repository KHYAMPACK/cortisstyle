"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOwnerVariantTypes } from "@/lib/tr/ownerClient";
import type { TrVariantTypeListEntry } from "@/lib/tr/variants/types";

/**
 * The boutique's variant types with their values, for a product's Varyant card.
 * `loaded` says the list is really in (an empty list before that would look like "no
 * types yet"); `reload` refetches after a type was created or changed.
 */
export function useOwnerVariantTypes(boutiqueId: string) {
  const [state, setState] = useState<{
    boutiqueId: string;
    types: TrVariantTypeListEntry[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerVariantTypes(boutiqueId)
      .then((result) => {
        if (!cancelled) setState({ boutiqueId, types: result.types });
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, types: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const reload = useCallback(async (): Promise<TrVariantTypeListEntry[]> => {
    const result = await fetchOwnerVariantTypes(boutiqueId);
    setState({ boutiqueId, types: result.types });
    return result.types;
  }, [boutiqueId]);

  const loaded = state?.boutiqueId === boutiqueId;
  return { types: loaded ? state!.types : [], loaded, reload };
}
