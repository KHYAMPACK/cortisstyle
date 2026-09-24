"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  PANEL_ORIGIN_PARAM,
  panelOriginLabel,
  parsePanelOrigin,
} from "@/lib/tr/panel/panelOrigin";

export interface PanelBackTarget {
  href: string;
  label: string;
  /** True when this page was reached from a page other than its usual parent. */
  fromElsewhere: boolean;
}

/**
 * Where an editor page's back arrow and first crumb should go: the page it was
 * opened from (`?from=`), or `fallback` — the page's usual parent — when opened
 * directly, from a bookmark, or from a page we don't have a name for.
 */
export function usePanelBackTarget(fallback: {
  href: string;
  label: string;
}): PanelBackTarget {
  const origin = parsePanelOrigin(useSearchParams().get(PANEL_ORIGIN_PARAM));
  const label = origin ? panelOriginLabel(origin) : null;
  if (origin && label) {
    // Coming back from the page's own parent (the list) is not "elsewhere".
    return {
      href: origin,
      label,
      fromElsewhere: pathOf(origin) !== pathOf(fallback.href),
    };
  }
  return { ...fallback, fromElsewhere: false };
}

function pathOf(href: string): string {
  return (href.split("?")[0] ?? "").replace(/\/$/, "");
}

/**
 * This page's own path and query, to pass as `from` on links to other pages so
 * they can come back here. It includes this page's own `from`, so a chain of
 * pages unwinds one step at a time.
 */
export function usePanelSelfPath(): string {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return query ? `${pathname}?${query}` : pathname;
}
