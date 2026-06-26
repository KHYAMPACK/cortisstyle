"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FREE_TIER_ARCHIVE_LIMIT_MESSAGE } from "@/lib/launchGates";

interface SavedOutfitArchiveLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedOutfitArchiveLimitModal({
  isOpen,
  onClose,
}: SavedOutfitArchiveLimitModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="saved-outfit-archive-limit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-outfit-archive-limit-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg border border-neutral-800 bg-[#0D0D0D] px-6 py-10 text-white shadow-2xl sm:max-h-[90dvh] sm:overflow-y-auto md:px-10 md:py-12"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close archive limit panel"
              className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase transition-colors hover:text-white"
            >
              Close
            </button>

            <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-500 uppercase">
              Archive Matrix // Capacity Gate
            </p>

            <h2
              id="saved-outfit-archive-limit-title"
              className="mt-4 font-serif text-[clamp(1.5rem,5vw,2.25rem)] leading-none tracking-[0.14em] uppercase"
            >
              Free Tier Archive Full
            </h2>

            <p className="mt-5 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-neutral-400 uppercase">
              {FREE_TIER_ARCHIVE_LIMIT_MESSAGE}
            </p>

            <p className="text-meta mt-8 text-center font-mono text-[10px] tracking-[0.28em] text-neutral-500 uppercase">
              [ PREMIUM ACCESS EN ROUTE — STANDBY ]
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full border border-white px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-[#0D0D0D]"
            >
              Got It
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
