import { looksLikeUuid } from "@/lib/tr/seo/slug";

/**
 * What a product page should do with the last URL segment. A product is reachable
 * by its id (always) and, when the owner has set one, by its slug. A slug that used
 * to belong to a product redirects to its current address.
 */
export type ProductRouteResult<P> =
  | { kind: "found"; product: P }
  | { kind: "redirect"; toParam: string }
  | { kind: "missing" };

export interface ProductRouteDeps<P> {
  /** The public product with this id, already checked to belong to this store. */
  getById(id: string): Promise<P | null>;
  /** Id of this store's product that currently has this slug. */
  getIdBySlug(slug: string): Promise<string | null>;
  /** Id of the product that used to have this slug (`tr_slug_redirects`). */
  getRedirectedProductId(oldSlug: string): Promise<string | null>;
  /** The slug that product has now, if any. */
  getCurrentSlug(productId: string): Promise<string | null>;
}

export async function resolveProductParam<P>(
  param: string,
  deps: ProductRouteDeps<P>,
): Promise<ProductRouteResult<P>> {
  const value = param.trim();
  if (!value) return { kind: "missing" };

  if (looksLikeUuid(value)) {
    const product = await deps.getById(value);
    return product ? { kind: "found", product } : { kind: "missing" };
  }

  const productId = await deps.getIdBySlug(value);
  if (productId) {
    const product = await deps.getById(productId);
    return product ? { kind: "found", product } : { kind: "missing" };
  }

  const movedId = await deps.getRedirectedProductId(value);
  if (!movedId) return { kind: "missing" };
  const currentSlug = await deps.getCurrentSlug(movedId);
  return { kind: "redirect", toParam: currentSlug ?? movedId };
}
