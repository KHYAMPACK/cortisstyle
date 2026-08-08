import type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";

const DEFAULT_LAYOUT: TrBoutiqueHomeLayoutId = "default";

/** Hard overrides (client / demo templates that must stay editorial even without DB). */
const SLUG_OVERRIDES: Partial<Record<string, TrBoutiqueHomeLayoutId>> = {
  "demo-maya": "editorial",
  pervinsoysalbutik: "editorial",
  lilabutik: "editorial",
};

export function resolveBoutiqueHomeLayout(
  boutiqueSlug: string,
  homeLayout?: "default" | "editorial" | null,
): TrBoutiqueHomeLayoutId {
  const override = SLUG_OVERRIDES[boutiqueSlug];
  if (override) return override;
  if (homeLayout === "editorial") return "editorial";
  return DEFAULT_LAYOUT;
}
