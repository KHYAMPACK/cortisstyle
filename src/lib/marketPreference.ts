import type { NextRequest } from "next/server";

export const VERCEL_COUNTRY_HEADER = "x-vercel-ip-country";
export const TR_COUNTRY_CODE = "TR";

const LEGAL_PATHS = new Set([
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/about",
  "/contact",
  "/maintenance",
]);

export function isTrMarketPath(pathname: string): boolean {
  return pathname === "/tr" || pathname.startsWith("/tr/");
}

export function getCountryFromRequest(request: NextRequest): string | null {
  const vercelCountry = request.headers.get(VERCEL_COUNTRY_HEADER)?.trim();
  if (vercelCountry) return vercelCountry.toUpperCase();

  if (process.env.NODE_ENV === "development") {
    const devCountry = process.env.MARKET_DEV_COUNTRY?.trim();
    if (devCountry) return devCountry.toUpperCase();
  }

  return null;
}

export function isTurkishVisitor(countryCode: string | null): boolean {
  return countryCode === TR_COUNTRY_CODE;
}

/** Paths that must never be auto-routed by market middleware. */
export function isMarketRoutingExcludedPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/studio")) return true;
  if (pathname.startsWith("/wardrobe")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/brand/") || pathname.startsWith("/images/")) return true;
  if (LEGAL_PATHS.has(pathname)) return true;
  if (pathname === "/icon.png" || pathname === "/apple-icon.png") return true;
  if (/\.(?:png|jpe?g|webp|svg|ico|gif|woff2?)$/i.test(pathname)) return true;
  return false;
}

/** Turkish visitors hitting the international homepage go to /tr. */
export function shouldRedirectRootToTr(
  pathname: string,
  countryCode: string | null,
): boolean {
  return pathname === "/" && isTurkishVisitor(countryCode);
}
