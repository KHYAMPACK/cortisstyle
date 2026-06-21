import type { ResolvedLookItem } from "@/types/look";
import type { Look } from "@/types/look";

export const COLLAGE_BACKDROP = "#ffffff";
/** Matches app ice-floor — used in look modal panel where canvas blends with surroundings. */
export const COLLAGE_FLOOR_BACKDROP = "#f4f6f8";

export function canRenderCollageLayout(
  layout: Look["layout"],
  items: ResolvedLookItem[],
): boolean {
  if (layout !== "collage") return false;
  if (items.length === 0) return false;

  return items.every(
    (item) => Boolean(item.canvasImage && item.defaultCanvasPosition),
  );
}

export function getCanvasPosition(item: ResolvedLookItem) {
  return item.defaultCanvasPosition;
}
