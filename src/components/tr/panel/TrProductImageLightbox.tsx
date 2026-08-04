"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface TrProductImageLightboxProps {
  open: boolean;
  src: string | null;
  label?: string | null;
  onClose: () => void;
}

export function TrProductImageLightbox({
  open,
  src,
  label,
  onClose,
}: TrProductImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && src ? (
        <motion.div
          key="product-photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={label ?? "Fotoğraf önizleme"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[min(92dvh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
              <p className="truncate text-[15px] font-semibold text-neutral-800">
                {label ?? "Fotoğraf"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-neutral-100 px-3 py-2 text-[14px] font-semibold text-neutral-800"
              >
                Kapat
              </button>
            </div>
            <div className="relative min-h-[50dvh] flex-1 bg-[#F3F1EC]">
              <Image
                src={src}
                alt={label ?? ""}
                fill
                unoptimized
                className="object-contain p-4"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
