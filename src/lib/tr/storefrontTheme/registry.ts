import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome/registry";
import type { TrStorefrontThemeId } from "@/lib/tr/storefrontTheme/types";

/**
 * Slug → storefront theme (unique UI pack).
 * editorial when home layout is editorial; otherwise null (branded/Cadde chrome).
 */
export function resolveStorefrontTheme(
  boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): TrStorefrontThemeId | null {
  return resolveBoutiqueHomeLayout(boutiqueSlug, homeLayout) === "editorial"
    ? "editorial"
    : null;
}

/** Local cart / sepet / odeme / editorial PLP routes. */
export function boutiqueUsesLocalCommerce(
  boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): boolean {
  return resolveStorefrontTheme(boutiqueSlug, homeLayout) != null;
}
