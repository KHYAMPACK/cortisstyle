import type { ResolvedLookItem } from "@/types/look";
import type { Look } from "@/types/look";

export const COLLAGE_BACKDROP = "#c2c5c6";
export const COLLAGE_BACKDROP_GRADIENT =
  "linear-gradient(180deg, #c8cbcc 0%, #b5b8b9 100%)";

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
