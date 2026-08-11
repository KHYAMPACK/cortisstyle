"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrLookCard } from "@/components/tr/TrLookCard";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import type { TrLookWithProducts } from "@/types/tr-look";

/** Shared with placeholder stacks so live + ghost covers match. */
export const TR_LOOK_COVER_FRAME =
  "mx-auto w-full max-w-[min(92vw,420px)] sm:max-w-[460px]";

export const TR_LOOK_COVER_PAD = "bg-ice-floor px-5 py-8 md:px-10 md:py-10";

export const TR_LOOK_PIECE_TILE =
  "w-[38vw] max-w-[180px] min-w-[140px] shrink-0 snap-start bg-white sm:w-[160px] md:w-[180px]";

export const TR_LOOK_PIECE_ROW =
  "flex justify-center gap-px overflow-x-auto border-t border-black/5 bg-black/5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface TrLookPieceStackProps {
  look: TrLookWithProducts;
  index: number;
}

export function TrLookPieceStack({ look, index }: TrLookPieceStackProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="border-b border-blueprint-border"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        ...trPanelFadeTransition,
        delay: reduceMotion ? 0 : index * 0.06,
      }}
    >
      <div className={TR_LOOK_COVER_PAD}>
        <div className={TR_LOOK_COVER_FRAME}>
          <TrLookCard look={look} index={index} />
        </div>
      </div>

      {look.products.length > 0 ? (
        <div
          className={TR_LOOK_PIECE_ROW}
          aria-label={`${look.title} parçaları`}
        >
          {look.products.map((product, productIndex) => (
            <div key={product.id} className={TR_LOOK_PIECE_TILE}>
              <TrProductCard
                product={product}
                showBoutique
                variant="marketplace"
                showQuickAdd
                priority={index === 0 && productIndex < 2}
              />
            </div>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}
