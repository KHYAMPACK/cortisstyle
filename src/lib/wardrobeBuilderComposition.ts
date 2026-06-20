import { committedCanvasLayouts } from "@/data/canvas-layouts";
import { getClothingItem } from "@/data/items";
import { buildInitialCanvasLayouts } from "@/lib/canvasLayout";
import type { CanvasItemLayout } from "@/types/canvas-layout";

/** Matches the wardrobe builder canvas max width. */
export const WARDROBE_BUILDER_CANVAS_WIDTH = 500;

export interface WardrobeItemComposition {
  widthPx: number;
}

function mapLayoutToComposition(layout: CanvasItemLayout): WardrobeItemComposition {
  return {
    widthPx: layout.widthPx ?? 160,
  };
}

function resolveCommittedLayout(
  itemId: string,
  sourceLookId?: string,
): CanvasItemLayout | null {
  if (sourceLookId && committedCanvasLayouts[sourceLookId]?.[itemId]) {
    return committedCanvasLayouts[sourceLookId][itemId];
  }

  for (const lookLayouts of Object.values(committedCanvasLayouts)) {
    if (lookLayouts[itemId]) {
      return lookLayouts[itemId];
    }
  }

  return null;
}

export function resolveWardrobeItemComposition(
  itemId: string,
  sourceLookId?: string,
): WardrobeItemComposition {
  const committed = resolveCommittedLayout(itemId, sourceLookId);
  if (committed) {
    return mapLayoutToComposition(committed);
  }

  const item = getClothingItem(itemId);
  if (item?.defaultCanvasPosition) {
    const layouts = buildInitialCanvasLayouts(
      [item],
      WARDROBE_BUILDER_CANVAS_WIDTH,
    );
    const fallback = layouts[itemId];
    if (fallback) {
      return mapLayoutToComposition(fallback);
    }
  }

  return { widthPx: 160 };
}
