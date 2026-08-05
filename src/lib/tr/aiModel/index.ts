/**
 * AI on-model / lifestyle generation for boutique product photos.
 *
 * Pipeline:
 * 1. Owner uploads flat-lay → Photoroom cutout (marketplaceImages)
 * 2. Optional FASHN packshot polish → marketplaceImages
 * 3. Model identity from registry (boutique house or studio:ayla/deniz)
 * 4. FASHN tryon-max → lifestyleImages + content packs
 */

export type {
  TrAiModelGarmentInput,
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelIdentity,
  TrAiModelJobStatus,
  TrAiModelOption,
  TrAiModelPose,
  TrAiModelProviderId,
} from "@/lib/tr/aiModel/types";

export {
  aiModelOptionHasReferences,
  boutiqueAiModelHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
  listAiModelOptions,
  listRegisteredAiModelBoutiqueSlugs,
  registerBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";

export { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel/generate";
export { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
