import { ensureDraftInvoiceForBoutiqueOrder } from "@/lib/tr/invoices";
import { updateOrderPaymentStatusAdmin } from "@/lib/tr/orders";
import { autoFulfillPaidShipment } from "@/lib/tr/shipping/ownerShipment";

/**
 * What "the owner says this order is paid" does: mark it paid, draft its invoice (a
 * failure there never undoes the payment) and let a boutique with a live carrier
 * integration buy the label. Shared by the order page's Ödendi button and by a manual
 * order created as already paid, so both behave the same.
 */
export async function markOrderPaidByOwner(
  boutique: { id: string; slug: string },
  orderId: string,
): Promise<void> {
  await updateOrderPaymentStatusAdmin(orderId, "paid");
  try {
    await ensureDraftInvoiceForBoutiqueOrder(boutique.id, orderId);
  } catch (invoiceError) {
    console.error("[tr/owner/orders] invoice draft after paid failed:", invoiceError);
  }
  await autoFulfillPaidShipment({ id: boutique.id, slug: boutique.slug }, orderId);
}
