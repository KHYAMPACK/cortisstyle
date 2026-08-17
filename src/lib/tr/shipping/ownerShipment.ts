import { createOrderConfirmToken } from "@/lib/tr/commerce/orderConfirmToken";
import { fulfillmentFromProviderStatus } from "@/lib/tr/shipping/mapFulfillment";
import {
  BasitKargoError,
  basitKargoBuyBarcode,
  basitKargoCancelBarcode,
  basitKargoCreateOrder,
  basitKargoGetLabelSvg,
  basitKargoGetOrder,
  basitKargoListFees,
  feeKurusFromPayload,
  getBasitKargoTokenForSlug,
  mapBasitKargoTraces,
  type BasitKargoOrderPayload,
} from "@/lib/tr/shipping/providers/basitKargo";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import {
  CHECKOUT_SHIPPING_HANDLER,
  type TrShippingRate,
} from "@/lib/tr/shipping/types";
import {
  getOrderByIdAdmin,
  updateOrderShipmentAdmin,
} from "@/lib/tr/orders";
import { trBoutiqueOrderTrackingPath } from "@/lib/tr/paths";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

export function orderMayCreateShipment(order: TrOrderWithItems): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  return (
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.isSandbox
  );
}

function requireBasitKargoToken(slug: string): string {
  const token = getBasitKargoTokenForSlug(slug);
  if (!token) {
    throw new Error(
      "Basit Kargo token tanımlı değil. TR_SHIPPING_BASITKARGO_TOKENS kontrol edin.",
    );
  }
  return token;
}

function patchFromPayload(payload: BasitKargoOrderPayload) {
  return {
    provider: "basitkargo" as const,
    externalId: payload.id,
    barcode: payload.barcode ?? null,
    carrierCode: payload.shipmentInfo?.handler?.code ?? null,
    carrierName: payload.shipmentInfo?.handler?.name ?? null,
    trackingCode: payload.shipmentInfo?.handlerShipmentCode ?? null,
    status: payload.status,
    traces: mapBasitKargoTraces(payload.traces),
    feeKurus: feeKurusFromPayload(payload),
  };
}

async function persistPayload(
  order: TrOrderWithItems,
  payload: BasitKargoOrderPayload,
) {
  const mappedTraces = mapBasitKargoTraces(payload.traces);
  const patch = patchFromPayload(payload);
  return updateOrderShipmentAdmin(order.id, {
    ...patch,
    traces: mappedTraces.length > 0 ? mappedTraces : order.shipment.traces,
    feeKurus: order.shipment.feeKurus ?? patch.feeKurus,
    fulfillmentStatus: fulfillmentFromProviderStatus(
      order.fulfillmentStatus,
      payload.status,
    ),
  });
}

export async function createBoutiqueShipment(
  boutique: { id: string; slug: string },
  orderId: string,
) {
  const provider = getShippingProviderId(boutique.slug);
  if (provider !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }

  const order = await getOrderByIdAdmin(orderId);
  if (!order || !order.items.some((item) => item.boutiqueId === boutique.id)) {
    throw new Error("Sipariş bulunamadı.");
  }
  if (!orderMayCreateShipment(order)) {
    throw new Error("Ödeme onaylanmadan kargo oluşturulamaz.");
  }

  if (order.shipment.externalId && order.shipment.provider === "basitkargo") {
    if (order.shipment.barcode) {
      return { order, rates: [] as TrShippingRate[] };
    }
    const rates = await basitKargoListFees(
      requireBasitKargoToken(boutique.slug),
      order.shipment.externalId,
    );
    return { order, rates };
  }

  const token = requireBasitKargoToken(boutique.slug);
  const created = await basitKargoCreateOrder(token, order);
  const updated = await persistPayload(order, created);
  const fresh = await getOrderByIdAdmin(order.id);
  const rates = await basitKargoListFees(token, created.id);
  return { order: fresh ?? { ...order, ...updated, items: order.items }, rates };
}

export async function listBoutiqueShipmentRates(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<{ order: TrOrderWithItems; rates: TrShippingRate[] }> {
  const order = await requireOwnedOrder(boutique, orderId);
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }
  if (!order.shipment.externalId) {
    throw new Error("Önce kargo kaydı oluşturun.");
  }
  const rates = await basitKargoListFees(
    requireBasitKargoToken(boutique.slug),
    order.shipment.externalId,
  );
  return { order, rates };
}

export async function buyBoutiqueShipmentLabel(
  boutique: { id: string; slug: string },
  orderId: string,
  handlerCode: string,
) {
  const order = await requireOwnedOrder(boutique, orderId);
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }
  if (!orderMayCreateShipment(order)) {
    throw new Error("Ödeme onaylanmadan etiket alınamaz.");
  }
  if (!order.shipment.externalId) {
    throw new Error("Önce kargo kaydı oluşturun.");
  }
  if (order.shipment.barcode) {
    return { order };
  }
  const handler = handlerCode.trim().toUpperCase();
  if (handler !== CHECKOUT_SHIPPING_HANDLER) {
    throw new Error("Kargo firması müşteri ödemesine göre otomatik seçilir.");
  }

  const token = requireBasitKargoToken(boutique.slug);
  const bought = await basitKargoBuyBarcode(
    token,
    order.shipment.externalId,
    CHECKOUT_SHIPPING_HANDLER,
  );
  await persistPayload(order, bought);
  const fresh = await getOrderByIdAdmin(order.id);
  if (!fresh) throw new Error("Sipariş bulunamadı.");
  return { order: fresh };
}

export async function cancelBoutiqueShipmentBarcode(
  boutique: { id: string; slug: string },
  orderId: string,
) {
  const order = await requireOwnedOrder(boutique, orderId);
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }
  const barcode = order.shipment.barcode;
  if (!barcode) {
    throw new Error("İptal edilecek kargo kodu yok.");
  }
  await basitKargoCancelBarcode(
    requireBasitKargoToken(boutique.slug),
    barcode,
  );
  await updateOrderShipmentAdmin(order.id, {
    barcode: null,
    trackingCode: null,
    carrierCode: null,
    carrierName: null,
    status: "NEW",
    fulfillmentStatus:
      order.fulfillmentStatus === "cancelled"
        ? "cancelled"
        : "created",
  });
  const fresh = await getOrderByIdAdmin(order.id);
  if (!fresh) throw new Error("Sipariş bulunamadı.");
  return { order: fresh };
}

export async function getBoutiqueShipmentLabelSvg(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<string> {
  const order = await requireOwnedOrder(boutique, orderId);
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }
  if (!order.shipment.externalId || !order.shipment.barcode) {
    throw new Error("Etiket için kargo kodu yok.");
  }
  return basitKargoGetLabelSvg(
    requireBasitKargoToken(boutique.slug),
    order.shipment.externalId,
  );
}

export function shopperTrackingPath(
  boutiqueSlug: string,
  orderId: string,
): string {
  return trBoutiqueOrderTrackingPath(boutiqueSlug, orderId, {
    token: createOrderConfirmToken(orderId),
  });
}

export async function refreshBasitKargoOrder(
  boutiqueSlug: string,
  order: TrOrderWithItems,
): Promise<TrOrderWithItems> {
  if (
    getShippingProviderId(boutiqueSlug) !== "basitkargo" ||
    !order.shipment.externalId
  ) {
    return order;
  }
  const token = getBasitKargoTokenForSlug(boutiqueSlug);
  if (!token) return order;
  try {
    const payload = await basitKargoGetOrder(token, order.shipment.externalId);
    await persistPayload(order, payload);
    return (await getOrderByIdAdmin(order.id)) ?? order;
  } catch (error) {
    if (error instanceof BasitKargoError) {
      console.error("[shipping/basitkargo] refresh failed:", error.message);
    }
    return order;
  }
}

export async function autoFulfillPaidShipment(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<TrOrderWithItems | null> {
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    return null;
  }

  try {
    const created = await createBoutiqueShipment(boutique, orderId);
    if (created.order.shipment.barcode) {
      return created.order;
    }
    const bought = await buyBoutiqueShipmentLabel(
      boutique,
      orderId,
      CHECKOUT_SHIPPING_HANDLER,
    );
    return bought.order;
  } catch (error) {
    console.error("[shipping] auto-fulfill failed:", error);
    return null;
  }
}

async function requireOwnedOrder(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<TrOrderWithItems> {
  const order = await getOrderByIdAdmin(orderId);
  if (!order || !order.items.some((item) => item.boutiqueId === boutique.id)) {
    throw new Error("Sipariş bulunamadı.");
  }
  return order;
}
