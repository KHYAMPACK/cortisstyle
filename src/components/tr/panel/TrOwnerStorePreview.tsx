"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCatalogBackground } from "@/lib/tr/catalogBackgrounds/registry";
import { ELBISE_PACKSHOT_SLOT } from "@/lib/tr/fashion/garmentUploadTypes";
import { formatTryFromKurus } from "@/types/tr-marketplace";

type GalleryEntry =
  | {
      kind: "catalog" | "lifestyle";
      label: string;
      src: string;
      pending?: false;
    }
  | {
      kind: "catalog" | "lifestyle";
      label: string;
      src?: undefined;
      pending: true;
    };

export interface TrOwnerStorePreviewProps {
  title: string;
  description?: string | null;
  priceTry?: string;
  compareAtPriceTry?: string | null;
  images: string[];
  marketplaceImages: string[];
  lifestyleImages?: string[];
  catalogBackgroundId: string;
  sizes?: string[];
  colorNames?: string[];
  /**
   * When true, show 2 model-shot placeholders if lifestyle images are not ready yet
   * (owner opted into model generation / jobs still running).
   */
  modelShotsPending?: boolean;
  /** Expected model shot count while pending (default 2 = front + back). */
  pendingModelShotCount?: number;
  /**
   * Construction catalog: shopper gallery is model shots first, packshot last.
   * Owner manken originals stay off this preview (same as the storefront).
   * Transparent packshot uses the catalog CSS backdrop.
   */
  onModelGallery?: boolean;
  /**
   * Takım: model shots first, then two item packshots (`marketplaceImages[0..1]`).
   */
  takimGallery?: boolean;
}

function lifestyleGalleryEntries(
  lifestyleImages: string[],
  modelShotsPending: boolean,
  pendingModelShotCount: number,
): GalleryEntry[] {
  const ready = lifestyleImages
    .filter((src) => Boolean(src?.trim()))
    .map((src, index) => ({
      kind: "lifestyle" as const,
      label: index === 0 ? "Model" : `Model ${index + 1}`,
      src: src.trim(),
    }));
  const entries: GalleryEntry[] = [...ready];
  if (modelShotsPending) {
    const need = Math.max(0, pendingModelShotCount - ready.length);
    for (let i = 0; i < need; i += 1) {
      const index = ready.length + i;
      entries.push({
        kind: "lifestyle",
        label: index === 0 ? "Model" : `Model ${index + 1}`,
        pending: true,
      });
    }
  }
  return entries;
}

function takimPackshotEntries(
  images: string[],
  marketplaceImages: string[],
): GalleryEntry[] {
  const entries: GalleryEntry[] = [];
  for (const index of [0, 1] as const) {
    const src = marketplaceImages[index]?.trim() || "";
    const front = images[index * 2]?.trim() || "";
    const back = images[index * 2 + 1]?.trim() || "";
    const label = index === 0 ? "Parça 1 packshot" : "Parça 2 packshot";
    if (src) {
      entries.push({ kind: "catalog", label, src });
    } else if (front && back) {
      entries.push({ kind: "catalog", label, pending: true });
    }
  }
  return entries;
}

function constructionPackshotEntry(
  images: string[],
  marketplaceImages: string[],
): GalleryEntry | null {
  const src =
    marketplaceImages[ELBISE_PACKSHOT_SLOT]?.trim() ||
    images[ELBISE_PACKSHOT_SLOT]?.trim() ||
    "";
  if (src) {
    return { kind: "catalog", label: "Packshot", src };
  }
  if (images[0]?.trim() && images[1]?.trim()) {
    return { kind: "catalog", label: "Packshot", pending: true };
  }
  return null;
}

function PendingSlot({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#EEEEEA] px-6 text-center">
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-300 border-t-[color:var(--panel-accent)]"
        aria-hidden
      />
      <p className="text-[15px] font-semibold text-neutral-800">{label}</p>
      <p className="text-[13px] text-neutral-500">Hazırlanıyor…</p>
    </div>
  );
}

/**
 * Generic storefront preview (not boutique-themed).
 * Catalog slots use packshot/marketplace only — never raw uploads while processing.
 */
export function TrOwnerStorePreview({
  title,
  description,
  priceTry,
  compareAtPriceTry,
  images,
  marketplaceImages,
  lifestyleImages = [],
  catalogBackgroundId,
  sizes = [],
  colorNames = [],
  modelShotsPending = false,
  pendingModelShotCount = 1,
  onModelGallery = false,
  takimGallery = false,
}: TrOwnerStorePreviewProps) {
  const bg = getCatalogBackground(catalogBackgroundId);

  const gallery = useMemo(() => {
    const lifestyle = lifestyleGalleryEntries(
      lifestyleImages,
      modelShotsPending,
      pendingModelShotCount,
    );

    if (takimGallery) {
      return [...lifestyle, ...takimPackshotEntries(images, marketplaceImages)];
    }

    if (onModelGallery) {
      const entries = [...lifestyle];
      const packshot = constructionPackshotEntry(images, marketplaceImages);
      if (packshot) entries.push(packshot);
      return entries;
    }

    const entries: GalleryEntry[] = [];
    for (const i of [0, 1] as const) {
      const packshot = marketplaceImages[i]?.trim() || "";
      const original = images[i]?.trim() || "";
      const label = i === 0 ? "Ön" : "Arka";
      if (packshot) {
        entries.push({ kind: "catalog", label, src: packshot });
      } else if (original) {
        entries.push({ kind: "catalog", label, pending: true });
      }
    }
    entries.push(...lifestyle);
    return entries;
  }, [
    images,
    marketplaceImages,
    lifestyleImages,
    modelShotsPending,
    pendingModelShotCount,
    onModelGallery,
    takimGallery,
  ]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [
    gallery
      .map((g) => (g.pending ? `pending:${g.label}` : g.src))
      .join("|"),
  ]);

  const safeIndex =
    gallery.length === 0 ? 0 : Math.min(activeIndex, gallery.length - 1);
  const active = gallery[safeIndex] ?? null;
  const isCatalogCover = active?.kind === "catalog" && !active.pending;

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
        <div
          className="relative aspect-[3/4] w-full bg-[#EEEEEA]"
          style={isCatalogCover ? { background: bg.css } : undefined}
        >
          <AnimatePresence mode="wait">
            {active?.pending ? (
              <motion.div
                key={`pending-${active.label}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <PendingSlot
                  label={
                    active.kind === "lifestyle"
                      ? "Model fotoğrafı hazırlanıyor"
                      : "Katalog görseli hazırlanıyor"
                  }
                />
              </motion.div>
            ) : active?.src ? (
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
                  className={
                    active.kind === "catalog"
                      ? "object-contain p-6"
                      : "object-cover"
                  }
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
                    key={`${entry.kind}-${entry.pending ? entry.label : entry.src}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 ${
                      selected
                        ? "border-[color:var(--panel-accent)]"
                        : "border-neutral-200"
                    }`}
                    style={
                      entry.kind === "catalog" && !entry.pending
                        ? { background: bg.css }
                        : { background: "#f5f5f5" }
                    }
                    aria-label={entry.label}
                    aria-pressed={selected}
                  >
                    {entry.pending ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[color:var(--panel-accent)]"
                          aria-hidden
                        />
                      </span>
                    ) : (
                      <Image
                        src={entry.src}
                        alt=""
                        fill
                        className={
                          entry.kind === "catalog"
                            ? "object-contain p-1"
                            : "object-cover"
                        }
                        sizes="48px"
                      />
                    )}
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
