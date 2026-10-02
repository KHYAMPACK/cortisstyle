import { valueParam } from "@/lib/tr/variants/storefront";

/**
 * Product addresses that moved, answered in `proxy` with a real 308 before the page
 * renders (the product page streams behind `loading.tsx`, so a redirect from the page
 * itself can only be a meta refresh). Two kinds: a slug the owner renamed, and a colour
 * merged into another product (F6), which opens that product in its colour. Pure.
 */

export interface ProductRedirect {
  /** The product's current address segment: its slug, else its id. */
  toParam: string;
  /** A merged colour: the colour to open (`?renk=`). */
  color: string | null;
}

/** Map key for a boutique's old product address segment. */
export function productRedirectKey(boutiqueSlug: string, param: string): string {
  return `${boutiqueSlug.trim().toLowerCase()}\n${param.trim()}`;
}

/**
 * The product page a request is for: `/urun/<param>` on a boutique's own host, or
 * `/tr/<slug>/urun/<param>` on the platform. `null` for any other path.
 */
export function productPagePath(
  pathname: string,
  hostBoutiqueSlug: string | null,
): { boutiqueSlug: string; param: string; prefix: string } | null {
  const match = hostBoutiqueSlug
    ? /^(\/urun\/)([^/]+)\/?$/.exec(pathname)
    : /^(\/tr\/([^/]+)\/urun\/)([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  try {
    if (hostBoutiqueSlug) {
      return { boutiqueSlug: hostBoutiqueSlug, param: decodeURIComponent(match[2]!), prefix: match[1]! };
    }
    return {
      boutiqueSlug: decodeURIComponent(match[2]!),
      param: decodeURIComponent(match[3]!),
      prefix: match[1]!,
    };
  } catch {
    return null;
  }
}

/**
 * Where to send the request: the same prefix with the product's current segment, the
 * request's own query kept, and `renk` set for a merged colour.
 */
export function productRedirectTarget(
  path: { prefix: string },
  redirect: ProductRedirect,
  search: string,
): { pathname: string; search: string } {
  const params = new URLSearchParams(search);
  if (redirect.color) params.set("renk", valueParam(redirect.color));
  const query = params.toString();
  return {
    pathname: `${path.prefix}${encodeURIComponent(redirect.toParam)}`,
    search: query ? `?${query}` : "",
  };
}

interface MapRows {
  boutiques: ReadonlyArray<{ id: string; slug: string }>;
  /** Products merged into another (`merged_into`), with the colour they became. */
  merged: ReadonlyArray<{ id: string; boutiqueId: string; slug: string | null; mergedInto: string; color: string | null }>;
  /** Old product slugs (`tr_slug_redirects`). */
  slugRedirects: ReadonlyArray<{ boutiqueId: string; oldSlug: string; productId: string }>;
  /** Current slug of each product a redirect points at. */
  currentSlugs: ReadonlyMap<string, string | null>;
}

/**
 * The redirect map from the rows: a merged product by its id (and old slug), and every
 * old slug. An old slug of a product that was later merged goes straight to the
 * product that took it in.
 */
export function buildProductRedirectMap(rows: MapRows): Map<string, ProductRedirect> {
  const slugById = new Map(rows.boutiques.map((row) => [row.id, row.slug]));
  const mergedById = new Map(rows.merged.map((row) => [row.id, row]));
  const map = new Map<string, ProductRedirect>();
  const current = (productId: string) => rows.currentSlugs.get(productId) || productId;

  for (const row of rows.merged) {
    const boutique = slugById.get(row.boutiqueId);
    if (!boutique) continue;
    const target = { toParam: current(row.mergedInto), color: row.color };
    map.set(productRedirectKey(boutique, row.id), target);
    if (row.slug) map.set(productRedirectKey(boutique, row.slug), target);
  }
  for (const row of rows.slugRedirects) {
    const boutique = slugById.get(row.boutiqueId);
    if (!boutique) continue;
    const key = productRedirectKey(boutique, row.oldSlug);
    if (map.has(key)) continue;
    const merged = mergedById.get(row.productId);
    map.set(
      key,
      merged
        ? { toParam: current(merged.mergedInto), color: merged.color }
        : { toParam: current(row.productId), color: null },
    );
  }
  // Never redirect a segment to itself.
  for (const [key, target] of map) {
    if (key.endsWith(`\n${target.toParam}`) && !target.color) map.delete(key);
  }
  return map;
}
