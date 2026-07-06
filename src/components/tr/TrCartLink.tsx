"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { trCartPath } from "@/lib/tr/paths";
import { selectCartItemCount, useTrCartStore } from "@/store/trCartStore";

export function TrCartLink() {
  const itemCount = useTrCartStore(selectCartItemCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCount = mounted ? itemCount : 0;

  return (
    <Link
      href={trCartPath()}
      className="relative inline-flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
      aria-label={displayCount > 0 ? `Sepet (${displayCount} ürün)` : "Sepet"}
    >
      <ShoppingBag strokeWidth={1.5} className="h-[18px] w-[18px] text-neutral-900" />
      {displayCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center bg-jet-black px-1 text-[9px] text-white">
          {displayCount}
        </span>
      ) : null}
    </Link>
  );
}
