import { getSiteUrl } from "@/lib/authRedirect";

/** Lookbook Studio — integrated at /studio on the main site by default */

const LEGACY_STUDIO_SUBDOMAIN = "https://studio.cortisstyle.com";

export function getStudioAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_STUDIO_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteUrl()}/studio`;
}

export function isAllowedReturnTo(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const host = url.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    if (host === "studio.cortisstyle.com" || host.endsWith(".cortisstyle.com")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function resolveStudioReturnTo(raw: string | null | undefined): string {
  if (raw && isAllowedReturnTo(raw)) {
    const url = new URL(raw);
    url.hash = "";
    return url.toString();
  }

  return getStudioAppUrl();
}

export function isExternalStudioOrigin(returnTo: string, siteOrigin: string): boolean {
  try {
    return new URL(returnTo).origin !== new URL(siteOrigin).origin;
  } catch {
    return false;
  }
}

export function buildStudioSessionHandoffUrl(
  returnTo: string,
  accessToken: string,
  refreshToken: string,
): string {
  const url = new URL(returnTo);
  url.hash = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    type: "studio_handoff",
  }).toString();

  return url.toString();
}

/** Wardrobe / site CTA → lookbook studio (same-origin when integrated). */
export function getStudioEntryPath(): string {
  const studioUrl = getStudioAppUrl();

  try {
    const siteOrigin = new URL(getSiteUrl()).origin;
    const studio = new URL(studioUrl);

    if (studio.origin === siteOrigin) {
      return studio.pathname || "/studio";
    }
  } catch {
    // fall through to auth handoff
  }

  const returnTo = resolveStudioReturnTo(studioUrl);
  return `/auth/studio?returnTo=${encodeURIComponent(returnTo)}`;
}

/** @deprecated Legacy subdomain URL — kept for redirects during migration */
export function getLegacyStudioSubdomainUrl(): string {
  return LEGACY_STUDIO_SUBDOMAIN;
}
