import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import type { TrBoutiquePdpLayoutId } from "@/lib/tr/boutiquePdp/types";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const DEFAULT_LAYOUT: TrBoutiquePdpLayoutId = "split";

/** Per-boutique PDP layout overrides — add slug → layout when a second template ships. */
const SLUG_OVERRIDES: Partial<Record<string, TrBoutiquePdpLayoutId>> = {};

export function resolveBoutiquePdpLayout(
  boutique: Pick<TrBoutiquePublic, "slug" | "catalogProfile">,
): TrBoutiquePdpLayoutId {
  if (isCustomArtCatalogProfile(boutique)) {
    return "custom_art";
  }
  return SLUG_OVERRIDES[boutique.slug] ?? DEFAULT_LAYOUT;
}

/** @deprecated Pass boutique object — slug-only misses catalog_profile. */
export function resolveBoutiquePdpLayoutBySlug(
  boutiqueSlug: string,
): TrBoutiquePdpLayoutId {
  return SLUG_OVERRIDES[boutiqueSlug] ?? DEFAULT_LAYOUT;
}
