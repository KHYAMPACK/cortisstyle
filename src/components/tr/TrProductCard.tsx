"use client";

import Image from "next/image";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { trProductPath } from "@/lib/tr/paths";
import { resolveProductColors } from "@/lib/tr/productOptions";
import { TrProductColorDots } from "@/components/tr/TrProductColorDots";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductWithBoutique } from "@/types/tr-marketplace";

export type TrProductCardVariant = "marketplace" | "boutique";

interface TrProductCardProps {
  product: TrProduct | TrProductWithBoutique;
  showBoutique?: boolean;
  priority?: boolean;
  boutiqueSlug?: string;
  variant?: TrProductCardVariant;
  /**
   * When set (home piece rails), open quick view instead of navigating to PDP.
   * Requires a product with nested boutique.
   */
  onSelect?: (product: TrProductWithBoutique) => void;
}

export function TrProductCard({
  product,
  showBoutique = false,
  priority = false,
  boutiqueSlug,
  variant = "boutique",
  onSelect,
}: TrProductCardProps) {
  const coverImage = getProductCoverImageFor(variant, product);
  const demoIcon = isTrDemoIconSrc(coverImage);
  const catalogCutout =
    !demoIcon &&
    (variant === "marketplace" || isCatalogCutoutImage(coverImage));
  const colors = resolveProductColors(product);
  const boutique =
    "boutique" in product && showBoutique ? product.boutique : null;
  const isSold = product.status === "sold";
  const slug =
    boutiqueSlug ??
    ("boutique" in product ? product.boutique.slug : undefined);
  const quickView =
    Boolean(onSelect) && "boutique" in product
      ? (product as TrProductWithBoutique)
      : null;

  const body = (
    <>
      <div
        className={`relative aspect-[2/3] overflow-hidden ${
          catalogCutout || demoIcon ? "bg-ice-floor" : "bg-neutral-100"
        }`}
      >
        {demoIcon ? (
          <TrDemoGarmentVisual src={coverImage} showLabel />
        ) : coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${
              catalogCutout
                ? "object-contain p-5 md:p-7"
                : "object-cover"
            } ${isSold ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 px-4 text-center">
            <span className="font-serif text-lg text-neutral-700">
              {product.title}
            </span>
          </div>
        )}

        {isSold ? (
          <span className="absolute top-2 left-2 bg-white px-1.5 py-1 text-[9px] tracking-[0.16em] text-neutral-900 uppercase">
            Satıldı
          </span>
        ) : null}
      </div>

      <div className="px-2 pt-3 pb-5 md:px-2.5">
        <h3 className="line-clamp-2 font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {product.title}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="text-meta text-[11px] tracking-[0.06em]">
            {formatTryFromKurus(product.priceKurus)}
          </span>
          <TrProductColorDots colors={colors} />
        </div>

        {boutique ? (
          <p className="text-meta mt-1.5 text-[9px] tracking-[0.22em] uppercase">
            {boutique.name}
          </p>
        ) : null}
      </div>
    </>
  );

  if (quickView && onSelect) {
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(quickView);
      }
    };

    return (
      <article
        role="button"
        tabIndex={0}
        onClick={() => onSelect(quickView)}
        onKeyDown={handleKeyDown}
        className="group block cursor-pointer bg-white text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        aria-label={`${product.title} — hızlı bak`}
      >
        {body}
      </article>
    );
  }

  return (
    <Link
      href={trProductPath(product.id, slug)}
      className="group block bg-white outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  );
}
