"use client";

import Link from "next/link";
import { useState } from "react";
import { trCartPath } from "@/lib/tr/paths";
import { useTrCartStore } from "@/store/trCartStore";
import type { TrProductStatus } from "@/types/tr-marketplace";
import type { TrCartLineItem } from "@/types/tr-cart";

interface TrPurchaseActionsProps {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
  status: TrProductStatus;
  disabled?: boolean;
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
  const { status, disabled = false, className = "" } = props;
  const addItem = useTrCartStore((state) => state.addItem);
  const inCart = useTrCartStore((state) =>
    state.items.some((entry) => entry.productId === props.productId),
  );
  const [feedback, setFeedback] = useState<"added" | null>(null);

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

  const handleAdd = () => {
    if (disabled) return;
    const added = addItem(toCartLineItem(props));
    if (added) {
      setFeedback("added");
    }
  };

  if (inCart) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Link
          href={trCartPath()}
          className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
        >
          Sepette — sepete git
        </Link>
        <p className="text-center text-[11px] text-meta">Bu ürün zaten sepetinizde.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Beden seçin" : "Sepete ekle"}
      </button>
      {feedback === "added" ? (
        <p className="text-center text-[11px] text-meta">Sepete eklendi.</p>
      ) : null}
    </div>
  );
}
