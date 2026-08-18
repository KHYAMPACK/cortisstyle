import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { listOwnerProductInventoryAdmin } from "@/lib/tr/products";

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
  period: {
    range: TrOwnerSummaryRange;
    orderCount: number;
    revenueKurus: number;
    pendingFulfillment: number;
    topProducts: Array<{
      title: string;
      quantity: number;
      revenueKurus: number;
    }>;
  };
  today: {
    orderCount: number;
    revenueKurus: number;
  };
}

function istanbulDayBounds(now = new Date()): {
  startIso: string;
  endIso: string;
} {
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

function rangeStartIso(
  range: TrOwnerSummaryRange,
  now = new Date(),
): string | null {
  if (range === "all") return null;
  if (range === "today") return istanbulDayBounds(now).startIso;
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function isActiveOrder(order: {
  fulfillmentStatus: string;
  paymentStatus: string;
}): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (order.paymentStatus === "pending" || order.paymentStatus === "failed") {
    return false;
  }
  return (
    order.paymentStatus === "paid" || order.paymentStatus === "sandbox"
  );
}

function boutiqueLineRevenue(
  order: {
    items: Array<{
      boutiqueId: string;
      priceKurus: number;
      quantity: number;
      productId: string | null;
      title: string;
    }>;
    discountKurus: number;
    totalKurus: number;
  },
  boutiqueId: string,
): number {
  const lines = order.items.filter((item) => item.boutiqueId === boutiqueId);
  const subtotal = lines.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );
  if (subtotal <= 0) return 0;
  // Allocate order-level discount proportionally across this boutique's lines.
  const orderSubtotal = order.items.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );
  if (orderSubtotal <= 0) return subtotal;
  const share = subtotal / orderSubtotal;
  return Math.max(0, Math.round(subtotal - order.discountKurus * share));
}

export async function getOwnerBoutiqueSummary(
  boutiqueId: string,
  range: TrOwnerSummaryRange = "today",
): Promise<TrOwnerSummary> {
  const products = await listOwnerProductInventoryAdmin(boutiqueId);
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
  const orders = await listOrdersByBoutiqueIdAdmin(boutiqueId);
  const startIso = rangeStartIso(range);

  const scoped = orders.filter(
    (order) =>
      isActiveOrder(order) &&
      (startIso == null || order.createdAt >= startIso),
  );

  const topMap = new Map<
    string,
    { title: string; quantity: number; revenueKurus: number }
  >();
  let revenueKurus = 0;

  for (const order of scoped) {
    // Ciro: only captured card payments (not pending / sandbox).
    if (order.paymentStatus !== "paid") continue;

    const net = boutiqueLineRevenue(order, boutiqueId);
    revenueKurus += net;

    for (const item of order.items) {
      if (item.boutiqueId !== boutiqueId) continue;
      const line = item.priceKurus * item.quantity;
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
      isActiveOrder(order) &&
      (order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready"),
  ).length;

  const period = {
    range,
    orderCount: scoped.length,
    revenueKurus,
    pendingFulfillment,
    topProducts,
  };

  const todayBounds = istanbulDayBounds();
  const todayOrders = orders.filter(
    (order) =>
      isActiveOrder(order) &&
      order.createdAt >= todayBounds.startIso &&
      order.createdAt <= todayBounds.endIso,
  );
  let todayRevenue = 0;
  for (const order of todayOrders) {
    if (order.paymentStatus !== "paid") continue;
    todayRevenue += boutiqueLineRevenue(order, boutiqueId);
  }

  return {
    checkoutEnabled,
    inventory,
    period,
    today: {
      orderCount: todayOrders.length,
      revenueKurus: todayRevenue,
    },
  };
}
