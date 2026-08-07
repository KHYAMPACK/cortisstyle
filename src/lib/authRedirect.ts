import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

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

/** Supabase magic-link return URL — validates session then routes to wardrobe. */
export function getMagicLinkRedirectUrl(): string {
  const next = encodeURIComponent(WARDROBE_APP_PATH);
  return `${getSiteUrl()}/auth/callback?next=${next}`;
}

/** Password recovery link — lands on reset form after callback. */
export function getPasswordResetRedirectUrl(options?: {
  nextPath?: string;
}): string {
  const afterReset = options?.nextPath?.trim() || "/wardrobe";
  const resetNext = encodeURIComponent(
    `/auth/reset-password?next=${encodeURIComponent(afterReset)}`,
  );
  return `${getSiteUrl()}/auth/callback?next=${resetNext}`;
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
