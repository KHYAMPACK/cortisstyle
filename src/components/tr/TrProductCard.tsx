import Image from "next/image";
import Link from "next/link";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { trProductPath } from "@/lib/tr/paths";
import { resolveProductColors } from "@/lib/tr/productOptions";
import { TrProductColorDots } from "@/components/tr/TrProductColorDots";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductWithBoutique } from "@/types/tr-marketplace";

export type TrProductCardVariant = "marketplace" | "boutique";

interface TrProductCardProps {
  product: TrProduct | TrProductWithBoutique;
  showBoutique?: boolean;
  priority?: boolean;
  /** Boutique slug for canonical PDP URL when product has no nested boutique. */
  boutiqueSlug?: string;
  /**
   * `marketplace` — catalog cutout (contain).
   * `boutique` — original gallery cover (full-bleed).
   */
  variant?: TrProductCardVariant;
}

/**
 * Image-forward product tile — no card border / boxed chrome.
 */
export function TrProductCard({
  product,
  showBoutique = false,
  priority = false,
  boutiqueSlug,
  variant = "boutique",
}: TrProductCardProps) {
  const coverImage = getProductCoverImageFor(variant, product);
  const catalogCutout =
    variant === "marketplace" || isCatalogCutoutImage(coverImage);
  const colors = resolveProductColors(product);
  const boutique =
    "boutique" in product && showBoutique ? product.boutique : null;
  const isSold = product.status === "sold";
  const slug =
    boutiqueSlug ??
    ("boutique" in product ? product.boutique.slug : undefined);

  return (
    <Link
      href={trProductPath(product.id, slug)}
      className="group block bg-white outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden ${
          catalogCutout ? "bg-[#f3f1ec]" : "bg-neutral-100"
        }`}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${
              catalogCutout
                ? "object-contain p-5 md:p-7"
                : "object-cover"
            } ${isSold ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 px-4 text-center">
            <span className="font-serif text-lg text-neutral-700">
              {product.title}
            </span>
          </div>
        )}

        {isSold ? (
          <span className="absolute top-2 left-2 bg-white px-1.5 py-1 text-[9px] tracking-[0.16em] text-neutral-900 uppercase">
            Satıldı
          </span>
        ) : null}
      </div>

      <div className="px-2 pt-3 pb-5 md:px-2.5">
        <h3 className="line-clamp-2 text-[12px] leading-snug font-semibold tracking-[0.04em] text-neutral-950 uppercase md:text-[13px]">
          {product.title}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="text-[12px] font-semibold tracking-tight text-neutral-950 md:text-[13px]">
            {formatTryFromKurus(product.priceKurus)}
          </span>
          <TrProductColorDots colors={colors} />
        </div>

        {boutique ? (
          <p className="mt-1.5 text-[10px] tracking-[0.08em] text-neutral-500 uppercase">
            {boutique.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
