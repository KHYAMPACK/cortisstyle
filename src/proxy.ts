import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PATHNAME_HEADER, BOUTIQUE_SLUG_HEADER } from "@/lib/introLoader";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import {
  isBoutiqueDomainPassthroughPath,
  isCanonicalRedirectExemptPath,
  lookupBoutiqueCustomDomainAtEdge,
  parsePlatformBoutiquePath,
  resolveBoutiqueSlugFromHostAtEdge,
  rewriteBoutiqueDomainPath,
  storesDomainFromEnv,
} from "@/lib/tr/customDomain";
import {
  resolveCanonicalRedirect,
  resolveStoreHostKind,
  type StoreHostKind,
  type StoreRedirectTarget,
} from "@/lib/tr/seo/storeAddress";
import { productPagePath, productRedirectTarget } from "@/lib/tr/catalog/productRedirectRules";
import { lookupProductRedirectAtEdge } from "@/lib/tr/catalog/productRedirectsAtEdge";
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

function withPathnameRequest(
  request: NextRequest,
  boutiqueSlug: string | null,
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);
  if (boutiqueSlug) {
    requestHeaders.set(BOUTIQUE_SLUG_HEADER, boutiqueSlug);
  }
  return requestHeaders;
}

function nextWithPathname(
  request: NextRequest,
  boutiqueSlug: string | null,
): NextResponse {
  return NextResponse.next({
    request: { headers: withPathnameRequest(request, boutiqueSlug) },
  });
}

function rewriteWithPathname(
  request: NextRequest,
  url: URL,
  boutiqueSlug: string | null,
): NextResponse {
  return NextResponse.rewrite(url, {
    request: { headers: withPathnameRequest(request, boutiqueSlug) },
  });
}

/** A permanent redirect to a store's canonical host, preserving the query string. */
function redirectResponse(
  request: NextRequest,
  target: StoreRedirectTarget,
): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = target.host;
  url.port = "";
  const qIndex = target.path.indexOf("?");
  url.pathname = qIndex >= 0 ? target.path.slice(0, qIndex) : target.path;
  url.search = qIndex >= 0 ? target.path.slice(qIndex) : "";
  return NextResponse.redirect(url, 308);
}

/**
 * Store URLs (docs/product-upload-foundation-plan.md): does this request belong on a
 * different, canonical host — and if so, where? Handles two stray variants: the
 * platform's `/tr/<slug>/…` duplicate, and a boutique's default subdomain once a custom
 * domain is connected. `www.` vs apex on a custom domain is left to the hosting's domain
 * setting. Returns null (do nothing) for a path that never redirects (`isCanonicalRedirectExemptPath`), a host that isn't tied to
 * any one boutique, or a boutique with nothing canonical to send it to yet.
 */
async function resolveProxyRedirect(
  pathname: string,
  search: string,
  hostKind: StoreHostKind,
  storesDomain: string | null,
): Promise<StoreRedirectTarget | null | "not-found"> {
  if (isCanonicalRedirectExemptPath(pathname)) return null;

  if (hostKind.kind === "platform") {
    const parsed = parsePlatformBoutiquePath(pathname);
    if (!parsed) return null;
    const customDomain = await lookupBoutiqueCustomDomainAtEdge(parsed.slug);
    if (customDomain === undefined) return null; // not a real boutique slug; leave it alone
    return resolveCanonicalRedirect({
      hostKind,
      cleanPath: parsed.cleanPath + search,
      slug: parsed.slug,
      customDomain,
      storesDomain,
    });
  }

  if (hostKind.kind === "subdomain") {
    const customDomain = await lookupBoutiqueCustomDomainAtEdge(hostKind.slug);
    // Shape matched <slug>.<storesDomain>, but no boutique has this slug.
    if (customDomain === undefined) return "not-found";
    return resolveCanonicalRedirect({
      hostKind,
      cleanPath: pathname + search,
      slug: hostKind.slug,
      customDomain,
      storesDomain,
    });
  }

  // custom-domain kind: apex and www. are both served as they are; the hosting's domain
  // setting picks the primary one (redirecting www. here looped with it).
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isMaintenanceModeEnabled() &&
    !isAllowedDuringMaintenance(pathname)
  ) {
    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  // White-label custom domains (e.g. example.com → /tr/lilabutik/…) and, once
  // TR_STORES_DOMAIN is set, every boutique's default subdomain (<slug>.<that domain>).
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const customDomainSlug = await resolveBoutiqueSlugFromHostAtEdge(host);
  const storesDomain = storesDomainFromEnv();
  const hostKind = resolveStoreHostKind({ host, storesDomain, customDomainSlug });

  const redirect = await resolveProxyRedirect(
    pathname,
    request.nextUrl.search,
    hostKind,
    storesDomain,
  );
  if (redirect === "not-found") {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (redirect) {
    return redirectResponse(request, redirect);
  }

  const boutiqueSlug =
    hostKind.kind === "custom-domain" || hostKind.kind === "subdomain"
      ? hostKind.slug
      : null;

  // A product address that moved (renamed slug, colour merged into another product):
  // answered here with a real 308, since the product page streams behind loading.tsx and
  // a redirect from inside it can only be a meta refresh.
  const productPath = productPagePath(pathname, boutiqueSlug);
  if (productPath) {
    const moved = await lookupProductRedirectAtEdge(productPath.boutiqueSlug, productPath.param);
    if (moved) {
      const target = productRedirectTarget(productPath, moved, request.nextUrl.search);
      const url = request.nextUrl.clone();
      url.pathname = target.pathname;
      url.search = target.search;
      return NextResponse.redirect(url, 308);
    }
  }
  if (boutiqueSlug && BOUTIQUE_WELL_KNOWN_ICON_PATHS.has(pathname)) {
    const iconPath = resolveHostFaviconPublicPath(boutiqueSlug);
    const url = request.nextUrl.clone();
    url.pathname = iconPath;
    url.search = "";
    return rewriteWithPathname(request, url, boutiqueSlug);
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
      return rewriteWithPathname(request, url, boutiqueSlug);
    }
  }

  return nextWithPathname(request, boutiqueSlug);
}

export const config = {
  // Skip `/api/*` — nested owner APIs 404 as HTML when this matcher
  // includes them (panel then fails with Unexpected token '<').
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
