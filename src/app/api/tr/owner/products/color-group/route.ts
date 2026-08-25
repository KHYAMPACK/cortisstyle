import {
  ColorGroupSyncError,
  syncColorGroupMembers,
} from "@/lib/tr/catalog/syncColorGroup";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * POST /api/tr/owner/products/color-group
 * Replace the full member set of a color group for the anchor product.
 */
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
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const anchorProductId =
    typeof body.anchorProductId === "string"
      ? body.anchorProductId.trim()
      : "";
  if (!anchorProductId) {
    return Response.json(
      { error: "anchorProductId zorunlu." },
      { status: 400 },
    );
  }

  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];

  try {
    const result = await syncColorGroupMembers({
      boutiqueId: boutique.id,
      anchorProductId,
      productIds,
    });
    const current =
      result.products.find((product) => product.id === anchorProductId) ??
      null;
    return Response.json({
      ok: true,
      colorGroupId: result.colorGroupId,
      product: current,
      products: result.products,
    });
  } catch (error) {
    if (error instanceof ColorGroupSyncError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[tr/owner/products/color-group] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Renk grubu kaydedilemedi.",
      },
      { status: 500 },
    );
  }
}
