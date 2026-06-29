/** Redirect helpers for lookbook-studio auth on studio.cortisstyle.com */

const DEFAULT_STUDIO_URL = "https://studio.cortisstyle.com";

export function getStudioAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_STUDIO_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return DEFAULT_STUDIO_URL;
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

/** Wardrobe / site CTA → lookbook-studio with session handoff when already signed in. */
export function getStudioEntryPath(): string {
  const studioUrl = resolveStudioReturnTo(getStudioAppUrl());
  return `/auth/studio?returnTo=${encodeURIComponent(studioUrl)}`;
}
