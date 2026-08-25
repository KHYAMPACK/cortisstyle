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
  purchasedBasitBarcode,
  type BasitKargoOrderPayload,
} from "@/lib/tr/shipping/providers/basitKargo";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import {
  SHIPPING_BLOCK_ADDRESS_REJECTED,
  SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
  SHIPPING_BLOCK_PROVIDER_ERROR,
  hasPurchasedShippingLabel,
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

export class BasitLabelGoneError extends Error {
  readonly order: TrOrderWithItems;

  constructor(order: TrOrderWithItems) {
    super("Etiket Basit Kargo’da iptal edildi. Yeniden Etiket hazırla.");
    this.name = "BasitLabelGoneError";
    this.order = order;
  }
}
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

/** Write Basit as source of truth — a cancelled etiket (NEW / null barcode) clears ours. */
export async function persistBasitShipmentPayload(
  order: TrOrderWithItems,
  payload: BasitKargoOrderPayload,
) {
  const barcode = purchasedBasitBarcode(payload);
  const traces = mapBasitKargoTraces(payload.traces);
  const status = payload.status?.trim() || (barcode ? null : "NEW");

  if (!barcode) {
    return updateOrderShipmentAdmin(order.id, {
      provider: "basitkargo",
      externalId: payload.id,
      barcode: null,
      trackingCode: null,
      carrierCode: null,
      carrierName: null,
      status: status || "NEW",
      traces: traces.length > 0 ? traces : order.shipment.traces,
      feeKurus: order.shipment.feeKurus,
      block: order.shipment.block,
      lastError: order.shipment.lastError,
      fulfillmentStatus: fulfillmentFromProviderStatus(
        order.fulfillmentStatus,
        status || "NEW",
      ),
    });
  }

  return updateOrderShipmentAdmin(order.id, {
    provider: "basitkargo",
    externalId: payload.id,
    barcode,
    carrierCode: payload.shipmentInfo?.handler?.code ?? null,
    carrierName: payload.shipmentInfo?.handler?.name ?? null,
    trackingCode: payload.shipmentInfo?.handlerShipmentCode ?? null,
    status: payload.status,
    traces: traces.length > 0 ? traces : order.shipment.traces,
    feeKurus: order.shipment.feeKurus ?? feeKurusFromPayload(payload),
    block: null,
    lastError: null,
    fulfillmentStatus: fulfillmentFromProviderStatus(
      order.fulfillmentStatus,
      payload.status,
    ),
  });
}

async function persistPayload(
  order: TrOrderWithItems,
  payload: BasitKargoOrderPayload,
) {
  return persistBasitShipmentPayload(order, payload);
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
    const synced = await refreshBasitKargoOrder(boutique.slug, order);
    if (hasPurchasedShippingLabel(synced.shipment)) {
      return { order: synced, rates: [] as TrShippingRate[] };
    }
    const rates = await basitKargoListFees(
      requireBasitKargoToken(boutique.slug),
      synced.shipment.externalId ?? order.shipment.externalId,
    );
    return { order: synced, rates };
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
  const barcode = hasPurchasedShippingLabel(order.shipment)
    ? order.shipment.barcode
    : null;
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
  const existing = await requireOwnedOrder(boutique, orderId);
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    throw new Error("Bu butik için kargo entegrasyonu yok.");
  }

  const order = await refreshBasitKargoOrder(boutique.slug, existing);
  if (
    !order.shipment.externalId ||
    !hasPurchasedShippingLabel(order.shipment)
  ) {
    if (order.shipment.barcode) {
      await updateOrderShipmentAdmin(order.id, {
        barcode: null,
        trackingCode: null,
        carrierCode: null,
        carrierName: null,
        status: "NEW",
        fulfillmentStatus:
          order.fulfillmentStatus === "ready" ? "created" : undefined,
      });
      const cleared = await getOrderByIdAdmin(order.id);
      throw new BasitLabelGoneError(cleared ?? order);
    }
    throw new BasitLabelGoneError(order);
  }

  try {
    return await basitKargoGetLabelSvg(
      requireBasitKargoToken(boutique.slug),
      order.shipment.externalId,
    );
  } catch (error) {
    if (
      error instanceof BasitKargoError &&
      (error.status === 404 || error.status === 400)
    ) {
      await updateOrderShipmentAdmin(order.id, {
        barcode: null,
        trackingCode: null,
        carrierCode: null,
        carrierName: null,
        status: "NEW",
        fulfillmentStatus:
          order.fulfillmentStatus === "ready" ? "created" : undefined,
      });
      const cleared = await getOrderByIdAdmin(order.id);
      throw new BasitLabelGoneError(cleared ?? order);
    }
    throw error;
  }
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
    if (error instanceof BasitKargoError && error.status === 404) {
      await updateOrderShipmentAdmin(order.id, {
        barcode: null,
        trackingCode: null,
        carrierCode: null,
        carrierName: null,
        externalId: null,
        status: null,
        fulfillmentStatus:
          order.fulfillmentStatus === "ready" ? "created" : undefined,
      });
      return (await getOrderByIdAdmin(order.id)) ?? order;
    }
    if (error instanceof BasitKargoError) {
      console.error("[shipping/basitkargo] refresh failed:", error.message);
    }
    return order;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index]!);
    }
  }
  const workers = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

/** Refresh Basit drafts/barcodes for a boutique order list. */
export async function refreshBasitShipmentsForOrders(
  boutiqueSlug: string,
  orders: TrOrderWithItems[],
): Promise<TrOrderWithItems[]> {
  if (getShippingProviderId(boutiqueSlug) !== "basitkargo") return orders;
  return mapPool(orders, 4, async (order) => {
    if (order.shipment.provider !== "basitkargo" || !order.shipment.externalId) {
      return order;
    }
    return refreshBasitKargoOrder(boutiqueSlug, order);
  });
}

export async function autoFulfillPaidShipment(
  boutique: { id: string; slug: string },
  orderId: string,
  options?: { manual?: boolean },
): Promise<TrOrderWithItems | null> {
  if (getShippingProviderId(boutique.slug) !== "basitkargo") {
    return null;
  }

  return withOrderLock(orderId, async () => {
    try {
      return await runCarrierWaterfall(boutique, orderId, {
        allowWhenAddressRejected: options?.manual === true,
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
    if (hasPurchasedShippingLabel(order.shipment)) {
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
  if (hasPurchasedShippingLabel(order.shipment)) return order;
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

  let lastError = "Etiket üretilemedi.";
  let addressRefusals = 0;
  let otherRefusals = 0;
  for (const rate of rates) {
    const latest = await getOrderByIdAdmin(order.id);
    if (latest && hasPurchasedShippingLabel(latest.shipment)) return latest;
    try {
      const bought = await basitKargoBuyBarcode(
        token,
        externalId,
        rate.handlerCode,
      );
      if (purchasedBasitBarcode(bought)) {
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
      if (kind === "address") addressRefusals += 1;
      else otherRefusals += 1;
    }
  }

  const after = await refreshBasitKargoOrder(
    boutique.slug,
    (await getOrderByIdAdmin(order.id)) ?? order,
  );
  if (hasPurchasedShippingLabel(after.shipment)) return after;

  await markShippingBlock(
    order.id,
    addressRefusals > 0 && otherRefusals === 0
      ? SHIPPING_BLOCK_ADDRESS_REJECTED
      : SHIPPING_BLOCK_PROVIDER_ERROR,
    addressRefusals > 0 && otherRefusals === 0
      ? lastError || "Hiçbir kargo firması bu adresi kabul etmedi."
      : lastError,
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
