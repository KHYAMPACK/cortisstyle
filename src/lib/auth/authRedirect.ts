import {
  getBoutiqueDomainMap,
  normalizeBoutiqueHost,
  resolveBoutiqueSlugFromHost,
} from "@/lib/tr/customDomain";

const DEFAULT_SITE_URL = "https://www.cortisstyle.com";
/** Default post-auth landing for the Turkey-first product. */
export const DEFAULT_AUTH_NEXT_PATH = "/tr";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_SITE_URL;
}

/**
 * Prefer a boutique custom-domain origin when the host maps to `boutiqueSlug`,
 * or when the boutique has a known custom domain. Falls back to platform site URL.
 */
export function resolveAuthRedirectOrigin(options?: {
  boutiqueSlug?: string | null;
  requestOrigin?: string | null;
  /** DB / seed custom domain host (e.g. lilaboutiquedenizli.com). */
  customDomain?: string | null;
}): string {
  const slug = options?.boutiqueSlug?.trim().toLowerCase() || null;
  const originRaw = options?.requestOrigin?.trim() || "";

  if (slug && originRaw) {
    try {
      const url = new URL(originRaw);
      const host = normalizeBoutiqueHost(url.host);
      const mapped = resolveBoutiqueSlugFromHost(host);
      if (mapped === slug) {
        return url.origin.replace(/\/$/, "");
      }
    } catch {
      // ignore bad origin
    }
  }

  if (slug) {
    const fromRecord = normalizePublicHost(options?.customDomain);
    if (fromRecord && resolveBoutiqueSlugFromHost(fromRecord) === slug) {
      return `https://${fromRecord}`;
    }
    const fromMap = Object.entries(getBoutiqueDomainMap()).find(
      ([, mappedSlug]) => mappedSlug === slug,
    )?.[0];
    if (fromMap) {
      return `https://${normalizeBoutiqueHost(fromMap)}`;
    }
  }

  return getSiteUrl();
}

function normalizePublicHost(raw?: string | null): string | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/:\d+$/, "");
}

/** Supabase magic-link return URL — validates session then routes to `/tr`. */
export function getMagicLinkRedirectUrl(): string {
  const next = encodeURIComponent(DEFAULT_AUTH_NEXT_PATH);
  return `${getSiteUrl()}/auth/callback?next=${next}`;
}

/** Password recovery link — lands on reset form after callback. */
export function getPasswordResetRedirectUrl(options?: {
  nextPath?: string;
  /** When set to a boutique custom-domain origin, recovery completes there. */
  siteOrigin?: string;
  boutiqueSlug?: string | null;
}): string {
  const afterReset = options?.nextPath?.trim() || DEFAULT_AUTH_NEXT_PATH;
  const resetParams = new URLSearchParams({ next: afterReset });
  const boutiqueSlug = options?.boutiqueSlug?.trim().toLowerCase();
  if (boutiqueSlug) resetParams.set("boutique", boutiqueSlug);
  const resetNext = encodeURIComponent(
    `/auth/reset-password?${resetParams.toString()}`,
  );
  const origin = (options?.siteOrigin?.trim() || getSiteUrl()).replace(
    /\/$/,
    "",
  );
  return `${origin}/auth/callback?next=${resetNext}`;
}

/**
 * Branded recovery email href using `token_hash` + client `verifyOtp`.
 * Prefer this over Supabase `action_link` — admin generateLink is not PKCE-compatible,
 * so hash redirects often never create a session in the App Router callback.
 */
export function buildPasswordResetCallbackUrl(options: {
  tokenHash: string;
  nextPath?: string;
  siteOrigin?: string;
  boutiqueSlug?: string | null;
}): string {
  const afterReset = options.nextPath?.trim() || DEFAULT_AUTH_NEXT_PATH;
  const resetParams = new URLSearchParams({
    next: afterReset,
  });
  const boutiqueSlug = options.boutiqueSlug?.trim().toLowerCase();
  if (boutiqueSlug) {
    resetParams.set("boutique", boutiqueSlug);
  }
  const resetPath = `/auth/reset-password?${resetParams.toString()}`;
  const origin = (options.siteOrigin?.trim() || getSiteUrl()).replace(/\/$/, "");
  const params = new URLSearchParams({
    token_hash: options.tokenHash,
    type: "recovery",
    next: resetPath,
  });
  return `${origin}/auth/callback?${params.toString()}`;
}

/** Soft-sanitize post-auth next paths (same-origin relative only). */
export function safeAuthNextPath(
  raw: string | null | undefined,
  fallback = DEFAULT_AUTH_NEXT_PATH,
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname === "/auth/callback" || pathname.startsWith("/auth/callback/");
}

export function hasAuthTokensInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const { hash, search } = window.location;

  return (
    hash.includes("access_token=") ||
    hash.includes("type=magiclink") ||
    search.includes("code=") ||
    search.includes("token_hash=")
  );
}
