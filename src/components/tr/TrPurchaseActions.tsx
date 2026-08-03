"use client";

import {
  useTrBoutiqueCommerceScopeOptional,
  useTrScopedCart,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { trBoutiqueCartPath, trCartPath } from "@/lib/tr/paths";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import type { TrCartLineItem } from "@/types/tr-cart";
import type { TrProductStatus } from "@/types/tr-marketplace";

interface TrPurchaseActionsProps {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
  color?: string | null;
  status: TrProductStatus;
  /** Hard block (e.g. unavailable) — not used for missing size. */
  disabled?: boolean;
  /**
   * When true, click opens size/option sheet instead of adding.
   * Button stays enabled so the CTA is never gated by beden.
   */
  selectionRequired?: boolean;
  onRequestSelection?: () => void;
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
    size: props.size,
  };
}

export function TrPurchaseActions(props: TrPurchaseActionsProps) {
  const {
    status,
    disabled = false,
    selectionRequired = false,
    onRequestSelection,
    className = "",
  } = props;
  const cart = useTrScopedCart();
  const scope = useTrBoutiqueCommerceScopeOptional();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const inCart = cart.hasItem(props.productId);

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

  const openSheet = (size: string | null = props.size) => {
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
    if (disabled) return;
    if (selectionRequired) {
      onRequestSelection?.();
      return;
    }
    cart.addItem(toCartLineItem(props));
    openSheet();
  };

  return (
    <div className={`flex items-stretch gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className={`btn-primary inline-flex items-center justify-center px-4 py-4 text-[11px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 ${
          inCart ? "min-w-0 flex-1" : "w-full"
        }`}
      >
        Sepete ekle
      </button>

      {inCart ? (
        <TrSoftNavLink
          href={
            scope
              ? trBoutiqueCartPath(scope.boutiqueSlug)
              : trCartPath()
          }
          className="inline-flex min-w-0 flex-1 items-center justify-center border border-jet-black bg-transparent px-4 py-4 text-center text-[11px] tracking-[0.18em] text-jet-black uppercase transition-opacity hover:opacity-70 sm:px-6 sm:tracking-[0.22em]"
        >
          Siparişi tamamla
        </TrSoftNavLink>
      ) : null}
    </div>
  );
}
