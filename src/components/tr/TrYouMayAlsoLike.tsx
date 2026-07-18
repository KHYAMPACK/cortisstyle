"use client";

import { TrLookCard } from "@/components/tr/TrLookCard";
import { TrProductCard } from "@/components/tr/TrProductCard";
import type { TrLookWithProducts } from "@/types/tr-look";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrYouMayAlsoLikeProps {
  products?: TrProductWithBoutique[];
  looks?: TrLookWithProducts[];
  className?: string;
}

/**
 * Shared “Bunları da beğenebilirsiniz” strip for sepet / kombin / parça.
 */
export function TrYouMayAlsoLike({
  products = [],
  looks = [],
  className = "",
}: TrYouMayAlsoLikeProps) {
  if (products.length === 0 && looks.length === 0) return null;

  return (
    <section
      aria-label="Bunları da beğenebilirsiniz"
      className={`border-t border-blueprint-border ${className}`}
    >
      <p className="px-5 pt-10 pb-5 text-[10px] tracking-[0.28em] text-neutral-500 uppercase md:px-10">
        Bunları da beğenebilirsiniz
      </p>

      {looks.length > 0 ? (
        <div className="mb-8 grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4">
          {looks.map((look, index) => (
            <div key={look.id} className="bg-ice-floor">
              <TrLookCard look={look} index={index} />
            </div>
          ))}
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4">
          {products.map((product, index) => (
            <div key={product.id} className="bg-white">
              <TrProductCard
                product={product}
                showBoutique
                variant="marketplace"
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
