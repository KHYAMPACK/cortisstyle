import type { GeneratedItemDraft } from "@/lib/itemDraft/types";

const REVEAL_VENUES = [
  "Cortis Archive Seoul",
  "Garosu-gil Concept Store",
  "Dongdaemun Vintage Market",
  "Itaewon Antiquity Lane",
  "Hanam Vintage Depot",
  "Apgujeong Private Sale",
];

export function revealDescription(blurredDescription: string): string {
  let index = 0;
  return blurredDescription.replace(
    /\[BLURRED\]/g,
    () => REVEAL_VENUES[index++ % REVEAL_VENUES.length],
  );
}

function escapeTsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatFashionMetaBlock(draft: GeneratedItemDraft): string {
  const v = draft.fashionVectors;
  const lines = [
    `  "${draft.id}": {`,
    `    displayModel: "${escapeTsString(v.displayModel ?? `${draft.brand} — ${draft.name}`)}",`,
    `    fitGuidance: {`,
    `      type: "${escapeTsString(v.fitGuidance.type)}",`,
    `      fabricWeight: "${escapeTsString(v.fitGuidance.fabricWeight)}",`,
  ];
  if (v.fitGuidance.modelSpecs) {
    lines.push(
      `      modelSpecs: "${escapeTsString(v.fitGuidance.modelSpecs)}",`,
    );
  }
  lines.push(
    `    },`,
    `    resaleKeywords: {`,
    `      tags: "${escapeTsString(v.resaleKeywords.tags)}",`,
    `      estPriceRange: "${escapeTsString(v.resaleKeywords.estPriceRange)}",`,
    `    },`,
    `    stylingExecution: {`,
    `      howToWear:`,
    `        "${escapeTsString(v.stylingExecution.howToWear)}",`,
    `      textureSynergy:`,
    `        "${escapeTsString(v.stylingExecution.textureSynergy)}",`,
    `    },`,
    `    budgetAlternativeLink: {`,
    `      name: "${escapeTsString(v.budgetAlternativeLink.name)}",`,
    `      url: "${escapeTsString(v.budgetAlternativeLink.url)}",`,
    `    },`,
    `  },`,
  );
  return lines.join("\n");
}

export function formatItemDraftSnippets(draft: GeneratedItemDraft): string {
  const defineItemBlock = [
    `  defineItem(`,
    `    "${draft.id}",`,
    `    "${escapeTsString(draft.name)}",`,
    `    "${draft.category}",`,
    `    "${escapeTsString(draft.brand)}",`,
    `    "${escapeTsString(draft.blurredDescription)}",`,
    `    "${escapeTsString(draft.unlockedDescription)}",`,
    `    "${escapeTsString(draft.shopUrl)}",`,
    `    {`,
    `      canvasImage: "${draft.canvasImage}",`,
    `      defaultCanvasPosition: {`,
    `        top: "10%",`,
    `        left: "10%",`,
    `        width: "20%",`,
    `        zIndex: 4,`,
    `      },`,
    `    },`,
    `  ),`,
  ].join("\n");

  return [
    "// --- REVIEW: inferred/guessed fields may need manual edits ---",
    draft.guessedFields?.length
      ? `// GUESSED: ${draft.guessedFields.join(", ")}`
      : "// GUESSED: (none flagged)",
    draft.llmNotes ? `// NOTE: ${draft.llmNotes}` : null,
    "",
    "// --- Paste into src/data/item-metadata.ts (clothingItemFashionMeta) ---",
    formatFashionMetaBlock(draft),
    "",
    "// --- Paste into src/data/item-rarity.ts (itemRarityScores) ---",
    `  "${draft.id}": ${draft.suggestedRarityScore},`,
    "",
    "// --- Paste into src/data/items.ts (clothingItems array) ---",
    defineItemBlock,
    "",
    "// Canvas coordinates: adjust via localhost collage editor, then update defaultCanvasPosition.",
  ]
    .filter(Boolean)
    .join("\n");
}
