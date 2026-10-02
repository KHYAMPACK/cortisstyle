"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOwnerProductKinds } from "@/lib/tr/ownerClient";
import type { TrProductKindListEntry } from "@/lib/tr/productKinds/types";

/**
 * The boutique's product kinds and each product's kind, for the Ürünler list. Empty
 * until loaded, and when the boutique has none (or the schema isn't applied yet).
 */
export function useOwnerProductKinds(boutiqueId: string) {
  const [state, setState] = useState<{
    boutiqueId: string;
    kinds: TrProductKindListEntry[];
    productKinds: Record<string, string | null>;
  } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerProductKinds(boutiqueId)
      .then((result) => {
        if (!cancelled) {
          setState({ boutiqueId, kinds: result.kinds, productKinds: result.productKinds });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, kinds: [], productKinds: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const ready = state?.boutiqueId === boutiqueId ? state : null;
  return {
    kinds: ready?.kinds ?? [],
    productKinds: ready?.productKinds ?? {},
    reload,
  };
}
