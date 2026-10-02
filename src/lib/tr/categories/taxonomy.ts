import type { TrCategory } from "@/lib/tr/categories/types";

/**
 * What the storefront needs from a boutique's categories: labels, the menu tree, and
 * "is this product in that category" (`customTaxonomy` below, built from the boutique's
 * `tr_categories`). Categories are addressed by their slug, which is what
 * `tr_products.category` holds.
 */
export interface TrTaxonomyCategory {
  id: string;
  label: string;
  parentId?: string | null;
}

export interface TrStorefrontTaxonomy {
  /** A category's label; unknown ids are humanized ("yeni-sezon" → "Yeni Sezon"). */
  label(id: string | null | undefined): string | null;
  /** `label`, else the fallback, else "Kategori". */
  displayLabel(id: string | null | undefined, fallback?: string | null): string;
  /** "Tüm elbiseler"-style link copy; "Tüm ürünler" without an id. */
  shopAllLabel(id: string | null | undefined): string;
  /** Top-level categories, in menu order. */
  roots(options?: { includeLegacy?: boolean }): TrTaxonomyCategory[];
  /** The subcategories the menu shows under a category. */
  navChildren(id: string | null | undefined): TrTaxonomyCategory[];
  /** True when the product's category is the filter or sits under it. */
  isMatch(productCategory: string | null | undefined, filterId: string | null | undefined): boolean;
  /** The top-level category a category belongs to. */
  rootId(id: string | null | undefined): string | null;
  /** The category a product should be listed under. */
  canonicalize(id: string | null | undefined): string | null;
  /** Categories a product can be filed under, in menu order. */
  assignable(): TrTaxonomyCategory[];
  /** The categories the given products use (known ones in menu order, then unknown ones). */
  forProducts(products: ReadonlyArray<{ category: string | null }>): TrTaxonomyCategory[];
  /** A category's own picture (custom categories only). */
  imageUrl(id: string | null | undefined): string | null;
}

/** One of the boutique's categories as the storefront gets it (serializable). */
export interface TrTaxonomyNode {
  id: string;
  label: string;
  parentId: string | null;
  shopAllLabel: string;
  imageUrl: string | null;
}

export function humanizeCategoryId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

function defaultShopAllLabel(label: string): string {
  return `Tüm ${label.charAt(0).toLocaleLowerCase("tr-TR")}${label.slice(1)}`;
}

/**
 * The boutique's categories as storefront nodes, in menu order (`sort_order`, then name).
 * `shopAllLabelFor` lets a vertical supply better "Tüm …" copy (fashion: "Tüm elbiseler").
 */
export function taxonomyNodesFromCategories(
  categories: readonly Pick<
    TrCategory,
    "id" | "parentId" | "name" | "slug" | "imageUrl" | "sortOrder" | "systemKey"
  >[],
  shopAllLabelFor?: (category: Pick<TrCategory, "name" | "systemKey">) => string | null,
): TrTaxonomyNode[] {
  const slugById = new Map(categories.map((category) => [category.id, category.slug]));
  return [...categories]
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"),
    )
    .map((category) => ({
      id: category.slug,
      label: category.name,
      parentId: category.parentId ? (slugById.get(category.parentId) ?? null) : null,
      shopAllLabel: shopAllLabelFor?.(category) ?? defaultShopAllLabel(category.name),
      imageUrl: category.imageUrl,
    }));
}

export function customTaxonomy(nodes: readonly TrTaxonomyNode[]): TrStorefrontTaxonomy {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const childrenOf = (id: string) => nodes.filter((node) => node.parentId === id);
  const toCategory = (node: TrTaxonomyNode): TrTaxonomyCategory => ({
    id: node.id,
    label: node.label,
    parentId: node.parentId,
  });
  const ancestry = (id: string): TrTaxonomyNode[] => {
    const out: TrTaxonomyNode[] = [];
    const seen = new Set<string>();
    let current = byId.get(id);
    while (current && !seen.has(current.id)) {
      out.push(current);
      seen.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return out;
  };

  const label = (id: string | null | undefined) => {
    const trimmed = id?.trim();
    if (!trimmed) return null;
    return byId.get(trimmed)?.label ?? humanizeCategoryId(trimmed);
  };

  return {
    label,
    displayLabel: (id, fallback) => label(id) ?? fallback?.trim() ?? "Kategori",
    shopAllLabel: (id) => {
      const trimmed = id?.trim();
      if (!trimmed) return "Tüm ürünler";
      const node = byId.get(trimmed);
      return node ? node.shopAllLabel : defaultShopAllLabel(humanizeCategoryId(trimmed));
    },
    roots: () => nodes.filter((node) => !node.parentId).map(toCategory),
    navChildren: (id) => (id?.trim() ? childrenOf(id.trim()).map(toCategory) : []),
    isMatch: (productCategory, filterId) => {
      const product = productCategory?.trim() || "";
      const filter = filterId?.trim() || "";
      if (!filter) return true;
      if (!product) return false;
      if (product === filter) return true;
      if (!byId.has(filter)) return false;
      return ancestry(product).some((node) => node.id === filter);
    },
    rootId: (id) => {
      const trimmed = id?.trim();
      if (!trimmed) return null;
      return ancestry(trimmed).at(-1)?.id ?? trimmed;
    },
    canonicalize: (id) => id?.trim() || null,
    // A category that has subcategories is a heading, not something to file under.
    assignable: () =>
      nodes.filter((node) => childrenOf(node.id).length === 0).map(toCategory),
    forProducts: (products) => {
      const used = new Set(
        products
          .map((product) => product.category?.trim())
          .filter((value): value is string => Boolean(value)),
      );
      const known = nodes.filter((node) => used.has(node.id)).map(toCategory);
      const unknown = [...used]
        .filter((id) => !byId.has(id))
        .map((id) => ({ id, label: humanizeCategoryId(id) }));
      return [...known, ...unknown];
    },
    imageUrl: (id) => (id?.trim() ? (byId.get(id.trim())?.imageUrl ?? null) : null),
  };
}
