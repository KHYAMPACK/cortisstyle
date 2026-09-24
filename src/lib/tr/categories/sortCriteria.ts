/**
 * How a category orders its products on the storefront ("Sıralama Ölçütü").
 * These are exactly the six choices ikas offers; `null` means the store's default
 * order.
 */
export type TrCategorySortCriterion =
  | "best_selling"
  | "discount_desc"
  | "discount_asc"
  | "price_desc"
  | "price_asc"
  | "newest";

export const CATEGORY_SORT_OPTIONS: ReadonlyArray<{
  id: TrCategorySortCriterion;
  label: string;
}> = [
  { id: "best_selling", label: "En Çok Satanlar" },
  { id: "discount_desc", label: "İndirim Oranına Göre Azalan" },
  { id: "discount_asc", label: "İndirim Oranına Göre Artan" },
  { id: "price_desc", label: "Fiyata Göre Azalan" },
  { id: "price_asc", label: "Fiyata Göre Artan" },
  { id: "newest", label: "Yeniden Eskiye (Oluşturulma Tarihine Göre)" },
];

export function readCategorySortCriterion(
  value: unknown,
): TrCategorySortCriterion | null {
  return CATEGORY_SORT_OPTIONS.some((option) => option.id === value)
    ? (value as TrCategorySortCriterion)
    : null;
}

export function categorySortLabel(
  criterion: TrCategorySortCriterion | null | undefined,
): string {
  return CATEGORY_SORT_OPTIONS.find((option) => option.id === criterion)?.label ?? "";
}

interface SortableProduct {
  id: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  createdAt: string;
}

/** Discount as a fraction of the original price; 0 when the product is not on sale. */
function discountRatio(product: SortableProduct): number {
  const original = product.compareAtPriceKurus;
  if (typeof original !== "number" || original <= product.priceKurus) return 0;
  return (original - product.priceKurus) / original;
}

/**
 * Products in the order a category asks for. A stable sort: products that tie keep
 * the order they came in (the store's default order). `salesByProduct` (units sold
 * per product id) is only needed for `best_selling`.
 */
export function sortProductsByCriterion<T extends SortableProduct>(
  products: readonly T[],
  criterion: TrCategorySortCriterion | null,
  salesByProduct: ReadonlyMap<string, number> = new Map(),
): T[] {
  const list = [...products];
  if (!criterion) return list;

  const key = (product: T): number => {
    switch (criterion) {
      case "best_selling":
        return salesByProduct.get(product.id) ?? 0;
      case "discount_desc":
      case "discount_asc":
        return discountRatio(product);
      case "price_desc":
      case "price_asc":
        return product.priceKurus;
      case "newest":
        return Date.parse(product.createdAt) || 0;
    }
  };
  const descending =
    criterion === "best_selling" ||
    criterion === "discount_desc" ||
    criterion === "price_desc" ||
    criterion === "newest";

  return list
    .map((product, index) => ({ product, index, value: key(product) }))
    .sort((a, b) =>
      a.value === b.value
        ? a.index - b.index
        : descending
          ? b.value - a.value
          : a.value - b.value,
    )
    .map((entry) => entry.product);
}
