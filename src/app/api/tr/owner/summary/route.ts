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
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range")?.trim() ?? "today";
    const range =
      rangeParam === "7d" ||
      rangeParam === "30d" ||
      rangeParam === "all" ||
      rangeParam === "today"
        ? rangeParam
        : "today";
    const summary = await getOwnerBoutiqueSummary(boutique.id, range);
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
