/** Panel chrome logos — prefer SVG over PNG. Packshot cutouts are unrelated. */

const PANEL_LOGO_SVG: Record<string, string> = {
  lilabutik: "/tr/boutiques/lilabutik/logo.svg",
};

export function panelBoutiqueLogoSrc(boutique: {
  slug?: string | null;
  logoUrl?: string | null;
}): string | null {
  const slug = boutique.slug?.trim().toLowerCase() ?? "";
  const svg = slug ? PANEL_LOGO_SVG[slug] : undefined;
  if (svg) return svg;
  const url = boutique.logoUrl?.trim();
  return url || null;
}
