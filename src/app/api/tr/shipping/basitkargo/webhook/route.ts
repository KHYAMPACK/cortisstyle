import { timingSafeEqual } from "node:crypto";
import {
  getOrderByShippingExternalIdAdmin,
  updateOrderShipmentAdmin,
} from "@/lib/tr/orders";
import { fulfillmentFromProviderStatus } from "@/lib/tr/shipping/mapFulfillment";
import {
  basitKargoGetOrder,
  feeKurusFromPayload,
  getBasitKargoTokenForSlug,
  mapBasitKargoTraces,
} from "@/lib/tr/shipping/providers/basitKargo";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";

export const runtime = "nodejs";

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length).trim();
  if (!provided) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * POST /api/tr/shipping/basitkargo/webhook
 * Lila / Basit Kargo only. Bearer = TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Webhook gizli anahtarı yok." },
      { status: 503 },
    );
  }
  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const externalId = typeof body.id === "string" ? body.id.trim() : "";
  if (!externalId) {
    return Response.json({ error: "id zorunlu." }, { status: 400 });
  }

  const order = await getOrderByShippingExternalIdAdmin(externalId);
  if (!order || order.shipment.provider !== "basitkargo") {
    return Response.json({ ok: true, ignored: true });
  }

  const boutiqueSlug = order.items[0]
    ? await slugForBoutiqueId(order.items[0].boutiqueId)
    : null;
  if (!boutiqueSlug || getShippingProviderId(boutiqueSlug) !== "basitkargo") {
    return Response.json({ ok: true, ignored: true });
  }
  const token = getBasitKargoTokenForSlug(boutiqueSlug);

  try {
    if (token) {
      const fresh = await basitKargoGetOrder(token, externalId);
      const traces = mapBasitKargoTraces(
        Array.isArray(body.traces) ? body.traces : fresh.traces,
      );
      await updateOrderShipmentAdmin(order.id, {
        provider: "basitkargo",
        externalId: fresh.id,
        barcode: fresh.barcode ?? order.shipment.barcode,
        carrierCode:
          fresh.shipmentInfo?.handler?.code ?? order.shipment.carrierCode,
        carrierName:
          fresh.shipmentInfo?.handler?.name ?? order.shipment.carrierName,
        trackingCode:
          fresh.shipmentInfo?.handlerShipmentCode ??
          (typeof body.handlerShipmentCode === "string"
            ? body.handlerShipmentCode
            : order.shipment.trackingCode),
        status: fresh.status,
        traces: traces.length > 0 ? traces : order.shipment.traces,
        feeKurus:
          feeKurusFromPayload(fresh) ?? order.shipment.feeKurus,
        fulfillmentStatus: fulfillmentFromProviderStatus(
          order.fulfillmentStatus,
          fresh.status,
        ),
      });
    } else {
      const status =
        typeof body.status === "string" ? body.status : order.shipment.status;
      const handler =
        body.handler && typeof body.handler === "object"
          ? (body.handler as Record<string, unknown>)
          : null;
      await updateOrderShipmentAdmin(order.id, {
        status,
        barcode:
          typeof body.barcode === "string"
            ? body.barcode
            : order.shipment.barcode,
        carrierCode:
          typeof handler?.code === "string"
            ? handler.code
            : order.shipment.carrierCode,
        carrierName:
          typeof handler?.name === "string"
            ? handler.name
            : order.shipment.carrierName,
        trackingCode:
          typeof body.handlerShipmentCode === "string"
            ? body.handlerShipmentCode
            : order.shipment.trackingCode,
        fulfillmentStatus: fulfillmentFromProviderStatus(
          order.fulfillmentStatus,
          status,
        ),
      });
    }
  } catch (error) {
    console.error("[shipping/basitkargo/webhook]", error);
    return Response.json({ error: "Güncellenemedi." }, { status: 500 });
  }

  return Response.json({ ok: true });
}

async function slugForBoutiqueId(boutiqueId: string): Promise<string | null> {
  const { getServiceSupabase } = await import("@/lib/supabaseAdmin");
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("tr_boutiques")
    .select("slug")
    .eq("id", boutiqueId)
    .maybeSingle();
  return typeof data?.slug === "string" ? data.slug : null;
}
