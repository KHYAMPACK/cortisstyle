import Image from "next/image";
import Link from "next/link";
import { getProductCoverImage, trProductPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductCardProps {
  product: TrProduct | TrProductWithBoutique;
  showBoutique?: boolean;
  priority?: boolean;
}

export function TrProductCard({
  product,
  showBoutique = false,
  priority = false,
}: TrProductCardProps) {
  const coverImage = getProductCoverImage(product);
  const boutique =
    "boutique" in product && showBoutique ? product.boutique : null;
  const isSold = product.status === "sold";

  return (
    <Link
      href={trProductPath(product.id)}
      className="group surface-canvas-paper block border border-blueprint-border outline-none transition-shadow hover:shadow-canvas-paper focus-visible:ring-2 focus-visible:ring-blueprint-accent focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
            className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] ${
              isSold ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-blueprint-surface px-4 text-center">
            <span className="font-serif text-lg text-neutral-700">{product.title}</span>
          </div>
        )}

        {isSold ? (
          <span className="absolute top-3 left-3 bg-jet-black px-2 py-1 text-[9px] tracking-[0.2em] text-white uppercase">
            Satıldı
          </span>
        ) : null}
      </div>

      <div className="border-t border-blueprint-border px-4 py-4">
        <h3 className="font-serif text-lg leading-tight tracking-[-0.02em] text-neutral-950">
          {product.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-[0.14em] uppercase">
          <span className="text-jet-black">{formatTryFromKurus(product.priceKurus)}</span>
          {product.size ? <span className="text-meta">Beden {product.size}</span> : null}
        </div>

        {boutique ? (
          <p className="text-meta mt-2 text-[10px] tracking-[0.12em]">
            Satıcı: {boutique.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
