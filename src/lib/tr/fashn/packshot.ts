import {
  fashnRunAndWait,
  getFashnCatalogMode,
  getFashnCatalogResolution,
  isFashnConfigured,
  type FashnGenerationMode,
  type FashnResolution,
} from "@/lib/tr/fashn/client";
import {
  isPhotoroomConfigured,
  removeGarmentBackground,
} from "@/lib/tr/ai/photoroomRemoveBg";
import { uploadTrProductAsset } from "@/lib/tr/trAssetStorage";

/** Staging for packshot — final marketplace asset is Photoroom transparent PNG. */
export const DEFAULT_PACKSHOT_PROMPT =
  "ghost mannequin packshot. Invisible ghost-mannequin form, clothing only, hollow neck and sleeve openings. No hanger, no hook, no visible mannequin, no dress form, no person. Pressed, symmetric, even studio lighting. Preserve the garment exactly as photographed: fabric, color, details, cut, and length. Do not invent missing parts or change the silhouette.";

/** Elbise ön packshot: opaque white studio, keep FASHN output (no Photoroom). */
export const ELBISE_PACKSHOT_PROMPT =
  "Front ghost-mannequin product photo of this exact dress. Solid white studio background, soft drop shadow to the side, clothing only. Invisible form, no person, no hanger, no visible mannequin, no dress form. Straight-on, centered, three-dimensional worn volume. Preserve fabric, color, seams, hem, and lace or trim as photographed. Do not invent sleeves, off-shoulder pieces, arm flaps, or straps that are not named in the construction lock. Do not invent panels, change the silhouette, or turn the dress into a skirt.";

/** Üst giyim ön packshot — same staging as elbise, garment not dress. */
export const UST_GIYIM_PACKSHOT_PROMPT =
  "Front ghost-mannequin product photo of this exact top. Solid white studio background, soft drop shadow to the side, clothing only. Invisible form, no person, no hanger, no visible mannequin, no dress form. Straight-on, centered, three-dimensional worn volume. Preserve fabric, color, seams, hem, and lace or trim as photographed. Do not invent sleeves, off-shoulder pieces, arm flaps, or straps that are not named in the construction lock. Do not invent panels, change the silhouette, or turn the top into a dress or a skirt.";

/** Alt giyim packshot — top-down flat lay, not ghost mannequin. */
export const ALT_GIYIM_PACKSHOT_PROMPT =
  "Top-down flat lay product photo of this exact skirt or pant. Solid white studio background, even diffused light, no drop shadow, clothing only. Garment pressed completely flat, legs or panels parallel, full silhouette from waistband to hem visible. No person, no hanger, no ghost mannequin, no worn volume, no 3D dressing. Preserve fabric, wash, seams, pockets, belt loops, fly, and hem finish as photographed. Do not turn pants into a dress or a skirt into pants. Do not invent a matching top.";

export function constructionPackshotBasePrompt(
  family: "elbise" | "ust-giyim" | "alt-giyim" = "elbise",
): string {
  if (family === "ust-giyim") return UST_GIYIM_PACKSHOT_PROMPT;
  if (family === "alt-giyim") return ALT_GIYIM_PACKSHOT_PROMPT;
  return ELBISE_PACKSHOT_PROMPT;
}

/** Always last so FASHN does not copy hanger / visible-mannequin from the source. */
export const PACKSHOT_PRESENTATION_LOCK =
  "Presentation: ghost mannequin packshot only. Clothing only — no hanger, no visible mannequin.";

export const FLAT_LAY_PACKSHOT_PRESENTATION_LOCK =
  "Presentation: top-down flat lay packshot only. Clothing pressed flat — no ghost mannequin, no hanger, no person, no worn volume.";

const CONFLICTING_PACKSHOT_PRESENTATION =
  /\b(on[- ]hanger|on a hanger|on the hanger|clothes hangers?|hanger hook|visible mannequin|dress forms?|flat[- ]lay(?: packshot)?|floating garment|on a (?:visible )?mannequin|on mannequin)\b/gi;

const CONFLICTING_GHOST_MANNEQUIN =
  /\b(ghost mannequin|invisible form|worn volume|three-dimensional worn|soft drop shadow)\b/gi;

export function stripConflictingPackshotPresentation(text: string): string {
  return text.replace(CONFLICTING_PACKSHOT_PRESENTATION, " ").replace(/\s+/g, " ").trim();
}

function stripConflictingGhostMannequin(text: string): string {
  return text.replace(CONFLICTING_GHOST_MANNEQUIN, " ").replace(/\s+/g, " ").trim();
}

function wantsFlatLayPackshot(prompt: string): boolean {
  return (
    prompt.includes(FLAT_LAY_PACKSHOT_PRESENTATION_LOCK) ||
    /\btop-down flat lay\b/i.test(prompt)
  );
}

export function finalizePackshotPrompt(prompt?: string | null): string {
  const raw = prompt?.trim() || DEFAULT_PACKSHOT_PROMPT;
  if (wantsFlatLayPackshot(raw)) {
    const stripped = stripConflictingGhostMannequin(raw);
    const base = stripped || ALT_GIYIM_PACKSHOT_PROMPT;
    if (base.includes(FLAT_LAY_PACKSHOT_PRESENTATION_LOCK)) return base;
    return `${base} ${FLAT_LAY_PACKSHOT_PRESENTATION_LOCK}`;
  }
  const stripped = stripConflictingPackshotPresentation(raw);
  const base = stripped || DEFAULT_PACKSHOT_PROMPT;
  if (base.includes(PACKSHOT_PRESENTATION_LOCK)) return base;
  return `${base} ${PACKSHOT_PRESENTATION_LOCK}`;
}

export interface FashnPackshotParams {
  productImageUrl: string;
  prompt?: string;
  numImages?: number;
  aspectRatio?: string;
  resolution?: FashnResolution;
  generationMode?: FashnGenerationMode;
  userId: string;
  boutiqueId: string;
  /** Keep FASHN white-studio PNG; do not Photoroom (elbise). */
  skipPhotoroom?: boolean;
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
 * Catalog runs fast + 1k (1 FASHN credit per view). Wizard still calls once per ön/arka.
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
  const prompt = finalizePackshotPrompt(params.prompt);

  try {
    const run = await fashnRunAndWait({
      modelName: "packshot",
      inputs: {
        product_image: productImage,
        prompt,
        num_images: numImages,
        aspect_ratio: params.aspectRatio ?? "2:3",
        resolution: params.resolution ?? getFashnCatalogResolution(),
        generation_mode: params.generationMode ?? getFashnCatalogMode(),
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

    const hosted: string[] = [];
    if (params.skipPhotoroom) {
      for (const remoteUrl of run.outputUrls) {
        const response = await fetch(remoteUrl);
        if (!response.ok) {
          throw new Error(`Packshot indirilemedi (${response.status}).`);
        }
        const bytes = Buffer.from(await response.arrayBuffer());
        const marketplace = await uploadTrProductAsset({
          userId: params.userId,
          boutiqueId: params.boutiqueId,
          bytes,
          contentType: "image/png",
          kind: "marketplace",
        });
        hosted.push(marketplace.url);
      }
    } else {
      if (!isPhotoroomConfigured()) {
        return {
          status: "failed",
          predictionId: run.predictionId,
          imageUrls: [],
          creditsUsed: run.creditsUsed,
          error: "PHOTOROOM_API_KEY yapılandırılmadı (katalog kesiti için).",
        };
      }
      for (const remoteUrl of run.outputUrls) {
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
