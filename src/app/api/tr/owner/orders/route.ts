import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { isOwnerListedOrder } from "@/lib/tr/orderNotifications";
import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import { refreshBasitShipmentsForOrders } from "@/lib/tr/shipping/ownerShipment";

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
    const cardCheckout = boutiqueOffersIyzicoCheckout(boutique.slug);
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
