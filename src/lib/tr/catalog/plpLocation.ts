/**
 * Where a product-list page lives. A category is part of the path (`…/kategori/elbise`),
 * not a query parameter; everything that only narrows the list (q, indirim, renk, beden,
 * fiyat, sira) stays in the query. `sale` is not a category: it means `indirim=1` on
 * `…/urunler`.
 *
 * Pure: works on whatever path the browser shows, so the same code serves a custom
 * domain (`/kategori/elbise`) and the platform address (`/tr/lilabutik/kategori/elbise`).
 */

const LIST_PATH = /\/(?:urunler|kategori\/[^/?#]+)\/?$/;

/** The path in front of `/urunler` or `/kategori/<slug>` ("" on a custom domain). */
export function plpPathPrefix(pathname: string): string {
  return pathname.replace(LIST_PATH, "");
}

/** The category a list page shows: the one in its path, else a legacy `?kategori=`. */
export function plpCategory(
  routeCategory: string | null | undefined,
  searchParams: { get(name: string): string | null },
): string | null {
  return routeCategory?.trim() || searchParams.get("kategori")?.trim() || null;
}

/**
 * The address after changing some list parameters. `patch.kategori` (when present) picks
 * the category: a slug moves to `…/kategori/<slug>`, `null` / `"sale"` to `…/urunler`.
 * Other keys set (or, with null / "", remove) query parameters.
 */
export function plpHref(input: {
  pathname: string;
  search: string;
  routeCategory: string | null | undefined;
  patch: Record<string, string | null>;
}): string {
  const params = new URLSearchParams(input.search);
  const current = plpCategory(input.routeCategory, params);
  params.delete("kategori");

  let category = "kategori" in input.patch ? input.patch.kategori : current;
  category = category?.trim() || null;
  for (const [key, value] of Object.entries(input.patch)) {
    if (key === "kategori") continue;
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
  if (category === "sale") {
    params.set("indirim", "1");
    category = null;
  }

  const prefix = plpPathPrefix(input.pathname);
  const path = category
    ? `${prefix}/kategori/${encodeURIComponent(category)}`
    : `${prefix}/urunler`;
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
