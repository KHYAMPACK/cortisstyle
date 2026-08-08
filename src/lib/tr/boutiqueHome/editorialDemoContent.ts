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

/** One clickable action inside a campaign-template hero (PF-style). */
export type EditorialCampaignAction = {
  label: string;
  /**
   * Where the action goes: `"sale"`, `"all"`, or a category id.
   * Defaults to `"all"`.
   */
  target?: "sale" | "all" | string;
};

/**
 * Hero campaign slide — supports classic (single CTA) and campaign template
 * (subText → name → up to 4 actions → subText2 + bg) for owner-editable promos.
 */
export type EditorialHeroPromotion = {
  id: string;
  image?: string;
  /** Solid/gradient fill when no image — e.g. boutique accent. */
  backgroundColor?: string;
  /** Large faint word behind the title (e.g. "İNDİRİM"). */
  watermark?: string;
  /**
   * Template variant. `"campaign"` = PF-style stacked layout.
   * `"brand"` = logo + name only (atelier intro slide).
   * Default / omit = classic single-CTA hero (Pervin).
   */
  template?: "classic" | "campaign" | "brand";
  /** Sub text 1 (top eyebrow). Alias: kept as promoLine for older JSON. */
  promoLine: string;
  /** Campaign name (large). Alias: kept as discountLine for older JSON. */
  discountLine: string;
  /** Optional clearer aliases — win over promoLine / discountLine when set. */
  subText?: string;
  campaignName?: string;
  /** Bottom supporting lines under the action grid. */
  subText2?: string | string[];
  /** Up to 4 CTAs for campaign template. */
  actions?: EditorialCampaignAction[];
  /** Legacy single CTA when `actions` is empty. */
  cta: string;
  /**
   * Where CTA goes: `"sale"` (default), a category id, or `"all"` for full PLP.
   */
  target?: "sale" | "all" | string;
};

export type EditorialDemoContent = {
  nav: EditorialNavItem[];
  /** Slim top strip above the category hero. */
  promoBar: {
    text: string;
    cta: string;
  };
  /**
   * Auto-rotating hero promotions. When empty/missing, UI falls back to
   * wrapping `categoryHero` as a single slide.
   */
  heroPromotions?: EditorialHeroPromotion[];
  /** Full-bleed promotion hero (legacy single slide; still merged for DB JSON). */
  categoryHero: {
    image: string;
    /** Small line above the discount, e.g. "Seçili ürünlerde" */
    promoLine: string;
    /** Large discount line, e.g. "%50'YE VARAN İNDİRİM" */
    discountLine: string;
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
  /**
   * Atelier / PF-style home blocks (optional). Classic Pervin home ignores these.
   */
  shopByCategoryTitle?: string;
  /** Flat category row; falls back to featuredPair + categoryTiles when omitted. */
  shopCategories?: Array<{
    categoryId: string;
    label: string;
    image?: string;
  }>;
  infoStrip?: Array<{
    id: string;
    title: string;
    body: string;
    icon?: "fit" | "returns" | "shipping" | "exchange" | "secure" | "payment";
  }>;
  trends?: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      cta: string;
      target?: "sale" | "all" | string;
      image?: string;
    }>;
  };
  midCampaign?: {
    eyebrow: string;
    title: string;
    cta: string;
    target?: "sale" | "all" | string;
    image?: string;
  };
  join?: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta?: string;
    benefits: Array<{
      id: string;
      label: string;
      icon?: "points" | "early" | "promo" | "shipping" | "support" | "heart";
    }>;
  };
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
      promoLine: "Seçili ürünlerde",
      discountLine: "%70'e varan indirim",
      cta: "Alışverişe başla",
    },
    heroPromotions: [
      {
        id: "sale-70",
        image: ASSET("cat-trenckot.jpg"),
        promoLine: "Seçili ürünlerde",
        discountLine: "%70'e varan indirim",
        cta: "Alışverişe başla",
        target: "sale",
      },
      {
        id: "new-season",
        image: ASSET("cat-ceket.jpg"),
        promoLine: "Yeni sezon",
        discountLine: "Zamansız parçalar",
        cta: "Yeni gelenler",
        target: "all",
      },
      {
        id: "dresses",
        image: ASSET("cat-parka.jpg"),
        promoLine: "Elbise seçkisi",
        discountLine: "Haftanın favorileri",
        cta: "Elbiseleri keşfet",
        target: "elbise",
      },
    ],
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
