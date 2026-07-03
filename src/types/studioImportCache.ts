export const STUDIO_IMPORT_PIPELINES = ["segmented", "raw"] as const;

export type StudioImportPipeline = (typeof STUDIO_IMPORT_PIPELINES)[number];

export interface StudioImportCacheRecord {
  id: string;
  sourceHash: string;
  pipeline: StudioImportPipeline;
  assetUrl: string;
  storagePath: string;
  productName: string | null;
  category: string | null;
  brand: string | null;
  itemIdSlug: string;
  width: number;
  height: number;
  sourceUrl: string | null;
  sourceFilename: string | null;
  shopUrl: string | null;
  displayModel: string | null;
  estPriceRange: string | null;
  budgetAlternativeUrl: string | null;
  rarityScore: number;
  createdAt: string;
  lastUsedAt: string;
}

export function isStudioImportPipeline(value: string): value is StudioImportPipeline {
  return (STUDIO_IMPORT_PIPELINES as readonly string[]).includes(value);
}

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export function isValidSourceHash(value: string): boolean {
  return SHA256_HEX.test(value);
}
