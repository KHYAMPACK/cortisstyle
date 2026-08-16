/** Cadde marketplace page-transition curtain — never boutique / panel / custom-domain. */

export const CADDE_TRANSITION_WORD = "CORTISSTYLE";

export const CADDE_TRANSITION_COVER_MS = 580;
/** Knockout letters fill to solid black, then we navigate. */
export const CADDE_TRANSITION_FILL_MS = 320;
export const CADDE_TRANSITION_HOLD_MS = 220;
export const CADDE_TRANSITION_EXIT_MS = 480;
export const CADDE_TRANSITION_MAX_WAIT_MS = 2200;

const CADDE_MARKETPLACE_SEGMENTS = [
  "ara",
  "urunler",
  "favoriler",
  "butikler",
  "kombin",
  "kombinler",
  "sepet",
  "cart",
  "checkout",
  "odeme",
  "siparis-onay",
  "parca",
  "yakinda",
] as const;

/** Full page changes that get the brand curtain — not cart/checkout chrome. */
const CADDE_MAJOR_SEGMENTS = [
  "ara",
  "urunler",
  "favoriler",
  "butikler",
  "kombin",
  "kombinler",
  "parca",
  "yakinda",
] as const;

export function caddePathnameFromHref(href: string): string {
  let path = href;
  try {
    if (/^https?:\/\//i.test(href)) {
      path = new URL(href).pathname;
    }
  } catch {
    path = href;
  }
  return (path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/") as string;
}

function caddeFirstSegment(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  if (!path.startsWith("/tr/")) return "";
  return path.slice("/tr/".length).split("/")[0] ?? "";
}

export function isCaddeMarketplacePath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/tr") return true;
  return (CADDE_MARKETPLACE_SEGMENTS as readonly string[]).includes(
    caddeFirstSegment(path),
  );
}

export function isCaddeMajorPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/tr") return true;
  return (CADDE_MAJOR_SEGMENTS as readonly string[]).includes(
    caddeFirstSegment(path),
  );
}

export function shouldPlayCaddePageTransition(
  fromPath: string,
  href: string,
): boolean {
  const from = fromPath.replace(/\/$/, "") || "/";
  const to = caddePathnameFromHref(href);
  if (from === to) return false;
  return (
    isCaddeMarketplacePath(from) &&
    isCaddeMarketplacePath(to) &&
    isCaddeMajorPath(to)
  );
}

export function shouldPlayCaddeBackTransition(fromPath: string): boolean {
  return isCaddeMarketplacePath(fromPath) && isCaddeMajorPath(fromPath);
}
