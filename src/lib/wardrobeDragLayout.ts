import type { CanvasItemLayout } from "@/lib/canvasLayout";
import {
  resolveHitboxDimensions,
  resolveHitboxOffset,
} from "@/lib/canvasLayout";
import type { LayoutPositionOverride } from "@/types/wardrobe-builder";

export interface FreeDragPosition {
  top: string;
  left: string;
}

export function parseLayoutPercent(value: string): number {
  return Number.parseFloat(value.replace("%", "")) || 0;
}

/** Editor-calibrated collage anchors routinely sit below 0% (see look-04 jacket). */
export const DRAG_LAYOUT_PERCENT_MIN = -50;
export const DRAG_LAYOUT_PERCENT_MAX = 120;

/** Fraction of canvas width/height an item may extend past each edge. */
export const DRAG_CANVAS_OVERFLOW_RATIO =
  Math.abs(DRAG_LAYOUT_PERCENT_MIN) / 100;

export interface DragAnchorBounds {
  minTop: number;
  maxTop: number;
  minLeft: number;
  maxLeft: number;
}

function getVisualExtentPx(layout: CanvasItemLayout) {
  const offset = resolveHitboxOffset(layout);
  const hitbox = resolveHitboxDimensions(layout);
  const visualWidth = layout.widthPx ?? hitbox.widthPx;

  return {
    leftPx: Math.min(0, offset.leftPx),
    topPx: Math.min(0, offset.topPx),
    rightPx: Math.max(visualWidth, offset.leftPx + hitbox.widthPx),
    bottomPx: Math.max(
      visualWidth * 1.15,
      offset.topPx + hitbox.heightPx,
    ),
  };
}

export function getDragAnchorBounds(
  layout: CanvasItemLayout,
  container: { width: number; height: number },
): DragAnchorBounds {
  const extent = getVisualExtentPx(layout);
  const overflowX = container.width * DRAG_CANVAS_OVERFLOW_RATIO;
  const overflowY = container.height * DRAG_CANVAS_OVERFLOW_RATIO;

  return {
    minLeft: ((-overflowX - extent.leftPx) / container.width) * 100,
    maxLeft:
      ((container.width + overflowX - extent.rightPx) / container.width) * 100,
    minTop: ((-overflowY - extent.topPx) / container.height) * 100,
    maxTop:
      ((container.height + overflowY - extent.bottomPx) / container.height) *
      100,
  };
}

export function clampDragAnchorPosition(
  top: number,
  left: number,
  layout: CanvasItemLayout,
  container: { width: number; height: number },
): { top: number; left: number } {
  const bounds = getDragAnchorBounds(layout, container);

  return {
    top: Math.max(bounds.minTop, Math.min(bounds.maxTop, top)),
    left: Math.max(bounds.minLeft, Math.min(bounds.maxLeft, left)),
  };
}

export function formatLayoutPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(2)}%`;
}

export function formatDragLayoutPercent(value: number): string {
  return `${Math.max(
    DRAG_LAYOUT_PERCENT_MIN,
    Math.min(DRAG_LAYOUT_PERCENT_MAX, value),
  ).toFixed(2)}%`;
}

export function formatClampedDragLayoutPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function clampDragOverridePercent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(
    DRAG_LAYOUT_PERCENT_MIN,
    Math.min(DRAG_LAYOUT_PERCENT_MAX, value),
  );
}

export function normalizeLayoutOverrides(
  raw: unknown,
): Record<string, LayoutPositionOverride> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const next: Record<string, LayoutPositionOverride> = {};

  for (const [itemId, value] of Object.entries(raw)) {
    if (!itemId || !value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const top = clampDragOverridePercent((value as LayoutPositionOverride).top);
    const left = clampDragOverridePercent((value as LayoutPositionOverride).left);

    if (top === null || left === null) continue;

    next[itemId] = { top, left };
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

export function dragPositionsToLayoutOverrides(
  positions: Record<string, FreeDragPosition>,
): Record<string, LayoutPositionOverride> {
  const next: Record<string, LayoutPositionOverride> = {};

  for (const [itemId, position] of Object.entries(positions)) {
    next[itemId] = {
      top: parseLayoutPercent(position.top),
      left: parseLayoutPercent(position.left),
    };
  }

  return next;
}

export function layoutOverridesToDragPositions(
  overrides: Record<string, LayoutPositionOverride>,
): Record<string, FreeDragPosition> {
  const next: Record<string, FreeDragPosition> = {};

  for (const [itemId, position] of Object.entries(overrides)) {
    next[itemId] = {
      top: formatDragLayoutPercent(position.top),
      left: formatDragLayoutPercent(position.left),
    };
  }

  return next;
}

export function mergeFreeDragPositions(
  layouts: Record<string, CanvasItemLayout>,
  overrides: Record<string, FreeDragPosition>,
): Record<string, CanvasItemLayout> {
  if (Object.keys(overrides).length === 0) return layouts;

  const next: Record<string, CanvasItemLayout> = { ...layouts };

  for (const [itemId, position] of Object.entries(overrides)) {
    const layout = next[itemId];
    if (!layout) continue;

    next[itemId] = {
      ...layout,
      top: position.top,
      left: position.left,
    };
  }

  return next;
}

export function mergeLayoutOverrides(
  layouts: Record<string, CanvasItemLayout>,
  overrides: Record<string, LayoutPositionOverride> | undefined,
  applyOverrides: boolean,
): Record<string, CanvasItemLayout> {
  if (!applyOverrides || !overrides || Object.keys(overrides).length === 0) {
    return layouts;
  }

  return mergeFreeDragPositions(
    layouts,
    layoutOverridesToDragPositions(overrides),
  );
}
