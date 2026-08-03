"use client";

import { useSyncExternalStore } from "react";
import { resolveBoutiqueSlugFromHost } from "@/lib/tr/customDomain";

function readHostSlug(): string | null {
  if (typeof window === "undefined") return null;
  return resolveBoutiqueSlugFromHost(window.location.host);
}

function subscribe() {
  return () => {};
}

/** Client: boutique slug when the browser host is a white-label custom domain. */
export function useBoutiqueHostSlug(
  serverSlug?: string | null,
): string | null {
  const hostSlug = useSyncExternalStore(subscribe, readHostSlug, () => null);
  return serverSlug?.trim() || hostSlug;
}

/** True when AppShell / Cortis CookieNotice should stay hidden. */
export function shouldHideCortisChrome(input: {
  pathname: string;
  boutiqueSlug?: string | null;
}): boolean {
  if (input.boutiqueSlug?.trim()) return true;
  const path = input.pathname;
  return path === "/tr" || path.startsWith("/tr/");
}
