import type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";

const DEFAULT_LAYOUT: TrBoutiqueHomeLayoutId = "default";

/** Per-boutique homepage layout overrides. */
const SLUG_OVERRIDES: Partial<Record<string, TrBoutiqueHomeLayoutId>> = {
  "demo-maya": "editorial",
};

export function resolveBoutiqueHomeLayout(
  boutiqueSlug: string,
): TrBoutiqueHomeLayoutId {
  return SLUG_OVERRIDES[boutiqueSlug] ?? DEFAULT_LAYOUT;
}
