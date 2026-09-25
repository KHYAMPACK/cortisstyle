import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { createManualOrder } from "@/lib/tr/commerce/manualOrder";
import { manualOrderErrorResponse } from "@/lib/tr/commerce/manualOrderHttp";
import { deleteOrderDraftAdmin } from "@/lib/tr/commerce/orderDrafts";
import { isOwnerListedOrder } from "@/lib/tr/orderNotifications";
import { readManualOrderDraft } from "@/lib/tr/orders/manualOrder";
import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import { refreshBasitShipmentsForOrders } from "@/lib/tr/shipping/ownerShipment";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/orders?boutiqueId=
 * POST /api/tr/owner/orders { boutiqueId, draftId?, ...the order (see readManualOrderDraft) }
 *   Creates an order by hand (Sipariş Oluştur). `draftId` names the draft it was made
 *   from, which is deleted once the order exists.
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
    const cardCheckout = await boutiqueOffersIyzicoCheckout(boutique.slug);
    const listed = (await listOrdersByBoutiqueIdAdmin(boutique.id)).filter(
      (order) => isOwnerListedOrder(order, { cardCheckout }),
    );
    const orders = await refreshBasitShipmentsForOrders(
      boutique.slug,
      listed,
    );
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

export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId = typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  const read = readManualOrderDraft(body);
  if (!read.ok) return Response.json({ error: read.error }, { status: 400 });

  try {
    const order = await createManualOrder({ boutique, draft: read.draft });

    // The order exists now; failing to tidy up its draft must not undo that.
    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
    if (draftId) {
      try {
        await deleteOrderDraftAdmin(boutique.id, draftId);
      } catch (draftError) {
        console.error("[tr/owner/orders] draft cleanup failed:", draftError);
      }
    }

    return Response.json(
      {
        order: {
          ...order,
          items: order.items.filter((item) => item.boutiqueId === boutique.id),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return manualOrderErrorResponse(error, "Sipariş oluşturulamadı.");
  }
}
