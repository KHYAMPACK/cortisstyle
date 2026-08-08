export type TrEditorialSkinId = "classic" | "atelier";

/**
 * Visual skin within the shared editorial shell (same commerce rails).
 * classic = Pervin today · atelier = Cecilie-structure calm + boutique brandify
 */
const SLUG_SKINS: Partial<Record<string, TrEditorialSkinId>> = {
  lilabutik: "atelier",
};

export function resolveEditorialSkin(
  boutiqueSlug: string,
): TrEditorialSkinId {
  const slug = boutiqueSlug.trim().toLowerCase();
  return SLUG_SKINS[slug] ?? "classic";
}

export function isAtelierEditorialSkin(boutiqueSlug: string): boolean {
  return resolveEditorialSkin(boutiqueSlug) === "atelier";
}
