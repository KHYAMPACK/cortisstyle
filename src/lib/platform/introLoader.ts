import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { isTrMarketPath } from "@/lib/marketPreference";

export const PATHNAME_HEADER = "x-pathname";
/** Set by middleware when the request host is a white-label boutique domain. */
export const BOUTIQUE_SLUG_HEADER = "x-boutique-slug";

/** Cadde home only — not `/tr/[boutiqueSlug]`, panel, or other marketplace routes. */
export function isCaddeHomePath(pathname: string): boolean {
  return pathname === "/tr" || pathname === "/tr/";
}

/**
 * Photo-stack intro for Cortisstyle Cadde. Boutique storefronts never use this
 * (custom domains keep the logo mask; `/tr/[slug]` stays intro-free).
 */
export function shouldShowCaddeIntroLoader(
  pathname: string,
  boutiqueSlug?: string | null,
): boolean {
  if (boutiqueSlug?.trim()) return false;
  return isCaddeHomePath(pathname);
}

/** Paths that skip the homepage intro mask — must stay scrollable immediately. */
export function shouldShowIntroLoader(pathname: string): boolean {
  return (
    !isMaintenancePath(pathname) &&
    !isAuthCallbackPath(pathname) &&
    !isTrMarketPath(pathname)
  );
}

export function shouldMountIntroLoader(
  pathname: string,
  boutiqueSlug?: string | null,
): boolean {
  return (
    shouldShowIntroLoader(pathname) ||
    shouldShowCaddeIntroLoader(pathname, boutiqueSlug)
  );
}

export function rootHtmlClassName(
  pathname: string,
  boutiqueSlug?: string | null,
): string {
  if (shouldShowCaddeIntroLoader(pathname, boutiqueSlug)) {
    return "intro-loading intro-loading-cadde h-full antialiased";
  }
  if (!shouldShowIntroLoader(pathname)) {
    return "h-full antialiased";
  }
  if (boutiqueSlug?.trim()) {
    return "intro-loading intro-loading-boutique h-full antialiased";
  }
  return "intro-loading h-full antialiased";
}

const INTRO_LOCK_CLASSES = [
  "intro-loading",
  "intro-loading-boutique",
  "intro-loading-cadde",
] as const;

export function clearIntroLoadingLock(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
  document.body.style.overflow = "";
}

/** Once per JS context so client nav back to `/tr` does not replay the stack. */
let caddeIntroPlayed = false;

export function hasCaddeIntroPlayed(): boolean {
  return caddeIntroPlayed;
}

export function markCaddeIntroPlayed(): void {
  caddeIntroPlayed = true;
}

/** Fired when the Cadde intro overlay is gone (or was skipped) so the hero can rip. */
export const CADDE_HERO_READY_EVENT = "cadde-hero-ready";

export function emitCaddeHeroReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CADDE_HERO_READY_EVENT));
}

let caddeHeroRipPlayed = false;

export function hasCaddeHeroRipPlayed(): boolean {
  return caddeHeroRipPlayed;
}

export function markCaddeHeroRipPlayed(): void {
  caddeHeroRipPlayed = true;
}

/** Fired when the Cadde hero fold has finished (chrome + type can appear). */
export const CADDE_HERO_RIP_DONE_EVENT = "cadde-hero-rip-done";

let caddeHeroRipSettled = false;

export function hasCaddeHeroRipSettled(): boolean {
  return caddeHeroRipSettled;
}

export function markCaddeHeroRipSettled(): void {
  caddeHeroRipSettled = true;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CADDE_HERO_RIP_DONE_EVENT));
}
