import { getClothingItem } from "@/data/items";
import { getStyleGuideDefinition } from "@/data/style-guides";
import {
  formatLedgerTimestamp,
  generateIssueSerial,
} from "@/lib/certificate";
import { resolveLookItems } from "@/lib/resolveLookItems";
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
): ResolvedStyleGuideDirectoryItem | null {
  const item = getClothingItem(itemId);
  if (!item) return null;

  return {
    itemId: item.id,
    itemType: item.name,
    brandModel: resolveBrandModel(item),
    shopUrl: item.shopUrl,
    canvasImage: item.canvasImage,
    fitGuidance: item.fitGuidance,
    resaleKeywords: item.resaleKeywords,
    stylingExecution: item.stylingExecution,
    budgetAlternativeLink: item.budgetAlternativeLink,
  };
}

function buildFallbackDefinition(look: Look): StyleGuideDefinition {
  const items = resolveLookItems(look).slice(0, 5);

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
    },
  };
}

export function resolveStyleGuide(
  look: Look,
  { buyerName, purchaseDate = new Date() }: ResolveStyleGuideOptions,
): ResolvedStyleGuide {
  const definition =
    getStyleGuideDefinition(look.id) ?? buildFallbackDefinition(look);

  const directoryItems = definition.pageOne.directoryItemIds
    .map(resolveDirectoryItemFromClothing)
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
      issueSerial: generateIssueSerial(look.id, buyerName),
      ledgerTimestamp: formatLedgerTimestamp(purchaseDate),
    },
  };
}
