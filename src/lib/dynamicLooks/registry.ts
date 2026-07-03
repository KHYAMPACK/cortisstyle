import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ClothingItem } from "@/types/item";
import type { Look } from "@/types/look";
import type {
  DynamicCatalogBundle,
  HomepageOrderPlacement,
} from "@/lib/dynamicLooks/types";
import { EMPTY_DYNAMIC_CATALOG } from "@/lib/dynamicLooks/types";

let diskCatalog: DynamicCatalogBundle | null = null;

/** Inject fs-crawled catalog (see buildCatalogFromDisk). */
export function registerDiskDynamicCatalog(bundle: DynamicCatalogBundle): void {
  diskCatalog = bundle;
}

export function getDynamicCatalog(): DynamicCatalogBundle {
  return diskCatalog ?? EMPTY_DYNAMIC_CATALOG;
}

export function mergeHomepageLookOrder(
  legacyOrder: readonly string[],
  additions: Array<{ id: string; placement: HomepageOrderPlacement }>,
): string[] {
  const order = [...legacyOrder];

  for (const { id, placement } of additions) {
    if (order.includes(id)) continue;

    if (placement === "prepend") {
      order.unshift(id);
    } else {
      order.push(id);
    }
  }

  return order;
}

export function buildClothingItemMap(
  legacyItems: ClothingItem[],
  dynamicItems: ClothingItem[],
): Map<string, ClothingItem> {
  const map = new Map<string, ClothingItem>();

  for (const item of legacyItems) {
    map.set(item.id, item);
  }

  for (const item of dynamicItems) {
    map.set(item.id, item);
  }

  return map;
}

export function buildLooksById(
  legacyLooks: Look[],
  dynamicLooks: Look[],
): Map<string, Look> {
  const map = new Map<string, Look>();

  for (const look of legacyLooks) {
    map.set(look.id, look);
  }

  for (const look of dynamicLooks) {
    map.set(look.id, look);
  }

  return map;
}

export function resolveLooksStream(
  lookOrder: readonly string[],
  looksById: Map<string, Look>,
): Look[] {
  return lookOrder.flatMap((id) => {
    const look = looksById.get(id);
    return look ? [look] : [];
  });
}

export function getDynamicCanvasLayouts(
  lookId: string,
): Record<string, CanvasItemLayout> | undefined {
  const layouts = getDynamicCatalog().canvasLayoutsByLookId[lookId];
  return layouts && Object.keys(layouts).length > 0 ? layouts : undefined;
}

export function getDynamicCategories() {
  return getDynamicCatalog().categories;
}

export { EMPTY_DYNAMIC_CATALOG };
