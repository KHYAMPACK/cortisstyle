/**
 * Custom-domain → boutique slug map for white-label storefronts.
 * Env JSON wins for Edge middleware; DB custom_domain is source of truth for admin/panel.
 *
 * Example: TR_BOUTIQUE_DOMAINS={"pervinsoysal.com":"pervinsoysalbutik","www.pervinsoysal.com":"pervinsoysalbutik"}
 */

const DEFAULT_DOMAIN_MAP: Record<string, string> = {
  "pervinsoysal.com": "pervinsoysalbutik",
  "www.pervinsoysal.com": "pervinsoysalbutik",
  "lilaboutiquedenizli.com": "lilabutik",
  "www.lilaboutiquedenizli.com": "lilabutik",
};

function parseEnvDomainMap(): Record<string, string> {
  const raw = process.env.TR_BOUTIQUE_DOMAINS?.trim();
  if (!raw) return { ...DEFAULT_DOMAIN_MAP };
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, string> = { ...DEFAULT_DOMAIN_MAP };
    for (const [host, slug] of Object.entries(parsed)) {
      const h = host.trim().toLowerCase();
      const s = slug.trim().toLowerCase();
      if (h && s) out[h] = s;
    }
    return out;
  } catch {
    return { ...DEFAULT_DOMAIN_MAP };
  }
}

let cachedMap: Record<string, string> | null = null;

export function getBoutiqueDomainMap(): Record<string, string> {
  if (!cachedMap) cachedMap = parseEnvDomainMap();
  return cachedMap;
}

/** Normalize host (strip port). */
export function normalizeBoutiqueHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

export function resolveBoutiqueSlugFromHost(host: string): string | null {
  const normalized = normalizeBoutiqueHost(host);
  return getBoutiqueDomainMap()[normalized] ?? null;
}

/**
 * Origin-level files crawlers request on the boutique hostname.
 * Shared by every custom domain — do not add a per-boutique sitemap/robots route.
 * Do not add `xml`/`txt` to the static-asset regex: `/feeds/*.xml` must still rewrite.
 */
export const BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS = [
  "/sitemap.xml",
  "/robots.txt",
  "/ads.txt",
  "/app-ads.txt",
  "/icon",
  "/apple-icon",
] as const;

const BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_SET = new Set<string>(
  BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_PATHS,
);

/**
 * Paths that must not be rewritten into the boutique storefront
 * (shared auth, APIs, Next internals, origin SEO files).
 */
export function isBoutiqueDomainPassthroughPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/.well-known/")
  ) {
    return true;
  }
  if (BOUTIQUE_DOMAIN_ORIGIN_PASSTHROUGH_SET.has(pathname)) {
    return true;
  }
  return /\.(?:png|jpe?g|webp|svg|ico|gif|woff2?|css|js|map)$/i.test(pathname);
}

/**
 * Map a request path on a custom domain to an internal /tr/{slug}/… path.
 * Root → boutique home; /urunler, /urun/:id, /yasal/:doc preserved under slug.
 */
export function rewriteBoutiqueDomainPath(
  boutiqueSlug: string,
  pathname: string,
): string {
  const slug = encodeURIComponent(boutiqueSlug);
  const base = `/tr/${slug}`;

  if (pathname === "/" || pathname === "") return base;

  // Own tenant URLs and owner panel stay. Do not serve Cadde (`/tr`, `/tr/kombinler`, …)
  // on a white-label host.
  if (pathname === base || pathname.startsWith(`${base}/`)) {
    return pathname;
  }
  if (pathname === "/tr/panel" || pathname.startsWith("/tr/panel/")) {
    return pathname;
  }
  if (pathname === "/tr" || pathname.startsWith("/tr/")) {
    return base;
  }

  // Short white-label paths
  if (pathname === "/urunler" || pathname.startsWith("/urunler?")) {
    return `${base}/urunler${pathname.includes("?") ? pathname.slice(pathname.indexOf("?")) : ""}`;
  }
  if (pathname.startsWith("/urun/")) {
    return `${base}${pathname}`;
  }
  if (pathname.startsWith("/yasal/")) {
    return `${base}${pathname}`;
  }
  // Google Merchant feed (scheduled fetch)
  if (
    pathname === "/feeds/google-merchant.xml" ||
    pathname.startsWith("/feeds/")
  ) {
    return `${base}${pathname}`;
  }
  if (pathname === "/sepet") {
    return `${base}/sepet`;
  }
  if (pathname === "/favoriler") {
    return `${base}/favoriler`;
  }
  if (pathname === "/odeme") {
    return `${base}/odeme`;
  }
  if (pathname === "/siparis-onay") {
    return `${base}/siparis-onay`;
  }
  if (pathname === "/giris" || pathname === "/hesap") {
    return `${base}/giris`;
  }

  // Fallback: nest under boutique
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
