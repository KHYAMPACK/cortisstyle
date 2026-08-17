import { createOrderConfirmToken } from "@/lib/tr/commerce/orderConfirmToken";
import { fulfillmentFromProviderStatus } from "@/lib/tr/shipping/mapFulfillment";
import {
  BasitKargoError,
  basitKargoBuyBarcode,
  basitKargoCancelBarcode,
  basitKargoCreateOrder,
  basitKargoDeleteOrder,
  basitKargoGetBalanceTl,
  basitKargoGetLabelSvg,
  basitKargoGetOrder,
  basitKargoListFees,
  basitKargoUpdateOrder,
  classifyBasitKargoFailure,
  feeKurusFromPayload,
  getBasitKargoTokenForSlug,
  isBenignBasitCancelError,
  mapBasitKargoTraces,
  ownerMessageForBasitFailure,
  type BasitKargoOrderPayload,
} from "@/lib/tr/shipping/providers/basitKargo";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import {
  SHIPPING_BLOCK_ADDRESS_REJECTED,
  SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
  SHIPPING_BLOCK_PROVIDER_ERROR,
  isEligibleAutoBuyRate,
  type TrShippingBlock,
  type TrShippingRate,
} from "@/lib/tr/shipping/types";
import {
  getOrderByIdAdmin,
  updateOrderShipmentAdmin,
} from "@/lib/tr/orders";
import { trBoutiqueOrderTrackingPath } from "@/lib/tr/paths";
import type { TrOrderWithItems, TrShippingAddress } from "@/types/tr-marketplace";

export function orderMayCreateShipment(order: TrOrderWithItems): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (order.paymentStatus === "refunded") return false;
  return (
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.isSandbox
  );
}

/** True address reject — not a misclassified balance/auth failure. */
export function isAddressRejectLock(shipment: {
  block: TrOrderWithItems["shipment"]["block"];
  lastError: string | null;
}): boolean {
  if (shipment.block !== SHIPPING_BLOCK_ADDRESS_REJECTED) return false;
  const kind = classifyBasitKargoFailure(shipment.lastError ?? "", 0);
  return kind !== "balance" && kind !== "auth" && kind !== "rate_limit";
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
    block: payload.barcode ? null : order.shipment.block,
    lastError: payload.barcode ? null : order.shipment.lastError,
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

/**
 * Panel İptal: cancel barcode if any, then delete the Basit draft so it
 * does not stay as “Yeni Sipariş”. Local fulfillment is updated by the caller.
 */
export async function cancelLiveShipmentForCancelledOrder(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<void> {
  if (getShippingProviderId(boutique.slug) !== "basitkargo") return;

  const order = await requireOwnedOrder(boutique, orderId);
  const token = getBasitKargoTokenForSlug(boutique.slug);
  if (!token) return;

  const barcode = order.shipment.barcode;
  const externalId = order.shipment.externalId;
  if (!barcode && !externalId) return;

  if (barcode) {
    try {
      await basitKargoCancelBarcode(token, barcode);
    } catch (error) {
      if (!isBenignBasitCancelError(error)) {
        throw error instanceof Error
          ? error
          : new Error("Basit Kargo kodu iptal edilemedi.");
      }
    }
  }

  if (externalId) {
    try {
      await basitKargoDeleteOrder(token, externalId);
    } catch (error) {
      if (!isBenignBasitCancelError(error)) {
        const message =
          error instanceof Error ? error.message : "Sipariş silinemedi.";
        throw new Error(`Basit Kargo kaydı silinemedi: ${message}`);
      }
    }
  }

  await updateOrderShipmentAdmin(order.id, {
    barcode: null,
    trackingCode: null,
    carrierCode: null,
    carrierName: null,
    externalId: null,
    status: null,
    block: null,
    lastError: null,
  });
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

  return withOrderLock(orderId, async () => {
    try {
      return await runCarrierWaterfall(boutique, orderId, {
        allowWhenAddressRejected: false,
      });
    } catch (error) {
      console.error("[shipping] auto-fulfill failed:", error);
      const kind =
        error instanceof BasitKargoError
          ? error.kind
          : classifyBasitKargoFailure(
              error instanceof Error ? error.message : "",
              0,
            );
      const lastError = ownerMessageForBasitFailure(
        kind,
        error instanceof Error ? error.message : "Etiket üretilemedi.",
      );
      const block: TrShippingBlock =
        kind === "balance"
          ? SHIPPING_BLOCK_INSUFFICIENT_BALANCE
          : SHIPPING_BLOCK_PROVIDER_ERROR;
      try {
        await updateOrderShipmentAdmin(orderId, { block, lastError });
      } catch (persistError) {
        console.error("[shipping] persist auto-fulfill error:", persistError);
      }
      return getOrderByIdAdmin(orderId);
    }
  }).catch((error) => {
    console.error("[shipping] auto-fulfill lock:", error);
    return null;
  });
}

/**
 * Case 2 only: address was rejected by every eligible carrier.
 * Owner edits after WhatsApp, then we waterfall once more.
 */
export async function retryShipmentAfterAddressEdit(
  boutique: { id: string; slug: string },
  orderId: string,
  nextAddress: TrShippingAddress,
): Promise<TrOrderWithItems> {
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }

  const locked = await withOrderLock(orderId, async () => {
    const order = await requireOwnedOrder(boutique, orderId);
    if (!orderMayCreateShipment(order)) {
      throw new Error("Bu siparişte kargo üretilemez.");
    }
    if (order.shipment.barcode) {
      throw new Error("Etiket oluşmuş; adres değiştirilemez.");
    }
    if (order.shipment.block !== SHIPPING_BLOCK_ADDRESS_REJECTED) {
      throw new Error("Adres yalnızca tüm kargo firmaları reddedince değiştirilir.");
    }
    if (order.shipment.addressRetryUsed) {
      throw new Error("Adres denemesi kullanıldı. Siparişi iade edin.");
    }

    await updateOrderShipmentAdmin(order.id, {
      shippingAddress: nextAddress,
      lastError: null,
    });

    const withAddress = await getOrderByIdAdmin(order.id);
    if (!withAddress) throw new Error("Sipariş bulunamadı.");

    if (withAddress.shipment.externalId) {
      const token = requireBasitKargoToken(boutique.slug);
      try {
        const updated = await basitKargoUpdateOrder(token, withAddress);
        await persistPayload(withAddress, updated);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Adres kargoya işlenemedi.";
        await updateOrderShipmentAdmin(order.id, { lastError: message });
        throw new Error(message);
      }
    }

    await updateOrderShipmentAdmin(order.id, { addressRetryUsed: true });

    const result = await runCarrierWaterfall(boutique, orderId, {
      allowWhenAddressRejected: true,
    });
    if (!result) throw new Error("Etiket üretilemedi.");
    return result;
  });

  if (!locked) throw new Error("Etiket üretilemedi.");
  return locked;
}

const inflightByOrder = new Map<string, Promise<TrOrderWithItems | null>>();

async function withOrderLock<T>(
  orderId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflightByOrder.get(orderId);
  if (existing) {
    await existing;
    throw new Error("Kargo işlemi zaten sürüyor.");
  }
  const pending = fn();
  inflightByOrder.set(
    orderId,
    pending.then(
      (value) => (value as TrOrderWithItems | null) ?? null,
      () => null,
    ),
  );
  try {
    return await pending;
  } finally {
    inflightByOrder.delete(orderId);
  }
}

async function runCarrierWaterfall(
  boutique: { id: string; slug: string },
  orderId: string,
  options: { allowWhenAddressRejected: boolean },
): Promise<TrOrderWithItems | null> {
  const created = await createBoutiqueShipment(boutique, orderId);
  let order = created.order;
  if (order.shipment.barcode) return order;
  if (
    isAddressRejectLock(order.shipment) &&
    !options.allowWhenAddressRejected
  ) {
    return order;
  }

  const token = requireBasitKargoToken(boutique.slug);
  const externalId = order.shipment.externalId;
  if (!externalId) {
    throw new Error("Kargo kaydı oluşturulamadı.");
  }

  const rates = (created.rates.length > 0
    ? created.rates
    : await basitKargoListFees(token, externalId)
  )
    .filter((rate) => isEligibleAutoBuyRate(rate))
    .sort((a, b) => a.feeKurus - b.feeKurus);

  if (rates.length === 0) {
    await markShippingBlock(
      order.id,
      SHIPPING_BLOCK_PROVIDER_ERROR,
      "Uygun kargo firması yok (Yurtiçi ve 140 TL üstü denemez).",
    );
    return (await getOrderByIdAdmin(order.id)) ?? order;
  }

  const balanceTl = await basitKargoGetBalanceTl(token);
  const cheapest = rates[0];
  if (
    balanceTl != null &&
    cheapest &&
    Math.round(balanceTl * 100) < cheapest.feeKurus
  ) {
    await markShippingBlock(
      order.id,
      SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
      `Basit Kargo bakiyesi yetersiz (şu an ${balanceTl} TL). En ucuz etiket ${Math.ceil(cheapest.feeKurus / 100)} TL. Bakiyeyi yükleyip Etiket hazırla’ya basın.`,
    );
    return (await getOrderByIdAdmin(order.id)) ?? order;
  }

  let lastError = "Hiçbir kargo firması bu adresi kabul etmedi.";
  for (const rate of rates) {
    const latest = await getOrderByIdAdmin(order.id);
    if (latest?.shipment.barcode) return latest;
    try {
      const bought = await basitKargoBuyBarcode(
        token,
        externalId,
        rate.handlerCode,
      );
      if (bought.barcode) {
        await persistPayload(latest ?? order, bought);
        await updateOrderShipmentAdmin(order.id, {
          block: null,
          lastError: null,
        });
        return (await getOrderByIdAdmin(order.id)) ?? order;
      }
    } catch (error) {
      const kind =
        error instanceof BasitKargoError
          ? error.kind
          : classifyBasitKargoFailure(
              error instanceof Error ? error.message : "",
              0,
            );
      lastError = ownerMessageForBasitFailure(
        kind,
        error instanceof Error ? error.message : lastError,
      );
      console.warn(
        "[shipping] carrier refused",
        rate.handlerCode,
        kind,
        lastError,
      );
      if (kind === "balance") {
        await markShippingBlock(
          order.id,
          SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
          lastError,
        );
        return (await getOrderByIdAdmin(order.id)) ?? order;
      }
      if (kind === "auth" || kind === "rate_limit") {
        await markShippingBlock(
          order.id,
          SHIPPING_BLOCK_PROVIDER_ERROR,
          lastError,
        );
        return (await getOrderByIdAdmin(order.id)) ?? order;
      }
    }
  }

  await markShippingBlock(
    order.id,
    SHIPPING_BLOCK_ADDRESS_REJECTED,
    lastError,
  );
  return (await getOrderByIdAdmin(order.id)) ?? order;
}

async function markShippingBlock(
  orderId: string,
  block: TrShippingBlock,
  lastError: string,
) {
  await updateOrderShipmentAdmin(orderId, {
    block,
    lastError: lastError.slice(0, 400),
  });
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
