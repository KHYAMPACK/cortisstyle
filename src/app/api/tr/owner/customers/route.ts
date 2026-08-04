import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { listOwnerCustomersByBoutiqueIdAdmin } from "@/lib/tr/orders";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/customers?boutiqueId=
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
    const customers = await listOwnerCustomersByBoutiqueIdAdmin(boutique.id);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      customers,
    });
  } catch (error) {
    console.error("[tr/owner/customers] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Müşteriler yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
