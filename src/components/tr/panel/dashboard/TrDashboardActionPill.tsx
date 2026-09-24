"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, PackageX, Truck, X, type LucideIcon } from "lucide-react";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import type { TrOwnerDashboard } from "@/lib/tr/panel/dashboardMetrics";
import { trPanelOrdersPath, trPanelStockPath } from "@/lib/tr/paths";

interface PillAction {
  id: string;
  icon: LucideIcon;
  count: number;
  text: string;
  cta: string;
  href: string;
}

function buildActions(
  actions: TrOwnerDashboard["actions"],
  { trackStock }: { trackStock: boolean },
): PillAction[] {
  const list: PillAction[] = [];
  if (actions.pendingFulfillment > 0) {
    list.push({
      id: "ship",
      icon: Truck,
      count: actions.pendingFulfillment,
      text: "kargolanmayı bekleyen siparişin var",
      cta: actions.pendingFulfillment === 1 ? "Siparişi kargola" : "Siparişleri kargola",
      href: trPanelOrdersPath(),
    });
  }
  if (actions.awaitingPayment > 0) {
    list.push({
      id: "payment",
      icon: Clock,
      count: actions.awaitingPayment,
      text: "ödemesi onay bekleyen siparişin var",
      cta: "Siparişleri incele",
      href: trPanelOrdersPath(),
    });
  }
  if (trackStock && actions.lowStock > 0) {
    list.push({
      id: "stock",
      icon: PackageX,
      count: actions.lowStock,
      text: "ürünün stoğu azalıyor",
      cta: "Stokları gör",
      href: trPanelStockPath(),
    });
  }
  return list;
}

/**
 * Floating bar with what needs doing right now. Shows one item at a time; the
 * counter cycles when there are several, and it can be dismissed for this visit.
 */
export function TrDashboardActionPill({
  actions,
  trackStock,
}: {
  actions: TrOwnerDashboard["actions"];
  /** Print-on-demand boutiques hold no stock, so low-stock never applies. */
  trackStock: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  const list = buildActions(actions, { trackStock });
  if (dismissed || list.length === 0) return null;

  const action = list[index % list.length]!;
  const Icon = action.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--panel-tabbar-h,3.5rem)+0.75rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 lg:bottom-5 lg:left-[var(--panel-sidebar-w,232px)] lg:transition-[left] lg:duration-200 motion-reduce:lg:transition-none">
      <motion.div
        className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-neutral-900 py-1.5 pr-1.5 pl-3 text-white shadow-[0_10px_28px_rgba(16,24,40,0.3)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.4 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={action.id}
            className="flex min-w-0 items-center gap-2.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: trPanelEase }}
          >
            <Icon className="h-4 w-4 shrink-0 text-white/70" strokeWidth={1.75} aria-hidden />
            <p className="min-w-0 text-[13px] leading-snug">
              <span className="font-semibold tabular-nums">{action.count}</span>{" "}
              {action.text}
            </p>
            <Link
              href={action.href}
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap text-neutral-900 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {action.cta}
            </Link>
          </motion.div>
        </AnimatePresence>
        {list.length > 1 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % list.length)}
            aria-label="Sonraki uyarı"
            className="shrink-0 rounded-full px-2 py-1 text-[12px] font-medium tabular-nums text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            {(index % list.length) + 1}/{list.length}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Uyarıyı kapat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      </motion.div>
    </div>
  );
}
