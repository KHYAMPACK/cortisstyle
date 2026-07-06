import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PATHNAME_HEADER } from "@/lib/introLoader";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import {
  getCountryFromRequest,
  isMarketRoutingExcludedPath,
  isTrMarketPath,
  shouldRedirectRootToTr,
} from "@/lib/marketPreference";
import { handleStudioPreflight } from "@/lib/studioApiCors";

const STUDIO_API_PREFIX = "/api/studio";
const STUDIO_APP_PREFIX = "/studio";

function isStudioApiPath(pathname: string): boolean {
  return pathname.startsWith(STUDIO_API_PREFIX);
}

function isStudioStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith(`${STUDIO_APP_PREFIX}/assets/`) ||
    pathname === `${STUDIO_APP_PREFIX}/favicon.svg` ||
    pathname === `${STUDIO_APP_PREFIX}/icons.svg`
  );
}

function shouldServeStudioSpa(pathname: string): boolean {
  if (!pathname.startsWith(STUDIO_APP_PREFIX)) return false;
  if (isStudioStaticAsset(pathname)) return false;
  if (pathname === STUDIO_APP_PREFIX || pathname === `${STUDIO_APP_PREFIX}/`) {
    return true;
  }
  if (pathname === `${STUDIO_APP_PREFIX}/index.html`) return false;
  return !/\.[a-z0-9]+$/i.test(pathname);
}

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

function isAllowedDuringMaintenance(pathname: string): boolean {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }

  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/studio") ||
    pathname.startsWith("/auth/reset-password")
  ) {
    return true;
  }

  if (
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/affiliate-disclosure" ||
    pathname === "/about" ||
    pathname === "/contact"
  ) {
    return true;
  }

  if (pathname.startsWith(STUDIO_APP_PREFIX)) {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/brand/") || pathname.startsWith("/images/")) {
    return true;
  }

  if (pathname === "/icon.png" || pathname === "/apple-icon.png") {
    return true;
  }

  return /\.(?:png|jpe?g|webp|svg|ico|gif|woff2?)$/i.test(pathname);
}

function handleMarketRouting(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (isMarketRoutingExcludedPath(pathname) || isTrMarketPath(pathname)) {
    return null;
  }

  const countryCode = getCountryFromRequest(request);

  if (!shouldRedirectRootToTr(pathname, countryCode)) {
    return null;
  }

  return NextResponse.redirect(new URL("/tr", request.url));
}

function withPathnameRequest(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return requestHeaders;
}

function nextWithPathname(request: NextRequest): NextResponse {
  return NextResponse.next({
    request: { headers: withPathnameRequest(request) },
  });
}

function rewriteWithPathname(request: NextRequest, url: URL): NextResponse {
  return NextResponse.rewrite(url, {
    request: { headers: withPathnameRequest(request) },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStudioApiPath(pathname) && request.method === "OPTIONS") {
    const preflight = handleStudioPreflight(request);
    if (preflight) return preflight;
  }

  if (
    isMaintenanceModeEnabled() &&
    !isAllowedDuringMaintenance(pathname) &&
    !isStudioApiPath(pathname)
  ) {
    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  const marketRedirect = handleMarketRouting(request);
  if (marketRedirect) return marketRedirect;

  if (shouldServeStudioSpa(pathname)) {
    return rewriteWithPathname(
      request,
      new URL("/studio/index.html", request.url),
    );
  }

  return nextWithPathname(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
