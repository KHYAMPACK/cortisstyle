/**
 * Resolve editorial homepage/footer content for a boutique.
 * Code defaults (Maya demo or brand-derived) + optional DB `editorial_content` merge.
 */

import {
  EDITORIAL_DEMO_SLUG,
  getEditorialDemoContent,
  type EditorialDemoContent,
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
  >,
): EditorialDemoContent {
  const phoneDisplay = boutique.whatsappPhone
    ? formatPhoneDisplay(boutique.whatsappPhone)
    : "İletişim yakında";
  const email =
    boutique.slug === "pervinsoysalbutik"
      ? "info@pervinsoysal.com"
      : "info@cortisstyle.com";
  const handle = boutique.instagramHandle?.replace(/^@/, "") ?? boutique.slug;

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
      text: "Seçili ürünlerde %50'ye varan indirim",
      cta: "Alışverişe başla",
    },
    categoryHero: {
      image: TEMPLATE_ASSET("cat-trenckot.jpg"),
      promoLine: "Seçili ürünlerde",
      discountLine: "%50'ye varan indirim",
      cta: "Alışverişe başla",
    },
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
      { id: "shipping", label: "Ücretsiz / Hızlı Kargo", icon: "shipping" },
      { id: "payment", label: "Güvenli Ödeme", icon: "payment" },
    ],
    footer: {
      newsletterTitle: "E-Bülten Kayıt",
      newsletterBody:
        "Yeni sezon ve özel fırsatlar için bültenimize kayıt olun.",
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
