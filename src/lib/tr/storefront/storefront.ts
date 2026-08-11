import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { listPublicProductsByBoutiqueId } from "@/lib/tr/products";
import type { TrBoutiqueStorefront } from "@/types/tr-marketplace";

/** Boutique page data: seller profile + individual product catalog. */
export async function getPublicBoutiqueStorefrontBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<TrBoutiqueStorefront | null> {
  const boutique = await getPublicBoutiqueBySlug(slug, client);
  if (!boutique) return null;

  const productsWithBoutique = await listPublicProductsByBoutiqueId(
    boutique.id,
    boutique,
    client,
  );

  return {
    ...boutique,
    products: productsWithBoutique.map(({ boutique: _boutique, ...product }) => product),
  };
}
