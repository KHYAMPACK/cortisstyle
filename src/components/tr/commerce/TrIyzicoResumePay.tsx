"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { saveIyzicoCheckoutHold } from "@/lib/tr/payments/iyzicoCheckoutHold";

export function TrIyzicoResumePay({
  boutiqueSlug,
  orderId,
  confirmToken,
}: {
  boutiqueSlug: string;
  orderId: string;
  confirmToken: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onPageShow = () => setBusy(false);
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function startPay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tr/checkout/iyzico/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boutiqueSlug,
          orderId,
          confirmToken,
        }),
      });
      const data = (await response.json()) as {
        paymentPageUrl?: string;
        checkoutToken?: string;
        alreadyPaid?: boolean;
        error?: string;
      };
      if (data.alreadyPaid) {
        window.location.reload();
        return;
      }
      if (!response.ok || !data.paymentPageUrl) {
        throw new Error(data.error ?? "Ödeme sayfası açılamadı.");
      }
      saveIyzicoCheckoutHold(boutiqueSlug, {
        orderId,
        confirmToken,
        checkoutToken: data.checkoutToken?.trim() || undefined,
      });
      window.location.assign(data.paymentPageUrl);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Ödeme sayfası açılamadı.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void startPay()}
        disabled={busy}
        className="btn-primary inline-flex min-h-12 min-w-[12rem] items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em] disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse bg-white/80" />
            Yönlendiriliyor…
          </span>
        ) : (
          "Kart ile öde"
        )}
      </button>
      {error ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: trPanelEase }}
          className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  );
}
