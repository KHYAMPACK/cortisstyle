import type { TrStorefrontThemeId } from "@/lib/tr/storefrontTheme/types";

/**
 * Every boutique is "editorial" now — the branded/Cadde-chrome themes were
 * retired along with the Cadde marketplace. See boutiqueHome/registry.ts.
 */
export function resolveStorefrontTheme(
  _boutiqueSlug?: string,
  _homeLayout?: "default" | "editorial" | null,
): TrStorefrontThemeId | null {
  return "editorial";
}
