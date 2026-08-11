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
import {
  fetchOwnerAiCredits,
  type TrOwnerAiCreditUsage,
} from "@/lib/tr/ownerClient";

function formatUsageCredits(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function TrOwnerCreditsUsageBlock({
  boutiqueId,
}: {
  boutiqueId: string;
}) {
  const [usage, setUsage] = useState<TrOwnerAiCreditUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchOwnerAiCredits(boutiqueId)
      .then((result) => {
        if (!cancelled) setUsage(result);
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-[color:var(--panel-accent-border)] bg-white px-4 py-3">
        <p className="text-[13px] text-neutral-500">Kullanım yükleniyor…</p>
      </div>
    );
  }

  if (!usage) return null;

  return (
    <div className="mt-3 rounded-xl border border-[color:var(--panel-accent-border)] bg-white px-4 py-3">
      <p className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
        Bu ay · {usage.periodLabel}
      </p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums text-neutral-900">
        {formatUsageCredits(usage.creditsUsed)} kredi
      </p>
      <p className="mt-0.5 text-[13px] text-neutral-600">
        ~${usage.creditsUsd.toFixed(2)} ·{" "}
        {Math.round(usage.creditsTry).toLocaleString("tr-TR")} ₺
      </p>
      <p className="mt-2 text-[12px] text-neutral-500">
        Katalog {formatUsageCredits(usage.packshotCredits)} · Model{" "}
        {formatUsageCredits(usage.modelCredits)}
      </p>
    </div>
  );
}

/**
 * Compact monthly kredi strip for panel home / settings.
 */
export function TrOwnerCreditsUsageCard({
  boutiqueId,
  className = "",
}: {
  boutiqueId: string;
  className?: string;
}) {
  const [usage, setUsage] = useState<TrOwnerAiCreditUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchOwnerAiCredits(boutiqueId)
      .then((result) => {
        if (!cancelled) setUsage(result);
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  return (
    <div
      className={`rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-4 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
            AI krediler
          </p>
          {loading ? (
            <p className="mt-1 text-[15px] text-neutral-500">Yükleniyor…</p>
          ) : usage ? (
            <>
              <p className="mt-1 text-[1.5rem] font-semibold tabular-nums text-neutral-900">
                {formatUsageCredits(usage.creditsUsed)}{" "}
                <span className="text-[15px] font-medium text-neutral-600">
                  kredi
                </span>
              </p>
              <p className="mt-1 text-[13px] text-neutral-600">
                {usage.periodLabel} · ~${usage.creditsUsd.toFixed(2)} ·{" "}
                {Math.round(usage.creditsTry).toLocaleString("tr-TR")} ₺
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                Katalog {formatUsageCredits(usage.packshotCredits)} · Model{" "}
                {formatUsageCredits(usage.modelCredits)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[14px] text-neutral-600">
              Kullanım özeti henüz yok.
            </p>
          )}
        </div>
        <TrOwnerCreditsTrigger className="text-[13px] font-semibold">
          Fiyatlar
        </TrOwnerCreditsTrigger>
      </div>
      <p className="mt-3 text-[12px] text-neutral-500">
        1 kredi = ${TR_AI_CATALOG_CREDITS.priceUsdPerCredit.toFixed(2)} (~
        {priceTryPerCredit()} ₺) · hafif takip, fatura değil
      </p>
    </div>
  );
}

/**
 * Renders a cost line with a clickable "kredi" that opens an info popup.
 */
export function TrOwnerCreditsCostLine({
  credits,
  prefix = "Bu işlem",
  freeLabel = "Ekstra kredi yok.",
  className = "",
  boutiqueId,
}: {
  credits: number | null;
  prefix?: string;
  freeLabel?: string;
  className?: string;
  boutiqueId?: string | null;
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
      <TrOwnerCreditsTrigger boutiqueId={boutiqueId}>
        {credits} kredi
      </TrOwnerCreditsTrigger>{" "}
      tutar.
    </div>
  );
}

export function TrOwnerCreditsTrigger({
  children,
  className = "",
  boutiqueId,
}: {
  children: ReactNode;
  className?: string;
  boutiqueId?: string | null;
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

                    {boutiqueId ? (
                      <TrOwnerCreditsUsageBlock boutiqueId={boutiqueId} />
                    ) : null}

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
  boutiqueId,
}: {
  className?: string;
  boutiqueId?: string | null;
}) {
  return (
    <div className={`text-center text-[12px] text-neutral-500 ${className}`}>
      <TrOwnerCreditsTrigger
        className="font-medium"
        boutiqueId={boutiqueId}
      >
        Krediler hakkında daha fazla bilgi
      </TrOwnerCreditsTrigger>
    </div>
  );
}
