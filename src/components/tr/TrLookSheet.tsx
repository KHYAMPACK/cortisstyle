"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import { trCartPath } from "@/lib/tr/paths";
import { useTrCartStore } from "@/store/trCartStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrLookWithProducts } from "@/types/tr-look";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";
import type { TrCartLineItem } from "@/types/tr-cart";
import { trPanelEase, trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";

interface TrLookSheetProps {
  look: TrLookWithProducts | null;
  onClose: () => void;
  /** Open the home product quick sheet for a piece. */
  onViewProduct: (product: TrProductWithBoutique) => void;
  /** When true, outfit add-to-cart is available (demo or live checkout). */
  cartEnabled?: boolean;
}

function productToCartLine(product: TrProductWithBoutique): TrCartLineItem {
  return {
    productId: product.id,
    boutiqueId: product.boutiqueId,
    boutiqueName: product.boutique.name,
    boutiqueSlug: product.boutique.slug,
    title: product.title,
    priceKurus: product.priceKurus,
    image: getProductCoverImageFor("marketplace", product),
    size: product.size,
  };
}

export function TrLookSheet({
  look,
  onClose,
  onViewProduct,
  cartEnabled = false,
}: TrLookSheetProps) {
  const addItem = useTrCartStore((state) => state.addItem);
  const cartItems = useTrCartStore((state) => state.items);
  const [addFeedback, setAddFeedback] = useState<"added" | "partial" | null>(
    null,
  );

  useEffect(() => {
    setAddFeedback(null);
  }, [look?.id]);

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
  const availableProducts =
    look?.products.filter((product) => product.status === "available") ?? [];
  const alreadyInCart =
    availableProducts.length > 0 &&
    availableProducts.every((product) =>
      cartItems.some((entry) => entry.productId === product.id),
    );

  const handleAddOutfit = () => {
    if (!look || !cartEnabled) return;
    let added = 0;
    for (const product of availableProducts) {
      if (addItem(productToCartLine(product))) added += 1;
    }
    if (added === 0) {
      setAddFeedback(null);
      return;
    }
    setAddFeedback(
      added === availableProducts.length ? "added" : "partial",
    );
  };

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
                <p className="text-meta text-[10px] tracking-[0.18em] uppercase">
                  Kombin
                  {look.boutiqueCount > 1
                    ? ` · ${look.boutiqueCount} butik`
                    : ""}
                  {demoLook ? " · Demo" : ""}
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
                      <button
                        type="button"
                        onClick={() => onViewProduct(product)}
                        className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-ice-floor md:h-28 md:w-20"
                        aria-label={`${product.title} — ürünü gör`}
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
                      </button>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="font-mono text-[9px] tracking-[0.22em] text-meta uppercase">
                          {product.boutique.name}
                        </p>
                        <p className="mt-1 truncate font-serif text-lg leading-snug tracking-[-0.02em] text-neutral-950">
                          {product.title}
                        </p>
                        <p className="mt-2 text-[12px] tracking-[0.04em] text-brand-primary">
                          {formatTryFromKurus(product.priceKurus)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onViewProduct(product)}
                          className="mt-3 inline-flex border border-brand-primary/40 bg-white px-4 py-2.5 text-[10px] tracking-[0.18em] text-brand-primary uppercase transition-colors hover:border-brand-primary hover:bg-brand-primary hover:text-white"
                        >
                          Ürünü gör
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <div className="space-y-3 border-t border-blueprint-border px-5 py-4 md:px-6">
              {cartEnabled && availableProducts.length > 0 ? (
                alreadyInCart ? (
                  <Link
                    href={trCartPath()}
                    onClick={onClose}
                    className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
                  >
                    Kombin sepette — sepete git
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddOutfit}
                    className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
                  >
                    Kombini sepete ekle
                  </button>
                )
              ) : null}
              {addFeedback === "added" ? (
                <p className="text-center text-[11px] text-meta">
                  Kombin sepete eklendi.
                </p>
              ) : null}
              {addFeedback === "partial" ? (
                <p className="text-center text-[11px] text-meta">
                  Eksik parçalar sepete eklendi.
                </p>
              ) : null}
              <p className="text-[11px] leading-relaxed text-meta">
                {demoLook
                  ? "Demo akış — kombini sepete ekle veya parçayı ürün penceresinde incele."
                  : "Parçalar farklı butiklerden gelebilir — tek sepette toplanır."}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
