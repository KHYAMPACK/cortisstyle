"use client";

import { useState, type MouseEvent } from "react";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrSizeGateSheet } from "@/components/tr/TrSizeGateSheet";
import { TrVariantGateSheet } from "@/components/tr/commerce/TrVariantGateSheet";
import {
  publicVariantLabel,
  type TrPublicVariant,
  type TrPublicVariants,
} from "@/lib/tr/variants/storefront";
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
 * Opens a size sheet when beden is required and not unique, and a variant sheet for a
 * product that sells by variant (its options load when the sheet opens).
 */
export function TrQuickAddToCartButton({
  product,
  className = "",
  compact = false,
  iconOnly = false,
}: TrQuickAddToCartButtonProps) {
  const cart = useTrScopedCart();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [variants, setVariants] = useState<TrPublicVariants | null>(null);

  if (product.status !== "available") {
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

  const commitVariant = (variant: TrPublicVariant) => {
    if (!variants) return;
    const label = publicVariantLabel(variants, variant);
    const lineImage = variant.images[0] ?? image;
    cart.addItem({
      productId: product.id,
      boutiqueId: product.boutiqueId,
      boutiqueName: product.boutique.name,
      boutiqueSlug: product.boutique.slug,
      title: product.title,
      priceKurus: variant.priceKurus,
      image: lineImage,
      size: null,
      variantId: variant.id,
      variantLabel: label,
    });
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus: variant.priceKurus,
      image: lineImage,
      size: label,
      color: null,
      boutiqueName: product.boutique.name,
    });
    setVariantSheetOpen(false);
  };

  const openVariantSheet = () => {
    setVariantSheetOpen(true);
    if (variants) return;
    void fetch(`/api/tr/products/${encodeURIComponent(product.id)}/variants`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { variants?: TrPublicVariants | null } | null) => {
        if (body?.variants) setVariants(body.variants);
        else setVariantSheetOpen(false);
      })
      .catch(() => setVariantSheetOpen(false));
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (product.productType === "advanced") {
      openVariantSheet();
      return;
    }
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
        disabled={inCart && product.productType !== "advanced"}
        aria-label={inCart && product.productType !== "advanced" ? "Sepette" : "Sepete ekle"}
        className={className || defaultClass}
      >
        {product.productType === "advanced"
          ? iconOnly
            ? "+"
            : "Sepete ekle"
          : iconOnly
            ? inCart
              ? "✓"
              : "+"
            : inCart
              ? "Sepette"
              : "Sepete ekle"}
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
      <TrVariantGateSheet
        open={variantSheetOpen}
        onClose={() => setVariantSheetOpen(false)}
        data={variants}
        onConfirm={commitVariant}
      />
    </>
  );
}
