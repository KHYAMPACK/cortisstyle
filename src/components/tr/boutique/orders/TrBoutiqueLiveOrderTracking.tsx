"use client";

import { motion } from "framer-motion";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { orderReference } from "@/lib/tr/orderReference";
import { LIVE_TRACKING_STEPS } from "@/lib/tr/shipping/mapFulfillment";
import { trBoutiqueOrderDetailPath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";
import type { TrShippingTrace } from "@/lib/tr/shipping/types";

export type LiveTrackingView = {
  orderId: string;
  carrierName: string;
  trackingNumber: string;
  statusLabel: string;
  currentStep: number;
  traces: TrShippingTrace[];
};

function formatWhen(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TrBoutiqueLiveOrderTracking({
  boutique,
  tracking,
}: {
  boutique: TrBoutiquePublic;
  tracking: LiveTrackingView;
}) {
  const accent = resolveBoutiqueThemeAccent(boutique);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <TrBoutiquePendingLink
          href={trBoutiqueOrderDetailPath(boutique.slug, tracking.orderId)}
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Siparişe dön
        </TrBoutiquePendingLink>
        <div className="mt-5">
          <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">
            Kargo takip
          </p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
            {tracking.statusLabel}
          </h1>
          <p className="mt-2 text-[14px] text-neutral-600">
            {tracking.carrierName}
          </p>
        </div>
      </motion.div>

      <motion.ol
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.06 }}
        className="mt-8 grid grid-cols-4 gap-1"
      >
        {LIVE_TRACKING_STEPS.map((label, index) => {
          const done = tracking.currentStep >= 0 && index <= tracking.currentStep;
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
          <p className="text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
            Takip no
          </p>
          <p className="mt-1 font-mono text-[13px] text-neutral-800">
            {tracking.trackingNumber}
          </p>
        </section>
        <section>
          <h2 className="text-[13px] font-medium text-neutral-950">
            Son durum
          </h2>
          {tracking.traces.length === 0 ? (
            <p className="mt-3 text-[13px] text-neutral-600">
              Kargo hareketi henüz düşmedi.
            </p>
          ) : (
            <ol className="mt-3 space-y-4">
              {tracking.traces.map((event, index) => (
                <li
                  key={`${event.time}-${event.status}-${index}`}
                  className="border-l-2 border-black/10 pl-3"
                >
                  <p className="text-[12px] text-neutral-500">
                    {formatWhen(event.time)}
                  </p>
                  {event.location ? (
                    <p className="text-[12px] text-neutral-500">
                      {event.location}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[13px] text-neutral-800">
                    {event.status}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </motion.div>
    </div>
  );
}

export function TrBoutiqueTrackingGate({
  boutique,
  orderId,
  token,
}: {
  boutique: TrBoutiquePublic;
  orderId: string;
  token: string | null;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-10 md:px-8 md:py-14">
      <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
        Kargo takip
      </h1>
      <p className="mt-3 text-[14px] text-neutral-600">
        Takibi görmek için siparişteki posta kodunu girin.
      </p>
      <form className="mt-6 space-y-3" method="get">
        {token ? <input type="hidden" name="token" value={token} /> : null}
        <label className="block text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
          Posta kodu
          <input
            name="posta"
            inputMode="numeric"
            autoComplete="postal-code"
            className="mt-2 w-full border border-black/15 px-3 py-3 text-[15px] outline-none focus:border-black/40"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-neutral-950 px-4 py-3 text-[11px] tracking-[0.16em] text-white uppercase"
        >
          Göster
        </button>
      </form>
      <p className="mt-6 text-[12px] text-neutral-500">
        {boutique.name} siparişi {orderReference(orderId)}
      </p>
    </div>
  );
}
