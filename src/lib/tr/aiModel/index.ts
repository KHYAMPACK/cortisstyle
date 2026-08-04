/**
 * AI on-model / lifestyle generation for boutique product photos.
 *
 * Pipeline (planned):
 * 1. Owner uploads flat-lay → Photoroom cutout (marketplaceImages)
 * 2. Boutique has a registered model identity (reference photos of the owner)
 * 3. Provider composites garment cutout onto the model → lifestyle URL
 * 4. Result stored alongside product (future: lifestyleImages[])
 *
 * Providers are swappable via registry — do not hardcode a vendor in UI.
 */

export type {
  TrAiModelGarmentInput,
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelIdentity,
  TrAiModelJobStatus,
  TrAiModelPose,
  TrAiModelProviderId,
} from "@/lib/tr/aiModel/types";

export {
  boutiqueAiModelHasReferences,
  getBoutiqueAiModelIdentity,
  listRegisteredAiModelBoutiqueSlugs,
  registerBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";

export { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel/generate";
export { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
