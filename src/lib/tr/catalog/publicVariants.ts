import { getProductVariants, listVariantsByProductIds } from "@/lib/tr/catalog/productVariants";
import { listVariantTypes } from "@/lib/tr/catalog/variantTypes";
import {
  toPublicVariant,
  type TrPublicVariantOption,
  type TrPublicVariants,
} from "@/lib/tr/variants/storefront";
import type { TrProductVariant, TrVariantType } from "@/lib/tr/variants/types";

/**
 * A product's variants as the shop shows them (F5). The variant tables are service-role
 * only, so the shop's server reads them here and passes on only what a shopper needs:
 * active variants, their prices, stock and photos, and the option values they use.
 * Server only. `null` = the product has no variants (it sells at product level).
 */

interface ProductPrices {
  id: string;
  boutiqueId: string;
  priceKurus: number;
  compareAtPriceKurus?: number | null;
}

function build(
  product: ProductPrices,
  typeIds: readonly string[],
  rows: readonly TrProductVariant[],
  types: readonly TrVariantType[],
): TrPublicVariants | null {
  const active = rows.filter((row) => row.active);
  if (typeIds.length === 0 || active.length === 0) return null;
  const byId = new Map(types.map((type) => [type.id, type]));
  const options: TrPublicVariantOption[] = [];
  for (const [index, typeId] of typeIds.entries()) {
    const type = byId.get(typeId);
    if (!type) return null;
    const used = new Set(active.map((row) => row.optionValueIds[index]));
    options.push({
      typeId,
      name: type.name,
      role: type.role,
      photos: type.hasPhotos,
      selectionStyle: type.selectionStyle,
      values: type.values
        .filter((value) => used.has(value.id))
        .map((value) => ({
          id: value.id,
          label: value.label,
          hex: value.hex,
          imageUrl: value.imageUrl,
        })),
    });
  }
  return { options, variants: active.map((row) => toPublicVariant(row, product)) };
}

/** One product's variants for its page. */
export async function loadPublicProductVariants(
  product: ProductPrices,
): Promise<TrPublicVariants | null> {
  const stored = await getProductVariants(product.id);
  if (stored.typeIds.length === 0) return null;
  return build(product, stored.typeIds, stored.variants, await listVariantTypes(product.boutiqueId));
}

/**
 * Several products' variants at once (the Google feed). Options are read per product
 * only for the products that have variant rows.
 */
export async function loadPublicVariantsForProducts(
  products: readonly ProductPrices[],
): Promise<Map<string, TrPublicVariants>> {
  const out = new Map<string, TrPublicVariants>();
  const rowsByProduct = await listVariantsByProductIds(products.map((product) => product.id));
  if (rowsByProduct.size === 0) return out;
  const typesByBoutique = new Map<string, TrVariantType[]>();
  for (const product of products) {
    const rows = rowsByProduct.get(product.id);
    if (!rows || rows.length === 0) continue;
    if (!typesByBoutique.has(product.boutiqueId)) {
      typesByBoutique.set(product.boutiqueId, await listVariantTypes(product.boutiqueId));
    }
    const stored = await getProductVariants(product.id);
    const data = build(product, stored.typeIds, rows, typesByBoutique.get(product.boutiqueId)!);
    if (data) out.set(product.id, data);
  }
  return out;
}
