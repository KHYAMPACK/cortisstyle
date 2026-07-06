export interface TrCategoryDefinition {
  id: string;
  label: string;
}

/** Standard garment categories for boutique storefront pills. */
export const TR_BOUTIQUE_CATEGORIES: TrCategoryDefinition[] = [
  { id: "elbise", label: "Elbise" },
  { id: "ust-giyim", label: "Üst giyim" },
  { id: "alt-giyim", label: "Alt giyim" },
  { id: "dis-giyim", label: "Dış giyim" },
  { id: "takim", label: "Takım" },
];

const LABEL_BY_ID = new Map(
  TR_BOUTIQUE_CATEGORIES.map((entry) => [entry.id, entry.label]),
);

export function getTrCategoryLabel(categoryId: string | null | undefined): string | null {
  if (!categoryId?.trim()) return null;
  return LABEL_BY_ID.get(categoryId.trim()) ?? categoryId;
}

export function listCategoriesForProducts(
  products: Array<{ category: string | null }>,
): TrCategoryDefinition[] {
  const used = new Set(
    products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  return TR_BOUTIQUE_CATEGORIES.filter((entry) => used.has(entry.id));
}
