/** Presentation copy + media for the Maya Atelier editorial demo homepage. */

export const EDITORIAL_DEMO_SLUG = "demo-maya";
export const EDITORIAL_SALE_RED = "#C41E3A";

const ASSET = (name: string) => `/tr/boutiques/demo-maya/${name}`;

export type EditorialNavItem = {
  id: string;
  label: string;
  /** Catalog category id, "sale" for discounted products, or null for all. */
  categoryId: string | null;
  accent?: "sale";
};

export type EditorialDemoContent = {
  nav: EditorialNavItem[];
  /** Slim top strip above the category hero. */
  promoBar: {
    text: string;
    cta: string;
  };
  /** Full-bleed hero with vertical category list (Aksesuarix-style). */
  categoryHero: {
    image: string;
    promoLine: string;
    cta: string;
  };
  /** Two large side-by-side category panels. */
  featuredPair: Array<{
    categoryId: string;
    label: string;
    image: string;
    cta: string;
  }>;
  /** Three (or more) category panels in a row. */
  categoryTiles: Array<{
    categoryId: string;
    label: string;
    image: string;
    cta: string;
  }>;
  highlight: {
    body: string;
    cta: string;
  };
  instagram: {
    title: string;
    handle: string;
    images: string[];
  };
  usps: Array<{
    id: string;
    label: string;
    icon: "secure" | "customers" | "shipping" | "payment";
  }>;
  footer: {
    newsletterTitle: string;
    newsletterBody: string;
    newsletterPlaceholder: string;
    newsletterCta: string;
    phone: string;
    email: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
  };
  /** @deprecated Kept for DB JSON merge compatibility; unused in UI. */
  promo?: {
    eyebrow: string;
    discount: string;
    discountScript: string;
    title: string;
    image: string;
    imageLabel: string;
    imageCta: string;
  };
  /** @deprecated Kept for DB JSON merge compatibility; unused in UI. */
  editorial?: {
    headline: string;
    body: string;
    cta: string;
    image: string;
    imageTitle: string;
    imageCta: string;
  };
  /** @deprecated Kept for DB JSON merge compatibility; unused in UI. */
  lifestyle?: {
    image: string;
    body: string;
    cta: string;
  };
};

export function getEditorialDemoContent(): EditorialDemoContent {
  return {
    nav: [
      { id: "new", label: "Yeni", categoryId: null },
      { id: "elbise", label: "Elbise", categoryId: "elbise" },
      { id: "ust", label: "Üst Giyim", categoryId: "ust-giyim" },
      { id: "alt", label: "Alt Giyim", categoryId: "alt-giyim" },
      { id: "beach", label: "Beach", categoryId: "beach" },
      { id: "dis", label: "Dış Giyim", categoryId: "dis-giyim" },
      {
        id: "sale",
        label: "İndirim",
        categoryId: "sale",
        accent: "sale",
      },
    ],
    promoBar: {
      text: "Seçili ürünlerde %70'e varan indirim",
      cta: "Alışverişe başla",
    },
    categoryHero: {
      image: ASSET("cat-trenckot.jpg"),
      promoLine: "Sezon seçkilerinde özel fırsatlar",
      cta: "Alışverişe başla",
    },
    featuredPair: [
      {
        categoryId: "ust-giyim",
        label: "Üst Giyim",
        image: ASSET("cat-ceket.jpg"),
        cta: "Hemen keşfet",
      },
      {
        categoryId: "elbise",
        label: "Elbise",
        image: ASSET("cat-parka.jpg"),
        cta: "Hemen keşfet",
      },
    ],
    categoryTiles: [
      {
        categoryId: "alt-giyim",
        label: "Alt Giyim",
        image: ASSET("cat-jean.jpg"),
        cta: "Ürünleri incele",
      },
      {
        categoryId: "dis-giyim",
        label: "Dış Giyim",
        image: ASSET("cat-trenckot.jpg"),
        cta: "Ürünleri incele",
      },
      {
        categoryId: "beach",
        label: "Beach",
        image: ASSET("ig-3.jpg"),
        cta: "Ürünleri incele",
      },
    ],
    highlight: {
      body: "Kategorilerden seç, koleksiyonu keşfet — zamansız parçalar bir tık uzağında.",
      cta: "Tüm ürünler",
    },
    instagram: {
      title: "Bizi Instagram'da takip et!",
      handle: "mayaatelier.demo",
      images: [
        ASSET("ig-1.jpg"),
        ASSET("ig-2.jpg"),
        ASSET("ig-3.jpg"),
        ASSET("ig-4.jpg"),
        ASSET("ig-5.jpg"),
      ],
    },
    usps: [
      { id: "secure", label: "Güvenli Alışveriş", icon: "secure" },
      { id: "customers", label: "Müşteri Memnuniyeti", icon: "customers" },
      { id: "shipping", label: "Hızlı Teslimat", icon: "shipping" },
      { id: "payment", label: "Ödeme Seçenekleri", icon: "payment" },
    ],
    footer: {
      newsletterTitle: "E-Bülten Kayıt",
      newsletterBody:
        "Özel indirimler ve son yenilikler için bültenimize kayıt olun!",
      newsletterPlaceholder: "E-posta adresinizi girin",
      newsletterCta: "Gönder",
      phone: "0850 000 00 00",
      email: "info@mayaatelier.demo",
      columns: [
        {
          title: "Kurumsal",
          links: [
            { label: "Hakkımızda", href: "#" },
            { label: "KVKK", href: "#" },
            { label: "Üyelik Sözleşmesi", href: "#" },
          ],
        },
        {
          title: "Alışveriş Rehberi",
          links: [
            { label: "İade & Hediye Çeki", href: "#" },
            { label: "Kargom Nerede?", href: "#" },
            { label: "Kolay İade", href: "#" },
            { label: "Siparişlerim", href: "#" },
          ],
        },
      ],
    },
  };
}
