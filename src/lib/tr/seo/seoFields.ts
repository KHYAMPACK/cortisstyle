/**
 * The per-page SEO overrides an owner can set (the shared SEO card). Everything is
 * optional; an empty object means "use the defaults" (the page's own name and
 * description). Stored as jsonb next to a real `slug` column.
 */
export interface TrSeo {
  /** Page title shown in search results. */
  title?: string;
  /** Meta description. */
  description?: string;
  /** Ask search engines not to index the page. */
  noindex?: boolean;
  /** Canonical path on the store's own address, e.g. "/urun/keten-gomlek". */
  canonical?: string;
}

export const SEO_LIMITS = {
  title: 256,
  description: 320,
  canonical: 500,
} as const;

/**
 * A canonical *path*: starts with one "/", no spaces, no scheme or host. The card
 * shows the leading "/" as a fixed prefix, so `normalizeCanonicalInput` takes what
 * the owner typed after it.
 */
export function normalizeCanonicalInput(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/^\/+/, "").slice(0, SEO_LIMITS.canonical - 1);
}

export function isValidCanonicalPath(value: string): boolean {
  return (
    value.length > 1 &&
    value.length <= SEO_LIMITS.canonical &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/\s/.test(value)
  );
}

/** Whatever the client sent → a clean `TrSeo`. Unknown keys and empty values are dropped. */
export function sanitizeSeo(value: unknown): TrSeo {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const seo: TrSeo = {};

  const title =
    typeof record.title === "string"
      ? record.title.trim().slice(0, SEO_LIMITS.title)
      : "";
  if (title) seo.title = title;

  const description =
    typeof record.description === "string"
      ? record.description.trim().slice(0, SEO_LIMITS.description)
      : "";
  if (description) seo.description = description;

  if (record.noindex === true) seo.noindex = true;

  const canonical =
    typeof record.canonical === "string" ? record.canonical.trim() : "";
  if (isValidCanonicalPath(canonical)) seo.canonical = canonical;

  return seo;
}

export function isSeoEmpty(seo: TrSeo): boolean {
  return Object.keys(seo).length === 0;
}
