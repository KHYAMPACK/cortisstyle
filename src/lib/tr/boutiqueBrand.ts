import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const DEFAULT_THEME_ACCENT = "#C2185B";
const DEFAULT_BOUTIQUE_BG = "#FFFBFC";

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
