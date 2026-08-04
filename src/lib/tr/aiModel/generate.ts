import {
  boutiqueAiModelHasReferences,
  getBoutiqueAiModelIdentity,
} from "@/lib/tr/aiModel/registry";
import { resolveAiModelProvider } from "@/lib/tr/aiModel/providers";
import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
} from "@/lib/tr/aiModel/types";

/**
 * Orchestrate on-model generation for a boutique garment cutout.
 * Safe to call from owner APIs — returns structured status, never throws for stub.
 */
export async function generateBoutiqueAiModelImage(
  request: TrAiModelGenerateRequest,
): Promise<TrAiModelGenerateResult> {
  const slug = request.boutiqueSlug.trim().toLowerCase();
  const identity = getBoutiqueAiModelIdentity(slug);

  if (!identity) {
    return {
      status: "failed",
      providerId: request.providerId ?? "stub",
      error: `Bu butik için AI model kimliği tanımlı değil (${slug}).`,
    };
  }

  if (!boutiqueAiModelHasReferences(slug)) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        "Model referans fotoğrafları eksik. Butikte çekilen portreleri registry'ye ekleyin.",
    };
  }

  if (!request.garment.cutoutImageUrl?.trim()) {
    return {
      status: "failed",
      providerId: request.providerId ?? "stub",
      error: "Garment cutout URL gerekli (önce arka plan temizliği).",
    };
  }

  const provider = resolveAiModelProvider(request.providerId);
  return provider.generate({
    ...request,
    boutiqueSlug: slug,
    pose: request.pose ?? identity.defaultPose ?? "standing-front",
    modelReferenceUrls: identity.referenceImageUrls,
    faceReferenceUrls: identity.faceReferenceUrls ?? [],
  });
}
