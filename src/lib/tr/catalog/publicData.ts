import {
  getPublicBoutiqueBySlug,
  getPublicBoutiqueStorefrontBySlug,
  getPublicProductById,
  listPublicAvailableProducts,
  listPublicBoutiques,
} from "@/lib/tr";
import { colorSiblingIdsOf } from "@/lib/tr/catalog/colorSiblings";
import { listProductsByIdsAdmin } from "@/lib/tr/catalog/products";
import {
  resolveProductParam,
  type ProductRouteResult,
} from "@/lib/tr/catalog/productRoute";
import {
  findPublicProductIdBySlug,
  findRedirectedProductId,
  getProductSlugSeo,
} from "@/lib/tr/catalog/productSlug";
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
  const product = await safeGetPublicProduct(productId);
  if (!product) return null;
  if (product.boutique.slug !== boutiqueSlug) return null;
  return product;
}

/**
 * The product page's last URL segment is a product id or, when the owner set one, a
 * slug (an old slug redirects). Wraps the lookups in the same "log and treat as
 * missing" behavior as the other `safe*` readers.
 */
export async function safeResolvePublicProduct(
  boutiqueSlug: string,
  param: string,
): Promise<ProductRouteResult<TrProductWithBoutique>> {
  try {
    const boutique = await safeGetPublicBoutique(boutiqueSlug);
    if (!boutique) return { kind: "missing" };

    return await resolveProductParam<TrProductWithBoutique>(param, {
      getById: async (id) => {
        const product = await safeGetPublicProduct(id);
        return product && product.boutique.slug === boutiqueSlug
          ? product
          : null;
      },
      getIdBySlug: (slug) => findPublicProductIdBySlug(boutique.id, slug),
      getRedirectedProductId: (oldSlug) =>
        findRedirectedProductId(boutique.id, oldSlug),
      getCurrentSlug: async (id) => (await getProductSlugSeo(id)).slug,
    });
  } catch (error) {
    console.error(
      `Failed to resolve TR product (${boutiqueSlug}/${param}):`,
      formatTrDataError(error),
    );
    return { kind: "missing" };
  }
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

export async function safeGetPublicColorSiblings(
  product: TrProductWithBoutique,
): Promise<TrProductWithBoutique[]> {
  const ids = colorSiblingIdsOf(product);
  if (ids.length < 2) return [];
  try {
    const rows = await listProductsByIdsAdmin(ids);
    const byId = new Map(
      rows
        .filter(
          (entry) =>
            entry.boutiqueId === product.boutiqueId &&
            entry.status === "available",
        )
        .map((entry) => [entry.id, entry]),
    );
    return ids.flatMap((id) => {
      const row = byId.get(id);
      if (!row) return [];
      return [{ ...row, boutique: product.boutique }];
    });
  } catch (error) {
    console.error(
      `Failed to load color siblings (${product.id}):`,
      formatTrDataError(error),
    );
    return [];
  }
}
