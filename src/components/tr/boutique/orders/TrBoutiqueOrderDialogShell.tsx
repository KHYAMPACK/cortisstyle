"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export function TrBoutiqueOrderDialogShell({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="order-dialog-backdrop"
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: trPanelEase }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              key="order-dialog-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={spring}
              className={`pointer-events-auto relative max-h-[min(88vh,720px)] overflow-y-auto border border-black/10 bg-white px-6 py-8 shadow-2xl md:px-8 ${
                wide ? "w-[min(92vw,520px)]" : "w-[min(92vw,420px)]"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-4 top-4 text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <h2
                id={titleId}
                className="pr-8 text-center font-serif text-xl text-neutral-950 md:text-2xl"
              >
                {title}
              </h2>
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
