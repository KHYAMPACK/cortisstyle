"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerRevenueAreaChart } from "@/components/tr/panel/TrOwnerRevenueAreaChart";
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
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import {
  fetchOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import {
  trBoutiquePath,
  trPanelOrderPath,
  trPanelOrdersPath,
  trPanelProductsPath,
  trPanelReportsPath,
  trPanelStockPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

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
  compact,
}: {
  value: string;
  label: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <motion.div
      variants={trPanelStaggerItem}
      className={`rounded-2xl border border-[color:var(--panel-accent-border)] bg-gradient-to-br from-[color:var(--panel-accent-soft)] to-white shadow-sm ${
        compact ? "rounded-xl px-4 py-4" : "px-5 py-6"
      }`}
    >
      <p
        className={`leading-none font-semibold tracking-tight tabular-nums ${
          compact ? "text-[1.65rem]" : "text-[2.5rem]"
        }`}
        style={{ color: "var(--panel-accent-deep)" }}
      >
        {value}
      </p>
      <p
        className={`mt-2 leading-snug font-medium text-neutral-700 ${
          compact ? "text-[13px]" : "mt-3 text-[16px]"
        }`}
      >
        {label}
      </p>
      {hint ? (
        <p className={`mt-1 ${compact ? "text-[12px] text-neutral-500" : panelHintClass}`}>
          {hint}
        </p>
      ) : null}
    </motion.div>
  );
}

function HorizontalBars({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; value: number; display: string }>;
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-[13px] text-neutral-500">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-neutral-800">
              {item.label}
            </span>
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-neutral-600">
              {item.display}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--panel-accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InventoryBars({
  available,
  sold,
  hidden,
}: {
  available: number;
  sold: number;
  hidden: number;
}) {
  const total = Math.max(available + sold + hidden, 1);
  const segments = [
    { key: "available", label: "Satışta", value: available, color: "var(--panel-accent)" },
    { key: "sold", label: "Satıldı", value: sold, color: "#737373" },
    { key: "hidden", label: "Gizli", value: hidden, color: "#d4d4d4" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <motion.div
              key={segment.key}
              className="h-full"
              style={{ backgroundColor: segment.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(segment.value / total) * 100}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null,
        )}
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {segments.map((segment) => (
          <li key={segment.key} className="rounded-lg bg-neutral-50 px-2 py-2 text-center">
            <p className="text-[18px] font-semibold tabular-nums text-neutral-900">
              {segment.value}
            </p>
            <p className="text-[11px] text-neutral-500">{segment.label}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function resolveTodayMetrics(summary: TrOwnerSummaryResponse) {
  const liveOrders = summary.today?.orderCount ?? 0;
  const liveRevenue = summary.today?.revenueKurus ?? 0;

  return {
    orderCount: liveOrders,
    revenueKurus: liveRevenue,
    isEmpty: liveOrders === 0 && liveRevenue === 0,
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
  const [summary7d, setSummary7d] = useState<TrOwnerSummaryResponse | null>(
    null,
  );
  const [summary30d, setSummary30d] = useState<TrOwnerSummaryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ciroView, setCiroView] = useState<"numbers" | "chart">("numbers");
  const { recentOrders, loading: ordersLoading } =
    useOwnerOrderAlerts(boutiqueId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [week, month] = await Promise.all([
          fetchOwnerSummary(boutiqueId, "7d"),
          fetchOwnerSummary(boutiqueId, "30d"),
        ]);
        if (!cancelled) {
          setSummary7d(week);
          setSummary30d(month);
        }
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

  const desktopMoney = useMemo(() => {
    if (!summary7d || !summary30d) return null;
    const today = resolveTodayMetrics(summary7d);
    const weekOrders = summary7d.period?.orderCount ?? 0;
    const weekRevenue = summary7d.period?.revenueKurus ?? 0;
    const monthOrders = summary30d.period?.orderCount ?? 0;
    const monthRevenue = summary30d.period?.revenueKurus ?? 0;
    const aov7d =
      weekOrders > 0 ? Math.round(weekRevenue / weekOrders) : 0;
    const pending = summary7d.period?.pendingFulfillment ?? 0;
    const inventory = summary7d.inventory;
    const topProducts = (summary7d.period?.topProducts ?? []).map((p) => ({
      label: p.title,
      value: p.revenueKurus,
      display: formatTryFromKurus(p.revenueKurus),
    }));
    return {
      today,
      weekOrders,
      weekRevenue,
      monthOrders,
      monthRevenue,
      aov7d,
      pending,
      inventory,
      topProducts,
    };
  }, [summary7d, summary30d]);

  return (
    <div className="space-y-8">
      <TrPanelFadeIn>
        <section className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-6 shadow-sm sm:px-6 lg:rounded-xl lg:px-6 lg:py-5">
          <h2
            className="text-[2rem] font-semibold tracking-tight sm:text-[2.35rem] lg:text-[1.75rem]"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            {greetingForHour(hour)}
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed text-neutral-700 lg:text-[14px]">
            {boutiqueName} · {todayLabel()}
          </p>
          <p className="mt-1 text-[15px] text-neutral-500 lg:text-[13px]">
            Günlük özet
          </p>
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-3">
            <Link
              href={trBoutiquePath(boutiqueSlug)}
              className="inline-flex min-h-12 items-center rounded-xl px-5 py-3 text-[16px] font-semibold text-white lg:min-h-9 lg:rounded-lg lg:px-4 lg:py-2 lg:text-[13px]"
              style={{ backgroundColor: "var(--panel-accent)" }}
            >
              Mağazayı görüntüle
            </Link>
            <Link
              href={trPanelReportsPath()}
              className="hidden min-h-9 items-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-4 py-2 text-[13px] font-semibold text-neutral-800 lg:inline-flex"
            >
              Raporlar
            </Link>
          </div>
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
        ) : summary7d ? (
          <TrPanelFadeIn key="summary-ready" className="space-y-8">
            {/* Mobile: keep existing compact metrics + new orders */}
            <div className="space-y-8 lg:hidden">
              {(() => {
                const today = resolveTodayMetrics(summary7d);
                return (
                  <>
                    {today.isEmpty ? (
                      <p className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-5 py-3 text-[15px] text-neutral-800">
                        Bugün henüz sipariş yok — sayılar gerçek veriden gelir.
                      </p>
                    ) : null}
                    <TrPanelStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <MetricCard
                        value={formatTryFromKurus(today.revenueKurus)}
                        label="Günlük ciro"
                        hint="Tahsil edilen (ödendi) ciro"
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
                              <p className="shrink-0 text-[20px] font-semibold tabular-nums text-neutral-950">
                                {formatTryFromKurus(order.totalKurus)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </TrPanelStagger>
                )}
              </section>
            </div>

            {/* Desktop: money dashboard + graphs, no new-orders feed */}
            {desktopMoney ? (
              <div className="hidden space-y-6 lg:block">
                {desktopMoney.today.isEmpty ? (
                  <p className="rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-4 py-2.5 text-[13px] text-neutral-800">
                    Bugün henüz ödenen sipariş yok — rakamlar canlı veriden
                    gelir.
                  </p>
                ) : null}

                <section className="space-y-3 rounded-xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-[15px] font-semibold"
                        style={{ color: "var(--panel-accent-deep)" }}
                      >
                        Ciro
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        Tahsil edilen (ödendi) satışlar
                      </p>
                    </div>
                    <div className="flex rounded-lg bg-neutral-100 p-1">
                      <button
                        type="button"
                        onClick={() => setCiroView("numbers")}
                        className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                          ciroView === "numbers"
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                      >
                        Sayılar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCiroView("chart")}
                        className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                          ciroView === "chart"
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                      >
                        Grafik
                      </button>
                    </div>
                  </div>

                  {ciroView === "numbers" ? (
                    <TrPanelStagger className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                      <MetricCard
                        compact
                        value={formatTryFromKurus(
                          desktopMoney.today.revenueKurus,
                        )}
                        label="Bugün ciro"
                        hint={`${desktopMoney.today.orderCount} sipariş`}
                      />
                      <MetricCard
                        compact
                        value={formatTryFromKurus(desktopMoney.weekRevenue)}
                        label="7 gün ciro"
                        hint={`${desktopMoney.weekOrders} sipariş`}
                      />
                      <MetricCard
                        compact
                        value={formatTryFromKurus(desktopMoney.monthRevenue)}
                        label="30 gün ciro"
                        hint={`${desktopMoney.monthOrders} sipariş`}
                      />
                      <MetricCard
                        compact
                        value={
                          desktopMoney.aov7d > 0
                            ? formatTryFromKurus(desktopMoney.aov7d)
                            : "—"
                        }
                        label="Ort. sepet (7g)"
                        hint="Ödenen sipariş ortalaması"
                      />
                    </TrPanelStagger>
                  ) : (
                    <TrOwnerRevenueAreaChart
                      series={summary7d.revenueSeries ?? []}
                    />
                  )}
                </section>

                <TrPanelStagger className="grid grid-cols-3 gap-3">
                  <MetricCard
                    compact
                    value={String(desktopMoney.pending)}
                    label="Bekleyen kargo"
                    hint="Hazırlanacak / kargoya hazır"
                  />
                  <MetricCard
                    compact
                    value={String(desktopMoney.inventory.available)}
                    label="Satıştaki ürün"
                    hint={`${desktopMoney.inventory.lowStock ?? 0} düşük stok`}
                  />
                  <MetricCard
                    compact
                    value={String(desktopMoney.inventory.total)}
                    label="Toplam katalog"
                    hint={`${desktopMoney.inventory.hidden} gizli · ${desktopMoney.inventory.sold} satıldı`}
                  />
                </TrPanelStagger>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <section className="rounded-xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div>
                        <p
                          className="text-[15px] font-semibold"
                          style={{ color: "var(--panel-accent-deep)" }}
                        >
                          En çok satanlar (7 gün)
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          Tahsil edilen ciroya göre
                        </p>
                      </div>
                      <Link
                        href={trPanelReportsPath()}
                        className="text-[12px] font-semibold text-[color:var(--panel-accent-deep)]"
                      >
                        Detay →
                      </Link>
                    </div>
                    <HorizontalBars
                      items={desktopMoney.topProducts}
                      emptyLabel="Bu dönemde satış yok."
                    />
                  </section>

                  <section className="rounded-xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div>
                        <p
                          className="text-[15px] font-semibold"
                          style={{ color: "var(--panel-accent-deep)" }}
                        >
                          Katalog dağılımı
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          Ürün durumları
                        </p>
                      </div>
                      <Link
                        href={trPanelProductsPath()}
                        className="text-[12px] font-semibold text-[color:var(--panel-accent-deep)]"
                      >
                        Ürünler →
                      </Link>
                    </div>
                    <InventoryBars
                      available={desktopMoney.inventory.available}
                      sold={desktopMoney.inventory.sold}
                      hidden={desktopMoney.inventory.hidden}
                    />
                    {(desktopMoney.inventory.lowStock ?? 0) > 0 ? (
                      <Link
                        href={trPanelStockPath()}
                        className="mt-4 inline-flex text-[12px] font-semibold text-amber-800 hover:underline"
                      >
                        {desktopMoney.inventory.lowStock} düşük stok — Stok
                        sayfasına git →
                      </Link>
                    ) : null}
                  </section>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={trPanelOrdersPath()}
                    className="inline-flex h-9 items-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-4 text-[13px] font-semibold text-neutral-800"
                  >
                    Siparişler
                  </Link>
                  <Link
                    href={trPanelStockPath()}
                    className="inline-flex h-9 items-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-4 text-[13px] font-semibold text-neutral-800"
                  >
                    Stok
                  </Link>
                  <Link
                    href={trPanelProductsPath()}
                    className="inline-flex h-9 items-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-4 text-[13px] font-semibold text-neutral-800"
                  >
                    Ürünler
                  </Link>
                </div>
              </div>
            ) : null}
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
