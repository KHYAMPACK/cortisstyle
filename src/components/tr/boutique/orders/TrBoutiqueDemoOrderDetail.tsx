"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { TrBoutiqueCancelOrderModal } from "@/components/tr/boutique/orders/TrBoutiqueCancelOrderModal";
import { useDemoShopperOrders } from "@/components/tr/boutique/orders/useDemoShopperOrders";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  canCancelDemoShopperOrder,
  demoShopperOrderStatusLabel,
  formatDemoShopperDate,
  formatDemoShopperPhone,
  type DemoShopperOrder,
} from "@/lib/tr/commerce/demoShopperOrders";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import {
  trBoutiqueLegalPath,
  trBoutiqueOrderTrackingPath,
  trBoutiqueOrdersPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

export function TrBoutiqueDemoOrderDetail({
  boutique,
  order: seed,
}: {
  boutique: TrBoutiquePublic;
  order: DemoShopperOrder;
}) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const { orders, cancelItems } = useDemoShopperOrders(boutique.slug, [seed]);
  const order = orders[0] ?? seed;
  const address = order.shippingAddress;
  const statusLabel = demoShopperOrderStatusLabel(order.status);
  const canCancel = canCancelDemoShopperOrder(order);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            key="cancel-success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: trPanelEase }}
            className="mb-8 flex flex-col gap-3 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: accent }}
            role="status"
          >
            <p className="text-[13px] leading-relaxed">
              Ürünleriniz başarıyla iptal edildi.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="min-h-11 shrink-0 border border-white/80 px-4 py-2 text-[11px] tracking-[0.16em] uppercase"
            >
              Kapat
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <TrBoutiquePendingLink
          href={trBoutiqueOrdersPath(boutique.slug)}
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Listeye dön
        </TrBoutiquePendingLink>

        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_minmax(0,16rem)] md:items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h1 className="font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
                {statusLabel}
              </h1>
              <span className="border border-black/15 px-2 py-1 text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                Demo
              </span>
            </div>

            <dl className="mt-5 space-y-1 text-[13px] text-neutral-700">
              <div>
                <dt className="inline font-medium">Sipariş no:</dt>{" "}
                <dd className="inline">{order.displayNumber}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Sipariş tarihi:</dt>{" "}
                <dd className="inline">{formatDemoShopperDate(order.orderedAt)}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Toplam:</dt>{" "}
                <dd className="inline">{formatTryFromKurus(order.totalKurus)}</dd>
              </div>
            </dl>
          </div>

          {canCancel ? (
            <div className="border border-black/15 px-4 py-4">
              <h2 className="text-[13px] font-medium text-neutral-950">
                Siparişi yönet
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">
                Fikriniz değiştiyse veya bir ürünü istemiyorsanız, kargoya
                verilmeden iptal edebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-neutral-900 px-4 py-3 text-[12px] tracking-[0.14em] text-neutral-900 uppercase transition-opacity hover:opacity-70"
              >
                Ürünleri iptal et
              </button>
            </div>
          ) : null}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.05 }}
        className="mt-8"
        aria-label="Teslimat adresi"
      >
        <h2 className="text-[13px] font-medium text-neutral-950">
          Teslimat: {order.customerName}
        </h2>
        <div className="mt-3 border border-black/10 px-4 py-4 text-[13px] leading-relaxed text-neutral-700">
          <p>{order.customerName}</p>
          <p>{address.line1}</p>
          {address.line2 ? <p>{address.line2}</p> : null}
          <p>
            {address.district} / {address.city} {address.postalCode}
          </p>
          <p>{formatDemoShopperPhone(order.phone)}</p>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.08 }}
        className="mt-6 bg-neutral-100 px-4 py-4"
      >
        <p className="text-[13px] font-medium text-neutral-950">
          {statusLabel}
          {order.status !== "cancelled" && order.expectedArrivalAt
            ? ` — tahmini teslim ${formatDemoShopperDate(order.expectedArrivalAt)}`
            : ""}
        </p>
        <p className="mt-1 text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
          {order.shippingMethod}
        </p>
        {order.status !== "cancelled" && order.tracking ? (
          <TrBoutiquePendingLink
            href={trBoutiqueOrderTrackingPath(boutique.slug, order.id)}
            className="mt-3 inline-flex min-h-11 items-center text-[13px] underline underline-offset-4"
            style={{ color: accent }}
          >
            Kargoyu takip et
          </TrBoutiquePendingLink>
        ) : order.status === "cancelled" ? (
          <p className="mt-3 text-[13px] text-neutral-600">
            Bu sipariş iptal edildi; kargo oluşmaz.
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-neutral-600">
            Kargo etiketi henüz oluşmadı. Hazırlanınca takip burada görünür.
          </p>
        )}
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.1 }}
        className="mt-8"
        aria-label="Ürünler"
      >
        <div className="hidden border-b border-black/10 pb-2 text-[11px] tracking-[0.12em] text-neutral-500 uppercase md:grid md:grid-cols-[1fr_5.5rem_4rem_5.5rem] md:gap-3">
          <span>Ürün</span>
          <span className="text-right">Fiyat</span>
          <span className="text-right">Adet</span>
          <span className="text-right">Toplam</span>
        </div>
        <ul className="divide-y divide-black/10">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 py-4 md:grid md:grid-cols-[1fr_5.5rem_4rem_5.5rem] md:items-start md:gap-3"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Durum: {demoShopperOrderStatusLabel(item.status)}
                  </p>
                  {item.color ? (
                    <p className="text-[12px] text-neutral-500">
                      Renk: {item.color}
                    </p>
                  ) : null}
                  {item.size ? (
                    <p className="text-[12px] text-neutral-500">
                      Beden: {item.size}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[12px] text-neutral-600 md:hidden">
                    {formatTryFromKurus(item.unitPriceKurus)} · Adet {item.quantity}{" "}
                    · {formatTryFromKurus(item.unitPriceKurus * item.quantity)}
                  </p>
                </div>
              </div>
              <p className="hidden text-right text-[13px] tabular-nums text-neutral-800 md:block">
                {formatTryFromKurus(item.unitPriceKurus)}
              </p>
              <p className="hidden text-right text-[13px] tabular-nums text-neutral-800 md:block">
                {item.quantity}
              </p>
              <p className="hidden text-right text-[13px] tabular-nums text-neutral-800 md:block">
                {formatTryFromKurus(item.unitPriceKurus * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.12 }}
        className="mt-8 grid gap-8 md:grid-cols-2"
      >
        <section>
          <h2 className="text-[13px] font-medium text-neutral-950">Ödeme</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
            Kart ödemesi henüz canlı değil. Bu demo kayıt, ödeme onayı sonrası
            kargo akışını göstermek için.
          </p>
        </section>
        <section>
          <h2 className="text-[13px] font-medium text-neutral-950">
            Sipariş özeti
          </h2>
          <dl className="mt-3 space-y-2 text-[13px] text-neutral-700">
            <div className="flex justify-between gap-4">
              <dt>Ara toplam</dt>
              <dd className="tabular-nums">
                {formatTryFromKurus(order.subtotalKurus)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Kargo</dt>
              <dd className="tabular-nums">
                {formatTryFromKurus(order.shippingKurus)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-black/10 pt-2 font-medium text-neutral-950">
              <dt>Toplam</dt>
              <dd className="tabular-nums">
                {formatTryFromKurus(order.totalKurus)}
              </dd>
            </div>
          </dl>
          <TrBoutiquePendingLink
            href={trBoutiqueLegalPath(boutique.slug, "iade")}
            className="mt-4 inline-block text-[12px] text-neutral-600 underline underline-offset-4"
          >
            İade politikası
          </TrBoutiquePendingLink>
        </section>
      </motion.div>

      <TrBoutiqueCancelOrderModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        order={order}
        accent={accent}
        onConfirm={(itemIds) => {
          cancelItems(order.id, itemIds);
          setShowSuccess(true);
        }}
      />
    </div>
  );
}
