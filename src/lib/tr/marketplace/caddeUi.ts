import { CADDE_HERO_SLOGAN_RED } from "@/lib/tr/marketplace/caddeHero";

/** Same red as the torn hero slogan — Cadde chrome only, not boutique brand. */
export const CADDE_RED = CADDE_HERO_SLOGAN_RED;

export const CADDE_RULE = "border-black/10";

export const CADDE_KICKER =
  "font-cadde-nav text-[10px] font-semibold tracking-[0.28em] text-cadde-red uppercase";

export const CADDE_DISPLAY =
  "font-cadde-display uppercase leading-[0.86] tracking-[0.02em] text-jet-black";

export const CADDE_LABEL =
  "font-cadde-nav text-[10px] font-semibold tracking-[0.2em] uppercase";

export const CADDE_CTA =
  "font-cadde-nav inline-flex min-h-11 items-center text-[11px] font-semibold tracking-[0.28em] uppercase";

export const CADDE_STATUS =
  "border-b border-black/10 border-l-2 border-l-cadde-red px-5 py-3 font-cadde-nav text-[10px] tracking-[0.18em] text-neutral-600 uppercase md:px-10";

export function caddeBracket(label: string): string {
  return `[ ${label} ]`;
}

export function caddeIndexLabel(index: string, label: string): string {
  return `${index}. ${label}`;
}
