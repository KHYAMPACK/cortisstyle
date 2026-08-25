"use client";

import Image from "next/image";
import Link from "next/link";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import {
  trBoutiqueProductPath,
  trClothPath,
  TR_PDP_FROM_CADDE,
} from "@/lib/tr/paths";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductColorSiblingsProps {
  product: TrProductWithBoutique;
  siblings: TrProductWithBoutique[];
  surface: "boutique" | "cadde";
  fromCadde?: boolean;
  accentColor?: string;
}

export function TrProductColorSiblings({
  product,
  siblings,
  surface,
  fromCadde = false,
  accentColor,
}: TrProductColorSiblingsProps) {
  if (siblings.length < 2) return null;

  const selectedRing = accentColor?.trim() || "#1a1a1a";

  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
        Diğer renkler
      </p>
      <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {siblings.map((sibling) => {
          const current = sibling.id === product.id;
          const cover = getProductCoverImageFor(
            surface === "cadde" ? "marketplace" : "boutique",
            sibling,
          );
          const cutout = isCatalogCutoutImage(cover);
          const href =
            surface === "cadde"
              ? trClothPath(sibling.id)
              : trBoutiqueProductPath(
                  sibling.boutique.slug,
                  sibling.id,
                  fromCadde ? { from: TR_PDP_FROM_CADDE } : undefined,
                );
          const label =
            sibling.features.color?.trim() ||
            sibling.colors[0]?.name ||
            sibling.title;

          const thumb = (
            <span
              className={`relative block h-[5.75rem] w-[4rem] shrink-0 rounded-lg sm:h-[6.75rem] sm:w-[4.5rem] ${
                current ? "" : "opacity-85"
              }`}
              style={
                current
                  ? {
                      outline: `2px solid ${selectedRing}`,
                      outlineOffset: "3px",
                    }
                  : undefined
              }
            >
              <span
                className={`absolute inset-0 overflow-hidden rounded-lg ${
                  cutout ? "bg-white" : "bg-neutral-100"
                }`}
              >
                {cover ? (
                  <Image
                    src={cover}
                    alt={label}
                    fill
                    className={
                      cutout ? "object-contain p-2" : "object-cover"
                    }
                    sizes="80px"
                  />
                ) : (
                  <span className="absolute inset-0 bg-neutral-100" />
                )}
              </span>
            </span>
          );

          if (current) {
            return (
              <span
                key={sibling.id}
                className="shrink-0"
                title={label}
                aria-current="true"
              >
                {thumb}
              </span>
            );
          }

          return (
            <Link
              key={sibling.id}
              href={href}
              title={label}
              aria-label={label}
              className="shrink-0"
            >
              {thumb}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
