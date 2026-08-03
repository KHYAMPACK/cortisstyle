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

export async function safeListPublicBoutiques(): Promise<TrBoutiquePublic[]> {
  try {
    return await listPublicBoutiques();
  } catch (error) {
    console.error("Failed to load TR boutiques:", error);
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
    return await getPublicBoutiqueBySlug(slug);
  } catch (error) {
    console.error(`Failed to load TR boutique (${slug}):`, error);
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
    console.error(`Failed to load TR boutique storefront (${slug}):`, error);
    return null;
  }
}

export async function safeGetPublicProduct(
  productId: string,
): Promise<TrProductWithBoutique | null> {
  if (productId.startsWith("demo-product-")) {
    const { listDemoProducts } = await import("@/lib/tr/looks/demoCatalog");
    return listDemoProducts().find((p) => p.id === productId) ?? null;
  }
  try {
    return await getPublicProductById(productId);
  } catch (error) {
    console.error(`Failed to load TR product (${productId}):`, error);
    return null;
  }
}

export async function safeGetPublicProductByBoutiqueSlugAndId(
  boutiqueSlug: string,
  productId: string,
): Promise<TrProductWithBoutique | null> {
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
    console.error("Failed to load TR featured products:", error);
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
    console.error("Failed to load TR catalog products:", error);
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
