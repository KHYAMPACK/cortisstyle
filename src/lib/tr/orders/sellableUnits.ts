import { foldForSearch } from "@/lib/tr/panel/searchFold";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { variantLabel } from "@/lib/tr/variants/productVariantRules";
import type { TrProductVariant } from "@/lib/tr/variants/types";
import type { TrProduct } from "@/types/tr-marketplace";

/**
 * One thing an owner can put on a manual order: a product, one size of a product with
 * sizes, or one variant of a Gelişmiş ürün. The order picker lists these, the way ikas
 * lists variants. Pure and client-safe.
 */
export interface SellableUnit {
  /** Unique per product / size / variant. */
  key: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  /** "M" or "Kırmızı / S"; null for a product without options. */
  optionLabel: string | null;
  size: string | null;
  variantId: string | null;
  priceKurus: number;
  /** The struck-through price, when it is higher than the selling price. */
  compareAtKurus: number | null;
  /** Units left; 0 = sold out (listed, but can't be added). */
  stock: number;
}

export function sellableUnitKey(
  productId: string,
  size: string | null,
  variantId: string | null,
): string {
  return `${productId}|${size ?? ""}|${variantId ?? ""}`;
}

function strikePrice(compareAt: number | null | undefined, price: number): number | null {
  return typeof compareAt === "number" && compareAt > price ? compareAt : null;
}

/**
 * The units of one product. A product with variants sells only by variant (active ones);
 * one with sizes, by size (each with its own stock); any other product is a single unit.
 * A hidden product has none.
 */
export function sellableUnitsOf(
  product: TrProduct,
  variants: readonly TrProductVariant[] = [],
  labelOf: (valueId: string) => string = (valueId) => valueId,
): SellableUnit[] {
  if (product.status === "hidden") return [];
  const base = {
    productId: product.id,
    title: product.title,
    imageUrl: getProductCoverImageFor("boutique", product),
  };

  if (variants.length > 0) {
    return variants
      .filter((variant) => variant.active)
      .map((variant) => {
        // A variant's own price replaces the product's price and its strike-through.
        const own = variant.priceKurus;
        const priceKurus = own ?? product.priceKurus;
        return {
          ...base,
          key: sellableUnitKey(product.id, null, variant.id),
          optionLabel: variantLabel(variant.optionValueIds, labelOf),
          size: null,
          variantId: variant.id,
          priceKurus,
          compareAtKurus: own == null ? strikePrice(product.compareAtPriceKurus, priceKurus) : null,
          stock: variant.stock,
        };
      });
  }

  const compareAtKurus = strikePrice(product.compareAtPriceKurus, product.priceKurus);
  const sizes = resolveProductSizes(product);
  if (sizes.length > 0) {
    const hasMap = Object.keys(product.sizeStocks).length > 0;
    return sizes.map((size) => ({
      ...base,
      key: sellableUnitKey(product.id, size, null),
      optionLabel: size,
      size,
      variantId: null,
      priceKurus: product.priceKurus,
      compareAtKurus,
      // Same rule as checkout: without a per-size map, the product's own count stands in.
      stock: hasMap ? (product.sizeStocks[size] ?? 0) : product.stock,
    }));
  }

  return [
    {
      ...base,
      key: sellableUnitKey(product.id, null, null),
      optionLabel: null,
      size: null,
      variantId: null,
      priceKurus: product.priceKurus,
      compareAtKurus,
      stock: product.stock,
    },
  ];
}

/** Every product's units, in the order of the product list. */
export function sellableUnitsOfCatalog(
  products: readonly TrProduct[],
  variantsByProduct: ReadonlyMap<string, readonly TrProductVariant[]>,
  labelOf?: (valueId: string) => string,
): SellableUnit[] {
  return products.flatMap((product) =>
    sellableUnitsOf(product, variantsByProduct.get(product.id) ?? [], labelOf),
  );
}

/**
 * The units whose product name or option ("M", "Kırmızı / S") match `query`: every word
 * of it must appear, in any order, ignoring Turkish letter case ("ELBISE" finds "Elbise").
 * An empty query keeps everything.
 */
export function filterSellableUnits(
  units: readonly SellableUnit[],
  query: string,
): SellableUnit[] {
  const words = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...units];
  return units.filter((unit) => {
    const haystack = foldForSearch(`${unit.title} ${unit.optionLabel ?? ""}`);
    return words.every((word) => haystack.includes(word));
  });
}
