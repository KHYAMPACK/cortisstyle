import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PATHNAME_HEADER, BOUTIQUE_SLUG_HEADER } from "@/lib/introLoader";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import {
  isBoutiqueDomainPassthroughPath,
  resolveBoutiqueSlugFromHost,
  rewriteBoutiqueDomainPath,
} from "@/lib/tr/customDomain";
import {
  BOUTIQUE_WELL_KNOWN_ICON_PATHS,
  resolveHostFaviconPublicPath,
} from "@/lib/tr/seo/hostFavicon";

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

function isAllowedDuringMaintenance(pathname: string): boolean {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }

  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/reset-password")
  ) {
    return true;
  }

  if (pathname === "/privacy" || pathname === "/terms") {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/brand/") || pathname.startsWith("/images/")) {
    return true;
  }

  if (pathname.startsWith("/tr/")) {
    return true;
  }

  if (pathname === "/icon.png" || pathname === "/apple-icon.png") {
    return true;
  }

  return /\.(?:png|jpe?g|webp|svg|ico|gif|woff2?)$/i.test(pathname);
}

function withPathnameRequest(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const boutiqueSlug = resolveBoutiqueSlugFromHost(host);
  if (boutiqueSlug) {
    requestHeaders.set(BOUTIQUE_SLUG_HEADER, boutiqueSlug);
  }
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

  if (
    isMaintenanceModeEnabled() &&
    !isAllowedDuringMaintenance(pathname)
  ) {
    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  // White-label custom domains (e.g. pervinsoysal.com → /tr/pervinsoysalbutik/…)
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const boutiqueSlug = resolveBoutiqueSlugFromHost(host);
  if (boutiqueSlug && BOUTIQUE_WELL_KNOWN_ICON_PATHS.has(pathname)) {
    const iconPath = resolveHostFaviconPublicPath(boutiqueSlug);
    const url = request.nextUrl.clone();
    url.pathname = iconPath;
    url.search = "";
    return rewriteWithPathname(request, url);
  }
  // Origin SEO (/sitemap.xml, /robots.txt, /.well-known) must passthrough —
  // see BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS. Do not nest under /tr/{slug}.
  if (boutiqueSlug && !isBoutiqueDomainPassthroughPath(pathname)) {
    const rewritten = rewriteBoutiqueDomainPath(boutiqueSlug, pathname);
    if (rewritten !== pathname) {
      const url = request.nextUrl.clone();
      const qIndex = rewritten.indexOf("?");
      if (qIndex >= 0) {
        url.pathname = rewritten.slice(0, qIndex);
        url.search = rewritten.slice(qIndex);
      } else {
        url.pathname = rewritten;
      }
      return rewriteWithPathname(request, url);
    }
  }

  // Turkey-first product: platform root always goes to Cadde.
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/tr", request.url));
  }

  return nextWithPathname(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
