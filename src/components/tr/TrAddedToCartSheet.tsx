"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTrBoutiqueCommerceScopeOptional } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { useTrMarketplaceCacheOptional } from "@/components/tr/TrMarketplaceCacheProvider";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isCatalogCutoutImage } from "@/lib/tr/productImages";
import { trCartPath } from "@/lib/tr/paths";
import { pickRelatedProducts } from "@/lib/tr/recommendations";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";

/**
 * Zara-style “added to cart” overlay — item summary, sepet CTA, you-may-like.
 */
export function TrAddedToCartSheet() {
  const payload = useTrAddedToCartStore((state) => state.payload);
  const close = useTrAddedToCartStore((state) => state.close);
  const cache = useTrMarketplaceCacheOptional();
  const boutiqueScope = useTrBoutiqueCommerceScopeOptional();

  const related = useMemo(() => {
    if (!payload || !cache?.products.length) return [];
    return pickRelatedProducts({
      catalog: cache.products,
      excludeIds: [payload.productId],
      limit: 4,
    });
  }, [cache?.products, payload]);

  useEffect(() => {
    if (!payload) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [payload, close]);

  const metaParts = [
    payload?.size,
    payload?.color,
    payload?.boutiqueName,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {payload ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tr-added-to-cart-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-y-auto bg-ice-floor px-5 pt-6 pb-8 shadow-xl sm:px-8 sm:pt-8 sm:pb-10"
          >
            <div className="relative mb-8 flex items-center justify-center">
              <h2
                id="tr-added-to-cart-title"
                className="text-center text-[12px] tracking-[0.28em] text-neutral-900 uppercase"
              >
                Sepete eklendi
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Kapat"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-500 transition-colors hover:text-neutral-950"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="flex gap-4 sm:gap-5">
              <div
                className={`relative h-28 w-24 shrink-0 overflow-hidden sm:h-32 sm:w-28 ${
                  isTrDemoIconSrc(payload.image) ||
                  isCatalogCutoutImage(payload.image)
                    ? "bg-ice-floor"
                    : "bg-neutral-100"
                }`}
              >
                {isTrDemoIconSrc(payload.image) ? (
                  <TrDemoGarmentVisual
                    src={payload.image}
                    iconClassName="h-10 w-10"
                  />
                ) : payload.image ? (
                  <Image
                    src={payload.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="112px"
                    className={
                      isCatalogCutoutImage(payload.image)
                        ? "object-contain p-2"
                        : "object-cover"
                    }
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase">
                  {payload.title}
                </p>
                {metaParts.length > 0 ? (
                  <p className="mt-2 text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                    {metaParts.join(" · ")}
                  </p>
                ) : null}
                {payload.pieceCount && payload.pieceCount > 1 ? (
                  <p className="mt-2 text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
                    {payload.pieceCount} parça
                  </p>
                ) : null}
                <p className="mt-3 text-[13px] tracking-wide text-neutral-950">
                  {formatTryFromKurus(payload.priceKurus)}
                </p>
              </div>
            </div>

            {boutiqueScope ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  boutiqueScope.openPanel("cart");
                }}
                className="mt-8 inline-flex w-full items-center justify-center border border-jet-black bg-transparent px-6 py-3.5 text-[11px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-70"
              >
                Sepeti gör
              </button>
            ) : (
              <TrSoftNavLink
                href={trCartPath()}
                onNavigate={close}
                className="mt-8 inline-flex w-full items-center justify-center border border-jet-black bg-transparent px-6 py-3.5 text-[11px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-70"
              >
                Sepeti gör
              </TrSoftNavLink>
            )}

            {related.length > 0 ? (
              <div className="mt-10">
                <p className="mb-4 text-[10px] tracking-[0.28em] text-neutral-500 uppercase">
                  Bunları da beğenebilirsiniz
                </p>
                <div className="grid grid-cols-2 gap-px bg-black/5 sm:grid-cols-4">
                  {related.map((product, index) => (
                    <div
                      key={product.id}
                      className="bg-white"
                      onClick={close}
                    >
                      <TrProductCard
                        product={product}
                        showBoutique
                        variant="marketplace"
                        priority={index < 2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
