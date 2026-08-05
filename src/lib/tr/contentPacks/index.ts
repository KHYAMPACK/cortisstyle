/**
 * Boutique self-serve Instagram content packs (Phase 3 sell-enablement).
 *
 * Client-safe exports only. Server generate/persist live in `./server`.
 *
 * Flow: product cutout → AI lifestyle (when configured) → caption + deep link + aspect presets.
 * Owners download / copy and post manually — no Meta publish in foundation.
 */

export type {
  BuildTrContentPackPayloadInput,
  CreateTrContentPackInput,
  TrContentPack,
  TrContentPackAspectId,
  TrContentPackAspectPreset,
  TrContentPackCaptionInput,
  TrContentPackFormat,
  TrContentPackStatus,
} from "@/lib/tr/contentPacks/types";

export {
  TR_CONTENT_PACK_ASPECTS,
  buildContentPackFormats,
  getContentPackAspect,
} from "@/lib/tr/contentPacks/aspects";

export { buildContentPackCaption } from "@/lib/tr/contentPacks/captions";
export { buildContentPackDeepLink } from "@/lib/tr/contentPacks/deepLink";
export { buildContentPackPayload } from "@/lib/tr/contentPacks/buildPack";
