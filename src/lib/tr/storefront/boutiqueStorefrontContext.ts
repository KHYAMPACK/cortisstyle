"use client";

import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";

/**
 * Boutique slug resolved server-side (proxy.ts, from `tr_boutiques.custom_domain`),
 * threaded down to client components instead of each one re-deriving it from
 * `window.location.host` against a hardcoded/env domain map.
 */
const BoutiqueSlugContext = createContext<string | null>(null);

export function BoutiqueSlugProvider({
  value,
  children,
}: {
  value: string | null;
  children: ReactNode;
}) {
  return createElement(BoutiqueSlugContext.Provider, { value }, children);
}

/** Client: boutique slug when the current host is a white-label custom domain. */
export function useBoutiqueSlug(): string | null {
  return useContext(BoutiqueSlugContext);
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
