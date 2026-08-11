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

  // Never 404 the storefront because products fail (missing column / RLS / PostgREST).
  // Boutique chrome + editorial demo products still need the seller row.
  let products: TrBoutiqueStorefront["products"] = [];
  try {
    const productsWithBoutique = await listPublicProductsByBoutiqueId(
      boutique.id,
      boutique,
      client,
    );
    products = productsWithBoutique.map(
      ({ boutique: _boutique, ...product }) => product,
    );
  } catch (error) {
    console.error(
      `Failed to load products for boutique storefront (${slug}):`,
      error,
    );
  }

  return {
    ...boutique,
    products,
  };
}
