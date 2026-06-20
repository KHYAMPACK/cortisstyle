import Image from "next/image";
import { RarityBadge } from "@/components/RarityBadge";
import { computeOutfitRarityFromLook } from "@/lib/rarity";
import type { Look } from "@/types/look";

interface LookCardProps {
  look: Look;
  priority?: boolean;
  onSelect: (look: Look) => void;
}

export function LookCard({ look, priority = false, onSelect }: LookCardProps) {
  const outfitRarity = computeOutfitRarityFromLook(look);

  return (
    <button
      type="button"
      onClick={() => onSelect(look)}
      className="group block w-full cursor-pointer bg-white text-left"
      aria-label={`View ${look.title}`}
    >
      <div className="relative w-full overflow-hidden bg-neutral-100">
        <Image
          src={look.image}
          alt={look.title}
          width={look.width}
          height={look.height}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          priority={priority}
          className="h-auto w-full object-contain transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-[0.72]"
        />

        <div className="absolute top-3 left-3 z-10">
          <RarityBadge
            rarity={outfitRarity}
            className="bg-white/95 backdrop-blur-sm"
          />
        </div>

        <div
          className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20"
          aria-hidden
        />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="font-serif text-[11px] tracking-[0.45em] text-white uppercase">
            View Look
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h2>
      </div>
    </button>
  );
}
