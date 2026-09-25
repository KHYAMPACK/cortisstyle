"use client";

import { useEffect, useState } from "react";
import type { TrProductFacets } from "@/lib/tr/catalog/productFacets";
import { fetchOwnerProductFacets } from "@/lib/tr/ownerClient";

const NO_FACETS: TrProductFacets = { brands: [], tags: [], suppliers: [] };

/**
 * Brands, tags and suppliers the boutique already uses, as suggestions for the
 * creatable fields. Suggestions are a convenience: while they load (or if they fail)
 * the fields still accept anything typed.
 */
export function useOwnerProductFacets(boutiqueId: string): TrProductFacets {
  const [state, setState] = useState<{
    boutiqueId: string;
    facets: TrProductFacets;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerProductFacets(boutiqueId)
      .then((facets) => {
        if (!cancelled) setState({ boutiqueId, facets });
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, facets: NO_FACETS });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  return state?.boutiqueId === boutiqueId ? state.facets : NO_FACETS;
}
