"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  fetchOwnerSummary,
  type TrOwnerSummaryResponse,
} from "@/lib/tr/ownerClient";
import {
  trBoutiquePath,
  trPanelCustomersPath,
  trPanelDiscountsPath,
  trPanelNewProductPath,
  trPanelOrdersPath,
  trPanelProductsPath,
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
    <div className="border border-black/10 bg-white px-4 py-5">
      <p className="font-serif text-3xl tracking-tight text-neutral-950">{value}</p>
      <p className="mt-2 text-[11px] leading-snug text-neutral-500">{label}</p>
    </div>
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
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border border-black/10 bg-white px-4 py-4 transition-colors hover:border-black/25"
    >
      <div>
        <p className="text-[13px] font-medium text-neutral-900">{label}</p>
        {hint ? (
          <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>
        ) : null}
      </div>
      <span className="text-neutral-400" aria-hidden>
        →
      </span>
    </Link>
  );
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
      <section>
        <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
          {greetingForHour(hour)}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-600">
          {boutiqueName} · {todayLabel()} · günlük özet
        </p>
        <Link
          href={trBoutiquePath(boutiqueSlug)}
          className="mt-2 inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase underline underline-offset-2"
        >
          Mağazayı görüntüle
        </Link>
      </section>

      {loading ? (
        <p className="text-[13px] text-neutral-600">Özet yükleniyor…</p>
      ) : null}
      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </p>
      ) : null}

      {summary ? (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summary.checkoutEnabled && summary.today ? (
            <>
              <MetricCard
                value={String(summary.today.orderCount)}
                label="sipariş alındı (bugün)"
              />
              <MetricCard
                value={formatTryFromKurus(summary.today.revenueKurus)}
                label="bugünkü toplam tutar"
              />
              <MetricCard
                value={String(summary.inventory.available)}
                label="satışta ürün"
              />
            </>
          ) : (
            <>
              <MetricCard
                value={String(summary.inventory.available)}
                label="satışta ürün"
              />
              <MetricCard
                value={String(summary.inventory.sold)}
                label="satıldı"
              />
              <MetricCard
                value={String(summary.inventory.hidden)}
                label="gizli"
              />
            </>
          )}
        </section>
      ) : null}

      {summary && !summary.checkoutEnabled ? (
        <p className="border border-black/10 bg-neutral-50 px-4 py-3 text-[12px] text-neutral-600">
          Online ödeme kapalı — siparişler WhatsApp üzerinden. Ciro özeti ödeme
          açılınca burada görünür.
        </p>
      ) : null}

      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">
          Hızlı erişim
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <QuickTile href={trPanelProductsPath()} label="Ürünler" />
          <QuickTile href={trPanelNewProductPath()} label="Yeni ürün" />
          <QuickTile
            href={trPanelOrdersPath()}
            label="Siparişler"
            hint={
              summary?.checkoutEnabled === false
                ? "WhatsApp sipariş"
                : "Yakında"
            }
          />
          <QuickTile href={trPanelSettingsPath()} label="Ayarlar" />
          <QuickTile
            href={trPanelCustomersPath()}
            label="Müşteriler"
            hint="Yakında"
          />
          <QuickTile
            href={trPanelDiscountsPath()}
            label="İndirim"
            hint="Yakında"
          />
          <QuickTile href={trPanelStockPath()} label="Stok" hint="Yakında" />
        </div>
      </section>
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
