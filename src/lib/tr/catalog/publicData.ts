import {
  getPublicBoutiqueBySlug,
  getPublicBoutiqueStorefrontBySlug,
  getPublicProductById,
  listPublicAvailableProducts,
  listPublicBoutiques,
} from "@/lib/tr";
import { mapProductsWithLookbookImages } from "@/lib/tr/lookbookImages";
import type {
  TrBoutiquePublic,
  TrBoutiqueStorefront,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

/** Supabase / PostgREST errors often print as `{}` — prefer message + code. */
function formatTrDataError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string" ? record.message : null;
    const code = typeof record.code === "string" ? record.code : null;
    if (message && code) return `${code}: ${message}`;
    if (message) return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function safeListPublicBoutiques(): Promise<TrBoutiquePublic[]> {
  try {
    return await listPublicBoutiques();
  } catch (error) {
    console.error("Failed to load TR boutiques:", formatTrDataError(error));
    return [];
  }
}

export async function safeGetPublicBoutique(
  slug: string,
): Promise<TrBoutiquePublic | null> {
  if (slug.startsWith("demo-")) {
    const { getDemoBoutiqueBySlug } = await import("@/lib/tr/looks/demoCatalog");
    return getDemoBoutiqueBySlug(slug);
  }
  try {
    const boutique = await getPublicBoutiqueBySlug(slug);
    if (!boutique) {
      console.warn(
        `TR boutique not in public view (${slug}): missing row or status != verified`,
      );
    }
    return boutique;
  } catch (error) {
    console.error(
      `Failed to load TR boutique (${slug}):`,
      formatTrDataError(error),
    );
    return null;
  }
}

export async function safeGetBoutiqueStorefront(
  slug: string,
): Promise<TrBoutiqueStorefront | null> {
  if (slug.startsWith("demo-")) {
    const { getDemoStorefrontBySlug } = await import(
      "@/lib/tr/looks/demoCatalog"
    );
    return getDemoStorefrontBySlug(slug);
  }
  try {
    return await getPublicBoutiqueStorefrontBySlug(slug);
  } catch (error) {
    console.error(
      `Failed to load TR boutique storefront (${slug}):`,
      formatTrDataError(error),
    );
    // Last resort: seller row only (empty catalog) so /tr/{slug} does not soft-404.
    try {
      const boutique = await getPublicBoutiqueBySlug(slug);
      if (!boutique) return null;
      return { ...boutique, products: [] };
    } catch (fallbackError) {
      console.error(
        `Boutique-only fallback also failed (${slug}):`,
        formatTrDataError(fallbackError),
      );
      return null;
    }
  }
}

export async function safeGetPublicProduct(
  productId: string,
): Promise<TrProductWithBoutique | null> {
  if (productId.startsWith("demo-product-")) {
    const { listDemoProducts } = await import("@/lib/tr/looks/demoCatalog");
    return listDemoProducts().find((p) => p.id === productId) ?? null;
  }
  if (productId.startsWith("demo-wl-")) {
    const { isEditorialDemoProductId } = await import(
      "@/lib/tr/looks/editorialDemoProducts"
    );
    if (!isEditorialDemoProductId(productId)) return null;
    // slug embedded: demo-wl-{slug}-{key}
    const rest = productId.slice("demo-wl-".length);
    const slug = rest.includes("-")
      ? rest.slice(0, rest.lastIndexOf("-"))
      : null;
    if (!slug) return null;
    const boutique = await safeGetPublicBoutique(slug);
    if (!boutique) return null;
    const { getEditorialDemoProduct } = await import(
      "@/lib/tr/looks/editorialDemoProducts"
    );
    return getEditorialDemoProduct(boutique, productId);
  }
  try {
    return await getPublicProductById(productId);
  } catch (error) {
    console.error(
      `Failed to load TR product (${productId}):`,
      formatTrDataError(error),
    );
    return null;
  }
}

export async function safeGetPublicProductByBoutiqueSlugAndId(
  boutiqueSlug: string,
  productId: string,
): Promise<TrProductWithBoutique | null> {
  if (productId.startsWith("demo-wl-")) {
    const boutique = await safeGetPublicBoutique(boutiqueSlug);
    if (!boutique) return null;
    const { getEditorialDemoProduct } = await import(
      "@/lib/tr/looks/editorialDemoProducts"
    );
    return getEditorialDemoProduct(boutique, productId);
  }
  if (
    boutiqueSlug.startsWith("demo-") ||
    productId.startsWith("demo-product-")
  ) {
    const { getDemoProductByBoutiqueSlugAndId } = await import(
      "@/lib/tr/looks/demoCatalog"
    );
    return getDemoProductByBoutiqueSlugAndId(boutiqueSlug, productId);
  }
  const product = await safeGetPublicProduct(productId);
  if (!product) return null;
  if (product.boutique.slug !== boutiqueSlug) return null;
  return product;
}

const FEATURED_CATEGORY_RANK: Record<string, number> = {
  "ust-giyim": 0,
  "alt-giyim": 1,
};

function featuredCategoryRank(category: string | null | undefined): number {
  const id = category?.trim();
  if (!id) return 99;
  return FEATURED_CATEGORY_RANK[id] ?? 50;
}

/** Featured rail: prefer üst/alt (hero-adjacent), then other categories, stable within rank. */
export async function safeListFeaturedProducts(
  limit = 8,
): Promise<TrProductWithBoutique[]> {
  try {
    const products = mapProductsWithLookbookImages(
      await listPublicAvailableProducts(),
    );
    return [...products]
      .sort(
        (a, b) =>
          featuredCategoryRank(a.category) - featuredCategoryRank(b.category),
      )
      .slice(0, limit);
  } catch (error) {
    console.error(
      "Failed to load TR featured products:",
      formatTrDataError(error),
    );
    return [];
  }
}

/** Full marketplace catalog; falls back to demo icon products when live catalog is empty. */
export async function safeListPublicCatalogProducts(): Promise<
  TrProductWithBoutique[]
> {
  try {
    const products = mapProductsWithLookbookImages(
      await listPublicAvailableProducts(),
    ).filter((product) => product.status === "available");
    if (products.length > 0) return products;
  } catch (error) {
    console.error(
      "Failed to load TR catalog products:",
      formatTrDataError(error),
    );
  }

  const { listDemoProducts } = await import("@/lib/tr/looks/demoCatalog");
  return listDemoProducts();
}

/** Boutique directory; demo boutiques when live list is empty. */
export async function safeListMarketplaceBoutiques(): Promise<
  TrBoutiquePublic[]
> {
  const boutiques = await safeListPublicBoutiques();
  if (boutiques.length > 0) return boutiques;

  const { listDemoBoutiques } = await import("@/lib/tr/looks/demoCatalog");
  return listDemoBoutiques();
}
