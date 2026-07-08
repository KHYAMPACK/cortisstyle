import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getOwnerBoutiqueSummary } from "@/lib/tr/ownerSummary";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/summary?boutiqueId=
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
    const summary = await getOwnerBoutiqueSummary(boutique.id);
    return Response.json({ summary });
  } catch (error) {
    console.error("[tr/owner/summary] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Özet yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
