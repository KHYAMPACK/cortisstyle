import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/orders?boutiqueId=
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
    const orders = await listOrdersByBoutiqueIdAdmin(boutique.id);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      orders,
    });
  } catch (error) {
    console.error("[tr/owner/orders] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Siparişler yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
