import type { TrProduct, TrProductColor } from "@/types/tr-marketplace";

export const DEFAULT_LETTER_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
] as const;

/** Even jean-style numbers from `min` through `max` (inclusive). */
export function evenNumericSizes(min: number, max: number): string[] {
  const out: string[] = [];
  const start = min % 2 === 0 ? min : min + 1;
  for (let size = start; size <= max; size += 2) {
    out.push(String(size));
  }
  return out;
}

/** Default numeric chart shown in the panel (24–40 even). */
export const NUMERIC_SIZE_MIN = 24;
export const NUMERIC_SIZE_DEFAULT_MAX = 40;
/** Extra even sizes revealed by “expand” in the panel. */
export const NUMERIC_SIZE_EXPANDED_MAX = 52;

export const DEFAULT_NUMERIC_SIZES = evenNumericSizes(
  NUMERIC_SIZE_MIN,
  NUMERIC_SIZE_DEFAULT_MAX,
);

export const NUMERIC_EXPANDED_SIZES = evenNumericSizes(
  NUMERIC_SIZE_DEFAULT_MAX + 2,
  NUMERIC_SIZE_EXPANDED_MAX,
);

export const ALL_NUMERIC_SIZES = [
  ...DEFAULT_NUMERIC_SIZES,
  ...NUMERIC_EXPANDED_SIZES,
];

export type TrSizeChartId = "letter" | "numeric" | "none";

const LETTER_SORT_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "XXL",
  "3XL",
  "XXXL",
] as const;

export const DEFAULT_COLOR_PRESETS: TrProductColor[] = [
  { name: "Siyah", hex: "#1A1A1A" },
  { name: "Beyaz", hex: "#F5F5F5" },
  { name: "Lacivert", hex: "#1E3A5F" },
  { name: "Kahverengi", hex: "#6B4423" },
  { name: "Bej", hex: "#D4C4A8" },
  { name: "Kırmızı", hex: "#B71C1C" },
  { name: "Pembe", hex: "#C2185B" },
  { name: "Yeşil", hex: "#2E5A3C" },
];

export function sizesForChart(chart: TrSizeChartId): string[] {
  if (chart === "letter") return [...DEFAULT_LETTER_SIZES];
  if (chart === "numeric") return [...DEFAULT_NUMERIC_SIZES];
  return [];
}

/**
 * Sizes shown on the stock board: chart defaults (XS–3XL / 24–40) plus any
 * extra labels already on the product (expanded 42–52, custom). Empty sizes → no size columns.
 */
export function sizesForStockBoard(sizes: string[]): string[] {
  const cleaned = sizes.map((size) => size.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  const chart = detectSizeChart(cleaned);
  if (chart === "none") return sortProductSizes(cleaned);
  return sortProductSizes([...new Set([...sizesForChart(chart), ...cleaned])]);
}

/** Even sizes 42–52 not yet on this numeric product’s stock board. */
export function missingNumericExpandedSizes(sizes: string[]): string[] {
  const cleaned = sizes.map((size) => size.trim()).filter(Boolean);
  if (detectSizeChart(cleaned) !== "numeric") return [];
  const present = new Set(sizesForStockBoard(cleaned));
  return NUMERIC_EXPANDED_SIZES.filter((size) => !present.has(size));
}

export function detectSizeChart(sizes: string[]): TrSizeChartId {
  const cleaned = sizes.map((size) => size.trim()).filter(Boolean);
  if (cleaned.length === 0) return "none";

  const letterSet = new Set(
    DEFAULT_LETTER_SIZES.map((size) => size.toLocaleUpperCase("en")),
  );
  const numericSet = new Set<string>(ALL_NUMERIC_SIZES);

  const allLetter = cleaned.every((size) =>
    letterSet.has(size.toLocaleUpperCase("en")),
  );
  const allNumeric = cleaned.every((size) => numericSet.has(size));

  if (allNumeric) return "numeric";
  if (allLetter) return "letter";
  if (cleaned.every((size) => /^\d+$/.test(size))) return "numeric";
  return "letter";
}

/** Stable storefront / panel order: XS→3XL, then numeric ascending. */
export function sortProductSizes(sizes: string[]): string[] {
  return [...sizes].sort((left, right) => {
    const a = left.trim();
    const b = right.trim();
    const ia = LETTER_SORT_ORDER.indexOf(
      a.toLocaleUpperCase("en") as (typeof LETTER_SORT_ORDER)[number],
    );
    const ib = LETTER_SORT_ORDER.indexOf(
      b.toLocaleUpperCase("en") as (typeof LETTER_SORT_ORDER)[number],
    );
    if (ia >= 0 && ib >= 0) return ia - ib;
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, "tr");
  });
}

function parseSizeToken(value: string): string[] {
  return value
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Sizes shown in the beden picker — DB `sizes`, else parsed legacy `size`. Empty = no size needed. */
export function resolveProductSizes(product: Pick<TrProduct, "sizes" | "size">): string[] {
  if (product.sizes.length > 0) {
    return sortProductSizes(product.sizes);
  }

  const legacy = product.size?.trim();
  if (!legacy) {
    return [];
  }

  const tokens = parseSizeToken(legacy);
  return sortProductSizes(tokens.length > 0 ? tokens : [legacy]);
}

export function resolveProductColors(
  product: Pick<TrProduct, "colors">,
): TrProductColor[] {
  return product.colors.filter(
    (color) => color.name.trim() && color.hex.trim(),
  );
}

export function formatColorLabel(colors: TrProductColor[]): string | null {
  if (colors.length === 0) return null;
  return colors.map((color) => color.name).join(", ");
}
