"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import { TrOwnerCreditsUsageCard } from "@/components/tr/panel/TrOwnerCreditsInfo";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelEmptyClass,
  panelHintClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
  TrPanelMetricSkeleton,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  TrPanelRangeTabs,
  type TrPanelSummaryRange,
} from "@/components/tr/panel/TrPanelRangeTabs";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import {
  fetchOwnerSummary,
  peekOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import {
  trPanelBatchNewProductsPath,
  trPanelNewProductPath,
  trPanelOrderPath,
  trPanelOrdersPath,
  trPanelProductsPath,
  trPanelTakimNewProductPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function KpiCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[140px] flex-1 px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[12px] font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-[1.35rem] font-semibold tracking-tight tabular-nums text-neutral-900 sm:text-[1.5rem]">
        {value}
      </p>
    </div>
  );
}

function resolvePeriod(summary: TrOwnerSummaryResponse) {
  const orderCount = summary.period?.orderCount ?? summary.today?.orderCount ?? 0;
  const revenueKurus =
    summary.period?.revenueKurus ?? summary.today?.revenueKurus ?? 0;
  return {
    orderCount,
    revenueKurus,
    pendingFulfillment: summary.period?.pendingFulfillment ?? 0,
    topProducts: summary.period?.topProducts ?? [],
    lowStock: summary.inventory?.lowStock ?? 0,
    isEmpty: orderCount === 0 && revenueKurus === 0,
  };
}

function HomeDashboard({
  boutiqueId,
  boutiqueName,
  boutiqueSlug,
}: {
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
}) {
  const [range, setRange] = useState<TrPanelSummaryRange>("today");
  const cached = peekOwnerSummary(boutiqueId, range);
  const [summary, setSummary] = useState<TrOwnerSummaryResponse | null>(
    cached ?? null,
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const { recentOrders, loading: ordersLoading } = useOwnerOrderAlerts(
    boutiqueId,
    boutiqueSlug,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const result = await fetchOwnerSummary(boutiqueId, range);
        if (!cancelled) setSummary(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Özet yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, range]);

  const period = summary ? resolvePeriod(summary) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.25rem] font-semibold text-neutral-900">
            Genel özet
          </h1>
          <p className={`mt-0.5 ${panelHintClass}`}>{boutiqueName}</p>
        </div>
        <TrPanelRangeTabs value={range} onChange={setRange} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={trPanelOrdersPath()}
          className="rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          Siparişler
        </Link>
        <Link
          href={trPanelProductsPath()}
          className="rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          Ürünler
        </Link>
        <Link
          href={trPanelNewProductPath()}
          className="rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          + Yeni ürün
        </Link>
        <Link
          href={trPanelTakimNewProductPath()}
          className="rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          Takım yükle
        </Link>
        <Link
          href={trPanelBatchNewProductsPath()}
          className="rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          Toplu ekle
        </Link>
      </div>

      {loading && !summary ? (
        <TrPanelMetricSkeleton count={4} />
      ) : error && !summary ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {error}
        </p>
      ) : period ? (
        <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex divide-x divide-neutral-100 overflow-x-auto">
            <KpiCell
              label="Ciro"
              value={formatTryFromKurus(period.revenueKurus)}
            />
            <KpiCell label="Sipariş" value={String(period.orderCount)} />
            <KpiCell
              label="Bekleyen kargo"
              value={String(period.pendingFulfillment)}
            />
            <KpiCell
              label="Düşük stok"
              value={String(period.lowStock)}
            />
          </div>
          {period.isEmpty ? (
            <p className="border-t border-neutral-100 px-5 py-3 text-[13px] text-neutral-500">
              Bu dönemde henüz sipariş yok.
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={panelSectionClass}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Yeni siparişler
              </h2>
              <p className={`mt-0.5 ${panelHintClass}`}>Detay için dokunun.</p>
            </div>
            <Link
              href={trPanelOrdersPath()}
              className="text-[13px] font-medium text-[color:var(--panel-accent-deep)] hover:underline"
            >
              Tümü
            </Link>
          </div>
          {ordersLoading && recentOrders.length === 0 ? (
            <TrPanelListSkeleton rows={3} label="Siparişler yükleniyor" />
          ) : recentOrders.length === 0 ? (
            <p className={panelEmptyClass}>Henüz yeni sipariş yok.</p>
          ) : (
            <TrPanelStagger className="space-y-2">
              {recentOrders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                return (
                  <motion.div key={order.id} variants={trPanelStaggerItem}>
                    <Link
                      href={trPanelOrderPath(order.id)}
                      className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-[14px] font-semibold text-neutral-900">
                            {order.customerName}
                          </p>
                          <p className="text-[12px] text-neutral-500">
                            {formatOrderDateShort(order.createdAt)} · {itemCount}{" "}
                            ürün
                          </p>
                          <TrOrderItemThumbs
                            items={order.items}
                            size="sm"
                            max={3}
                          />
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
                          >
                            {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                          </span>
                        </div>
                        <p className="shrink-0 text-[14px] font-semibold tabular-nums text-neutral-950">
                          {formatTryFromKurus(order.totalKurus)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </TrPanelStagger>
          )}
        </section>

        <div className="space-y-4">
          <section className={panelSectionClass}>
            <h2 className="text-[14px] font-semibold text-neutral-900">
              En çok satanlar
            </h2>
            {!period || period.topProducts.length === 0 ? (
              <p className="text-[13px] text-neutral-500">
                Bu dönemde satış yok.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {period.topProducts.map((product) => (
                  <li
                    key={product.title}
                    className="flex items-center justify-between gap-3 py-3 text-[13px]"
                  >
                    <span className="min-w-0 truncate">
                      {product.title}
                      <span className="text-neutral-400">
                        {" "}
                        · {product.quantity} adet
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatTryFromKurus(product.revenueKurus)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <TrOwnerCreditsUsageCard boutiqueId={boutiqueId} />
        </div>
      </div>
    </div>
  );
}

export function TrOwnerHomePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <HomeDashboard
          boutiqueId={activeBoutique.id}
          boutiqueName={activeBoutique.name}
          boutiqueSlug={activeBoutique.slug}
        />
      )}
    </TrOwnerPanelGate>
  );
}
