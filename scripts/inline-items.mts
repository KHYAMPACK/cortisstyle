import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clothingItems } from "../src/data/items";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function escape(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const defaultBudget = "https://www.forever21.com/";
const defaultPrice = "Contact archive for pricing";

const blocks = clothingItems.map((item) => {
  const opts: string[] = [];
  if (item.shopUrl !== `https://shopier.com/cortis/${item.id}`) {
    opts.push(`      shopUrl: "${escape(item.shopUrl)}",`);
  }
  if (item.displayModel) {
    opts.push(`      displayModel: "${escape(item.displayModel)}",`);
  }
  if (item.estPriceRange !== defaultPrice) {
    opts.push(`      estPriceRange: "${escape(item.estPriceRange)}",`);
  }
  if (item.budgetAlternativeUrl !== defaultBudget) {
    opts.push(
      `      budgetAlternativeUrl: "${escape(item.budgetAlternativeUrl)}",`,
    );
  }
  if (item.rarityScore !== 1) {
    opts.push(`      rarityScore: ${item.rarityScore},`);
  }
  if (item.canvasImage) {
    opts.push(`      canvasImage: "${escape(item.canvasImage)}",`);
  }
  if (item.defaultCanvasPosition) {
    const p = item.defaultCanvasPosition;
    opts.push(
      "      defaultCanvasPosition: {",
      `        top: "${p.top}",`,
      `        left: "${p.left}",`,
      `        width: "${p.width}",`,
      `        zIndex: ${p.zIndex},`,
      "      },",
    );
  }

  return [
    "  defineItem(",
    `    "${item.id}",`,
    `    "${escape(item.name)}",`,
    `    "${item.category}",`,
    `    "${escape(item.brand)}",`,
    "    {",
    ...opts,
    "    },",
    "  ),",
  ].join("\n");
});

const output = `import type { ClothingCategory, ClothingItem, CanvasPosition } from "@/types/item";
import type { RarityScore } from "@/types/rarity";

const DEFAULT_EST_PRICE_RANGE = "Contact archive for pricing";
const DEFAULT_BUDGET_ALTERNATIVE_URL = "https://www.forever21.com/";

interface DefineItemOptions {
  shopUrl?: string;
  displayModel?: string;
  estPriceRange?: string;
  budgetAlternativeUrl?: string;
  rarityScore?: RarityScore;
  canvasImage?: string;
  defaultCanvasPosition?: CanvasPosition;
}

function defineItem(
  id: string,
  name: string,
  category: ClothingCategory,
  brand: string,
  options: DefineItemOptions = {},
): ClothingItem {
  const {
    shopUrl,
    displayModel,
    estPriceRange,
    budgetAlternativeUrl,
    rarityScore,
    canvasImage,
    defaultCanvasPosition,
  } = options;

  return {
    id,
    name,
    category,
    brand,
    shopUrl: shopUrl ?? \`https://shopier.com/cortis/\${id}\`,
    displayModel,
    estPriceRange: estPriceRange ?? DEFAULT_EST_PRICE_RANGE,
    budgetAlternativeUrl:
      budgetAlternativeUrl ?? DEFAULT_BUDGET_ALTERNATIVE_URL,
    rarityScore: rarityScore ?? 1,
    canvasImage,
    defaultCanvasPosition,
  };
}

export const clothingItems: ClothingItem[] = [
${blocks.join("\n")}
];

const clothingItemMap = new Map(
  clothingItems.map((item) => [item.id, item]),
);

export function getClothingItem(id: string): ClothingItem | undefined {
  return clothingItemMap.get(id);
}
`;

fs.writeFileSync(path.join(root, "src/data/items.ts"), output, "utf8");
console.log(`Inlined ${clothingItems.length} items.`);
