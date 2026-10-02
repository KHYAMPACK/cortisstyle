import {
  kurusToPriceInput,
  parseTryPrice,
} from "@/lib/tr/ownerProductConstraints";
import {
  combinationKey,
  generateCombinations,
  PRODUCT_VARIANT_LIMITS,
  readVariantsBody,
  sumActiveStock,
} from "@/lib/tr/variants/productVariantRules";
import type { TrProductVariants, TrVariantType } from "@/lib/tr/variants/types";

/**
 * Form state of the Varyant card in the Gelişmiş editor, as the owner edits it (strings
 * as typed). Kept apart from the component so generating, keeping and bulk-editing rows
 * can be tested. A row is identified by its combination of option value ids.
 */

export interface VariantRowDraft {
  /** The combination key; stable across regenerations. */
  key: string;
  optionValueIds: string[];
  sku: string;
  barcode: string;
  /** Empty = inherits the product's price. */
  price: string;
  stock: string;
  images: string[];
  active: boolean;
}

export interface VariantsFormState {
  /** The product's option types, in order. */
  typeIds: string[];
  rows: VariantRowDraft[];
}

export const EMPTY_VARIANTS_FORM: VariantsFormState = { typeIds: [], rows: [] };

type TypeWithValues = Pick<TrVariantType, "id" | "values">;

export function variantsFormFromProduct(variants: TrProductVariants): VariantsFormState {
  return {
    typeIds: variants.typeIds,
    rows: [...variants.variants]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((variant) => ({
        key: combinationKey(variant.optionValueIds),
        optionValueIds: variant.optionValueIds,
        sku: variant.sku ?? "",
        barcode: variant.barcode ?? "",
        price: variant.priceKurus !== null ? kurusToPriceInput(variant.priceKurus) : "",
        stock: String(variant.stock),
        images: variant.images,
        active: variant.active,
      })),
  };
}

/** The API's `variants` field. */
export function variantsBody(form: VariantsFormState): Record<string, unknown> {
  return {
    typeIds: form.typeIds,
    rows: form.rows.map((row) => ({
      optionValueIds: row.optionValueIds,
      sku: row.sku,
      barcode: row.barcode,
      priceTry: row.price.trim() ? parseTryPrice(row.price) : null,
      stock: row.stock.trim() === "" ? 0 : Number(row.stock),
      images: row.images,
      active: row.active,
    })),
  };
}

/** The first problem in the variants as a sentence, or null. Uses the API's own rules. */
export function validateVariantsForm(form: VariantsFormState): string | null {
  try {
    readVariantsBody(variantsBody(form));
    return null;
  } catch (problem) {
    return problem instanceof Error ? problem.message : "Varyantlar geçersiz.";
  }
}

/** The stock the product has in total (its active variants'), as the number to store. */
export function variantsTotalStock(form: VariantsFormState): number {
  return sumActiveStock(
    form.rows.map((row) => ({
      stock: Number.parseInt(row.stock, 10) || 0,
      active: row.active,
    })),
  );
}

// ------------------------------------------------------- the picker

/** What the "Varyant Ekle" drawer edits: which types, and which of their values. */
export interface VariantSelection {
  /** In option order. */
  typeIds: string[];
  valueIdsByType: Record<string, string[]>;
}

/** The selection a product's rows currently amount to. */
export function selectionFromForm(
  form: VariantsFormState,
  types: readonly TypeWithValues[],
): VariantSelection {
  const valueIdsByType: Record<string, string[]> = {};
  form.typeIds.forEach((typeId, index) => {
    const used = new Set(form.rows.map((row) => row.optionValueIds[index]));
    const type = types.find((entry) => entry.id === typeId);
    valueIdsByType[typeId] = type
      ? type.values.map((value) => value.id).filter((id) => used.has(id))
      : [...used].filter((id): id is string => Boolean(id));
  });
  return { typeIds: [...form.typeIds], valueIdsByType };
}

function orderedValueIds(
  selection: VariantSelection,
  types: readonly TypeWithValues[],
): string[][] {
  return selection.typeIds.map((typeId) => {
    const chosen = new Set(selection.valueIdsByType[typeId] ?? []);
    const type = types.find((entry) => entry.id === typeId);
    return type ? type.values.map((value) => value.id).filter((id) => chosen.has(id)) : [];
  });
}

export function selectionCombinations(
  selection: VariantSelection,
  types: readonly TypeWithValues[],
): string[][] {
  return generateCombinations(orderedValueIds(selection, types));
}

/** Why the selection can't be applied, or null. */
export function selectionProblem(
  selection: VariantSelection,
  types: readonly TypeWithValues[],
): string | null {
  if (selection.typeIds.length === 0) return null; // no options = no variants
  if (selection.typeIds.length > PRODUCT_VARIANT_LIMITS.typesMax) {
    return `En fazla ${PRODUCT_VARIANT_LIMITS.typesMax} varyant türü seçebilirsiniz.`;
  }
  const values = orderedValueIds(selection, types);
  if (values.some((list) => list.length === 0)) {
    return "Seçtiğiniz her tür için en az bir değer seçin.";
  }
  const count = values.reduce((product, list) => product * list.length, 1);
  if (count > PRODUCT_VARIANT_LIMITS.variantsMax) {
    return `Bu seçim ${count} varyant oluşturur; en fazla ${PRODUCT_VARIANT_LIMITS.variantsMax} olabilir.`;
  }
  return null;
}

function blankRow(optionValueIds: string[]): VariantRowDraft {
  return {
    key: combinationKey(optionValueIds),
    optionValueIds,
    sku: "",
    barcode: "",
    price: "",
    stock: "0",
    images: [],
    active: true,
  };
}

/**
 * The rows that applying a selection produces: a combination that already exists keeps
 * its data, a new one arrives blank. Changing the option types themselves (a type added,
 * removed or reordered) changes what a combination is, so no old row carries over.
 */
export function applySelection(
  form: VariantsFormState,
  selection: VariantSelection,
  types: readonly TypeWithValues[],
): { form: VariantsFormState; removed: number } {
  const combos = selectionCombinations(selection, types);
  const sameTypes =
    form.typeIds.length === selection.typeIds.length &&
    form.typeIds.every((id, index) => id === selection.typeIds[index]);
  const existing = new Map(form.rows.map((row) => [row.key, row]));

  let carried = 0;
  const rows = combos.map((combo) => {
    const kept = sameTypes ? existing.get(combinationKey(combo)) : undefined;
    if (kept) carried += 1;
    return kept ?? blankRow(combo);
  });
  return {
    form: { typeIds: combos.length > 0 ? [...selection.typeIds] : [], rows },
    removed: form.rows.length - carried,
  };
}

// ------------------------------------------------------- bulk edit

export type BulkTarget = { kind: "all" } | { kind: "value"; valueId: string };

/** `undefined` leaves a field as it is. */
export interface BulkChanges {
  price?: string;
  stock?: string;
  active?: boolean;
}

export function applyBulk(
  form: VariantsFormState,
  target: BulkTarget,
  changes: BulkChanges,
): VariantsFormState {
  const price = changes.price?.trim() || undefined;
  const stock = changes.stock?.trim() || undefined;
  return {
    ...form,
    rows: form.rows.map((row) => {
      if (target.kind === "value" && !row.optionValueIds.includes(target.valueId)) {
        return row;
      }
      return {
        ...row,
        ...(price !== undefined ? { price } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(changes.active !== undefined ? { active: changes.active } : {}),
      };
    }),
  };
}

/** Whether a bulk edit would change anything (has a price, a stock or an active choice). */
export function hasBulkChanges(changes: BulkChanges): boolean {
  return (
    Boolean(changes.price?.trim()) ||
    Boolean(changes.stock?.trim()) ||
    changes.active !== undefined
  );
}

// ------------------------------------------------------- sections

/** The variants that share the first option's value (one colour), for the editor. */
export interface VariantRowGroup {
  /** The first option's value id; `null` when the product has a single option. */
  valueId: string | null;
  rows: VariantRowDraft[];
  /** Active rows' stock. */
  stock: number;
  activeCount: number;
}

/**
 * The editor's sections: with two or more options, one per value of the first option
 * (in `valueOrder`, then any other in row order); with one option, a single section.
 */
export function groupVariantRows(
  form: VariantsFormState,
  valueOrder: readonly string[] = [],
): VariantRowGroup[] {
  const summarize = (valueId: string | null, rows: VariantRowDraft[]): VariantRowGroup => ({
    valueId,
    rows,
    stock: variantsTotalStock({ typeIds: form.typeIds, rows }),
    activeCount: rows.filter((row) => row.active).length,
  });
  if (form.typeIds.length < 2) return form.rows.length > 0 ? [summarize(null, form.rows)] : [];
  const byValue = new Map<string, VariantRowDraft[]>();
  for (const row of form.rows) {
    const valueId = row.optionValueIds[0] ?? "";
    byValue.set(valueId, [...(byValue.get(valueId) ?? []), row]);
  }
  const order = [
    ...valueOrder.filter((id) => byValue.has(id)),
    ...[...byValue.keys()].filter((id) => !valueOrder.includes(id)),
  ];
  return order.map((valueId) => summarize(valueId, byValue.get(valueId)!));
}

/**
 * A group's photos: shown as picked when every row of the group has them. Toggling a
 * photo adds it to every row of the group, or removes it from all of them.
 */
export function groupHasImage(rows: readonly VariantRowDraft[], url: string): boolean {
  return rows.length > 0 && rows.every((row) => row.images.includes(url));
}

export function toggleGroupImage(
  form: VariantsFormState,
  rowKeys: readonly string[],
  url: string,
): VariantsFormState {
  const keys = new Set(rowKeys);
  const group = form.rows.filter((row) => keys.has(row.key));
  const remove = groupHasImage(group, url);
  return {
    ...form,
    rows: form.rows.map((row) => {
      if (!keys.has(row.key)) return row;
      const without = row.images.filter((image) => image !== url);
      return { ...row, images: remove ? without : [...without, url] };
    }),
  };
}
