"use client";

import { motion } from "framer-motion";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { useDemoShopperOrders } from "@/components/tr/boutique/orders/useDemoShopperOrders";
import {
  demoShopperTrackingSteps,
  formatDemoShopperDate,
  formatDemoShopperDateTime,
  type DemoShopperOrder,
} from "@/lib/tr/commerce/demoShopperOrders";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { trBoutiqueOrderDetailPath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

export function TrBoutiqueDemoOrderTracking({
  boutique,
  order: seed,
}: {
  boutique: TrBoutiquePublic;
  order: DemoShopperOrder;
}) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const { orders } = useDemoShopperOrders(boutique.slug, [seed]);
  const order = orders[0] ?? seed;
  const tracking = order.tracking;
  const steps = demoShopperTrackingSteps();

  if (!tracking) {
    const cancelled = order.status === "cancelled";
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <TrBoutiquePendingLink
          href={trBoutiqueOrderDetailPath(boutique.slug, order.id)}
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Siparişe dön
        </TrBoutiquePendingLink>
        <h1 className="mt-5 font-serif text-3xl tracking-tight text-neutral-950">
          Kargo takip
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600">
          {cancelled
            ? "Bu sipariş iptal edildi; kargo oluşmaz."
            : "Bu sipariş henüz kargoya verilmedi."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <TrBoutiquePendingLink
          href={trBoutiqueOrderDetailPath(boutique.slug, order.id)}
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Siparişe dön
        </TrBoutiquePendingLink>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">
              Teslim tarihi
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
              {order.expectedArrivalAt
                ? formatDemoShopperDate(order.expectedArrivalAt)
                : "Hesaplanıyor"}
            </h1>
            <p className="mt-2 text-[14px] text-neutral-600">Kargoda</p>
          </div>
          <span className="border border-black/15 px-2 py-1 text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
            Demo
          </span>
        </div>
      </motion.div>

      <motion.ol
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.06 }}
        className="mt-8 grid grid-cols-4 gap-1"
      >
        {steps.map((label, index) => {
          const done = index <= tracking.currentStep;
          return (
            <li key={label} className="flex flex-col items-center text-center">
              <span
                className="flex h-8 w-8 items-center justify-center border text-[11px] text-white"
                style={{
                  backgroundColor: done ? accent : "transparent",
                  borderColor: done ? accent : "rgba(0,0,0,0.2)",
                  color: done ? "#fff" : "#737373",
                }}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="mt-2 text-[10px] leading-tight text-neutral-600 md:text-[11px]">
                {label}
              </span>
            </li>
          );
        })}
      </motion.ol>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.1 }}
        className="mt-8 grid gap-8 lg:grid-cols-2"
      >
        <section>
          <p className="text-[13px] font-medium text-neutral-950">
            {tracking.carrier}
          </p>
          <p className="mt-1 text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
            Takip no
          </p>
          <p className="mt-1 font-mono text-[13px] text-neutral-800">
            {tracking.trackingNumber}
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">
            Demo takip numarası — kargo sitesine bağlanmıyor. Canlı gönderide
            taşıyıcı linki burada olacak.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-medium text-neutral-950">
            Son durum
          </h2>
          <ol className="mt-3 space-y-4">
            {tracking.events.map((event) => (
              <li key={event.at} className="border-l-2 border-black/10 pl-3">
                <p className="text-[12px] text-neutral-500">
                  {formatDemoShopperDateTime(event.at)}
                </p>
                <p className="text-[12px] text-neutral-500">{event.location}</p>
                <p className="mt-0.5 text-[13px] text-neutral-800">
                  {event.message}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </motion.div>
    </div>
  );
}
