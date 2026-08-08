"use client";

import { useMemo } from "react";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrBoutiqueYouMayAlsoLike } from "@/components/tr/boutique/TrBoutiqueYouMayAlsoLike";
import { pickRelatedProducts } from "@/lib/tr/recommendations";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

/**
 * Replaces the old catalog-cutout block under the PDP gallery.
 */
export function TrBoutiquePdpRelated({
  product,
}: {
  product: TrProductWithBoutique;
  /** Kept for call-site compatibility; layout no longer needs it. */
  branded?: boolean;
}) {
  const boutiqueProducts = useTrBoutiqueProductsOptional();
  const catalog = boutiqueProducts?.products ?? [];

  const related = useMemo(
    () =>
      pickRelatedProducts({
        catalog,
        excludeIds: [product.id],
        category: product.category,
        limit: 8,
      }),
    [catalog, product.id, product.category],
  );

  if (related.length === 0 || !product.boutique) return null;

  return (
    <TrBoutiqueYouMayAlsoLike
      boutique={product.boutique}
      products={related}
      compact
    />
  );
}
