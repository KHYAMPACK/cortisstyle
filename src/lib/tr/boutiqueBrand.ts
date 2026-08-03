import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const DEFAULT_THEME_ACCENT = "#C2185B";
const DEFAULT_BOUTIQUE_BG = "#FFFBFC";

/** Known storefront logo overrides (e.g. after recreating assets before DB re-seed). */
const LOGO_OVERRIDES: Partial<Record<string, string>> = {
  pervinsoysalbutik: "/tr/boutiques/pervinsoysalbutik/logo.png",
};

const INTRO_BRAND_LABELS: Partial<Record<string, string>> = {
  pervinsoysalbutik: "Pervin Soysal",
};

/** Boutiques with logo or accent get the branded shell. */
export function hasBoutiqueBrand(boutique: TrBoutiquePublic): boolean {
  return Boolean(boutique.logoUrl?.trim() || boutique.themeAccent?.trim());
}

export function resolveBoutiqueThemeAccent(boutique: TrBoutiquePublic): string {
  return boutique.themeAccent?.trim() || DEFAULT_THEME_ACCENT;
}

export function resolveBoutiqueBackground(): string {
  return DEFAULT_BOUTIQUE_BG;
}

/** Prefer known PNG monograms over stale SVG text marks in DB. */
export function resolveBoutiqueLogoUrl(
  boutique: Pick<TrBoutiquePublic, "slug" | "logoUrl">,
): string | null {
  const override = LOGO_OVERRIDES[boutique.slug];
  if (override) return override;
  return boutique.logoUrl?.trim() || null;
}

/** Logo + label for custom-domain intro mask (no DB round-trip). */
export function resolveBoutiqueIntroBrand(slug: string): {
  logoUrl: string;
  label: string;
} | null {
  const logoUrl = LOGO_OVERRIDES[slug];
  if (!logoUrl) return null;
  return {
    logoUrl,
    label: INTRO_BRAND_LABELS[slug] ?? slug,
  };
}
