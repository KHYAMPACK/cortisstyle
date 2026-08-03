import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { isTrMarketPath } from "@/lib/marketPreference";

export const PATHNAME_HEADER = "x-pathname";
/** Set by middleware when the request host is a white-label boutique domain. */
export const BOUTIQUE_SLUG_HEADER = "x-boutique-slug";

/** Paths that skip the homepage intro mask — must stay scrollable immediately. */
export function shouldShowIntroLoader(pathname: string): boolean {
  return (
    !isMaintenancePath(pathname) &&
    !isAuthCallbackPath(pathname) &&
    !isTrMarketPath(pathname)
  );
}

export function rootHtmlClassName(
  pathname: string,
  boutiqueSlug?: string | null,
): string {
  if (!shouldShowIntroLoader(pathname)) {
    return "h-full antialiased";
  }
  if (boutiqueSlug?.trim()) {
    return "intro-loading intro-loading-boutique h-full antialiased";
  }
  return "intro-loading h-full antialiased";
}

export function clearIntroLoadingLock(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(
    "intro-loading",
    "intro-loading-boutique",
  );
  document.body.style.overflow = "";
}
