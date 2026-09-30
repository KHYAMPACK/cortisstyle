import { cleanLabel, VARIANT_TYPE_LIMITS } from "@/lib/tr/variants/typeRules";
import type { TrVariantTypeValue, TrVariantTypeValueInput } from "@/lib/tr/variants/types";

/**
 * Renaming a size in a Beden type (e.g. "2XL" → "XXL") doesn't touch products by
 * itself: garments store their own size labels. After the save the owner is offered to
 * rename the size on the products that use it too. Pure: no I/O.
 */
export interface SizeRename {
  from: string;
  to: string;
}

/** A rename plus how many of the boutique's products carry the old label. */
export interface SizeRenameOffer extends SizeRename {
  productCount: number;
}

/** The values a save renames: same stored id, different label. */
export function sizeRenamesFromUpdate(
  stored: readonly Pick<TrVariantTypeValue, "id" | "label">[],
  submitted: readonly TrVariantTypeValueInput[],
): SizeRename[] {
  const byId = new Map(stored.map((value) => [value.id, value.label]));
  const renames: SizeRename[] = [];
  for (const value of submitted) {
    const before = value.id ? byId.get(value.id) : undefined;
    if (before !== undefined && before !== value.label) {
      renames.push({ from: before, to: value.label });
    }
  }
  return renames;
}

/** How many products carry each rename's old label; renames no product uses are dropped. */
export function sizeRenameOffers(
  renames: readonly SizeRename[],
  products: ReadonlyArray<{ sizes: readonly string[] }>,
): SizeRenameOffer[] {
  return renames
    .map((rename) => ({
      ...rename,
      productCount: products.filter((product) =>
        product.sizes.some((size) => size.trim() === rename.from),
      ).length,
    }))
    .filter((offer) => offer.productCount > 0);
}

/** A request body's renames, validated. Throws a sentence for the owner. */
export function readSizeRenamesBody(value: unknown): SizeRename[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Güncellenecek beden yok.");
  }
  if (value.length > VARIANT_TYPE_LIMITS.valuesMax) throw new Error("Çok fazla beden.");
  return value.map((entry) => {
    const record = (entry ?? {}) as Record<string, unknown>;
    const from = typeof record.from === "string" ? cleanLabel(record.from) : "";
    const to = typeof record.to === "string" ? cleanLabel(record.to) : "";
    if (!from || !to || from === to) throw new Error("Beden değişikliği geçersiz.");
    return { from, to };
  });
}

/**
 * A product's sizes with the renames applied, all at once (so "S" ↔ "M" swaps work).
 * If a renamed size lands on a label the product already has, the two are merged and
 * their stock added up, so the product's total stock never changes.
 */
export function renameProductSizes(
  sizes: readonly string[],
  sizeStocks: Readonly<Record<string, number>>,
  renames: readonly SizeRename[],
): { sizes: string[]; sizeStocks: Record<string, number>; changed: boolean } {
  const map = new Map(renames.map((rename) => [rename.from, rename.to]));
  const nextSizes: string[] = [];
  const nextStocks: Record<string, number> = {};
  let changed = false;
  for (const raw of sizes) {
    const size = raw.trim();
    if (!size) continue;
    const renamed = map.get(size) ?? size;
    if (renamed !== size) changed = true;
    if (!nextSizes.includes(renamed)) nextSizes.push(renamed);
    nextStocks[renamed] = (nextStocks[renamed] ?? 0) + (sizeStocks[size] ?? 0);
  }
  return { sizes: nextSizes, sizeStocks: nextStocks, changed };
}
