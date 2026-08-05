import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  mapOrderItemRow,
  mapOrderRow,
  shippingAddressToJson,
} from "@/lib/tr/mappers";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  listProductsByIdsAdmin,
  markProductsSoldAdmin,
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

const PAID_LIKE: TrPaymentStatus[] = ["paid", "sandbox"];

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

  const totalKurus = input.items.reduce(
    (sum, item) => sum + item.priceKurus * (item.quantity ?? 1),
    0,
  );

  const isSandbox = input.isSandbox ?? true;
  const paymentStatus: TrPaymentStatus = isSandbox ? "sandbox" : "pending";

  const { data: orderRow, error: orderError } = await supabase
    .from("tr_orders")
    .insert({
      customer_email: input.customerEmail.trim().toLowerCase(),
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone?.trim() ?? null,
      shipping_address: shippingAddressToJson(input.shippingAddress),
      total_kurus: totalKurus,
      payment_status: paymentStatus,
      fulfillment_status: "created",
      is_sandbox: isSandbox,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select("*")
    .single();

  if (orderError) throw orderError;

  const order = mapOrderRow(orderRow as Record<string, unknown>);

  const { data: itemRows, error: itemsError } = await supabase
    .from("tr_order_items")
    .insert(
      input.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        boutique_id: item.boutiqueId,
        title: item.title,
        price_kurus: item.priceKurus,
        quantity: item.quantity ?? 1,
      })),
    )
    .select("*");

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

  const { data, error } = await supabase
    .from("tr_orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  return mapOrderRow(data as Record<string, unknown>);
}

export async function listOwnerCustomersByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrOwnerCustomer[]> {
  const orders = await listOrdersByBoutiqueIdAdmin(boutiqueId);
  const byEmail = new Map<string, TrOwnerCustomer>();

  for (const order of orders) {
    if (!PAID_LIKE.includes(order.paymentStatus)) continue;
    const email = order.customerEmail.toLowerCase();
    const existing = byEmail.get(email);
    const lineTotal = order.items
      .filter((item) => item.boutiqueId === boutiqueId)
      .reduce((sum, item) => sum + item.priceKurus * item.quantity, 0);

    if (!existing) {
      byEmail.set(email, {
        email,
        name: order.customerName,
        phone: order.customerPhone,
        orderCount: 1,
        spendKurus: lineTotal,
        lastOrderAt: order.createdAt,
      });
      continue;
    }

    existing.orderCount += 1;
    existing.spendKurus += lineTotal;
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

  if (paymentStatus === "paid" || paymentStatus === "sandbox") {
    const items = await getOrderByIdAdmin(orderId);
    if (items) {
      await markProductsSoldAdmin(
        items.items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      );
    }
  }

  return order;
}
