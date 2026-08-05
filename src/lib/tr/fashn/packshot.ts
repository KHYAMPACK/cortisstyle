import {
  fashnRunAndWait,
  getFashnDefaultMode,
  getFashnDefaultResolution,
  isFashnConfigured,
  type FashnGenerationMode,
  type FashnResolution,
} from "@/lib/tr/fashn/client";
import {
  isPhotoroomConfigured,
  removeGarmentBackground,
} from "@/lib/studioRemoveBg";
import { uploadTrProductAsset } from "@/lib/tr/trAssetStorage";

/** Staging for packshot — final marketplace asset is Photoroom transparent PNG. */
export const DEFAULT_PACKSHOT_PROMPT =
  "ghost mannequin, pressed, symmetric, even studio lighting. Preserve the garment exactly as photographed: fabric, color, details, cut, and length. Do not invent missing parts or change the silhouette.";

export interface FashnPackshotParams {
  productImageUrl: string;
  prompt?: string;
  numImages?: number;
  aspectRatio?: string;
  resolution?: FashnResolution;
  generationMode?: FashnGenerationMode;
  userId: string;
  boutiqueId: string;
}

export interface FashnPackshotResult {
  status: "succeeded" | "failed" | "not_configured";
  predictionId?: string;
  imageUrls: string[];
  creditsUsed: number | null;
  error?: string;
}

async function photoroomCutoutFromRemoteUrl(
  imageUrl: string,
): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Packshot indirilemedi (${response.status}).`);
  }
  const mimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  return removeGarmentBackground({
    bytes,
    filename: "packshot.png",
    mimeType,
  });
}

/**
 * Pipeline: FASHN packshot (PNG) → Photoroom BG remove (transparent PNG) → rehost.
 * One BG removal only — raw upload skips Photoroom.
 */
export async function generateFashnPackshot(
  params: FashnPackshotParams,
): Promise<FashnPackshotResult> {
  if (!isFashnConfigured()) {
    return {
      status: "not_configured",
      imageUrls: [],
      creditsUsed: null,
      error: "FASHN_API_KEY yapılandırılmadı.",
    };
  }

  const productImage = params.productImageUrl.trim();
  if (!productImage) {
    return {
      status: "failed",
      imageUrls: [],
      creditsUsed: null,
      error: "product_image zorunlu.",
    };
  }

  const numImages = Math.min(4, Math.max(1, params.numImages ?? 1));
  const prompt = params.prompt?.trim() || DEFAULT_PACKSHOT_PROMPT;

  try {
    const run = await fashnRunAndWait({
      modelName: "packshot",
      inputs: {
        product_image: productImage,
        prompt,
        num_images: numImages,
        aspect_ratio: params.aspectRatio ?? "2:3",
        resolution: params.resolution ?? getFashnDefaultResolution(),
        generation_mode: params.generationMode ?? getFashnDefaultMode(),
        output_format: "png",
      },
    });

    if (run.status !== "completed" || run.outputUrls.length === 0) {
      return {
        status: "failed",
        predictionId: run.predictionId,
        imageUrls: [],
        creditsUsed: run.creditsUsed,
        error: run.error ?? "Packshot üretilemedi.",
      };
    }

    if (!isPhotoroomConfigured()) {
      return {
        status: "failed",
        predictionId: run.predictionId,
        imageUrls: [],
        creditsUsed: run.creditsUsed,
        error: "PHOTOROOM_API_KEY yapılandırılmadı (katalog kesiti için).",
      };
    }

    const hosted: string[] = [];
    for (const remoteUrl of run.outputUrls) {
      // Keep alpha — do not composite onto an opaque normalize canvas
      const cutoutPng = await photoroomCutoutFromRemoteUrl(remoteUrl);
      const marketplace = await uploadTrProductAsset({
        userId: params.userId,
        boutiqueId: params.boutiqueId,
        bytes: cutoutPng,
        contentType: "image/png",
        kind: "marketplace",
      });
      hosted.push(marketplace.url);
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
      error: error instanceof Error ? error.message : "Packshot hatası.",
    };
  }
}
