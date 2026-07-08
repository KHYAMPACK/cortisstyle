import type { TrProduct, TrProductColor } from "@/types/tr-marketplace";

export const DEFAULT_LETTER_SIZES = ["XS", "S", "M", "L", "XL"] as const;

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
