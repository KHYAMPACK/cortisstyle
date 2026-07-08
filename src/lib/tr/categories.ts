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
  const id = categoryId.trim();
  const known = LABEL_BY_ID.get(id);
  if (known) return known;
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

export function listCategoriesForProducts(
  products: Array<{ category: string | null }>,
): TrCategoryDefinition[] {
  const used = new Set(
    products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const known = TR_BOUTIQUE_CATEGORIES.filter((entry) => used.has(entry.id));
  const knownIds = new Set(known.map((entry) => entry.id));

  const custom = [...used]
    .filter((id) => !knownIds.has(id))
    .map((id) => ({
      id,
      label: id
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
        .join(" "),
    }));

  return [...known, ...custom];
}
