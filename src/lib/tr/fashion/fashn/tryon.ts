import {
  fashnRunAndWait,
  getFashnCatalogMode,
  getFashnCatalogResolution,
  isFashnConfigured,
  type FashnGenerationMode,
  type FashnResolution,
} from "@/lib/tr/fashion/fashn/client";
import { rehostRemoteImageToTrAssets } from "@/lib/tr/fashion/fashn/rehost";

export interface FashnTryOnParams {
  productImageUrl: string;
  modelImageUrl: string;
  prompt?: string;
  numImages?: number;
  resolution?: FashnResolution;
  generationMode?: FashnGenerationMode;
  userId: string;
  boutiqueId: string;
}

export interface FashnTryOnResult {
  status: "succeeded" | "failed" | "not_configured";
  predictionId?: string;
  imageUrls: string[];
  creditsUsed: number | null;
  error?: string;
}

export async function generateFashnTryOn(
  params: FashnTryOnParams,
): Promise<FashnTryOnResult> {
  if (!isFashnConfigured()) {
    return {
      status: "not_configured",
      imageUrls: [],
      creditsUsed: null,
      error: "FASHN_API_KEY yapılandırılmadı.",
    };
  }

  const productImage = params.productImageUrl.trim();
  const modelImage = params.modelImageUrl.trim();
  if (!productImage || !modelImage) {
    return {
      status: "failed",
      imageUrls: [],
      creditsUsed: null,
      error: "product_image ve model_image zorunlu.",
    };
  }

  const numImages = Math.min(4, Math.max(1, params.numImages ?? 1));

  try {
    // tryon-max + fast + 1k = 1 FASHN credit (same as tryon-v1.6, better PDP quality).
    // balanced + 1k would be 2 credits; do not use tryon-v1.6 for catalog.
    const inputs: Record<string, unknown> = {
      product_image: productImage,
      model_image: modelImage,
      num_images: numImages,
      resolution: params.resolution ?? getFashnCatalogResolution(),
      generation_mode: params.generationMode ?? getFashnCatalogMode(),
      output_format: "png",
    };
    const prompt = params.prompt?.trim();
    if (prompt) inputs.prompt = prompt;

    const run = await fashnRunAndWait({
      modelName: "tryon-max",
      inputs,
    });

    if (run.status !== "completed" || run.outputUrls.length === 0) {
      return {
        status: "failed",
        predictionId: run.predictionId,
        imageUrls: [],
        creditsUsed: run.creditsUsed,
        error: run.error ?? "Model giydirme üretilemedi.",
      };
    }

    const hosted: string[] = [];
    for (const remoteUrl of run.outputUrls) {
      const { url } = await rehostRemoteImageToTrAssets({
        imageUrl: remoteUrl,
        userId: params.userId,
        boutiqueId: params.boutiqueId,
        kind: "lifestyle",
      });
      hosted.push(url);
    }

    return {
      status: "succeeded",
      predictionId: run.predictionId,
      imageUrls: hosted,
      creditsUsed: run.creditsUsed ?? numImages,
    };
  } catch (error) {
    return {
      status: "failed",
      imageUrls: [],
      creditsUsed: null,
      error: error instanceof Error ? error.message : "Try-on hatası.",
    };
  }
}
