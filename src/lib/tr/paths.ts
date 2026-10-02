import type { TrProduct } from "@/types/tr-marketplace";

export function trBoutiquePath(slug: string): string {
  return `/tr/${encodeURIComponent(slug)}`;
}

/** Boutique home: `/tr/{slug}` or custom-domain `/`. */
export function isBoutiqueHomePath(
  pathname: string,
  boutiqueSlug: string,
): boolean {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || "/";
  const slug = boutiqueSlug.trim().toLowerCase();
  if (!slug) return false;
  return path === "/" || path === trBoutiquePath(slug);
}

/** Boutique storefront product listing (editorial PLP). */
/**
 * A boutique's product list. With `kategori` it is that category's page
 * (`/tr/{boutique}/kategori/{slug}`); the other parameters narrow the list. `kategori:
 * "sale"` is the discount filter on the full list, not a category.
 */
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
  const kategori = params?.kategori?.trim();
  const sale = kategori === "sale";
  const base =
    kategori && !sale
      ? trBoutiqueCategoryPath(boutiqueSlug, kategori)
      : `/tr/${encodeURIComponent(boutiqueSlug)}/urunler`;
  const search = new URLSearchParams();
  const q = params?.q?.trim();
  const renk = params?.renk?.trim();
  const sira = params?.sira?.trim();
  if (q) search.set("q", q);
  if (params?.indirim || sale) search.set("indirim", "1");
  if (renk) search.set("renk", renk);
  if (sira) search.set("sira", sira);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function trBoutiqueProductPath(
  boutiqueSlug: string,
  productId: string,
): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/urun/${encodeURIComponent(productId)}`;
}

/** A category page on a boutique's own categories: `/tr/{boutique}/kategori/{slug}`. */
export function trBoutiqueCategoryPath(
  boutiqueSlug: string,
  categorySlug: string,
): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/kategori/${encodeURIComponent(categorySlug)}`;
}

/** Canonical boutique PDP when slug is known; legacy `/tr/shop/id` fallback otherwise. */
export function trProductPath(
  productId: string,
  boutiqueSlug?: string,
): string {
  if (boutiqueSlug?.trim()) {
    return trBoutiqueProductPath(boutiqueSlug.trim(), productId);
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

/** Boutique-scoped checkout (white-label / editorial local cart). */
export function trBoutiqueCheckoutPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/odeme`;
}

export function trOrderConfirmationPath(params?: { boutique?: string }): string {
  const boutique = params?.boutique?.trim();
  if (!boutique) return "/tr/siparis-onay";
  return `/tr/${encodeURIComponent(boutique)}/siparis-onay`;
}

export function trBoutiqueLegalPath(boutiqueSlug: string, doc: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/yasal/${encodeURIComponent(doc)}`;
}

export function trBoutiqueAuthPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/giris`;
}

export function trBoutiqueAddressesPath(boutiqueSlug: string): string {
  return `/tr/${encodeURIComponent(boutiqueSlug)}/adresler`;
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
  query?: { token?: string; posta?: string },
): string {
  const base = `${trBoutiqueOrderDetailPath(boutiqueSlug, orderId)}/takip`;
  const search = new URLSearchParams();
  if (query?.token?.trim()) search.set("token", query.token.trim());
  if (query?.posta?.trim()) search.set("posta", query.posta.trim());
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
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

/** A Basit ürün: one price, the size table or one stock count. */
export function trPanelNewSimpleProductPath(): string {
  return "/tr/panel/urun/yeni/basit";
}

/** A Gelişmiş ürün: variants. */
export function trPanelNewAdvancedProductPath(): string {
  return "/tr/panel/urun/yeni/gelismis";
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

/** A new order built by hand (Sipariş Oluştur). */
export function trPanelNewOrderPath(): string {
  return "/tr/panel/siparisler/yeni";
}

/** Taslaklar: saved unfinished manual orders. */
export function trPanelDraftsPath(): string {
  return "/tr/panel/taslaklar";
}

export function trPanelDraftPath(draftId: string): string {
  return `/tr/panel/taslaklar/${encodeURIComponent(draftId)}`;
}

export function trPanelCustomersPath(): string {
  return "/tr/panel/musteriler";
}

export function trPanelNewCustomerPath(): string {
  return "/tr/panel/musteriler/yeni";
}

export function trPanelCustomerPath(customerId: string): string {
  return `/tr/panel/musteriler/${encodeURIComponent(customerId)}`;
}

export function trPanelEditCustomerPath(customerId: string): string {
  return `${trPanelCustomerPath(customerId)}/duzenle`;
}

/** @deprecated Use trPanelCampaignsPath — kept for redirects. */
export function trPanelDiscountsPath(): string {
  return trPanelCampaignsPath();
}

export function trPanelCampaignsPath(): string {
  return "/tr/panel/kampanyalar";
}

export function trPanelNewCampaignPath(kind?: "automatic" | "code"): string {
  return kind === "code"
    ? "/tr/panel/kampanyalar/yeni?kind=code"
    : "/tr/panel/kampanyalar/yeni";
}

export function trPanelEditCampaignPath(campaignId: string): string {
  return `/tr/panel/kampanyalar/${encodeURIComponent(campaignId)}`;
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

/** Tanımlamalar hub (categories now; brands, tags, … when something needs them). */
export function trPanelDefinitionsPath(): string {
  return "/tr/panel/tanimlamalar";
}

export function trPanelCategoriesPath(): string {
  return "/tr/panel/tanimlamalar/kategoriler";
}

export function trPanelVariantTypesPath(): string {
  return "/tr/panel/tanimlamalar/varyant-turleri";
}

export function trPanelProductKindsPath(): string {
  return "/tr/panel/tanimlamalar/urun-turleri";
}

export function trPanelAttributesPath(): string {
  return "/tr/panel/tanimlamalar/ozellikler";
}

export function trPanelNewCategoryPath(): string {
  return "/tr/panel/tanimlamalar/kategoriler/yeni";
}

export function trPanelEditCategoryPath(categoryId: string): string {
  return `/tr/panel/tanimlamalar/kategoriler/${encodeURIComponent(categoryId)}`;
}

export function trPanelStockPath(): string {
  return "/tr/panel/stok";
}

export function trPanelSettingsPath(): string {
  return "/tr/panel/ayarlar";
}

/** Staff-only originals browser — not in TR_PANEL_NAV. */
export function trPanelOriginalsPath(): string {
  return "/tr/panel/orijinaller";
}

export function trPanelInvoicesPath(): string {
  return "/tr/panel/faturalar";
}

export function getProductCoverImage(product: Pick<TrProduct, "images" | "title">): string | null {
  return product.images[0] ?? null;
}
