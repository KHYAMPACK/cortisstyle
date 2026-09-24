"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  PAYMENT_LABEL,
  formatOrderDateLong,
  fulfillmentHintForBoutique,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelDangerBtnClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelSecondaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  trPanelFadeTransition,
} from "@/components/tr/panel/TrPanelMotion";
import { TrOwnerShipmentSection } from "@/components/tr/panel/TrOwnerShipmentSection";
import {
  fetchOwnerOrder,
  updateOwnerOrderFulfillment,
  updateOwnerOrderPaymentPaid,
} from "@/lib/tr/ownerClient";
import { boutiqueHasCarrierIntegration } from "@/lib/tr/shipping/registry";
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
];

function OrderDetail({
  boutiqueId,
  boutiqueSlug,
  offersIyzicoCheckout,
  orderId,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  offersIyzicoCheckout: boolean;
  orderId: string;
}) {
  const [order, setOrder] = useState<TrOrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelNotice, setCancelNotice] = useState(false);

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
      setConfirmCancel(false);
      if (fulfillmentStatus === "cancelled") setCancelNotice(true);
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

  const markPaid = async () => {
    if (!order || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateOwnerOrderPaymentPaid(boutiqueId, orderId);
      setOrder(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ödeme durumu güncellenemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!cancelNotice) return;
    const timer = window.setTimeout(() => setCancelNotice(false), 4000);
    return () => window.clearTimeout(timer);
  }, [cancelNotice]);

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
          <AnimatePresence>
            {cancelNotice ? (
              <motion.p
                key="cancel-notice"
                className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-[16px] text-emerald-900"
                role="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={trPanelFadeTransition}
              >
                Sipariş iptal edildi. Stok geri yüklendi.
              </motion.p>
            ) : null}
          </AnimatePresence>

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
            <p className={`mt-2 ${panelHintClass}`}>
              Fatura:{" "}
              {order.invoiceType === "corporate"
                ? `Kurumsal${order.buyerTitle ? ` · ${order.buyerTitle}` : ""}`
                : "Bireysel"}
              {order.buyerTaxId ? ` · ${order.buyerTaxId}` : ""}
              {order.buyerTaxOffice ? ` · ${order.buyerTaxOffice}` : ""}
            </p>
            <p className="mt-4 text-[28px] font-semibold tabular-nums text-neutral-950">
              {formatTryFromKurus(order.totalKurus)}
            </p>
            {order.discountKurus > 0 ? (
              <p className={`mt-2 ${panelHintClass}`}>
                İndirim
                {order.discountCode ? ` (${order.discountCode})` : ""}: −
                {formatTryFromKurus(order.discountKurus)}
              </p>
            ) : null}
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
            {order.paymentStatus === "pending" &&
            !order.isSandbox &&
            !offersIyzicoCheckout ? (
              <div className="mt-4 space-y-2">
                <p className={panelHintClass}>
                  Kart ödemesi henüz açık değil. Havale / WhatsApp ile tahsil
                  ettiğinizde “Ödendi” işaretleyin; sonra paketleyin.
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void markPaid()}
                  className={panelChipClass(false)}
                >
                  Ödendi olarak işaretle
                </button>
              </div>
            ) : null}
          </section>

          <TrOwnerShipmentSection
            boutiqueId={boutiqueId}
            boutiqueSlug={boutiqueSlug}
            order={order}
            onOrder={setOrder}
          />

          <section className={panelSectionClass}>
            <p className="text-[19px] font-semibold text-neutral-900">
              Sipariş durumu
            </p>
            <p className={`mt-2 ${panelHintClass}`}>
              {fulfillmentHintForBoutique(
                order.fulfillmentStatus,
                boutiqueHasCarrierIntegration(boutiqueSlug),
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FULFILLMENT_OPTIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={saving}
                  onClick={() => void setStatus(id)}
                  className={panelChipClass(order.fulfillmentStatus === id)}
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
            <ul className="mt-4 divide-y divide-[color:var(--panel-accent-border)]">
              {order.items.map((item) => {
                const thumbUrl = item.referenceImageUrl ?? item.imageUrl;
                const styleLabel = item.customization?.styleOption?.trim();
                return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 py-4 text-[17px] sm:flex-row sm:items-start"
                >
                  <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)] sm:h-36 sm:w-28">
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={item.title}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 100vw, 112px"
                        unoptimized={Boolean(item.referenceImageUrl)}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-neutral-500">
                        {item.title.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{item.title}</p>
                    {item.referenceImageUrl ? (
                      <p className="mt-1 text-[14px] font-medium text-[color:var(--panel-accent-deep)]">
                        Müşteri fotoğrafı
                      </p>
                    ) : null}
                    <p className="mt-1 text-[15px] text-neutral-600">
                      {item.size ? `Boyut: ${item.size}` : null}
                      {item.size && styleLabel ? " · " : null}
                      {styleLabel ? `Stil: ${styleLabel}` : null}
                      {(item.size || styleLabel) ? " · " : null}
                      Adet: {item.quantity}
                    </p>
                    {item.referenceImageUrl ? (
                      <a
                        href={item.referenceImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center text-[14px] font-medium text-[color:var(--panel-accent-deep)] hover:underline"
                      >
                        Fotoğrafı aç / indir
                      </a>
                    ) : null}
                  </div>
                  <span className="shrink-0 tabular-nums text-neutral-800">
                    {formatTryFromKurus(item.priceKurus * item.quantity)}
                  </span>
                </li>
              );
              })}
            </ul>
          </section>

          <section className={panelSectionClass}>
            <p className="text-[19px] font-semibold text-neutral-900">
              Teslimat adresi
            </p>
            <p className={`mt-2 ${panelHintClass}`}>
              Müşterinin girdiği adres. Normalde yalnızca görüntülenir;
              kargo firmaları reddederse düzenleme Kargo bölümünden açılır.
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

          {order.fulfillmentStatus !== "cancelled" ? (
            <section className={panelSectionClass}>
              <p className="text-[19px] font-semibold text-neutral-900">
                Siparişi iptal et
              </p>
              <p className={`mt-2 ${panelHintClass}`}>
                Stok geri yüklenir
                {boutiqueHasCarrierIntegration(boutiqueSlug)
                  ? "; Basit Kargo kaydı da iptal edilir"
                  : ""}
                . Kart iadesi henüz yok.
              </p>
              <AnimatePresence mode="wait" initial={false}>
                {!confirmCancel ? (
                  <motion.button
                    key="cancel-open"
                    type="button"
                    disabled={saving}
                    onClick={() => setConfirmCancel(true)}
                    className={`${panelSecondaryBtnClass} mt-4 w-full border-red-300 text-red-800 sm:w-auto`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={trPanelFadeTransition}
                  >
                    İptal
                  </motion.button>
                ) : (
                  <motion.div
                    key="cancel-confirm"
                    className="mt-4 space-y-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5"
                    role="alertdialog"
                    aria-labelledby="cancel-order-title"
                    aria-describedby="cancel-order-copy"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={trPanelFadeTransition}
                  >
                    <p
                      id="cancel-order-title"
                      className="text-[18px] font-semibold text-neutral-900"
                    >
                      Siparişi iptal etmek istediğinize emin misiniz?
                    </p>
                    <p
                      id="cancel-order-copy"
                      className="text-[16px] leading-relaxed text-neutral-700"
                    >
                      {order.customerName} siparişi iptal edilir. Bu işlem
                      kargo kaydını da kapatır.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setConfirmCancel(false)}
                        className={`${panelSecondaryBtnClass} flex-1`}
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setStatus("cancelled")}
                        className={`${panelDangerBtnClass} flex-1`}
                      >
                        {saving ? "İptal ediliyor…" : "Evet, iptal et"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          ) : null}
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
            <Link
              href={trPanelPath()}
              className={`mt-2 block ${panelBackLinkClass}`}
            >
              Ana sayfa
            </Link>
          </div>
          <OrderDetail
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
            offersIyzicoCheckout={Boolean(activeBoutique.offersIyzicoCheckout)}
            orderId={orderId}
          />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
