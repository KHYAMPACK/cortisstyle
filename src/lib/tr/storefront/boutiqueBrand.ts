import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const DEFAULT_THEME_ACCENT = "#C2185B";
const DEFAULT_BOUTIQUE_BG = "#FFFBFC";

/** Known accents when DB row is not loaded (auth pages, emails). */
const THEME_ACCENT_OVERRIDES: Partial<Record<string, string>> = {
  lilabutik: "#9B7EBD",
  ozeltablo: "#2C3E50",
  minimora: "#F3A575",
};

/** Known storefront logo overrides (e.g. after recreating assets before DB re-seed). */
const LOGO_OVERRIDES: Partial<Record<string, string>> = {
  lilabutik: "/tr/boutiques/lilabutik/logo.png?v=4",
  ozeltablo: "/tr/boutiques/ozeltablo/logo.png",
  minimora: "/tr/boutiques/minimora/logo.png?v=3",
};

/** Light / white marks for dark or accent campaign backgrounds. */
const LOGO_ON_DARK_OVERRIDES: Partial<Record<string, string>> = {
  lilabutik: "/tr/boutiques/lilabutik/logo-white.png?v=1",
  minimora: "/tr/boutiques/minimora/logo.png?v=3",
};

/** High-contrast favicons (tab icons) — prefer readable marks over dark-on-dark logos. */
const FAVICON_OVERRIDES: Partial<Record<string, string>> = {
  lilabutik: "/tr/boutiques/lilabutik/favicon.png?v=2",
  ozeltablo: "/tr/boutiques/ozeltablo/favicon.png",
  minimora: "/tr/boutiques/minimora/favicon.png?v=3",
};

const INTRO_BRAND_LABELS: Partial<Record<string, string>> = {
  lilabutik: "Lila Boutique",
  ozeltablo: "Özel Tablo",
  minimora: "Minimora",
};

/** Browser / SEO document titles (home). Keep UI labels shorter via `resolveBoutiqueBrandLabel`. */
const DOCUMENT_TITLES: Partial<Record<string, string>> = {
  lilabutik: "Lila Butik | Kadın Giyim",
  ozeltablo: "Özel Tablo | Fotoğrafından tuval baskı",
  minimora: "Minimora | Çiziminizden 3D Figür",
};

const DOCUMENT_DESCRIPTIONS: Partial<Record<string, string>> = {
  lilabutik:
    "Lila Butik’te kadın giyim — elbise, üst giyim, çanta ve aksesuar. Denizli’den online butik.",
  ozeltablo:
    "Fotoğrafınızdan kişiye özel tuval tablo siparişi — boyut ve stil seçin, online ödeyin.",
  minimora:
    "Çocuğunuzun çizimini özenle 3D figüre dönüştürün — boyut seçin, çizimi yükleyin, kapınıza teslim.",
};

/** Human-facing boutique label for auth/legal copy. */
export function resolveBoutiqueBrandLabel(
  slug: string,
  fallbackName?: string | null,
): string {
  const override = INTRO_BRAND_LABELS[slug.trim().toLowerCase()];
  if (override) return override;
  const name = fallbackName?.trim();
  if (name) return name;
  return slug;
}

/** Full SEO title for the boutique home / default document title. */
export function resolveBoutiqueDocumentTitle(
  slug: string,
  fallbackName?: string | null,
): string {
  const key = slug.trim().toLowerCase();
  return DOCUMENT_TITLES[key] ?? resolveBoutiqueBrandLabel(slug, fallbackName);
}

/** SEO meta description for boutique storefronts. */
export function resolveBoutiqueDocumentDescription(
  slug: string,
  fallbackDescription?: string | null,
  fallbackName?: string | null,
): string {
  const key = slug.trim().toLowerCase();
  const override = DOCUMENT_DESCRIPTIONS[key];
  if (override) return override;
  const fromBoutique = fallbackDescription?.trim();
  if (fromBoutique) return fromBoutique;
  const brand = resolveBoutiqueBrandLabel(slug, fallbackName);
  return `${brand} — shop women's clothing online.`;
}

/** Boutiques with logo or accent get the branded shell. */
export function hasBoutiqueBrand(boutique: TrBoutiquePublic): boolean {
  return Boolean(boutique.logoUrl?.trim() || boutique.themeAccent?.trim());
}

export function resolveBoutiqueThemeAccent(boutique: TrBoutiquePublic): string {
  return (
    boutique.themeAccent?.trim() ||
    THEME_ACCENT_OVERRIDES[boutique.slug] ||
    DEFAULT_THEME_ACCENT
  );
}

export function resolveBoutiqueThemeAccentBySlug(slug: string): string {
  return THEME_ACCENT_OVERRIDES[slug.trim().toLowerCase()] || DEFAULT_THEME_ACCENT;
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

/** White/light logo for accent or dark campaign surfaces. Falls back to standard logo. */
export function resolveBoutiqueLogoOnDarkUrl(
  boutique: Pick<TrBoutiquePublic, "slug" | "logoUrl">,
): string | null {
  const override = LOGO_ON_DARK_OVERRIDES[boutique.slug];
  if (override) return override;
  return resolveBoutiqueLogoUrl(boutique);
}

/** Browser tab / apple touch icon for white-label boutique hosts. */
export function resolveBoutiqueFaviconUrl(
  boutique: Pick<TrBoutiquePublic, "slug" | "logoUrl">,
): string | null {
  const override = FAVICON_OVERRIDES[boutique.slug];
  if (override) return override;
  return resolveBoutiqueLogoUrl(boutique);
}

/** Public file path for a boutique favicon (no cache-buster query). */
export function resolveBoutiqueFaviconFilePath(slug: string): string | null {
  const override = FAVICON_OVERRIDES[slug.trim().toLowerCase()];
  if (!override) return null;
  return override.split("?")[0] || null;
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
