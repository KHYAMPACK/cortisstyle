"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useTrScopedCart,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { beginBuyNowCheckout, type TrPurchaseIntent } from "@/lib/tr/buyNow";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { type TrCartLineItem } from "@/types/tr-cart";
import type { TrProductStatus } from "@/types/tr-marketplace";
import {
  buildSizeRestockNotifyMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";

interface TrPurchaseActionsProps {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
  /** The chosen variant of a product with variants (then `size` is null). */
  variantId?: string | null;
  /** "Kırmızı / S", shown on the cart line. */
  variantLabel?: string | null;
  color?: string | null;
  status: TrProductStatus;
  /** Hard block (e.g. unavailable) — not used for missing size. */
  disabled?: boolean;
  /**
   * When true, click opens size/option sheet instead of adding.
   * Button stays enabled so the CTA is never gated by beden.
   */
  selectionRequired?: boolean;
  onRequestSelection?: (intent?: TrPurchaseIntent) => void;
  /** Selected beden is out of stock — show notify CTA instead of add. */
  sizeOutOfStock?: boolean;
  whatsappPhone?: string | null;
  referenceImageUrl?: string | null;
  referenceId?: string | null;
  styleOption?: string | null;
  className?: string;
}

function toCartLineItem(props: TrPurchaseActionsProps): TrCartLineItem {
  return {
    productId: props.productId,
    boutiqueId: props.boutiqueId,
    boutiqueName: props.boutiqueName,
    boutiqueSlug: props.boutiqueSlug,
    title: props.title,
    priceKurus: props.priceKurus,
    image: props.image,
    size: props.variantId ? null : props.size,
    variantId: props.variantId ?? null,
    variantLabel: props.variantId ? (props.variantLabel ?? null) : null,
    referenceImageUrl: props.referenceImageUrl ?? null,
    referenceId: props.referenceId ?? null,
    styleOption: props.styleOption ?? null,
  };
}

export function TrPurchaseActions(props: TrPurchaseActionsProps) {
  const {
    status,
    disabled = false,
    selectionRequired = false,
    onRequestSelection,
    sizeOutOfStock = false,
    whatsappPhone = null,
    className = "",
  } = props;
  const router = useRouter();
  const cart = useTrScopedCart();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const [buyingNow, setBuyingNow] = useState(false);

  if (status === "sold") {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex w-full cursor-not-allowed items-center justify-center border border-blueprint-border bg-neutral-100 px-6 py-4 text-[11px] tracking-[0.2em] text-meta uppercase ${className}`}
      >
        Satıldı
      </button>
    );
  }

  if (status === "hidden") {
    return null;
  }

  if (sizeOutOfStock) {
    const notifyHref =
      props.size && whatsappPhone
        ? buildWhatsAppOrderUrl(
            whatsappPhone,
            buildSizeRestockNotifyMessage({
              title: props.title,
              size: props.size,
            }),
          )
        : null;

    if (notifyHref) {
      return (
        <a
          href={notifyHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-primary inline-flex w-full items-center justify-center px-4 py-4 text-center text-[11px] tracking-[0.2em] sm:px-6 ${className}`}
        >
          Gelince haber et
        </a>
      );
    }

    return (
      <button
        type="button"
        disabled
        className={`inline-flex w-full cursor-not-allowed items-center justify-center border border-black/15 bg-neutral-50 px-4 py-4 text-[11px] tracking-[0.2em] text-neutral-500 uppercase sm:px-6 ${className}`}
      >
        Gelince haber et
      </button>
    );
  }

  const openSheet = (size: string | null = props.variantLabel ?? props.size) => {
    openAddedSheet({
      productId: props.productId,
      title: props.title,
      priceKurus: props.priceKurus,
      image: props.image,
      size,
      color: props.color ?? null,
      boutiqueName: props.boutiqueName,
    });
  };

  const handleAdd = () => {
    if (disabled || buyingNow) return;
    if (selectionRequired) {
      onRequestSelection?.("add");
      return;
    }
    cart.addItem(toCartLineItem(props));
    openSheet();
  };

  const handleBuyNow = () => {
    if (disabled || buyingNow) return;
    if (selectionRequired) {
      onRequestSelection?.("buyNow");
      return;
    }
    setBuyingNow(true);
    const line = toCartLineItem(props);
    cart.addItem(line);
    router.push(beginBuyNowCheckout(line));
  };

  return (
    <div className={`flex items-stretch gap-2 sm:gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || buyingNow}
        className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center border border-black/15 bg-white px-3 py-3.5 text-[11px] tracking-[0.16em] uppercase transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:tracking-[0.2em]"
      >
        Sepete ekle
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={disabled || buyingNow}
        className="btn-primary inline-flex min-h-12 min-w-0 flex-1 items-center justify-center px-3 py-3.5 text-[11px] tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:tracking-[0.2em]"
      >
        {buyingNow ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse bg-white/80" />
            Yönlendiriliyor…
          </span>
        ) : (
          "Hemen al"
        )}
      </button>
    </div>
  );
}
