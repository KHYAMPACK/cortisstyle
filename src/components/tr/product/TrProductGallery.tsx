"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrProductGalleryLightbox } from "@/components/tr/product/TrProductGalleryLightbox";
import {
  TrProductHoverZoom,
  useFinePointerHover,
} from "@/components/tr/product/TrProductHoverZoom";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isCatalogCutoutImage } from "@/lib/tr/productImages";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrProductGalleryProps {
  product: Pick<TrProduct, "title" | "images">;
}

/**
 * PDP gallery: main canvas + arrows.
 * Desktop: thumbs sit outside to the left of the canvas; hover magnifies, click expands.
 * Mobile: tap the photo (or zoom control) to expand; arrows to switch.
 */
export function TrProductGallery({ product }: TrProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fineHover = useFinePointerHover();

  if (product.images.length === 0) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center border border-black/10 bg-neutral-100 px-8 text-center">
        <p className="font-serif text-2xl tracking-[-0.02em] text-neutral-700">
          {product.title}
        </p>
      </div>
    );
  }

  if (product.images.every((image) => isTrDemoIconSrc(image))) {
    return (
      <div className="relative aspect-[2/3] overflow-hidden border border-black/10 bg-ice-floor">
        <TrDemoGarmentVisual
          src={product.images[0]}
          showLabel
          iconClassName="h-20 w-20 md:h-24 md:w-24"
        />
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, product.images.length - 1);
  const activeImage = product.images[safeIndex]!;
  const activeIsCutout = isCatalogCutoutImage(activeImage);
  const multi = product.images.length > 1;

  const goPrev = () => {
    setActiveIndex((current) =>
      current <= 0 ? product.images.length - 1 : current - 1,
    );
  };
  const goNext = () => {
    setActiveIndex((current) =>
      current >= product.images.length - 1 ? 0 : current + 1,
    );
  };

  const thumbs = multi ? (
    <div
      className="flex shrink-0 flex-row gap-2 overflow-x-auto self-start py-0 md:flex-col md:justify-start md:overflow-visible md:py-1"
      role="tablist"
      aria-label="Görsel seç"
    >
      {product.images.map((image, index) => {
        const selected = index === safeIndex;
        const thumbCutout = isCatalogCutoutImage(image);
        return (
          <button
            key={`${image}-${index}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Görsel ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`relative h-14 w-11 shrink-0 overflow-hidden bg-[#f3f1ec] transition-opacity md:h-16 md:w-12 ${
              selected
                ? "opacity-100 ring-1 ring-neutral-900"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="48px"
              className={thumbCutout ? "object-contain p-1" : "object-cover"}
            />
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      {thumbs}

      <div
        className={`relative aspect-[2/3] min-w-0 flex-1 overflow-hidden bg-[#f3f1ec] ${
          fineHover ? "cursor-zoom-in" : "cursor-pointer"
        }`}
      >
        <div className="absolute inset-0" onClick={() => setLightboxOpen(true)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <TrProductHoverZoom>
                <Image
                  src={activeImage}
                  alt={
                    safeIndex === 0
                      ? product.title
                      : `${product.title} — görsel ${safeIndex + 1}`
                  }
                  fill
                  priority={safeIndex === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={
                    activeIsCutout
                      ? "object-contain p-6 md:p-10"
                      : "object-cover"
                  }
                  draggable={false}
                />
              </TrProductHoverZoom>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center bg-white/90 text-neutral-800 shadow md:top-4 md:right-4"
          aria-label="Fotoğrafı büyüt"
        >
          <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {multi ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[20px] font-semibold text-neutral-800 shadow md:left-3"
              aria-label="Önceki görsel"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[20px] font-semibold text-neutral-800 shadow md:right-3"
              aria-label="Sonraki görsel"
            >
              ›
            </button>
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white md:hidden">
              {safeIndex + 1}/{product.images.length}
            </p>
          </>
        ) : null}
      </div>

      <TrProductGalleryLightbox
        open={lightboxOpen}
        images={product.images}
        index={safeIndex}
        title={product.title}
        onIndexChange={setActiveIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
