import { timingSafeEqual } from "node:crypto";
import {
  getOrderByShippingExternalIdAdmin,
  updateOrderShipmentAdmin,
} from "@/lib/tr/orders";
import { fulfillmentFromProviderStatus } from "@/lib/tr/shipping/mapFulfillment";
import {
  basitKargoGetOrder,
  getBasitKargoTokenForSlug,
} from "@/lib/tr/shipping/providers/basitKargo";
import { persistBasitShipmentPayload } from "@/lib/tr/shipping/ownerShipment";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";

export const runtime = "nodejs";

function secretMatches(provided: string, secret: string): boolean {
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

function webhookAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    if (secretMatches(header.slice("Bearer ".length).trim(), secret)) {
      return true;
    }
  }
  const querySecret = new URL(request.url).searchParams.get("secret")?.trim() ?? "";
  return secretMatches(querySecret, secret);
}

/**
 * POST /api/tr/shipping/basitkargo/webhook
 * Lila / Basit Kargo only. Auth = Bearer TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET
 * or ?secret= (Basit panel URL field often has no header).
 */
export async function POST(request: Request) {
  const secret = process.env.TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Webhook gizli anahtarı yok." },
      { status: 503 },
    );
  }
  if (!webhookAuthorized(request, secret)) {
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
      await persistBasitShipmentPayload(order, fresh);
    } else {
      const status =
        typeof body.status === "string" ? body.status : order.shipment.status;
      const handler =
        body.handler && typeof body.handler === "object"
          ? (body.handler as Record<string, unknown>)
          : null;
      const barcodeCleared =
        body.barcode === null ||
        body.barcode === "" ||
        (typeof body.status === "string" &&
          body.status.trim().toUpperCase() === "NEW");
      await updateOrderShipmentAdmin(order.id, {
        status,
        barcode: barcodeCleared
          ? null
          : typeof body.barcode === "string"
            ? body.barcode
            : order.shipment.barcode,
        carrierCode: barcodeCleared
          ? null
          : typeof handler?.code === "string"
            ? handler.code
            : order.shipment.carrierCode,
        carrierName: barcodeCleared
          ? null
          : typeof handler?.name === "string"
            ? handler.name
            : order.shipment.carrierName,
        trackingCode: barcodeCleared
          ? null
          : typeof body.handlerShipmentCode === "string"
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
