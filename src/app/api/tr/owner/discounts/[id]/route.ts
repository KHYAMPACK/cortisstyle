import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  getDiscountCodeByIdAdmin,
  updateDiscountCodeAdmin,
} from "@/lib/tr/discountCodes";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tr/owner/discounts/[id] { boutiqueId, active? }
 */
export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
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

  const existing = await getDiscountCodeByIdAdmin(id);
  if (!existing || existing.boutiqueId !== boutique.id) {
    return Response.json({ error: "Kupon bulunamadı." }, { status: 404 });
  }

  try {
    const code = await updateDiscountCodeAdmin(id, {
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    return Response.json({ code });
  } catch (error) {
    console.error("[tr/owner/discounts/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Kupon güncellenemedi.",
      },
      { status: 500 },
    );
  }
}
