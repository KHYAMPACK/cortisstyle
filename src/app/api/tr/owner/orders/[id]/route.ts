import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  getOrderByIdAdmin,
  updateOrderFulfillmentStatusAdmin,
} from "@/lib/tr/orders";
import type { TrFulfillmentStatus } from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const FULFILLMENT: TrFulfillmentStatus[] = [
  "created",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * GET /api/tr/owner/orders/[id]?boutiqueId=
 * PATCH /api/tr/owner/orders/[id] { boutiqueId, fulfillmentStatus }
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
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

  const order = await getOrderByIdAdmin(id);
  if (!order || !order.items.some((item) => item.boutiqueId === boutique.id)) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  return Response.json({
    boutique: {
      id: boutique.id,
      slug: boutique.slug,
      name: boutique.name,
    },
    order,
  });
}

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

  const existing = await getOrderByIdAdmin(id);
  if (
    !existing ||
    !existing.items.some((item) => item.boutiqueId === boutique.id)
  ) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const fulfillmentStatus = body.fulfillmentStatus;
  if (
    typeof fulfillmentStatus !== "string" ||
    !FULFILLMENT.includes(fulfillmentStatus as TrFulfillmentStatus)
  ) {
    return Response.json(
      { error: "Geçersiz sipariş durumu." },
      { status: 400 },
    );
  }

  try {
    await updateOrderFulfillmentStatusAdmin(
      id,
      fulfillmentStatus as TrFulfillmentStatus,
    );
    const order = await getOrderByIdAdmin(id);
    return Response.json({ order });
  } catch (error) {
    console.error("[tr/owner/orders/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sipariş güncellenemedi.",
      },
      { status: 500 },
    );
  }
}
