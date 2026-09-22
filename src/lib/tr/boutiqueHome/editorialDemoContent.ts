/** Shared shape for editorial-skin boutique homepage content. */

export const EDITORIAL_SALE_RED = "#C41E3A";

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
  /** When true with a category target, opens PLP with `indirim=1`. */
  indirim?: boolean;
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
   * `"classic"` / omit = photo hero (single CTA or small action set).
   */
  template?: "classic" | "campaign" | "brand";
  /**
   * Where headline + CTAs sit on a photo hero so they don’t cover the subject.
   * `"left"` | `"right"` | `"center"` (default).
   */
  contentAlign?: "left" | "right" | "center";
  /** Sub text 1 (top eyebrow). Alias: kept as promoLine for older JSON. */
  promoLine: string;
  /** Campaign name (large). Alias: kept as discountLine for older JSON. */
  discountLine: string;
  /** Optional clearer aliases — win over promoLine / discountLine when set. */
  subText?: string;
  campaignName?: string;
  /** Bottom supporting lines under the action grid. */
  subText2?: string | string[];
  /** Up to 6 CTAs for campaign template (1 / 2 / 3 layouts + main-category grids). */
  actions?: EditorialCampaignAction[];
  /** Legacy single CTA when `actions` is empty. */
  cta: string;
  /**
   * Where CTA goes: `"sale"` (default), a category id, or `"all"` for full PLP.
   */
  target?: "sale" | "all" | string;
};

export type EditorialTwinStorySide = {
  id: string;
  label: string;
  /** One-line character, e.g. "Sıcak. Kahve. Sonbahar." */
  line: string;
  /** Matching-corner photo. Omit for a tone plate until the twin is shot. */
  image?: string;
  /** CSS object-position for the campaign crop. Default `center 20%`. */
  objectPosition?: string;
  /** Shift the photo down (e.g. `"7%"`) so twins line up. */
  imageShiftY?: string;
  /** Product page. Empty = expand only, no navigation. */
  href?: string;
  /** CSS fill when `image` is missing. */
  tone: string;
};

export type EditorialTwinStory = {
  title: string;
  question: string;
  /** Short promo, e.g. free kargo on a campaign piece. */
  promo?: string;
  sides: [EditorialTwinStorySide, EditorialTwinStorySide];
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
    /** Optional panel photo (atelier membership side). */
    image?: string;
    benefits: Array<{
      id: string;
      label: string;
      icon?: "points" | "early" | "promo" | "shipping" | "support" | "heart";
    }>;
  };
  /**
   * Atelier home: Espresso / Navy twin story (Lila). Classic ignores.
   * Optional href per side — tap expands then routes when set.
   */
  twinStory?: EditorialTwinStory;
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
