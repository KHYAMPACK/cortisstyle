import Image from "next/image";
import type { KeyboardEvent, MouseEvent } from "react";
import { LookCardCredits } from "@/components/LookCardCredits";
import { RarityBadge } from "@/components/RarityBadge";
import { computeOutfitRarityFromLook } from "@/lib/rarity";
import type { Look } from "@/types/look";

interface LookCardProps {
  look: Look;
  priority?: boolean;
  onSelect: (look: Look) => void;
}

export function LookCard({
  look,
  priority = false,
  onSelect,
}: LookCardProps) {
  const outfitRarity = computeOutfitRarityFromLook(look);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(look);
    }
  };

  const stopCardActivation = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(look)}
      onKeyDown={handleKeyDown}
      className="group surface-canvas-paper block w-full cursor-pointer border border-blueprint-border text-left outline-none focus-visible:ring-2 focus-visible:ring-blueprint-accent focus-visible:ring-offset-2"
      aria-label={`View ${look.title}`}
    >
      <div className="relative w-full overflow-hidden bg-neutral-100">
        <div className="relative w-full">
          <Image
            src={look.image}
            alt=""
            width={look.width}
            height={look.height}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            priority={priority}
            className="h-auto w-full object-contain transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-[0.72]"
          />
        </div>

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

      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h2>

        <LookCardCredits look={look} onTikTokClick={stopCardActivation} />
      </div>
    </article>
  );
}
