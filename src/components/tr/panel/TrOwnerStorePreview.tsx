"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTryFromKurus } from "@/types/tr-marketplace";

export interface TrOwnerStorePreviewProps {
  title: string;
  description?: string | null;
  priceTry?: string;
  compareAtPriceTry?: string | null;
  /** The product's photos, shown in order as the shop shows them. */
  images: string[];
  sizes?: string[];
  colorNames?: string[];
}

/**
 * Generic storefront preview (not boutique-themed): the owner's photos as they are,
 * the way the shop shows a product added by hand.
 */
export function TrOwnerStorePreview({
  title,
  description,
  priceTry,
  compareAtPriceTry,
  images,
  sizes = [],
  colorNames = [],
}: TrOwnerStorePreviewProps) {
  const gallery = useMemo(
    () =>
      images
        .map((src) => src?.trim())
        .filter((src): src is string => Boolean(src))
        .map((src, index) => ({ src, label: `Fotoğraf ${index + 1}` })),
    [images],
  );

  // Back to the first photo whenever the photos change.
  const galleryKey = gallery.map((entry) => entry.src).join("|");
  const [selection, setSelection] = useState({ key: galleryKey, index: 0 });
  const activeIndex = selection.key === galleryKey ? selection.index : 0;
  const setActiveIndex = (update: number | ((current: number) => number)) =>
    setSelection({
      key: galleryKey,
      index: typeof update === "function" ? update(activeIndex) : update,
    });

  const safeIndex =
    gallery.length === 0 ? 0 : Math.min(activeIndex, gallery.length - 1);
  const active = gallery[safeIndex] ?? null;

  const sellKurus =
    priceTry && Number(priceTry.replace(",", ".")) > 0
      ? Math.round(Number(priceTry.replace(",", ".")) * 100)
      : null;
  const listKurus =
    compareAtPriceTry && Number(compareAtPriceTry.replace(",", ".")) > 0
      ? Math.round(Number(compareAtPriceTry.replace(",", ".")) * 100)
      : null;

  const goPrev = () => {
    if (gallery.length < 2) return;
    setActiveIndex((current) => (current - 1 + gallery.length) % gallery.length);
  };
  const goNext = () => {
    if (gallery.length < 2) return;
    setActiveIndex((current) => (current + 1) % gallery.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#FAFAF8] shadow-sm"
    >
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
          Mağaza önizlemesi
        </p>
        <p className="mt-1 text-[13px] text-neutral-600">
          Genel vitrin görünümü — butik teması uygulanmaz.
        </p>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <div className="relative aspect-[3/4] w-full bg-[#EEEEEA]">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Image
                  src={active.src}
                  alt={title || "Ürün"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center text-[14px] text-neutral-400">
                Fotoğraf bekleniyor…
              </div>
            )}
          </AnimatePresence>

          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute top-1/2 left-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[18px] font-semibold text-neutral-800 shadow"
                aria-label="Önceki fotoğraf"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 right-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[18px] font-semibold text-neutral-800 shadow"
                aria-label="Sonraki fotoğraf"
              >
                ›
              </button>
              <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white">
                {active?.label} · {safeIndex + 1}/{gallery.length}
              </p>
            </>
          ) : null}
        </div>

        <div className="flex flex-col justify-center space-y-4 bg-white p-5 sm:p-6">
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-neutral-950">
              {title.trim() || "Ürün adı"}
            </h3>
            {sellKurus != null ? (
              <p className="mt-2 text-[18px] font-semibold text-neutral-900">
                {formatTryFromKurus(sellKurus)}
                {listKurus != null && listKurus > sellKurus ? (
                  <span className="ml-2 text-[15px] font-normal text-neutral-400 line-through">
                    {formatTryFromKurus(listKurus)}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-[15px] text-neutral-400">Fiyat girilmedi</p>
            )}
          </div>

          {description?.trim() ? (
            <p className="text-[15px] leading-relaxed text-neutral-600">
              {description.trim()}
            </p>
          ) : (
            <p className="text-[14px] text-neutral-400">Açıklama yok</p>
          )}

          {(sizes.length > 0 || colorNames.length > 0) && (
            <div className="space-y-1 text-[13px] text-neutral-600">
              {sizes.length > 0 ? <p>Beden: {sizes.join(", ")}</p> : null}
              {colorNames.length > 0 ? (
                <p>Renk: {colorNames.join(", ")}</p>
              ) : null}
            </div>
          )}

          {gallery.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((entry, index) => {
                const selected = index === safeIndex;
                return (
                  <button
                    key={`${entry.src}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f5f5f5] ${
                      selected
                        ? "border-[color:var(--panel-accent)]"
                        : "border-neutral-200"
                    }`}
                    aria-label={entry.label}
                    aria-pressed={selected}
                  >
                    <Image
                      src={entry.src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
