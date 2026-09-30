import {
  sizesForChart,
  sortProductSizes,
  type TrSizeChartId,
} from "@/lib/tr/productOptions";

/**
 * The size board's form state: size label → the stock the owner typed, as a string.
 * Pure helpers shared by the size/stock UI (`TrOwnerSizeChartStock`) and the form
 * rules that turn it into a save payload.
 */
export type SizeStockInputs = Record<string, string>;

/** Chart defaults (XS–3XL / 24–40) plus any extra labels already in the inputs, sorted. */
export function sizesForStockInputs(
  chart: TrSizeChartId,
  stockInputs: SizeStockInputs,
): string[] {
  if (chart === "none") return [];
  const chartSizes = sizesForChart(chart);
  const extras = Object.keys(stockInputs).filter(
    (size) => size.trim() && !chartSizes.includes(size),
  );
  return sortProductSizes([...chartSizes, ...extras]);
}

export function emptyStockInputsForChart(
  chart: TrSizeChartId,
  fill = "0",
): SizeStockInputs {
  const out: SizeStockInputs = {};
  for (const size of sizesForChart(chart)) {
    out[size] = fill;
  }
  return out;
}

export function stockInputsFromSizeStocks(
  chart: TrSizeChartId,
  sizeStocks: Record<string, number> | null | undefined,
): SizeStockInputs {
  const out = emptyStockInputsForChart(chart, "0");
  if (!sizeStocks) return out;
  for (const [size, n] of Object.entries(sizeStocks)) {
    if (!size.trim()) continue;
    if (typeof n === "number" && Number.isFinite(n)) {
      out[size] = String(Math.max(0, Math.floor(n)));
    }
  }
  return out;
}

/** Sizes to persist: chart defaults plus any custom keys in the stock inputs. */
export function sizesFromStockInputs(
  chart: TrSizeChartId,
  stockInputs: SizeStockInputs,
): string[] {
  return sizesForStockInputs(chart, stockInputs);
}

/** Exactly the sizes in the inputs, sorted (no chart defaults added). */
export function sizesInStockInputs(stockInputs: SizeStockInputs): string[] {
  return sortProductSizes(Object.keys(stockInputs).filter((size) => size.trim()));
}

/** The chart's default sizes that aren't in the inputs yet (quick "+ 2XL" chips). */
export function missingChartSizes(
  chart: TrSizeChartId,
  stockInputs: SizeStockInputs,
): string[] {
  return sizesForChart(chart).filter((size) => stockInputs[size] === undefined);
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
