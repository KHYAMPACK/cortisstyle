"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import { TrOwnerOrderProcessGuide } from "@/components/tr/panel/TrOwnerOrderProcessGuide";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  FULFILLMENT_FILTERS,
  FULFILLMENT_HINT,
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  PAYMENT_LABEL,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { fetchOwnerOrders } from "@/lib/tr/ownerClient";
import { markOrdersSeen } from "@/lib/tr/orderNotifications";
import { trPanelOrderPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrFulfillmentStatus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

function OrdersList({ boutiqueId }: { boutiqueId: string }) {
  const [orders, setOrders] = useState<TrOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TrFulfillmentStatus>("all");

  useEffect(() => {
    markOrdersSeen(boutiqueId);
  }, [boutiqueId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerOrders(boutiqueId);
        if (!cancelled) setOrders(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Siparişler yüklenemedi.",
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

  const visible = useMemo(
    () =>
      filter === "all"
        ? orders
        : orders.filter((order) => order.fulfillmentStatus === filter),
    [filter, orders],
  );

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus === "created" || o.fulfillmentStatus === "ready",
      ).length,
    [orders],
  );

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="orders-loading" label="Siparişler yükleniyor…" />
      ) : error ? (
        <TrPanelFadeIn key="orders-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="orders-ready" className="space-y-5">
          <TrOwnerOrderProcessGuide />

          <div className="space-y-3">
            <p className="text-[17px] font-medium text-neutral-700">
              {orders.length === 0
                ? "Henüz sipariş yok"
                : pendingCount > 0
                  ? `${pendingCount} sipariş bekliyor · toplam ${orders.length}`
                  : `${orders.length} sipariş`}
            </p>
            <p className={panelHintClass}>
              Filtreyle sadece ilgilenmeniz gerekenleri gösterin. Bir satıra
              dokunarak detayı açın.
            </p>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={panelChipClass(filter === key)}
                  style={
                    filter === key
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
                >
                  {key === "all" ? "Tümü" : FULFILLMENT_LABEL[key]}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className={panelEmptyClass}>
              {orders.length === 0
                ? "Müşteri alışveriş yapınca siparişler burada görünür."
                : "Bu filtrede sipariş yok. “Tümü”ne geçmeyi deneyin."}
            </p>
          ) : (
            <TrPanelStagger className="space-y-3">
              {visible.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                const paymentKey =
                  order.isSandbox || order.paymentStatus === "sandbox"
                    ? "sandbox"
                    : order.paymentStatus;

                return (
                  <motion.div key={order.id} variants={trPanelStaggerItem}>
                    <Link
                      href={trPanelOrderPath(order.id)}
                      className="block rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-soft)] sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-3">
                          <p className="text-[19px] font-semibold text-neutral-900 sm:text-[20px]">
                            {order.customerName}
                          </p>
                          <p className="text-[15px] text-neutral-600">
                            {formatOrderDateShort(order.createdAt)} ·{" "}
                            {itemCount} ürün
                          </p>
                          <div>
                            <p className="mb-2 text-[14px] font-medium text-neutral-600">
                              Paketlenecek ürünler
                            </p>
                            <TrOrderItemThumbs items={order.items} size="md" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
                            >
                              {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                            </span>
                            <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                              {PAYMENT_LABEL[paymentKey]}
                            </span>
                          </div>
                          <p className="text-[15px] leading-relaxed text-neutral-600">
                            {FULFILLMENT_HINT[order.fulfillmentStatus]}
                          </p>
                          <p className="text-[15px] font-medium text-[color:var(--panel-accent-deep)]">
                            Detayı aç →
                          </p>
                        </div>
                        <p className="text-[22px] font-semibold tabular-nums text-neutral-950">
                          {formatTryFromKurus(order.totalKurus)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </TrPanelStagger>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerOrdersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Siparişler</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">
              Gelen siparişleri buradan takip edin: paketleyin, barkodu
              yapıştırın, kargoya verin.
            </p>
          </div>
          <OrdersList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
