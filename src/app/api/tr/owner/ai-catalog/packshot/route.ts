import { generateOwnerPackshot } from "@/lib/tr/aiCatalog/generatePackshot";
import { sanitizeListingDraft } from "@/lib/tr/aiCatalog/listingDraft";
import { constructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";
export const maxDuration = 180;

type Body = {
  boutiqueId: string;
  sourceImageUrl: string;
  productId?: string;
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra" | "detail";
  promptExtra?: string;
  /** Precomputed from prepare-packshot — skips Gemini in this request. */
  prompt?: string;
  listingDraft?: {
    title: string;
    description: string;
    features?: unknown;
    category?: string | null;
    promptFront?: string | null;
  } | null;
  numImages?: number;
  skipPhotoroom?: boolean;
  uploadType?: string | null;
};

/**
 * POST /api/tr/owner/ai-catalog/packshot
 * FASHN packshot from a product photo → Photoroom transparent PNG → rehosted marketplace URL.
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

  const sourceImageUrl = body.sourceImageUrl?.trim();
  if (!sourceImageUrl) {
    return Response.json(
      { error: "sourceImageUrl zorunlu." },
      { status: 400 },
    );
  }

  const result = await generateOwnerPackshot({
    userId: authResult.auth.user.id,
    boutiqueId,
    productId: body.productId?.trim() || null,
    sourceImageUrl,
    title: body.title,
    category: body.category,
    view: body.view === "detail" ? "front" : body.view,
    promptExtra: body.promptExtra,
    prompt: body.prompt,
    listingDraft: body.listingDraft
      ? sanitizeListingDraft(
          {
            title: body.listingDraft.title,
            description: body.listingDraft.description,
            features: body.listingDraft.features,
            category: body.listingDraft.category,
            promptFront: body.listingDraft.promptFront,
          },
          {
            family: constructionCatalogFamily(
              body.uploadType,
              body.listingDraft.category ?? body.category,
            ),
          },
        )
      : null,
    numImages: body.numImages,
    skipPhotoroom: Boolean(body.skipPhotoroom),
  });

  return Response.json({
    ok: result.status === "succeeded",
    result: {
      status: result.status,
      imageUrls: result.imageUrls,
      predictionId: result.predictionId ?? null,
      creditsUsed: result.creditsUsed,
      error: result.error ?? null,
      listingDraft: result.listingDraft ?? null,
    },
  });
}
