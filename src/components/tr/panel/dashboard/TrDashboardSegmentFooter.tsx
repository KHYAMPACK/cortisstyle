"use client";

import { motion } from "framer-motion";
import { CreditCard, Landmark, Tag, type LucideIcon } from "lucide-react";
import { TrDashboardDelta } from "@/components/tr/panel/dashboard/TrDashboardDelta";
import {
  formatCount,
  formatDecimal,
  type TrDashboardMetric,
} from "@/components/tr/panel/dashboard/dashboardFormat";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  computeDelta,
  type TrDashboardSegmentId,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const SEGMENTS: ReadonlyArray<{
  id: TrDashboardSegmentId;
  title: string;
  icon: LucideIcon;
}> = [
  { id: "card", title: "Kart ile ödeme", icon: CreditCard },
  { id: "manual", title: "Havale / manuel ödeme", icon: Landmark },
  { id: "discounted", title: "İndirimli siparişler", icon: Tag },
];

/**
 * The selected KPI split into the same fixed slices whatever it is: how the
 * customer paid, and orders that used a discount.
 */
export function TrDashboardSegmentFooter({
  dashboard,
  metric,
  compare,
}: {
  dashboard: TrOwnerDashboard;
  metric: TrDashboardMetric;
  compare: boolean;
}) {
  const { current, previous, offersCardPayments } = dashboard;
  const overall = metric.total(current);
  // Money metrics say how many orders are behind the number; counts say their share.
  const showsShare = !metric.money;
  const segments = SEGMENTS.filter(
    (segment) => segment.id !== "card" || offersCardPayments,
  );

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/70 p-3 sm:p-4">
      <motion.ul
        key={metric.id}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: trPanelEase }}
      >
        {segments.map((segment) => {
          const now = current.segments[segment.id];
          const before = previous.segments[segment.id];
          const value = metric.total(now);
          const Icon = segment.icon;

          let caption: string;
          if (showsShare) {
            caption =
              overall === 0
                ? "—"
                : `Toplam içindeki pay: %${formatDecimal((value / overall) * 100)}`;
          } else {
            caption = `${formatCount(now.orderCount)} sipariş`;
            if (segment.id === "discounted" && current.discountKurus > 0) {
              caption += ` · ${formatTryFromKurus(current.discountKurus)} indirim`;
            }
          }

          return (
            <li
              key={segment.id}
              className="rounded-lg border border-neutral-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(16,24,40,0.08)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-neutral-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="truncate text-[13px] font-medium">
                    {segment.title}
                  </h3>
                </div>
                {compare ? (
                  <TrDashboardDelta
                    delta={computeDelta(value, metric.total(before))}
                    invert={metric.invertDelta}
                  />
                ) : null}
              </div>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[1.2rem] font-semibold tracking-tight tabular-nums text-neutral-900">
                  {metric.format(value)}
                </span>
                {metric.unit ? (
                  <span className="text-[13px] text-neutral-500">
                    {metric.unit}
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[12.5px] text-neutral-500">{caption}</p>
            </li>
          );
        })}
      </motion.ul>
    </div>
  );
}
