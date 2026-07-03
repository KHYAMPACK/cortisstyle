import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from "@/lib/lookCanvasReference";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ClothingCategory, ClothingItem, CanvasPosition } from "@/types/item";
import type { Look } from "@/types/look";
import type { MetricRating } from "@/types/style-metrics";
import type {
  DynamicCatalogBundle,
  DynamicItemsJson,
  DynamicLookJson,
  HomepageOrderPlacement,
} from "@/lib/dynamicLooks/types";

const DEFAULT_EST_PRICE_RANGE = "Contact archive for pricing";
const DEFAULT_BUDGET_ALTERNATIVE_URL = "https://www.forever21.com/";
const DEFAULT_IMAGE_WIDTH = 1700;
const DEFAULT_IMAGE_HEIGHT = 2500;

const CLOTHING_CATEGORIES = new Set<ClothingCategory>([
  "headwear",
  "eyewear",
  "tops",
  "outerwear",
  "bottoms",
  "shoes",
  "bags",
  "waist",
  "accessories",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readUrlField(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value.trim();
  }
  return fallback;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeCanvasPosition(value: unknown): CanvasPosition | undefined {
  if (!isRecord(value)) return undefined;

  const top = readString(value.top);
  const left = readString(value.left);
  const width = readString(value.width);
  const zIndex = readNumber(value.zIndex);

  if (!top || !left || !width || zIndex === undefined) return undefined;

  return { top, left, width, zIndex };
}

function normalizeCanvasItemLayout(value: unknown): CanvasItemLayout | null {
  if (!isRecord(value)) return null;

  const top = readString(value.top);
  const left = readString(value.left);
  const zIndex = readNumber(value.zIndex);

  if (!top || !left || zIndex === undefined) return null;

  const layout: CanvasItemLayout = { top, left, zIndex };

  const widthPx = readNumber(value.widthPx);
  if (widthPx !== undefined) layout.widthPx = Math.round(widthPx);

  const hitboxWidthPx = readNumber(value.hitboxWidthPx);
  if (hitboxWidthPx !== undefined) layout.hitboxWidthPx = Math.round(hitboxWidthPx);

  const hitboxHeightPx = readNumber(value.hitboxHeightPx);
  if (hitboxHeightPx !== undefined) {
    layout.hitboxHeightPx = Math.round(hitboxHeightPx);
  }

  const hitboxOffsetTopPx = readNumber(value.hitboxOffsetTopPx);
  if (hitboxOffsetTopPx !== undefined) {
    layout.hitboxOffsetTopPx = Math.round(hitboxOffsetTopPx);
  }

  const hitboxOffsetLeftPx = readNumber(value.hitboxOffsetLeftPx);
  if (hitboxOffsetLeftPx !== undefined) {
    layout.hitboxOffsetLeftPx = Math.round(hitboxOffsetLeftPx);
  }

  return layout;
}

/** Ensure widthPx exists when only percentage width is provided (420×630 reference). */
export function calibrateLayoutToReferenceSpace(
  layout: CanvasItemLayout,
  containerWidth = LOOK_CANVAS_REFERENCE_WIDTH,
): CanvasItemLayout {
  if (layout.widthPx !== undefined) return layout;

  return layout;
}

export function layoutFromDefaultPositionPercent(
  position: CanvasPosition,
  containerWidth = LOOK_CANVAS_REFERENCE_WIDTH,
): CanvasItemLayout {
  const widthPercent = Number.parseFloat(position.width.replace("%", ""));
  const widthPx = Math.round((widthPercent / 100) * containerWidth);

  return {
    top: position.top,
    left: position.left,
    widthPx,
    zIndex: position.zIndex,
  };
}

function normalizeClothingItem(value: unknown): ClothingItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const name = readString(value.name);
  const category = readString(value.category) as ClothingCategory | undefined;
  const brand = readString(value.brand) ?? "Archive";

  if (!id || !name || !category || !CLOTHING_CATEGORIES.has(category)) {
    return null;
  }

  return {
    id,
    name,
    category,
    brand,
    shopUrl: readUrlField(value.shopUrl, `https://shopier.com/cortis/${id}`),
    displayModel: readString(value.displayModel),
    estPriceRange: readString(value.estPriceRange) ?? DEFAULT_EST_PRICE_RANGE,
    budgetAlternativeUrl: readUrlField(
      value.budgetAlternativeUrl,
      DEFAULT_BUDGET_ALTERNATIVE_URL,
    ),
    canvasImage: readString(value.canvasImage),
    defaultCanvasPosition: normalizeCanvasPosition(value.defaultCanvasPosition),
  };
}

export function parseDynamicItemsPayload(
  raw: unknown,
  sourceLabel: string,
): ClothingItem[] {
  if (!isRecord(raw)) {
    console.warn(`[dynamic-looks] Skipping ${sourceLabel}: root must be an object.`);
    return [];
  }

  const entries = Array.isArray(raw.items)
    ? raw.items
    : isRecord(raw.items)
      ? Object.values(raw.items)
      : null;

  if (!entries) {
    console.warn(`[dynamic-looks] Skipping ${sourceLabel}: missing items array.`);
    return [];
  }

  const parsed: ClothingItem[] = [];

  for (const entry of entries) {
    const item = normalizeClothingItem(entry);
    if (item) {
      parsed.push(item);
      continue;
    }

    console.warn(`[dynamic-looks] Skipping invalid item in ${sourceLabel}.`);
  }

  return parsed;
}

function normalizeLookPlacements(raw: unknown): Look["items"] {
  if (!Array.isArray(raw)) return [];

  const placements: Look["items"] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;

    const itemId = readString(entry.itemId);
    const coordinates = entry.coordinates;

    if (!itemId || !isRecord(coordinates)) continue;

    const from = coordinates.from;
    const to = coordinates.to;

    if (!isRecord(from) || !isRecord(to)) continue;

    const fromTop = readString(from.top);
    const fromLeft = readString(from.left);
    const toTop = readString(to.top);
    const toLeft = readString(to.left);

    if (!fromTop || !fromLeft || !toTop || !toLeft) continue;

    placements.push({
      itemId,
      coordinates: {
        from: { top: fromTop, left: fromLeft },
        to: { top: toTop, left: toLeft },
      },
    });
  }

  return placements;
}

function normalizeCanvasLayouts(
  raw: unknown,
): Record<string, CanvasItemLayout> {
  if (!isRecord(raw)) return {};

  const layouts: Record<string, CanvasItemLayout> = {};

  for (const [itemId, value] of Object.entries(raw)) {
    const layout = normalizeCanvasItemLayout(value);
    if (layout) {
      layouts[itemId] = calibrateLayoutToReferenceSpace(layout);
    }
  }

  return layouts;
}

function clampMetricRating(value: unknown, fallback: MetricRating): MetricRating {
  const numeric = readNumber(value) ?? fallback;
  return Math.max(1, Math.min(5, Math.round(numeric))) as MetricRating;
}

export function parseDynamicLookPayload(
  raw: unknown,
  sourceLabel: string,
): {
  look: Look | null;
  canvasLayouts: Record<string, CanvasItemLayout>;
  homepageOrder: HomepageOrderPlacement;
} {
  if (!isRecord(raw)) {
    console.warn(`[dynamic-looks] Skipping ${sourceLabel}: root must be an object.`);
    return { look: null, canvasLayouts: {}, homepageOrder: "append" };
  }

  const payload = raw as Partial<DynamicLookJson>;
  const id = readString(payload.id);
  const title = readString(payload.title);
  const image = readString(payload.image);
  const modelName = readString(payload.modelName);
  const vibe = readString(payload.vibe);

  if (!id || !title || !image || !modelName || !vibe) {
    console.warn(`[dynamic-looks] Skipping ${sourceLabel}: missing required look fields.`);
    return { look: null, canvasLayouts: {}, homepageOrder: "append" };
  }

  const homepageOrder =
    payload.homepageOrder === "prepend" ? "prepend" : "append";

  const look: Look = {
    id,
    title,
    image,
    modelName,
    tiktokHandle: readString(payload.tiktokHandle),
    category: readString(payload.category),
    layout: payload.layout === "single-image" ? "single-image" : "collage",
    outfitId: readString(payload.outfitId),
    editorGuideImage: readString(payload.editorGuideImage),
    vibe,
    investmentRetail: clampMetricRating(payload.investmentRetail, 3),
    investmentWithGuide: clampMetricRating(payload.investmentWithGuide, 2),
    versatility: clampMetricRating(payload.versatility, 3),
    width: readNumber(payload.width) ?? DEFAULT_IMAGE_WIDTH,
    height: readNumber(payload.height) ?? DEFAULT_IMAGE_HEIGHT,
    items: normalizeLookPlacements(payload.items),
  };

  const canvasLayouts = normalizeCanvasLayouts(payload.canvasLayouts);

  return { look, canvasLayouts, homepageOrder };
}

export function buildCanvasLayoutsFromItems(
  items: ClothingItem[],
): Record<string, Record<string, CanvasItemLayout>> {
  const byLook: Record<string, Record<string, CanvasItemLayout>> = {};

  for (const item of items) {
    if (!item.defaultCanvasPosition) continue;
    // Items file does not encode look id — layouts belong on the look JSON.
    void item;
  }

  return byLook;
}

export function mergeDynamicCatalogBundles(
  ...bundles: DynamicCatalogBundle[]
): DynamicCatalogBundle {
  const itemMap = new Map<string, ClothingItem>();
  const lookMap = new Map<string, Look>();
  const lookOrderAdditions: DynamicCatalogBundle["lookOrderAdditions"] = [];
  const canvasLayoutsByLookId: Record<
    string,
    Record<string, CanvasItemLayout>
  > = {};

  for (const bundle of bundles) {
    for (const item of bundle.items) {
      itemMap.set(item.id, item);
    }

    for (const look of bundle.looks) {
      lookMap.set(look.id, look);
    }

    lookOrderAdditions.push(...bundle.lookOrderAdditions);

    for (const [lookId, layouts] of Object.entries(bundle.canvasLayoutsByLookId)) {
      canvasLayoutsByLookId[lookId] = {
        ...(canvasLayoutsByLookId[lookId] ?? {}),
        ...layouts,
      };
    }
  }

  return {
    items: [...itemMap.values()],
    looks: [...lookMap.values()],
    lookOrderAdditions,
    canvasLayoutsByLookId,
  };
}

/** Derive canvas layouts from item defaults when look JSON omits canvasLayouts. */
export function deriveCanvasLayoutsForLook(
  look: Look,
  itemById: Map<string, ClothingItem>,
): Record<string, CanvasItemLayout> {
  const layouts: Record<string, CanvasItemLayout> = {};

  for (const placement of look.items) {
    const item = itemById.get(placement.itemId);
    if (!item?.defaultCanvasPosition) continue;

    layouts[placement.itemId] = layoutFromDefaultPositionPercent(
      item.defaultCanvasPosition,
      LOOK_CANVAS_REFERENCE_WIDTH,
    );
  }

  return layouts;
}

export function finalizeDynamicCatalog(
  bundle: DynamicCatalogBundle,
): DynamicCatalogBundle {
  const itemById = new Map(bundle.items.map((item) => [item.id, item]));
  const canvasLayoutsByLookId = { ...bundle.canvasLayoutsByLookId };

  for (const look of bundle.looks) {
    if (Object.keys(canvasLayoutsByLookId[look.id] ?? {}).length > 0) continue;

    const derived = deriveCanvasLayoutsForLook(look, itemById);
    if (Object.keys(derived).length > 0) {
      canvasLayoutsByLookId[look.id] = derived;
    }
  }

  return {
    ...bundle,
    canvasLayoutsByLookId,
  };
}

export type { DynamicItemsJson, DynamicLookJson };
