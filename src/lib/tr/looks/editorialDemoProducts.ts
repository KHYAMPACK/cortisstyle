/**
 * Interactive white-label demo products when a boutique catalog is empty.
 * IDs: demo-wl-{slug}-{key} — resolved client/server without DB rows.
 */

import type {
  TrBoutiquePublic,
  TrProduct,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

export const EDITORIAL_DEMO_PRODUCT_PREFIX = "demo-wl-";

type Spec = {
  key: string;
  title: string;
  priceKurus: number;
  compareAtPriceKurus?: number;
  category: string;
  sizes: string[];
  conditionLabel?: string;
};

const SPECS: Spec[] = [
  {
    key: "gomlek",
    title: "Keten Gömlek",
    priceKurus: 129_900,
    category: "ust-giyim",
    sizes: ["S", "M", "L"],
    conditionLabel: "Yeni",
  },
  {
    key: "etek",
    title: "Pileli Etek",
    priceKurus: 98_900,
    compareAtPriceKurus: 149_900,
    category: "alt-giyim",
    sizes: ["34", "36", "38", "40"],
  },
  {
    key: "ceket",
    title: "Oversize Ceket",
    priceKurus: 219_900,
    category: "dis-giyim",
    sizes: ["S", "M", "L", "XL"],
    conditionLabel: "Yeni",
  },
  {
    key: "jean",
    title: "Yüksek Bel Jean",
    priceKurus: 159_900,
    compareAtPriceKurus: 199_900,
    category: "alt-giyim",
    sizes: ["34", "36", "38", "40", "42"],
  },
  {
    key: "bluz",
    title: "Saten Bluz",
    priceKurus: 89_900,
    category: "ust-giyim",
    sizes: ["XS", "S", "M", "L"],
  },
  {
    key: "trenckot",
    title: "Trençkot",
    priceKurus: 349_900,
    compareAtPriceKurus: 449_900,
    category: "dis-giyim",
    sizes: ["S", "M", "L"],
  },
  {
    key: "kazak",
    title: "Örme Kazak",
    priceKurus: 119_900,
    category: "ust-giyim",
    sizes: ["S", "M", "L"],
    conditionLabel: "Yeni",
  },
  {
    key: "elbise",
    title: "Günlük Elbise",
    priceKurus: 179_900,
    category: "elbise",
    sizes: ["34", "36", "38", "40"],
  },
];

export function isEditorialDemoProductId(productId: string): boolean {
  return productId.startsWith(EDITORIAL_DEMO_PRODUCT_PREFIX);
}

export function buildEditorialDemoProducts(
  boutique: TrBoutiquePublic,
): TrProduct[] {
  const now = "2026-01-01T00:00:00.000Z";
  return SPECS.map((spec, index) => ({
    id: `${EDITORIAL_DEMO_PRODUCT_PREFIX}${boutique.slug}-${spec.key}`,
    boutiqueId: boutique.id,
    title: spec.title,
    description:
      "Demo ürün — vitrin, sepet, favori ve ödeme akışını denemek için. Gerçek stok değildir.",
    priceKurus: spec.priceKurus,
    compareAtPriceKurus: spec.compareAtPriceKurus ?? null,
    size: spec.sizes[0] ?? null,
    sizes: spec.sizes,
    colors: [],
    conditionLabel: spec.conditionLabel ?? null,
    category: spec.category,
    images: [],
    marketplaceImages: [],
    status: "available" as const,
    stock: 5,
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
  }));
}

export function getEditorialDemoProduct(
  boutique: TrBoutiquePublic,
  productId: string,
): TrProductWithBoutique | null {
  if (!isEditorialDemoProductId(productId)) return null;
  const product = buildEditorialDemoProducts(boutique).find(
    (entry) => entry.id === productId,
  );
  if (!product) return null;
  return { ...product, boutique };
}

/** Use live catalog when present; otherwise interactive demo SKUs. */
export function withEditorialDemoProducts(
  boutique: TrBoutiquePublic,
  products: TrProduct[],
): TrProduct[] {
  const available = products.filter((p) => p.status === "available");
  if (available.length > 0) return products;
  return buildEditorialDemoProducts(boutique);
}
