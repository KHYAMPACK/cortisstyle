"use client";

import { ShoppingBag } from "lucide-react";
import {
  useTrBoutiqueCommerceScopeOptional,
  useTrScopedCart,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { trBoutiqueCartPath, trCartPath } from "@/lib/tr/paths";

type TrCartLinkSize = "md" | "lg";

export function TrCartLink({ size = "md" }: { size?: TrCartLinkSize }) {
  const scope = useTrBoutiqueCommerceScopeOptional();
  const cart = useTrScopedCart();
  const displayCount = cart.hydrated ? cart.itemCount : 0;

  const className =
    size === "lg"
      ? "relative inline-flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-60 md:h-12 md:w-12"
      : "relative inline-flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60";
  const iconClass =
    size === "lg"
      ? "h-5 w-5 text-neutral-900 md:h-[22px] md:w-[22px]"
      : "h-[18px] w-[18px] text-neutral-900";
  const label =
    displayCount > 0 ? `Sepet (${displayCount} ürün)` : "Sepet";

  const badge =
    displayCount > 0 ? (
      <span
        className={`absolute flex min-w-4 items-center justify-center px-1 text-white ${
          scope ? "bg-brand-primary" : "bg-neutral-900"
        } ${
          size === "lg"
            ? "top-0.5 right-0.5 h-5 min-w-5 text-[10px]"
            : "-top-0.5 -right-0.5 h-4 text-[9px]"
        }`}
      >
        {displayCount}
      </span>
    ) : null;

  const href = scope
    ? trBoutiqueCartPath(scope.boutiqueSlug)
    : trCartPath();

  const content = (
    <>
      <ShoppingBag strokeWidth={1.5} className={iconClass} />
      {badge}
    </>
  );

  if (scope) {
    return (
      <TrBoutiquePendingLink
        href={href}
        kind="cart"
        className={className}
        aria-label={label}
      >
        {content}
      </TrBoutiquePendingLink>
    );
  }

  return (
    <TrSoftNavLink href={href} className={className} aria-label={label}>
      {content}
    </TrSoftNavLink>
  );
}
