"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  panelHintClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";

const STORAGE_KEY = "tr-panel-orders-process-open";

function steps(shippingLive: boolean): Array<{ title: string; body: string }> {
  return [
    {
      title: "1. Sipariş düşer",
      body: "Müşteri checkout tamamlayınca sipariş bu listede görünür. Kart (iyzico) açılana kadar durum “Ödeme bekleniyor” olabilir — tahsilatı onaylayınca “Ödendi” işaretleyin.",
    },
    {
      title: "2. Paketleyin",
      body: "Ödeme onayından sonra ürünleri kontrol edip paketleyin. Faturalar sayfasında taslak oluşur — GİB gelene kadar faturayı kendi sürecinizle kesin ve numarayı yazın.",
    },
    {
      title: "3. Kargoya verin",
      body: shippingLive
        ? "Sipariş detayında “Kargo oluştur” → firma seçin → etiket yazdırın. Durum Basit Kargo’dan otomatik gelir."
        : "Kendi kargo panelinizden gönderi oluşturun. Kargo API’si bu butikte henüz yok.",
    },
    {
      title: "4. Durumu güncelleyin",
      body: shippingLive
        ? "Kargo kodu üretince durum kendiliğinden “Kargoda / Teslim” olur. İptalde stok geri gelir."
        : "Gönderiyi oluşturduktan sonra siparişi “Kargoda”, teslimde “Teslim” yapın. İptalde stok otomatik geri gelir.",
    },
  ];
}

/**
 * Collapsible “how orders work” primer for boutique owners.
 */
export function TrOwnerOrderProcessGuide({
  boutiqueSlug,
}: {
  boutiqueSlug: string;
}) {
  const [open, setOpen] = useState(true);
  const shippingLive = boutiqueHasLiveShipping(boutiqueSlug);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "0") setOpen(false);
      if (raw === "1") setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section className={panelSectionClass}>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-[18px] font-semibold text-neutral-900">
            Sipariş süreci
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            Paketlemeden teslime — kısa rehber
          </p>
        </div>
        <span className="text-[20px] text-neutral-500">{open ? "−" : "+"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <ol className="mt-5 space-y-4 border-t border-[color:var(--panel-accent-border)] pt-5">
              {steps(shippingLive).map((step) => (
                <li key={step.title}>
                  <p className="text-[17px] font-semibold text-[color:var(--panel-accent-deep)]">
                    {step.title}
                  </p>
                  <p className={`mt-1 ${panelHintClass}`}>{step.body}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
