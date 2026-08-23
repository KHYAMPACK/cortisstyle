/**
 * AI on-model / lifestyle generation for boutique product photos.
 *
 * Pipeline:
 * 1. Owner uploads flat-lay → Photoroom cutout (marketplaceImages)
 * 2. Optional FASHN packshot polish → marketplaceImages
 * 3. Model identity from registry (boutique house or studio:ayla/selin/deniz).
 *    Lila: owner picks blinds/flash; one random pose from that style’s three plates.
 *    Studio: one random plate.
 * 4. FASHN tryon-max only — not model-create
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
  TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/types";

export {
  aiModelOptionHasReferences,
  boutiqueAiModelHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
  getDefaultReadyAiModelId,
  isLilaHouseModelId,
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  LILA_HOUSE_MODEL_ID,
  LILA_PHOTOGRAPHY_STYLE_LABELS,
  LILA_TRYON_SHOTS_PER_STYLE,
  LILABUTIK_LILA_TRYON_REFS,
  LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
  lilaTryOnShotCount,
  listAiModelOptions,
  listRegisteredAiModelBoutiqueSlugs,
  parseLilaPhotographyStyle,
  pickDistinctModelReferenceUrls,
  pickRandomModelReferenceUrl,
  registerBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";

export {
  NATURAL_TRYON_PROMPT,
  NATURAL_TRYON_PROMPT_BACK,
  tryOnPromptForPose,
  STUDIO_AYLA_MODEL_CREATE_PROMPT,
  STUDIO_DENIZ_MODEL_CREATE_PROMPT,
  STUDIO_SELIN_MODEL_CREATE_PROMPT,
} from "@/lib/tr/aiModel/prompts";

export { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel/generate";
export { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
