import { resolvePackshotPrompt } from "@/lib/tr/aiCatalog/resolvePackshotPrompt";
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
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra";
  promptExtra?: string;
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

  const resolved = await resolvePackshotPrompt({
    sourceImageUrl,
    title: body.title,
    category: body.category,
    view: body.view ?? "front",
    promptExtra: body.promptExtra,
  });

  return Response.json({
    ok: true,
    prompt: resolved.prompt,
    listingDraft: resolved.listingDraft,
    usedGemini: resolved.usedGemini,
  });
}
