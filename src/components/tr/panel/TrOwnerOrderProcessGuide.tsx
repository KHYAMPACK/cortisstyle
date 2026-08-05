"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  panelHintClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";

const STORAGE_KEY = "tr-panel-orders-process-open";

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "1. Müşteri satın alır",
    body: "Ödeme tamamlanınca sipariş bu listede görünür. Müşteri adı, adres ve ürünler buradadır.",
  },
  {
    title: "2. Barkod / kargo etiketi gelir",
    body: "Sipariş için kargo barkodu hazırlanır. Etiketi buradan veya e-postanızdan alırsınız.",
  },
  {
    title: "3. Yazdırıp pakete yapıştırın",
    body: "Etiketi yazdırın, ürünü dikkatlice paketleyin ve barkodu paketin üstüne yapıştırın.",
  },
  {
    title: "4. Kargoya verin",
    body: "Paketi kargo firmasına teslim edin. Sonra sipariş durumunu “Kargoda” yapın ki takip net olsun.",
  },
];

/**
 * Collapsible “how orders work” primer for boutique owners.
 * Open/closed preference is stored in localStorage.
 */
export function TrOwnerOrderProcessGuide() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "0") setOpen(false);
      else if (raw === "1") setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section className={panelSectionClass}>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-[19px] font-semibold text-neutral-900">
            Sipariş süreci nasıl işler?
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            {open
              ? "Gizlemek için dokunun."
              : "Kısa anlatım — göstermek için dokunun."}
          </p>
        </div>
        <span
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] text-[22px] font-semibold text-neutral-800"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="process-steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ol className="mt-5 space-y-4 border-t border-[color:var(--panel-accent-border)] pt-5">
              {STEPS.map((step) => (
                <li key={step.title}>
                  <p className="text-[17px] font-semibold text-[color:var(--panel-accent-deep)]">
                    {step.title}
                  </p>
                  <p className={`mt-1 ${panelHintClass}`}>{step.body}</p>
                </li>
              ))}
            </ol>
            <p
              className={`${panelHintClass} mt-4 rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3`}
            >
              İpucu: Listedeki bir siparişe dokunarak detayı açın. Orada durumu
              adım adım güncelleyebilirsiniz.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
