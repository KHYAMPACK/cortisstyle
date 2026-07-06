import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  mapOrderItemRow,
  mapOrderRow,
  shippingAddressToJson,
} from "@/lib/tr/mappers";
import { markProductsSoldAdmin } from "@/lib/tr/products";
import type {
  CreateTrOrderInput,
  TrOrder,
  TrOrderWithItems,
  TrPaymentStatus,
} from "@/types/tr-marketplace";

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
      is_sandbox: isSandbox,
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
    items: (itemRows ?? []).map((row) =>
      mapOrderItemRow(row as Record<string, unknown>),
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
    items: (itemRows ?? []).map((row) =>
      mapOrderItemRow(row as Record<string, unknown>),
    ),
  };
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
      await markProductsSoldAdmin(items.items.map((item) => item.productId));
    }
  }

  return order;
}
