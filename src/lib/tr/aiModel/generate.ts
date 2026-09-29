import {
  aiModelOptionHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
  housePhotographyStyleRefs,
  parseHousePhotographyStyle,
  pickRandomModelReferenceUrl,
} from "@/lib/tr/aiModel/registry";
import { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelGenerateShot,
} from "@/lib/tr/aiModel/types";

const POSES: TrAiModelGenerateShot["pose"][] = [
  "standing-front",
  "standing-back",
  "standing-three-quarter",
  "full-body",
  "waist-up",
];

function sanitizeShots(
  raw: TrAiModelGenerateShot[] | undefined,
): TrAiModelGenerateShot[] {
  if (!raw?.length) return [];
  const shots: TrAiModelGenerateShot[] = [];
  for (const entry of raw.slice(0, 3)) {
    const cutoutImageUrl = entry.cutoutImageUrl?.trim() ?? "";
    const modelReferenceUrl = entry.modelReferenceUrl?.trim() ?? "";
    if (!cutoutImageUrl || !modelReferenceUrl) continue;
    const pose = POSES.includes(entry.pose) ? entry.pose : "standing-front";
    shots.push({
      pose,
      cutoutImageUrl,
      modelReferenceUrl,
      prompt: entry.prompt?.trim() || undefined,
    });
  }
  return shots;
}

/**
 * Orchestrate on-model generation for a boutique garment cutout / packshot.
 * House model with styles (Lila): one random plate from the chosen style’s three poses. Studio: one random plate.
 * Elbise: pass `shots` with pinned plates and garments (2–3, all must succeed).
 */
export async function generateBoutiqueAiModelImage(
  request: TrAiModelGenerateRequest,
): Promise<TrAiModelGenerateResult> {
  const slug = request.boutiqueSlug.trim().toLowerCase();
  const requestedId = request.modelId?.trim() || "";
  const modelId =
    requestedId ||
    (getBoutiqueAiModelIdentity(slug) ? `boutique:${slug}` : "");

  const option = modelId
    ? getAiModelOptionById(modelId, slug)
    : getBoutiqueAiModelIdentity(slug)
      ? getAiModelOptionById(`boutique:${slug}`, slug)
      : null;

  if (!option) {
    return {
      status: "failed",
      providerId: request.providerId ?? "stub",
      error: modelId
        ? `Model bulunamadı (${modelId}).`
        : `Bu butik için AI model kimliği tanımlı değil (${slug}).`,
    };
  }

  const pinned = sanitizeShots(request.shots);
  if (pinned.length === 0 && !aiModelOptionHasReferences(option.id)) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        "Model referans fotoğrafları eksik. Stüdyo modeli için env URL'leri veya butik portrelerini ekleyin.",
    };
  }

  if (pinned.length === 0 && !request.garment.cutoutImageUrl?.trim()) {
    return {
      status: "failed",
      providerId: request.providerId ?? "stub",
      error:
        "Giydirme için ön katalog (packshot) görseli gerekli. Ham ürün fotoğrafı kullanılamaz.",
    };
  }

  const provider = resolveAiModelProvider(request.providerId);
  const styleRefs = housePhotographyStyleRefs(option.id);
  const photographyStyle = styleRefs
    ? parseHousePhotographyStyle(request.photographyStyle)
    : undefined;

  const jobs: Array<{
    ref: string;
    pose: TrAiModelGenerateShot["pose"];
    cutoutImageUrl: string;
    prompt?: string;
  }> =
    pinned.length > 0
      ? pinned.map((shot) => ({
          ref: shot.modelReferenceUrl,
          pose: shot.pose,
          cutoutImageUrl: shot.cutoutImageUrl,
          prompt: shot.prompt ?? request.prompt,
        }))
      : (() => {
          // One try-on per run: a random plate (from the chosen style, if any).
          const pool =
            styleRefs && photographyStyle
              ? [...styleRefs[photographyStyle]]
              : option.referenceImageUrls;
          const one = pickRandomModelReferenceUrl(pool);
          const refs = one ? [one] : [];
          const cutout = request.garment.cutoutImageUrl.trim();
          return refs.map((ref) => ({
            ref,
            pose: request.pose ?? option.defaultPose ?? "standing-front",
            cutoutImageUrl: cutout,
            prompt: request.prompt,
          }));
        })();

  if (jobs.length === 0) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        "Model referans fotoğrafları eksik. Stüdyo modeli için env URL'leri veya butik portrelerini ekleyin.",
    };
  }

  const imageUrls: string[] = [];
  let creditsUsed = 0;
  let lastJobId: string | undefined;
  let lastError: string | undefined;
  let lastStatus: TrAiModelGenerateResult["status"] = "failed";
  let stub = false;
  const requireAll = pinned.length > 0;

  for (const job of jobs) {
    const result = await provider.generate({
      ...request,
      boutiqueSlug: slug,
      modelId: option.id,
      photographyStyle,
      pose: job.pose,
      prompt: job.prompt,
      garment: {
        ...request.garment,
        cutoutImageUrl: job.cutoutImageUrl,
      },
      modelReferenceUrls: [job.ref],
      faceReferenceUrls: option.faceReferenceUrls,
    });
    lastStatus = result.status;
    lastJobId = result.jobId;
    stub = Boolean(result.stub);
    if (typeof result.creditsUsed === "number") {
      creditsUsed += result.creditsUsed;
    }
    if (result.status !== "succeeded" || !result.imageUrl?.trim()) {
      lastError = result.error ?? "Model görseli üretilemedi.";
      break;
    }
    imageUrls.push(result.imageUrl.trim());
  }

  if (imageUrls.length === 0) {
    return {
      status: lastStatus === "not_configured" ? "not_configured" : "failed",
      providerId: provider.id,
      jobId: lastJobId,
      creditsUsed: creditsUsed || null,
      error: lastError ?? "Model görseli üretilemedi.",
      stub,
    };
  }

  if (requireAll && imageUrls.length < jobs.length) {
    return {
      status: "failed",
      providerId: provider.id,
      jobId: lastJobId,
      creditsUsed: creditsUsed || null,
      error: lastError ?? "Tüm model kareleri üretilemedi.",
      stub,
    };
  }

  return {
    status: "succeeded",
    providerId: provider.id,
    imageUrl: imageUrls[0],
    imageUrls,
    jobId: lastJobId,
    creditsUsed: creditsUsed || null,
    error:
      imageUrls.length < jobs.length
        ? lastError ?? "İkinci model karesi üretilemedi."
        : undefined,
    stub,
  };
}
