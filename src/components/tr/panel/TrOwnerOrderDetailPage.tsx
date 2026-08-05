"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  FULFILLMENT_HINT,
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  PAYMENT_LABEL,
  formatOrderDateLong,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
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

const FULFILLMENT_OPTIONS: TrFulfillmentStatus[] = [
  "created",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

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
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : order ? (
        <TrPanelFadeIn key="od-ready" className="space-y-5">
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          <section className={panelSectionClass}>
            <p className="text-[15px] text-neutral-600">
              {formatOrderDateLong(order.createdAt)}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-neutral-950 sm:text-[24px]">
              {order.customerName}
            </p>
            <p className={`mt-2 ${panelHintClass}`}>
              {order.customerEmail}
              {order.customerPhone ? ` · ${order.customerPhone}` : ""}
            </p>
            <p className="mt-4 text-[28px] font-semibold tabular-nums text-neutral-950">
              {formatTryFromKurus(order.totalKurus)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
              >
                {FULFILLMENT_LABEL[order.fulfillmentStatus]}
              </span>
              <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                {
                  PAYMENT_LABEL[
                    order.isSandbox || order.paymentStatus === "sandbox"
                      ? "sandbox"
                      : order.paymentStatus
                  ]
                }
              </span>
            </div>
          </section>

          <section className={panelSectionClass}>
            <p className="text-[19px] font-semibold text-neutral-900">
              Sipariş durumu
            </p>
            <p className={`mt-2 ${panelHintClass}`}>
              {FULFILLMENT_HINT[order.fulfillmentStatus]}
            </p>
            <p className={`mt-3 ${panelHintClass}`}>
              İşlem ilerledikçe aşağıdaki düğmelerden durumu güncelleyin.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FULFILLMENT_OPTIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={saving}
                  onClick={() => void setStatus(id)}
                  className={panelChipClass(order.fulfillmentStatus === id)}
                  style={
                    order.fulfillmentStatus === id
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
                >
                  {FULFILLMENT_LABEL[id]}
                </button>
              ))}
            </div>
            {saving ? (
              <p className={`mt-3 ${panelHintClass}`}>Kaydediliyor…</p>
            ) : null}
          </section>

          <section className={panelSectionClass}>
            <p className="text-[19px] font-semibold text-neutral-900">
              Paketlenecek ürünler
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Bunları kutuya koyun, sonra barkodu yapıştırın.
            </p>
            <ul className="mt-4 divide-y divide-[color:var(--panel-accent-border)]">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 py-4 text-[17px]"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-neutral-500">
                        {item.title.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{item.title}</p>
                    <p className="mt-1 text-[15px] text-neutral-600">
                      Adet: {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-neutral-800">
                    {formatTryFromKurus(item.priceKurus * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={panelSectionClass}>
            <p className="text-[19px] font-semibold text-neutral-900">
              Teslimat adresi
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Kargo etiketindeki adres bu olmalı.
            </p>
            <div className="mt-4 space-y-1 text-[17px] leading-relaxed text-neutral-800">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? (
                <p>{order.shippingAddress.line2}</p>
              ) : null}
              <p>
                {order.shippingAddress.district}, {order.shippingAddress.city}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </section>
        </TrPanelFadeIn>
      ) : null}
    </AnimatePresence>
  );
}

export function TrOwnerOrderDetailPage({ orderId }: { orderId: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelOrdersPath()} className={panelBackLinkClass}>
              ← Siparişler
            </Link>
            <h2 className={panelPageTitleClass}>Sipariş detayı</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">
              Ürünleri paketleyin, barkodu yapıştırın, kargoya verin; durumu
              buradan güncelleyin.
            </p>
            <Link
              href={trPanelPath()}
              className={`mt-2 block ${panelBackLinkClass}`}
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
