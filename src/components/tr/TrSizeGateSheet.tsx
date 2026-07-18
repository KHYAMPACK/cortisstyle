"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";

interface TrSizeGateSheetProps {
  open: boolean;
  onClose: () => void;
  sizes: string[];
  initialSize?: string | null;
  title?: string;
  confirmLabel?: string;
  onConfirm: (size: string) => void;
}

/**
 * Bottom sheet for size before add-to-cart — keeps the buy CTA always tappable.
 */
export function TrSizeGateSheet({
  open,
  onClose,
  sizes,
  initialSize = null,
  title = "Beden seçin",
  confirmLabel = "Sepete ekle",
  onConfirm,
}: TrSizeGateSheetProps) {
  const [draft, setDraft] = useState<string | null>(initialSize);

  useEffect(() => {
    if (!open) return;
    setDraft(initialSize ?? (sizes.length === 1 ? sizes[0]! : null));
  }, [open, initialSize, sizes]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const canConfirm = Boolean(draft);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[125] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tr-size-gate-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg border-t border-blueprint-border bg-ice-floor px-5 pt-5 pb-6 shadow-xl"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="relative mb-2 flex items-center justify-center">
              <h2
                id="tr-size-gate-title"
                className="text-center text-[12px] tracking-[0.28em] text-neutral-900 uppercase"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-500 transition-colors hover:text-neutral-950"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <TrProductSizePicker
              sizes={sizes}
              selectedSize={draft}
              onChange={setDraft}
              hideLabel
            />

            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => {
                if (!draft) return;
                onConfirm(draft);
              }}
              className="btn-primary mt-6 inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
