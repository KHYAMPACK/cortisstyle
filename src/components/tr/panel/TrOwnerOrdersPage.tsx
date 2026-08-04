"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { fetchOwnerOrders } from "@/lib/tr/ownerClient";
import {
  trPanelOrderPath,
  trPanelPath,
} from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrFulfillmentStatus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

const FULFILLMENT_LABEL: Record<TrFulfillmentStatus, string> = {
  created: "Oluşturuldu",
  ready: "Kargoya hazır",
  shipped: "Gönderildi",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function OrdersList({ boutiqueId }: { boutiqueId: string }) {
  const [orders, setOrders] = useState<TrOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TrFulfillmentStatus>("all");

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

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="orders-loading" label="Siparişler yükleniyor…" />
      ) : error ? (
        <TrPanelFadeIn key="orders-error">
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="orders-ready" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                "all",
                "created",
                "ready",
                "shipped",
                "delivered",
                "cancelled",
              ] as const
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-[11px] tracking-[0.08em] uppercase ${
                  filter === key
                    ? "bg-neutral-950 text-white"
                    : "border border-black/10 bg-white text-neutral-700"
                }`}
              >
                {key === "all" ? "Tümü" : FULFILLMENT_LABEL[key]}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
              Bu filtrede sipariş yok.
            </p>
          ) : (
            <ul className="divide-y divide-black/10 border border-black/10 bg-white">
              {visible.map((order) => (
                <li key={order.id}>
                  <Link
                    href={trPanelOrderPath(order.id)}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {formatOrderDate(order.createdAt)} ·{" "}
                        {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                        {order.isSandbox || order.paymentStatus === "sandbox"
                          ? " · Sandbox"
                          : ""}
                      </p>
                    </div>
                    <p className="font-serif text-lg tabular-nums text-neutral-950">
                      {formatTryFromKurus(order.totalKurus)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
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
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Ana sayfa
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Siparişler
            </h2>
          </div>
          <OrdersList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
