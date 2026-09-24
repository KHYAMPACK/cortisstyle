"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CreditCard, Landmark, Tag, type LucideIcon } from "lucide-react";
import {
  TrDashboardDelta,
  TrDashboardRateDelta,
} from "@/components/tr/panel/dashboard/TrDashboardDelta";
import {
  formatCount,
  formatDecimal,
  formatRate,
} from "@/components/tr/panel/dashboard/dashboardFormat";
import { panelCardClass } from "@/components/tr/panel/panelUi";
import {
  TrPanelStagger,
  trPanelEase,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  computeDelta,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function ShareBar({ share }: { share: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-neutral-100"
      role="presentation"
    >
      <motion.div
        className="h-full rounded-full bg-[color:var(--panel-accent)]"
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${Math.round(share * 100)}%` }}
        transition={{ duration: 0.6, ease: trPanelEase }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  caption,
  delta,
  share,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  caption: string;
  delta: React.ReactNode;
  /** 0–1 share of sales; omitted for cards that aren't part of the total. */
  share?: number;
}) {
  return (
    <motion.div
      variants={trPanelStaggerItem}
      className={`${panelCardClass} space-y-3 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(16,24,40,0.08)]`}
    >
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        <h3 className="text-[13px] font-medium">{title}</h3>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[1.35rem] font-semibold tracking-tight tabular-nums text-neutral-900">
          {value}
        </p>
        <div className="pb-1">{delta}</div>
      </div>
      {share !== undefined ? <ShareBar share={share} /> : null}
      <p className="text-[12.5px] text-neutral-500">{caption}</p>
    </motion.div>
  );
}

/** Sales split by how the customer paid, plus how much was discounted. */
export function TrDashboardBreakdown({
  dashboard,
  compare,
}: {
  dashboard: TrOwnerDashboard;
  compare: boolean;
}) {
  const { current, previous, offersCardPayments } = dashboard;
  const paidTotal = current.cardRevenueKurus + current.manualRevenueKurus;
  const shareOf = (kurus: number) => (paidTotal === 0 ? 0 : kurus / paidTotal);

  return (
    <TrPanelStagger className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
      {offersCardPayments ? (
        <StatCard
          icon={CreditCard}
          title="Kart ile ödeme"
          value={formatTryFromKurus(current.cardRevenueKurus)}
          caption={`${formatCount(current.cardOrderCount)} sipariş`}
          share={shareOf(current.cardRevenueKurus)}
          delta={
            compare ? (
              <TrDashboardDelta
                delta={computeDelta(
                  current.cardRevenueKurus,
                  previous.cardRevenueKurus,
                )}
              />
            ) : null
          }
        />
      ) : null}
      <StatCard
        icon={Landmark}
        title="Havale / manuel ödeme"
        value={formatTryFromKurus(current.manualRevenueKurus)}
        caption={`${formatCount(current.manualOrderCount)} sipariş`}
        share={shareOf(current.manualRevenueKurus)}
        delta={
          compare ? (
            <TrDashboardDelta
              delta={computeDelta(
                current.manualRevenueKurus,
                previous.manualRevenueKurus,
              )}
            />
          ) : null
        }
      />
      <StatCard
        icon={Tag}
        title="İndirimli siparişler"
        value={formatCount(current.discountedOrderCount)}
        caption={`${formatTryFromKurus(current.discountKurus)} indirim verildi`}
        delta={
          compare ? (
            <TrDashboardDelta
              neutral
              delta={computeDelta(
                current.discountedOrderCount,
                previous.discountedOrderCount,
              )}
            />
          ) : null
        }
      />
    </TrPanelStagger>
  );
}

function GrowthRow({
  label,
  hint,
  value,
  delta,
}: {
  label: string;
  hint: string;
  value: string;
  delta: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-neutral-900">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-neutral-500">{hint}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[1.05rem] font-semibold tabular-nums text-neutral-900">
          {value}
        </p>
        {delta}
      </div>
    </li>
  );
}

/** How well the store converts, retains and grows its baskets. */
export function TrDashboardGrowth({
  dashboard,
  compare,
}: {
  dashboard: TrOwnerDashboard;
  compare: boolean;
}) {
  const { current, previous, offersCardPayments } = dashboard;

  return (
    <section className={panelCardClass}>
      <h2 className="text-[14px] font-semibold text-neutral-900">
        Büyüme Metrikleri
      </h2>
      <ul className="mt-2 divide-y divide-neutral-100">
        {offersCardPayments ? (
          <GrowthRow
            label="Ödeme Tamamlama Oranı"
            hint={
              current.paymentAttempts === 0
                ? "Bu dönemde kart ödemesi denenmedi"
                : `${formatCount(current.paymentAttempts)} ödeme denemesi üzerinden`
            }
            value={formatRate(current.paymentCompletionRate)}
            delta={
              compare ? (
                <TrDashboardRateDelta
                  current={current.paymentCompletionRate}
                  previous={previous.paymentCompletionRate}
                />
              ) : null
            }
          />
        ) : null}
        <GrowthRow
          label="Tekrar Alışveriş Oranı"
          hint={
            current.customerCount === 0
              ? "Bu dönemde müşteri yok"
              : `${formatCount(current.customerCount)} müşteri üzerinden`
          }
          value={formatRate(current.repeatRate)}
          delta={
            compare ? (
              <TrDashboardRateDelta
                current={current.repeatRate}
                previous={previous.repeatRate}
              />
            ) : null
          }
        />
        <GrowthRow
          label="Ort. Sepet Büyüklüğü"
          hint="Siparişteki ortalama ürün adedi"
          value={
            current.orderCount === 0
              ? "—"
              : `${formatDecimal(current.itemsPerOrder)} ürün`
          }
          delta={
            compare ? (
              <TrDashboardDelta
                delta={computeDelta(current.itemsPerOrder, previous.itemsPerOrder)}
              />
            ) : null
          }
        />
        <GrowthRow
          label="Ort. Ürün Fiyatı"
          hint="Satılan bir ürünün ortalama fiyatı"
          value={
            current.itemCount === 0
              ? "—"
              : formatTryFromKurus(current.averageItemPriceKurus)
          }
          delta={
            compare ? (
              <TrDashboardDelta
                delta={computeDelta(
                  current.averageItemPriceKurus,
                  previous.averageItemPriceKurus,
                )}
              />
            ) : null
          }
        />
      </ul>
    </section>
  );
}
