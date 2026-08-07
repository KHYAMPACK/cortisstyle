"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import {
  buildDemoCargoLabelHtml,
  demoTrackingNumber,
} from "@/lib/tr/demoCargoLabel";
import {
  fetchOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import { PANEL_DEMO_TODAY } from "@/lib/tr/panelTheme";
import { printHtmlDocument } from "@/lib/tr/printDocument";
import {
  trBoutiquePath,
  trPanelOrderPath,
  trPanelOrdersPath,
} from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function MetricCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <motion.div
      variants={trPanelStaggerItem}
      className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-gradient-to-br from-[color:var(--panel-accent-soft)] to-white px-5 py-6 shadow-sm"
    >
      <p
        className="text-[2.5rem] leading-none font-semibold tracking-tight tabular-nums"
        style={{ color: "var(--panel-accent-deep)" }}
      >
        {value}
      </p>
      <p className="mt-3 text-[16px] leading-snug font-medium text-neutral-700">
        {label}
      </p>
      {hint ? <p className={`mt-2 ${panelHintClass}`}>{hint}</p> : null}
    </motion.div>
  );
}

function resolveTodayMetrics(summary: TrOwnerSummaryResponse) {
  const liveOrders = summary.today?.orderCount ?? 0;
  const liveRevenue = summary.today?.revenueKurus ?? 0;
  const useDemo = liveOrders === 0 && liveRevenue === 0;

  return {
    useDemo,
    orderCount: useDemo ? PANEL_DEMO_TODAY.orderCount : liveOrders,
    revenueKurus: useDemo ? PANEL_DEMO_TODAY.revenueKurus : liveRevenue,
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
  const [summary, setSummary] = useState<TrOwnerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const {
    recentOrders,
    loading: ordersLoading,
  } = useOwnerOrderAlerts(boutiqueId);

  const printLabel = (order: TrOrderWithItems) => {
    setPrintError(null);
    try {
      printHtmlDocument(
        buildDemoCargoLabelHtml({ order, boutiqueName }),
        `Kargo etiketi · ${demoTrackingNumber(order.id)}`,
      );
    } catch (printErr) {
      setPrintError(
        printErr instanceof Error
          ? printErr.message
          : "Etiket yazdırılamadı.",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerSummary(boutiqueId);
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
  }, [boutiqueId]);

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );

  return (
    <div className="space-y-8">
      <TrPanelFadeIn>
        <section className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-6 shadow-sm sm:px-6">
          <h2
            className="text-[2rem] font-semibold tracking-tight sm:text-[2.35rem]"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            {greetingForHour(hour)}
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed text-neutral-700">
            {boutiqueName} · {todayLabel()}
          </p>
          <p className="mt-1 text-[15px] text-neutral-500">Günlük özet</p>
          <Link
            href={trBoutiquePath(boutiqueSlug)}
            className="mt-4 inline-flex min-h-12 items-center rounded-xl px-5 py-3 text-[16px] font-semibold text-white"
            style={{ backgroundColor: "var(--panel-accent)" }}
          >
            Mağazayı görüntüle
          </Link>
        </section>
      </TrPanelFadeIn>

      <AnimatePresence mode="wait">
        {loading ? (
          <TrPanelLoading key="summary-loading" label="Özet yükleniyor…" />
        ) : error ? (
          <TrPanelFadeIn key="summary-error">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
              {error}
            </p>
          </TrPanelFadeIn>
        ) : summary ? (
          <TrPanelFadeIn key="summary-ready" className="space-y-8">
            {(() => {
              const today = resolveTodayMetrics(summary);
              return (
                <>
                  {today.useDemo ? (
                    <p className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-5 py-3 text-[15px] text-neutral-800">
                      Aşağıdaki ciro örnek demo verisidir — gerçek siparişler
                      gelince burası otomatik güncellenir.
                    </p>
                  ) : null}
                  <TrPanelStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MetricCard
                      value={formatTryFromKurus(today.revenueKurus)}
                      label="Günlük ciro"
                      hint="Bugün satılan ürünlerin toplamı"
                    />
                    <MetricCard
                      value={String(today.orderCount)}
                      label="Yeni sipariş"
                      hint="Bugün gelen sipariş sayısı"
                    />
                  </TrPanelStagger>
                </>
              );
            })()}

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p
                    className="text-[18px] font-semibold"
                    style={{ color: "var(--panel-accent-deep)" }}
                  >
                    Yeni siparişler
                  </p>
                  <p className={`mt-1 ${panelHintClass}`}>
                    Son gelen siparişler — detay için dokunun.
                  </p>
                </div>
                <Link
                  href={trPanelOrdersPath()}
                  className="text-[16px] font-semibold text-[color:var(--panel-accent-deep)]"
                >
                  Tümünü gör →
                </Link>
              </div>

              {printError ? (
                <p className={panelErrorClass}>{printError}</p>
              ) : null}

              {ordersLoading ? (
                <TrPanelLoading label="Siparişler yükleniyor…" />
              ) : recentOrders.length === 0 ? (
                <p className={panelEmptyClass}>
                  Henüz yeni sipariş yok. Müşteri alışveriş yapınca burada
                  görünür.
                </p>
              ) : (
                <TrPanelStagger className="space-y-3">
                  {recentOrders.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const canPrint = order.fulfillmentStatus !== "cancelled";
                    return (
                      <motion.div
                        key={order.id}
                        variants={trPanelStaggerItem}
                      >
                        <div className={`${panelSectionClass}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="text-[18px] font-semibold text-neutral-900">
                                {order.customerName}
                              </p>
                              <p className="text-[15px] text-neutral-600">
                                {formatOrderDateShort(order.createdAt)} ·{" "}
                                {itemCount} ürün
                              </p>
                              <TrOrderItemThumbs
                                items={order.items}
                                size="sm"
                                max={3}
                              />
                              <span
                                className={`inline-block rounded-lg px-2.5 py-1 text-[14px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
                              >
                                {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                              </span>
                              <Link
                                href={trPanelOrderPath(order.id)}
                                className="inline-block text-[15px] font-medium text-[color:var(--panel-accent-deep)]"
                              >
                                Detayı aç →
                              </Link>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-4 self-stretch">
                              <p className="text-[20px] font-semibold tabular-nums text-neutral-950">
                                {formatTryFromKurus(order.totalKurus)}
                              </p>
                              <button
                                type="button"
                                disabled={!canPrint}
                                onClick={() => printLabel(order)}
                                className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-[15px] font-semibold text-white disabled:opacity-50"
                                style={{
                                  backgroundColor: "var(--panel-accent)",
                                }}
                              >
                                Yazdır
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </TrPanelStagger>
              )}
            </section>
          </TrPanelFadeIn>
        ) : null}
      </AnimatePresence>
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
