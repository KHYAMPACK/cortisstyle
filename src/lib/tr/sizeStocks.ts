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
 * Units for a size. When `sizeStocks` is empty (legacy products), treat as in stock.
 * Missing key with a populated map → 0 (out of stock).
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
  return qty === null || qty > 0;
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
