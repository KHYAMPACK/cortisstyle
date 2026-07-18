"use server";

import {
  safeListMarketplaceBoutiques,
  safeListPublicCatalogProducts,
} from "@/lib/tr/publicData";
import type {
  TrBoutiquePublic,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

export interface TrMarketplaceCatalogPayload {
  products: TrProductWithBoutique[];
  boutiques: TrBoutiquePublic[];
}

export async function refreshTrMarketplaceCatalog(): Promise<TrMarketplaceCatalogPayload> {
  const [products, boutiques] = await Promise.all([
    safeListPublicCatalogProducts(),
    safeListMarketplaceBoutiques(),
  ]);
  return { products, boutiques };
}
