import {
  fashnRunAndWait,
  getFashnDefaultMode,
  getFashnDefaultResolution,
  isFashnConfigured,
  type FashnGenerationMode,
  type FashnResolution,
} from "@/lib/tr/fashn/client";
import { STUDIO_MODEL_CREATE_ASPECT_RATIO } from "@/lib/tr/aiModel/prompts";

export interface FashnModelCreateParams {
  prompt: string;
  aspectRatio?: string;
  resolution?: FashnResolution;
  generationMode?: FashnGenerationMode;
  numImages?: number;
  imageReferenceUrl?: string;
  faceReferenceUrl?: string;
}

export interface FashnModelCreateResult {
  status: "succeeded" | "failed" | "not_configured";
  predictionId?: string;
  imageUrls: string[];
  creditsUsed: number | null;
  error?: string;
}

/**
 * FASHN model-create — generate a fashion model photo from a text prompt.
 * Used for one-time platform studio refs (ops), not owner panel.
 */
export async function generateFashnModelCreate(
  params: FashnModelCreateParams,
): Promise<FashnModelCreateResult> {
  if (!isFashnConfigured()) {
    return {
      status: "not_configured",
      imageUrls: [],
      creditsUsed: null,
      error: "FASHN_API_KEY yapılandırılmadı.",
    };
  }

  const prompt = params.prompt.trim();
  if (!prompt) {
    return {
      status: "failed",
      imageUrls: [],
      creditsUsed: null,
      error: "prompt zorunlu.",
    };
  }

  const numImages = Math.min(4, Math.max(1, params.numImages ?? 1));

  try {
    const inputs: Record<string, unknown> = {
      prompt,
      num_images: numImages,
      aspect_ratio: params.aspectRatio ?? STUDIO_MODEL_CREATE_ASPECT_RATIO,
      resolution: params.resolution ?? getFashnDefaultResolution(),
      generation_mode: params.generationMode ?? getFashnDefaultMode(),
      output_format: "jpg",
    };
    const imageRef = params.imageReferenceUrl?.trim();
    if (imageRef) inputs.image_reference = imageRef;
    const faceRef = params.faceReferenceUrl?.trim();
    if (faceRef) inputs.face_reference = faceRef;

    const run = await fashnRunAndWait({
      modelName: "model-create",
      inputs,
    });

    if (run.status !== "completed" || run.outputUrls.length === 0) {
      return {
        status: "failed",
        predictionId: run.predictionId,
        imageUrls: [],
        creditsUsed: run.creditsUsed,
        error: run.error ?? "Model create üretilemedi.",
      };
    }

    return {
      status: "succeeded",
      predictionId: run.predictionId,
      imageUrls: run.outputUrls,
      creditsUsed: run.creditsUsed ?? numImages,
    };
  } catch (error) {
    return {
      status: "failed",
      imageUrls: [],
      creditsUsed: null,
      error:
        error instanceof Error ? error.message : "Model create hatası.",
    };
  }
}
