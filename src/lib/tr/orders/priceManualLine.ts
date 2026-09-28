import type { ManualLine } from "@/lib/tr/orders/manualOrder";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { resolveVariantSale } from "@/lib/tr/variants/variantSale";
import type { TrProductVariant } from "@/lib/tr/variants/types";
import type { TrProduct } from "@/types/tr-marketplace";

/** One line of a manual order, priced from the catalog and ready to become an order item. */
export interface PricedManualLine {
  productId: string;
  boutiqueId: string;
  title: string;
  priceKurus: number;
  quantity: number;
  size: string | null;
  variantId: string | null;
  variantLabel: string | null;
}

export type ManualLinePricing =
  | { ok: true; line: PricedManualLine }
  | { ok: false; error: string };

function sameSize(a: string, b: string): boolean {
  return a.toLocaleUpperCase("en") === b.toLocaleUpperCase("en");
}

/**
 * Prices one manual-order line from its product (and the product's variants). Pure.
 *
 * With `enforceStock` (creating the order) the product must be for sale and hold enough
 * of the chosen size / variant. Without it (pricing a draft) stock and "sold out" don't
 * matter — a draft holds none — but the line must still point at something that exists:
 * a product of this boutique, a size it has, an active variant.
 */
export function priceManualLine(args: {
  product: TrProduct | undefined;
  boutiqueId: string;
  variants: readonly TrProductVariant[];
  labelOf: (valueId: string) => string;
  line: ManualLine;
  enforceStock: boolean;
}): ManualLinePricing {
  const { product, boutiqueId, variants, line, enforceStock } = args;
  const fail = (error: string): ManualLinePricing => ({ ok: false, error });

  if (!product || product.boutiqueId !== boutiqueId) {
    return fail("Siparişteki bir ürün bulunamadı.");
  }
  if (product.status === "hidden" || (enforceStock && product.status !== "available")) {
    return fail(`"${product.title}" satışta değil.`);
  }

  const priced = (over: Pick<PricedManualLine, "priceKurus" | "size" | "variantId" | "variantLabel">) =>
    ({
      ok: true,
      line: {
        productId: product.id,
        boutiqueId,
        title: product.title,
        quantity: line.quantity,
        ...over,
      },
    }) satisfies ManualLinePricing;

  if (variants.length > 0) {
    const sale = resolveVariantSale({
      productTitle: product.title,
      productPriceKurus: product.priceKurus,
      variants,
      variantId: line.variantId,
      // A draft doesn't check stock: ask for none, so only a missing or inactive variant fails.
      quantity: enforceStock ? line.quantity : 0,
      labelOf: args.labelOf,
    });
    if (sale.kind === "error") return fail(sale.error);
    if (sale.kind === "variant") {
      return priced({
        priceKurus: sale.priceKurus,
        size: null,
        variantId: sale.variant.id,
        variantLabel: sale.label,
      });
    }
  } else if (line.variantId) {
    return fail(`"${product.title}" için geçersiz seçenek.`);
  }

  const sizes = resolveProductSizes(product);
  let size: string | null = null;
  let stock = product.stock;
  if (sizes.length > 0) {
    const match = line.size ? sizes.find((entry) => sameSize(entry, line.size!)) : undefined;
    if (!match) return fail(`"${product.title}" için beden seçin.`);
    size = match;
    const hasMap = Object.keys(product.sizeStocks).length > 0;
    // Same rule as checkout: without a per-size map, the product's own count stands in.
    stock = hasMap ? (product.sizeStocks[match] ?? 0) : product.stock;
  } else if (line.size) {
    return fail(`"${product.title}" için geçersiz beden.`);
  }
  if (enforceStock && stock < line.quantity) {
    return fail(`"${product.title}"${size ? ` (${size})` : ""} stokta yok.`);
  }

  return priced({ priceKurus: product.priceKurus, size, variantId: null, variantLabel: null });
}
