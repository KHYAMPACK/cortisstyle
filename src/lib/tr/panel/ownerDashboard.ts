import { listOrdersByBoutiqueIdAdmin } from "@/lib/tr/orders";
import { listOwnerProductsLiteAdmin } from "@/lib/tr/products";
import {
  computeOwnerDashboard,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";
import type { TrDashboardWindow } from "@/lib/tr/panel/dashboardRange";

/**
 * Loads one boutique's orders and products and computes the dashboard.
 *
 * All orders are loaded and aggregated in memory. That is fine for the order
 * volumes a boutique has today (dozens to a few thousand rows, cached client-side
 * for 20 s). If a boutique ever reaches tens of thousands of orders, replace this
 * with SQL aggregation — `computeOwnerDashboard` is pure, so the UI won't change.
 */
export async function getOwnerDashboard(input: {
  boutiqueId: string;
  window: TrDashboardWindow;
  offersCardPayments: boolean;
}): Promise<TrOwnerDashboard> {
  const [orders, products] = await Promise.all([
    listOrdersByBoutiqueIdAdmin(input.boutiqueId),
    listOwnerProductsLiteAdmin(input.boutiqueId),
  ]);

  return computeOwnerDashboard({
    boutiqueId: input.boutiqueId,
    orders,
    products,
    window: input.window,
    offersCardPayments: input.offersCardPayments,
    nowMs: Date.now(),
  });
}
