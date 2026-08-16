import Image from "next/image";
import Link from "next/link";
import { CADDE_DISPLAY, CADDE_KICKER } from "@/lib/tr/marketplace/caddeUi";
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
      className="group block border border-black/10 bg-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-jet-black focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ice-floor">
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
          <div className="flex h-full items-center justify-center bg-neutral-100 px-6 text-center">
            <span className={`${CADDE_DISPLAY} text-2xl`}>{boutique.name}</span>
          </div>
        )}
      </div>

      <div className="border-t border-black/10 px-4 py-4">
        <p className={CADDE_KICKER}>Butik</p>
        <h3 className={`mt-2 ${CADDE_DISPLAY} text-[1.35rem]`}>
          {boutique.name}
        </h3>
        {boutique.description ? (
          <p className="mt-2 line-clamp-2 font-cadde-nav text-[12px] leading-relaxed tracking-[0.04em] text-neutral-500">
            {boutique.description}
          </p>
        ) : null}
        {typeof productCount === "number" ? (
          <p className="mt-3 font-cadde-nav text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
            {productCount} ürün
          </p>
        ) : null}
      </div>
    </Link>
  );
}
