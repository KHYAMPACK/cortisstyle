"use client";

import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrLookCard } from "@/components/tr/TrLookCard";
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
  return (
    <article className="border-b border-blueprint-border">
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
                priority={index === 0 && productIndex < 2}
              />
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
