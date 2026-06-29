import { refreshClothingItemRegistry } from "@/data/items";
import { getLooks, refreshLooksRegistry } from "@/data/looks";
import { loadDynamicLooksFromDisk } from "@/lib/dynamicLooks/loadFromDisk";
import { registerDiskDynamicCatalog } from "@/lib/dynamicLooks/registry";
import type { DynamicCatalogBundle } from "@/lib/dynamicLooks/types";

/**
 * Crawl src/data/dynamic-looks/ on the server and hydrate runtime registries.
 * Call from Server Components before reading getLooks() / getClothingItem().
 */
export function buildCatalogFromDisk(): DynamicCatalogBundle {
  const bundle = loadDynamicLooksFromDisk();
  registerDiskDynamicCatalog(bundle);
  refreshClothingItemRegistry();
  refreshLooksRegistry();
  return bundle;
}

export function getResolvedLooks() {
  return getLooks();
}
