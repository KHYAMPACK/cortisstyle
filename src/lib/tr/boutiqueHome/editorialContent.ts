/**
 * Resolve editorial homepage/footer content for a boutique.
 * Code defaults (Maya demo or brand-derived) + optional DB `editorial_content` merge.
 */

import { resolveBoutiqueContactEmail } from "@/lib/tr/checkoutMode";
import {
  EDITORIAL_DEMO_SLUG,
  getEditorialDemoContent,
  type EditorialDemoContent,
  type EditorialHeroPromotion,
} from "@/lib/tr/boutiqueHome/editorialDemoContent";
import { trBoutiqueLegalPath, trBoutiquePath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const TEMPLATE_ASSET = (name: string) => `/tr/boutiques/demo-maya/${name}`;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Deep-merge plain objects; arrays and primitives from `override` win. */
function mergeEditorial(
  base: EditorialDemoContent,
  override: Record<string, unknown> | null | undefined,
): EditorialDemoContent {
  if (!override) return base;

  const mergeValue = (current: unknown, next: unknown): unknown => {
    if (next === undefined) return current;
    if (Array.isArray(next)) return next;
    if (isPlainObject(current) && isPlainObject(next)) {
      const out: Record<string, unknown> = { ...current };
      for (const [key, value] of Object.entries(next)) {
        out[key] = mergeValue(current[key], value);
      }
      return out;
    }
    return next;
  };

  return mergeValue(base, override) as EditorialDemoContent;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) {
    return `0${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone;
}

function legalFooterColumns(
  slug: string,
): EditorialDemoContent["footer"]["columns"] {
  const legal = (doc: string) => trBoutiqueLegalPath(slug, doc);
  return [
    {
      title: "Kurumsal",
      links: [
        { label: "Hakkımızda / Künye", href: legal("kunye") },
        { label: "KVKK Aydınlatma", href: legal("kvkk") },
        { label: "Gizlilik", href: legal("gizlilik") },
        { label: "Üyelik Sözleşmesi", href: legal("uyelik") },
        { label: "Çerez Politikası", href: legal("cerez") },
      ],
    },
    {
      title: "Alışveriş Rehberi",
      links: [
        { label: "Mesafeli Satış", href: legal("mesafeli-satis") },
        { label: "Ön Bilgilendirme", href: legal("on-bilgilendirme") },
        { label: "İade & Cayma", href: legal("iade") },
        { label: "Ana sayfa", href: trBoutiquePath(slug) },
      ],
    },
  ];
}

/** Brand-derived editorial defaults for white-label boutiques (e.g. Pervin). */
export function buildBoutiqueEditorialDefaults(
  boutique: Pick<
    TrBoutiquePublic,
    | "slug"
    | "name"
    | "description"
    | "whatsappPhone"
    | "instagramHandle"
    | "shippingNote"
    | "customDomain"
  >,
): EditorialDemoContent {
  const phoneDisplay = boutique.whatsappPhone
    ? formatPhoneDisplay(boutique.whatsappPhone)
    : "İletişim yakında";
  const email = resolveBoutiqueContactEmail(boutique);
  const handle = boutique.instagramHandle?.replace(/^@/, "") ?? boutique.slug;
  const shippingLabel =
    boutique.shippingNote?.trim() || "Kargo bilgisi yakında";

  return {
    nav: [
      { id: "new", label: "Yeni", categoryId: null },
      { id: "elbise", label: "Elbise", categoryId: "elbise" },
      { id: "ust", label: "Üst Giyim", categoryId: "ust-giyim" },
      { id: "alt", label: "Alt Giyim", categoryId: "alt-giyim" },
      { id: "aksesuar", label: "Aksesuar", categoryId: "aksesuar" },
      { id: "dis", label: "Dış Giyim", categoryId: "dis-giyim" },
      {
        id: "sale",
        label: "İndirim",
        categoryId: "sale",
        accent: "sale",
      },
    ],
    promoBar: {
      text: `${boutique.name} — yeni sezon`,
      cta: "Alışverişe başla",
    },
    categoryHero: {
      image: TEMPLATE_ASSET("cat-trenckot.jpg"),
      promoLine: "Yeni sezon",
      discountLine: "Koleksiyonu keşfet",
      cta: "Alışverişe başla",
    },
    heroPromotions: [
      {
        id: "new-arrivals",
        image: TEMPLATE_ASSET("cat-parka.jpg"),
        promoLine: "Yeni gelenler",
        discountLine: "Sezonun parçaları",
        cta: "Keşfet",
        target: "all",
      },
      {
        id: "sale",
        image: TEMPLATE_ASSET("cat-trenckot.jpg"),
        promoLine: "İndirimdekiler",
        discountLine: "Kampanyalı ürünler",
        cta: "İncele",
        target: "sale",
      },
      {
        id: "shipping",
        image: TEMPLATE_ASSET("cat-ceket.jpg"),
        promoLine: "Teslimat",
        discountLine: shippingLabel,
        cta: "Alışverişe başla",
        target: "all",
      },
    ],
    featuredPair: [
      {
        categoryId: "ust-giyim",
        label: "Üst Giyim",
        image: TEMPLATE_ASSET("cat-ceket.jpg"),
        cta: "Hemen keşfet",
      },
      {
        categoryId: "elbise",
        label: "Elbise",
        image: TEMPLATE_ASSET("cat-parka.jpg"),
        cta: "Hemen keşfet",
      },
    ],
    categoryTiles: [
      {
        categoryId: "alt-giyim",
        label: "Alt Giyim",
        image: TEMPLATE_ASSET("cat-jean.jpg"),
        cta: "Ürünleri incele",
      },
      {
        categoryId: "dis-giyim",
        label: "Dış Giyim",
        image: TEMPLATE_ASSET("cat-trenckot.jpg"),
        cta: "Ürünleri incele",
      },
      {
        categoryId: "aksesuar",
        label: "Aksesuar",
        image: TEMPLATE_ASSET("ig-2.jpg"),
        cta: "Ürünleri incele",
      },
    ],
    highlight: {
      body: `Kategorilerden seç — ${boutique.name} koleksiyonunu keşfet.`,
      cta: "Tüm ürünler",
    },
    instagram: {
      title: "Bizi Instagram'da takip et!",
      handle,
      images: [
        TEMPLATE_ASSET("ig-1.jpg"),
        TEMPLATE_ASSET("ig-2.jpg"),
        TEMPLATE_ASSET("ig-3.jpg"),
        TEMPLATE_ASSET("ig-4.jpg"),
        TEMPLATE_ASSET("ig-5.jpg"),
      ],
    },
    usps: [
      { id: "secure", label: "Güvenli Alışveriş", icon: "secure" },
      { id: "customers", label: "Müşteri Memnuniyeti", icon: "customers" },
      { id: "shipping", label: shippingLabel, icon: "shipping" },
      { id: "payment", label: "Sipariş kaydı", icon: "payment" },
    ],
    footer: {
      newsletterTitle: "E-Bülten Kayıt",
      newsletterBody:
        "Yeni sezon ve özel fırsatlar için bizi takip edin.",
      newsletterPlaceholder: "E-posta adresinizi girin",
      newsletterCta: "Gönder",
      phone: phoneDisplay,
      email,
      columns: legalFooterColumns(boutique.slug),
    },
  };
}

export function getEditorialContent(
  boutique: TrBoutiquePublic,
): EditorialDemoContent {
  const defaults =
    boutique.slug === EDITORIAL_DEMO_SLUG
      ? (() => {
          const demo = getEditorialDemoContent();
          return {
            ...demo,
            footer: {
              ...demo.footer,
              columns: legalFooterColumns(boutique.slug),
            },
          };
        })()
      : buildBoutiqueEditorialDefaults(boutique);

  const merged = mergeEditorial(defaults, boutique.editorialContent);

  // Ensure structural sections survive partial DB overrides from older JSON shapes.
  const heroPromotions =
    Array.isArray(merged.heroPromotions) && merged.heroPromotions.length > 0
      ? merged.heroPromotions
      : defaults.heroPromotions;

  return {
    ...merged,
    promoBar: merged.promoBar ?? defaults.promoBar,
    categoryHero: {
      ...defaults.categoryHero,
      ...merged.categoryHero,
      discountLine:
        merged.categoryHero?.discountLine ??
        defaults.categoryHero.discountLine,
    },
    heroPromotions,
    featuredPair:
      merged.featuredPair?.length >= 2
        ? merged.featuredPair
        : defaults.featuredPair,
    categoryTiles:
      merged.categoryTiles?.length > 0
        ? merged.categoryTiles
        : defaults.categoryTiles,
  };
}

/** Prefer `heroPromotions`; fall back to legacy single `categoryHero` slide. */
export function resolveEditorialHeroPromotions(
  content: EditorialDemoContent,
): EditorialHeroPromotion[] {
  if (content.heroPromotions && content.heroPromotions.length > 0) {
    return content.heroPromotions;
  }
  return [
    {
      id: "legacy-hero",
      image: content.categoryHero.image,
      promoLine: content.categoryHero.promoLine,
      discountLine: content.categoryHero.discountLine,
      cta: content.categoryHero.cta,
      target: "sale",
    },
  ];
}

/** Sub text 1 for a campaign slide. */
export function resolveCampaignSubText(promo: EditorialHeroPromotion): string {
  return promo.subText?.trim() || promo.promoLine;
}

/** Large campaign title. */
export function resolveCampaignName(promo: EditorialHeroPromotion): string {
  return promo.campaignName?.trim() || promo.discountLine;
}

/** Bottom lines under the action grid. */
export function resolveCampaignSubText2(
  promo: EditorialHeroPromotion,
): string[] {
  if (!promo.subText2) return [];
  if (Array.isArray(promo.subText2)) {
    return promo.subText2.map((line) => line.trim()).filter(Boolean);
  }
  return promo.subText2
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function resolveCampaignActions(
  promo: EditorialHeroPromotion,
): Array<{ label: string; target: string }> {
  if (promo.actions && promo.actions.length > 0) {
    return promo.actions.slice(0, 4).map((action) => ({
      label: action.label,
      target: action.target?.trim() || "all",
    }));
  }
  return [
    {
      label: promo.cta,
      target: promo.target?.trim() || "sale",
    },
  ];
}

export function isCampaignHeroTemplate(
  promo: EditorialHeroPromotion,
): boolean {
  if (promo.template === "campaign") return true;
  if (promo.template === "classic" || promo.template === "brand") return false;
  return Boolean(promo.actions && promo.actions.length > 0);
}

export function isBrandHeroTemplate(
  promo: EditorialHeroPromotion,
): boolean {
  return promo.template === "brand";
}
