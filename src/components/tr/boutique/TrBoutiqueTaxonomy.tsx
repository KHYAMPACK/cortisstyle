"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  customTaxonomy,
  type TrStorefrontTaxonomy,
  type TrTaxonomyNode,
} from "@/lib/tr/categories/taxonomy";
import { legacyFashionTaxonomy } from "@/lib/tr/fashion/legacyTaxonomy";

/**
 * The boutique's category system for storefront components: its own categories when it
 * is in `custom` mode (the layout passes them as nodes), else the built-in garment tree.
 * Without a provider (or with `null` nodes) it is the built-in tree, exactly as before.
 */
const TaxonomyNodesContext = createContext<readonly TrTaxonomyNode[] | null>(null);

export function TrBoutiqueTaxonomyProvider({
  nodes,
  children,
}: {
  nodes: readonly TrTaxonomyNode[] | null;
  children: ReactNode;
}) {
  return (
    <TaxonomyNodesContext.Provider value={nodes}>{children}</TaxonomyNodesContext.Provider>
  );
}

export function useStorefrontTaxonomy(): TrStorefrontTaxonomy {
  const nodes = useContext(TaxonomyNodesContext);
  return useMemo(() => (nodes ? customTaxonomy(nodes) : legacyFashionTaxonomy), [nodes]);
}
