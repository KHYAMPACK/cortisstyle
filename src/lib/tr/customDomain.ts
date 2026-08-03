/**
 * Custom-domain → boutique slug map for white-label storefronts.
 * Env JSON wins for Edge middleware; DB custom_domain is source of truth for admin/panel.
 *
 * Example: TR_BOUTIQUE_DOMAINS={"pervinsoysal.com":"pervinsoysalbutik","www.pervinsoysal.com":"pervinsoysalbutik"}
 */

const DEFAULT_DOMAIN_MAP: Record<string, string> = {
  "pervinsoysal.com": "pervinsoysalbutik",
  "www.pervinsoysal.com": "pervinsoysalbutik",
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
 * Paths that must not be rewritten into the boutique storefront
 * (shared auth, APIs, Next internals).
 */
export function isBoutiqueDomainPassthroughPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/studio")
  ) {
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

  // Already under /tr/… — leave alone
  if (pathname.startsWith("/tr/") || pathname === "/tr") return pathname;

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
  if (
    pathname === "/sepet" ||
    pathname === "/odeme" ||
    pathname === "/siparis-onay"
  ) {
    return `/tr${pathname}?boutique=${encodeURIComponent(boutiqueSlug)}`;
  }
  if (pathname === "/giris" || pathname === "/hesap") {
    return `${base}/giris`;
  }


  // Fallback: nest under boutique
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
