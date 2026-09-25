import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import {
  listVariantsByProductIds,
  variantValueLabelOf,
} from "@/lib/tr/catalog/productVariants";
import { getCustomerAdmin } from "@/lib/tr/commerce/customers";
import { markOrderPaidByOwner } from "@/lib/tr/commerce/ownerMarkPaid";
import { validateTurkeyShippingAddress } from "@/lib/tr/geo/turkeyAddress";
import {
  computeManualTotals,
  manualOrderReadyError,
  type ManualLine,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";
import {
  priceManualLine,
  type PricedManualLine,
} from "@/lib/tr/orders/priceManualLine";
import { createOrderAdmin, getOrderByIdAdmin } from "@/lib/tr/orders";
import { listProductsByIdsAdmin } from "@/lib/tr/products";
import { boutiqueHasCarrierIntegration } from "@/lib/tr/shipping/registry";
import type { TrBoutique, TrOrderWithItems } from "@/types/tr-marketplace";

/**
 * Pricing and creating an order the owner builds by hand. Server only. Everything that
 * matters is decided here from the catalog and the customer record — the request only
 * names products, a customer and an address; prices and stock are never taken from it.
 * The per-line rules are pure and tested in `orders/priceManualLine.ts`.
 */

export class ManualOrderError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "ManualOrderError";
  }
}

export type { PricedManualLine };

/**
 * Prices `lines` at the catalog's current prices.
 *
 * With `enforceStock` (creating the order) any problem stops with a sentence for the
 * owner: unknown product, not for sale, size or variant missing, not enough stock. Without
 * it (pricing a draft) a line that can no longer be sold is left out and counted in
 * `unavailable`, and stock is not checked — a draft holds none.
 */
export async function priceManualLines(args: {
  boutiqueId: string;
  lines: readonly ManualLine[];
  enforceStock: boolean;
}): Promise<{ lines: PricedManualLine[]; unavailable: number }> {
  const { boutiqueId, enforceStock } = args;
  if (args.lines.length === 0) return { lines: [], unavailable: 0 };

  const products = await listProductsByIdsAdmin(args.lines.map((line) => line.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  // Only Gelişmiş products can have variants, so the others cost no extra query.
  const variantsByProduct = await listVariantsByProductIds(
    products
      .filter((product) => product.productType === "advanced")
      .map((product) => product.id),
  );
  const labelOf =
    variantsByProduct.size > 0 ? await variantValueLabelOf(boutiqueId) : (id: string) => id;

  const priced: PricedManualLine[] = [];
  let unavailable = 0;
  for (const line of args.lines) {
    const result = priceManualLine({
      product: byId.get(line.productId),
      boutiqueId,
      variants: variantsByProduct.get(line.productId) ?? [],
      labelOf,
      line,
      enforceStock,
    });
    if (result.ok) {
      priced.push(result.line);
    } else if (enforceStock) {
      // Creating stops at the first problem; pricing a draft just leaves the line out.
      throw new ManualOrderError(result.error, 409);
    } else {
      unavailable += 1;
    }
  }
  return { lines: priced, unavailable };
}

/** Whether a boutique can sell by hand: a custom-art order needs the customer's photo. */
export function assertManualOrdersAllowed(boutique: TrBoutique): void {
  if (isCustomArtCatalogProfile(boutique)) {
    throw new ManualOrderError("Bu butik için panelden sipariş oluşturulamaz.");
  }
}

/**
 * Creates the order for a complete `draft`. Stock is taken as it is for a shop order
 * (and given back if the order can't be saved); the customer, address and prices come
 * from the database. `paymentStatus: "paid"` runs the same steps as the Ödendi button.
 */
export async function createManualOrder(args: {
  boutique: TrBoutique;
  draft: ManualOrderDraft;
}): Promise<TrOrderWithItems> {
  const { boutique, draft } = args;
  assertManualOrdersAllowed(boutique);

  const notReady = manualOrderReadyError(draft);
  if (notReady) throw new ManualOrderError(notReady);

  const customer = await getCustomerAdmin(boutique.id, draft.customerId!);
  if (!customer) throw new ManualOrderError("Müşteri bulunamadı.", 404);

  const saved = customer.addresses.find((address) => address.id === draft.addressId);
  if (!saved) throw new ManualOrderError("Teslimat adresi bulunamadı.", 404);
  const address = validateTurkeyShippingAddress({
    line1: saved.line1,
    line2: saved.line2,
    district: saved.district,
    city: saved.city,
    postalCode: saved.postalCode,
    country: saved.country,
  });
  if (!address.ok) throw new ManualOrderError(address.error);

  const { lines } = await priceManualLines({
    boutiqueId: boutique.id,
    lines: draft.lines,
    enforceStock: true,
  });
  const totals = computeManualTotals({
    lines,
    adjustment: draft.adjustment,
    shippingFeeKurus: draft.shippingFeeKurus,
  });

  let order: TrOrderWithItems;
  try {
    order = await createOrderAdmin({
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone,
      shippingAddress: {
        line1: address.address.line1,
        line2: address.address.line2,
        city: address.address.city,
        district: address.address.district,
        postalCode: address.address.postalCode,
        country: "TR",
      },
      invoiceType: "individual",
      items: lines.map((line) => ({
        productId: line.productId,
        boutiqueId: line.boutiqueId,
        title: line.title,
        priceKurus: line.priceKurus,
        quantity: line.quantity,
        size: line.size,
        variantId: line.variantId,
        variantLabel: line.variantLabel,
      })),
      discountKurus: totals.discountKurus,
      discountTitle: totals.discountKurus > 0 ? draft.adjustment?.title || "İndirim" : null,
      shippingFeeKurus: totals.shippingKurus,
      shippingProvider: boutiqueHasCarrierIntegration(boutique.slug) ? "basitkargo" : null,
      channel: "manual",
      customerNote: draft.customerNote,
      decrementInventory: true,
      // The owner is the one creating it; no "new order" alert to themselves.
      notifyOwners: false,
      isSandbox: false,
    });
  } catch (error) {
    // Someone else took the last unit between our check and the stock update.
    if (error instanceof Error && /stok|satışta|seçenek/i.test(error.message)) {
      throw new ManualOrderError(error.message, 409);
    }
    throw error;
  }

  if (draft.paymentStatus === "paid") {
    await markOrderPaidByOwner(boutique, order.id);
  }
  return (await getOrderByIdAdmin(order.id)) ?? order;
}

/** Marks a boutique's customer name for a draft's list row; null when there is none. */
export async function customerNameForDraft(
  boutiqueId: string,
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  try {
    return (await getCustomerAdmin(boutiqueId, customerId))?.name ?? null;
  } catch {
    return null;
  }
}
