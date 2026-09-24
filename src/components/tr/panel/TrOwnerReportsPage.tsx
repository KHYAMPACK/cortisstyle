"use client";

import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelHintClass,
  panelPageTitleClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelMetricSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import {
  TrPanelRangeTabs,
  type TrPanelSummaryRange,
} from "@/components/tr/panel/TrPanelRangeTabs";
import {
  fetchOwnerSummary,
  peekOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import { trPanelPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function resolvePeriod(summary: TrOwnerSummaryResponse) {
  const liveOrders = summary.period?.orderCount ?? summary.today?.orderCount ?? 0;
  const liveRevenue =
    summary.period?.revenueKurus ?? summary.today?.revenueKurus ?? 0;

  return {
    isEmpty: liveOrders === 0 && liveRevenue === 0,
    orderCount: liveOrders,
    revenueKurus: liveRevenue,
    pendingFulfillment: summary.period?.pendingFulfillment ?? 0,
    topProducts: summary.period?.topProducts ?? [],
  };
}

function ReportsBoard({ boutiqueId }: { boutiqueId: string }) {
  const [range, setRange] = useState<TrPanelSummaryRange>("7d");
  const cached = peekOwnerSummary(boutiqueId, "7d");
  const [summary, setSummary] = useState<TrOwnerSummaryResponse | null>(
    cached ?? null,
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

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
              : "Rapor yüklenemedi.",
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
      <TrPanelRangeTabs value={range} onChange={setRange} />

      {loading && !summary ? (
        <TrPanelMetricSkeleton count={3} />
      ) : error && !summary ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {error}
        </p>
      ) : period ? (
        <TrPanelFadeIn className="space-y-4">
          {period.isEmpty ? (
            <p className="rounded-xl bg-white px-4 py-3 text-[13px] text-neutral-500 ring-1 ring-neutral-200/80">
              Bu dönemde henüz sipariş yok.
            </p>
          ) : null}
          <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex divide-x divide-neutral-100 overflow-x-auto">
              <div className="min-w-[140px] flex-1 px-5 py-4">
                <p className="text-[12px] font-medium text-neutral-500">Ciro</p>
                <p className="mt-1 text-[1.5rem] font-semibold tabular-nums text-neutral-900">
                  {formatTryFromKurus(period.revenueKurus)}
                </p>
              </div>
              <div className="min-w-[140px] flex-1 px-5 py-4">
                <p className="text-[12px] font-medium text-neutral-500">
                  Sipariş
                </p>
                <p className="mt-1 text-[1.5rem] font-semibold tabular-nums text-neutral-900">
                  {period.orderCount}
                </p>
              </div>
              <div className="min-w-[140px] flex-1 px-5 py-4">
                <p className="text-[12px] font-medium text-neutral-500">
                  Bekleyen kargo
                </p>
                <p className="mt-1 text-[1.5rem] font-semibold tabular-nums text-neutral-900">
                  {period.pendingFulfillment}
                </p>
              </div>
            </div>
          </section>

          <section className={panelSectionClass}>
            <h3 className="text-[14px] font-semibold text-neutral-900">
              En çok satanlar
            </h3>
            {period.topProducts.length === 0 ? (
              <p className="text-[13px] text-neutral-500">Satış yok.</p>
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
        </TrPanelFadeIn>
      ) : null}
    </div>
  );
}

export function TrOwnerReportsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>Raporlar</h2>
            <p className={`mt-1 ${panelHintClass}`}>
              Ciro, sipariş ve ürün performansı.
            </p>
          </div>
          <ReportsBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
