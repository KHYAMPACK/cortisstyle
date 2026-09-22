"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { MouseEvent } from "react";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductPath } from "@/lib/tr/paths";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import {
  formatTryFromKurus,
  type TrBoutiquePublic,
  type TrProduct,
} from "@/types/tr-marketplace";

/**
 * Shared product card — PLP grid and PDP "you may also like" carousel
 * both use this. Structural match for PopSockets' card (image, then a
 * plain bag/heart row sitting in the card's own light-gray block, then
 * title/subtitle/price) — icons are not overlaid on the photo.
 */
interface TrNewTenantProductCardProps {
  product: TrProduct;
  boutique: TrBoutiquePublic;
  className?: string;
}

export function TrNewTenantProductCard({
  product,
  boutique,
  className = "",
}: TrNewTenantProductCardProps) {
  const href = trBoutiqueProductPath(boutique.slug, product.id);
  const isCustom = Boolean(product.features?.customDesign);
  const cart = useTrScopedCart();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const inCart = cart.hasItem(product.id, null);

  const handleQuickAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (inCart) return;
    const image = product.images[0] ?? null;
    cart.addItem({
      productId: product.id,
      boutiqueId: product.boutiqueId,
      boutiqueName: boutique.name,
      boutiqueSlug: boutique.slug,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size: null,
    });
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size: null,
      color: null,
      boutiqueName: boutique.name,
    });
  };

  return (
    <article className={`group ${className}`}>
      <div className="rounded-xl bg-[#F5F5F5]">
        <Link href={href} className="block aspect-square overflow-hidden rounded-t-xl">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <TrNewTenantPlaceholderMedia label="Görsel yakında" className="h-full w-full" />
          )}
        </Link>

        {/* Plain bag/heart row under the image, same as the reference
            cards — not overlaid on top of the photo. */}
        <div className="flex items-center justify-between px-3 py-2">
          {isCustom ? (
            <span className="flex h-7 w-7 items-center justify-center text-[#9CA3AF]">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            </span>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={inCart}
              aria-label={inCart ? "Sepette" : "Sepete ekle"}
              className="flex h-7 w-7 items-center justify-center text-[#171717] transition-opacity hover:opacity-60 disabled:opacity-40"
            >
              {inCart ? (
                <Check className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          )}
          <TrFavoriteButton
            product={product}
            boutiqueSlug={boutique.slug}
            boutiqueName={boutique.name}
            className="h-7 w-7 overflow-hidden bg-transparent shadow-none [&_button]:bg-transparent [&_button]:shadow-none"
          />
        </div>
      </div>

      <Link href={href} className="mt-2 block">
        <p className="truncate text-[14px] font-bold text-[#171717]">{product.title}</p>
        <p className="text-[13px] text-[#6B7280]">
          {isCustom ? "Kişiye Özel" : "MagSafe Tutucu"}
        </p>
        <p className="mt-0.5 text-[14px] font-semibold text-[#171717]">
          {formatTryFromKurus(product.priceKurus)}
        </p>
      </Link>
    </article>
  );
}
