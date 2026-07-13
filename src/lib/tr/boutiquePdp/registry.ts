import type { TrBoutiquePdpLayoutId } from "@/lib/tr/boutiquePdp/types";

const DEFAULT_LAYOUT: TrBoutiquePdpLayoutId = "split";

/** Per-boutique PDP layout overrides — add slug → layout when a second template ships. */
const SLUG_OVERRIDES: Partial<Record<string, TrBoutiquePdpLayoutId>> = {
  // pervinsoysalbutik: "split",
};

export function resolveBoutiquePdpLayout(boutiqueSlug: string): TrBoutiquePdpLayoutId {
  return SLUG_OVERRIDES[boutiqueSlug] ?? DEFAULT_LAYOUT;
}
