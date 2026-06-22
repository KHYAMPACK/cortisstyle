import type { ClothingCategory, ItemFashionVectors } from "@/types/item";
import type { RarityScore } from "@/types/rarity";
import type { KnownItemContext } from "@/lib/itemDraft/inferItemContext";
import { normalizeBudgetAlternativeLink } from "@/lib/itemDraft/buildBudgetAlternativeSearchUrl";

const GENERIC_PHRASES = [
  "archive standard fit",
  "premium fashion-grade construction",
  "integrate the",
  "as a core layer within the curated look composition",
  "balanced texture contrast across adjacent archive pieces",
  "budget alternative",
  "archive label",
  "unknown brand",
];

function isGeneric(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return GENERIC_PHRASES.some((phrase) => lower.includes(phrase));
}

function guessFitType(category: ClothingCategory, name: string): string {
  const n = name.toLowerCase();
  if (category === "headwear") {
    if (/lace-up|knit cap|beanie/.test(n)) return "One-size Structured Knit";
    return "One-size Fit";
  }
  if (category === "tops") {
    if (/compression/.test(n)) return "Body-Contoured Compression Fit";
    if (/tank/.test(n)) return "Slim Sleeveless Fit";
    return "Regular Archive Fit";
  }
  if (category === "bottoms") {
    if (/baggy/.test(n)) return "Relaxed Baggy Silhouette";
    if (/bootcut/.test(n)) return "Mid-Rise Bootcut Silhouette";
    if (/short/.test(n)) return "Above-Knee Relaxed Fit";
    return "Straight Archive Silhouette";
  }
  if (category === "shoes") return "Standard Footwear Fit";
  return "Archive Accessory Proportion";
}

function guessFabricWeight(category: ClothingCategory, name: string): string {
  const n = name.toLowerCase();
  if (/knit|beanie|cap/.test(n)) return "Mid-weight cotton-acrylic knit blend";
  if (/denim|jean/.test(n)) return "12–14oz rigid denim";
  if (/compression/.test(n)) return "220gsm stretch nylon-spandex";
  if (/leather|bag/.test(n)) return "Structured leather or coated textile";
  if (/sunglasses|acetate/.test(n)) return "Hand-polished acetate or mixed material";
  if (/sneaker|shoe/.test(n)) return "Mixed textile and rubber panel upper";
  if (category === "accessories") return "Lightweight fashion-grade construction";
  if (category === "tops") return "Medium-weight cotton or synthetic blend";
  return "Fashion-grade construction";
}

function guessResaleTags(brand: string, name: string, category: ClothingCategory): string {
  const shortName = name.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
  return `${brand} ${shortName}, archive ${category} resale, Y2K streetwear`;
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

function guessHowToWear(category: ClothingCategory, name: string): string {
  const n = name.toLowerCase();
  if (category === "headwear" && /cap|beanie|knit/.test(n)) {
    return "Wear sitting high on the forehead to balance eyewear and top volume.";
  }
  if (category === "bottoms" && /bootcut|jean/.test(n)) {
    return "Let the hem break lightly over footwear to elongate the leg line.";
  }
  if (category === "shoes") {
    return "Ground wide-leg silhouettes — stack the hem lightly over the toe box.";
  }
  if (category === "tops" && /compression/.test(n)) {
    return "Keep hem tucked or half-tucked to expose hardware layers and jean rise.";
  }
  return `Style the ${name.toLowerCase()} as a focal piece within the outfit matrix.`;
}

function guessTextureSynergy(category: ClothingCategory, name: string): string {
  const n = name.toLowerCase();
  if (/knit|wool|acrylic/.test(n)) {
    return "Soft knit texture contrasts rigid denim and glossy hardware layers.";
  }
  if (/denim/.test(n)) return "Rigid denim gives structure against soft compression tops.";
  if (/leather|bag/.test(n)) return "Structured leather offsets matte knits without overpowering.";
  if (/sunglasses|acetate/.test(n)) {
    return "Gloss acetate offsets matte knit and denim without overpowering.";
  }
  if (category === "shoes") {
    return "Bulky sole anchors wide-leg denim and prevents top-heavy imbalance.";
  }
  return "Texture contrast against adjacent archive pieces in the look.";
}

function guessBudgetAlternative(category: ClothingCategory, name: string): {
  name: string;
  url: string;
} {
  const n = name.toLowerCase();
  if (/knit cap|beanie/.test(n)) {
    return { name: "Zara Ribbed Beanie Alternative", url: "https://www.zara.com/" };
  }
  if (/compression/.test(n)) {
    return { name: "Uniqlo AIRism Crew Alternative", url: "https://www.uniqlo.com/" };
  }
  if (/jean|denim|short/.test(n)) {
    return { name: "Forever 21 Low-Rise Denim Shorts Alternative", url: "https://www.forever21.com/" };
  }
  if (/sneaker/.test(n)) {
    return { name: "Nike P-6000 Alternative", url: "https://www.nike.com/" };
  }
  const defaults: Record<ClothingCategory, { name: string; url: string }> = {
    headwear: { name: "Uniqlo Knit Cap Alternative", url: "https://www.uniqlo.com/" },
    eyewear: { name: "ASOS Sunglasses Alternative", url: "https://www.asos.com/" },
    tops: { name: "Uniqlo U Tee Alternative", url: "https://www.uniqlo.com/" },
    outerwear: { name: "Uniqlo Denim Jacket Alternative", url: "https://www.uniqlo.com/" },
    bottoms: { name: "Uniqlo Wide Trouser Alternative", url: "https://www.uniqlo.com/" },
    shoes: { name: "New Balance 550 Alternative", url: "https://www.newbalance.com/" },
    bags: { name: "ASOS Tote Bag Alternative", url: "https://www.asos.com/" },
    waist: { name: "ASOS Belt Alternative", url: "https://www.asos.com/" },
    accessories: { name: "ASOS Accessory Alternative", url: "https://www.asos.com/" },
  };
  return defaults[category];
}

function isVenueBlurredDescription(value: string): boolean {
  const matches = value.match(/\[BLURRED\]/g);
  if (!matches || matches.length !== 2) return false;
  const templates = [
    /purchased from \[BLURRED\]/i,
    /sourced via \[BLURRED\]/i,
    /listed through \[BLURRED\]/i,
    /available at .+\[BLURRED\]/i,
    /sourced via \[BLURRED\].+\[BLURRED\]/i,
    /purchased from \[BLURRED\].+\[BLURRED\]/i,
  ];
  return templates.some((pattern) => pattern.test(value));
}

function guessBlurredDescription(retailer: string): string {
  if (retailer.includes("Rakuten") || retailer.includes("Japan")) {
    return "Sourced via [BLURRED] — Listed through [BLURRED] Japan archive channel.";
  }
  return "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].";
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
    fitGuidance?: { type?: string; fabricWeight?: string; modelSpecs?: string };
    resaleKeywords?: { tags?: string; estPriceRange?: string };
    stylingExecution?: { howToWear?: string; textureSynergy?: string };
    budgetAlternativeLink?: { name?: string; url?: string };
    blurredDescription?: string;
    suggestedRarityScore?: number;
    guessedFields?: string[];
    llmNotes?: string;
  },
  ctx: KnownItemContext,
): {
  brand: string;
  category: ClothingCategory;
  fashionVectors: ItemFashionVectors;
  blurredDescription: string;
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

  const fitType =
    payload.fitGuidance?.type?.trim() && !isGeneric(payload.fitGuidance.type)
      ? payload.fitGuidance.type.trim()
      : guessFitType(category, ctx.name);
  if (!payload.fitGuidance?.type?.trim() || isGeneric(payload.fitGuidance.type)) {
    guessedFields.add("fitGuidance.type");
  }

  const fabricWeight =
    payload.fitGuidance?.fabricWeight?.trim() &&
    !isGeneric(payload.fitGuidance.fabricWeight)
      ? payload.fitGuidance.fabricWeight.trim()
      : guessFabricWeight(category, ctx.name);
  if (
    !payload.fitGuidance?.fabricWeight?.trim() ||
    isGeneric(payload.fitGuidance.fabricWeight)
  ) {
    guessedFields.add("fitGuidance.fabricWeight");
  }

  const modelSpecs = payload.fitGuidance?.modelSpecs?.trim() || undefined;

  const resaleTags =
    payload.resaleKeywords?.tags?.trim() && !isGeneric(payload.resaleKeywords.tags)
      ? payload.resaleKeywords.tags.trim()
      : guessResaleTags(brand, ctx.name, category);
  if (!payload.resaleKeywords?.tags?.trim() || isGeneric(payload.resaleKeywords.tags)) {
    guessedFields.add("resaleKeywords.tags");
  }

  const priceRange =
    payload.resaleKeywords?.estPriceRange?.trim() &&
    !isGeneric(payload.resaleKeywords.estPriceRange)
      ? payload.resaleKeywords.estPriceRange.trim()
      : guessPriceRange(category, ctx.hints.price);
  if (
    !payload.resaleKeywords?.estPriceRange?.trim() ||
    isGeneric(payload.resaleKeywords.estPriceRange)
  ) {
    guessedFields.add("resaleKeywords.estPriceRange");
  }

  const howToWear =
    payload.stylingExecution?.howToWear?.trim() &&
    !isGeneric(payload.stylingExecution.howToWear)
      ? payload.stylingExecution.howToWear.trim()
      : guessHowToWear(category, ctx.name);
  if (
    !payload.stylingExecution?.howToWear?.trim() ||
    isGeneric(payload.stylingExecution.howToWear)
  ) {
    guessedFields.add("stylingExecution.howToWear");
  }

  const textureSynergy =
    payload.stylingExecution?.textureSynergy?.trim() &&
    !isGeneric(payload.stylingExecution.textureSynergy)
      ? payload.stylingExecution.textureSynergy.trim()
      : guessTextureSynergy(category, ctx.name);
  if (
    !payload.stylingExecution?.textureSynergy?.trim() ||
    isGeneric(payload.stylingExecution.textureSynergy)
  ) {
    guessedFields.add("stylingExecution.textureSynergy");
  }

  const budgetAltRaw =
    payload.budgetAlternativeLink?.name?.trim() &&
    payload.budgetAlternativeLink?.url?.trim() &&
    !isGeneric(payload.budgetAlternativeLink.name)
      ? {
          name: payload.budgetAlternativeLink.name.trim(),
          url: payload.budgetAlternativeLink.url.trim(),
        }
      : guessBudgetAlternative(category, ctx.name);
  if (
    !payload.budgetAlternativeLink?.name?.trim() ||
    isGeneric(payload.budgetAlternativeLink.name)
  ) {
    guessedFields.add("budgetAlternativeLink");
  }
  const budgetAlt = normalizeBudgetAlternativeLink(budgetAltRaw);

  const blurredCandidate = payload.blurredDescription?.trim();
  const blurredDescription =
    blurredCandidate && isVenueBlurredDescription(blurredCandidate)
      ? blurredCandidate
      : guessBlurredDescription(ctx.retailer);
  if (!blurredCandidate || !isVenueBlurredDescription(blurredCandidate)) {
    guessedFields.add("blurredDescription");
  }

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
    fashionVectors: {
      displayModel,
      fitGuidance: {
        type: fitType,
        fabricWeight,
        modelSpecs,
      },
      resaleKeywords: {
        tags: resaleTags,
        estPriceRange: priceRange,
      },
      stylingExecution: {
        howToWear,
        textureSynergy,
      },
      budgetAlternativeLink: budgetAlt,
    },
    blurredDescription,
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
