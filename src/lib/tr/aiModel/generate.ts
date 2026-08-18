import {
  aiModelOptionHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
  isLilaHouseModelId,
  LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
  lilaTryOnShotCount,
  parseLilaPhotographyStyle,
  pickDistinctModelReferenceUrls,
  pickRandomModelReferenceUrl,
} from "@/lib/tr/aiModel/registry";
import { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
} from "@/lib/tr/aiModel/types";

/**
 * Orchestrate on-model generation for a boutique garment cutout / packshot.
 * Lila + style: one random plate from that style’s three poses. Studio: one random plate.
 */
export async function generateBoutiqueAiModelImage(
  request: TrAiModelGenerateRequest,
): Promise<TrAiModelGenerateResult> {
  const slug = request.boutiqueSlug.trim().toLowerCase();
  const modelId =
    request.modelId?.trim() ||
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

  if (!aiModelOptionHasReferences(option.id)) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        "Model referans fotoğrafları eksik. Stüdyo modeli için env URL'leri veya butik portrelerini ekleyin.",
    };
  }

  if (!request.garment.cutoutImageUrl?.trim()) {
    return {
      status: "failed",
      providerId: request.providerId ?? "stub",
      error:
        "Giydirme için ön katalog (packshot) görseli gerekli. Ham ürün fotoğrafı kullanılamaz.",
    };
  }

  const provider = resolveAiModelProvider(request.providerId);
  const lila = isLilaHouseModelId(option.id);
  const photographyStyle = lila
    ? parseLilaPhotographyStyle(request.photographyStyle)
    : undefined;
  const shotCount = lilaTryOnShotCount(option.id);
  const pool = photographyStyle
    ? [...LILABUTIK_LILA_TRYON_REFS_BY_STYLE[photographyStyle]]
    : option.referenceImageUrls;
  const refs =
    shotCount > 1
      ? pickDistinctModelReferenceUrls(pool, shotCount)
      : (() => {
          const one = pickRandomModelReferenceUrl(pool);
          return one ? [one] : [];
        })();

  if (refs.length === 0) {
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

  for (const ref of refs) {
    const result = await provider.generate({
      ...request,
      boutiqueSlug: slug,
      modelId: option.id,
      photographyStyle,
      pose: request.pose ?? option.defaultPose ?? "standing-front",
      modelReferenceUrls: [ref],
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

  return {
    status: "succeeded",
    providerId: provider.id,
    imageUrl: imageUrls[0],
    imageUrls,
    jobId: lastJobId,
    creditsUsed: creditsUsed || null,
    error:
      imageUrls.length < refs.length
        ? lastError ?? "İkinci model karesi üretilemedi."
        : undefined,
    stub,
  };
}
