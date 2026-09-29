/**
 * Custom-domain → boutique slug resolution for white-label storefronts.
 *
 * `resolveBoutiqueSlugFromHostAtEdge()` in src/proxy.ts is the only place
 * that ever resolves a request's host to a boutique slug — it stamps the
 * result onto the `x-boutique-slug` request header. Everything downstream
 * (SEO, favicon, auth redirect, the boutique-slug React context) reads that
 * header/context instead of re-deriving it, so there is exactly one source
 * of truth and no hardcoded per-tenant domain list in source.
 *
 * Example: TR_BOUTIQUE_DOMAINS={"example.com":"lilabutik","www.example.com":"lilabutik"}
 */

/** Normalize host (strip port). */
export function normalizeBoutiqueHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Store URLs (planned, docs/product-upload-foundation-plan.md): every boutique's default
 * address, `<slug>.<TR_STORES_DOMAIN>`. Pure host parsing only — not yet called from
 * `proxy.ts`; wiring it in (plus the existence check: does a boutique with this slug
 * actually exist) is a later step of that milestone.
 */

/**
 * Subdomain labels that must never resolve to a store, even once wildcard DNS answers for
 * all of them — infrastructure/reserved words a boutique could otherwise be slugged as.
 */
export const RESERVED_STORE_SUBDOMAIN_LABELS = new Set([
  "www",
  "api",
  "cdn",
  "static",
  "assets",
  "admin",
  "app",
  "mail",
  "ftp",
  "panel",
  "owner",
]);

/**
 * Does `host` look like `<slug>.<storesDomain>`? Pure — no DB, no network; a returned
 * slug is not guaranteed to belong to a real boutique, only to have the right shape.
 * `storesDomain` is normally `TR_STORES_DOMAIN` (see `resolveSlugFromStoresSubdomain`),
 * passed explicitly here so this stays testable without touching the environment.
 */
export function subdomainSlugOf(
  host: string,
  storesDomain: string | null,
): string | null {
  if (!storesDomain) return null;
  const normalizedHost = normalizeBoutiqueHost(host);
  const suffix = `.${storesDomain}`;
  if (!normalizedHost.endsWith(suffix)) return null;

  const label = normalizedHost.slice(0, -suffix.length);
  // A store's own subdomain is exactly one label: not "" (the bare stores domain, which
  // isn't a store) and not "a.b" (some other, deeper subdomain we don't own the meaning of).
  if (!label || label.includes(".")) return null;
  if (RESERVED_STORE_SUBDOMAIN_LABELS.has(label)) return null;
  return label;
}

export function storesDomainFromEnv(): string | null {
  const raw = process.env.TR_STORES_DOMAIN?.trim().toLowerCase().replace(/^\.+/, "");
  return raw && raw.includes(".") ? raw : null;
}

/**
 * `subdomainSlugOf` against `TR_STORES_DOMAIN`. Returns null (never throws) when the env
 * var is unset — this function is safe to call before that domain exists or is configured.
 */
export function resolveSlugFromStoresSubdomain(host: string): string | null {
  return subdomainSlugOf(host, storesDomainFromEnv());
}

const EDGE_DOMAIN_MAP_TTL_MS = 120_000;

/** `TR_BOUTIQUE_DOMAINS` env override — ops-controlled, no hardcoded fallback. */
function parseEnvDomainMap(): Record<string, string> {
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

interface EdgeBoutiqueMap {
  /** Host (bare or `www.`-prefixed) → slug, for boutiques with a connected custom domain. */
  hostToSlug: Record<string, string>;
  /** Every known boutique's slug → its custom domain, or null when it has none. A slug
   *  absent from this object is not a real boutique at all (see `lookupBoutiqueCustomDomainAtEdge`). */
  bySlug: Record<string, string | null>;
}

const EMPTY_EDGE_MAP: EdgeBoutiqueMap = { hostToSlug: {}, bySlug: {} };

async function fetchEdgeBoutiqueMapFromDb(): Promise<EdgeBoutiqueMap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return EMPTY_EDGE_MAP;

  try {
    // Every boutique, not just ones with a custom domain — the subdomain-existence check
    // and the platform-path canonical-redirect decision both need to know a slug is real
    // even when it has no custom domain yet.
    const response = await fetch(
      `${url}/rest/v1/tr_boutiques_public?select=slug,custom_domain`,
      {
        headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return EMPTY_EDGE_MAP;
    const rows = (await response.json()) as Array<{
      slug: string;
      custom_domain: string | null;
    }>;
    const hostToSlug: Record<string, string> = {};
    const bySlug: Record<string, string | null> = {};
    for (const row of rows) {
      const slug = row.slug?.trim().toLowerCase();
      if (!slug) continue;
      const host = row.custom_domain?.trim().toLowerCase().replace(/^www\./, "") || null;
      bySlug[slug] = host;
      if (host) {
        hostToSlug[host] = slug;
        hostToSlug[`www.${host}`] = slug;
      }
    }
    return { hostToSlug, bySlug };
  } catch {
    return EMPTY_EDGE_MAP;
  }
}

let edgeCachedMap: EdgeBoutiqueMap = EMPTY_EDGE_MAP;
let edgeCachedAt = 0;
let edgeRefreshInFlight: Promise<void> | null = null;

async function refreshEdgeBoutiqueMap(): Promise<void> {
  const dbMap = await fetchEdgeBoutiqueMapFromDb();
  // Keep serving the last-known-good map on a failed/empty DB fetch rather
  // than wiping a working cache — a transient Supabase blip shouldn't take
  // every white-label domain down until the next refresh window.
  const hasRows = Object.keys(dbMap.bySlug).length > 0;
  if (hasRows || Object.keys(edgeCachedMap.bySlug).length === 0) {
    const envMap = parseEnvDomainMap();
    const bySlug = { ...dbMap.bySlug };
    for (const [host, slug] of Object.entries(envMap)) {
      // The env override is for a host not yet saved to the DB row (testing DNS before
      // updating the column) — it wins for a boutique whose DB value is still empty.
      if (bySlug[slug] == null) bySlug[slug] = host;
    }
    edgeCachedMap = { hostToSlug: { ...envMap, ...dbMap.hostToSlug }, bySlug };
  }
  edgeCachedAt = Date.now();
}

async function ensureFreshEdgeBoutiqueMap(): Promise<void> {
  const isStale = Date.now() - edgeCachedAt > EDGE_DOMAIN_MAP_TTL_MS;
  if (isStale && !edgeRefreshInFlight) {
    edgeRefreshInFlight = refreshEdgeBoutiqueMap().finally(() => {
      edgeRefreshInFlight = null;
    });
  }
  if (edgeCachedAt === 0 && edgeRefreshInFlight) {
    await edgeRefreshInFlight;
  }
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
  await ensureFreshEdgeBoutiqueMap();
  return edgeCachedMap.hostToSlug[normalizeBoutiqueHost(host)] ?? null;
}

/**
 * A known boutique's custom domain (or null when it has none), or `undefined` when no
 * boutique has this slug at all. Store URLs: used to 404 an unknown subdomain rather than
 * falling through to platform routing, and to decide a platform-path or subdomain
 * request's canonical redirect.
 */
export async function lookupBoutiqueCustomDomainAtEdge(
  slug: string,
): Promise<string | null | undefined> {
  await ensureFreshEdgeBoutiqueMap();
  const normalized = slug.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(edgeCachedMap.bySlug, normalized)
    ? edgeCachedMap.bySlug[normalized]
    : undefined;
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

  // Own tenant URLs and owner panel stay. Do not serve platform `/tr/*` routes
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

/**
 * Paths that never redirect to a boutique's canonical host, on any host — framework
 * internals, shared auth, ACME challenges, and the owner panel (reachable on a boutique's
 * own host as well as the platform, by design — see `rewriteBoutiqueDomainPath`). Unlike
 * `isBoutiqueDomainPassthroughPath`, this does *not* cover origin SEO files or static
 * assets: those redirect like any other boutique path, pointing crawlers at the real
 * canonical host once one exists.
 */
export function isCanonicalRedirectExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/tr/panel" ||
    pathname.startsWith("/tr/panel/")
  );
}

/**
 * `/tr/<slug>` or `/tr/<slug>/…` on the platform host → the slug and the clean-path
 * equivalent (`/` for the bare boutique path). Null for anything else (the marketing
 * site, an unrelated path, or a malformed one) — nothing to redirect.
 *
 * Shape-level only, like `subdomainSlugOf`: it doesn't know "panel" or a nonexistent slug
 * are special — call `isCanonicalRedirectExemptPath` first, and check the slug exists,
 * before treating the result as a real boutique to redirect.
 */
export function parsePlatformBoutiquePath(
  pathname: string,
): { slug: string; cleanPath: string } | null {
  const match = /^\/tr\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(match[1]!);
  } catch {
    return null;
  }
  return { slug, cleanPath: match[2] || "/" };
}
