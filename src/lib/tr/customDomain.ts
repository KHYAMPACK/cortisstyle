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
  "minimora.shop": "minimora",
  "www.minimora.shop": "minimora",
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

// --- DB-backed resolution for src/proxy.ts only ---
//
// Proxy (formerly middleware) is the one place that decides whether a custom
// domain actually renders its boutique's storefront, so it's the one place
// where DB drift (the bug this section fixes) matters. Everything else in
// this file above is still read by 7 other call sites (SEO, favicon, auth
// redirect, and 3 browser components) that haven't been migrated off the
// hardcoded/env map yet — see the "propagate boutique-slug via header"
// follow-up task.

const EDGE_DOMAIN_MAP_TTL_MS = 120_000;

/** Env override only — no hardcoded fallback (that's the whole point here). */
function parseEnvDomainMapOnly(): Record<string, string> {
  const raw = process.env.TR_BOUTIQUE_DOMAINS?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, string> = {};
    for (const [host, slug] of Object.entries(parsed)) {
      const h = host.trim().toLowerCase();
      const s = slug.trim().toLowerCase();
      if (h && s) out[h] = s;
    }
    return out;
  } catch {
    return {};
  }
}

async function fetchBoutiqueDomainMapFromDb(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};

  try {
    const response = await fetch(
      `${url}/rest/v1/tr_boutiques_public?select=slug,custom_domain&custom_domain=not.is.null`,
      {
        headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return {};
    const rows = (await response.json()) as Array<{
      slug: string;
      custom_domain: string | null;
    }>;
    const out: Record<string, string> = {};
    for (const row of rows) {
      const host = row.custom_domain
        ?.trim()
        .toLowerCase()
        .replace(/^www\./, "");
      const slug = row.slug?.trim().toLowerCase();
      if (!host || !slug) continue;
      out[host] = slug;
      out[`www.${host}`] = slug;
    }
    return out;
  } catch {
    return {};
  }
}

let edgeCachedMap: Record<string, string> = {};
let edgeCachedAt = 0;
let edgeRefreshInFlight: Promise<void> | null = null;

async function refreshEdgeDomainMap(): Promise<void> {
  const dbMap = await fetchBoutiqueDomainMapFromDb();
  // Keep serving the last-known-good map on a failed/empty DB fetch rather
  // than wiping a working cache — a transient Supabase blip shouldn't take
  // every white-label domain down until the next refresh window.
  if (Object.keys(dbMap).length > 0 || Object.keys(edgeCachedMap).length === 0) {
    edgeCachedMap = { ...parseEnvDomainMapOnly(), ...dbMap };
  }
  edgeCachedAt = Date.now();
}

/**
 * DB `custom_domain` is the source of truth here — no hardcoded map.
 * `TR_BOUTIQUE_DOMAINS` env still works as an ops override for hosts not
 * yet in the DB. Short-TTL cache per warm Edge instance; only blocks on the
 * network for a truly cold instance (no cache yet).
 */
export async function resolveBoutiqueSlugFromHostAtEdge(
  host: string,
): Promise<string | null> {
  const isStale = Date.now() - edgeCachedAt > EDGE_DOMAIN_MAP_TTL_MS;
  if (isStale && !edgeRefreshInFlight) {
    edgeRefreshInFlight = refreshEdgeDomainMap().finally(() => {
      edgeRefreshInFlight = null;
    });
  }
  if (edgeCachedAt === 0 && edgeRefreshInFlight) {
    await edgeRefreshInFlight;
  }
  return edgeCachedMap[normalizeBoutiqueHost(host)] ?? null;
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
  if (pathname === "/adresler") {
    return `${base}/adresler`;
  }

  // Fallback: nest under boutique
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
