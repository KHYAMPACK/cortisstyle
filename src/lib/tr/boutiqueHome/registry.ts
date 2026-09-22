import type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";

const DEFAULT_LAYOUT: TrBoutiqueHomeLayoutId = "default";

/** Storefront template — DB `home_layout` column is the source of truth. */
export function resolveBoutiqueHomeLayout(
  _boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): TrBoutiqueHomeLayoutId {
  return homeLayout === "editorial" ? "editorial" : DEFAULT_LAYOUT;
}
