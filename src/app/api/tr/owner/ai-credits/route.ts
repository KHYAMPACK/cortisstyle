import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getBoutiqueAiCreditSummary } from "@/lib/tr/aiUsage";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/ai-credits?boutiqueId=
 * Light monthly kredi usage for the active boutique.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";

  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  try {
    const usage = await getBoutiqueAiCreditSummary(boutique.id);
    return Response.json({ usage });
  } catch (error) {
    console.error("[tr/owner/ai-credits] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Kredi özeti yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
