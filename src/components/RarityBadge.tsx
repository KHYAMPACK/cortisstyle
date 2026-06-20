import { formatRarityBadge } from "@/lib/rarity";
import type { OutfitRarity } from "@/types/rarity";

interface RarityBadgeProps {
  rarity: OutfitRarity;
  className?: string;
}

export function RarityBadge({ rarity, className = "" }: RarityBadgeProps) {
  return (
    <span
      className={`inline-block border border-neutral-300 px-2 py-1 font-sans text-[8px] leading-none tracking-[0.28em] text-neutral-600 uppercase md:text-[9px] ${className}`}
    >
      {formatRarityBadge(rarity)}
    </span>
  );
}
