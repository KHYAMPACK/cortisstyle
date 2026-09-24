import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getOrderByIdAdmin, updateOrderShipmentAdmin } from "@/lib/tr/orders";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import { validateManualShipment } from "@/lib/tr/shipping/manualShipment";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import {
  BasitKargoError,
} from "@/lib/tr/shipping/providers/basitKargo";
import {
  autoFulfillPaidShipment,
  cancelBoutiqueShipmentBarcode,
  createBoutiqueShipment,
  listBoutiqueShipmentRates,
  refreshBasitKargoOrder,
  retryShipmentAfterAddressEdit,
  shopperTrackingPath,
} from "@/lib/tr/shipping/ownerShipment";
import { validateTurkeyShippingAddress } from "@/lib/tr/geo/turkeyAddress";

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
    : message.includes("onaylanmadan") || message.includes("kargo kodu yok") || message.includes("kayıt oluşturun")
      || message.includes("değiştirilemez") || message.includes("değiştirilir") || message.includes("iade edin")
      || message.includes("zaten sürüyor") ? 409
    : status;
  return Response.json({ error: message }, { status: code });
}

/**
 * GET /api/tr/owner/orders/[id]/shipment?boutiqueId=
 * POST { boutiqueId, action: create | rates | fulfill | retry-address | cancel | manual-ship }
 *
 * `manual-ship` is for boutiques with no carrier integration: the owner records the
 * carrier and (optionally) a tracking code and the order moves to "shipped".
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
  const live =
    provider === "basitkargo"
      ? await refreshBasitKargoOrder(boutique.slug, order)
      : order;
  return Response.json({
    provider,
    order: {
      ...live,
      items: live.items.filter((item) => item.boutiqueId === boutique.id),
    },
    trackingPath:
      provider && live.shipment.externalId
        ? shopperTrackingPath(boutique.slug, live.id)
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
      return Response.json(
        { error: "Kargo firması otomatik seçilir." },
        { status: 400 },
      );
    }
    if (action === "retry-address") {
      const rawAddress = body.shippingAddress;
      if (!rawAddress || typeof rawAddress !== "object") {
        return Response.json({ error: "Adres zorunlu." }, { status: 400 });
      }
      const record = rawAddress as Record<string, unknown>;
      const validated = validateTurkeyShippingAddress({
        line1: typeof record.line1 === "string" ? record.line1 : "",
        line2: typeof record.line2 === "string" ? record.line2 : undefined,
        city: typeof record.city === "string" ? record.city : "",
        district: typeof record.district === "string" ? record.district : "",
        postalCode:
          typeof record.postalCode === "string" ? record.postalCode : "",
        country: "TR",
      });
      if (!validated.ok) {
        return Response.json({ error: validated.error }, { status: 400 });
      }
      const order = await retryShipmentAfterAddressEdit(boutique, id, {
        line1: validated.address.line1,
        line2: validated.address.line2,
        city: validated.address.city,
        district: validated.address.district,
        postalCode: validated.address.postalCode,
        country: "TR",
      });
      return Response.json({
        order,
        trackingPath: shopperTrackingPath(boutique.slug, order.id),
      });
    }
    if (action === "fulfill") {
      const order = await autoFulfillPaidShipment(boutique, id, {
        manual: true,
      });
      if (!order) {
        return Response.json(
          { error: "Etiket üretilemedi. Basit Kargo bakiyesini kontrol edin." },
          { status: 502 },
        );
      }
      return Response.json({
        order,
        trackingPath: shopperTrackingPath(boutique.slug, order.id),
      });
    }
    if (action === "cancel") {
      const result = await cancelBoutiqueShipmentBarcode(boutique, id);
      return Response.json({ order: result.order });
    }
    if (action === "manual-ship") {
      if (getShippingProviderId(boutique.slug)) {
        return Response.json(
          {
            error:
              "Bu butikte kargo entegrasyonu var; etiketi Kargo bölümünden oluşturun.",
          },
          { status: 409 },
        );
      }
      const checked = validateManualShipment({
        carrierName: body.carrierName,
        trackingCode: body.trackingCode,
      });
      if (!checked.ok) {
        return Response.json({ error: checked.error }, { status: 400 });
      }
      const existing = await getOrderByIdAdmin(id);
      if (
        !existing ||
        !existing.items.some((item) => item.boutiqueId === boutique.id)
      ) {
        return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
      }
      // Same visibility rule as the order PATCH: an unpaid or failed card checkout
      // is not an order the owner can act on.
      if (
        (await boutiqueOffersIyzicoCheckout(boutique.slug)) &&
        !existing.isSandbox &&
        (existing.paymentStatus === "pending" ||
          existing.paymentStatus === "failed")
      ) {
        return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
      }
      if (
        existing.fulfillmentStatus !== "created" &&
        existing.fulfillmentStatus !== "ready" &&
        existing.fulfillmentStatus !== "shipped"
      ) {
        return Response.json(
          { error: "Bu durumdaki siparişin kargo bilgisi değiştirilemez." },
          { status: 409 },
        );
      }
      await updateOrderShipmentAdmin(id, {
        carrierName: checked.carrierName,
        trackingCode: checked.trackingCode,
        fulfillmentStatus: "shipped",
      });
      const order = await getOrderByIdAdmin(id);
      if (!order) {
        return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
      }
      return Response.json({
        order: {
          ...order,
          items: order.items.filter((item) => item.boutiqueId === boutique.id),
        },
      });
    }
    return Response.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error) {
    console.error("[tr/owner/orders/shipment]", error);
    return jsonError(error, "Kargo işlemi başarısız.");
  }
}
