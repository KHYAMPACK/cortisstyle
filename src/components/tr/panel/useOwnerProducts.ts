"use client";

import { useEffect, useState } from "react";
import { fetchOwnerProducts } from "@/lib/tr/ownerClient";
import type { TrProduct } from "@/types/tr-marketplace";

/**
 * The boutique's products for a picker (e.g. a campaign's Koşullar scope). `loaded`
 * says the list really came back — an empty list before that would look like "no
 * products yet".
 */
export function useOwnerProducts(boutiqueId: string, enabled: boolean) {
  const [state, setState] = useState<{ boutiqueId: string; products: TrProduct[] } | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchOwnerProducts(boutiqueId)
      .then((result) => {
        if (!cancelled) setState({ boutiqueId, products: result.products });
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, products: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, enabled]);

  const loaded = enabled && state?.boutiqueId === boutiqueId;
  return { products: loaded ? state!.products : [], loaded };
}
