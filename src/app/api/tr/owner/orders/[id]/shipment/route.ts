import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import {
  BasitKargoError,
} from "@/lib/tr/shipping/providers/basitKargo";
import {
  buyBoutiqueShipmentLabel,
  cancelBoutiqueShipmentBarcode,
  createBoutiqueShipment,
  listBoutiqueShipmentRates,
  shopperTrackingPath,
} from "@/lib/tr/shipping/ownerShipment";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function jsonError(error: unknown, fallback: string, status = 500) {
  if (error instanceof BasitKargoError) {
    return Response.json({ error: error.message }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 });
  }
  const message = error instanceof Error ? error.message : fallback;
  const code =
    message.includes("bulunamadı") ? 404
    : message.includes("entegrasyonu yok") ? 409
    : message.includes("onaylanmadan") || message.includes("kargo kodu yok") || message.includes("kayıt oluşturun") ? 400
    : status;
  return Response.json({ error: message }, { status: code });
}

/**
 * GET /api/tr/owner/orders/[id]/shipment?boutiqueId=
 * POST { boutiqueId, action: create | rates | buy | cancel, handlerCode? }
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

  const provider = getShippingProviderId(boutique.slug);
  return Response.json({
    provider,
    order: {
      ...order,
      items: order.items.filter((item) => item.boutiqueId === boutique.id),
    },
    trackingPath:
      provider && order.shipment.externalId
        ? shopperTrackingPath(boutique.slug, order.id)
        : null,
  });
}

export async function POST(request: Request, context: RouteContext) {
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

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const handlerCode =
    typeof body.handlerCode === "string" ? body.handlerCode.trim() : "";

  try {
    if (action === "create") {
      const result = await createBoutiqueShipment(boutique, id);
      return Response.json({
        order: result.order,
        rates: result.rates,
        trackingPath: shopperTrackingPath(boutique.slug, result.order.id),
      });
    }
    if (action === "rates") {
      const result = await listBoutiqueShipmentRates(boutique, id);
      return Response.json({ order: result.order, rates: result.rates });
    }
    if (action === "buy") {
      if (!handlerCode) {
        return Response.json(
          { error: "Kargo firması (handlerCode) gerekli." },
          { status: 400 },
        );
      }
      const result = await buyBoutiqueShipmentLabel(boutique, id, handlerCode);
      return Response.json({
        order: result.order,
        trackingPath: shopperTrackingPath(boutique.slug, result.order.id),
      });
    }
    if (action === "cancel") {
      const result = await cancelBoutiqueShipmentBarcode(boutique, id);
      return Response.json({ order: result.order });
    }
    return Response.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error) {
    console.error("[tr/owner/orders/shipment]", error);
    return jsonError(error, "Kargo işlemi başarısız.");
  }
}
