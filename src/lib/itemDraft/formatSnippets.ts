import type { GeneratedItemDraft } from "@/lib/itemDraft/types";

function escapeTsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function formatItemDraftSnippets(draft: GeneratedItemDraft): string {
  const optionLines = [
    `    shopUrl: "${escapeTsString(draft.shopUrl)}",`,
    `    displayModel: "${escapeTsString(draft.displayModel ?? `${draft.brand} — ${draft.name}`)}",`,
    `    estPriceRange: "${escapeTsString(draft.estPriceRange)}",`,
    `    budgetAlternativeUrl: "${escapeTsString(draft.budgetAlternativeUrl)}",`,
  ];
  optionLines.push(
    `    canvasImage: "${draft.canvasImage}",`,
    "    defaultCanvasPosition: {",
    '      top: "10%",',
    '      left: "10%",',
    '      width: "20%",',
    "      zIndex: 4,",
    "    },",
  );

  const defineItemBlock = [
    "  defineItem(",
    `    "${draft.id}",`,
    `    "${escapeTsString(draft.name)}",`,
    `    "${draft.category}",`,
    `    "${escapeTsString(draft.brand)}",`,
    "    {",
    ...optionLines,
    "    },",
    "  ),",
  ].join("\n");

  return [
    "// --- REVIEW: inferred/guessed fields may need manual edits ---",
    draft.guessedFields?.length
      ? `// GUESSED: ${draft.guessedFields.join(", ")}`
      : "// GUESSED: (none flagged)",
    draft.llmNotes ? `// NOTE: ${draft.llmNotes}` : null,
    "",
    "// --- Paste into src/data/items.ts (clothingItems array) ---",
    defineItemBlock,
    "",
    "// Canvas coordinates: adjust via localhost collage editor, then update defaultCanvasPosition.",
  ]
    .filter(Boolean)
    .join("\n");
}
