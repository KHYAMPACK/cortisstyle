"use client";

import { Heart } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import {
  favoriteSnapshotFromProduct,
  useTrFavoritesStore,
} from "@/store/trFavoritesStore";
import type { TrProduct, TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrFavoriteButtonProps {
  product: TrProduct | TrProductWithBoutique;
  boutiqueSlug?: string;
  boutiqueName?: string;
  className?: string;
  /** Larger hit target for sheets / headers */
  size?: "sm" | "md";
}

export function TrFavoriteButton({
  product,
  boutiqueSlug,
  boutiqueName,
  className = "",
  size = "sm",
}: TrFavoriteButtonProps) {
  const snapshot = favoriteSnapshotFromProduct(product, {
    boutiqueSlug,
    boutiqueName,
  });
  const isFavorite = useTrFavoritesStore((state) =>
    snapshot ? state.hasItem(snapshot.productId) : false,
  );
  const toggleItem = useTrFavoritesStore((state) => state.toggleItem);
  const hydrated = useTrPersistedHydration(useTrFavoritesStore.persist);
  const [error, setError] = useState<string | null>(null);

  if (!snapshot) return null;

  const active = hydrated && isFavorite;
  const iconClass = size === "md" ? "h-5 w-5" : "h-4 w-4";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setError(null);
    try {
      toggleItem(snapshot);
    } catch {
      setError("Kaydedilemedi");
    }
  };

  return (
    <span className={`inline-flex flex-col items-end ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
        aria-pressed={active}
        className={`inline-flex h-full w-full items-center justify-center bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white ${
          active ? "text-brand-primary" : "text-neutral-900"
        }`}
      >
        <Heart
          className={iconClass}
          strokeWidth={1.5}
          fill={active ? "currentColor" : "none"}
        />
      </button>
      {error ? (
        <span className="text-meta absolute top-full right-0 z-20 mt-1 whitespace-nowrap text-[9px]">
          {error}
        </span>
      ) : null}
    </span>
  );
}
