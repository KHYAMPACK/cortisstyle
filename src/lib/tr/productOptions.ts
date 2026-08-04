import type { TrProduct, TrProductColor } from "@/types/tr-marketplace";

export const DEFAULT_LETTER_SIZES = ["XS", "S", "M", "L", "XL"] as const;

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

export function resolveBoutiqueSizePresets(presets: string[]): string[] {
  return presets.length > 0 ? presets : [...DEFAULT_LETTER_SIZES];
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
    return product.sizes;
  }

  const legacy = product.size?.trim();
  if (!legacy) {
    return [];
  }

  const tokens = parseSizeToken(legacy);
  return tokens.length > 0 ? tokens : [legacy];
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
