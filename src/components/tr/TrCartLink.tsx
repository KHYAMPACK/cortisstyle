"use client";

import { ShoppingBag } from "lucide-react";
import {
  useTrBoutiqueCommerceScopeOptional,
  useTrScopedCart,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { trCartPath } from "@/lib/tr/paths";

export function TrCartLink() {
  const scope = useTrBoutiqueCommerceScopeOptional();
  const cart = useTrScopedCart();
  const displayCount = cart.hydrated ? cart.itemCount : 0;

  const className =
    "relative inline-flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60";
  const label =
    displayCount > 0 ? `Sepet (${displayCount} ürün)` : "Sepet";

  const badge =
    displayCount > 0 ? (
      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center bg-neutral-900 px-1 text-[9px] text-white">
        {displayCount}
      </span>
    ) : null;

  if (scope) {
    return (
      <button
        type="button"
        onClick={() => scope.openPanel("cart")}
        className={className}
        aria-label={label}
      >
        <ShoppingBag
          strokeWidth={1.5}
          className="h-[18px] w-[18px] text-neutral-900"
        />
        {badge}
      </button>
    );
  }

  return (
    <TrSoftNavLink href={trCartPath()} className={className} aria-label={label}>
      <ShoppingBag
        strokeWidth={1.5}
        className="h-[18px] w-[18px] text-neutral-900"
      />
      {badge}
    </TrSoftNavLink>
  );
}
