import type { TrAiModelIdentity } from "@/lib/tr/aiModel/types";

/**
 * In-code model registry. Later: load from boutique editorial_content / DB.
 * Populate referenceImageUrls after in-shop portrait shoot (e.g. Pervin).
 */
const BOUTIQUE_AI_MODELS: Record<string, TrAiModelIdentity> = {
  pervinsoysalbutik: {
    boutiqueSlug: "pervinsoysalbutik",
    displayName: "Pervin Soysal",
    referenceImageUrls: [],
    faceReferenceUrls: [],
    defaultPose: "standing-front",
    notes:
      "Fill referenceImageUrls after portrait shoot at the boutique. Used for on-model AI later.",
  },
};

export function getBoutiqueAiModelIdentity(
  boutiqueSlug: string,
): TrAiModelIdentity | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  return BOUTIQUE_AI_MODELS[slug] ?? null;
}

export function listRegisteredAiModelBoutiqueSlugs(): string[] {
  return Object.keys(BOUTIQUE_AI_MODELS);
}

/** Runtime/test helper — does not persist across deploys. */
export function registerBoutiqueAiModelIdentity(
  identity: TrAiModelIdentity,
): void {
  BOUTIQUE_AI_MODELS[identity.boutiqueSlug.trim().toLowerCase()] = identity;
}

export function boutiqueAiModelHasReferences(boutiqueSlug: string): boolean {
  const identity = getBoutiqueAiModelIdentity(boutiqueSlug);
  if (!identity) return false;
  return identity.referenceImageUrls.some((url) => Boolean(url?.trim()));
}
