import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { isTrMarketPath } from "@/lib/marketPreference";

export const PATHNAME_HEADER = "x-pathname";

/** Paths that skip the homepage intro mask — must stay scrollable immediately. */
export function shouldShowIntroLoader(pathname: string): boolean {
  return (
    !isMaintenancePath(pathname) &&
    !isAuthCallbackPath(pathname) &&
    !isTrMarketPath(pathname)
  );
}

export function rootHtmlClassName(pathname: string): string {
  return shouldShowIntroLoader(pathname)
    ? "intro-loading h-full antialiased"
    : "h-full antialiased";
}

export function clearIntroLoadingLock(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("intro-loading");
  document.body.style.overflow = "";
}
