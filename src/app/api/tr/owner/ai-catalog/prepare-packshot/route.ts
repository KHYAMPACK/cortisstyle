import { hasElbiseLockedConstruction } from "@/lib/tr/fashion/aiCatalog/elbiseConstructionLock";
import { draftProductListingFromImage } from "@/lib/tr/fashion/aiCatalog/listingDraft";
import { buildElbisePackshotPrompt } from "@/lib/tr/fashion/aiCatalog/packshotPrompt";
import { resolvePackshotPrompt } from "@/lib/tr/fashion/aiCatalog/resolvePackshotPrompt";
import { constructionCatalogFamily } from "@/lib/tr/fashion/garmentUploadTypes";
import { constructionPackshotBasePrompt } from "@/lib/tr/fashion/fashn/packshot";
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
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra" | "detail";
  promptExtra?: string;
  uploadType?: string | null;
  existingTitle?: string | null;
  existingDescription?: string | null;
  lockedConstruction?: {
    neckline?: string | null;
    sleeves?: string | null;
    fit?: string | null;
    length?: string | null;
    decollete?: string | null;
    rise?: string | null;
    hem?: string | null;
  } | null;
  inferConstructionFamily?: boolean;
};

/**
 * POST /api/tr/owner/ai-catalog/prepare-packshot
 * Gemini (optional) → packshot prompt + listing draft. No FASHN yet.
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

  const family = constructionCatalogFamily(body.uploadType, body.category);
  if (family || body.inferConstructionFamily) {
    const draft = await draftProductListingFromImage({
      sourceImageUrl,
      backImageUrl: body.backImageUrl,
      detailImageUrl: body.detailImageUrl,
      category: family === "elbise" ? "elbise" : body.category,
      uploadType: family,
      existingTitle: body.existingTitle,
      existingDescription: body.existingDescription,
      lockedConstruction: body.lockedConstruction,
      inferConstructionFamily: !family && body.inferConstructionFamily,
    });
    const inferred =
      family ?? constructionCatalogFamily(undefined, draft?.category);
    const locked = body.lockedConstruction;
    const hasLock = hasElbiseLockedConstruction(
      locked,
      inferred,
      draft?.category ?? body.category,
    );
    const prompt =
      inferred
        ? buildElbisePackshotPrompt(
            draft?.promptFront,
            hasLock ? locked : undefined,
            inferred,
            body.detailImageUrl?.trim() || "",
          )
        : constructionPackshotBasePrompt("elbise");
    return Response.json({
      ok: true,
      prompt,
      listingDraft: draft,
      usedGemini: Boolean(draft),
    });
  }

  const resolved = await resolvePackshotPrompt({
    sourceImageUrl,
    title: body.title,
    category: body.category,
    view: body.view === "detail" ? "front" : body.view ?? "front",
    promptExtra: body.promptExtra,
  });

  return Response.json({
    ok: true,
    prompt: resolved.prompt,
    listingDraft: resolved.listingDraft,
    usedGemini: resolved.usedGemini,
  });
}
