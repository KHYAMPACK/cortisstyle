/**
 * PopSockets-inspired phone-grip tenant palette: black / white /
 * acid-green accent (chosen instead of PopSockets' own pastel/lilac
 * accents so the clone reads as its own brand). Structural chrome
 * (header, cards, type) stays black-on-white; the accent is reserved
 * for CTAs, active swatch rings, and promo/sale surfaces — mirrors
 * the shape of src/components/tr/boutique/minimora/minimoraTheme.ts.
 */
export const NEWTENANT_COLORS = {
  bg: "#FAFAFA",
  cta: "#171717",
  ctaHover: "#000000",
  ctaText: "#FFFFFF",
  text: "#171717",
  muted: "#6B7280",
  border: "#E5E5E5",
  accent: "#B8FF3D",
  accentText: "#0A0A0A",
} as const;

export const newtenantDisplay = "newtenant-display";

export const newtenantBtnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#171717] px-8 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-black";

export const newtenantBtnOutline =
  "inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#171717] bg-white px-8 py-3 text-[14px] font-semibold text-[#171717] transition-colors hover:bg-[#171717]/5";

/** Accent CTA — reserved for high-emphasis moments (hero, promo bar, active swatch). */
export const newtenantBtnAccent =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#B8FF3D] px-8 py-3 text-[14px] font-semibold text-[#0A0A0A] shadow-sm transition-colors hover:bg-[#A8EF2D]";
