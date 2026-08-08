"use client";

import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome";
import type {
  TrBoutiquePublic,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

interface TrBoutiqueYouMayAlsoLikeProps {
  boutique: TrBoutiquePublic;
  products: TrProductWithBoutique[];
  title?: string;
  className?: string;
  /** PDP under-gallery strip (still multi-column on desktop). */
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

  const atelier = isAtelierEditorialSkin(boutique.slug);

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
          atelier
            ? compact
              ? "mb-5 text-[11px] tracking-[0.2em] text-neutral-500 uppercase"
              : "px-4 pt-10 pb-5 text-[11px] tracking-[0.2em] text-neutral-500 uppercase md:px-8"
            : compact
              ? "mb-4 font-mono text-[9px] tracking-[0.28em] text-neutral-500 uppercase"
              : "px-5 pt-10 pb-5 text-[10px] tracking-[0.28em] text-neutral-500 uppercase md:px-10"
        }
      >
        {title}
      </p>
      <div
        className={
          atelier
            ? "grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-y-12 lg:grid-cols-4"
            : compact
              ? "grid grid-cols-2 gap-px bg-black/5 md:grid-cols-3"
              : "grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4"
        }
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className={atelier ? undefined : "bg-white"}
          >
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
