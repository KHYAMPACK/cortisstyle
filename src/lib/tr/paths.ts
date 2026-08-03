import type { TrProduct } from "@/types/tr-marketplace";

/** Home “Parçalar” section anchor. */
export const TR_PIECES_SECTION_ID = "parcalar";

export function trHomePath(): string {
  return "/tr";
}

/** Zara-style full-page search (no marketplace chrome). */
export function trSearchPath(): string {
  return "/tr/ara";
}

export function trProductsPath(params?: {
  q?: string;
  kategori?: string;
}): string {
  const base = "/tr/urunler";
  const search = new URLSearchParams();
  const q = params?.q?.trim();
  const kategori = params?.kategori?.trim();
  if (q) search.set("q", q);
  if (kategori) search.set("kategori", kategori);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function trFavoritesPath(): string {
  return "/tr/favoriler";
}

export function trBoutiquesPath(params?: { q?: string }): string {
  const base = "/tr/butikler";
  const q = params?.q?.trim();
  if (!q) return base;
  return `${base}?${new URLSearchParams({ q }).toString()}`;
}

export function trBoutiquePath(slug: string): string {
  return `/tr/${encodeURIComponent(slug)}`;
}

/** Boutique storefront product listing (editorial PLP). */
export function trBoutiqueProductsPath(
  boutiqueSlug: string,
  params?: {
    q?: string;
    kategori?: string;
    indirim?: boolean;
    renk?: string;
    sira?: string;
  },
): string {
  const base = `/tr/${encodeURIComponent(boutiqueSlug)}/urunler`;
  const search = new URLSearchParams();
  const q = params?.q?.trim();
  const kategori = params?.kategori?.trim();
  const renk = params?.renk?.trim();
  const sira = params?.sira?.trim();
  if (q) search.set("q", q);
  if (kategori) search.set("kategori", kategori);
  if (params?.indirim) search.set("indirim", "1");
  if (renk) search.set("renk", renk);
  if (sira) search.set("sira", sira);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
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

/** Marketplace cloth (parça) detail — not boutique-branded PDP. */
export function trClothPath(productId: string): string {
  return `/tr/parca/${encodeURIComponent(productId)}`;
}

/** Marketplace look (kombin) detail. */
export function trLookPath(slug: string): string {
  return `/tr/kombin/${encodeURIComponent(slug)}`;
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
  return "/tr/sepet";
}

export function trCheckoutPath(): string {
  return "/tr/odeme";
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
