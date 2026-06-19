export interface StyleGuideDirectoryItem {
  itemId: string;
  itemType: string;
  brandModel: string;
  proportionTip: string;
  budgetAlternative: string;
  shopUrl?: string;
}

export interface StyleGuidePageOne {
  title: string;
  subtitle: string;
  metadataLine: string;
  directoryItems: StyleGuideDirectoryItem[];
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

export interface ResolvedStyleGuideDirectoryItem extends StyleGuideDirectoryItem {
  shopUrl: string;
}

export interface ResolvedStyleGuide {
  lookId: string;
  buyerName: string;
  pageOne: Omit<StyleGuidePageOne, "directoryItems"> & {
    directoryItems: ResolvedStyleGuideDirectoryItem[];
  };
  pageTwo: StyleGuidePageTwo & {
    issueSerial: string;
    ledgerTimestamp: string;
  };
}
