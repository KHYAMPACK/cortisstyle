import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";
import {
  normalizeBoutiqueHost,
  resolveBoutiqueSlugFromHost,
} from "@/lib/tr/customDomain";

const DEFAULT_SITE_URL = "https://www.cortisstyle.com";

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
 * Prefer a boutique custom-domain origin when the host maps to `boutiqueSlug`.
 * Falls back to platform site URL (session lands on cortisstyle).
 */
export function resolveAuthRedirectOrigin(options?: {
  boutiqueSlug?: string | null;
  requestOrigin?: string | null;
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

  return getSiteUrl();
}

/** Supabase magic-link return URL — validates session then routes to wardrobe. */
export function getMagicLinkRedirectUrl(): string {
  const next = encodeURIComponent(WARDROBE_APP_PATH);
  return `${getSiteUrl()}/auth/callback?next=${next}`;
}

/** Password recovery link — lands on reset form after callback. */
export function getPasswordResetRedirectUrl(options?: {
  nextPath?: string;
  /** When set to a boutique custom-domain origin, recovery completes there. */
  siteOrigin?: string;
}): string {
  const afterReset = options?.nextPath?.trim() || "/wardrobe";
  const resetNext = encodeURIComponent(
    `/auth/reset-password?next=${encodeURIComponent(afterReset)}`,
  );
  const origin = (options?.siteOrigin?.trim() || getSiteUrl()).replace(
    /\/$/,
    "",
  );
  return `${origin}/auth/callback?next=${resetNext}`;
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
