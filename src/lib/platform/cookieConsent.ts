export const COOKIE_CONSENT_STORAGE_KEY = "cortisstyle-cookie-notice-accepted";

export function hasAcceptedCookieNotice(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

export function acceptCookieNotice(): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures — banner may reappear next visit.
  }
}
