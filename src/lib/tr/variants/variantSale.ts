import { variantLabel } from "@/lib/tr/variants/productVariantRules";
import type { TrProductVariant } from "@/lib/tr/variants/types";

/**
 * What it takes to sell one line of a Gelişmiş product: which variant, at what price,
 * and whether it can be sold. Pure, so checkout and (later) manual orders share the rule.
 *
 * A product with variant rows can only be sold by choosing one of them; a product
 * without rows sells at product level and must not be given a variant.
 */

export type VariantSale =
  /** No variants: sell at product level (price, stock and size as before). */
  | { kind: "product" }
  | {
      kind: "variant";
      variant: TrProductVariant;
      /** "Kırmızı / S" — kept on the order. */
      label: string;
      /** The variant's own price, or the product's when the variant has none. */
      priceKurus: number;
    }
  | { kind: "error"; error: string };

export function resolveVariantSale(args: {
  productTitle: string;
  productPriceKurus: number;
  variants: readonly TrProductVariant[];
  variantId: string | null | undefined;
  quantity: number;
  labelOf: (valueId: string) => string;
}): VariantSale {
  const { productTitle: title, variants, quantity } = args;
  const requested = args.variantId?.trim() || null;

  if (variants.length === 0) {
    return requested
      ? { kind: "error", error: `"${title}" için geçersiz seçenek.` }
      : { kind: "product" };
  }
  if (!requested) {
    return { kind: "error", error: `"${title}" için seçenek belirleyin.` };
  }

  const variant = variants.find((row) => row.id === requested);
  if (!variant) {
    return { kind: "error", error: `"${title}" için geçersiz seçenek.` };
  }

  const label = variantLabel(variant.optionValueIds, args.labelOf);
  if (!variant.active) {
    return { kind: "error", error: `"${title}" (${label}) satışta değil.` };
  }
  if (variant.stock < quantity) {
    return { kind: "error", error: `"${title}" (${label}) stokta yok.` };
  }

  return {
    kind: "variant",
    variant,
    label,
    priceKurus: variant.priceKurus ?? args.productPriceKurus,
  };
}
