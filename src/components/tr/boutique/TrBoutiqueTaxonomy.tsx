"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  customTaxonomy,
  type TrStorefrontTaxonomy,
  type TrTaxonomyNode,
} from "@/lib/tr/categories/taxonomy";

/**
 * The boutique's categories for storefront components (the layout loads them as nodes).
 * Without a provider, or for a boutique with no categories, it is an empty tree.
 */
const TaxonomyNodesContext = createContext<readonly TrTaxonomyNode[]>([]);

export function TrBoutiqueTaxonomyProvider({
  nodes,
  children,
}: {
  nodes: readonly TrTaxonomyNode[];
  children: ReactNode;
}) {
  return (
    <TaxonomyNodesContext.Provider value={nodes}>{children}</TaxonomyNodesContext.Provider>
  );
}

export function useStorefrontTaxonomy(): TrStorefrontTaxonomy {
  const nodes = useContext(TaxonomyNodesContext);
  return useMemo(() => customTaxonomy(nodes), [nodes]);
}
