import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome/registry";
import type { TrStorefrontThemeId } from "@/lib/tr/storefrontTheme/types";

/**
 * Slug → storefront theme (unique UI pack).
 * Default: editorial when home layout is editorial; otherwise null (branded/Cadde chrome).
 */
const SLUG_THEMES: Partial<Record<string, TrStorefrontThemeId>> = {
  pervinsoysalbutik: "editorial",
  lilabutik: "editorial",
  "demo-maya": "editorial",
};

export function resolveStorefrontTheme(
  boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): TrStorefrontThemeId | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  const override = SLUG_THEMES[slug];
  if (override) return override;
  if (resolveBoutiqueHomeLayout(slug, homeLayout) === "editorial") {
    return "editorial";
  }
  return null;
}

/** Local cart / sepet / odeme / editorial PLP routes. */
export function boutiqueUsesLocalCommerce(
  boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): boolean {
  return resolveStorefrontTheme(boutiqueSlug, homeLayout) != null;
}
