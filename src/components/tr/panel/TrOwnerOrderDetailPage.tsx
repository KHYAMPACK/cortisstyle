"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerOrder,
  updateOwnerOrderFulfillment,
} from "@/lib/tr/ownerClient";
import { trPanelOrdersPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrFulfillmentStatus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

const FULFILLMENT_OPTIONS: Array<{ id: TrFulfillmentStatus; label: string }> = [
  { id: "created", label: "Oluşturuldu" },
  { id: "ready", label: "Kargoya hazır" },
  { id: "shipped", label: "Gönderildi" },
  { id: "delivered", label: "Teslim edildi" },
  { id: "cancelled", label: "İptal" },
];

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function OrderDetail({
  boutiqueId,
  orderId,
}: {
  boutiqueId: string;
  orderId: string;
}) {
  const [order, setOrder] = useState<TrOrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerOrder(boutiqueId, orderId);
        if (!cancelled) setOrder(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Sipariş yüklenemedi.",
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
  }, [boutiqueId, orderId]);

  const setStatus = async (fulfillmentStatus: TrFulfillmentStatus) => {
    if (!order || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateOwnerOrderFulfillment(
        boutiqueId,
        orderId,
        fulfillmentStatus,
      );
      setOrder(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Durum güncellenemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="od-loading" label="Sipariş yükleniyor…" />
      ) : error && !order ? (
        <TrPanelFadeIn key="od-error">
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : order ? (
        <TrPanelFadeIn key="od-ready" className="space-y-6">
          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          <div className="border border-black/10 bg-white px-4 py-5">
            <p className="text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
              {formatOrderDate(order.createdAt)}
            </p>
            <p className="mt-2 font-serif text-2xl text-neutral-950">
              {order.customerName}
            </p>
            <p className="mt-1 text-[13px] text-neutral-600">
              {order.customerEmail}
              {order.customerPhone ? ` · ${order.customerPhone}` : ""}
            </p>
            <p className="mt-4 font-serif text-3xl tabular-nums">
              {formatTryFromKurus(order.totalKurus)}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">
              Ödeme: {order.paymentStatus}
              {order.isSandbox ? " (sandbox)" : ""}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
              Sipariş durumu
            </p>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={saving}
                  onClick={() => void setStatus(option.id)}
                  className={`px-3 py-2 text-[11px] tracking-[0.08em] uppercase disabled:opacity-50 ${
                    order.fulfillmentStatus === option.id
                      ? "bg-neutral-950 text-white"
                      : "border border-black/10 bg-white text-neutral-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-black/10 bg-white">
            <p className="border-b border-black/10 px-4 py-3 text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
              Ürünler
            </p>
            <ul className="divide-y divide-black/10">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
                >
                  <span>
                    {item.title}{" "}
                    <span className="text-neutral-500">×{item.quantity}</span>
                  </span>
                  <span className="tabular-nums">
                    {formatTryFromKurus(item.priceKurus * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-black/10 bg-white px-4 py-4 text-[13px] text-neutral-700">
            <p className="text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
              Teslimat
            </p>
            <p className="mt-2">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 ? (
              <p>{order.shippingAddress.line2}</p>
            ) : null}
            <p>
              {order.shippingAddress.district}, {order.shippingAddress.city}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </TrPanelFadeIn>
      ) : null}
    </AnimatePresence>
  );
}

export function TrOwnerOrderDetailPage({ orderId }: { orderId: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelOrdersPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Siparişler
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Sipariş detayı
            </h2>
            <Link
              href={trPanelPath()}
              className="mt-1 inline-block text-[11px] text-neutral-500"
            >
              Ana sayfa
            </Link>
          </div>
          <OrderDetail boutiqueId={activeBoutique.id} orderId={orderId} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
