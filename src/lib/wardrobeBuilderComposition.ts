import { committedCanvasLayouts } from "@/data/canvas-layouts";
import { getClothingItem } from "@/data/items";
import { buildInitialCanvasLayouts } from "@/lib/canvasLayout";
import { GUIDE_CANVAS_REFERENCE_WIDTH } from "@/lib/guideAssetScale";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { CanvasItemLayout } from "@/types/canvas-layout";

/** Matches the wardrobe builder canvas max width. */
export const WARDROBE_BUILDER_CANVAS_WIDTH = 480;

const WARDROBE_BUILDER_CANVAS_SCALE =
  WARDROBE_BUILDER_CANVAS_WIDTH / GUIDE_CANVAS_REFERENCE_WIDTH;

export interface WardrobeItemComposition {
  top: string;
  left: string;
  widthPx: number;
  zIndex: number;
  anchorCenter: boolean;
}

const CATEGORY_FALLBACK_POSITIONS: Record<
  MatrixCategoryFilter,
  { left: string; top: string; zIndex: number }
> = {
  EYEWEAR: { left: "25%", top: "20%", zIndex: 30 },
  HAT: { left: "50%", top: "15%", zIndex: 20 },
  ACC_HEAD: { left: "72%", top: "18%", zIndex: 20 },
  OUTER: { left: "50%", top: "32%", zIndex: 20 },
  TOP: { left: "50%", top: "38%", zIndex: 20 },
  BAG: { left: "72%", top: "48%", zIndex: 30 },
  SHOES: { left: "25%", top: "88%", zIndex: 30 },
  BOTTOM: { left: "50%", top: "68%", zIndex: 20 },
  WAIST: { left: "72%", top: "62%", zIndex: 20 },
};

function scaleWidth(widthPx: number): number {
  return Math.round(widthPx * WARDROBE_BUILDER_CANVAS_SCALE);
}

function resolveCategoryZIndex(
  category: MatrixCategoryFilter,
  layoutZIndex?: number,
): number {
  if (layoutZIndex !== undefined) return layoutZIndex;
  return CATEGORY_FALLBACK_POSITIONS[category].zIndex;
}

function mapLayoutToComposition(
  layout: CanvasItemLayout,
  category: MatrixCategoryFilter,
): WardrobeItemComposition {
  return {
    top: layout.top,
    left: layout.left,
    widthPx: scaleWidth(layout.widthPx ?? 160),
    zIndex: resolveCategoryZIndex(category, layout.zIndex),
    anchorCenter: false,
  };
}

function mapFallbackComposition(
  category: MatrixCategoryFilter,
  widthPx = 160,
): WardrobeItemComposition {
  const fallback = CATEGORY_FALLBACK_POSITIONS[category];

  return {
    top: fallback.top,
    left: fallback.left,
    widthPx: scaleWidth(widthPx),
    zIndex: fallback.zIndex,
    anchorCenter: true,
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
  category: MatrixCategoryFilter,
  sourceLookId?: string,
): WardrobeItemComposition {
  const committed = resolveCommittedLayout(itemId, sourceLookId);
  if (committed) {
    return mapLayoutToComposition(committed, category);
  }

  const item = getClothingItem(itemId);
  if (item?.defaultCanvasPosition) {
    const layouts = buildInitialCanvasLayouts(
      [item],
      WARDROBE_BUILDER_CANVAS_WIDTH,
    );
    const fallback = layouts[itemId];
    if (fallback) {
      return mapLayoutToComposition(fallback, category);
    }
  }

  return mapFallbackComposition(category);
}
