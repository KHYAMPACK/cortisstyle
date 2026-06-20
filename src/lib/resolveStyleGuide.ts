import { getClothingItem } from "@/data/items";
import { getStyleGuideDefinition } from "@/data/style-guides";
import {
  formatLedgerTimestamp,
  generateIssueSerial,
} from "@/lib/certificate";
import {
  GUIDE_CANVAS_REFERENCE_WIDTH,
  resolveGuideAssetScaleMap,
} from "@/lib/guideAssetScale";
import { resolveCanvasLayouts } from "@/lib/canvasLayout";
import { resolveLookItems } from "@/lib/resolveLookItems";
import { computeOutfitRarityFromLook } from "@/lib/rarity";
import type { Look } from "@/types/look";
import type {
  ResolvedStyleGuide,
  ResolvedStyleGuideDirectoryItem,
  StyleGuideDefinition,
} from "@/types/style-guide";

interface ResolveStyleGuideOptions {
  buyerName: string;
  purchaseDate?: Date;
}

function resolveBrandModel(item: NonNullable<ReturnType<typeof getClothingItem>>) {
  return item.displayModel ?? `${item.brand} — ${item.name}`;
}

function resolveDirectoryItemFromClothing(
  itemId: string,
  assetScaleFactor: number,
  canvasWidthPx: number,
): ResolvedStyleGuideDirectoryItem | null {
  const item = getClothingItem(itemId);
  if (!item) return null;

  return {
    itemId: item.id,
    itemType: item.name,
    brandModel: resolveBrandModel(item),
    shopUrl: item.shopUrl,
    canvasImage: item.canvasImage,
    canvasWidthPx,
    assetScaleFactor,
    fitGuidance: item.fitGuidance,
    resaleKeywords: item.resaleKeywords,
    stylingExecution: item.stylingExecution,
    budgetAlternativeLink: item.budgetAlternativeLink,
  };
}

function resolveCanvasWidthPx(
  lookId: string,
  itemId: string,
  itemIds: string[],
): number {
  const items = itemIds
    .map((id) => getClothingItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const layouts = resolveCanvasLayouts(
    lookId,
    items,
    GUIDE_CANVAS_REFERENCE_WIDTH,
  );

  return layouts[itemId]?.widthPx ?? 48;
}

function buildFallbackDefinition(look: Look): StyleGuideDefinition {
  const items = resolveLookItems(look).slice(0, 5);
  const outfitRarity = computeOutfitRarityFromLook(look);

  return {
    lookId: look.id,
    pageOne: {
      title: look.title.toUpperCase(),
      subtitle: "STYLE GUIDE & SOURCE DIRECTORY",
      metadataLine: `ARCHIVE NO: CRT-${look.id.replace("look-", "LK").toUpperCase()} // STYLED BY: ${look.modelName.toUpperCase()} // RELEASE: 2026_V1`,
      directoryItemIds: items.map((item) => item.id),
    },
    pageTwo: {
      vaultTitle: "ARCHIVE VERIFICATION & CERTIFICATE OF DIGITAL OWNERSHIP",
      status: "UNLOCKED",
      ledgerAssets: items.map(
        (item) =>
          `[ UNLOCKED & TRANSFERRED ] 1× ${item.name} Asset`,
      ),
      synergySectionTitle: "UNIVERSAL CLOSET SYNERGY",
      synergyStat: `SYNERGY RATING: ${look.versatility * 18}% (Cross-compatibility with adjacent archive looks).`,
      qrSubtext:
        "Scan this code to instantly access your interactive Digital Wardrobe dashboard, mix-and-match your inventory, and track your closet value.",
      closingQuote:
        "Color outside the lines. Thank you for curating the archive.",
      outfitRarityLabel: outfitRarity.label,
      outfitRarityScore: outfitRarity.score,
    },
  };
}

export function resolveStyleGuide(
  look: Look,
  { buyerName, purchaseDate = new Date() }: ResolveStyleGuideOptions,
): ResolvedStyleGuide {
  const outfitRarity = computeOutfitRarityFromLook(look);
  const definition =
    getStyleGuideDefinition(look.id) ?? buildFallbackDefinition(look);
  const itemIds = definition.pageOne.directoryItemIds;
  const assetScaleMap = resolveGuideAssetScaleMap(look.id, itemIds);

  const directoryItems = itemIds
    .map((itemId) =>
      resolveDirectoryItemFromClothing(
        itemId,
        assetScaleMap[itemId] ?? 1,
        resolveCanvasWidthPx(look.id, itemId, itemIds),
      ),
    )
    .filter((item): item is ResolvedStyleGuideDirectoryItem => Boolean(item));

  return {
    lookId: look.id,
    buyerName,
    pageOne: {
      title: definition.pageOne.title,
      subtitle: definition.pageOne.subtitle,
      metadataLine: definition.pageOne.metadataLine,
      directoryItems,
    },
    pageTwo: {
      ...definition.pageTwo,
      outfitRarityLabel: outfitRarity.label,
      outfitRarityScore: outfitRarity.score,
      issueSerial: generateIssueSerial(look.id, buyerName),
      ledgerTimestamp: formatLedgerTimestamp(purchaseDate),
    },
  };
}
