"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  TrProductHoverZoom,
  useFinePointerHover,
} from "@/components/tr/product/TrProductHoverZoom";
import { isCatalogCutoutImage } from "@/lib/tr/productImages";

interface TrProductGalleryLightboxProps {
  open: boolean;
  images: string[];
  index: number;
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function TrProductGalleryLightbox({
  open,
  images,
  index,
  title,
  onIndexChange,
  onClose,
}: TrProductGalleryLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const fineHover = useFinePointerHover();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const safeIndex = Math.min(index, Math.max(0, images.length - 1));
  const src = images[safeIndex];
  const multi = images.length > 1;
  const isCutout = src ? isCatalogCutoutImage(src) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) {
        onIndexChange(safeIndex <= 0 ? images.length - 1 : safeIndex - 1);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        onIndexChange(safeIndex >= images.length - 1 ? 0 : safeIndex + 1);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, onIndexChange, images.length, safeIndex]);

  const goPrev = () => {
    onIndexChange(safeIndex <= 0 ? images.length - 1 : safeIndex - 1);
  };
  const goNext = () => {
    onIndexChange(safeIndex >= images.length - 1 ? 0 : safeIndex + 1);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && src ? (
        <motion.div
          key="pdp-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — fotoğraf`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[130] flex flex-col bg-neutral-950/88"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-6">
            <p className="min-w-0 truncate text-[12px] tracking-[0.14em] text-white/70 uppercase">
              {title}
              {multi ? (
                <span className="ml-3 text-white/45">
                  {safeIndex + 1} / {images.length}
                </span>
              ) : null}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-white"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1"
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (!multi || touchStartX.current == null) return;
              const x = event.changedTouches[0]?.clientX;
              if (x == null) return;
              const delta = x - touchStartX.current;
              touchStartX.current = null;
              if (delta > 56) goPrev();
              else if (delta < -56) goNext();
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <TrProductHoverZoom
                  className={fineHover ? "cursor-zoom-in" : undefined}
                >
                  <Image
                    src={src}
                    alt={
                      safeIndex === 0
                        ? title
                        : `${title} — görsel ${safeIndex + 1}`
                    }
                    fill
                    unoptimized
                    sizes="100vw"
                    className={
                      isCutout
                        ? "object-contain p-6 md:p-12"
                        : "object-contain"
                    }
                    draggable={false}
                  />
                </TrProductHoverZoom>
              </motion.div>
            </AnimatePresence>

            {multi ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-[22px] font-semibold text-neutral-800 md:left-5"
                  aria-label="Önceki görsel"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-[22px] font-semibold text-neutral-800 md:right-5"
                  aria-label="Sonraki görsel"
                >
                  ›
                </button>
              </>
            ) : null}

            {fineHover ? (
              <p className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-[11px] tracking-[0.16em] text-white/50 uppercase">
                <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} />
                Detay için üzerine gelin
              </p>
            ) : null}
          </div>

          {multi ? (
            <div
              className="flex shrink-0 justify-start gap-2 overflow-x-auto px-4 py-3 md:justify-center md:px-6"
              role="tablist"
              aria-label="Görsel seç"
            >
              {images.map((image, imageIndex) => {
                const selected = imageIndex === safeIndex;
                return (
                  <button
                    key={`${image}-${imageIndex}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Görsel ${imageIndex + 1}`}
                    onClick={() => onIndexChange(imageIndex)}
                    className={`relative h-16 w-12 shrink-0 overflow-hidden bg-white ${
                      selected
                        ? "opacity-100 ring-1 ring-white"
                        : "opacity-55 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      unoptimized
                      sizes="48px"
                      className={
                        isCatalogCutoutImage(image)
                          ? "object-contain p-1"
                          : "object-cover"
                      }
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
