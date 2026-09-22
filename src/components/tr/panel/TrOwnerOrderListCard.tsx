"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_NEXT,
  FULFILLMENT_NEXT_LABEL,
  FULFILLMENT_TONE,
  PAYMENT_LABEL,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelBusySpinner,
  trPanelFadeTransition,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerShipmentLabel,
  fulfillOwnerShipment,
  openOwnerShipmentLabel,
  OwnerShipmentStaleError,
  updateOwnerOrderFulfillment,
  updateOwnerOrderPaymentPaid,
} from "@/lib/tr/ownerClient";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import {
  SHIPPING_BLOCK_ADDRESS_REJECTED,
  hasPurchasedShippingLabel,
} from "@/lib/tr/shipping/types";
import {
  buildAddressCorrectionWhatsAppMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import { trPanelOrderPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

function paymentKey(order: TrOrderWithItems) {
  return order.isSandbox || order.paymentStatus === "sandbox"
    ? "sandbox"
    : order.paymentStatus;
}

function locationLine(order: TrOrderWithItems): string | null {
  const { city, district } = order.shippingAddress;
  if (district && city) return `${district}, ${city}`;
  return city || district || null;
}

export function TrOwnerOrderListCard({
  boutiqueId,
  boutiqueSlug,
  offersIyzicoCheckout,
  order,
  onUpdated,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  offersIyzicoCheckout: boolean;
  order: TrOrderWithItems;
  onUpdated: (order: TrOrderWithItems) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const live = boutiqueHasLiveShipping(boutiqueSlug);
  const cardCheckout = offersIyzicoCheckout;
  const paid =
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.isSandbox;
  const cancelled = order.fulfillmentStatus === "cancelled";
  const delivered = order.fulfillmentStatus === "delivered";
  const shipment = order.shipment;
  const hasBarcode = hasPurchasedShippingLabel(shipment);
  const addressRejected =
    shipment.block === SHIPPING_BLOCK_ADDRESS_REJECTED && !hasBarcode;
  const needsManualPaid =
    order.paymentStatus === "pending" && !order.isSandbox && !cardCheckout;

  const nextLabel = FULFILLMENT_NEXT_LABEL[order.fulfillmentStatus];
  const showAdvance =
    Boolean(nextLabel) &&
    paid &&
    !cancelled &&
    !(
      live &&
      (order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready")
    );
  const showPrint = live && hasBarcode && !cancelled && !delivered;
  const showPrepareLabel =
    live &&
    paid &&
    !hasBarcode &&
    !addressRejected &&
    !cancelled &&
    !delivered;
  const place = locationLine(order);

  const whatsappUrl = order.customerPhone
    ? buildWhatsAppOrderUrl(
        order.customerPhone,
        addressRejected
          ? buildAddressCorrectionWhatsAppMessage(order)
          : `${order.customerName}, siparişiniz hazırlanıyor.`,
      )
    : null;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    const next = FULFILLMENT_NEXT[order.fulfillmentStatus];
    if (!next) return;
    void run(async () => {
      const updated = await updateOwnerOrderFulfillment(
        boutiqueId,
        order.id,
        next,
      );
      onUpdated(updated);
    });
  };

  const markPaid = () =>
    void run(async () => {
      const updated = await updateOwnerOrderPaymentPaid(boutiqueId, order.id);
      onUpdated(updated);
    });

  const printLabel = () =>
    void run(async () => {
      try {
        const svg = await fetchOwnerShipmentLabel(boutiqueId, order.id);
        openOwnerShipmentLabel(svg);
      } catch (err) {
        if (err instanceof OwnerShipmentStaleError) {
          onUpdated(err.order);
        }
        throw err;
      }
    });

  const prepareLabel = () =>
    void run(async () => {
      const result = await fulfillOwnerShipment(boutiqueId, order.id);
      onUpdated(result.order);
      if (!hasPurchasedShippingLabel(result.order.shipment)) {
        throw new Error(
          result.order.shipment.lastError ?? "Etiket üretilemedi.",
        );
      }
    });

  return (
    <article className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-neutral-900">
            {order.customerName}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
            {formatOrderDateShort(order.createdAt)}
            {place ? ` · ${place}` : ""}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-[15px] font-semibold tabular-nums text-neutral-950">
          {formatTryFromKurus(order.totalKurus)}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
        >
          {FULFILLMENT_LABEL[order.fulfillmentStatus]}
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-neutral-600">
          {PAYMENT_LABEL[paymentKey(order)]}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-50">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-contain p-0.5"
                  sizes="40px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-neutral-400">
                  {item.title.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-neutral-900">
                {item.title}
              </p>
              <p className="text-[12px] text-neutral-500">
                {item.size ? `Beden ${item.size}` : "Beden yok"} · {item.quantity}{" "}
                adet
              </p>
            </div>
          </li>
        ))}
      </ul>

      {addressRejected ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-950">
          Adres kargoya uymadı — detaydan müşteriyle düzeltin.
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="order-error"
            role="alert"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={trPanelFadeTransition}
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800"
          >
            {error}
          </motion.p>
        ) : hasBarcode ? (
          <motion.p
            key="label-ready"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={trPanelFadeTransition}
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900"
          >
            Etiket başarıyla oluşturuldu. Yazdırabilirsiniz.
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {needsManualPaid ? (
          <button
            type="button"
            disabled={busy}
            onClick={markPaid}
            className={`${panelPrimaryBtnClass} w-full gap-2 sm:w-auto`}
          >
            {busy ? <TrPanelBusySpinner /> : null}
            Ödendi
          </button>
        ) : null}

        {!needsManualPaid && !addressRejected && showAdvance ? (
          <button
            type="button"
            disabled={busy}
            onClick={advance}
            className={`${panelPrimaryBtnClass} w-full gap-2 sm:w-auto`}
          >
            {busy ? <TrPanelBusySpinner /> : null}
            {nextLabel}
          </button>
        ) : null}

        {!needsManualPaid && !addressRejected && showPrint ? (
          <button
            type="button"
            disabled={busy}
            onClick={printLabel}
            className={`${showAdvance ? panelSecondaryBtnClass : panelPrimaryBtnClass} w-full gap-2 sm:w-auto`}
          >
            {busy ? <TrPanelBusySpinner /> : null}
            Etiket yazdır
          </button>
        ) : null}

        {!needsManualPaid && !addressRejected && showPrepareLabel ? (
          <button
            type="button"
            disabled={busy}
            onClick={prepareLabel}
            className={`${showAdvance ? panelSecondaryBtnClass : panelPrimaryBtnClass} w-full gap-2 sm:w-auto`}
          >
            {busy ? <TrPanelBusySpinner /> : null}
            Etiket hazırla
          </button>
        ) : null}

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={`${panelSecondaryBtnClass} w-full sm:w-auto`}
          >
            WhatsApp
          </a>
        ) : null}

        <Link
          href={trPanelOrderPath(order.id)}
          className="inline-flex min-h-11 items-center justify-center px-3 text-[13px] font-medium text-neutral-500 hover:text-neutral-800 sm:ml-auto"
        >
          Detay
        </Link>
      </div>
    </article>
  );
}
