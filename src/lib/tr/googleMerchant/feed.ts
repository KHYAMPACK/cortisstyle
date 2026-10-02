/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 * Hosted URL → Merchant scheduled fetch for automatic catalog sync.
 */

import { resolveBoutiqueBrandLabel } from "@/lib/tr/boutiqueBrand";
import { storesDomainFromEnv } from "@/lib/tr/customDomain";
import { getProductCoverImageFor, getStorefrontGalleryImages } from "@/lib/tr/productImages";
import { trBoutiquePath } from "@/lib/tr/paths";
import { canonicalStoreHost } from "@/lib/tr/seo/storeAddress";
import {
  absoluteUrl,
  boutiqueCustomerPath,
  boutiqueProductPlatformPath,
} from "@/lib/tr/seo/storefrontSeo";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import { siteLegal } from "@/lib/siteLegal";
import {
  publicVariantLabel,
  valueParam,
  type TrPublicVariants,
} from "@/lib/tr/variants/storefront";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

export type GoogleMerchantFeedItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: "in_stock" | "out_of_stock";
  price: string;
  salePrice: string | null;
  condition: "new" | "refurbished" | "used";
  brand: string;
  color: string | null;
  size: string | null;
  productType: string | null;
  /** The product id, on each item of a product sold as variants. */
  itemGroupId: string | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Google price format: `123.45 TRY` (dot decimal). */
export function formatGoogleMerchantPrice(kurus: number): string {
  const safe = Math.max(0, Math.round(kurus));
  const lira = (safe / 100).toFixed(2);
  return `${lira} TRY`;
}

function absolutizeAssetUrl(src: string, assetOrigin: string): string {
  const trimmed = src.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return absoluteUrl(assetOrigin, trimmed);
}

function resolveCatalogUnits(product: TrProduct): number {
  const sized = sumSizeStocks(product.sizeStocks);
  if (Object.keys(product.sizeStocks).length > 0) return sized;
  return Math.max(0, product.stock);
}

function mapCondition(
  label: string | null | undefined,
): GoogleMerchantFeedItem["condition"] {
  const raw = label?.trim().toLowerCase() ?? "";
  if (!raw) return "new";
  if (raw.includes("yenilen") || raw.includes("refurb")) return "refurbished";
  if (
    raw.includes("ikinci") ||
    raw.includes("2.") ||
    raw.includes("kullanılmış") ||
    raw.includes("used")
  ) {
    return "used";
  }
  return "new";
}

/**
 * Public storefront origin for product `link`s: the boutique's canonical host (its
 * custom domain, else its default subdomain once `TR_STORES_DOMAIN` is set) so Google
 * always sees the real address even when the feed itself is fetched via the platform
 * mirror. Falls back to platform `/tr/{slug}` when neither exists yet.
 */
export function resolveMerchantStoreOrigin(
  boutique: Pick<TrBoutiquePublic, "slug" | "customDomain">,
  requestOrigin: string,
): { origin: string; mode: "boutique-domain" | "platform" } {
  const host = canonicalStoreHost({
    slug: boutique.slug,
    customDomain: boutique.customDomain,
    storesDomain: storesDomainFromEnv(),
  });
  if (host) return { origin: `https://${host}`, mode: "boutique-domain" };
  return { origin: requestOrigin, mode: "platform" };
}

export function buildGoogleMerchantFeedItems(input: {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
  requestOrigin: string;
  /** Slug and noindex per product id (`listProductSlugInfo`); products not in it use their id. */
  slugInfo?: ReadonlyMap<string, { slug: string | null; noindex: boolean }>;
  /** Variants per product id (`loadPublicVariantsForProducts`): one item per variant. */
  variants?: ReadonlyMap<string, TrPublicVariants>;
}): GoogleMerchantFeedItem[] {
  const { boutique, products, requestOrigin, slugInfo, variants } = input;
  const { origin, mode } = resolveMerchantStoreOrigin(boutique, requestOrigin);
  const assetOrigin = siteLegal.siteUrl;
  const brand = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);

  const items: GoogleMerchantFeedItem[] = [];

  for (const product of products) {
    if (product.status !== "available") continue;
    const info = slugInfo?.get(product.id);
    // Merchant Center needs a crawlable landing page.
    if (info?.noindex) continue;

    const cover = getProductCoverImageFor("boutique", product);
    if (!cover) continue;

    const imageLink = absolutizeAssetUrl(cover, assetOrigin);
    if (!imageLink) continue;

    const platformPath = boutiqueProductPlatformPath(
      boutique.slug,
      info?.slug ?? product.id,
    );
    const link = absoluteUrl(
      origin,
      boutiqueCustomerPath(boutique.slug, platformPath, mode),
    );

    const units = resolveCatalogUnits(product);
    const title = product.title.trim();
    if (!title) continue;

    const description = stripHtml(
      product.description?.trim() ||
        `${title} — ${brand}. Türkiye'den online butik.`,
    ).slice(0, 5000);

    const compareAt = product.compareAtPriceKurus;
    const onSale =
      typeof compareAt === "number" &&
      compareAt > product.priceKurus &&
      product.priceKurus > 0;

    const additionalImageLinks = getStorefrontGalleryImages(product)
      .map((src) => absolutizeAssetUrl(src, assetOrigin))
      .filter((src) => src && src !== imageLink)
      .slice(0, 10);

    const colors = product.colors
      .map((c) => c.name.trim())
      .filter(Boolean)
      .join("/");
    const sizes = product.sizes.map((s) => s.trim()).filter(Boolean).join("/");

    const variantData = variants?.get(product.id);
    if (variantData) {
      items.push(
        ...variantFeedItems({
          data: variantData,
          productId: product.id,
          title: title.slice(0, 150),
          description: description || title,
          link,
          productImages: [imageLink, ...additionalImageLinks],
          assetOrigin,
          condition: mapCondition(product.conditionLabel),
          brand,
          productType: product.category?.trim() || null,
        }),
      );
      continue;
    }
    // A Gelişmiş ürün sells only as one of its variants.
    if (product.productType === "advanced") continue;

    items.push({
      id: product.id,
      title: title.slice(0, 150),
      description: description || title,
      link,
      imageLink,
      additionalImageLinks,
      availability: units > 0 ? "in_stock" : "out_of_stock",
      price: formatGoogleMerchantPrice(
        onSale ? compareAt! : product.priceKurus,
      ),
      salePrice: onSale
        ? formatGoogleMerchantPrice(product.priceKurus)
        : null,
      condition: mapCondition(product.conditionLabel),
      brand,
      color: colors || null,
      size: sizes || null,
      productType: product.category?.trim() || null,
      itemGroupId: null,
    });
  }

  return items;
}

/**
 * A product sold as variants: one item per active variant, grouped by the product id.
 * The variant id is the item id (a uuid fits Google's 50 characters); the link opens
 * the variant's colour (`?renk=`) and its own photos lead when it has any.
 */
function variantFeedItems(input: {
  data: TrPublicVariants;
  productId: string;
  title: string;
  description: string;
  link: string;
  productImages: string[];
  assetOrigin: string;
  condition: GoogleMerchantFeedItem["condition"];
  brand: string;
  productType: string | null;
}): GoogleMerchantFeedItem[] {
  const { data } = input;
  const colorIndex = data.options.findIndex((option) => option.role === "color");
  const sizeIndex = data.options.findIndex((option) => option.role === "size");
  const labels = new Map(
    data.options.flatMap((option) => option.values.map((value) => [value.id, value.label])),
  );
  return data.variants.map((variant) => {
    const color = colorIndex >= 0 ? (labels.get(variant.optionValueIds[colorIndex]!) ?? null) : null;
    const size = sizeIndex >= 0 ? (labels.get(variant.optionValueIds[sizeIndex]!) ?? null) : null;
    const own = variant.images
      .map((src) => absolutizeAssetUrl(src, input.assetOrigin))
      .filter(Boolean);
    const images = own.length > 0 ? own : input.productImages;
    const label = publicVariantLabel(data, variant);
    const onSale =
      variant.compareAtPriceKurus != null && variant.compareAtPriceKurus > variant.priceKurus;
    const link = color
      ? `${input.link}${input.link.includes("?") ? "&" : "?"}renk=${encodeURIComponent(valueParam(color))}`
      : input.link;
    return {
      id: variant.id,
      title: (label ? `${input.title} - ${label}` : input.title).slice(0, 150),
      description: input.description,
      link,
      imageLink: images[0]!,
      additionalImageLinks: images.slice(1, 11),
      availability: variant.stock > 0 ? "in_stock" : "out_of_stock",
      price: formatGoogleMerchantPrice(onSale ? variant.compareAtPriceKurus! : variant.priceKurus),
      salePrice: onSale ? formatGoogleMerchantPrice(variant.priceKurus) : null,
      condition: input.condition,
      brand: input.brand,
      color,
      size,
      productType: input.productType,
      itemGroupId: input.productId,
    };
  });
}

function gTag(name: string, value: string): string {
  return `<g:${name}>${escapeXml(value)}</g:${name}>`;
}

export function renderGoogleMerchantRssXml(input: {
  boutique: TrBoutiquePublic;
  items: GoogleMerchantFeedItem[];
  requestOrigin: string;
}): string {
  const { boutique, items, requestOrigin } = input;
  const { origin, mode } = resolveMerchantStoreOrigin(boutique, requestOrigin);
  const brand = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const homeLink = absoluteUrl(
    origin,
    boutiqueCustomerPath(boutique.slug, trBoutiquePath(boutique.slug), mode),
  );

  const itemXml = items
    .map((item) => {
      const lines = [
        gTag("id", item.id),
        ...(item.itemGroupId ? [gTag("item_group_id", item.itemGroupId)] : []),
        gTag("title", item.title),
        gTag("description", item.description),
        gTag("link", item.link),
        gTag("image_link", item.imageLink),
        ...item.additionalImageLinks.map((url) =>
          gTag("additional_image_link", url),
        ),
        gTag("availability", item.availability),
        gTag("price", item.price),
        ...(item.salePrice ? [gTag("sale_price", item.salePrice)] : []),
        gTag("condition", item.condition),
        gTag("brand", item.brand),
        gTag("identifier_exists", "false"),
        ...(item.color ? [gTag("color", item.color)] : []),
        ...(item.size ? [gTag("size", item.size)] : []),
        ...(item.productType ? [gTag("product_type", item.productType)] : []),
      ];
      return `    <item>\n      ${lines.join("\n      ")}\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(brand)}</title>
    <link>${escapeXml(homeLink)}</link>
    <description>${escapeXml(`${brand} — Google Merchant ürün dosyası`)}</description>
${itemXml}
  </channel>
</rss>
`;
}
