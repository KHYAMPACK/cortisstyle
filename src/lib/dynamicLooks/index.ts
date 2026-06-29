import type { DynamicCatalogBundle } from "@/lib/dynamicLooks/types";

export type {
  DynamicCatalogBundle,
  DynamicItemsJson,
  DynamicLookJson,
  HomepageOrderPlacement,
} from "@/lib/dynamicLooks/types";

export {
  calibrateLayoutToReferenceSpace,
  layoutFromDefaultPositionPercent,
  parseDynamicItemsPayload,
  parseDynamicLookPayload,
} from "@/lib/dynamicLooks/normalize";

export { crawlDynamicLooksDirectory, loadDynamicLooksFromDisk } from "@/lib/dynamicLooks/loadFromDisk";

export {
  buildClothingItemMap,
  buildLooksById,
  getDynamicCanvasLayouts,
  getDynamicCatalog,
  mergeHomepageLookOrder,
  registerDiskDynamicCatalog,
  resolveLooksStream,
} from "@/lib/dynamicLooks/registry";

export function isDynamicCatalogEmpty(bundle: DynamicCatalogBundle): boolean {
  return bundle.items.length === 0 && bundle.looks.length === 0;
}
