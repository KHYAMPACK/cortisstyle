import type {
  BudgetAlternativeLink,
  FitGuidance,
  ResaleKeywords,
  StylingExecution,
} from "@/types/item";

export interface StyleGuidePageOne {
  title: string;
  subtitle: string;
  metadataLine: string;
  directoryItemIds: string[];
}

export interface StyleGuidePageTwo {
  vaultTitle: string;
  status: string;
  ledgerAssets: string[];
  synergySectionTitle: string;
  synergyStat: string;
  qrSubtext: string;
  closingQuote: string;
}

export interface StyleGuideDefinition {
  lookId: string;
  pageOne: StyleGuidePageOne;
  pageTwo: StyleGuidePageTwo;
}

export interface ResolvedStyleGuideDirectoryItem {
  itemId: string;
  itemType: string;
  brandModel: string;
  shopUrl: string;
  canvasImage?: string;
  canvasWidthPx: number;
  assetScaleFactor: number;
  fitGuidance: FitGuidance;
  resaleKeywords: ResaleKeywords;
  stylingExecution: StylingExecution;
  budgetAlternativeLink: BudgetAlternativeLink;
}

export interface ResolvedStyleGuide {
  lookId: string;
  buyerName: string;
  pageOne: Omit<StyleGuidePageOne, "directoryItemIds"> & {
    directoryItems: ResolvedStyleGuideDirectoryItem[];
  };
  pageTwo: StyleGuidePageTwo & {
    issueSerial: string;
    ledgerTimestamp: string;
  };
}
