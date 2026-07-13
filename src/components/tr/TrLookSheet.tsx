"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import { trBoutiquePath, trBoutiqueProductPath, TR_PDP_FROM_CADDE } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrLookWithProducts } from "@/types/tr-look";
import { trPanelEase, trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";

interface TrLookSheetProps {
  look: TrLookWithProducts | null;
  onClose: () => void;
  /** When true, Sepete ekle is available (demo or live checkout). */
  cartEnabled?: boolean;
}

export function TrLookSheet({
  look,
  onClose,
  cartEnabled = false,
}: TrLookSheetProps) {
  useEffect(() => {
    if (!look) return;
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
  }, [look, onClose]);

  const demoLook = look?.products.some(isTrDemoProduct) ?? false;

  return (
    <AnimatePresence>
      {look ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`tr-look-${look.id}-title`}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden border border-blueprint-border bg-ice-floor shadow-xl md:max-h-[85dvh]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={trPanelFadeTransition}
          >
            <div className="flex items-start justify-between gap-4 border-b border-blueprint-border px-5 py-4 md:px-6">
              <div>
                <p className="text-meta text-[9px] tracking-[0.35em] uppercase">
                  [ KOMBİN ]
                  {look.boutiqueCount > 1
                    ? ` · ${look.boutiqueCount} BUTİK`
                    : ""}
                  {demoLook ? " · DEMO" : ""}
                </p>
                <h2
                  id={`tr-look-${look.id}-title`}
                  className="mt-2 font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950"
                >
                  {look.title}
                </h2>
                {look.subtitle ? (
                  <p className="mt-2 max-w-md text-[12px] leading-relaxed text-meta">
                    {look.subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 text-neutral-500 transition-colors hover:text-neutral-950"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto">
              {look.products.map((product, index) => {
                const cover = getProductCoverImageFor("marketplace", product);
                const href = trBoutiqueProductPath(
                  product.boutique.slug,
                  product.id,
                  { from: TR_PDP_FROM_CADDE },
                );
                return (
                  <motion.li
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: trPanelEase,
                      delay: 0.05 + index * 0.05,
                    }}
                    className="border-b border-blueprint-border last:border-b-0"
                  >
                    <div className="flex gap-4 px-5 py-4 md:px-6">
                      <Link
                        href={href}
                        onClick={onClose}
                        className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-ice-floor md:h-28 md:w-20"
                      >
                        {isTrDemoIconSrc(cover) ? (
                          <TrDemoGarmentVisual
                            src={cover}
                            iconClassName="h-8 w-8"
                          />
                        ) : cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            sizes="80px"
                            unoptimized
                            className={
                              isCatalogCutoutImage(cover)
                                ? "object-contain p-1.5"
                                : "object-cover"
                            }
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1 py-0.5">
                        <Link
                          href={trBoutiquePath(product.boutique.slug)}
                          onClick={onClose}
                          className="font-mono text-[9px] tracking-[0.22em] text-meta uppercase transition-colors hover:text-jet-black"
                        >
                          {product.boutique.name}
                        </Link>
                        <Link
                          href={href}
                          onClick={onClose}
                          className="mt-1 block truncate font-serif text-lg leading-snug tracking-[-0.02em] text-neutral-950 hover:underline"
                        >
                          {product.title}
                        </Link>
                        <p className="mt-2 text-[12px] tracking-[0.04em] text-neutral-700">
                          {formatTryFromKurus(product.priceKurus)}
                        </p>
                        {cartEnabled ? (
                          <div className="mt-3 max-w-xs">
                            <TrPurchaseActions
                              productId={product.id}
                              boutiqueId={product.boutiqueId}
                              boutiqueName={product.boutique.name}
                              boutiqueSlug={product.boutique.slug}
                              title={product.title}
                              priceKurus={product.priceKurus}
                              image={cover}
                              size={product.size}
                              status={product.status}
                              className="!mt-0"
                            />
                          </div>
                        ) : (
                          <Link
                            href={href}
                            onClick={onClose}
                            className="mt-3 inline-block font-mono text-[9px] tracking-[0.22em] text-neutral-500 uppercase hover:text-jet-black"
                          >
                            Ürünü gör →
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <div className="border-t border-blueprint-border px-5 py-3 md:px-6">
              <p className="text-[11px] leading-relaxed text-meta">
                {demoLook
                  ? "Demo akış — parçaları sepete ekle, butik vitrinine gir, ödemeyi tamamla."
                  : "Parçalar farklı butiklerden gelebilir — tek sepette toplanır."}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
