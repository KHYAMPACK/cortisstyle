import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { listProductsByBoutiqueIdAdmin } from "@/lib/tr/products";

export type TrOwnerSummaryRange = "today" | "7d" | "30d" | "all";

export interface TrOwnerSummary {
  checkoutEnabled: boolean;
  inventory: {
    available: number;
    sold: number;
    hidden: number;
    total: number;
    lowStock: number;
  };
  /** Present when checkout is enabled. */
  period: {
    range: TrOwnerSummaryRange;
    orderCount: number;
    revenueKurus: number;
    pendingFulfillment: number;
    topProducts: Array<{ title: string; quantity: number; revenueKurus: number }>;
  } | null;
  /** Legacy alias for home when range=today. */
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

function rangeStartIso(range: TrOwnerSummaryRange, now = new Date()): string | null {
  if (range === "all") return null;
  if (range === "today") return istanbulDayBounds(now).startIso;
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getOwnerBoutiqueSummary(
  boutiqueId: string,
  range: TrOwnerSummaryRange = "today",
): Promise<TrOwnerSummary> {
  const products = await listProductsByBoutiqueIdAdmin(boutiqueId);
  const inventory = {
    available: products.filter((p) => p.status === "available").length,
    sold: products.filter((p) => p.status === "sold").length,
    hidden: products.filter((p) => p.status === "hidden").length,
    total: products.length,
    lowStock: products.filter(
      (p) => p.status === "available" && p.stock <= 2,
    ).length,
  };

  const checkoutEnabled = isTrCheckoutEnabled();
  if (!checkoutEnabled) {
    return { checkoutEnabled, inventory, period: null, today: null };
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const orders = await listOrdersByBoutiqueIdAdmin(boutiqueId);
  const startIso = rangeStartIso(range);
  const paid = orders.filter(
    (order) =>
      (order.paymentStatus === "paid" || order.paymentStatus === "sandbox") &&
      (startIso == null || order.createdAt >= startIso),
  );

  const topMap = new Map<
    string,
    { title: string; quantity: number; revenueKurus: number }
  >();
  let revenueKurus = 0;
  for (const order of paid) {
    for (const item of order.items) {
      if (item.boutiqueId !== boutiqueId) continue;
      const line = item.priceKurus * item.quantity;
      revenueKurus += line;
      const key = item.productId ?? `title:${item.title}`;
      const existing = topMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenueKurus += line;
      } else {
        topMap.set(key, {
          title: item.title,
          quantity: item.quantity,
          revenueKurus: line,
        });
      }
    }
  }

  const topProducts = [...topMap.values()]
    .sort((a, b) => b.revenueKurus - a.revenueKurus)
    .slice(0, 5);

  const pendingFulfillment = orders.filter(
    (order) =>
      (order.paymentStatus === "paid" || order.paymentStatus === "sandbox") &&
      (order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready"),
  ).length;

  const period = {
    range,
    orderCount: paid.length,
    revenueKurus,
    pendingFulfillment,
    topProducts,
  };

  const todayBounds = istanbulDayBounds();
  const todayPaid = orders.filter(
    (order) =>
      (order.paymentStatus === "paid" || order.paymentStatus === "sandbox") &&
      order.createdAt >= todayBounds.startIso &&
      order.createdAt <= todayBounds.endIso,
  );
  let todayRevenue = 0;
  for (const order of todayPaid) {
    for (const item of order.items) {
      if (item.boutiqueId === boutiqueId) {
        todayRevenue += item.priceKurus * item.quantity;
      }
    }
  }

  return {
    checkoutEnabled,
    inventory,
    period,
    today: {
      orderCount: todayPaid.length,
      revenueKurus: todayRevenue,
    },
  };
}
