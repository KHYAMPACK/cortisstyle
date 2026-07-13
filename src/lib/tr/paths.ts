import type { TrProduct } from "@/types/tr-marketplace";

/** Home “Parçalar” section anchor. */
export const TR_PIECES_SECTION_ID = "parcalar";

export function trHomePath(): string {
  return "/tr";
}

export function trBoutiquePath(slug: string): string {
  return `/tr/${encodeURIComponent(slug)}`;
}

/** Set on PDP links from marketplace home / looks so “back” returns to Cadde. */
export const TR_PDP_FROM_CADDE = "cadde";

export function trBoutiqueProductPath(
  boutiqueSlug: string,
  productId: string,
  options?: { from?: typeof TR_PDP_FROM_CADDE },
): string {
  const path = `/tr/${encodeURIComponent(boutiqueSlug)}/urun/${encodeURIComponent(productId)}`;
  if (options?.from === TR_PDP_FROM_CADDE) {
    return `${path}?from=${TR_PDP_FROM_CADDE}`;
  }
  return path;
}

/** Canonical boutique PDP when slug is known; legacy `/tr/shop/id` fallback otherwise. */
export function trProductPath(
  productId: string,
  boutiqueSlug?: string,
  options?: { from?: typeof TR_PDP_FROM_CADDE },
): string {
  if (boutiqueSlug?.trim()) {
    return trBoutiqueProductPath(boutiqueSlug.trim(), productId, options);
  }
  return `/tr/shop/${encodeURIComponent(productId)}`;
}

export function trCartPath(): string {
  return "/tr/cart";
}

export function trCheckoutPath(): string {
  return "/tr/checkout";
}

export function trOrderConfirmationPath(): string {
  return "/tr/siparis-onay";
}

export function trComingSoonPath(): string {
  return "/tr/yakinda";
}

/** Localhost-only Photoroom → waist-anchored hero slot importer. */
export function trDevHeroImportPath(): string {
  return "/tr/dev/hero-import";
}

export function trPanelPath(): string {
  return "/tr/panel";
}

export function trPanelProductsPath(): string {
  return "/tr/panel/urunler";
}

export function trPanelNewProductPath(): string {
  return "/tr/panel/urun/yeni";
}

export function trPanelEditProductPath(productId: string): string {
  return `/tr/panel/urun/${encodeURIComponent(productId)}`;
}

export function trPanelOrdersPath(): string {
  return "/tr/panel/siparisler";
}

export function trPanelCustomersPath(): string {
  return "/tr/panel/musteriler";
}

export function trPanelDiscountsPath(): string {
  return "/tr/panel/indirim";
}

export function trPanelStockPath(): string {
  return "/tr/panel/stok";
}

export function trPanelSettingsPath(): string {
  return "/tr/panel/ayarlar";
}

export function getProductCoverImage(product: Pick<TrProduct, "images" | "title">): string | null {
  return product.images[0] ?? null;
}
