/**
 * AI on-model / lifestyle generation for boutique product photos.
 *
 * Pipeline:
 * 1. Owner uploads flat-lay → Photoroom cutout (marketplaceImages)
 * 2. Optional FASHN packshot polish → marketplaceImages
 * 3. Model identity from registry (boutique house or studio:ayla/selin/deniz).
 *    House model shot in several styles (Lila, non-elbise): owner picks blinds/flash;
 *    one random pose from that style.
 *    Studio (non-elbise): one random plate.
 *    Elbise: pinned grey-studio 3/4 + back plates; 3rd shot if detay chip.
 * 4. FASHN tryon-max only — not model-create
 */

export type {
  TrAiModelGarmentInput,
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelGenerateShot,
  TrAiModelGender,
  TrAiModelIdentity,
  TrAiModelJobStatus,
  TrAiModelOption,
  TrAiModelPose,
  TrAiModelProviderId,
  TrHousePhotographyStyle,
} from "@/lib/tr/aiModel/types";

export {
  aiModelOptionHasReferences,
  boutiqueAiModelHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
  getDefaultReadyAiModelId,
  resolveReadyAiModelId,
  getElbiseTryOnPlates,
  DEFAULT_HOUSE_PHOTOGRAPHY_STYLE,
  HOUSE_PHOTOGRAPHY_STYLE_LABELS,
  HOUSE_PHOTOGRAPHY_STYLES,
  housePhotographyStyleRefs,
  LILA_HOUSE_MODEL_ID,
  LILABUTIK_LILA_TRYON_REFS,
  LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
  listAiModelOptions,
  listRegisteredAiModelBoutiqueSlugs,
  modelHasPhotographyStyles,
  parseHousePhotographyStyle,
  pickDistinctModelReferenceUrls,
  pickRandomModelReferenceUrl,
  registerBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";

export {
  buildElbiseTryOnShots,
  chipsFromProductFeatures,
  elbiseModelShotCount,
  elbiseLifestyleShotLabel,
  hasElbiseDetay,
} from "@/lib/tr/aiModel/elbiseTryOn";

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
