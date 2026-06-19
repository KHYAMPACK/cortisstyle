import { getClothingItem } from "@/data/items";
import { getStyleGuideDefinition } from "@/data/style-guides";
import {
  formatArchiveCode,
  formatCertificateLedgerTimestamp,
  formatSerialRegisterLine,
} from "@/lib/certificate";
import { resolveLookItems } from "@/lib/resolveLookItems";
import type { Look } from "@/types/look";
import type {
  ResolvedStyleGuide,
  StyleGuideDefinition,
  StyleGuideDirectoryItem,
} from "@/types/style-guide";

interface ResolveStyleGuideOptions {
  buyerName: string;
  purchaseDate?: Date;
}

function resolveDirectoryItem(
  entry: StyleGuideDirectoryItem,
): ResolvedStyleGuide["pageOne"]["directoryItems"][number] {
  const item = getClothingItem(entry.itemId);

  return {
    ...entry,
    shopUrl: entry.shopUrl ?? item?.shopUrl ?? "https://shopier.com/cortis",
  };
}

function buildFallbackDefinition(look: Look): StyleGuideDefinition {
  const items = resolveLookItems(look).slice(0, 5);

  return {
    lookId: look.id,
    pageOne: {
      title: look.title.toUpperCase(),
      subtitle: "STYLE GUIDE & SOURCE DIRECTORY",
      metadataLine: `ARCHIVE NO: ${formatArchiveCode(look.id)} // STYLED BY: ${look.modelName.toUpperCase()} // RELEASE: 2026_V1`,
      directoryItems: items.map((item) => ({
        itemId: item.id,
        itemType: item.name,
        brandModel: item.brand,
        proportionTip: item.unlockedDescription,
        budgetAlternative: "Search Depop or Grailed for comparable archive pieces.",
      })),
    },
    pageTwo: {
      certificateTitle: "CERTIFICATE OF DIGITAL OWNERSHIP",
      certificateSubtitle:
        "CORTIS STYLE ARCHIVE // DIGITAL VAULT VERIFICATION",
      archiveCode: formatArchiveCode(look.id),
      assetReceiptItems: items.map((item) => `1× ${item.name} Asset`),
      synergyRating: `${look.versatility * 18}%`,
      synergyNote: "Cross-compatibility with adjacent archive looks.",
      qrColumnLabel: `SCAN TO ACCESS DIGITAL CLOSET WARDROBE. SYNERGY RATING: ${look.versatility * 18}%.`,
      emblemLabel: "OFFICIAL ARCHIVE SEAL",
      curatorSignature: "CORTIS STYLE CURATOR",
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
  const trimmedBuyerName = buyerName.trim() || "Archive Curator";

  return {
    lookId: look.id,
    buyerName: trimmedBuyerName,
    pageOne: {
      title: definition.pageOne.title,
      subtitle: definition.pageOne.subtitle,
      metadataLine: definition.pageOne.metadataLine,
      directoryItems: definition.pageOne.directoryItems.map(resolveDirectoryItem),
    },
    pageTwo: {
      ...definition.pageTwo,
      holderName: trimmedBuyerName.toUpperCase(),
      serialRegisterLine: formatSerialRegisterLine(look.id, trimmedBuyerName),
      ledgerTimestamp: formatCertificateLedgerTimestamp(purchaseDate),
      status: "SECURED & VERIFIED",
    },
  };
}
