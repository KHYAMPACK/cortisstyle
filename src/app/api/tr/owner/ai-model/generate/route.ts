import { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  boutiqueId: string;
  cutoutImageUrl: string;
  originalImageUrl?: string;
  productId?: string;
  title?: string;
  category?: string | null;
  pose?:
    | "standing-front"
    | "standing-back"
    | "standing-three-quarter"
    | "full-body"
    | "waist-up";
  /** `boutique:{slug}` or `studio:ayla` / `studio:deniz` */
  modelId?: string;
  /** Lila only: blinds (default) or flash */
  photographyStyle?: "blinds" | "flash";
  prompt?: string;
};

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

  const cutoutImageUrl = body.cutoutImageUrl?.trim();
  if (!cutoutImageUrl) {
    return Response.json(
      { error: "cutoutImageUrl zorunlu (katalog / packshot görseli)." },
      { status: 400 },
    );
  }

  const result = await generateBoutiqueAiModelImage({
    boutiqueSlug: boutique.slug,
    boutiqueId,
    userId: authResult.auth.user.id,
    modelId: body.modelId?.trim() || undefined,
    photographyStyle: body.photographyStyle,
    prompt: body.prompt?.trim() || undefined,
    garment: {
      productId: body.productId,
      title: body.title,
      cutoutImageUrl,
      originalImageUrl: body.originalImageUrl?.trim() || undefined,
      category: body.category,
    },
    pose: body.pose,
  });

  return Response.json({
    ok: result.status === "succeeded",
    result,
  });
}
