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
  TrAiModelGender,
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
  getDefaultReadyAiModelId,
  listAiModelOptions,
  listRegisteredAiModelBoutiqueSlugs,
  registerBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";

export {
  NATURAL_TRYON_PROMPT,
  NATURAL_TRYON_PROMPT_BACK,
  tryOnPromptForPose,
  STUDIO_AYLA_MODEL_CREATE_PROMPT,
  STUDIO_DENIZ_MODEL_CREATE_PROMPT,
} from "@/lib/tr/aiModel/prompts";

export { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel/generate";
export { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
