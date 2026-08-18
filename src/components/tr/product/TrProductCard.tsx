"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrQuickAddToCartButton } from "@/components/tr/TrQuickAddToCartButton";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { getTrCategoryLabel } from "@/lib/tr/categories";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import {
  getProductCoverImageFor,
  getProductHoverImage,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { trClothPath, trProductPath } from "@/lib/tr/paths";
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
  boutiqueName?: string;
  variant?: TrProductCardVariant;
  /** Show Sepete ekle under the card (outfit piece rails). */
  showQuickAdd?: boolean;
  /**
   * When set, open quick view instead of navigating.
   * Requires a product with nested boutique.
   */
  onSelect?: (product: TrProductWithBoutique) => void;
}

export function TrProductCard({
  product,
  showBoutique = false,
  priority = false,
  boutiqueSlug,
  boutiqueName,
  variant = "boutique",
  showQuickAdd = false,
  onSelect,
}: TrProductCardProps) {
  const coverImage = getProductCoverImageFor(variant, product);
  const hoverImage = getProductHoverImage(product);
  const demoIcon = isTrDemoIconSrc(coverImage);
  const catalogCutout =
    !demoIcon &&
    (variant === "marketplace" || isCatalogCutoutImage(coverImage));
  const colors = resolveProductColors(product);
  const isSold = product.status === "sold";
  const slug =
    boutiqueSlug ??
    ("boutique" in product ? product.boutique.slug : undefined);
  const resolvedBoutiqueName =
    boutiqueName ??
    ("boutique" in product ? product.boutique.name : undefined);
  const showSeller = showBoutique && Boolean(resolvedBoutiqueName);
  const categoryLabel = getTrCategoryLabel(product.category);
  const centered = variant === "marketplace";
  const quickView =
    Boolean(onSelect) && "boutique" in product
      ? (product as TrProductWithBoutique)
      : null;
  const withBoutique =
    "boutique" in product ? (product as TrProductWithBoutique) : null;

  const metaBits = [
    categoryLabel,
    product.size?.trim() || null,
  ].filter(Boolean);

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
          <>
            <Image
              src={coverImage}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`${
                catalogCutout ? "object-contain p-5 md:p-7" : "object-cover"
              } transition-opacity duration-500 ${
                hoverImage
                  ? "opacity-100 group-hover:opacity-0"
                  : "transition-transform duration-700 group-hover:scale-[1.03]"
              } ${isSold ? "opacity-60" : ""}`}
            />
            {hoverImage ? (
              <Image
                src={hoverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                  isSold ? "!opacity-60" : ""
                }`}
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 px-4 text-center">
            <span
              className={`text-lg text-neutral-700 ${
                centered
                  ? "font-cadde-display uppercase tracking-[0.02em]"
                  : "font-serif"
              }`}
            >
              {product.title}
            </span>
          </div>
        )}

        {isSold ? (
          <span
            className={`absolute top-2 left-2 bg-white px-1.5 py-1 text-[9px] tracking-[0.16em] uppercase ${
              centered
                ? "font-cadde-nav font-semibold text-cadde-red"
                : "text-neutral-900"
            }`}
          >
            Satıldı
          </span>
        ) : null}

        <TrFavoriteButton
          product={product}
          boutiqueSlug={slug}
          boutiqueName={resolvedBoutiqueName}
          className="absolute top-2 right-2 z-10 h-8 w-8"
        />
      </div>

      <div
        className={`px-2 pt-3 pb-5 md:px-2.5 ${
          centered ? "text-center" : "text-left"
        }`}
      >
        {showSeller ? (
          <p
            className={`text-[10px] font-semibold uppercase ${
              centered
                ? "font-cadde-nav tracking-[0.16em] text-neutral-500"
                : "tracking-[0.08em] text-neutral-900"
            }`}
          >
            {resolvedBoutiqueName}
          </p>
        ) : null}

        <h3
          className={`line-clamp-2 text-[11px] leading-snug uppercase md:text-xs ${
            centered
              ? "font-cadde-nav tracking-[0.14em] text-jet-black"
              : "font-serif tracking-[0.1em] text-neutral-800"
          } ${showSeller ? "mt-1" : ""}`}
        >
          {product.title}
        </h3>

        {metaBits.length > 0 ? (
          <p className="text-meta mt-1.5 text-[9px] tracking-[0.16em] uppercase">
            {metaBits.join(" · ")}
          </p>
        ) : null}

        <div
          className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 ${
            centered ? "justify-center" : ""
          }`}
        >
          <span
            className={`text-[12px] font-medium tracking-[0.04em] ${
              centered
                ? "font-cadde-nav text-jet-black"
                : "text-brand-primary"
            }`}
          >
            {formatTryFromKurus(product.priceKurus)}
          </span>
          <TrProductColorDots colors={colors} />
        </div>

        {showQuickAdd && withBoutique ? (
          <div className="mt-3">
            <TrQuickAddToCartButton product={withBoutique} compact />
          </div>
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
        className={`group relative block cursor-pointer bg-white outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          centered
            ? "focus-visible:ring-jet-black"
            : "focus-visible:ring-brand-primary"
        }`}
        aria-label={`${product.title} — hızlı bak`}
      >
        {body}
      </article>
    );
  }

  return (
    <TrSoftNavLink
      href={
        variant === "marketplace"
          ? trClothPath(product.id)
          : trProductPath(product.id, slug)
      }
      className={`group relative block bg-white outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        variant === "marketplace"
          ? "focus-visible:ring-jet-black"
          : "focus-visible:ring-brand-primary"
      }`}
    >
      {body}
    </TrSoftNavLink>
  );
}
