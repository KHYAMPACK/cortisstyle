/** size label → units available */
export type SizeStocks = Record<string, number>;

export function readSizeStocks(value: unknown): SizeStocks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: SizeStocks = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const size = key.trim();
    if (!size) continue;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) continue;
    out[size] = n;
  }
  return out;
}

/**
 * Units for a size.
 * - Empty `sizeStocks` map + product has sizes → treat as **out of stock**
 *   (legacy gap / never initialized). Callers that only have stocks (no sizes
 *   list) still get `null` = unknown / legacy unlimited for maps that are empty
 *   when the product truly has no sizes — prefer `isProductSizeSellable`.
 */
export function getSizeStockQuantity(
  sizeStocks: SizeStocks | null | undefined,
  size: string,
): number | null {
  if (!sizeStocks || Object.keys(sizeStocks).length === 0) return null;
  const n = sizeStocks[size];
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function isSizeInStock(
  sizeStocks: SizeStocks | null | undefined,
  size: string,
): boolean {
  const qty = getSizeStockQuantity(sizeStocks, size);
  // Empty map → not sellable via per-size path (use isProductSizeSellable + unitStock for legacy).
  if (qty === null) return false;
  return qty > 0;
}

/**
 * Sellability for a sized SKU. When the product declares sizes but has an empty
 * size_stocks map, do **not** treat as unlimited — require unit stock fallback
 * only when explicitly allowed by the caller via `unitStock`.
 */
export function isProductSizeSellable(input: {
  sizes: string[];
  size: string;
  sizeStocks: SizeStocks | null | undefined;
  /** Fallback when size_stocks is empty (legacy). */
  unitStock?: number;
}): boolean {
  const size = input.size.trim();
  if (!size) return false;

  const map = input.sizeStocks ?? {};
  const hasMap = Object.keys(map).length > 0;

  if (hasMap) {
    return (map[size] ?? 0) > 0;
  }

  // Sized product without per-size map: only sellable if unit stock remains.
  if (input.sizes.length > 0) {
    return (input.unitStock ?? 0) > 0;
  }

  return (input.unitStock ?? 0) > 0;
}

export function sumSizeStocks(stocks: SizeStocks): number {
  return Object.values(stocks).reduce((sum, n) => sum + n, 0);
}

/** Keep only selected sizes; default missing entries to 0. */
export function sizeStocksForSizes(
  sizes: string[],
  stocks: SizeStocks,
): SizeStocks {
  const out: SizeStocks = {};
  for (const size of sizes) {
    const label = size.trim();
    if (!label) continue;
    out[label] = stocks[label] ?? 0;
  }
  return out;
}

/** UI string map → numeric stocks (invalid entries skipped). */
export function parseSizeStockInputs(
  sizes: string[],
  inputs: Record<string, string>,
): SizeStocks | null {
  const out: SizeStocks = {};
  for (const size of sizes) {
    const raw = (inputs[size] ?? "").trim();
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
    out[size] = n;
  }
  return out;
}
