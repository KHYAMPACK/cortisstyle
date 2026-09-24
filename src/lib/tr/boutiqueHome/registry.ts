import type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";

/**
 * Every boutique renders through the editorial shell now — the "default"
 * (Cadde-chrome) layout was retired along with the Cadde marketplace itself.
 * Kept as a function (not inlined at call sites) so the ~9 callers across
 * boutique routes don't need touching if a real second layout ever returns.
 */
export function resolveBoutiqueHomeLayout(
  _boutiqueSlug?: string,
  _homeLayout?: "default" | "editorial" | null,
): TrBoutiqueHomeLayoutId {
  return "editorial";
}
