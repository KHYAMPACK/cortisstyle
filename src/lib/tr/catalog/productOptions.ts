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

/** Numeric / jean-style chart (even waist-style labels). */
export const DEFAULT_NUMERIC_SIZES = [
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
] as const;

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

export function detectSizeChart(sizes: string[]): TrSizeChartId {
  const cleaned = sizes.map((size) => size.trim()).filter(Boolean);
  if (cleaned.length === 0) return "none";

  const letterSet = new Set(
    DEFAULT_LETTER_SIZES.map((size) => size.toLocaleUpperCase("en")),
  );
  const numericSet = new Set<string>(DEFAULT_NUMERIC_SIZES);

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

export function resolveBoutiqueSizePresets(presets: string[]): string[] {
  return presets.length > 0
    ? sortProductSizes(presets)
    : [...DEFAULT_LETTER_SIZES];
}

export function resolveBoutiqueColorPresets(
  presets: TrProductColor[],
): TrProductColor[] {
  const cleaned = presets.filter(
    (color) => color.name.trim() && color.hex.trim(),
  );
  return cleaned.length > 0 ? cleaned : DEFAULT_COLOR_PRESETS.map((c) => ({ ...c }));
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
