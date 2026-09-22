"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrNewTenantProductCard } from "@/components/tr/boutique/newtenant/TrNewTenantProductCard";
import { excludeColorSiblingIds } from "@/lib/tr/catalog/colorSiblings";
import { pickRelatedProducts } from "@/lib/tr/recommendations";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

/**
 * "Bunları da Beğenebilirsin" — structural match for PopSockets'
 * bottom-of-PDP "Best Sellers" carousel (heading + arrow-nav scroll
 * row of cards). Reuses the real catalog via the products context —
 * no fake carousel data.
 */
interface TrNewTenantYouMayAlsoLikeProps {
  product: TrProductWithBoutique;
}

export function TrNewTenantYouMayAlsoLike({
  product,
}: TrNewTenantYouMayAlsoLikeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const boutiqueProducts = useTrBoutiqueProductsOptional();

  const related = useMemo(
    () =>
      pickRelatedProducts({
        catalog: boutiqueProducts?.products ?? [],
        excludeIds: excludeColorSiblingIds(product),
        category: product.category,
        limit: 8,
      }),
    [boutiqueProducts, product],
  );

  if (related.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[#171717]">
          Bunları da Beğenebilirsin
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Önceki"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] text-[#171717] transition-colors hover:border-[#171717]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Sonraki"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] text-[#171717] transition-colors hover:border-[#171717]"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {related.map((item) => (
          <TrNewTenantProductCard
            key={item.id}
            product={item}
            boutique={item.boutique}
            className="w-[220px] shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
