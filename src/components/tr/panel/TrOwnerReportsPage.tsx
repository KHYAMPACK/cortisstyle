"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import { trPanelPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

type Range = "today" | "7d" | "30d" | "all";

const RANGE_LABEL: Record<Range, string> = {
  today: "Bugün",
  "7d": "7 gün",
  "30d": "30 gün",
  all: "Tümü",
};

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
  const [range, setRange] = useState<Range>("7d");
  const [summary, setSummary] = useState<TrOwnerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABEL) as Range[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={`rounded-full px-4 py-3 text-[15px] font-semibold ${
              range === key
                ? "text-white"
                : "bg-white text-neutral-700 ring-1 ring-[color:var(--panel-accent-border)]"
            }`}
            style={
              range === key
                ? { backgroundColor: "var(--panel-accent)" }
                : undefined
            }
          >
            {RANGE_LABEL[key]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <TrPanelLoading key="r-loading" label="Rapor hazırlanıyor…" />
        ) : error ? (
          <TrPanelFadeIn key="r-error">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
              {error}
            </p>
          </TrPanelFadeIn>
        ) : summary ? (
          <TrPanelFadeIn key="r-ready" className="space-y-6">
            {(() => {
              const period = resolvePeriod(summary);
              return (
                <>
                  {period.isEmpty ? (
                    <p className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-5 py-3 text-[15px] text-neutral-800">
                      Bu dönemde henüz sipariş yok — raporlar gerçek
                      satışlardan oluşur.
                    </p>
                  ) : null}
                  <TrPanelStagger className="grid gap-4 sm:grid-cols-3">
                    <motion.div
                      variants={trPanelStaggerItem}
                      className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-6 shadow-sm"
                    >
                      <p
                        className="text-[2.25rem] font-semibold tabular-nums"
                        style={{ color: "var(--panel-accent-deep)" }}
                      >
                        {formatTryFromKurus(period.revenueKurus)}
                      </p>
                      <p className="mt-2 text-[16px] text-neutral-600">Ciro</p>
                    </motion.div>
                    <motion.div
                      variants={trPanelStaggerItem}
                      className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-6 shadow-sm"
                    >
                      <p
                        className="text-[2.25rem] font-semibold tabular-nums"
                        style={{ color: "var(--panel-accent-deep)" }}
                      >
                        {period.orderCount}
                      </p>
                      <p className="mt-2 text-[16px] text-neutral-600">
                        Sipariş
                      </p>
                    </motion.div>
                    <motion.div
                      variants={trPanelStaggerItem}
                      className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-6 shadow-sm"
                    >
                      <p
                        className="text-[2.25rem] font-semibold tabular-nums"
                        style={{ color: "var(--panel-accent-deep)" }}
                      >
                        {period.pendingFulfillment}
                      </p>
                      <p className="mt-2 text-[16px] text-neutral-600">
                        Bekleyen kargo
                      </p>
                    </motion.div>
                  </TrPanelStagger>

                  <div className="overflow-hidden rounded-2xl border border-[color:var(--panel-accent-border)] bg-white shadow-sm">
                    <p className="border-b border-[color:var(--panel-accent-border)] px-5 py-4 text-[16px] font-semibold text-neutral-800">
                      En çok satanlar
                    </p>
                    <ul className="divide-y divide-[color:var(--panel-accent-border)]">
                      {period.topProducts.map((product) => (
                        <li
                          key={product.title}
                          className="flex items-center justify-between gap-3 px-5 py-4 text-[16px]"
                        >
                          <span>
                            {product.title}{" "}
                            <span className="text-neutral-500">
                              ×{product.quantity}
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatTryFromKurus(product.revenueKurus)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              );
            })()}
          </TrPanelFadeIn>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function TrOwnerReportsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[16px] font-medium"
              style={{ color: "var(--panel-accent)" }}
            >
              ← Ana sayfa
            </Link>
            <h2
              className="mt-2 text-[1.75rem] font-semibold tracking-tight"
              style={{ color: "var(--panel-accent-deep)" }}
            >
              Raporlar
            </h2>
            <p className="mt-1 text-[16px] text-neutral-600">
              Ciro, sipariş ve ürün performansı.
            </p>
          </div>
          <ReportsBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
