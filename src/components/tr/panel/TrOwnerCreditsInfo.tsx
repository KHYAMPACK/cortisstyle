"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  formatCreditPriceBoth,
  formatCreditPriceUsd,
  priceTryPerCredit,
  TR_AI_CATALOG_CREDITS,
  TR_AI_CREDITS_INFO_LINES,
} from "@/lib/tr/aiCatalog/uploadCostHints";

/**
 * Renders a cost line with a clickable "kredi" that opens an info popup.
 */
export function TrOwnerCreditsCostLine({
  credits,
  prefix = "Bu işlem",
  freeLabel = "Ekstra kredi yok.",
  className = "",
}: {
  credits: number | null;
  prefix?: string;
  freeLabel?: string;
  className?: string;
}) {
  if (credits === null || credits <= 0) {
    return (
      <div
        className={`rounded-xl bg-[color:var(--panel-accent-softer)] px-4 py-3 text-[14px] font-medium text-neutral-800 ${className}`}
      >
        {freeLabel}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-[color:var(--panel-accent-softer)] px-4 py-3 text-[14px] font-medium text-neutral-800 ${className}`}
    >
      {prefix}{" "}
      <TrOwnerCreditsTrigger>{credits} kredi</TrOwnerCreditsTrigger> tutar.
    </div>
  );
}

export function TrOwnerCreditsTrigger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80 ${className}`}
        style={{ color: "var(--panel-accent-deep)" }}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-haspopup="dialog"
      >
        {children}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="w-full max-w-sm rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p
                      id={titleId}
                      className="text-[17px] font-semibold text-neutral-900"
                    >
                      Krediler hakkında
                    </p>

                    <div className="mt-3 rounded-xl bg-[color:var(--panel-accent-softer)] px-4 py-3">
                      <p className="text-[13px] text-neutral-600">Birim fiyat</p>
                      <p className="mt-0.5 text-[20px] font-semibold text-neutral-900">
                        1 kredi = {priceTryPerCredit()} ₺
                      </p>
                      <p className="mt-1 text-[15px] font-medium text-neutral-700">
                        {formatCreditPriceUsd(1)}
                      </p>
                      <p className="mt-2 text-[13px] text-neutral-600">
                        Katalog + model ={" "}
                        {TR_AI_CATALOG_CREDITS.productPackage +
                          TR_AI_CATALOG_CREDITS.modelPackage}{" "}
                        kredi →{" "}
                        {formatCreditPriceBoth(
                          TR_AI_CATALOG_CREDITS.productPackage +
                            TR_AI_CATALOG_CREDITS.modelPackage,
                        )}
                      </p>
                    </div>

                    <ul className="mt-4 space-y-2 text-[14px] text-neutral-700">
                      {TR_AI_CREDITS_INFO_LINES.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span
                            aria-hidden
                            className="text-[color:var(--panel-accent)]"
                          >
                            ▸
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-[15px] font-semibold text-white"
                      style={{ background: "var(--panel-accent)" }}
                      onClick={() => setOpen(false)}
                    >
                      Anladım
                    </button>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

/** Small link under primary actions */
export function TrOwnerCreditsMoreInfoLink({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`text-center text-[12px] text-neutral-500 ${className}`}>
      <TrOwnerCreditsTrigger className="font-medium">
        Krediler hakkında daha fazla bilgi
      </TrOwnerCreditsTrigger>
    </div>
  );
}
