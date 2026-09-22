import {
  draftGarmentColorFromImage,
  draftProductListingFromImage,
} from "@/lib/tr/fashion/aiCatalog/listingDraft";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  boutiqueId: string;
  sourceImageUrl: string;
  backImageUrl?: string;
  detailImageUrl?: string;
  category?: string | null;
  uploadType?: string | null;
  inferConstructionFamily?: boolean;
  colorOnly?: boolean;
};

/**
 * POST /api/tr/owner/ai-catalog/listing-draft
 * Optional Gemini draft for product title + description from a catalog image.
 * `colorOnly` returns `{ color }` for extra color variants.
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

  if (body.colorOnly) {
    const color = await draftGarmentColorFromImage({
      sourceImageUrl,
      backImageUrl: body.backImageUrl,
    });
    return Response.json({
      ok: true,
      color: color ?? "",
      usedGemini: Boolean(color),
    });
  }

  const draft = await draftProductListingFromImage({
    sourceImageUrl,
    backImageUrl: body.backImageUrl,
    detailImageUrl: body.detailImageUrl,
    category: body.category,
    uploadType: body.uploadType,
    inferConstructionFamily: Boolean(body.inferConstructionFamily),
  });

  if (!draft) {
    return Response.json(
      {
        error:
          "Ürün metni oluşturulamadı. Gemini yapılandırın veya elle yazın.",
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, draft });
}
