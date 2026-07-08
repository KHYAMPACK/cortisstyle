import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { listProductsByBoutiqueIdAdmin } from "@/lib/tr/products";

export interface TrOwnerSummary {
  checkoutEnabled: boolean;
  inventory: {
    available: number;
    sold: number;
    hidden: number;
    total: number;
  };
  /** Present when checkout is enabled (Europe/Istanbul calendar day). */
  today: {
    orderCount: number;
    revenueKurus: number;
  } | null;
}

function istanbulDayBounds(now = new Date()): { startIso: string; endIso: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = formatter.format(now);
  const startIso = new Date(`${day}T00:00:00.000+03:00`).toISOString();
  const endIso = new Date(`${day}T23:59:59.999+03:00`).toISOString();
  return { startIso, endIso };
}

export async function getOwnerBoutiqueSummary(
  boutiqueId: string,
): Promise<TrOwnerSummary> {
  const products = await listProductsByBoutiqueIdAdmin(boutiqueId);
  const inventory = {
    available: products.filter((p) => p.status === "available").length,
    sold: products.filter((p) => p.status === "sold").length,
    hidden: products.filter((p) => p.status === "hidden").length,
    total: products.length,
  };

  const checkoutEnabled = isTrCheckoutEnabled();
  if (!checkoutEnabled) {
    return { checkoutEnabled, inventory, today: null };
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { startIso, endIso } = istanbulDayBounds();

  const { data: items, error: itemsError } = await supabase
    .from("tr_order_items")
    .select("order_id, price_kurus, quantity")
    .eq("boutique_id", boutiqueId);

  if (itemsError) throw itemsError;

  const orderIds = [
    ...new Set((items ?? []).map((row) => row.order_id as string)),
  ];

  if (orderIds.length === 0) {
    return {
      checkoutEnabled,
      inventory,
      today: { orderCount: 0, revenueKurus: 0 },
    };
  }

  const { data: orders, error: ordersError } = await supabase
    .from("tr_orders")
    .select("id, created_at, payment_status")
    .in("id", orderIds)
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .in("payment_status", ["paid", "sandbox"]);

  if (ordersError) throw ordersError;

  const todayOrderIds = new Set((orders ?? []).map((row) => row.id as string));
  const todayItems = (items ?? []).filter((row) =>
    todayOrderIds.has(row.order_id as string),
  );
  const revenueKurus = todayItems.reduce(
    (sum, row) =>
      sum + (row.price_kurus as number) * ((row.quantity as number) ?? 1),
    0,
  );

  return {
    checkoutEnabled,
    inventory,
    today: {
      orderCount: todayOrderIds.size,
      revenueKurus,
    },
  };
}
