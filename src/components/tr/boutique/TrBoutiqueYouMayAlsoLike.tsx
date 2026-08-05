"use client";

import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import type {
  TrBoutiquePublic,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

interface TrBoutiqueYouMayAlsoLikeProps {
  boutique: TrBoutiquePublic;
  products: TrProductWithBoutique[];
  title?: string;
  className?: string;
  /** PDP under-gallery: tighter 2-col strip. */
  compact?: boolean;
}

/**
 * Boutique-scoped “Bunları da beğenebilirsiniz” — cart, PDP, etc.
 */
export function TrBoutiqueYouMayAlsoLike({
  boutique,
  products,
  title = "Bunları da beğenebilirsiniz",
  className = "",
  compact = false,
}: TrBoutiqueYouMayAlsoLikeProps) {
  if (products.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={
        compact
          ? `border-t border-black/5 pt-6 ${className}`
          : `border-t border-black/5 ${className}`
      }
    >
      <p
        className={
          compact
            ? "mb-4 font-mono text-[9px] tracking-[0.28em] text-neutral-500 uppercase"
            : "px-5 pt-10 pb-5 text-[10px] tracking-[0.28em] text-neutral-500 uppercase md:px-10"
        }
      >
        {title}
      </p>
      <div
        className={
          compact
            ? "grid grid-cols-2 gap-px bg-black/5"
            : "grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4"
        }
      >
        {products.map((product, index) => (
          <div key={product.id} className="bg-white">
            <TrBoutiqueEditorialProductCard
              product={product}
              boutiqueSlug={boutique.slug}
              boutiqueName={boutique.name}
              priority={index < 4}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
