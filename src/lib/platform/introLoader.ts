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
