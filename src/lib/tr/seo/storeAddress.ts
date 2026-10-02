import { siteLegal } from "@/lib/platform/siteLegal";
import { subdomainSlugOf } from "@/lib/tr/customDomain";
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

/**
 * Store URLs (planned, docs/product-upload-foundation-plan.md): the three shapes a
 * storefront request's host can be, and which host a boutique should permanently
 * redirect stray variants to. Pure decision logic only — nothing below is called from
 * `proxy.ts`, `sitemap.ts`, `robots.ts` or the Google feed yet; wiring them in (and
 * folding `storeAddress()`'s two-mode world into this three-mode one) is a later step
 * of that milestone. Until `TR_STORES_DOMAIN` is set, every function here behaves
 * exactly like today: a boutique without a custom domain has no canonical redirect.
 */

export type StoreHostKind =
  /** `www.cortisstyle.com` serving `/tr/<slug>/…` — today's only address for a boutique
   *  without a custom domain, soon a redirect source for every boutique. */
  | { kind: "platform" }
  /** `<slug>.<TR_STORES_DOMAIN>` — a boutique's default address. */
  | { kind: "subdomain"; slug: string }
  /** A boutique's own `custom_domain` (or its `www.` variant). */
  | { kind: "custom-domain"; slug: string; hostWasWww: boolean };

/**
 * Classifies a request host. Shape-level only: a "subdomain" or "custom-domain" result is
 * not proof a boutique with that slug exists — the caller checks that separately (and 404s
 * an unknown subdomain rather than falling through to platform routing).
 *
 * `customDomainSlug` is whatever the existing DB/env custom-domain lookup
 * (`resolveBoutiqueSlugFromHostAtEdge`) already resolved for this host, if anything — this
 * function does no I/O of its own.
 */
export function resolveStoreHostKind(input: {
  host: string;
  storesDomain: string | null;
  customDomainSlug: string | null;
}): StoreHostKind {
  if (input.customDomainSlug) {
    const host = input.host.trim().toLowerCase();
    return {
      kind: "custom-domain",
      slug: input.customDomainSlug,
      hostWasWww: host.startsWith("www."),
    };
  }
  const subdomainSlug = subdomainSlugOf(input.host, input.storesDomain);
  if (subdomainSlug) return { kind: "subdomain", slug: subdomainSlug };
  return { kind: "platform" };
}

/**
 * A boutique's canonical host: its custom domain if connected, else its default
 * subdomain, else null — nothing canonical exists yet (no `TR_STORES_DOMAIN` and no
 * custom domain), so the boutique is still only reachable via the platform path.
 */
export function canonicalStoreHost(input: {
  slug: string;
  customDomain: string | null;
  storesDomain: string | null;
}): string | null {
  const domain = input.customDomain?.trim().toLowerCase().replace(/^www\./, "");
  // `.includes(".")` guards against a malformed value ("localhost", a typo) reaching a
  // redirect target — a real domain always has a dot.
  if (domain && domain.includes(".")) return domain;
  if (input.storesDomain) return `${input.slug}.${input.storesDomain}`;
  return null;
}

export interface StoreRedirectTarget {
  /** The canonical host to send the request to. */
  host: string;
  /** Clean-URL path on that host, e.g. "/urun/keten-gomlek" — the caller has already
   *  converted the request's path into this form (stripped `/tr/<slug>` for a platform
   *  request; a subdomain/custom-domain request's path is already clean). */
  path: string;
}

/**
 * Where a request should permanently redirect to instead, or null when it is already on
 * the canonical host (including "nothing canonical exists yet" — see `canonicalStoreHost`).
 */
export function resolveCanonicalRedirect(input: {
  hostKind: StoreHostKind;
  cleanPath: string;
  slug: string;
  customDomain: string | null;
  storesDomain: string | null;
}): StoreRedirectTarget | null {
  const target = (): StoreRedirectTarget | null => {
    const host = canonicalStoreHost(input);
    return host ? { host, path: input.cleanPath } : null;
  };

  if (input.hostKind.kind === "platform") return target();
  // The subdomain is canonical only until a custom domain is connected.
  if (input.hostKind.kind === "subdomain") {
    return input.customDomain ? target() : null;
  }
  // custom-domain kind: never redirected here, apex or www. Which of the two is primary
  // is the hosting's domain setting (Vercel sends the apex to www.); redirecting www. back
  // to the apex here looped with it (ERR_TOO_MANY_REDIRECTS, 2026-10-02).
  return null;
}
