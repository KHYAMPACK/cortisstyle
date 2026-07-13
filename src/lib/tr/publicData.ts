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
  const product = await safeGetPublicProduct(productId);
  if (!product) return null;
  if (product.boutique.slug !== boutiqueSlug) return null;
  return product;
}

export async function safeListFeaturedProducts(
  limit = 8,
): Promise<TrProductWithBoutique[]> {
  try {
    const products = await listPublicAvailableProducts();
    return mapProductsWithLookbookImages(products).slice(0, limit);
  } catch (error) {
    console.error("Failed to load TR featured products:", error);
    return [];
  }
}
