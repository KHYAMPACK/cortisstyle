import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  mapOrderItemRow,
  mapOrderRow,
  shippingAddressToJson,
} from "@/lib/tr/mappers";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  listProductsByIdsAdmin,
} from "@/lib/tr/products";
import type {
  CreateTrOrderInput,
  TrFulfillmentStatus,
  TrOrder,
  TrOrderItem,
  TrOrderWithItems,
  TrOwnerCustomer,
  TrPaymentStatus,
} from "@/types/tr-marketplace";

const CUSTOMER_ORDER_STATUSES: TrPaymentStatus[] = [
  "paid",
  "sandbox",
  "pending",
];
const SPEND_STATUSES: TrPaymentStatus[] = ["paid", "sandbox"];

async function withProductImages(
  items: TrOrderItem[],
): Promise<TrOrderItem[]> {
  if (items.length === 0) return items;
  const products = await listProductsByIdsAdmin(
    items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id)),
  );
  const coverById = new Map(
    products.map((product) => [
      product.id,
      getProductCoverImageFor("boutique", product),
    ]),
  );
  return items.map((item) => ({
    ...item,
    imageUrl: item.productId
      ? (coverById.get(item.productId) ?? null)
      : null,
  }));
}

export async function createOrderAdmin(
  input: CreateTrOrderInput,
): Promise<TrOrderWithItems> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  if (input.items.length === 0) {
    throw new Error("Order must include at least one item.");
  }

  const subtotalKurus = input.items.reduce(
    (sum, item) => sum + item.priceKurus * (item.quantity ?? 1),
    0,
  );
  const discountKurus = Math.max(
    0,
    Math.min(subtotalKurus, Math.floor(input.discountKurus ?? 0)),
  );
  const discountCode = input.discountCode?.trim().toUpperCase() || null;
  const shippingFeeKurus = Math.max(0, Math.floor(input.shippingFeeKurus ?? 0));
  const totalKurus = Math.max(0, subtotalKurus - discountKurus + shippingFeeKurus);

  const isSandbox = input.isSandbox ?? false;
  const paymentStatus: TrPaymentStatus = isSandbox ? "sandbox" : "pending";

  const inventoryLines = input.items.map((item) => ({
    productId: item.productId,
    size: item.size?.trim() || null,
    quantity: item.quantity ?? 1,
  }));

  const shouldDecrement = input.decrementInventory !== false;
  if (shouldDecrement) {
    const { decrementInventoryForOrderLines } = await import(
      "@/lib/tr/inventory"
    );
    await decrementInventoryForOrderLines(inventoryLines);
  }

  let orderRow: Record<string, unknown>;
  let itemRows: Record<string, unknown>[] | null;

  try {
    const invoiceType =
    input.invoiceType === "corporate" ? "corporate" : "individual";
  const buyerTaxId =
    input.buyerTaxId?.replace(/\D/g, "").trim() || null;
  const buyerTaxOffice = input.buyerTaxOffice?.trim() || null;
  const buyerTitle = input.buyerTitle?.trim() || null;

  const orderInsert = await supabase
      .from("tr_orders")
      .insert({
        customer_email: input.customerEmail.trim().toLowerCase(),
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone?.trim() ?? null,
        shipping_address: shippingAddressToJson(input.shippingAddress),
        total_kurus: totalKurus,
        discount_code: discountCode,
        discount_kurus: discountKurus,
        invoice_type: invoiceType,
        buyer_tax_id: buyerTaxId,
        buyer_tax_office: buyerTaxOffice,
        buyer_title: buyerTitle,
        payment_status: paymentStatus,
        fulfillment_status: "created",
        is_sandbox: isSandbox,
        ...(shippingFeeKurus > 0
          ? { shipping_fee_kurus: shippingFeeKurus }
          : {}),
        ...(input.shippingProvider
          ? { shipping_provider: input.shippingProvider }
          : {}),
        ...(input.createdAt ? { created_at: input.createdAt } : {}),
      })
      .select("*")
      .single();

    if (orderInsert.error) throw orderInsert.error;
    orderRow = orderInsert.data as Record<string, unknown>;

    const order = mapOrderRow(orderRow);

    const itemsInsert = await supabase
      .from("tr_order_items")
      .insert(
        input.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          boutique_id: item.boutiqueId,
          title: item.title,
          price_kurus: item.priceKurus,
          quantity: item.quantity ?? 1,
          size: item.size?.trim() || null,
        })),
      )
      .select("*");

    if (itemsInsert.error) throw itemsInsert.error;
    itemRows = (itemsInsert.data ?? []) as Record<string, unknown>[];
  } catch (error) {
    if (shouldDecrement) {
      try {
        const { restoreInventoryForOrderLines } = await import(
          "@/lib/tr/inventory"
        );
        await restoreInventoryForOrderLines(inventoryLines);
      } catch (restoreError) {
        console.error(
          "[tr/orders] inventory restore after failed create:",
          restoreError,
        );
      }
    }
    throw error;
  }

  const order = mapOrderRow(orderRow);

  const items = await withProductImages(
    (itemRows ?? []).map((row) =>
      mapOrderItemRow(row as Record<string, unknown>),
    ),
  );

  const boutiqueIds = [
    ...new Set(items.map((item) => item.boutiqueId).filter(Boolean)),
  ];

  // Await push so serverless (Vercel) does not freeze before FCM/Mozilla gets the message.
  // Fire-and-forget here often means the alert only appears after the owner opens the app.
  if (boutiqueIds.length > 0) {
    const { notifyBoutiqueOwnersOfNewOrderSafe } = await import(
      "@/lib/tr/pushNotify"
    );
    await Promise.all(
      boutiqueIds.map((boutiqueId) => {
        const boutiqueTotal = items
          .filter((item) => item.boutiqueId === boutiqueId)
          .reduce((sum, item) => sum + item.priceKurus * item.quantity, 0);
        return notifyBoutiqueOwnersOfNewOrderSafe({
          boutiqueId,
          orderId: order.id,
          customerName: order.customerName,
          totalKurus: boutiqueTotal || order.totalKurus,
        });
      }),
    );
  }

  return {
    ...order,
    items,
  };
}

export async function getOrderByIdAdmin(
  orderId: string,
): Promise<TrOrderWithItems | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: orderRow, error: orderError } = await supabase
    .from("tr_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!orderRow) return null;

  const order = mapOrderRow(orderRow as Record<string, unknown>);

  const { data: itemRows, error: itemsError } = await supabase
    .from("tr_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  return {
    ...order,
    items: await withProductImages(
      (itemRows ?? []).map((row) =>
        mapOrderItemRow(row as Record<string, unknown>),
      ),
    ),
  };
}

export async function listOrdersByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrOrderWithItems[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("tr_order_items")
    .select("*")
    .eq("boutique_id", boutiqueId);

  if (itemsError) throw itemsError;

  const orderIds = [
    ...new Set((itemRows ?? []).map((row) => row.order_id as string)),
  ];
  if (orderIds.length === 0) return [];

  const { data: orderRows, error: ordersError } = await supabase
    .from("tr_orders")
    .select("*")
    .in("id", orderIds)
    .order("created_at", { ascending: false });

  if (ordersError) throw ordersError;

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const row of itemRows ?? []) {
    const orderId = row.order_id as string;
    const list = itemsByOrder.get(orderId) ?? [];
    list.push(row);
    itemsByOrder.set(orderId, list);
  }

  const mapped = (orderRows ?? []).map((row) => {
    const order = mapOrderRow(row as Record<string, unknown>);
    const items = (itemsByOrder.get(order.id) ?? []).map((item) =>
      mapOrderItemRow(item as Record<string, unknown>),
    );
    return { ...order, items };
  });

  const allItems = mapped.flatMap((order) => order.items);
  const withImages = await withProductImages(allItems);
  const imageByItemId = new Map(withImages.map((item) => [item.id, item.imageUrl]));

  return mapped.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      imageUrl: imageByItemId.get(item.id) ?? null,
    })),
  }));
}

export async function updateOrderFulfillmentStatusAdmin(
  orderId: string,
  fulfillmentStatus: TrFulfillmentStatus,
): Promise<TrOrder> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const existing = await getOrderByIdAdmin(orderId);
  if (!existing) {
    throw new Error("Sipariş bulunamadı.");
  }

  const wasCancelled = existing.fulfillmentStatus === "cancelled";
  const willCancel = fulfillmentStatus === "cancelled";

  const { data, error } = await supabase
    .from("tr_orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  // Restore inventory once when transitioning into cancelled.
  if (willCancel && !wasCancelled) {
    try {
      const { restoreInventoryForOrderLines } = await import(
        "@/lib/tr/inventory"
      );
      await restoreInventoryForOrderLines(
        existing.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId as string,
            size: item.size,
            quantity: item.quantity,
          })),
      );
    } catch (restoreError) {
      console.error(
        "[tr/orders] inventory restore on cancel failed:",
        restoreError,
      );
    }
  }

  return mapOrderRow(data as Record<string, unknown>);
}

export async function listOwnerCustomersByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrOwnerCustomer[]> {
  const orders = await listOrdersByBoutiqueIdAdmin(boutiqueId);
  const byEmail = new Map<string, TrOwnerCustomer>();

  for (const order of orders) {
    if (!CUSTOMER_ORDER_STATUSES.includes(order.paymentStatus)) continue;
    if (order.fulfillmentStatus === "cancelled") continue;
    const email = order.customerEmail.toLowerCase();
    const existing = byEmail.get(email);
    const lineTotal = order.items
      .filter((item) => item.boutiqueId === boutiqueId)
      .reduce((sum, item) => sum + item.priceKurus * item.quantity, 0);
    const countSpend = SPEND_STATUSES.includes(order.paymentStatus);

    if (!existing) {
      byEmail.set(email, {
        email,
        name: order.customerName,
        phone: order.customerPhone,
        orderCount: 1,
        spendKurus: countSpend ? lineTotal : 0,
        lastOrderAt: order.createdAt,
      });
      continue;
    }

    existing.orderCount += 1;
    if (countSpend) existing.spendKurus += lineTotal;
    if (order.createdAt > existing.lastOrderAt) {
      existing.lastOrderAt = order.createdAt;
      existing.name = order.customerName;
      existing.phone = order.customerPhone ?? existing.phone;
    }
  }

  return [...byEmail.values()].sort((a, b) =>
    b.lastOrderAt.localeCompare(a.lastOrderAt),
  );
}

export async function updateOrderPaymentStatusAdmin(
  orderId: string,
  paymentStatus: TrPaymentStatus,
  iyzico?: { paymentId?: string; conversationId?: string },
): Promise<TrOrder> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_orders")
    .update({
      payment_status: paymentStatus,
      iyzico_payment_id: iyzico?.paymentId ?? null,
      iyzico_conversation_id: iyzico?.conversationId ?? null,
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  const order = mapOrderRow(data as Record<string, unknown>);

  // Inventory is decremented at order create (`decrementInventoryForOrderLines`).
  // Do not wholesale mark products sold here — multi-size stock may remain.

  return order;
}

export type TrOrderShipmentPatch = {
  provider?: TrOrder["shipment"]["provider"];
  externalId?: string | null;
  barcode?: string | null;
  carrierCode?: string | null;
  carrierName?: string | null;
  trackingCode?: string | null;
  status?: string | null;
  traces?: TrOrder["shipment"]["traces"];
  feeKurus?: number | null;
  fulfillmentStatus?: TrFulfillmentStatus;
};

export async function getOrderByShippingExternalIdAdmin(
  externalId: string,
): Promise<TrOrderWithItems | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_orders")
    .select("id")
    .eq("shipping_external_id", externalId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) return null;
  return getOrderByIdAdmin(data.id as string);
}

export async function updateOrderShipmentAdmin(
  orderId: string,
  patch: TrOrderShipmentPatch,
): Promise<TrOrder> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const row: Record<string, unknown> = {};
  if (patch.provider !== undefined) row.shipping_provider = patch.provider;
  if (patch.externalId !== undefined) {
    row.shipping_external_id = patch.externalId;
  }
  if (patch.barcode !== undefined) row.shipping_barcode = patch.barcode;
  if (patch.carrierCode !== undefined) {
    row.shipping_carrier_code = patch.carrierCode;
  }
  if (patch.carrierName !== undefined) {
    row.shipping_carrier_name = patch.carrierName;
  }
  if (patch.trackingCode !== undefined) {
    row.shipping_tracking_code = patch.trackingCode;
  }
  if (patch.status !== undefined) row.shipping_status = patch.status;
  if (patch.traces !== undefined) row.shipping_traces = patch.traces;
  if (patch.feeKurus !== undefined) row.shipping_fee_kurus = patch.feeKurus;
  if (patch.fulfillmentStatus !== undefined) {
    row.fulfillment_status = patch.fulfillmentStatus;
  }

  if (Object.keys(row).length === 0) {
    const existing = await getOrderByIdAdmin(orderId);
    if (!existing) throw new Error("Sipariş bulunamadı.");
    return existing;
  }

  const { data, error } = await supabase
    .from("tr_orders")
    .update(row)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;
  return mapOrderRow(data as Record<string, unknown>);
}
