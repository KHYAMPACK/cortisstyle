import Image from "next/image";
import Link from "next/link";
import { trBoutiquePath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueCardProps {
  boutique: TrBoutiquePublic;
  productCount?: number;
  coverImage?: string | null;
}

export function TrBoutiqueCard({
  boutique,
  productCount,
  coverImage,
}: TrBoutiqueCardProps) {
  return (
    <Link
      href={trBoutiquePath(boutique.slug)}
      className="group surface-canvas-paper block border border-blueprint-border outline-none transition-shadow hover:shadow-canvas-paper focus-visible:ring-2 focus-visible:ring-blueprint-accent focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-blueprint-surface px-6 text-center">
            <span className="font-serif text-2xl tracking-[-0.02em] text-neutral-700">
              {boutique.name}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-blueprint-border px-4 py-4">
        <p className="text-meta text-[9px] tracking-[0.35em] uppercase">
          Butik
        </p>
        <h3 className="mt-2 font-serif text-xl leading-none tracking-[-0.02em] text-neutral-950">
          {boutique.name}
        </h3>
        {boutique.description ? (
          <p className="text-meta mt-2 line-clamp-2 text-[11px] leading-relaxed">
            {boutique.description}
          </p>
        ) : null}
        {typeof productCount === "number" ? (
          <p className="text-meta mt-3 text-[10px] tracking-[0.18em] uppercase">
            {productCount} ürün
          </p>
        ) : null}
      </div>
    </Link>
  );
}
