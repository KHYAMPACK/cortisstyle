import { sortSizesForSource, type TrSizeSource } from "@/lib/tr/sizeSources";

/**
 * The size board's form state: size label → the stock the owner typed, as a string.
 * Pure helpers shared by the size/stock UI (`TrOwnerSizeChartStock`) and the form
 * rules that turn it into a save payload. `source` is where the offered sizes come
 * from (a Beden type or a built-in list); `null` = no sizes.
 */
export type SizeStockInputs = Record<string, string>;

/** A new product's board: every size of the source at `fill`. */
export function emptyStockInputs(
  source: TrSizeSource | null,
  fill = "0",
): SizeStockInputs {
  const out: SizeStockInputs = {};
  for (const size of source?.values ?? []) out[size] = fill;
  return out;
}

/**
 * Create flows: the source's sizes plus any extra labels typed in, in the source's
 * order. Sizes of the source are always there, even when not in the inputs yet.
 */
export function sizesFromStockInputs(
  source: TrSizeSource | null,
  stockInputs: SizeStockInputs,
): string[] {
  if (!source) return [];
  const extras = Object.keys(stockInputs).filter(
    (size) => size.trim() && !source.values.includes(size),
  );
  return sortSizesForSource(source, [...source.values, ...extras]);
}

/** Editing a garment: exactly the sizes in the inputs, in the source's order. */
export function sizesInStockInputs(
  stockInputs: SizeStockInputs,
  source: TrSizeSource | null = null,
): string[] {
  return sortSizesForSource(source, Object.keys(stockInputs));
}

/** The source's sizes that aren't in the inputs yet (quick "+ 2XL" chips). */
export function missingSourceSizes(
  source: TrSizeSource | null,
  stockInputs: SizeStockInputs,
): string[] {
  return (source?.values ?? []).filter((size) => stockInputs[size] === undefined);
}

/** Inputs for exactly the product's own sizes and their stock. */
export function stockInputsForProductSizes(
  sizes: string[],
  sizeStocks: Record<string, number> | null | undefined,
): SizeStockInputs {
  const out: SizeStockInputs = {};
  for (const raw of sizes) {
    const size = raw.trim();
    if (!size) continue;
    const n = sizeStocks?.[size];
    out[size] =
      typeof n === "number" && Number.isFinite(n) ? String(Math.max(0, Math.floor(n))) : "0";
  }
  return out;
}

/**
 * Switching a board to another source: the new source's sizes at 0, keeping any
 * typed stock for sizes the new source also has and any custom sizes (ones the old
 * source didn't offer).
 */
export function switchStockInputs(
  from: TrSizeSource | null,
  to: TrSizeSource | null,
  current: SizeStockInputs,
): SizeStockInputs {
  if (!to) return {};
  const next = emptyStockInputs(to, "0");
  const previous = new Set([...(from?.values ?? []), ...(from?.moreValues ?? [])]);
  for (const [size, value] of Object.entries(current)) {
    if (size in next || !previous.has(size)) next[size] = value;
  }
  return next;
}
