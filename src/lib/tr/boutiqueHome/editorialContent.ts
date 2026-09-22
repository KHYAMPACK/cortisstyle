/**
 * Resolve editorial homepage/footer content for a boutique.
 * Brand-derived code defaults + optional DB `editorial_content` merge.
 */

import { resolveBoutiqueContactEmail } from "@/lib/tr/checkoutMode";
import {
  type EditorialCampaignAction,
  type EditorialDemoContent,
  type EditorialHeroPromotion,
  type EditorialNavItem,
  type EditorialTwinStory,
} from "@/lib/tr/boutiqueHome/editorialDemoContent";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome/editorialSkin";
import { listTrCategoryRoots } from "@/lib/tr/fashion/categories";
import { getStorefrontGalleryImages } from "@/lib/tr/catalog/productImages";
import {
  foldTrCatalogText,
  isMidiJeanElbiseProduct,
  midiJeanCatalogText,
} from "@/lib/tr/catalog/midiJeanTwins";
import { liveShippingHomeBody } from "@/lib/tr/catalog/pdpReturns";
import { trBoutiqueLegalPath, trBoutiquePath, trBoutiqueProductPath } from "@/lib/tr/paths";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

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
        { label: "Hakkımızda", href: legal("kunye") },
        { label: "Künye / İletişim", href: legal("kunye") },
        { label: "KVKK Aydınlatma", href: legal("kvkk") },
        { label: "Gizlilik Sözleşmesi", href: legal("gizlilik") },
        { label: "Site Kullanım Şartları / Üyelik", href: legal("uyelik") },
        { label: "Çerez Politikası", href: legal("cerez") },
      ],
    },
    {
      title: "Sözleşmeler",
      links: [
        { label: "Mesafeli Satış Sözleşmesi", href: legal("mesafeli-satis") },
        { label: "Ön Bilgilendirme", href: legal("on-bilgilendirme") },
        { label: "Tüketici Hakları / İade", href: legal("iade") },
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
    | "contactEmail"
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
      { id: "ust", label: "Üst giyim", categoryId: "ust-giyim" },
      { id: "alt", label: "Alt giyim", categoryId: "alt-giyim" },
      { id: "aksesuar", label: "Aksesuar", categoryId: "aksesuar" },
      { id: "dis", label: "Dış giyim", categoryId: "dis-giyim" },
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
        label: "Üst giyim",
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
        label: "Alt giyim",
        image: TEMPLATE_ASSET("cat-jean.jpg"),
        cta: "Ürünleri incele",
      },
      {
        categoryId: "dis-giyim",
        label: "Dış giyim",
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
  const defaults = buildBoutiqueEditorialDefaults(boutique);

  const merged = mergeEditorial(defaults, boutique.editorialContent);

  // Ensure structural sections survive partial DB overrides from older JSON shapes.
  const mergedHeroPromotions =
    Array.isArray(merged.heroPromotions) && merged.heroPromotions.length > 0
      ? merged.heroPromotions
      : defaults.heroPromotions;

  // Atelier nav + hero CTA packs + shop category row are taxonomy-owned (avoids DB drift).
  const atelier = isAtelierEditorialSkin(boutique.slug);
  const nav = atelier ? buildAtelierTaxonomyNav() : merged.nav;
  const heroPromotions = atelier
    ? buildAtelierHeroPromotions(
        boutique.themeAccent?.trim() || "#9B7EBD",
        mergedHeroPromotions,
      )
    : mergedHeroPromotions;
  const shopCategories = atelier
    ? buildAtelierShopCategories(boutique.slug)
    : merged.shopCategories;
  const trends = atelier
    ? buildAtelierTrends(boutique.slug)
    : merged.trends;

  return {
    ...merged,
    nav,
    shopCategories,
    trends,
    // Contact email is brand/config-owned — do not keep stale DB footer.email.
    footer: {
      ...merged.footer,
      email: resolveBoutiqueContactEmail(boutique),
      // Legal link columns are code-owned (Kurumsal + Sözleşmeler).
      columns: legalFooterColumns(boutique.slug),
    },
    shopByCategoryTitle: atelier
      ? merged.shopByCategoryTitle?.trim() || "Kategorilere göz atın"
      : merged.shopByCategoryTitle,
    promoBar: merged.promoBar ?? defaults.promoBar,
    infoStrip: atelier
      ? applyAtelierShippingInfoStrip(boutique.slug, merged.infoStrip)
      : merged.infoStrip,
    categoryHero: {
      ...defaults.categoryHero,
      ...merged.categoryHero,
      discountLine:
        merged.categoryHero?.discountLine ??
        defaults.categoryHero.discountLine,
    },
    heroPromotions,
    featuredPair: atelier
      ? buildAtelierFeaturedPair(boutique.slug)
      : merged.featuredPair?.length >= 2
        ? merged.featuredPair
        : defaults.featuredPair,
    categoryTiles: atelier
      ? buildAtelierCategoryTiles(boutique.slug)
      : merged.categoryTiles?.length > 0
        ? merged.categoryTiles
        : defaults.categoryTiles,
    midCampaign: atelier
      ? {
          eyebrow: "Seçili parçalar",
          title: "Yeni sezon şimdi Lila’da",
          cta: "Alışverişe başla",
          target: "all",
          ...merged.midCampaign,
          image: atelierHomeImage(boutique.slug, "mid-campaign"),
        }
      : merged.midCampaign,
    join: atelier
      ? {
          eyebrow: "Üyelik",
          title: `${boutique.name} ailesi`,
          body: "Üye olun; siparişlerinizi takip edin, favorilerinizi saklayın ve kampanyalardan haberdar olun.",
          primaryCta: "Üye ol / Giriş",
          secondaryCta: "Alışverişe devam",
          benefits: [
            { id: "fav", label: "Favori listesi", icon: "heart" as const },
            { id: "order", label: "Sipariş takibi", icon: "shipping" as const },
            {
              id: "promo",
              label: "Kampanya bilgilendirme",
              icon: "promo" as const,
            },
            { id: "support", label: "WhatsApp destek", icon: "support" as const },
          ],
          ...merged.join,
          ...(boutique.slug === "lilabutik"
            ? { title: "Lila Boutique Ailesine Katılın" }
            : {}),
          image: atelierHomeImage(boutique.slug, "join-club"),
        }
      : merged.join,
    twinStory: atelier ? buildAtelierTwinStory() : undefined,
  };
}

function applyAtelierShippingInfoStrip(
  slug: string,
  strip: EditorialDemoContent["infoStrip"],
): EditorialDemoContent["infoStrip"] {
  if (!boutiqueHasLiveShipping(slug)) return strip;
  const shippingBody = liveShippingHomeBody();
  if (!strip || strip.length === 0) {
    return [
      {
        id: "returns",
        title: "Kolay iade",
        body: "Yasal süre içinde cayma ve iade taleplerinizi WhatsApp’tan iletebilirsiniz.",
        icon: "returns",
      },
      {
        id: "shipping",
        title: "Kargo",
        body: shippingBody,
        icon: "shipping",
      },
      {
        id: "exchange",
        title: "Değişim",
        body: "Beden veya model değişimi için bize yazın — yardımcı olalım.",
        icon: "exchange",
      },
    ];
  }
  return strip.map((item) =>
    item.id === "shipping" || item.icon === "shipping"
      ? { ...item, body: shippingBody }
      : item,
  );
}

function atelierHomeImage(
  slug: string,
  name: "mid-campaign" | "join-club",
): string {
  return `/tr/boutiques/${slug}/home/${name}.jpg`;
}

/** Yeni + taxonomy roots + İndirim — single source for atelier storefronts. */
function buildAtelierTaxonomyNav(): EditorialNavItem[] {
  return [
    { id: "new", label: "Yeni", categoryId: null },
    ...listTrCategoryRoots().map((root) => ({
      id: root.id,
      label: root.label,
      categoryId: root.id,
    })),
    {
      id: "sale",
      label: "İndirim",
      categoryId: "sale",
      accent: "sale" as const,
    },
  ];
}

/** Category photo path under public/tr/boutiques/{slug}/categories/. */
function atelierCategoryImage(slug: string, categoryId: string): string {
  // v=2 busts stale DB / CDN placeholders that pointed at wrong stock art.
  return `/tr/boutiques/${encodeURIComponent(slug)}/categories/${encodeURIComponent(categoryId)}.jpg?v=2`;
}

/** Homepage “Kategorilere göz atın” row — taxonomy roots only. */
function buildAtelierShopCategories(slug: string) {
  return listTrCategoryRoots().map((root) => ({
    categoryId: root.id,
    label: root.label,
    image: atelierCategoryImage(slug, root.id),
  }));
}

/** Lila twin color story — copy-owned; catalog fills image/href. */
function buildAtelierTwinStory(): EditorialTwinStory {
  return {
    title: "Aynı kalıp. İki karakter.",
    question: "Hangisi senin?",
    promo: "Bu elbise · Kargo ücretsiz",
    sides: [
      {
        id: "espresso",
        label: "Espresso",
        line: "Sıcak. Kahve. Sonbahar.",
        tone: "#3D2A22",
      },
      {
        id: "navy",
        label: "Navy",
        line: "Lacivert. Klas. Her gün.",
        tone: "#152036",
        imageShiftY: "0%",
      },
    ],
  };
}

const TWIN_SIDE_TOKENS: Record<string, string[]> = {
  espresso: ["espresso"],
  navy: ["navy", "lacivert"],
};

function matchesTwinTokens(product: TrProduct, tokens: string[]): boolean {
  const text = midiJeanCatalogText(product);
  return tokens.some((token) => text.includes(foldTrCatalogText(token)));
}

function findMidiJeanTwin(
  products: TrProduct[],
  tokens: string[],
): TrProduct | undefined {
  return products.find(
    (product) =>
      isMidiJeanElbiseProduct(product) && matchesTwinTokens(product, tokens),
  );
}

function siblingTwin(
  product: TrProduct | undefined,
  products: TrProduct[],
): TrProduct | undefined {
  const ids = product?.features.colorSiblingIds;
  if (!product || !ids?.length) return undefined;
  return products.find(
    (row) =>
      row.id !== product.id &&
      ids.includes(row.id) &&
      isMidiJeanElbiseProduct(row),
  );
}

function bindTwinSide(
  side: EditorialTwinStory["sides"][number],
  boutiqueSlug: string,
  product: TrProduct | undefined,
): EditorialTwinStory["sides"][number] {
  if (!product) return side;
  const image = getStorefrontGalleryImages(product)[0]?.trim();
  return {
    ...side,
    href: trBoutiqueProductPath(boutiqueSlug, product.id),
    ...(image ? { image } : {}),
  };
}

/** Attach live Midi Jean Elbise twins (Espresso / Navy) when they are in catalog. */
export function resolveAtelierTwinStory(
  story: EditorialTwinStory,
  boutiqueSlug: string,
  products: TrProduct[],
): EditorialTwinStory {
  const espressoTokens = TWIN_SIDE_TOKENS.espresso;
  const navyTokens = TWIN_SIDE_TOKENS.navy;
  let espresso = findMidiJeanTwin(products, espressoTokens);
  let navy = findMidiJeanTwin(products, navyTokens);
  if (!navy) navy = siblingTwin(espresso, products);
  if (!espresso) espresso = siblingTwin(navy, products);

  return {
    ...story,
    sides: [
      bindTwinSide(story.sides[0], boutiqueSlug, espresso),
      bindTwinSide(story.sides[1], boutiqueSlug, navy),
    ],
  };
}

function buildAtelierFeaturedPair(slug: string) {
  const roots = listTrCategoryRoots();
  const first = roots[0];
  const second = roots[1];
  if (!first || !second) return [];
  return [
    {
      categoryId: first.id,
      label: first.label,
      image: atelierCategoryImage(slug, first.id),
      cta: "Keşfet",
    },
    {
      categoryId: second.id,
      label: second.label,
      image: atelierCategoryImage(slug, second.id),
      cta: "Keşfet",
    },
  ];
}

function buildAtelierCategoryTiles(slug: string) {
  return listTrCategoryRoots()
    .slice(2)
    .map((root) => ({
      categoryId: root.id,
      label: root.label,
      image: atelierCategoryImage(slug, root.id),
      cta: "İncele",
    }));
}

/** Homepage trends 2×2 — four campaigns including İndirim. */
function buildAtelierTrends(slug: string) {
  const base = `/tr/boutiques/${encodeURIComponent(slug)}/trends`;
  return {
    title: "Trendleri keşfedin",
    items: [
      {
        id: "trend-elbise",
        title: "Zarif elbiseler.",
        cta: "Elbiseleri incele",
        target: "elbise",
        image: `${base}/elbise.jpg?v=1`,
      },
      {
        id: "trend-ust",
        title: "Günlük üstler.",
        cta: "Üst giyimi incele",
        target: "ust-giyim",
        image: `${base}/ust-giyim.jpg?v=1`,
      },
      {
        id: "trend-aksesuar",
        title: "Aksesuarlar.",
        cta: "Aksesuarları incele",
        target: "aksesuar",
        image: `${base}/aksesuar.jpg?v=1`,
      },
      {
        id: "trend-indirim",
        title: "İndirimdekiler.",
        cta: "Fırsatları gör",
        target: "sale",
        image: `${base}/indirim.jpg?v=1`,
      },
    ],
  };
}

/**
 * Atelier hero pack: photo Keşfet + İndirimler (brand logo slide is prepended in UI).
 */
function buildAtelierHeroPromotions(
  _accent: string,
  _fromDb: EditorialHeroPromotion[] | undefined,
): EditorialHeroPromotion[] {
  const base = `/tr/boutiques/lilabutik/hero`;
  return [
    {
      id: "hero-kesfet",
      template: "classic",
      // Model is on the right — keep copy/CTAs on the left open side.
      contentAlign: "left",
      image: `${base}/kesfet.jpg?v=1`,
      subText: "Yeni sezon",
      campaignName: "Her anınıza şıklık katın",
      promoLine: "Yeni sezon",
      discountLine: "Her anınıza şıklık katın",
      cta: "Hemen gör",
      target: "all",
      actions: [
        { label: "Keşfet", target: "all" },
        { label: "Elbise", target: "elbise" },
      ],
    },
    {
      id: "hero-indirim",
      template: "classic",
      // Model is on the left — keep copy/CTAs on the right open side.
      contentAlign: "right",
      image: `${base}/indirim.jpg?v=1`,
      subText: "Seçili ürünlerde",
      campaignName: "İndirimler",
      promoLine: "Seçili ürünlerde",
      discountLine: "İndirimler",
      cta: "Fırsatları gör",
      target: "sale",
      actions: [
        { label: "İndirimdekiler", target: "sale" },
        { label: "Elbise", target: "elbise", indirim: true },
        { label: "Üst giyim", target: "ust-giyim", indirim: true },
      ],
    },
  ];
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
): Array<{ label: string; target: string; indirim?: boolean }> {
  const mapActions = (actions: EditorialCampaignAction[]) =>
    actions.slice(0, 6).map((action) => ({
      label: action.label,
      target: action.target?.trim() || "all",
      indirim: action.indirim === true,
    }));

  // Photo heroes with explicit CTAs — respect authoring (don't expand to taxonomy grid).
  if (
    promo.actions &&
    promo.actions.length > 0 &&
    (promo.template === "classic" ||
      promo.contentAlign === "left" ||
      promo.contentAlign === "right")
  ) {
    return mapActions(promo.actions);
  }

  // Sale / outlet solid campaigns → main taxonomy categories (unless already rich)
  if (isSaleOrientedCampaign(promo)) {
    const roots = new Set(listTrCategoryRoots().map((root) => root.id));
    const categoryHits =
      promo.actions?.filter((action) =>
        roots.has((action.target ?? "").trim()),
      ) ?? [];
    if (categoryHits.length >= 3) {
      return mapActions(promo.actions ?? []);
    }
    return mapActions(
      buildMainCategoryCampaignActions({
        shopAllLabel: "Tüm indirimler",
        shopAllTarget: "sale",
        indirim: true,
      }),
    );
  }

  if (promo.actions && promo.actions.length > 0) {
    return mapActions(promo.actions);
  }

  return [
    {
      label: promo.cta,
      target: promo.target?.trim() || "all",
    },
  ];
}

/** Taxonomy roots as hero / mega CTAs (Elbise · Üst · Alt · Aksesuar · Ev). */
export function buildMainCategoryCampaignActions(options?: {
  shopAllLabel?: string;
  shopAllTarget?: string;
  /** Apply `indirim=1` on category targets (sale hero / sale mega). */
  indirim?: boolean;
}): EditorialCampaignAction[] {
  const actions: EditorialCampaignAction[] = [];
  if (options?.shopAllLabel) {
    actions.push({
      label: options.shopAllLabel,
      target: options.shopAllTarget ?? "all",
    });
  }
  for (const root of listTrCategoryRoots()) {
    actions.push({
      label: root.label,
      target: root.id,
      indirim: options?.indirim === true,
    });
  }
  return actions;
}

function isSaleOrientedCampaign(promo: EditorialHeroPromotion): boolean {
  if (promo.target === "sale") return true;
  const id = promo.id?.toLocaleLowerCase("tr-TR") ?? "";
  if (id.includes("sale") || id.includes("indirim") || id.includes("outlet")) {
    return true;
  }
  const watermark = promo.watermark?.toLocaleLowerCase("tr-TR") ?? "";
  if (watermark.includes("indirim") || watermark.includes("outlet")) return true;
  const name = resolveCampaignName(promo).toLocaleLowerCase("tr-TR");
  return name.includes("indirim") || name.includes("outlet");
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
