import { siteLegal } from "@/lib/platform/siteLegal";
import {
  trBoutiqueCategoryPath,
  trBoutiquePath,
  trBoutiqueProductPath,
} from "@/lib/tr/paths";

/**
 * "What is this store's public address?" in one place.
 *
 * Today a store is either on its own custom domain (clean paths: `/urun/<x>`) or on
 * the platform host under `/tr/<slug>/…`. The planned "Store URLs" work (default
 * subdomain per store, one canonical host, redirects from every other variant — see
 * docs/product-upload-foundation-plan.md) only needs to change this file and the
 * proxy: SEO metadata, the SEO card's preview, the sitemap and the Google feed all
 * ask here instead of building URLs themselves.
 */
export interface StoreAddressInput {
  boutiqueSlug: string;
  /** `tr_boutiques.custom_domain`, e.g. "lilaboutiquedenizli.com". */
  customDomain?: string | null;
}

export type StoreAddressMode = "boutique-domain" | "platform";

export interface StoreAddress {
  mode: StoreAddressMode;
  host: string;
  /** `https://host`, no trailing slash. */
  origin: string;
}

function platformHost(): string {
  return new URL(siteLegal.siteUrl).host;
}

/** The store's canonical origin: its custom domain when it has one, else the platform. */
export function storeAddress(input: StoreAddressInput): StoreAddress {
  const domain = input.customDomain?.trim().toLowerCase().replace(/^www\./, "");
  if (domain) {
    return { mode: "boutique-domain", host: domain, origin: `https://${domain}` };
  }
  const host = platformHost();
  return { mode: "platform", host, origin: `https://${host}` };
}

/**
 * Path of a page on the store's address. On a custom domain the `/tr/{slug}`
 * prefix is not part of the URL.
 */
export function storeCustomerPath(
  boutiqueSlug: string,
  platformPath: string,
  mode: StoreAddressMode,
): string {
  if (mode === "platform") return platformPath;
  const prefix = trBoutiquePath(boutiqueSlug);
  if (platformPath === prefix) return "/";
  if (platformPath.startsWith(`${prefix}/`)) {
    return platformPath.slice(prefix.length) || "/";
  }
  return platformPath;
}

/** Path of a product on the store's address; `slugOrId` is the slug when it has one. */
export function storeProductPath(
  input: StoreAddressInput & { slugOrId: string },
): string {
  const { mode } = storeAddress(input);
  return storeCustomerPath(
    input.boutiqueSlug,
    trBoutiqueProductPath(input.boutiqueSlug, input.slugOrId),
    mode,
  );
}

/** Full URL of a product on the store's address. */
export function storeProductUrl(
  input: StoreAddressInput & { slugOrId: string },
): string {
  return `${storeAddress(input).origin}${storeProductPath(input)}`;
}

/**
 * Text before the slug in the SEO card, e.g. "lilaboutiquedenizli.com/urun/" —
 * what the owner sees to the left of the slug field and in the preview.
 */
export function storeProductUrlPrefix(input: StoreAddressInput): string {
  const { host } = storeAddress(input);
  const path = storeProductPath({ ...input, slugOrId: "" });
  return `${host}${path}`;
}

/** Path of a category page on the store's address. */
export function storeCategoryPath(
  input: StoreAddressInput & { categorySlug: string },
): string {
  const { mode } = storeAddress(input);
  return storeCustomerPath(
    input.boutiqueSlug,
    trBoutiqueCategoryPath(input.boutiqueSlug, input.categorySlug),
    mode,
  );
}

/** Full URL of a category page on the store's address. */
export function storeCategoryUrl(
  input: StoreAddressInput & { categorySlug: string },
): string {
  return `${storeAddress(input).origin}${storeCategoryPath(input)}`;
}

/** Text before the slug in a category's SEO card, e.g. "lilaboutiquedenizli.com/kategori/". */
export function storeCategoryUrlPrefix(input: StoreAddressInput): string {
  const { host } = storeAddress(input);
  return `${host}${storeCategoryPath({ ...input, categorySlug: "" })}`;
}
