import { getContentPackByIdAdmin } from "@/lib/tr/contentPacks/server";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/content-packs/[id]
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const packId = id?.trim() ?? "";
  if (!packId) {
    return Response.json({ error: "id zorunlu." }, { status: 400 });
  }

  try {
    const pack = await getContentPackByIdAdmin(packId);
    if (!pack) {
      return Response.json({ error: "Paket bulunamadı." }, { status: 404 });
    }

    const boutique = requireOwnedBoutique(authResult.auth, pack.boutiqueId);
    if (!boutique) {
      return Response.json(
        { error: "Bu butik için yetkiniz yok." },
        { status: 403 },
      );
    }

    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      pack,
    });
  } catch (error) {
    console.error("[tr/owner/content-packs/id] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İçerik paketi yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
