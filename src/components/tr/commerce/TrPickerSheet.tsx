"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * The bottom sheet the shop uses to pick an option before adding to the cart (size,
 * or a variant): a title, the picker, and one confirm button. Portaled to the body so
 * transformed or clipped card ancestors can't trap it.
 */
export function TrPickerSheet({
  open,
  onClose,
  title,
  confirmLabel,
  canConfirm,
  onConfirm,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  confirmLabel: string;
  canConfirm: boolean;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[125] flex h-dvh items-end justify-center"
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
            aria-labelledby="tr-picker-sheet-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col border-t border-blueprint-border bg-ice-floor shadow-xl"
            style={{
              paddingBottom:
                "max(1.5rem, env(safe-area-inset-bottom), calc(100lvh - 100dvh))",
            }}
          >
            <div className="relative mb-2 flex shrink-0 items-center justify-center px-5 pt-5">
              <h2
                id="tr-picker-sheet-title"
                className="text-center text-[12px] tracking-[0.28em] text-neutral-900 uppercase"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 transition-colors hover:text-neutral-950"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>

            <div className="shrink-0 px-5 pt-3">
              <button
                type="button"
                disabled={!canConfirm}
                onClick={() => {
                  if (canConfirm) onConfirm();
                }}
                className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
