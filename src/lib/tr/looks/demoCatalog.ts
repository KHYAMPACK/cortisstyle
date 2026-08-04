/**
 * Static demo catalog for /tr when the live product catalog is empty.
 * Icon-based garments only — no real clothing photography.
 */

import { demoIconSrc, type TrDemoGarmentKind } from "@/lib/tr/demoIcons";
import { buildMayaProductSpecs } from "@/lib/tr/looks/mayaDemoProducts";
import type { TrLookWithProducts } from "@/types/tr-look";
import type {
  TrBoutiquePublic,
  TrBoutiqueStorefront,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

const BRAND_LOGO = "/brand/cortisstyle-logo-light.png";

const DEMO_BOUTIQUES: TrBoutiquePublic[] = [
  {
    id: "demo-boutique-atelier",
    slug: "demo-atelier",
    name: "Atölye",
    legalName: null,
    description: "Demo butik — ikonlarla vitrin deneyimi.",
    logoUrl: BRAND_LOGO,
    whatsappPhone: null,
    instagramHandle: null,
    themeAccent: null,
    shippingNote: "Demo kargo — gerçek gönderim yok.",
    exchangePolicy: "Demo iade politikası.",
    physicalAddress: null,
    homeLayout: null,
    customDomain: null,
    editorialContent: null,
    status: "verified",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-boutique-vitrin",
    slug: "demo-vitrin",
    name: "Vitrin",
    legalName: null,
    description: "Demo butik — sepet ve ödeme akışını dene.",
    logoUrl: BRAND_LOGO,
    whatsappPhone: null,
    instagramHandle: null,
    themeAccent: null,
    shippingNote: "Demo kargo — gerçek gönderim yok.",
    exchangePolicy: "Demo iade politikası.",
    physicalAddress: null,
    homeLayout: null,
    customDomain: null,
    editorialContent: null,
    status: "verified",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-boutique-kolektif",
    slug: "demo-kolektif",
    name: "Kolektif",
    legalName: null,
    description: "Demo butik — çoklu satıcı sepeti.",
    logoUrl: BRAND_LOGO,
    whatsappPhone: null,
    instagramHandle: null,
    themeAccent: null,
    shippingNote: "Demo kargo — gerçek gönderim yok.",
    exchangePolicy: "Demo iade politikası.",
    physicalAddress: null,
    homeLayout: null,
    customDomain: null,
    editorialContent: null,
    status: "verified",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-boutique-maya",
    slug: "demo-maya",
    name: "Maya Atelier",
    legalName: null,
    description:
      "Demo butik — klasik editorial vitrin. Stok fotoğraflı mobil-öncelikli mağaza şablonu.",
    logoUrl: "/tr/boutiques/demo-maya/logo.svg",
    whatsappPhone: null,
    instagramHandle: "mayaatelier.demo",
    themeAccent: "#111111",
    shippingNote: "Demo kargo — gerçek gönderim yok.",
    exchangePolicy:
      "Mesafeli satışlarda cayma hakkı yasal süreler içinde geçerlidir (demo).",
    physicalAddress: "Nişantaşı, İstanbul (Demo)",
    homeLayout: "editorial",
    customDomain: null,
    editorialContent: null,
    status: "verified",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

type DemoPieceSpec = {
  kind: TrDemoGarmentKind;
  title: string;
  priceKurus: number;
  category: string;
  boutiqueIndex: number;
};

const DEMO_LOOK_SPECS: Array<{
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverKind: TrDemoGarmentKind;
  pieces: DemoPieceSpec[];
}> = [
  {
    id: "tr-demo-look-01",
    slug: "cadde-gunlugu",
    title: "Cadde günlüğü",
    subtitle: "Demo kombin — ikon parçalar, gerçek vitrin hissi.",
    coverKind: "look",
    pieces: [
      {
        kind: "top",
        title: "Gündüz üst",
        priceKurus: 189900,
        category: "ust-giyim",
        boutiqueIndex: 0,
      },
      {
        kind: "bottom",
        title: "Geniş paça",
        priceKurus: 249900,
        category: "alt-giyim",
        boutiqueIndex: 1,
      },
      {
        kind: "bag",
        title: "Günlük çanta",
        priceKurus: 129900,
        category: "canta",
        boutiqueIndex: 0,
      },
    ],
  },
  {
    id: "tr-demo-look-02",
    slug: "aksam-katmani",
    title: "Akşam katmanı",
    subtitle: "Demo kombin — parçalar ayrı butiklerden.",
    coverKind: "look",
    pieces: [
      {
        kind: "outerwear",
        title: "Katmanlı dış",
        priceKurus: 319900,
        category: "dis-giyim",
        boutiqueIndex: 1,
      },
      {
        kind: "dress",
        title: "Akşam elbise",
        priceKurus: 279900,
        category: "elbise",
        boutiqueIndex: 2,
      },
      {
        kind: "shoe",
        title: "İnce topuk",
        priceKurus: 199900,
        category: "ayakkabi",
        boutiqueIndex: 0,
      },
      {
        kind: "top",
        title: "Vurucu üst",
        priceKurus: 159900,
        category: "ust-giyim",
        boutiqueIndex: 2,
      },
    ],
  },
  {
    id: "tr-demo-look-03",
    slug: "hafif-gecis",
    title: "Hafif geçiş",
    subtitle: "Demo kombin — sepete ekle, ödeme demosunu bitir.",
    coverKind: "look",
    pieces: [
      {
        kind: "top",
        title: "Hafif üst",
        priceKurus: 149900,
        category: "ust-giyim",
        boutiqueIndex: 2,
      },
      {
        kind: "bottom",
        title: "Kısa paça",
        priceKurus: 179900,
        category: "alt-giyim",
        boutiqueIndex: 0,
      },
      {
        kind: "shoe",
        title: "Geçiş ayakkabı",
        priceKurus: 219900,
        category: "ayakkabi",
        boutiqueIndex: 1,
      },
    ],
  },
];

export function isTrDemoBoutiqueSlug(slug: string): boolean {
  return slug.startsWith("demo-");
}

export function isTrDemoProductId(productId: string): boolean {
  return productId.startsWith("demo-product-");
}

export function isTrDemoProduct(product: {
  id?: string;
  boutique: { slug: string };
}): boolean {
  if (
    product.id &&
    (isTrDemoProductId(product.id) || product.id.startsWith("demo-wl-"))
  ) {
    return true;
  }
  return isTrDemoBoutiqueSlug(product.boutique.slug);
}

function buildDemoProduct(input: {
  id: string;
  title: string;
  priceKurus: number;
  kind: TrDemoGarmentKind;
  boutique: TrBoutiquePublic;
  category: string;
  sortOrder: number;
}): TrProductWithBoutique {
  const src = demoIconSrc(input.kind);
  return {
    id: input.id,
    boutiqueId: input.boutique.id,
    title: input.title,
    description:
      "Demo ürün — ikon görsel. Sepete ekleyip ödeme demosunu deneyebilirsiniz.",
    priceKurus: input.priceKurus,
    compareAtPriceKurus: null,
    size: "M",
    sizes: ["S", "M", "L"],
    colors: [],
    conditionLabel: null,
    category: input.category,
    images: [src],
    marketplaceImages: [src],
    catalogBackgroundId: null,
    status: "available",
    stock: 3,
    sortOrder: input.sortOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    boutique: input.boutique,
  };
}

function buildMayaProducts(): TrProductWithBoutique[] {
  const boutique = DEMO_BOUTIQUES.find((b) => b.slug === "demo-maya")!;
  return buildMayaProductSpecs().map((spec) => ({
    id: spec.id,
    boutiqueId: boutique.id,
    title: spec.title,
    description:
      "Maya Atelier demo ürünü — stok fotoğraf. Sepete ekleyip ödeme demosunu deneyebilirsiniz.",
    priceKurus: spec.priceKurus,
    compareAtPriceKurus: spec.compareAtPriceKurus ?? null,
    size: "M",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: spec.colors,
    conditionLabel: spec.isNew ? "Yeni Ürün" : null,
    category: spec.category,
    images: [spec.image],
    marketplaceImages: [spec.image],
    catalogBackgroundId: null,
    status: "available" as const,
    stock: 5,
    sortOrder: spec.sortOrder,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    boutique,
  }));
}

function allDemoProducts(): TrProductWithBoutique[] {
  const products: TrProductWithBoutique[] = [];
  DEMO_LOOK_SPECS.forEach((look, lookIndex) => {
    look.pieces.forEach((piece, pieceIndex) => {
      products.push(
        buildDemoProduct({
          id: `demo-product-${lookIndex + 1}-${pieceIndex + 1}`,
          title: piece.title,
          priceKurus: piece.priceKurus,
          kind: piece.kind,
          boutique: DEMO_BOUTIQUES[piece.boutiqueIndex]!,
          category: piece.category,
          sortOrder: pieceIndex,
        }),
      );
    });
  });
  products.push(...buildMayaProducts());
  return products;
}

let cachedProducts: TrProductWithBoutique[] | null = null;

function demoProductPool(): TrProductWithBoutique[] {
  if (!cachedProducts) cachedProducts = allDemoProducts();
  return cachedProducts;
}

/** Three published demo looks with icon pieces + logo’d boutiques. */
export function buildTrDemoLooks(): TrLookWithProducts[] {
  return DEMO_LOOK_SPECS.map((spec, lookIndex) => {
    const products = spec.pieces.map((piece, pieceIndex) =>
      buildDemoProduct({
        id: `demo-product-${lookIndex + 1}-${pieceIndex + 1}`,
        title: piece.title,
        priceKurus: piece.priceKurus,
        kind: piece.kind,
        boutique: DEMO_BOUTIQUES[piece.boutiqueIndex]!,
        category: piece.category,
        sortOrder: pieceIndex,
      }),
    );

    return {
      id: spec.id,
      slug: spec.slug,
      title: spec.title,
      subtitle: spec.subtitle,
      coverImage: demoIconSrc(spec.coverKind),
      sortOrder: lookIndex + 1,
      products,
      boutiqueCount: new Set(products.map((p) => p.boutique.id)).size,
    };
  });
}

export function getDemoBoutiqueBySlug(slug: string): TrBoutiquePublic | null {
  if (!isTrDemoBoutiqueSlug(slug)) return null;
  return DEMO_BOUTIQUES.find((b) => b.slug === slug) ?? null;
}

export function getDemoStorefrontBySlug(
  slug: string,
): TrBoutiqueStorefront | null {
  const boutique = getDemoBoutiqueBySlug(slug);
  if (!boutique) return null;

  const products = demoProductPool()
    .filter((p) => p.boutique.slug === slug)
    .map(({ boutique: _b, ...product }) => product);

  return { ...boutique, products };
}

export function getDemoProductByBoutiqueSlugAndId(
  boutiqueSlug: string,
  productId: string,
): TrProductWithBoutique | null {
  if (!isTrDemoBoutiqueSlug(boutiqueSlug) && !isTrDemoProductId(productId)) {
    return null;
  }
  const product = demoProductPool().find((p) => p.id === productId) ?? null;
  if (!product) return null;
  if (product.boutique.slug !== boutiqueSlug) return null;
  return product;
}

export function listDemoBoutiques(): TrBoutiquePublic[] {
  return [...DEMO_BOUTIQUES];
}

export function listDemoProducts(): TrProductWithBoutique[] {
  return [...demoProductPool()];
}
