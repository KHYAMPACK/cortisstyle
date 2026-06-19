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
  certificateTitle: string;
  certificateSubtitle: string;
  archiveCode: string;
  assetReceiptItems: string[];
  synergyRating: string;
  synergyNote: string;
  qrColumnLabel: string;
  emblemLabel: string;
  curatorSignature: string;
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

export interface ResolvedStyleGuidePageTwo extends StyleGuidePageTwo {
  holderName: string;
  serialRegisterLine: string;
  ledgerTimestamp: string;
  status: string;
}

export interface ResolvedStyleGuide {
  lookId: string;
  buyerName: string;
  pageOne: Omit<StyleGuidePageOne, "directoryItems"> & {
    directoryItems: ResolvedStyleGuideDirectoryItem[];
  };
  pageTwo: ResolvedStyleGuidePageTwo;
}
