import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import { readBarcodeValue, readSkuValue } from "@/lib/tr/productDetails";
import type {
  TrProductVariantInput,
  TrProductVariantsInput,
} from "@/lib/tr/variants/types";

/**
 * Rules for a Gelişmiş product's variants, shared by the panel editor and the API.
 * Pure: no I/O. A variant is identified by its combination of option value ids, not by
 * a row id, so saving the same combination twice always means the same variant.
 */

export const PRODUCT_VARIANT_LIMITS = {
  /** Option types per product. */
  typesMax: 3,
  variantsMax: 100,
  imagesMax: TR_OWNER_PRODUCT_LIMITS.maxImages,
} as const;

export function combinationKey(optionValueIds: readonly string[]): string {
  return optionValueIds.join("|");
}

/**
 * Every combination of one value per option, in option order and then value order
 * (Kırmızı/S, Kırmızı/M, Mavi/S, …). Empty when there are no options or an option
 * has no values.
 */
export function generateCombinations(
  valueIdsByType: ReadonlyArray<readonly string[]>,
): string[][] {
  if (valueIdsByType.length === 0 || valueIdsByType.some((values) => values.length === 0)) {
    return [];
  }
  let combos: string[][] = [[]];
  for (const values of valueIdsByType) {
    combos = combos.flatMap((combo) => values.map((value) => [...combo, value]));
  }
  return combos;
}

/** "Kırmızı / S". */
export function variantLabel(
  optionValueIds: readonly string[],
  labelOf: (valueId: string) => string,
): string {
  return optionValueIds.map(labelOf).join(" / ");
}

/** The stock a product with variants has in total: its active variants' stock. */
export function sumActiveStock(
  rows: ReadonlyArray<{ stock: number; active: boolean }>,
): number {
  return rows.reduce((sum, row) => (row.active ? sum + row.stock : sum), 0);
}

export interface VariantPlan<Existing, Submitted> {
  insert: Submitted[];
  update: Array<{ existing: Existing; submitted: Submitted }>;
  remove: Existing[];
}

/**
 * Compares a product's stored variants with the submitted ones by combination: the
 * same combination is an update (its row and id survive), a new one is an insert, a
 * stored one that is no longer submitted is removed. The submitted order is kept.
 */
export function planVariantChanges<
  Existing extends { optionValueIds: readonly string[] },
  Submitted extends { optionValueIds: readonly string[] },
>(
  existing: readonly Existing[],
  submitted: readonly Submitted[],
): VariantPlan<Existing, Submitted> {
  const stored = new Map(existing.map((row) => [combinationKey(row.optionValueIds), row]));
  const plan: VariantPlan<Existing, Submitted> = { insert: [], update: [], remove: [] };
  const kept = new Set<string>();
  for (const row of submitted) {
    const key = combinationKey(row.optionValueIds);
    const match = stored.get(key);
    if (match) {
      kept.add(key);
      plan.update.push({ existing: match, submitted: row });
    } else {
      plan.insert.push(row);
    }
  }
  plan.remove = existing.filter((row) => !kept.has(combinationKey(row.optionValueIds)));
  return plan;
}

function readPrice(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (
    !Number.isFinite(n) ||
    n < TR_OWNER_PRODUCT_LIMITS.priceMinTry ||
    n > TR_OWNER_PRODUCT_LIMITS.priceMaxTry
  ) {
    throw new Error(
      `Varyant fiyatı ${TR_OWNER_PRODUCT_LIMITS.priceMinTry}–${TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL arasında olmalı.`,
    );
  }
  return Math.round(n * 100);
}

function readStock(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(n) ||
    n < TR_OWNER_PRODUCT_LIMITS.stockMin ||
    n > TR_OWNER_PRODUCT_LIMITS.stockMax
  ) {
    throw new Error(
      `Varyant stoğu ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası bir tam sayı olmalı.`,
    );
  }
  return n;
}

/**
 * The `variants` field of a create / update request. `undefined` = not sent (leave the
 * product's variants alone); `null`, or no rows, clears them (the product then sells at
 * product level). Throws an `Error` with a sentence for the owner when invalid. Whether
 * the types and values exist is checked against the database by the caller.
 */
export function readVariantsBody(value: unknown): TrProductVariantsInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return { typeIds: [], variants: [] };
  if (typeof value !== "object") throw new Error("Varyantlar geçersiz.");

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.typeIds) || !Array.isArray(record.rows)) {
    throw new Error("Varyantlar geçersiz.");
  }
  const typeIds = record.typeIds.filter((id): id is string => typeof id === "string" && id !== "");
  if (new Set(typeIds).size !== typeIds.length) {
    throw new Error("Aynı varyant türü iki kez seçilmiş.");
  }
  if (typeIds.length > PRODUCT_VARIANT_LIMITS.typesMax) {
    throw new Error(`En fazla ${PRODUCT_VARIANT_LIMITS.typesMax} varyant türü seçebilirsiniz.`);
  }
  if (typeIds.length === 0 || record.rows.length === 0) return { typeIds: [], variants: [] };
  if (record.rows.length > PRODUCT_VARIANT_LIMITS.variantsMax) {
    throw new Error(`En fazla ${PRODUCT_VARIANT_LIMITS.variantsMax} varyant ekleyebilirsiniz.`);
  }

  const seen = new Set<string>();
  const variants: TrProductVariantInput[] = record.rows.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Varyantlar geçersiz.");
    const row = entry as Record<string, unknown>;
    const ids = Array.isArray(row.optionValueIds)
      ? row.optionValueIds.filter((id): id is string => typeof id === "string")
      : [];
    if (ids.length !== typeIds.length || ids.some((id) => id === "")) {
      throw new Error("Bir varyantın seçenek değerleri eksik.");
    }
    const key = combinationKey(ids);
    if (seen.has(key)) throw new Error("Aynı varyant iki kez eklenmiş.");
    seen.add(key);

    const images = Array.isArray(row.images)
      ? row.images.filter((url): url is string => typeof url === "string" && url.trim() !== "")
      : [];
    if (images.length > PRODUCT_VARIANT_LIMITS.imagesMax) {
      throw new Error("Bir varyanta çok fazla görsel atanmış.");
    }
    return {
      optionValueIds: ids,
      sku: readSkuValue(row.sku) ?? null,
      barcode: readBarcodeValue(row.barcode) ?? null,
      priceKurus: readPrice(row.priceTry),
      stock: readStock(row.stock ?? 0),
      images: [...new Set(images)],
      active: row.active !== false,
    };
  });
  return { typeIds, variants };
}
