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
import { PANEL_DEMO_TODAY } from "@/lib/tr/panelTheme";
import {
  trBoutiquePath,
  trPanelCampaignsPath,
  trPanelCustomersPath,
  trPanelNewProductPath,
  trPanelOrdersPath,
  trPanelProductsPath,
  trPanelReportsPath,
  trPanelSettingsPath,
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
}: {
  value: string;
  label: string;
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
    </motion.div>
  );
}

function QuickTile({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint?: string;
}) {
  return (
    <motion.div variants={trPanelStaggerItem}>
      <Link
        href={href}
        className="flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-softer)]"
      >
        <div>
          <p className="text-[18px] font-semibold text-neutral-900">{label}</p>
          {hint ? (
            <p className="mt-1 text-[14px] text-neutral-600">{hint}</p>
          ) : null}
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white"
          style={{ backgroundColor: "var(--panel-accent)" }}
          aria-hidden
        >
          →
        </span>
      </Link>
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
    pendingFulfillment: useDemo
      ? PANEL_DEMO_TODAY.pendingFulfillment
      : (summary.period?.pendingFulfillment ?? 0),
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
                  <TrPanelStagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MetricCard
                      value={String(today.orderCount)}
                      label="Bugün alınan sipariş"
                    />
                    <MetricCard
                      value={formatTryFromKurus(today.revenueKurus)}
                      label="Bugünkü ciro"
                    />
                    <MetricCard
                      value={String(today.pendingFulfillment)}
                      label="Bekleyen kargo"
                    />
                  </TrPanelStagger>
                </>
              );
            })()}

            <TrPanelStagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                value={String(summary.inventory.available)}
                label="Satışta ürün"
              />
              <MetricCard
                value={String(summary.inventory.lowStock ?? 0)}
                label="Düşük stok"
              />
              <MetricCard
                value={String(summary.inventory.total)}
                label="Toplam ürün"
              />
            </TrPanelStagger>

            <section className="space-y-4">
              <p
                className="text-[18px] font-semibold"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                Hızlı erişim
              </p>
              <TrPanelStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QuickTile href={trPanelProductsPath()} label="Ürünler" />
                <QuickTile href={trPanelNewProductPath()} label="Yeni ürün" />
                <QuickTile href={trPanelStockPath()} label="Stok" />
                <QuickTile href={trPanelOrdersPath()} label="Siparişler" />
                <QuickTile href={trPanelCustomersPath()} label="Müşteriler" />
                <QuickTile href={trPanelCampaignsPath()} label="Kampanyalar" />
                <QuickTile href={trPanelReportsPath()} label="Raporlar" />
                <QuickTile href={trPanelSettingsPath()} label="Ayarlar" />
              </TrPanelStagger>
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
