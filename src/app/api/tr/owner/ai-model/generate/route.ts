import { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import { replaceLifestyleShot } from "@/lib/tr/catalog/productImages";
import {
  sanitizeAiModelId,
  withLifestyleModelsAll,
  withLifestyleModelShot,
} from "@/lib/tr/catalog/productFeatures";
import { getProductByIdAdmin, updateProductAdmin } from "@/lib/tr/products";
import {
  requireOwnedBoutique,
  requireOwnedProductBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import type {
  TrAiModelGenerateShot,
  TrAiModelPose,
} from "@/lib/tr/aiModel/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const POSES: TrAiModelPose[] = [
  "standing-front",
  "standing-back",
  "standing-three-quarter",
  "full-body",
  "waist-up",
];

type ShotBody = {
  pose?: string;
  cutoutImageUrl?: string;
  modelReferenceUrl?: string;
  prompt?: string;
};

type Body = {
  boutiqueId: string;
  cutoutImageUrl?: string;
  originalImageUrl?: string;
  productId?: string;
  title?: string;
  category?: string | null;
  pose?: TrAiModelPose;
  /** `boutique:{slug}` or `studio:ayla` / `studio:selin` / `studio:deniz` */
  modelId?: string;
  /** Lila only: blinds (default) or flash */
  photographyStyle?: "blinds" | "flash";
  prompt?: string;
  shots?: ShotBody[];
  /** Replace this lifestyle slot only; keep the other model shots. */
  replaceLifestyleIndex?: number;
};

function parseShots(raw: ShotBody[] | undefined): TrAiModelGenerateShot[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const shots: TrAiModelGenerateShot[] = [];
  for (const entry of raw.slice(0, 3)) {
    const cutoutImageUrl = entry.cutoutImageUrl?.trim() ?? "";
    const modelReferenceUrl = entry.modelReferenceUrl?.trim() ?? "";
    if (!cutoutImageUrl || !modelReferenceUrl) continue;
    const pose = POSES.includes(entry.pose as TrAiModelPose)
      ? (entry.pose as TrAiModelPose)
      : "standing-front";
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
 * POST /api/tr/owner/ai-model/generate
 * FASHN tryon-max when configured; otherwise structured stub.
 */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId = body.boutiqueId?.trim();
  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const owned = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!owned) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const boutique = await getBoutiqueByIdAdmin(boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  const shots = parseShots(body.shots);
  const cutoutImageUrl =
    body.cutoutImageUrl?.trim() || shots[0]?.cutoutImageUrl || "";
  if (!cutoutImageUrl) {
    return Response.json(
      { error: "cutoutImageUrl zorunlu (katalog / packshot görseli)." },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await generateBoutiqueAiModelImage({
      boutiqueSlug: boutique.slug,
      boutiqueId,
      userId: authResult.auth.user.id,
      modelId: body.modelId?.trim() || undefined,
      photographyStyle: body.photographyStyle,
      prompt: body.prompt?.trim() || undefined,
      shots: shots.length > 0 ? shots : undefined,
      garment: {
        productId: body.productId,
        title: body.title,
        cutoutImageUrl,
        originalImageUrl: body.originalImageUrl?.trim() || undefined,
        category: body.category,
      },
      pose: body.pose,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Model görseli üretilemedi.",
      },
      { status: 500 },
    );
  }

  const produced = (
    result.imageUrls?.length
      ? result.imageUrls
      : result.imageUrl
        ? [result.imageUrl]
        : []
  )
    .map((url) => url.trim())
    .filter(Boolean);
  const productId = body.productId?.trim();

  if (result.status === "succeeded" && productId && produced.length > 0) {
    const ownedProduct = await requireOwnedProductBoutique(
      authResult.auth,
      productId,
    );
    if (!ownedProduct || ownedProduct.productBoutiqueId !== boutiqueId) {
      return Response.json(
        { error: "Ürün bu butiğe ait değil." },
        { status: 403 },
      );
    }
    try {
      const existing = await getProductByIdAdmin(productId);
      const replaceIndex = body.replaceLifestyleIndex;
      const slot =
        typeof replaceIndex === "number" && Number.isInteger(replaceIndex)
          ? replaceIndex
          : null;
      if (slot != null && (slot < 0 || slot > 2)) {
        return Response.json(
          { error: "replaceLifestyleIndex geçersiz." },
          { status: 400 },
        );
      }
      const lifestyleImages =
        slot != null
          ? replaceLifestyleShot(
              existing?.lifestyleImages,
              slot,
              produced[0]!,
            )
          : produced;
      const aiModelId = sanitizeAiModelId(body.modelId);
      const baseFeatures = existing?.features ?? {};
      const features = aiModelId
        ? slot != null
          ? withLifestyleModelShot(
              baseFeatures,
              slot,
              aiModelId,
              lifestyleImages.length,
            )
          : withLifestyleModelsAll(
              baseFeatures,
              aiModelId,
              lifestyleImages.length,
            )
        : baseFeatures;
      await updateProductAdmin(productId, {
        lifestyleImages,
        features,
      });
    } catch {
      return Response.json(
        {
          ok: false,
          result: {
            ...result,
            status: "failed",
            error:
              "Model görseli üretildi ama ürüne kaydedilemedi. Tekrar deneyin.",
          },
        },
        { status: 500 },
      );
    }
  }

  return Response.json({
    ok: result.status === "succeeded",
    result,
  });
}
