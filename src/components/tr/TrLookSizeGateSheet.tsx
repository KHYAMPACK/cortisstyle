"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrLookSizeGateSheetProps {
  open: boolean;
  onClose: () => void;
  products: TrProductWithBoutique[];
  onConfirm: (sizesByProductId: Record<string, string | null>) => void;
}

function initialSizes(
  products: TrProductWithBoutique[],
): Record<string, string | null> {
  const next: Record<string, string | null> = {};
  for (const product of products) {
    const sizes = resolveProductSizes(product);
    next[product.id] = sizes.length === 1 ? sizes[0]! : null;
  }
  return next;
}

/**
 * Bottom sheet to pick beden for each outfit piece that needs it,
 * then confirm add-to-cart.
 */
export function TrLookSizeGateSheet({
  open,
  onClose,
  products,
  onConfirm,
}: TrLookSizeGateSheetProps) {
  const [draft, setDraft] = useState<Record<string, string | null>>(() =>
    initialSizes(products),
  );

  const piecesNeedingPick = useMemo(
    () =>
      products.filter((product) => resolveProductSizes(product).length > 1),
    [products],
  );

  useEffect(() => {
    if (!open) return;
    setDraft(initialSizes(products));
  }, [open, products]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  const canConfirm = piecesNeedingPick.every(
    (product) => Boolean(draft[product.id]),
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[125] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tr-look-size-gate-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col border-t border-blueprint-border bg-ice-floor shadow-xl"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="relative flex shrink-0 items-center justify-center px-5 pt-5 pb-3">
              <h2
                id="tr-look-size-gate-title"
                className="text-center text-[12px] tracking-[0.28em] text-neutral-900 uppercase"
              >
                Bedenleri seçin
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 transition-colors hover:text-neutral-950"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-5">
              {piecesNeedingPick.map((product) => {
                const cover = getProductCoverImageFor("marketplace", product);
                const cutout =
                  !isTrDemoIconSrc(cover) && isCatalogCutoutImage(cover);
                const sizes = resolveProductSizes(product);

                return (
                  <li
                    key={product.id}
                    className="border-b border-blueprint-border py-4 last:border-b-0"
                  >
                    <div className="flex gap-3">
                      <span
                        className={`relative h-16 w-12 shrink-0 overflow-hidden ${
                          cutout || isTrDemoIconSrc(cover)
                            ? "bg-ice-floor"
                            : "bg-neutral-100"
                        }`}
                      >
                        {isTrDemoIconSrc(cover) ? (
                          <TrDemoGarmentVisual
                            src={cover}
                            iconClassName="h-6 w-6"
                          />
                        ) : cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            unoptimized
                            sizes="48px"
                            className={
                              cutout
                                ? "object-contain p-1"
                                : "object-cover"
                            }
                          />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] tracking-[0.12em] text-neutral-900 uppercase">
                          {product.title}
                        </p>
                        <TrProductSizePicker
                          sizes={sizes}
                          selectedSize={draft[product.id] ?? null}
                          onChange={(size) =>
                            setDraft((prev) => ({
                              ...prev,
                              [product.id]: size,
                            }))
                          }
                          hideLabel
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shrink-0 px-5 pt-3">
              <button
                type="button"
                disabled={!canConfirm}
                onClick={() => {
                  if (!canConfirm) return;
                  onConfirm(draft);
                }}
                className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kombini sepete ekle
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
