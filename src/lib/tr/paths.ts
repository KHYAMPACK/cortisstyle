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

/** Boutique-scoped cart page (editorial / white-label local cart). */
export function trBoutiqueCartPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/sepet`;
}

export function trCheckoutPath(params?: { boutique?: string }): string {
  const boutique = params?.boutique?.trim();
  if (!boutique) return "/tr/odeme";
  return `/tr/odeme?boutique=${encodeURIComponent(boutique)}`;
}

/** Boutique-scoped checkout (white-label / editorial local cart). */
export function trBoutiqueCheckoutPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/odeme`;
}

export function trOrderConfirmationPath(params?: { boutique?: string }): string {
  const boutique = params?.boutique?.trim();
  if (!boutique) return "/tr/siparis-onay";
  return `/tr/${encodeURIComponent(boutique)}/siparis-onay`;
}

/** @deprecated Prefer trOrderConfirmationPath({ boutique }) */
export function trBoutiqueOrderConfirmationPath(boutiqueSlug: string): string {
  return trOrderConfirmationPath({ boutique: boutiqueSlug });
}

export function trBoutiqueLegalPath(boutiqueSlug: string, doc: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/yasal/${encodeURIComponent(doc)}`;
}

export function trBoutiqueAuthPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/giris`;
}

/** Boutique-scoped favorites page (local favorites store). */
export function trBoutiqueFavoritesPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/favoriler`;
}

export function trBoutiqueOrdersPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/siparisler`;
}

export function trBoutiqueOrderDetailPath(
  boutiqueSlug: string,
  orderId: string,
): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/siparisler/${encodeURIComponent(orderId)}`;
}

export function trBoutiqueOrderTrackingPath(
  boutiqueSlug: string,
  orderId: string,
): string {
  return `${trBoutiqueOrderDetailPath(boutiqueSlug, orderId)}/takip`;
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

export function trPanelOrderPath(orderId: string): string {
  return `/tr/panel/siparisler/${encodeURIComponent(orderId)}`;
}

export function trPanelCustomersPath(): string {
  return "/tr/panel/musteriler";
}

export function trPanelCustomerPath(email: string): string {
  return `/tr/panel/musteriler/${encodeURIComponent(email)}`;
}

/** @deprecated Use trPanelCampaignsPath — kept for redirects. */
export function trPanelDiscountsPath(): string {
  return trPanelCampaignsPath();
}

export function trPanelCampaignsPath(): string {
  return "/tr/panel/kampanyalar";
}

export function trPanelContentPath(): string {
  return "/tr/panel/icerik";
}

export function trPanelContentPackPath(packId: string): string {
  return `/tr/panel/icerik/${encodeURIComponent(packId)}`;
}

export function trPanelReportsPath(): string {
  return "/tr/panel/raporlar";
}

export function trPanelStockPath(): string {
  return "/tr/panel/stok";
}

export function trPanelSettingsPath(): string {
  return "/tr/panel/ayarlar";
}

export function trPanelInvoicesPath(): string {
  return "/tr/panel/faturalar";
}

export function getProductCoverImage(product: Pick<TrProduct, "images" | "title">): string | null {
  return product.images[0] ?? null;
}
