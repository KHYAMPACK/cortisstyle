import { isLookbookPieceImage } from "@/data/tr/lookbookPieceImages";
import {
  deliverPublicAssetUrl,
  deliverPublicAssetUrls,
} from "@/lib/tr/assets/deliverPublicAssetUrl";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import {
  isTrMarketplaceAssetUrl,
  isTrStorefrontAssetUrl,
} from "@/lib/tr/trAssetUrls";
import type { TrProduct } from "@/types/tr-marketplace";

export type TrProductImageSurface = "boutique" | "marketplace";

type CatalogImageProduct = Pick<TrProduct, "images" | "marketplaceImages"> &
  Partial<Pick<TrProduct, "storefrontImages" | "lifestyleImages">>;

function nonEmpty(urls: string[] | undefined): string[] {
  return (urls ?? []).filter((url) => Boolean(url?.trim()));
}

/** Original boutique gallery (owner uploads). */
export function getBoutiqueProductImages(
  product: Pick<TrProduct, "images">,
): string[] {
  return nonEmpty(product.images);
}

/**
 * Per-index resolve for catalog surfaces.
 * When any marketplace cutout exists, never fall back to raw boutique uploads
 * (those are hanger / room shots and must stay owner-only).
 */
export function resolveProductImagesPerIndex(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const cutouts = nonEmpty(product.marketplaceImages);
  if (cutouts.length > 0) return cutouts;
  return getBoutiqueProductImages(product);
}

/**
 * Marketplace / catalog cutouts with per-index fallback to boutique originals.
 * Cadde and try-on must keep these transparent PNGs.
 */
export function getMarketplaceProductImages(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const resolved = resolveProductImagesPerIndex(product);
  if (resolved.length > 0) return resolved;
  return getBoutiqueProductImages(product);
}

function galleryFromSlots(params: {
  product: CatalogImageProduct;
  preferStorefront: boolean;
}): string[] {
  const boutique = params.product.images ?? [];
  const market = params.product.marketplaceImages ?? [];
  const storefront = params.product.storefrontImages ?? [];
  const lifestyle = nonEmpty(params.product.lifestyleImages);
  const hasAnyCutout = market.some((url) => Boolean(url?.trim()));
  const cutoutSlots = TR_OWNER_PRODUCT_LIMITS.cutoutPhotoSlots;
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (url: string | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };

  const slotCount = Math.max(boutique.length, market.length, storefront.length);
  for (let i = 0; i < slotCount; i += 1) {
    const baked = params.preferStorefront ? storefront[i]?.trim() : "";
    const cutout = market[i]?.trim();
    const original = boutique[i]?.trim();
    if (baked) {
      push(baked);
      continue;
    }
    if (cutout) {
      push(cutout);
      continue;
    }
    if (!original) continue;
    // No cutouts at all → show boutique gallery as-is.
    // With cutouts → never re-surface raw front/back hanger shots.
    if (!hasAnyCutout || i >= cutoutSlots) {
      push(original);
    }
  }

  for (const url of lifestyle) push(url);

  return out;
}

export function getProductCoverImageFor(
  surface: TrProductImageSurface,
  product: CatalogImageProduct,
): string | null {
  if (surface === "boutique") {
    const gallery = galleryFromSlots({
      product,
      preferStorefront: false,
    });
    if (gallery[0]) {
      return deliverPublicAssetUrl(gallery[0], "full");
    }
    const fallback = getBoutiqueProductImages(product)[0];
    return fallback ? deliverPublicAssetUrl(fallback, "full") : null;
  }

  const marketplace = getMarketplaceProductImages(product)[0];
  return marketplace ? deliverPublicAssetUrl(marketplace, "full") : null;
}

export function hasRealMarketplaceImagery(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): boolean {
  if (nonEmpty(product.marketplaceImages).length > 0) return true;
  return nonEmpty(product.images).some(
    (url) => isTrMarketplaceAssetUrl(url) || isLookbookPieceImage(url),
  );
}

/**
 * Boutique PDP / PLP / Merchant: PNG packshots, then unused extra originals,
 * then lifestyle. Do not prefer leftover storefront WebP copies.
 */
export function getStorefrontGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return deliverPublicAssetUrls(
    galleryFromSlots({ product, preferStorefront: false }),
    "full",
  );
}

/**
 * Cadde `/tr/parca` gallery: transparent packshot PNGs + lifestyle.
 */
export function getMarketplaceGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return deliverPublicAssetUrls(
    galleryFromSlots({ product, preferStorefront: false }),
    "full",
  );
}

/**
 * Panel list/stock thumbs: packshot PNG when present.
 */
export function getPanelProductCover(
  product: CatalogImageProduct,
): string | null {
  const boutiqueCover =
    galleryFromSlots({ product, preferStorefront: false })[0] ??
    getBoutiqueProductImages(product)[0] ??
    null;
  const raw =
    boutiqueCover ??
    getMarketplaceProductImages(product)[0] ??
    getBoutiqueProductImages(product)[0] ??
    null;
  return raw ? deliverPublicAssetUrl(raw, "plp") : null;
}

/**
 * First lifestyle / model shot. Boutique cards show this at rest
 * and reveal the packshot on hover.
 */
export function getProductHoverImage(
  product: Pick<TrProduct, "lifestyleImages">,
): string | null {
  const hover = nonEmpty(product.lifestyleImages)[0];
  return hover ? deliverPublicAssetUrl(hover, "plp") : null;
}

/**
 * Second catalog angle (usually back) for hover cycle when no model shot exists.
 */
export function getProductSecondaryImage(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string | null {
  const list = getMarketplaceProductImages(product);
  if (list.length < 2) return null;
  const secondary = list[1]?.trim();
  if (!secondary || secondary === list[0]) return null;
  return deliverPublicAssetUrl(secondary, "plp");
}

/**
 * True when the cover should sit contained with padding (packshot),
 * not full-bleed `object-cover`.
 */
export function isCatalogCutoutImage(src: string | null | undefined): boolean {
  if (!src) return false;
  return (
    isLookbookPieceImage(src) ||
    isTrMarketplaceAssetUrl(src) ||
    isTrStorefrontAssetUrl(src) ||
    src.startsWith("/images/tr/hero/")
  );
}
