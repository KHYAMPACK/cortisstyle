import { getClothingItem } from "@/data/items";
import { resolveCanvasLayouts } from "@/lib/canvasLayout";

/** Matches the collage editor reference width used when resolving layout px values. */
export const GUIDE_CANVAS_REFERENCE_WIDTH = 600;

/** Smallest relative footprint so tiny accessories remain legible. */
export const GUIDE_ASSET_MIN_RELATIVE_SCALE = 0.32;

export function resolveGuideAssetScaleMap(
  lookId: string,
  itemIds: string[],
): Record<string, number> {
  const items = itemIds
    .map((id) => getClothingItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const layouts = resolveCanvasLayouts(
    lookId,
    items,
    GUIDE_CANVAS_REFERENCE_WIDTH,
  );

  const widths = itemIds.map((id) => ({
    id,
    widthPx: layouts[id]?.widthPx ?? 48,
  }));

  const maxWidthPx = Math.max(...widths.map((entry) => entry.widthPx), 1);

  return Object.fromEntries(
    widths.map(({ id, widthPx }) => [
      id,
      Math.max(GUIDE_ASSET_MIN_RELATIVE_SCALE, widthPx / maxWidthPx),
    ]),
  );
}

export function resolveGuideAssetInnerSize(
  frameSize: number,
  scaleFactor: number,
): number {
  return Math.round(frameSize * scaleFactor);
}
