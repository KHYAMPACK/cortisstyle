import { resolveLookItems } from "@/lib/resolveLookItems";
import type { Look } from "@/types/look";
import type { OutfitRarity, RarityScore } from "@/types/rarity";

export const RARITY_LABELS: Record<RarityScore, string> = {
  1: "COMMON ARCHIVE",
  2: "UNCOMMON SELECTION",
  3: "RARE CURATION",
  4: "EPIC PIECE",
  5: "LEGENDARY ASSET",
};

export function clampRarityScore(value: number): RarityScore {
  const rounded = Math.ceil(value);
  return Math.min(5, Math.max(1, rounded)) as RarityScore;
}

export function getRarityLabel(score: RarityScore): string {
  return RARITY_LABELS[score];
}

export function computeOutfitRarityFromItems(
  items: Array<{ rarityScore: number }>,
): OutfitRarity {
  if (items.length === 0) {
    return { score: 1, label: RARITY_LABELS[1] };
  }

  const total = items.reduce((sum, item) => sum + item.rarityScore, 0);
  const score = clampRarityScore(total / items.length);

  return {
    score,
    label: getRarityLabel(score),
  };
}

export function computeOutfitRarityFromLook(look: Look): OutfitRarity {
  return computeOutfitRarityFromItems(resolveLookItems(look));
}

export function formatRarityBadge(rarity: OutfitRarity): string {
  return `[ ${rarity.label} // SCORE: ${rarity.score}/5 ]`;
}

const RARITY_SHORT_LABELS: Record<RarityScore, string> = {
  1: "COMMON",
  2: "UNCOMMON",
  3: "RARE",
  4: "EPIC",
  5: "LEGENDARY",
};

export function getRarityShortLabel(score: RarityScore): string {
  return RARITY_SHORT_LABELS[score];
}

export function formatItemRarityIndicator(score: RarityScore): string {
  return `RARITY // ${getRarityShortLabel(score)}`;
}

/** Uniform teaser label — longest tier, used blurred until purchase unlock. */
export const LOCKED_ITEM_RARITY_PLACEHOLDER = "LEGENDARY";
