import { tryOnPromptForPose } from "@/lib/tr/aiModel/prompts";
import { isFashnConfigured } from "@/lib/tr/fashn/client";
import { generateFashnTryOn } from "@/lib/tr/fashn/tryon";
import { logTrAiUsageEvent } from "@/lib/tr/aiUsage";
import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelProviderId,
} from "@/lib/tr/aiModel/types";

export interface TrAiModelProvider {
  id: TrAiModelProviderId;
  isConfigured(): boolean;
  generate(
    request: TrAiModelGenerateRequest & {
      modelReferenceUrls: string[];
      faceReferenceUrls: string[];
    },
  ): Promise<TrAiModelGenerateResult>;
}

const stubProvider: TrAiModelProvider = {
  id: "stub",
  isConfigured: () => true,
  async generate(request) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        request.modelReferenceUrls.length === 0
          ? "Model referans fotoğrafları henüz eklenmedi."
          : "AI model sağlayıcısı henüz bağlanmadı (stub).",
    };
  },
};

const fashnProvider: TrAiModelProvider = {
  id: "fashn",
  isConfigured: () => isFashnConfigured(),
  async generate(request) {
    if (!isFashnConfigured()) {
      return {
        status: "not_configured",
        providerId: "fashn",
        stub: true,
        error: "FASHN_API_KEY yapılandırılmadı.",
      };
    }

    const modelImageUrl = request.modelReferenceUrls.find((url) =>
      Boolean(url?.trim()),
    );
    if (!modelImageUrl) {
      return {
        status: "failed",
        providerId: "fashn",
        error: "Model referans fotoğrafı eksik.",
      };
    }

    const userId = request.userId?.trim();
    const boutiqueId = request.boutiqueId?.trim();
    if (!userId || !boutiqueId) {
      return {
        status: "failed",
        providerId: "fashn",
        error: "userId ve boutiqueId gerekli (çıktı depolama).",
      };
    }

    // Packshot / marketplace cutout only — never fall back to raw flat-lay.
    const productImageUrl = request.garment.cutoutImageUrl.trim();
    if (!productImageUrl) {
      return {
        status: "failed",
        providerId: "fashn",
        error:
          "Giydirme için ön katalog (packshot) görseli gerekli. Önce katalog üretin.",
      };
    }

    const prompt =
      request.prompt?.trim() || tryOnPromptForPose(request.pose);

    const result = await generateFashnTryOn({
      productImageUrl,
      modelImageUrl: modelImageUrl.trim(),
      prompt,
      userId,
      boutiqueId,
      numImages: 1,
    });

    await logTrAiUsageEvent({
      boutiqueId,
      productId: request.garment.productId ?? null,
      kind: "tryon",
      provider: "fashn",
      fashnPredictionId: result.predictionId ?? null,
      creditsUsed: result.creditsUsed,
      status: result.status,
      error: result.error ?? null,
      meta: {
        modelId: request.modelId ?? null,
        pose: request.pose ?? null,
      },
    });

    if (result.status !== "succeeded" || !result.imageUrls[0]) {
      return {
        status: result.status === "not_configured" ? "not_configured" : "failed",
        providerId: "fashn",
        jobId: result.predictionId,
        creditsUsed: result.creditsUsed,
        error: result.error ?? "Try-on üretilemedi.",
        stub: result.status === "not_configured",
      };
    }

    return {
      status: "succeeded",
      providerId: "fashn",
      imageUrl: result.imageUrls[0],
      jobId: result.predictionId,
      creditsUsed: result.creditsUsed,
    };
  },
};

export function resolveAiModelProvider(
  preferred?: TrAiModelProviderId,
): TrAiModelProvider {
  if (preferred === "stub") return stubProvider;
  if (preferred === "fashn") {
    return isFashnConfigured() ? fashnProvider : stubProvider;
  }
  // fal / replicate not wired yet — prefer FASHN when available
  if (isFashnConfigured()) return fashnProvider;
  return stubProvider;
}
