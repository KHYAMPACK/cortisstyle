import type { ClothingCategory } from "@/types/item";
import type { RarityScore } from "@/types/rarity";
import type { KnownItemContext } from "@/lib/itemDraft/inferItemContext";
import { normalizeBudgetAlternativeLink } from "@/lib/itemDraft/buildBudgetAlternativeSearchUrl";

const GENERIC_PHRASES = [
  "contact archive for pricing",
  "budget alternative",
  "archive label",
  "unknown brand",
];

function isGeneric(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return GENERIC_PHRASES.some((phrase) => lower.includes(phrase));
}

function guessPriceRange(category: ClothingCategory, hintsPrice?: string): string {
  if (hintsPrice) return `$${hintsPrice} retail — check Grailed/Depop for resale`;
  const ranges: Record<ClothingCategory, string> = {
    headwear: "$20 - $60 on Grailed/Depop",
    eyewear: "$25 - $120 on Grailed/Vestiaire",
    tops: "$35 - $120 on Grailed/Depop",
    outerwear: "$60 - $250 on Grailed/Vestiaire",
    bottoms: "$45 - $150 on Grailed/Depop",
    shoes: "$80 - $350 on Grailed/GOAT",
    bags: "$40 - $300 on Grailed/Vestiaire",
    waist: "$25 - $150 on Grailed/Vestiaire",
    accessories: "$25 - $200 on Grailed/Vestiaire",
  };
  return ranges[category];
}

function guessBudgetAlternative(category: ClothingCategory): string {
  const defaults: Record<ClothingCategory, string> = {
    headwear: "https://www.uniqlo.com/",
    eyewear: "https://www.asos.com/",
    tops: "https://www.uniqlo.com/",
    outerwear: "https://www.uniqlo.com/",
    bottoms: "https://www.uniqlo.com/",
    shoes: "https://www.newbalance.com/",
    bags: "https://www.asos.com/",
    waist: "https://www.asos.com/",
    accessories: "https://www.asos.com/",
  };
  return defaults[category];
}

function guessRarity(category: ClothingCategory, name: string): RarityScore {
  const n = name.toLowerCase();
  if (/(balenciaga|chanel|margiela|archive|vintage|limited)/.test(n)) return 4;
  if (category === "accessories" && /necklace|bracelet/.test(n)) return 3;
  if (category === "headwear") return 3;
  return 2;
}

export function applySmartGuesses(
  payload: {
    brand?: string;
    category?: string;
    displayModel?: string;
    estPriceRange?: string;
    budgetAlternativeUrl?: string;
    suggestedRarityScore?: number;
    guessedFields?: string[];
    llmNotes?: string;
  },
  ctx: KnownItemContext,
): {
  brand: string;
  category: ClothingCategory;
  displayModel: string;
  estPriceRange: string;
  budgetAlternativeUrl: string;
  suggestedRarityScore: RarityScore;
  guessedFields: string[];
  llmNotes?: string;
} {
  const guessedFields = new Set<string>();
  const category = (payload.category?.trim().toLowerCase() ||
    ctx.category) as ClothingCategory;

  let brand = ctx.brandOverride ?? payload.brand?.trim() ?? ctx.brand;
  if (!payload.brand?.trim() && !ctx.brandOverride && !ctx.hints.brand) {
    guessedFields.add("brand");
  }
  if (brand === "Unknown Brand" || brand === "Archive Label") {
    brand = inferBrandFromNameFallback(ctx.name) ?? brand;
    guessedFields.add("brand");
  }

  const displayModel =
    payload.displayModel?.trim() ||
    `${brand} — ${ctx.name}`;
  if (!payload.displayModel?.trim()) guessedFields.add("displayModel");

  const estPriceRange =
    payload.estPriceRange?.trim() && !isGeneric(payload.estPriceRange)
      ? payload.estPriceRange.trim()
      : guessPriceRange(category, ctx.hints.price);
  if (!payload.estPriceRange?.trim() || isGeneric(payload.estPriceRange)) {
    guessedFields.add("estPriceRange");
  }

  const budgetAltRaw = payload.budgetAlternativeUrl?.trim()
    ? { name: "Budget Alternative", url: payload.budgetAlternativeUrl.trim() }
    : { name: "Budget Alternative", url: guessBudgetAlternative(category) };
  if (!payload.budgetAlternativeUrl?.trim()) {
    guessedFields.add("budgetAlternativeUrl");
  }
  const budgetAlternativeUrl = normalizeBudgetAlternativeLink(budgetAltRaw).url;

  let suggestedRarityScore = payload.suggestedRarityScore;
  if (suggestedRarityScore == null || Number.isNaN(suggestedRarityScore)) {
    suggestedRarityScore = guessRarity(category, ctx.name);
    guessedFields.add("suggestedRarityScore");
  }
  const rarity = Math.min(5, Math.max(1, Math.round(suggestedRarityScore))) as RarityScore;

  const reviewNote =
    guessedFields.size > 0
      ? `Draft includes ${guessedFields.size} inferred field(s) — review before publishing.`
      : "All fields sourced from provided data or LLM confidence.";

  for (const field of payload.guessedFields ?? []) {
    guessedFields.add(field);
  }

  return {
    brand,
    category,
    displayModel,
    estPriceRange,
    budgetAlternativeUrl,
    suggestedRarityScore: rarity,
    guessedFields: [...guessedFields],
    llmNotes: payload.llmNotes?.trim()
      ? `${payload.llmNotes.trim()} ${reviewNote}`
      : reviewNote,
  };
}

function inferBrandFromNameFallback(name: string): string | undefined {
  const match = name.match(/^(.+?)\s[-–—|]\s+/);
  return match?.[1]?.trim();
}
