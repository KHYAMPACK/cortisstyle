"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { getTrCategoryLabel } from "@/lib/tr/fashion/categories";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isTrDemoProduct } from "@/lib/tr/demoIds";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { trBoutiquePath, trBoutiqueProductPath, TR_PDP_FROM_CADDE } from "@/lib/tr/paths";
import { resolveProductColors } from "@/lib/tr/productOptions";
import { TrProductColorDots } from "@/components/tr/TrProductColorDots";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";

interface TrProductQuickSheetProps {
  product: TrProductWithBoutique | null;
  onClose: () => void;
  /** Hard dismiss without restoring a previous sheet (e.g. navigating to boutique). */
  onLeave?: () => void;
  /** Contextual back: outfit → look sheet, home rail → dismiss. */
  backLabel?: string;
  cartEnabled?: boolean;
}

export function TrProductQuickSheet({
  product,
  onClose,
  onLeave,
  backLabel = "← Geri",
  cartEnabled = false,
}: TrProductQuickSheetProps) {
  const leave = onLeave ?? onClose;
  useEffect(() => {
    if (!product) return;
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
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product ? (
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
            aria-labelledby={`tr-product-quick-${product.id}-title`}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden border border-blueprint-border bg-ice-floor shadow-xl md:max-h-[85dvh]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={trPanelFadeTransition}
          >
            <div className="border-b border-blueprint-border px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-meta text-[10px] tracking-[0.18em] uppercase transition-colors hover:text-jet-black"
                >
                  {backLabel}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <TrFavoriteButton
                    product={product}
                    size="md"
                    className="h-9 w-9"
                  />
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-neutral-500 transition-colors hover:text-neutral-950"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                </div>
              </div>
              <p className="text-meta mt-3 text-[10px] tracking-[0.18em] uppercase">
                Parça
                {isTrDemoProduct(product) ? " · Demo" : ""}
              </p>
              <h2
                id={`tr-product-quick-${product.id}-title`}
                className="mt-2 font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950"
              >
                {product.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative mx-auto aspect-[2/3] max-h-[min(42vh,320px)] w-full max-w-[220px] overflow-hidden bg-ice-floor">
                {(() => {
                  const cover = getProductCoverImageFor("marketplace", product);
                  if (isTrDemoIconSrc(cover)) {
                    return (
                      <TrDemoGarmentVisual
                        src={cover}
                        showLabel
                        iconClassName="h-16 w-16"
                      />
                    );
                  }
                  if (cover) {
                    return (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="220px"
                        unoptimized
                        className={
                          isCatalogCutoutImage(cover)
                            ? "object-contain p-6"
                            : "object-cover"
                        }
                      />
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="space-y-4 border-t border-blueprint-border px-5 py-5">
                <div>
                  <p className="font-serif text-xl tracking-[-0.02em] text-brand-primary">
                    {formatTryFromKurus(product.priceKurus)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={trBoutiquePath(product.boutique.slug)}
                      onClick={leave}
                      className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
                    >
                      {product.boutique.name}
                    </Link>
                    {getTrCategoryLabel(product.category) ? (
                      <span className="text-meta text-[10px] tracking-[0.18em] uppercase">
                        {getTrCategoryLabel(product.category)}
                      </span>
                    ) : null}
                    {product.size ? (
                      <span className="text-meta text-[10px] tracking-[0.18em] uppercase">
                        Beden {product.size}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <TrProductColorDots colors={resolveProductColors(product)} />
                  </div>
                </div>

                {product.description ? (
                  <p className="text-[12px] leading-relaxed text-neutral-600">
                    {product.description}
                  </p>
                ) : null}

                {cartEnabled ? (
                  <TrPurchaseActions
                    productId={product.id}
                    boutiqueId={product.boutiqueId}
                    boutiqueName={product.boutique.name}
                    boutiqueSlug={product.boutique.slug}
                    title={product.title}
                    priceKurus={product.priceKurus}
                    image={getProductCoverImageFor("marketplace", product)}
                    size={product.size}
                    status={product.status}
                  />
                ) : null}

                <div className="flex flex-col gap-2 border-t border-blueprint-border pt-4">
                  <Link
                    href={trBoutiqueProductPath(
                      product.boutique.slug,
                      product.id,
                      { from: TR_PDP_FROM_CADDE },
                    )}
                    onClick={leave}
                    className="inline-flex w-full items-center justify-center border border-blueprint-border bg-white px-6 py-3.5 text-[11px] tracking-[0.2em] text-neutral-900 uppercase transition-colors hover:bg-ice-floor"
                  >
                    Butikte daha fazla bilgi
                  </Link>
                  <Link
                    href={trBoutiquePath(product.boutique.slug)}
                    onClick={leave}
                    className="text-center font-mono text-[9px] tracking-[0.22em] text-meta uppercase transition-colors hover:text-jet-black"
                  >
                    {product.boutique.name} vitrinine git →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
