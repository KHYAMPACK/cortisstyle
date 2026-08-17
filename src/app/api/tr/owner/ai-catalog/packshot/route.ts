import { generateOwnerPackshot } from "@/lib/tr/aiCatalog/generatePackshot";
import { sanitizeListingDraft } from "@/lib/tr/aiCatalog/listingDraft";
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
  view?: "front" | "back" | "extra";
  promptExtra?: string;
  /** Precomputed from prepare-packshot — skips Gemini in this request. */
  prompt?: string;
  listingDraft?: {
    title: string;
    description: string;
    features?: unknown;
  } | null;
  numImages?: number;
};

/**
 * POST /api/tr/owner/ai-catalog/packshot
 * FASHN packshot from a product photo / cutout → rehosted marketplace URL.
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
    view: body.view,
    promptExtra: body.promptExtra,
    prompt: body.prompt,
    listingDraft: body.listingDraft
      ? sanitizeListingDraft({
          title: body.listingDraft.title,
          description: body.listingDraft.description,
          features: body.listingDraft.features,
        })
      : null,
    numImages: body.numImages,
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
