import { isLookbookPieceImage } from "@/data/tr/lookbookPieceImages";
import {
  deliverPublicAssetUrl,
  deliverPublicAssetUrls,
} from "@/lib/tr/assets/deliverPublicAssetUrl";
import { ELBISE_PACKSHOT_SLOT } from "@/lib/tr/catalog/garmentUploadTypes";
import { isTakimCatalogProduct, takimPackshotUrls } from "@/lib/tr/catalog/takimUpload";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import {
  isTrMarketplaceAssetUrl,
  isTrStorefrontAssetUrl,
} from "@/lib/tr/trAssetUrls";
import type { TrProduct } from "@/types/tr-marketplace";

export type TrProductImageSurface = "boutique" | "marketplace";

type CatalogImageProduct = Pick<TrProduct, "images" | "marketplaceImages"> &
  Partial<Pick<TrProduct, "storefrontImages" | "lifestyleImages" | "features">>;

function nonEmpty(urls: string[] | undefined): string[] {
  return (urls ?? []).filter((url) => Boolean(url?.trim()));
}

/** Keep later slots (elbise packshot at [3]) when `images` is shorter. */
export function alignMarketplaceSlots(
  images: string[],
  marketplaceImages: string[],
): string[] {
  const len = Math.max(images.length, marketplaceImages.length);
  const out: string[] = [];
  for (let i = 0; i < len; i += 1) {
    out.push(marketplaceImages[i] ?? "");
  }
  return out;
}

export function cleanedLifestyleImages(urls: string[] | undefined): string[] {
  return nonEmpty(urls).slice(0, TR_OWNER_PRODUCT_LIMITS.maxImages);
}

export function replaceLifestyleShot(
  urls: string[] | undefined,
  index: number,
  url: string,
): string[] {
  const next = [...(urls ?? [])];
  while (next.length <= index) next.push("");
  next[index] = url.trim();
  return cleanedLifestyleImages(next);
}

/** Owner manken / hanger at indexes 0–2 (takım: 0–3). Do not compact. */
function ownerUploadUrls(product: CatalogImageProduct): Set<string> {
  const images = product.images ?? [];
  const slots = isTakimCatalogProduct(product)
    ? [images[0], images[1], images[2], images[3]]
    : [images[0], images[1], images[2]];
  return new Set(
    slots
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url)),
  );
}

function isGeneratedCatalogAssetUrl(url: string): boolean {
  return isTrMarketplaceAssetUrl(url) || isTrStorefrontAssetUrl(url);
}

function isOwnerOriginalUrl(
  product: CatalogImageProduct,
  url: string,
): boolean {
  if (isGeneratedCatalogAssetUrl(url)) return false;
  if (ownerUploadUrls(product).has(url)) return true;
  return url.includes("/original/");
}

function firstMarketplaceAssetUrl(urls: string[] | undefined): string | undefined {
  for (const url of urls ?? []) {
    const trimmed = url?.trim();
    if (trimmed && isTrMarketplaceAssetUrl(trimmed)) return trimmed;
  }
  return undefined;
}

/**
 * Packshot identity is slot 3 or a `/marketplace/` path — not “URL missing
 * from images[0..2]”. Compacted / duplicated slots still count.
 */
function catalogPackshotUrl(product: CatalogImageProduct): string | undefined {
  const takim = takimPackshotUrls(product)[0];
  if (takim) return takim;
  const slotted =
    product.marketplaceImages?.[ELBISE_PACKSHOT_SLOT]?.trim() ||
    product.images?.[ELBISE_PACKSHOT_SLOT]?.trim();
  if (slotted && !isOwnerOriginalUrl(product, slotted)) return slotted;
  return (
    firstMarketplaceAssetUrl(product.marketplaceImages) ??
    firstMarketplaceAssetUrl(product.images)
  );
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

/**
 * Shopper gallery: generated model shots first when present, then packshot.
 * Owner manken / hanger originals stay in `images` (panel / orijinaller).
 */
function shopperFacingGallery(product: CatalogImageProduct): string[] {
  const lifestyle = nonEmpty(product.lifestyleImages);
  const packshots = isTakimCatalogProduct(product)
    ? takimPackshotUrls(product)
    : [catalogPackshotUrl(product)].filter(
        (url): url is string => Boolean(url),
      );
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (url: string | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    if (
      isOwnerOriginalUrl(product, trimmed) &&
      !packshots.includes(trimmed)
    ) {
      return;
    }
    seen.add(trimmed);
    out.push(trimmed);
  };

  for (const url of lifestyle) push(url);
  for (const url of packshots) push(url);
  if (out.length > 0) return out;

  const fallback = galleryFromSlots({ product, preferStorefront: false });
  const cleaned = fallback.filter((url) => !isOwnerOriginalUrl(product, url));
  return cleaned.length > 0 ? cleaned : fallback;
}

export function getProductCoverImageFor(
  surface: TrProductImageSurface,
  product: CatalogImageProduct,
): string | null {
  if (surface === "boutique") {
    const lifestyle = nonEmpty(product.lifestyleImages);
    const packshot = lifestyle.length > 0 ? catalogPackshotUrl(product) : undefined;
    const gallery = galleryFromSlots({
      product,
      preferStorefront: false,
    });
    const cover = packshot ?? gallery[0];
    if (cover) {
      return deliverPublicAssetUrl(cover, "full");
    }
    const fallback = getBoutiqueProductImages(product)[0];
    return fallback ? deliverPublicAssetUrl(fallback, "full") : null;
  }

  const packshot = catalogPackshotUrl(product);
  const marketplace = packshot ?? getMarketplaceProductImages(product)[0];
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
 * Boutique PDP / Merchant: model shots first when present, then packshot.
 * Owner uploads stay in `images` (panel / orijinaller). Do not prefer leftover
 * storefront WebP copies.
 */
export function getStorefrontGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return deliverPublicAssetUrls(shopperFacingGallery(product), "full");
}

/**
 * Cadde `/tr/parca` gallery: transparent packshot PNGs + lifestyle.
 */
export function getMarketplaceGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return deliverPublicAssetUrls(shopperFacingGallery(product), "full");
}

/**
 * Panel list/stock thumbs: packshot PNG when present.
 */
export function getPanelProductCover(
  product: CatalogImageProduct,
): string | null {
  const packshot = catalogPackshotUrl(product);
  const boutiqueCover =
    galleryFromSlots({ product, preferStorefront: false })[0] ??
    getBoutiqueProductImages(product)[0] ??
    null;
  const raw =
    packshot ??
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
