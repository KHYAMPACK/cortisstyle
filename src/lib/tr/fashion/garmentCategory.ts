import type { TrCategory, TrProductCategories } from "@/lib/tr/categories/types";
import { getTrCategoryDefinition } from "@/lib/tr/fashion/categories";

/**
 * Fashion logic (dress construction, üst/alt giyim rules, takım, care copy, AI) speaks
 * the built-in garment ids (`elbise`, `bluz`, `takim`…). A boutique on its own categories
 * stores its own slugs instead, so this module translates between the two through the
 * categories' system keys, set when the built-in tree was imported:
 *
 * - `garmentCategoryFor`: a product's category slug → the built-in id fashion logic
 *   should use. A category is what its own key says, else what its nearest keyed
 *   ancestor says (an owner-made "Abiye" under the imported "Elbise" is a dress). A
 *   renamed category keeps its key, so it keeps working.
 * - `categoryForGarmentKey`: a built-in id (from AI or a fixed flow like takım) → the
 *   boutique's category carrying that key.
 *
 * `categories = null` is a boutique on the built-in tree: slugs already are built-in ids.
 */
type CategoryLike = Pick<TrCategory, "id" | "parentId" | "slug" | "systemKey">;

function isGarmentKey(key: string | null): key is string {
  return Boolean(key && getTrCategoryDefinition(key));
}

export function garmentCategoryFor(
  slug: string | null,
  categories: readonly CategoryLike[] | null,
): string | null {
  const trimmed = slug?.trim() || null;
  if (!trimmed || !categories) return trimmed;
  const byId = new Map(categories.map((category) => [category.id, category]));
  let current = categories.find((category) => category.slug === trimmed);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (isGarmentKey(current.systemKey)) return current.systemKey;
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trimmed;
}

export function categoryForGarmentKey<T extends CategoryLike>(
  key: string | null,
  categories: readonly T[],
): T | null {
  if (!key) return null;
  return categories.find((category) => category.systemKey === key) ?? null;
}

/** The primary category's slug (what `tr_products.category` holds), or null. */
export function primaryCategorySlug(
  value: TrProductCategories,
  categories: readonly CategoryLike[],
): string | null {
  const primary = categories.find((category) => category.id === value.primaryId);
  return primary?.slug ?? null;
}

/** A product's categories with the category keyed `key` made primary (added if missing). */
export function withGarmentKeyPrimary(
  value: TrProductCategories,
  key: string | null,
  categories: readonly CategoryLike[],
): TrProductCategories {
  const target = categoryForGarmentKey(key, categories);
  if (!target) return value;
  const ids = value.ids.includes(target.id) ? value.ids : [...value.ids, target.id];
  return { ids, primaryId: target.id };
}

/**
 * A create flow's category for the API. The create flows (wizard, batch, takım) still
 * choose a built-in garment id; for a boutique on its own categories it is filed under
 * the category carrying that key. If the boutique has no such category (it deleted it),
 * only the plain category column is set and the owner can file it in the editor.
 */
export function categoryPayloadForGarment(
  garmentId: string | null,
  categories: readonly CategoryLike[] | null,
): { category: string | null; categories?: TrProductCategories } {
  if (!categories) return { category: garmentId };
  const target = categoryForGarmentKey(garmentId, categories);
  if (!target) return { category: garmentId };
  return {
    category: target.slug,
    categories: { ids: [target.id], primaryId: target.id },
  };
}
