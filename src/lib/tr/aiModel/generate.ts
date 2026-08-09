import {
  aiModelOptionHasReferences,
  getAiModelOptionById,
  getBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";
import { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
} from "@/lib/tr/aiModel/types";

/**
 * Orchestrate on-model generation for a boutique garment cutout / packshot.
 * Safe to call from owner APIs — returns structured status, never throws for stub.
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
  return provider.generate({
    ...request,
    boutiqueSlug: slug,
    modelId: option.id,
    pose: request.pose ?? option.defaultPose ?? "standing-front",
    modelReferenceUrls: option.referenceImageUrls,
    faceReferenceUrls: option.faceReferenceUrls,
  });
}
