import {
  generateContentPackForProduct,
  listContentPacksByBoutiqueIdAdmin,
} from "@/lib/tr/contentPacks/server";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET /api/tr/owner/content-packs?boutiqueId=
 * POST /api/tr/owner/content-packs  { boutiqueId, productId }
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
    const packs = await listContentPacksByBoutiqueIdAdmin(boutique.id);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      packs,
    });
  } catch (error) {
    console.error("[tr/owner/content-packs] list failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İçerik paketleri yüklenemedi.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  if (!productId) {
    return Response.json({ error: "productId zorunlu." }, { status: 400 });
  }

  try {
    const { pack, warning } = await generateContentPackForProduct({
      boutiqueId: boutique.id,
      productId,
      userId: authResult.auth.user.id,
    });

    return Response.json(
      {
        pack,
        warning: warning ?? null,
      },
      { status: pack.status === "failed" ? 422 : 201 },
    );
  } catch (error) {
    console.error("[tr/owner/content-packs] generate failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İçerik paketi oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
