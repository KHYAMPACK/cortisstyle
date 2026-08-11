"use client";

import { useState, type MouseEvent } from "react";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrSizeGateSheet } from "@/components/tr/TrSizeGateSheet";
import { isProductCartCheckoutEnabled } from "@/lib/tr/cartCheckout";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { isProductSizeSellable } from "@/lib/tr/sizeStocks";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrQuickAddToCartButtonProps {
  product: TrProductWithBoutique;
  className?: string;
  /** Compact label for tight outfit tiles. */
  compact?: boolean;
  /** Circular + control for editorial product cards. */
  iconOnly?: boolean;
}

/**
 * One-tap Sepete ekle for cards / outfit rows.
 * Opens a size sheet when beden is required and not unique.
 */
export function TrQuickAddToCartButton({
  product,
  className = "",
  compact = false,
  iconOnly = false,
}: TrQuickAddToCartButtonProps) {
  const checkoutEnabled = isProductCartCheckoutEnabled(product);
  const cart = useTrScopedCart();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  if (!checkoutEnabled || product.status !== "available") {
    return null;
  }

  const sizes = resolveProductSizes(product);
  const image = getProductCoverImageFor("marketplace", product);
  const inCart =
    sizes.length <= 1
      ? cart.hasItem(product.id, sizes[0] ?? null)
      : false;

  const commit = (size: string | null) => {
    cart.addItem({
      productId: product.id,
      boutiqueId: product.boutiqueId,
      boutiqueName: product.boutique.name,
      boutiqueSlug: product.boutique.slug,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size,
    });
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size,
      color: null,
      boutiqueName: product.boutique.name,
    });
    setSizeSheetOpen(false);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (inCart) return;
    if (sizes.length > 1) {
      setSizeSheetOpen(true);
      return;
    }
    const size = sizes.length === 1 ? sizes[0]! : (product.size ?? null);
    if (
      size &&
      !isProductSizeSellable({
        sizes,
        size,
        sizeStocks: product.sizeStocks,
        unitStock: product.stock,
      })
    ) {
      return;
    }
    if (!size && product.stock <= 0) return;
    commit(size);
  };

  const defaultClass = iconOnly
    ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-900 shadow-sm transition-opacity hover:opacity-80 disabled:opacity-40"
    : compact
      ? "inline-flex w-full items-center justify-center border border-jet-black bg-white px-2 py-2 text-[9px] tracking-[0.16em] text-jet-black uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
      : "inline-flex items-center justify-center border border-jet-black bg-white px-3 py-2 text-[10px] tracking-[0.18em] text-jet-black uppercase transition-opacity hover:opacity-70 disabled:opacity-40";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={inCart}
        aria-label={inCart ? "Sepette" : "Sepete ekle"}
        className={className || defaultClass}
      >
        {iconOnly ? (inCart ? "✓" : "+") : inCart ? "Sepette" : "Sepete ekle"}
      </button>

      <TrSizeGateSheet
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        sizes={sizes}
        sizeStocks={product.sizeStocks}
        productTitle={product.title}
        whatsappPhone={product.boutique.whatsappPhone}
        onConfirm={commit}
      />
    </>
  );
}
