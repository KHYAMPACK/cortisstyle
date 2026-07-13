import type { TrProduct } from "@/types/tr-marketplace";

export function trHomePath(): string {
  return "/tr";
}

export function trBoutiquePath(slug: string): string {
  return `/tr/${encodeURIComponent(slug)}`;
}

export function trBoutiqueProductPath(
  boutiqueSlug: string,
  productId: string,
): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/urun/${encodeURIComponent(productId)}`;
}

/** Canonical boutique PDP when slug is known; legacy `/tr/shop/id` fallback otherwise. */
export function trProductPath(productId: string, boutiqueSlug?: string): string {
  if (boutiqueSlug?.trim()) {
    return trBoutiqueProductPath(boutiqueSlug.trim(), productId);
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
