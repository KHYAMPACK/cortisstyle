import { ensureDraftInvoiceForBoutiqueOrder } from "@/lib/tr/invoices";
import { decrementInventoryForOrderLines } from "@/lib/tr/inventory";
import {
  getOrderByIdAdmin,
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
    await decrementInventoryForOrderLines(
      existing.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId as string,
          size: item.size,
          quantity: item.quantity,
        })),
    );
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
