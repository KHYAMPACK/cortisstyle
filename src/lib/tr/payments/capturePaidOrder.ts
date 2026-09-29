import { ensureDraftInvoiceForBoutiqueOrder } from "@/lib/tr/invoices";
import { decrementInventoryForOrderLines } from "@/lib/tr/inventory";
import { inventoryLinesOf } from "@/lib/tr/commerce/inventoryLines";
import {
  getOrderByIdAdmin,
  getOrderDiscountCampaignIdsAdmin,
  markOrderPaidIfAwaitingPaymentAdmin,
} from "@/lib/tr/orders";
import { autoFulfillPaidShipment } from "@/lib/tr/shipping/ownerShipment";

export async function captureBoutiqueOrderAsPaid(input: {
  boutique: { id: string; slug: string };
  orderId: string;
  iyzico: { paymentId: string; conversationId: string };
}): Promise<"paid" | "already_paid"> {
  const existing = await getOrderByIdAdmin(input.orderId);
  if (!existing) {
    throw new Error("Sipariş bulunamadı.");
  }
  if (existing.paymentStatus === "paid") return "already_paid";
  if (existing.fulfillmentStatus === "cancelled") {
    throw new Error("İptal sipariş ödenemez.");
  }
  if (existing.paymentStatus === "refunded") {
    throw new Error("İade edilmiş sipariş ödenemez.");
  }

  const wasFailed = existing.paymentStatus === "failed";
  if (wasFailed) {
    await decrementInventoryForOrderLines(inventoryLinesOf(existing.items));
  }

  const updated = await markOrderPaidIfAwaitingPaymentAdmin(
    input.orderId,
    input.iyzico,
  );

  if (!updated) {
    const latest = await getOrderByIdAdmin(input.orderId);
    if (latest?.paymentStatus === "paid") return "already_paid";
    throw new Error("Sipariş ödeme durumu güncellenemedi.");
  }

  try {
    await ensureDraftInvoiceForBoutiqueOrder(input.boutique.id, input.orderId);
  } catch (invoiceError) {
    console.error(
      "[tr/payments] invoice draft after iyzico paid failed:",
      invoiceError,
    );
  }

  if (updated.discountCode) {
    try {
      const { getDiscountCodeForBoutiqueAdmin } = await import(
        "@/lib/tr/discountCodes"
      );
      const { recordDiscountUsageIfNeeded } = await import(
        "@/lib/tr/checkoutValidate"
      );
      const row = await getDiscountCodeForBoutiqueAdmin(
        input.boutique.id,
        updated.discountCode,
      );
      await recordDiscountUsageIfNeeded(row);
    } catch (couponError) {
      console.error("[tr/payments] coupon usage after paid failed:", couponError);
    }
  }

  try {
    const campaignIds = await getOrderDiscountCampaignIdsAdmin(input.orderId);
    if (campaignIds.length > 0) {
      const { incrementCampaignUsage } = await import(
        "@/lib/tr/catalog/discountCampaigns"
      );
      await Promise.all(campaignIds.map((id) => incrementCampaignUsage(id)));
    }
  } catch (campaignError) {
    console.error("[tr/payments] campaign usage after paid failed:", campaignError);
  }

  try {
    const { notifyBoutiqueOwnersOfNewOrderSafe } = await import(
      "@/lib/tr/pushNotify"
    );
    await notifyBoutiqueOwnersOfNewOrderSafe({
      boutiqueId: input.boutique.id,
      orderId: input.orderId,
      customerName: updated.customerName,
      totalKurus: updated.totalKurus,
    });
  } catch (notifyError) {
    console.error("[tr/payments] owner push after paid failed:", notifyError);
  }

  await autoFulfillPaidShipment(input.boutique, input.orderId);
  return "paid";
}
